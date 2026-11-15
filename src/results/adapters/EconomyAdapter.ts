/**
 * INTERSTELLAR CONTINUUM - Results Economy Adapter
 * Interacts with the game's authoritative EconomyService without duplicating
 * economy logic. Provides fallback wallet handling for standalone/test environments.
 */

import { EconomyService } from '../../services/EconomyService';
import { MissionRewardSummary, MissionPenaltySummary } from '../ResultsTypes';

export class ResultsEconomyAdapter {
  private economyService?: EconomyService;
  private fallbackWallet = {
    credits: 500000,
    researchData: 50,
    rawMaterials: 100,
    technologyPoints: 0,
  };

  constructor(economyService?: EconomyService) {
    this.economyService = economyService;
  }

  public setEconomyService(economyService?: EconomyService): void {
    this.economyService = economyService;
  }

  public getAvailableCredits(): number {
    if (this.economyService) {
      return this.economyService.getCredits();
    }
    return this.fallbackWallet.credits;
  }

  public getResearchData(): number {
    if (this.economyService) {
      return this.economyService.getResearchData();
    }
    return this.fallbackWallet.researchData;
  }

  public getRawMaterials(): number {
    if (this.economyService) {
      return this.economyService.getRawMaterials();
    }
    return this.fallbackWallet.rawMaterials;
  }

  public getTechnologyPoints(): number {
    if (this.economyService) {
      return this.economyService.getTechnologyPoints();
    }
    return this.fallbackWallet.technologyPoints;
  }

  /**
   * Authoritatively grants calculated mission rewards to the economy wallet.
   */
  public grantRewards(rewards: MissionRewardSummary): boolean {
    const delta = {
      credits: rewards.credits > 0 ? rewards.credits : undefined,
      researchData: rewards.researchData > 0 ? rewards.researchData : undefined,
      rawMaterials: rewards.rawMaterials > 0 ? rewards.rawMaterials : undefined,
      technologyPoints: rewards.technologyPoints > 0 ? rewards.technologyPoints : undefined,
    };

    if (this.economyService) {
      this.economyService.grant(delta);
    } else {
      if (delta.credits) this.fallbackWallet.credits += delta.credits;
      if (delta.researchData) this.fallbackWallet.researchData += delta.researchData;
      if (delta.rawMaterials) this.fallbackWallet.rawMaterials += delta.rawMaterials;
      if (delta.technologyPoints) this.fallbackWallet.technologyPoints += delta.technologyPoints;
    }

    return true;
  }

  /**
   * Applies financial penalties if specified (e.g. overruns or damage repair).
   */
  public applyPenalties(penalties: MissionPenaltySummary): boolean {
    const totalDeduction = penalties.budgetOverrunCredits + penalties.structuralDamageCredits;
    if (totalDeduction <= 0) return true;

    if (this.economyService) {
      // Deduct credits if affordable, otherwise take what is available
      const available = this.economyService.getCredits();
      const amountToDeduct = Math.min(available, totalDeduction);
      return this.economyService.spend({ credits: amountToDeduct });
    } else {
      this.fallbackWallet.credits = Math.max(0, this.fallbackWallet.credits - totalDeduction);
      return true;
    }
  }
}
