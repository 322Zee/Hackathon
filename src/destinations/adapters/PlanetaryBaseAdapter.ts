/**
 * INTERSTELLAR CONTINUUM - Planetary Base Navigation Adapter
 * Interfaces with PlanetaryBaseManager to query established outposts,
 * installed modules, power grid status, and surface habitability.
 */

import { PlanetaryBaseManager } from '../../bases/PlanetaryBaseManager';
import { BaseRecord } from '../../bases/BaseTypes';

export class PlanetaryBaseAdapter {
  private baseManager?: PlanetaryBaseManager;

  constructor(baseManager?: PlanetaryBaseManager) {
    this.baseManager = baseManager ?? this.tryGetBaseManager();
  }

  private tryGetBaseManager(): PlanetaryBaseManager | undefined {
    try {
      return PlanetaryBaseManager.getInstance();
    } catch {
      return undefined;
    }
  }

  /**
   * Retrieves all bases constructed at a destination.
   */
  public getBasesForDestination(destinationId: string): BaseRecord[] {
    if (!this.baseManager) return [];
    try {
      return this.baseManager.getBasesForDestination(destinationId as any);
    } catch {
      return [];
    }
  }

  /**
   * Checks whether at least one operational base is established at destination.
   */
  public hasOperationalBase(destinationId: string): boolean {
    const bases = this.getBasesForDestination(destinationId);
    return bases.some((b) => b.operationalStatus === 'OPERATIONAL');
  }

  /**
   * Total installed module count across all bases at destination.
   */
  public getTotalModulesCount(destinationId: string): number {
    const bases = this.getBasesForDestination(destinationId);
    return bases.reduce((sum, b) => sum + (b.installedModules?.length ?? 0), 0);
  }

  public getBases(destinationId: string): BaseRecord[] {
    return this.getBasesForDestination(destinationId);
  }
}
