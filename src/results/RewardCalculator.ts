/**
 * INTERSTELLAR CONTINUUM - Mission Reward Calculator
 * Computes, validates, scales, and grants authoritative mission rewards.
 * Integrates with EconomyAdapter and ProgressionAdapter with strict once-only claim semantics.
 */

import {
  MissionEvaluationInput,
  MissionRewardSummary,
  MissionPenaltySummary,
  PerformanceGrade,
  MissionCompletionStatus,
} from './ResultsTypes';
import { ResultsEconomyAdapter } from './adapters/EconomyAdapter';
import { ResultsProgressionAdapter } from './adapters/ProgressionAdapter';
import { ResultsEventBus } from './ResultsEventBus';

export class RewardCalculator {
  private economyAdapter: ResultsEconomyAdapter;
  private progressionAdapter: ResultsProgressionAdapter;
  private eventBus?: ResultsEventBus;

  // Set of Result IDs whose rewards have been authoritatively claimed
  private claimedResultIds: Set<string> = new Set();

  constructor(
    economyAdapter?: ResultsEconomyAdapter,
    progressionAdapter?: ResultsProgressionAdapter,
    eventBus?: ResultsEventBus
  ) {
    this.economyAdapter = economyAdapter ?? new ResultsEconomyAdapter();
    this.progressionAdapter = progressionAdapter ?? new ResultsProgressionAdapter(eventBus);
    this.eventBus = eventBus;
  }

  public setEventBus(eventBus?: ResultsEventBus): void {
    this.eventBus = eventBus;
    this.progressionAdapter.setEventBus(eventBus);
  }

  public setEconomyAdapter(adapter: ResultsEconomyAdapter): void {
    this.economyAdapter = adapter;
  }

  public setProgressionAdapter(adapter: ResultsProgressionAdapter): void {
    this.progressionAdapter = adapter;
  }

  public isClaimed(resultId: string): boolean {
    return this.claimedResultIds.has(resultId);
  }

  public getClaimedResultIds(): Set<string> {
    return new Set(this.claimedResultIds);
  }

  public setClaimedResultIds(ids: Iterable<string>): void {
    this.claimedResultIds = new Set(ids);
  }

  /**
   * Calculates itemized rewards based on catalog configuration and final performance grade.
   */
  public calculateMissionRewards(
    input: MissionEvaluationInput,
    finalScore: number,
    grade: PerformanceGrade
  ): { rewards: MissionRewardSummary; penalties: MissionPenaltySummary } {
    const base = input.baseRewards || {};
    const baseCredits = base.credits ?? 100000;
    const baseResearch = base.researchData ?? 50;
    const baseMaterials = base.rawMaterials ?? 25;
    const baseTechPoints = base.technologyPoints ?? 10;
    const basePrestige = base.agencyPrestige ?? 20;

    const status = input.status || (input.isFailed ? MissionCompletionStatus.FAILED : MissionCompletionStatus.COMPLETED);

    let multiplier = 1.0;
    let prestigeMultiplier = 1.0;

    switch (grade) {
      case PerformanceGrade.EXCEPTIONAL:
        multiplier = 1.25; // +25% performance bonus
        prestigeMultiplier = 1.5;
        break;
      case PerformanceGrade.EXCELLENT:
        multiplier = 1.10; // +10% bonus
        prestigeMultiplier = 1.2;
        break;
      case PerformanceGrade.GOOD:
        multiplier = 1.0;
        prestigeMultiplier = 1.0;
        break;
      case PerformanceGrade.SATISFACTORY:
        multiplier = 0.85;
        prestigeMultiplier = 0.8;
        break;
      case PerformanceGrade.NEEDS_IMPROVEMENT:
        multiplier = 0.50;
        prestigeMultiplier = 0.4;
        break;
      case PerformanceGrade.UNSUCCESSFUL:
        multiplier = status === MissionCompletionStatus.FAILED ? 0.15 : 0.3; // partial salvage
        prestigeMultiplier = 0;
        break;
    }

    // Credits reward: if failed or cancelled, primary credits contract is not paid out in full
    let finalCredits = 0;
    if (status === MissionCompletionStatus.COMPLETED || status === MissionCompletionStatus.PARTIALLY_COMPLETED) {
      finalCredits = Math.round(baseCredits * multiplier);
    } else if (status === MissionCompletionStatus.CANCELLED) {
      finalCredits = Math.round(baseCredits * 0.25); // partial refund/salvage
    } else {
      finalCredits = 0; // failed missions don't pay launch contracts
    }

    // Research data: salvage data points even from failure telemetry
    const finalResearch = Math.max(0, Math.round(baseResearch * multiplier));
    const finalMaterials = status === MissionCompletionStatus.FAILED ? 0 : Math.round(baseMaterials * (grade === PerformanceGrade.EXCEPTIONAL ? 1.2 : 1.0));
    const finalTechPoints = status === MissionCompletionStatus.FAILED ? 0 : Math.round(baseTechPoints * multiplier);
    const finalPrestige = Math.max(0, Math.round(basePrestige * prestigeMultiplier));

    // Rank progression points
    const rankProgress = Math.round(finalPrestige * 1.5 + (finalScore >= 80 ? 25 : 10));

    // Determine unlocks
    const unlockedMissions = [...(base.unlockedMissionIds || [])];
    const unlockedEquipment = [...(base.unlockedEquipment || [])];

    // Penalty calculations
    const penalties: MissionPenaltySummary = {
      budgetOverrunCredits: 0,
      structuralDamageCredits: 0,
      reputationLoss: 0,
      penaltyReasons: [],
    };

    if (input.budget && input.budget.actualCostCredits > input.budget.allocatedCredits) {
      const overrun = input.budget.actualCostCredits - input.budget.allocatedCredits;
      penalties.budgetOverrunCredits = overrun;
      penalties.penaltyReasons.push(`Budget overrun of ₵${overrun.toLocaleString()} deducted from agency account.`);
    }

    if (input.engineering && typeof input.engineering.structuralIntegrityFinal === 'number') {
      if (input.engineering.structuralIntegrityFinal < 50 && status !== MissionCompletionStatus.FAILED) {
        const repairCost = Math.round((50 - input.engineering.structuralIntegrityFinal) * 1000);
        penalties.structuralDamageCredits = repairCost;
        penalties.penaltyReasons.push(`Refurbishment and structural repair costs: ₵${repairCost.toLocaleString()}.`);
      }
    }

    if (status === MissionCompletionStatus.FAILED) {
      penalties.reputationLoss = Math.min(15, Math.round(basePrestige * 0.5));
      penalties.penaltyReasons.push(`Public confidence and reputation impact: -${penalties.reputationLoss} prestige.`);
    }

    const rewards: MissionRewardSummary = {
      credits: finalCredits,
      researchData: finalResearch,
      rawMaterials: finalMaterials,
      technologyPoints: finalTechPoints,
      agencyPrestige: finalPrestige,
      unlockedMissionIds: unlockedMissions,
      unlockedEquipment,
      rankProgressPoints: rankProgress,
      isClaimed: false,
    };

    return { rewards, penalties };
  }

  /**
   * Authoritatively claims mission rewards.
   * Guaranteed to be strictly idempotent: rewards are granted exactly once per resultId.
   */
  public claimMissionRewards(
    resultId: string,
    missionId: string,
    rewards: MissionRewardSummary,
    penalties?: MissionPenaltySummary
  ): { success: boolean; alreadyClaimed: boolean; message: string } {
    if (this.claimedResultIds.has(resultId)) {
      return {
        success: false,
        alreadyClaimed: true,
        message: `Rewards for mission result "${resultId}" have already been claimed. Duplicate claims are prevented.`,
      };
    }

    // 1. Grant to economy wallet via EconomyAdapter
    this.economyAdapter.grantRewards(rewards);

    // 2. Apply penalties if any
    if (penalties) {
      this.economyAdapter.applyPenalties(penalties);
    }

    // 3. Grant progression, prestige, and unlocks via ProgressionAdapter
    if (rewards.agencyPrestige > 0) {
      this.progressionAdapter.addPrestige(rewards.agencyPrestige);
    }
    if (rewards.rankProgressPoints > 0) {
      this.progressionAdapter.addRankProgress(rewards.rankProgressPoints);
    }
    for (const mId of rewards.unlockedMissionIds) {
      this.progressionAdapter.unlockMission(mId);
    }
    for (const eqId of rewards.unlockedEquipment) {
      this.progressionAdapter.unlockEquipment(eqId);
    }

    // 4. Mark permanently claimed
    this.claimedResultIds.add(resultId);
    rewards.isClaimed = true;
    rewards.claimedTimestamp = Date.now();

    // 5. Emit event
    if (this.eventBus) {
      this.eventBus.emit('MissionRewardsGranted', {
        missionId,
        resultId,
        rewards: { ...rewards },
        timestamp: Date.now(),
      });
    }

    return {
      success: true,
      alreadyClaimed: false,
      message: `Rewards successfully granted: ₵${rewards.credits.toLocaleString()}, +${rewards.researchData} Research, +${rewards.rawMaterials} Materials, +${rewards.agencyPrestige} Prestige.`,
    };
  }
}
