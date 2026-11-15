/**
 * INTERSTELLAR CONTINUUM - Campaign Rocket Engineering Adapter
 * Connects VAB vehicle assembly, validation, and design events to campaign objectives.
 */

import { EventBus } from '../../core/EventBus';
import { CampaignManager } from '../CampaignManager';

export class RocketEngineeringAdapter {
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

    // Listen to rocket validation events
    this.eventBus.on('rocket:validated' as any, (payload: { isValid: boolean }) => {
      if (payload && payload.isValid) {
        this.handleRocketValidated();
      }
    });

    // Listen to rocket builder project saved
    this.eventBus.on('rocket:saved' as any, () => {
      this.handleRocketValidated();
    });
  }

  public handleRocketValidated(): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.completionConditions.includes('ROCKET_DESIGN_VALIDATED')) {
        this.campaignManager.completeCampaignObjective(obj.id);
      }
    }
  }
}
