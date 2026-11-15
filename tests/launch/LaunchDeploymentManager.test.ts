import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import {
  LaunchDeploymentManager,
  DeploymentState,
  PayloadIntegrationStatus,
} from '../../src/launch';
import {
  RocketProjectManager,
  RocketValidationEngine,
  RocketTestingManager,
  RocketBuilderEngine,
  RocketComponentRegistry,
  ComponentInventoryService,
} from '../../src/engineering';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../../src/missions/MissionLifecycleManager';
import { MissionLifecycleState, PreparationTaskStatus } from '../../src/missions/MissionLifecycleTypes';
import { FacilityId } from '../../src/facilities/FacilityTypes';

describe('LaunchDeploymentManager', () => {
  let eventBus: EventBus;
  let deploymentManager: LaunchDeploymentManager;
  let lifecycleManager: MissionLifecycleManager;
  let projectManager: RocketProjectManager;
  let validationEngine: RocketValidationEngine;
  let testingManager: RocketTestingManager;
  let componentRegistry: RocketComponentRegistry;
  let inventoryService: ComponentInventoryService;
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
    validationEngine = RocketValidationEngine.getInstance(eventBus);
    testingManager = RocketTestingManager.getInstance(eventBus);
    builderEngine = RocketBuilderEngine.getInstance(eventBus);
    componentRegistry = RocketComponentRegistry.getInstance(eventBus);
    inventoryService = ComponentInventoryService.getInstance(eventBus);
  });

  it('creates a deployment record bound to a mission instance', () => {
    // 1. Accept mission
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(res.success).toBe(true);
    const instance = res.instance!;

    // 2. Create deployment
    const deployment = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
    });

    expect(deployment).toBeDefined();
    expect(deployment.deploymentId).toMatch(/^dep_/);
    expect(deployment.missionInstanceId).toBe(instance.instanceId);
    expect(deployment.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(deployment.launchLocation).toBe(FacilityId.LAUNCH_COMPLEX_PAD_ALPHA);
    expect(deployment.padCode).toBe('PAD-01');
    expect(deployment.status).toBe(DeploymentState.AWAITING_ROCKET);
    expect(deployment.isEligible).toBe(false);

    // Verify retrieval
    expect(deploymentManager.getDeployment(deployment.deploymentId)).toBe(deployment);
    expect(deploymentManager.getActiveDeployment()?.deploymentId).toBe(deployment.deploymentId);
  });

  it('assigns rocket project to deployment and updates mission preparation task', () => {
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;
    const deployment = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
    });

    const project = projectManager.createProject('Falcon-I', 'Test rocket');
    const success = deploymentManager.assignRocket(deployment.deploymentId, project.projectId);
    expect(success).toBe(true);

    const updated = deploymentManager.getDeployment(deployment.deploymentId)!;
    expect(updated.projectId).toBe(project.projectId);
    expect(updated.designVersion).toBe(project.designVersion);
    expect(updated.status).not.toBe(DeploymentState.AWAITING_ROCKET);

    // Check mission prep task updated
    const inst = lifecycleManager.getInstance(instance.instanceId)!;
    const vehicleTask = inst.preparation.tasks.find(t => t.type === 'LAUNCH_VEHICLE_CONFIGURATION');
    expect(vehicleTask?.status).toBe(PreparationTaskStatus.CONFIGURED);
    expect(vehicleTask?.configRef).toBe(project.projectId);
  });

  it('prevents assigning the same rocket project to multiple active deployments', () => {
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;

    const dep1 = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
      padCode: 'PAD-01',
    });
    const dep2 = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
      padCode: 'PAD-02',
    });

    const project = projectManager.createProject('Unique-Booster', 'Single active flight');
    const assign1 = deploymentManager.assignRocket(dep1.deploymentId, project.projectId);
    expect(assign1).toBe(true);

    // Attempting to assign same project to dep2 should return false
    const assign2 = deploymentManager.assignRocket(dep2.deploymentId, project.projectId);
    expect(assign2).toBe(false);
  });

  it('evaluates deployment criteria and detects missing validation / testing', () => {
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;
    const project = projectManager.createProject('Unvalidated-Craft', 'No tests run');

    const deployment = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
      projectId: project.projectId,
    });

    const evalResult = deploymentManager.evaluateDeploymentEligibility(deployment.deploymentId);
    expect(evalResult.isEligible).toBe(false);

    const valCheck = evalResult.requirements.find(r => r.id === 'req_validation_status');
    expect(valCheck?.satisfied).toBe(false);

    const testCheck = evalResult.requirements.find(r => r.id === 'req_testing_benchmark');
    expect(testCheck?.satisfied).toBe(false);
  });

  it('evaluates payload requirement and checks vehicle payload integration', () => {
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;
    const project = projectManager.createProject('Payload-Carrier', 'Rocket carrying payload');

    const deployment = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
      projectId: project.projectId,
    });

    // Default template has payload_basic_satellite_bus matching COMMUNICATION_RELAY
    const evalResult = deploymentManager.evaluateDeploymentEligibility(deployment.deploymentId);
    expect(evalResult.payload).toBeDefined();
    expect(evalResult.payload.status).toBe(PayloadIntegrationStatus.MOUNTED_IN_VEHICLE);

    // Now remove payload from rocket and test UNAVAILABLE detection
    builderEngine.loadProject(project);
    builderEngine.removeComponent('stg2_payload');
    (project as any).modularConfig = builderEngine.getConfiguration();
    deploymentManager.assignRocket(deployment.deploymentId, project.projectId);
    const updatedEval = deploymentManager.evaluateDeploymentEligibility(deployment.deploymentId);
    expect(updatedEval.payload.status).toBe(PayloadIntegrationStatus.UNAVAILABLE);
  });

  it('transitions through countdown scheduling and launch deployment', () => {
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;

    // Grant inventory items
    const ownedMap = new Map<string, number>();
    componentRegistry.getAllComponents().forEach(c => {
      const item = inventoryService.getInventoryItem(c.id);
      if (item) item.ownedQuantity = 10;
      ownedMap.set(c.id, 10);
    });

    // Create project and run testing & validation
    const project = projectManager.createProject('Saturn-IX', 'Certified ready');
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

    // Evaluate eligibility
    const evaluation = deploymentManager.evaluateDeploymentEligibility(deployment.deploymentId);
    expect(evaluation.isEligible).toBe(true);
    expect(evaluation.status).toBe(DeploymentState.ELIGIBLE_FOR_DEPLOYMENT);

    // Schedule countdown
    const scheduled = deploymentManager.scheduleDeployment(deployment.deploymentId, 10);
    expect(scheduled).toBe(true);
    expect(deploymentManager.getDeployment(deployment.deploymentId)?.status).toBe(DeploymentState.DEPLOYMENT_SCHEDULED);

    // Initiate launch
    const launched = deploymentManager.initiateDeployment(deployment.deploymentId);
    expect(launched).toBe(true);
    expect(deploymentManager.getDeployment(deployment.deploymentId)?.status).toBe(DeploymentState.DEPLOYMENT_INITIATED);

    // Complete deployment
    const completed = deploymentManager.completeDeployment(deployment.deploymentId);
    expect(completed).toBe(true);

    const finished = deploymentManager.getDeployment(deployment.deploymentId)!;
    expect(finished.status).toBe(DeploymentState.DEPLOYED);

    // Mission instance should now be ACTIVE
    const updatedInstance = lifecycleManager.getInstance(instance.instanceId);
    expect(updatedInstance?.status).toBe(MissionLifecycleState.ACTIVE);
  });

  it('cancels deployment with audit log', () => {
    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;

    const deployment = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
    });

    // Cancel
    const cancelled = deploymentManager.cancelDeployment(deployment.deploymentId, 'Mission scrubbed by flight director');
    expect(cancelled).toBe(true);

    const cancelledDep = deploymentManager.getDeployment(deployment.deploymentId)!;
    expect(cancelledDep.status).toBe(DeploymentState.CANCELLED);
    expect(deploymentManager.getActiveDeployment()).toBeUndefined();
  });

  it('dispatches events via EventBus during deployment lifecycle transitions', () => {
    const eventsDispatched: string[] = [];
    eventBus.on('deployment:created' as any, () => eventsDispatched.push('deployment:created'));
    eventBus.on('deployment:rocket_assigned' as any, () => eventsDispatched.push('deployment:rocket_assigned'));
    eventBus.on('deployment:readiness_updated' as any, () => eventsDispatched.push('deployment:readiness_updated'));

    const res = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = res.instance!;

    const deployment = deploymentManager.createDeployment({
      missionInstanceId: instance.instanceId,
      missionId: instance.missionId,
    });

    const project = projectManager.createProject('Event-Tester', 'Event bus verify');
    deploymentManager.assignRocket(deployment.deploymentId, project.projectId);

    expect(eventsDispatched).toContain('deployment:created');
    expect(eventsDispatched).toContain('deployment:rocket_assigned');
    expect(eventsDispatched).toContain('deployment:readiness_updated');
  });

  it('generates pad status summary with hardware metrics', () => {
    const summary = deploymentManager.getLaunchPadSummary(FacilityId.LAUNCH_COMPLEX_PAD_ALPHA);
    expect(summary).toBeDefined();
    expect(summary.padCode).toBe('PAD-01');
    expect(summary.padName).toBe('Launch Complex Pad Alpha');
    expect(summary.isOccupied).toBe(false);
  });
});
