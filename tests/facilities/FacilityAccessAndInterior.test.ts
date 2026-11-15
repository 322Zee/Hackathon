/**
 * INTERSTELLAR CONTINUUM - Facility Access, Interior, & Launch Complex Integration Tests
 * Verifies facility interactive entrances, access modals, interior scene round-trips,
 * coordinate restoration, and all 7 Launch Complex interactive zones.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeadquartersScene } from '../../src/scenes/HeadquartersScene';
import { FacilityInteriorScene } from '../../src/scenes/FacilityInteriorScene';
import { SceneManager } from '../../src/scenes/SceneManager';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { SceneId } from '../../src/scenes/SceneId';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import { FacilityId, FacilityAvailabilityState } from '../../src/facilities/FacilityTypes';
import { Container } from 'pixi.js';

describe('Facility Access, Interior Navigation & Launch Complex', () => {
  let hqScene: HeadquartersScene;
  let interiorScene: FacilityInteriorScene;
  let sceneManager: SceneManager;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let collisionSystem: CollisionSystem;
  let facilityRegistry: FacilityRegistry;

  beforeEach(async () => {
    ServiceLocator.reset();
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    collisionSystem = new CollisionSystem({ eventBus });
    collisionSystem.initialize();
    ServiceLocator.register('CollisionSystem', collisionSystem);

    const cameraSystem = new CameraSystem();
    ServiceLocator.register('CameraSystem', cameraSystem);

    facilityRegistry = FacilityRegistry.getInstance(eventBus);
    facilityRegistry.reset();
    ServiceLocator.register('FacilityRegistry', facilityRegistry);

    const rootContainer = new Container();
    const overlayContainer = new Container();
    sceneManager = new SceneManager(rootContainer, overlayContainer, eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    const transform = new VirtualResolution(1920, 1080).getTransform();
    sceneManager.onResize(transform);

    hqScene = new HeadquartersScene();
    sceneManager.register(hqScene);
    await sceneManager.switchScene(hqScene.id, { transition: null });

    interiorScene = new FacilityInteriorScene('FACILITY_INTERIOR');
    sceneManager.register(interiorScene);
  });

  afterEach(async () => {
    sceneManager.destroy();
    FacilityRegistry.resetInstance();
    ServiceLocator.reset();
  });

  it('displays contextual interaction prompts for all 10 facilities and Pad Alpha', () => {
    const buildings = hqScene.getBuildings();
    expect(buildings.size).toBe(12);

    const expectedActionTexts: Record<string, string> = {
      MISSION_OPERATIONS: 'Enter Mission Operations',
      ROCKET_ENGINEERING: 'Enter Rocket Engineering',
      SPACECRAFT_LAB: 'Enter Spacecraft & Satellite Laboratory',
      RESEARCH_DEVELOPMENT: 'Enter Research & Development',
      FINANCE_ADMIN: 'Enter Finance & Administration',
      MANUFACTURING_CENTRE: 'Enter Resource & Manufacturing',
      ROBOTICS_CENTRE: 'Enter Robotics & Exploration',
      COMMUNICATIONS_CENTRE: 'Enter Communication & Network Centre',
      PLANETARY_DATA_CENTRE: 'Enter Planetary Research & Data',
      CENTRAL_PLAZA_KIOSK: 'Access Settings & Administration',
      LAUNCH_COMPLEX_PAD_ALPHA: 'Access Launch Complex Pad Alpha',
      ARRIVAL_GATE: 'Access Main Arrival & Security',
    };

    for (const [key, expectedText] of Object.entries(expectedActionTexts)) {
      const b = buildings.get(key);
      expect(b).toBeDefined();
      expect(b?.interactiveObject.actionText).toBe(expectedText);
      expect(b?.interactiveObject.enabled).toBe(true);
    }
  });

  it('opens the facility access modal when interacting with an entrance', async () => {
    const modal = hqScene.getFacilityAccessModal();
    expect(modal).toBeDefined();
    expect(modal?.isOpen()).toBe(false);

    // Trigger interaction with Mission Operations
    await hqScene.handleFacilityInteraction(FacilityId.MISSION_OPERATIONS);

    expect(modal?.isOpen()).toBe(true);
    const activeFac = modal?.getCurrentFacility();
    expect(activeFac?.id).toBe(FacilityId.MISSION_OPERATIONS);
    expect(activeFac?.name).toContain('Mission Operations');
    expect(activeFac?.purpose).toContain('missions');

    // Input must be locked while modal is open
    expect(inputManager.isInputLocked()).toBe(true);

    modal?.hide();
    expect(modal?.isOpen()).toBe(false);
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('transitions to facility interior, logs visit, and returns to exact entrance coordinates on exit', async () => {
    const mocFac = facilityRegistry.getFacility(FacilityId.MISSION_OPERATIONS)!;
    expect(mocFac.visitState.visited).toBe(false);
    expect(mocFac.visitState.visitCount).toBe(0);

    // Enter facility interior
    await hqScene.enterFacility(mocFac);

    // Facility visit should be recorded
    expect(mocFac.visitState.visited).toBe(true);
    expect(mocFac.visitState.visitCount).toBe(1);

    // SceneManager should now have the interior scene active
    const activeScene = sceneManager.getActiveScene();
    expect(activeScene?.id).toBe('FACILITY_INTERIOR');

    const interior = activeScene as FacilityInteriorScene;
    expect(interior.getFacilityId()).toBe(FacilityId.MISSION_OPERATIONS);
    expect(interior.getReturnCoords()).toEqual({
      x: mocFac.entrancePosition.x,
      y: mocFac.entrancePosition.y,
    });

    // Check interior exit airlock
    const exitDoor = interior.getExitDoor();
    expect(exitDoor).toBeDefined();
    expect(exitDoor?.isExit).toBe(true);
    expect(exitDoor?.actionText).toBe('Exit to Campus Exterior');

    // Execute exit airlock interaction
    const exitResult = await exitDoor?.onInteract({} as any);
    expect(exitResult?.success).toBe(true);
    expect(exitResult?.action).toBe('EXIT_BUILDING');

    // SceneManager should have returned to Headquarters
    expect(sceneManager.getActiveScene()?.id).toBe(SceneId.HEADQUARTERS);

    // Player position in Headquarters should match the facility entrance
    const playerPos = hqScene.getPlayer()?.getPosition();
    expect(playerPos?.x).toBe(mocFac.entrancePosition.x);
    expect(playerPos?.y).toBe(mocFac.entrancePosition.y);

    // Input should be unlocked and ready for gameplay
    expect(inputManager.isInputLocked()).toBe(false);
  });

  it('provides 7 interactive zones in the Physical Launch Complex with valid colliders and telemetry', async () => {
    const launchZones = hqScene.getLaunchZones();
    expect(launchZones).toBeDefined();
    expect(launchZones?.interactiveObjects.length).toBe(7);
    expect(launchZones?.colliders.length).toBe(7);

    const expectedZoneIds = [
      'LC_ZONE_LAUNCHPAD',
      'LC_ZONE_INFRASTRUCTURE',
      'LC_ZONE_ROCKET_PREPARATION',
      'LC_ZONE_ASSEMBLY_ROLLOUT',
      'LC_ZONE_PRELAUNCH_INSPECTION',
      'LC_ZONE_OBSERVATION_BUNKER',
      'LC_ZONE_GSE_CRYO',
    ];

    for (const zid of expectedZoneIds) {
      const obj = launchZones?.interactiveObjects.find((o) => o.id === zid);
      expect(obj).toBeDefined();
      expect(obj?.enabled).toBe(true);
      expect(obj?.actionText).toBeTruthy();

      // Interacting with zone returns rich diagnostics and explicitly clarifies simulation standby
      const res = await obj?.onInteract({} as any);
      expect(res?.success).toBe(true);
      expect(res?.action).toBe('OPEN_PANEL');
      expect(res?.data?.title).toBeTruthy();
      expect(res?.data?.description).toContain('Launch simulation');
      expect(res?.data?.specs.length).toBeGreaterThan(0);

      // Collider verification
      const col = collisionSystem.getCollider(`col_${zid}`);
      expect(col).toBeDefined();
    }
  });

  it('respects facility locking and prevents unauthorized access', async () => {
    facilityRegistry.setAvailability(
      FacilityId.ROBOTICS_CENTRE,
      FacilityAvailabilityState.LOCKED,
      'Regolith test yard under dust decontamination.'
    );

    const check = facilityRegistry.isAvailable(FacilityId.ROBOTICS_CENTRE);
    expect(check.available).toBe(false);
    expect(check.reason).toContain('Regolith test yard under dust decontamination');

    // Access modal should reflect the locked state
    const modal = hqScene.getFacilityAccessModal();
    const robFac = facilityRegistry.getFacility(FacilityId.ROBOTICS_CENTRE)!;
    modal?.show(robFac);

    expect(modal?.isOpen()).toBe(true);
    expect(modal?.getCurrentFacility()?.availability).toBe(FacilityAvailabilityState.LOCKED);

    modal?.hide();
  });
});
