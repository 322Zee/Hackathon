/**
 * INTERSTELLAR CONTINUUM - Title Screen & Main Menu Scene Integration Tests
 * Verifies Title Screen initialization, "PRESS TO START" interaction,
 * Main Menu keyboard & mouse navigation, Continue button gating,
 * New Organisation confirmation, Settings and Credits modals.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TitleScreenScene } from '../../src/scenes/TitleScreenScene';
import { SceneManager } from '../../src/scenes/SceneManager';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { ConfigManager } from '../../src/configuration/ConfigManager';
import { AudioService } from '../../src/audio/AudioService';
import { SaveService } from '../../src/services/SaveService';
import { StartupFlowController } from '../../src/startup/StartupFlowController';
import { SceneId } from '../../src/scenes/SceneId';
import { Container } from 'pixi.js';

describe('TitleScreenScene & Main Menu', () => {
  let titleScene: TitleScreenScene;
  let sceneManager: SceneManager;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let saveService: SaveService;
  let startupFlow: StartupFlowController;

  beforeEach(async () => {
    ServiceLocator.reset();
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    const cameraSystem = new CameraSystem();
    ServiceLocator.register('CameraSystem', cameraSystem);

    const configManager = new ConfigManager(eventBus);
    ServiceLocator.register('ConfigManager', configManager);

    const audioService = new AudioService(configManager.getConfig().audio, eventBus);
    ServiceLocator.register('AudioService', audioService);

    saveService = new SaveService();
    saveService.deleteSlot(1);
    ServiceLocator.register('SaveService', saveService);

    const rootContainer = new Container();
    const overlayContainer = new Container();
    sceneManager = new SceneManager(rootContainer, overlayContainer, eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    startupFlow = new StartupFlowController({
      saveSlot: 1,
      saveService,
      sceneManager,
      eventBus,
    });
    ServiceLocator.register('StartupFlowController', startupFlow);

    titleScene = new TitleScreenScene();
    sceneManager.register(titleScene);
    await sceneManager.switchScene(titleScene.id, { transition: null });
  });

  afterEach(async () => {
    sceneManager.destroy();
    ServiceLocator.reset();
  });

  it('initializes with Title Screen ID and creates all visual renderers', () => {
    expect(titleScene.id).toBe(SceneId.TITLE_SCREEN);
    expect(titleScene.getBackgroundRenderer()).toBeDefined();
    expect(titleScene.getMenuRenderer()).toBeDefined();
    expect(titleScene.getConfirmationDialog()).toBeDefined();
    expect(titleScene.getCreditsModal()).toBeDefined();
    expect(titleScene.getSettingsModal()).toBeDefined();
  });

  it('starts in "PRESS TO START" mode and reveals main menu on activation', () => {
    const menu = titleScene.getMenuRenderer();
    expect(menu?.isStartMode()).toBe(true);

    // Trigger start via simulated prompt press
    menu?.triggerStart();
    expect(menu?.isStartMode()).toBe(false);
  });

  it('disables Continue when no save exists, and enables it when an active save is found', () => {
    const menu = titleScene.getMenuRenderer()!;
    menu.triggerStart();

    // Default: slot 1 is empty, Continue must be disabled
    expect(startupFlow.canContinue()).toBe(false);

    // Create a save file in slot 1 and refresh
    const saveState = saveService.createNewGame();
    saveState.agency.agencyName = 'Solaris Dynamics';
    saveService.saveToSlot(1, saveState);

    titleScene.refreshMenuItems();
    expect(startupFlow.canContinue()).toBe(true);
    expect(startupFlow.getSavedAgencyInfo()?.agencyName).toBe('Solaris Dynamics');
  });

  it('supports keyboard navigation through menu items', () => {
    const menu = titleScene.getMenuRenderer()!;
    menu.triggerStart();

    const initialIdx = menu.getSelectedIndex();
    menu.selectNext();
    const nextIdx = menu.getSelectedIndex();

    expect(nextIdx).not.toBe(initialIdx);

    menu.selectPrevious();
    expect(menu.getSelectedIndex()).toBe(initialIdx);
  });

  it('triggers confirmation dialog when New Organisation is selected with an existing save', () => {
    const menu = titleScene.getMenuRenderer()!;
    menu.triggerStart();

    // Populate existing save
    const saveState = saveService.createNewGame();
    saveState.agency.agencyName = 'Old Vanguard Corp';
    saveService.saveToSlot(1, saveState);
    titleScene.refreshMenuItems();

    const dialog = titleScene.getConfirmationDialog()!;
    expect(dialog.isOpen()).toBe(false);

    // Simulate selecting New Organisation
    menu.selectNext(); // Move to NEW_ORGANISATION
    menu.activateSelected();

    expect(dialog.isOpen()).toBe(true);

    // Canceling preserves save and closes dialog
    dialog.cancel();
    expect(dialog.isOpen()).toBe(false);
    expect(saveService.loadFromSlot(1)?.agency.agencyName).toBe('Old Vanguard Corp');
  });

  it('opens and closes Credits and Settings modals without errors', () => {
    const credits = titleScene.getCreditsModal()!;
    expect(credits.isOpen()).toBe(false);
    credits.show();
    expect(credits.isOpen()).toBe(true);
    credits.hide();
    expect(credits.isOpen()).toBe(false);

    const settings = titleScene.getSettingsModal()!;
    expect(settings.isOpen()).toBe(false);
    settings.show();
    expect(settings.isOpen()).toBe(true);
    settings.hide();
    expect(settings.isOpen()).toBe(false);
  });
});
