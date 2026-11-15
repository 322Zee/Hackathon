import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  RocketValidationEngine,
  ValidationCategory,
  ValidationSeverity,
  ValidationOverallStatus,
  EducationalTradeOffTopic,
  RocketBuilderEngine,
  RocketProjectManager,
  RocketComponentRegistry,
  ComponentInventoryService,
  RocketClassRating,
} from '../../../src/engineering';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';

describe('RocketValidationEngine', () => {
  let eventBus: EventBus;
  let validationEngine: RocketValidationEngine;
  let builderEngine: RocketBuilderEngine;
  let registry: RocketComponentRegistry;
  let missionRegistry: MissionCatalogueRegistry;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketValidationEngine.resetInstance();
    RocketBuilderEngine.resetInstance();
    RocketProjectManager.resetInstance();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();
    MissionCatalogueRegistry.resetInstance();

    validationEngine = RocketValidationEngine.getInstance(eventBus);
    builderEngine = RocketBuilderEngine.getInstance(eventBus);
    registry = RocketComponentRegistry.getInstance(eventBus);
    missionRegistry = MissionCatalogueRegistry.getInstance(eventBus);
  });

  it('validates a complete standard configuration successfully', () => {
    const config = builderEngine.getConfiguration();
    const allCompIds = registry.getAllComponents().map(c => c.id);
    const ownedMap = new Map<string, number>();
    allCompIds.forEach(id => ownedMap.set(id, 5));

    const report = validationEngine.validate({
      projectId: 'proj_test_01',
      configuration: config,
      availableCredits: 500_000,
      ownedComponentQuantities: ownedMap,
      unlockedTechIds: ['tech_basic_rocketry', 'tech_orbital_dynamics', 'tech_vacuum_engines', 'tech_satellites'],
      organisationRank: 5,
    });

    expect(report).toBeDefined();
    expect(report.projectId).toBe('proj_test_01');
    expect(report.engineVersion).toBe(RocketValidationEngine.ENGINE_VERSION);
    expect(report.isValid).toBe(true);
    expect([ValidationOverallStatus.PASSED, ValidationOverallStatus.PASSED_WITH_WARNINGS]).toContain(report.status);
    expect(report.isStale).toBe(false);
    expect(report.ratings.totalMassUnits).toBeGreaterThan(0);
    expect(report.ratings.overallPerformanceRating).toBeGreaterThan(0);
    expect(report.categorySummaries).toBeDefined();
    expect(Object.keys(report.categorySummaries).length).toBe(7);
  });

  it('flags missing required slots and missing categories as blocking errors', () => {
    const config = JSON.parse(JSON.stringify(builderEngine.getConfiguration()));
    // Remove the propulsion engine from stage 1
    const stg1Prop = config.stages[0].slots.find((s: any) => s.slotId === 'stg1_propulsion');
    stg1Prop.installedComponentId = undefined;

    const report = validationEngine.validate({
      projectId: 'proj_test_missing_prop',
      configuration: config,
    });

    expect(report.isValid).toBe(false);
    expect(report.status).toBe(ValidationOverallStatus.FAILED);
    const compIssues = report.issues.filter(i => i.category === ValidationCategory.CONFIGURATION_COMPLETENESS);
    expect(compIssues.some(i => i.severity === ValidationSeverity.ERROR && i.affectedSlotId === 'stg1_propulsion')).toBe(true);
  });

  it('detects empty stage architecture as a fatal completeness error', () => {
    const config = JSON.parse(JSON.stringify(builderEngine.getConfiguration()));
    config.stages = [];

    const report = validationEngine.validate({
      projectId: 'proj_no_stages',
      configuration: config,
    });

    expect(report.isValid).toBe(false);
    expect(report.status).toBe(ValidationOverallStatus.FAILED);
    const issue = report.issues.find(i => i.id === 'iss_comp_no_stages');
    expect(issue).toBeDefined();
    expect(issue?.blocksReadiness).toBe(true);
  });

  it('flags invalid or corrupted component IDs', () => {
    const config = JSON.parse(JSON.stringify(builderEngine.getConfiguration()));
    config.stages[0].slots[0].installedComponentId = 'non_existent_corrupted_component_id';

    const report = validationEngine.validate({
      projectId: 'proj_corrupt_comp',
      configuration: config,
    });

    expect(report.isValid).toBe(false);
    expect(report.status).toBe(ValidationOverallStatus.FAILED);
    const issue = report.issues.find(i => i.category === ValidationCategory.COMPONENT_AVAILABILITY);
    expect(issue).toBeDefined();
    expect(issue?.title).toContain('Corrupted Component Reference');
  });

  it('flags unowned components in agency inventory', () => {
    const config = builderEngine.getConfiguration();
    const ownedMap = new Map<string, number>(); // Nothing owned

    const report = validationEngine.validate({
      projectId: 'proj_unowned_items',
      configuration: config,
      ownedComponentQuantities: ownedMap,
    });

    expect(report.isValid).toBe(false);
    expect(report.status).toBe(ValidationOverallStatus.FAILED);
    const unownedIssues = report.issues.filter(i => i.id.startsWith('iss_avail_unowned_'));
    expect(unownedIssues.length).toBeGreaterThan(0);
  });

  it('detects component conflicts between active projects', () => {
    const config = builderEngine.getConfiguration();
    const installedCompId = config.stages[0]?.slots[0]?.installedComponentId!;
    const reservations = new Map<string, string>();
    reservations.set(installedCompId, 'other_active_project_99');

    const report = validationEngine.validate({
      projectId: 'proj_current',
      configuration: config,
      activeProjectReservations: reservations,
    });

    expect(report.isValid).toBe(false);
    const conflictIssue = report.issues.find(i => i.id === `iss_avail_conflict_${installedCompId}`);
    expect(conflictIssue).toBeDefined();
    expect(conflictIssue?.title).toContain('Inventory Conflict');
  });

  it('detects slot category mismatch and compatibility tag violations', () => {
    const config = JSON.parse(JSON.stringify(builderEngine.getConfiguration()));
    // Put a fuel tank into propulsion slot
    config.stages[0].slots.find((s: any) => s.slotId === 'stg1_propulsion').installedComponentId = 'fuel_standard_cell_100';

    const report = validationEngine.validate({
      projectId: 'proj_cat_mismatch',
      configuration: config,
    });

    expect(report.isValid).toBe(false);
    const catIssue = report.issues.find(i => i.category === ValidationCategory.COMPONENT_COMPATIBILITY);
    expect(catIssue).toBeDefined();
    expect(catIssue?.title).toContain('Category Mismatch');
  });

  it('validates technology prerequisites and organization rank', () => {
    const config = builderEngine.getConfiguration();
    const allCompIds = registry.getAllComponents().map(c => c.id);
    const ownedMap = new Map<string, number>();
    allCompIds.forEach(id => ownedMap.set(id, 10));

    // Organization rank 0 and no unlocked tech
    const report = validationEngine.validate({
      projectId: 'proj_tech_locked',
      configuration: config,
      ownedComponentQuantities: ownedMap,
      unlockedTechIds: [],
      organisationRank: 0,
    });

    expect(report.isValid).toBe(false);
    const techIssues = report.issues.filter(i => i.category === ValidationCategory.TECHNOLOGY_VALIDATION);
    expect(techIssues.length).toBeGreaterThan(0);
  });

  it('evaluates economic validation against available credits without deducting funds', () => {
    const config = builderEngine.getConfiguration();
    const ownedMap = new Map<string, number>(); // Zero owned components

    // Available credits = 0 (insufficient)
    const report = validationEngine.validate({
      projectId: 'proj_econ_poor',
      configuration: config,
      availableCredits: 0,
      ownedComponentQuantities: ownedMap,
    });

    expect(report.isValid).toBe(false);
    const econIssue = report.issues.find(i => i.id === 'iss_econ_insufficient_credits');
    expect(econIssue).toBeDefined();
    expect(econIssue?.severity).toBe(ValidationSeverity.ERROR);
  });

  it('validates mission compatibility against mission requirements', () => {
    const config = builderEngine.getConfiguration();
    const allCompIds = registry.getAllComponents().map(c => c.id);
    const ownedMap = new Map<string, number>();
    allCompIds.forEach(id => ownedMap.set(id, 10));

    const mission = missionRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(mission).toBeDefined();

    const report = validationEngine.validate({
      projectId: 'proj_mission_test',
      configuration: config,
      mission: mission!,
      ownedComponentQuantities: ownedMap,
      unlockedTechIds: ['tech_basic_rocketry', 'tech_orbital_dynamics', 'tech_satellites'],
      organisationRank: 5,
    });

    expect(report.missionCompatibility).toBeDefined();
    expect(report.missionCompatibility?.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(report.missionCompatibility?.checkpoints.length).toBeGreaterThanOrEqual(4);
  });

  it('flags suborbital vehicle attempting orbital mission destination', () => {
    const config = JSON.parse(JSON.stringify(builderEngine.getConfiguration()));
    config.classRating = RocketClassRating.SUBORBITAL_TEST;

    const mission = missionRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01')!;

    const report = validationEngine.validate({
      projectId: 'proj_suborb_mismatch',
      configuration: config,
      mission,
    });

    const destIssue = report.issues.find(i => i.id === 'iss_miss_dest_class_mismatch');
    expect(destIssue).toBeDefined();
    expect(destIssue?.severity).toBe(ValidationSeverity.ERROR);
  });

  it('detects stale validation reports when configuration changes', () => {
    const config = builderEngine.getConfiguration();
    const report = validationEngine.validate({
      projectId: 'proj_stale_test',
      configuration: config,
    });

    expect(validationEngine.isReportStale(report, config)).toBe(false);

    // Modify config version
    const modifiedConfig = { ...config, version: 'v1.1.0' };
    expect(validationEngine.isReportStale(report, modifiedConfig)).toBe(true);

    // Manual invalidation
    validationEngine.invalidateReport('proj_stale_test');
    expect(validationEngine.getLatestReport('proj_stale_test')?.isStale).toBe(true);
  });

  it('synthesizes educational trade-off insights across all 6 topics', () => {
    const config = builderEngine.getConfiguration();
    const report = validationEngine.validate({
      projectId: 'proj_tradeoffs',
      configuration: config,
    });

    expect(report.educationalTradeOffs.length).toBe(6);
    const topics = report.educationalTradeOffs.map(t => t.topic);
    expect(topics).toContain(EducationalTradeOffTopic.MASS_AND_CAPABILITY);
    expect(topics).toContain(EducationalTradeOffTopic.PAYLOAD_AND_MISSION);
    expect(topics).toContain(EducationalTradeOffTopic.POWER_AND_SYSTEMS);
    expect(topics).toContain(EducationalTradeOffTopic.COMMUNICATION_AND_DATA);
    expect(topics).toContain(EducationalTradeOffTopic.COST_AND_PERFORMANCE);
    expect(topics).toContain(EducationalTradeOffTopic.RELIABILITY_AND_COMPLEXITY);

    for (const tradeOff of report.educationalTradeOffs) {
      expect(tradeOff.title.length).toBeGreaterThan(0);
      expect(tradeOff.observation.length).toBeGreaterThan(0);
      expect(tradeOff.tradeOffAnalysis.length).toBeGreaterThan(0);
      expect(tradeOff.recommendation.length).toBeGreaterThan(0);
    }
  });

  it('records validation history with a maximum depth of 20 runs', () => {
    const config = builderEngine.getConfiguration();
    const projectId = 'proj_history_test';

    for (let i = 0; i < 25; i++) {
      validationEngine.validate({
        projectId,
        configuration: { ...config, version: `v1.0.${i}` },
      });
    }

    const history = validationEngine.getValidationHistory(projectId);
    expect(history.length).toBe(20);
    expect(history[0]?.configurationVersion).toBe('v1.0.24');
  });

  it('dispatches validation events on EventBus', () => {
    let completedEmitted = false;
    let passedEmitted = false;
    let failedEmitted = false;

    eventBus.on('rocket:validation_completed' as any, () => { completedEmitted = true; });
    eventBus.on('rocket:validation_passed' as any, () => { passedEmitted = true; });
    eventBus.on('rocket:validation_failed' as any, () => { failedEmitted = true; });

    // 1. Run failing validation
    const brokenConfig = JSON.parse(JSON.stringify(builderEngine.getConfiguration()));
    brokenConfig.stages = [];
    validationEngine.validate({
      projectId: 'proj_events_fail',
      configuration: brokenConfig,
    });

    expect(completedEmitted).toBe(true);
    expect(failedEmitted).toBe(true);
    expect(passedEmitted).toBe(false);

    // 2. Run passing validation
    const allCompIds = registry.getAllComponents().map(c => c.id);
    const ownedMap = new Map<string, number>();
    allCompIds.forEach(id => ownedMap.set(id, 10));

    validationEngine.validate({
      projectId: 'proj_events_pass',
      configuration: builderEngine.getConfiguration(),
      ownedComponentQuantities: ownedMap,
      unlockedTechIds: ['tech_basic_rocketry', 'tech_orbital_dynamics', 'tech_vacuum_engines', 'tech_satellites'],
      organisationRank: 5,
    });

    expect(passedEmitted).toBe(true);
  });
});
