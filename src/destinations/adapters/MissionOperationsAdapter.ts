/**
 * INTERSTELLAR CONTINUUM - Mission Operations Navigation Adapter
 * Interfaces with MissionCatalogueRegistry and MissionLifecycleManager
 * to extract authored mission opportunities, active flights, and mission states.
 */

import { DestinationId } from '../DestinationTypes';
import { MissionCatalogueRegistry } from '../../missions/MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../../missions/MissionLifecycleManager';
import { MissionDefinition } from '../../missions/MissionTypes';

export interface DestinationMissionOpportunity {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly sequenceLevel: number;
  readonly rewardCredits: number;
  readonly rewardScience: number;
  readonly isAvailable: boolean;
  readonly isActive: boolean;
  readonly unmetPrerequisites: readonly string[];
}

export class MissionOperationsAdapter {
  private catalogueRegistry: MissionCatalogueRegistry;
  private lifecycleManager?: MissionLifecycleManager;

  constructor(
    catalogueRegistry?: MissionCatalogueRegistry,
    lifecycleManager?: MissionLifecycleManager
  ) {
    this.catalogueRegistry = catalogueRegistry ?? MissionCatalogueRegistry.getInstance();
    this.lifecycleManager = lifecycleManager ?? this.tryGetLifecycleManager();
  }

  private tryGetLifecycleManager(): MissionLifecycleManager | undefined {
    try {
      return MissionLifecycleManager.getInstance();
    } catch {
      return undefined;
    }
  }

  /**
   * Returns all authored missions bound to a destination (or its sub-destinations).
   */
  public getMissionsForDestination(destinationId: string): DestinationMissionOpportunity[] {
    try {
      const allMissions = this.catalogueRegistry.getAllMissions();
      const destMissions = allMissions.filter(
        (m) => m.destinationId === destinationId || m.parentDestinationId === destinationId
      );

      const activeMissionIds = new Set<string>();
      if (this.lifecycleManager) {
        try {
          const activeList = this.lifecycleManager.getActiveMissions();
          for (const a of activeList) {
            activeMissionIds.add(a.missionId);
          }
        } catch {
          // Fallback if lifecycle manager has no active missions
        }
      }

      return destMissions.map((m: MissionDefinition) => {
        let isAvailable = false;
        let unmet: string[] = [];

        try {
          const evalResult = this.catalogueRegistry.evaluateMissionStatus(m.id);
          isAvailable = evalResult.status === 'AVAILABLE';
          unmet = evalResult.unmetPrerequisites;
        } catch {
          // If progression evaluation fails, fallback
          isAvailable = true;
        }

        return {
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description,
          sequenceLevel: m.sequenceLevel,
          rewardCredits: m.rewards.credits,
          rewardScience: m.rewards.science,
          isAvailable,
          isActive: activeMissionIds.has(m.id),
          unmetPrerequisites: unmet,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Returns active missions targeting a destination.
   */
  public getActiveMissionsForDestination(destinationId: string): any[] {
    if (!this.lifecycleManager) return [];
    try {
      const active = this.lifecycleManager.getActiveMissions();
      return active.filter((m) => m.destinationId === destinationId);
    } catch {
      return [];
    }
  }

  /**
   * Returns count of available mission opportunities for a destination.
   */
  public getAvailableOpportunitiesCount(destinationId: string): number {
    const list = this.getMissionsForDestination(destinationId);
    return list.filter((m) => m.isAvailable).length;
  }

  public getAllMissionOpportunities(destinationId: string): DestinationMissionOpportunity[] {
    return this.getMissionsForDestination(destinationId);
  }

  public getAvailableMissions(destinationId: string): DestinationMissionOpportunity[] {
    return this.getMissionsForDestination(destinationId).filter((m) => m.isAvailable);
  }

  public getActiveMissions(destinationId: string): any[] {
    return this.getActiveMissionsForDestination(destinationId);
  }

  public hasActiveMission(destinationId: string): boolean {
    return this.getActiveMissionsForDestination(destinationId).length > 0;
  }

  public hasAvailableMissions(destinationId: string): boolean {
    return this.getAvailableOpportunitiesCount(destinationId) > 0;
  }
}
