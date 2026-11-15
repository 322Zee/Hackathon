/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Central Camera System coordinating modes, zoom, bounds, smoothing, shake, and coordinate transformations
 */

import { Container } from 'pixi.js';
import { ICameraSystem } from '../systems/interfaces/CoreSystemInterfaces';
import { SystemId } from '../systems/interfaces/IGameSystem';
import { CameraBounds, CameraBoundsManager } from './CameraBounds';
import { CameraMode, CameraModeConfig, CAMERA_MODE_DEFAULTS, ZoomPreset } from './CameraMode';
import { CameraTargetTracker, ICameraTarget, LookaheadConfig } from './CameraTarget';
import { CameraShake } from './CameraShake';
import { CoordinateConverter, CameraStateView, Point2D } from './CoordinateConverter';
import { Viewport, WorldFrustum } from './Viewport';
import { VirtualResolution } from '../rendering/VirtualResolution';
import { LayerManager } from '../rendering/layers/LayerManager';
import { Logger } from '../core/logging/Logger';

export interface CameraTransitionOptions {
  durationSeconds?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

export class CameraSystem implements ICameraSystem {
  public readonly id = SystemId.CAMERA;
  public readonly priority = 12; // Updates after Input (10) and before Rendering (15)

  // Camera state
  private currentX: number = 0;
  private currentY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;

  private currentZoom: number = 1.0;
  private targetZoom: number = 1.0;

  private currentRotation: number = 0;
  private targetRotation: number = 0;

  private offsetX: number = 0;
  private offsetY: number = 0;

  // Active mode and configuration
  private mode: CameraMode = CameraMode.PLAYER_FOLLOW;
  private modeConfig: CameraModeConfig = { ...CAMERA_MODE_DEFAULTS[CameraMode.PLAYER_FOLLOW] };

  // Subsystems
  private bounds: CameraBounds | null = null;
  private targetTracker: CameraTargetTracker = new CameraTargetTracker();
  private shakeSystem: CameraShake = new CameraShake();
  private virtualResolution: VirtualResolution;
  private layerManager?: LayerManager;

  // Active transition
  private isTransitioning: boolean = false;
  private transitionTimer: number = 0;
  private transitionDuration: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private transitionOnComplete?: () => void;

  public clampToFrustum: boolean = false;

  constructor(
    virtualResolution?: VirtualResolution,
    initialX: number = 0,
    initialY: number = 0,
    initialZoom: number = 1.0
  ) {
    this.virtualResolution = virtualResolution ?? new VirtualResolution(1920, 1080);
    this.currentX = initialX;
    this.currentY = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
    this.currentZoom = initialZoom;
    this.targetZoom = initialZoom;

    Logger.info('CAMERA_SYSTEM', 'Camera System initialized.');
  }

  public initialize(): void {
    Logger.info('CAMERA_SYSTEM', `Camera registered in SystemRegistry (Mode: ${this.mode}).`);
  }

  public setLayerManager(layerManager: LayerManager): void {
    this.layerManager = layerManager;
  }

  public setMode(mode: CameraMode, customConfig?: Partial<CameraModeConfig>, immediateZoom: boolean = false): void {
    this.mode = mode;
    this.modeConfig = { ...CAMERA_MODE_DEFAULTS[mode], ...customConfig };
    this.targetZoom = Math.max(
      this.modeConfig.minZoom,
      Math.min(this.modeConfig.maxZoom, this.modeConfig.defaultZoom)
    );
    if (immediateZoom) {
      this.currentZoom = this.targetZoom;
    }
    Logger.info('CAMERA_SYSTEM', `Camera mode changed to: ${mode} (Zoom: ${this.targetZoom})`);
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public getModeConfig(): Readonly<CameraModeConfig> {
    return this.modeConfig;
  }

  public setTarget(target: ICameraTarget | null): void {
    this.targetTracker.setTarget(target);
  }

  public getTarget(): ICameraTarget | null {
    return this.targetTracker.getTarget();
  }

  public setDeadzone(width: number, height: number): void {
    this.targetTracker.setDeadzone(width, height);
  }

  public setLookahead(config: Partial<LookaheadConfig>): void {
    this.targetTracker.setLookahead(config);
  }

  public getTargetTracker(): CameraTargetTracker {
    return this.targetTracker;
  }

  public setBounds(bounds: CameraBounds | null): void {
    this.bounds = bounds;
  }

  public getBounds(): CameraBounds | null {
    return this.bounds;
  }

  public setPosition(x: number, y: number, immediate: boolean = false): void {
    this.targetX = x;
    this.targetY = y;
    if (immediate) {
      this.currentX = x;
      this.currentY = y;
    }
  }

  public setOffset(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  public setRotation(rotationRadians: number, immediate: boolean = false): void {
    this.targetRotation = rotationRadians;
    if (immediate) {
      this.currentRotation = rotationRadians;
    }
  }

  public setZoom(zoom: number, immediate: boolean = false): void {
    const clamped = Math.max(this.modeConfig.minZoom, Math.min(this.modeConfig.maxZoom, zoom));
    this.targetZoom = clamped;
    if (immediate) {
      this.currentZoom = clamped;
    }
  }

  public setZoomPreset(preset: ZoomPreset, immediate: boolean = false): void {
    this.setZoom(preset, immediate);
  }

  public zoomBy(factor: number): void {
    if (!this.modeConfig.allowManualZoom) return;
    this.setZoom(this.targetZoom * factor);
  }

  public panBy(deltaX: number, deltaY: number): void {
    if (!this.modeConfig.allowManualPan) return;
    this.targetX += deltaX / this.currentZoom;
    this.targetY += deltaY / this.currentZoom;
  }

  public panTo(x: number, y: number, options?: CameraTransitionOptions): void {
    const duration = options?.durationSeconds ?? 0.6;
    if (duration <= 0.01) {
      this.setPosition(x, y, true);
      options?.onComplete?.();
      return;
    }

    this.isTransitioning = true;
    this.transitionTimer = 0;
    this.transitionDuration = duration;
    this.startX = this.currentX;
    this.startY = this.currentY;
    this.targetX = x;
    this.targetY = y;
    this.transitionOnComplete = options?.onComplete;
  }

  public focusOn(targetOrPos: { x: number; y: number }, zoom?: number, options?: CameraTransitionOptions): void {
    if (typeof zoom === 'number') {
      this.setZoom(zoom, false);
    }
    this.panTo(targetOrPos.x, targetOrPos.y, options);
  }

  public reset(immediate: boolean = false): void {
    this.setPosition(0, 0, immediate);
    this.setZoom(this.modeConfig.defaultZoom, immediate);
    this.setRotation(0, immediate);
    this.setOffset(0, 0);
    this.shakeSystem.clear();
  }

  public shake(intensity: number): void {
    this.shakeSystem.addTrauma(intensity / 50); // Maps 0-50 intensity to 0-1 trauma
  }

  public addTrauma(trauma: number): void {
    this.shakeSystem.addTrauma(trauma);
  }

  public setReducedMotion(reducedMotion: boolean): void {
    this.shakeSystem.setConfig({ reducedMotion });
  }

  public setShakeIntensity(intensityMultiplier: number): void {
    this.shakeSystem.setConfig({ intensityMultiplier: Math.max(0, Math.min(1.0, intensityMultiplier)) });
  }

  public update(deltaSeconds: number): void {
    // 1. Process Active Transition
    if (this.isTransitioning) {
      this.transitionTimer += deltaSeconds;
      const progress = Math.min(1.0, this.transitionTimer / this.transitionDuration);
      // Smooth cubic ease-in-out
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.currentX = this.startX + (this.targetX - this.startX) * eased;
      this.currentY = this.startY + (this.targetY - this.startY) * eased;

      if (progress >= 1.0) {
        this.isTransitioning = false;
        this.transitionOnComplete?.();
        this.transitionOnComplete = undefined;
      }
    } else {
      // 2. Track Target Position if Target exists
      if (this.mode === CameraMode.PLAYER_FOLLOW || this.mode === CameraMode.PLANETARY_EXPLORATION || this.mode === CameraMode.HEADQUARTERS) {
        const desired = this.targetTracker.computeDesiredPosition(
          this.currentX,
          this.currentY,
          this.modeConfig.useDeadzone,
          this.modeConfig.useLookahead,
          deltaSeconds
        );
        this.targetX = desired.x + this.offsetX;
        this.targetY = desired.y + this.offsetY;
      }

      // 3. Smooth Camera Follow / Position Lerp
      const factor = Math.min(1.0, this.modeConfig.followSmoothing * (deltaSeconds * 60));
      this.currentX += (this.targetX - this.currentX) * factor;
      this.currentY += (this.targetY - this.currentY) * factor;
      this.currentZoom += (this.targetZoom - this.currentZoom) * factor;
      this.currentRotation += (this.targetRotation - this.currentRotation) * factor;
    }

    // 4. Update Camera Shake
    this.shakeSystem.update(deltaSeconds);

    // 5. Apply Bounds Clamping
    if (this.bounds) {
      if (this.clampToFrustum) {
        const vw = this.virtualResolution.getVirtualWidth();
        const vh = this.virtualResolution.getVirtualHeight();
        const clamped = CameraBoundsManager.clampFrustum(
          this.currentX,
          this.currentY,
          this.currentZoom,
          vw,
          vh,
          this.bounds
        );
        this.currentX = clamped.x;
        this.currentY = clamped.y;
      } else {
        const clamped = CameraBoundsManager.clampPoint(this.currentX, this.currentY, this.bounds);
        this.currentX = clamped.x;
        this.currentY = clamped.y;
      }
    }

    // 6. Connect Parallax Layers with RenderPipeline
    if (this.layerManager) {
      const effectiveX = this.currentX + this.shakeSystem.offsetX;
      const effectiveY = this.currentY + this.shakeSystem.offsetY;
      this.layerManager.applyCamera(effectiveX, effectiveY, this.currentZoom);
    }
  }

  public applyToContainer(container: Container, viewportCenterX?: number, viewportCenterY?: number): void {
    const cx = viewportCenterX ?? this.virtualResolution.getVirtualWidth() / 2;
    const cy = viewportCenterY ?? this.virtualResolution.getVirtualHeight() / 2;
    const effectiveX = this.currentX + this.shakeSystem.offsetX;
    const effectiveY = this.currentY + this.shakeSystem.offsetY;
    const effectiveRot = this.currentRotation + this.shakeSystem.offsetRotation;

    container.position.set(cx - effectiveX * this.currentZoom, cy - effectiveY * this.currentZoom);
    container.scale.set(this.currentZoom);
    container.rotation = effectiveRot;
  }

  public getStateView(): CameraStateView {
    return {
      x: this.currentX + this.shakeSystem.offsetX,
      y: this.currentY + this.shakeSystem.offsetY,
      zoom: this.currentZoom,
      rotation: this.currentRotation + this.shakeSystem.offsetRotation,
    };
  }

  public getVisibleFrustum(): WorldFrustum {
    return Viewport.getVisibleWorldFrustum(
      this.getStateView(),
      this.virtualResolution.getVirtualWidth(),
      this.virtualResolution.getVirtualHeight()
    );
  }

  public screenToWorld(
    screenX: number,
    screenY: number,
    viewportCenterX?: number,
    viewportCenterY?: number
  ): Point2D {
    if (typeof viewportCenterX === 'number' && typeof viewportCenterY === 'number') {
      return {
        x: this.currentX + (screenX - viewportCenterX) / this.currentZoom,
        y: this.currentY + (screenY - viewportCenterY) / this.currentZoom,
      };
    }
    return CoordinateConverter.screenToWorld(
      screenX,
      screenY,
      this.getStateView(),
      this.virtualResolution.getTransform()
    );
  }

  public worldToScreen(
    worldX: number,
    worldY: number,
    viewportCenterX?: number,
    viewportCenterY?: number
  ): Point2D {
    if (typeof viewportCenterX === 'number' && typeof viewportCenterY === 'number') {
      return {
        x: viewportCenterX + (worldX - this.currentX) * this.currentZoom,
        y: viewportCenterY + (worldY - this.currentY) * this.currentZoom,
      };
    }
    return CoordinateConverter.worldToScreen(
      worldX,
      worldY,
      this.getStateView(),
      this.virtualResolution.getTransform()
    );
  }

  public worldToVirtual(worldX: number, worldY: number): Point2D {
    return CoordinateConverter.worldToVirtual(
      worldX,
      worldY,
      this.getStateView(),
      this.virtualResolution.getVirtualWidth(),
      this.virtualResolution.getVirtualHeight()
    );
  }

  public virtualToWorld(virtualX: number, virtualY: number): Point2D {
    return CoordinateConverter.virtualToWorld(
      virtualX,
      virtualY,
      this.getStateView(),
      this.virtualResolution.getVirtualWidth(),
      this.virtualResolution.getVirtualHeight()
    );
  }

  public getPosition(): Point2D {
    return { x: this.currentX, y: this.currentY };
  }

  public getZoom(): number {
    return this.currentZoom;
  }

  public getRotation(): number {
    return this.currentRotation;
  }

  public shutdown(): void {
    Logger.info('CAMERA_SYSTEM', 'Camera System shutdown.');
  }
}
