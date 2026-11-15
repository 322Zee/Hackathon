/**
 * INTERSTELLAR CONTINUUM - Planetary Environment Manager
 * Authoritative central singleton providing the modular integration contract:
 * environment loading, unloading, procedural terrain synthesis, POI discovery,
 * quality management, and domain event dispatch.
 */

import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import {
  PlanetaryEnvironmentDefinition,
  GeneratedTerrainData,
  TerrainConfiguration,
  PointOfInterest,
  SpawnLocation,
  PlanetaryEnvironmentStatus,
  EnvironmentQualityLevel,
  EnvironmentLoadOptions,
} from './PlanetaryEnvironmentTypes';
import {
  PLANETARY_ENVIRONMENT_EVENTS,
} from './PlanetaryEnvironmentEvents';
import { PlanetaryEnvironmentEventBus } from './PlanetaryEnvironmentEventBus';
import { PLANETARY_ENVIRONMENT_PROFILES } from './data/PlanetaryEnvironmentProfiles';
import { TerrainSectionAssembler } from './terrain/TerrainSectionAssembler';
import { PlanetaryExplorationScene } from './scenes/PlanetaryExplorationScene';

export interface PlanetaryEnvironmentInstance {
  readonly definition: PlanetaryEnvironmentDefinition;
  readonly terrain: GeneratedTerrainData;
  readonly activeSpawnLocation: SpawnLocation;
  readonly scene?: PlanetaryExplorationScene;
}

export class PlanetaryEnvironmentManager {
  private static instance?: PlanetaryEnvironmentManager;

  private eventBus: PlanetaryEnvironmentEventBus;
  private coreEventBus?: EventBus;

  private registry: Map<string, PlanetaryEnvironmentDefinition> = new Map();
  private activeInstance?: PlanetaryEnvironmentInstance;
  private currentQuality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
    this.eventBus = new PlanetaryEnvironmentEventBus(coreEventBus);
    this.initializeProfiles();
  }

  public static getInstance(coreEventBus?: EventBus): PlanetaryEnvironmentManager {
    if (!PlanetaryEnvironmentManager.instance) {
      PlanetaryEnvironmentManager.instance = new PlanetaryEnvironmentManager(coreEventBus);
    } else if (coreEventBus && !PlanetaryEnvironmentManager.instance.coreEventBus) {
      PlanetaryEnvironmentManager.instance.setCoreEventBus(coreEventBus);
    }
    return PlanetaryEnvironmentManager.instance;
  }

  public static resetInstance(): void {
    if (PlanetaryEnvironmentManager.instance) {
      PlanetaryEnvironmentManager.instance.reset();
      PlanetaryEnvironmentManager.instance = undefined;
    }
  }

  public setCoreEventBus(bus: EventBus): void {
    this.coreEventBus = bus;
    this.eventBus.setCoreEventBus(bus);
  }

  public getEventBus(): PlanetaryEnvironmentEventBus {
    return this.eventBus;
  }

  public reset(): void {
    if (this.activeInstance?.scene) {
      this.activeInstance.scene.cleanup();
    }
    this.activeInstance = undefined;
    this.initializeProfiles();
  }

  private initializeProfiles(): void {
    this.registry.clear();
    for (const [id, profile] of Object.entries(PLANETARY_ENVIRONMENT_PROFILES)) {
      // Deep clone to prevent accidental reference mutation
      this.registry.set(id, JSON.parse(JSON.stringify(profile)));
    }
    Logger.info(
      'PLANETARY_ENV_MANAGER',
      `Planetary Environment Manager initialized with ${this.registry.size} authored destination profiles.`
    );
  }

  /**
   * Registers a new or custom environment definition dynamically without engine rewrites.
   */
  public registerEnvironmentDefinition(definition: PlanetaryEnvironmentDefinition): void {
    if (!definition.destinationId || !definition.destinationName) {
      throw new Error('Invalid environment definition: destinationId and destinationName are required.');
    }
    this.registry.set(definition.destinationId, JSON.parse(JSON.stringify(definition)));
    Logger.info(
      'PLANETARY_ENV_MANAGER',
      `Registered custom environment definition: ${definition.destinationName} (${definition.destinationId})`
    );
  }

  /**
   * Returns the environment definition for a given destination identifier.
   */
  public getEnvironmentDefinition(destinationId: string): PlanetaryEnvironmentDefinition | undefined {
    return this.registry.get(destinationId);
  }

  /**
   * Returns terrain configuration for a destination.
   */
  public getTerrainConfiguration(destinationId: string): TerrainConfiguration | undefined {
    const def = this.registry.get(destinationId);
    return def ? def.terrainConfig : undefined;
  }

  /**
   * Generates reproducible terrain data using the supplied configuration.
   */
  public generateEnvironment(
    config: TerrainConfiguration,
    destinationId: string = 'CUSTOM_GENERATED'
  ): GeneratedTerrainData {
    const startTime = Date.now();

    // Use default surface visuals if available
    const def = this.registry.get(destinationId);
    const visuals = def
      ? def.surfaceVisuals
      : {
          primaryColor: 0x666666,
          secondaryColor: 0x888888,
          strataColors: [0x666666, 0x444444, 0x222222],
          rockColors: [0x555555],
          craterRimColor: 0x999999,
          craterFloorColor: 0x111111,
          regolithTextureStyle: 'ROCKY' as const,
          shadowColor: 0x000000,
          shadowAlpha: 0.8,
        };

    const assembler = new TerrainSectionAssembler(config, visuals);
    const terrainData = assembler.generate(destinationId);

    const durationMs = Date.now() - startTime;

    this.eventBus.emit(PLANETARY_ENVIRONMENT_EVENTS.GENERATION_COMPLETED, {
      destinationId,
      seed: config.seed,
      verticesCount: terrainData.vertices.length,
      cratersCount: terrainData.craters.length,
      rocksCount: terrainData.rocks.length,
      poiCount: def ? def.pointsOfInterest.length : 0,
      durationMs,
      timestamp: Date.now(),
    });

    return terrainData;
  }

  /**
   * Loads and prepares an environment for exploration.
   */
  public async loadEnvironment(
    destinationId: string,
    options: EnvironmentLoadOptions = {}
  ): Promise<PlanetaryEnvironmentInstance> {
    const definition = this.registry.get(destinationId);
    if (!definition) {
      throw new Error(`Cannot load environment: destinationId "${destinationId}" is not registered.`);
    }

    // 1. Dispatch loading started event
    this.eventBus.emit(PLANETARY_ENVIRONMENT_EVENTS.LOADING_STARTED, {
      destinationId,
      timestamp: Date.now(),
    });

    // 2. Unload current active environment if present
    if (this.activeInstance) {
      await this.unloadEnvironment();
    }

    const effectiveQuality = options.qualityOverride ?? this.currentQuality;

    // 3. Prepare terrain configuration with optional seed override
    let terrainConfig = definition.terrainConfig;
    if (options.seedOverride !== undefined) {
      terrainConfig = { ...terrainConfig, seed: options.seedOverride };
    }

    // 4. Synthesize reproducible terrain
    const terrain = this.generateEnvironment(terrainConfig, destinationId);

    // 5. Resolve spawn location
    let spawn = definition.spawnLocations.find((s) => s.id === options.spawnLocationId);
    if (!spawn) {
      spawn = definition.spawnLocations.find((s) => s.isDefault) || definition.spawnLocations[0];
    }
    if (!spawn) {
      // Default fallback spawn
      spawn = {
        id: `spawn_${destinationId}_default`,
        name: 'Default Orbital / Surface Spawn',
        description: 'Automated fallback spawn coordinates.',
        x: definition.boundaries.maxX * 0.2,
        y: terrainConfig.baseElevation - 100,
        isDefault: true,
        isSafe: true,
        landingDifficulty: 1,
        tag: 'DEFAULT_SPAWN',
      };
    }

    // 6. Instantiate exploration scene
    const scene = new PlanetaryExplorationScene();
    scene.onPOIDiscovered = (poi: PointOfInterest) => {
      this.eventBus.emit(PLANETARY_ENVIRONMENT_EVENTS.POI_DISCOVERED, {
        poiId: poi.id,
        destinationId: poi.destinationId,
        poi,
        timestamp: Date.now(),
      });
    };

    scene.setupEnvironment(definition, terrain, spawn.id, effectiveQuality);

    this.activeInstance = {
      definition,
      terrain,
      activeSpawnLocation: spawn,
      scene,
    };

    // 7. Dispatch environment loaded event
    this.eventBus.emit(PLANETARY_ENVIRONMENT_EVENTS.LOADED, {
      destinationId,
      environment: definition,
      terrain,
      timestamp: Date.now(),
    });

    Logger.info(
      'PLANETARY_ENV_MANAGER',
      `Environment loaded successfully: ${definition.destinationName} (${destinationId}) at spawn ${spawn.name}.`
    );

    return this.activeInstance;
  }

  /**
   * Unloads and disposes current active exploration environment.
   */
  public async unloadEnvironment(): Promise<void> {
    if (!this.activeInstance) return;

    const destinationId = this.activeInstance.definition.destinationId;

    if (this.activeInstance.scene) {
      await this.activeInstance.scene.cleanup();
    }

    this.activeInstance = undefined;

    this.eventBus.emit(PLANETARY_ENVIRONMENT_EVENTS.UNLOADED, {
      destinationId,
      timestamp: Date.now(),
    });

    Logger.info('PLANETARY_ENV_MANAGER', `Environment unloaded: ${destinationId}`);
  }

  /**
   * Returns points of interest, optionally filtered by destination.
   */
  public getPointsOfInterest(destinationId?: string): PointOfInterest[] {
    if (this.activeInstance?.scene) {
      return this.activeInstance.scene.poiRegistry.getPOIsForDestination(destinationId);
    }

    if (destinationId) {
      const def = this.registry.get(destinationId);
      return def ? [...def.pointsOfInterest] : [];
    }

    const all: PointOfInterest[] = [];
    for (const def of this.registry.values()) {
      all.push(...def.pointsOfInterest);
    }
    return all;
  }

  /**
   * Returns spawn locations, optionally filtered by destination.
   */
  public getSpawnLocations(destinationId?: string): SpawnLocation[] {
    if (destinationId) {
      const def = this.registry.get(destinationId);
      return def ? [...def.spawnLocations] : [];
    }

    if (this.activeInstance) {
      return [...this.activeInstance.definition.spawnLocations];
    }

    const all: SpawnLocation[] = [];
    for (const def of this.registry.values()) {
      all.push(...def.spawnLocations);
    }
    return all;
  }

  /**
   * Sets the visual quality setting for all environments and updates active scene.
   */
  public setEnvironmentQuality(quality: EnvironmentQualityLevel): void {
    if (this.currentQuality === quality) return;

    const previousQuality = this.currentQuality;
    this.currentQuality = quality;

    if (this.activeInstance && this.activeInstance.scene) {
      this.activeInstance.scene.setupEnvironment(
        this.activeInstance.definition,
        this.activeInstance.terrain,
        this.activeInstance.activeSpawnLocation.id,
        this.currentQuality
      );
    }

    this.eventBus.emit(PLANETARY_ENVIRONMENT_EVENTS.QUALITY_CHANGED, {
      previousQuality,
      newQuality: quality,
      timestamp: Date.now(),
    });

    Logger.info('PLANETARY_ENV_MANAGER', `Environment quality preset updated: ${previousQuality} -> ${quality}`);
  }

  /**
   * Returns authoritative status of the active planetary environment.
   */
  public getEnvironmentStatus(): PlanetaryEnvironmentStatus {
    if (!this.activeInstance) {
      return {
        isLoaded: false,
        quality: this.currentQuality,
        isWalkableSurface: false,
        activeParticlesCount: 0,
        discoveredPOIsCount: 0,
        totalPOIsCount: 0,
        worldDimensions: { width: 0, height: 0 },
        cameraPosition: { x: 0, y: 0 },
      };
    }

    const def = this.activeInstance.definition;
    const scene = this.activeInstance.scene;
    const stats = scene ? scene.poiRegistry.getStats(def.destinationId) : { total: def.pointsOfInterest.length, discovered: 0 };
    const activeParticles = scene ? scene.particleSystem.getActiveParticleCount() : 0;

    return {
      isLoaded: true,
      currentDestinationId: def.destinationId,
      currentEnvironmentName: def.destinationName,
      presentationMode: def.presentationMode,
      isWalkableSurface: def.isWalkableSurface,
      quality: this.currentQuality,
      activeParticlesCount: activeParticles,
      discoveredPOIsCount: stats.discovered,
      totalPOIsCount: stats.total,
      worldDimensions: {
        width: def.boundaries.maxX - def.boundaries.minX,
        height: def.boundaries.maxY - def.boundaries.minY,
      },
      cameraPosition: {
        x: scene ? scene.cameraX : 0,
        y: scene ? scene.cameraY : 0,
      },
    };
  }

  /**
   * Returns the current active environment instance.
   */
  public getActiveInstance(): PlanetaryEnvironmentInstance | undefined {
    return this.activeInstance;
  }
}

