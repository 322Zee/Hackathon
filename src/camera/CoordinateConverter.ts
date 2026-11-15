/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Centralized Multi-Space Coordinate Conversion Pipeline
 * Converts bi-directionally between World, Camera, Virtual (1920x1080), and Physical Screen spaces
 */

import { ViewportTransform } from '../rendering/VirtualResolution';

export interface Point2D {
  x: number;
  y: number;
}

export interface CameraStateView {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export class CoordinateConverter {
  /**
   * Converts World coordinates to Camera-relative coordinates (unzoomed offset from center)
   */
  public static worldToCamera(worldX: number, worldY: number, camera: CameraStateView): Point2D {
    const dx = worldX - camera.x;
    const dy = worldY - camera.y;

    if (camera.rotation === 0) {
      return { x: dx, y: dy };
    }

    const cos = Math.cos(camera.rotation);
    const sin = Math.sin(camera.rotation);
    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos,
    };
  }

  /**
   * Converts Camera-relative coordinates to World coordinates
   */
  public static cameraToWorld(camX: number, camY: number, camera: CameraStateView): Point2D {
    if (camera.rotation === 0) {
      return {
        x: camera.x + camX,
        y: camera.y + camY,
      };
    }

    const cos = Math.cos(-camera.rotation);
    const sin = Math.sin(-camera.rotation);
    const rx = camX * cos - camY * sin;
    const ry = camX * sin + camY * cos;

    return {
      x: camera.x + rx,
      y: camera.y + ry,
    };
  }

  /**
   * Converts World coordinates to Virtual Screen space (canonical 1920x1080)
   * Used for placing HUD telemetry, docking brackets, and health bars over world objects
   */
  public static worldToVirtual(
    worldX: number,
    worldY: number,
    camera: CameraStateView,
    virtualWidth: number = 1920,
    virtualHeight: number = 1080
  ): Point2D {
    const cam = this.worldToCamera(worldX, worldY, camera);
    const centerX = virtualWidth / 2;
    const centerY = virtualHeight / 2;

    return {
      x: centerX + cam.x * camera.zoom,
      y: centerY + cam.y * camera.zoom,
    };
  }

  /**
   * Converts Virtual Screen space (1920x1080) to World coordinates
   */
  public static virtualToWorld(
    virtualX: number,
    virtualY: number,
    camera: CameraStateView,
    virtualWidth: number = 1920,
    virtualHeight: number = 1080
  ): Point2D {
    const centerX = virtualWidth / 2;
    const centerY = virtualHeight / 2;

    const unzoomedX = (virtualX - centerX) / camera.zoom;
    const unzoomedY = (virtualY - centerY) / camera.zoom;

    return this.cameraToWorld(unzoomedX, unzoomedY, camera);
  }

  /**
   * Converts Physical Screen coordinates (client mouse click px, py) to Virtual space (1920x1080)
   */
  public static screenToVirtual(
    screenX: number,
    screenY: number,
    transform: ViewportTransform
  ): Point2D {
    return {
      x: (screenX - transform.offsetX) / transform.scale,
      y: (screenY - transform.offsetY) / transform.scale,
    };
  }

  /**
   * Converts Virtual space coordinates (1920x1080) to Physical Screen pixels
   */
  public static virtualToScreen(
    virtualX: number,
    virtualY: number,
    transform: ViewportTransform
  ): Point2D {
    return {
      x: virtualX * transform.scale + transform.offsetX,
      y: virtualY * transform.scale + transform.offsetY,
    };
  }

  /**
   * Full pipeline: Physical Screen pixel (mouse input) to Game World coordinates
   */
  public static screenToWorld(
    screenX: number,
    screenY: number,
    camera: CameraStateView,
    transform: ViewportTransform
  ): Point2D {
    const virtual = this.screenToVirtual(screenX, screenY, transform);
    return this.virtualToWorld(
      virtual.x,
      virtual.y,
      camera,
      transform.virtualWidth,
      transform.virtualHeight
    );
  }

  /**
   * Full pipeline: Game World coordinates to Physical Screen pixels
   */
  public static worldToScreen(
    worldX: number,
    worldY: number,
    camera: CameraStateView,
    transform: ViewportTransform
  ): Point2D {
    const virtual = this.worldToVirtual(
      worldX,
      worldY,
      camera,
      transform.virtualWidth,
      transform.virtualHeight
    );
    return this.virtualToScreen(virtual.x, virtual.y, transform);
  }
}
