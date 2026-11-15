/**
 * INTERSTELLAR CONTINUUM - Contracts Economy Adapter
 * Interacts with authoritative EconomyService without duplicating economy logic.
 * Enforces transaction safety and provides fallback for headless testing.
 */

import { EconomyService } from '../../services/EconomyService';
import { ContractReward } from '../ContractTypes';

export class ContractsEconomyAdapter {
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
   * Deposit rewards into the organization wallet.
   */
  public depositRewards(reward: Partial<ContractReward>): void {
    const grantPayload: {
      credits?: number;
      researchData?: number;
      rawMaterials?: number;
      technologyPoints?: number;
    } = {};

    if (reward.credits && reward.credits > 0) grantPayload.credits = reward.credits;
    if (reward.researchData && reward.researchData > 0) grantPayload.researchData = reward.researchData;
    if (reward.rawMaterials && reward.rawMaterials > 0) grantPayload.rawMaterials = reward.rawMaterials;
    if (reward.technologyPoints && reward.technologyPoints > 0) grantPayload.technologyPoints = reward.technologyPoints;

    if (this.economyService) {
      this.economyService.grant(grantPayload);
    } else {
      if (grantPayload.credits) this.fallbackWallet.credits += grantPayload.credits;
      if (grantPayload.researchData) this.fallbackWallet.researchData += grantPayload.researchData;
      if (grantPayload.rawMaterials) this.fallbackWallet.rawMaterials += grantPayload.rawMaterials;
      if (grantPayload.technologyPoints) this.fallbackWallet.technologyPoints += grantPayload.technologyPoints;
    }
  }

  /**
   * Deduct fee or penalty from wallet. Returns true if successfully deducted.
   */
  public deductCredits(amount: number): boolean {
    if (amount <= 0) return true;

    if (this.economyService) {
      if (this.economyService.getCredits() < amount) {
        // Can't afford full amount, but deduct what's possible
        const current = this.economyService.getCredits();
        this.economyService.spend({ credits: current });
        return false;
      }
      return this.economyService.spend({ credits: amount });
    } else {
      if (this.fallbackWallet.credits < amount) {
        this.fallbackWallet.credits = 0;
        return false;
      }
      this.fallbackWallet.credits -= amount;
      return true;
    }
  }
}
