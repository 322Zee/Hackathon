/**
 * INTERSTELLAR CONTINUUM - Playable Character Controller
 * Central input handling, movement execution, collision sliding integration, and interaction dispatch
 */

import { PlayerCharacter } from './PlayerCharacter';
import { MovementComponent } from './MovementComponent';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { CollisionSystem } from '../collision/CollisionSystem';
import { EventBus } from '../core/EventBus';

export interface PlayerControllerConfig {
  character: PlayerCharacter;
  movement?: MovementComponent;
  inputManager: InputManager;
  collisionSystem?: CollisionSystem;
  eventBus?: EventBus;
}

export class PlayerController {
  public readonly character: PlayerCharacter;
  public readonly movement: MovementComponent;
  private inputManager: InputManager;
  private collisionSystem?: CollisionSystem;
  private eventBus?: EventBus;

  private controllable: boolean = true;

  constructor(config: PlayerControllerConfig) {
    this.character = config.character;
    this.movement = config.movement ?? new MovementComponent();
    this.inputManager = config.inputManager;
    this.collisionSystem = config.collisionSystem;
    this.eventBus = config.eventBus;
  }

  public setControllable(controllable: boolean): void {
    this.controllable = controllable;
    if (!controllable) {
      this.movement.stop();
      this.character.setVelocity(0, 0);
    }
  }

  public isControllable(): boolean {
    return this.controllable && !this.inputManager.isInputLocked();
  }

  public setCollisionSystem(collisionSystem: CollisionSystem): void {
    this.collisionSystem = collisionSystem;
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  public update(deltaSeconds: number): void {
    let inputX = 0;
    let inputY = 0;
    let isSprinting = false;

    const canControl = this.controllable && !this.inputManager.isInputLocked();

    if (canControl) {
      // 1. Gather directional inputs
      if (this.inputManager.isActionActive(InputAction.MoveRight)) inputX += 1;
      if (this.inputManager.isActionActive(InputAction.MoveLeft)) inputX -= 1;
      if (this.inputManager.isActionActive(InputAction.MoveDown)) inputY += 1;
      if (this.inputManager.isActionActive(InputAction.MoveUp)) inputY -= 1;

      // 2. Gather sprint input
      isSprinting = this.inputManager.isActionActive(InputAction.Sprint);

      // 3. Handle Interaction check
      if (this.inputManager.isActionJustPressed(InputAction.Interact)) {
        this.triggerInteraction();
      }
    }

    // 4. Update velocity and compute desired displacement
    const { deltaX, deltaY, vx, vy } = this.movement.update(
      inputX,
      inputY,
      isSprinting,
      deltaSeconds
    );

    const prevX = this.character.x;
    const prevY = this.character.y;

    // 5. Apply Collision Resolution (if system present)
    if (this.collisionSystem && (deltaX !== 0 || deltaY !== 0)) {
      const resolution = this.collisionSystem.resolveMovement(
        prevX,
        prevY,
        deltaX,
        deltaY,
        this.character.getCollider()
      );

      // Slide resolution: if collided on X, zero out horizontal velocity
      let finalVx = vx;
      let finalVy = vy;

      if (resolution.collidedX) {
        finalVx = 0;
      }
      if (resolution.collidedY) {
        finalVy = 0;
      }

      this.movement.setVelocity(finalVx, finalVy);
      this.character.setVelocity(finalVx, finalVy);
      this.character.updatePosition(resolution.x, resolution.y);
    } else {
      this.character.setVelocity(vx, vy);
      this.character.updatePosition(prevX + deltaX, prevY + deltaY);
    }

    // 6. Update Character animation cycle and visual state
    this.character.update(deltaSeconds);

    // 7. Emit position changed event if moved
    if (this.eventBus && (this.character.x !== prevX || this.character.y !== prevY)) {
      this.eventBus.emit('player:moved', {
        x: this.character.x,
        y: this.character.y,
        vx: this.character.getVelocity().x,
        vy: this.character.getVelocity().y,
        facing: this.character.getFacing(),
        state: this.character.getState(),
      });
    }
  }

  /**
   * Check for nearby interaction triggers and dispatch interaction event
   */
  public triggerInteraction(): void {
    if (!this.collisionSystem) return;

    const overlaps = this.collisionSystem.checkOverlaps(this.character.getCollider());
    const triggers = overlaps.filter((c) => c.isTrigger);

    if (triggers.length > 0) {
      const primaryTrigger = triggers[0];
      // Play terminal interaction animation on character
      this.character.playInteraction(1.2);

      if (this.eventBus) {
        this.eventBus.emit('player:interact', {
          player: this.character,
          trigger: primaryTrigger,
          allTriggers: triggers,
        });
      }
    }
  }
}
