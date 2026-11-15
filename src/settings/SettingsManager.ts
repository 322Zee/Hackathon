/**
 * INTERSTELLAR CONTINUUM - Centralized Settings Manager
 * Production-ready settings manager governing Graphics, Audio, Controls,
 * Accessibility, Interface, and Gameplay configurations.
 * Persists independently from organisation save progression in localStorage.
 */

import {
  FullSettingsSchema,
  SettingsCategory,
  GraphicsQualityPreset,
  DEFAULT_SETTINGS,
  GRAPHICS_PRESETS,
  DEFAULT_CONTROLS_BINDINGS,
} from './SettingsTypes';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { InputAction, ActionBinding } from '../input/InputAction';
import { AudioService } from '../audio/AudioService';
import { ShaderManager } from '../rendering/shaders/ShaderManager';
import { VirtualResolution } from '../rendering/VirtualResolution';
import { CameraSystem } from '../camera/CameraSystem';
import { InputManager } from '../input/InputManager';
import { ConfigManager } from '../configuration/ConfigManager';

export interface SettingsSubsystems {
  audioService?: AudioService;
  shaderManager?: ShaderManager;
  virtualResolution?: VirtualResolution;
  cameraSystem?: CameraSystem;
  inputManager?: InputManager;
  configManager?: ConfigManager;
}

export class SettingsManager {
  public static readonly STORAGE_KEY = 'interstellar_continuum_settings';

  private settings: FullSettingsSchema;
  private eventBus?: EventBus;
  private subsystems: SettingsSubsystems = {};
  private memoryFallback: Map<string, string> = new Map();

  constructor(eventBus?: EventBus, subsystems?: SettingsSubsystems) {
    this.eventBus = eventBus;
    if (subsystems) {
      this.subsystems = { ...subsystems };
    }
    this.settings = this.loadSettings();
    this.applyAllSubsystems();
  }

  public registerSubsystems(subsystems: Partial<SettingsSubsystems>): void {
    this.subsystems = { ...this.subsystems, ...subsystems };
    this.applyAllSubsystems();
  }

  public getSettings(): Readonly<FullSettingsSchema> {
    return this.settings;
  }

  public getCategory<K extends keyof Omit<FullSettingsSchema, 'schemaVersion'>>(
    category: K
  ): Readonly<FullSettingsSchema[K]> {
    return this.settings[category];
  }

  public setCategory<K extends keyof Omit<FullSettingsSchema, 'schemaVersion'>>(
    category: K,
    partial: Partial<FullSettingsSchema[K]>
  ): void {
    this.settings[category] = {
      ...this.settings[category],
      ...partial,
    } as any;

    this.validateCategory(category);
    this.persist();
    this.applyCategorySubsystems(category);
    this.notifyChange(category.toUpperCase() as SettingsCategory);
  }

  public applyGraphicsPreset(preset: GraphicsQualityPreset): void {
    if (preset === 'CUSTOM') {
      this.settings.graphics.quality = 'CUSTOM';
    } else {
      const presetValues = GRAPHICS_PRESETS[preset];
      this.settings.graphics = {
        ...this.settings.graphics,
        ...presetValues,
        quality: preset,
      };
    }

    this.persist();
    this.applyCategorySubsystems('graphics');
    this.notifyChange('GRAPHICS');
    Logger.info('SETTINGS_MANAGER', `Applied graphics preset: ${preset}`);
  }

  public rebindKey(action: InputAction, keys: string[]): { success: boolean; conflictAction?: InputAction } {
    // Check conflicts across actions
    for (const key of keys) {
      for (const [otherAction, boundKeys] of Object.entries(this.settings.controls.bindings)) {
        if (otherAction !== action && boundKeys.includes(key)) {
          return { success: false, conflictAction: otherAction as InputAction };
        }
      }
    }

    this.settings.controls.bindings[action] = [...keys];
    this.persist();
    this.applyCategorySubsystems('controls');
    this.notifyChange('CONTROLS');
    return { success: true };
  }

  public isKeyBound(key: string, excludeAction?: InputAction): InputAction | null {
    for (const [actionStr, keys] of Object.entries(this.settings.controls.bindings)) {
      if (actionStr === excludeAction) continue;
      if (keys.includes(key)) {
        return actionStr as InputAction;
      }
    }
    return null;
  }

  public resetCategory(category: SettingsCategory | string): void {
    const cat = category.toUpperCase();
    switch (cat) {
      case 'GRAPHICS':
        this.settings.graphics = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.graphics));
        this.applyCategorySubsystems('graphics');
        break;
      case 'AUDIO':
        this.settings.audio = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.audio));
        this.applyCategorySubsystems('audio');
        break;
      case 'CONTROLS':
        this.settings.controls = {
          bindings: JSON.parse(JSON.stringify(DEFAULT_CONTROLS_BINDINGS)),
        };
        this.applyCategorySubsystems('controls');
        break;
      case 'ACCESSIBILITY':
        this.settings.accessibility = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.accessibility));
        this.applyCategorySubsystems('accessibility');
        break;
      case 'INTERFACE':
        this.settings.interface = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.interface));
        this.applyCategorySubsystems('interface');
        break;
      case 'GAMEPLAY':
        this.settings.gameplay = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.gameplay));
        this.applyCategorySubsystems('gameplay');
        break;
    }

    this.persist();
    this.notifyChange(cat as SettingsCategory);
    Logger.info('SETTINGS_MANAGER', `Reset category to defaults: ${cat}`);
  }

  public resetAll(): void {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.persist();
    this.applyAllSubsystems();
    this.notifyChange('ALL' as any);
    Logger.info('SETTINGS_MANAGER', 'All settings successfully reset to factory defaults.');
  }

  public applyAllSubsystems(): void {
    this.applyCategorySubsystems('graphics');
    this.applyCategorySubsystems('audio');
    this.applyCategorySubsystems('controls');
    this.applyCategorySubsystems('accessibility');
    this.applyCategorySubsystems('interface');
    this.applyCategorySubsystems('gameplay');
  }

  private applyCategorySubsystems(category: keyof Omit<FullSettingsSchema, 'schemaVersion'>): void {
    switch (category) {
      case 'graphics': {
        const g = this.settings.graphics;
        if (this.subsystems.shaderManager) {
          const shaderQuality = g.quality === 'CUSTOM' ? (g.lightingQuality === 'HIGH' ? 'HIGH' : 'MEDIUM') : (g.quality as any);
          this.subsystems.shaderManager.setQuality(shaderQuality);
        }
        if (this.subsystems.virtualResolution) {
          this.subsystems.virtualResolution.setResolutionScale(g.resolutionScale);
        }
        if (this.subsystems.configManager) {
          this.subsystems.configManager.updateGraphicsConfig({
            quality: g.quality === 'CUSTOM' ? 'HIGH' : (g.quality as any),
            bloomEnabled: g.bloomEnabled,
            atmosphericShaders: g.atmosphericShaders,
          });
          this.subsystems.configManager.updateDisplayConfig({
            resolutionScale: g.resolutionScale,
            targetFps: g.targetFps,
            fullscreen: g.fullscreen,
            vSync: g.vSync,
          });
        }
        break;
      }
      case 'audio': {
        const a = this.settings.audio;
        if (this.subsystems.audioService) {
          this.subsystems.audioService.setMuted(a.muted);
          this.subsystems.audioService.setChannelVolume('master', a.masterVolume);
          this.subsystems.audioService.setChannelVolume('music', a.musicVolume);
          this.subsystems.audioService.setChannelVolume('ambience', a.ambienceVolume);
          this.subsystems.audioService.setChannelVolume('sfx', a.sfxVolume);
          this.subsystems.audioService.setChannelVolume('ui', a.uiVolume);
          this.subsystems.audioService.setChannelVolume('dialogue', a.dialogueVolume);
        }
        if (this.subsystems.configManager) {
          this.subsystems.configManager.updateAudioConfig({
            masterVolume: a.masterVolume,
            musicVolume: a.musicVolume,
            sfxVolume: a.sfxVolume,
            uiVolume: a.uiVolume,
            ambienceVolume: a.ambienceVolume,
            dialogueVolume: a.dialogueVolume,
            muted: a.muted,
          });
        }
        break;
      }
      case 'controls': {
        const c = this.settings.controls;
        if (this.subsystems.inputManager) {
          for (const [actionKey, keys] of Object.entries(c.bindings)) {
            const action = actionKey as InputAction;
            const existing = this.subsystems.inputManager.getBindings()[action];
            const binding: ActionBinding = {
              keys: [...keys],
              mouseButtons: existing?.mouseButtons,
              gamepadButtons: existing?.gamepadButtons,
            };
            this.subsystems.inputManager.rebind(action, binding);
          }
        }
        break;
      }
      case 'accessibility': {
        const acc = this.settings.accessibility;
        if (this.subsystems.cameraSystem) {
          this.subsystems.cameraSystem.setReducedMotion(acc.reducedMotion);
          this.subsystems.cameraSystem.setShakeIntensity(acc.reducedCameraShake);
        }
        if (this.subsystems.configManager) {
          this.subsystems.configManager.updateAccessibilityConfig({
            uiScale: acc.uiScale,
            reducedMotion: acc.reducedMotion,
            highContrastSubtitles: acc.highContrastSubtitles,
            colorblindMode: acc.colorblindMode,
          });
        }
        break;
      }
      case 'interface':
      case 'gameplay':
        // Values queried on demand by GlobalHUD, CampusMinimap, HeadquartersScene, etc.
        break;
    }
  }

  private validateCategory(category: keyof Omit<FullSettingsSchema, 'schemaVersion'>): void {
    switch (category) {
      case 'graphics': {
        const g = this.settings.graphics;
        g.resolutionScale = Math.max(0.5, Math.min(2.0, Number(g.resolutionScale) || 1.0));
        g.targetFps = [0, 30, 60, 120].includes(g.targetFps) ? g.targetFps : 60;
        break;
      }
      case 'audio': {
        const a = this.settings.audio;
        a.masterVolume = Math.max(0, Math.min(1, Number(a.masterVolume) || 0));
        a.musicVolume = Math.max(0, Math.min(1, Number(a.musicVolume) || 0));
        a.ambienceVolume = Math.max(0, Math.min(1, Number(a.ambienceVolume) || 0));
        a.uiVolume = Math.max(0, Math.min(1, Number(a.uiVolume) || 0));
        a.sfxVolume = Math.max(0, Math.min(1, Number(a.sfxVolume) || 0));
        a.dialogueVolume = Math.max(0, Math.min(1, Number(a.dialogueVolume) || 0));
        break;
      }
      case 'accessibility': {
        const acc = this.settings.accessibility;
        acc.uiScale = Math.max(0.8, Math.min(1.4, Number(acc.uiScale) || 1.0));
        acc.reducedCameraShake = Math.max(0, Math.min(1.0, Number(acc.reducedCameraShake) || 0));
        break;
      }
      case 'interface': {
        const ui = this.settings.interface;
        ui.tooltipDelayMs = Math.max(0, Math.min(2000, Number(ui.tooltipDelayMs) || 250));
        ui.notificationDuration = Math.max(1.5, Math.min(10.0, Number(ui.notificationDuration) || 4.5));
        break;
      }
      case 'gameplay': {
        const gp = this.settings.gameplay;
        gp.cameraFollowSensitivity = Math.max(0.5, Math.min(2.0, Number(gp.cameraFollowSensitivity) || 1.0));
        gp.cameraSmoothing = Math.max(0.01, Math.min(0.5, Number(gp.cameraSmoothing) || 0.1));
        break;
      }
    }
  }

  private loadSettings(): FullSettingsSchema {
    try {
      let raw: string | null = null;
      if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(SettingsManager.STORAGE_KEY);
      } else {
        raw = this.memoryFallback.get(SettingsManager.STORAGE_KEY) || null;
      }

      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1) {
        Logger.warn('SETTINGS_MANAGER', 'Corrupt or incompatible settings payload. Reverting to defaults.');
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }

      // Merge deeply with defaults in case of missing keys
      const merged: FullSettingsSchema = {
        schemaVersion: 1,
        graphics: { ...DEFAULT_SETTINGS.graphics, ...(parsed.graphics || {}) },
        audio: { ...DEFAULT_SETTINGS.audio, ...(parsed.audio || {}) },
        controls: {
          bindings: { ...DEFAULT_CONTROLS_BINDINGS, ...(parsed.controls?.bindings || {}) },
        },
        accessibility: { ...DEFAULT_SETTINGS.accessibility, ...(parsed.accessibility || {}) },
        interface: { ...DEFAULT_SETTINGS.interface, ...(parsed.interface || {}) },
        gameplay: { ...DEFAULT_SETTINGS.gameplay, ...(parsed.gameplay || {}) },
      };

      return merged;
    } catch (err) {
      Logger.warn('SETTINGS_MANAGER', `Failed to load settings from storage: ${err}`);
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  private persist(): void {
    try {
      const serialized = JSON.stringify(this.settings);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SettingsManager.STORAGE_KEY, serialized);
      } else {
        this.memoryFallback.set(SettingsManager.STORAGE_KEY, serialized);
      }
    } catch (err) {
      Logger.warn('SETTINGS_MANAGER', `Failed to persist settings: ${err}`);
    }
  }

  private notifyChange(category: SettingsCategory | 'ALL'): void {
    if (this.eventBus) {
      this.eventBus.emit('settings:changed', {
        category,
        settings: this.settings,
      });
    }
  }
}
