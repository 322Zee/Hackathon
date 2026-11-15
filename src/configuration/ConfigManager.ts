import { DEFAULT_GAME_CONFIG, GameConfiguration } from './GameConfig';
import { EventBus } from '../core/EventBus';

export class ConfigManager {
  private static readonly STORAGE_KEY = 'interstellar_continuum_config';
  private config: GameConfiguration;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.config = this.loadConfig();
  }

  public getConfig(): Readonly<GameConfiguration> {
    return this.config;
  }

  public updateDisplayConfig(partial: Partial<GameConfiguration['display']>): void {
    this.config.display = { ...this.config.display, ...partial };
    this.persist();
    this.notifyChange('display');
  }

  public updateGraphicsConfig(partial: Partial<GameConfiguration['graphics']>): void {
    this.config.graphics = { ...this.config.graphics, ...partial };
    this.persist();
    this.notifyChange('graphics');
  }

  public updateAudioConfig(partial: Partial<GameConfiguration['audio']>): void {
    this.config.audio = { ...this.config.audio, ...partial };
    this.persist();
    this.notifyChange('audio');
  }

  public updateInputConfig(partial: Partial<GameConfiguration['input']>): void {
    this.config.input = { ...this.config.input, ...partial };
    this.persist();
    this.notifyChange('input');
  }

  public updateAccessibilityConfig(partial: Partial<GameConfiguration['accessibility']>): void {
    this.config.accessibility = { ...this.config.accessibility, ...partial };
    this.persist();
    this.notifyChange('accessibility');
  }

  public resetToDefaults(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
    this.persist();
    this.notifyChange('all');
  }

  private loadConfig(): GameConfiguration {
    try {
      if (typeof localStorage === 'undefined') {
        return JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
      }
      const raw = localStorage.getItem(ConfigManager.STORAGE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
      }
      const parsed = JSON.parse(raw);
      return this.mergeWithDefaults(parsed);
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
    }
  }

  private mergeWithDefaults(loaded: Partial<GameConfiguration>): GameConfiguration {
    return {
      display: { ...DEFAULT_GAME_CONFIG.display, ...(loaded.display || {}) },
      graphics: { ...DEFAULT_GAME_CONFIG.graphics, ...(loaded.graphics || {}) },
      audio: { ...DEFAULT_GAME_CONFIG.audio, ...(loaded.audio || {}) },
      input: { ...DEFAULT_GAME_CONFIG.input, ...(loaded.input || {}) },
      accessibility: { ...DEFAULT_GAME_CONFIG.accessibility, ...(loaded.accessibility || {}) },
    };
  }

  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ConfigManager.STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (err) {
      console.warn('[ConfigManager] Failed to persist config to localStorage:', err);
    }
  }

  private notifyChange(category: string): void {
    if (this.eventBus) {
      this.eventBus.emit('config:changed', { category, config: this.config });
    }
  }
}
