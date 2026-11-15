import { describe, it, expect, vi } from 'vitest';
import { AnimationStateMachine } from '../../src/animation/AnimationStateMachine';
import { CharacterAnimationState, FacingDirection } from '../../src/animation/AnimationTypes';

describe('AnimationStateMachine', () => {
  it('initializes in IDLE state facing SOUTH by default', () => {
    const sm = new AnimationStateMachine();
    expect(sm.getState()).toBe(CharacterAnimationState.IDLE);
    expect(sm.getDirection()).toBe(FacingDirection.SOUTH);
    expect(sm.getFrameIndex()).toBe(0);
    expect(sm.getNormalizedTime()).toBe(0);
  });

  it('transitions between states cleanly', () => {
    const sm = new AnimationStateMachine();
    const enterFn = vi.fn();
    const exitFn = vi.fn();

    sm.setEvents({
      onStateEnter: enterFn,
      onStateExit: exitFn,
    });

    const success = sm.transitionTo(CharacterAnimationState.WALK);
    expect(success).toBe(true);
    expect(sm.getState()).toBe(CharacterAnimationState.WALK);
    expect(exitFn).toHaveBeenCalledWith(CharacterAnimationState.IDLE, FacingDirection.SOUTH);
    expect(enterFn).toHaveBeenCalledWith(CharacterAnimationState.WALK, FacingDirection.SOUTH);
  });

  it('cycles through frames and advances normalized time', () => {
    const sm = new AnimationStateMachine(CharacterAnimationState.WALK);
    const config = sm.getConfig(CharacterAnimationState.WALK);
    const totalDuration = config.frameCount / config.fps;

    // Advance by half duration
    const halfInfo = sm.update(totalDuration * 0.5);
    expect(halfInfo.normalizedTime).toBeCloseTo(0.5, 1);
    expect(halfInfo.frameIndex).toBe(Math.floor(config.frameCount * 0.5));
  });

  it('synchronizes playback rate with actual movement speed without foot sliding', () => {
    const sm = new AnimationStateMachine(CharacterAnimationState.WALK);
    const config = sm.getConfig(CharacterAnimationState.WALK);
    const baseDuration = config.frameCount / config.fps;

    // When actualSpeed is half baseSpeed (90 vs 180), speed factor is 0.5
    // Advancing by baseDuration * 0.5 at half speed should only advance by 25% of cycle
    const frameInfo = sm.update(baseDuration * 0.5, 90);
    expect(frameInfo.normalizedTime).toBeCloseTo(0.25, 1);

    // When actualSpeed is double (360 vs 180), speed factor is 2.0
    // Advancing by baseDuration * 0.25 at double speed should advance by 50%
    const frameInfo2 = sm.update(baseDuration * 0.25, 360);
    expect(frameInfo2.normalizedTime).toBeCloseTo(0.75, 1);
  });

  it('notifies onLoop for looping animations and onComplete for non-looping animations', () => {
    const loopFn = vi.fn();
    const completeFn = vi.fn();

    // 1. Looping WALK
    const walkSm = new AnimationStateMachine(CharacterAnimationState.WALK);
    walkSm.setEvents({ onLoop: loopFn });
    const walkConfig = walkSm.getConfig(CharacterAnimationState.WALK);
    const walkDuration = walkConfig.frameCount / walkConfig.fps;

    walkSm.update(walkDuration * 1.5);
    expect(loopFn).toHaveBeenCalledWith(1);
    expect(walkSm.isAnimationCompleted()).toBe(false);

    // 2. Non-looping INTERACT
    const interactSm = new AnimationStateMachine(CharacterAnimationState.INTERACT);
    interactSm.setEvents({ onComplete: completeFn });
    const interactConfig = interactSm.getConfig(CharacterAnimationState.INTERACT);
    const interactDuration = interactConfig.frameCount / interactConfig.fps;

    interactSm.update(interactDuration * 1.1);
    expect(completeFn).toHaveBeenCalledWith(CharacterAnimationState.INTERACT);
    expect(interactSm.isAnimationCompleted()).toBe(true);
  });

  it('respects non-interruptible animations from lower-priority transitions', () => {
    const sm = new AnimationStateMachine(CharacterAnimationState.INTERACT);
    // INTERACT is priority 3, canInterrupt: false
    // WALK is priority 1

    const transitioned = sm.transitionTo(CharacterAnimationState.WALK);
    expect(transitioned).toBe(false);
    expect(sm.getState()).toBe(CharacterAnimationState.INTERACT);

    // Force transition allows override
    const forceTransitioned = sm.transitionTo(CharacterAnimationState.WALK, true);
    expect(forceTransitioned).toBe(true);
    expect(sm.getState()).toBe(CharacterAnimationState.WALK);
  });
});
