import { describe, it, expect } from 'vitest';
import { Viewport } from '../../src/camera/Viewport';
import { ViewportTransform } from '../../src/rendering/VirtualResolution';

describe('Viewport (Frustum Calculation & Visibility Culling)', () => {
  it('computes accurate world frustum bounds from camera center and zoom', () => {
    // Camera centered at (1000, 500) with zoom 1.0 on 1920x1080 display
    // Visible world width: 1920 -> [1000 - 960, 1000 + 960] = [40, 1960]
    // Visible world height: 1080 -> [500 - 540, 500 + 540] = [-40, 1040]
    const camera = { x: 1000, y: 500, zoom: 1.0, rotation: 0 };
    const frustum = Viewport.getVisibleWorldFrustum(camera, 1920, 1080);

    expect(frustum.minX).toBe(40);
    expect(frustum.maxX).toBe(1960);
    expect(frustum.minY).toBe(-40);
    expect(frustum.maxY).toBe(1040);
    expect(frustum.width).toBe(1920);
    expect(frustum.height).toBe(1080);
  });

  it('correctly determines whether world points are visible in frustum', () => {
    const camera = { x: 0, y: 0, zoom: 1.0, rotation: 0 };
    // Frustum is [-960, 960, -540, 540]

    expect(Viewport.isPointVisible(0, 0, camera)).toBe(true);
    expect(Viewport.isPointVisible(800, 400, camera)).toBe(true);
    expect(Viewport.isPointVisible(2000, 0, camera)).toBe(false);

    // With margin padding
    expect(Viewport.isPointVisible(1000, 0, camera, 0)).toBe(false);
    expect(Viewport.isPointVisible(1000, 0, camera, 100)).toBe(true);
  });

  it('determines rectangular bounding box intersection for frustum culling', () => {
    const camera = { x: 0, y: 0, zoom: 1.0, rotation: 0 };

    // Box completely inside: [100..300, 100..200]
    expect(Viewport.isRectVisible({ x: 100, y: 100, width: 200, height: 100 }, camera)).toBe(true);

    // Box partially intersecting edge: [900..1100, 0..100]
    expect(Viewport.isRectVisible({ x: 900, y: 0, width: 200, height: 100 }, camera)).toBe(true);

    // Box completely outside: [2000..2200, 0..100]
    expect(Viewport.isRectVisible({ x: 2000, y: 0, width: 200, height: 100 }, camera)).toBe(false);
  });

  it('computes 5% safe area margins on canonical 1920x1080 display', () => {
    const safeArea = Viewport.getSafeArea(1920, 1080, 0.05);

    expect(safeArea.x).toBe(96); // 1920 * 0.05
    expect(safeArea.y).toBe(54); // 1080 * 0.05
    expect(safeArea.width).toBe(1728); // 1920 - 96*2
    expect(safeArea.height).toBe(972); // 1080 - 54*2
  });

  it('detects pillarbox and letterbox offsets correctly', () => {
    const ultrawide: ViewportTransform = {
      scale: 1.0,
      offsetX: 320,
      offsetY: 0,
      viewportWidth: 2560,
      viewportHeight: 1080,
      virtualWidth: 1920,
      virtualHeight: 1080,
    };
    const pb = Viewport.getPillarboxBars(ultrawide);
    expect(pb.hasPillarbox).toBe(true);
    expect(pb.pillarboxWidth).toBe(320);
    expect(pb.hasLetterbox).toBe(false);
  });
});
