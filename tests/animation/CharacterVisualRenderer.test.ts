import { describe, it, expect } from 'vitest';
import { CharacterVisualRenderer } from '../../src/animation/CharacterVisualRenderer';
import { CharacterAnimationState, FacingDirection } from '../../src/animation/AnimationTypes';

describe('CharacterVisualRenderer', () => {
  it('instantiates display tree with ground shadow and layered body parts', () => {
    const renderer = new CharacterVisualRenderer();
    expect(renderer.container).toBeDefined();
    expect(renderer.container.children.length).toBeGreaterThanOrEqual(3); // shadow, contactFx, bodyContainer
  });

  it('renders all animation states without throwing runtime errors', () => {
    const renderer = new CharacterVisualRenderer();
    const states = [
      CharacterAnimationState.IDLE,
      CharacterAnimationState.WALK,
      CharacterAnimationState.RUN,
      CharacterAnimationState.INTERACT,
      CharacterAnimationState.ENTER_BUILDING,
      CharacterAnimationState.EXIT_BUILDING,
      CharacterAnimationState.STOP_TRANSITION,
    ];

    for (const state of states) {
      expect(() => {
        renderer.render(
          state,
          FacingDirection.SOUTH,
          {
            frameIndex: 0,
            totalFrames: 8,
            normalizedTime: 0.5,
            isFirstFrame: false,
            isLastFrame: false,
          },
          0.016
        );
      }).not.toThrow();
    }
  });

  it('renders all 4 facing directions correctly', () => {
    const renderer = new CharacterVisualRenderer();
    const directions = [
      FacingDirection.NORTH,
      FacingDirection.SOUTH,
      FacingDirection.EAST,
      FacingDirection.WEST,
    ];

    for (const dir of directions) {
      expect(() => {
        renderer.render(
          CharacterAnimationState.WALK,
          dir,
          {
            frameIndex: 2,
            totalFrames: 8,
            normalizedTime: 0.25,
            isFirstFrame: false,
            isLastFrame: false,
          },
          0.016
        );
      }).not.toThrow();
    }
  });

  it('cleans up visual hierarchy on destroy', () => {
    const renderer = new CharacterVisualRenderer();
    expect(renderer.container.destroyed).toBe(false);

    renderer.destroy();
    expect(renderer.container.destroyed).toBe(true);
  });
});
