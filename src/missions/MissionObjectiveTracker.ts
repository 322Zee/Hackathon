/**
 * INTERSTELLAR CONTINUUM - Mission Objective Tracking Engine
 * Manages active objective tracking, progression calculations,
 * and completion criteria without fabricated or synthetic progress.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { MissionDefinition, MissionObjective, ObjectiveType } from './MissionTypes';
import {
  TrackedObjectiveState,
  ObjectiveCategory,
} from './MissionLifecycleTypes';

export class MissionObjectiveTracker {
  private static instance?: MissionObjectiveTracker;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  public static getInstance(eventBus?: EventBus): MissionObjectiveTracker {
    if (!MissionObjectiveTracker.instance) {
      MissionObjectiveTracker.instance = new MissionObjectiveTracker(eventBus);
    } else if (eventBus && !MissionObjectiveTracker.instance.eventBus) {
      MissionObjectiveTracker.instance.setEventBus(eventBus);
    }
    return MissionObjectiveTracker.instance;
  }

  public static resetInstance(): void {
    MissionObjectiveTracker.instance = undefined;
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  /**
   * Initializes tracked objective states from a mission definition.
   */
  public initializeObjectives(
    instanceId: string,
    mission: MissionDefinition
  ): TrackedObjectiveState[] {
    const tracked: TrackedObjectiveState[] = [];

    // 1. Mandatory Objectives
    for (const obj of mission.mainObjectives) {
      tracked.push(this.createTrackedObjective(instanceId, obj, true));
    }

    // 2. Optional Objectives
    for (const opt of mission.optionalObjectives || []) {
      tracked.push(this.createTrackedObjective(instanceId, opt, false, '+15% Credits & Science Yield'));
    }

    return tracked;
  }

  /**
   * Maps an authored MissionObjective to a runtime TrackedObjectiveState.
   */
  private createTrackedObjective(
    instanceId: string,
    obj: MissionObjective,
    isMandatory: boolean,
    rewardRef?: string
  ): TrackedObjectiveState {
    const category = this.mapTypeToCategory(obj.type, obj.isDeliveryObjective, obj.isExplorationObjective);
    const condDesc = obj.targetValue !== undefined ? `Target: ${obj.targetValue}` : 'Telemetry confirmation required';

    return {
      id: obj.id,
      missionInstanceId: instanceId,
      title: obj.title,
      description: obj.description,
      category,
      isMandatory,
      isCompleted: false,
      currentProgress: 0,
      targetValue: obj.targetValue,
      conditionDescription: condDesc,
      rewardReference: rewardRef,
    };
  }

  /**
   * Canonical mapping from ObjectiveType to ObjectiveCategory.
   */
  public mapTypeToCategory(
    type: ObjectiveType,
    isDelivery?: boolean,
    isExploration?: boolean
  ): ObjectiveCategory {
    if (isDelivery) return ObjectiveCategory.DELIVER_PAYLOAD;
    if (isExploration && type === ObjectiveType.DATA_COLLECTION) {
      return ObjectiveCategory.COLLECT_SCIENTIFIC_DATA;
    }

    switch (type) {
      case ObjectiveType.DELIVERY:
        return ObjectiveCategory.DELIVER_PAYLOAD;
      case ObjectiveType.ORBITAL_INSERTION:
      case ObjectiveType.SURFACE_LANDING:
        return ObjectiveCategory.REACH_DESTINATION;
      case ObjectiveType.SCIENTIFIC_SURVEY:
        return ObjectiveCategory.MAP_AREA;
      case ObjectiveType.DATA_COLLECTION:
        return ObjectiveCategory.COLLECT_SCIENTIFIC_DATA;
      case ObjectiveType.SAMPLE_ACQUISITION:
        return ObjectiveCategory.ANALYSE_SAMPLE;
      case ObjectiveType.ROVER_TRAVERSAL:
        return ObjectiveCategory.DEPLOY_ROVER;
      case ObjectiveType.STATION_DEPLOYMENT:
        return ObjectiveCategory.CONSTRUCT_FACILITY;
      default:
        return ObjectiveCategory.MAINTAIN_OPERATIONS;
    }
  }

  /**
   * Updates objective progress. Marks objective complete if target reached.
   */
  public updateProgress(
    objectives: TrackedObjectiveState[],
    objectiveId: string,
    progress: number,
    isAbsolute: boolean = false
  ): {
    objective?: TrackedObjectiveState;
    justCompleted: boolean;
    allMandatoryCompleted: boolean;
  } {
    const targetObj = objectives.find((o) => o.id === objectiveId);
    if (!targetObj) {
      Logger.warn('OBJECTIVE_TRACKER', `Objective "${objectiveId}" not found in tracking list.`);
      return { justCompleted: false, allMandatoryCompleted: false };
    }

    const previousProgress = targetObj.currentProgress;
    const wasCompleted = targetObj.isCompleted;

    if (isAbsolute) {
      targetObj.currentProgress = progress;
    } else {
      targetObj.currentProgress += progress;
    }

    // Determine completion
    let nowCompleted = false;
    if (typeof targetObj.targetValue === 'number') {
      nowCompleted = targetObj.currentProgress >= targetObj.targetValue;
    } else {
      nowCompleted = targetObj.currentProgress >= 1;
    }

    const justCompleted = !wasCompleted && nowCompleted;
    if (justCompleted) {
      targetObj.isCompleted = true;
      targetObj.completedTimestamp = Date.now();
      Logger.info('OBJECTIVE_TRACKER', `Objective completed: "${targetObj.title}" (${targetObj.id})`);
    }

    const allMandatoryCompleted = objectives
      .filter((o) => o.isMandatory)
      .every((o) => o.isCompleted);

    // Event bus notification
    if (this.eventBus && (previousProgress !== targetObj.currentProgress || justCompleted)) {
      this.eventBus.emit('mission:objective:updated' as any, {
        instanceId: targetObj.missionInstanceId,
        objectiveId: targetObj.id,
        currentProgress: targetObj.currentProgress,
        isCompleted: targetObj.isCompleted,
      });

      if (justCompleted) {
        this.eventBus.emit('mission:objective:completed' as any, {
          instanceId: targetObj.missionInstanceId,
          objectiveId: targetObj.id,
        });
      }
    }

    return {
      objective: targetObj,
      justCompleted,
      allMandatoryCompleted,
    };
  }

  /**
   * Evaluates mandatory vs optional progress summary.
   */
  public getProgressSummary(objectives: TrackedObjectiveState[]): {
    totalMandatory: number;
    completedMandatory: number;
    totalOptional: number;
    completedOptional: number;
    allMandatoryDone: boolean;
    ratioString: string;
  } {
    const mandatory = objectives.filter((o) => o.isMandatory);
    const optional = objectives.filter((o) => !o.isMandatory);

    const completedMandatory = mandatory.filter((o) => o.isCompleted).length;
    const completedOptional = optional.filter((o) => o.isCompleted).length;

    return {
      totalMandatory: mandatory.length,
      completedMandatory,
      totalOptional: optional.length,
      completedOptional,
      allMandatoryDone: mandatory.length > 0 && completedMandatory === mandatory.length,
      ratioString: `${completedMandatory}/${mandatory.length} Mandatory Objectives`,
    };
  }
}
