/**
 * INTERSTELLAR CONTINUUM - Independent Game-Time System
 * Deterministic fixed-step clock engine supporting variable time scales,
 * safe delta clamping against spiral-of-death, frame-rate independent progression,
 * pausing, and mission elapsed time (MET) formatting.
 */

import { GameTimeConfig, GameTimeState } from './MissionSimulationTypes';

export class GameTimeSystem {
  private timeScale: number = 1.0;
  private isPaused: boolean = false;
  private fixedTimeStep: number = 0.05; // 20 Hz fixed simulation steps
  private maxDeltaClamping: number = 5.0; // 5.0s max delta per frame
  private maxSubSteps: number = 200; // Max sub-steps per frame to prevent spiral of death

  private elapsedGameTimeSeconds: number = 0;
  private totalRealTimeSeconds: number = 0;
  private totalTicks: number = 0;
  private accumulator: number = 0;

  constructor(config?: Partial<GameTimeConfig>) {
    if (config) {
      if (typeof config.timeScale === 'number' && config.timeScale >= 0) {
        this.timeScale = config.timeScale;
      }
      if (typeof config.isPaused === 'boolean') {
        this.isPaused = config.isPaused;
      }
      if (typeof config.fixedTimeStep === 'number' && config.fixedTimeStep > 0) {
        this.fixedTimeStep = config.fixedTimeStep;
      }
      if (typeof config.maxDeltaClamping === 'number' && config.maxDeltaClamping > 0) {
        this.maxDeltaClamping = config.maxDeltaClamping;
      }
      if (typeof config.maxSubSteps === 'number' && config.maxSubSteps > 0) {
        this.maxSubSteps = config.maxSubSteps;
      }
    }
  }

  /**
   * Pause game-time progression
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume game-time progression
   */
  public resume(): void {
    this.isPaused = false;
  }

  /**
   * Toggle pause state
   */
  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * Check whether time is currently paused
   */
  public isTimePaused(): boolean {
    return this.isPaused;
  }

  /**
   * Set simulation speed multiplier
   * Clamped to non-negative values. 0 effectively pauses progression.
   */
  public setTimeScale(scale: number): void {
    if (isNaN(scale) || scale < 0) {
      this.timeScale = 1.0;
      return;
    }
    this.timeScale = scale;
  }

  /**
   * Get current simulation speed multiplier
   */
  public getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Advance game time using a real-world delta in seconds.
   * Runs deterministic fixed-step sub-ticks.
   *
   * @param deltaRealSeconds Real delta time in seconds
   * @param onFixedTick Optional callback executed for each fixed-step tick
   * @returns Total game-seconds progressed in this advance call
   */
  public advance(
    deltaRealSeconds: number,
    onFixedTick?: (fixedDeltaSeconds: number) => void
  ): number {
    if (deltaRealSeconds <= 0 || isNaN(deltaRealSeconds)) {
      return 0;
    }

    // 1. Clamp real delta to prevent spiral of death from background tabs or lag spikes
    const clampedRealDelta = Math.min(deltaRealSeconds, this.maxDeltaClamping);
    this.totalRealTimeSeconds += clampedRealDelta;

    // 2. If paused or timescale is 0, no game time advances
    if (this.isPaused || this.timeScale === 0) {
      return 0;
    }

    // 3. Scale delta by the simulation multiplier
    const scaledDelta = clampedRealDelta * this.timeScale;
    this.accumulator += scaledDelta;

    let steps = 0;
    let progressedGameTime = 0;
    const effectiveMaxSubSteps = Math.max(
      this.maxSubSteps,
      Math.ceil(this.timeScale * (clampedRealDelta / this.fixedTimeStep) * 2)
    );
    const EPSILON = 1e-9;

    // 4. Consume fixed steps
    while (
      this.accumulator >= this.fixedTimeStep - EPSILON &&
      steps < effectiveMaxSubSteps
    ) {
      this.elapsedGameTimeSeconds += this.fixedTimeStep;
      this.totalTicks++;
      progressedGameTime += this.fixedTimeStep;
      steps++;

      if (onFixedTick) {
        onFixedTick(this.fixedTimeStep);
      }

      this.accumulator -= this.fixedTimeStep;
      if (Math.abs(this.accumulator) < EPSILON) {
        this.accumulator = 0;
      }
    }

    // 5. If we hit max sub-steps, discard remaining accumulated lag to prevent endless loop
    if (steps >= effectiveMaxSubSteps) {
      this.accumulator = 0;
    }

    return progressedGameTime;
  }

  /**
   * Get current game time telemetry state
   */
  public getState(): GameTimeState {
    return {
      elapsedGameTimeSeconds: this.elapsedGameTimeSeconds,
      totalRealTimeSeconds: this.totalRealTimeSeconds,
      totalTicks: this.totalTicks,
      timeScale: this.timeScale,
      isPaused: this.isPaused,
      formattedMET: this.formatMET(this.elapsedGameTimeSeconds),
    };
  }

  /**
   * Get total elapsed game time in seconds
   */
  public getElapsedGameTimeSeconds(): number {
    return this.elapsedGameTimeSeconds;
  }

  /**
   * Get total fixed ticks processed
   */
  public getTotalTicks(): number {
    return this.totalTicks;
  }

  /**
   * Format seconds into human-readable Mission Elapsed Time (MET)
   * Format: "T+ 00d 00h 00m 00s"
   */
  public formatMET(seconds: number = this.elapsedGameTimeSeconds): string {
    const totalSec = Math.max(0, Math.floor(seconds));
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `T+ ${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(secs)}s`;
  }

  /**
   * Reset time system to initial 0 state
   */
  public reset(): void {
    this.elapsedGameTimeSeconds = 0;
    this.totalRealTimeSeconds = 0;
    this.totalTicks = 0;
    this.accumulator = 0;
  }

  /**
   * Restore state from snapshot
   */
  public restore(state: {
    elapsedGameTimeSeconds: number;
    totalRealTimeSeconds?: number;
    totalTicks?: number;
    timeScale?: number;
    isPaused?: boolean;
    fixedTimeStep?: number;
    maxDeltaClamping?: number;
  }): void {
    this.elapsedGameTimeSeconds = Math.max(0, state.elapsedGameTimeSeconds || 0);
    this.totalRealTimeSeconds = Math.max(0, state.totalRealTimeSeconds || 0);
    this.totalTicks = Math.max(0, state.totalTicks || 0);
    this.accumulator = 0;

    if (typeof state.timeScale === 'number' && state.timeScale >= 0) {
      this.timeScale = state.timeScale;
    }
    if (typeof state.isPaused === 'boolean') {
      this.isPaused = state.isPaused;
    }
    if (typeof state.fixedTimeStep === 'number' && state.fixedTimeStep > 0) {
      this.fixedTimeStep = state.fixedTimeStep;
    }
    if (typeof state.maxDeltaClamping === 'number' && state.maxDeltaClamping > 0) {
      this.maxDeltaClamping = state.maxDeltaClamping;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): GameTimeConfig {
    return {
      timeScale: this.timeScale,
      isPaused: this.isPaused,
      fixedTimeStep: this.fixedTimeStep,
      maxDeltaClamping: this.maxDeltaClamping,
      maxSubSteps: this.maxSubSteps,
    };
  }
}
