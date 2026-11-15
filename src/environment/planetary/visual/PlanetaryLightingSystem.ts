/**
 * INTERSTELLAR CONTINUUM - Planetary Lighting System
 * Directional solar radiation, celestial bounce illumination, stark airless shadows,
 * diffused atmospheric scattering, and diurnal cycle progression.
 */

import { Container, Graphics } from 'pixi.js';
import {
  EnvironmentLightingConfig,
  EnvironmentQualityLevel,
} from '../PlanetaryEnvironmentTypes';

export class PlanetaryLightingSystem {
  public readonly container: Container;
  private lightMaskGfx: Graphics;
  private config?: EnvironmentLightingConfig;
  private quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH;
  private cycleTime: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'PlanetaryLightingLayer';

    this.lightMaskGfx = new Graphics();
    this.container.addChild(this.lightMaskGfx);
  }

  /**
   * Initializes lighting model according to destination configuration.
   */
  public initialize(
    config: EnvironmentLightingConfig,
    worldWidth: number,
    worldHeight: number,
    quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH
  ): void {
    this.config = config;
    this.quality = quality;
    this.cycleTime = 0;
    this.renderLighting(worldWidth, worldHeight);
  }

  /**
   * Evaluates and renders 2D/2.5D ambient and directional lighting mask.
   */
  private renderLighting(worldWidth: number, worldHeight: number): void {
    this.lightMaskGfx.clear();
    if (!this.config) return;

    const w = Math.max(worldWidth, 3840);
    const h = Math.max(worldHeight, 2160);

    // 1. Ambient lighting fill
    this.lightMaskGfx.rect(0, 0, w, h);
    this.lightMaskGfx.fill({
      color: this.config.ambientColor,
      alpha: 1.0 - Math.min(0.9, this.config.ambientIntensity),
    });

    // 2. Celestial bounce illumination (e.g. Earthshine, Jupitershine, Saturnshine)
    if (this.config.celestialBounceColor && (this.config.celestialBounceIntensity ?? 0) > 0) {
      this.lightMaskGfx.rect(0, 0, w, h);
      this.lightMaskGfx.fill({
        color: this.config.celestialBounceColor,
        alpha: (this.config.celestialBounceIntensity ?? 0.1) * 0.25,
      });
    }

    // 3. Solar directional highlight ray band
    if (this.quality !== EnvironmentQualityLevel.LOW) {
      const sunAngle = this.config.sunAngleRadians;
      const rayWidth = 400;
      const rayAlpha = Math.min(0.35, this.config.sunIntensity * 0.15);

      this.lightMaskGfx
        .poly([
          w * 0.3, 0,
          w * 0.3 + rayWidth, 0,
          w * 0.3 + Math.cos(sunAngle) * h + rayWidth, h,
          w * 0.3 + Math.cos(sunAngle) * h, h,
        ])
        .fill({
          color: this.config.sunColor,
          alpha: rayAlpha,
        });
    }
  }

  /**
   * Updates diurnal cycle if supported.
   */
  public update(deltaSeconds: number, _worldWidth: number, _worldHeight: number): void {
    if (!this.config || !this.config.dayNightCycleSupported) return;

    const duration = this.config.cycleDurationSeconds || 600;
    this.cycleTime = (this.cycleTime + deltaSeconds) % duration;
    // Slow periodic ambient intensity shift
    const cycleProgress = (this.cycleTime / duration) * Math.PI * 2;
    const diurnalFactor = 0.8 + Math.sin(cycleProgress) * 0.2;
    this.lightMaskGfx.alpha = diurnalFactor;
  }

  public cleanup(): void {
    this.lightMaskGfx.clear();
    this.config = undefined;
    this.cycleTime = 0;
  }
}
