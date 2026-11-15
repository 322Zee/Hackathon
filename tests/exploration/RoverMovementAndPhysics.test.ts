import { describe, it, expect, beforeEach } from 'vitest';
import { RoverMovementController } from '../../src/exploration/RoverMovementController';
import { RoverRegistry } from '../../src/exploration/RoverRegistry';
import { RoverRecord, TerrainType } from '../../src/exploration/ExplorationTypes';

describe('RoverMovementController', () => {
  let controller: RoverMovementController;
  let rover: RoverRecord;

  beforeEach(() => {
    RoverRegistry.resetInstance();
    const registry = RoverRegistry.getInstance();
    rover = registry.getRover('ROVER_SCOUT_01')!;
    rover.location = { x: 500, y: 500, headingDeg: 0, currentTerrain: TerrainType.SMOOTH_PLAINS };
    rover.speed = 0;
    rover.velocity = { x: 0, y: 0 };
    controller = new RoverMovementController();
  });

  it('accelerates forward along heading when positive throttle is applied', () => {
    const delta = 0.5; // half second
    const result = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      delta
    );

    expect(result.speed).toBeGreaterThan(0);
    expect(result.velocity.y).toBeLessThan(0); // Heading 0° is North (negative Y)
    expect(result.newLocation.y).toBeLessThan(500);
    expect(result.displacement).toBeGreaterThan(0);
    expect(result.energyDrained).toBeGreaterThan(0);
  });

  it('moves in reverse with capped reverse speed', () => {
    rover.speed = 0;
    const result = controller.updateMovement(
      rover,
      { forward: -1.0, steer: 0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      1.0
    );

    expect(result.isReversing).toBe(true);
    expect(result.speed).toBeLessThan(0);
    expect(Math.abs(result.speed)).toBeLessThanOrEqual(rover.movementConfig.maxReverseSpeed);
    expect(result.newLocation.y).toBeGreaterThan(500); // Reversing south
  });

  it('turns rover left and right, normalizing heading to 0-360 range', () => {
    rover.location.headingDeg = 90; // Facing East
    // Steer left (-1.0)
    const turnLeft = controller.updateMovement(
      rover,
      { forward: 0, steer: -1.0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      0.3
    );
    expect(turnLeft.newLocation.headingDeg).toBeLessThan(90);
    expect(turnLeft.newLocation.headingDeg).toBeGreaterThanOrEqual(0);

    // Steer right past 360 wrap-around
    rover.location.headingDeg = 355;
    const turnRight = controller.updateMovement(
      rover,
      { forward: 0, steer: 1.0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      0.5
    );
    expect(turnRight.newLocation.headingDeg).toBeGreaterThanOrEqual(0);
    expect(turnRight.newLocation.headingDeg).toBeLessThan(360);
  });

  it('applies controlled active braking to rapidly halt rover', () => {
    rover.speed = 150;
    const brakeResult = controller.updateMovement(
      rover,
      { forward: 0, steer: 0, brake: true },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      0.2
    );

    expect(brakeResult.isBraking).toBe(true);
    expect(brakeResult.speed).toBeLessThan(150);
  });

  it('slows down speed based on terrain difficulty factor', () => {
    rover.speed = 0;
    // Plains traversal
    const plainsResult = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      1.0
    );

    rover.speed = 0;
    // Hazardous steep crater slope
    const slopeResult = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false },
      2.5,
      TerrainType.CRATER_SLOPES,
      1.0
    );

    expect(slopeResult.speed).toBeLessThan(plainsResult.speed);
    expect(slopeResult.displacement).toBeLessThan(plainsResult.displacement);
  });

  it('boost mode increases speed at higher energy consumption, while crawl mode conserves speed', () => {
    rover.speed = 0;
    const normal = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      1.0
    );

    rover.speed = 0;
    const boost = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false, boost: true },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      1.0
    );

    rover.speed = 0;
    const crawl = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false, crawl: true },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      1.0
    );

    expect(boost.speed).toBeGreaterThan(normal.speed);
    expect(boost.energyDrained).toBeGreaterThan(normal.energyDrained);
    expect(crawl.speed).toBeLessThan(normal.speed);
    expect(crawl.energyDrained).toBeLessThan(normal.energyDrained);
  });

  it('calculates suspension pitch and accumulates wheel rotation angle', () => {
    const move = controller.updateMovement(
      rover,
      { forward: 1.0, steer: 0, brake: false },
      1.0,
      TerrainType.SMOOTH_PLAINS,
      0.5
    );

    expect(move.wheelRotationAngle).not.toBe(0);
    expect(typeof move.suspensionPitchAngle).toBe('number');
  });
});
