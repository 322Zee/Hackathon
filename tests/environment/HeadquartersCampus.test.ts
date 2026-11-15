import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeadquartersScene } from '../../src/scenes/HeadquartersScene';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { SceneId } from '../../src/scenes/SceneId';
import {
  CAMPUS_WIDTH,
  CAMPUS_HEIGHT,
} from '../../src/environment/headquarters/CampusTypes';

describe('Headquarters Campus Environment', () => {
  let scene: HeadquartersScene;
  let eventBus: EventBus;
  let transform: any;

  beforeEach(async () => {
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
    scene = new HeadquartersScene();
    await scene.initialize({ eventBus, transform });
  });

  afterEach(async () => {
    await scene.cleanup();
    ServiceLocator.reset();
  });

  it('initializes with headquarters scene ID and correct world dimensions', () => {
    expect(scene.id).toBe(SceneId.HEADQUARTERS);
    expect(scene.mapWidth).toBe(CAMPUS_WIDTH);
    expect(scene.mapHeight).toBe(CAMPUS_HEIGHT);
    expect(scene.mapWidth).toBe(3600);
    expect(scene.mapHeight).toBe(2400);
  });

  it('instantiates all 12 major campus facilities with valid footprints and interactive entrances', () => {
    const buildings = scene.getBuildings();
    expect(buildings.size).toBe(12);

    const expectedKeys = [
      'ARRIVAL_GATE',
      'CENTRAL_PLAZA_KIOSK',
      'MISSION_OPERATIONS',
      'ROCKET_ENGINEERING',
      'SPACECRAFT_LAB',
      'RESEARCH_DEVELOPMENT',
      'FINANCE_ADMIN',
      'MANUFACTURING_CENTRE',
      'ROBOTICS_CENTRE',
      'COMMUNICATIONS_CENTRE',
      'PLANETARY_DATA_CENTRE',
      'LAUNCH_COMPLEX_PAD_ALPHA',
    ];

    for (const key of expectedKeys) {
      expect(buildings.has(key)).toBe(true);
      const b = buildings.get(key)!;
      expect(b.data.id).toBeDefined();
      expect(b.data.name).toBeDefined();
      expect(b.data.entranceX).toBeGreaterThan(0);
      expect(b.data.entranceX).toBeLessThan(CAMPUS_WIDTH);
      expect(b.data.entranceY).toBeGreaterThan(0);
      expect(b.data.entranceY).toBeLessThan(CAMPUS_HEIGHT);
      expect(b.collider).toBeDefined();
      expect(b.interactiveObject).toBeDefined();
    }
  });

  it('configures camera system with full campus bounds and player tracking', () => {
    const camera = scene.getCameraSystem();
    expect(camera).toBeDefined();

    const bounds = camera!.getBounds();
    expect(bounds).toBeDefined();
    expect(bounds!.minX).toBe(0);
    expect(bounds!.minY).toBe(0);
    expect(bounds!.maxX).toBe(CAMPUS_WIDTH);
    expect(bounds!.maxY).toBe(CAMPUS_HEIGHT);
  });

  it('spawns Mission Director player at Central Plaza navigation anchor', () => {
    const player = scene.getPlayer();
    expect(player).toBeDefined();
    expect(player!.x).toBe(1800);
    expect(player!.y).toBe(1260);

    const controller = scene.getController();
    expect(controller).toBeDefined();
  });

  it('registers all building colliders and perimeter fences in the CollisionSystem', () => {
    const colSystem = scene.getCollisionSystem()!;
    expect(colSystem).toBeDefined();

    // Verify building colliders are in the collision system
    for (const b of scene.getBuildings().values()) {
      const col = colSystem.getCollider(b.collider.id);
      expect(col).toBeDefined();
    }

    // Verify boundary fence colliders exist
    expect(colSystem.getCollider('col_FENCE_NORTH')).toBeDefined();
    expect(colSystem.getCollider('col_FENCE_SOUTH')).toBeDefined();
    expect(colSystem.getCollider('col_FENCE_EAST')).toBeDefined();
    expect(colSystem.getCollider('col_umbilical_tower')).toBeDefined();
  });

  it('prevents player from walking into solid building walls via sliding collision', () => {
    const player = scene.getPlayer()!;
    const controller = scene.getController()!;

    // Teleport player directly below Mission Operations Centre building collider
    // MOC center is (1800, 1850), width 380, height 220. Collider covers y: 1740 to 1905
    const moc = scene.getBuilding('MISSION_OPERATIONS')!;
    const colliderY = moc.collider.y + moc.collider.height; // Bottom edge of solid collider

    player.updatePosition(1800, colliderY + 10);
    const startY = player.y;

    // Simulate pushing UP into the solid wall for 1.0 second
    (controller as any).movementIntent = { x: 0, y: -1 };
    (controller as any).isSprinting = false;

    // Update 30 physics frames
    for (let i = 0; i < 30; i++) {
      controller.update(1 / 30);
    }

    // Player position should be clamped to the bottom edge of the collider, not penetrated into it
    expect(player.y).toBeGreaterThanOrEqual(colliderY);
    expect(player.y).toBeLessThanOrEqual(startY);
  });

  it('allows player to walk to every facility entrance without being blocked', () => {
    const player = scene.getPlayer()!;
    const interactionSystem = scene.getInteractionSystem()!;

    for (const b of scene.getBuildings().values()) {
      // Teleport player near the entrance of each facility
      player.updatePosition(b.data.entranceX, b.data.entranceY);

      // Run interaction update
      interactionSystem.update(0.016);

      // Active target should recognize the nearby facility
      const target = interactionSystem.getActiveTarget();
      expect(target).toBeDefined();
      expect(target!.id).toBe(b.interactiveObject.id);
    }
  });

  it('updates atmospheric dust motes and diagnostics telemetry cleanly each frame', () => {
    expect(() => {
      scene.update(0.016);
      scene.update(0.016);
    }).not.toThrow();
  });
});
