/**
 * INTERSTELLAR CONTINUUM - Network Coverage Evaluation Engine
 * Deterministic and explainable abstract coverage calculation engine.
 *
 * NOTE: Strictly adheres to fictional game mechanics and abstract ratings.
 * Zero real-world orbital mechanics or radio frequency propagation equations.
 */

import {
  GroundStationRecord,
  GroundStationStatus,
  SatelliteRecord,
  SatelliteStatus,
  PlanetaryRelayRecord,
  RelayOperationalState,
  NetworkOutageRecord,
  DestinationCoverageRecord,
  CoverageRating,
  InfrastructureType,
} from './NetworkTypes';
import { DestinationAdapter, DistanceTier } from './adapters/DestinationAdapter';
import { DestinationId } from '../destinations/DestinationTypes';

export class NetworkCoverageEngine {
  private destinationAdapter: DestinationAdapter;

  constructor(destinationAdapter?: DestinationAdapter) {
    this.destinationAdapter = destinationAdapter ?? new DestinationAdapter();
  }

  public setDestinationAdapter(adapter: DestinationAdapter): void {
    this.destinationAdapter = adapter;
  }

  /**
   * Evaluate abstract coverage for a specific celestial destination.
   * Completely deterministic given the infrastructure state and active outages.
   */
  public evaluateCoverage(
    destinationId: string,
    groundStations: GroundStationRecord[],
    satellites: SatelliteRecord[],
    relays: PlanetaryRelayRecord[],
    outages: NetworkOutageRecord[]
  ): DestinationCoverageRecord {
    const profile = this.destinationAdapter.getDestinationProfile(destinationId);
    const destinationName = profile.name;

    // Filter operational ground stations
    const operationalStations = groundStations.filter(
      (s) => s.isUnlocked && (s.status === GroundStationStatus.OPERATIONAL || s.status === GroundStationStatus.DEGRADED)
    );

    // Filter active satellites relevant to this destination or regional gateways
    const relevantSatellites = satellites.filter(
      (s) =>
        (s.status === SatelliteStatus.ACTIVE || s.status === SatelliteStatus.CALIBRATING) &&
        (s.destinationId === destinationId ||
          (profile.distanceTier === DistanceTier.EARTH_ORBIT && s.destinationId === DestinationId.EARTH_ORBIT_LEO) ||
          (profile.distanceTier !== DistanceTier.EARTH_ORBIT && s.destinationId === DestinationId.EARTH_ORBIT_GEO))
    );

    // Filter active relays at or parent of this destination
    const relevantRelays = relays.filter(
      (r) =>
        r.deploymentLocation === destinationId &&
        r.operationalState !== RelayOperationalState.OFFLINE
    );

    // Find active outages affecting this destination or its infrastructure
    const destinationOutages = outages.filter((o) => {
      if (o.isResolved) return false;
      if (o.targetId === destinationId) return true;
      if (o.targetType === InfrastructureType.GROUND_STATION && operationalStations.some((s) => s.id === o.targetId)) {
        return true;
      }
      if (o.targetType === InfrastructureType.COMMUNICATION_SATELLITE && relevantSatellites.some((s) => s.id === o.targetId)) {
        return true;
      }
      if (o.targetType === InfrastructureType.PLANETARY_RELAY && relevantRelays.some((r) => r.id === o.targetId)) {
        return true;
      }
      return false;
    });

    // 1. Calculate Base Ground Station Network Factor
    // Having multiple ground stations across Earth longitudes prevents rotational blind spots
    let groundStationScore = 0;
    if (operationalStations.length === 1) {
      groundStationScore = 40; // Single station has blind spots
    } else if (operationalStations.length === 2) {
      groundStationScore = 70;
    } else if (operationalStations.length >= 3) {
      groundStationScore = 95; // 3+ stations across Earth (Goldstone, Madrid, Canberra) gives near continuous Earth line-of-sight
    }

    // Average upgrade level contribution of operational ground stations
    const avgStationUpgrade = operationalStations.length > 0
      ? operationalStations.reduce((sum, s) => sum + s.upgradeLevel, 0) / operationalStations.length
      : 1;

    // Degraded stations slightly reduce score
    const degradedCount = operationalStations.filter((s) => s.status === GroundStationStatus.DEGRADED).length;
    groundStationScore = Math.max(0, groundStationScore - degradedCount * 10);

    // 2. Evaluate Distance Tier Attenuation & Local Assets
    let rawCoverage = 0;
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    switch (profile.distanceTier) {
      case DistanceTier.EARTH_ORBIT: {
        // In Earth Orbit, ground stations provide direct visibility.
        // Satellites boost score to 100% and provide low latency.
        rawCoverage = groundStationScore;

        for (const sat of relevantSatellites) {
          rawCoverage += sat.networkContribution.coverageBonus;
        }

        if (operationalStations.length < 3) {
          bottlenecks.push('Earth rotation creates periodic telemetry blackouts without 3 distinct ground stations.');
          recommendations.push('Construct or unlock additional ground stations across Earth longitudes.');
        }
        if (relevantSatellites.length === 0) {
          recommendations.push('Deploy LEO relay satellites to ensure uninterrupted telemetry during polar passes.');
        }
        break;
      }

      case DistanceTier.LUNAR: {
        // Lunar near-side can see Earth, but far-side has zero Earth line-of-sight.
        // Base ground stations provide up to 50% (near-side only).
        const earthUplinkFactor = Math.min(50, groundStationScore * 0.55);
        let lunarLocalBonus = 0;

        for (const sat of relevantSatellites) {
          lunarLocalBonus += sat.networkContribution.coverageBonus;
        }
        for (const relay of relevantRelays) {
          lunarLocalBonus += relay.networkContribution.localSurfaceBonus;
        }

        rawCoverage = earthUplinkFactor + lunarLocalBonus;

        if (relevantSatellites.length === 0 && relevantRelays.length === 0) {
          bottlenecks.push('No Lunar orbiter or surface relay active. Far-side is completely occluded from Earth.');
          recommendations.push('Deploy a Lunar Polar Orbiter or Shackleton Crater relay station.');
        }
        break;
      }

      case DistanceTier.INNER_SYSTEM: {
        // Mercury, Venus, Sun: requires strong ground station gain plus interplanetary carrier.
        const dsnReach = (groundStationScore * 0.3) * (0.8 + avgStationUpgrade * 0.2);
        let interplanetaryBonus = 0;

        for (const sat of relevantSatellites) {
          interplanetaryBonus += sat.networkContribution.coverageBonus;
        }
        for (const relay of relevantRelays) {
          interplanetaryBonus += relay.networkContribution.localSurfaceBonus;
        }

        rawCoverage = dsnReach + interplanetaryBonus;

        if (avgStationUpgrade < 2) {
          bottlenecks.push('Earth ground stations lack high-gain deep-space dish upgrades for solar distance.');
          recommendations.push('Upgrade Earth ground station arrays to Level 2 or higher.');
        }
        break;
      }

      case DistanceTier.MARS: {
        // Mars requires Deep Space Network dishes + Mars Orbiter / Surface Relay
        const dsnReach = (groundStationScore * 0.25) * (0.7 + avgStationUpgrade * 0.25);
        let marsLocalBonus = 0;

        for (const sat of relevantSatellites) {
          marsLocalBonus += sat.networkContribution.coverageBonus;
        }
        for (const relay of relevantRelays) {
          marsLocalBonus += relay.networkContribution.localSurfaceBonus;
        }

        rawCoverage = dsnReach + marsLocalBonus;

        if (relevantSatellites.length === 0 && relevantRelays.length === 0) {
          bottlenecks.push('Absence of dedicated Mars relay infrastructure severely limits planetary link margin.');
          recommendations.push('Deploy an Areostationary communication satellite or Jezero surface relay terminal.');
        }
        if (avgStationUpgrade < 2) {
          recommendations.push('Upgrade Ground Stations to Tier 2+ to boost deep space carrier signal.');
        }
        break;
      }

      case DistanceTier.ASTEROID_BELT:
      case DistanceTier.JOVIAN: {
        // Jovian / Ceres: massive distances, high path attenuation
        const dsnReach = (groundStationScore * 0.15) * (0.5 + avgStationUpgrade * 0.3);
        let localRelayBonus = 0;

        for (const sat of relevantSatellites) {
          localRelayBonus += sat.networkContribution.coverageBonus * 0.9;
        }
        for (const relay of relevantRelays) {
          localRelayBonus += relay.networkContribution.localSurfaceBonus * 0.9;
        }

        rawCoverage = dsnReach + localRelayBonus;

        if (relevantRelays.length === 0 && relevantSatellites.length === 0) {
          bottlenecks.push('Extremely high distance path loss. Deep-space autonomous relay needed.');
          recommendations.push('Deploy a radiation-hardened Jovian orbital relay station.');
        }
        break;
      }

      case DistanceTier.OUTER_SYSTEM:
      default: {
        // Saturn, Uranus, Neptune, Pluto: requires multi-hop deep space infrastructure
        const dsnReach = (groundStationScore * 0.1) * (0.4 + avgStationUpgrade * 0.3);
        let localBonus = 0;

        for (const sat of relevantSatellites) {
          localBonus += sat.networkContribution.coverageBonus * 0.8;
        }
        for (const relay of relevantRelays) {
          localBonus += relay.networkContribution.localSurfaceBonus * 0.8;
        }

        rawCoverage = dsnReach + localBonus;

        if (localBonus === 0) {
          bottlenecks.push('Signal propagation beyond Asteroid Belt requires local planetary transceivers.');
          recommendations.push('Deploy multi-hop planetary relays at destination.');
        }
        break;
      }
    }

    // 3. Apply Outages Penalty
    let outageMultiplier = 1.0;
    for (const outage of destinationOutages) {
      outageMultiplier *= Math.max(0.05, 1.0 - outage.severity * 0.85);
      bottlenecks.push(`Active Outage [${outage.outageType}]: ${outage.description}`);
    }

    let finalCoverage = Math.round(rawCoverage * outageMultiplier);
    finalCoverage = Math.max(0, Math.min(100, finalCoverage));

    // 4. Rating Classification
    let rating: CoverageRating;
    if (finalCoverage >= 90) {
      rating = CoverageRating.OPTIMAL;
    } else if (finalCoverage >= 75) {
      rating = CoverageRating.GOOD;
    } else if (finalCoverage >= 45) {
      rating = CoverageRating.PARTIAL;
    } else if (finalCoverage >= 20) {
      rating = CoverageRating.MINIMAL;
    } else {
      rating = CoverageRating.NONE;
    }

    // 5. Telemetry & Science Multiplier Calculation
    // Telemetry fidelity: 10% base + 90% of coverage percentage
    const telemetryFidelity = Math.round(Math.min(100, Math.max(5, finalCoverage * 0.95 + 5)));

    // Science Multiplier: 0.5x at 0% coverage up to 2.5x at 100% coverage
    // Reflects high bandwidth enabling uncompressed science data streams
    const scienceMultiplier = parseFloat(
      (0.5 + (finalCoverage / 100) * 1.5 + (avgStationUpgrade - 1) * 0.1).toFixed(2)
    );

    // Latency calculation: destination base latency reduced by active satellites
    let latencyReductionFactor = 0;
    for (const sat of relevantSatellites) {
      latencyReductionFactor += sat.networkContribution.latencyReduction;
    }
    latencyReductionFactor = Math.min(0.5, latencyReductionFactor);
    const latencySeconds = parseFloat(
      Math.max(0.02, profile.baseLatencySeconds * (1.0 - latencyReductionFactor)).toFixed(2)
    );

    const hasContinuousLineOfSight = finalCoverage >= 75 && destinationOutages.length === 0;
    const directEarthVisibility = profile.distanceTier === DistanceTier.EARTH_ORBIT ||
      (profile.distanceTier === DistanceTier.LUNAR && relevantRelays.length > 0);

    return {
      destinationId,
      destinationName,
      coveragePercentage: finalCoverage,
      rating,
      telemetryFidelity,
      scienceMultiplier,
      latencySeconds,
      hasContinuousLineOfSight,
      directEarthVisibility,
      contributingGroundStations: operationalStations.map((s) => s.id),
      contributingSatellites: relevantSatellites.map((s) => s.id),
      contributingRelays: relevantRelays.map((r) => r.id),
      activeOutages: destinationOutages,
      bottlenecks,
      recommendations,
    };
  }
}
