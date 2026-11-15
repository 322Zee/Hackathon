import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container } from 'pixi.js';
import { RocketEngineeringScene } from '../../src/scenes/RocketEngineeringScene';
import {
  RocketWorkspaceSection,
  RocketProjectManager,
  RocketComponentRegistry,
  ComponentInventoryService,
} from '../../src/engineering';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EventBus } from '../../src/core/EventBus';
import { InputManager } from '../../src/input/InputManager';
import { SceneManager } from '../../src/scenes/SceneManager';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import { EconomyService } from '../../src/services/EconomyService';

describe('RocketEngineeringScene - Components & Comparison', () => {
  let scene: RocketEngineeringScene;
  let eventBus: EventBus;
  let inputManager: InputManager;
  let sceneManager: SceneManager;
  let economyService: EconomyService;

  beforeEach(async () => {
    ServiceLocator.reset();
    RocketProjectManager.resetInstance();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();
    DestinationRegistry.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    FacilityRegistry.resetInstance();

    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    economyService = new EconomyService(
      { credits: 80000, researchData: 2000, rawMaterials: 500, technologyPoints: 100 },
      eventBus
    );
    ServiceLocator.register('EconomyService', economyService);

    inputManager = new InputManager();
    inputManager.initialize();
    ServiceLocator.register('InputManager', inputManager);

    sceneManager = new SceneManager(new Container(), new Container(), eventBus);
    ServiceLocator.register('SceneManager', sceneManager);

    const transform = new VirtualResolution(1920, 1080).getTransform();
    scene = new RocketEngineeringScene();
    sceneManager.register(scene);

    await scene.initialize({ eventBus, transform });
  });

  afterEach(async () => {
    await scene.cleanup();
    ServiceLocator.reset();
  });

  it('renders components section with category filtering and component cards', async () => {
    await scene.activate();
    scene.switchToSection(RocketWorkspaceSection.COMPONENTS);

    expect(scene.getActiveSection()).toBe(RocketWorkspaceSection.COMPONENTS);
    expect(scene.getContentContainer().children.length).toBeGreaterThan(0);

    const reg = scene.getComponentRegistry();
    expect(reg.getAllComponents().length).toBeGreaterThanOrEqual(24);
  });

  it('opens and closes side-by-side component comparison modal', async () => {
    await scene.activate();
    scene.switchToSection(RocketWorkspaceSection.COMPONENTS);

    expect(scene.getComparisonModal()).toBeUndefined();

    // Open comparison between basic booster and vacuum expander
    scene.openComparisonModal('prop_basic_booster_mk1', 'prop_upper_vacuum_nozzle');
    expect(scene.getComparisonModal()).toBeDefined();

    // Close comparison modal
    scene.closeComparisonModal();
    expect(scene.getComparisonModal()).toBeUndefined();
  });

  it('integrates with ComponentInventoryService and EconomyService for component purchases', async () => {
    await scene.activate();
    const inv = scene.getInventoryService();
    const initialOwned = inv.getOwnedQuantity('struct_main_core_alpha');

    const result = inv.purchaseComponent('struct_main_core_alpha', 1);
    expect(result.success).toBe(true);
    expect(inv.getOwnedQuantity('struct_main_core_alpha')).toBe(initialOwned + 1);
  });
});
