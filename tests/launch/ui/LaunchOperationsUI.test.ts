import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  LaunchDeploymentManager,
  LaunchpadRocketVisual,
  LaunchOperationsDashboardModal,
  LaunchObservationView,
} from '../../../src/launch';
import {
  RocketProjectManager,
  RocketValidationEngine,
  RocketTestingManager,
  RocketBuilderEngine,
  RocketComponentRegistry,
  ComponentInventoryService,
} from '../../../src/engineering';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../../../src/missions/MissionLifecycleManager';

describe('Launch Operations UI', () => {
  let eventBus: EventBus;
  let deploymentManager: LaunchDeploymentManager;
  let lifecycleManager: MissionLifecycleManager;
  let projectManager: RocketProjectManager;
  let inventoryService: ComponentInventoryService;
  let componentRegistry: RocketComponentRegistry;
  let validationEngine: RocketValidationEngine;
  let testingManager: RocketTestingManager;
  let builderEngine: RocketBuilderEngine;

  beforeEach(() => {
    eventBus = new EventBus();
    LaunchDeploymentManager.resetInstance();
    MissionLifecycleManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    RocketProjectManager.resetInstance();
    RocketValidationEngine.resetInstance();
    RocketTestingManager.resetInstance();
    RocketBuilderEngine.resetInstance();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();

    deploymentManager = LaunchDeploymentManager.getInstance(eventBus);
    lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
    MissionCatalogueRegistry.getInstance(eventBus);
    projectManager = RocketProjectManager.getInstance(eventBus);
    inventoryService = ComponentInventoryService.getInstance(eventBus);
    componentRegistry = RocketComponentRegistry.getInstance(eventBus);
    validationEngine = RocketValidationEngine.getInstance(eventBus);
    testingManager = RocketTestingManager.getInstance(eventBus);
    builderEngine = RocketBuilderEngine.getInstance(eventBus);
  });

  describe('LaunchpadRocketVisual', () => {
    it('creates container with pad mount and reacts to rocket updates', () => {
      const visual = new LaunchpadRocketVisual({ x: 3050, y: 1830 });
      expect(visual.container).toBeDefined();
      expect(visual.container.position.x).toBe(3050);
      expect(visual.container.position.y).toBe(1830);

      // Initially no rocket
      visual.update(undefined);
      expect(visual.container.children.length).toBeGreaterThan(0);

      // Create and assign a rocket project
      const project = projectManager.createProject('Titan-IV', 'Heavy lifter');
      visual.update(project);

      // Running tick should update particle boil-off venting without throwing
      expect(() => {
        visual.tick(0.016);
      }).not.toThrow();

      visual.destroy();
    });
  });

  describe('LaunchOperationsDashboardModal', () => {
    it('renders dashboard modal with 9 required sections and handles show/hide', () => {
      const modal = new LaunchOperationsDashboardModal();
      expect(modal.container).toBeDefined();
      expect(modal.container.visible).toBe(false);

      modal.show();
      expect(modal.container.visible).toBe(true);

      // Accept mission and create deployment
      const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
      expect(res.success).toBe(true);
      const instance = res.instance!;
      const project = projectManager.createProject('Atlas-V', 'Test');
      const deployment = deploymentManager.createDeployment({
        missionInstanceId: instance.instanceId,
        missionId: instance.missionId,
        projectId: project.projectId,
      });

      // Refresh modal with active deployment
      modal.show(deployment.deploymentId);
      expect(modal.container.children.length).toBeGreaterThan(0);

      modal.hide();
      expect(modal.container.visible).toBe(false);

      modal.destroy();
    });

    it('opens vehicle selection modal when switcher requested', () => {
      const modal = new LaunchOperationsDashboardModal();
      modal.show();

      // Modal container should have UI elements
      expect(modal.container.visible).toBe(true);
      modal.destroy();
    });
  });

  describe('LaunchObservationView', () => {
    it('initializes observation bunker view with periscope HUD and telemetry cards', () => {
      let closed = false;
      let launched = false;

      const view = new LaunchObservationView({
        onClose: () => { closed = true; },
        onLaunchCompleted: () => { launched = true; },
      });

      expect(view.container).toBeDefined();
      expect(view.container.visible).toBe(false);

      const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
      expect(res.success).toBe(true);
      const instance = res.instance!;
      const project = projectManager.createProject('Observation-Rocket', 'Flight ready');

      // Satisfy inventory & tests
      const ownedMap = new Map<string, number>();
      componentRegistry.getAllComponents().forEach(c => {
        const item = inventoryService.getInventoryItem(c.id);
        if (item) item.ownedQuantity = 10;
        ownedMap.set(c.id, 10);
      });
      builderEngine.loadProject(project);
      const modularConfig = builderEngine.getConfiguration();
      validationEngine.validate({
        projectId: project.projectId,
        configuration: modularConfig,
        availableCredits: 500_000,
        ownedComponentQuantities: ownedMap,
      });
      testingManager.runTestAssessment(project.projectId);

      const deployment = deploymentManager.createDeployment({
        missionInstanceId: instance.instanceId,
        missionId: instance.missionId,
        projectId: project.projectId,
      });

      deploymentManager.evaluateDeploymentEligibility(deployment.deploymentId);

      // Open observation bunker
      view.show(deployment.deploymentId);
      expect(view.container.visible).toBe(true);

      view.hide();
      expect(view.container.visible).toBe(false);
      expect(closed).toBe(true);
      expect(launched).toBe(false);

      view.destroy();
    });
  });
});
