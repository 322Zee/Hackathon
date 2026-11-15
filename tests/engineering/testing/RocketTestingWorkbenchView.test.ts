import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  RocketTestingWorkbenchView,
  TestingWorkbenchSubTab,
  RocketTestingManager,
  RocketProjectManager,
  RocketBuilderEngine,
  RocketComponentRegistry,
  ComponentInventoryService,
  RocketValidationEngine,
} from '../../../src/engineering';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';

describe('RocketTestingWorkbenchView', () => {
  let eventBus: EventBus;
  let testingManager: RocketTestingManager;
  let projectManager: RocketProjectManager;
  let registry: RocketComponentRegistry;
  let inventoryService: ComponentInventoryService;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketTestingManager.resetInstance();
    RocketValidationEngine.resetInstance();
    RocketBuilderEngine.resetInstance();
    RocketProjectManager.resetInstance();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();
    MissionCatalogueRegistry.resetInstance();

    testingManager = RocketTestingManager.getInstance(eventBus);
    RocketValidationEngine.getInstance(eventBus);
    RocketBuilderEngine.getInstance(eventBus);
    projectManager = RocketProjectManager.getInstance(eventBus);
    registry = RocketComponentRegistry.getInstance(eventBus);
    inventoryService = ComponentInventoryService.getInstance(eventBus);
  });

  it('initializes and mounts with Design Inspection sub-tab by default', () => {
    const project = projectManager.createProject('Test Bench View Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    const view = new RocketTestingWorkbenchView({
      projectId: project.projectId,
    });

    expect(view.container).toBeDefined();
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.DESIGN_INSPECTION);
    expect(view.container.children.length).toBeGreaterThanOrEqual(2);

    view.destroy();
  });

  it('switches between sub-tabs cleanly', () => {
    const project = projectManager.createProject('Tab Switch Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    const view = new RocketTestingWorkbenchView({
      projectId: project.projectId,
      initialSubTab: TestingWorkbenchSubTab.DESIGN_INSPECTION,
    });

    view.setSubTab(TestingWorkbenchSubTab.SYSTEM_COMPATIBILITY);
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.SYSTEM_COMPATIBILITY);

    view.setSubTab(TestingWorkbenchSubTab.PERFORMANCE_ASSESSMENT);
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.PERFORMANCE_ASSESSMENT);

    view.setSubTab(TestingWorkbenchSubTab.RELIABILITY_ASSESSMENT);
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.RELIABILITY_ASSESSMENT);

    view.setSubTab(TestingWorkbenchSubTab.MISSION_SUITABILITY);
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.MISSION_SUITABILITY);

    view.setSubTab(TestingWorkbenchSubTab.TEST_HISTORY);
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.TEST_HISTORY);

    view.setSubTab(TestingWorkbenchSubTab.PRE_LAUNCH_READINESS);
    expect(view.getActiveSubTab()).toBe(TestingWorkbenchSubTab.PRE_LAUNCH_READINESS);

    view.destroy();
  });

  it('updates selected slot inspection', () => {
    const project = projectManager.createProject('Slot Inspect Rocket', 'Test description');
    const view = new RocketTestingWorkbenchView({
      projectId: project.projectId,
    });

    view.setSelectedSlot('stg1_fuel');
    expect(view.container.children.length).toBeGreaterThanOrEqual(2);

    view.destroy();
  });

  it('invokes builder and launch complex callbacks when triggered', () => {
    let builderNavigatedSlot: string | undefined = undefined;
    let launchComplexNavigated = false;

    const project = projectManager.createProject('Callback Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    // Make ready for launch
    testingManager.runTestAssessment(project.projectId);

    const view = new RocketTestingWorkbenchView({
      projectId: project.projectId,
      onNavigateToBuilder: (slotId) => {
        builderNavigatedSlot = slotId;
      },
      onProceedToLaunchComplex: () => {
        launchComplexNavigated = true;
      },
    });

    // Test private handlers via execution
    (view as any).props.onNavigateToBuilder('stg1_propulsion');
    expect(builderNavigatedSlot).toBe('stg1_propulsion');

    (view as any).handleDeployToLaunchComplex();
    expect(launchComplexNavigated).toBe(true);

    view.destroy();
  });
});
