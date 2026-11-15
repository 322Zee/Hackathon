/**
 * INTERSTELLAR CONTINUUM - Contracts Mission Adapter
 * Bridges mission lifecycle events and mission objectives to contracts.
 */

import { EventBus } from '../../core/EventBus';

export interface MissionObjectiveUpdatePayload {
  missionId: string;
  objectiveId: string;
  currentProgress: number;
  isCompleted: boolean;
}

export interface MissionCompletedPayload {
  missionId: string;
  score?: number;
}

export class ContractsMissionAdapter {
  private coreEventBus?: EventBus;
  private onObjectiveUpdateCallback?: (payload: MissionObjectiveUpdatePayload) => void;
  private onMissionCompletedCallback?: (payload: MissionCompletedPayload) => void;

  constructor(coreEventBus?: EventBus) {
    this.coreEventBus = coreEventBus;
    this.setupListeners();
  }

  public setCoreEventBus(coreEventBus?: EventBus): void {
    this.coreEventBus = coreEventBus;
    this.setupListeners();
  }

  public setCallbacks(
    onObjectiveUpdate: (payload: MissionObjectiveUpdatePayload) => void,
    onMissionCompleted: (payload: MissionCompletedPayload) => void
  ): void {
    this.onObjectiveUpdateCallback = onObjectiveUpdate;
    this.onMissionCompletedCallback = onMissionCompleted;
  }

  private setupListeners(): void {
    if (!this.coreEventBus) return;

    try {
      this.coreEventBus.on('mission:objective:updated', (payload: any) => {
        if (this.onObjectiveUpdateCallback && payload) {
          this.onObjectiveUpdateCallback({
            missionId: payload.instanceId || payload.missionId,
            objectiveId: payload.objectiveId,
            currentProgress: payload.currentProgress ?? 1,
            isCompleted: payload.isCompleted ?? false,
          });
        }
      });

      this.coreEventBus.on('mission:completed', (payload: any) => {
        if (this.onMissionCompletedCallback && payload) {
          this.onMissionCompletedCallback({
            missionId: payload.missionId,
            score: payload.score,
          });
        }
      });
    } catch {
      // Non-blocking bridge catch
    }
  }

  /**
   * Manual dispatch for unit tests / headless simulation
   */
  public simulateObjectiveUpdate(payload: MissionObjectiveUpdatePayload): void {
    if (this.onObjectiveUpdateCallback) {
      this.onObjectiveUpdateCallback(payload);
    }
  }

  public simulateMissionCompleted(payload: MissionCompletedPayload): void {
    if (this.onMissionCompletedCallback) {
      this.onMissionCompletedCallback(payload);
    }
  }
}
