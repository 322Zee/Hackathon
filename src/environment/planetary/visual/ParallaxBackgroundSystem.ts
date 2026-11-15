/**
 * INTERSTELLAR CONTINUUM - Parallax Background System
 * Multi-layer 2D/2.5D background with starfields, celestial bodies
 * (Earth, Jupiter, Saturn), mountain silhouettes, and smooth camera parallax scrolling.
 */

import { Container, Graphics } from 'pixi.js';
import {
  BackgroundLayerConfig,
  CelestialBackdropConfig,
  EnvironmentQualityLevel,
} from '../PlanetaryEnvironmentTypes';
import { SeededRandom } from '../terrain/SeededRandom';

interface ParallaxLayerEntry {
  config: BackgroundLayerConfig;
  container: Container;
  graphics: Graphics;
  baseX: number;
  baseY: number;
}

export class ParallaxBackgroundSystem {
  public readonly container: Container;
  private layers: ParallaxLayerEntry[] = [];
  private rng: SeededRandom;

  constructor() {
    this.container = new Container();
    this.container.label = 'ParallaxBackgroundLayer';
    this.rng = new SeededRandom(42069);
  }

  /**
   * Initializes and renders background layers according to configuration.
   */
  public initialize(
    layerConfigs: readonly BackgroundLayerConfig[],
    worldWidth: number,
    worldHeight: number,
    quality: EnvironmentQualityLevel = EnvironmentQualityLevel.HIGH
  ): void {
    this.cleanup();

    for (const config of layerConfigs) {
      // In LOW quality, skip midground hills to save draw calls
      if (quality === EnvironmentQualityLevel.LOW && config.type === 'MIDGROUND_HILLS') {
        continue;
      }

      const layerContainer = new Container();
      layerContainer.label = `Parallax_${config.id}`;
      const gfx = new Graphics();
      layerContainer.addChild(gfx);

      this.renderLayerContent(gfx, config, worldWidth, worldHeight, quality);

      this.layers.push({
        config,
        container: layerContainer,
        graphics: gfx,
        baseX: 0,
        baseY: 0,
      });

      this.container.addChild(layerContainer);
    }
  }

  /**
   * Renders the graphical content for a single background layer.
   */
  private renderLayerContent(
    gfx: Graphics,
    config: BackgroundLayerConfig,
    worldWidth: number,
    worldHeight: number,
    quality: EnvironmentQualityLevel
  ): void {
    const w = Math.max(worldWidth, 3840);
    const h = Math.max(worldHeight, 2160);

    switch (config.type) {
      case 'SPACE_STARS': {
        // Deep space cosmic backdrop
        gfx.rect(0, 0, w, h);
        gfx.fill({ color: config.tint || 0x05070f, alpha: config.alpha });

        // Deterministic starfield
        const starCount = quality === EnvironmentQualityLevel.LOW ? 120 : quality === EnvironmentQualityLevel.ULTRA ? 450 : 250;
        this.rng.setSeed(7771);

        for (let i = 0; i < starCount; i++) {
          const sx = this.rng.nextFloat(0, w);
          const sy = this.rng.nextFloat(0, h * 0.7);
          const radius = this.rng.nextFloat(0.6, 2.2);
          const starAlpha = this.rng.nextFloat(0.35, 0.95);
          const starColor = this.rng.pick([0xffffff, 0xd4eaff, 0xffe9d4, 0x9bc2ff]);

          gfx.circle(sx, sy, radius);
          gfx.fill({ color: starColor, alpha: starAlpha });
        }
        break;
      }

      case 'CELESTIAL_BODY': {
        if (config.celestialBodyDetails) {
          this.renderCelestialBody(gfx, config.celestialBodyDetails, w, h);
        }
        break;
      }

      case 'DISTANT_MOUNTAINS':
      case 'MIDGROUND_HILLS': {
        if (config.mountainParams) {
          this.renderMountains(gfx, config.mountainParams, w, h, config.alpha);
        }
        break;
      }

      case 'ATMOSPHERIC_GRADIENT': {
        // Subtle vertical ambient gradient for atmospheric destinations
        gfx.rect(0, 0, w, h);
        gfx.fill({ color: config.tint, alpha: config.alpha });
        break;
      }
    }
  }

  /**
   * Renders detailed celestial body (e.g. Earth from Moon, Jupiter from Europa, Saturn from Enceladus).
   */
  private renderCelestialBody(
    gfx: Graphics,
    body: CelestialBackdropConfig,
    worldWidth: number,
    worldHeight: number
  ): void {
    const cx = worldWidth * (body.xPercent / 100);
    const cy = worldHeight * (body.yPercent / 100);
    const r = body.radius;

    // Atmospheric or corona outer glow
    gfx.circle(cx, cy, r * 1.35);
    gfx.fill({ color: body.glowColor, alpha: 0.18 });

    gfx.circle(cx, cy, r * 1.15);
    gfx.fill({ color: body.glowColor, alpha: 0.32 });

    // Main celestial sphere
    gfx.circle(cx, cy, r);
    gfx.fill({ color: body.color, alpha: 1.0 });

    // Surface details
    if (body.surfaceDetail === 'STRIPED_JOVIAN') {
      // Jupiter cloud bands
      const bandColors = [0x9e532b, 0xbd7d53, 0xd8a980, 0x8a4522, 0xc48c66];
      for (let i = -r + 15; i < r - 15; i += 22) {
        const chordHalfWidth = Math.sqrt(Math.max(0, r * r - i * i));
        const bandColor = bandColors[Math.abs(Math.floor(i / 22)) % bandColors.length];
        gfx.rect(cx - chordHalfWidth, cy + i, chordHalfWidth * 2, 12);
        gfx.fill({ color: bandColor, alpha: 0.85 });
      }

      // Great Red Spot
      gfx.ellipse(cx + r * 0.3, cy + r * 0.25, r * 0.22, r * 0.14);
      gfx.fill({ color: 0xb5351e, alpha: 0.95 });
    } else if (body.surfaceDetail === 'RINGED_SATURN' || body.hasRings) {
      // Saturn Ring System (inclined elliptical disc)
      gfx.ellipse(cx, cy, r * 2.3, r * 0.45);
      gfx.stroke({ color: 0xdec08a, width: 22, alpha: 0.85 });

      gfx.ellipse(cx, cy, r * 2.0, r * 0.38);
      gfx.stroke({ color: 0x423827, width: 4, alpha: 0.95 }); // Cassini Division

      gfx.ellipse(cx, cy, r * 1.6, r * 0.3);
      gfx.stroke({ color: 0xbfa36d, width: 14, alpha: 0.75 });
    } else if (body.surfaceDetail === 'BLUE_MARBLE_EARTH') {
      // Earth visible from Moon: oceans, swirling white clouds, continental green-brown
      gfx.circle(cx - r * 0.2, cy - r * 0.1, r * 0.45);
      gfx.fill({ color: 0x228b45, alpha: 0.85 }); // Continents

      gfx.circle(cx + r * 0.3, cy + r * 0.2, r * 0.35);
      gfx.fill({ color: 0x5a7d3a, alpha: 0.85 });

      // Cloud swirls
      gfx.ellipse(cx, cy - r * 0.25, r * 0.7, r * 0.2);
      gfx.fill({ color: 0xffffff, alpha: 0.65 });
      gfx.ellipse(cx - r * 0.15, cy + r * 0.3, r * 0.6, r * 0.18);
      gfx.fill({ color: 0xffffff, alpha: 0.65 });
    } else if (body.surfaceDetail === 'SOLAR_CORONA') {
      // Blazing Sun from Mercury
      gfx.circle(cx, cy, r * 1.8);
      gfx.fill({ color: 0xff8800, alpha: 0.15 });
      gfx.circle(cx, cy, r * 1.4);
      gfx.fill({ color: 0xffcc33, alpha: 0.3 });
    }
  }

  /**
   * Renders procedural mountain silhouette ridges.
   */
  private renderMountains(
    gfx: Graphics,
    params: { peakColor: number; baseColor: number; height: number; ruggedness: number; frequency: number },
    worldWidth: number,
    worldHeight: number,
    alpha: number
  ): void {
    const horizonBaseY = worldHeight * 0.75;
    const step = 40;
    const count = Math.ceil(worldWidth / step) + 1;

    this.rng.setSeed(params.peakColor);

    gfx.beginPath();
    gfx.moveTo(0, horizonBaseY);

    for (let i = 0; i <= count; i++) {
      const x = i * step;
      // Synthesize jagged peak profile
      const noise =
        Math.sin(x * params.frequency) * 0.6 +
        Math.cos(x * params.frequency * 2.3) * 0.3 +
        (this.rng.next() - 0.5) * params.ruggedness;
      const peakY = horizonBaseY - Math.abs(noise) * params.height;
      gfx.lineTo(x, peakY);
    }

    gfx.lineTo(worldWidth, worldHeight);
    gfx.lineTo(0, worldHeight);
    gfx.closePath();
    gfx.fill({ color: params.peakColor, alpha });
  }

  /**
   * Updates parallax offsets according to camera position.
   */
  public updateCamera(cameraX: number, cameraY: number): void {
    for (const layer of this.layers) {
      layer.container.x = -cameraX * layer.config.parallaxFactorX;
      layer.container.y = -cameraY * layer.config.parallaxFactorY;
    }
  }

  public cleanup(): void {
    for (const layer of this.layers) {
      layer.graphics.clear();
      layer.container.destroy({ children: true });
    }
    this.layers = [];
    this.container.removeChildren();
  }
}
