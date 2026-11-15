/**
 * INTERSTELLAR CONTINUUM - Mission Results Manager
 * Authoritative central singleton coordinating mission performance evaluation,
 * transparent score calculations, performance grade attribution, reward claims,
 * permanent history archiving, and organisational milestone submissions.
 */

import {
  MissionEvaluationInput,
  MissionResultRecord,
  PerformanceGrade,
  MissionRewardSummary,
  MissionPenaltySummary,
  CategoryScoreResult,
  OrganisationalMilestone,
  MissionHistoryFilter,
  PerformanceComparison,
} from './ResultsTypes';
import { ScoringEngine } from './ScoringEngine';
import { RewardCalculator } from './RewardCalculator';
import { PerformanceEvaluator } from './PerformanceEvaluator';
import { MissionHistoryArchive } from './MissionResultsArchive';
import { ResultsEventBus } from './ResultsEventBus';
import { ResultsEconomyAdapter } from './adapters/EconomyAdapter';
import { ResultsProgressionAdapter } from './adapters/ProgressionAdapter';
import { ResultsObjectivesAdapter } from './adapters/ObjectivesAdapter';
import { ResultsScienceAdapter } from './adapters/ScienceAdapter';
import { ResultsSimulationAdapter } from './adapters/SimulationAdapter';
import { ResultsPersistenceAdapter } from './adapters/PersistenceAdapter';
import { EventBus } from '../core/EventBus';

export class MissionResultsManager {
  private static instance?: MissionResultsManager;

  public readonly eventBus: ResultsEventBus;
  public readonly scoringEngine: ScoringEngine;
  public readonly rewardCalculator: RewardCalculator;
  public readonly performanceEvaluator: PerformanceEvaluator;
  public readonly historyArchive: MissionHistoryArchive;

  // Adapters
  public readonly economyAdapter: ResultsEconomyAdapter;
  public readonly progressionAdapter: ResultsProgressionAdapter;
  public readonly objectivesAdapter: ResultsObjectivesAdapter;
  public readonly scienceAdapter: ResultsScienceAdapter;
  public readonly simulationAdapter: ResultsSimulationAdapter;
  public readonly persistenceAdapter: ResultsPersistenceAdapter;

  constructor(coreEventBus?: EventBus) {
    this.eventBus = new ResultsEventBus(coreEventBus);
    this.economyAdapter = new ResultsEconomyAdapter();
    this.progressionAdapter = new ResultsProgressionAdapter(this.eventBus);
    this.objectivesAdapter = new ResultsObjectivesAdapter();
    this.scienceAdapter = new ResultsScienceAdapter();
    this.simulationAdapter = new ResultsSimulationAdapter();
    this.persistenceAdapter = new ResultsPersistenceAdapter();

    this.scoringEngine = new ScoringEngine();
    this.rewardCalculator = new RewardCalculator(
      this.economyAdapter,
      this.progressionAdapter,
      this.eventBus
    );
    this.performanceEvaluator = new PerformanceEvaluator(
      this.scoringEngine,
      this.rewardCalculator,
      this.eventBus
    );
    this.historyArchive = new MissionHistoryArchive(
      this.persistenceAdapter,
      this.progressionAdapter,
      this.eventBus
    );
  }

  public static getInstance(coreEventBus?: EventBus): MissionResultsManager {
    if (!MissionResultsManager.instance) {
      MissionResultsManager.instance = new MissionResultsManager(coreEventBus);
    } else if (coreEventBus) {
      MissionResultsManager.instance.setCoreEventBus(coreEventBus);
    }
    return MissionResultsManager.instance;
  }

  public static resetInstance(): void {
    if (MissionResultsManager.instance) {
      MissionResultsManager.instance.reset();
      MissionResultsManager.instance = undefined;
    }
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.eventBus.setCoreEventBus(coreEventBus);
  }

  public reset(): void {
    this.historyArchive.clear();
  }

  // ==========================================
  // Section 12 Public Integration API
  // ==========================================

  /**
   * Evaluates a completed, cancelled, or failed mission, saves the result to the permanent archive,
   * and returns the authoritative MissionResultRecord.
   */
  public evaluateMission(input: MissionEvaluationInput): MissionResultRecord {
    const result = this.performanceEvaluator.evaluateMission(input);
    this.historyArchive.addResult(result);
    return result;
  }

  /**
   * Transparently calculates the numeric score, category breakdown, and feedback.
   */
  public calculateMissionScore(input: MissionEvaluationInput): {
    finalScore: number;
    breakdown: CategoryScoreResult[];
    feedback: any;
  } {
    return this.scoringEngine.calculateMissionScore(input);
  }

  /**
   * Determines the authoritative performance grade for a given score.
   */
  public calculatePerformanceGrade(score: number): {
    grade: PerformanceGrade;
    letter: string;
    label: string;
    description: string;
    reasons: string[];
  } {
    return this.scoringEngine.calculatePerformanceGrade(score);
  }

  /**
   * Generates a result record without necessarily committing to archive immediately.
   */
  public generateMissionResults(input: MissionEvaluationInput): MissionResultRecord {
    return this.performanceEvaluator.evaluateMission(input);
  }

  /**
   * Retrieves a mission result record by its unique results identifier.
   */
  public getMissionResults(resultId: string): MissionResultRecord | undefined {
    return this.historyArchive.getResult(resultId);
  }

  /**
   * Lists historical mission result records with optional filtering and search.
   */
  public listMissionHistory(filter?: MissionHistoryFilter): MissionResultRecord[] {
    if (!filter) {
      return this.historyArchive.getAllResults();
    }
    return this.historyArchive.filterHistory(filter);
  }

  /**
   * Computes expected rewards and penalties for a mission evaluation input.
   */
  public calculateMissionRewards(
    input: MissionEvaluationInput,
    finalScore: number,
    grade: PerformanceGrade
  ): { rewards: MissionRewardSummary; penalties: MissionPenaltySummary } {
    return this.rewardCalculator.calculateMissionRewards(input, finalScore, grade);
  }

  /**
   * Authoritatively claims and disburses mission rewards to economy and progression.
   * Enforces strict duplicate claim prevention.
   */
  public claimMissionRewards(
    resultId: string,
    missionId?: string,
    rewards?: MissionRewardSummary,
    penalties?: MissionPenaltySummary
  ): { success: boolean; alreadyClaimed: boolean; message: string } {
    const record = this.historyArchive.getResult(resultId);

    const targetMissionId = missionId ?? record?.missionId ?? 'UNKNOWN_MISSION';
    const targetRewards = rewards ?? record?.rewardSummary;
    const targetPenalties = penalties ?? record?.penaltySummary;

    if (!targetRewards) {
      return {
        success: false,
        alreadyClaimed: false,
        message: `No rewards found to claim for result ID: "${resultId}".`,
      };
    }

    const claimResult = this.rewardCalculator.claimMissionRewards(
      resultId,
      targetMissionId,
      targetRewards,
      targetPenalties
    );

    if (claimResult.success && record) {
      record.isClaimed = true;
      record.rewardSummary.isClaimed = true;
      record.rewardSummary.claimedTimestamp = Date.now();
      this.historyArchive.addResult(record); // update persisted record
    }

    return claimResult;
  }

  /**
   * Retrieves the detailed 5-category scoring breakdown for a specific result or input.
   */
  public getPerformanceBreakdown(resultOrInput: string | MissionEvaluationInput): CategoryScoreResult[] {
    if (typeof resultOrInput === 'string') {
      const record = this.historyArchive.getResult(resultOrInput);
      return record ? record.categoryBreakdown : [];
    } else {
      const calc = this.scoringEngine.calculateMissionScore(resultOrInput);
      return calc.breakdown;
    }
  }

  /**
   * Retrieves all registered organisational exploration & agency milestones.
   */
  public getOrganisationalMilestones(): OrganisationalMilestone[] {
    return this.progressionAdapter.getMilestones();
  }

  /**
   * Submits a verified achievement or milestone for validation and credit.
   */
  public submitAchievement(
    milestoneId: string,
    missionId: string
  ): { success: boolean; milestone?: OrganisationalMilestone; reason?: string } {
    return this.progressionAdapter.submitAchievement(milestoneId, missionId);
  }

  /**
   * Deep comparative analysis between two historical mission results.
   */
  public comparePerformances(resultIdA: string, resultIdB: string): PerformanceComparison | null {
    return this.historyArchive.comparePerformances(resultIdA, resultIdB);
  }
}
