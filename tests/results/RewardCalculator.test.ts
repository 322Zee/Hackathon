/**
 * INTERSTELLAR CONTINUUM - Reward Calculator Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RewardCalculator } from '../../src/results/RewardCalculator';
import { ResultsEconomyAdapter } from '../../src/results/adapters/EconomyAdapter';
import { ResultsProgressionAdapter } from '../../src/results/adapters/ProgressionAdapter';
import { ResultsEventBus } from '../../src/results/ResultsEventBus';
import {
  PerformanceGrade,
  MissionEvaluationInput,
  MissionCompletionStatus,
} from '../../src/results/ResultsTypes';

describe('RewardCalculator', () => {
  let calculator: RewardCalculator;
  let economyAdapter: ResultsEconomyAdapter;
  let progressionAdapter: ResultsProgressionAdapter;
  let eventBus: ResultsEventBus;

  beforeEach(() => {
    eventBus = new ResultsEventBus();
    economyAdapter = new ResultsEconomyAdapter();
    progressionAdapter = new ResultsProgressionAdapter(eventBus);
    calculator = new RewardCalculator(economyAdapter, progressionAdapter, eventBus);
  });

  describe('Reward Multipliers by Performance Grade', () => {
    const baseInput: MissionEvaluationInput = {
      missionId: 'M_PAY_01',
      missionName: 'Lunar Cargo Transit',
      category: 'TRANSPORTATION',
      destinationId: 'DEST_MOON',
      objectives: [],
      baseRewards: {
        credits: 100000,
        researchData: 40,
        rawMaterials: 20,
        technologyPoints: 10,
        agencyPrestige: 25,
        unlockedMissionIds: ['M_LUNAR_BASE_01'],
      },
    };

    it('awards +25% bonus for EXCEPTIONAL performance grade', () => {
      const { rewards } = calculator.calculateMissionRewards(baseInput, 95, PerformanceGrade.EXCEPTIONAL);
      expect(rewards.credits).toBe(125000); // 100k * 1.25
      expect(rewards.researchData).toBe(50); // 40 * 1.25
      expect(rewards.agencyPrestige).toBe(38); // 25 * 1.5 rounded
      expect(rewards.unlockedMissionIds).toContain('M_LUNAR_BASE_01');
    });

    it('awards +10% bonus for EXCELLENT performance grade', () => {
      const { rewards } = calculator.calculateMissionRewards(baseInput, 85, PerformanceGrade.EXCELLENT);
      expect(rewards.credits).toBe(110000);
      expect(rewards.researchData).toBe(44);
    });

    it('awards 100% baseline for GOOD performance grade', () => {
      const { rewards } = calculator.calculateMissionRewards(baseInput, 75, PerformanceGrade.GOOD);
      expect(rewards.credits).toBe(100000);
      expect(rewards.researchData).toBe(40);
    });

    it('awards reduced credits for SATISFACTORY and NEEDS_IMPROVEMENT', () => {
      const sat = calculator.calculateMissionRewards(baseInput, 65, PerformanceGrade.SATISFACTORY);
      expect(sat.rewards.credits).toBe(85000);

      const needs = calculator.calculateMissionRewards(baseInput, 50, PerformanceGrade.NEEDS_IMPROVEMENT);
      expect(needs.rewards.credits).toBe(50000);
    });

    it('withholds contract credits for FAILED missions while preserving partial research salvage', () => {
      const failedInput: MissionEvaluationInput = {
        ...baseInput,
        isFailed: true,
        status: MissionCompletionStatus.FAILED,
      };

      const { rewards, penalties } = calculator.calculateMissionRewards(
        failedInput,
        25,
        PerformanceGrade.UNSUCCESSFUL
      );

      expect(rewards.credits).toBe(0); // No payout on critical failure
      expect(rewards.researchData).toBeGreaterThan(0); // Salvage data preserved
      expect(penalties.reputationLoss).toBeGreaterThan(0);
      expect(penalties.penaltyReasons.length).toBeGreaterThan(0);
    });
  });

  describe('Financial and Hardware Penalties', () => {
    it('calculates budget overrun deductions when costs exceed allocations', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_OVER_01',
        missionName: 'Costly Mission',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_EARTH_LEO',
        objectives: [],
        budget: {
          allocatedCredits: 200000,
          actualCostCredits: 250000, // ₵50,000 overrun
        },
      };

      const { penalties } = calculator.calculateMissionRewards(input, 70, PerformanceGrade.GOOD);
      expect(penalties.budgetOverrunCredits).toBe(50000);
      expect(penalties.penaltyReasons.some((r) => r.includes('50,000'))).toBe(true);
    });

    it('calculates structural repair fees when final integrity is severely degraded', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_DMG_01',
        missionName: 'Damaged Transit',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_MOON',
        objectives: [],
        engineering: {
          structuralIntegrityFinal: 30, // < 50%
        },
      };

      const { penalties } = calculator.calculateMissionRewards(input, 60, PerformanceGrade.SATISFACTORY);
      expect(penalties.structuralDamageCredits).toBe(20000); // (50 - 30) * 1000
    });
  });

  describe('Duplicate Reward Claim Prevention', () => {
    it('authoritatively grants rewards on first claim and forbids duplicate claims', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_CLAIM_01',
        missionName: 'Claim Test Flight',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_MOON',
        objectives: [],
        baseRewards: {
          credits: 100000,
          researchData: 50,
          rawMaterials: 10,
          technologyPoints: 5,
          agencyPrestige: 20,
        },
      };

      const { rewards } = calculator.calculateMissionRewards(input, 85, PerformanceGrade.EXCELLENT);
      const resultId = 'RES_M_CLAIM_01_1710500';

      const initialCredits = economyAdapter.getAvailableCredits();
      const initialPrestige = progressionAdapter.getAgencyPrestige();

      // First Claim: MUST succeed
      const firstClaim = calculator.claimMissionRewards(resultId, input.missionId, rewards);
      expect(firstClaim.success).toBe(true);
      expect(firstClaim.alreadyClaimed).toBe(false);
      expect(calculator.isClaimed(resultId)).toBe(true);

      expect(economyAdapter.getAvailableCredits()).toBe(initialCredits + rewards.credits);
      expect(progressionAdapter.getAgencyPrestige()).toBe(initialPrestige + rewards.agencyPrestige);

      // Second Claim: MUST be blocked
      const secondClaim = calculator.claimMissionRewards(resultId, input.missionId, rewards);
      expect(secondClaim.success).toBe(false);
      expect(secondClaim.alreadyClaimed).toBe(true);

      // Economy balance must remain unchanged after rejected second claim
      expect(economyAdapter.getAvailableCredits()).toBe(initialCredits + rewards.credits);
    });

    it('emits MissionRewardsGranted domain event upon successful claim', () => {
      let eventPayload: any = null;
      eventBus.on('MissionRewardsGranted', (payload) => {
        eventPayload = payload;
      });

      const { rewards } = calculator.calculateMissionRewards(
        {
          missionId: 'M_EVT_01',
          missionName: 'Event Test',
          category: 'TRANSPORTATION',
          destinationId: 'DEST_MOON',
          objectives: [],
        },
        90,
        PerformanceGrade.EXCEPTIONAL
      );

      calculator.claimMissionRewards('RES_EVT_01', 'M_EVT_01', rewards);
      expect(eventPayload).not.toBeNull();
      expect(eventPayload.missionId).toBe('M_EVT_01');
      expect(eventPayload.resultId).toBe('RES_EVT_01');
    });
  });
});
