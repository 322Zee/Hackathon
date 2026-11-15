import { describe, it, expect } from 'vitest';
import { CoordinateConverter } from '../../src/camera/CoordinateConverter';
import { ViewportTransform } from '../../src/rendering/VirtualResolution';

describe('CoordinateConverter (Multi-Space Coordinate System)', () => {
  const defaultCamera = {
    x: 1000,
    y: 500,
    zoom: 1.0,
    rotation: 0,
  };

  it('converts world coordinates to camera-relative coordinates and back', () => {
    const worldPoint = { x: 1200, y: 700 };
    const camPoint = CoordinateConverter.worldToCamera(worldPoint.x, worldPoint.y, defaultCamera);

    expect(camPoint.x).toBe(200); // 1200 - 1000
    expect(camPoint.y).toBe(200); // 700 - 500

    const roundTrip = CoordinateConverter.cameraToWorld(camPoint.x, camPoint.y, defaultCamera);
    expect(roundTrip.x).toBe(worldPoint.x);
    expect(roundTrip.y).toBe(worldPoint.y);
  });

  it('rotates camera coordinates correctly when camera has rotation', () => {
    const rotatedCamera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      rotation: Math.PI / 2, // 90 deg clockwise
    };

    const worldPoint = { x: 100, y: 0 };
    const camPoint = CoordinateConverter.worldToCamera(worldPoint.x, worldPoint.y, rotatedCamera);

    expect(camPoint.x).toBeCloseTo(0, 4);
    expect(camPoint.y).toBeCloseTo(100, 4);

    const restored = CoordinateConverter.cameraToWorld(camPoint.x, camPoint.y, rotatedCamera);
    expect(restored.x).toBeCloseTo(100, 4);
    expect(restored.y).toBeCloseTo(0, 4);
  });

  it('converts world coordinates to virtual screen coordinates (1920x1080) and back', () => {
    // Camera is at (1000, 500), zoom 1.0. Virtual center is (960, 540)
    // Point at camera center (1000, 500) should project to virtual center (960, 540)
    const centerVirtual = CoordinateConverter.worldToVirtual(1000, 500, defaultCamera);
    expect(centerVirtual.x).toBe(960);
    expect(centerVirtual.y).toBe(540);

    // Round-trip
    const restoredWorld = CoordinateConverter.virtualToWorld(960, 540, defaultCamera);
    expect(restoredWorld.x).toBe(1000);
    expect(restoredWorld.y).toBe(500);

    // Zoomed in 2.0x
    const zoomedCamera = { ...defaultCamera, zoom: 2.0 };
    // Object offset by (+100, +50) in world -> in virtual: 960 + 100*2 = 1160, 540 + 50*2 = 640
    const zoomedVirtual = CoordinateConverter.worldToVirtual(1100, 550, zoomedCamera);
    expect(zoomedVirtual.x).toBe(1160);
    expect(zoomedVirtual.y).toBe(640);

    const zoomedRestored = CoordinateConverter.virtualToWorld(1160, 640, zoomedCamera);
    expect(zoomedRestored.x).toBe(1100);
    expect(zoomedRestored.y).toBe(550);
  });

  it('converts physical screen pixels (mouse clicks) to virtual screen coordinates with scaling and letterbox offsets', () => {
    const ultrawideTransform: ViewportTransform = {
      scale: 1.0,
      offsetX: 320, // Pillarbox left margin
      offsetY: 0,
      viewportWidth: 2560,
      viewportHeight: 1080,
      virtualWidth: 1920,
      virtualHeight: 1080,
    };

    // Click at center of 2560x1080 ultrawide monitor: (1280, 540)
    const virtual = CoordinateConverter.screenToVirtual(1280, 540, ultrawideTransform);
    expect(virtual.x).toBe(960);
    expect(virtual.y).toBe(540);

    const physical = CoordinateConverter.virtualToScreen(960, 540, ultrawideTransform);
    expect(physical.x).toBe(1280);
    expect(physical.y).toBe(540);
  });

  it('performs complete end-to-end screen-to-world conversion for mouse picking', () => {
    const customTransform: ViewportTransform = {
      scale: 0.5, // 960x540 display window
      offsetX: 0,
      offsetY: 0,
      viewportWidth: 960,
      viewportHeight: 540,
      virtualWidth: 1920,
      virtualHeight: 1080,
    };

    const camera = { x: 5000, y: 3000, zoom: 1.5, rotation: 0 };

    // Click at window center: (480, 270)
    const pickedWorld = CoordinateConverter.screenToWorld(480, 270, camera, customTransform);
    expect(pickedWorld.x).toBeCloseTo(5000, 2);
    expect(pickedWorld.y).toBeCloseTo(3000, 2);

    const screenPos = CoordinateConverter.worldToScreen(5000, 3000, camera, customTransform);
    expect(screenPos.x).toBeCloseTo(480, 2);
    expect(screenPos.y).toBeCloseTo(270, 2);
  });
});
