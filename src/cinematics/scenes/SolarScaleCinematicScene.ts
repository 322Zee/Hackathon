/**
 * INTERSTELLAR CONTINUUM - Act II: Solar Scale Composition
 * Panoramic heliocentric view showing the Sun, planetary orbits,
 * planet silhouettes, and robotic deep-space probe.
 */

import { Container, Graphics } from 'pixi.js';

interface PlanetOrbit {
  name: string;
  radiusX: number;
  radiusY: number;
  color: number;
  size: number;
  angle: number;
  speed: number;
  hasRing?: boolean;
}

export class SolarScaleCinematicScene {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private sunGfx: Graphics;
  private orbitsGfx: Graphics;
  private planetsGfx: Graphics;
  private probeGfx: Graphics;

  private timeElapsed: number = 0;
  private planets: PlanetOrbit[] = [];

  private readonly sunX: number = 380;
  private readonly sunY: number = 540;

  constructor() {
    this.container = new Container();
    this.container.label = 'SolarScaleCinematicScene';

    this.backdropGfx = new Graphics();
    this.orbitsGfx = new Graphics();
    this.sunGfx = new Graphics();
    this.planetsGfx = new Graphics();
    this.probeGfx = new Graphics();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.orbitsGfx);
    this.container.addChild(this.sunGfx);
    this.container.addChild(this.planetsGfx);
    this.container.addChild(this.probeGfx);

    this.setupPlanets();
    this.drawStaticBackdrop();
  }

  private setupPlanets(): void {
    this.planets = [
      { name: 'Mercury', radiusX: 130, radiusY: 55, color: 0x94a3b8, size: 4, angle: 0.8, speed: 0.12 },
      { name: 'Venus', radiusX: 200, radiusY: 85, color: 0xfde047, size: 6, angle: 2.1, speed: 0.08 },
      { name: 'Earth', radiusX: 280, radiusY: 120, color: 0x38bdf8, size: 7, angle: 3.5, speed: 0.05 },
      { name: 'Mars', radiusX: 370, radiusY: 160, color: 0xf87171, size: 5, angle: 4.8, speed: 0.04 },
      { name: 'Jupiter', radiusX: 520, radiusY: 220, color: 0xfb923c, size: 14, angle: 1.2, speed: 0.02 },
      { name: 'Saturn', radiusX: 680, radiusY: 290, color: 0xfef08a, size: 11, angle: 2.7, speed: 0.015, hasRing: true },
    ];
  }

  private drawStaticBackdrop(): void {
    this.backdropGfx.clear();
    // Deep interstellar navy
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x020614 });

    // Distant cosmic dust haze
    this.backdropGfx.ellipse(1100, 540, 700, 380).fill({ color: 0x1e1b4b, alpha: 0.2 });
  }

  private drawSun(): void {
    this.sunGfx.clear();

    const cx = this.sunX;
    const cy = this.sunY;

    // Pulsing outer solar corona
    const pulse = 1.0 + Math.sin(this.timeElapsed * 2.0) * 0.04;

    this.sunGfx.circle(cx, cy, 140 * pulse).fill({ color: 0xf59e0b, alpha: 0.06 });
    this.sunGfx.circle(cx, cy, 95 * pulse).fill({ color: 0xfbbf24, alpha: 0.18 });
    this.sunGfx.circle(cx, cy, 65).fill({ color: 0xfef08a, alpha: 0.5 });
    this.sunGfx.circle(cx, cy, 48).fill({ color: 0xffffff });
  }

  private drawOrbits(): void {
    this.orbitsGfx.clear();

    const cx = this.sunX;
    const cy = this.sunY;

    for (const p of this.planets) {
      this.orbitsGfx
        .ellipse(cx, cy, p.radiusX, p.radiusY)
        .stroke({ color: 0x38bdf8, width: 1.0, alpha: 0.2 });
    }

    // Asteroid belt ring between Mars and Jupiter
    this.orbitsGfx
      .ellipse(cx, cy, 445, 190)
      .stroke({ color: 0x94a3b8, width: 6.0, alpha: 0.1 });
  }

  private drawPlanetsAndMoons(): void {
    this.planetsGfx.clear();

    const cx = this.sunX;
    const cy = this.sunY;

    for (const p of this.planets) {
      const currentAngle = p.angle + this.timeElapsed * p.speed;
      const px = cx + Math.cos(currentAngle) * p.radiusX;
      const py = cy + Math.sin(currentAngle) * p.radiusY;

      // Planet disc
      this.planetsGfx.circle(px, py, p.size).fill({ color: p.color });

      // Rings for Saturn
      if (p.hasRing) {
        this.planetsGfx
          .ellipse(px, py, p.size * 2.2, p.size * 0.7)
          .stroke({ color: 0xfde68a, width: 2.0, alpha: 0.7 });
      }

      // Moon for Earth
      if (p.name === 'Earth') {
        const moonAngle = this.timeElapsed * 1.5;
        const mx = px + Math.cos(moonAngle) * 14;
        const my = py + Math.sin(moonAngle) * 14;
        this.planetsGfx.circle(mx, my, 2).fill({ color: 0xe2e8f0 });
      }
    }
  }

  private drawProbe(): void {
    this.probeGfx.clear();

    // Interplanetary deep-space probe trajectory arc (Earth to Mars transfer)
    const cx = this.sunX;
    const cy = this.sunY;

    const probeProgress = 0.25 + (this.timeElapsed * 0.04) % 0.6;
    const probeAngle = 3.5 + probeProgress * 1.3;
    const probeR = 280 + probeProgress * 90;

    const prx = cx + Math.cos(probeAngle) * probeR;
    const pry = cy + Math.sin(probeAngle) * (probeR * 0.43);

    // Trajectory dashed guide line
    this.probeGfx
      .ellipse(cx, cy, 330, 140)
      .stroke({ color: 0x4ade80, width: 1.2, alpha: 0.4 });

    // Probe body
    this.probeGfx.circle(prx, pry, 3).fill({ color: 0x4ade80 });
    this.probeGfx.circle(prx, pry, 6).stroke({ color: 0x4ade80, width: 1.0, alpha: 0.6 });

    // Comms pulse to Earth
    const pulseAlpha = 0.3 + Math.sin(this.timeElapsed * 5.0) * 0.3;
    this.probeGfx.circle(prx, pry, 12).stroke({ color: 0x4ade80, width: 0.8, alpha: pulseAlpha });
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    this.drawSun();
    this.drawOrbits();
    this.drawPlanetsAndMoons();
    this.drawProbe();
  }
}
