/**
 * INTERSTELLAR CONTINUUM - Economy Adapter for Scientific Research
 * Clean adapter layer that interfaces with EconomyService without modifying or duplicating global economy logic.
 */

import { EconomyService } from '../../services/EconomyService';
import { ResearchProjectRewards } from '../ScientificTypes';

export class EconomyAdapter {
  private economyService?: EconomyService;

  constructor(economyService?: EconomyService) {
    this.economyService = economyService;
  }

  public setEconomyService(economyService: EconomyService): void {
    this.economyService = economyService;
  }

  /**
   * Awards research project completion rewards to the organization wallet.
   */
  public grantResearchRewards(rewards: ResearchProjectRewards): void {
    if (!this.economyService) return;

    this.economyService.grant({
      credits: rewards.credits,
      researchData: rewards.researchData,
      technologyPoints: rewards.technologyPoints,
    });
  }

  /**
   * Awards research data points when an individual finding is analysed.
   */
  public grantAnalysisPoints(researchPoints: number): void {
    if (!this.economyService || researchPoints <= 0) return;

    this.economyService.grant({
      researchData: researchPoints,
    });
  }

  /**
   * Returns current research data points balance.
   */
  public getResearchDataBalance(): number {
    return this.economyService ? this.economyService.getResearchData() : 0;
  }

  /**
   * Returns current technology points balance.
   */
  public getTechnologyPointsBalance(): number {
    return this.economyService ? this.economyService.getTechnologyPoints() : 0;
  }

  /**
   * Returns current credits balance.
   */
  public getCreditsBalance(): number {
    return this.economyService ? this.economyService.getCredits() : 0;
  }
}
