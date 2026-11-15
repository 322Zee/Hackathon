import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationProgressionManager } from '../../src/destinations/DestinationProgressionManager';
import {
  DestinationId,
  DestinationCategory,
  EnvironmentalClassification,
  SurfaceAvailability,
  GravityClassification,
  TemperatureClassification,
  ExplorationMethod,
  EnvironmentLoadType,
  UnlockConditionType,
} from '../../src/destinations/DestinationTypes';

describe('DestinationRegistry & Progression System', () => {
  let eventBus: EventBus;
  let registry: DestinationRegistry;
  let progressionManager: DestinationProgressionManager;

  beforeEach(() => {
    DestinationRegistry.resetInstance();
    DestinationProgressionManager.resetInstance();
    eventBus = new EventBus();
    registry = DestinationRegistry.getInstance(eventBus);
    progressionManager = DestinationProgressionManager.getInstance();
  });

  afterEach(() => {
    DestinationRegistry.resetInstance();
    DestinationProgressionManager.resetInstance();
  });

  it('1. all required destinations exist with unique IDs', () => {
    const all = registry.getAllDestinations();
    expect(all.length).toBeGreaterThanOrEqual(18);

    const ids = all.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify presence of all key destinations
    const required = [
      DestinationId.SUN,
      DestinationId.MERCURY,
      DestinationId.VENUS,
      DestinationId.EARTH,
      DestinationId.EARTH_ORBIT_LEO,
      DestinationId.EARTH_ORBIT_MEO,
      DestinationId.EARTH_ORBIT_GEO,
      DestinationId.EARTH_ORBIT_HEO,
      DestinationId.MOON,
      DestinationId.MARS,
      DestinationId.PHOBOS,
      DestinationId.DEIMOS,
      DestinationId.ASTEROID_BELT,
      DestinationId.CERES,
      DestinationId.VESTA,
      DestinationId.JUPITER,
      DestinationId.EUROPA,
      DestinationId.GANYMEDE,
      DestinationId.CALLISTO,
      DestinationId.IO,
      DestinationId.SATURN,
      DestinationId.TITAN,
      DestinationId.ENCELADUS,
      DestinationId.URANUS,
      DestinationId.TITANIA,
      DestinationId.NEPTUNE,
      DestinationId.TRITON,
    ];

    for (const reqId of required) {
      const dest = registry.getDestination(reqId);
      expect(dest).toBeDefined();
      expect(dest?.id).toBe(reqId);
      expect(dest?.name.length).toBeGreaterThan(0);
      expect(dest?.scientificDescription.length).toBeGreaterThan(20);
    }
  });

  it('2. registers all 10 major Solar System primary bodies', () => {
    const primaryPlanets = registry.getPrimaryPlanets();
    expect(primaryPlanets.length).toBe(10);

    const expectedPrimary = [
      DestinationId.SUN,
      DestinationId.MERCURY,
      DestinationId.VENUS,
      DestinationId.EARTH,
      DestinationId.MARS,
      DestinationId.ASTEROID_BELT,
      DestinationId.JUPITER,
      DestinationId.SATURN,
      DestinationId.URANUS,
      DestinationId.NEPTUNE,
    ];

    for (const pId of expectedPrimary) {
      expect(primaryPlanets.some((p) => p.id === pId)).toBe(true);
    }
  });

  it('3. parent-child relationships and moon hierarchies work correctly', () => {
    // Earth's Moon
    const earthMoons = registry.getMoonsForParent(DestinationId.EARTH);
    expect(earthMoons.length).toBe(1);
    expect(earthMoons[0]?.id).toBe(DestinationId.MOON);
    expect(earthMoons[0]?.parentId).toBe(DestinationId.EARTH);

    // Mars's Moons
    const marsMoons = registry.getMoonsForParent(DestinationId.MARS);
    expect(marsMoons.length).toBe(2);
    const marsMoonIds = marsMoons.map((m) => m.id);
    expect(marsMoonIds).toContain(DestinationId.PHOBOS);
    expect(marsMoonIds).toContain(DestinationId.DEIMOS);

    // Jupiter's Moons
    const jupiterMoons = registry.getMoonsForParent(DestinationId.JUPITER);
    expect(jupiterMoons.length).toBe(4);
    const jupiterMoonIds = jupiterMoons.map((m) => m.id);
    expect(jupiterMoonIds).toContain(DestinationId.EUROPA);
    expect(jupiterMoonIds).toContain(DestinationId.GANYMEDE);
    expect(jupiterMoonIds).toContain(DestinationId.CALLISTO);
    expect(jupiterMoonIds).toContain(DestinationId.IO);

    // Saturn's Moons
    const saturnMoons = registry.getMoonsForParent(DestinationId.SATURN);
    expect(saturnMoons.length).toBe(2);
    const saturnMoonIds = saturnMoons.map((m) => m.id);
    expect(saturnMoonIds).toContain(DestinationId.TITAN);
    expect(saturnMoonIds).toContain(DestinationId.ENCELADUS);

    // Uranus Moon
    const uranusMoons = registry.getMoonsForParent(DestinationId.URANUS);
    expect(uranusMoons.length).toBe(1);
    expect(uranusMoons[0]?.id).toBe(DestinationId.TITANIA);

    // Neptune Moon
    const neptuneMoons = registry.getMoonsForParent(DestinationId.NEPTUNE);
    expect(neptuneMoons.length).toBe(1);
    expect(neptuneMoons[0]?.id).toBe(DestinationId.TRITON);
  });

  it('4. Earth orbital regions are correctly nested under Earth', () => {
    const earthOrbits = registry.getEarthOrbitalRegions();
    expect(earthOrbits.length).toBe(4);

    const orbitIds = earthOrbits.map((o) => o.id);
    expect(orbitIds).toContain(DestinationId.EARTH_ORBIT_LEO);
    expect(orbitIds).toContain(DestinationId.EARTH_ORBIT_MEO);
    expect(orbitIds).toContain(DestinationId.EARTH_ORBIT_GEO);
    expect(orbitIds).toContain(DestinationId.EARTH_ORBIT_HEO);

    for (const orbit of earthOrbits) {
      expect(orbit.category).toBe(DestinationCategory.ORBITAL_REGION);
      expect(orbit.parentId).toBe(DestinationId.EARTH);
      expect(orbit.surfaceAvailability).toBe(SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY);
      expect(orbit.environment).toBe(EnvironmentalClassification.ORBITAL_SPACE);
      expect(orbit.physicalCharacteristics.altitudeKmMin).toBeDefined();
    }
  });

  it('5. gas and ice giants do not expose conventional walkable surfaces', () => {
    const giants = [
      DestinationId.JUPITER,
      DestinationId.SATURN,
      DestinationId.URANUS,
      DestinationId.NEPTUNE,
    ];

    for (const gid of giants) {
      const body = registry.getDestination(gid);
      expect(body).toBeDefined();
      expect(body?.surfaceAvailability).toBe(SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY);

      const surfaceEval = registry.canAccessSurface(gid);
      expect(surfaceEval.allowed).toBe(false);
      expect(surfaceEval.rejectionReason).toContain('does not possess a conventional solid surface');
    }
  });

  it('6. environmental classifications cover all 10 canonical classes', () => {
    const all = registry.getAllDestinations();
    const envs = new Set(all.map((d) => d.environment));

    expect(envs.has(EnvironmentalClassification.EARTH_TERRESTRIAL)).toBe(true);
    expect(envs.has(EnvironmentalClassification.AIRLESS_ROCKY)).toBe(true);
    expect(envs.has(EnvironmentalClassification.ROCKY_HOSTILE_ATMOSPHERE)).toBe(true);
    expect(envs.has(EnvironmentalClassification.EXTREME_TEMP_ROCKY)).toBe(true);
    expect(envs.has(EnvironmentalClassification.ICY_MOON)).toBe(true);
    expect(envs.has(EnvironmentalClassification.OCEAN_WORLD)).toBe(true);
    expect(envs.has(EnvironmentalClassification.GAS_GIANT_ATMOSPHERE)).toBe(true);
    expect(envs.has(EnvironmentalClassification.ICE_GIANT_ATMOSPHERE)).toBe(true);
    expect(envs.has(EnvironmentalClassification.ASTEROID_SMALL_BODY)).toBe(true);
    expect(envs.has(EnvironmentalClassification.ORBITAL_SPACE)).toBe(true);
  });

  it('7. accurately tracks initial unlock states (Earth & LEO unlocked, outer locked by default)', () => {
    expect(registry.isUnlocked(DestinationId.EARTH)).toBe(true);
    expect(registry.isUnlocked(DestinationId.MOON)).toBe(true);
    expect(registry.isUnlocked(DestinationId.EARTH_ORBIT_LEO)).toBe(true);

    expect(registry.isUnlocked(DestinationId.MARS)).toBe(false);
    expect(registry.isUnlocked(DestinationId.VENUS)).toBe(false);
    expect(registry.isUnlocked(DestinationId.JUPITER)).toBe(false);
    expect(registry.isUnlocked(DestinationId.EUROPA)).toBe(false);
    expect(registry.isUnlocked(DestinationId.SATURN)).toBe(false);
    expect(registry.isUnlocked(DestinationId.EARTH_ORBIT_GEO)).toBe(false);
  });

  it('8. unlockDestination unlocks target and dispatches domain event', () => {
    let emittedPayload: any = null;
    eventBus.on('destination:unlocked' as any, (payload) => {
      emittedPayload = payload;
    });

    expect(registry.isUnlocked(DestinationId.MARS)).toBe(false);
    const result = registry.unlockDestination(DestinationId.MARS);

    expect(result).toBe(true);
    expect(registry.isUnlocked(DestinationId.MARS)).toBe(true);
    expect(emittedPayload).toBeDefined();
    expect(emittedPayload.destinationId).toBe(DestinationId.MARS);
  });

  it('9. progression evaluation accurately calculates conditions and progress percentages', () => {
    // Initial evaluation for Mars at Rank 1 (requires Rank 2)
    expect(progressionManager.getContext().rank).toBe(1);
    const marsEval = registry.evaluateProgression(DestinationId.MARS, {
      rank: 1,
      researchPoints: 50,
      unlockedTechIds: [],
    });

    expect(marsEval).toBeDefined();
    expect(marsEval?.isUnlocked).toBe(false);
    expect(marsEval?.overallProgressPercent).toBeLessThan(100);

    const rankReq = marsEval?.requirements.find((r) => r.condition.type === UnlockConditionType.REQUIRED_RANK);
    expect(rankReq).toBeDefined();
    expect(rankReq?.isMet).toBe(false);
    expect(rankReq?.progressPercent).toBe(50); // 1 / 2

    // Now evaluate with requirements met
    const advancedEval = registry.evaluateProgression(DestinationId.MARS, {
      rank: 2,
      researchPoints: 200,
      unlockedTechIds: ['tech_interplanetary_trajectory'],
    });

    expect(advancedEval?.isUnlocked).toBe(true);
    expect(advancedEval?.overallProgressPercent).toBe(100);
    for (const req of advancedEval!.requirements) {
      expect(req.isMet).toBe(true);
    }
  });

  it('10. distinguishes between solid surfaces, microgravity small bodies, and hostile environments', () => {
    // Walkable
    const moonEval = registry.canAccessSurface(DestinationId.MOON);
    expect(moonEval.allowed).toBe(true);
    expect(moonEval.surfaceAvailability).toBe(SurfaceAvailability.WALKABLE_SURFACE);
    expect(moonEval.requiresSpecializedEquipment).toBe(false);

    // Hostile / Specialized (Venus)
    const venusEval = registry.canAccessSurface(DestinationId.VENUS);
    expect(venusEval.allowed).toBe(true);
    expect(venusEval.surfaceAvailability).toBe(SurfaceAvailability.HAZARDOUS_SURFACE_SPECIALIZED_ONLY);
    expect(venusEval.requiresSpecializedEquipment).toBe(true);
    expect(venusEval.equipmentNeeded.length).toBeGreaterThan(0);
    expect(venusEval.maxOperatingHours).toBeDefined();

    // Small Body / Microgravity (Asteroid Belt & Ceres)
    const ceresEval = registry.canAccessSurface(DestinationId.CERES);
    expect(ceresEval.allowed).toBe(true);
    expect(ceresEval.surfaceAvailability).toBe(SurfaceAvailability.SMALL_BODY_MICROGRAVITY);
    expect(ceresEval.requiresSpecializedEquipment).toBe(true);
    expect(ceresEval.equipmentNeeded[0]).toContain('Microgravity');

    // Sun / Gas Giant (Prohibited)
    const sunEval = registry.canAccessSurface(DestinationId.SUN);
    expect(sunEval.allowed).toBe(false);
  });

  it('11. generates valid environment loading configs for future gameplay scenes', () => {
    // Earth HQ
    const earthCfg = registry.getEnvironmentLoadConfig(DestinationId.EARTH);
    expect(earthCfg.environmentType).toBe(EnvironmentLoadType.HEADQUARTERS_CAMPUS);
    expect(earthCfg.canDeployCrew).toBe(true);

    // LEO Orbital Space
    const leoCfg = registry.getEnvironmentLoadConfig(DestinationId.EARTH_ORBIT_LEO);
    expect(leoCfg.environmentType).toBe(EnvironmentLoadType.ORBITAL_SPACE);
    expect(leoCfg.safeSpawnAltitudeKm).toBeGreaterThan(100);

    // Moon Lunar Surface
    const moonCfg = registry.getEnvironmentLoadConfig(DestinationId.MOON);
    expect(moonCfg.environmentType).toBe(EnvironmentLoadType.LUNAR_SURFACE);
    expect(moonCfg.canDeployRover).toBe(true);

    // Mars Planetary Surface
    const marsCfg = registry.getEnvironmentLoadConfig(DestinationId.MARS);
    expect(marsCfg.environmentType).toBe(EnvironmentLoadType.PLANETARY_SURFACE);
    expect(marsCfg.canDeployRover).toBe(true);

    // Ceres Asteroid Surface
    const ceresCfg = registry.getEnvironmentLoadConfig(DestinationId.CERES);
    expect(ceresCfg.environmentType).toBe(EnvironmentLoadType.ASTEROID_SURFACE);

    // Jupiter Atmospheric Descent
    const jupiterCfg = registry.getEnvironmentLoadConfig(DestinationId.JUPITER);
    expect(jupiterCfg.environmentType).toBe(EnvironmentLoadType.ATMOSPHERIC_DESCENT);
  });

  it('12. dynamically registers additional destinations without restructuring the system', () => {
    const customDest = {
      id: 'DEST_EXO_KEPLER' as any,
      name: 'Kepler-186f',
      subtitle: 'HABITABLE ZONE EXOPLANET',
      shortCode: 'K186-F',
      category: DestinationCategory.ROCKY_PLANET,
      environment: EnvironmentalClassification.EARTH_TERRESTRIAL,
      surfaceAvailability: SurfaceAvailability.WALKABLE_SURFACE,
      gravityClassification: GravityClassification.EARTH_LIKE,
      temperatureClassification: TemperatureClassification.TEMPERATE,
      supportedExplorationMethods: [ExplorationMethod.ORBITAL_SURVEY, ExplorationMethod.ROBOTIC_LANDER],
      availableMissionCategories: ['INTERSTELLAR_RECONNAISSANCE'],
      communication: {
        oneWayLatencySeconds: 1.5e10,
        relayRequirement: 'DEEP_SPACE_NETWORK_ARRAY' as any,
        blackoutRisks: [],
      },
      gameplayConfig: {
        ambientIlluminationPercent: 50,
        solarFluxWm2: 400,
        dustStormRiskPercent: 0,
        radiationDamageRate: 1.0,
        scientificDiscoveryMultiplier: 10.0,
      },
      color: 0x10b981,
      accentColor: 0x34d399,
      radiusPixels: 14,
      orbitRadiusPixels: 650,
      orbitSpeed: 0.005,
      initialAngle: 0,
      scientificDescription: 'An Earth-size exoplanet orbiting within the habitable zone of the red dwarf Kepler-186.',
      physicalCharacteristics: {
        semiMajorAxisAu: 0.432,
        orbitalPeriodDays: 129.9,
        surfaceGravityG: 1.1,
        meanTemperatureC: -10,
      },
      defaultUnlockState: 0 as any,
      discoveryStatus: 0 as any,
      explorationStatus: 0 as any,
      requiredDirectorRank: 5,
      requiredRankTitle: 'RANK 5',
      unlockConditions: [],
      unlockRequirementsText: 'Requires Interstellar Warp Probe (Rank 5)',
      availableMissionsCount: 1,
      completedMissionsCount: 0,
      hasSubDestinations: false,
    };

    registry.registerDestination(customDest);

    const retrieved = registry.getDestination('DEST_EXO_KEPLER');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Kepler-186f');
    expect(retrieved?.surfaceAvailability).toBe(SurfaceAvailability.WALKABLE_SURFACE);
  });
});
