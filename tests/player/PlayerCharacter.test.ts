import { describe, it, expect } from 'vitest';
import { PlayerCharacter, FacingDirection, PlayerState } from '../../src/player/PlayerCharacter';
import { CharacterAnimationState } from '../../src/animation/AnimationTypes';

describe('PlayerCharacter', () => {
  it('initializes with default Mission Director state', () => {
    const player = new PlayerCharacter({ initialX: 500, initialY: 300 });

    expect(player.x).toBe(500);
    expect(player.y).toBe(300);
    expect(player.getFacing()).toBe(FacingDirection.SOUTH);
    expect(player.getState()).toBe(CharacterAnimationState.IDLE);
    expect(player.getDepthY()).toBe(300);
    expect(player.getAnimationStateMachine()).toBeDefined();
    expect(player.getDirectionSelector()).toBeDefined();
    expect(player.getVisualRenderer()).toBeDefined();
  });

  it('implements ICameraTarget interface correctly', () => {
    const player = new PlayerCharacter({ initialX: 200, initialY: 400 });
    player.setVelocity(50, -30);

    const pos = player.getPosition();
    expect(pos.x).toBe(200);
    expect(pos.y).toBe(400);

    const vel = player.getVelocity();
    expect(vel.x).toBe(50);
    expect(vel.y).toBe(-30);
  });

  it('updates foot collider when position changes', () => {
    const player = new PlayerCharacter({ initialX: 100, initialY: 100 });
    const col = player.getCollider();

    // Initial collider AABB
    expect(col.x).toBe(100);
    expect(col.y).toBe(100);

    // Update position
    player.updatePosition(350, 450);
    expect(col.x).toBe(350);
    expect(col.y).toBe(450);
    expect(player.container.zIndex).toBe(450); // 2.5D depth sorting
  });

  it('transitions state and facing direction based on velocity', () => {
    const player = new PlayerCharacter({ initialX: 0, initialY: 0 });

    // Moving East at walk speed
    player.setVelocity(100, 0);
    player.update(0.1);
    expect(player.getState()).toBe(CharacterAnimationState.WALK);
    expect(player.getFacing()).toBe(FacingDirection.EAST);

    // Moving West at sprint speed
    player.setVelocity(-250, 0);
    player.update(0.1);
    expect(player.getState()).toBe(CharacterAnimationState.RUN);
    expect(player.getState()).toBe(PlayerState.SPRINT);
    expect(player.getFacing()).toBe(FacingDirection.WEST);

    // Moving North
    player.setVelocity(0, -150);
    player.update(0.1);
    expect(player.getFacing()).toBe(FacingDirection.NORTH);

    // Moving South
    player.setVelocity(0, 150);
    player.update(0.1);
    expect(player.getFacing()).toBe(FacingDirection.SOUTH);

    // Stopped / Idle
    player.setVelocity(0, 0);
    player.update(0.1);
    expect(player.getState()).toBe(CharacterAnimationState.IDLE);
  });

  it('triggers interactive animations (interact, enter building, exit building)', async () => {
    const player = new PlayerCharacter();

    // Trigger interact
    const pInteract = player.playInteraction(0.05);
    expect(player.getState()).toBe(CharacterAnimationState.INTERACT);
    await pInteract;
    expect(player.getState()).toBe(CharacterAnimationState.IDLE);

    // Trigger enter building
    const pEnter = player.playEnterBuilding(0.05);
    expect(player.getState()).toBe(CharacterAnimationState.ENTER_BUILDING);
    await pEnter;

    // Trigger exit building
    const pExit = player.playExitBuilding(0.05);
    expect(player.getState()).toBe(CharacterAnimationState.EXIT_BUILDING);
    await pExit;
    expect(player.getState()).toBe(CharacterAnimationState.IDLE);
  });

  it('cleans up display hierarchy on destroy', () => {
    const player = new PlayerCharacter();
    expect(player.container.destroyed).toBe(false);

    player.destroy();
    expect(player.container.destroyed).toBe(true);
  });
});
