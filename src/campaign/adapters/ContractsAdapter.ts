/**
 * INTERSTELLAR CONTINUUM - Campaign Contracts & Economy Adapter
 * Listens to economy transactions, contract deliveries, and budget compliance.
 */

import { EventBus } from '../../core/EventBus';
import { CampaignManager } from '../CampaignManager';

export class ContractsAdapter {
  private eventBus?: EventBus;
  private campaignManager: CampaignManager;

  constructor(campaignManager: CampaignManager, eventBus?: EventBus) {
    this.campaignManager = campaignManager;
    this.eventBus = eventBus;
    this.setupListeners();
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.eventBus) return;

    this.eventBus.on('economy:credits_changed', (payload: { current: number; delta: number }) => {
      if (payload && payload.delta > 0) {
        this.handleCreditsEarned(payload.delta);
      }
    });

    this.eventBus.on('contract:completed' as any, (payload: { contractId: string }) => {
      if (payload) {
        this.handleContractCompleted(payload.contractId);
      }
    });
  }

  public handleCreditsEarned(amount: number): void {
    // Check if any objective requires earning credits
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.completionConditions.includes('EARN_CREDITS')) {
        this.campaignManager.updateObjectiveProgress(obj.id, obj.currentValue + amount);
      }
    }
  }

  public handleContractCompleted(_contractId: string): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.completionConditions.includes('COMPLETE_CONTRACT')) {
        this.campaignManager.updateObjectiveProgress(obj.id, obj.currentValue + 1);
      }
    }
  }
}
