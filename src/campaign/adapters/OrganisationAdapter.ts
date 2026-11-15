/**
 * INTERSTELLAR CONTINUUM - Campaign Organisation Adapter
 * Connects facility upgrades, director rank progression, and agency milestones to campaign objectives.
 */

import { EventBus } from '../../core/EventBus';
import { CampaignManager } from '../CampaignManager';
import { FacilityId } from '../../facilities/FacilityTypes';

export class OrganisationAdapter {
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

    this.eventBus.on('facility:upgraded' as any, (payload: { facilityId: FacilityId; newLevel: number }) => {
      if (payload && payload.facilityId) {
        this.handleFacilityUpgraded(payload.facilityId, payload.newLevel);
      }
    });

    this.eventBus.on('agency:rank_changed' as any, (payload: { rank: number }) => {
      if (payload) {
        this.handleRankChanged(payload.rank);
      }
    });
  }

  public handleFacilityUpgraded(facilityId: FacilityId, newLevel: number): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (
        (obj.associatedFacilityIds && obj.associatedFacilityIds.includes(facilityId)) ||
        obj.completionConditions.includes(`FACILITY_UPGRADED:${facilityId}`)
      ) {
        this.campaignManager.updateObjectiveProgress(obj.id, newLevel);
      }
    }
  }

  public handleRankChanged(rank: number): void {
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.completionConditions.includes('REACH_DIRECTOR_RANK')) {
        this.campaignManager.updateObjectiveProgress(obj.id, rank);
      }
    }
  }
}
