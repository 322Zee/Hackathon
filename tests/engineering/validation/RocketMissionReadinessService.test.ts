import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  RocketMissionReadinessService,
  RocketValidationEngine,
  RocketBuilderEngine,
  RocketProjectManager,
  RocketComponentRegistry,
  ComponentInventoryService,
} from '../../../src/engineering';
import { MissionLifecycleManager } from '../../../src/missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';
import { PreparationTaskStatus } from '../../../src/missions/MissionLifecycleTypes';

describe('RocketMissionReadinessService', () => {
  let eventBus: EventBus;
  let readinessService: RocketMissionReadinessService;
  let projectManager: RocketProjectManager;
  let lifecycleManager: MissionLifecycleManager;
  let builderEngine: RocketBuilderEngine;
  let registry: RocketComponentRegistry;
  let inventoryService: ComponentInventoryService;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketMissionReadinessService.resetInstance();
    RocketValidationEngine.resetInstance();
    RocketBuilderEngine.resetInstance();
    RocketProjectManager.resetInstance();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();
    MissionLifecycleManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();

    MissionCatalogueRegistry.getInstance(eventBus);
    lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
    projectManager = RocketProjectManager.getInstance(eventBus);
    builderEngine = RocketBuilderEngine.getInstance(eventBus);
    registry = RocketComponentRegistry.getInstance(eventBus);
    inventoryService = ComponentInventoryService.getInstance(eventBus);
    readinessService = RocketMissionReadinessService.getInstance(eventBus);
  });

  it('marks launch vehicle configured on validation success, but enforces partial readiness', () => {
    // 1. Accept mission
    const acceptRes = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(acceptRes.success).toBe(true);
    const instance = acceptRes.instance!;

    // 2. Create project
    const project = projectManager.createProject('Test Pioneer Rocket', 'EARTH_LEO_DEPLOYMENT_01');
    expect(project).toBeDefined();

    // 3. Populate inventory so validation succeeds
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    // 4. Verify mission readiness
    const result = readinessService.verifyMissionReadiness(instance.instanceId, project.projectId);

    expect(result).toBeDefined();
    expect(result.rocketValidationPassed).toBe(true);
    expect(result.preparationSummary.launchVehicleConfigured).toBe(true);

    // Enforce partial readiness: other tasks (spacecraft, payload, comms) are still pending
    expect(result.overallMissionReady).toBe(false);
    expect(result.preparationSummary.remainingTasksCount).toBeGreaterThan(0);
    expect(result.message).toContain('Remaining unconfigured preparation tasks');
  });

  it('fails verification and unconfigures launch vehicle task when rocket validation fails', () => {
    // 1. Accept mission
    const acceptRes = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = acceptRes.instance!;

    // 2. Create project
    const project = projectManager.createProject('Defective Rocket', 'EARTH_LEO_DEPLOYMENT_01');
    expect(project).toBeDefined();

    // 3. Remove required engine to make validation fail
    builderEngine.removeComponent('stg1_propulsion');

    const result = readinessService.verifyMissionReadiness(instance.instanceId, project.projectId);

    expect(result.rocketValidationPassed).toBe(false);
    expect(result.overallMissionReady).toBe(false);
    expect(result.preparationSummary.launchVehicleConfigured).toBe(false);
    expect(result.message).toContain('failed validation');
  });

  it('achieves overall mission readiness when all preparation tasks are satisfied', () => {
    // 1. Accept mission
    const acceptRes = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = acceptRes.instance!;

    // 2. Create and validate rocket project
    const project = projectManager.createProject('Pioneer Certified', 'EARTH_LEO_DEPLOYMENT_01');
    expect(project).toBeDefined();

    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    // 3. Manually complete all other non-vehicle preparation tasks
    for (const task of instance.preparation.tasks) {
      task.status = PreparationTaskStatus.CONFIGURED;
      task.systemImplemented = true;
    }

    const result = readinessService.verifyMissionReadiness(instance.instanceId, project.projectId);

    expect(result.rocketValidationPassed).toBe(true);
    expect(result.overallMissionReady).toBe(true);
    expect(result.preparationSummary.remainingTasksCount).toBe(0);
    expect(result.message).toContain('CERTIFIED READY');
  });

  it('throws error for non-existent mission instance or project', () => {
    expect(() => {
      readinessService.verifyMissionReadiness('invalid_instance', 'proj_test');
    }).toThrow('not found in lifecycle manager');

    const acceptRes = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(() => {
      readinessService.verifyMissionReadiness(acceptRes.instance!.instanceId, 'non_existent_project');
    }).toThrow('not found in project manager');
  });
});
