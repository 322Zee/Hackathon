/**
 * INTERSTELLAR CONTINUUM - Procedural Terrain Feature & Rock Generator
 * Synthesizes rock polygons, crevasses, fissures, hydrothermal vents, and lake shorelines.
 */

import { SeededRandom } from './SeededRandom';
import {
  TerrainConfiguration,
  TerrainRock,
  TerrainFeature,
  TerrainFeatureType,
  SurfaceVisualProperties,
} from '../PlanetaryEnvironmentTypes';

export class TerrainFeatureGenerator {
  private rng: SeededRandom;
  private config: TerrainConfiguration;
  private visuals: SurfaceVisualProperties;

  constructor(config: TerrainConfiguration, visuals: SurfaceVisualProperties) {
    this.config = config;
    this.visuals = visuals;
    this.rng = new SeededRandom(config.seed + 2039);
  }

  /**
   * Generates procedural polygonal rocks placed along the terrain surface.
   */
  public generateRocks(
    getElevation: (x: number) => number
  ): TerrainRock[] {
    const rocks: TerrainRock[] = [];
    if (this.config.rockFrequency <= 0) {
      return rocks;
    }

    const step = 80;
    const count = Math.floor(this.config.totalWidth / step);

    for (let i = 0; i < count; i++) {
      if (this.rng.chance(this.config.rockFrequency)) {
        const x = i * step + this.rng.nextFloat(5, step - 5);
        if (x < 60 || x > this.config.totalWidth - 60) continue;

        const surfaceY = getElevation(x);
        const width = this.rng.nextFloat(this.config.minRockSize, this.config.maxRockSize);
        const height = width * this.rng.nextFloat(0.5, 0.9);
        const rotation = this.rng.nextFloat(-0.25, 0.25);

        // Generate polygonal vertices around rock center
        const vertexCount = this.rng.nextInt(5, 8);
        const vertices: { x: number; y: number }[] = [];
        for (let v = 0; v < vertexCount; v++) {
          const angle = (v / vertexCount) * Math.PI * 2;
          const radiusJitter = this.rng.nextFloat(0.7, 1.25);
          const rx = Math.cos(angle) * (width * 0.5) * radiusJitter;
          const ry = Math.sin(angle) * (height * 0.5) * radiusJitter;
          vertices.push({ x: rx, y: ry });
        }

        const rockColor =
          this.visuals.rockColors.length > 0
            ? this.rng.pick(this.visuals.rockColors)
            : this.visuals.secondaryColor;

        rocks.push({
          id: `rock_${i}_${Math.round(x)}`,
          x,
          // Embed bottom half slightly into surface
          y: surfaceY + height * 0.2,
          width,
          height,
          rotation,
          vertices,
          color: rockColor,
        });
      }
    }

    return rocks;
  }

  /**
   * Generates destination-specific environmental landmarks & geological features.
   */
  public generateFeatures(
    destinationId: string,
    getElevation: (x: number) => number
  ): TerrainFeature[] {
    const features: TerrainFeature[] = [];

    // Europa / Enceladus: Cryogenic ice crevasses and active geysers
    if (destinationId.includes('EUROPA') || destinationId.includes('ENCELADUS')) {
      const crevasseCount = this.rng.nextInt(3, 6);
      for (let c = 0; c < crevasseCount; c++) {
        const fx = this.rng.nextFloat(300, this.config.totalWidth - 300);
        const fy = getElevation(fx);
        features.push({
          id: `crevasse_${c}`,
          type: TerrainFeatureType.CREVASSE,
          x: fx,
          y: fy,
          width: this.rng.nextFloat(80, 220),
          height: this.rng.nextFloat(30, 70),
          properties: {
            iceColor: 0x4898c8,
            fissureDepth: 45,
            glowIntensity: 0.8,
          },
        });
      }

      if (destinationId.includes('ENCELADUS')) {
        const geyserCount = this.rng.nextInt(2, 4);
        for (let g = 0; g < geyserCount; g++) {
          const gx = this.rng.nextFloat(500, this.config.totalWidth - 500);
          const gy = getElevation(gx);
          features.push({
            id: `cryo_geyser_${g}`,
            type: TerrainFeatureType.CRYO_GEYSER,
            x: gx,
            y: gy,
            width: 60,
            height: 120,
            properties: {
              plumeHeight: 350,
              particleEmissionRate: 40,
              crystalTint: 0xdff8ff,
            },
          });
        }
      }
    }

    // Titan: Hydrocarbon methane/ethane lakes and shorelines
    if (destinationId.includes('TITAN')) {
      const lakeX = this.config.totalWidth * 0.65;
      const lakeY = getElevation(lakeX);
      features.push({
        id: `methane_lake_alpha`,
        type: TerrainFeatureType.LAKE_SHORELINE,
        x: lakeX,
        y: lakeY,
        width: 800,
        height: 60,
        properties: {
          liquidColor: this.visuals.liquidLakeColor ?? 0x18242f,
          depth: 40,
          reflectivity: this.visuals.liquidReflectivity ?? 0.85,
        },
      });
    }

    // Venus: Volcanic sulfur vents & lava channels
    if (destinationId.includes('VENUS')) {
      const ventCount = this.rng.nextInt(3, 5);
      for (let v = 0; v < ventCount; v++) {
        const vx = this.rng.nextFloat(400, this.config.totalWidth - 400);
        const vy = getElevation(vx);
        features.push({
          id: `volcanic_vent_${v}`,
          type: TerrainFeatureType.VOLCANIC_VENT,
          x: vx,
          y: vy,
          width: 75,
          height: 35,
          properties: {
            sulfurYellow: 0xd6b432,
            magmaGlow: 0xff4b10,
            fumeIntensity: 0.9,
          },
        });
      }
    }

    return features;
  }
}
