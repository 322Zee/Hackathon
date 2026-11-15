import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../../src/configuration/ConfigManager';
import { DEFAULT_GAME_CONFIG } from '../../src/configuration/GameConfig';
import { EventBus } from '../../src/core/EventBus';

describe('ConfigManager', () => {
  let eventBus: EventBus;
  let mockStore: Map<string, string>;

  beforeEach(() => {
    mockStore = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => mockStore.get(key) || null,
      setItem: (key: string, val: string) => mockStore.set(key, val),
      removeItem: (key: string) => mockStore.delete(key),
      clear: () => mockStore.clear(),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    eventBus = new EventBus();
  });

  it('loads default configuration on clean start', () => {
    const configManager = new ConfigManager(eventBus);
    const config = configManager.getConfig();

    expect(config.display.virtualWidth).toBe(1920);
    expect(config.display.virtualHeight).toBe(1080);
    expect(config.display.targetFps).toBe(60);
    expect(config.audio.masterVolume).toBe(0.8);
    expect(config.graphics.quality).toBe('HIGH');
  });

  it('updates display configuration and emits event', () => {
    const configManager = new ConfigManager(eventBus);
    let eventReceived = false;

    eventBus.on('config:changed', ({ category, config }) => {
      if (category === 'display' && config.display.resolutionScale === 1.5) {
        eventReceived = true;
      }
    });

    configManager.updateDisplayConfig({ resolutionScale: 1.5 });
    expect(configManager.getConfig().display.resolutionScale).toBe(1.5);
    expect(eventReceived).toBe(true);
  });

  it('updates audio configuration and persists to storage', () => {
    const configManager = new ConfigManager(eventBus);
    configManager.updateAudioConfig({ masterVolume: 0.5, muted: true });

    expect(configManager.getConfig().audio.masterVolume).toBe(0.5);
    expect(configManager.getConfig().audio.muted).toBe(true);

    // Verify persistence
    const reloadedManager = new ConfigManager(eventBus);
    expect(reloadedManager.getConfig().audio.masterVolume).toBe(0.5);
    expect(reloadedManager.getConfig().audio.muted).toBe(true);
  });

  it('resets configuration back to defaults', () => {
    const configManager = new ConfigManager(eventBus);
    configManager.updateGraphicsConfig({ quality: 'LOW', maxParticles: 100 });
    expect(configManager.getConfig().graphics.quality).toBe('LOW');

    configManager.resetToDefaults();
    expect(configManager.getConfig().graphics.quality).toBe(DEFAULT_GAME_CONFIG.graphics.quality);
    expect(configManager.getConfig().graphics.maxParticles).toBe(DEFAULT_GAME_CONFIG.graphics.maxParticles);
  });
});
