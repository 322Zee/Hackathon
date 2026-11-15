/**
 * INTERSTELLAR CONTINUUM - Planetary Terrain Renderer
 * Multi-layer 2D/2.5D surface mesh, strata layering, crater shading,
 * and boulder geometry rendering using PixiJS v8 Graphics.
 */

import { Container, Graphics } from 'pixi.js';
import {
  GeneratedTerrainData,
  SurfaceVisualProperties,
  ExplorationBoundaries,
  EnvironmentQualityLevel,
  TerrainFeatureType,
} from '../PlanetaryEnvironmentTypes';

export class PlanetaryTerrainRenderer {
  public readonly container: Container;
  private terrainGfx: Graphics;
  private featuresGfx: Graphics;
  private rocksGfx: Graphics;

  constructor() {
    this.container = new Container();
    this.container.label = 'PlanetaryTerrainLayer';

    this.terrainGfx = new Graphics();
    this.featuresGfx = new Graphics();
    this.rocksGfx = new Graphics();

    this.container.addChild(this.terrainGfx);
    this.container.addChild(this.featuresGfx);
    this.container.addChild(this.rocksGfx);
  }

  /**
   * Renders the generated terrain geometry and surface details.
   */
  public render(
    terrainData: GeneratedTerrainData,
    visuals: SurfaceVisualProperties,
    boundaries: ExplorationBoundaries,
    quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH
  ): void {
    this.clear();

    const vertices = terrainData.vertices;
    if (vertices.length < 2) return;

    const firstVertex = vertices[0];
    const lastVertex = vertices[vertices.length - 1];
    if (!firstVertex || !lastVertex) return;

    const bottomY = boundaries.maxY + 200;

    // -------------------------------------------------------------------------
    // 1. GEOLOGICAL STRATA BASE FILL
    // -------------------------------------------------------------------------
    // Draw deep subterranean foundation
    const strataColors = visuals.strataColors && visuals.strataColors.length > 0
      ? visuals.strataColors
      : [visuals.primaryColor, visuals.secondaryColor, 0x111116];

    const strataBandHeight = Math.max(60, (bottomY - terrainData.elevationBounds.avgY) / strataColors.length);

    for (let s = 0; s < strataColors.length; s++) {
      const color = strataColors[s] ?? visuals.primaryColor;
      const offset = s * strataBandHeight;

      this.terrainGfx.beginPath();
      this.terrainGfx.moveTo(firstVertex.x, firstVertex.y + offset);

      for (let i = 1; i < vertices.length; i++) {
        const v = vertices[i];
        if (v) {
          this.terrainGfx.lineTo(v.x, v.y + offset);
        }
      }

      this.terrainGfx.lineTo(lastVertex.x, bottomY);
      this.terrainGfx.lineTo(firstVertex.x, bottomY);
      this.terrainGfx.closePath();
      this.terrainGfx.fill({ color, alpha: s === 0 ? 1.0 : 0.85 });
    }

    // -------------------------------------------------------------------------
    // 2. PRIMARY TOPSOIL & BEDROCK SURFACE LAYER
    // -------------------------------------------------------------------------
    this.terrainGfx.beginPath();
    this.terrainGfx.moveTo(firstVertex.x, firstVertex.y);

    for (let i = 1; i < vertices.length; i++) {
      const v = vertices[i];
      if (v) {
        this.terrainGfx.lineTo(v.x, v.y);
      }
    }

    this.terrainGfx.lineTo(lastVertex.x, bottomY);
    this.terrainGfx.lineTo(firstVertex.x, bottomY);
    this.terrainGfx.closePath();
    this.terrainGfx.fill({ color: visuals.primaryColor, alpha: 0.95 });

    // Surface crest line
    this.terrainGfx.beginPath();
    this.terrainGfx.moveTo(firstVertex.x, firstVertex.y);
    for (let i = 1; i < vertices.length; i++) {
      const v = vertices[i];
      if (v) {
        this.terrainGfx.lineTo(v.x, v.y);
      }
    }
    this.terrainGfx.stroke({
      color: visuals.secondaryColor,
      width: quality === EnvironmentQualityLevel.LOW ? 2 : 3,
    });

    // -------------------------------------------------------------------------
    // 3. IMPACT CRATERS DETAIL & RIM HIGHLIGHTS
    // -------------------------------------------------------------------------
    for (const crater of terrainData.craters) {
      // Crater inner shadow gradient bowl
      this.terrainGfx
        .ellipse(crater.centerX, terrainData.elevationBounds.avgY, crater.radius, crater.depth * 0.4)
        .fill({ color: visuals.craterFloorColor, alpha: 0.45 });

      // Raised rim lips
      this.terrainGfx
        .ellipse(crater.centerX - crater.radius * 0.9, terrainData.elevationBounds.avgY - crater.rimHeight * 0.5, 6, 3)
        .fill({ color: visuals.craterRimColor, alpha: 0.8 });
      this.terrainGfx
        .ellipse(crater.centerX + crater.radius * 0.9, terrainData.elevationBounds.avgY - crater.rimHeight * 0.5, 6, 3)
        .fill({ color: visuals.craterRimColor, alpha: 0.8 });
    }

    // -------------------------------------------------------------------------
    // 4. ICY CRACK LINEAE / SURFACE FRACTURES (Europa / Enceladus)
    // -------------------------------------------------------------------------
    if (visuals.icePatternOverlay && quality !== EnvironmentQualityLevel.LOW) {
      this.featuresGfx.stroke({ color: 0x3d201c, width: 2, alpha: 0.65 });
      for (let x = 100; x < boundaries.maxX - 100; x += 180) {
        const startY = terrainData.elevationBounds.avgY + 10;
        this.featuresGfx.moveTo(x, startY);
        this.featuresGfx.lineTo(x + 40, startY + 60);
        this.featuresGfx.lineTo(x + 25, startY + 110);
        this.featuresGfx.lineTo(x + 70, startY + 170);
      }
    }

    // -------------------------------------------------------------------------
    // 5. ENVIRONMENTAL LANDMARKS & FEATURES
    // -------------------------------------------------------------------------
    for (const feature of terrainData.features) {
      if (feature.type === TerrainFeatureType.LAKE_SHORELINE) {
        // Titan Methane Lake
        this.featuresGfx
          .rect(feature.x, feature.y + 15, feature.width, feature.height)
          .fill({ color: feature.properties['liquidColor'] ?? 0x14202b, alpha: 0.9 });
        // Specular sheen
        this.featuresGfx
          .rect(feature.x, feature.y + 15, feature.width, 4)
          .fill({ color: 0x3d5a73, alpha: 0.75 });
      } else if (feature.type === TerrainFeatureType.VOLCANIC_VENT) {
        // Venus Sulfur / Volcanic Vent
        this.featuresGfx
          .ellipse(feature.x, feature.y + 4, feature.width * 0.5, feature.height * 0.4)
          .fill({ color: feature.properties['magmaGlow'] ?? 0xdd4511, alpha: 0.85 });
        this.featuresGfx
          .circle(feature.x, feature.y, 8)
          .fill({ color: feature.properties['sulfurYellow'] ?? 0xebc934, alpha: 0.95 });
      } else if (feature.type === TerrainFeatureType.CRYO_GEYSER) {
        // Enceladus Cryo Geyser Mound
        this.featuresGfx
          .poly([
            feature.x - 20, feature.y + 10,
            feature.x, feature.y - 15,
            feature.x + 20, feature.y + 10,
          ])
          .fill({ color: 0xd6f4ff, alpha: 0.9 });
        this.featuresGfx
          .circle(feature.x, feature.y - 12, 5)
          .fill({ color: 0x64b8eb, alpha: 0.95 });
      }
    }

    // -------------------------------------------------------------------------
    // 6. SURFACE ROCKS & BOULDERS WITH DROP SHADOWS
    // -------------------------------------------------------------------------
    for (const rock of terrainData.rocks) {
      // Drop shadow on ground
      this.rocksGfx
        .ellipse(rock.x, rock.y + rock.height * 0.4, rock.width * 0.5, rock.height * 0.25)
        .fill({ color: visuals.shadowColor, alpha: visuals.shadowAlpha });

      // Rock body polygon
      const transformedVerts: number[] = [];
      for (const v of rock.vertices) {
        transformedVerts.push(rock.x + v.x, rock.y + v.y);
      }

      if (transformedVerts.length >= 6) {
        this.rocksGfx
          .poly(transformedVerts)
          .fill({ color: rock.color, alpha: 0.98 })
          .stroke({ color: visuals.secondaryColor, width: 1, alpha: 0.6 });
      }
    }
  }

  public clear(): void {
    this.terrainGfx.clear();
    this.featuresGfx.clear();
    this.rocksGfx.clear();
  }

  public destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
