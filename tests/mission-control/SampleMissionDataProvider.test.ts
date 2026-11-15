import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SampleMissionDataProvider } from '../../src/mission-control/adapters/SampleMissionDataProvider';
import { MissionLifecycleManager } from '../../src/missions/MissionLifecycleManager';

describe('SampleMissionDataProvider', () => {
  let provider: SampleMissionDataProvider;

  beforeEach(() => {
    MissionLifecycleManager.resetInstance();
    provider = new SampleMissionDataProvider();
  });

  afterEach(() => {
    provider.dispose();
  });

  it('identifies as demo provider with watermarked sample data', () => {
    expect(provider.isDemoProvider).toBe(true);

    const missions = provider.getActiveMissions();
    expect(missions.length).toBeGreaterThanOrEqual(2);
    expect(missions[0]!.isSampleData).toBe(true);
    expect(missions[0]!.name).toContain('ARES-I');
    expect(missions[1]!.name).toContain('EUROPA');
  });

  it('supplies fully populated realistic telemetry for deep space demonstration', () => {
    const snapshot = provider.getMissionSnapshot('SAMPLE_ARES_01');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.isSampleData).toBe(true);

    const sc = snapshot!.spacecraft;
    expect(sc.vehicleConditionPercent.available).toBe(true);
    expect(sc.vehicleConditionPercent.value).toBe(99.4);

    expect(sc.batteryPercent.available).toBe(true);
    expect(sc.batteryPercent.value).toBeGreaterThan(80);

    expect(sc.signalStrengthPercent.available).toBe(true);
    expect(sc.signalStrengthPercent.value).toBe(78);
    expect(sc.activeGroundStation.value).toContain('GOLDSTONE');

    expect(sc.velocityKmPerSec.available).toBe(true);
    expect(sc.velocityKmPerSec.value).toBeGreaterThan(25);

    expect(snapshot!.scientificData.totalDataCollectedMb.available).toBe(true);
    expect(snapshot!.recentEvents.length).toBeGreaterThan(0);
    expect(snapshot!.alerts.length).toBeGreaterThan(0);
  });

  it('does NOT modify or persist anything into central MissionLifecycleManager state', () => {
    const lifecycleManager = MissionLifecycleManager.getInstance();
    expect(lifecycleManager.getAllInstances()).toHaveLength(0);

    // Call snapshot and updates
    provider.getMissionSnapshot('SAMPLE_ARES_01');
    provider.update(60);

    // Ensure central game state remains completely untouched
    expect(lifecycleManager.getAllInstances()).toHaveLength(0);
  });

  it('advances simulation MET and delivers live telemetry oscillations on tick update', () => {
    const snap1 = provider.getMissionSnapshot('SAMPLE_ARES_01');
    const initialMet = snap1!.overview.metSeconds;

    provider.update(10);

    const snap2 = provider.getMissionSnapshot('SAMPLE_ARES_01');
    expect(snap2!.overview.metSeconds).toBe(initialMet + 10);
  });

  it('supports alert acknowledgement and dismissal without affecting persistent state', () => {
    const snap = provider.getMissionSnapshot('SAMPLE_ARES_01');
    expect(snap!.alerts.length).toBeGreaterThan(0);

    const firstAlertId = snap!.alerts[0]!.id;
    provider.dismissAlert('SAMPLE_ARES_01', firstAlertId);

    const updatedSnap = provider.getMissionSnapshot('SAMPLE_ARES_01');
    expect(updatedSnap!.alerts.some((a) => a.id === firstAlertId)).toBe(false);
  });
});
