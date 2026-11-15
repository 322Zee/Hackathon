/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Viewport Frustum, Safe Area Boundaries, and World Visibility Culling
 */

import { CameraStateView, CoordinateConverter } from './CoordinateConverter';
import { ViewportTransform } from '../rendering/VirtualResolution';

export interface WorldFrustum {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface SafeAreaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Viewport {
  /**
   * Computes the bounding box of the game world currently visible through the camera
   */
  public static getVisibleWorldFrustum(
    camera: CameraStateView,
    virtualWidth: number = 1920,
    virtualHeight: number = 1080
  ): WorldFrustum {
    // Top-left, top-right, bottom-left, bottom-right in virtual screen space
    const p1 = CoordinateConverter.virtualToWorld(0, 0, camera, virtualWidth, virtualHeight);
    const p2 = CoordinateConverter.virtualToWorld(virtualWidth, 0, camera, virtualWidth, virtualHeight);
    const p3 = CoordinateConverter.virtualToWorld(0, virtualHeight, camera, virtualWidth, virtualHeight);
    const p4 = CoordinateConverter.virtualToWorld(virtualWidth, virtualHeight, camera, virtualWidth, virtualHeight);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Determines if a world coordinate point is visible inside the camera frustum (with optional padding margin)
   */
  public static isPointVisible(
    worldX: number,
    worldY: number,
    camera: CameraStateView,
    margin: number = 0,
    virtualWidth: number = 1920,
    virtualHeight: number = 1080
  ): boolean {
    const frustum = this.getVisibleWorldFrustum(camera, virtualWidth, virtualHeight);
    return (
      worldX >= frustum.minX - margin &&
      worldX <= frustum.maxX + margin &&
      worldY >= frustum.minY - margin &&
      worldY <= frustum.maxY + margin
    );
  }

  /**
   * Determines if a rectangular world bounding box intersects the camera frustum (frustum culling)
   */
  public static isRectVisible(
    rect: { x: number; y: number; width: number; height: number },
    camera: CameraStateView,
    margin: number = 0,
    virtualWidth: number = 1920,
    virtualHeight: number = 1080
  ): boolean {
    const frustum = this.getVisibleWorldFrustum(camera, virtualWidth, virtualHeight);
    const rMinX = rect.x;
    const rMaxX = rect.x + rect.width;
    const rMinY = rect.y;
    const rMaxY = rect.y + rect.height;

    return !(
      rMaxX < frustum.minX - margin ||
      rMinX > frustum.maxX + margin ||
      rMaxY < frustum.minY - margin ||
      rMinY > frustum.maxY + margin
    );
  }

  /**
   * Calculates safe UI area margins (e.g. 5% inset) on canonical 1920x1080 virtual resolution
   */
  public static getSafeArea(
    virtualWidth: number = 1920,
    virtualHeight: number = 1080,
    marginRatio: number = 0.05
  ): SafeAreaRect {
    const marginX = virtualWidth * marginRatio;
    const marginY = virtualHeight * marginRatio;

    return {
      x: marginX,
      y: marginY,
      width: virtualWidth - marginX * 2,
      height: virtualHeight - marginY * 2,
    };
  }

  /**
   * Computes letterbox or pillarbox dimensions based on physical window and virtual aspect ratio
   */
  public static getPillarboxBars(transform: ViewportTransform): {
    hasPillarbox: boolean;
    hasLetterbox: boolean;
    pillarboxWidth: number;
    letterboxHeight: number;
  } {
    return {
      hasPillarbox: transform.offsetX > 0,
      hasLetterbox: transform.offsetY > 0,
      pillarboxWidth: transform.offsetX,
      letterboxHeight: transform.offsetY,
    };
  }
}
