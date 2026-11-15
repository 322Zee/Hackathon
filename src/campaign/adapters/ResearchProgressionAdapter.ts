/**
 * INTERSTELLAR CONTINUUM - Campaign Research Progression Adapter
 * Connects research unlocks and science discoveries to campaign progression.
 */

import { EventBus } from '../../core/EventBus';
import { CampaignManager } from '../CampaignManager';

export class ResearchProgressionAdapter {
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

    this.eventBus.on('research:tech_unlocked' as any, (payload: { techId: string }) => {
      if (payload && payload.techId) {
        this.handleTechUnlocked(payload.techId);
      }
    });

    this.eventBus.on('science:discovery_logged' as any, () => {
      this.handleDiscoveryLogged();
    });
  }

  public handleTechUnlocked(techId: string): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.associatedTechIds && obj.associatedTechIds.includes(techId)) {
        this.campaignManager.completeCampaignObjective(obj.id);
      }
    }
  }

  public handleDiscoveryLogged(): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.completionConditions.includes('DISCOVERY_LOGGED')) {
        this.campaignManager.completeCampaignObjective(obj.id);
      }
    }
  }
}
