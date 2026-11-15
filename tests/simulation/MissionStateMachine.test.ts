import { describe, it, expect, beforeEach } from 'vitest';
import { MissionStateMachine } from '../../src/simulation/MissionStateMachine';
import {
  SimulationMissionState,
  SimulationMissionPhase,
  SimulationObjective,
} from '../../src/simulation/MissionSimulationTypes';

describe('MissionStateMachine', () => {
  let stateMachine: MissionStateMachine;

  beforeEach(() => {
    stateMachine = new MissionStateMachine();
  });

  it('starts in INACTIVE state and initializes to PREPARING', () => {
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.INACTIVE);
    expect(stateMachine.hasBeenInitialized()).toBe(false);

    const initRes = stateMachine.initialize();
    expect(initRes.success).toBe(true);
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.PREPARING);
    expect(stateMachine.getCurrentPhase()).toBe(SimulationMissionPhase.PRE_LAUNCH);
    expect(stateMachine.hasBeenInitialized()).toBe(true);
  });

  it('prevents accidental duplicate initialization', () => {
    stateMachine.initialize();
    const secondInit = stateMachine.initialize();
    expect(secondInit.success).toBe(false);
    expect(secondInit.error).toContain('already initialized');
  });

  it('follows valid lifecycle progression path', () => {
    stateMachine.initialize(); // -> PREPARING

    expect(stateMachine.transitionTo(SimulationMissionState.READY).success).toBe(true);
    expect(stateMachine.transitionTo(SimulationMissionState.LAUNCHING).success).toBe(true);
    expect(stateMachine.transitionTo(SimulationMissionState.IN_TRANSIT).success).toBe(true);
    expect(stateMachine.transitionTo(SimulationMissionState.ARRIVING).success).toBe(true);
    expect(stateMachine.transitionTo(SimulationMissionState.ACTIVE).success).toBe(true);
    expect(stateMachine.transitionTo(SimulationMissionState.RETURNING).success).toBe(true);
    expect(stateMachine.transitionTo(SimulationMissionState.COMPLETED).success).toBe(true);

    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.COMPLETED);
    expect(stateMachine.isTerminal()).toBe(true);
  });

  it('rejects invalid state transitions', () => {
    stateMachine.initialize(); // -> PREPARING

    // Cannot jump straight from PREPARING to IN_TRANSIT or COMPLETED
    const invalidJump = stateMachine.transitionTo(SimulationMissionState.IN_TRANSIT);
    expect(invalidJump.success).toBe(false);
    expect(invalidJump.error).toContain('Invalid state transition');
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.PREPARING);

    const invalidComplete = stateMachine.transitionTo(SimulationMissionState.COMPLETED);
    expect(invalidComplete.success).toBe(false);
  });

  it('enforces that COMPLETED is an immutable terminal state', () => {
    stateMachine.initialize();
    stateMachine.transitionTo(SimulationMissionState.READY);
    stateMachine.transitionTo(SimulationMissionState.LAUNCHING);
    stateMachine.transitionTo(SimulationMissionState.IN_TRANSIT);
    stateMachine.transitionTo(SimulationMissionState.ARRIVING);
    stateMachine.transitionTo(SimulationMissionState.ACTIVE);
    stateMachine.transitionTo(SimulationMissionState.COMPLETED);

    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.COMPLETED);

    // Attempting to move out of COMPLETED must be rejected
    const tryReset = stateMachine.transitionTo(SimulationMissionState.PREPARING);
    expect(tryReset.success).toBe(false);
    expect(tryReset.error).toContain('terminal state COMPLETED');

    const tryPause = stateMachine.pause();
    expect(tryPause.success).toBe(false);
  });

  it('prevents mission completion when mandatory objectives are unfulfilled', () => {
    stateMachine.initialize();
    stateMachine.transitionTo(SimulationMissionState.READY);
    stateMachine.transitionTo(SimulationMissionState.LAUNCHING);
    stateMachine.transitionTo(SimulationMissionState.IN_TRANSIT);
    stateMachine.transitionTo(SimulationMissionState.ARRIVING);
    stateMachine.transitionTo(SimulationMissionState.ACTIVE);

    const objectives: SimulationObjective[] = [
      {
        id: 'obj_1',
        title: 'Insert into Lunar Orbit',
        isMandatory: true,
        isCompleted: false,
        currentProgress: 0,
        targetValue: 1,
      },
      {
        id: 'obj_2',
        title: 'Perform Secondary Science',
        isMandatory: false,
        isCompleted: false,
        currentProgress: 0,
        targetValue: 1,
      },
    ];

    // Attempt to complete with unmet mandatory objective
    const completeFail = stateMachine.transitionTo(SimulationMissionState.COMPLETED, objectives);
    expect(completeFail.success).toBe(false);
    expect(completeFail.error).toContain('"Insert into Lunar Orbit"');
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.ACTIVE);

    // Satisfy mandatory objective
    objectives[0].isCompleted = true;

    // Transition should now succeed
    const completeSuccess = stateMachine.transitionTo(SimulationMissionState.COMPLETED, objectives);
    expect(completeSuccess.success).toBe(true);
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.COMPLETED);
  });

  it('retains previous resumable state when PAUSED and restores it on resume', () => {
    stateMachine.initialize();
    stateMachine.transitionTo(SimulationMissionState.READY);
    stateMachine.transitionTo(SimulationMissionState.LAUNCHING);
    stateMachine.transitionTo(SimulationMissionState.IN_TRANSIT);

    // Pause while in transit
    const pauseRes = stateMachine.pause();
    expect(pauseRes.success).toBe(true);
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.PAUSED);
    expect(stateMachine.getPreviousResumableState()).toBe(SimulationMissionState.IN_TRANSIT);

    // Resume should return to IN_TRANSIT
    const resumeRes = stateMachine.resume();
    expect(resumeRes.success).toBe(true);
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.IN_TRANSIT);
    expect(stateMachine.getPreviousResumableState()).toBeNull();
  });

  it('rejects resuming to a mismatched state while paused', () => {
    stateMachine.initialize();
    stateMachine.transitionTo(SimulationMissionState.READY);
    stateMachine.transitionTo(SimulationMissionState.LAUNCHING);
    stateMachine.pause();

    // Trying to transition from PAUSED to COMPLETED or ACTIVE directly
    const badResume = stateMachine.transitionTo(SimulationMissionState.ACTIVE);
    expect(badResume.success).toBe(false);
    expect(badResume.error).toContain('paused mission must resume to previous state');
  });

  it('allows mission to enter FAILED state from active states', () => {
    stateMachine.initialize();
    stateMachine.transitionTo(SimulationMissionState.READY);
    stateMachine.transitionTo(SimulationMissionState.LAUNCHING);

    const failRes = stateMachine.transitionTo(SimulationMissionState.FAILED);
    expect(failRes.success).toBe(true);
    expect(stateMachine.getCurrentState()).toBe(SimulationMissionState.FAILED);
    expect(stateMachine.isTerminal()).toBe(true);
  });
});
