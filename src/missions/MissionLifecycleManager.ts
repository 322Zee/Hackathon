/**
 * INTERSTELLAR CONTINUUM - Centralized Mission Lifecycle Manager & State Machine
 * Authoritative lifecycle state machine, instance tracking, transition validation,
 * preparation routing, objective synchronization, and event recording.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { MissionCatalogueRegistry } from './MissionCatalogueRegistry';
import { MissionPreparationService } from './MissionPreparationService';
import { MissionObjectiveTracker } from './MissionObjectiveTracker';
import {
  MissionLifecycleState,
  MissionHistoryEventType,
  MissionHistoryEvent,
  MissionInstance,
  MissionTransitionResult,
  MissionManagementSaveData,
  MissionInstanceSaveData,
} from './MissionLifecycleTypes';

export class MissionLifecycleManager {
  private static instance?: MissionLifecycleManager;
  private eventBus?: EventBus;
  private catalogueRegistry: MissionCatalogueRegistry;
  private preparationService: MissionPreparationService;
  private objectiveTracker: MissionObjectiveTracker;

  private instances: Map<string, MissionInstance> = new Map();
  private activeInstanceIds: Set<string> = new Set();
  private archivedInstanceIds: Set<string> = new Set();

  /**
   * Authoritative Valid Transition Graph Matrix
   */
  private static readonly VALID_TRANSITIONS: Record<
    MissionLifecycleState,
    MissionLifecycleState[]
  > = {
    [MissionLifecycleState.LOCKED]: [MissionLifecycleState.AVAILABLE],
    [MissionLifecycleState.AVAILABLE]: [
      MissionLifecycleState.LOCKED,
      MissionLifecycleState.ACCEPTED,
    ],
    [MissionLifecycleState.ACCEPTED]: [
      MissionLifecycleState.PREPARING,
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.PREPARING]: [
      MissionLifecycleState.READY_FOR_VALIDATION,
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.READY_FOR_VALIDATION]: [
      MissionLifecycleState.READY,
      MissionLifecycleState.PREPARING,
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.READY]: [
      MissionLifecycleState.ACTIVE,
      MissionLifecycleState.PREPARING,
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.ACTIVE]: [
      MissionLifecycleState.PAUSED,
      MissionLifecycleState.COMPLETED,
      MissionLifecycleState.FAILED,
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.PAUSED]: [
      MissionLifecycleState.ACTIVE,
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.COMPLETED]: [], // Immutable terminal state
    [MissionLifecycleState.FAILED]: [
      MissionLifecycleState.PREPARING, // Eligible for retry/restart
      MissionLifecycleState.CANCELLED,
    ],
    [MissionLifecycleState.CANCELLED]: [], // Terminal state
  };

  constructor(
    eventBus?: EventBus,
    catalogueRegistry?: MissionCatalogueRegistry,
    preparationService?: MissionPreparationService,
    objectiveTracker?: MissionObjectiveTracker
  ) {
    this.eventBus = eventBus;
    this.catalogueRegistry = catalogueRegistry ?? MissionCatalogueRegistry.getInstance(eventBus);
    this.preparationService = preparationService ?? MissionPreparationService.getInstance();
    this.objectiveTracker = objectiveTracker ?? MissionObjectiveTracker.getInstance(eventBus);
  }

  public static getInstance(eventBus?: EventBus): MissionLifecycleManager {
    if (!MissionLifecycleManager.instance) {
      MissionLifecycleManager.instance = new MissionLifecycleManager(eventBus);
    } else if (eventBus && !MissionLifecycleManager.instance.eventBus) {
      MissionLifecycleManager.instance.setEventBus(eventBus);
    }
    return MissionLifecycleManager.instance;
  }

  public static resetInstance(): void {
    if (MissionLifecycleManager.instance) {
      MissionLifecycleManager.instance.reset();
      MissionLifecycleManager.instance = undefined;
    }
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
    this.objectiveTracker.setEventBus(bus);
  }

  public reset(): void {
    this.instances.clear();
    this.activeInstanceIds.clear();
    this.archivedInstanceIds.clear();
  }

  /**
   * Accepts a mission and instantiates a lightweight MissionInstance model.
   */
  public acceptMission(
    missionId: string
  ): { success: boolean; instance?: MissionInstance; reason?: string } {
    const mission = this.catalogueRegistry.getMissionById(missionId);
    if (!mission) {
      const reason = `Mission ID "${missionId}" does not exist in the catalogue.`;
      Logger.warn('MISSION_LIFECYCLE', reason);
      return { success: false, reason };
    }

    // Duplicate check: verify no active instance already exists for this mission
    const existingActive = this.getActiveInstanceForMission(missionId);
    if (existingActive) {
      const reason = `Mission "${mission.name}" is already active in progress (${existingActive.instanceId}, status: ${existingActive.status}).`;
      Logger.warn('MISSION_LIFECYCLE', reason);
      return { success: false, reason };
    }

    // Verify progression prerequisites
    const evalStatus = this.catalogueRegistry.evaluateMissionStatus(missionId);
    if (!evalStatus.isAvailable && !evalStatus.isActive) {
      const reason = `Prerequisites for mission "${mission.name}" are not satisfied: ${evalStatus.unmetPrerequisites.join(', ')}`;
      Logger.warn('MISSION_LIFECYCLE', reason);
      return { success: false, reason };
    }

    // Create unique instance ID
    const instanceId = `inst_${mission.id}_${Date.now()}`;
    const prepState = this.preparationService.generatePreparationState(mission);
    const trackedObjectives = this.objectiveTracker.initializeObjectives(instanceId, mission);

    const initialHistory: MissionHistoryEvent[] = [
      {
        id: `evt_${Date.now()}_1`,
        timestamp: Date.now(),
        type: MissionHistoryEventType.MISSION_ACCEPTED,
        summary: `Mission "${mission.name}" formally accepted by Mission Director.`,
      },
    ];

    const instance: MissionInstance = {
      instanceId,
      missionId: mission.id,
      destinationId: mission.destinationId,
      status: MissionLifecycleState.ACCEPTED,
      acceptedTimestamp: Date.now(),
      currentObjectiveId: trackedObjectives[0]?.id,
      objectives: trackedObjectives,
      preparation: prepState,
      committedResources: {
        credits: mission.budget.allocatedCredits,
        researchData: 0,
      },
      history: initialHistory,
    };

    this.instances.set(instanceId, instance);
    this.activeInstanceIds.add(instanceId);

    // Synchronize catalogue registry active tracking
    this.catalogueRegistry.setMissionActive(mission.id);

    Logger.info(
      'MISSION_LIFECYCLE',
      `Instantiated active mission: "${mission.name}" (${instanceId}) in state: ACCEPTED`
    );

    if (this.eventBus) {
      this.eventBus.emit('mission:instance:created' as any, {
        instanceId,
        missionId: mission.id,
      });
      this.eventBus.emit('mission:accepted', {
        missionId: mission.id,
        name: mission.name,
        category: mission.category,
        destinationId: mission.destinationId,
      });
    }

    return { success: true, instance };
  }

  /**
   * Executes a validated state transition on an active mission instance.
   */
  public transitionState(
    instanceId: string,
    targetState: MissionLifecycleState,
    reason?: string,
    context?: Record<string, any>
  ): MissionTransitionResult {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return {
        success: false,
        instanceId,
        fromState: MissionLifecycleState.LOCKED,
        toState: targetState,
        reason: `Mission instance "${instanceId}" was not found.`,
      };
    }

    const currentState = instance.status;

    // 1. Check state graph transition validity
    const allowedTargets = MissionLifecycleManager.VALID_TRANSITIONS[currentState] || [];
    if (!allowedTargets.includes(targetState)) {
      const err = `Invalid lifecycle transition from ${currentState} to ${targetState}.`;
      Logger.warn('MISSION_LIFECYCLE', err);
      return {
        success: false,
        instanceId,
        fromState: currentState,
        toState: targetState,
        reason: err,
      };
    }

    // 2. Perform target state guard validations
    if (targetState === MissionLifecycleState.READY) {
      const validation = this.preparationService.validatePreparation(instance.preparation);
      if (!validation.isValid) {
        const failReason = `Readiness check rejected: ${validation.errors.join('; ')}`;
        Logger.warn('MISSION_LIFECYCLE', failReason);

        // Record validation failure in history
        this.recordHistory(
          instanceId,
          MissionHistoryEventType.VALIDATION_FAILED,
          failReason,
          { errors: validation.errors }
        );

        return {
          success: false,
          instanceId,
          fromState: currentState,
          toState: targetState,
          reason: failReason,
          errors: validation.errors,
        };
      }
    }

    if (targetState === MissionLifecycleState.ACTIVE) {
      if (currentState !== MissionLifecycleState.READY && currentState !== MissionLifecycleState.PAUSED) {
        return {
          success: false,
          instanceId,
          fromState: currentState,
          toState: targetState,
          reason: `Mission must be in READY or PAUSED state before activation. Currently: ${currentState}`,
        };
      }
    }

    if (targetState === MissionLifecycleState.COMPLETED) {
      const summary = this.objectiveTracker.getProgressSummary(instance.objectives);
      if (!summary.allMandatoryDone) {
        return {
          success: false,
          instanceId,
          fromState: currentState,
          toState: targetState,
          reason: `Cannot complete mission: mandatory objectives remain incomplete (${summary.ratioString}).`,
        };
      }
    }

    // 3. Apply state transition
    instance.status = targetState;

    // 4. Record transition event
    const historyType = this.mapStateToHistoryType(targetState);
    const summaryText = reason ?? `Mission transitioned from ${currentState} to ${targetState}.`;
    this.recordHistory(instanceId, historyType, summaryText, context);

    // 5. Handle terminal and active tracking sets
    if (
      targetState === MissionLifecycleState.COMPLETED ||
      targetState === MissionLifecycleState.FAILED ||
      targetState === MissionLifecycleState.CANCELLED
    ) {
      this.activeInstanceIds.delete(instanceId);
      this.archivedInstanceIds.add(instanceId);

      if (targetState === MissionLifecycleState.COMPLETED) {
        const missionDef = this.catalogueRegistry.getMissionById(instance.missionId);
        instance.completionInfo = {
          timestamp: Date.now(),
          durationDays: missionDef?.estimatedDurationDays ?? 1,
          rewardsGranted: true,
          finalPrestigeYield: missionDef?.rewards.agencyPrestige ?? 10,
        };
        this.catalogueRegistry.setMissionCompleted(instance.missionId);
      } else if (targetState === MissionLifecycleState.FAILED) {
        instance.failureInfo = {
          timestamp: Date.now(),
          reason: reason ?? 'Critical flight failure condition triggered.',
          retryCount: (instance.failureInfo?.retryCount ?? 0) + 1,
          checkpointRef: instance.checkpointRef,
        };
        this.catalogueRegistry.setMissionFailed(instance.missionId, reason);
      }

      if (this.eventBus) {
        this.eventBus.emit('mission:archived' as any, {
          instanceId,
          missionId: instance.missionId,
          finalStatus: targetState,
          timestamp: Date.now(),
        });
      }
    }

    Logger.info(
      'MISSION_LIFECYCLE',
      `Transitioned instance "${instanceId}": ${currentState} -> ${targetState} (${summaryText})`
    );

    // 6. Notify subscribed systems via EventBus
    if (this.eventBus) {
      this.eventBus.emit('mission:lifecycle:changed' as any, {
        instanceId,
        missionId: instance.missionId,
        fromState: currentState,
        toState: targetState,
      });

      if (targetState === MissionLifecycleState.READY) {
        this.eventBus.emit('mission:ready' as any, {
          instanceId,
          missionId: instance.missionId,
        });
      } else if (targetState === MissionLifecycleState.ACTIVE) {
        this.eventBus.emit('mission:activated' as any, {
          instanceId,
          missionId: instance.missionId,
        });
      } else if (targetState === MissionLifecycleState.PAUSED) {
        this.eventBus.emit('mission:paused' as any, {
          instanceId,
          missionId: instance.missionId,
        });
      } else if (targetState === MissionLifecycleState.CANCELLED) {
        this.eventBus.emit('mission:cancelled' as any, {
          instanceId,
          missionId: instance.missionId,
          reason,
        });
      }
    }

    return {
      success: true,
      instanceId,
      fromState: currentState,
      toState: targetState,
      reason: summaryText,
    };
  }

  /**
   * Resets and restarts a failed mission instance, preserving global agency progression.
   */
  public retryMission(instanceId: string): { success: boolean; reason?: string } {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, reason: `Instance "${instanceId}" not found.` };
    }

    if (instance.status !== MissionLifecycleState.FAILED) {
      return {
        success: false,
        reason: `Only FAILED missions can be restarted. Currently: ${instance.status}`,
      };
    }

    const missionDef = this.catalogueRegistry.getMissionById(instance.missionId);
    if (!missionDef) {
      return { success: false, reason: `Mission definition not found.` };
    }

    // Re-initialize objectives and preparation state
    instance.objectives = this.objectiveTracker.initializeObjectives(instanceId, missionDef);
    instance.preparation = this.preparationService.generatePreparationState(missionDef);

    // Move back from archive to active
    this.archivedInstanceIds.delete(instanceId);
    this.activeInstanceIds.add(instanceId);

    // Transition back to PREPARING
    instance.status = MissionLifecycleState.PREPARING;

    this.recordHistory(
      instanceId,
      MissionHistoryEventType.MISSION_RESTARTED,
      `Mission restarted after flight failure. Ready for reconfiguration.`
    );

    Logger.info('MISSION_LIFECYCLE', `Mission instance "${instanceId}" restarted to PREPARING.`);

    if (this.eventBus) {
      this.eventBus.emit('mission:lifecycle:changed' as any, {
        instanceId,
        missionId: instance.missionId,
        fromState: MissionLifecycleState.FAILED,
        toState: MissionLifecycleState.PREPARING,
      });
    }

    return { success: true };
  }

  /**
   * Cancels a mission with consequence recording and confirmation.
   */
  public cancelMission(
    instanceId: string,
    reason: string = 'Cancelled by Mission Director authorization.'
  ): MissionTransitionResult {
    return this.transitionState(instanceId, MissionLifecycleState.CANCELLED, reason);
  }

  /**
   * Updates progress on an objective for a specific mission instance.
   */
  public updateObjectiveProgress(
    instanceId: string,
    objectiveId: string,
    progress: number,
    isAbsolute: boolean = false
  ): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    const result = this.objectiveTracker.updateProgress(
      instance.objectives,
      objectiveId,
      progress,
      isAbsolute
    );

    if (result.justCompleted) {
      this.recordHistory(
        instanceId,
        MissionHistoryEventType.OBJECTIVE_COMPLETED,
        `Objective completed: "${result.objective?.title}"`
      );

      // Check if all mandatory objectives are completed
      if (result.allMandatoryCompleted && instance.status === MissionLifecycleState.ACTIVE) {
        Logger.info(
          'MISSION_LIFECYCLE',
          `All mandatory objectives complete for active mission instance: ${instanceId}. Ready for completion evaluation.`
        );
      }
    } else {
      this.recordHistory(
        instanceId,
        MissionHistoryEventType.OBJECTIVE_UPDATED,
        `Objective progress updated: "${result.objective?.title}" -> ${result.objective?.currentProgress}`
      );
    }

    return true;
  }

  /**
   * Records a history event for an instance.
   */
  public recordHistory(
    instanceId: string,
    type: MissionHistoryEventType,
    summary: string,
    details?: Record<string, any>
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const event: MissionHistoryEvent = {
      id: `evt_${Date.now()}_${instance.history.length + 1}`,
      timestamp: Date.now(),
      type,
      summary,
      details,
    };

    instance.history.push(event);
  }

  // Query API
  public getInstance(instanceId: string): MissionInstance | undefined {
    return this.instances.get(instanceId);
  }

  public getActiveInstanceForMission(missionId: string): MissionInstance | undefined {
    for (const id of this.activeInstanceIds) {
      const inst = this.instances.get(id);
      if (inst && inst.missionId === missionId) {
        return inst;
      }
    }
    return undefined;
  }

  public getAllInstances(): MissionInstance[] {
    return Array.from(this.instances.values());
  }

  public getActiveInstances(): MissionInstance[] {
    return Array.from(this.activeInstanceIds)
      .map((id) => this.instances.get(id))
      .filter((i): i is MissionInstance => i !== undefined);
  }

  public getArchivedInstances(): MissionInstance[] {
    return Array.from(this.archivedInstanceIds)
      .map((id) => this.instances.get(id))
      .filter((i): i is MissionInstance => i !== undefined);
  }

  public isMissionActive(missionId: string): boolean {
    return this.getActiveInstanceForMission(missionId) !== undefined;
  }

  private mapStateToHistoryType(state: MissionLifecycleState): MissionHistoryEventType {
    switch (state) {
      case MissionLifecycleState.ACCEPTED:
        return MissionHistoryEventType.MISSION_ACCEPTED;
      case MissionLifecycleState.PREPARING:
        return MissionHistoryEventType.PREPARATION_STARTED;
      case MissionLifecycleState.READY_FOR_VALIDATION:
        return MissionHistoryEventType.VALIDATION_REQUESTED;
      case MissionLifecycleState.READY:
        return MissionHistoryEventType.MISSION_READY;
      case MissionLifecycleState.ACTIVE:
        return MissionHistoryEventType.MISSION_ACTIVATED;
      case MissionLifecycleState.PAUSED:
        return MissionHistoryEventType.MISSION_PAUSED;
      case MissionLifecycleState.COMPLETED:
        return MissionHistoryEventType.MISSION_COMPLETED;
      case MissionLifecycleState.FAILED:
        return MissionHistoryEventType.MISSION_FAILED;
      case MissionLifecycleState.CANCELLED:
        return MissionHistoryEventType.MISSION_CANCELLED;
      default:
        return MissionHistoryEventType.CONFIGURATION_UPDATED;
    }
  }

  // Persistence Serialization
  public serialize(): MissionManagementSaveData {
    const instancesObj: Record<string, MissionInstanceSaveData> = {};
    for (const [id, inst] of this.instances.entries()) {
      instancesObj[id] = JSON.parse(JSON.stringify(inst));
    }

    return {
      instances: instancesObj,
      activeInstanceIds: Array.from(this.activeInstanceIds),
      archivedInstanceIds: Array.from(this.archivedInstanceIds),
    };
  }

  public deserialize(data: MissionManagementSaveData): void {
    if (!data || !data.instances) {
      Logger.warn('MISSION_LIFECYCLE', 'Invalid or corrupt save data provided to deserialize.');
      return;
    }

    this.instances.clear();
    this.activeInstanceIds.clear();
    this.archivedInstanceIds.clear();

    for (const [id, instData] of Object.entries(data.instances)) {
      this.instances.set(id, JSON.parse(JSON.stringify(instData)));
    }

    for (const activeId of data.activeInstanceIds || []) {
      if (this.instances.has(activeId)) {
        this.activeInstanceIds.add(activeId);
      }
    }

    for (const archivedId of data.archivedInstanceIds || []) {
      if (this.instances.has(archivedId)) {
        this.archivedInstanceIds.add(archivedId);
      }
    }

    Logger.info(
      'MISSION_LIFECYCLE',
      `Restored ${this.instances.size} instances (${this.activeInstanceIds.size} active, ${this.archivedInstanceIds.size} archived).`
    );
  }
}
