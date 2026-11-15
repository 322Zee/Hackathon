/**
 * INTERSTELLAR CONTINUUM - Planetary Base Communications Adapter
 * Connects base communications relay modules to CommunicationsNetworkManager.
 * Computes telemetry latency, signal gain, and registers base relay nodes.
 */

import { CommunicationsNetworkManager } from '../../network/CommunicationsNetworkManager';
import { RelayLocationType } from '../../network/NetworkTypes';
import { DestinationId } from '../../destinations/DestinationTypes';
import { BaseCommunicationsStatus, BaseCommLinkType } from '../BaseTypes';

export class CommunicationsAdapter {
  private networkManager?: CommunicationsNetworkManager;

  constructor(networkManager?: CommunicationsNetworkManager) {
    this.networkManager = networkManager;
  }

  public setNetworkManager(manager?: CommunicationsNetworkManager): void {
    this.networkManager = manager;
  }

  /**
   * Computes communications status for a base given its destination and installed comms gain.
   */
  public evaluateBaseLink(
    destinationId: DestinationId,
    totalCommsGainDb: number = 0,
    basePowered: boolean = true
  ): BaseCommunicationsStatus {
    if (!basePowered) {
      return {
        isConnected: false,
        linkType: BaseCommLinkType.DISCONNECTED,
        signalQuality: 0,
        bandwidthGbps: 0,
        latencySeconds: 9999,
      };
    }

    // Baseline latency per destination (educational values)
    let baseLatency = 1.3; // Moon
    if (destinationId === DestinationId.MARS) baseLatency = 720;
    else if (destinationId === DestinationId.EUROPA) baseLatency = 2400;
    else if (destinationId === DestinationId.TITAN) baseLatency = 4800;
    else if (destinationId === DestinationId.CERES) baseLatency = 1300;

    // Check with network manager if available
    if (this.networkManager) {
      try {
        const coverage = this.networkManager.getDestinationCoverage(destinationId as string);
        if (coverage) {
          const signalQuality = Math.min(
            100,
            Math.round(coverage.coveragePercentage * 0.7 + totalCommsGainDb * 1.5)
          );
          const bandwidth = Math.round(coverage.effectiveThroughputGbps + totalCommsGainDb * 5);
          const latency = Math.max(1, Math.round(coverage.roundTripLatencySeconds * 0.5));

          return {
            isConnected: signalQuality > 15,
            linkType:
              coverage.relaysInService > 0
                ? BaseCommLinkType.ORBITAL_RELAY
                : BaseCommLinkType.DEEP_SPACE_NETWORK,
            signalQuality,
            bandwidthGbps: bandwidth,
            latencySeconds: latency,
          };
        }
      } catch {
        // Fallback to standalone calculation if network query fails
      }
    }

    // Standalone calculation
    const signalQuality = Math.min(100, Math.max(20, Math.round(50 + totalCommsGainDb * 2)));
    const bandwidthGbps = Math.max(25, 50 + totalCommsGainDb * 4);

    return {
      isConnected: true,
      linkType: totalCommsGainDb > 25 ? BaseCommLinkType.ORBITAL_RELAY : BaseCommLinkType.DIRECT_LOS,
      signalQuality,
      bandwidthGbps,
      latencySeconds: baseLatency,
    };
  }

  /**
   * Registers a base communications relay module as a planetary surface relay in the network.
   */
  public registerBaseRelayNode(
    baseId: string,
    baseName: string,
    destinationId: DestinationId,
    gainDb: number
  ): string | undefined {
    if (!this.networkManager) return undefined;

    const relayId = `RELAY_BASE_${baseId}`;
    try {
      this.networkManager.deployRelayStation({
        id: relayId,
        name: `${baseName} Surface Relay Terminal`,
        deploymentLocation: destinationId as string,
        locationType: RelayLocationType.SURFACE,
        signalGain: gainDb,
        channelThroughput: 80 + gainDb * 3,
        coverageRadiusKm: 5000,
        carrierFrequencyBand: 'S_BAND',
        maintenanceCost: 150,
      });
      return relayId;
    } catch {
      return undefined;
    }
  }
}
