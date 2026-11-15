/**
 * INTERSTELLAR CONTINUUM - Results Progression Adapter
 * Manages organisational milestone progression, verified achievement submissions,
 * reputation/prestige accumulation, and unlockable equipment/mission access.
 */

import { OrganisationalMilestone } from '../ResultsTypes';
import { ResultsEventBus } from '../ResultsEventBus';

export const DEFAULT_ORGANISATIONAL_MILESTONES: OrganisationalMilestone[] = [
  {
    id: 'MILESTONE_FIRST_LAUNCH',
    title: 'First Atmospheric Escape',
    description: 'Successfully design, ignite, and launch a suborbital or orbital rocket past the Kármán line.',
    category: 'ENGINEERING',
    unlocked: false,
    prestigeReward: 50,
    directorRankRequirement: 1,
    badgeIconKey: 'badge_launch',
  },
  {
    id: 'MILESTONE_FIRST_SATELLITE',
    title: 'Orbital Beacon',
    description: 'Deploy a functioning communications or observation satellite into stable Earth orbit.',
    category: 'ENGINEERING',
    unlocked: false,
    prestigeReward: 75,
    directorRankRequirement: 1,
    badgeIconKey: 'badge_satellite',
  },
  {
    id: 'MILESTONE_FIRST_LUNAR',
    title: 'Cislunar Pioneers',
    description: 'Complete a trans-lunar injection and enter stable Lunar orbit.',
    category: 'EXPLORATION',
    unlocked: false,
    prestigeReward: 150,
    directorRankRequirement: 2,
    badgeIconKey: 'badge_moon',
  },
  {
    id: 'MILESTONE_FIRST_LANDING',
    title: 'Touchdown on Another World',
    description: 'Achieve a soft robotic touchdown on the surface of the Moon or another celestial body.',
    category: 'EXPLORATION',
    unlocked: false,
    prestigeReward: 200,
    directorRankRequirement: 2,
    badgeIconKey: 'badge_landing',
  },
  {
    id: 'MILESTONE_FIRST_ROBOTIC',
    title: 'Autonomous Wheelprints',
    description: 'Deploy and successfully traverse with a surface rover across alien terrain.',
    category: 'EXPLORATION',
    unlocked: false,
    prestigeReward: 175,
    directorRankRequirement: 2,
    badgeIconKey: 'badge_rover',
  },
  {
    id: 'MILESTONE_FIRST_PLANETARY_DISCOVERY',
    title: 'Planetary Insights',
    description: 'Transmit peer-reviewed planetary discovery data from an extraterrestrial scientific survey.',
    category: 'SCIENCE',
    unlocked: false,
    prestigeReward: 125,
    directorRankRequirement: 2,
    badgeIconKey: 'badge_science',
  },
  {
    id: 'MILESTONE_FIRST_BASE',
    title: 'Permanent Outpost',
    description: 'Establish initial planetary base infrastructure on the Moon or Mars surface.',
    category: 'ORGANISATION',
    unlocked: false,
    prestigeReward: 350,
    directorRankRequirement: 3,
    badgeIconKey: 'badge_base',
  },
  {
    id: 'MILESTONE_FIRST_INTERPLANETARY',
    title: 'Interplanetary Horizon',
    description: 'Successfully complete a deep-space cruise and orbital insertion at Mars or Venus.',
    category: 'EXPLORATION',
    unlocked: false,
    prestigeReward: 300,
    directorRankRequirement: 3,
    badgeIconKey: 'badge_mars',
  },
  {
    id: 'MILESTONE_SOLAR_EXPLORATION',
    title: 'Solar System Cartographer',
    description: 'Visit at least three distinct planetary destinations across the Solar System.',
    category: 'EXPLORATION',
    unlocked: false,
    prestigeReward: 500,
    directorRankRequirement: 4,
    badgeIconKey: 'badge_solar_system',
  },
];

export class ResultsProgressionAdapter {
  private milestones: Map<string, OrganisationalMilestone> = new Map();
  private eventBus?: ResultsEventBus;

  private agencyPrestige: number = 0;
  private directorRank: number = 1;
  private rankProgressPoints: number = 0;
  private unlockedMissions: Set<string> = new Set();
  private unlockedEquipment: Set<string> = new Set();

  constructor(eventBus?: ResultsEventBus) {
    this.eventBus = eventBus;
    this.initializeDefaultMilestones();
  }

  private initializeDefaultMilestones(): void {
    for (const m of DEFAULT_ORGANISATIONAL_MILESTONES) {
      this.milestones.set(m.id, { ...m });
    }
  }

  public setEventBus(eventBus?: ResultsEventBus): void {
    this.eventBus = eventBus;
  }

  public getMilestones(): OrganisationalMilestone[] {
    return Array.from(this.milestones.values());
  }

  public getUnlockedMilestones(): OrganisationalMilestone[] {
    return Array.from(this.milestones.values()).filter((m) => m.unlocked);
  }

  public getMilestoneById(id: string): OrganisationalMilestone | undefined {
    return this.milestones.get(id);
  }

  public getAgencyPrestige(): number {
    return this.agencyPrestige;
  }

  public getDirectorRank(): number {
    return this.directorRank;
  }

  public getRankProgressPoints(): number {
    return this.rankProgressPoints;
  }

  public getUnlockedMissions(): string[] {
    return Array.from(this.unlockedMissions);
  }

  public getUnlockedEquipment(): string[] {
    return Array.from(this.unlockedEquipment);
  }

  /**
   * Submits a verified achievement or milestone for registration.
   */
  public submitAchievement(
    milestoneId: string,
    missionId: string
  ): { success: boolean; milestone?: OrganisationalMilestone; reason?: string } {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) {
      return { success: false, reason: `Unknown milestone ID: "${milestoneId}".` };
    }

    if (milestone.unlocked) {
      return { success: false, milestone, reason: `Milestone "${milestone.title}" was already unlocked.` };
    }

    milestone.unlocked = true;
    milestone.unlockedTimestamp = Date.now();
    milestone.achievedInMissionId = missionId;

    this.agencyPrestige += milestone.prestigeReward;
    this.addRankProgress(milestone.prestigeReward * 0.5);

    if (this.eventBus) {
      this.eventBus.emit('MissionAchievementUnlocked', {
        milestone: { ...milestone },
        missionId,
        timestamp: Date.now(),
      });
    }

    return { success: true, milestone: { ...milestone } };
  }

  /**
   * Adds rank progression points and calculates rank upgrades.
   */
  public addRankProgress(points: number): { rankedUp: boolean; newRank: number } {
    if (points <= 0) return { rankedUp: false, newRank: this.directorRank };

    this.rankProgressPoints += points;
    const pointsNeededForNextRank = this.directorRank * 500;

    let rankedUp = false;
    if (this.rankProgressPoints >= pointsNeededForNextRank) {
      this.rankProgressPoints -= pointsNeededForNextRank;
      this.directorRank++;
      rankedUp = true;
    }

    return { rankedUp, newRank: this.directorRank };
  }

  public addPrestige(amount: number): void {
    if (amount > 0) {
      this.agencyPrestige += amount;
      this.addRankProgress(amount * 0.5);
    }
  }

  public unlockMission(missionId: string): void {
    this.unlockedMissions.add(missionId);
  }

  public unlockEquipment(equipmentId: string): void {
    this.unlockedEquipment.add(equipmentId);
  }

  // Persistence helpers
  public exportState(): {
    unlockedMilestoneIds: string[];
    agencyPrestige: number;
    directorRank: number;
    rankProgressPoints: number;
    unlockedMissions: string[];
    unlockedEquipment: string[];
  } {
    return {
      unlockedMilestoneIds: this.getUnlockedMilestones().map((m) => m.id),
      agencyPrestige: this.agencyPrestige,
      directorRank: this.directorRank,
      rankProgressPoints: this.rankProgressPoints,
      unlockedMissions: Array.from(this.unlockedMissions),
      unlockedEquipment: Array.from(this.unlockedEquipment),
    };
  }

  public importState(data: {
    unlockedMilestoneIds?: string[];
    agencyPrestige?: number;
    directorRank?: number;
    rankProgressPoints?: number;
    unlockedMissions?: string[];
    unlockedEquipment?: string[];
  }): void {
    if (data.agencyPrestige !== undefined) this.agencyPrestige = data.agencyPrestige;
    if (data.directorRank !== undefined) this.directorRank = data.directorRank;
    if (data.rankProgressPoints !== undefined) this.rankProgressPoints = data.rankProgressPoints;

    if (data.unlockedMissions) {
      this.unlockedMissions = new Set(data.unlockedMissions);
    }
    if (data.unlockedEquipment) {
      this.unlockedEquipment = new Set(data.unlockedEquipment);
    }

    if (data.unlockedMilestoneIds) {
      for (const id of data.unlockedMilestoneIds) {
        const m = this.milestones.get(id);
        if (m) {
          m.unlocked = true;
        }
      }
    }
  }
}
