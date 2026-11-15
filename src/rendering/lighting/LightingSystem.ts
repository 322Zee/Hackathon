/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * 2D Lighting System and Lightmap Compositor
 */

import { Container, Graphics } from 'pixi.js';
import { LightSource } from './LightSource';
import {
  LightSourceConfig,
  LightType,
  AmbientLightConfig,
  LightingEnvironmentPreset,
} from './LightTypes';
import { LIGHTING_PRESETS } from './LightingPresets';
import { Logger } from '../../core/logging/Logger';

export class LightingSystem {
  private container: Container;
  private ambientOverlay: Graphics;
  private lightsContainer: Container;
  private lights: Map<string, LightSource> = new Map();
  private ambient: AmbientLightConfig = { color: 0x050b14, intensity: 0.35 };
  private isEnabled: boolean = true;
  private virtualWidth: number = 1920;
  private virtualHeight: number = 1080;

  constructor(targetLayerContainer: Container, virtualWidth: number = 1920, virtualHeight: number = 1080) {
    this.container = targetLayerContainer;
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    // Ambient Darkness Overlay
    this.ambientOverlay = new Graphics();
    this.ambientOverlay.label = 'Lighting:AmbientOverlay';

    // Lights Container
    this.lightsContainer = new Container();
    this.lightsContainer.label = 'Lighting:LightsGroup';
    (this.lightsContainer as any).blendMode = 'add';

    this.container.addChild(this.ambientOverlay);
    this.container.addChild(this.lightsContainer);

    this.renderAmbient();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.container.visible = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setAmbient(color: number, intensity: number): void {
    this.ambient.color = color;
    this.ambient.intensity = Math.max(0, Math.min(1.0, intensity));
    this.renderAmbient();
  }

  public getAmbient(): Readonly<AmbientLightConfig> {
    return this.ambient;
  }

  public applyPreset(presetNameOrConfig: string | LightingEnvironmentPreset): void {
    const preset =
      typeof presetNameOrConfig === 'string'
        ? LIGHTING_PRESETS[presetNameOrConfig]
        : presetNameOrConfig;

    if (!preset) {
      Logger.warn('LIGHTING_SYSTEM', `Unknown lighting preset: "${presetNameOrConfig}"`);
      return;
    }

    this.setAmbient(preset.ambient.color, preset.ambient.intensity);
    Logger.info('LIGHTING_SYSTEM', `Applied lighting preset: "${preset.name}"`);
  }

  public addLight(config: LightSourceConfig): LightSource {
    if (this.lights.has(config.id)) {
      Logger.warn('LIGHTING_SYSTEM', `Light with id "${config.id}" already exists. Replacing.`);
      this.removeLight(config.id);
    }

    const light = new LightSource(config);
    this.lights.set(config.id, light);
    this.lightsContainer.addChild(light.graphics);
    return light;
  }

  public removeLight(id: string): void {
    const light = this.lights.get(id);
    if (light) {
      this.lightsContainer.removeChild(light.graphics);
      light.destroy();
      this.lights.delete(id);
    }
  }

  public getLight(id: string): LightSource | undefined {
    return this.lights.get(id);
  }

  public getLights(): LightSource[] {
    return Array.from(this.lights.values());
  }

  public clearLights(): void {
    for (const light of this.lights.values()) {
      this.lightsContainer.removeChild(light.graphics);
      light.destroy();
    }
    this.lights.clear();
  }

  public update(deltaSeconds: number): void {
    if (!this.isEnabled) return;

    for (const light of this.lights.values()) {
      light.update(deltaSeconds);
      this.renderLight(light);
    }
  }

  private renderAmbient(): void {
    this.ambientOverlay.clear();
    // Invert intensity so higher intensity means less darkness alpha
    const darknessAlpha = Math.max(0, 1.0 - this.ambient.intensity);
    this.ambientOverlay.rect(-2000, -2000, this.virtualWidth + 4000, this.virtualHeight + 4000);
    this.ambientOverlay.fill({ color: this.ambient.color, alpha: darknessAlpha });
  }

  private renderLight(light: LightSource): void {
    const g = light.graphics;
    g.clear();

    if (!light.enabled || light.intensity <= 0.01) {
      return;
    }

    g.position.set(light.x, light.y);

    if (light.type === LightType.POINT) {
      // 3-ring smooth radial falloff approximation for efficient WebGL batching
      const steps = 4;
      for (let i = steps; i >= 1; i--) {
        const stepRatio = i / steps;
        const currentRadius = light.radius * stepRatio;
        const stepAlpha = (light.intensity / steps) * (1.1 - stepRatio * 0.7);

        g.circle(0, 0, currentRadius);
        g.fill({ color: light.color, alpha: Math.min(1.0, stepAlpha) });
      }

      // Hot core center
      g.circle(0, 0, light.radius * 0.12);
      g.fill({ color: 0xffffff, alpha: Math.min(1.0, light.intensity * 0.9) });
    } else if (light.type === LightType.SPOT) {
      // Spot/Cone light
      const halfCone = light.coneAngle / 2;
      const startAngle = light.direction - halfCone;
      const endAngle = light.direction + halfCone;

      const steps = 3;
      for (let i = steps; i >= 1; i--) {
        const stepRatio = i / steps;
        const currentRadius = light.radius * stepRatio;
        const stepAlpha = (light.intensity / steps) * (1.0 - stepRatio * 0.6);

        g.moveTo(0, 0);
        g.arc(0, 0, currentRadius, startAngle, endAngle);
        g.lineTo(0, 0);
        g.fill({ color: light.color, alpha: Math.min(1.0, stepAlpha) });
      }
    }
  }

  public destroy(): void {
    this.clearLights();
    this.ambientOverlay.destroy();
    this.lightsContainer.destroy();
  }
}
