/**
 * INTERSTELLAR CONTINUUM - Communications Network Adapter
 * Interfacing with Prompt 31 Communications Network without direct coupling.
 */

import { RoverCommStatus } from '../ExplorationTypes';
import { CommunicationsNetworkManager } from '../../network/CommunicationsNetworkManager';
import { CoverageRating } from '../../network/NetworkTypes';

export interface ICommunicationsAdapter {
  getCommStatusForRover(roverId: string, destinationId: string): {
    status: RoverCommStatus;
    fidelity: number; // 0 - 100%
    latencySeconds: number;
    bandwidthMultiplier: number;
  };
}

export class CommunicationsNetworkAdapter implements ICommunicationsAdapter {
  public getCommStatusForRover(_roverId: string, destinationId: string): {
    status: RoverCommStatus;
    fidelity: number;
    latencySeconds: number;
    bandwidthMultiplier: number;
  } {
    try {
      const commManager = CommunicationsNetworkManager.getInstance();
      const coverage = commManager.evaluateCoverage(destinationId);

      let status = RoverCommStatus.CONNECTED;
      let fidelity = coverage.telemetryFidelity;
      const latency = coverage.latencySeconds;

      if (coverage.rating === CoverageRating.NONE) {
        status = RoverCommStatus.DISCONNECTED;
        fidelity = 0;
      } else if (coverage.rating === CoverageRating.MINIMAL) {
        status = RoverCommStatus.OCCLUDED;
        fidelity = Math.min(30, fidelity);
      } else if (coverage.rating === CoverageRating.PARTIAL) {
        status = RoverCommStatus.INTERMITTENT;
        fidelity = Math.max(35, Math.min(70, fidelity));
      } else if (coverage.rating === CoverageRating.GOOD) {
        status = RoverCommStatus.WEAK_SIGNAL;
        fidelity = Math.max(75, Math.min(89, fidelity));
      } else {
        status = RoverCommStatus.CONNECTED;
        fidelity = Math.max(90, fidelity);
      }

      return {
        status,
        fidelity,
        latencySeconds: latency,
        bandwidthMultiplier: coverage.scienceMultiplier,
      };
    } catch {
      // Graceful standalone fallback if CommunicationsNetworkManager is not instantiated
      return {
        status: RoverCommStatus.CONNECTED,
        fidelity: 95,
        latencySeconds: 1.2,
        bandwidthMultiplier: 1.0,
      };
    }
  }
}
