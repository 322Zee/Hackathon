/**
 * INTERSTELLAR CONTINUUM - Campaign Mission Completion Adapter
 * Bridges mission lifecycle events and mission results into campaign progression.
 */

import { EventBus } from '../../core/EventBus';
import { CampaignManager } from '../CampaignManager';

export class MissionCompletionAdapter {
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

    // Listen to standard core mission completed event
    this.eventBus.on('mission:completed', (payload: { missionId: string; score?: number }) => {
      this.handleMissionCompleted(payload.missionId);
    });

    // Listen to Prompt 36 results domain event bridge
    this.eventBus.on('results:missionevaluationcompleted' as any, (payload: { missionId: string; score: number }) => {
      if (payload && payload.missionId) {
        this.handleMissionCompleted(payload.missionId);
      }
    });
  }

  public handleMissionCompleted(missionId: string): void {
    // Find all objectives that require this mission
    const objectives = this.campaignManager.listCampaignObjectives();
    for (const obj of objectives) {
      if (obj.associatedMissionIds && obj.associatedMissionIds.includes(missionId)) {
        this.campaignManager.completeCampaignObjective(obj.id);
      }
      // Also check condition string matching
      if (obj.completionConditions.some((c) => c === `MISSION_COMPLETED:${missionId}`)) {
        this.campaignManager.completeCampaignObjective(obj.id);
      }
    }
  }
}
