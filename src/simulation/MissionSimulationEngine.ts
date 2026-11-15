/**
 * INTERSTELLAR CONTINUUM - Mission Simulation Engine & Space-Time Core
 * Authoritative simulation engine responsible for mission initialization, lifecycle state,
 * game-time progression, space travel tracking, objective validation, snapshots,
 * and event notifications.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { DestinationId } from '../destinations/DestinationTypes';
import { GameTimeSystem } from './GameTimeSystem';
import { SpaceTravelSystem } from './SpaceTravelSystem';
import { MissionStateMachine } from './MissionStateMachine';
import {
  SimulationMissionState,
  SimulationMissionPhase,
  MissionSimulationConfig,
  MissionSimulationSnapshot,
  SimulationObjective,
  TravelProgress,
  SimulationEventMap,
  UnsubscribeFn,
} from './MissionSimulationTypes';

export const SIMULATION_SCHEMA_VERSION = 1;

export interface MissionSimulationEngineOptions {
  eventBus?: EventBus;
}

export class MissionSimulationEngine {
  private static instance?: MissionSimulationEngine;

  private eventBus?: EventBus;
  private gameTime: GameTimeSystem;
  private travelSystem: SpaceTravelSystem;
  private stateMachine: MissionStateMachine;

  // Active mission metadata
  private missionId: string = '';
  private instanceId: string = '';
  private missionName: string = '';
  private missionType: string = '';
  private originId: DestinationId | string = DestinationId.EARTH;
  private destinationId: DestinationId | string = DestinationId.MOON;
  private objectives: SimulationObjective[] = [];
  private failureReason: string | null = null;
  private completedGameTime: number | null = null;
  private createdAt: number = 0;
  private updatedAt: number = 0;

  // Internal typed listener registry
  private listeners: Map<keyof SimulationEventMap, Set<(payload: any) => void>> = new Map();

  constructor(options?: MissionSimulationEngineOptions) {
    this.eventBus = options?.eventBus;
    this.gameTime = new GameTimeSystem();
    this.travelSystem = new SpaceTravelSystem();
    this.stateMachine = new MissionStateMachine();
  }

  /**
   * Singleton accessor (optional convenience pattern matching project conventions)
   */
  public static getInstance(options?: MissionSimulationEngineOptions): MissionSimulationEngine {
    if (!MissionSimulationEngine.instance) {
      MissionSimulationEngine.instance = new MissionSimulationEngine(options);
    }
    return MissionSimulationEngine.instance;
  }

  /**
   * Initialize a mission in the simulation engine.
   * Enforces duplicate initialization prevention and sets up simulation state.
   */
  public initializeMission(config: MissionSimulationConfig): MissionSimulationSnapshot {
    if (this.stateMachine.hasBeenInitialized()) {
      const err = `Cannot initialize mission "${config.missionId}": another mission ("${this.missionId}") is already initialized. Call reset() first.`;
      Logger.warn('MISSION_SIMULATION_ENGINE', err);
      throw new Error(err);
    }

    this.missionId = config.missionId;
    this.instanceId = config.instanceId || `sim_inst_${Date.now().toString(36)}`;
    this.missionName = config.missionName;
    this.missionType = config.missionType;
    this.originId = config.originId || DestinationId.EARTH;
    this.destinationId = config.destinationId;
    this.objectives = config.objectives
      ? config.objectives.map((o) => ({ ...o }))
      : [];
    this.failureReason = null;
    this.completedGameTime = null;
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;

    // 1. Initialize time system
    this.gameTime = new GameTimeSystem({
      timeScale: config.initialTimeScale ?? 1.0,
      isPaused: config.startPaused ?? false,
      fixedTimeStep: config.fixedTimeStep ?? 0.05,
      maxDeltaClamping: config.maxDeltaClamping ?? 5.0,
    });

    // 2. Initialize space travel system
    this.travelSystem.configure({
      originId: this.originId,
      destinationId: this.destinationId,
      estimatedDurationSeconds: config.estimatedDurationSeconds,
      totalDistanceUnits: config.totalDistanceUnits,
      departureTime: 0,
    });

    // 3. Initialize state machine
    this.stateMachine.initialize();

    const snapshot = this.getMissionSnapshot();

    Logger.info(
      'MISSION_SIMULATION_ENGINE',
      `Mission "${this.missionId}" initialized successfully. Destination: ${this.destinationId}.`
    );

    // Emit event
    this.emitEvent('MissionInitialized', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      snapshot,
      timestamp: Date.now(),
    });

    return snapshot;
  }

  /**
   * Start mission execution (e.g. after launch complex initiation)
   */
  public startMission(): boolean {
    if (!this.stateMachine.hasBeenInitialized()) {
      Logger.warn('MISSION_SIMULATION_ENGINE', 'Cannot start mission: engine is not initialized.');
      return false;
    }

    const currentState = this.stateMachine.getCurrentState();

    // Transition from PREPARING to READY if needed
    if (currentState === SimulationMissionState.PREPARING) {
      const prepRes = this.stateMachine.transitionTo(SimulationMissionState.READY);
      if (!prepRes.success) {
        Logger.warn('MISSION_SIMULATION_ENGINE', prepRes.error!);
        return false;
      }
    }

    // Transition to LAUNCHING
    const launchRes = this.stateMachine.transitionTo(SimulationMissionState.LAUNCHING);
    if (!launchRes.success) {
      Logger.warn('MISSION_SIMULATION_ENGINE', launchRes.error!);
      return false;
    }

    this.stateMachine.setPhase(SimulationMissionPhase.LAUNCH_ASCENT);
    this.travelSystem.startTravel(this.gameTime.getElapsedGameTimeSeconds());
    this.updatedAt = Date.now();

    Logger.info(
      'MISSION_SIMULATION_ENGINE',
      `Mission "${this.missionId}" started in state LAUNCHING, phase LAUNCH_ASCENT.`
    );

    this.emitEvent('MissionStarted', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      state: SimulationMissionState.LAUNCHING,
      phase: SimulationMissionPhase.LAUNCH_ASCENT,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Pause mission simulation
   */
  public pauseMission(reason?: string): boolean {
    if (!this.stateMachine.hasBeenInitialized()) return false;

    const previousState = this.stateMachine.getCurrentState();
    const pauseRes = this.stateMachine.pause(reason);
    if (!pauseRes.success) {
      Logger.warn('MISSION_SIMULATION_ENGINE', pauseRes.error || 'Failed to pause mission.');
      return false;
    }

    this.gameTime.pause();
    this.updatedAt = Date.now();

    Logger.info('MISSION_SIMULATION_ENGINE', `Mission "${this.missionId}" paused. Reason: ${reason || 'User action'}.`);

    this.emitEvent('MissionPaused', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      previousState,
      reason,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Resume paused mission simulation
   */
  public resumeMission(): boolean {
    if (!this.stateMachine.hasBeenInitialized()) return false;

    const resumeRes = this.stateMachine.resume();
    if (!resumeRes.success) {
      Logger.warn('MISSION_SIMULATION_ENGINE', resumeRes.error || 'Failed to resume mission.');
      return false;
    }

    this.gameTime.resume();
    this.updatedAt = Date.now();

    const resumedState = this.stateMachine.getCurrentState();
    Logger.info('MISSION_SIMULATION_ENGINE', `Mission "${this.missionId}" resumed to state ${resumedState}.`);

    this.emitEvent('MissionResumed', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      resumedState,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Advance simulation forward by real delta seconds.
   * Frame-rate independent: uses fixed-step accumulation inside GameTimeSystem.
   * Slices large advances to ensure deterministic, clamped execution without truncation.
   */
  public advanceSimulation(deltaSeconds: number): void {
    if (!this.stateMachine.hasBeenInitialized()) return;
    if (this.stateMachine.isTerminal()) return;
    if (this.stateMachine.getCurrentState() === SimulationMissionState.PAUSED) return;
    if (this.stateMachine.getCurrentState() === SimulationMissionState.INACTIVE) return;
    if (deltaSeconds <= 0 || isNaN(deltaSeconds)) return;

    const timeConfig = this.gameTime.getConfig();
    const sliceSize = timeConfig.maxDeltaClamping;
    let remaining = deltaSeconds;

    while (
      remaining > 0 &&
      !this.stateMachine.isTerminal() &&
      this.stateMachine.getCurrentState() !== SimulationMissionState.PAUSED
    ) {
      const currentSlice = Math.min(remaining, sliceSize);
      this.gameTime.advance(currentSlice, (fixedDelta) => {
        this.stepSimulationTick(fixedDelta);
      });
      remaining -= currentSlice;
    }

    this.updatedAt = Date.now();

    // Emit progress update notification
    const travelProgress = this.travelSystem.getProgress();
    this.emitEvent('MissionProgressUpdated', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      progress: travelProgress.progress,
      elapsedGameTime: this.gameTime.getElapsedGameTimeSeconds(),
      formattedMET: this.gameTime.formatMET(),
      travelProgress,
    });
  }

  /**
   * Internal deterministic fixed-step tick execution
   */
  private stepSimulationTick(fixedDelta: number): void {
    const currentState = this.stateMachine.getCurrentState();
    const currentPhase = this.stateMachine.getCurrentPhase();
    const elapsed = this.gameTime.getElapsedGameTimeSeconds();

    // 1. Flight Phase: LAUNCH_ASCENT progression
    if (currentState === SimulationMissionState.LAUNCHING) {
      // Transition from launch ascent to orbit insertion / transit cruise
      if (currentPhase === SimulationMissionPhase.LAUNCH_ASCENT && elapsed >= 10) {
        this.changePhase(SimulationMissionPhase.ORBITAL_INSERTION);
      } else if (currentPhase === SimulationMissionPhase.ORBITAL_INSERTION && elapsed >= 20) {
        // Transition from orbital insertion to in-transit cruising
        this.stateMachine.transitionTo(SimulationMissionState.IN_TRANSIT);
        this.changePhase(SimulationMissionPhase.TRANSIT_CRUISE);
      }
    }

    // 2. Flight Phase: IN_TRANSIT progression
    if (currentState === SimulationMissionState.IN_TRANSIT) {
      const arrived = this.travelSystem.advance(fixedDelta);
      const progress = this.travelSystem.getNormalizedProgress();

      // Check approach phase
      if (progress >= 0.85 && currentPhase === SimulationMissionPhase.TRANSIT_CRUISE) {
        this.changePhase(SimulationMissionPhase.DESTINATION_APPROACH);
      }

      // Check arrival
      if (arrived || progress >= 1.0) {
        this.stateMachine.transitionTo(SimulationMissionState.ARRIVING);
        this.changePhase(SimulationMissionPhase.DESTINATION_ARRIVAL);

        Logger.info(
          'MISSION_SIMULATION_ENGINE',
          `Mission "${this.missionId}" arrived at destination "${this.destinationId}".`
        );

        this.emitEvent('MissionArrived', {
          missionId: this.missionId,
          instanceId: this.instanceId,
          destinationId: this.destinationId as string,
          elapsedGameTime: this.gameTime.getElapsedGameTimeSeconds(),
          timestamp: Date.now(),
        });
      }
    }

    // 3. Flight Phase: ARRIVING -> ACTIVE transition
    if (currentState === SimulationMissionState.ARRIVING) {
      // Transition to active destination operations
      this.stateMachine.transitionTo(SimulationMissionState.ACTIVE);
      this.changePhase(SimulationMissionPhase.PRIMARY_OPERATIONS);
    }

    // 4. Return journey progression
    if (currentState === SimulationMissionState.RETURNING) {
      const arrivedHome = this.travelSystem.advance(fixedDelta);
      if (arrivedHome) {
        this.changePhase(SimulationMissionPhase.MISSION_CONCLUDED);
      }
    }
  }

  /**
   * Safely change current flight phase and emit event
   */
  private changePhase(newPhase: SimulationMissionPhase): void {
    const previousPhase = this.stateMachine.getCurrentPhase();
    if (previousPhase === newPhase) return;

    this.stateMachine.setPhase(newPhase);

    Logger.info(
      'MISSION_SIMULATION_ENGINE',
      `Flight phase changed: ${previousPhase} -> ${newPhase}.`
    );

    this.emitEvent('MissionPhaseChanged', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      previousPhase,
      newPhase,
      state: this.stateMachine.getCurrentState(),
      timestamp: Date.now(),
    });
  }

  /**
   * Complete mission and transition to COMPLETED state.
   * Validates mandatory objectives before allowing transition.
   */
  public completeMission(): boolean {
    if (!this.stateMachine.hasBeenInitialized()) return false;

    // Check mandatory objectives
    const validation = this.stateMachine.validateObjectivesForCompletion(this.objectives);
    if (!validation.satisfied) {
      Logger.warn('MISSION_SIMULATION_ENGINE', validation.error!);
      return false;
    }

    const transRes = this.stateMachine.transitionTo(
      SimulationMissionState.COMPLETED,
      this.objectives
    );

    if (!transRes.success) {
      Logger.warn('MISSION_SIMULATION_ENGINE', transRes.error || 'Failed to complete mission.');
      return false;
    }

    this.changePhase(SimulationMissionPhase.MISSION_CONCLUDED);
    this.completedGameTime = this.gameTime.getElapsedGameTimeSeconds();
    this.updatedAt = Date.now();

    const snapshot = this.getMissionSnapshot();

    Logger.info(
      'MISSION_SIMULATION_ENGINE',
      `Mission "${this.missionId}" successfully COMPLETED at MET ${this.gameTime.formatMET()}.`
    );

    this.emitEvent('MissionCompleted', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      elapsedGameTime: this.completedGameTime,
      snapshot,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Terminate mission in FAILED state
   */
  public failMission(reason: string): boolean {
    if (!this.stateMachine.hasBeenInitialized()) return false;

    const transRes = this.stateMachine.transitionTo(SimulationMissionState.FAILED);
    if (!transRes.success) {
      Logger.warn('MISSION_SIMULATION_ENGINE', transRes.error || 'Failed to set mission to FAILED.');
      return false;
    }

    this.failureReason = reason;
    this.updatedAt = Date.now();

    const snapshot = this.getMissionSnapshot();

    Logger.warn(
      'MISSION_SIMULATION_ENGINE',
      `Mission "${this.missionId}" FAILED: ${reason}.`
    );

    this.emitEvent('MissionFailed', {
      missionId: this.missionId,
      instanceId: this.instanceId,
      reason,
      elapsedGameTime: this.gameTime.getElapsedGameTimeSeconds(),
      snapshot,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Initiate return voyage to original launch site
   */
  public initiateReturnJourney(estimatedDurationSeconds?: number): boolean {
    if (this.stateMachine.getCurrentState() !== SimulationMissionState.ACTIVE) {
      Logger.warn(
        'MISSION_SIMULATION_ENGINE',
        `Cannot initiate return journey from state ${this.stateMachine.getCurrentState()}. Must be ACTIVE.`
      );
      return false;
    }

    const transRes = this.stateMachine.transitionTo(SimulationMissionState.RETURNING);
    if (!transRes.success) return false;

    this.changePhase(SimulationMissionPhase.RETURN_TRANSIT);
    this.travelSystem.initiateReturn(
      estimatedDurationSeconds,
      this.gameTime.getElapsedGameTimeSeconds()
    );

    return true;
  }

  /**
   * Mark an objective as completed
   */
  public completeObjective(objectiveId: string): boolean {
    const objective = this.objectives.find((o) => o.id === objectiveId);
    if (!objective) {
      Logger.warn('MISSION_SIMULATION_ENGINE', `Objective "${objectiveId}" not found.`);
      return false;
    }

    objective.isCompleted = true;
    objective.currentProgress = objective.targetValue;
    this.updatedAt = Date.now();

    this.emitEvent('ObjectiveUpdated', {
      missionId: this.missionId,
      objectiveId,
      isCompleted: true,
      currentProgress: objective.currentProgress,
      targetValue: objective.targetValue,
    });

    return true;
  }

  /**
   * Update objective progress
   */
  public updateObjectiveProgress(
    objectiveId: string,
    currentProgress: number,
    autoComplete: boolean = true
  ): boolean {
    const objective = this.objectives.find((o) => o.id === objectiveId);
    if (!objective) {
      Logger.warn('MISSION_SIMULATION_ENGINE', `Objective "${objectiveId}" not found.`);
      return false;
    }

    objective.currentProgress = currentProgress;
    if (autoComplete && objective.currentProgress >= objective.targetValue) {
      objective.isCompleted = true;
    }
    this.updatedAt = Date.now();

    this.emitEvent('ObjectiveUpdated', {
      missionId: this.missionId,
      objectiveId,
      isCompleted: objective.isCompleted,
      currentProgress: objective.currentProgress,
      targetValue: objective.targetValue,
    });

    return true;
  }

  /**
   * Set simulation speed multiplier
   */
  public setSimulationSpeed(scale: number): void {
    this.gameTime.setTimeScale(scale);
    this.emitEvent('SimulationSpeedChanged', {
      timeScale: this.gameTime.getTimeScale(),
      isPaused: this.gameTime.isTimePaused(),
    });
  }

  /**
   * Get current simulation speed multiplier
   */
  public getSimulationSpeed(): number {
    return this.gameTime.getTimeScale();
  }

  /**
   * Get current mission state
   */
  public getMissionState(): SimulationMissionState {
    return this.stateMachine.getCurrentState();
  }

  /**
   * Get current flight phase
   */
  public getMissionPhase(): SimulationMissionPhase {
    return this.stateMachine.getCurrentPhase();
  }

  /**
   * Get current space travel telemetry
   */
  public getTravelProgress(): TravelProgress {
    return this.travelSystem.getProgress();
  }

  /**
   * Get current game-time state
   */
  public getGameTimeState() {
    return this.gameTime.getState();
  }

  /**
   * Get active objectives
   */
  public getObjectives(): SimulationObjective[] {
    return this.objectives.map((o) => ({ ...o }));
  }

  /**
   * Generate serializable mission snapshot
   */
  public getMissionSnapshot(): MissionSimulationSnapshot {
    const timeState = this.gameTime.getState();
    const timeConfig = this.gameTime.getConfig();

    return {
      schemaVersion: SIMULATION_SCHEMA_VERSION,
      snapshotId: `snap_${this.missionId}_${Date.now().toString(36)}`,
      missionId: this.missionId,
      instanceId: this.instanceId,
      missionName: this.missionName,
      missionType: this.missionType,
      originId: this.originId as string,
      destinationId: this.destinationId as string,
      currentState: this.stateMachine.getCurrentState(),
      previousResumableState: this.stateMachine.getPreviousResumableState(),
      currentPhase: this.stateMachine.getCurrentPhase(),
      elapsedGameTime: timeState.elapsedGameTimeSeconds,
      totalRealTime: timeState.totalRealTimeSeconds,
      totalTicks: timeState.totalTicks,
      travelProgress: this.travelSystem.getProgress(),
      objectives: this.objectives.map((o) => ({ ...o })),
      simulationSettings: {
        timeScale: timeConfig.timeScale,
        isPaused: timeConfig.isPaused,
        fixedTimeStep: timeConfig.fixedTimeStep,
        maxDeltaClamping: timeConfig.maxDeltaClamping,
      },
      failureReason: this.failureReason,
      completedGameTime: this.completedGameTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Safely restore simulation from saved snapshot
   */
  public restoreFromSnapshot(snapshot: MissionSimulationSnapshot): boolean {
    if (!snapshot || typeof snapshot !== 'object') {
      Logger.warn('MISSION_SIMULATION_ENGINE', 'Cannot restore: snapshot is invalid or null.');
      return false;
    }

    if (snapshot.schemaVersion !== SIMULATION_SCHEMA_VERSION) {
      Logger.warn(
        'MISSION_SIMULATION_ENGINE',
        `Snapshot schema version mismatch: expected ${SIMULATION_SCHEMA_VERSION}, got ${snapshot.schemaVersion}.`
      );
      return false;
    }

    if (!snapshot.missionId || !snapshot.currentState) {
      Logger.warn('MISSION_SIMULATION_ENGINE', 'Cannot restore: required fields missing from snapshot.');
      return false;
    }

    this.missionId = snapshot.missionId;
    this.instanceId = snapshot.instanceId;
    this.missionName = snapshot.missionName;
    this.missionType = snapshot.missionType;
    this.originId = snapshot.originId;
    this.destinationId = snapshot.destinationId;
    this.failureReason = snapshot.failureReason;
    this.completedGameTime = snapshot.completedGameTime;
    this.createdAt = snapshot.createdAt || Date.now();
    this.updatedAt = snapshot.updatedAt || Date.now();

    // Restore objectives
    this.objectives = snapshot.objectives ? snapshot.objectives.map((o) => ({ ...o })) : [];

    // Restore state machine
    this.stateMachine.restore(
      snapshot.currentState,
      snapshot.currentPhase,
      snapshot.previousResumableState
    );

    // Restore travel progress
    if (snapshot.travelProgress) {
      this.travelSystem.restore(snapshot.travelProgress);
    }

    // Restore game time
    this.gameTime.restore({
      elapsedGameTimeSeconds: snapshot.elapsedGameTime,
      totalRealTimeSeconds: snapshot.totalRealTime,
      totalTicks: snapshot.totalTicks,
      timeScale: snapshot.simulationSettings?.timeScale ?? 1.0,
      isPaused: snapshot.simulationSettings?.isPaused ?? false,
      fixedTimeStep: snapshot.simulationSettings?.fixedTimeStep ?? 0.05,
      maxDeltaClamping: snapshot.simulationSettings?.maxDeltaClamping ?? 0.25,
    });

    Logger.info(
      'MISSION_SIMULATION_ENGINE',
      `Mission "${this.missionId}" restored successfully from snapshot. State: ${snapshot.currentState}.`
    );

    return true;
  }

  /**
   * Subscribe to strongly typed simulation events.
   * Returns an unsubscribe function.
   */
  public subscribeToMissionEvents<E extends keyof SimulationEventMap>(
    event: E,
    handler: (payload: SimulationEventMap[E]) => void
  ): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(handler as (payload: any) => void);

    let isSubscribed = true;
    return () => {
      if (!isSubscribed) return;
      isSubscribed = false;
      set.delete(handler as (payload: any) => void);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Internal event dispatcher
   */
  private emitEvent<E extends keyof SimulationEventMap>(
    event: E,
    payload: SimulationEventMap[E]
  ): void {
    // 1. Dispatch to direct listeners
    const set = this.listeners.get(event);
    if (set) {
      const active = Array.from(set);
      for (const listener of active) {
        try {
          listener(payload);
        } catch (err) {
          Logger.warn('MISSION_SIMULATION_ENGINE', `Error in simulation event listener for "${event}":`, err);
        }
      }
    }

    // 2. Forward to injected EventBus if available
    if (this.eventBus) {
      try {
        (this.eventBus as any).emit(`simulation:${event}`, payload);
      } catch (err) {
        Logger.warn('MISSION_SIMULATION_ENGINE', `Error forwarding simulation event to EventBus:`, err);
      }
    }
  }

  /**
   * Reset simulation engine back to uninitialized state
   */
  public reset(): void {
    this.stateMachine.reset();
    this.gameTime.reset();
    this.travelSystem.reset();
    this.missionId = '';
    this.instanceId = '';
    this.missionName = '';
    this.missionType = '';
    this.originId = DestinationId.EARTH;
    this.destinationId = DestinationId.MOON;
    this.objectives = [];
    this.failureReason = null;
    this.completedGameTime = null;
    this.createdAt = 0;
    this.updatedAt = 0;
  }
}
