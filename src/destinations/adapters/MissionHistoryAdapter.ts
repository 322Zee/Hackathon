/**
 * INTERSTELLAR CONTINUUM - Mission History Navigation Adapter
 * Interfaces with MissionResultsManager and MissionHistoryArchive
 * to report completed mission records, performance ratings, and destination flight history.
 */

import { MissionResultsManager } from '../../results/MissionResultsManager';
import { MissionResultRecord } from '../../results/ResultsTypes';

export class MissionHistoryAdapter {
  private resultsManager?: MissionResultsManager;

  constructor(resultsManager?: MissionResultsManager) {
    this.resultsManager = resultsManager ?? this.tryGetResultsManager();
  }

  private tryGetResultsManager(): MissionResultsManager | undefined {
    try {
      return MissionResultsManager.getInstance();
    } catch {
      return undefined;
    }
  }

  /**
   * Retrieves all completed mission history records for a target destination.
   */
  public getCompletedMissionsForDestination(destinationId: string): MissionResultRecord[] {
    if (!this.resultsManager) return [];
    try {
      const history = this.resultsManager.getHistory({ destinationId });
      return history.filter((r) => r.status === 'COMPLETED');
    } catch {
      return [];
    }
  }

  /**
   * Checks whether a destination has been visited at least once in historical mission logs.
   */
  public hasBeenVisited(destinationId: string): boolean {
    const records = this.getCompletedMissionsForDestination(destinationId);
    return records.length > 0;
  }

  /**
   * Checks whether a solid surface landing or surface rover mission was accomplished.
   */
  public hasSurfaceLanding(destinationId: string): boolean {
    const records = this.getCompletedMissionsForDestination(destinationId);
    return records.some((r) =>
      r.objectivesSummary.completedObjectiveIds.some(
        (objId) => objId.includes('landing') || objId.includes('surface') || objId.includes('rover')
      )
    );
  }

  public getCompletedMissions(destinationId: string): MissionResultRecord[] {
    return this.getCompletedMissionsForDestination(destinationId);
  }

  public getCompletedMissionCount(destinationId: string): number {
    return this.getCompletedMissionsForDestination(destinationId).length;
  }

  public isDestinationVisited(destinationId: string): boolean {
    return this.hasBeenVisited(destinationId);
  }
}
