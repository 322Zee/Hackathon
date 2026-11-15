/**
 * INTERSTELLAR CONTINUUM - Planetary Base Resource & Economy Adapter
 * Safe boundary connecting base operations to global EconomyService.
 * Does not duplicate global credits or materials and prevents player bankruptcy traps.
 */

import { EconomyService } from '../../services/EconomyService';

export class ResourceEconomyAdapter {
  private economyService?: EconomyService;
  private fallbackCredits: number = 500000;
  private fallbackMaterials: number = 1000;
  private fallbackResearch: number = 200;

  constructor(economyService?: EconomyService) {
    this.economyService = economyService;
  }

  public setEconomyService(economyService?: EconomyService): void {
    this.economyService = economyService;
  }

  public getCredits(): number {
    if (this.economyService) {
      return this.economyService.getCredits();
    }
    return this.fallbackCredits;
  }

  public getRawMaterials(): number {
    if (this.economyService) {
      return this.economyService.getRawMaterials();
    }
    return this.fallbackMaterials;
  }

  public getResearchData(): number {
    if (this.economyService) {
      return this.economyService.getResearchData();
    }
    return this.fallbackResearch;
  }

  public canAfford(cost: { credits?: number; materials?: number }): boolean {
    const credits = cost.credits ?? 0;
    const materials = cost.materials ?? 0;

    if (this.economyService) {
      return this.economyService.canAfford({
        credits: credits > 0 ? credits : undefined,
        rawMaterials: materials > 0 ? materials : undefined,
      });
    }

    return this.fallbackCredits >= credits && this.fallbackMaterials >= materials;
  }

  public spend(cost: { credits?: number; materials?: number }): boolean {
    const credits = cost.credits ?? 0;
    const materials = cost.materials ?? 0;

    if (!this.canAfford(cost)) {
      return false;
    }

    if (this.economyService) {
      return this.economyService.spend({
        credits: credits > 0 ? credits : undefined,
        rawMaterials: materials > 0 ? materials : undefined,
      });
    }

    this.fallbackCredits -= credits;
    this.fallbackMaterials -= materials;
    return true;
  }

  public grant(reward: { credits?: number; materials?: number; research?: number }): void {
    const credits = reward.credits ?? 0;
    const materials = reward.materials ?? 0;
    const research = reward.research ?? 0;

    if (this.economyService) {
      this.economyService.grant({
        credits: credits > 0 ? credits : undefined,
        rawMaterials: materials > 0 ? materials : undefined,
        researchData: research > 0 ? research : undefined,
      });
    } else {
      this.fallbackCredits += credits;
      this.fallbackMaterials += materials;
      this.fallbackResearch += research;
    }
  }

  public resetFallback(credits = 500000, materials = 1000, research = 200): void {
    this.fallbackCredits = credits;
    this.fallbackMaterials = materials;
    this.fallbackResearch = research;
  }
}
