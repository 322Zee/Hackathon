import { describe, it, expect, vi } from 'vitest';
import { InteractiveObject } from '../../src/interaction/InteractiveObject';
import { InteractionCategory } from '../../src/interaction/InteractionTypes';
import { CharacterAnimationState } from '../../src/animation/AnimationTypes';

describe('InteractiveObject', () => {
  it('initializes with default values', () => {
    const obj = new InteractiveObject({
      id: 'lab_console',
      displayName: 'Bio Lab Console',
      x: 300,
      y: 400,
    });

    expect(obj.id).toBe('lab_console');
    expect(obj.displayName).toBe('Bio Lab Console');
    expect(obj.actionText).toBe('Access Bio Lab Console');
    expect(obj.category).toBe(InteractionCategory.EQUIPMENT);
    expect(obj.x).toBe(300);
    expect(obj.y).toBe(400);
    expect(obj.interactionRadius).toBe(80);
    expect(obj.priority).toBe(1);
    expect(obj.enabled).toBe(true);
    expect(obj.isOnCooldown()).toBe(false);
  });

  it('manages cooldown timers and prevents interaction while cooling down', () => {
    const obj = new InteractiveObject({
      id: 'fuel_depot',
      displayName: 'Cryo Fuel Valve',
      x: 100,
      y: 100,
      cooldownSeconds: 2.0,
    });

    expect(obj.isOnCooldown()).toBe(false);
    expect(obj.canInteract({ playerX: 100, playerY: 100, distance: 0 }).available).toBe(true);

    obj.triggerCooldown();
    expect(obj.isOnCooldown()).toBe(true);
    expect(obj.getRemainingCooldown()).toBeCloseTo(2.0);

    const checkBlocked = obj.canInteract({ playerX: 100, playerY: 100, distance: 0 });
    expect(checkBlocked.available).toBe(false);
    expect(checkBlocked.reason).toContain('Recharging');

    // Tick by 1.0s
    obj.update(1.0);
    expect(obj.isOnCooldown()).toBe(true);
    expect(obj.getRemainingCooldown()).toBeCloseTo(1.0);

    // Tick remaining 1.1s
    obj.update(1.1);
    expect(obj.isOnCooldown()).toBe(false);
    expect(obj.canInteract({ playerX: 100, playerY: 100, distance: 0 }).available).toBe(true);
  });

  it('evaluates requirements and blocks interaction when conditions are unmet', () => {
    const obj = new InteractiveObject({
      id: 'secure_vault',
      displayName: 'Secure Vault',
      x: 100,
      y: 100,
      requirements: [
        {
          type: 'CLEARANCE',
          description: 'Requires Clearance Level 3',
          evaluate: (ctx) => (ctx.clearanceLevel ?? 0) >= 3,
        },
      ],
    });

    // Clearance level 1: blocked
    const check1 = obj.canInteract({ playerX: 100, playerY: 100, distance: 0, clearanceLevel: 1 });
    expect(check1.available).toBe(false);
    expect(check1.reason).toBe('Requires Clearance Level 3');

    // Clearance level 3: available
    const check2 = obj.canInteract({ playerX: 100, playerY: 100, distance: 0, clearanceLevel: 3 });
    expect(check2.available).toBe(true);
  });

  it('executes custom interaction handler and triggers cooldown', async () => {
    const mockHandler = vi.fn().mockResolvedValue({
      success: true,
      action: 'TRIGGER_ACTION',
      message: 'Handler completed',
    });

    const obj = new InteractiveObject({
      id: 'scanner',
      displayName: 'Telemetry Scanner',
      x: 100,
      y: 100,
      cooldownSeconds: 3.0,
      customAnimation: CharacterAnimationState.INTERACT,
      onInteract: mockHandler,
    });

    const context = {
      player: { id: 'director' },
      object: obj,
    };

    const result = await obj.onInteract(context);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Handler completed');
    expect(mockHandler).toHaveBeenCalledWith(context);
    expect(obj.isOnCooldown()).toBe(true);
  });
});
