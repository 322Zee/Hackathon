import { EventBus } from '../core/EventBus';
import { ResourceWallet } from '../core/GameState';

export class EconomyService {
  private wallet: ResourceWallet;
  private eventBus: EventBus;

  constructor(initialWallet: ResourceWallet, eventBus: EventBus) {
    this.wallet = { ...initialWallet };
    this.eventBus = eventBus;
  }

  public getWallet(): Readonly<ResourceWallet> {
    return { ...this.wallet };
  }

  public getCredits(): number {
    return this.wallet.credits;
  }

  public getResearchData(): number {
    return this.wallet.researchData;
  }

  public getRawMaterials(): number {
    return this.wallet.rawMaterials;
  }

  public getTechnologyPoints(): number {
    return this.wallet.technologyPoints;
  }

  public canAfford(cost: Partial<ResourceWallet>): boolean {
    if (cost.credits !== undefined && this.wallet.credits < cost.credits) return false;
    if (cost.researchData !== undefined && this.wallet.researchData < cost.researchData) return false;
    if (cost.rawMaterials !== undefined && this.wallet.rawMaterials < cost.rawMaterials) return false;
    if (cost.technologyPoints !== undefined && this.wallet.technologyPoints < cost.technologyPoints) return false;
    return true;
  }

  public spend(cost: Partial<ResourceWallet>): boolean {
    if (!this.canAfford(cost)) {
      return false;
    }

    if (cost.credits !== undefined && cost.credits > 0) {
      this.wallet.credits -= cost.credits;
      this.eventBus.emit('economy:credits_changed', { current: this.wallet.credits, delta: -cost.credits });
    }
    if (cost.researchData !== undefined && cost.researchData > 0) {
      this.wallet.researchData -= cost.researchData;
      this.eventBus.emit('economy:research_changed', { current: this.wallet.researchData, delta: -cost.researchData });
    }
    if (cost.rawMaterials !== undefined && cost.rawMaterials > 0) {
      this.wallet.rawMaterials -= cost.rawMaterials;
    }
    if (cost.technologyPoints !== undefined && cost.technologyPoints > 0) {
      this.wallet.technologyPoints -= cost.technologyPoints;
    }

    return true;
  }

  public grant(reward: Partial<ResourceWallet>): void {
    if (reward.credits !== undefined && reward.credits > 0) {
      this.wallet.credits += reward.credits;
      this.eventBus.emit('economy:credits_changed', { current: this.wallet.credits, delta: reward.credits });
    }
    if (reward.researchData !== undefined && reward.researchData > 0) {
      this.wallet.researchData += reward.researchData;
      this.eventBus.emit('economy:research_changed', { current: this.wallet.researchData, delta: reward.researchData });
    }
    if (reward.rawMaterials !== undefined && reward.rawMaterials > 0) {
      this.wallet.rawMaterials += reward.rawMaterials;
    }
    if (reward.technologyPoints !== undefined && reward.technologyPoints > 0) {
      this.wallet.technologyPoints += reward.technologyPoints;
    }
  }

  public setWallet(newWallet: ResourceWallet): void {
    this.wallet = { ...newWallet };
  }
}
