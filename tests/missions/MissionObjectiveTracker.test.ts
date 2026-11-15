import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { MissionObjectiveTracker } from '../../src/missions/MissionObjectiveTracker';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { ObjectiveCategory } from '../../src/missions/MissionLifecycleTypes';
import { ObjectiveType } from '../../src/missions/MissionTypes';

describe('MissionObjectiveTracker', () => {
  let tracker: MissionObjectiveTracker;
  let eventBus: EventBus;
  let catalogueRegistry: MissionCatalogueRegistry;

  beforeEach(() => {
    MissionObjectiveTracker.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    eventBus = new EventBus();
    catalogueRegistry = MissionCatalogueRegistry.getInstance(eventBus);
    tracker = MissionObjectiveTracker.getInstance(eventBus);
  });

  it('initializes objectives from mission definition distinguishing mandatory and optional', () => {
    const pioneer = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(pioneer).toBeDefined();

    const tracked = tracker.initializeObjectives('inst_test_01', pioneer!);
    expect(tracked.length).toBe(
      pioneer!.mainObjectives.length + (pioneer!.optionalObjectives?.length || 0)
    );

    const mandatory = tracked.filter((o) => o.isMandatory);
    const optional = tracked.filter((o) => !o.isMandatory);

    expect(mandatory.length).toBe(pioneer!.mainObjectives.length);
    expect(optional.length).toBe(pioneer!.optionalObjectives?.length || 0);

    for (const obj of tracked) {
      expect(obj.missionInstanceId).toBe('inst_test_01');
      expect(obj.isCompleted).toBe(false);
      expect(obj.currentProgress).toBe(0);
    }
  });

  it('maps ObjectiveType accurately to canonical ObjectiveCategory', () => {
    expect(tracker.mapTypeToCategory(ObjectiveType.DELIVERY)).toBe(
      ObjectiveCategory.DELIVER_PAYLOAD
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.ORBITAL_INSERTION)).toBe(
      ObjectiveCategory.REACH_DESTINATION
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.SURFACE_LANDING)).toBe(
      ObjectiveCategory.REACH_DESTINATION
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.SCIENTIFIC_SURVEY)).toBe(
      ObjectiveCategory.MAP_AREA
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.DATA_COLLECTION)).toBe(
      ObjectiveCategory.COLLECT_SCIENTIFIC_DATA
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.SAMPLE_ACQUISITION)).toBe(
      ObjectiveCategory.ANALYSE_SAMPLE
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.ROVER_TRAVERSAL)).toBe(
      ObjectiveCategory.DEPLOY_ROVER
    );
    expect(tracker.mapTypeToCategory(ObjectiveType.STATION_DEPLOYMENT)).toBe(
      ObjectiveCategory.CONSTRUCT_FACILITY
    );
  });

  it('updates objective progress and marks completed when target value is met', () => {
    const pioneer = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    const tracked = tracker.initializeObjectives('inst_test_02', pioneer!);
    const firstObj = tracked[0];
    expect(firstObj).toBeDefined();

    let updatedEventFired = false;
    let completedEventFired = false;

    eventBus.on('mission:objective:updated' as any, () => {
      updatedEventFired = true;
    });
    eventBus.on('mission:objective:completed' as any, () => {
      completedEventFired = true;
    });

    expect(firstObj).toBeDefined();
    if (!firstObj) return;

    const targetVal = typeof firstObj.targetValue === 'number' ? firstObj.targetValue : 1;
    const result = tracker.updateProgress(tracked, firstObj.id, targetVal, true);
    expect(result.objective?.isCompleted).toBe(true);
    expect(result.justCompleted).toBe(true);
    expect(result.objective?.completedTimestamp).toBeDefined();
    expect(updatedEventFired).toBe(true);
    expect(completedEventFired).toBe(true);
  });

  it('computes progress summary ratio without fabricating synthetic percentages', () => {
    const pioneer = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    const tracked = tracker.initializeObjectives('inst_test_03', pioneer!);

    const initialSummary = tracker.getProgressSummary(tracked);
    expect(initialSummary.totalMandatory).toBe(pioneer!.mainObjectives.length);
    expect(initialSummary.completedMandatory).toBe(0);
    expect(initialSummary.allMandatoryDone).toBe(false);
    expect(initialSummary.ratioString).toBe(`0/${pioneer!.mainObjectives.length} Mandatory Objectives`);

    // Complete first mandatory objective
    const firstTracked = tracked[0];
    expect(firstTracked).toBeDefined();
    if (!firstTracked) return;

    const firstTargetVal = typeof firstTracked.targetValue === 'number' ? firstTracked.targetValue : 1;
    tracker.updateProgress(tracked, firstTracked.id, firstTargetVal, true);
    const updatedSummary = tracker.getProgressSummary(tracked);
    expect(updatedSummary.completedMandatory).toBe(1);
    expect(updatedSummary.ratioString).toBe(`1/${pioneer!.mainObjectives.length} Mandatory Objectives`);
  });
});
