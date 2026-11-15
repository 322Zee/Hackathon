/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Procedural Texture Generator
 * Creates anti-aliased procedural textures for celestial bodies, particle glows, grids, and placeholder fallbacks
 */

import { Texture } from 'pixi.js';

export class ProceduralTextures {
  private static isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  /**
   * Generates a 2x2 magenta/black checkerboard fallback texture for missing assets
   */
  public static createMissingTexturePlaceholder(): Texture {
    if (!this.isBrowser()) return Texture.WHITE;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ff00ff'; // Vibrant magenta
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillRect(16, 16, 16, 16);
    }
    return Texture.from(canvas);
  }

  /**
   * Creates a radial gradient glow texture (ideal for point lights, engine plumes, and thruster sparks)
   */
  public static createRadialGlowTexture(size: number = 64, innerColor: string = '#ffffff', outerColor: string = '#38bdf8'): Texture {
    if (!this.isBrowser()) return Texture.WHITE;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const radius = size / 2;
      const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      gradient.addColorStop(0.0, innerColor);
      gradient.addColorStop(0.4, outerColor);
      gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    return Texture.from(canvas);
  }

  /**
   * Creates a multi-band procedural planet texture
   */
  public static createPlanetTexture(
    size: number = 256,
    baseColor: string = '#c2410c', // Mars rust
    accentColor: string = '#ea580c',
    polarColor: string = '#fed7aa'
  ): Texture {
    if (!this.isBrowser()) return Texture.WHITE;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const radius = size / 2;

      // Base planetary sphere with shadow
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Atmospheric latitude bands
      ctx.fillStyle = accentColor;
      for (let i = 0; i < 6; i++) {
        const bandY = radius * 0.4 + i * (size * 0.1);
        ctx.fillRect(radius * 0.1, bandY, size * 0.8, size * 0.04);
      }

      // Polar ice cap
      ctx.beginPath();
      ctx.arc(radius, radius * 0.25, radius * 0.35, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.fillStyle = polarColor;
      ctx.fill();

      // Shading sphere overlay (crescent darkness)
      const shadowGrad = ctx.createRadialGradient(
        radius * 0.65,
        radius * 0.65,
        radius * 0.1,
        radius,
        radius,
        radius
      );
      shadowGrad.addColorStop(0.0, 'rgba(255,255,255,0.25)');
      shadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
      shadowGrad.addColorStop(1.0, 'rgba(0,0,0,0.85)');

      ctx.beginPath();
      ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();
    }
    return Texture.from(canvas);
  }

  /**
   * Creates a grid texture for facility floors and orbital telemetry planes
   */
  public static createGridTexture(cellSize: number = 64, lineColor: string = '#1e293b'): Texture {
    if (!this.isBrowser()) return Texture.WHITE;

    const canvas = document.createElement('canvas');
    canvas.width = cellSize;
    canvas.height = cellSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, cellSize - 1, cellSize - 1);
    }
    return Texture.from(canvas);
  }
}
