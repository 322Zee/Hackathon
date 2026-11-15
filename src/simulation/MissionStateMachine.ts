/**
 * INTERSTELLAR CONTINUUM - Mission State Machine & Transition Validator
 * Authoritative lifecycle state machine enforcing valid transitions, resumable pause states,
 * mandatory objective completion barriers, and explicit validation error reporting.
 */

import { Logger } from '../core/logging/Logger';
import {
  SimulationMissionState,
  SimulationMissionPhase,
  SimulationObjective,
  StateTransitionResult,
} from './MissionSimulationTypes';

export class MissionStateMachine {
  private currentState: SimulationMissionState = SimulationMissionState.INACTIVE;
  private previousResumableState: SimulationMissionState | null = null;
  private currentPhase: SimulationMissionPhase = SimulationMissionPhase.IDLE;
  private isInitialized: boolean = false;

  /**
   * Authoritative Valid Transition Graph Matrix
   */
  private static readonly VALID_TRANSITIONS: Record<
    SimulationMissionState,
    SimulationMissionState[]
  > = {
    [SimulationMissionState.INACTIVE]: [
      SimulationMissionState.PREPARING,
    ],
    [SimulationMissionState.PREPARING]: [
      SimulationMissionState.READY,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.READY]: [
      SimulationMissionState.LAUNCHING,
      SimulationMissionState.PREPARING,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.LAUNCHING]: [
      SimulationMissionState.IN_TRANSIT,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.IN_TRANSIT]: [
      SimulationMissionState.ARRIVING,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.ARRIVING]: [
      SimulationMissionState.ACTIVE,
      SimulationMissionState.COMPLETED,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.ACTIVE]: [
      SimulationMissionState.RETURNING,
      SimulationMissionState.COMPLETED,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.RETURNING]: [
      SimulationMissionState.ARRIVING,
      SimulationMissionState.COMPLETED,
      SimulationMissionState.PAUSED,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.PAUSED]: [
      // Only resumable to the previous state (or terminal failure)
      SimulationMissionState.PREPARING,
      SimulationMissionState.READY,
      SimulationMissionState.LAUNCHING,
      SimulationMissionState.IN_TRANSIT,
      SimulationMissionState.ARRIVING,
      SimulationMissionState.ACTIVE,
      SimulationMissionState.RETURNING,
      SimulationMissionState.FAILED,
    ],
    [SimulationMissionState.COMPLETED]: [], // Immutable terminal state
    [SimulationMissionState.FAILED]: [
      SimulationMissionState.PREPARING, // Eligible for retry/reset
    ],
  };

  /**
   * Initialize mission state
   */
  public initialize(): StateTransitionResult {
    if (this.isInitialized) {
      const err = 'Mission is already initialized. Cannot initialize twice accidentally.';
      Logger.warn('MISSION_STATE_MACHINE', err);
      return {
        success: false,
        fromState: this.currentState,
        toState: SimulationMissionState.PREPARING,
        error: err,
      };
    }

    this.isInitialized = true;
    this.currentState = SimulationMissionState.PREPARING;
    this.currentPhase = SimulationMissionPhase.PRE_LAUNCH;
    this.previousResumableState = null;

    Logger.info('MISSION_STATE_MACHINE', 'Mission state machine initialized to PREPARING.');
    return {
      success: true,
      fromState: SimulationMissionState.INACTIVE,
      toState: SimulationMissionState.PREPARING,
    };
  }

  /**
   * Transition to a new target state with strict validation
   */
  public transitionTo(
    targetState: SimulationMissionState,
    objectives?: SimulationObjective[]
  ): StateTransitionResult {
    // 1. Cannot transition identical state
    if (this.currentState === targetState) {
      return {
        success: true,
        fromState: this.currentState,
        toState: targetState,
      };
    }

    // 2. Terminal state protection: COMPLETED is immutable
    if (this.currentState === SimulationMissionState.COMPLETED) {
      const err = `Cannot transition from terminal state COMPLETED to ${targetState}.`;
      Logger.warn('MISSION_STATE_MACHINE', err);
      return {
        success: false,
        fromState: this.currentState,
        toState: targetState,
        error: err,
      };
    }

    // 3. Valid transition graph check
    const allowed = MissionStateMachine.VALID_TRANSITIONS[this.currentState] || [];
    if (!allowed.includes(targetState)) {
      const err = `Invalid state transition from ${this.currentState} to ${targetState}.`;
      Logger.warn('MISSION_STATE_MACHINE', err);
      return {
        success: false,
        fromState: this.currentState,
        toState: targetState,
        error: err,
      };
    }

    // 4. Special validation when transitioning to COMPLETED: mandatory objectives check
    if (targetState === SimulationMissionState.COMPLETED) {
      const objValidation = this.validateObjectivesForCompletion(objectives);
      if (!objValidation.satisfied) {
        Logger.warn('MISSION_STATE_MACHINE', objValidation.error!);
        return {
          success: false,
          fromState: this.currentState,
          toState: targetState,
          error: objValidation.error,
        };
      }
    }

    // 5. Special validation when transitioning to PAUSED: capture previous resumable state
    if (targetState === SimulationMissionState.PAUSED) {
      this.previousResumableState = this.currentState;
    }

    // 6. Special validation when resuming from PAUSED: must match previous resumable state
    if (this.currentState === SimulationMissionState.PAUSED) {
      if (
        targetState !== SimulationMissionState.FAILED &&
        this.previousResumableState &&
        targetState !== this.previousResumableState
      ) {
        const err = `Cannot resume to ${targetState}; paused mission must resume to previous state ${this.previousResumableState}.`;
        Logger.warn('MISSION_STATE_MACHINE', err);
        return {
          success: false,
          fromState: this.currentState,
          toState: targetState,
          error: err,
        };
      }
      this.previousResumableState = null;
    }

    const previous = this.currentState;
    this.currentState = targetState;

    Logger.info(
      'MISSION_STATE_MACHINE',
      `State transition successful: ${previous} -> ${targetState}.`
    );

    return {
      success: true,
      fromState: previous,
      toState: targetState,
    };
  }

  /**
   * Pause the mission, preserving previous resumable state
   */
  public pause(_reason?: string): StateTransitionResult {
    if (this.currentState === SimulationMissionState.PAUSED) {
      return {
        success: true,
        fromState: this.currentState,
        toState: SimulationMissionState.PAUSED,
      };
    }

    if (
      this.currentState === SimulationMissionState.COMPLETED ||
      this.currentState === SimulationMissionState.FAILED ||
      this.currentState === SimulationMissionState.INACTIVE
    ) {
      const err = `Cannot pause mission in terminal or inactive state (${this.currentState}).`;
      return {
        success: false,
        fromState: this.currentState,
        toState: SimulationMissionState.PAUSED,
        error: err,
      };
    }

    return this.transitionTo(SimulationMissionState.PAUSED);
  }

  /**
   * Resume paused mission back to previous state
   */
  public resume(): StateTransitionResult {
    if (this.currentState !== SimulationMissionState.PAUSED) {
      const err = `Cannot resume mission: state is ${this.currentState}, not PAUSED.`;
      return {
        success: false,
        fromState: this.currentState,
        toState: this.currentState,
        error: err,
      };
    }

    const resumeTarget = this.previousResumableState || SimulationMissionState.ACTIVE;
    return this.transitionTo(resumeTarget);
  }

  /**
   * Check if mission can complete based on objective requirements
   */
  public validateObjectivesForCompletion(
    objectives?: SimulationObjective[]
  ): { satisfied: boolean; error?: string } {
    if (!objectives || objectives.length === 0) {
      return { satisfied: true };
    }

    const unmetMandatory = objectives.filter(
      (obj) => obj.isMandatory && !obj.isCompleted
    );

    if (unmetMandatory.length > 0) {
      const missingTitles = unmetMandatory.map((o) => `"${o.title}" (${o.id})`).join(', ');
      return {
        satisfied: false,
        error: `Cannot complete mission: required objective(s) [${missingTitles}] are not satisfied.`,
      };
    }

    return { satisfied: true };
  }

  /**
   * Get current state
   */
  public getCurrentState(): SimulationMissionState {
    return this.currentState;
  }

  /**
   * Get current flight phase
   */
  public getCurrentPhase(): SimulationMissionPhase {
    return this.currentPhase;
  }

  /**
   * Set current flight phase
   */
  public setPhase(phase: SimulationMissionPhase): void {
    this.currentPhase = phase;
  }

  /**
   * Get previous resumable state when paused
   */
  public getPreviousResumableState(): SimulationMissionState | null {
    return this.previousResumableState;
  }

  /**
   * Is mission in an active running state (not paused, completed, or failed)
   */
  public isRunning(): boolean {
    return (
      this.currentState === SimulationMissionState.LAUNCHING ||
      this.currentState === SimulationMissionState.IN_TRANSIT ||
      this.currentState === SimulationMissionState.ARRIVING ||
      this.currentState === SimulationMissionState.ACTIVE ||
      this.currentState === SimulationMissionState.RETURNING
    );
  }

  /**
   * Is mission terminal
   */
  public isTerminal(): boolean {
    return (
      this.currentState === SimulationMissionState.COMPLETED ||
      this.currentState === SimulationMissionState.FAILED
    );
  }

  /**
   * Has mission been initialized
   */
  public hasBeenInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset the state machine back to uninitialized state
   */
  public reset(): void {
    this.currentState = SimulationMissionState.INACTIVE;
    this.previousResumableState = null;
    this.currentPhase = SimulationMissionPhase.IDLE;
    this.isInitialized = false;
  }

  /**
   * Restore state from snapshot
   */
  public restore(
    state: SimulationMissionState,
    phase: SimulationMissionPhase,
    previousResumable: SimulationMissionState | null
  ): void {
    this.currentState = state;
    this.currentPhase = phase;
    this.previousResumableState = previousResumable;
    this.isInitialized = true;
  }
}
