/**
 * INTERSTELLAR CONTINUUM - Mission History Archive Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MissionHistoryArchive } from '../../src/results/MissionResultsArchive';
import { ResultsPersistenceAdapter } from '../../src/results/adapters/PersistenceAdapter';
import { ResultsProgressionAdapter } from '../../src/results/adapters/ProgressionAdapter';
import { ResultsEventBus } from '../../src/results/ResultsEventBus';
import {
  MissionResultRecord,
  MissionCompletionStatus,
  PerformanceGrade,
  ScoringCategory,
} from '../../src/results/ResultsTypes';

describe('MissionHistoryArchive', () => {
  let archive: MissionHistoryArchive;
  let persistence: ResultsPersistenceAdapter;
  let progression: ResultsProgressionAdapter;
  let eventBus: ResultsEventBus;

  const createDummyResult = (
    id: string,
    missionId: string,
    missionName: string,
    destination: string,
    category: string,
    status: MissionCompletionStatus,
    score: number,
    grade: PerformanceGrade,
    timestamp: number = Date.now()
  ): MissionResultRecord => {
    const dummyCat = (cat: ScoringCategory, s: number, max: number) => ({
      category: cat,
      categoryLabel: cat,
      score: s,
      maxScore: max,
      percentage: Math.round((s / max) * 100),
      weight: max,
      items: [],
      feedback: [],
      metrics: {
        actualCostCredits: 400000,
        collectedDataPoints: 100,
      },
    });

    const categoryBreakdown = [
      dummyCat(ScoringCategory.MISSION_OBJECTIVES, Math.round(score * 0.3), 30),
      dummyCat(ScoringCategory.ENGINEERING_EFFICIENCY, Math.round(score * 0.25), 25),
      dummyCat(ScoringCategory.BUDGET_MANAGEMENT, Math.round(score * 0.2), 20),
      dummyCat(ScoringCategory.SCIENTIFIC_CONTRIBUTION, Math.round(score * 0.15), 15),
      dummyCat(ScoringCategory.RELIABILITY, Math.round(score * 0.1), 10),
    ];

    return {
      id,
      missionId,
      missionName,
      shortCode: `[${missionId.toUpperCase()}]`,
      missionType: category,
      destination,
      completionStatus: status,
      completionTimestamp: timestamp,
      missionDurationFormatted: '2d 04h',
      missionDurationSeconds: 86400 * 2,
      missionDurationDays: 2.2,
      objectivesCompleted: [],
      objectivesMissed: [],
      finalPerformanceScore: score,
      performanceGrade: grade,
      gradeLetter: grade === PerformanceGrade.EXCEPTIONAL ? 'S' : 'B',
      gradeLabel: grade,
      rewardSummary: {
        credits: 100000,
        researchData: 50,
        rawMaterials: 10,
        technologyPoints: 5,
        agencyPrestige: 20,
        unlockedMissionIds: [],
        unlockedEquipment: [],
        rankProgressPoints: 30,
        isClaimed: false,
      },
      penaltySummary: {
        budgetOverrunCredits: 0,
        structuralDamageCredits: 0,
        reputationLoss: 0,
        penaltyReasons: [],
      },
      scientificContribution: categoryBreakdown[3],
      engineeringEfficiency: categoryBreakdown[1],
      budgetPerformance: categoryBreakdown[2],
      reliabilityRating: categoryBreakdown[4],
      missionObjectivesScore: categoryBreakdown[0],
      performanceFeedback: {
        strengths: ['Nominal burns'],
        areasForImprovement: [],
        engineeringFeedback: 'OK',
        budgetFeedback: 'OK',
        scientificFeedback: 'OK',
        reliabilityFeedback: 'OK',
        executiveSummary: 'Nominal flight',
      },
      categoryBreakdown,
      isArchived: true,
      isClaimed: false,
    };
  };

  beforeEach(() => {
    persistence = new ResultsPersistenceAdapter();
    persistence.clearStorage();
    eventBus = new ResultsEventBus();
    progression = new ResultsProgressionAdapter(eventBus);
    archive = new MissionHistoryArchive(persistence, progression, eventBus);
  });

  describe('Storage & Retrieval', () => {
    it('stores results and emits MissionHistoryUpdated event', () => {
      let eventFired = false;
      eventBus.on('MissionHistoryUpdated', () => {
        eventFired = true;
      });

      const res = createDummyResult(
        'RES_1',
        'M1',
        'Lunar Prospector',
        'DEST_MOON',
        'SCIENTIFIC_EXPLORATION',
        MissionCompletionStatus.COMPLETED,
        94,
        PerformanceGrade.EXCEPTIONAL
      );

      archive.addResult(res);
      expect(archive.countTotal()).toBe(1);
      expect(archive.getResult('RES_1')?.missionName).toBe('Lunar Prospector');
      expect(eventFired).toBe(true);
    });

    it('retrieves all results sorted chronologically descending', () => {
      const r1 = createDummyResult('R1', 'M1', 'Early Flight', 'DEST_MOON', 'TRANSPORT', MissionCompletionStatus.COMPLETED, 80, PerformanceGrade.EXCELLENT, 1000);
      const r2 = createDummyResult('R2', 'M2', 'Later Flight', 'DEST_MARS', 'SCIENCE', MissionCompletionStatus.COMPLETED, 90, PerformanceGrade.EXCEPTIONAL, 2000);

      archive.addResult(r1);
      archive.addResult(r2);

      const all = archive.getAllResults();
      expect(all.length).toBe(2);
      expect(all[0].id).toBe('R2'); // Most recent first
      expect(all[1].id).toBe('R1');
    });
  });

  describe('Filtering & Searching', () => {
    beforeEach(() => {
      archive.addResult(createDummyResult('RES_MOON_1', 'M_MOON', 'Artemis Cargo', 'DEST_MOON', 'TRANSPORTATION', MissionCompletionStatus.COMPLETED, 92, PerformanceGrade.EXCEPTIONAL));
      archive.addResult(createDummyResult('RES_MARS_1', 'M_MARS', 'Ares Rover Delivery', 'DEST_MARS', 'COMBINED', MissionCompletionStatus.PARTIALLY_COMPLETED, 75, PerformanceGrade.GOOD));
      archive.addResult(createDummyResult('RES_VENUS_1', 'M_VENUS', 'Aphrodite Atmospheric Probe', 'DEST_VENUS', 'SCIENTIFIC_EXPLORATION', MissionCompletionStatus.FAILED, 25, PerformanceGrade.UNSUCCESSFUL));
    });

    it('filters records by destination', () => {
      const moonResults = archive.filterHistory({ destination: 'DEST_MOON' });
      expect(moonResults.length).toBe(1);
      expect(moonResults[0].id).toBe('RES_MOON_1');
    });

    it('filters records by mission type / category', () => {
      const scienceResults = archive.filterHistory({ missionType: 'SCIENTIFIC_EXPLORATION' });
      expect(scienceResults.length).toBe(1);
      expect(scienceResults[0].id).toBe('RES_VENUS_1');
    });

    it('filters records by completion status', () => {
      const failed = archive.filterHistory({ completionStatus: MissionCompletionStatus.FAILED });
      expect(failed.length).toBe(1);
      expect(failed[0].missionName).toContain('Aphrodite');
    });

    it('filters records by performance grade', () => {
      const exceptional = archive.filterHistory({ performanceGrade: PerformanceGrade.EXCEPTIONAL });
      expect(exceptional.length).toBe(1);
      expect(exceptional[0].id).toBe('RES_MOON_1');
    });

    it('searches records by name or query string', () => {
      const queryResults = archive.filterHistory({ searchQuery: 'rover' });
      expect(queryResults.length).toBe(1);
      expect(queryResults[0].id).toBe('RES_MARS_1');
    });
  });

  describe('Deep Performance Comparison', () => {
    it('compares two mission results side-by-side with score diffs and category deltas', () => {
      const rA = createDummyResult('R_A', 'M1', 'Apollo 11', 'DEST_MOON', 'TRANSPORTATION', MissionCompletionStatus.COMPLETED, 95, PerformanceGrade.EXCEPTIONAL);
      const rB = createDummyResult('R_B', 'M2', 'Apollo 12', 'DEST_MOON', 'TRANSPORTATION', MissionCompletionStatus.COMPLETED, 85, PerformanceGrade.EXCELLENT);

      archive.addResult(rA);
      archive.addResult(rB);

      const comparison = archive.comparePerformances('R_A', 'R_B');
      expect(comparison).not.toBeNull();
      expect(comparison?.scoreDifference).toBe(10);
      expect(comparison?.gradeComparison.isHigher).toBe('A');
      expect(comparison?.categoryDeltas[ScoringCategory.MISSION_OBJECTIVES]).toBeDefined();
      expect(comparison?.summary).toContain('Apollo 11');
    });

    it('returns null if either compared mission result does not exist', () => {
      expect(archive.comparePerformances('UNKNOWN_1', 'UNKNOWN_2')).toBeNull();
    });
  });

  describe('Persistence Across Game Restarts', () => {
    it('serializes results to storage and restores them in a fresh archive instance', () => {
      const res = createDummyResult('RES_PERSIST_1', 'M_P1', 'Persisted Flight', 'DEST_MOON', 'COMBINED', MissionCompletionStatus.COMPLETED, 88, PerformanceGrade.EXCELLENT);
      archive.addResult(res);

      // Spin up brand new archive pointing to same persistence adapter
      const restoredArchive = new MissionHistoryArchive(persistence, progression, eventBus);
      expect(restoredArchive.countTotal()).toBe(1);
      const restoredRecord = restoredArchive.getResult('RES_PERSIST_1');
      expect(restoredRecord).toBeDefined();
      expect(restoredRecord?.missionName).toBe('Persisted Flight');
      expect(restoredRecord?.finalPerformanceScore).toBe(88);
    });
  });
});
