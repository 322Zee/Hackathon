/**
 * INTERSTELLAR CONTINUUM - Terrain Section Assembler
 * Coordinates heightmap synthesis, crater carving, and feature embedding
 * into a continuous, reproducible 2D/2.5D world geometry dataset.
 */

import {
  TerrainConfiguration,
  SurfaceVisualProperties,
  TerrainVertex,
  GeneratedTerrainData,
} from '../PlanetaryEnvironmentTypes';
import { TerrainHeightmapGenerator } from './TerrainHeightmapGenerator';
import { TerrainCraterGenerator } from './TerrainCraterGenerator';
import { TerrainFeatureGenerator } from './TerrainFeatureGenerator';

export class TerrainSectionAssembler {
  private config: TerrainConfiguration;
  private heightmapGen: TerrainHeightmapGenerator;
  private craterGen: TerrainCraterGenerator;
  private featureGen: TerrainFeatureGenerator;

  constructor(config: TerrainConfiguration, visuals: SurfaceVisualProperties) {
    this.config = config;
    this.heightmapGen = new TerrainHeightmapGenerator(config);
    this.craterGen = new TerrainCraterGenerator(config);
    this.featureGen = new TerrainFeatureGenerator(config, visuals);
  }

  /**
   * Generates complete reproducible terrain data for a destination.
   */
  public generate(destinationId: string): GeneratedTerrainData {
    // 1. Generate craters first so they influence vertex elevation
    const craters = this.craterGen.generateCraters();

    // 2. Sample continuous elevation vertices
    const vertices: TerrainVertex[] = [];
    const step = Math.max(5, this.config.stepResolution);
    const sampleCount = Math.floor(this.config.totalWidth / step) + 1;

    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let sumY = 0;

    for (let i = 0; i < sampleCount; i++) {
      const x = Math.min(i * step, this.config.totalWidth);
      const baseHeight = this.heightmapGen.getElevationAt(x);
      const craterData = this.craterGen.getCraterDisplacementAt(x, craters);
      const finalY = baseHeight + craterData.displacement;

      minY = Math.min(minY, finalY);
      maxY = Math.max(maxY, finalY);
      sumY += finalY;

      // Approximate surface normal via central difference
      const deltaX = 4;
      const hLeft =
        this.heightmapGen.getElevationAt(x - deltaX) +
        this.craterGen.getCraterDisplacementAt(x - deltaX, craters).displacement;
      const hRight =
        this.heightmapGen.getElevationAt(x + deltaX) +
        this.craterGen.getCraterDisplacementAt(x + deltaX, craters).displacement;

      const slope = (hRight - hLeft) / (2 * deltaX);
      const len = Math.sqrt(slope * slope + 1);
      const nx = -slope / len;
      const ny = -1 / len;

      vertices.push({
        x,
        y: finalY,
        normalX: nx,
        normalY: ny,
        isCrater: !!craterData.craterId,
        craterId: craterData.craterId,
      });
    }

    const avgY = vertices.length > 0 ? sumY / vertices.length : this.config.baseElevation;

    // Helper lookup for elevation at arbitrary X using linear interpolation
    const getElevation = (targetX: number): number => {
      if (vertices.length === 0) return this.config.baseElevation;
      const clampedX = Math.max(0, Math.min(targetX, this.config.totalWidth));
      const idx = Math.floor(clampedX / step);
      const lastVertex = vertices[vertices.length - 1];
      if (idx >= vertices.length - 1 && lastVertex) {
        return lastVertex.y;
      }
      const v0 = vertices[idx];
      const v1 = vertices[idx + 1] ?? v0;
      if (!v0 || !v1) return this.config.baseElevation;
      const t = (clampedX - v0.x) / (v1.x - v0.x || 1);
      return v0.y + (v1.y - v0.y) * t;
    };

    // 3. Generate rocks and geological features
    const rocks = this.featureGen.generateRocks(getElevation);
    const features = this.featureGen.generateFeatures(destinationId, getElevation);

    return {
      destinationId,
      seed: this.config.seed,
      vertices,
      craters,
      rocks,
      features,
      elevationBounds: { minY, maxY, avgY },
    };
  }
}
