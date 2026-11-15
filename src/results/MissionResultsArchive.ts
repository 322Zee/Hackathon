/**
 * INTERSTELLAR CONTINUUM - Mission History & Results Archive
 * Centralized permanent registry of all historical mission outcomes.
 * Supports filtering, searching, deep comparative performance analysis,
 * and persistence across game restarts.
 */

import {
  MissionResultRecord,
  MissionHistoryFilter,
  PerformanceComparison,
  ScoringCategory,
  OrganisationalMilestone,
} from './ResultsTypes';
import { ResultsPersistenceAdapter } from './adapters/PersistenceAdapter';
import { ResultsProgressionAdapter } from './adapters/ProgressionAdapter';
import { ResultsEventBus } from './ResultsEventBus';

export class MissionHistoryArchive {
  private records: Map<string, MissionResultRecord> = new Map();
  private persistenceAdapter: ResultsPersistenceAdapter;
  private progressionAdapter: ResultsProgressionAdapter;
  private eventBus?: ResultsEventBus;

  constructor(
    persistenceAdapter?: ResultsPersistenceAdapter,
    progressionAdapter?: ResultsProgressionAdapter,
    eventBus?: ResultsEventBus
  ) {
    this.persistenceAdapter = persistenceAdapter ?? new ResultsPersistenceAdapter();
    this.progressionAdapter = progressionAdapter ?? new ResultsProgressionAdapter(eventBus);
    this.eventBus = eventBus;
    this.loadFromStorage();
  }

  public setEventBus(eventBus?: ResultsEventBus): void {
    this.eventBus = eventBus;
    this.progressionAdapter.setEventBus(eventBus);
  }

  public getProgressionAdapter(): ResultsProgressionAdapter {
    return this.progressionAdapter;
  }

  public setProgressionAdapter(progression: ResultsProgressionAdapter): void {
    this.progressionAdapter = progression;
  }

  public getPersistenceAdapter(): ResultsPersistenceAdapter {
    return this.persistenceAdapter;
  }

  public setPersistenceAdapter(persistence: ResultsPersistenceAdapter): void {
    this.persistenceAdapter = persistence;
  }

  /**
   * Adds or updates a mission result record in the permanent archive.
   */
  public addResult(result: MissionResultRecord): void {
    this.records.set(result.id, { ...result });
    this.saveToStorage();

    if (this.eventBus) {
      this.eventBus.emit('MissionHistoryUpdated', {
        totalArchived: this.records.size,
        latestResultId: result.id,
        timestamp: Date.now(),
      });
    }
  }

  public getResult(resultId: string): MissionResultRecord | undefined {
    const res = this.records.get(resultId);
    return res ? { ...res } : undefined;
  }

  public getAllResults(): MissionResultRecord[] {
    return Array.from(this.records.values()).sort(
      (a, b) => b.completionTimestamp - a.completionTimestamp
    );
  }

  public getResultsForMission(missionId: string): MissionResultRecord[] {
    return this.getAllResults().filter((r) => r.missionId === missionId);
  }

  /**
   * Filters and searches mission archive records.
   */
  public filterHistory(filter: MissionHistoryFilter): MissionResultRecord[] {
    let list = this.getAllResults();

    if (filter.destination) {
      list = list.filter((r) => r.destination === filter.destination);
    }

    if (filter.missionType) {
      list = list.filter((r) => r.missionType === filter.missionType);
    }

    if (filter.performanceGrade) {
      list = list.filter((r) => r.performanceGrade === filter.performanceGrade);
    }

    if (filter.completionStatus) {
      list = list.filter((r) => r.completionStatus === filter.completionStatus);
    }

    if (typeof filter.minScore === 'number') {
      list = list.filter((r) => r.finalPerformanceScore >= filter.minScore!);
    }

    if (filter.startDate) {
      list = list.filter((r) => r.completionTimestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      list = list.filter((r) => r.completionTimestamp <= filter.endDate!);
    }

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.missionName.toLowerCase().includes(q) ||
          r.missionId.toLowerCase().includes(q) ||
          (r.shortCode && r.shortCode.toLowerCase().includes(q)) ||
          r.destination.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Compares two mission performance records in detail.
   */
  public comparePerformances(resultIdA: string, resultIdB: string): PerformanceComparison | null {
    const a = this.getResult(resultIdA);
    const b = this.getResult(resultIdB);

    if (!a || !b) return null;

    const scoreDiff = Math.round((a.finalPerformanceScore - b.finalPerformanceScore) * 10) / 10;
    const isHigher =
      a.finalPerformanceScore > b.finalPerformanceScore
        ? 'A'
        : a.finalPerformanceScore < b.finalPerformanceScore
        ? 'B'
        : 'EQUAL';

    const categoryDeltas: Record<ScoringCategory, { scoreA: number; scoreB: number; delta: number }> = {
      [ScoringCategory.MISSION_OBJECTIVES]: {
        scoreA: a.missionObjectivesScore.score,
        scoreB: b.missionObjectivesScore.score,
        delta: Math.round((a.missionObjectivesScore.score - b.missionObjectivesScore.score) * 10) / 10,
      },
      [ScoringCategory.ENGINEERING_EFFICIENCY]: {
        scoreA: a.engineeringEfficiency.score,
        scoreB: b.engineeringEfficiency.score,
        delta: Math.round((a.engineeringEfficiency.score - b.engineeringEfficiency.score) * 10) / 10,
      },
      [ScoringCategory.BUDGET_MANAGEMENT]: {
        scoreA: a.budgetPerformance.score,
        scoreB: b.budgetPerformance.score,
        delta: Math.round((a.budgetPerformance.score - b.budgetPerformance.score) * 10) / 10,
      },
      [ScoringCategory.SCIENTIFIC_CONTRIBUTION]: {
        scoreA: a.scientificContribution.score,
        scoreB: b.scientificContribution.score,
        delta: Math.round((a.scientificContribution.score - b.scientificContribution.score) * 10) / 10,
      },
      [ScoringCategory.RELIABILITY]: {
        scoreA: a.reliabilityRating.score,
        scoreB: b.reliabilityRating.score,
        delta: Math.round((a.reliabilityRating.score - b.reliabilityRating.score) * 10) / 10,
      },
    };

    const durationDiffDays = Math.round((a.missionDurationDays - b.missionDurationDays) * 10) / 10;
    const budgetA = (a.budgetPerformance.metrics.actualCostCredits as number) || 0;
    const budgetB = (b.budgetPerformance.metrics.actualCostCredits as number) || 0;
    const budgetDiffCredits = budgetA - budgetB;

    const scienceA = (a.scientificContribution.metrics.collectedDataPoints as number) || 0;
    const scienceB = (b.scientificContribution.metrics.collectedDataPoints as number) || 0;
    const scienceDiff = scienceA - scienceB;

    let summary = '';
    if (scoreDiff > 0) {
      summary = `Flight "${a.missionName}" outperformed "${b.missionName}" by +${scoreDiff} points, demonstrating superior ${this.findBestDeltaCategory(categoryDeltas)}.`;
    } else if (scoreDiff < 0) {
      summary = `Flight "${b.missionName}" outperformed "${a.missionName}" by +${Math.abs(scoreDiff)} points due to stronger ${this.findBestDeltaCategory(categoryDeltas, true)}.`;
    } else {
      summary = `Both flight evaluations concluded with identical overall performance (${a.finalPerformanceScore} pts).`;
    }

    return {
      missionA: a,
      missionB: b,
      scoreDifference: scoreDiff,
      gradeComparison: {
        gradeA: a.performanceGrade,
        gradeB: b.performanceGrade,
        isHigher,
      },
      categoryDeltas,
      durationDifferenceDays: durationDiffDays,
      budgetDifferenceCredits: budgetDiffCredits,
      scienceDifferencePoints: scienceDiff,
      summary,
    };
  }

  private findBestDeltaCategory(
    deltas: Record<ScoringCategory, { scoreA: number; scoreB: number; delta: number }>,
    findLowest: boolean = false
  ): string {
    let chosen = ScoringCategory.MISSION_OBJECTIVES;
    let chosenVal = deltas[ScoringCategory.MISSION_OBJECTIVES].delta;

    for (const [cat, data] of Object.entries(deltas)) {
      if (findLowest) {
        if (data.delta < chosenVal) {
          chosenVal = data.delta;
          chosen = cat as ScoringCategory;
        }
      } else {
        if (data.delta > chosenVal) {
          chosenVal = data.delta;
          chosen = cat as ScoringCategory;
        }
      }
    }

    switch (chosen) {
      case ScoringCategory.MISSION_OBJECTIVES:
        return 'objective fulfillment';
      case ScoringCategory.ENGINEERING_EFFICIENCY:
        return 'engineering efficiency';
      case ScoringCategory.BUDGET_MANAGEMENT:
        return 'budget management';
      case ScoringCategory.SCIENTIFIC_CONTRIBUTION:
        return 'scientific data return';
      case ScoringCategory.RELIABILITY:
        return 'operational reliability';
    }
  }

  public getOrganisationalMilestones(): OrganisationalMilestone[] {
    return this.progressionAdapter.getMilestones();
  }

  public getUnlockedMilestones(): OrganisationalMilestone[] {
    return this.progressionAdapter.getUnlockedMilestones();
  }

  public countTotal(): number {
    return this.records.size;
  }

  public clear(): void {
    this.records.clear();
    this.persistenceAdapter.clearStorage();
  }

  private saveToStorage(): void {
    const claimedIds = new Set<string>();
    for (const [id, r] of this.records.entries()) {
      if (r.isClaimed || r.rewardSummary.isClaimed) {
        claimedIds.add(id);
      }
    }

    const unlockedMilestones = this.progressionAdapter
      .getUnlockedMilestones()
      .map((m) => m.id);

    this.persistenceAdapter.saveResults(this.records, claimedIds, unlockedMilestones);
  }

  private loadFromStorage(): void {
    const { results, claimedIds, unlockedMilestones } = this.persistenceAdapter.loadResults();
    this.records = results;

    // Synchronize claimed flags
    for (const id of claimedIds) {
      const rec = this.records.get(id);
      if (rec) {
        rec.isClaimed = true;
        rec.rewardSummary.isClaimed = true;
      }
    }

    // Synchronize milestones
    this.progressionAdapter.importState({
      unlockedMilestoneIds: unlockedMilestones,
    });
  }
}
