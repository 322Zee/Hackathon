/**
 * INTERSTELLAR CONTINUUM - PauseMenu Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PauseMenu } from '../../src/ui/pause/PauseMenu';
import { InputManager } from '../../src/input/InputManager';
import { SceneManager } from '../../src/scenes/SceneManager';
import { SaveService } from '../../src/services/SaveService';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { Container } from 'pixi.js';
import { EventBus } from '../../src/core/EventBus';
import { SettingsManager } from '../../src/settings';

describe('PauseMenu', () => {
  let inputManager: InputManager;
  let sceneManager: SceneManager;
  let saveService: SaveService;
  let eventBus: EventBus;
  let pauseMenu: PauseMenu;

  beforeEach(() => {
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    const settingsManager = new SettingsManager(eventBus);
    ServiceLocator.register('SettingsManager', settingsManager);

    inputManager = new InputManager();
    ServiceLocator.register('InputManager', inputManager);

    saveService = new SaveService();
    ServiceLocator.register('SaveService', saveService);

    const screenContainer = new Container();
    const transitionOverlay = new Container();
    sceneManager = new SceneManager(screenContainer, transitionOverlay, eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    pauseMenu = new PauseMenu({
      inputManager,
      sceneManager,
      saveService,
    });
  });

  afterEach(() => {
    pauseMenu.destroy();
  });

  it('initializes hidden with input unlocked', () => {
    expect(pauseMenu.isOpen()).toBe(false);
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('locks input when shown and unlocks input when hidden', () => {
    pauseMenu.show();
    expect(pauseMenu.isOpen()).toBe(true);
    expect(inputManager.isInputLocked()).toBe(true);

    pauseMenu.hide();
    expect(pauseMenu.isOpen()).toBe(false);
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('toggles visibility reliably', () => {
    pauseMenu.toggle();
    expect(pauseMenu.isOpen()).toBe(true);
    pauseMenu.toggle();
    expect(pauseMenu.isOpen()).toBe(false);
  });

  it('opens and closes child SettingsView over pause menu without unpausing', () => {
    pauseMenu.show();
    expect(pauseMenu.isOpen()).toBe(true);

    pauseMenu.openSettings('CONTROLS');
    // Ensure settings view exists as a child
    expect(pauseMenu.container.children.length).toBeGreaterThan(2);

    pauseMenu.closeSettings();
    expect(pauseMenu.isOpen()).toBe(true);
  });

  it('triggers saveToSlot and emits save:saved event on saveGame()', () => {
    let saveEventEmitted = false;
    eventBus.on('save:saved', () => {
      saveEventEmitted = true;
    });

    pauseMenu.saveGame();
    expect(saveEventEmitted).toBe(true);
  });

  it('returns to headquarters scene when in another scene', async () => {
    let returned = false;
    const customPauseMenu = new PauseMenu({
      inputManager,
      sceneManager,
      onReturnToCampus: () => {
        returned = true;
      },
    });

    customPauseMenu.show();
    customPauseMenu.returnToHeadquarters();
    expect(returned).toBe(true);
    expect(customPauseMenu.isOpen()).toBe(false);
    customPauseMenu.destroy();
  });
});
