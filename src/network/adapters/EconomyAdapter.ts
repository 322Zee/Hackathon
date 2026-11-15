/**
 * INTERSTELLAR CONTINUUM - Network Economy Adapter
 * Interacts with the game's authoritative EconomyService without duplicating
 * economy logic. Provides fallback wallet handling for standalone/test environments.
 */

import { EconomyService } from '../../services/EconomyService';

export class EconomyAdapter {
  private economyService?: EconomyService;
  private fallbackCredits: number = 1000000;

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
    return this.fallbackCredits;
  }

  public canAfford(credits: number): boolean {
    if (credits <= 0) return true;
    if (this.economyService) {
      return this.economyService.canAfford({ credits });
    }
    return this.fallbackCredits >= credits;
  }

  public spend(credits: number): boolean {
    if (credits <= 0) return true;
    if (!this.canAfford(credits)) {
      return false;
    }

    if (this.economyService) {
      return this.economyService.spend({ credits });
    }

    this.fallbackCredits -= credits;
    return true;
  }

  public grant(credits: number): void {
    if (credits <= 0) return;
    if (this.economyService) {
      this.economyService.grant({ credits });
    } else {
      this.fallbackCredits += credits;
    }
  }

  public resetFallbackCredits(amount: number = 1000000): void {
    this.fallbackCredits = amount;
  }
}

