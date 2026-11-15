/**
 * INTERSTELLAR CONTINUUM - Movement Component
 * Frame-rate independent velocity integration, diagonal normalization, and acceleration/deceleration
 */

export interface MovementConfig {
  walkSpeed: number; // Pixels per second (e.g. 180)
  sprintSpeed: number; // Pixels per second (e.g. 320)
  acceleration: number; // Pixels per second squared (e.g. 1400)
  deceleration: number; // Pixels per second squared (e.g. 1800)
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  walkSpeed: 180,
  sprintSpeed: 310,
  acceleration: 1400,
  deceleration: 1800,
};

export class MovementComponent {
  private config: MovementConfig;
  private velocityX: number = 0;
  private velocityY: number = 0;

  constructor(config: Partial<MovementConfig> = {}) {
    this.config = { ...DEFAULT_MOVEMENT_CONFIG, ...config };
  }

  public getConfig(): Readonly<MovementConfig> {
    return this.config;
  }

  public setConfig(config: Partial<MovementConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getVelocity(): { x: number; y: number } {
    return { x: this.velocityX, y: this.velocityY };
  }

  public getSpeed(): number {
    return Math.hypot(this.velocityX, this.velocityY);
  }

  public setVelocity(vx: number, vy: number): void {
    this.velocityX = vx;
    this.velocityY = vy;
  }

  public stop(): void {
    this.velocityX = 0;
    this.velocityY = 0;
  }

  /**
   * Calculate displacement for frame given directional inputs (-1, 0, 1), sprint flag, and delta time
   */
  public update(
    inputX: number,
    inputY: number,
    isSprinting: boolean,
    deltaSeconds: number
  ): { deltaX: number; deltaY: number; vx: number; vy: number } {
    if (deltaSeconds <= 0) {
      return { deltaX: 0, deltaY: 0, vx: this.velocityX, vy: this.velocityY };
    }

    // 1. Normalize input vector (prevent diagonal speed boost: 1/sqrt(2) ≈ 0.7071)
    let dirX = 0;
    let dirY = 0;

    if (inputX !== 0 || inputY !== 0) {
      const len = Math.hypot(inputX, inputY);
      dirX = inputX / len;
      dirY = inputY / len;
    }

    // 2. Determine target speed
    const maxSpeed = isSprinting ? this.config.sprintSpeed : this.config.walkSpeed;
    const targetVelX = dirX * maxSpeed;
    const targetVelY = dirY * maxSpeed;

    // 3. Accelerate or Decelerate X
    if (dirX !== 0) {
      // Accelerating in input direction
      const diffX = targetVelX - this.velocityX;
      const stepX = Math.sign(diffX) * this.config.acceleration * deltaSeconds;
      if (Math.abs(stepX) >= Math.abs(diffX)) {
        this.velocityX = targetVelX;
      } else {
        this.velocityX += stepX;
      }
    } else {
      // Decelerating to stop
      const decelStep = this.config.deceleration * deltaSeconds;
      if (Math.abs(this.velocityX) <= decelStep) {
        this.velocityX = 0;
      } else {
        this.velocityX -= Math.sign(this.velocityX) * decelStep;
      }
    }

    // 4. Accelerate or Decelerate Y
    if (dirY !== 0) {
      // Accelerating in input direction
      const diffY = targetVelY - this.velocityY;
      const stepY = Math.sign(diffY) * this.config.acceleration * deltaSeconds;
      if (Math.abs(stepY) >= Math.abs(diffY)) {
        this.velocityY = targetVelY;
      } else {
        this.velocityY += stepY;
      }
    } else {
      // Decelerating to stop
      const decelStep = this.config.deceleration * deltaSeconds;
      if (Math.abs(this.velocityY) <= decelStep) {
        this.velocityY = 0;
      } else {
        this.velocityY -= Math.sign(this.velocityY) * decelStep;
      }
    }

    // 5. Integrate displacement
    const deltaX = this.velocityX * deltaSeconds;
    const deltaY = this.velocityY * deltaSeconds;

    return {
      deltaX,
      deltaY,
      vx: this.velocityX,
      vy: this.velocityY,
    };
  }
}
