/**
 * INTERSTELLAR CONTINUUM - Scientific Discovery Navigation Adapter
 * Interfaces with ScientificDataManager to query catalogued discoveries,
 * research point yields, and destination science progression.
 */

import { ScientificDataManager } from '../../science/ScientificDataManager';
import { ScientificFinding } from '../../science/ScientificTypes';
import { DestinationId } from '../DestinationTypes';

export class ScientificDiscoveryAdapter {
  private scienceManager?: ScientificDataManager;

  constructor(scienceManager?: ScientificDataManager) {
    this.scienceManager = scienceManager ?? this.tryGetScienceManager();
  }

  private tryGetScienceManager(): ScientificDataManager | undefined {
    try {
      return ScientificDataManager.getInstance();
    } catch {
      return undefined;
    }
  }

  /**
   * Retrieves all catalogued scientific findings for a target destination.
   */
  public getFindingsForDestination(destinationId: string): ScientificFinding[] {
    if (!this.scienceManager) return [];
    try {
      return this.scienceManager.getFindingsByDestination(destinationId as DestinationId);
    } catch {
      return [];
    }
  }

  /**
   * Returns count of scientific discoveries logged for destination.
   */
  public getDiscoveriesCount(destinationId: string): number {
    return this.getFindingsForDestination(destinationId).length;
  }

  /**
   * Computes total research points accrued from findings at this destination.
   */
  public getTotalResearchPoints(destinationId: string): number {
    const findings = this.getFindingsForDestination(destinationId);
    return findings.reduce((sum, f) => sum + (f.researchValue || 0), 0);
  }

  public getDiscoveries(destinationId: string): ScientificFinding[] {
    return this.getFindingsForDestination(destinationId);
  }
}
