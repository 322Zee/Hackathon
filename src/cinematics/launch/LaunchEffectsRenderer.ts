/**
 * INTERSTELLAR CONTINUUM - Launch Effects Renderer
 * Orchestrates shader filters (ThrusterHeatFilter, AtmosphericHazeFilter),
 * supersonic shock diamond oscillations, lens flares, and dynamic plume glow.
 */

import { Container, Graphics } from 'pixi.js';
import { ThrusterHeatFilter } from '../../rendering/shaders/filters/ThrusterHeatFilter';
import { ShaderManager } from '../../rendering/shaders/ShaderManager';
import { LaunchVisualQuality } from './LaunchCinematicTypes';

export interface LaunchEffectsRendererOptions {
  enableShaders?: boolean;
  quality?: LaunchVisualQuality;
}

export class LaunchEffectsRenderer {
  public readonly container: Container;

  private plumeGlowGfx: Graphics;
  private shockDiamondsGfx: Graphics;
  private lensFlareGfx: Graphics;

  private heatFilter?: ThrusterHeatFilter;
  private shadersSupported: boolean = false;
  private shadersEnabled: boolean;
  private quality: LaunchVisualQuality;

  private elapsedTime: number = 0;
  private flickerTimer: number = 0;

  constructor(options: LaunchEffectsRendererOptions = {}) {
    this.shadersEnabled = options.enableShaders ?? true;
    this.quality = options.quality ?? LaunchVisualQuality.HIGH;

    this.container = new Container();
    this.container.label = 'LaunchEffectsRenderer';

    this.plumeGlowGfx = new Graphics();
    this.container.addChild(this.plumeGlowGfx);

    this.shockDiamondsGfx = new Graphics();
    this.container.addChild(this.shockDiamondsGfx);

    this.lensFlareGfx = new Graphics();
    this.container.addChild(this.lensFlareGfx);

    // Initialize Shader Filter if supported and enabled
    if (this.shadersEnabled && ShaderManager.isShaderEnvironmentSupported()) {
      try {
        this.heatFilter = new ThrusterHeatFilter({
          speed: 5.0,
          frequency: 30.0,
          amplitude: this.quality === LaunchVisualQuality.HIGH ? 0.008 : 0.004,
        });
        if (this.heatFilter.filter) {
          this.container.filters = [this.heatFilter.filter];
          this.shadersSupported = true;
        }
      } catch {
        this.shadersSupported = false;
      }
    }
  }

  public setQuality(quality: LaunchVisualQuality): void {
    this.quality = quality;
    if (this.heatFilter && this.shadersSupported) {
      this.heatFilter.enabled = quality !== LaunchVisualQuality.LOW;
    }
  }

  public setShadersEnabled(enabled: boolean): void {
    this.shadersEnabled = enabled;
    if (this.heatFilter) {
      this.heatFilter.enabled = enabled;
      this.container.filters = enabled && this.heatFilter.filter ? [this.heatFilter.filter] : [];
    }
  }

  /**
   * Updates exhaust graphics, supersonic shock diamonds, and heat ripples
   */
  public update(originX: number, originY: number, throttle: number, deltaSeconds: number): void {
    this.elapsedTime += deltaSeconds;
    this.flickerTimer += deltaSeconds * 28.0;

    // 1. Update shader filter time uniform
    if (this.heatFilter && this.shadersSupported && this.shadersEnabled) {
      this.heatFilter.update(deltaSeconds, this.elapsedTime);
    }

    this.plumeGlowGfx.clear();
    this.shockDiamondsGfx.clear();
    this.lensFlareGfx.clear();

    if (throttle <= 0.01) return;

    // Subtle rapid high-frequency flicker (1.0 +/- 0.08)
    const flicker = 1.0 + Math.sin(this.flickerTimer) * 0.08;

    // 2. Volumetric Flame Plume Cone (Luminous white-blue core transitioning to amber)
    const plumeLen = (140 + Math.sin(this.flickerTimer * 1.5) * 20) * throttle * flicker;
    const plumeHalfW = (18 + Math.cos(this.flickerTimer) * 3) * throttle;

    // Outer amber flame envelope
    this.plumeGlowGfx.moveTo(originX - plumeHalfW * 1.3, originY);
    this.plumeGlowGfx.lineTo(originX, originY + plumeLen * 1.15);
    this.plumeGlowGfx.lineTo(originX + plumeHalfW * 1.3, originY);
    this.plumeGlowGfx.closePath();
    this.plumeGlowGfx.fill({ color: 0xf97316, alpha: 0.45 * throttle });

    // Inner bright yellow flame
    this.plumeGlowGfx.moveTo(originX - plumeHalfW, originY);
    this.plumeGlowGfx.lineTo(originX, originY + plumeLen);
    this.plumeGlowGfx.lineTo(originX + plumeHalfW, originY);
    this.plumeGlowGfx.closePath();
    this.plumeGlowGfx.fill({ color: 0xfde047, alpha: 0.8 * throttle });

    // White-hot core stream
    this.plumeGlowGfx.moveTo(originX - plumeHalfW * 0.5, originY);
    this.plumeGlowGfx.lineTo(originX, originY + plumeLen * 0.65);
    this.plumeGlowGfx.lineTo(originX + plumeHalfW * 0.5, originY);
    this.plumeGlowGfx.closePath();
    this.plumeGlowGfx.fill({ color: 0xffffff, alpha: 0.95 * throttle });

    // 3. Supersonic Shock Diamonds / Mach Disks (Rendered when throttle > 0.65)
    if (throttle > 0.65 && this.quality !== LaunchVisualQuality.LOW) {
      const numDiamonds = 4;
      const diamondSpacing = (plumeLen * 0.7) / numDiamonds;

      for (let i = 1; i <= numDiamonds; i++) {
        const dy = originY + i * diamondSpacing;
        const dw = (plumeHalfW * 0.6) / i;
        const dh = dw * 1.4;

        // Diamond lozenge (rhombus)
        this.shockDiamondsGfx.moveTo(originX, dy - dh);
        this.shockDiamondsGfx.lineTo(originX + dw, dy);
        this.shockDiamondsGfx.lineTo(originX, dy + dh);
        this.shockDiamondsGfx.lineTo(originX - dw, dy);
        this.shockDiamondsGfx.closePath();
        this.shockDiamondsGfx.fill({ color: 0x67e8f9, alpha: 0.85 * throttle }); // Pale cyan mach disk
        this.shockDiamondsGfx.stroke({ color: 0xffffff, width: 1, alpha: 0.9 });
      }
    }

    // 4. Optical Lens Flare Anamorphic Streak (Horizontal glare across camera sensor)
    if (throttle > 0.8 && this.quality === LaunchVisualQuality.HIGH) {
      const streakW = 220 * throttle;
      this.lensFlareGfx.ellipse(originX, originY + 15, streakW, 2.5);
      this.lensFlareGfx.fill({ color: 0x38bdf8, alpha: 0.45 * throttle });

      this.lensFlareGfx.ellipse(originX, originY + 15, streakW * 0.35, 4);
      this.lensFlareGfx.fill({ color: 0xffffff, alpha: 0.75 * throttle });
    }
  }

  public clear(): void {
    this.plumeGlowGfx.clear();
    this.shockDiamondsGfx.clear();
    this.lensFlareGfx.clear();
  }

  public destroy(): void {
    this.clear();
    this.container.filters = [];
    this.container.destroy({ children: true });
  }
}
