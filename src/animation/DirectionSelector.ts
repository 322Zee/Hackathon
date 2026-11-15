/**
 * INTERSTELLAR CONTINUUM - Direction Selector with Hysteresis
 * Determines stable facing directions for 2D/2.5D character animation without diagonal flicker
 */

import { FacingDirection } from './AnimationTypes';

export interface DirectionSelectorConfig {
  hysteresisRatio?: number; // Minimum ratio required to break current axis orientation (default: 1.25)
  minMovementThreshold?: number; // Minimum speed in px/s to trigger a direction change (default: 5)
}

export class DirectionSelector {
  private currentFacing: FacingDirection;
  private hysteresisRatio: number;
  private minThreshold: number;
  private movingDiagonally: boolean = false;

  constructor(initialFacing: FacingDirection = FacingDirection.SOUTH, config: DirectionSelectorConfig = {}) {
    this.currentFacing = initialFacing;
    this.hysteresisRatio = config.hysteresisRatio ?? 1.25;
    this.minThreshold = config.minMovementThreshold ?? 5;
  }

  public getFacing(): FacingDirection {
    return this.currentFacing;
  }

  public setFacing(facing: FacingDirection): void {
    this.currentFacing = facing;
  }

  public isDiagonal(): boolean {
    return this.movingDiagonally;
  }

  /**
   * Update facing direction based on movement velocity vector
   * Returns true if the facing direction changed
   */
  public update(vx: number, vy: number): boolean {
    const speed = Math.hypot(vx, vy);
    if (speed < this.minThreshold) {
      this.movingDiagonally = false;
      return false; // Retain current facing when resting or near zero
    }

    const absX = Math.abs(vx);
    const absY = Math.abs(vy);

    // Diagonal detection: both axes are actively non-zero and within 2.0x of each other
    this.movingDiagonally = absX > 15 && absY > 15 && absX < absY * 2.0 && absY < absX * 2.0;

    const previousFacing = this.currentFacing;
    const isCurrentlyHorizontal =
      previousFacing === FacingDirection.EAST || previousFacing === FacingDirection.WEST;
    const isCurrentlyVertical =
      previousFacing === FacingDirection.NORTH || previousFacing === FacingDirection.SOUTH;

    if (isCurrentlyHorizontal) {
      // Favor staying horizontal unless vertical movement strongly dominates
      if (absY > absX * this.hysteresisRatio) {
        this.currentFacing = vy > 0 ? FacingDirection.SOUTH : FacingDirection.NORTH;
      } else {
        this.currentFacing = vx > 0 ? FacingDirection.EAST : FacingDirection.WEST;
      }
    } else if (isCurrentlyVertical) {
      // Favor staying vertical unless horizontal movement strongly dominates
      if (absX > absY * this.hysteresisRatio) {
        this.currentFacing = vx > 0 ? FacingDirection.EAST : FacingDirection.WEST;
      } else {
        this.currentFacing = vy > 0 ? FacingDirection.SOUTH : FacingDirection.NORTH;
      }
    } else {
      // Fallback: pick the strictly dominant axis
      if (absX >= absY) {
        this.currentFacing = vx > 0 ? FacingDirection.EAST : FacingDirection.WEST;
      } else {
        this.currentFacing = vy > 0 ? FacingDirection.SOUTH : FacingDirection.NORTH;
      }
    }

    return this.currentFacing !== previousFacing;
  }
}
