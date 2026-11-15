/**
 * INTERSTELLAR CONTINUUM - Organisation Progression Navigation Adapter
 * Interfaces with DestinationProgressionManager and DestinationRegistry
 * to evaluate unlock rules, requirements, and agency exploration frontier progression.
 */

import { DestinationRegistry } from '../DestinationRegistry';
import { DestinationProgressionManager } from '../DestinationProgressionManager';
import { DestinationUnlockState, DestinationRecord } from '../DestinationTypes';

export class OrganisationProgressionAdapter {
  private registry: DestinationRegistry;
  private progressionManager: DestinationProgressionManager;

  constructor(
    registry?: DestinationRegistry,
    progressionManager?: DestinationProgressionManager
  ) {
    this.registry = registry ?? DestinationRegistry.getInstance();
    this.progressionManager = progressionManager ?? DestinationProgressionManager.getInstance();
  }

  /**
   * Checks whether a destination is unlocked and accessible to agency spacecraft.
   */
  public isUnlocked(destinationId: string): boolean {
    return this.registry.isUnlocked(destinationId);
  }

  /**
   * Evaluates dynamic unlock conditions and returns progress percentage.
   */
  public evaluateProgress(destinationId: string): {
    state: DestinationUnlockState;
    percentage: number;
    unmetConditions: string[];
  } {
    const dest = this.registry.getDestination(destinationId);
    if (!dest) {
      return { state: DestinationUnlockState.LOCKED, percentage: 0, unmetConditions: ['Destination not registered'] };
    }

    if (this.registry.isUnlocked(destinationId)) {
      return { state: DestinationUnlockState.UNLOCKED, percentage: 100, unmetConditions: [] };
    }

    try {
      const evaluation = this.registry.evaluateProgression(destinationId);
      if (evaluation) {
        return {
          state: evaluation.unlockState,
          percentage: evaluation.overallProgressPercent,
          unmetConditions: evaluation.requirements.filter((r) => !r.isMet).map((r) => r.description),
        };
      }
    } catch {
      // Fallback
    }

    return {
      state: DestinationUnlockState.LOCKED,
      percentage: 0,
      unmetConditions: [dest.unlockRequirementsText || 'Requirements locked'],
    };
  }

  /**
   * Computes the agency's overall Solar System exploration frontier percentage.
   */
  public getOverallFrontierPercentage(): number {
    const all = this.registry.getAllDestinations();
    if (all.length === 0) return 0;
    const unlocked = all.filter((d: DestinationRecord) => this.registry.isUnlocked(d.id)).length;
    return Math.round((unlocked / all.length) * 100);
  }

  /**
   * Alias for evaluateProgress
   */
  public getProgress(destinationId: string): {
    state: string;
    percentage: number;
    unmetConditions: string[];
  } {
    const res = this.evaluateProgress(destinationId);
    return {
      state: String(res.state),
      percentage: res.percentage,
      unmetConditions: res.unmetConditions,
    };
  }

  /**
   * Returns all destinations currently unlocked.
   */
  public getUnlockedDestinations(): DestinationRecord[] {
    return this.registry.getUnlockedDestinations();
  }
}
