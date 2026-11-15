import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  RocketBuilderEngine,
  ConfigurationSlotType,
  RocketProjectManager,
} from '../../../src/engineering';
import { MissionCatalogueRegistry } from '../../../src/missions/MissionCatalogueRegistry';

describe('RocketBuilderEngine', () => {
  let eventBus: EventBus;
  let engine: RocketBuilderEngine;
  let projectManager: RocketProjectManager;
  let missionRegistry: MissionCatalogueRegistry;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketBuilderEngine.resetInstance();
    RocketProjectManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();

    engine = RocketBuilderEngine.getInstance(eventBus);
    projectManager = RocketProjectManager.getInstance(eventBus);
    missionRegistry = MissionCatalogueRegistry.getInstance(eventBus);
  });

  it('initializes with default modular 2-stage configuration', () => {
    const config = engine.getConfiguration();
    expect(config).toBeDefined();
    expect(config.stages.length).toBe(2);
    expect(config.stages[0]?.name).toContain('Booster Core');
    expect(config.stages[1]?.name).toContain('Vacuum Inserter');
    expect(config.version).toBe('v1.0.0');
    expect(engine.hasUnsavedChanges()).toBe(false);
  });

  it('finds slots by slot ID across stages', () => {
    const bStructure = engine.findSlot('stg1_structure');
    expect(bStructure).toBeDefined();
    expect(bStructure?.slotType).toBe(ConfigurationSlotType.STRUCTURE);
    expect(bStructure?.stageNumber).toBe(1);

    const uProp = engine.findSlot('stg2_propulsion');
    expect(uProp).toBeDefined();
    expect(uProp?.slotType).toBe(ConfigurationSlotType.PROPULSION);
    expect(uProp?.stageNumber).toBe(2);

    const nonExistent = engine.findSlot('invalid_slot_id');
    expect(nonExistent).toBeUndefined();
  });

  it('validates component compatibility against slot categories and tags', () => {
    // Valid booster engine into booster propulsion slot
    const validBooster = engine.canInstallComponent('stg1_propulsion', 'prop_basic_booster_mk1');
    expect(validBooster.allowed).toBe(true);

    // Invalid category: trying to install fuel tank into propulsion slot
    const wrongCategory = engine.canInstallComponent('stg1_propulsion', 'fuel_standard_cell_100');
    expect(wrongCategory.allowed).toBe(false);
    expect(wrongCategory.reason).toContain('Incompatible category');

    // Invalid tag: trying to install vacuum engine into lower booster stage
    const wrongTag = engine.canInstallComponent('stg1_propulsion', 'prop_upper_vacuum_nozzle');
    expect(wrongTag.allowed).toBe(false);
    expect(wrongTag.reason).toContain('mismatch');
  });

  it('installs and removes components into slots and tracks unsaved changes', () => {
    const slotId = 'stg1_propulsion';
    const compId = 'prop_basic_booster_mk1';

    // Remove existing
    const removeRes = engine.removeComponent(slotId);
    expect(removeRes.success).toBe(true);
    expect(engine.findSlot(slotId)?.installedComponentId).toBeUndefined();
    expect(engine.hasUnsavedChanges()).toBe(true);

    // Install component
    const installRes = engine.installComponent(slotId, compId);
    expect(installRes.success).toBe(true);
    expect(engine.findSlot(slotId)?.installedComponentId).toBe(compId);
  });

  it('manages dynamic multi-stage additions and removals', () => {
    // Initial 2 stages
    expect(engine.getConfiguration().stages.length).toBe(2);

    // Add stage 3
    const addRes = engine.addStageGroup();
    expect(addRes.success).toBe(true);
    expect(addRes.stageNumber).toBe(3);
    expect(engine.getConfiguration().stages.length).toBe(3);

    // Trying to add stage 4 should fail (max 3 stages)
    const addOverflow = engine.addStageGroup();
    expect(addOverflow.success).toBe(false);

    // Remove stage 3
    const removeRes = engine.removeStageGroup(3);
    expect(removeRes.success).toBe(true);
    expect(engine.getConfiguration().stages.length).toBe(2);

    // Remove stage 2
    const removeStage2 = engine.removeStageGroup(2);
    expect(removeStage2.success).toBe(true);
    expect(engine.getConfiguration().stages.length).toBe(1);

    // Removing remaining Stage 1 core booster must be prohibited
    const removeStage1 = engine.removeStageGroup(1);
    expect(removeStage1.success).toBe(false);
    expect(removeStage1.reason).toContain('Cannot remove');
  });

  it('calculates comprehensive real-time design statistics', () => {
    const stats = engine.calculateStats();
    expect(stats.totalMassUnits).toBeGreaterThan(0);
    expect(stats.performanceRating).toBeGreaterThan(0);
    expect(stats.reliabilityRating).toBeGreaterThan(0);
    expect(stats.completenessPercent).toBeGreaterThan(0);
    expect(stats.requiredSlotCount).toBeGreaterThan(0);
    expect(stats.filledRequiredSlotCount).toBeGreaterThan(0);
  });

  it('evaluates mission requirements accurately against mission parameters', () => {
    const missions = missionRegistry.getAllMissions();
    expect(missions.length).toBeGreaterThan(0);

    const targetMission = missions[0]!;
    const statuses = engine.evaluateMissionRequirements(targetMission);
    expect(statuses.length).toBeGreaterThanOrEqual(4);

    const destStatus = statuses.find(s => s.id === 'req_destination');
    expect(destStatus).toBeDefined();

    const relStatus = statuses.find(s => s.id === 'req_reliability');
    expect(relStatus).toBeDefined();

    const massStatus = statuses.find(s => s.id === 'req_payload_mass');
    expect(massStatus).toBeDefined();
  });

  it('synchronizes configuration to project and bumps version on demand', () => {
    const activeProj = projectManager.getActiveProject();
    expect(activeProj).toBeDefined();

    if (activeProj) {
      engine.loadProject(activeProj);

      // Make a change
      engine.removeComponent('stg2_guidance');
      expect(engine.hasUnsavedChanges()).toBe(true);

      // Save without version bump
      const saveOk = engine.saveToProject(activeProj.projectId, false);
      expect(saveOk).toBe(true);
      expect(engine.hasUnsavedChanges()).toBe(false);
      expect(engine.getConfiguration().version).toBe('v1.0.0');

      // Save as new version
      engine.removeComponent('stg2_power');
      const newVerOk = engine.saveToProject(activeProj.projectId, true);
      expect(newVerOk).toBe(true);
      expect(engine.getConfiguration().version).toBe('v1.1.0');
    }
  });

  it('supports duplicating and discarding configurations', () => {
    const initialConfig = engine.getConfiguration();
    const cloned = engine.duplicateConfiguration();
    expect(cloned.name).toContain('Copy');
    expect(cloned.stages.length).toBe(initialConfig.stages.length);

    // Make an edit and discard
    engine.removeComponent('stg1_structure');
    expect(engine.hasUnsavedChanges()).toBe(true);

    engine.discardChanges();
    expect(engine.hasUnsavedChanges()).toBe(false);
    expect(engine.findSlot('stg1_structure')?.installedComponentId).toBeDefined();
  });
});
