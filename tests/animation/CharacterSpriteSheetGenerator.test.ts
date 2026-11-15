import { describe, it, expect, afterEach } from 'vitest';
import { CharacterSpriteSheetGenerator } from '../../src/animation/CharacterSpriteSheetGenerator';
import { CharacterAnimationState, FacingDirection } from '../../src/animation/AnimationTypes';

describe('CharacterSpriteSheetGenerator', () => {
  afterEach(() => {
    CharacterSpriteSheetGenerator.clearCache();
  });

  it('provides canonical frame dimensions and foot anchor points', () => {
    const meta = CharacterSpriteSheetGenerator.getFrameMetadata(
      CharacterAnimationState.WALK,
      FacingDirection.SOUTH,
      2
    );

    expect(meta.width).toBe(48);
    expect(meta.height).toBe(72);
    expect(meta.anchorX).toBe(0.5);
    expect(meta.anchorY).toBe(0.95); // Foot contact ground position
  });

  it('safely generates or returns textures with headless test support', () => {
    const texture = CharacterSpriteSheetGenerator.getFrameTexture(
      CharacterAnimationState.IDLE,
      FacingDirection.SOUTH,
      0
    );

    expect(texture).toBeDefined();
    // In headless Node.js tests, gracefully returns Texture.WHITE
    expect(texture).toBeDefined();
  });

  it('caches generated textures and clears cache cleanly', () => {
    const tex1 = CharacterSpriteSheetGenerator.getFrameTexture(
      CharacterAnimationState.RUN,
      FacingDirection.EAST,
      1
    );
    const tex2 = CharacterSpriteSheetGenerator.getFrameTexture(
      CharacterAnimationState.RUN,
      FacingDirection.EAST,
      1
    );

    expect(tex1).toBe(tex2);

    expect(() => CharacterSpriteSheetGenerator.clearCache()).not.toThrow();
  });
});
