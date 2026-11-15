/**
 * INTERSTELLAR CONTINUUM - Pause and Settings System Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeadquartersScene } from '../../src/scenes/HeadquartersScene';
import { SettingsScene } from '../../src/scenes/SettingsScene';
import { SceneManager } from '../../src/scenes/SceneManager';
import { SceneId } from '../../src/scenes/SceneId';
import { InputManager } from '../../src/input/InputManager';
import { EventBus } from '../../src/core/EventBus';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { Container } from 'pixi.js';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { SettingsManager } from '../../src/settings';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';

describe('Pause and Settings System Integration', () => {
  let eventBus: EventBus;
  let sceneManager: SceneManager;
  let inputManager: InputManager;
  let collisionSystem: CollisionSystem;
  let cameraSystem: CameraSystem;
  let settingsManager: SettingsManager;
  let facilityRegistry: FacilityRegistry;
  let hqScene: HeadquartersScene;
  let settingsScene: SettingsScene;

  beforeEach(async () => {
    ServiceLocator.reset();
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    const virtualResolution = new VirtualResolution(1920, 1080);
    inputManager = new InputManager(virtualResolution);
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    collisionSystem = new CollisionSystem({ eventBus });
    collisionSystem.initialize();
    ServiceLocator.register('CollisionSystem', collisionSystem);

    cameraSystem = new CameraSystem(virtualResolution);
    ServiceLocator.register('CameraSystem', cameraSystem);

    settingsManager = new SettingsManager(eventBus, {
      virtualResolution,
      cameraSystem,
      inputManager,
    });
    ServiceLocator.register('SettingsManager', settingsManager);

    facilityRegistry = FacilityRegistry.getInstance(eventBus);
    facilityRegistry.reset();
    ServiceLocator.register('FacilityRegistry', facilityRegistry);

    const rootContainer = new Container();
    const overlayContainer = new Container();
    sceneManager = new SceneManager(rootContainer, overlayContainer, eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    sceneManager.onResize(virtualResolution.getTransform());

    hqScene = new HeadquartersScene();
    settingsScene = new SettingsScene();

    sceneManager.register(hqScene);
    sceneManager.register(settingsScene);
  });

  afterEach(async () => {
    await sceneManager.destroy();
  });

  it('switches to HeadquartersScene and initializes pause menu attached to UI overlay', async () => {
    await sceneManager.switchScene(SceneId.HEADQUARTERS, { transition: null });

    expect(hqScene.pauseMenu).toBeDefined();
    expect(hqScene.pauseMenu?.isOpen()).toBe(false);
  });

  it('pauses simulation on InputAction.Pause and halts player controller updates', async () => {
    await sceneManager.switchScene(SceneId.HEADQUARTERS, { transition: null });

    // Open pause menu
    hqScene.pauseMenu?.show();
    expect(hqScene.pauseMenu?.isOpen()).toBe(true);

    // Record initial coordinates
    const initialX = (hqScene as any).player.x;
    const initialY = (hqScene as any).player.y;

    // Simulate input while paused
    (inputManager as any).keysDown.add('KeyW');

    // Run frame update
    sceneManager.update(0.016);

    // Player position must remain frozen
    expect((hqScene as any).player.x).toBe(initialX);
    expect((hqScene as any).player.y).toBe(initialY);

    // Close pause menu
    hqScene.pauseMenu?.hide();
    expect(hqScene.pauseMenu?.isOpen()).toBe(false);
  });

  it('navigates to SettingsScene when accessing Central Plaza Kiosk building', async () => {
    await sceneManager.switchScene(SceneId.HEADQUARTERS, { transition: null });

    const kiosk = (hqScene as any).buildings.get('CENTRAL_PLAZA_KIOSK');
    expect(kiosk).toBeDefined();

    const record = facilityRegistry.getFacility(kiosk.data.id)!;
    expect(record).toBeDefined();

    // Trigger enter facility
    await hqScene.enterFacility(record);

    // SceneManager should switch to SETTINGS
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.SETTINGS);
    expect(settingsScene.isActive).toBe(true);
  });

  it('SettingsScene mounts unified SettingsView and allows returning to headquarters', async () => {
    await sceneManager.switchScene(SceneId.SETTINGS, { transition: null });

    expect(settingsScene.isActive).toBe(true);
    expect(settingsScene.container.children.length).toBeGreaterThan(1);

    // Trigger return to headquarters
    await settingsScene.returnToPreviousScene();

    expect(sceneManager.getActiveSceneId()).toBe(SceneId.HEADQUARTERS);
  });
});
