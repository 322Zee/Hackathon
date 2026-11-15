import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeadquartersScene } from '../../src/scenes/HeadquartersScene';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { CollisionSystem } from '../../src/collision/CollisionSystem';
import { CameraSystem } from '../../src/camera/CameraSystem';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import { FacilityId } from '../../src/facilities/FacilityTypes';
import { TutorialSequenceId, TutorialStepId } from '../../src/tutorial/TutorialTypes';
import { TutorialManager } from '../../src/tutorial/TutorialManager';
import { SaveService } from '../../src/services/SaveService';
import { GameStateManager } from '../../src/state/GameStateManager';
import { InputAction } from '../../src/input/InputAction';

describe('OnboardingIntegration', () => {
  let scene: HeadquartersScene;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let facilityRegistry: FacilityRegistry;
  let saveService: SaveService;
  let gameStateManager: GameStateManager;

  beforeEach(async () => {
    ServiceLocator.reset();
    TutorialManager.resetInstance();
    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    const collisionSystem = new CollisionSystem({ eventBus });
    collisionSystem.initialize();
    ServiceLocator.register('CollisionSystem', collisionSystem);

    const cameraSystem = new CameraSystem();
    ServiceLocator.register('CameraSystem', cameraSystem);

    facilityRegistry = FacilityRegistry.getInstance(eventBus);
    ServiceLocator.register('FacilityRegistry', facilityRegistry);

    saveService = new SaveService();
    ServiceLocator.register('SaveService', saveService);

    gameStateManager = new GameStateManager(eventBus);
    ServiceLocator.register('GameStateManager', gameStateManager);

    const transform = new VirtualResolution(1920, 1080).getTransform();
    scene = new HeadquartersScene();
    await scene.initialize({ eventBus, transform });
  });

  afterEach(async () => {
    await scene.cleanup();
    ServiceLocator.reset();
  });

  it('triggers initial onboarding automatically on new game activation', async () => {
    await scene.activate({ isNewGame: true, spawnX: 480, spawnY: 1350 });

    const tm = scene.tutorialManager;
    expect(tm).toBeDefined();
    expect(tm?.getState().hasStarted).toBe(true);
    expect(tm?.getState().activeSequenceId).toBe(TutorialSequenceId.INITIAL_ONBOARDING);

    const step1 = tm?.getCurrentStep();
    expect(step1?.id).toBe(TutorialStepId.STEP_1_ARRIVAL);
    expect(step1?.title).toContain('COMMAND DIRECTIVE // ARRIVAL');
    expect(step1?.subtitle).toContain('WELCOME TO INTERSTELLAR CONTINUUM');
    expect(step1?.description).toContain('Mission Director');

    // TutorialPanel should be mounted and visible
    expect(scene.tutorialPanel).toBeDefined();
    expect(scene.tutorialPanel?.container.visible).toBe(true);
  });

  it('progresses through all 7 onboarding steps sequentially with correct metadata', async () => {
    await scene.activate({ isNewGame: true });
    const tm = scene.tutorialManager!;

    // Step 1: Arrival
    expect(tm.getCurrentStep()?.id).toBe(TutorialStepId.STEP_1_ARRIVAL);
    tm.advanceStep();

    // Step 2: Movement & Controls - dynamic binding inspection
    const step2 = tm.getCurrentStep();
    expect(step2?.id).toBe(TutorialStepId.STEP_2_MOVEMENT);
    expect(step2?.description).toContain('W');
    expect(step2?.description).toContain('A');
    expect(step2?.description).toContain('S');
    expect(step2?.description).toContain('D');
    expect(step2?.description).toContain('E');
    expect(step2?.description).toContain('ESC');
    tm.advanceStep();

    // Step 3: Campus Exploration & MOC Waypoint
    const step3 = tm.getCurrentStep();
    expect(step3?.id).toBe(TutorialStepId.STEP_3_CAMPUS_EXPLORATION);
    expect(step3?.highlight.targetId).toBe(FacilityId.MISSION_OPERATIONS);
    expect(scene.waypointMarker?.getTarget()?.targetId).toBe(FacilityId.MISSION_OPERATIONS);
    tm.advanceStep();

    // Step 4: Facility Discovery - dynamically pulls from FacilityRegistry
    const step4 = tm.getCurrentStep();
    expect(step4?.id).toBe(TutorialStepId.STEP_4_FACILITY_DISCOVERY);
    const mocRecord = facilityRegistry.getFacility(FacilityId.MISSION_OPERATIONS);
    const vabRecord = facilityRegistry.getFacility(FacilityId.ROCKET_ENGINEERING);
    expect(step4?.detailedNotes?.some((n) => n.includes(mocRecord!.name))).toBe(true);
    expect(step4?.detailedNotes?.some((n) => n.includes(vabRecord!.name))).toBe(true);
    tm.advanceStep();

    // Step 5: Launch Complex & Pad Alpha
    const step5 = tm.getCurrentStep();
    expect(step5?.id).toBe(TutorialStepId.STEP_5_LAUNCH_COMPLEX);
    expect(step5?.highlight.targetId).toBe(FacilityId.LAUNCH_COMPLEX_PAD_ALPHA);
    expect(step5?.description).toContain('Pad Alpha');
    tm.advanceStep();

    // Step 6: Mission Preparation & Architecture
    const step6 = tm.getCurrentStep();
    expect(step6?.id).toBe(TutorialStepId.STEP_6_MISSION_PREPARATION);
    expect(step6?.title).toContain('MISSION ARCHITECTURE');
    tm.advanceStep();

    // Step 7: Free Exploration & Clearance Granted
    const step7 = tm.getCurrentStep();
    expect(step7?.id).toBe(TutorialStepId.STEP_7_FREE_EXPLORATION);
    expect(step7?.title).toContain('COMMAND STATUS // ACTIVE');

    // Final advance completes sequence
    tm.advanceStep();
    expect(tm.getState().isOnboardingComplete).toBe(true);
    expect(tm.getCurrentStep()).toBeNull();
  });

  it('updates movement keys dynamically when controls are rebound in InputManager', async () => {
    // Rebind MoveUp to ArrowUp
    inputManager.rebind(InputAction.MoveUp, { keys: ['ArrowUp'] });

    // Re-create onboarding with updated input manager
    const tm = scene.tutorialManager!;
    tm.setInputManager(inputManager);
    tm.startSequence(TutorialSequenceId.INITIAL_ONBOARDING, true);
    tm.advanceStep(); // Step 2

    const step2 = tm.getCurrentStep();
    expect(step2?.description).toContain('▲ UP');
  });

  it('re-triggers onboarding via pause menu replay tutorial button', async () => {
    await scene.activate({ isNewGame: true });
    const tm = scene.tutorialManager!;
    tm.skipCurrentSequence(); // Finished onboarding
    expect(tm.getState().isOnboardingComplete).toBe(true);
    expect(tm.getCurrentStep()).toBeNull();

    // Open Pause Menu and trigger replay
    scene.pauseMenu?.replayTutorial();

    expect(tm.getCurrentStep()?.id).toBe(TutorialStepId.STEP_1_ARRIVAL);
    expect(scene.tutorialPanel?.container.visible).toBe(true);
  });

  it('saves tutorial state into save slot 1 and preserves onboarding completion', async () => {
    await scene.activate({ isNewGame: true });
    const tm = scene.tutorialManager!;
    tm.advanceStep();
    tm.advanceStep(); // Step 3

    // Save game via pause menu
    scene.pauseMenu?.saveGame();

    const loaded = saveService.loadFromSlot(1);
    expect(loaded).toBeDefined();
    expect(loaded?.tutorial).toBeDefined();
    expect(loaded?.tutorial?.hasStarted).toBe(true);
    expect(loaded?.tutorial?.currentStepIndex).toBe(2);
  });
});
