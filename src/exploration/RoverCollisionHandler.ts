/**
 * INTERSTELLAR CONTINUUM - Rover Collision Handler
 * Obstacle detection, boundary clamping, and sliding deflection resolution.
 */

import {
  ExplorationBoundary,
  RoverLocation,
  RoverRecord,
  SurfaceObstacle,
  Vector2D,
} from './ExplorationTypes';

export interface CollisionResolutionResult {
  resolvedLocation: RoverLocation;
  resolvedVelocity: Vector2D;
  hasCollided: boolean;
  collidedObstacleId?: string;
  damageInflicted: number;
}

export class RoverCollisionHandler {
  private readonly ROVER_COLLISION_RADIUS = 24.0; // Effective footprint collision circle

  /**
   * Resolves proposed movement against sector boundaries and surface obstacles.
   */
  public resolveCollisions(
    rover: RoverRecord,
    proposedLocation: RoverLocation,
    proposedVelocity: Vector2D,
    boundary: ExplorationBoundary,
    obstacles: SurfaceObstacle[]
  ): CollisionResolutionResult {
    let resolvedX = proposedLocation.x;
    let resolvedY = proposedLocation.y;
    let resolvedVx = proposedVelocity.x;
    let resolvedVy = proposedVelocity.y;
    let hasCollided = false;
    let collidedObstacleId: string | undefined;
    let totalDamage = 0;

    // 1. Boundary Clamping
    const margin = this.ROVER_COLLISION_RADIUS;
    if (resolvedX < boundary.minX + margin) {
      resolvedX = boundary.minX + margin;
      resolvedVx = 0;
      hasCollided = true;
    } else if (resolvedX > boundary.maxX - margin) {
      resolvedX = boundary.maxX - margin;
      resolvedVx = 0;
      hasCollided = true;
    }

    if (resolvedY < boundary.minY + margin) {
      resolvedY = boundary.minY + margin;
      resolvedVy = 0;
      hasCollided = true;
    } else if (resolvedY > boundary.maxY - margin) {
      resolvedY = boundary.maxY - margin;
      resolvedVy = 0;
      hasCollided = true;
    }

    // 2. Obstacle Collisions with Sliding Resolution
    for (const obs of obstacles) {
      const dx = resolvedX - obs.x;
      const dy = resolvedY - obs.y;
      const dist = Math.hypot(dx, dy);
      const minDist = this.ROVER_COLLISION_RADIUS + obs.radius;

      if (dist < minDist && dist > 0.001) {
        hasCollided = true;
        collidedObstacleId = obs.id;

        // Normal vector pointing from obstacle to rover
        const nx = dx / dist;
        const ny = dy / dist;

        // Push rover outside the obstacle boundary
        const penetration = minDist - dist;
        resolvedX += nx * penetration;
        resolvedY += ny * penetration;

        // Project velocity onto sliding tangent (remove normal velocity component into obstacle)
        const velDotNormal = resolvedVx * nx + resolvedVy * ny;
        if (velDotNormal < 0) {
          resolvedVx -= velDotNormal * nx;
          resolvedVy -= velDotNormal * ny;

          // Impact damage if colliding at speed
          const impactSpeed = Math.abs(velDotNormal);
          if (impactSpeed > 60) {
            const rawDamage = (impactSpeed / 100) * obs.hardnessRating * 3.5;
            // Heavy Utility rovers take 50% less collision damage
            const resistance = rover.model === 'HEAVY_UTILITY' ? 0.5 : 1.0;
            totalDamage += rawDamage * resistance;
          }
        }
      }
    }

    return {
      resolvedLocation: {
        x: resolvedX,
        y: resolvedY,
        headingDeg: proposedLocation.headingDeg,
        currentTerrain: proposedLocation.currentTerrain,
        sectorId: proposedLocation.sectorId,
      },
      resolvedVelocity: { x: resolvedVx, y: resolvedVy },
      hasCollided,
      collidedObstacleId,
      damageInflicted: totalDamage,
    };
  }
}
