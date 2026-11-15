/**
 * INTERSTELLAR CONTINUUM - Dynamic Atmosphere System
 * Renders atmospheric haze gradients, Rayleigh scattering, optical depth,
 * and animated heat distortion / dust fog layers.
 */

import { Container, Graphics } from 'pixi.js';
import {
  AtmosphericEffectsConfig,
  EnvironmentQualityLevel,
} from '../PlanetaryEnvironmentTypes';

export class DynamicAtmosphereSystem {
  public readonly container: Container;
  private hazeGfx: Graphics;
  private fogGfx: Graphics;
  private config?: AtmosphericEffectsConfig;
  private animTimer: number = 0;
  private quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH;

  constructor() {
    this.container = new Container();
    this.container.label = 'DynamicAtmosphereLayer';

    this.hazeGfx = new Graphics();
    this.fogGfx = new Graphics();

    this.container.addChild(this.hazeGfx);
    this.container.addChild(this.fogGfx);
  }

  /**
   * Initializes the atmospheric layer with destination-specific optics.
   */
  public initialize(
    config: AtmosphericEffectsConfig,
    worldWidth: number,
    worldHeight: number,
    quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH
  ): void {
    this.config = config;
    this.quality = quality;
    this.renderAtmosphere(worldWidth, worldHeight);
  }

  /**
   * Renders atmospheric gradient and horizon haze.
   */
  private renderAtmosphere(worldWidth: number, worldHeight: number): void {
    this.hazeGfx.clear();
    this.fogGfx.clear();

    if (!this.config || !this.config.hasAtmosphere) {
      return;
    }

    const w = Math.max(worldWidth, 3840);
    const h = Math.max(worldHeight, 2160);

    // 1. Full-screen atmospheric color tint based on optical depth
    const qualityDensityMultiplier =
      this.quality === EnvironmentQualityLevel.LOW
        ? 0.6
        : this.quality === EnvironmentQualityLevel.ULTRA
        ? 1.2
        : 1.0;

    const effectiveDensity = Math.min(
      0.85,
      this.config.hazeDensity * qualityDensityMultiplier
    );

    this.hazeGfx.rect(0, 0, w, h);
    this.hazeGfx.fill({
      color: this.config.hazeColor,
      alpha: effectiveDensity * 0.45,
    });

    // 2. Horizon fog band
    const fogHeight = this.config.horizonFogHeight || 280;
    const fogY = h * 0.68;

    this.fogGfx.rect(0, fogY, w, fogHeight);
    this.fogGfx.fill({
      color: this.config.skyGradientBottom || this.config.hazeColor,
      alpha: effectiveDensity * 0.65,
    });
  }

  /**
   * Updates animated effects (heat shimmer, atmospheric drift) each frame.
   */
  public update(deltaSeconds: number): void {
    if (!this.config || !this.config.hasAtmosphere) return;

    this.animTimer += deltaSeconds;

    if (this.config.heatDistortion && this.quality !== EnvironmentQualityLevel.LOW) {
      // Subtle heat ripple displacement oscillation
      const wave = Math.sin(this.animTimer * 2.5) * 2;
      this.fogGfx.y = wave;
    }

    if (this.config.dustStormActive) {
      // Pulsing dust density
      const pulse = 0.5 + Math.sin(this.animTimer * 1.2) * 0.15;
      this.hazeGfx.alpha = pulse;
    }
  }

  public cleanup(): void {
    this.hazeGfx.clear();
    this.fogGfx.clear();
    this.config = undefined;
    this.animTimer = 0;
  }
}

