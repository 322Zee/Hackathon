import { describe, it, expect } from 'vitest';
import { CameraBoundsManager } from '../../src/camera/CameraBounds';

describe('CameraBounds (Boundary Clamping & Frustum Containment)', () => {
  const bounds = {
    minX: -1000,
    maxX: 3000,
    minY: -500,
    maxY: 1500,
  };

  it('clamps raw coordinates directly to min/max box', () => {
    const clamped = CameraBoundsManager.clampPoint(-2500, 5000, bounds);
    expect(clamped.x).toBe(-1000);
    expect(clamped.y).toBe(1500);
  });

  it('clamps camera center so the visible frustum stays inside bounds', () => {
    // Virtual resolution: 1920x1080. At zoom 1.0, half-width is 960, half-height is 540.
    // Minimum allowable cameraX: minX + 960 = -1000 + 960 = -40
    // Maximum allowable cameraX: maxX - 960 = 3000 - 960 = 2040
    // Minimum allowable cameraY: minY + 540 = -500 + 540 = 40
    // Maximum allowable cameraY: maxY - 540 = 1500 - 540 = 960

    const tooFarLeft = CameraBoundsManager.clampFrustum(-800, 500, 1.0, 1920, 1080, bounds);
    expect(tooFarLeft.x).toBe(-40);
    expect(tooFarLeft.y).toBe(500);

    const tooFarRight = CameraBoundsManager.clampFrustum(4000, 500, 1.0, 1920, 1080, bounds);
    expect(tooFarRight.x).toBe(2040);
    expect(tooFarRight.y).toBe(500);

    const tooFarUp = CameraBoundsManager.clampFrustum(500, -200, 1.0, 1920, 1080, bounds);
    expect(tooFarUp.x).toBe(500);
    expect(tooFarUp.y).toBe(40);
  });

  it('centers camera along an axis if bounds are smaller than visible screen', () => {
    const smallBounds = {
      minX: 100,
      maxX: 500, // Width 400 (smaller than 1920)
      minY: -500,
      maxY: 1500,
    };

    const clamped = CameraBoundsManager.clampFrustum(0, 500, 1.0, 1920, 1080, smallBounds);
    expect(clamped.x).toBe(300); // (100 + 500) / 2
  });
});
