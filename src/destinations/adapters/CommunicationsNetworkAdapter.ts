/**
 * INTERSTELLAR CONTINUUM - Communications Network Navigation Adapter
 * Interfaces with CommunicationsNetworkManager to query interplanetary telemetry,
 * ground stations, orbital satellites, and planetary relays.
 */

import { CommunicationsNetworkManager } from '../../network/CommunicationsNetworkManager';
import { CoverageRating } from '../../network/NetworkTypes';

export class CommunicationsNetworkAdapter {
  private networkManager?: CommunicationsNetworkManager;

  constructor(networkManager?: CommunicationsNetworkManager) {
    this.networkManager = networkManager ?? this.tryGetNetworkManager();
  }

  private tryGetNetworkManager(): CommunicationsNetworkManager | undefined {
    try {
      return CommunicationsNetworkManager.getInstance();
    } catch {
      return undefined;
    }
  }

  /**
   * Evaluates telemetry coverage summary for a destination.
   */
  public getCoverageSummary(destinationId: string): {
    hasRelay: boolean;
    hasSatellite: boolean;
    coverageScorePercent: number;
    signalRating: string;
  } {
    if (!this.networkManager) {
      return { hasRelay: false, hasSatellite: false, coverageScorePercent: 0, signalRating: 'OFFLINE' };
    }

    try {
      const relays = this.networkManager.getAllRelays().filter((r) => r.destinationId === destinationId);
      const sats = this.networkManager.getAllSatellites().filter((s) => s.destinationId === destinationId);
      const coverage = this.networkManager.evaluateCoverage(destinationId);

      return {
        hasRelay: relays.some((r) => r.operationalStatus === 'OPERATIONAL'),
        hasSatellite: sats.some((s) => s.operationalStatus === 'ACTIVE'),
        coverageScorePercent: coverage.coveragePercentage,
        signalRating: coverage.rating,
      };
    } catch {
      return { hasRelay: false, hasSatellite: false, coverageScorePercent: 0, signalRating: 'OFFLINE' };
    }
  }

  /**
   * Returns true if destination has active satellite or relay infrastructure.
   */
  public hasCommsInfrastructure(destinationId: string): boolean {
    const summary = this.getCoverageSummary(destinationId);
    return summary.hasRelay || summary.hasSatellite || summary.signalRating !== 'OFFLINE';
  }

  public getCoverage(destinationId: string) {
    return this.getCoverageSummary(destinationId);
  }

  public isCommsConnected(destinationId: string): boolean {
    return this.hasCommsInfrastructure(destinationId);
  }
}
