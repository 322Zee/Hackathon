/**
 * INTERSTELLAR CONTINUUM - SettingsManager Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsManager, DEFAULT_SETTINGS } from '../../src/settings';
import { EventBus } from '../../src/core/EventBus';
import { InputAction } from '../../src/input/InputAction';
import { AudioService } from '../../src/audio/AudioService';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { InputManager } from '../../src/input/InputManager';
import { ConfigManager } from '../../src/configuration/ConfigManager';
import { DEFAULT_GAME_CONFIG } from '../../src/configuration/GameConfig';

describe('SettingsManager', () => {
  let eventBus: EventBus;
  let settingsManager: SettingsManager;

  beforeEach(() => {
    eventBus = new EventBus();
    settingsManager = new SettingsManager(eventBus);
  });

  it('initializes with default schema and schema version 1', () => {
    const settings = settingsManager.getSettings();
    expect(settings.schemaVersion).toBe(1);
    expect(settings.graphics.quality).toBe(DEFAULT_SETTINGS.graphics.quality);
    expect(settings.audio.masterVolume).toBe(DEFAULT_SETTINGS.audio.masterVolume);
    expect(settings.controls.bindings[InputAction.MoveUp]).toContain('KeyW');
    expect(settings.accessibility.uiScale).toBe(1.0);
    expect(settings.interface.hudVisible).toBe(true);
    expect(settings.gameplay.autoPauseOnFocusLoss).toBe(true);
  });

  it('updates specific category fields and emits settings:changed event', () => {
    let capturedEvent: any = null;
    eventBus.on('settings:changed', (e) => {
      capturedEvent = e;
    });

    settingsManager.setCategory('audio', { masterVolume: 0.45, muted: true });

    const audio = settingsManager.getCategory('audio');
    expect(audio.masterVolume).toBe(0.45);
    expect(audio.muted).toBe(true);

    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent.category).toBe('AUDIO');
    expect(capturedEvent.settings.audio.masterVolume).toBe(0.45);
  });

  it('safely clamps out-of-range numeric values during setCategory', () => {
    settingsManager.setCategory('audio', { masterVolume: 5.0, musicVolume: -2.0 });
    const audio = settingsManager.getCategory('audio');
    expect(audio.masterVolume).toBe(1.0);
    expect(audio.musicVolume).toBe(0.0);

    settingsManager.setCategory('graphics', { resolutionScale: 10.0 });
    const graphics = settingsManager.getCategory('graphics');
    expect(graphics.resolutionScale).toBe(2.0);

    settingsManager.setCategory('accessibility', { uiScale: 0.1 });
    const acc = settingsManager.getCategory('accessibility');
    expect(acc.uiScale).toBe(0.8);
  });

  it('applies graphics quality presets correctly', () => {
    settingsManager.applyGraphicsPreset('LOW');
    let g = settingsManager.getCategory('graphics');
    expect(g.quality).toBe('LOW');
    expect(g.particleQuality).toBe('LOW');
    expect(g.bloomEnabled).toBe(false);
    expect(g.atmosphericShaders).toBe(false);

    settingsManager.applyGraphicsPreset('ULTRA');
    g = settingsManager.getCategory('graphics');
    expect(g.quality).toBe('ULTRA');
    expect(g.bloomEnabled).toBe(true);
    expect(g.atmosphericShaders).toBe(true);
  });

  it('manages keybinding changes and detects action conflicts', () => {
    // Attempt to bind MoveDown to KeyW (which is already bound to MoveUp)
    const conflictResult = settingsManager.rebindKey(InputAction.MoveDown, ['KeyW']);
    expect(conflictResult.success).toBe(false);
    expect(conflictResult.conflictAction).toBe(InputAction.MoveUp);

    // Rebind MoveDown to a free key
    const successResult = settingsManager.rebindKey(InputAction.MoveDown, ['KeyJ']);
    expect(successResult.success).toBe(true);

    const controls = settingsManager.getCategory('controls');
    expect(controls.bindings[InputAction.MoveDown]).toEqual(['KeyJ']);
  });

  it('resets a single category to factory defaults without affecting other categories', () => {
    settingsManager.setCategory('audio', { masterVolume: 0.1 });
    settingsManager.setCategory('graphics', { resolutionScale: 0.75 });

    settingsManager.resetCategory('audio');
    expect(settingsManager.getCategory('audio').masterVolume).toBe(DEFAULT_SETTINGS.audio.masterVolume);
    expect(settingsManager.getCategory('graphics').resolutionScale).toBe(0.75);
  });

  it('resets all settings without affecting organisation progression', () => {
    settingsManager.setCategory('audio', { masterVolume: 0.1 });
    settingsManager.setCategory('graphics', { resolutionScale: 0.75 });
    settingsManager.setCategory('interface', { hudVisible: false });

    settingsManager.resetAll();

    expect(settingsManager.getCategory('audio').masterVolume).toBe(DEFAULT_SETTINGS.audio.masterVolume);
    expect(settingsManager.getCategory('graphics').resolutionScale).toBe(1.0);
    expect(settingsManager.getCategory('interface').hudVisible).toBe(true);
  });

  it('synchronizes settings across attached game subsystems', () => {
    const audioService = new AudioService(DEFAULT_GAME_CONFIG.audio, eventBus);
    const virtualResolution = new VirtualResolution(1920, 1080);
    const cameraSystem = new CameraSystem(virtualResolution);
    const inputManager = new InputManager(virtualResolution);
    const configManager = new ConfigManager(eventBus);

    settingsManager.registerSubsystems({
      audioService,
      virtualResolution,
      cameraSystem,
      inputManager,
      configManager,
    });

    // Audio change
    settingsManager.setCategory('audio', { masterVolume: 0.35 });
    expect(audioService.getChannelVolume('master')).toBe(0.35);
    expect(configManager.getConfig().audio.masterVolume).toBe(0.35);

    // Resolution change
    settingsManager.setCategory('graphics', { resolutionScale: 1.25 });
    expect(virtualResolution.getTransform().scale).toBeGreaterThan(0);

    // Accessibility change
    settingsManager.setCategory('accessibility', { reducedMotion: true, reducedCameraShake: 0.5 });
    expect(configManager.getConfig().accessibility.reducedMotion).toBe(true);

    // Rebind controls
    settingsManager.rebindKey(InputAction.Sprint, ['ControlLeft']);
    expect(inputManager.getBindings()[InputAction.Sprint].keys).toContain('ControlLeft');
  });
});
