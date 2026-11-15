/**
 * INTERSTELLAR CONTINUUM - Rover Movement Controller
 * 2D/2.5D planetary rover kinematics, steering, acceleration, braking,
 * and terrain-aware velocity integration.
 */

import {
  RoverControlInput,
  RoverLocation,
  RoverMovementConfig,
  RoverRecord,
  TerrainType,
  Vector2D,
} from './ExplorationTypes';

export interface MovementUpdateResult {
  newLocation: RoverLocation;
  velocity: Vector2D;
  speed: number;
  displacement: number;
  energyDrained: number;
  wheelRotationAngle: number;
  suspensionPitchAngle: number;
  isBraking: boolean;
  isReversing: boolean;
}

export class RoverMovementController {
  private wheelRotationCumulative: number = 0;
  private suspensionPitch: number = 0;

  /**
   * Updates rover physics and kinematics for a single frame.
   *
   * @param rover The active rover record to update
   * @param input Directional input (forward, steer, brake, boost, crawl)
   * @param terrainDifficulty Multiplier for terrain roughness (1.0 to 2.5)
   * @param currentTerrain The active terrain type
   * @param deltaSeconds Time step in seconds
   */
  public updateMovement(
    rover: RoverRecord,
    input: RoverControlInput,
    terrainDifficulty: number,
    currentTerrain: TerrainType,
    deltaSeconds: number
  ): MovementUpdateResult {
    if (deltaSeconds <= 0) {
      return {
        newLocation: { ...rover.location },
        velocity: { ...rover.velocity },
        speed: rover.speed,
        displacement: 0,
        energyDrained: 0,
        wheelRotationAngle: this.wheelRotationCumulative,
        suspensionPitchAngle: this.suspensionPitch,
        isBraking: false,
        isReversing: false,
      };
    }

    const config: RoverMovementConfig = rover.movementConfig;

    // 1. Calculate Terrain Speed Factor
    const terrainMultiplier = config.terrainHandling[currentTerrain] ?? 1.0;
    const effectiveTerrainFactor = Math.max(0.2, terrainMultiplier / Math.max(1.0, terrainDifficulty * 0.8));

    // 2. Determine target speed
    let targetSpeedCap = config.maxSpeed;
    if (input.boost) {
      targetSpeedCap *= 1.35; // Boost increases top speed
    } else if (input.crawl) {
      targetSpeedCap *= 0.45; // Crawl mode restricts speed for precise maneuvering
    }

    // Condition degradation penalty: below 50% condition, top speed diminishes
    if (rover.vehicleConditionRating < 50) {
      const penalty = Math.max(0.4, rover.vehicleConditionRating / 50);
      targetSpeedCap *= penalty;
    }

    // 3. Forward vs Reverse Direction
    const inputThrottle = Math.max(-1.0, Math.min(1.0, input.forward));
    let targetSpeed = 0;

    if (inputThrottle > 0) {
      targetSpeed = inputThrottle * targetSpeedCap * effectiveTerrainFactor;
    } else if (inputThrottle < 0) {
      // Reverse is limited to maxReverseSpeed
      const reverseCap = config.maxReverseSpeed * effectiveTerrainFactor;
      targetSpeed = inputThrottle * reverseCap;
    }

    // 4. Accelerate, Decelerate, or Active Brake
    let currentSpeed = rover.speed; // positive = forward, negative = reverse
    const isBraking = input.brake;

    if (isBraking) {
      // Active braking rapidly stops the rover
      const brakeStep = config.brakingDeceleration * deltaSeconds;
      if (Math.abs(currentSpeed) <= brakeStep) {
        currentSpeed = 0;
      } else {
        currentSpeed -= Math.sign(currentSpeed) * brakeStep;
      }
    } else if (inputThrottle !== 0) {
      // Accelerating toward target speed
      const diff = targetSpeed - currentSpeed;
      const accelStep = config.acceleration * deltaSeconds;
      if (Math.abs(diff) <= accelStep) {
        currentSpeed = targetSpeed;
      } else {
        currentSpeed += Math.sign(diff) * accelStep;
      }
    } else {
      // Coasting with natural friction
      const frictionStep = config.naturalFriction * deltaSeconds;
      if (Math.abs(currentSpeed) <= frictionStep) {
        currentSpeed = 0;
      } else {
        currentSpeed -= Math.sign(currentSpeed) * frictionStep;
      }
    }

    // 5. Angular Steering / Turning
    let headingDeg = rover.location.headingDeg;
    const steerInput = Math.max(-1.0, Math.min(1.0, input.steer));

    if (steerInput !== 0) {
      // Can pivot in place or steer while moving
      let effectiveTurnRate = config.turnRateDegPerSec;
      if (Math.abs(currentSpeed) > 10) {
        // While moving forward, steer responds smoothly
        effectiveTurnRate *= 1.0;
      } else {
        // Skid-steer / in-place rotation is slightly slower
        effectiveTurnRate *= 0.85;
      }

      // If reversing, invert steering direction like a real vehicle
      const steeringDirection = currentSpeed < -5 ? -steerInput : steerInput;
      headingDeg += steeringDirection * effectiveTurnRate * deltaSeconds;

      // Normalize heading to [0, 360)
      headingDeg = (headingDeg % 360 + 360) % 360;
    }

    // 6. Integrate 2D Velocity Vector along Heading
    // 0 deg = North (dx=0, dy=-1), 90 deg = East (dx=1, dy=0)
    const headingRad = (headingDeg - 90) * (Math.PI / 180);
    const vx = Math.cos(headingRad) * currentSpeed;
    const vy = Math.sin(headingRad) * currentSpeed;

    const displacement = Math.hypot(vx, vy) * deltaSeconds;
    const newX = rover.location.x + vx * deltaSeconds;
    const newY = rover.location.y + vy * deltaSeconds;

    // 7. Calculate Energy Consumption
    let energyDrained = config.energyDrainPerSecond * deltaSeconds; // Base idle/computing draw
    energyDrained += displacement * config.energyDrainPerMeter; // Traction draw

    if (input.boost) {
      energyDrained *= 2.2;
    } else if (input.crawl) {
      energyDrained *= 0.6;
    }

    // Steering torque also consumes minimal energy
    if (steerInput !== 0) {
      energyDrained += 0.1 * deltaSeconds;
    }

    // 8. Visual Suspension Pitch and Wheel Animation
    // Pitch forward on braking, pitch back on acceleration
    const accelRate = (currentSpeed - rover.speed) / deltaSeconds;
    const targetPitch = Math.max(-0.15, Math.min(0.15, -accelRate * 0.0004));
    this.suspensionPitch += (targetPitch - this.suspensionPitch) * Math.min(1.0, 10.0 * deltaSeconds);

    // Wheel rotation accumulation based on travel distance
    const wheelCircumference = 32.0; // Approx pixel circumference of wheel
    this.wheelRotationCumulative += (displacement / wheelCircumference) * Math.PI * 2 * Math.sign(currentSpeed);

    return {
      newLocation: {
        x: newX,
        y: newY,
        headingDeg,
        currentTerrain,
        sectorId: rover.location.sectorId,
      },
      velocity: { x: vx, y: vy },
      speed: currentSpeed,
      displacement,
      energyDrained,
      wheelRotationAngle: this.wheelRotationCumulative,
      suspensionPitchAngle: this.suspensionPitch,
      isBraking,
      isReversing: currentSpeed < -1.0,
    };
  }
}
