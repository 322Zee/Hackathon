/**
 * INTERSTELLAR CONTINUUM - Character Animation System
 * Core Animation Types, States, Directions, and Playback Configurations
 */

export enum CharacterAnimationState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  RUN = 'RUN',
  INTERACT = 'INTERACT',
  ENTER_BUILDING = 'ENTER_BUILDING',
  EXIT_BUILDING = 'EXIT_BUILDING',
  STOP_TRANSITION = 'STOP_TRANSITION',
}

export enum FacingDirection {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
}

export interface AnimationPlaybackConfig {
  fps: number; // Playback rate in frames per second
  frameCount: number; // Total discrete animation frames
  loop: boolean; // Whether the sequence repeats indefinitely
  baseSpeed?: number; // Base reference speed (px/s) for synchronizing animation with movement
  canInterrupt?: boolean; // Whether active animation can be overridden by movement
  priority?: number; // Priority level for state transitions
}

export interface AnimationFrameInfo {
  frameIndex: number;
  totalFrames: number;
  normalizedTime: number; // 0.0 to 1.0 progress through the cycle
  isFirstFrame: boolean;
  isLastFrame: boolean;
}

export interface AnimationEvents {
  onStateEnter?: (state: CharacterAnimationState, direction: FacingDirection) => void;
  onStateExit?: (state: CharacterAnimationState, direction: FacingDirection) => void;
  onFrameChange?: (frame: AnimationFrameInfo) => void;
  onLoop?: (loopCount: number) => void;
  onComplete?: (state: CharacterAnimationState) => void;
}
