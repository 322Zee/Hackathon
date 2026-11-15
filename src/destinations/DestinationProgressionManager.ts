/**
 * INTERSTELLAR CONTINUUM - Destination Progression & Unlock Manager
 * Authoritative evaluation engine for celestial destination availability,
 * agency rank verification, mission prerequisite gating, and scientific discovery states.
 */

import {
  DestinationId,
  DestinationRecord,
  DestinationUnlockState,
  DiscoveryStatus,
  ExplorationStatus,
  UnlockCondition,
  UnlockConditionType,
  UnlockRequirementStatus,
  DestinationProgressionStatus,
} from './DestinationTypes';

export interface ProgressionContext {
  rank: number;
  rankTitle: string;
  researchPoints: number;
  unlockedTechIds: string[];
  completedMissionIds: string[];
  completedMilestoneIds: string[];
  surveyedDestinationIds: string[];
}

export class DestinationProgressionManager {
  private static instance?: DestinationProgressionManager;
  private defaultContext: ProgressionContext = {
    rank: 1,
    rankTitle: 'RANK 1: JUNIOR FLIGHT CONTROLLER',
    researchPoints: 50,
    unlockedTechIds: ['tech_basic_rocketry', 'tech_suborbital_telemetry'],
    completedMissionIds: [],
    completedMilestoneIds: [],
    surveyedDestinationIds: [DestinationId.EARTH, DestinationId.EARTH_ORBIT_LEO],
  };

  public static getInstance(): DestinationProgressionManager {
    if (!DestinationProgressionManager.instance) {
      DestinationProgressionManager.instance = new DestinationProgressionManager();
    }
    return DestinationProgressionManager.instance;
  }

  public static resetInstance(): void {
    DestinationProgressionManager.instance = undefined;
  }

  /**
   * Sets the global active progression context (e.g. from GameStateManager or SaveService).
   */
  public setContext(context: Partial<ProgressionContext>): void {
    this.defaultContext = {
      ...this.defaultContext,
      ...context,
    };
  }

  public getContext(): Readonly<ProgressionContext> {
    return this.defaultContext;
  }

  /**
   * Evaluates all data-driven unlock conditions for a specific destination.
   */
  public evaluateDestination(
    destination: DestinationRecord,
    customContext?: Partial<ProgressionContext>
  ): DestinationProgressionStatus {
    const ctx: ProgressionContext = {
      ...this.defaultContext,
      ...customContext,
    };

    // If destination is already marked UNLOCKED or AVAILABLE initially (e.g. Earth, LEO, Moon)
    const isExplicitlyUnlocked =
      destination.defaultUnlockState === DestinationUnlockState.UNLOCKED ||
      destination.defaultUnlockState === DestinationUnlockState.AVAILABLE ||
      destination.defaultUnlockState === DestinationUnlockState.UNDER_EXPLORATION ||
      destination.defaultUnlockState === DestinationUnlockState.FULLY_EXPLORED;

    const requirements: UnlockRequirementStatus[] = [];
    let allConditionsMet = true;

    // Evaluate each condition
    if (destination.unlockConditions && destination.unlockConditions.length > 0) {
      for (const cond of destination.unlockConditions) {
        const reqStatus = this.evaluateCondition(cond, ctx);
        requirements.push(reqStatus);
        if (!reqStatus.isMet) {
          allConditionsMet = false;
        }
      }
    } else {
      // Legacy fallback if no unlockConditions array: check requiredDirectorRank
      const rankMet = ctx.rank >= destination.requiredDirectorRank;
      requirements.push({
        condition: {
          type: UnlockConditionType.REQUIRED_RANK,
          targetValue: destination.requiredDirectorRank,
          description: destination.requiredRankTitle,
        },
        description: `Requires ${destination.requiredRankTitle}`,
        isMet: rankMet,
        currentValue: ctx.rank,
        requiredValue: destination.requiredDirectorRank,
        progressPercent: Math.min(100, Math.round((ctx.rank / destination.requiredDirectorRank) * 100)),
      });
      if (!rankMet) {
        allConditionsMet = false;
      }
    }

    const isUnlocked = isExplicitlyUnlocked || allConditionsMet;

    // Calculate overall progress percent
    const overallProgressPercent =
      requirements.length > 0
        ? Math.round(
            requirements.reduce((acc, curr) => acc + curr.progressPercent, 0) / requirements.length
          )
        : isUnlocked
        ? 100
        : 0;

    // Determine state
    let state: DestinationUnlockState = destination.defaultUnlockState;
    if (isUnlocked) {
      state =
        destination.defaultUnlockState === DestinationUnlockState.LOCKED
          ? DestinationUnlockState.AVAILABLE
          : destination.defaultUnlockState;
    } else {
      state = DestinationUnlockState.LOCKED;
    }

    // Determine next milestone summary
    let nextMilestoneSummary = 'Operational for mission flight manifests.';
    if (!isUnlocked) {
      const unmet = requirements.find((r) => !r.isMet);
      if (unmet) {
        nextMilestoneSummary = `Pending Requirement: ${unmet.description} (${unmet.currentValue} / ${unmet.requiredValue})`;
      } else {
        nextMilestoneSummary = destination.unlockRequirementsText;
      }
    }

    return {
      destinationId: destination.id,
      isUnlocked,
      unlockState: state,
      discoveryStatus: isUnlocked ? DiscoveryStatus.SURVEYED : DiscoveryStatus.DETECTED,
      explorationStatus: isUnlocked ? destination.explorationStatus : ExplorationStatus.UNVISITED,
      requirements,
      overallProgressPercent,
      nextMilestoneSummary,
    };
  }

  private evaluateCondition(cond: UnlockCondition, ctx: ProgressionContext): UnlockRequirementStatus {
    switch (cond.type) {
      case UnlockConditionType.REQUIRED_RANK: {
        const required = Number(cond.targetValue);
        const current = ctx.rank;
        const isMet = current >= required;
        const progressPercent = Math.min(100, Math.round((current / required) * 100));
        return {
          condition: cond,
          description: cond.description,
          isMet,
          currentValue: `Rank ${current}`,
          requiredValue: `Rank ${required}`,
          progressPercent,
        };
      }

      case UnlockConditionType.REQUIRED_RESEARCH_POINTS: {
        const required = Number(cond.targetValue);
        const current = ctx.researchPoints;
        const isMet = current >= required;
        const progressPercent = Math.min(100, Math.round((current / required) * 100));
        return {
          condition: cond,
          description: cond.description,
          isMet,
          currentValue: `${current} Data`,
          requiredValue: `${required} Data`,
          progressPercent,
        };
      }

      case UnlockConditionType.REQUIRED_TECH: {
        const techId = String(cond.targetId ?? cond.targetValue);
        const isMet = ctx.unlockedTechIds.includes(techId);
        return {
          condition: cond,
          description: cond.description,
          isMet,
          currentValue: isMet ? 'Researched' : 'Unresearched',
          requiredValue: 'Researched',
          progressPercent: isMet ? 100 : 0,
        };
      }

      case UnlockConditionType.COMPLETED_MISSION: {
        const missionId = String(cond.targetId ?? cond.targetValue);
        const isMet = ctx.completedMissionIds.includes(missionId);
        return {
          condition: cond,
          description: cond.description,
          isMet,
          currentValue: isMet ? 'Completed' : 'Pending',
          requiredValue: 'Completed',
          progressPercent: isMet ? 100 : 0,
        };
      }

      case UnlockConditionType.COMPLETED_MILESTONE: {
        const milestoneId = String(cond.targetId ?? cond.targetValue);
        const isMet = ctx.completedMilestoneIds.includes(milestoneId);
        return {
          condition: cond,
          description: cond.description,
          isMet,
          currentValue: isMet ? 'Achieved' : 'Unachieved',
          requiredValue: 'Achieved',
          progressPercent: isMet ? 100 : 0,
        };
      }

      case UnlockConditionType.PREREQUISITE_DESTINATION_SURVEYED: {
        const destId = String(cond.targetId ?? cond.targetValue);
        const isMet = ctx.surveyedDestinationIds.includes(destId);
        return {
          condition: cond,
          description: cond.description,
          isMet,
          currentValue: isMet ? 'Surveyed' : 'Unsurveyed',
          requiredValue: 'Surveyed',
          progressPercent: isMet ? 100 : 0,
        };
      }

      default:
        return {
          condition: cond,
          description: cond.description,
          isMet: true,
          currentValue: 'OK',
          requiredValue: 'OK',
          progressPercent: 100,
        };
    }
  }
}
