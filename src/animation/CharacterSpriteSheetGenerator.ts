/**
 * INTERSTELLAR CONTINUUM - Character Sprite Sheet & Frame Cache
 * Manages frame dimensions, metadata, procedural rasterization, and GPU texture caching
 */

import { Texture } from 'pixi.js';
import { CharacterAnimationState, FacingDirection } from './AnimationTypes';

export interface FrameMetadata {
  state: CharacterAnimationState;
  direction: FacingDirection;
  frameIndex: number;
  width: number;
  height: number;
  anchorX: number; // Pivot x (e.g. 0.5 center)
  anchorY: number; // Pivot y (e.g. 1.0 feet)
}

export class CharacterSpriteSheetGenerator {
  public static readonly FRAME_WIDTH = 48;
  public static readonly FRAME_HEIGHT = 72;
  public static readonly ANCHOR_X = 0.5;
  public static readonly ANCHOR_Y = 0.95; // Ground contact point at character feet

  private static textureCache: Map<string, Texture> = new Map();

  private static cacheKey(state: CharacterAnimationState, direction: FacingDirection, frameIndex: number): string {
    return `${state}_${direction}_${frameIndex}`;
  }

  /**
   * Get metadata describing canonical frame boundaries and pivot points
   */
  public static getFrameMetadata(
    state: CharacterAnimationState,
    direction: FacingDirection,
    frameIndex: number
  ): FrameMetadata {
    return {
      state,
      direction,
      frameIndex,
      width: this.FRAME_WIDTH,
      height: this.FRAME_HEIGHT,
      anchorX: this.ANCHOR_X,
      anchorY: this.ANCHOR_Y,
    };
  }

  /**
   * Generate or retrieve cached texture for a specific animation state and frame
   * Safely returns Texture.WHITE in headless environments where document is undefined
   */
  public static getFrameTexture(
    state: CharacterAnimationState,
    direction: FacingDirection,
    frameIndex: number
  ): Texture {
    const key = this.cacheKey(state, direction, frameIndex);
    const existing = this.textureCache.get(key);
    if (existing) {
      return existing;
    }

    // Headless / non-DOM safety
    if (typeof document === 'undefined') {
      const fallback = Texture.WHITE;
      this.textureCache.set(key, fallback);
      return fallback;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.FRAME_WIDTH;
      canvas.height = this.FRAME_HEIGHT;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return Texture.WHITE;
      }

      // Draw stylized placeholder silhouette into texture
      ctx.fillStyle = '#1b2838'; // Navy
      ctx.fillRect(14, 20, 20, 26); // Torso

      ctx.fillStyle = '#2d3748'; // Trousers
      ctx.fillRect(16, 46, 7, 20); // Left leg
      ctx.fillRect(25, 46, 7, 20); // Right leg

      ctx.fillStyle = '#ebcbb0'; // Skin
      ctx.beginPath();
      ctx.arc(24, 14, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00f0ff'; // Cyan badge
      ctx.fillRect(23, 28, 4, 6);

      const texture = Texture.from(canvas);
      this.textureCache.set(key, texture);
      return texture;
    } catch {
      return Texture.WHITE;
    }
  }

  /**
   * Clear cached textures to release GPU memory
   */
  public static clearCache(): void {
    for (const texture of this.textureCache.values()) {
      if (texture !== Texture.WHITE && !texture.destroyed) {
        texture.destroy(true);
      }
    }
    this.textureCache.clear();
  }
}
