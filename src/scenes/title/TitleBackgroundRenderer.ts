/**
 * INTERSTELLAR CONTINUUM - Title Screen Background Visual Architecture
 * Procedural 2.5D deep space atmosphere:
 * Multi-layer starfield, cosmic nebulae, crescent planetary limb,
 * orbital trajectories, satellite silhouettes, and mouse parallax.
 */

import { Container, Graphics } from 'pixi.js';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  layer: number; // 0: Distant, 1: Mid, 2: Foreground
  color: number;
}

export class TitleBackgroundRenderer {
  public readonly container: Container;

  private starfieldGfx: Graphics;
  private nebulaGfx: Graphics;
  private planetGfx: Graphics;
  private trajectoryGfx: Graphics;
  private satelliteGfx: Graphics;

  private stars: Star[] = [];
  private satelliteProgress: number = 0.2;
  private timeElapsed: number = 0;

  private targetParallaxX: number = 0;
  private targetParallaxY: number = 0;
  private currentParallaxX: number = 0;
  private currentParallaxY: number = 0;

  private readonly screenWidth: number = 1920;
  private readonly screenHeight: number = 1080;

  constructor() {
    this.container = new Container();
    this.container.label = 'TitleBackgroundRenderer';

    this.nebulaGfx = new Graphics();
    this.starfieldGfx = new Graphics();
    this.trajectoryGfx = new Graphics();
    this.planetGfx = new Graphics();
    this.satelliteGfx = new Graphics();

    this.container.addChild(this.nebulaGfx);
    this.container.addChild(this.starfieldGfx);
    this.container.addChild(this.trajectoryGfx);
    this.container.addChild(this.planetGfx);
    this.container.addChild(this.satelliteGfx);

    this.generateStarfield(220);
    this.drawNebulae();
    this.drawPlanets();
    this.drawOrbitalTrajectories();
  }

  private generateStarfield(count: number): void {
    this.stars = [];
    const colors = [0xffffff, 0xe2e8f0, 0x93c5fd, 0xfde68a, 0x67e8f9];

    for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.85 ? 1 : 2;
      const radius = layer === 0 ? 0.8 + Math.random() * 0.6 : layer === 1 ? 1.4 + Math.random() * 0.8 : 2.2 + Math.random() * 1.0;
      const baseAlpha = layer === 0 ? 0.3 + Math.random() * 0.3 : layer === 1 ? 0.6 + Math.random() * 0.3 : 0.85 + Math.random() * 0.15;
      const color = colors[Math.floor(Math.random() * colors.length)] ?? 0xffffff;

      this.stars.push({
        x: Math.random() * this.screenWidth,
        y: Math.random() * this.screenHeight,
        radius,
        baseAlpha,
        alpha: baseAlpha,
        pulseSpeed: 1.0 + Math.random() * 2.5,
        pulsePhase: Math.random() * Math.PI * 2,
        layer,
        color,
      });
    }
  }

  private drawNebulae(): void {
    this.nebulaGfx.clear();

    // Deep space gradient backdrop
    this.nebulaGfx.rect(0, 0, this.screenWidth, this.screenHeight).fill({ color: 0x030712 });

    // Soft celestial cosmic clouds (Cyan, Violet, Deep Indigo)
    // Cloud 1: Upper Right cyan luminescence
    this.nebulaGfx
      .ellipse(1500, 260, 550, 320)
      .fill({ color: 0x083344, alpha: 0.35 });
    this.nebulaGfx
      .ellipse(1550, 240, 340, 180)
      .fill({ color: 0x06b6d4, alpha: 0.12 });

    // Cloud 2: Bottom Left deep violet interstellar dust
    this.nebulaGfx
      .ellipse(400, 850, 600, 350)
      .fill({ color: 0x2e1065, alpha: 0.32 });
    this.nebulaGfx
      .ellipse(360, 880, 380, 200)
      .fill({ color: 0x7c3aed, alpha: 0.1 });

    // Cloud 3: Center-Right faint amber stellar nursery
    this.nebulaGfx
      .ellipse(1200, 700, 480, 240)
      .fill({ color: 0x451a03, alpha: 0.22 });
  }

  private drawPlanets(): void {
    this.planetGfx.clear();

    // 1. Primary Cinematic Crescent Earth (Bottom Right corner)
    const earthX = 1620;
    const earthY = 820;
    const earthRadius = 380;

    // Outer Atmospheric Rim Glow
    this.planetGfx
      .circle(earthX, earthY, earthRadius + 22)
      .fill({ color: 0x00f0ff, alpha: 0.08 });
    this.planetGfx
      .circle(earthX, earthY, earthRadius + 10)
      .fill({ color: 0x38bdf8, alpha: 0.16 });

    // Dark Planetary Disc
    this.planetGfx.circle(earthX, earthY, earthRadius).fill({ color: 0x040810 });

    // Oceans & Continents on Sunlit Edge
    this.planetGfx
      .arc(earthX, earthY, earthRadius, -Math.PI * 0.95, -Math.PI * 0.35)
      .stroke({ color: 0x0284c7, width: 14 });

    // Brilliant Sunlit Cloud Rim
    this.planetGfx
      .arc(earthX, earthY, earthRadius, -Math.PI * 0.92, -Math.PI * 0.38)
      .stroke({ color: 0xf0fdf4, width: 4.5 });

    // 2. Distant Celestial Secondary Body (Moon/Mars in Upper Left quadrant)
    const moonX = 380;
    const moonY = 240;
    const moonRadius = 54;

    this.planetGfx.circle(moonX, moonY, moonRadius + 6).fill({ color: 0xe2e8f0, alpha: 0.06 });
    this.planetGfx.circle(moonX, moonY, moonRadius).fill({ color: 0x1e293b });

    // Sunlit Moon Crescent
    this.planetGfx
      .arc(moonX, moonY, moonRadius, -Math.PI * 0.85, -Math.PI * 0.15)
      .stroke({ color: 0xf1f5f9, width: 3.5 });
  }

  private drawOrbitalTrajectories(): void {
    this.trajectoryGfx.clear();

    // Subtle dashed Keplerian orbital transfer path sweeping from bottom-left to top-right
    const cx = 960;
    const cy = 680;
    const rx = 1050;
    const ry = 420;

    const segments = 90;
    for (let i = 0; i < segments; i += 2) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = cx + Math.cos(a1) * rx;
      const y1 = cy + Math.sin(a1) * ry;
      const x2 = cx + Math.cos(a2) * rx;
      const y2 = cy + Math.sin(a2) * ry;

      this.trajectoryGfx.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0x38bdf8, width: 1.0, alpha: 0.28 });
    }
  }

  public setParallaxTarget(normalizedX: number, normalizedY: number): void {
    // Clamped -1 to 1 offset from screen center
    this.targetParallaxX = Math.max(-1, Math.min(1, normalizedX)) * 24;
    this.targetParallaxY = Math.max(-1, Math.min(1, normalizedY)) * 14;
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    // 1. Smoothly interpolate parallax offsets
    const lerp = Math.min(1, deltaSeconds * 4.0);
    this.currentParallaxX += (this.targetParallaxX - this.currentParallaxX) * lerp;
    this.currentParallaxY += (this.targetParallaxY - this.currentParallaxY) * lerp;

    // 2. Animate Twinkling Stars
    this.starfieldGfx.clear();
    for (const star of this.stars) {
      star.alpha =
        star.baseAlpha + Math.sin(this.timeElapsed * star.pulseSpeed + star.pulsePhase) * (star.baseAlpha * 0.35);

      const parallaxFactor = (star.layer + 1) * 0.4;
      const px = star.x + this.currentParallaxX * parallaxFactor;
      const py = star.y + this.currentParallaxY * parallaxFactor;

      this.starfieldGfx.circle(px, py, star.radius).fill({ color: star.color, alpha: Math.max(0.1, star.alpha) });

      // Diffraction cross spike for bright foreground stars
      if (star.layer === 2) {
        const spikeLen = star.radius * 2.8;
        this.starfieldGfx
          .moveTo(px - spikeLen, py)
          .lineTo(px + spikeLen, py)
          .stroke({ color: star.color, width: 0.8, alpha: star.alpha * 0.6 });
        this.starfieldGfx
          .moveTo(px, py - spikeLen)
          .lineTo(px, py + spikeLen)
          .stroke({ color: star.color, width: 0.8, alpha: star.alpha * 0.6 });
      }
    }

    // 3. Animate Moving Satellite Silhouette along Orbit
    this.satelliteProgress = (this.satelliteProgress + deltaSeconds * 0.018) % 1.0;
    const angle = this.satelliteProgress * Math.PI * 2;
    const satX = 960 + Math.cos(angle) * 1050 + this.currentParallaxX * 0.8;
    const satY = 680 + Math.sin(angle) * 420 + this.currentParallaxY * 0.8;

    this.satelliteGfx.clear();

    // Satellite Bus & Panels
    this.satelliteGfx.rect(satX - 4, satY - 4, 8, 8).fill({ color: 0x94a3b8 });
    this.satelliteGfx.rect(satX - 14, satY - 2, 8, 4).fill({ color: 0x38bdf8 });
    this.satelliteGfx.rect(satX + 6, satY - 2, 8, 4).fill({ color: 0x38bdf8 });

    // Blinking Navigation Beacon
    const beaconPulse = Math.sin(this.timeElapsed * 6.0) > 0.3;
    if (beaconPulse) {
      this.satelliteGfx.circle(satX, satY - 4, 2.5).fill({ color: 0xef4444 });
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.stars = [];
  }
}
