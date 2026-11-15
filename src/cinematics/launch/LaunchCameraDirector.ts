/**
 * INTERSTELLAR CONTINUUM - Launch Camera Director
 * Coordinates cinematic camera panning, stage-based focal tracking, zoom easing,
 * and quadratic trauma-based screen shake with accessibility controls.
 */

import { Container } from 'pixi.js';
import { CameraShake } from '../../camera/CameraShake';
import { LaunchCinematicStage, CinematicLaunchSettings } from './LaunchCinematicTypes';

export interface CameraWaypoint {
  x: number;
  y: number;
  zoom: number;
}

export class LaunchCameraDirector {
  private targetContainer: Container;
  private cameraShake: CameraShake;

  // Camera focal coordinates
  private currentX: number = 960;
  private currentY: number = 540;
  private targetX: number = 960;
  private targetY: number = 540;

  // Zoom
  private currentZoom: number = 1.0;
  private targetZoom: number = 1.0;

  // Smoothing speed factor
  private panSmoothFactor: number = 4.5;
  private zoomSmoothFactor: number = 3.0;

  // Screen center anchor (virtual resolution 1920x1080)
  private readonly centerX: number = 960;
  private readonly centerY: number = 540;

  // Accessibility flags
  private reducedMotion: boolean = false;
  private shakeIntensityMultiplier: number = 1.0;

  constructor(targetContainer: Container, settings?: Partial<CinematicLaunchSettings>) {
    this.targetContainer = targetContainer;
    this.reducedMotion = settings?.reducedMotion ?? false;
    this.shakeIntensityMultiplier = settings?.cameraShakeIntensity ?? 1.0;

    this.cameraShake = new CameraShake({
      maxTranslationOffset: 28,
      maxRotationAngle: 0.03,
      decayRate: 1.5,
      frequency: 24,
      intensityMultiplier: this.reducedMotion ? 0 : this.shakeIntensityMultiplier,
      reducedMotion: this.reducedMotion,
    });

    this.snapTo(960, 680, 0.95);
  }

  public updateSettings(settings: Partial<CinematicLaunchSettings>): void {
    if (settings.reducedMotion !== undefined) {
      this.reducedMotion = settings.reducedMotion;
    }
    if (settings.cameraShakeIntensity !== undefined) {
      this.shakeIntensityMultiplier = settings.cameraShakeIntensity;
    }
    this.cameraShake.setConfig({
      reducedMotion: this.reducedMotion,
      intensityMultiplier: this.reducedMotion ? 0 : this.shakeIntensityMultiplier,
    });
  }

  /**
   * Instantly snaps camera to coordinates
   */
  public snapTo(x: number, y: number, zoom: number = 1.0): void {
    this.currentX = x;
    this.currentY = y;
    this.targetX = x;
    this.targetY = y;
    this.currentZoom = zoom;
    this.targetZoom = zoom;
    this.applyTransform();
  }

  /**
   * Smoothly pans and zooms towards target waypoint
   */
  public setTarget(x: number, y: number, zoom: number = 1.0): void {
    this.targetX = x;
    this.targetY = y;
    this.targetZoom = zoom;
  }

  /**
   * Adjust camera target based on active cinematic stage and vehicle position
   */
  public onStageChanged(stage: LaunchCinematicStage, vehicleY: number): void {
    switch (stage) {
      case LaunchCinematicStage.CONFIRMATION:
        this.setTarget(960, 680, 0.95);
        break;

      case LaunchCinematicStage.APPROACH:
        this.setTarget(960, 620, 1.2);
        break;

      case LaunchCinematicStage.ATMOSPHERE:
      case LaunchCinematicStage.COUNTDOWN:
        // Heroic low angle focusing on rocket core and pad
        this.setTarget(960, 590, 1.35);
        break;

      case LaunchCinematicStage.IGNITION:
      case LaunchCinematicStage.EXHAUST_EXPANSION:
      case LaunchCinematicStage.CAMERA_RUMBLE:
        // Tight on engine nozzles with violent vibration
        this.setTarget(960, 670, 1.45);
        this.addTrauma(0.85);
        break;

      case LaunchCinematicStage.LIFTOFF_ASCENT:
        // Tracking camera following vehicle upward with slight lookahead
        this.setTarget(960, vehicleY - 120, 1.15);
        this.addTrauma(0.5);
        break;

      case LaunchCinematicStage.SKY_TRANSITION:
        // Pull back wide as vehicle pierces cloud deck
        this.setTarget(960, vehicleY - 80, 0.85);
        this.addTrauma(0.25);
        break;

      case LaunchCinematicStage.SPACE_REACH:
      case LaunchCinematicStage.MISSION_HANDOFF:
      case LaunchCinematicStage.COMPLETED:
        // Wide orbital vista framing vehicle climbing into starfield
        this.setTarget(960, vehicleY - 40, 0.65);
        break;
    }
  }

  /**
   * Adds trauma to camera shake (quadratic falloff)
   */
  public addTrauma(amount: number): void {
    if (!this.reducedMotion) {
      this.cameraShake.addTrauma(amount);
    }
  }

  public getTrauma(): number {
    return this.cameraShake.getTrauma();
  }

  /**
   * Per-frame camera tracking update and screen shake integration
   */
  public update(deltaSeconds: number): void {
    // 1. Smooth exponential pan towards target
    const panLerp = Math.min(1.0, deltaSeconds * this.panSmoothFactor);
    this.currentX += (this.targetX - this.currentX) * panLerp;
    this.currentY += (this.targetY - this.currentY) * panLerp;

    // 2. Smooth zoom interpolation
    const zoomLerp = Math.min(1.0, deltaSeconds * this.zoomSmoothFactor);
    this.currentZoom += (this.targetZoom - this.currentZoom) * zoomLerp;

    // 3. Update trauma shake
    this.cameraShake.update(deltaSeconds);

    this.applyTransform();
  }

  /**
   * Applies final camera viewport matrix to target container
   */
  private applyTransform(): void {
    // Shake offsets
    const shakeX = this.cameraShake.offsetX;
    const shakeY = this.cameraShake.offsetY;
    const shakeRot = this.cameraShake.offsetRotation;

    // Anchor camera around screen center (960, 540)
    const effectiveX = this.currentX + shakeX;
    const effectiveY = this.currentY + shakeY;

    this.targetContainer.pivot.set(effectiveX, effectiveY);
    this.targetContainer.position.set(this.centerX, this.centerY);
    this.targetContainer.scale.set(this.currentZoom);
    this.targetContainer.rotation = shakeRot;
  }

  public reset(): void {
    this.cameraShake.clear();
    this.snapTo(960, 540, 1.0);
  }

  public destroy(): void {
    this.reset();
  }
}
