import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container } from 'pixi.js';
import { RocketEngineeringScene } from '../../src/scenes/RocketEngineeringScene';
import { RocketWorkspaceSection, RocketProjectManager } from '../../src/engineering';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { SceneManager } from '../../src/scenes/SceneManager';
import { SceneId } from '../../src/scenes/SceneId';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';

describe('RocketEngineeringScene', () => {
  let scene: RocketEngineeringScene;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let sceneManager: SceneManager;
  let projectManager: RocketProjectManager;
  let missionRegistry: MissionCatalogueRegistry;

  beforeEach(async () => {
    ServiceLocator.reset();
    RocketProjectManager.resetInstance();
    DestinationRegistry.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    FacilityRegistry.resetInstance();

    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    sceneManager = new SceneManager(new Container(), new Container(), eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    projectManager = RocketProjectManager.getInstance(eventBus);
    missionRegistry = MissionCatalogueRegistry.getInstance(eventBus);

    const transform = new VirtualResolution(1920, 1080).getTransform();
    scene = new RocketEngineeringScene();
    sceneManager.register(scene);

    await scene.initialize({ eventBus, transform });
  });

  afterEach(async () => {
    await scene.cleanup();
    ServiceLocator.reset();
    RocketProjectManager.resetInstance();
    DestinationRegistry.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    FacilityRegistry.resetInstance();
  });

  it('initializes with SceneId.ROCKET_ENGINEERING and default OVERVIEW section', async () => {
    expect(scene.id).toBe(SceneId.ROCKET_ENGINEERING);
    expect(projectManager).toBeDefined();
    expect(missionRegistry).toBeDefined();
    await scene.activate();

    expect(scene.getActiveSection()).toBe(RocketWorkspaceSection.OVERVIEW);
    expect(scene.getActiveProject()).toBeDefined();
    expect(scene.getContentContainer().children.length).toBeGreaterThan(0);
  });

  it('switches cleanly across all 8 workspace sections', async () => {
    await scene.activate();

    const sections = [
      RocketWorkspaceSection.OVERVIEW,
      RocketWorkspaceSection.BUILDER,
      RocketWorkspaceSection.COMPONENTS,
      RocketWorkspaceSection.SAVED_DESIGNS,
      RocketWorkspaceSection.MISSION_COMPATIBILITY,
      RocketWorkspaceSection.VALIDATION,
      RocketWorkspaceSection.SIMULATION,
      RocketWorkspaceSection.RECORDS,
    ];

    for (const sec of sections) {
      scene.switchToSection(sec);
      expect(scene.getActiveSection()).toBe(sec);
      expect(scene.getContentContainer().children.length).toBeGreaterThan(0);
    }
  });

  it('handles mission context payload from Mission Operations Centre', async () => {
    await scene.activate({
      missionContext: {
        missionId: 'm_suborbital_sounding',
        instanceId: 'inst_test_01',
        fromMoc: true,
      },
      returnX: 2750,
      returnY: 1210,
      fromMoc: true,
    });

    expect(scene.getMissionContext()?.missionId).toBe('m_suborbital_sounding');
    // Entering with mission context opens Mission Compatibility view
    expect(scene.getActiveSection()).toBe(RocketWorkspaceSection.MISSION_COMPATIBILITY);
  });

  it('returns to previous scene properly based on fromMoc flag', async () => {
    let switchedTarget = '';
    sceneManager.switchScene = async (targetId: any) => {
      switchedTarget = targetId;
      return true;
    };

    // Case 1: Entered from Campus (HQ)
    await scene.activate({
      facilityId: 'FAC_ROCKET_ENGINEERING',
      returnX: 2750,
      returnY: 1210,
      fromMoc: false,
    });

    await scene.returnToPrevious();
    expect(switchedTarget).toBe(SceneId.HEADQUARTERS);

    await scene.deactivate();

    // Case 2: Entered from Mission Operations Centre
    await scene.activate({
      missionContext: {
        missionId: 'm_suborbital_sounding',
        fromMoc: true,
      },
      fromMoc: true,
    });

    await scene.returnToPrevious();
    expect(switchedTarget).toBe(SceneId.MISSION_OPERATIONS);
  });

  it('provides access to project manager and active vehicle telemetry', async () => {
    await scene.activate();
    const pm = scene.getProjectManager();
    expect(pm).toBeDefined();

    const active = scene.getActiveProject();
    expect(active).toBeDefined();
    expect(active?.design.totalWetMassKg).toBeGreaterThan(0);
    expect(active?.design.totalVacuumDeltaV).toBeGreaterThan(0);
  });
});
