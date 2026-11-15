/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Central Shader & Post-Processing Filter Manager
 */

import { Filter } from 'pixi.js';
import { Logger } from '../../core/logging/Logger';

export interface IGameShaderFilter {
  readonly id: string;
  readonly filter: Filter;
  enabled: boolean;
  update(deltaSeconds: number, totalTime: number): void;
}

export class ShaderManager {
  private filters: Map<string, IGameShaderFilter> = new Map();
  private totalTime: number = 0;
  private shadersEnabled: boolean = true;
  private qualityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' = 'HIGH';

  constructor() {
    Logger.info('SHADER_MANAGER', 'Shader Manager initialized.');
  }

  public static isShaderEnvironmentSupported(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  public registerFilter(shaderFilter: IGameShaderFilter): void {
    if (this.filters.has(shaderFilter.id)) {
      Logger.warn('SHADER_MANAGER', `Filter "${shaderFilter.id}" already registered. Overwriting.`);
    }
    this.filters.set(shaderFilter.id, shaderFilter);
  }

  public getFilter(id: string): IGameShaderFilter | undefined {
    return this.filters.get(id);
  }

  public setFilterEnabled(id: string, enabled: boolean): void {
    const filter = this.filters.get(id);
    if (filter) {
      filter.enabled = enabled;
    }
  }

  public setShadersEnabled(enabled: boolean): void {
    this.shadersEnabled = enabled;
    for (const filter of this.filters.values()) {
      filter.enabled = enabled;
    }
    Logger.info('SHADER_MANAGER', `Shaders master toggle: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  public areShadersEnabled(): boolean {
    return this.shadersEnabled;
  }

  public setQuality(quality: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'): void {
    this.qualityLevel = quality;
    if (quality === 'LOW') {
      // Disable heavy post-processing shaders on low quality
      this.setFilterEnabled('AtmosphericHaze', false);
      this.setFilterEnabled('ThrusterHeat', false);
    } else {
      this.setFilterEnabled('AtmosphericHaze', true);
      this.setFilterEnabled('ThrusterHeat', true);
    }
    Logger.info('SHADER_MANAGER', `Shader quality profile set to: ${quality}`);
  }

  public getQuality(): string {
    return this.qualityLevel;
  }

  public update(deltaSeconds: number): void {
    if (!this.shadersEnabled) return;

    this.totalTime += deltaSeconds;

    for (const filter of this.filters.values()) {
      if (filter.enabled) {
        filter.update(deltaSeconds, this.totalTime);
      }
    }
  }

  public destroy(): void {
    for (const filter of this.filters.values()) {
      try {
        filter.filter.destroy();
      } catch {
        // Safe disposal
      }
    }
    this.filters.clear();
  }
}
