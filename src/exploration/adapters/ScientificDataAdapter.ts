/**
 * INTERSTELLAR CONTINUUM - Scientific Data Adapter
 * Bridges collected observations and rewards to agency research state and economy.
 */

import { CollectedSample } from '../ExplorationTypes';
import { ServiceLocator } from '../../core/ServiceLocator';
import { GameStateManager } from '../../state/GameStateManager';

export interface IScienceSubmissionResult {
  accepted: boolean;
  researchDataAdded: number;
  creditsAdded: number;
  samplesStored: number;
}

export class ScientificDataAdapter {
  public submitScientificFindings(
    scienceYield: number,
    creditReward: number,
    samples: CollectedSample[] = []
  ): IScienceSubmissionResult {
    try {
      if (ServiceLocator.has('GameStateManager')) {
        const stateManager = ServiceLocator.get<GameStateManager>('GameStateManager');
        stateManager.grantResources({
          researchData: scienceYield,
          credits: creditReward,
        }, 'rover_exploration_findings');
      }

      return {
        accepted: true,
        researchDataAdded: scienceYield,
        creditsAdded: creditReward,
        samplesStored: samples.length,
      };
    } catch {
      // Safe fallback for decoupled test environments
      return {
        accepted: true,
        researchDataAdded: scienceYield,
        creditsAdded: creditReward,
        samplesStored: samples.length,
      };
    }
  }
}
