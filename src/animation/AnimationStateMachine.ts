/**
 * INTERSTELLAR CONTINUUM - Animation State Machine
 * Coordinates character animation playback, frame timing, speed synchronization, and transitions
 */

import {
  CharacterAnimationState,
  FacingDirection,
  AnimationPlaybackConfig,
  AnimationFrameInfo,
  AnimationEvents,
} from './AnimationTypes';

export const DEFAULT_ANIMATION_CONFIGS: Record<CharacterAnimationState, AnimationPlaybackConfig> = {
  [CharacterAnimationState.IDLE]: {
    fps: 8,
    frameCount: 8,
    loop: true,
    canInterrupt: true,
    priority: 0,
  },
  [CharacterAnimationState.WALK]: {
    fps: 8.5,
    frameCount: 8,
    loop: true,
    baseSpeed: 180,
    canInterrupt: true,
    priority: 1,
  },
  [CharacterAnimationState.RUN]: {
    fps: 13.0,
    frameCount: 8,
    loop: true,
    baseSpeed: 310,
    canInterrupt: true,
    priority: 2,
  },
  [CharacterAnimationState.INTERACT]: {
    fps: 8,
    frameCount: 12,
    loop: false,
    canInterrupt: false,
    priority: 3,
  },
  [CharacterAnimationState.ENTER_BUILDING]: {
    fps: 6,
    frameCount: 6,
    loop: false,
    canInterrupt: false,
    priority: 4,
  },
  [CharacterAnimationState.EXIT_BUILDING]: {
    fps: 6,
    frameCount: 6,
    loop: false,
    canInterrupt: false,
    priority: 4,
  },
  [CharacterAnimationState.STOP_TRANSITION]: {
    fps: 12,
    frameCount: 3,
    loop: false,
    canInterrupt: true,
    priority: 1,
  },
};

export class AnimationStateMachine {
  private currentState: CharacterAnimationState = CharacterAnimationState.IDLE;
  private currentDirection: FacingDirection = FacingDirection.SOUTH;
  private configs: Record<CharacterAnimationState, AnimationPlaybackConfig>;

  private elapsedStateTime: number = 0;
  private currentFrameIndex: number = 0;
  private loopCount: number = 0;
  private isCompleted: boolean = false;

  private events: AnimationEvents = {};

  constructor(
    initialState: CharacterAnimationState = CharacterAnimationState.IDLE,
    initialDirection: FacingDirection = FacingDirection.SOUTH,
    customConfigs?: Partial<Record<CharacterAnimationState, AnimationPlaybackConfig>>
  ) {
    this.currentState = initialState;
    this.currentDirection = initialDirection;
    this.configs = { ...DEFAULT_ANIMATION_CONFIGS, ...customConfigs };
  }

  public setEvents(events: AnimationEvents): void {
    this.events = events;
  }

  public getState(): CharacterAnimationState {
    return this.currentState;
  }

  public getDirection(): FacingDirection {
    return this.currentDirection;
  }

  public setDirection(direction: FacingDirection): void {
    this.currentDirection = direction;
  }

  public getFrameIndex(): number {
    return this.currentFrameIndex;
  }

  public getNormalizedTime(): number {
    const config = this.configs[this.currentState];
    const totalDuration = config.frameCount / config.fps;
    if (totalDuration <= 0) return 0;
    const time = config.loop ? this.elapsedStateTime % totalDuration : Math.min(this.elapsedStateTime, totalDuration);
    return time / totalDuration;
  }

  public getLoopCount(): number {
    return this.loopCount;
  }

  public isAnimationCompleted(): boolean {
    return this.isCompleted;
  }

  public getConfig(state: CharacterAnimationState): AnimationPlaybackConfig {
    return this.configs[state];
  }

  /**
   * Request state transition. Evaluates interruption rules and priority.
   */
  public transitionTo(targetState: CharacterAnimationState, force: boolean = false): boolean {
    if (this.currentState === targetState) {
      return true;
    }

    const currentConfig = this.configs[this.currentState];
    const targetConfig = this.configs[targetState];

    if (!force) {
      // If current animation cannot be interrupted and is not completed, reject
      if (!currentConfig.canInterrupt && !this.isCompleted) {
        if ((targetConfig.priority ?? 0) <= (currentConfig.priority ?? 0)) {
          return false;
        }
      }
    }

    const oldState = this.currentState;
    this.events.onStateExit?.(oldState, this.currentDirection);

    this.currentState = targetState;
    this.elapsedStateTime = 0;
    this.currentFrameIndex = 0;
    this.loopCount = 0;
    this.isCompleted = false;

    this.events.onStateEnter?.(targetState, this.currentDirection);
    return true;
  }

  /**
   * Advance animation timeline by deltaSeconds with optional speed synchronization
   */
  public update(deltaSeconds: number, actualSpeed?: number): AnimationFrameInfo {
    const config = this.configs[this.currentState];
    const totalDuration = config.frameCount / config.fps;

    // 1. Calculate dynamic playback speed factor (eliminates foot sliding for walk/run)
    let speedFactor = 1.0;
    if (config.baseSpeed && actualSpeed !== undefined && actualSpeed > 0) {
      speedFactor = Math.max(0.4, Math.min(2.5, actualSpeed / config.baseSpeed));
    }

    const effectiveDelta = deltaSeconds * speedFactor;
    this.elapsedStateTime += effectiveDelta;

    const previousFrame = this.currentFrameIndex;

    // 2. Compute current frame and looping/completion
    if (config.loop) {
      const cycleTime = this.elapsedStateTime % totalDuration;
      this.currentFrameIndex = Math.min(
        config.frameCount - 1,
        Math.floor((cycleTime / totalDuration) * config.frameCount)
      );

      const calculatedLoops = Math.floor(this.elapsedStateTime / totalDuration);
      if (calculatedLoops > this.loopCount) {
        this.loopCount = calculatedLoops;
        this.events.onLoop?.(this.loopCount);
      }
    } else {
      if (this.elapsedStateTime >= totalDuration) {
        this.currentFrameIndex = config.frameCount - 1;
        if (!this.isCompleted) {
          this.isCompleted = true;
          this.events.onComplete?.(this.currentState);
        }
      } else {
        this.currentFrameIndex = Math.min(
          config.frameCount - 1,
          Math.floor((this.elapsedStateTime / totalDuration) * config.frameCount)
        );
      }
    }

    const frameInfo: AnimationFrameInfo = {
      frameIndex: this.currentFrameIndex,
      totalFrames: config.frameCount,
      normalizedTime: this.getNormalizedTime(),
      isFirstFrame: this.currentFrameIndex === 0,
      isLastFrame: this.currentFrameIndex === config.frameCount - 1,
    };

    if (this.currentFrameIndex !== previousFrame) {
      this.events.onFrameChange?.(frameInfo);
    }

    return frameInfo;
  }
}
