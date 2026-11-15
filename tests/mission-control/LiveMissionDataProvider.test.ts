import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LiveMissionDataProvider } from '../../src/mission-control/adapters/LiveMissionDataProvider';
import { MissionLifecycleManager } from '../../src/missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { MissionLifecycleState } from '../../src/missions/MissionLifecycleTypes';
import { EventBus } from '../../src/core/EventBus';

describe('LiveMissionDataProvider', () => {
  let provider: LiveMissionDataProvider;
  let lifecycleManager: MissionLifecycleManager;
  let eventBus: EventBus;

  beforeEach(() => {
    MissionLifecycleManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();

    MissionCatalogueRegistry.getInstance();
    DestinationRegistry.getInstance();
    lifecycleManager = MissionLifecycleManager.getInstance();
    eventBus = new EventBus();

    provider = new LiveMissionDataProvider(eventBus);
  });

  afterEach(() => {
    provider.dispose();
  });

  it('identifies as non-demo live provider', () => {
    expect(provider.isDemoProvider).toBe(false);
  });

  it('returns empty list when no active missions exist in game state', () => {
    const missions = provider.getActiveMissions();
    expect(missions).toHaveLength(0);
  });

  it('provides real mission overview and telemetry snapshot when mission is accepted', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(accepted.success).toBe(true);

    const activeMissions = provider.getActiveMissions();
    expect(activeMissions).toHaveLength(1);
    expect(activeMissions[0]!.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(activeMissions[0]!.name).toContain('Pioneer');
    expect(activeMissions[0]!.status).toBe(MissionLifecycleState.ACCEPTED);
    expect(activeMissions[0]!.isSampleData).toBe(false);

    const snapshot = provider.getMissionSnapshot(activeMissions[0]!.instanceId);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.overview.name).toContain('Pioneer');
    expect(snapshot!.progress.milestones.length).toBeGreaterThan(0);
    expect(snapshot!.isSampleData).toBe(false);
  });

  it('strictly marks unimplemented simulation and comms feeds as UNAVAILABLE rather than fabricating numbers', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const snapshot = provider.getMissionSnapshot(accepted.instance!.instanceId);
    expect(snapshot).not.toBeNull();

    const sc = snapshot!.spacecraft;

    // Simulation core feeds (not implemented on this laptop)
    expect(sc.vehicleConditionPercent.available).toBe(false);
    expect(sc.vehicleConditionPercent.value).toBeUndefined();
    expect(sc.vehicleConditionPercent.statusText).toContain('UNLINKED');

    expect(sc.batteryPercent.available).toBe(false);
    expect(sc.batteryPercent.statusText).toContain('BATTERY TELEMETRY UNLINKED');

    expect(sc.powerGenerationWatts.available).toBe(false);
    expect(sc.powerDrawWatts.available).toBe(false);

    // Communications network feeds
    expect(sc.signalStrengthPercent.available).toBe(false);
    expect(sc.signalStrengthPercent.statusText).toContain('GROUND STATION UNLINKED');
    expect(sc.uplinkRateKbps.available).toBe(false);
    expect(sc.downlinkRateKbps.available).toBe(false);

    // Scientific Data feeds
    expect(snapshot!.scientificData.totalDataCollectedMb.available).toBe(false);
  });

  it('accurately derives mission readiness and system warnings from actual preparation tasks', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const snapshot = provider.getMissionSnapshot(accepted.instance!.instanceId);
    expect(snapshot).not.toBeNull();

    // Initial readiness should be 0% since tasks are unconfigured
    expect(snapshot!.spacecraft.missionReadinessPercent.available).toBe(true);
    expect(snapshot!.spacecraft.missionReadinessPercent.value).toBe(0);
    expect(snapshot!.spacecraft.missionReadinessState).toBe('CONFIGURATION INCOMPLETE');

    // Configure a task and re-check snapshot
    const inst = lifecycleManager.getInstance(accepted.instance!.instanceId);
    if (inst && inst.preparation.tasks.length > 0) {
      (inst.preparation.tasks[0] as any).status = 'CONFIGURED';
    }

    const updatedSnapshot = provider.getMissionSnapshot(accepted.instance!.instanceId);
    expect(updatedSnapshot!.spacecraft.missionReadinessPercent.value).toBeGreaterThan(0);
  });

  it('maps objectives into completed, pending, and remaining categories', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const snapshot = provider.getMissionSnapshot(accepted.instance!.instanceId);
    expect(snapshot).not.toBeNull();

    expect(snapshot!.progress.completedObjectives).toHaveLength(0);
    expect(snapshot!.progress.remainingObjectives.length).toBeGreaterThan(0);
    expect(snapshot!.progress.journeyProgressPercent).toBe(0);
  });

  it('notifies subscribers when snapshots change via domain events', () => {
    const accepted = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instanceId = accepted.instance!.instanceId;

    let notificationCount = 0;
    const unsub = provider.subscribeToSnapshot(instanceId, (_snap) => {
      notificationCount++;
    });

    // Initial dispatch triggers 1
    expect(notificationCount).toBe(1);

    // Emit mission state changed event
    eventBus.emit('mission:state_changed' as any, { instanceId });
    expect(notificationCount).toBe(2);

    unsub();
    eventBus.emit('mission:state_changed' as any, { instanceId });
    expect(notificationCount).toBe(2);
  });
});
