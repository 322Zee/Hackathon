/**
 * INTERSTELLAR CONTINUUM - Rover Dust Particle System
 * Emits terrain-colored dust plumes at wheel contact points during surface movement.
 */

import { Container, Graphics } from 'pixi.js';
import { TerrainType, Vector2D } from '../ExplorationTypes';

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  maxAge: number;
  age: number;
  color: number;
}

export class RoverDustParticles {
  public readonly container: Container = new Container();
  private particles: DustMote[] = [];
  private graphics: Graphics = new Graphics();
  private maxParticles: number = 60;

  constructor() {
    this.container.label = 'RoverDustParticles';
    this.container.addChild(this.graphics);
  }

  public emit(
    contactPoint: Vector2D,
    roverHeadingDeg: number,
    roverSpeed: number,
    terrainType: TerrainType
  ): void {
    if (Math.abs(roverSpeed) < 15) return;
    if (this.particles.length >= this.maxParticles) return;

    // Determine dust color based on terrain/celestial body
    let dustColor = 0xc27a4a; // Martian rust orange
    if (terrainType === TerrainType.CRYOGENIC_ICE) {
      dustColor = 0xb4e1ff; // Ice cyan/white
    } else if (terrainType === TerrainType.REGOLITH_DUNES || terrainType === TerrainType.SMOOTH_PLAINS) {
      dustColor = 0x8a929a; // Lunar gray
    }

    // Emit 2-3 motes kicking backward from heading
    const count = Math.min(3, Math.floor(Math.abs(roverSpeed) / 40) + 1);
    const kickbackAngle = (roverHeadingDeg + 180 + (Math.random() * 40 - 20) - 90) * (Math.PI / 180);

    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * 12;
      const spreadY = (Math.random() - 0.5) * 12;
      const kickSpeed = (Math.abs(roverSpeed) * 0.25 + Math.random() * 20);

      this.particles.push({
        x: contactPoint.x + spreadX,
        y: contactPoint.y + spreadY,
        vx: Math.cos(kickbackAngle) * kickSpeed + (Math.random() - 0.5) * 10,
        vy: Math.sin(kickbackAngle) * kickSpeed + (Math.random() - 0.5) * 10,
        alpha: 0.6 + Math.random() * 0.3,
        scale: 2.0 + Math.random() * 3.0,
        maxAge: 0.6 + Math.random() * 0.5,
        age: 0,
        color: dustColor,
      });
    }
  }

  public update(deltaSeconds: number): void {
    if (this.particles.length === 0) {
      this.graphics.clear();
      return;
    }

    this.graphics.clear();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.age += deltaSeconds;

      if (p.age >= p.maxAge) {
        this.particles.splice(i, 1);
        continue;
      }

      // Drag deceleration
      p.vx *= Math.pow(0.85, deltaSeconds * 60);
      p.vy *= Math.pow(0.85, deltaSeconds * 60);
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;

      // Expand and fade out
      const progress = p.age / p.maxAge;
      const currentAlpha = p.alpha * (1 - progress);
      const currentScale = p.scale * (1 + progress * 1.5);

      this.graphics.circle(p.x, p.y, currentScale);
      this.graphics.fill({ color: p.color, alpha: currentAlpha });
    }
  }

  public clear(): void {
    this.particles = [];
    this.graphics.clear();
  }
}
