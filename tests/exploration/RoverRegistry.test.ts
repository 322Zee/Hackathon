import { describe, it, expect, beforeEach } from 'vitest';
import { RoverRegistry } from '../../src/exploration/RoverRegistry';
import { RoverModelType, RoverOperationalStatus } from '../../src/exploration/ExplorationTypes';

describe('RoverRegistry', () => {
  let registry: RoverRegistry;

  beforeEach(() => {
    RoverRegistry.resetInstance();
    registry = RoverRegistry.getInstance();
  });

  it('initializes default rover models and starter rover fleet', () => {
    const models = registry.listModels();
    expect(models.length).toBeGreaterThanOrEqual(4);

    const scout = registry.getModel(RoverModelType.SCOUT);
    expect(scout).toBeDefined();
    expect(scout?.displayName).toContain('Pathfinder');

    const science = registry.getModel(RoverModelType.SCIENTIFIC);
    expect(science).toBeDefined();
    expect(science?.maxInstrumentSlots).toBe(5);

    const heavy = registry.getModel(RoverModelType.HEAVY_UTILITY);
    expect(heavy).toBeDefined();
    expect(heavy?.maxStorageSlots).toBe(16);

    const auto = registry.getModel(RoverModelType.ADVANCED_AUTONOMOUS);
    expect(auto).toBeDefined();
    expect(auto?.autonomousCapabilityRating).toBe(5);

    const rovers = registry.listRovers();
    expect(rovers.length).toBeGreaterThanOrEqual(4);
  });

  it('registers a custom rover configuration with unique ID', () => {
    const rover = registry.registerRover({
      id: 'ROVER_CUSTOM_TITAN',
      name: 'Titan Ocean Crawler',
      model: RoverModelType.HEAVY_UTILITY,
      destinationId: 'DEST_TITAN',
      installedInstrumentIds: ['INST_MASTCAM_STEREO', 'INST_GROUND_RADAR'],
      initialLocation: { x: 1200, y: 1500 },
      initialHeadingDeg: 90,
    });

    expect(rover.id).toBe('ROVER_CUSTOM_TITAN');
    expect(rover.name).toBe('Titan Ocean Crawler');
    expect(rover.model).toBe(RoverModelType.HEAVY_UTILITY);
    expect(rover.destinationId).toBe('DEST_TITAN');
    expect(rover.location.x).toBe(1200);
    expect(rover.location.y).toBe(1500);
    expect(rover.location.headingDeg).toBe(90);
    expect(rover.instruments.length).toBe(2);
  });

  it('rejects registering duplicate rover identifiers', () => {
    registry.registerRover({
      id: 'ROVER_DUP_TEST',
      name: 'Duplicate Test Rover',
      model: RoverModelType.SCOUT,
      destinationId: 'DEST_MOON',
    });

    expect(() => {
      registry.registerRover({
        id: 'ROVER_DUP_TEST',
        name: 'Another Rover',
        model: RoverModelType.SCIENTIFIC,
        destinationId: 'DEST_MARS',
      });
    }).toThrow(/already registered/);
  });

  it('filters rovers by destination, model type, and operational status', () => {
    const marsRovers = registry.listRovers({ destinationId: 'DEST_MARS' });
    expect(marsRovers.length).toBeGreaterThanOrEqual(2);
    expect(marsRovers.every((r) => r.destinationId === 'DEST_MARS')).toBe(true);

    const scoutRovers = registry.listRovers({ modelType: RoverModelType.SCOUT });
    expect(scoutRovers.every((r) => r.model === RoverModelType.SCOUT)).toBe(true);

    const activeRovers = registry.listRovers({ operationalStatus: RoverOperationalStatus.ACTIVE });
    expect(activeRovers.every((r) => r.operationalStatus === RoverOperationalStatus.ACTIVE)).toBe(true);
  });

  it('demonstrates meaningful gameplay parameter differentiation between rover models', () => {
    const scout = registry.getModel(RoverModelType.SCOUT)!;
    const science = registry.getModel(RoverModelType.SCIENTIFIC)!;
    const heavy = registry.getModel(RoverModelType.HEAVY_UTILITY)!;
    const auto = registry.getModel(RoverModelType.ADVANCED_AUTONOMOUS)!;

    // Scout is fastest and lightest
    expect(scout.defaultMovementConfig.maxSpeed).toBeGreaterThan(science.defaultMovementConfig.maxSpeed);
    expect(scout.baseMassKg).toBeLessThan(heavy.baseMassKg);
    expect(scout.defaultMovementConfig.turnRateDegPerSec).toBeGreaterThan(heavy.defaultMovementConfig.turnRateDegPerSec);

    // Scientific has highest instrument capacity and RTG power
    expect(science.maxInstrumentSlots).toBeGreaterThan(scout.maxInstrumentSlots);
    expect(science.powerSource).toBe('RADIOISOTOPE_RTG');
    expect(science.rtgGenerationRate).toBeGreaterThan(0);

    // Heavy utility has largest cargo capacity and highest structural base condition
    expect(heavy.maxStorageSlots).toBeGreaterThan(scout.maxStorageSlots);
    expect(heavy.baseCondition).toBeGreaterThan(scout.baseCondition);

    // Autonomous has highest autonomous rating and long sensor radius
    expect(auto.autonomousCapabilityRating).toBe(5);
    expect(auto.defaultMovementConfig.sensorDetectionRadius).toBeGreaterThan(heavy.defaultMovementConfig.sensorDetectionRadius);
  });
});
