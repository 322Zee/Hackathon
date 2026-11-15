import { EventBus } from '../core/EventBus';

export type MissionCategory =
  | 'SUBORBITAL_TEST'
  | 'ORBITAL_DEPLOYMENT'
  | 'LUNAR_RECONNAISSANCE'
  | 'PLANETARY_PROBE'
  | 'CREW_TRANSPORT'
  | 'DEEP_SPACE_EXPLORATION';

export interface MissionObjective {
  id: string;
  description: string;
  targetAltitudeKm?: number;
  targetTargetBody?: string;
  requiredDeltaVMetersPerSec?: number;
  completed: boolean;
}

export interface MissionDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  category: MissionCategory;
  destinationBody: string;
  minTechLevel: number;
  rewardCredits: number;
  rewardResearch: number;
  objectives: MissionObjective[];
}

export class MissionService {
  private activeMissions: Map<string, MissionDefinition> = new Map();
  private completedMissionIds: Set<string> = new Set();
  private eventBus: EventBus;

  constructor(eventBus: EventBus, initialCompleted: string[] = []) {
    this.eventBus = eventBus;
    this.completedMissionIds = new Set(initialCompleted);
  }

  public startMission(mission: MissionDefinition): void {
    this.activeMissions.set(mission.id, { ...mission });
    this.eventBus.emit('mission:started', { missionId: mission.id });
  }

  public completeMission(missionId: string, performanceScore: number): void {
    if (this.activeMissions.has(missionId)) {
      this.activeMissions.delete(missionId);
      this.completedMissionIds.add(missionId);
      this.eventBus.emit('mission:completed', { missionId, score: performanceScore });
    }
  }

  public failMission(missionId: string, reason: string): void {
    if (this.activeMissions.has(missionId)) {
      this.activeMissions.delete(missionId);
      this.eventBus.emit('mission:failed', { missionId, reason });
    }
  }

  public isMissionCompleted(missionId: string): boolean {
    return this.completedMissionIds.has(missionId);
  }

  public getActiveMissions(): MissionDefinition[] {
    return Array.from(this.activeMissions.values());
  }

  public getCompletedMissionCount(): number {
    return this.completedMissionIds.size;
  }
}
