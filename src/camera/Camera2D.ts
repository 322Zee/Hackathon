/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Camera2D: Legacy compatible camera interface extending the unified CameraSystem
 */

import { CameraSystem } from './CameraSystem';
import { CameraMode } from './CameraMode';

export type { CameraBounds } from './CameraBounds';

export class Camera2D extends CameraSystem {
  constructor(initialX: number = 0, initialY: number = 0, initialZoom: number = 1.0) {
    super(undefined, initialX, initialY, initialZoom);
    this.setMode(CameraMode.FREE, { minZoom: 0.2, maxZoom: 5.0 });
  }
}
