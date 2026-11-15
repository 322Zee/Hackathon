import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlayerMovementTestScene } from '../../src/scenes/PlayerMovementTestScene';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { SceneId } from '../../src/scenes/SceneId';

describe('PlayerMovementTestScene', () => {
  let scene: PlayerMovementTestScene;
  let eventBus: EventBus;
  let transform: any;

  beforeEach(() => {
    ServiceLocator.reset();
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    const inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    const collisionSystem = new CollisionSystem({ eventBus });
    collisionSystem.initialize();
    ServiceLocator.register('CollisionSystem', collisionSystem);

    const cameraSystem = new CameraSystem();
    ServiceLocator.register('CameraSystem', cameraSystem);

    transform = new VirtualResolution(1920, 1080).getTransform();
    scene = new PlayerMovementTestScene();
  });

  afterEach(async () => {
    await scene.cleanup();
    ServiceLocator.reset();
  });

  it('initializes with headquarters scene ID and player instance', async () => {
    expect(scene.id).toBe(SceneId.HEADQUARTERS);
    await scene.initialize({ eventBus, transform });

    const player = scene.getPlayer();
    expect(player).toBeDefined();
    expect(player!.x).toBe(1200);
    expect(player!.y).toBe(960);

    const controller = scene.getController();
    expect(controller).toBeDefined();

    const collision = scene.getCollisionSystem();
    expect(collision).toBeDefined();
    expect(collision!.getAllColliders().length).toBeGreaterThan(5);
  });

  it('updates without throwing runtime errors', async () => {
    await scene.initialize({ eventBus, transform });
    expect(() => scene.update(0.016)).not.toThrow();
  });

  it('toggles collision debug mode', async () => {
    await scene.initialize({ eventBus, transform });
    const collision = scene.getCollisionSystem()!;

    expect(collision.isDebugEnabled()).toBe(false);
    scene.toggleCollisionDebug();
    expect(collision.isDebugEnabled()).toBe(true);
    scene.toggleCollisionDebug();
    expect(collision.isDebugEnabled()).toBe(false);
  });

  it('cleans up resources and resets player reference on cleanup', async () => {
    await scene.initialize({ eventBus, transform });
    expect(scene.getPlayer()).toBeDefined();

    await scene.cleanup();
    expect(scene.getPlayer()).toBeUndefined();
  });
});
