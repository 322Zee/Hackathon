/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Camera World Boundaries & Frustum Clamping
 */

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class CameraBoundsManager {
  /**
   * Clamps a raw coordinate pair to the boundary box
   */
  public static clampPoint(x: number, y: number, bounds: CameraBounds): { x: number; y: number } {
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
  }

  /**
   * Clamps the camera focal center such that the visible viewport frustum
   * stays strictly inside the world boundaries.
   *
   * If the bounds are narrower/shorter than the visible viewport, centers
   * the camera along that axis to avoid black bar distortion.
   */
  public static clampFrustum(
    x: number,
    y: number,
    zoom: number,
    viewportWidth: number,
    viewportHeight: number,
    bounds: CameraBounds
  ): { x: number; y: number } {
    const halfVisibleWidth = (viewportWidth / 2) / zoom;
    const halfVisibleHeight = (viewportHeight / 2) / zoom;

    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;

    let clampedX: number;
    let clampedY: number;

    // Horizontal clamping
    if (boundsWidth <= halfVisibleWidth * 2) {
      // Bounds smaller than visible screen: center camera
      clampedX = bounds.minX + boundsWidth / 2;
    } else {
      const minCameraX = bounds.minX + halfVisibleWidth;
      const maxCameraX = bounds.maxX - halfVisibleWidth;
      clampedX = Math.max(minCameraX, Math.min(maxCameraX, x));
    }

    // Vertical clamping
    if (boundsHeight <= halfVisibleHeight * 2) {
      clampedY = bounds.minY + boundsHeight / 2;
    } else {
      const minCameraY = bounds.minY + halfVisibleHeight;
      const maxCameraY = bounds.maxY - halfVisibleHeight;
      clampedY = Math.max(minCameraY, Math.min(maxCameraY, y));
    }

    return { x: clampedX, y: clampedY };
  }
}
