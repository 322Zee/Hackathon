import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'pixi.js';
import { SceneManager } from '../../src/scenes/SceneManager';
import { BaseScene } from '../../src/scenes/BaseScene';
import { SceneId } from '../../src/scenes/SceneId';
import { EventBus } from '../../src/core/EventBus';

class MockScene extends BaseScene {
  public readonly id: string;
  public initCalls = 0;
  public activateCalls = 0;
  public deactivateCalls = 0;
  public cleanupCalls = 0;
  public updateCalls = 0;
  public shouldFailInit = false;

  constructor(id: string) {
    super();
    this.id = id;
  }

  protected async onInitialize(): Promise<void> {
    if (this.shouldFailInit) {
      throw new Error(`Intentional init failure in scene ${this.id}`);
    }
    this.initCalls++;
  }

  protected onActivate(): void {
    this.activateCalls++;
  }

  protected onDeactivate(): void {
    this.deactivateCalls++;
  }

  protected onUpdate(): void {
    this.updateCalls++;
  }

  protected onCleanup(): void {
    this.cleanupCalls++;
  }
}

describe('SceneManager', () => {
  let rootContainer: Container;
  let overlayContainer: Container;
  let eventBus: EventBus;
  let sceneManager: SceneManager;

  beforeEach(() => {
    rootContainer = new Container();
    overlayContainer = new Container();
    eventBus = new EventBus();
    sceneManager = new SceneManager(rootContainer, overlayContainer, eventBus);
  });

  it('registers and retrieves scenes correctly', () => {
    const sceneA = new MockScene(SceneId.TITLE_SCREEN);
    sceneManager.register(sceneA);

    expect(sceneManager.has(SceneId.TITLE_SCREEN)).toBe(true);
    expect(sceneManager.get(SceneId.TITLE_SCREEN)).toBe(sceneA);
    expect(sceneManager.has(SceneId.HEADQUARTERS)).toBe(false);
  });

  it('prevents duplicate scene registrations by overwriting with warning', () => {
    const sceneA1 = new MockScene(SceneId.SETTINGS);
    const sceneA2 = new MockScene(SceneId.SETTINGS);

    sceneManager.register(sceneA1);
    sceneManager.register(sceneA2);

    expect(sceneManager.get(SceneId.SETTINGS)).toBe(sceneA2);
  });

  it('switches scenes with lifecycle execution', async () => {
    const sceneA = new MockScene(SceneId.TITLE_SCREEN);
    const sceneB = new MockScene(SceneId.HEADQUARTERS);

    sceneManager.register(sceneA);
    sceneManager.register(sceneB);

    // Initial switch without transition
    await sceneManager.switchScene(SceneId.TITLE_SCREEN, { transition: null });
    expect(sceneA.initCalls).toBe(1);
    expect(sceneA.activateCalls).toBe(1);
    expect(sceneA.isActive).toBe(true);
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.TITLE_SCREEN);

    // Switch to Scene B
    await sceneManager.switchScene(SceneId.HEADQUARTERS, { transition: null });
    expect(sceneA.deactivateCalls).toBe(1);
    expect(sceneA.cleanupCalls).toBe(1);
    expect(sceneA.isActive).toBe(false);

    expect(sceneB.initCalls).toBe(1);
    expect(sceneB.activateCalls).toBe(1);
    expect(sceneB.isActive).toBe(true);
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.HEADQUARTERS);
  });

  it('updates only the active scene and not cleaned-up scenes', async () => {
    const sceneA = new MockScene(SceneId.TITLE_SCREEN);
    const sceneB = new MockScene(SceneId.HEADQUARTERS);

    sceneManager.register(sceneA);
    sceneManager.register(sceneB);

    await sceneManager.switchScene(SceneId.TITLE_SCREEN, { transition: null });
    sceneManager.update(0.016);
    expect(sceneA.updateCalls).toBe(1);
    expect(sceneB.updateCalls).toBe(0);

    await sceneManager.switchScene(SceneId.HEADQUARTERS, { transition: null });
    sceneManager.update(0.016);
    expect(sceneA.updateCalls).toBe(1); // Not updated again!
    expect(sceneB.updateCalls).toBe(1);
  });

  it('supports modal push and pop stack (e.g. Pause over Simulation)', async () => {
    const simScene = new MockScene(SceneId.MISSION_SIMULATION);
    const pauseScene = new MockScene(SceneId.PAUSE_SCREEN);

    sceneManager.register(simScene);
    sceneManager.register(pauseScene);

    await sceneManager.switchScene(SceneId.MISSION_SIMULATION, { transition: null });
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.MISSION_SIMULATION);

    // Push pause screen over simulation
    await sceneManager.pushScene(SceneId.PAUSE_SCREEN);
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.PAUSE_SCREEN);
    expect(simScene.isActive).toBe(false); // Paused
    expect(pauseScene.isActive).toBe(true);

    // Pop pause screen
    await sceneManager.popScene();
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.MISSION_SIMULATION);
    expect(simScene.isActive).toBe(true); // Resumed
    expect(pauseScene.cleanupCalls).toBe(1); // Popped scene cleaned up
  });

  it('handles transition failure gracefully and retains previous scene', async () => {
    const sceneA = new MockScene(SceneId.TITLE_SCREEN);
    const faultyScene = new MockScene(SceneId.ROCKET_ENGINEERING);
    faultyScene.shouldFailInit = true;

    sceneManager.register(sceneA);
    sceneManager.register(faultyScene);

    await sceneManager.switchScene(SceneId.TITLE_SCREEN, { transition: null });

    const success = await sceneManager.switchScene(SceneId.ROCKET_ENGINEERING, { transition: null });
    expect(success).toBe(false);
    expect(sceneManager.getActiveSceneId()).toBe(SceneId.TITLE_SCREEN);
    expect(sceneA.isActive).toBe(true);
  });
});
