import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerCharacter } from '../../src/player/PlayerCharacter';
import { MovementComponent } from '../../src/player/MovementComponent';
import { PlayerController } from '../../src/player/PlayerController';
import { InputManager } from '../../src/input/InputManager';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { BoxCollider } from '../../src/collision/BoxCollider';
import { CollisionCategory } from '../../src/collision/ColliderTypes';
import { EventBus } from '../../src/core/EventBus';

describe('PlayerController', () => {
  let character: PlayerCharacter;
  let movement: MovementComponent;
  let inputManager: InputManager;
  let collisionSystem: CollisionSystem;
  let eventBus: EventBus;
  let controller: PlayerController;

  const sendKeyDown = (code: string) => {
    (inputManager as any).handleKeyDown({ code } as any);
  };

  beforeEach(() => {
    eventBus = new EventBus();
    inputManager = new InputManager();
    inputManager.initialize();

    collisionSystem = new CollisionSystem({ eventBus });
    collisionSystem.initialize();

    character = new PlayerCharacter({ initialX: 100, initialY: 100 });
    collisionSystem.addCollider(character.getCollider());

    movement = new MovementComponent({
      walkSpeed: 200,
      acceleration: 10000,
      deceleration: 10000,
    });

    controller = new PlayerController({
      character,
      movement,
      inputManager,
      collisionSystem,
      eventBus,
    });
  });

  it('moves character when input action is active', () => {
    // Simulate KeyD pressed (MoveRight)
    sendKeyDown('KeyD');
    inputManager.update(0.016);

    controller.update(0.1);

    expect(character.x).toBeGreaterThan(100);
    expect(character.y).toBe(100);
  });

  it('respects input lock by freezing player movement', () => {
    // Simulate MoveRight pressed
    sendKeyDown('KeyD');
    inputManager.update(0.016);

    // Lock input
    inputManager.lockInput('Dialogue Active');
    expect(controller.isControllable()).toBe(false);

    controller.update(0.1);

    // Player position should remain unchanged
    expect(character.x).toBe(100);
    expect(character.y).toBe(100);
  });

  it('integrates with collision system to slide along obstacles', () => {
    // Place solid wall 30px to the right of character
    // Character foot collider is at center 100, width 34 (right edge = 117)
    // Wall at minX = 130
    const wall = new BoxCollider({
      id: 'test_wall',
      x: 130,
      y: 50,
      width: 40,
      height: 200,
      category: CollisionCategory.SOLID,
    });
    collisionSystem.addCollider(wall);

    // Press MoveRight and MoveDown
    sendKeyDown('KeyD');
    sendKeyDown('KeyS');
    inputManager.update(0.016);

    // Update for 0.5 seconds
    controller.update(0.5);

    // Right movement should be clamped against wall (130 - 17 = 113)
    expect(character.x).toBe(113);
    // Downward movement should have proceeded unimpeded!
    expect(character.y).toBeGreaterThan(100);
  });

  it('dispatches player:interact when pressing Interact over a trigger', () => {
    let interactTriggerName = '';
    eventBus.on('player:interact', (payload: any) => {
      interactTriggerName = payload.trigger.tag;
    });

    // Add trigger overlapping player
    const trigger = new BoxCollider({
      id: 'terminal',
      x: 90,
      y: 90,
      width: 40,
      height: 40,
      isTrigger: true,
      category: CollisionCategory.TRIGGER,
      tag: 'MISSION_TERMINAL',
    });
    collisionSystem.addCollider(trigger);

    // Press Interact key (KeyE)
    sendKeyDown('KeyE');
    controller.update(0.016);

    expect(interactTriggerName).toBe('MISSION_TERMINAL');
  });

  it('emits player:moved event when position changes', () => {
    let movedPayload: any = null;
    eventBus.on('player:moved', (payload: any) => {
      movedPayload = payload;
    });

    sendKeyDown('KeyW');
    inputManager.update(0.016);

    controller.update(0.1);

    expect(movedPayload).not.toBeNull();
    expect(movedPayload.y).toBeLessThan(100);
  });
});
