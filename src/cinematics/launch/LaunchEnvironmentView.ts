/**
 * INTERSTELLAR CONTINUUM - Launch Environment View
 * 2.5D multi-layer parallax environment with dynamic altitude-based atmospheric gradient
 * (troposphere to outer space), starfield emergence, gantry umbilical infrastructure,
 * lightning towers, and dynamic plume illumination bounce.
 */

import { Container, Graphics } from 'pixi.js';
import { LaunchEnvironmentConfig } from './LaunchCinematicTypes';

export class LaunchEnvironmentView {
  public readonly container: Container;

  // Layer containers in depth order (back to front)
  private spaceContainer: Container;
  private skyContainer: Container;
  private highCloudsContainer: Container;
  private lowCloudsContainer: Container;
  private horizonContainer: Container;
  private padContainer: Container;
  private plumeLightContainer: Container;

  // Graphics nodes
  private starfieldGfx: Graphics;
  private skyGradientGfx: Graphics;
  private highCloudsGfx: Graphics;
  private lowCloudsGfx: Graphics;
  private horizonGfx: Graphics;
  private padStructureGfx: Graphics;
  private towerGfx: Graphics;
  private umbilicalArmsGfx: Graphics;
  private plumeLightGfx: Graphics;

  // Configuration
  private timeOfDay: 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';
  private cloudCover: number;

  // Warning beacon blink phase
  private blinkTimer: number = 0;

  constructor(config: LaunchEnvironmentConfig = {}) {
    this.timeOfDay = config.timeOfDay ?? 'DAY';
    this.cloudCover = config.cloudCover ?? 0.3;

    this.container = new Container();
    this.container.label = 'LaunchEnvironmentView';

    // 1. Space & Starfield (Deepest layer)
    this.spaceContainer = new Container();
    this.spaceContainer.label = 'Env_Space';
    this.container.addChild(this.spaceContainer);

    this.starfieldGfx = new Graphics();
    this.spaceContainer.addChild(this.starfieldGfx);

    // 2. Sky Dome Atmosphere
    this.skyContainer = new Container();
    this.skyContainer.label = 'Env_Sky';
    this.container.addChild(this.skyContainer);

    this.skyGradientGfx = new Graphics();
    this.skyContainer.addChild(this.skyGradientGfx);

    // 3. High Stratospheric Clouds
    this.highCloudsContainer = new Container();
    this.highCloudsContainer.label = 'Env_HighClouds';
    this.container.addChild(this.highCloudsContainer);

    this.highCloudsGfx = new Graphics();
    this.highCloudsContainer.addChild(this.highCloudsGfx);

    // 4. Low Tropospheric Clouds
    this.lowCloudsContainer = new Container();
    this.lowCloudsContainer.label = 'Env_LowClouds';
    this.container.addChild(this.lowCloudsContainer);

    this.lowCloudsGfx = new Graphics();
    this.lowCloudsContainer.addChild(this.lowCloudsGfx);

    // 5. Horizon & Distant Geography
    this.horizonContainer = new Container();
    this.horizonContainer.label = 'Env_Horizon';
    this.container.addChild(this.horizonContainer);

    this.horizonGfx = new Graphics();
    this.horizonContainer.addChild(this.horizonGfx);

    // 6. Launchpad Structure & Towers
    this.padContainer = new Container();
    this.padContainer.label = 'Env_LaunchPad';
    this.container.addChild(this.padContainer);

    this.padStructureGfx = new Graphics();
    this.padContainer.addChild(this.padStructureGfx);

    this.towerGfx = new Graphics();
    this.padContainer.addChild(this.towerGfx);

    this.umbilicalArmsGfx = new Graphics();
    this.padContainer.addChild(this.umbilicalArmsGfx);

    // 7. Dynamic Plume Light Overlay
    this.plumeLightContainer = new Container();
    this.plumeLightContainer.label = 'Env_PlumeLight';
    this.container.addChild(this.plumeLightContainer);

    this.plumeLightGfx = new Graphics();
    this.plumeLightContainer.addChild(this.plumeLightGfx);

    this.initStaticGeometry();
    this.setAltitudeKm(0);
  }

  /**
   * Builds the initial terrain, launch towers, gantry, and stars
   */
  private initStaticGeometry(): void {
    // 1. Procedural Starfield (120 stars scattered across the celestial dome)
    this.starfieldGfx.clear();
    // Starry backdrop rect
    this.starfieldGfx.rect(-1000, -2000, 4000, 3500).fill({ color: 0x010409 });
    for (let i = 0; i < 140; i++) {
      const sx = (i * 137.5) % 2400 - 200;
      const sy = ((i * 269.3) % 2000) - 1500;
      const size = 1 + (i % 3) * 0.7;
      const alpha = 0.4 + (i % 5) * 0.14;
      this.starfieldGfx.circle(sx, sy, size);
      this.starfieldGfx.fill({ color: 0xffffff, alpha });
    }

    // 2. High Cirrus Clouds
    this.highCloudsGfx.clear();
    for (let i = 0; i < 8; i++) {
      const cx = (i * 280) % 2200 - 100;
      const cy = -800 + (i % 3) * 120;
      this.highCloudsGfx.ellipse(cx, cy, 260, 28);
      this.highCloudsGfx.fill({ color: 0xffffff, alpha: 0.12 * this.cloudCover });
    }

    // 3. Low Cumulus Clouds
    this.lowCloudsGfx.clear();
    for (let i = 0; i < 6; i++) {
      const cx = (i * 350) % 2100;
      const cy = 200 + (i % 2) * 80;
      this.lowCloudsGfx.ellipse(cx, cy, 180, 45);
      this.lowCloudsGfx.fill({ color: 0xf1f5f9, alpha: 0.22 * this.cloudCover });
    }

    // 4. Distant Horizon (Coastal mountains & ocean line at y ~ 650)
    this.horizonGfx.clear();
    // Distant water / ocean band
    this.horizonGfx.rect(-500, 680, 3000, 400).fill({ color: 0x0f172a });
    // Coastal low hills silhouette
    this.horizonGfx.moveTo(-200, 680);
    this.horizonGfx.bezierCurveTo(200, 620, 600, 660, 1000, 610);
    this.horizonGfx.bezierCurveTo(1400, 580, 1800, 650, 2200, 630);
    this.horizonGfx.lineTo(2200, 750);
    this.horizonGfx.lineTo(-200, 750);
    this.horizonGfx.closePath();
    this.horizonGfx.fill({ color: 0x1e293b, alpha: 0.85 });

    // 5. Launch Pad Alpha Infrastructure (Centered around Pad x = 960, y = 720)
    const padX = 960;
    const padY = 720;

    this.padStructureGfx.clear();

    // Ground terrain apron
    this.padStructureGfx.rect(-400, padY - 20, 2800, 500).fill({ color: 0x1e293b });
    this.padStructureGfx.rect(-400, padY + 120, 2800, 400).fill({ color: 0x0f172a });

    // Concrete Launch Table
    this.padStructureGfx.roundRect(padX - 160, padY - 30, 320, 45, 4);
    this.padStructureGfx.fill({ color: 0x334155 });
    this.padStructureGfx.stroke({ color: 0x475569, width: 2 });

    // Dual Flame Deflector Trench
    this.padStructureGfx.rect(padX - 130, padY + 15, 260, 40);
    this.padStructureGfx.fill({ color: 0x090d16 });

    // Hold-down mount clamps (left and right of nozzle cluster)
    this.padStructureGfx.rect(padX - 42, padY - 38, 14, 12).fill({ color: 0xf59e0b });
    this.padStructureGfx.rect(padX + 28, padY - 38, 14, 12).fill({ color: 0xf59e0b });

    // Left Lightning Tower
    this.drawLightningMast(this.padStructureGfx, padX - 320, padY - 30, 380);
    // Right Lightning Tower
    this.drawLightningMast(this.padStructureGfx, padX + 320, padY - 30, 380);

    // Red umbilical service gantry tower on the right side of rocket
    this.drawUmbilicalTower(padX + 75, padY - 30, 320);
    this.renderUmbilicalArms(0);
  }

  private drawLightningMast(gfx: Graphics, x: number, y: number, height: number): void {
    // Tapered lattice tower
    gfx.moveTo(x - 14, y);
    gfx.lineTo(x - 2, y - height);
    gfx.lineTo(x + 2, y - height);
    gfx.lineTo(x + 14, y);
    gfx.closePath();
    gfx.stroke({ color: 0x64748b, width: 1.5 });
    gfx.fill({ color: 0x1e293b, alpha: 0.6 });

    // Lightning rod tip
    gfx.moveTo(x, y - height);
    gfx.lineTo(x, y - height - 35);
    gfx.stroke({ color: 0x94a3b8, width: 2 });
  }

  private drawUmbilicalTower(x: number, y: number, height: number): void {
    this.towerGfx.clear();
    const w = 46;

    // Steel truss tower body (Aerospace red / hazard orange)
    this.towerGfx.rect(x, y - height, w, height);
    this.towerGfx.fill({ color: 0x7f1d1d, alpha: 0.7 });
    this.towerGfx.stroke({ color: 0xb91c1c, width: 2 });

    // Internal cross-bracing truss lines
    const numSections = 8;
    const secH = height / numSections;
    for (let i = 0; i < numSections; i++) {
      const sy = y - height + i * secH;
      this.towerGfx.moveTo(x, sy);
      this.towerGfx.lineTo(x + w, sy + secH);
      this.towerGfx.moveTo(x + w, sy);
      this.towerGfx.lineTo(x, sy + secH);
      this.towerGfx.stroke({ color: 0xef4444, width: 1, alpha: 0.6 });
    }

    // Top crane arm
    this.towerGfx.rect(x - 20, y - height - 14, w + 35, 14);
    this.towerGfx.fill({ color: 0xd97706 });
  }

  /**
   * Renders the pneumatic swing arms with rotation / retraction parameter (0 = attached, 1 = swung away)
   */
  public renderUmbilicalArms(retraction: number): void {
    this.umbilicalArmsGfx.clear();

    const towerX = 960 + 75;
    const padY = 720 - 30;

    // Upper payload service arm
    const upperY = padY - 240;
    const armLen = 78;
    const swingAngle = -retraction * 0.65; // Swings back towards tower

    this.umbilicalArmsGfx.moveTo(towerX, upperY);
    const endX1 = towerX - Math.cos(swingAngle) * armLen;
    const endY1 = upperY + Math.sin(swingAngle) * armLen * 0.4;
    this.umbilicalArmsGfx.lineTo(endX1, endY1);
    this.umbilicalArmsGfx.stroke({ color: 0xf59e0b, width: 3.5 });

    // Lower interstage propellant umbilical arm
    const lowerY = padY - 140;
    this.umbilicalArmsGfx.moveTo(towerX, lowerY);
    const endX2 = towerX - Math.cos(swingAngle) * (armLen * 0.85);
    const endY2 = lowerY + Math.sin(swingAngle) * (armLen * 0.35);
    this.umbilicalArmsGfx.lineTo(endX2, endY2);
    this.umbilicalArmsGfx.stroke({ color: 0xf59e0b, width: 3.5 });
  }

  /**
   * Updates parallax offsets, sky dome color interpolation, and atmospheric haze by altitude (0 to 120 km)
   */
  public setAltitudeKm(altitudeKm: number): void {
    // 1. Sky Gradient Interpolation based on atmospheric layer
    this.skyGradientGfx.clear();

    // Altitude factor: 0.0 (ground) to 1.0 (space, >= 80 km)
    const spaceFactor = Math.min(1.0, altitudeKm / 80);

    // Color transition:
    // Ground: Daylight cyan (0x0284c7) -> Horizon glow (0x38bdf8)
    // Stratosphere (25km): Deep cobalt (0x032b69)
    // Mesosphere (50km): Indigo midnight (0x040e2d)
    // Space (80km+): Pitch black (0x010409)
    let topColor = 0x0369a1;
    let botColor = 0x38bdf8;

    if (this.timeOfDay === 'SUNSET') {
      topColor = 0x4c1d95;
      botColor = 0xf97316;
    } else if (this.timeOfDay === 'NIGHT') {
      topColor = 0x020617;
      botColor = 0x0f172a;
    }

    if (spaceFactor > 0.01) {
      // Fade sky dome alpha to expose starfield
      this.skyContainer.alpha = Math.max(0, 1.0 - spaceFactor * 1.15);
      this.spaceContainer.alpha = Math.min(1.0, spaceFactor * 1.4);
    } else {
      this.skyContainer.alpha = 1.0;
      this.spaceContainer.alpha = 0.0;
    }

    // Render full canvas sky rect
    this.skyGradientGfx.rect(-500, -1500, 3000, 3000).fill({ color: topColor });

    // Horizon atmospheric haze band
    const hazeAlpha = Math.max(0, (1.0 - spaceFactor) * 0.7);
    this.skyGradientGfx.rect(-500, 400, 3000, 500).fill({ color: botColor, alpha: hazeAlpha });

    // 2. Parallax Layer Shifts (Ground recedes downward as altitude rises)
    // World pixel shift representing altitude climb
    const altPx = altitudeKm * 150;

    // Pad moves down fastest (parallax = 1.0)
    this.padContainer.position.y = altPx * 1.0;

    // Horizon moves down slower (parallax = 0.18)
    this.horizonContainer.position.y = altPx * 0.18;

    // Low clouds move moderately (parallax = 0.45)
    this.lowCloudsContainer.position.y = altPx * 0.45;

    // High clouds move slowly (parallax = 0.12)
    this.highCloudsContainer.position.y = altPx * 0.12;

    // Starfield stays fixed or moves imperceptibly (parallax = 0.01)
    this.spaceContainer.position.y = altPx * 0.01;
  }

  /**
   * Dynamic lighting flash cast by rocket engines on pad structure and terrain
   */
  public setEnginePlumeIllumination(x: number, y: number, throttle: number): void {
    this.plumeLightGfx.clear();
    if (throttle <= 0.01) {
      this.plumeLightContainer.alpha = 0;
      return;
    }

    this.plumeLightContainer.alpha = Math.min(1.0, throttle);

    // Warm radial light bloom on ground and tower
    const radius = 180 + throttle * 220;
    this.plumeLightGfx.circle(x, y + 20, radius);
    this.plumeLightGfx.fill({ color: 0xf97316, alpha: 0.35 * throttle });

    // Bright intense core reflection
    this.plumeLightGfx.circle(x, y + 10, radius * 0.45);
    this.plumeLightGfx.fill({ color: 0xffedd5, alpha: 0.65 * throttle });
  }

  /**
   * Per-frame animation tick for tower beacon flashing
   */
  public tick(deltaSeconds: number): void {
    this.blinkTimer += deltaSeconds * 3.0;
    // Tower red hazard warning lights blink
    const isLit = Math.sin(this.blinkTimer) > 0;
    this.towerGfx.alpha = isLit ? 1.0 : 0.85;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
