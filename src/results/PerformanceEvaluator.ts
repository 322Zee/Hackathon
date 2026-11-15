/**
 * INTERSTELLAR CONTINUUM - Mission Performance Evaluator
 * High-level evaluator that orchestrates scoring, grading, feedback generation,
 * and comprehensive result record construction for completed, partial, or failed missions.
 */

import {
  MissionEvaluationInput,
  MissionResultRecord,
  MissionCompletionStatus,
  EvaluatedObjective,
  ScoringCategory,
} from './ResultsTypes';
import { ScoringEngine } from './ScoringEngine';
import { RewardCalculator } from './RewardCalculator';
import { ResultsEventBus } from './ResultsEventBus';

export class PerformanceEvaluator {
  private scoringEngine: ScoringEngine;
  private rewardCalculator: RewardCalculator;
  private eventBus?: ResultsEventBus;

  constructor(
    scoringEngine?: ScoringEngine,
    rewardCalculator?: RewardCalculator,
    eventBus?: ResultsEventBus
  ) {
    this.scoringEngine = scoringEngine ?? new ScoringEngine();
    this.rewardCalculator = rewardCalculator ?? new RewardCalculator(undefined, undefined, eventBus);
    this.eventBus = eventBus;
  }

  public setEventBus(eventBus?: ResultsEventBus): void {
    this.eventBus = eventBus;
    this.rewardCalculator.setEventBus(eventBus);
  }

  public getScoringEngine(): ScoringEngine {
    return this.scoringEngine;
  }

  public getRewardCalculator(): RewardCalculator {
    return this.rewardCalculator;
  }

  /**
   * Evaluates a completed, cancelled, or failed mission and generates a complete,
   * permanent, and serializable MissionResultRecord.
   */
  public evaluateMission(input: MissionEvaluationInput): MissionResultRecord {
    if (this.eventBus) {
      this.eventBus.emit('MissionEvaluationStarted', {
        missionId: input.missionId,
        missionName: input.missionName,
        timestamp: Date.now(),
      });
    }

    // 1. Determine final completion status
    const completionStatus = this.determineCompletionStatus(input);

    // 2. Compute scoring & feedback via ScoringEngine
    const scoreResult = this.scoringEngine.calculateMissionScore({
      ...input,
      status: completionStatus,
    });

    // 3. Enforce realistic caps based on completion status
    let finalScore = scoreResult.finalScore;
    if (completionStatus === MissionCompletionStatus.FAILED) {
      finalScore = Math.min(35, finalScore);
    } else if (completionStatus === MissionCompletionStatus.CANCELLED) {
      finalScore = Math.min(55, finalScore);
    } else if (completionStatus === MissionCompletionStatus.PARTIALLY_COMPLETED) {
      finalScore = Math.min(79, finalScore);
    }

    // 4. Compute performance grade
    const gradeInfo = this.scoringEngine.calculatePerformanceGrade(finalScore);

    // 5. Calculate rewards and penalties
    const { rewards, penalties } = this.rewardCalculator.calculateMissionRewards(
      {
        ...input,
        status: completionStatus,
      },
      finalScore,
      gradeInfo.grade
    );

    // 5. Partition completed vs missed objectives
    const objectivesCompleted: EvaluatedObjective[] = [];
    const objectivesMissed: EvaluatedObjective[] = [];

    for (const obj of scoreResult.evaluatedObjectives) {
      if (obj.isCompleted) {
        objectivesCompleted.push(obj);
      } else {
        objectivesMissed.push(obj);
      }
    }

    // 6. Calculate formatted duration
    const durationSeconds = input.actualDurationSeconds ?? (input.estimatedDurationDays ? input.estimatedDurationDays * 86400 : 86400 * 2);
    const durationDays = Math.round((durationSeconds / 86400) * 10) / 10;
    const durationFormatted = this.formatDuration(durationSeconds);

    // 7. Extract specific category breakdown references
    const objectivesScore = scoreResult.breakdown.find((c) => c.category === ScoringCategory.MISSION_OBJECTIVES)!;
    const engineeringScore = scoreResult.breakdown.find((c) => c.category === ScoringCategory.ENGINEERING_EFFICIENCY)!;
    const budgetScore = scoreResult.breakdown.find((c) => c.category === ScoringCategory.BUDGET_MANAGEMENT)!;
    const scienceScore = scoreResult.breakdown.find((c) => c.category === ScoringCategory.SCIENTIFIC_CONTRIBUTION)!;
    const reliabilityScore = scoreResult.breakdown.find((c) => c.category === ScoringCategory.RELIABILITY)!;

    // 8. Generate unique result identifier
    const uniqueResultId = `RES_${input.missionId.toUpperCase()}_${Date.now()}`;

    // 9. Assemble complete authoritative record
    const resultRecord: MissionResultRecord = {
      id: uniqueResultId,
      missionId: input.missionId,
      missionName: input.missionName,
      shortCode: input.shortCode,
      missionType: input.category,
      destination: input.destinationId,
      completionStatus,
      completionTimestamp: input.endTimeTimestamp ?? Date.now(),
      missionDurationFormatted: durationFormatted,
      missionDurationSeconds: durationSeconds,
      missionDurationDays: durationDays,
      objectivesCompleted,
      objectivesMissed,
      finalPerformanceScore: finalScore,
      performanceGrade: gradeInfo.grade,
      gradeLetter: gradeInfo.letter,
      gradeLabel: gradeInfo.label,
      rewardSummary: rewards,
      penaltySummary: penalties,
      scientificContribution: scienceScore,
      engineeringEfficiency: engineeringScore,
      budgetPerformance: budgetScore,
      reliabilityRating: reliabilityScore,
      missionObjectivesScore: objectivesScore,
      performanceFeedback: scoreResult.feedback,
      categoryBreakdown: scoreResult.breakdown,
      isArchived: true,
      isClaimed: false,
      recoveredFromFailure: input.recoveredFromFailure ?? false,
    };

    // 10. Emit completion events
    if (this.eventBus) {
      this.eventBus.emit('MissionEvaluationCompleted', {
        resultId: resultRecord.id,
        missionId: input.missionId,
        score: resultRecord.finalPerformanceScore,
        grade: resultRecord.gradeLetter,
        timestamp: Date.now(),
      });

      this.eventBus.emit('MissionResultsGenerated', {
        result: { ...resultRecord },
        timestamp: Date.now(),
      });
    }

    return resultRecord;
  }

  private determineCompletionStatus(input: MissionEvaluationInput): MissionCompletionStatus {
    if (input.status) {
      return input.status;
    }
    if (input.isFailed) {
      return MissionCompletionStatus.FAILED;
    }
    if (input.isCancelled) {
      return MissionCompletionStatus.CANCELLED;
    }

    const mandatory = (input.objectives || []).filter((o) => o.isMandatory !== false);
    if (mandatory.length === 0) {
      return MissionCompletionStatus.COMPLETED;
    }

    const allMandatoryDone = mandatory.every((o) => o.isCompleted || (o.currentProgress ?? 0) >= 100);
    const anyMandatoryDone = mandatory.some((o) => o.isCompleted || (o.currentProgress ?? 0) >= 100);

    if (allMandatoryDone) {
      return MissionCompletionStatus.COMPLETED;
    } else if (anyMandatoryDone) {
      return MissionCompletionStatus.PARTIALLY_COMPLETED;
    } else {
      return MissionCompletionStatus.FAILED;
    }
  }

  private formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
