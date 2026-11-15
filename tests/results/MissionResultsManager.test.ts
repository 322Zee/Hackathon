/**
 * INTERSTELLAR CONTINUUM - Mission Results Manager Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MissionResultsManager } from '../../src/results/MissionResultsManager';
import {
  MissionEvaluationInput,
  MissionCompletionStatus,
  PerformanceGrade,
  ScoringCategory,
} from '../../src/results/ResultsTypes';
import { EventBus } from '../../src/core/EventBus';

describe('MissionResultsManager (Public Integration API)', () => {
  let manager: MissionResultsManager;
  let coreEventBus: EventBus;

  beforeEach(() => {
    MissionResultsManager.resetInstance();
    coreEventBus = new EventBus();
    manager = MissionResultsManager.getInstance(coreEventBus);
    manager.reset();
  });

  describe('Singleton Management', () => {
    it('returns the same authoritative singleton instance', () => {
      const inst1 = MissionResultsManager.getInstance();
      const inst2 = MissionResultsManager.getInstance();
      expect(inst1).toBe(inst2);
    });

    it('resets cleanly when requested', () => {
      const inst1 = MissionResultsManager.getInstance();
      MissionResultsManager.resetInstance();
      const inst2 = MissionResultsManager.getInstance();
      expect(inst1).not.toBe(inst2);
    });
  });

  describe('Public API Contract Verification', () => {
    const sampleInput: MissionEvaluationInput = {
      missionId: 'M_API_01',
      missionName: 'Apollo Gateway Beta',
      shortCode: '[AG-02]',
      category: 'TRANSPORTATION',
      destinationId: 'DEST_MOON',
      actualDurationSeconds: 86400 * 4,
      objectives: [
        { id: 'o1', title: 'Lunar Flyby', isMandatory: true, isCompleted: true },
        { id: 'o2', title: 'Orbital Station Docking', isMandatory: true, isCompleted: true },
      ],
      budget: {
        allocatedCredits: 600000,
        actualCostCredits: 550000,
      },
      baseRewards: {
        credits: 150000,
        researchData: 60,
        rawMaterials: 25,
        technologyPoints: 10,
        agencyPrestige: 30,
        unlockedMissionIds: ['M_LUNAR_COLONY_01'],
      },
    };

    it('evaluateMission() generates a record and registers it in history', () => {
      const record = manager.evaluateMission(sampleInput);

      expect(record).toBeDefined();
      expect(record.missionId).toBe('M_API_01');
      expect(record.finalPerformanceScore).toBeGreaterThanOrEqual(80);

      const retrieved = manager.getMissionResults(record.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(record.id);

      const history = manager.listMissionHistory();
      expect(history.length).toBe(1);
    });

    it('calculateMissionScore() returns numeric score, category breakdown, and feedback', () => {
      const scoreData = manager.calculateMissionScore(sampleInput);
      expect(scoreData.finalScore).toBeGreaterThan(0);
      expect(scoreData.breakdown.length).toBe(5);
      expect(scoreData.feedback.strengths).toBeDefined();
    });

    it('calculatePerformanceGrade() attribution returns expected grade contract', () => {
      const grade = manager.calculatePerformanceGrade(92);
      expect(grade.grade).toBe(PerformanceGrade.EXCEPTIONAL);
      expect(grade.letter).toBe('S');
      expect(grade.reasons.length).toBeGreaterThan(0);
    });

    it('getPerformanceBreakdown() retrieves breakdown from both ID and input object', () => {
      const record = manager.evaluateMission(sampleInput);

      const breakdownFromId = manager.getPerformanceBreakdown(record.id);
      expect(breakdownFromId.length).toBe(5);

      const breakdownFromInput = manager.getPerformanceBreakdown(sampleInput);
      expect(breakdownFromInput.length).toBe(5);
    });

    it('claimMissionRewards() authoritatively claims rewards and prevents double claims', () => {
      const record = manager.evaluateMission(sampleInput);

      const initialCredits = manager.economyAdapter.getAvailableCredits();
      const initialPrestige = manager.progressionAdapter.getAgencyPrestige();

      const claimResult = manager.claimMissionRewards(record.id);
      expect(claimResult.success).toBe(true);
      expect(claimResult.alreadyClaimed).toBe(false);

      expect(manager.economyAdapter.getAvailableCredits()).toBeGreaterThan(initialCredits);
      expect(manager.progressionAdapter.getAgencyPrestige()).toBeGreaterThan(initialPrestige);

      // Verify that record in archive is now marked claimed
      const updatedRecord = manager.getMissionResults(record.id);
      expect(updatedRecord?.isClaimed).toBe(true);
      expect(updatedRecord?.rewardSummary.isClaimed).toBe(true);

      // Second claim attempt MUST be rejected
      const secondClaim = manager.claimMissionRewards(record.id);
      expect(secondClaim.success).toBe(false);
      expect(secondClaim.alreadyClaimed).toBe(true);
    });

    it('getOrganisationalMilestones() and submitAchievement() manage milestones', () => {
      const milestones = manager.getOrganisationalMilestones();
      expect(milestones.length).toBeGreaterThanOrEqual(8);

      const firstLaunch = milestones.find((m) => m.id === 'MILESTONE_FIRST_LAUNCH')!;
      expect(firstLaunch.unlocked).toBe(false);

      const subResult = manager.submitAchievement('MILESTONE_FIRST_LAUNCH', 'M_API_01');
      expect(subResult.success).toBe(true);
      expect(subResult.milestone?.unlocked).toBe(true);

      // Submitting already unlocked achievement
      const subDup = manager.submitAchievement('MILESTONE_FIRST_LAUNCH', 'M_API_01');
      expect(subDup.success).toBe(false);
    });

    it('comparePerformances() computes differences between two recorded flights', () => {
      const r1 = manager.evaluateMission({ ...sampleInput, missionId: 'M1', missionName: 'Flight 1' });
      const r2 = manager.evaluateMission({ ...sampleInput, missionId: 'M2', missionName: 'Flight 2', budget: { allocatedCredits: 600000, actualCostCredits: 700000 } });

      const comp = manager.comparePerformances(r1.id, r2.id);
      expect(comp).not.toBeNull();
      expect(comp?.categoryDeltas[ScoringCategory.BUDGET_MANAGEMENT]).toBeDefined();
    });
  });
});
