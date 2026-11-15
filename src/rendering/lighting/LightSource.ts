/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Individual 2D Light Source Object
 */

import { LightType, FalloffType, LightSourceConfig } from './LightTypes';
import { Graphics } from 'pixi.js';

export class LightSource {
  public readonly id: string;
  public type: LightType;
  public x: number;
  public y: number;
  public radius: number;
  public color: number;
  public intensity: number;
  public falloff: FalloffType;
  public direction: number;
  public coneAngle: number;
  public castsShadow: boolean;
  public enabled: boolean;

  // Pulsation parameters
  public pulseSpeed: number;
  public pulseIntensityMin: number;
  public pulseIntensityMax: number;
  private pulsePhase: number = 0;

  // Cached graphics node for fast rendering
  public readonly graphics: Graphics;

  constructor(config: LightSourceConfig) {
    this.id = config.id;
    this.type = config.type;
    this.x = config.x;
    this.y = config.y;
    this.radius = Math.max(10, config.radius);
    this.color = config.color;
    this.intensity = Math.max(0, config.intensity);
    this.falloff = config.falloff ?? FalloffType.SMOOTH;
    this.direction = config.direction ?? 0;
    this.coneAngle = config.coneAngle ?? Math.PI / 4;
    this.castsShadow = config.castsShadow ?? false;
    this.enabled = config.enabled ?? true;

    this.pulseSpeed = config.pulseSpeed ?? 0;
    this.pulseIntensityMin = config.pulseIntensityMin ?? config.intensity * 0.5;
    this.pulseIntensityMax = config.pulseIntensityMax ?? config.intensity * 1.2;

    this.graphics = new Graphics();
    this.graphics.label = `Light:${this.id}`;
    (this.graphics as any).blendMode = 'add';
  }

  public update(deltaSeconds: number): void {
    if (!this.enabled) return;

    if (this.pulseSpeed > 0) {
      this.pulsePhase += this.pulseSpeed * deltaSeconds;
      const normalizedWave = (Math.sin(this.pulsePhase) + 1) / 2; // 0 to 1
      this.intensity =
        this.pulseIntensityMin + normalizedWave * (this.pulseIntensityMax - this.pulseIntensityMin);
    }
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setIntensity(val: number): void {
    this.intensity = Math.max(0, val);
  }

  public setRadius(radius: number): void {
    this.radius = Math.max(10, radius);
  }

  public setColor(color: number): void {
    this.color = color;
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}
