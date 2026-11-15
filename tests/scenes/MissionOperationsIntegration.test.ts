import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container } from 'pixi.js';
import { MissionOperationsScene, MOCSection } from '../../src/scenes/MissionOperationsScene';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { SceneManager } from '../../src/scenes/SceneManager';
import { SceneId } from '../../src/scenes/SceneId';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId, DestinationUnlockState } from '../../src/destinations/DestinationTypes';

describe('MissionOperationsIntegration', () => {
  let scene: MissionOperationsScene;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let sceneManager: SceneManager;
  let destinationRegistry: DestinationRegistry;

  beforeEach(async () => {
    ServiceLocator.reset();
    DestinationRegistry.resetInstance();

    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    sceneManager = new SceneManager(new Container(), new Container(), eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    destinationRegistry = DestinationRegistry.getInstance(eventBus);
    ServiceLocator.register('DestinationRegistry', destinationRegistry);

    const transform = new VirtualResolution(1920, 1080).getTransform();
    scene = new MissionOperationsScene();
    sceneManager.register(scene);

    await scene.initialize({ eventBus, transform });
  });

  afterEach(async () => {
    await scene.cleanup();
    ServiceLocator.reset();
    DestinationRegistry.resetInstance();
  });

  it('initializes with SceneId.MISSION_OPERATIONS and mounts core components', () => {
    expect(scene.id).toBe(SceneId.MISSION_OPERATIONS);
    expect(scene.getMapCanvas()).toBeDefined();
    expect(scene.getInfoPanel()).toBeDefined();
    expect(scene.getEarthOrbitDisplay()).toBeDefined();
    expect(scene.getMissionCatalogueView()).toBeDefined();
    expect(scene.getMissionBriefingView()).toBeDefined();
    expect(scene.getActiveMissionsDashboard()).toBeDefined();
    expect(scene.getActiveSection()).toBe(MOCSection.SOLAR_SYSTEM);
  });

  it('activates scene, sets input context, and selects Earth by default', async () => {
    await scene.activate({ returnX: 1800, returnY: 1730 });

    expect(inputManager.getContext()).toBe('MISSION_OPERATIONS');
    expect(scene.getSelectedDestination()?.id).toBe(DestinationId.EARTH);

    const infoPanel = scene.getInfoPanel();
    expect(infoPanel?.getDestination()?.id).toBe(DestinationId.EARTH);
  });

  it('selects celestial bodies and displays complete physical specs and lock notice', async () => {
    await scene.activate();

    // 1. Unlocked Earth
    const earth = destinationRegistry.getDestination(DestinationId.EARTH);
    scene.handleSelectDestination(earth!);
    expect(scene.getSelectedDestination()?.defaultUnlockState).toBe(DestinationUnlockState.UNLOCKED);

    // 2. Locked Mars
    const mars = destinationRegistry.getDestination(DestinationId.MARS);
    scene.handleSelectDestination(mars!);
    expect(scene.getSelectedDestination()?.id).toBe(DestinationId.MARS);
    expect(scene.getSelectedDestination()?.defaultUnlockState).toBe(DestinationUnlockState.LOCKED);
    expect(scene.getSelectedDestination()?.unlockRequirementsText).toContain('Trans-Mars Injection');
  });

  it('switches between MOC sections seamlessly', async () => {
    await scene.activate();

    // Initial is Solar System
    expect(scene.getActiveSection()).toBe(MOCSection.SOLAR_SYSTEM);

    // Switch to Mission Catalogue
    scene.switchToSection(MOCSection.MISSION_CATALOGUE);
    expect(scene.getActiveSection()).toBe(MOCSection.MISSION_CATALOGUE);
    expect(scene.getMissionCatalogueView()?.container.visible).toBe(true);
    expect(scene.getMapCanvas()?.container.visible).toBe(false);

    // Switch to Active Missions
    scene.switchToSection(MOCSection.ACTIVE_MISSIONS);
    expect(scene.getActiveSection()).toBe(MOCSection.ACTIVE_MISSIONS);

    // Switch to Destination Intel
    scene.switchToSection(MOCSection.DESTINATION_INTEL);
    expect(scene.getActiveSection()).toBe(MOCSection.DESTINATION_INTEL);

    // Return to Solar System
    scene.switchToSection(MOCSection.SOLAR_SYSTEM);
    expect(scene.getActiveSection()).toBe(MOCSection.SOLAR_SYSTEM);
  });

  it('navigates into Earth orbital regions hierarchy and returns to solar system map', async () => {
    await scene.activate();

    // Toggle Earth orbit display
    expect(scene.isEarthOrbitsActive()).toBe(false);
    scene.toggleEarthOrbitDisplay(true);
    expect(scene.isEarthOrbitsActive()).toBe(true);

    // Default selection in Earth orbits is LEO
    expect(scene.getSelectedDestination()?.id).toBe(DestinationId.EARTH_ORBIT_LEO);

    // Toggle back to Solar System map
    scene.toggleEarthOrbitDisplay(false);
    expect(scene.isEarthOrbitsActive()).toBe(false);
    expect(scene.getSelectedDestination()?.id).toBe(DestinationId.EARTH);
  });

  it('returns to headquarters exterior with specified spawn coordinates', async () => {
    let switchedSceneId: string | null = null;
    let switchedPayload: any = null;

    sceneManager.switchScene = async (targetId: any, options?: any): Promise<boolean> => {
      switchedSceneId = targetId;
      switchedPayload = options?.payload;
      return true;
    };

    await scene.activate({ returnX: 1800, returnY: 1730 });
    await scene.returnToHeadquarters();

    expect(switchedSceneId).toBe(SceneId.HEADQUARTERS);
    expect(switchedPayload?.spawnX).toBe(1800);
    expect(switchedPayload?.spawnY).toBe(1730);
  });

  it('opens and closes mission briefing view, preserving catalogue context', async () => {
    await scene.activate();

    // Navigate to Mission Catalogue and select LEO destination filter
    scene.switchToSection(MOCSection.MISSION_CATALOGUE);
    const catalogueView = scene.getMissionCatalogueView();
    expect(catalogueView).toBeDefined();
    catalogueView?.setDestinationFilter(DestinationId.EARTH_ORBIT_LEO);

    const mission = scene.getMissionRegistry().getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(mission).toBeDefined();

    // Open briefing
    scene.openMissionBriefing(mission!);
    expect(scene.isBriefingActive()).toBe(true);
    expect(scene.getMissionBriefingView()?.container.visible).toBe(true);
    expect(scene.getMissionCatalogueView()?.container.visible).toBe(false);

    // Close briefing
    scene.closeMissionBriefing();
    expect(scene.isBriefingActive()).toBe(false);
    expect(scene.getMissionBriefingView()?.container.visible).toBe(false);
    expect(scene.getMissionCatalogueView()?.container.visible).toBe(true);
    expect(catalogueView?.getDestinationFilter()).toBe(DestinationId.EARTH_ORBIT_LEO);
  });

  it('switches to Active Missions section and displays active missions dashboard', async () => {
    await scene.activate();

    scene.switchToSection(MOCSection.ACTIVE_MISSIONS);
    expect(scene.getActiveSection()).toBe(MOCSection.ACTIVE_MISSIONS);

    const dashboard = scene.getActiveMissionsDashboard();
    expect(dashboard).toBeDefined();
    expect(dashboard?.container.visible).toBe(true);

    expect(scene.getMapCanvas()?.container.visible).toBe(false);
    expect(scene.getInfoPanel()?.container.visible).toBe(false);
    expect(scene.getMissionCatalogueView()?.container.visible).toBe(false);
    expect(scene.getMissionBriefingView()?.container.visible).toBe(false);
  });
});
