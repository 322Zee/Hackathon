import { describe, it, expect, beforeEach } from 'vitest';
import { RoverCollisionHandler } from '../../src/exploration/RoverCollisionHandler';
import { RoverRegistry } from '../../src/exploration/RoverRegistry';
import { PlanetaryEnvironmentAdapter } from '../../src/exploration/adapters/PlanetaryEnvironmentAdapter';
import { RoverModelType, RoverRecord, SurfaceObstacle, TerrainType } from '../../src/exploration/ExplorationTypes';

describe('RoverCollisionHandler and Terrain Boundaries', () => {
  let collisionHandler: RoverCollisionHandler;
  let envAdapter: PlanetaryEnvironmentAdapter;
  let scoutRover: RoverRecord;
  let heavyRover: RoverRecord;

  beforeEach(() => {
    RoverRegistry.resetInstance();
    const registry = RoverRegistry.getInstance();
    scoutRover = registry.getRover('ROVER_SCOUT_01')!;
    heavyRover = registry.getRover('ROVER_HEAVY_01')!;
    collisionHandler = new RoverCollisionHandler();
    envAdapter = new PlanetaryEnvironmentAdapter();
  });

  it('clamps rover position to sector boundaries', () => {
    const boundary = { minX: 100, maxX: 1000, minY: 100, maxY: 1000 };
    const obstacles: SurfaceObstacle[] = [];

    // Attempting to move past maxX
    const proposedLoc = { x: 1050, y: 500, headingDeg: 90, currentTerrain: TerrainType.SMOOTH_PLAINS };
    const proposedVel = { x: 150, y: 0 };

    const result = collisionHandler.resolveCollisions(scoutRover, proposedLoc, proposedVel, boundary, obstacles);

    expect(result.hasCollided).toBe(true);
    expect(result.resolvedLocation.x).toBeLessThanOrEqual(1000);
    expect(result.resolvedVelocity.x).toBe(0);
  });

  it('detects circular obstacle collision and pushes rover outside obstacle radius', () => {
    const boundary = { minX: 0, maxX: 2000, minY: 0, maxY: 2000 };
    const obstacle: SurfaceObstacle = {
      id: 'obs_boulder_test',
      name: 'Test Boulder',
      x: 500,
      y: 500,
      radius: 40,
      obstacleType: 'BOULDER',
      hardnessRating: 0.8,
    };

    // Proposed location directly overlaps boulder center
    const proposedLoc = { x: 510, y: 500, headingDeg: 0, currentTerrain: TerrainType.ROCKY_CRAGS };
    const proposedVel = { x: 50, y: 0 };

    const result = collisionHandler.resolveCollisions(scoutRover, proposedLoc, proposedVel, boundary, [obstacle]);

    expect(result.hasCollided).toBe(true);
    expect(result.collidedObstacleId).toBe('obs_boulder_test');

    // Distance from boulder center must now be at least collision radius + boulder radius
    const dist = Math.hypot(result.resolvedLocation.x - obstacle.x, result.resolvedLocation.y - obstacle.y);
    expect(dist).toBeGreaterThanOrEqual(63.9);
  });

  it('resolves sliding deflection velocity along obstacle tangent', () => {
    const boundary = { minX: 0, maxX: 2000, minY: 0, maxY: 2000 };
    const obstacle: SurfaceObstacle = {
      id: 'obs_wall',
      name: 'Wall Boulder',
      x: 500,
      y: 500,
      radius: 50,
      obstacleType: 'BOULDER',
      hardnessRating: 0.5,
    };

    // Rover traveling diagonally into upper-left quadrant of obstacle
    const proposedLoc = { x: 470, y: 470, headingDeg: 45, currentTerrain: TerrainType.ROCKY_CRAGS };
    const proposedVel = { x: 80, y: 80 };

    const result = collisionHandler.resolveCollisions(scoutRover, proposedLoc, proposedVel, boundary, [obstacle]);

    expect(result.hasCollided).toBe(true);
    // Tangent velocity should remain non-zero allowing sliding
    const resolvedSpeed = Math.hypot(result.resolvedVelocity.x, result.resolvedVelocity.y);
    expect(resolvedSpeed).toBeGreaterThan(0);
  });

  it('inflicts collision damage on high speed impacts, with heavy utility rovers resisting 50% damage', () => {
    const boundary = { minX: 0, maxX: 2000, minY: 0, maxY: 2000 };
    const obstacle: SurfaceObstacle = {
      id: 'obs_hard_cliff',
      name: 'Granite Cliff',
      x: 500,
      y: 500,
      radius: 50,
      obstacleType: 'CLIFF',
      hardnessRating: 1.0,
    };

    const proposedLoc = { x: 520, y: 500, headingDeg: 270, currentTerrain: TerrainType.ROCKY_CRAGS };
    const proposedVel = { x: -160, y: 0 }; // High speed head-on impact

    const scoutResult = collisionHandler.resolveCollisions(scoutRover, proposedLoc, proposedVel, boundary, [obstacle]);
    const heavyResult = collisionHandler.resolveCollisions(heavyRover, proposedLoc, proposedVel, boundary, [obstacle]);

    expect(scoutResult.damageInflicted).toBeGreaterThan(0);
    expect(heavyResult.damageInflicted).toBeGreaterThan(0);
    // Heavy utility rover has 50% damage resistance
    expect(heavyResult.damageInflicted).toBeLessThan(scoutResult.damageInflicted);
  });

  it('verifies accessibility through PlanetaryEnvironmentAdapter', () => {
    // Within bounds and away from obstacles
    expect(envAdapter.isLocationAccessible('DEST_MOON', { x: 800, y: 1600 })).toBe(true);

    // Outside bounds
    expect(envAdapter.isLocationAccessible('DEST_MOON', { x: -100, y: 500 })).toBe(false);

    // Right on top of boulder
    const obstacle = envAdapter.getObstacles('DEST_MOON')[0]!;
    expect(envAdapter.isLocationAccessible('DEST_MOON', { x: obstacle.x, y: obstacle.y })).toBe(false);
  });
});
