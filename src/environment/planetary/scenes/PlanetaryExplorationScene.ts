/**
 * INTERSTELLAR CONTINUUM - Planetary Exploration Scene
 * Authoritative 2D/2.5D exploration scene integrating parallax background,
 * procedural terrain mesh, dynamic lighting, atmospheric scattering,
 * particle simulation, POI spatial discovery, and telemetry HUD.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from '../../../scenes/BaseScene';
import { SceneId } from '../../../scenes/SceneId';
import { ViewportTransform } from '../../../rendering/VirtualResolution';
import {
  PlanetaryEnvironmentDefinition,
  GeneratedTerrainData,
  EnvironmentQualityLevel,
  PointOfInterest,
  POIDiscoveryStatus,
} from '../PlanetaryEnvironmentTypes';
import { ParallaxBackgroundSystem } from '../visual/ParallaxBackgroundSystem';
import { PlanetaryTerrainRenderer } from '../terrain/PlanetaryTerrainRenderer';
import { DynamicAtmosphereSystem } from '../visual/DynamicAtmosphereSystem';
import { PlanetaryLightingSystem } from '../visual/PlanetaryLightingSystem';
import { EnvironmentalParticleSystem } from '../visual/EnvironmentalParticleSystem';
import { PointOfInterestRegistry } from '../interactions/PointOfInterestRegistry';

export class PlanetaryExplorationScene extends BaseScene {
  public readonly id = SceneId.PLANETARY_ENVIRONMENTS;

  // Scene Subsystems
  public readonly backgroundSystem: ParallaxBackgroundSystem;
  public readonly terrainRenderer: PlanetaryTerrainRenderer;
  public readonly atmosphereSystem: DynamicAtmosphereSystem;
  public readonly lightingSystem: PlanetaryLightingSystem;
  public readonly particleSystem: EnvironmentalParticleSystem;
  public readonly poiRegistry: PointOfInterestRegistry;

  // Containers
  private worldContainer: Container;
  private poiContainer: Container;
  private hudContainer: Container;

  // HUD Elements
  private hudBg?: Graphics;
  private hudTitleText?: Text;
  private hudTelemetryText?: Text;
  private hudHazardText?: Text;

  // Active Environment State
  public currentDefinition?: PlanetaryEnvironmentDefinition;
  public currentTerrain?: GeneratedTerrainData;
  public quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH;

  // Camera State
  public cameraX: number = 800;
  public cameraY: number = 1200;
  private targetCameraX: number = 800;
  private targetCameraY: number = 1200;

  // Discovery Callback Hook
  public onPOIDiscovered?: (poi: PointOfInterest) => void;

  constructor() {
    super();

    this.backgroundSystem = new ParallaxBackgroundSystem();
    this.terrainRenderer = new PlanetaryTerrainRenderer();
    this.atmosphereSystem = new DynamicAtmosphereSystem();
    this.lightingSystem = new PlanetaryLightingSystem();
    this.particleSystem = new EnvironmentalParticleSystem();
    this.poiRegistry = new PointOfInterestRegistry();

    this.worldContainer = new Container();
    this.worldContainer.label = 'PlanetaryWorldContainer';

    this.poiContainer = new Container();
    this.poiContainer.label = 'POIMarkersLayer';

    this.hudContainer = new Container();
    this.hudContainer.label = 'PlanetaryHUDLayer';
  }

  protected async onInitialize(): Promise<void> {
    // Scene root hierarchy
    this.container.addChild(this.backgroundSystem.container);
    this.worldContainer.addChild(this.terrainRenderer.container);
    this.worldContainer.addChild(this.poiContainer);
    this.worldContainer.addChild(this.particleSystem.container);
    this.worldContainer.addChild(this.lightingSystem.container);
    this.worldContainer.addChild(this.atmosphereSystem.container);
    this.container.addChild(this.worldContainer);
    this.container.addChild(this.hudContainer);

    this.buildHUD();
  }

  /**
   * Prepares and loads an authored environment definition and its terrain dataset.
   */
  public setupEnvironment(
    definition: PlanetaryEnvironmentDefinition,
    terrain: GeneratedTerrainData,
    spawnLocationId?: string,
    quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH
  ): void {
    this.currentDefinition = definition;
    this.currentTerrain = terrain;
    this.quality = quality;

    const w = definition.boundaries.maxX;
    const h = definition.boundaries.maxY;

    // 1. Initialize Parallax Background
    this.backgroundSystem.initialize(definition.backgroundLayers, w, h, quality);

    // 2. Render Terrain Mesh
    this.terrainRenderer.render(terrain, definition.surfaceVisuals, definition.boundaries, quality);

    // 3. Register & Render POIs
    this.poiRegistry.clear();
    this.poiRegistry.registerPOIs(definition.pointsOfInterest);
    this.renderPOIMarkers();

    // 4. Initialize Visual Atmospheric & Lighting Layers
    this.atmosphereSystem.initialize(definition.atmosphericEffects, w, h, quality);
    this.lightingSystem.initialize(definition.lightingConfig, w, h, quality);
    this.particleSystem.initialize(definition.weatherConfig, w, h, quality);

    // 5. Position Camera at Selected or Default Spawn Location
    let spawn = definition.spawnLocations.find((s) => s.id === spawnLocationId);
    if (!spawn) {
      spawn = definition.spawnLocations.find((s) => s.isDefault) || definition.spawnLocations[0];
    }

    if (spawn) {
      this.cameraX = spawn.x;
      this.cameraY = spawn.y - 200;
      this.targetCameraX = this.cameraX;
      this.targetCameraY = this.cameraY;
    } else {
      this.cameraX = w * 0.2;
      this.cameraY = definition.terrainConfig.baseElevation - 200;
      this.targetCameraX = this.cameraX;
      this.targetCameraY = this.cameraY;
    }

    this.updateCameraTransform();
    this.updateHUDText();
  }

  /**
   * Renders visual icons and discovery halos for all points of interest.
   */
  private renderPOIMarkers(): void {
    this.poiContainer.removeChildren();

    const pois = this.poiRegistry.getPOIsForDestination(this.currentDefinition?.destinationId);
    for (const poi of pois) {
      const marker = new Graphics();
      marker.label = `POI_${poi.id}`;

      // Beacon ring
      marker.circle(poi.position.x, poi.position.y, poi.radius * 0.4);
      marker.stroke({
        color: poi.discoveryStatus === POIDiscoveryStatus.UNDISCOVERED ? 0x00d9ff : 0xffdd44,
        width: 2,
        alpha: 0.75,
      });

      // Center diamond
      marker
        .poly([
          poi.position.x, poi.position.y - 12,
          poi.position.x + 10, poi.position.y,
          poi.position.x, poi.position.y + 12,
          poi.position.x - 10, poi.position.y,
        ])
        .fill({
          color: poi.discoveryStatus === POIDiscoveryStatus.UNDISCOVERED ? 0x00d9ff : 0xffdd44,
          alpha: 0.85,
        });

      this.poiContainer.addChild(marker);
    }
  }

  /**
   * Constructs the screen-space exploration telemetry HUD.
   */
  private buildHUD(): void {
    this.hudContainer.removeChildren();

    this.hudBg = new Graphics();
    this.hudBg.rect(20, 20, 480, 150);
    this.hudBg.fill({ color: 0x070c14, alpha: 0.82 });
    this.hudBg.stroke({ color: 0x1f3852, width: 2 });
    this.hudContainer.addChild(this.hudBg);

    const titleStyle = new TextStyle({
      fontFamily: 'Courier New, monospace',
      fontSize: 20,
      fontWeight: 'bold',
      fill: '#00e1ff',
      letterSpacing: 2,
    });
    this.hudTitleText = new Text({ text: 'PLANETARY EXPLORATION', style: titleStyle });
    this.hudTitleText.position.set(38, 32);
    this.hudContainer.addChild(this.hudTitleText);

    const bodyStyle = new TextStyle({
      fontFamily: 'Courier New, monospace',
      fontSize: 13,
      fill: '#8ec4e8',
      lineHeight: 18,
    });
    this.hudTelemetryText = new Text({ text: 'TELEMETRY INITIALIZING...', style: bodyStyle });
    this.hudTelemetryText.position.set(38, 64);
    this.hudContainer.addChild(this.hudTelemetryText);

    const hazardStyle = new TextStyle({
      fontFamily: 'Courier New, monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: '#ff9d00',
    });
    this.hudHazardText = new Text({ text: '', style: hazardStyle });
    this.hudHazardText.position.set(38, 140);
    this.hudContainer.addChild(this.hudHazardText);
  }

  /**
   * Refreshes dynamic telemetry values in the HUD.
   */
  private updateHUDText(): void {
    if (!this.currentDefinition || !this.hudTitleText || !this.hudTelemetryText || !this.hudHazardText) {
      return;
    }

    const def = this.currentDefinition;
    const stats = this.poiRegistry.getStats(def.destinationId);

    this.hudTitleText.text = `${def.destinationName.toUpperCase()} // ${def.presentationMode}`;

    const pressure = def.atmosphericEffects.atmosphericPressureAtm;
    const pressText = pressure > 0 ? `${pressure.toFixed(3)} ATM` : 'HARD VACUUM (0.000 ATM)';

    this.hudTelemetryText.text = [
      `POS: X ${Math.round(this.cameraX)}m | ELEV: Y ${Math.round(this.cameraY)}m`,
      `ATMO: ${pressText}`,
      `POIs DISCOVERED: ${stats.discovered} / ${stats.total}`,
      `SURFACE: ${def.isWalkableSurface ? 'SOLID / WALKABLE' : 'NON-WALKABLE (ORBITAL/PROBE)'}`,
    ].join('\n');

    this.hudHazardText.text = `HAZARD LEVEL: [${def.difficultyRatings.overallHazardLevel}] | TEMP DIFF: ${def.difficultyRatings.temperatureDifficulty}/5`;
  }

  protected onActivate(_payload?: any): void {
    if (_payload && _payload.definition && _payload.terrain) {
      this.setupEnvironment(
        _payload.definition,
        _payload.terrain,
        _payload.spawnLocationId,
        _payload.quality
      );
    }
  }

  protected onDeactivate(): void {
    // Stop systems
  }

  protected onUpdate(deltaSeconds: number): void {
    // 1. Smooth camera damping towards target
    const damping = Math.min(1.0, deltaSeconds * 8);
    this.cameraX += (this.targetCameraX - this.cameraX) * damping;
    this.cameraY += (this.targetCameraY - this.cameraY) * damping;

    // 2. Clamp camera to world boundaries
    if (this.currentDefinition) {
      const b = this.currentDefinition.boundaries;
      this.cameraX = Math.max(b.minX + 400, Math.min(this.cameraX, b.maxX - 400));
      this.cameraY = Math.max(b.minY + 200, Math.min(this.cameraY, b.maxY - 200));
    }

    this.updateCameraTransform();

    // 3. Update Visual Subsystems
    this.atmosphereSystem.update(deltaSeconds);
    this.particleSystem.update(deltaSeconds);

    if (this.currentDefinition) {
      this.lightingSystem.update(
        deltaSeconds,
        this.currentDefinition.boundaries.maxX,
        this.currentDefinition.boundaries.maxY
      );
    }

    // 4. Proximity Check for Point of Interest Discovery
    this.checkPOIDiscovery();

    // 5. Update HUD telemetry
    this.updateHUDText();
  }

  /**
   * Evaluates camera proximity to all undiscovered POIs.
   */
  private checkPOIDiscovery(): void {
    if (!this.currentDefinition) return;

    const nearbyPOIs = this.poiRegistry.findPOIsInRadius(
      this.cameraX,
      this.cameraY,
      140,
      this.currentDefinition.destinationId
    );

    for (const poi of nearbyPOIs) {
      const result = this.poiRegistry.discoverPOI(poi.id);
      if (result.newlyDiscovered) {
        this.renderPOIMarkers();
        if (this.onPOIDiscovered) {
          this.onPOIDiscovered(poi);
        }
      }
    }
  }

  /**
   * Applies camera position to world layers and parallax offsets.
   */
  private updateCameraTransform(): void {
    const halfScreenW = 1920 / 2;
    const halfScreenH = 1080 / 2;

    // Offset world container in opposite direction of camera
    this.worldContainer.x = halfScreenW - this.cameraX;
    this.worldContainer.y = halfScreenH - this.cameraY;

    // Update parallax background offset
    this.backgroundSystem.updateCamera(this.cameraX, this.cameraY);
  }

  /**
   * Panning controls allowing camera translation across exploration landscape.
   */
  public panCamera(deltaX: number, deltaY: number): void {
    this.targetCameraX += deltaX;
    this.targetCameraY += deltaY;
  }

  public setCameraTarget(x: number, y: number): void {
    this.targetCameraX = x;
    this.targetCameraY = y;
  }

  protected handleResize(_transform: ViewportTransform): { width: number; height: number } {
    return { width: 1920, height: 1080 };
  }

  protected onCleanup(): void {
    this.backgroundSystem.cleanup();
    this.terrainRenderer.destroy();
    this.atmosphereSystem.cleanup();
    this.lightingSystem.cleanup();
    this.particleSystem.cleanup();
    this.poiRegistry.clear();
    this.currentDefinition = undefined;
    this.currentTerrain = undefined;
  }
}
