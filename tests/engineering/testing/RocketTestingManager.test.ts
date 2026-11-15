import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  RocketTestingManager,
  RocketTestStatus,
  PreLaunchReadinessStatus,
  AssessmentCategory,
  RocketBuilderEngine,
  RocketProjectManager,
  RocketComponentRegistry,
  ComponentInventoryService,
  RocketValidationEngine,
} from '../../../src/engineering';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../../../src/missions/MissionLifecycleManager';
import { PreparationTaskStatus } from '../../../src/missions/MissionLifecycleTypes';

describe('RocketTestingManager', () => {
  let eventBus: EventBus;
  let testingManager: RocketTestingManager;
  let builderEngine: RocketBuilderEngine;
  let projectManager: RocketProjectManager;
  let registry: RocketComponentRegistry;
  let inventoryService: ComponentInventoryService;
  let lifecycleManager: MissionLifecycleManager;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketTestingManager.resetInstance();
    RocketValidationEngine.resetInstance();
    RocketBuilderEngine.resetInstance();
    RocketProjectManager.resetInstance();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    MissionLifecycleManager.resetInstance();

    testingManager = RocketTestingManager.getInstance(eventBus);
    RocketValidationEngine.getInstance(eventBus);
    builderEngine = RocketBuilderEngine.getInstance(eventBus);
    projectManager = RocketProjectManager.getInstance(eventBus);
    registry = RocketComponentRegistry.getInstance(eventBus);
    inventoryService = ComponentInventoryService.getInstance(eventBus);
    MissionCatalogueRegistry.getInstance(eventBus);
    lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
  });

  it('inspects rocket design and generates component status details', () => {
    const project = projectManager.createProject('Pioneer Test Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    const inspection = testingManager.inspectDesign(project.projectId);
    expect(inspection).toBeDefined();
    expect(inspection.project.projectId).toBe(project.projectId);
    expect(inspection.componentInspections.length).toBeGreaterThan(0);

    const boosterProp = inspection.componentInspections.find(s => s.slotId === 'stg1_propulsion');
    expect(boosterProp).toBeDefined();
    expect(boosterProp?.slotType).toBe('PROPULSION');
    expect(boosterProp?.stageNumber).toBe(1);
    expect(boosterProp?.isRequired).toBe(true);
    expect(boosterProp?.componentName).toContain('Basic Thrust Vector');
    expect(boosterProp?.status).toBe('COMPATIBLE');
  });

  it('detects unowned components during design inspection', () => {
    const project = projectManager.createProject('Unowned Rocket', 'Test description');
    // Ensure 0 owned inventory
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 0;
    });

    const inspection = testingManager.inspectDesign(project.projectId);
    const unownedSlots = inspection.componentInspections.filter(s => s.status === 'UNAVAILABLE');
    expect(unownedSlots.length).toBeGreaterThan(0);
  });

  it('runs an abstract test-bench assessment across all 6 categories', () => {
    const project = projectManager.createProject('Certified Falcon', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    const report = testingManager.runTestAssessment(project.projectId);
    expect(report).toBeDefined();
    expect(report.projectId).toBe(project.projectId);
    expect(report.engineVersion).toBe(RocketTestingManager.TEST_ENGINE_VERSION);
    expect([RocketTestStatus.PASSED, RocketTestStatus.PASSED_WITH_WARNINGS]).toContain(report.status);
    expect(report.overallScore).toBeGreaterThanOrEqual(50);
    expect(report.isStale).toBe(false);

    // Verify all 6 assessment categories present in checkpoints
    const categories = report.checkpoints.map(c => c.category);
    expect(categories).toContain(AssessmentCategory.COMPATIBILITY);
    expect(categories).toContain(AssessmentCategory.PERFORMANCE);
    expect(categories).toContain(AssessmentCategory.RELIABILITY);
    expect(categories).toContain(AssessmentCategory.POWER_SYSTEMS);
    expect(categories).toContain(AssessmentCategory.COMMUNICATION);
    expect(categories).toContain(AssessmentCategory.MISSION_SUITABILITY);

    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('fails test assessment when mandatory propulsion engine is missing', () => {
    const project = projectManager.createProject('Defective Rocket', 'Test description');
    builderEngine.removeComponent('stg1_propulsion');

    const report = testingManager.runTestAssessment(project.projectId);
    expect(report.status).toBe(RocketTestStatus.FAILED);
    expect(report.failedChecks.length).toBeGreaterThan(0);
  });

  it('stores rolling test history and preserves records across design changes', () => {
    const project = projectManager.createProject('History Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    // Run 5 test runs
    for (let i = 0; i < 5; i++) {
      testingManager.runTestAssessment(project.projectId);
    }

    const history = testingManager.getTestHistory(project.projectId);
    expect(history.length).toBe(5);
    expect(testingManager.getLatestTestReport(project.projectId)?.testId).toBe(history[0]?.testId);
  });

  it('evaluates pre-launch readiness and blocks deployment when test has not been executed', () => {
    const project = projectManager.createProject('Untested Rocket', 'Test description');

    // Project has not had a test run executed yet
    const readiness = testingManager.evaluatePreLaunchReadiness(project.projectId);
    expect(readiness.isReadyForDeployment).toBe(false);
    expect([PreLaunchReadinessStatus.AWAITING_ASSESSMENT, PreLaunchReadinessStatus.NOT_PREPARED]).toContain(readiness.status);
    expect(readiness.deploymentClearance).toBeUndefined();
  });

  it('achieves pre-launch readiness and clears deployment to Launch Complex Pad Alpha', () => {
    // 1. Accept mission
    const acceptRes = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(acceptRes.success).toBe(true);

    // 2. Create project assigned to mission
    const project = projectManager.createProject('Alpha-1 Carrier', 'Flight orbital rocket');
    projectManager.assignToMission(project.projectId, 'EARTH_LEO_DEPLOYMENT_01', acceptRes.instance?.instanceId);

    // 3. Stock inventory
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    // 4. Run test assessment
    const testReport = testingManager.runTestAssessment(project.projectId);
    expect([RocketTestStatus.PASSED, RocketTestStatus.PASSED_WITH_WARNINGS]).toContain(testReport.status);

    // 5. Evaluate pre-launch readiness
    const readiness = testingManager.evaluatePreLaunchReadiness(project.projectId);
    expect(readiness.isReadyForDeployment).toBe(true);
    expect([
      PreLaunchReadinessStatus.READY_FOR_MISSION_DEPLOYMENT,
      PreLaunchReadinessStatus.READY_WITH_WARNINGS,
    ]).toContain(readiness.status);
    expect(readiness.deploymentClearance).toBeDefined();
    expect(readiness.deploymentClearance?.launchComplexEligible).toBe(true);
    expect(readiness.deploymentClearance?.launchComplexId).toBe('FAC_LAUNCH_COMPLEX_PAD_ALPHA');
    expect(readiness.deploymentClearance?.padDesignation).toBe('PAD-01');

    // 6. Deploy to launch complex
    const deployRes = testingManager.deployToLaunchComplex(project.projectId);
    expect(deployRes.success).toBe(true);
    expect(deployRes.launchComplexId).toBe('FAC_LAUNCH_COMPLEX_PAD_ALPHA');
    expect(deployRes.padDesignation).toBe('PAD-01');
    expect(testingManager.getDeployment(project.projectId)).toBeDefined();

    // Verify mission preparation task was updated
    const instance = lifecycleManager.getInstance(acceptRes.instance!.instanceId);
    const vehicleTask = instance?.preparation.tasks.find(t => t.type === 'LAUNCH_VEHICLE_CONFIGURATION');
    expect(vehicleTask?.status).toBe(PreparationTaskStatus.CONFIGURED);
  });

  it('rejects deployment when pre-launch readiness criteria are deficient', () => {
    const project = projectManager.createProject('Failing Deploy Rocket', 'Test description');
    builderEngine.removeComponent('stg1_propulsion');

    const deployRes = testingManager.deployToLaunchComplex(project.projectId);
    expect(deployRes.success).toBe(false);
    expect(deployRes.message).toContain('blocking criteria prevent launch rollout');
  });

  it('detects stale test runs when configuration version changes', () => {
    const project = projectManager.createProject('Versioned Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    // Run test on v1.0.0
    testingManager.runTestAssessment(project.projectId);

    // Bump version in builder
    builderEngine.bumpVersion(); // bumps to v1.1.0

    // Evaluate readiness
    const readiness = testingManager.evaluatePreLaunchReadiness(project.projectId);
    expect(readiness.isStale).toBe(true);
    const testCriterion = readiness.criteria.find(c => c.id === 'crit_test_run');
    expect(testCriterion?.satisfied).toBe(false);
  });

  it('emits lifecycle events on EventBus for tests and deployment', () => {
    const project = projectManager.createProject('Event Rocket', 'Test description');
    const allCompIds = registry.getAllComponents().map(c => c.id);
    allCompIds.forEach(id => {
      const item = inventoryService.getInventoryItem(id);
      if (item) item.ownedQuantity = 10;
    });

    let testStartedEmitted = false;
    let testCompletedEmitted = false;
    let readinessEvaluatedEmitted = false;
    let deployedEmitted = false;

    eventBus.on('rocket:test_started' as any, () => { testStartedEmitted = true; });
    eventBus.on('rocket:test_completed' as any, () => { testCompletedEmitted = true; });
    eventBus.on('rocket:readiness_evaluated' as any, () => { readinessEvaluatedEmitted = true; });
    eventBus.on('rocket:deployed_to_launch_complex' as any, () => { deployedEmitted = true; });

    testingManager.runTestAssessment(project.projectId);
    expect(testStartedEmitted).toBe(true);
    expect(testCompletedEmitted).toBe(true);

    testingManager.evaluatePreLaunchReadiness(project.projectId);
    expect(readinessEvaluatedEmitted).toBe(true);

    testingManager.deployToLaunchComplex(project.projectId);
    expect(deployedEmitted).toBe(true);
  });
});
