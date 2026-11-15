import { describe, it, expect } from 'vitest';
import { Camera2D } from '../../src/camera/Camera2D';

describe('Camera2D', () => {
  it('initializes with default coordinates and zoom', () => {
    const camera = new Camera2D(100, 200, 1.5);
    expect(camera.getPosition().x).toBe(100);
    expect(camera.getPosition().y).toBe(200);
    expect(camera.getZoom()).toBe(1.5);
  });

  it('clamps zoom to configured limits (min 0.2, max 5.0)', () => {
    const camera = new Camera2D(0, 0, 1.0);
    camera.setZoom(10.0, true);
    expect(camera.getZoom()).toBe(5.0);

    camera.setZoom(0.01, true);
    expect(camera.getZoom()).toBe(0.2);
  });

  it('pans camera correctly based on zoom scale', () => {
    const camera = new Camera2D(0, 0, 2.0);
    camera.panBy(100, 50); // deltaX / zoom -> 100 / 2 = 50
    camera.update(1.0); // complete smoothing
    expect(camera.getPosition().x).toBeCloseTo(50, 0);
    expect(camera.getPosition().y).toBeCloseTo(25, 0);
  });

  it('clamps position to boundary box', () => {
    const camera = new Camera2D(0, 0, 1.0);
    camera.setBounds({ minX: -500, maxX: 500, minY: -500, maxY: 500 });

    camera.setPosition(2000, -3000, true);
    camera.update(1.0);

    expect(camera.getPosition().x).toBe(500);
    expect(camera.getPosition().y).toBe(-500);
  });

  it('transforms screen to world coordinates and back', () => {
    const camera = new Camera2D(1000, 500, 2.0);
    const viewportCenterX = 960;
    const viewportCenterY = 540;

    // Center of screen should map to camera focus
    const worldPoint = camera.screenToWorld(viewportCenterX, viewportCenterY, viewportCenterX, viewportCenterY);
    expect(worldPoint.x).toBe(1000);
    expect(worldPoint.y).toBe(500);

    const screenPoint = camera.worldToScreen(worldPoint.x, worldPoint.y, viewportCenterX, viewportCenterY);
    expect(screenPoint.x).toBe(viewportCenterX);
    expect(screenPoint.y).toBe(viewportCenterY);
  });
});
