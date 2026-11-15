import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { DestinationId, EnvironmentalClassification } from '../../src/destinations/DestinationTypes';
import {
  PlanetaryEnvironmentManager,
  EnvironmentQualityLevel,
  EnvironmentPresentationMode,
  HazardSeverity,
  PLANETARY_ENVIRONMENT_EVENTS,
  PlanetaryEnvironmentDefinition,
} from '../../src/environment/planetary';

describe('PlanetaryEnvironmentManager', () => {
  let manager: PlanetaryEnvironmentManager;
  let coreEventBus: EventBus;

  beforeEach(() => {
    PlanetaryEnvironmentManager.resetInstance();
    coreEventBus = new EventBus();
    manager = PlanetaryEnvironmentManager.getInstance(coreEventBus);
  });

  afterEach(async () => {
    await manager.unloadEnvironment();
    PlanetaryEnvironmentManager.resetInstance();
  });

  it('initializes as a singleton and provides authored destination profiles', () => {
    expect(manager).toBeDefined();
    const sameInstance = PlanetaryEnvironmentManager.getInstance();
    expect(sameInstance).toBe(manager);

    const moonDef = manager.getEnvironmentDefinition(DestinationId.MOON);
    expect(moonDef).toBeDefined();
    expect(moonDef?.destinationName).toBe('The Moon');
    expect(moonDef?.isWalkableSurface).toBe(true);

    const marsDef = manager.getEnvironmentDefinition(DestinationId.MARS);
    expect(marsDef).toBeDefined();
    expect(marsDef?.destinationName).toBe('Mars');
  });

  it('loads and unloads a valid planetary environment with lifecycle events', async () => {
    const loadingStartedSpy = vi.fn();
    const loadedSpy = vi.fn();
    const unloadedSpy = vi.fn();

    manager.getEventBus().on(PLANETARY_ENVIRONMENT_EVENTS.LOADING_STARTED, loadingStartedSpy);
    manager.getEventBus().on(PLANETARY_ENVIRONMENT_EVENTS.LOADED, loadedSpy);
    manager.getEventBus().on(PLANETARY_ENVIRONMENT_EVENTS.UNLOADED, unloadedSpy);

    const instance = await manager.loadEnvironment(DestinationId.MOON);
    expect(instance).toBeDefined();
    expect(instance.definition.destinationId).toBe(DestinationId.MOON);
    expect(instance.terrain.vertices.length).toBeGreaterThan(100);
    expect(instance.activeSpawnLocation).toBeDefined();
    expect(loadingStartedSpy).toHaveBeenCalledTimes(1);
    expect(loadedSpy).toHaveBeenCalledTimes(1);

    const statusBefore = manager.getEnvironmentStatus();
    expect(statusBefore.isLoaded).toBe(true);
    expect(statusBefore.currentDestinationId).toBe(DestinationId.MOON);
    expect(statusBefore.isWalkableSurface).toBe(true);

    await manager.unloadEnvironment();
    expect(unloadedSpy).toHaveBeenCalledTimes(1);

    const statusAfter = manager.getEnvironmentStatus();
    expect(statusAfter.isLoaded).toBe(false);
    expect(statusAfter.currentDestinationId).toBeUndefined();
  });

  it('throws an informative error when attempting to load an unregistered destination', async () => {
    await expect(manager.loadEnvironment('DEST_UNKNOWN_EXOPLANET')).rejects.toThrow(
      'destinationId "DEST_UNKNOWN_EXOPLANET" is not registered'
    );
  });

  it('allows dynamic registration of custom environment definitions', async () => {
    const customDef: PlanetaryEnvironmentDefinition = {
      id: 'ENV_CUSTOM_PLUTO',
      destinationId: 'DEST_PLUTO',
      destinationName: 'Pluto',
      classification: EnvironmentalClassification.ICY_MOON,
      presentationMode: EnvironmentPresentationMode.WALKABLE_SURFACE,
      isWalkableSurface: true,
      difficultyRatings: {
        temperatureDifficulty: 5,
        terrainDifficulty: 3,
        visibilityDifficulty: 1,
        atmosphericDifficulty: 1,
        surfaceAccessibility: 3,
        overallHazardLevel: HazardSeverity.HIGH,
        hazardNotes: ['Cryogenic nitrogen ice sheets'],
        recommendedEquipment: ['Cryo Treads'],
      },
      terrainConfig: {
        seed: 20150714,
        baseElevation: 1350,
        heightVariation: 120,
        roughness: 0.35,
        octaves: 4,
        persistence: 0.45,
        lacunarity: 2.0,
        segmentWidth: 600,
        totalWidth: 4800,
        craterFrequency: 0.2,
        minCraterRadius: 30,
        maxCraterRadius: 90,
        rockFrequency: 0.3,
        minRockSize: 8,
        maxRockSize: 25,
        surfaceFriction: 0.4,
        stepResolution: 20,
      },
      surfaceVisuals: {
        primaryColor: 0xe6d5c3,
        secondaryColor: 0xc49b79,
        strataColors: [0xe6d5c3, 0xb88e6e],
        rockColors: [0x8a6042],
        craterRimColor: 0xffffff,
        craterFloorColor: 0x5a3f2c,
        regolithTextureStyle: 'ICY',
        shadowColor: 0x140e09,
        shadowAlpha: 0.8,
      },
      backgroundLayers: [],
      lightingConfig: {
        ambientColor: 0x1a1510,
        ambientIntensity: 0.25,
        sunColor: 0xffeedd,
        sunIntensity: 0.3,
        sunAngleRadians: 1.0,
        shadowLengthMultiplier: 2.0,
        shadowSoftness: 0.1,
        dayNightCycleSupported: false,
      },
      atmosphericEffects: {
        hasAtmosphere: true,
        hazeColor: 0x4a90e2,
        hazeDensity: 0.2,
        opticalDepth: 0.15,
        atmosphericPressureAtm: 0.00001,
        horizonFogHeight: 100,
        skyGradientTop: 0x000000,
        skyGradientBottom: 0x102030,
        heatDistortion: false,
        dustStormActive: false,
      },
      weatherConfig: {
        type: 0 as any,
        intensity: 0,
        particleColor: 0xffffff,
        particleCountMax: 0,
        particleSpeedMin: 0,
        particleSpeedMax: 0,
        windAngleRadians: 0,
      },
      boundaries: {
        minX: 0,
        maxX: 4800,
        minY: 0,
        maxY: 2400,
        hazardWarningDistance: 200,
        hardBoundary: true,
      },
      spawnLocations: [
        {
          id: 'SPAWN_PLUTO_SPUTNIK',
          name: 'Sputnik Planitia Nitrogen Plain',
          description: 'Convecting cellular nitrogen ice plain.',
          x: 1000,
          y: 1300,
          isDefault: true,
          isSafe: true,
          landingDifficulty: 2,
          tag: 'NITROGEN_ICE',
        },
      ],
      pointsOfInterest: [],
      transition: {
        entryType: 'SURFACE_TOUCHDOWN',
        transitionDurationSeconds: 2.0,
        initialCameraZoom: 0.5,
        targetCameraZoom: 1.0,
        fadeColor: 0x000000,
      },
    };

    manager.registerEnvironmentDefinition(customDef);
    const retrieved = manager.getEnvironmentDefinition('DEST_PLUTO');
    expect(retrieved).toBeDefined();
    expect(retrieved?.destinationName).toBe('Pluto');

    const loaded = await manager.loadEnvironment('DEST_PLUTO');
    expect(loaded.definition.destinationId).toBe('DEST_PLUTO');
    expect(manager.getEnvironmentStatus().currentDestinationId).toBe('DEST_PLUTO');
  });

  it('updates environment quality and emits quality change event', async () => {
    const qualitySpy = vi.fn();
    manager.getEventBus().on(PLANETARY_ENVIRONMENT_EVENTS.QUALITY_CHANGED, qualitySpy);

    await manager.loadEnvironment(DestinationId.MARS);
    manager.setEnvironmentQuality(EnvironmentQualityLevel.ULTRA);

    expect(qualitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        previousQuality: EnvironmentQualityLevel.HIGH,
        newQuality: EnvironmentQualityLevel.ULTRA,
      })
    );
    expect(manager.getEnvironmentStatus().quality).toBe(EnvironmentQualityLevel.ULTRA);
  });

  it('bridges domain events to the core game EventBus', async () => {
    const coreSpy = vi.fn();
    coreEventBus.on(PLANETARY_ENVIRONMENT_EVENTS.LOADED, coreSpy);

    await manager.loadEnvironment(DestinationId.EUROPA);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});

