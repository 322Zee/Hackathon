import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PlanetaryEnvironmentManager,
  EnvironmentQualityLevel,
  WeatherEffectType,
  EnvironmentalParticleSystem,
  ParallaxBackgroundSystem,
  PlanetaryTerrainRenderer,
} from '../../src/environment/planetary';

describe('Planetary Rendering & Performance Optimizations', () => {
  let manager: PlanetaryEnvironmentManager;

  beforeEach(() => {
    PlanetaryEnvironmentManager.resetInstance();
    manager = PlanetaryEnvironmentManager.getInstance();
  });

  afterEach(async () => {
    await manager.unloadEnvironment();
    PlanetaryEnvironmentManager.resetInstance();
  });

  it('EnvironmentalParticleSystem pre-allocates particle memory and scales with quality', () => {
    const particleSys = new EnvironmentalParticleSystem();

    const weatherConfig = {
      type: WeatherEffectType.DUST_STORM,
      intensity: 0.8,
      particleColor: 0xdd7d47,
      particleCountMax: 100,
      particleSpeedMin: 20,
      particleSpeedMax: 60,
      windAngleRadians: 0,
    };

    // 1. LOW Quality -> 25% pool capacity
    particleSys.initialize(weatherConfig, 3840, 2160, EnvironmentQualityLevel.LOW);
    expect(particleSys.getActiveParticleCount()).toBe(25);

    // 2. HIGH Quality -> 100% capacity
    particleSys.initialize(weatherConfig, 3840, 2160, EnvironmentQualityLevel.HIGH);
    expect(particleSys.getActiveParticleCount()).toBe(100);

    // 3. ULTRA Quality -> 150% capacity
    particleSys.initialize(weatherConfig, 3840, 2160, EnvironmentQualityLevel.ULTRA);
    expect(particleSys.getActiveParticleCount()).toBe(150);

    // Verify update cycle does not throw and updates particles smoothly
    expect(() => particleSys.update(0.016)).not.toThrow();

    particleSys.cleanup();
  });

  it('ParallaxBackgroundSystem handles camera offsets and quality level pruning', () => {
    const parallaxSys = new ParallaxBackgroundSystem();
    const mars = manager.getEnvironmentDefinition(DestinationId.MARS)!;

    // LOW quality prunes midground hills to save draw calls
    parallaxSys.initialize(mars.backgroundLayers, 3840, 2160, EnvironmentQualityLevel.LOW);
    expect(parallaxSys.container.children.length).toBeLessThan(mars.backgroundLayers.length);

    // Updating camera shifts parallax layer offsets
    expect(() => parallaxSys.updateCamera(500, 300)).not.toThrow();

    parallaxSys.cleanup();
    expect(parallaxSys.container.children.length).toBe(0);
  });

  it('PlanetaryTerrainRenderer disposes resources cleanly without memory retention', () => {
    const terrainRenderer = new PlanetaryTerrainRenderer();
    const moon = manager.getEnvironmentDefinition(DestinationId.MOON)!;
    const terrainData = manager.generateEnvironment(moon.terrainConfig, DestinationId.MOON);

    terrainRenderer.render(terrainData, moon.surfaceVisuals, moon.boundaries, EnvironmentQualityLevel.HIGH);
    expect(terrainRenderer.container.children.length).toBe(3); // terrain, features, rocks

    terrainRenderer.clear();
    terrainRenderer.destroy();
  });

  it('exploration scene clamps camera coordinates within destination boundaries', async () => {
    const instance = await manager.loadEnvironment(DestinationId.MARS);
    const scene = instance.scene!;

    // Move camera towards far right boundary
    scene.panCamera(10000, 0);
    scene.update(1.0); // Step frame

    const b = instance.definition.boundaries;
    expect(scene.cameraX).toBeLessThanOrEqual(b.maxX - 400);

    // Move camera towards far left boundary
    scene.panCamera(-20000, 0);
    scene.update(1.0);
    expect(scene.cameraX).toBeGreaterThanOrEqual(b.minX + 400);
  });

  it('performs clean environment unload with complete resource teardown', async () => {
    await manager.loadEnvironment(DestinationId.VENUS);
    expect(manager.getEnvironmentStatus().isLoaded).toBe(true);

    await manager.unloadEnvironment();
    expect(manager.getEnvironmentStatus().isLoaded).toBe(false);
    expect(manager.getActiveInstance()).toBeUndefined();
  });
});
