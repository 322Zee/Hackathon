import { Container } from 'pixi.js';
import { IScene, SceneContext } from './IScene';
import { SceneIdType } from './SceneId';
import { ISceneTransition } from './transitions/SceneTransition';
import { FadeTransition } from './transitions/FadeTransition';
import { EventBus } from '../core/EventBus';
import { ISystemRegistry } from '../systems/SystemRegistry';
import { ViewportTransform } from '../rendering/VirtualResolution';
import { Logger } from '../core/logging/Logger';

export interface SceneSwitchOptions {
  transition?: ISceneTransition | null;
  payload?: any;
  cleanupPrevious?: boolean; // Default true
}

export class SceneManager {
  private scenes: Map<string, IScene> = new Map();
  private sceneStack: IScene[] = [];
  private rootContainer: Container;
  private overlayContainer: Container;
  private eventBus: EventBus;
  private systemRegistry?: ISystemRegistry;
  private currentTransform?: ViewportTransform;
  private isTransitioning: boolean = false;

  constructor(
    rootContainer: Container,
    overlayContainer: Container,
    eventBus: EventBus,
    systemRegistry?: ISystemRegistry
  ) {
    this.rootContainer = rootContainer;
    this.overlayContainer = overlayContainer;
    this.eventBus = eventBus;
    this.systemRegistry = systemRegistry;
  }

  public register(scene: IScene): void {
    const key = String(scene.id);
    if (this.scenes.has(key)) {
      Logger.warn('SCENE_MANAGER', `Duplicate scene registration for id "${key}". Overwriting previous instance.`);
    }
    this.scenes.set(key, scene);
    Logger.info('SCENE_MANAGER', `Registered scene: "${key}"`);
  }

  public has(id: SceneIdType): boolean {
    return this.scenes.has(String(id));
  }

  public get(id: SceneIdType): IScene | undefined {
    return this.scenes.get(String(id));
  }

  public getActiveScene(): IScene | null {
    if (this.sceneStack.length === 0) return null;
    return this.sceneStack[this.sceneStack.length - 1] || null;
  }

  public getActiveSceneId(): SceneIdType | null {
    const active = this.getActiveScene();
    return active ? active.id : null;
  }

  public getCurrentSceneId(): SceneIdType | null {
    return this.getActiveSceneId();
  }

  public async switchScene(sceneId: SceneIdType, options: SceneSwitchOptions = {}): Promise<boolean> {
    if (this.isTransitioning) {
      Logger.warn('SCENE_MANAGER', `Switch to "${String(sceneId)}" rejected: transition already in progress.`);
      return false;
    }

    const nextScene = this.scenes.get(String(sceneId));
    if (!nextScene) {
      Logger.error('SCENE_MANAGER', `Cannot switch to unregistered scene: "${String(sceneId)}"`);
      return false;
    }

    const currentScene = this.getActiveScene();
    if (currentScene && currentScene.id === nextScene.id) {
      Logger.warn('SCENE_MANAGER', `Scene "${String(sceneId)}" is already the active scene.`);
      return true;
    }

    this.isTransitioning = true;
    const transition = options.transition !== undefined ? options.transition : new FadeTransition(0.3);
    const cleanupPrevious = options.cleanupPrevious !== false;

    Logger.info('SCENE_MANAGER', `Starting transition: [${currentScene?.id || 'NONE'}] -> [${String(sceneId)}] via ${transition ? transition.id : 'Instant'}`);

    const performSwitch = async () => {
      // 1. Initialize next scene if not already initialized
      if (!nextScene.isInitialized) {
        const context: SceneContext = {
          eventBus: this.eventBus,
          systemRegistry: this.systemRegistry,
          transform: this.currentTransform || {
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            viewportWidth: 1920,
            viewportHeight: 1080,
            virtualWidth: 1920,
            virtualHeight: 1080,
          },
        };
        await nextScene.initialize(context);
      }

      // 2. Deactivate and optionally clean up old scene(s)
      while (this.sceneStack.length > 0) {
        const old = this.sceneStack.pop()!;
        await old.deactivate();
        this.rootContainer.removeChild(old.container);
        if (cleanupPrevious) {
          await old.cleanup();
        }
      }

      // 3. Mount and activate next scene
      this.sceneStack.push(nextScene);
      this.rootContainer.addChild(nextScene.container);

      if (this.currentTransform) {
        nextScene.onResize(this.currentTransform);
      }

      await nextScene.activate(options.payload);

      // 4. Dispatch typed events
      const fromId = currentScene ? String(currentScene.id) : null;
      const toId = String(nextScene.id);

      this.eventBus.emit('SceneChanged', {
        from: fromId,
        to: toId,
        timestamp: Date.now(),
      });
      this.eventBus.emit('scene:change', { from: fromId || 'NONE', to: toId });
      this.eventBus.emit('screen:changed', { from: fromId, to: toId });
    };

    try {
      if (transition) {
        await transition.execute(currentScene, nextScene, this.overlayContainer, performSwitch);
      } else {
        await performSwitch();
      }

      this.isTransitioning = false;
      Logger.info('SCENE_MANAGER', `Transition to "${String(sceneId)}" completed successfully.`);
      return true;
    } catch (err) {
      this.isTransitioning = false;
      Logger.error('SCENE_MANAGER', `Transition to "${String(sceneId)}" failed:`, err);

      // Attempt recovery: if previous scene is still mounted, keep it active
      if (currentScene && !this.sceneStack.includes(currentScene)) {
        this.sceneStack.push(currentScene);
        if (!this.rootContainer.children.includes(currentScene.container)) {
          this.rootContainer.addChild(currentScene.container);
        }
        await currentScene.activate();
      }

      return false;
    }
  }

  public async pushScene(sceneId: SceneIdType, payload?: any): Promise<boolean> {
    const nextScene = this.scenes.get(String(sceneId));
    if (!nextScene) {
      Logger.error('SCENE_MANAGER', `Cannot push unregistered scene: "${String(sceneId)}"`);
      return false;
    }

    const currentScene = this.getActiveScene();
    if (currentScene) {
      await currentScene.deactivate(); // Pause updates for background scene
    }

    if (!nextScene.isInitialized) {
      const context: SceneContext = {
        eventBus: this.eventBus,
        systemRegistry: this.systemRegistry,
        transform: this.currentTransform || {
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          viewportWidth: 1920,
          viewportHeight: 1080,
          virtualWidth: 1920,
          virtualHeight: 1080,
        },
      };
      await nextScene.initialize(context);
    }

    this.sceneStack.push(nextScene);
    this.rootContainer.addChild(nextScene.container);

    if (this.currentTransform) {
      nextScene.onResize(this.currentTransform);
    }

    await nextScene.activate(payload);
    Logger.info('SCENE_MANAGER', `Pushed modal scene: "${String(sceneId)}" (Stack depth: ${this.sceneStack.length})`);
    return true;
  }

  public async popScene(): Promise<boolean> {
    if (this.sceneStack.length <= 1) {
      Logger.warn('SCENE_MANAGER', 'Cannot pop base scene from stack.');
      return false;
    }

    const popped = this.sceneStack.pop()!;
    await popped.deactivate();
    this.rootContainer.removeChild(popped.container);
    await popped.cleanup();

    const previous = this.getActiveScene();
    if (previous) {
      await previous.activate();
    }

    Logger.info('SCENE_MANAGER', `Popped scene: "${String(popped.id)}" (Remaining depth: ${this.sceneStack.length})`);
    return true;
  }

  public update(deltaSeconds: number): void {
    if (this.isTransitioning) return;

    // Only update the top-most active scene
    const active = this.getActiveScene();
    if (active && active.isActive) {
      active.update(deltaSeconds);
    }
  }

  public render(deltaSeconds: number): void {
    const active = this.getActiveScene();
    if (active && active.render && active.isActive) {
      active.render(deltaSeconds);
    }
  }

  public onResize(transform: ViewportTransform): void {
    this.currentTransform = transform;
    for (const scene of this.sceneStack) {
      scene.onResize(transform);
    }
  }

  public async destroy(): Promise<void> {
    while (this.sceneStack.length > 0) {
      const scene = this.sceneStack.pop()!;
      await scene.deactivate();
      this.rootContainer.removeChild(scene.container);
      await scene.cleanup();
    }
    this.scenes.clear();
    this.overlayContainer.removeChildren();
    Logger.info('SCENE_MANAGER', 'SceneManager destroyed.');
  }
}
