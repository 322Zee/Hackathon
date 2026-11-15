/**
 * INTERSTELLAR CONTINUUM - Act I: Earth Planetary Composition
 * 2.5D detailed planetary Earth from orbit with atmospheric Rayleigh scattering,
 * slow moving cloud strata, starry background, and orbital satellite.
 */

import { Container, Graphics } from 'pixi.js';

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
}

export class EarthCinematicScene {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private starsGfx: Graphics;
  private planetGfx: Graphics;
  private cloudsGfx: Graphics;
  private satelliteGfx: Graphics;

  private stars: Star[] = [];
  private timeElapsed: number = 0;
  private cloudOffset: number = 0;

  private readonly earthCx: number = 960;
  private readonly earthCy: number = 720;
  private readonly earthR: number = 360;

  constructor() {
    this.container = new Container();
    this.container.label = 'EarthCinematicScene';

    this.backdropGfx = new Graphics();
    this.starsGfx = new Graphics();
    this.planetGfx = new Graphics();
    this.cloudsGfx = new Graphics();
    this.satelliteGfx = new Graphics();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.starsGfx);
    this.container.addChild(this.planetGfx);
    this.container.addChild(this.cloudsGfx);
    this.container.addChild(this.satelliteGfx);

    this.setupBackdrop();
    this.setupStars(100);
    this.drawEarth();
  }

  private setupBackdrop(): void {
    this.backdropGfx.clear();
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x02050e });
  }

  private setupStars(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        r: 0.8 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        speed: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private drawEarth(): void {
    this.planetGfx.clear();

    const cx = this.earthCx;
    const cy = this.earthCy;
    const r = this.earthR;

    // Atmospheric Outer Glow Layers (Rayleigh Scattering)
    this.planetGfx.circle(cx, cy, r + 42).fill({ color: 0x0284c7, alpha: 0.05 });
    this.planetGfx.circle(cx, cy, r + 24).fill({ color: 0x38bdf8, alpha: 0.12 });
    this.planetGfx.circle(cx, cy, r + 10).fill({ color: 0x7dd3fc, alpha: 0.22 });

    // Deep Ocean Body
    this.planetGfx.circle(cx, cy, r).fill({ color: 0x07284e });

    // Continents & Landmass Contours (Stylized continents)
    // Continent 1: North West landmass
    this.planetGfx
      .ellipse(cx - 140, cy - 120, 150, 95)
      .fill({ color: 0x15803d, alpha: 0.85 });
    this.planetGfx
      .ellipse(cx - 120, cy - 130, 90, 60)
      .fill({ color: 0x854d0e, alpha: 0.5 });

    // Continent 2: South West landmass
    this.planetGfx
      .ellipse(cx - 80, cy + 130, 90, 130)
      .fill({ color: 0x166534, alpha: 0.8 });

    // Continent 3: Eastern Eurasian landmass
    this.planetGfx
      .ellipse(cx + 170, cy - 80, 160, 110)
      .fill({ color: 0x15803d, alpha: 0.85 });
    this.planetGfx
      .ellipse(cx + 190, cy - 60, 90, 50)
      .fill({ color: 0xd97706, alpha: 0.4 });

    // Continent 4: South East continent
    this.planetGfx
      .ellipse(cx + 160, cy + 160, 110, 85)
      .fill({ color: 0xb45309, alpha: 0.65 });

    // Shadow Terminator Arc (Day/Night planetary gradient)
    this.planetGfx
      .arc(cx, cy, r, Math.PI * 0.2, Math.PI * 1.2)
      .stroke({ color: 0x020617, width: 45, alpha: 0.6 });
  }

  private drawClouds(): void {
    this.cloudsGfx.clear();

    const cx = this.earthCx;
    const cy = this.earthCy;

    // Drifting cloud bands with offset
    const offset = Math.sin(this.cloudOffset) * 25;

    // Cloud band 1: Northern swirl
    this.cloudsGfx
      .ellipse(cx - 60 + offset, cy - 160, 180, 28)
      .fill({ color: 0xffffff, alpha: 0.42 });

    // Cloud band 2: Equatorial trade winds
    this.cloudsGfx
      .ellipse(cx + 40 - offset, cy + 10, 240, 35)
      .fill({ color: 0xf1f5f9, alpha: 0.38 });

    // Cloud band 3: Southern frontal cyclone
    this.cloudsGfx
      .ellipse(cx - 100 + offset * 0.8, cy + 180, 160, 30)
      .fill({ color: 0xe2e8f0, alpha: 0.4 });

    // Cloud cyclone spiral
    this.cloudsGfx
      .circle(cx + 140 - offset, cy - 140, 32)
      .stroke({ color: 0xffffff, width: 6, alpha: 0.35 });
  }

  private drawSatellite(): void {
    this.satelliteGfx.clear();

    // Satellite passing across upper orbit
    const satAngle = Math.PI * 1.15 + this.timeElapsed * 0.05;
    const sx = this.earthCx + Math.cos(satAngle) * (this.earthR + 75);
    const sy = this.earthCy + Math.sin(satAngle) * (this.earthR + 75);

    // Satellite body (gold/foil bus)
    this.satelliteGfx.rect(sx - 4, sy - 4, 8, 8).fill({ color: 0xfacc15 });

    // Solar panels
    this.satelliteGfx.rect(sx - 18, sy - 2, 11, 4).fill({ color: 0x0284c7 });
    this.satelliteGfx.rect(sx + 7, sy - 2, 11, 4).fill({ color: 0x0284c7 });

    // High gain antenna
    this.satelliteGfx.circle(sx, sy - 6, 2).fill({ color: 0xe2e8f0 });

    // Blinking navigational LED beacon
    const beaconAlpha = 0.5 + Math.sin(this.timeElapsed * 6.0) * 0.5;
    this.satelliteGfx.circle(sx, sy, 3).fill({ color: 0x38bdf8, alpha: beaconAlpha });
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;
    this.cloudOffset += deltaSeconds * 0.15;

    // Redraw stars with twinkling scintillation
    this.starsGfx.clear();
    for (const s of this.stars) {
      const alpha = s.alpha * (0.6 + Math.sin(this.timeElapsed * s.speed + s.phase) * 0.4);
      this.starsGfx.circle(s.x, s.y, s.r).fill({ color: 0xffffff, alpha });
    }

    this.drawClouds();
    this.drawSatellite();
  }
}
