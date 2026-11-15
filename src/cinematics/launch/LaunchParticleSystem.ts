/**
 * INTERSTELLAR CONTINUUM - Launch Particle System
 * Manages 2.5D layered exhaust plumes, billowing smoke clouds, ignition sparks,
 * transonic condensation cones, and cryogenic venting with hardware-accelerated batched rendering.
 */

import { Container, Graphics } from 'pixi.js';
import { LaunchParticlePool, LaunchParticle } from './LaunchParticlePool';
import { LaunchVisualQuality } from './LaunchCinematicTypes';

export interface LaunchParticleSystemOptions {
  quality?: LaunchVisualQuality;
  maxParticles?: number;
}

export class LaunchParticleSystem {
  public readonly backContainer: Container;
  public readonly frontContainer: Container;

  private pool: LaunchParticlePool;
  private backGfx: Graphics;
  private frontGfx: Graphics;
  private quality: LaunchVisualQuality;

  // Rate limiter accumulators
  private plumeAccumulator: number = 0;
  private cryoAccumulator: number = 0;

  constructor(options: LaunchParticleSystemOptions = {}) {
    this.quality = options.quality ?? LaunchVisualQuality.HIGH;

    let capacity = 600;
    if (this.quality === LaunchVisualQuality.MEDIUM) capacity = 320;
    if (this.quality === LaunchVisualQuality.LOW) capacity = 120;
    if (options.maxParticles) capacity = options.maxParticles;

    this.pool = new LaunchParticlePool(capacity);

    this.backContainer = new Container();
    this.backContainer.label = 'LaunchParticles_BackLayer';

    this.frontContainer = new Container();
    this.frontContainer.label = 'LaunchParticles_FrontLayer';

    this.backGfx = new Graphics();
    this.backContainer.addChild(this.backGfx);

    this.frontGfx = new Graphics();
    this.frontContainer.addChild(this.frontGfx);
  }

  public setQuality(quality: LaunchVisualQuality): void {
    this.quality = quality;
  }

  public getActiveCount(): number {
    return this.pool.getActiveCount();
  }

  /**
   * Spawns ignition sparkler bursts during engine chill / pre-ignition
   */
  public emitIgnitionSparks(originX: number, originY: number, count: number = 8): void {
    const sparkCount = this.quality === LaunchVisualQuality.LOW ? Math.ceil(count / 2) : count;

    for (let i = 0; i < sparkCount; i++) {
      const p = this.pool.acquire();
      p.type = 'SPARK';
      p.x = originX + (Math.random() - 0.5) * 20;
      p.y = originY + (Math.random() - 0.5) * 6;
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.8;
      const speed = 120 + Math.random() * 240;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.ax = 0;
      p.ay = 380; // Gravity pulling sparks down
      p.scale = 2 + Math.random() * 2.5;
      p.scaleSpeed = -1.2;
      p.alpha = 1.0;
      p.fadeSpeed = 1.8 + Math.random() * 1.5;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = 0;
      p.color = Math.random() > 0.3 ? 0xfff0aa : 0xf97316;
      p.maxAge = 0.8 + Math.random() * 0.4;
    }
  }

  /**
   * Continuous emission of engine core flame, expanding envelope, and trailing plume
   */
  public emitEnginePlume(
    originX: number,
    originY: number,
    throttle: number,
    deltaSeconds: number
  ): void {
    if (throttle <= 0.02) return;

    this.plumeAccumulator += deltaSeconds;
    const interval = this.quality === LaunchVisualQuality.LOW ? 0.05 : 0.02;

    while (this.plumeAccumulator >= interval) {
      this.plumeAccumulator -= interval;

      // 1. Core Luminous Flame
      const core = this.pool.acquire();
      core.type = 'CORE_FLAME';
      core.x = originX + (Math.random() - 0.5) * (10 * throttle);
      core.y = originY;
      core.vx = (Math.random() - 0.5) * 25;
      core.vy = 280 * throttle + Math.random() * 80;
      core.ax = 0;
      core.ay = 0;
      core.scale = 8 * throttle;
      core.scaleSpeed = 16 * throttle;
      core.alpha = 0.95;
      core.fadeSpeed = 3.5;
      core.rotation = 0;
      core.rotSpeed = 0;
      core.color = 0xffffff;
      core.maxAge = 0.28;

      // 2. Outer Plume Envelope (Amber / Orange)
      const outer = this.pool.acquire();
      outer.type = 'OUTER_FLAME';
      outer.x = originX + (Math.random() - 0.5) * (18 * throttle);
      outer.y = originY + 6;
      outer.vx = (Math.random() - 0.5) * 45;
      outer.vy = 220 * throttle + Math.random() * 60;
      outer.ax = 0;
      outer.ay = -20;
      outer.scale = 12 * throttle;
      outer.scaleSpeed = 35 * throttle;
      outer.alpha = 0.85;
      outer.fadeSpeed = 2.2;
      outer.rotation = Math.random() * Math.PI;
      outer.rotSpeed = (Math.random() - 0.5) * 2;
      outer.color = Math.random() > 0.4 ? 0xf97316 : 0xfbbf24;
      outer.maxAge = 0.45;

      // 3. Trailing Billowing Smoke (Rendered to back layer)
      const smoke = this.pool.acquire();
      smoke.type = 'SMOKE_BACK';
      smoke.x = originX + (Math.random() - 0.5) * 30;
      smoke.y = originY + 30 + Math.random() * 20;
      smoke.vx = (Math.random() - 0.5) * 60;
      smoke.vy = 120 + Math.random() * 80;
      smoke.ax = 0;
      smoke.ay = -40; // Buoyancy rising
      smoke.scale = 16 * throttle;
      smoke.scaleSpeed = 48 * throttle;
      smoke.alpha = 0.7;
      smoke.fadeSpeed = 0.45;
      smoke.rotation = Math.random() * Math.PI * 2;
      smoke.rotSpeed = (Math.random() - 0.5) * 0.8;
      smoke.color = Math.random() > 0.5 ? 0x94a3b8 : 0x64748b;
      smoke.maxAge = 1.6;

      // 4. Foreground Smoke Puff (Rendered to front layer for 2.5D depth)
      if (this.quality !== LaunchVisualQuality.LOW && Math.random() > 0.5) {
        const foreSmoke = this.pool.acquire();
        foreSmoke.type = 'SMOKE_FORE';
        foreSmoke.x = originX + (Math.random() - 0.5) * 24;
        foreSmoke.y = originY + 20;
        foreSmoke.vx = (Math.random() - 0.5) * 50;
        foreSmoke.vy = 90 + Math.random() * 60;
        foreSmoke.ax = 0;
        foreSmoke.ay = -30;
        foreSmoke.scale = 14 * throttle;
        foreSmoke.scaleSpeed = 40 * throttle;
        foreSmoke.alpha = 0.55;
        foreSmoke.fadeSpeed = 0.5;
        foreSmoke.rotation = Math.random() * Math.PI * 2;
        foreSmoke.rotSpeed = (Math.random() - 0.5) * 0.6;
        foreSmoke.color = 0xcfd8dc;
        foreSmoke.maxAge = 1.4;
      }
    }
  }

  /**
   * Flame trench horizontal blast clouds expanding sideways across the launch mount
   */
  public emitTrenchSmoke(originX: number, originY: number, intensity: number = 1.0): void {
    if (intensity <= 0.05) return;

    const count = this.quality === LaunchVisualQuality.LOW ? 3 : this.quality === LaunchVisualQuality.MEDIUM ? 6 : 10;

    for (let i = 0; i < count; i++) {
      for (const direction of [-1, 1]) {
        const p = this.pool.acquire();
        p.type = 'TRENCH_SMOKE';
        p.x = originX + direction * (15 + Math.random() * 25);
        p.y = originY + (Math.random() - 0.5) * 10;
        p.vx = direction * (140 * intensity + Math.random() * 120);
        p.vy = -15 - Math.random() * 35; // Gentle upward curl
        p.ax = -direction * 45; // Drag deceleration
        p.ay = -25; // Thermal buoyancy
        p.scale = 22 * intensity;
        p.scaleSpeed = 50 * intensity;
        p.alpha = 0.75;
        p.fadeSpeed = 0.4;
        p.rotation = Math.random() * Math.PI * 2;
        p.rotSpeed = (Math.random() - 0.5) * 0.6;
        p.color = Math.random() > 0.4 ? 0xe2e8f0 : 0x94a3b8;
        p.maxAge = 2.2;
      }
    }
  }

  /**
   * Aerodynamic transonic condensation vapor rings (Max-Q visual effect)
   */
  public emitVaporCondensation(originX: number, originY: number, width: number): void {
    const p = this.pool.acquire();
    p.type = 'VAPOR';
    p.x = originX;
    p.y = originY;
    p.vx = 0;
    p.vy = 40;
    p.ax = 0;
    p.ay = 0;
    p.scale = width * 0.8;
    p.scaleSpeed = 120;
    p.alpha = 0.8;
    p.fadeSpeed = 1.6;
    p.rotation = 0;
    p.rotSpeed = 0;
    p.color = 0xf0fdf4; // Subtle white/cyan translucent cone
    p.maxAge = 0.5;
  }

  /**
   * Cryogenic venting boil-off plumes from umbilical service arms
   */
  public emitCryoVenting(originX: number, originY: number, deltaSeconds: number): void {
    this.cryoAccumulator += deltaSeconds;
    if (this.cryoAccumulator < 0.08) return;
    this.cryoAccumulator = 0;

    for (const dir of [-1, 1]) {
      const p = this.pool.acquire();
      p.type = 'CRYO';
      p.x = originX + dir * 20;
      p.y = originY + (Math.random() - 0.5) * 4;
      p.vx = dir * (20 + Math.random() * 30);
      p.vy = 15 + Math.random() * 20;
      p.ax = dir * -5;
      p.ay = 8;
      p.scale = 4;
      p.scaleSpeed = 14;
      p.alpha = 0.55;
      p.fadeSpeed = 0.45;
      p.rotation = Math.random() * Math.PI;
      p.rotSpeed = (Math.random() - 0.5) * 0.5;
      p.color = 0xf8fafc;
      p.maxAge = 1.2;
    }
  }

  /**
   * Physics update & batched rendering tick
   */
  public update(deltaSeconds: number): void {
    const particles = this.pool.getAll();
    const len = particles.length;

    this.backGfx.clear();
    this.frontGfx.clear();

    for (let i = 0; i < len; i++) {
      const p = particles[i] as LaunchParticle;
      if (!p.active) continue;

      p.age += deltaSeconds;
      if (p.age >= p.maxAge || p.alpha <= 0.01) {
        this.pool.release(p);
        continue;
      }

      // Physics integration
      p.vx += p.ax * deltaSeconds;
      p.vy += p.ay * deltaSeconds;
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;
      p.scale = Math.max(0.1, p.scale + p.scaleSpeed * deltaSeconds);
      p.alpha = Math.max(0, p.alpha - p.fadeSpeed * deltaSeconds);
      p.rotation += p.rotSpeed * deltaSeconds;

      // Determine target render layer
      const isBackLayer = p.type === 'SMOKE_BACK' || p.type === 'TRENCH_SMOKE';
      const targetGfx = isBackLayer ? this.backGfx : this.frontGfx;

      // Render particle geometry based on type
      if (p.type === 'SPARK') {
        targetGfx.circle(p.x, p.y, p.scale);
        targetGfx.fill({ color: p.color, alpha: p.alpha });
      } else if (p.type === 'CORE_FLAME') {
        targetGfx.ellipse(p.x, p.y, p.scale * 0.4, p.scale);
        targetGfx.fill({ color: p.color, alpha: p.alpha });
      } else if (p.type === 'OUTER_FLAME') {
        targetGfx.ellipse(p.x, p.y, p.scale * 0.6, p.scale * 1.2);
        targetGfx.fill({ color: p.color, alpha: p.alpha });
      } else if (p.type === 'VAPOR') {
        // Transonic cone arc
        targetGfx.ellipse(p.x, p.y, p.scale, p.scale * 0.3);
        targetGfx.stroke({ color: p.color, width: 3, alpha: p.alpha * 0.7 });
      } else {
        // Soft rolling volumetric smoke / cryo cloud
        targetGfx.circle(p.x, p.y, p.scale);
        targetGfx.fill({ color: p.color, alpha: p.alpha * 0.6 });
        // Secondary soft inner core
        targetGfx.circle(p.x, p.y, p.scale * 0.6);
        targetGfx.fill({ color: 0xffffff, alpha: p.alpha * 0.25 });
      }
    }
  }

  public clear(): void {
    this.pool.clear();
    this.backGfx.clear();
    this.frontGfx.clear();
  }

  public destroy(): void {
    this.clear();
    this.backContainer.destroy({ children: true });
    this.frontContainer.destroy({ children: true });
  }
}
