import { describe, it, expect } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PLANETARY_ENVIRONMENT_PROFILES,
  EnvironmentPresentationMode,
  WeatherEffectType,
} from '../../src/environment/planetary';

describe('Authoritative Destination Profiles', () => {
  it('defines comprehensive profiles for all 8 primary exploration destinations', () => {
    const requiredDestinations = [
      DestinationId.MOON,
      DestinationId.MARS,
      DestinationId.VENUS,
      DestinationId.MERCURY,
      DestinationId.ASTEROID_BELT,
      DestinationId.EUROPA,
      DestinationId.TITAN,
      DestinationId.ENCELADUS,
    ];

    for (const destId of requiredDestinations) {
      const profile = PLANETARY_ENVIRONMENT_PROFILES[destId];
      expect(profile, `Profile for ${destId} must exist`).toBeDefined();
      expect(profile?.destinationId).toBe(destId);
      expect(profile?.isWalkableSurface).toBe(true);
      expect(profile?.spawnLocations.length).toBeGreaterThanOrEqual(1);
      expect(profile?.pointsOfInterest.length).toBeGreaterThanOrEqual(1);
      expect(profile?.boundaries.maxX).toBeGreaterThanOrEqual(3000);
      expect(profile?.difficultyRatings.temperatureDifficulty).toBeGreaterThanOrEqual(1);
    }
  });

  it('configures Moon with grey regolith, craters, dark sky, Earth visible, and dust motes', () => {
    const moon = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.MOON]!;
    expect(moon.surfaceVisuals.regolithTextureStyle).toBe('ROCKY');
    expect(moon.atmosphericEffects.hasAtmosphere).toBe(false);
    expect(moon.atmosphericEffects.atmosphericPressureAtm).toBe(0.0);
    expect(moon.weatherConfig.type).toBe(WeatherEffectType.DUST_MOTES);

    const earthLayer = moon.backgroundLayers.find(
      (l) => l.celestialBodyDetails?.name === 'Earth'
    );
    expect(earthLayer).toBeDefined();
    expect(earthLayer?.celestialBodyDetails?.surfaceDetail).toBe('BLUE_MARBLE_EARTH');
  });

  it('configures Mars with red-orange terrain, distant mountain silhouettes, and dusty atmosphere', () => {
    const mars = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.MARS]!;
    expect(mars.surfaceVisuals.regolithTextureStyle).toBe('SANDY');
    expect(mars.atmosphericEffects.hasAtmosphere).toBe(true);
    expect(mars.atmosphericEffects.dustStormActive).toBe(true);
    expect(mars.weatherConfig.type).toBe(WeatherEffectType.DUST_STORM);

    const mountainLayer = mars.backgroundLayers.find((l) => l.type === 'DISTANT_MOUNTAINS');
    expect(mountainLayer).toBeDefined();
  });

  it('configures Venus with 92-bar hostile atmosphere, volcanic styling, and heat distortion', () => {
    const venus = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.VENUS]!;
    expect(venus.surfaceVisuals.regolithTextureStyle).toBe('VOLCANIC');
    expect(venus.atmosphericEffects.hasAtmosphere).toBe(true);
    expect(venus.atmosphericEffects.atmosphericPressureAtm).toBe(92.0);
    expect(venus.atmosphericEffects.heatDistortion).toBe(true);
    expect(venus.difficultyRatings.temperatureDifficulty).toBe(5);
    expect(venus.difficultyRatings.atmosphericDifficulty).toBe(5);
    expect(venus.weatherConfig.type).toBe(WeatherEffectType.ACID_HAZE);
  });

  it('configures Mercury with deep craters, blazing sun, stark shadows, and high heat', () => {
    const mercury = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.MERCURY]!;
    expect(mercury.atmosphericEffects.hasAtmosphere).toBe(false);
    expect(mercury.lightingConfig.shadowSoftness).toBeLessThan(0.05); // Stark shadows
    expect(mercury.lightingConfig.sunIntensity).toBeGreaterThanOrEqual(1.8);
    expect(mercury.difficultyRatings.temperatureDifficulty).toBe(5);

    const sunLayer = mercury.backgroundLayers.find(
      (l) => l.celestialBodyDetails?.name === 'The Sun'
    );
    expect(sunLayer).toBeDefined();
    expect(sunLayer?.celestialBodyDetails?.surfaceDetail).toBe('SOLAR_CORONA');
  });

  it('configures Asteroid Belt with low-gravity presentation, high roughness, and boulders', () => {
    const asteroid = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.ASTEROID_BELT]!;
    expect(asteroid.presentationMode).toBe(EnvironmentPresentationMode.LOW_GRAVITY_SURFACE);
    expect(asteroid.terrainConfig.roughness).toBeGreaterThanOrEqual(0.7);
    expect(asteroid.terrainConfig.surfaceFriction).toBeLessThanOrEqual(0.4);
    expect(asteroid.terrainConfig.rockFrequency).toBeGreaterThanOrEqual(0.8);
  });

  it('configures Europa with icy patterns, Jupiter in sky, and cryo effects', () => {
    const europa = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.EUROPA]!;
    expect(europa.surfaceVisuals.icePatternOverlay).toBe(true);
    expect(europa.surfaceVisuals.regolithTextureStyle).toBe('ICY');

    const jupiterLayer = europa.backgroundLayers.find(
      (l) => l.celestialBodyDetails?.name === 'Jupiter'
    );
    expect(jupiterLayer).toBeDefined();
    expect(jupiterLayer?.celestialBodyDetails?.surfaceDetail).toBe('STRIPED_JOVIAN');
  });

  it('configures Titan with orange haze, hydrocarbon lake properties, and dense atmosphere', () => {
    const titan = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.TITAN]!;
    expect(titan.atmosphericEffects.hasAtmosphere).toBe(true);
    expect(titan.atmosphericEffects.atmosphericPressureAtm).toBeGreaterThan(1.0);
    expect(titan.surfaceVisuals.liquidLakeColor).toBeDefined();
    expect(titan.surfaceVisuals.liquidReflectivity).toBeGreaterThan(0.8);
    expect(titan.weatherConfig.type).toBe(WeatherEffectType.METHANE_MIST);
  });

  it('configures Enceladus with high albedo white surface, Saturn in sky, and cryo-geysers', () => {
    const enceladus = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.ENCELADUS]!;
    expect(enceladus.surfaceVisuals.icePatternOverlay).toBe(true);
    expect(enceladus.surfaceVisuals.regolithTextureStyle).toBe('ICY');
    expect(enceladus.weatherConfig.type).toBe(WeatherEffectType.CRYO_PLUME);

    const saturnLayer = enceladus.backgroundLayers.find(
      (l) => l.celestialBodyDetails?.name === 'Saturn'
    );
    expect(saturnLayer).toBeDefined();
    expect(saturnLayer?.celestialBodyDetails?.hasRings).toBe(true);
  });

  it('strictly enforces non-walkable surface profiles for gas and ice giants', () => {
    const giantIds = [
      DestinationId.JUPITER,
      DestinationId.SATURN,
      DestinationId.URANUS,
      DestinationId.NEPTUNE,
    ];

    for (const giantId of giantIds) {
      const profile = PLANETARY_ENVIRONMENT_PROFILES[giantId];
      expect(profile, `Gas/Ice giant profile ${giantId} must exist`).toBeDefined();
      expect(profile?.isWalkableSurface).toBe(false);
      expect(
        profile?.presentationMode === EnvironmentPresentationMode.ATMOSPHERIC_PROBE ||
          profile?.presentationMode === EnvironmentPresentationMode.ORBITAL_OBSERVATION
      ).toBe(true);
      // No solid terrain craters or boulders
      expect(profile?.terrainConfig.craterFrequency).toBe(0.0);
      expect(profile?.terrainConfig.rockFrequency).toBe(0.0);
    }
  });
});
