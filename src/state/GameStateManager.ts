import { FullGameState, createInitialGameState, ResourceState } from './types';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';

export class GameStateManager {
  private state: FullGameState;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, initialState?: FullGameState) {
    this.eventBus = eventBus;
    this.state = initialState ? JSON.parse(JSON.stringify(initialState)) : createInitialGameState();
  }

  public getState(): Readonly<FullGameState> {
    return this.state;
  }

  public getSnapshot(): FullGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public restoreSnapshot(snapshot: FullGameState): void {
    this.state = JSON.parse(JSON.stringify(snapshot));
    Logger.info('GAME_STATE', 'Restored state from snapshot.');
  }

  // Slice Mutators with Typed Event Notifications
  public updatePlayerPosition(
    x: number,
    y: number,
    headingDeg: number = 0,
    speedMps: number = 0,
    bodyId?: string
  ): void {
    const vx = Math.cos((headingDeg * Math.PI) / 180) * speedMps;
    const vy = Math.sin((headingDeg * Math.PI) / 180) * speedMps;

    this.state.player.worldCoords = { x, y };
    this.state.player.headingDeg = headingDeg;
    this.state.player.speedMps = speedMps;
    if (bodyId) {
      this.state.player.bodyId = bodyId;
    }

    this.eventBus.emit('PlayerMoved', {
      entityId: 'player',
      x,
      y,
      heading: headingDeg,
      velocity: { vx, vy },
    });
  }

  public adjustCredits(delta: number, reason: string): void {
    this.state.resources.credits += delta;
    this.eventBus.emit('CreditsChanged', {
      current: this.state.resources.credits,
      delta,
      reason,
    });
    this.eventBus.emit('economy:credits_changed', {
      current: this.state.resources.credits,
      delta,
    });
  }

  public grantResources(reward: Partial<ResourceState>, reason: string = 'reward'): void {
    if (reward.credits) this.adjustCredits(reward.credits, reason);
    if (reward.researchData) {
      this.state.resources.researchData += reward.researchData;
      this.eventBus.emit('ResourceCollected', {
        resourceType: 'researchData',
        amount: reward.researchData,
        source: reason,
      });
      this.eventBus.emit('economy:research_changed', {
        current: this.state.resources.researchData,
        delta: reward.researchData,
      });
    }
    if (reward.rawMaterials) {
      this.state.resources.rawMaterials += reward.rawMaterials;
      this.eventBus.emit('ResourceCollected', {
        resourceType: 'rawMaterials',
        amount: reward.rawMaterials,
        source: reason,
      });
    }
    if (reward.technologyPoints) {
      this.state.resources.technologyPoints += reward.technologyPoints;
      this.eventBus.emit('ResourceCollected', {
        resourceType: 'technologyPoints',
        amount: reward.technologyPoints,
        source: reason,
      });
    }
  }

  public unlockTechnology(techId: string, category: string = 'Aerospace', cost: number = 0): boolean {
    if (this.state.research.unlockedNodeIds.includes(techId)) {
      return false;
    }
    this.state.research.unlockedNodeIds.push(techId);

    this.eventBus.emit('ResearchUnlocked', { techId, category, cost });
    this.eventBus.emit('TechnologyUnlocked', { techId, blueprints: [techId] });
    this.eventBus.emit('research:unlocked', { techId });
    return true;
  }

  public startMission(missionId: string, code: string, title: string): void {
    this.state.mission = {
      missionId,
      code,
      title,
      phase: 'FLIGHT',
      elapsedSeconds: 0,
      trajectoryStage: 1,
      completedObjectiveIds: [],
    };

    this.eventBus.emit('MissionStarted', { missionId, launchTimestamp: Date.now() });
    this.eventBus.emit('mission:started', { missionId });
  }

  public completeMission(score: number): void {
    if (!this.state.mission.missionId) return;

    const missionId = this.state.mission.missionId;
    this.state.completedMissions.completedMissionIds.push(missionId);
    this.state.completedMissions.records.push({
      missionId,
      date: Date.now(),
      score,
    });
    this.state.organisation.successfulMissions++;
    this.state.mission.phase = 'COMPLETED';

    this.eventBus.emit('MissionCompleted', { missionId, score });
    this.eventBus.emit('mission:completed', { missionId, score });
  }

  public enterBuilding(buildingId: string, interiorId: string): void {
    this.eventBus.emit('BuildingEntered', { buildingId, interiorId });
  }

  public resetToDefault(): void {
    this.state = createInitialGameState();
  }
}
