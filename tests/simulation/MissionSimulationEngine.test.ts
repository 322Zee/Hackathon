import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissionSimulationEngine } from '../../src/simulation/MissionSimulationEngine';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  SimulationMissionState,
  SimulationMissionPhase,
  MissionSimulationConfig,
} from '../../src/simulation/MissionSimulationTypes';

describe('MissionSimulationEngine', () => {
  let engine: MissionSimulationEngine;

  const sampleConfig: MissionSimulationConfig = {
    missionId: 'MSN_LUNAR_ORBITER_01',
    instanceId: 'inst_sim_001',
    missionName: 'Lunar Reconnaissance Alpha',
    missionType: 'SCIENTIFIC_EXPLORATION',
    originId: DestinationId.EARTH,
    destinationId: DestinationId.MOON,
    estimatedDurationSeconds: 100, // 100 game seconds for testing
    totalDistanceUnits: 384400,
    initialTimeScale: 1.0,
    fixedTimeStep: 0.05,
    objectives: [
      {
        id: 'obj_reach_orbit',
        title: 'Reach Lunar Orbit',
        isMandatory: true,
        isCompleted: false,
        currentProgress: 0,
        targetValue: 1,
      },
      {
        id: 'obj_collect_telemetry',
        title: 'Collect Baseline Telemetry',
        isMandatory: false,
        isCompleted: false,
        currentProgress: 0,
        targetValue: 100,
      },
    ],
  };

  beforeEach(() => {
    engine = new MissionSimulationEngine();
  });

  it('initializes mission and generates initial snapshot', () => {
    const initSpy = vi.fn();
    engine.subscribeToMissionEvents('MissionInitialized', initSpy);

    const snapshot = engine.initializeMission(sampleConfig);

    expect(snapshot.missionId).toBe(sampleConfig.missionId);
    expect(snapshot.currentState).toBe(SimulationMissionState.PREPARING);
    expect(snapshot.currentPhase).toBe(SimulationMissionPhase.PRE_LAUNCH);
    expect(snapshot.originId).toBe(DestinationId.EARTH);
    expect(snapshot.destinationId).toBe(DestinationId.MOON);
    expect(snapshot.objectives).toHaveLength(2);
    expect(snapshot.elapsedGameTime).toBe(0);

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: sampleConfig.missionId,
        instanceId: sampleConfig.instanceId,
      })
    );
  });

  it('prevents accidental duplicate mission initialization', () => {
    engine.initializeMission(sampleConfig);

    expect(() => {
      engine.initializeMission(sampleConfig);
    }).toThrow('Cannot initialize mission');
  });

  it('starts mission and transitions to LAUNCHING state and LAUNCH_ASCENT phase', () => {
    const startSpy = vi.fn();
    engine.subscribeToMissionEvents('MissionStarted', startSpy);

    engine.initializeMission(sampleConfig);
    const success = engine.startMission();

    expect(success).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.LAUNCHING);
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.LAUNCH_ASCENT);

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: sampleConfig.missionId,
        state: SimulationMissionState.LAUNCHING,
        phase: SimulationMissionPhase.LAUNCH_ASCENT,
      })
    );
  });

  it('pauses and resumes mission, broadcasting typed events', () => {
    const pauseSpy = vi.fn();
    const resumeSpy = vi.fn();
    engine.subscribeToMissionEvents('MissionPaused', pauseSpy);
    engine.subscribeToMissionEvents('MissionResumed', resumeSpy);

    engine.initializeMission(sampleConfig);
    engine.startMission();

    // Pause
    const paused = engine.pauseMission('Holding countdown');
    expect(paused).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.PAUSED);
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(pauseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: sampleConfig.missionId,
        previousState: SimulationMissionState.LAUNCHING,
        reason: 'Holding countdown',
      })
    );

    // Simulation advances do not progress while paused
    engine.advanceSimulation(5.0);
    expect(engine.getGameTimeState().elapsedGameTimeSeconds).toBe(0);

    // Resume
    const resumed = engine.resumeMission();
    expect(resumed).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.LAUNCHING);
    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(resumeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: sampleConfig.missionId,
        resumedState: SimulationMissionState.LAUNCHING,
      })
    );
  });

  it('advances simulation, progressing flight phases and space travel', () => {
    const progressSpy = vi.fn();
    const phaseSpy = vi.fn();
    const arrivedSpy = vi.fn();

    engine.subscribeToMissionEvents('MissionProgressUpdated', progressSpy);
    engine.subscribeToMissionEvents('MissionPhaseChanged', phaseSpy);
    engine.subscribeToMissionEvents('MissionArrived', arrivedSpy);

    engine.initializeMission(sampleConfig);
    engine.startMission();

    // 1. Advance past initial ascent (10s) -> ORBITAL_INSERTION
    // Use high time scale for rapid progression in tests
    engine.setSimulationSpeed(10.0);
    engine.advanceSimulation(1.5); // 1.5 * 10 = 15 game seconds
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.ORBITAL_INSERTION);

    // 2. Advance past orbit insertion (additional 10s = 25s total) -> IN_TRANSIT & TRANSIT_CRUISE
    engine.advanceSimulation(1.0); // 10 game seconds -> total 25 game seconds
    expect(engine.getMissionState()).toBe(SimulationMissionState.IN_TRANSIT);
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.TRANSIT_CRUISE);

    // 3. Advance to destination arrival (transit duration is 100s)
    // Advance 10.5s real * 10x = 105s game seconds of in-transit travel
    engine.advanceSimulation(10.5);

    // Spacecraft should arrive at Moon and enter ACTIVE operations
    expect(arrivedSpy).toHaveBeenCalledTimes(1);
    expect(arrivedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: sampleConfig.missionId,
        destinationId: DestinationId.MOON,
      })
    );

    expect(engine.getMissionState()).toBe(SimulationMissionState.ACTIVE);
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.PRIMARY_OPERATIONS);
    expect(progressSpy).toHaveBeenCalled();
  });

  it('validates mandatory objectives before allowing mission completion', () => {
    const completeSpy = vi.fn();
    engine.subscribeToMissionEvents('MissionCompleted', completeSpy);

    engine.initializeMission(sampleConfig);
    engine.startMission();
    engine.setSimulationSpeed(50.0);
    engine.advanceSimulation(3.0); // Reach destination & active state

    expect(engine.getMissionState()).toBe(SimulationMissionState.ACTIVE);

    // Attempt completion with unfulfilled mandatory objective
    const tryCompleteIncomplete = engine.completeMission();
    expect(tryCompleteIncomplete).toBe(false);
    expect(engine.getMissionState()).toBe(SimulationMissionState.ACTIVE);
    expect(completeSpy).not.toHaveBeenCalled();

    // Satisfy mandatory objective
    const objCompleted = engine.completeObjective('obj_reach_orbit');
    expect(objCompleted).toBe(true);

    // Complete mission
    const tryCompleteSuccess = engine.completeMission();
    expect(tryCompleteSuccess).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.COMPLETED);
    expect(completeSpy).toHaveBeenCalledTimes(1);

    // Mission should no longer advance once completed
    const beforeElapsed = engine.getGameTimeState().elapsedGameTimeSeconds;
    engine.advanceSimulation(5.0);
    expect(engine.getGameTimeState().elapsedGameTimeSeconds).toBe(beforeElapsed);
  });

  it('handles mission failure state correctly', () => {
    const failSpy = vi.fn();
    engine.subscribeToMissionEvents('MissionFailed', failSpy);

    engine.initializeMission(sampleConfig);
    engine.startMission();

    const failed = engine.failMission('Communication blackout occurred');
    expect(failed).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.FAILED);
    expect(failSpy).toHaveBeenCalledTimes(1);
    expect(failSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: sampleConfig.missionId,
        reason: 'Communication blackout occurred',
      })
    );
  });

  it('updates objective progress and auto-completes when target reached', () => {
    const objSpy = vi.fn();
    engine.subscribeToMissionEvents('ObjectiveUpdated', objSpy);

    engine.initializeMission(sampleConfig);

    // Partial progress
    engine.updateObjectiveProgress('obj_collect_telemetry', 50);
    let objectives = engine.getObjectives();
    let telemetryObj = objectives.find((o) => o.id === 'obj_collect_telemetry');
    expect(telemetryObj?.currentProgress).toBe(50);
    expect(telemetryObj?.isCompleted).toBe(false);

    // Reach target
    engine.updateObjectiveProgress('obj_collect_telemetry', 100);
    objectives = engine.getObjectives();
    telemetryObj = objectives.find((o) => o.id === 'obj_collect_telemetry');
    expect(telemetryObj?.currentProgress).toBe(100);
    expect(telemetryObj?.isCompleted).toBe(true);
  });

  it('serializes snapshot and safely restores identical simulation state', () => {
    engine.initializeMission(sampleConfig);
    engine.startMission();
    engine.setSimulationSpeed(2.0);
    engine.advanceSimulation(5.0); // 10 game seconds
    engine.updateObjectiveProgress('obj_collect_telemetry', 40);

    const snapshot = engine.getMissionSnapshot();

    // Verify snapshot fields
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.missionId).toBe(sampleConfig.missionId);
    expect(snapshot.elapsedGameTime).toBeCloseTo(10, 1);
    expect(snapshot.simulationSettings.timeScale).toBe(2.0);

    // Create fresh engine instance and restore
    const restoredEngine = new MissionSimulationEngine();
    const restoreSuccess = restoredEngine.restoreFromSnapshot(snapshot);

    expect(restoreSuccess).toBe(true);
    expect(restoredEngine.getMissionState()).toBe(engine.getMissionState());
    expect(restoredEngine.getMissionPhase()).toBe(engine.getMissionPhase());
    expect(restoredEngine.getGameTimeState().elapsedGameTimeSeconds).toBeCloseTo(10, 1);
    expect(restoredEngine.getSimulationSpeed()).toBe(2.0);

    const restoredObjectives = restoredEngine.getObjectives();
    const restoredTelemetry = restoredObjectives.find((o) => o.id === 'obj_collect_telemetry');
    expect(restoredTelemetry?.currentProgress).toBe(40);
  });

  it('rejects restoring corrupted or incompatible snapshot schema', () => {
    const corruptSnapshot: any = {
      schemaVersion: 999, // Incompatible version
      missionId: 'MSN_TEST',
    };

    const restoredEngine = new MissionSimulationEngine();
    const success = restoredEngine.restoreFromSnapshot(corruptSnapshot);
    expect(success).toBe(false);
  });

  it('unsubscribes from events cleanly', () => {
    const spy = vi.fn();
    const unsub = engine.subscribeToMissionEvents('MissionStarted', spy);

    engine.initializeMission(sampleConfig);
    unsub();
    engine.startMission();

    expect(spy).not.toHaveBeenCalled();
  });
});
