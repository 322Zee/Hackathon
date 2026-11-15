/**
 * INTERSTELLAR CONTINUUM - Campaign Solar System Navigation Adapter
 * Interfaces with destination unlocks, flybys, and orbital insertions.
 */

import { EventBus } from '../../core/EventBus';
import { CampaignManager } from '../CampaignManager';
import { DestinationId } from '../../destinations/DestinationTypes';

export class SolarSystemAdapter {
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

    this.eventBus.on('destination:unlocked' as any, (payload: { destinationId: DestinationId }) => {
      if (payload && payload.destinationId) {
        this.handleDestinationUnlocked(payload.destinationId);
      }
    });

    this.eventBus.on('destination:explored' as any, (payload: { destinationId: DestinationId }) => {
      if (payload && payload.destinationId) {
        this.handleDestinationExplored(payload.destinationId);
      }
    });
  }

  public handleDestinationUnlocked(destinationId: DestinationId): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.associatedDestinationIds && obj.associatedDestinationIds.includes(destinationId)) {
        this.campaignManager.updateObjectiveProgress(obj.id, obj.currentValue + 1);
      }
    }
  }

  public handleDestinationExplored(destinationId: DestinationId): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (
        obj.associatedDestinationIds &&
        obj.associatedDestinationIds.includes(destinationId) &&
        obj.completionConditions.some((c) => c.includes('EXPLORE'))
      ) {
        this.campaignManager.completeCampaignObjective(obj.id);
      }
    }
  }
}
