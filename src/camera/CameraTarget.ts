/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Camera Target Tracking, Deadzone Box, and Velocity Lookahead
 */

export interface ICameraTarget {
  id?: string;
  getPosition(): { x: number; y: number };
  getVelocity?(): { x: number; y: number };
}

export interface DeadzoneConfig {
  width: number; // Half-width of deadzone box in world coordinates
  height: number; // Half-height of deadzone box in world coordinates
}

export interface LookaheadConfig {
  leadTimeSeconds: number; // How many seconds ahead to project velocity (e.g. 0.3s)
  maxDistance: number; // Maximum lookahead offset in world coordinates
  smoothing: number; // Lookahead response smoothing
}

export class CameraTargetTracker {
  private target: ICameraTarget | null = null;
  private deadzone: DeadzoneConfig = { width: 120, height: 80 };
  private lookaheadConfig: LookaheadConfig = {
    leadTimeSeconds: 0.35,
    maxDistance: 250,
    smoothing: 0.1,
  };
  private currentLookaheadX: number = 0;
  private currentLookaheadY: number = 0;

  public setTarget(target: ICameraTarget | null): void {
    this.target = target;
  }

  public getTarget(): ICameraTarget | null {
    return this.target;
  }

  public setDeadzone(width: number, height: number): void {
    this.deadzone = { width: Math.max(0, width), height: Math.max(0, height) };
  }

  public getDeadzone(): Readonly<DeadzoneConfig> {
    return this.deadzone;
  }

  public setLookahead(config: Partial<LookaheadConfig>): void {
    this.lookaheadConfig = { ...this.lookaheadConfig, ...config };
  }

  /**
   * Computes desired camera focus position considering target, deadzone box, and velocity lookahead
   */
  public computeDesiredPosition(
    currentCameraX: number,
    currentCameraY: number,
    useDeadzone: boolean,
    useLookahead: boolean,
    deltaSeconds: number
  ): { x: number; y: number } {
    if (!this.target) {
      return { x: currentCameraX, y: currentCameraY };
    }

    const pos = this.target.getPosition();
    let desiredX = currentCameraX;
    let desiredY = currentCameraY;

    // 1. Process Deadzone
    if (useDeadzone && (this.deadzone.width > 0 || this.deadzone.height > 0)) {
      const deltaX = pos.x - currentCameraX;
      const deltaY = pos.y - currentCameraY;

      // Only push camera if target exceeds deadzone half-extents
      if (Math.abs(deltaX) > this.deadzone.width) {
        desiredX = deltaX > 0 ? pos.x - this.deadzone.width : pos.x + this.deadzone.width;
      }
      if (Math.abs(deltaY) > this.deadzone.height) {
        desiredY = deltaY > 0 ? pos.y - this.deadzone.height : pos.y + this.deadzone.height;
      }
    } else {
      desiredX = pos.x;
      desiredY = pos.y;
    }

    // 2. Process Velocity Lookahead
    if (useLookahead && this.target.getVelocity) {
      const vel = this.target.getVelocity();
      const rawLeadX = vel.x * this.lookaheadConfig.leadTimeSeconds;
      const rawLeadY = vel.y * this.lookaheadConfig.leadTimeSeconds;

      // Clamp to max distance
      const dist = Math.hypot(rawLeadX, rawLeadY);
      const scale = dist > this.lookaheadConfig.maxDistance ? this.lookaheadConfig.maxDistance / dist : 1.0;
      const targetLeadX = rawLeadX * scale;
      const targetLeadY = rawLeadY * scale;

      // Smooth lookahead interpolation
      const factor = Math.min(1.0, this.lookaheadConfig.smoothing * (deltaSeconds * 60));
      this.currentLookaheadX += (targetLeadX - this.currentLookaheadX) * factor;
      this.currentLookaheadY += (targetLeadY - this.currentLookaheadY) * factor;

      desiredX += this.currentLookaheadX;
      desiredY += this.currentLookaheadY;
    } else {
      this.currentLookaheadX = 0;
      this.currentLookaheadY = 0;
    }

    return { x: desiredX, y: desiredY };
  }
}
