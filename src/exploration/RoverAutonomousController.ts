/**
 * INTERSTELLAR CONTINUUM - Rover Autonomous Navigation Controller
 * Automated waypoint traversal, obstacle steering deflection, and POI auto-stopping.
 */

import {
  AutonomousBehaviorMode,
  PointOfInterest,
  RoverControlInput,
  RoverOperationalStatus,
  RoverRecord,
  SurfaceObstacle,
  Vector2D,
} from './ExplorationTypes';

export class RoverAutonomousController {
  private readonly ARRIVAL_THRESHOLD_DISTANCE = 35.0; // Px distance considered arrived
  private readonly OBSTACLE_AVOIDANCE_LOOKAHEAD = 140.0; // Scan distance ahead of vehicle

  /**
   * Generates control input for the autonomous navigation system.
   */
  public computeAutonomousInput(
    rover: RoverRecord,
    obstacles: SurfaceObstacle[],
    pointsOfInterest: PointOfInterest[]
  ): {
    input: RoverControlInput;
    hasArrivedAtTarget: boolean;
    stoppedAtPoi?: PointOfInterest;
  } {
    // If not in autonomous mode or no targets, idle
    if (!rover.autonomousMode || rover.autonomousWaypoints.length === 0) {
      return {
        input: { forward: 0, steer: 0, brake: true },
        hasArrivedAtTarget: false,
      };
    }

    const currentTarget = rover.autonomousWaypoints[0];
    if (!currentTarget) {
      return {
        input: { forward: 0, steer: 0, brake: true },
        hasArrivedAtTarget: false,
      };
    }

    const roverX = rover.location.x;
    const roverY = rover.location.y;
    const dx = currentTarget.x - roverX;
    const dy = currentTarget.y - roverY;
    const distanceToTarget = Math.hypot(dx, dy);

    // 1. Check if arrived at current waypoint
    if (distanceToTarget <= this.ARRIVAL_THRESHOLD_DISTANCE) {
      // Pop current waypoint
      rover.autonomousWaypoints.shift();
      const isComplete = rover.autonomousWaypoints.length === 0;

      if (isComplete) {
        rover.autonomousMode = false;
        rover.autonomousTarget = undefined;
        rover.autonomousBehavior = AutonomousBehaviorMode.IDLE;
        rover.operationalStatus = RoverOperationalStatus.ACTIVE;
      }

      return {
        input: { forward: 0, steer: 0, brake: true },
        hasArrivedAtTarget: true,
      };
    }

    // 2. Check for undiscovered POIs in proximity to auto-stop and observe
    for (const poi of pointsOfInterest) {
      if (!poi.isDiscovered) {
        const poiDist = Math.hypot(roverX - poi.x, roverY - poi.y);
        if (poiDist <= poi.discoveryRadius * 0.75) {
          // Pause autonomous driving to let player or auto-scanner inspect POI
          return {
            input: { forward: 0, steer: 0, brake: true },
            hasArrivedAtTarget: false,
            stoppedAtPoi: poi,
          };
        }
      }
    }

    // 3. Compute desired heading angle to target
    // 0 deg = North (dy < 0), 90 deg = East (dx > 0)
    let desiredHeadingDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    desiredHeadingDeg = (desiredHeadingDeg % 360 + 360) % 360;

    // 4. Obstacle Avoidance Vector Deflection
    let avoidanceSteer = 0;
    const headingRad = (rover.location.headingDeg - 90) * (Math.PI / 180);
    const forwardX = Math.cos(headingRad);
    const forwardY = Math.sin(headingRad);

    for (const obs of obstacles) {
      const toObsX = obs.x - roverX;
      const toObsY = obs.y - roverY;
      const obsDist = Math.hypot(toObsX, toObsY);

      // Only evaluate obstacles ahead within lookahead envelope
      if (obsDist < this.OBSTACLE_AVOIDANCE_LOOKAHEAD + obs.radius) {
        // Dot product with forward heading to ensure obstacle is in front
        const forwardDot = toObsX * forwardX + toObsY * forwardY;
        if (forwardDot > 0) {
          // Cross product determines if obstacle is left or right of heading
          const cross = forwardX * toObsY - forwardY * toObsX;
          const urgency = 1.0 - obsDist / (this.OBSTACLE_AVOIDANCE_LOOKAHEAD + obs.radius);

          // Steer away from obstacle side
          if (cross > 0) {
            avoidanceSteer -= urgency * 1.5; // Steer left
          } else {
            avoidanceSteer += urgency * 1.5; // Steer right
          }
        }
      }
    }

    // 5. Angular Error Calculation with Shortest Turn Path
    let angleDiff = desiredHeadingDeg - rover.location.headingDeg;
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;

    let steer = Math.max(-1.0, Math.min(1.0, angleDiff / 45.0));

    // Combine target steer with obstacle avoidance steer
    if (Math.abs(avoidanceSteer) > 0.1) {
      steer = Math.max(-1.0, Math.min(1.0, avoidanceSteer));
    }

    // 6. Throttle Management
    // Slow down if making sharp turn
    let forward = 0.85;
    if (Math.abs(angleDiff) > 60) {
      forward = 0.25; // Crawl while turning
    } else if (Math.abs(angleDiff) > 30) {
      forward = 0.55;
    }

    // Advanced autonomous rovers have smoother, faster throttle
    if (rover.model === 'ADVANCED_AUTONOMOUS') {
      forward = Math.min(1.0, forward * 1.25);
    }

    return {
      input: {
        forward,
        steer,
        brake: false,
      },
      hasArrivedAtTarget: false,
    };
  }

  /**
   * Sets an autonomous target point and queues waypoints.
   */
  public setTarget(
    rover: RoverRecord,
    target: Vector2D,
    behavior: AutonomousBehaviorMode = AutonomousBehaviorMode.NAVIGATE_TO_WAYPOINT
  ): void {
    rover.autonomousMode = true;
    rover.autonomousBehavior = behavior;
    rover.autonomousTarget = { ...target };
    rover.autonomousWaypoints = [{ ...target }];
    rover.operationalStatus = RoverOperationalStatus.AUTONOMOUS;
  }

  /**
   * Clears autonomous mode and halts rover.
   */
  public stopAutonomousMode(rover: RoverRecord): void {
    rover.autonomousMode = false;
    rover.autonomousBehavior = AutonomousBehaviorMode.IDLE;
    rover.autonomousTarget = undefined;
    rover.autonomousWaypoints = [];
    if (rover.operationalStatus === RoverOperationalStatus.AUTONOMOUS) {
      rover.operationalStatus = RoverOperationalStatus.ACTIVE;
    }
  }
}
