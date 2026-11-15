import { describe, it, expect } from 'vitest';
import { DepthSystem } from '../../src/rendering/depth/DepthSystem';

describe('DepthSystem (2.5D Depth Simulation)', () => {
  it('computes 1.0 scale at focal plane (Z = 0)', () => {
    const depth = new DepthSystem({ focalDistance: 10 });
    expect(depth.calculateScale(0)).toBe(1.0);
  });

  it('computes smaller scale for distant background objects (Z > 0)', () => {
    const depth = new DepthSystem({ focalDistance: 10 });
    const scaleZ5 = depth.calculateScale(5); // 10 / (10 + 5) = 0.666...
    const scaleZ10 = depth.calculateScale(10); // 10 / (10 + 10) = 0.5

    expect(scaleZ5).toBeCloseTo(0.666, 2);
    expect(scaleZ10).toBe(0.5);
    expect(scaleZ10).toBeLessThan(scaleZ5);
  });

  it('computes larger scale for foreground objects (Z < 0)', () => {
    const depth = new DepthSystem({ focalDistance: 10 });
    const scaleZMinus2 = depth.calculateScale(-2); // 10 / (10 - 2) = 1.25
    expect(scaleZMinus2).toBe(1.25);
    expect(scaleZMinus2).toBeGreaterThan(1.0);
  });

  it('computes parallax factors where background moves slower and foreground moves faster', () => {
    const depth = new DepthSystem();
    const factorFar = depth.calculateParallaxFactor(8);
    const factorFocal = depth.calculateParallaxFactor(0);
    const factorNear = depth.calculateParallaxFactor(-3);

    expect(factorFocal).toBe(1.0);
    expect(factorFar).toBeLessThan(1.0);
    expect(factorNear).toBeGreaterThan(1.0);
  });

  it('interpolates atmospheric tint towards haze color as Z increases', () => {
    // Pure white base color, navy fog color
    const depth = new DepthSystem({
      maxDepth: 20,
      atmosphericFogColor: 0x0000ff,
      atmosphericFogDensity: 1.0,
    });

    const baseWhite = 0xffffff;
    const tintClose = depth.calculateAtmosphericTint(baseWhite, 0);
    const tintDistant = depth.calculateAtmosphericTint(baseWhite, 10);
    const tintFar = depth.calculateAtmosphericTint(baseWhite, 20);

    expect(tintClose).toBe(baseWhite); // Untouched in foreground
    expect(tintDistant).not.toBe(baseWhite);
    expect(tintFar & 0xff).toBe(0xff); // Blue channel preserved
    expect((tintFar >> 16) & 0xff).toBeLessThan(0xff); // Red channel shifted towards fog
  });

  it('applies depth transform directly to object scale and alpha', () => {
    const depth = new DepthSystem();
    const mockObject = {
      scale: {
        val: 1.0,
        set(s: number) {
          this.val = s;
        },
      },
      alpha: 1.0,
      tint: 0xffffff,
    };

    const result = depth.applyDepthToObject(mockObject, 10);
    expect(mockObject.scale.val).toBe(0.5);
    expect(result.scale).toBe(0.5);
    expect(mockObject.alpha).toBeLessThanOrEqual(1.0);
  });
});
