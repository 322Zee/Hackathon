/**
 * INTERSTELLAR CONTINUUM - Environmental Particle System
 * High-performance object-pooled particle simulation for planetary atmospheres,
 * dust storms, acid mists, ice plumes, and microgravity regolith motes.
 */

import { Container, Graphics } from 'pixi.js';
import {
  WeatherEffectConfig,
  WeatherEffectType,
  EnvironmentQualityLevel,
} from '../PlanetaryEnvironmentTypes';
import { SeededRandom } from '../terrain/SeededRandom';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export class EnvironmentalParticleSystem {
  public readonly container: Container;
  private particleGfx: Graphics;
  private pool: Particle[] = [];
  private config?: WeatherEffectConfig;
  private rng: SeededRandom;
  private bounds = { minX: 0, maxX: 4800, minY: 0, maxY: 2400 };

  constructor() {
    this.container = new Container();
    this.container.label = 'EnvironmentalParticleLayer';

    this.particleGfx = new Graphics();
    this.container.addChild(this.particleGfx);
    this.rng = new SeededRandom(55123);
  }

  /**
   * Initializes particle simulation and pre-allocates particle memory pool.
   */
  public initialize(
    config: WeatherEffectConfig,
    worldWidth: number,
    worldHeight: number,
    quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH
  ): void {
    this.cleanup();
    this.config = config;
    this.bounds = { minX: 0, maxX: worldWidth, minY: 0, maxY: worldHeight };

    if (config.type === WeatherEffectType.NONE || config.intensity <= 0) {
      return;
    }

    // Determine pool size based on quality setting
    const scaleFactor =
      quality === EnvironmentQualityLevel.LOW
        ? 0.25
        : quality === EnvironmentQualityLevel.MEDIUM
        ? 0.5
        : quality === EnvironmentQualityLevel.HIGH
        ? 1.0
        : 1.5;

    const targetPoolSize = Math.max(10, Math.floor(config.particleCountMax * scaleFactor));

    // Pre-allocate particles in contiguous memory
    this.pool = [];
    for (let i = 0; i < targetPoolSize; i++) {
      const p: Particle = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        alpha: 0,
        maxAlpha: 0.8,
        size: 2,
        life: 0,
        maxLife: 1,
      };
      this.spawnParticle(p, true);
      this.pool.push(p);
    }
  }

  private spawnParticle(p: Particle, initialRandomScatter: boolean = false): void {
    if (!this.config) return;

    p.active = true;
    p.size = this.rng.nextFloat(1.5, 4.0);
    p.maxAlpha = this.rng.nextFloat(0.3, 0.85);
    p.maxLife = this.rng.nextFloat(3.0, 7.0);
    p.life = initialRandomScatter ? this.rng.nextFloat(0, p.maxLife) : 0;

    const baseSpeed = this.rng.nextFloat(
      this.config.particleSpeedMin,
      this.config.particleSpeedMax
    );
    const windAngle = this.config.windAngleRadians + this.rng.nextFloat(-0.2, 0.2);

    p.vx = Math.cos(windAngle) * baseSpeed;
    p.vy = Math.sin(windAngle) * baseSpeed;

    if (initialRandomScatter) {
      p.x = this.rng.nextFloat(this.bounds.minX, this.bounds.maxX);
      p.y = this.rng.nextFloat(this.bounds.minY, this.bounds.maxY);
    } else {
      // Spawn at upwind edge or near geyser location
      if (this.config.type === WeatherEffectType.CRYO_PLUME) {
        // Upward geyser eruption
        p.x = this.bounds.maxX * 0.5 + this.rng.nextFloat(-120, 120);
        p.y = this.bounds.maxY * 0.65 + this.rng.nextFloat(-10, 10);
        p.vy = -this.rng.nextFloat(60, 160);
        p.vx = this.rng.nextFloat(-20, 20);
      } else {
        // Standard atmospheric wind ingress
        p.x = p.vx >= 0 ? this.bounds.minX - 20 : this.bounds.maxX + 20;
        p.y = this.rng.nextFloat(this.bounds.minY, this.bounds.maxY);
      }
    }
  }

  /**
   * Updates particle positions, lifetimes, and redraws the batched Graphics container.
   */
  public update(deltaSeconds: number): void {
    if (!this.config || this.pool.length === 0) return;

    this.particleGfx.clear();
    const pColor = this.config.particleColor;

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p || !p.active) continue;

      p.life += deltaSeconds;
      if (p.life >= p.maxLife) {
        this.spawnParticle(p, false);
        continue;
      }

      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;

      // Wrap or respawn when leaving world bounds
      if (
        p.x < this.bounds.minX - 50 ||
        p.x > this.bounds.maxX + 50 ||
        p.y < this.bounds.minY - 50 ||
        p.y > this.bounds.maxY + 50
      ) {
        this.spawnParticle(p, false);
        continue;
      }

      // Parabolic alpha curve over lifetime (fade in, hold, fade out)
      const progress = p.life / p.maxLife;
      const alphaFactor = Math.sin(progress * Math.PI);
      const currentAlpha = p.maxAlpha * alphaFactor;

      this.particleGfx.circle(p.x, p.y, p.size);
      this.particleGfx.fill({ color: pColor, alpha: currentAlpha });
    }
  }

  /**
   * Returns current count of active particles for telemetry and performance verification.
   */
  public getActiveParticleCount(): number {
    let count = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p && p.active) count++;
    }
    return count;
  }

  public cleanup(): void {
    this.particleGfx.clear();
    this.pool = [];
    this.config = undefined;
  }
}
