/**
 * INTERSTELLAR CONTINUUM - Playable Player Character
 * Mission Director representation, integrated Animation State Machine, Directional Hysteresis,
 * 2.5D Depth Sorting, Grounding Drop Shadow, and ICameraTarget compliance
 */

import { Container } from 'pixi.js';
import { ICameraTarget } from '../camera/CameraTarget';
import { BoxCollider } from '../collision/BoxCollider';
import { CollisionCategory } from '../collision/ColliderTypes';
import {
  CharacterAnimationState,
  FacingDirection,
  AnimationFrameInfo,
} from '../animation/AnimationTypes';
import { AnimationStateMachine } from '../animation/AnimationStateMachine';
import { DirectionSelector } from '../animation/DirectionSelector';
import { CharacterVisualRenderer } from '../animation/CharacterVisualRenderer';

// Backward-compatibility export alias
export { FacingDirection } from '../animation/AnimationTypes';

export enum PlayerState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  RUN = 'RUN',
  SPRINT = 'RUN', // Alias for sprint movement
  INTERACT = 'INTERACT',
  ENTER_BUILDING = 'ENTER_BUILDING',
  EXIT_BUILDING = 'EXIT_BUILDING',
  STOP_TRANSITION = 'STOP_TRANSITION',
}

export interface PlayerCharacterConfig {
  id?: string;
  initialX?: number;
  initialY?: number;
  facing?: FacingDirection;
}

export class PlayerCharacter implements ICameraTarget {
  public readonly id: string;
  public readonly container: Container;

  private posX: number = 0;
  private posY: number = 0;
  private velX: number = 0;
  private velY: number = 0;

  // Integrated Animation Subsystems
  private animationStateMachine: AnimationStateMachine;
  private directionSelector: DirectionSelector;
  private visualRenderer: CharacterVisualRenderer;

  // Decoupled Collision shape at feet
  private footCollider: BoxCollider;

  constructor(config: PlayerCharacterConfig = {}) {
    this.id = config.id || 'mission_director_player';
    this.posX = config.initialX ?? 0;
    this.posY = config.initialY ?? 0;
    const initialFacing = config.facing ?? FacingDirection.SOUTH;

    this.container = new Container();
    this.container.label = 'PlayerCharacter';

    // 1. Initialize Direction Selector with 25% hysteresis to eliminate diagonal jitter
    this.directionSelector = new DirectionSelector(initialFacing, {
      hysteresisRatio: 1.25,
      minMovementThreshold: 8.0,
    });

    // 2. Initialize Animation State Machine
    this.animationStateMachine = new AnimationStateMachine(
      CharacterAnimationState.IDLE,
      initialFacing
    );

    // 3. Initialize Visual Renderer
    this.visualRenderer = new CharacterVisualRenderer();
    this.container.addChild(this.visualRenderer.container);

    // 4. Initialize Foot Collider (34x18 px, centered at feet offset -17, -9)
    this.footCollider = new BoxCollider({
      id: `${this.id}_collider`,
      x: this.posX,
      y: this.posY,
      width: 34,
      height: 18,
      offsetX: -17,
      offsetY: -9,
      category: CollisionCategory.SOLID,
      isTrigger: false,
      tag: 'PLAYER',
      data: { character: this },
    });

    this.updatePosition(this.posX, this.posY);

    // Initial render pass
    this.visualRenderer.render(
      this.animationStateMachine.getState(),
      this.directionSelector.getFacing(),
      {
        frameIndex: 0,
        totalFrames: 8,
        normalizedTime: 0,
        isFirstFrame: true,
        isLastFrame: false,
      },
      0
    );
  }

  // ==================== ICameraTarget Implementation ====================

  public getPosition(): { x: number; y: number } {
    return { x: this.posX, y: this.posY };
  }

  public getVelocity(): { x: number; y: number } {
    return { x: this.velX, y: this.velY };
  }

  // ==================== State & Property Accessors ====================

  public get x(): number {
    return this.posX;
  }

  public get y(): number {
    return this.posY;
  }

  public getFacing(): FacingDirection {
    return this.directionSelector.getFacing();
  }

  public setFacing(facing: FacingDirection): void {
    this.directionSelector.setFacing(facing);
    this.animationStateMachine.setDirection(facing);
  }

  public getState(): CharacterAnimationState {
    return this.animationStateMachine.getState();
  }

  public setState(state: CharacterAnimationState): void {
    this.animationStateMachine.transitionTo(state);
  }

  public getCollider(): BoxCollider {
    return this.footCollider;
  }

  public getDepthY(): number {
    return this.posY; // Base foot Y for 2.5D depth sorting
  }

  public setVelocity(vx: number, vy: number): void {
    this.velX = vx;
    this.velY = vy;
  }

  public updatePosition(x: number, y: number): void {
    this.posX = x;
    this.posY = y;
    this.container.position.set(x, y);
    this.container.zIndex = Math.floor(y); // 2.5D depth sorting based on ground contact
    this.footCollider.setPosition(x, y);
  }

  public getAnimationStateMachine(): AnimationStateMachine {
    return this.animationStateMachine;
  }

  public getDirectionSelector(): DirectionSelector {
    return this.directionSelector;
  }

  public getVisualRenderer(): CharacterVisualRenderer {
    return this.visualRenderer;
  }

  // ==================== Scripted Animation Actions ====================

  /**
   * Play terminal typing / console interaction animation
   */
  public async playInteraction(durationSeconds: number = 1.2): Promise<void> {
    this.animationStateMachine.transitionTo(CharacterAnimationState.INTERACT, true);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.animationStateMachine.getState() === CharacterAnimationState.INTERACT) {
          this.animationStateMachine.transitionTo(CharacterAnimationState.IDLE, true);
        }
        resolve();
      }, durationSeconds * 1000);
    });
  }

  /**
   * Play entering building doorway fade transition
   */
  public async playEnterBuilding(durationSeconds: number = 0.8): Promise<void> {
    this.animationStateMachine.transitionTo(CharacterAnimationState.ENTER_BUILDING, true);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, durationSeconds * 1000);
    });
  }

  /**
   * Play exiting building doorway emerge transition
   */
  public async playExitBuilding(durationSeconds: number = 0.8): Promise<void> {
    this.animationStateMachine.transitionTo(CharacterAnimationState.EXIT_BUILDING, true);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.animationStateMachine.getState() === CharacterAnimationState.EXIT_BUILDING) {
          this.animationStateMachine.transitionTo(CharacterAnimationState.IDLE, true);
        }
        resolve();
      }, durationSeconds * 1000);
    });
  }

  // ==================== Frame-By-Frame Animation Update ====================

  public update(deltaSeconds: number): void {
    const speed = Math.hypot(this.velX, this.velY);
    const currentState = this.animationStateMachine.getState();

    // Do not override non-interruptible animations (like INTERACT or ENTER_BUILDING) unless moving strongly
    const isLockedInAction =
      currentState === CharacterAnimationState.INTERACT ||
      currentState === CharacterAnimationState.ENTER_BUILDING ||
      currentState === CharacterAnimationState.EXIT_BUILDING;

    if (!isLockedInAction || speed > 40) {
      if (speed > 10) {
        // 1. Update facing direction with hysteresis to eliminate diagonal jitter
        this.directionSelector.update(this.velX, this.velY);
        this.animationStateMachine.setDirection(this.directionSelector.getFacing());

        // 2. Select state based on movement speed
        const targetState = speed > 220 ? CharacterAnimationState.RUN : CharacterAnimationState.WALK;
        this.animationStateMachine.transitionTo(targetState);
      } else {
        // When stopping from run/walk, transition to STOP_TRANSITION or IDLE
        if (currentState === CharacterAnimationState.RUN || currentState === CharacterAnimationState.WALK) {
          this.animationStateMachine.transitionTo(CharacterAnimationState.IDLE);
        } else if (currentState === CharacterAnimationState.STOP_TRANSITION) {
          if (this.animationStateMachine.isAnimationCompleted()) {
            this.animationStateMachine.transitionTo(CharacterAnimationState.IDLE);
          }
        }
      }
    }

    // 3. Advance Animation State Machine timeline
    const frameInfo: AnimationFrameInfo = this.animationStateMachine.update(deltaSeconds, speed);

    // 4. Render Visuals
    this.visualRenderer.render(
      this.animationStateMachine.getState(),
      this.directionSelector.getFacing(),
      frameInfo,
      deltaSeconds
    );
  }

  public destroy(): void {
    this.visualRenderer.destroy();
    this.container.destroy({ children: true });
  }
}
