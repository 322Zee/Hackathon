/**
 * INTERSTELLAR CONTINUUM - Rover Tire Track Decals
 * Renders fading wheel tracks on the terrain surface.
 */

import { Container, Graphics } from 'pixi.js';
import { Vector2D } from '../ExplorationTypes';

interface TrackSegment {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  alpha: number;
}

export class RoverTireTracks {
  public readonly container: Container = new Container();
  private graphics: Graphics = new Graphics();
  private tracks: TrackSegment[] = [];
  private lastEmitLocation?: Vector2D;
  private readonly TRACK_SPACING = 16.0; // Px distance between tread marks
  private readonly MAX_TRACKS = 80;

  constructor() {
    this.container.label = 'RoverTireTracks';
    this.container.addChild(this.graphics);
  }

  public recordTrack(roverLocation: Vector2D, headingDeg: number, wheelGaugeWidth: number = 28): void {
    if (this.lastEmitLocation) {
      const dist = Math.hypot(roverLocation.x - this.lastEmitLocation.x, roverLocation.y - this.lastEmitLocation.y);
      if (dist < this.TRACK_SPACING) return;
    }

    this.lastEmitLocation = { ...roverLocation };

    // Calculate left and right wheel positions orthogonal to heading
    const headingRad = (headingDeg - 90) * (Math.PI / 180);
    const perpX = -Math.sin(headingRad);
    const perpY = Math.cos(headingRad);
    const halfGauge = wheelGaugeWidth * 0.5;

    this.tracks.push({
      leftX: roverLocation.x + perpX * halfGauge,
      leftY: roverLocation.y + perpY * halfGauge,
      rightX: roverLocation.x - perpX * halfGauge,
      rightY: roverLocation.y - perpY * halfGauge,
      alpha: 0.45,
    });

    if (this.tracks.length > this.MAX_TRACKS) {
      this.tracks.shift();
    }
  }

  public update(deltaSeconds: number): void {
    if (this.tracks.length === 0) return;

    this.graphics.clear();

    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const t = this.tracks[i]!;
      t.alpha -= 0.02 * deltaSeconds;

      if (t.alpha <= 0) {
        this.tracks.splice(i, 1);
        continue;
      }

      // Draw small tire tread imprint dots/lines
      this.graphics.circle(t.leftX, t.leftY, 2.5);
      this.graphics.fill({ color: 0x111622, alpha: t.alpha });

      this.graphics.circle(t.rightX, t.rightY, 2.5);
      this.graphics.fill({ color: 0x111622, alpha: t.alpha });
    }
  }

  public clear(): void {
    this.tracks = [];
    this.graphics.clear();
    this.lastEmitLocation = undefined;
  }
}
