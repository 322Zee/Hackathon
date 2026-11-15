import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { MissionLifecycleManager } from '../../src/missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { MissionLifecycleState, MissionHistoryEventType, PreparationTaskStatus } from '../../src/missions/MissionLifecycleTypes';

describe('MissionLifecycleManager', () => {
  let lifecycleManager: MissionLifecycleManager;
  let eventBus: EventBus;

  beforeEach(() => {
    MissionLifecycleManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    eventBus = new EventBus();
    MissionCatalogueRegistry.getInstance(eventBus);
    lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
  });

  it('accepts available mission and instantiates a valid MissionInstance', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(result.success).toBe(true);
    expect(result.instance).toBeDefined();

    const instance = result.instance!;
    expect(instance.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(instance.status).toBe(MissionLifecycleState.ACCEPTED);
    expect(instance.acceptedTimestamp).toBeGreaterThan(0);
    expect(instance.objectives.length).toBeGreaterThan(0);
    expect(instance.preparation.tasks.length).toBeGreaterThan(0);
    expect(instance.history.length).toBe(1);
    expect(instance.history[0]?.type).toBe(MissionHistoryEventType.MISSION_ACCEPTED);

    expect(lifecycleManager.isMissionActive('EARTH_LEO_DEPLOYMENT_01')).toBe(true);
    expect(lifecycleManager.getActiveInstances().length).toBe(1);
  });

  it('prevents duplicate active mission instances', () => {
    const first = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(first.success).toBe(true);

    const duplicate = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(duplicate.success).toBe(false);
    expect(duplicate.reason).toContain('already active');
  });

  it('rejects invalid or arbitrary state transitions', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instId = result.instance!.instanceId;

    // ACCEPTED cannot jump directly to ACTIVE without preparation and validation
    const jumpToActive = lifecycleManager.transitionState(instId, MissionLifecycleState.ACTIVE);
    expect(jumpToActive.success).toBe(false);
    expect(jumpToActive.reason).toContain('Invalid lifecycle transition');

    // ACCEPTED cannot jump to COMPLETED
    const jumpToCompleted = lifecycleManager.transitionState(instId, MissionLifecycleState.COMPLETED);
    expect(jumpToCompleted.success).toBe(false);

    // Current status remains unchanged
    expect(lifecycleManager.getInstance(instId)?.status).toBe(MissionLifecycleState.ACCEPTED);
  });

  it('allows valid preparation workflow transitions: ACCEPTED -> PREPARING -> READY_FOR_VALIDATION', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instId = result.instance!.instanceId;

    const toPrep = lifecycleManager.transitionState(instId, MissionLifecycleState.PREPARING);
    expect(toPrep.success).toBe(true);
    expect(lifecycleManager.getInstance(instId)?.status).toBe(MissionLifecycleState.PREPARING);

    const toValidation = lifecycleManager.transitionState(instId, MissionLifecycleState.READY_FOR_VALIDATION);
    expect(toValidation.success).toBe(true);
    expect(lifecycleManager.getInstance(instId)?.status).toBe(MissionLifecycleState.READY_FOR_VALIDATION);
  });

  it('strictly rejects transition to READY when required engineering systems are unimplemented', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instId = result.instance!.instanceId;

    lifecycleManager.transitionState(instId, MissionLifecycleState.PREPARING);
    lifecycleManager.transitionState(instId, MissionLifecycleState.READY_FOR_VALIDATION);

    // Attempt to mark READY when tasks are unimplemented in the build
    const toReady = lifecycleManager.transitionState(instId, MissionLifecycleState.READY);
    expect(toReady.success).toBe(false);
    expect(toReady.reason).toContain('Readiness check rejected');
    expect(toReady.errors?.length).toBeGreaterThan(0);

    // Must still be in READY_FOR_VALIDATION (not corrupted to READY)
    expect(lifecycleManager.getInstance(instId)?.status).toBe(MissionLifecycleState.READY_FOR_VALIDATION);

    // History must record the validation failure
    const history = lifecycleManager.getInstance(instId)!.history;
    expect(history.some((h) => h.type === MissionHistoryEventType.VALIDATION_FAILED)).toBe(true);
  });

  it('supports full lifecycle when tasks are fulfilled: READY -> ACTIVE -> PAUSED -> ACTIVE -> COMPLETED', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = result.instance!;
    const instId = instance.instanceId;

    lifecycleManager.transitionState(instId, MissionLifecycleState.PREPARING);
    lifecycleManager.transitionState(instId, MissionLifecycleState.READY_FOR_VALIDATION);

    // Simulate all tasks configured with implemented subsystems
    for (const task of instance.preparation.tasks) {
      task.systemImplemented = true;
      task.status = PreparationTaskStatus.CONFIGURED;
    }

    // Now validation passes
    const toReady = lifecycleManager.transitionState(instId, MissionLifecycleState.READY);
    expect(toReady.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.READY);

    // Activate flight
    const toActive = lifecycleManager.transitionState(instId, MissionLifecycleState.ACTIVE);
    expect(toActive.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.ACTIVE);

    // Pause flight
    const toPaused = lifecycleManager.transitionState(instId, MissionLifecycleState.PAUSED);
    expect(toPaused.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.PAUSED);

    // Resume flight
    const toResumed = lifecycleManager.transitionState(instId, MissionLifecycleState.ACTIVE);
    expect(toResumed.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.ACTIVE);

    // Complete objectives
    for (const obj of instance.objectives) {
      const targetVal = typeof obj.targetValue === 'number' ? obj.targetValue : 1;
      lifecycleManager.updateObjectiveProgress(instId, obj.id, targetVal, true);
    }

    // Complete mission
    const toCompleted = lifecycleManager.transitionState(instId, MissionLifecycleState.COMPLETED);
    expect(toCompleted.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.COMPLETED);
    expect(instance.completionInfo?.rewardsGranted).toBe(true);

    // Terminal state: completed missions move to archive and cannot be reactivated
    expect(lifecycleManager.isMissionActive('EARTH_LEO_DEPLOYMENT_01')).toBe(false);
    expect(lifecycleManager.getArchivedInstances().some((i) => i.instanceId === instId)).toBe(true);

    const reactivate = lifecycleManager.transitionState(instId, MissionLifecycleState.ACTIVE);
    expect(reactivate.success).toBe(false);
  });

  it('handles mission failure and non-destructive retry preserving agency state', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instance = result.instance!;
    const instId = instance.instanceId;

    // Simulate readiness & activation
    for (const task of instance.preparation.tasks) {
      task.systemImplemented = true;
      task.status = PreparationTaskStatus.CONFIGURED;
    }
    lifecycleManager.transitionState(instId, MissionLifecycleState.PREPARING);
    lifecycleManager.transitionState(instId, MissionLifecycleState.READY_FOR_VALIDATION);
    lifecycleManager.transitionState(instId, MissionLifecycleState.READY);
    lifecycleManager.transitionState(instId, MissionLifecycleState.ACTIVE);

    // Mission failure
    const failRes = lifecycleManager.transitionState(
      instId,
      MissionLifecycleState.FAILED,
      'Loss of telemetry at T+120s due to booster staging separation anomaly.'
    );
    expect(failRes.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.FAILED);
    expect(instance.failureInfo?.reason).toContain('booster staging separation anomaly');
    expect(instance.failureInfo?.retryCount).toBe(1);

    // Retry mission
    const retryRes = lifecycleManager.retryMission(instId);
    expect(retryRes.success).toBe(true);
    expect(instance.status).toBe(MissionLifecycleState.PREPARING);
    expect(lifecycleManager.getActiveInstances().some((i) => i.instanceId === instId)).toBe(true);

    // History contains failure and restart
    const history = instance.history;
    expect(history.some((h) => h.type === MissionHistoryEventType.MISSION_FAILED)).toBe(true);
    expect(history.some((h) => h.type === MissionHistoryEventType.MISSION_RESTARTED)).toBe(true);
  });

  it('supports mission cancellation with confirmation and consequence recording', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instId = result.instance!.instanceId;

    let cancelEventFired = false;
    eventBus.on('mission:cancelled' as any, () => {
      cancelEventFired = true;
    });

    const cancelRes = lifecycleManager.cancelMission(instId, 'Director cancelled contract.');
    expect(cancelRes.success).toBe(true);
    expect(lifecycleManager.getInstance(instId)?.status).toBe(MissionLifecycleState.CANCELLED);
    expect(cancelEventFired).toBe(true);
    expect(lifecycleManager.isMissionActive('EARTH_LEO_DEPLOYMENT_01')).toBe(false);
  });

  it('serializes and deserializes mission state accurately', () => {
    const result = lifecycleManager.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    const instId = result.instance!.instanceId;

    lifecycleManager.transitionState(instId, MissionLifecycleState.PREPARING);

    const serialized = lifecycleManager.serialize();
    expect(serialized.instances[instId]).toBeDefined();
    expect(serialized.activeInstanceIds).toContain(instId);
    expect(serialized.instances[instId]?.status).toBe(MissionLifecycleState.PREPARING);

    // Reset and deserialize into fresh instance
    MissionLifecycleManager.resetInstance();
    const freshManager = MissionLifecycleManager.getInstance(eventBus);
    expect(freshManager.getAllInstances().length).toBe(0);

    freshManager.deserialize(serialized);
    expect(freshManager.getAllInstances().length).toBe(1);
    expect(freshManager.getInstance(instId)?.status).toBe(MissionLifecycleState.PREPARING);
    expect(freshManager.isMissionActive('EARTH_LEO_DEPLOYMENT_01')).toBe(true);
  });
});
