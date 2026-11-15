import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkCoverageEngine } from '../../src/network/NetworkCoverageEngine';
import { DestinationAdapter } from '../../src/network/adapters/DestinationAdapter';
import {
  GroundStationRecord,
  GroundStationStatus,
  SatelliteRecord,
  SatelliteStatus,
  SatelliteType,
  PlanetaryRelayRecord,
  RelayOperationalState,
  RelayLocationType,
  NetworkOutageRecord,
  InfrastructureType,
  OutageType,
  CoverageRating,
} from '../../src/network/NetworkTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('NetworkCoverageEngine', () => {
  let engine: NetworkCoverageEngine;
  let defaultStations: GroundStationRecord[];
  let defaultSatellites: SatelliteRecord[];
  let defaultRelays: PlanetaryRelayRecord[];

  beforeEach(() => {
    engine = new NetworkCoverageEngine(new DestinationAdapter());

    defaultStations = [
      {
        id: 'GS_GOLDSTONE',
        name: 'Goldstone',
        location: 'California',
        longitudeDeg: -116.8,
        latitudeDeg: 35.4,
        status: GroundStationStatus.OPERATIONAL,
        capacityRating: 250,
        upgradeLevel: 1,
        maxUpgradeLevel: 5,
        maintenanceCost: 400,
        unlockRequirements: {},
        isUnlocked: true,
        signalGainDb: 22,
        dishDiameterMeters: 34,
        supportedBands: ['X-Band'],
        activeConnectionsCount: 0,
      },
      {
        id: 'GS_MADRID',
        name: 'Madrid',
        location: 'Spain',
        longitudeDeg: -4.25,
        latitudeDeg: 40.4,
        status: GroundStationStatus.OPERATIONAL,
        capacityRating: 240,
        upgradeLevel: 1,
        maxUpgradeLevel: 5,
        maintenanceCost: 380,
        unlockRequirements: {},
        isUnlocked: true,
        signalGainDb: 21.5,
        dishDiameterMeters: 34,
        supportedBands: ['X-Band'],
        activeConnectionsCount: 0,
      },
      {
        id: 'GS_CANBERRA',
        name: 'Canberra',
        location: 'Australia',
        longitudeDeg: 148.98,
        latitudeDeg: -35.4,
        status: GroundStationStatus.OPERATIONAL,
        capacityRating: 260,
        upgradeLevel: 1,
        maxUpgradeLevel: 5,
        maintenanceCost: 420,
        unlockRequirements: {},
        isUnlocked: true,
        signalGainDb: 22.5,
        dishDiameterMeters: 34,
        supportedBands: ['X-Band'],
        activeConnectionsCount: 0,
      },
    ];

    defaultSatellites = [
      {
        id: 'SAT_LEO_1',
        name: 'LEO Relay',
        satelliteType: SatelliteType.LEO_RELAY,
        status: SatelliteStatus.ACTIVE,
        networkContribution: {
          coverageBonus: 20,
          bandwidthBonus: 50,
          latencyReduction: 0.15,
          signalStrengthBonus: 15,
        },
        destinationId: DestinationId.EARTH_ORBIT_LEO,
        upgradeLevel: 1,
        maxUpgradeLevel: 3,
        operationalCost: 100,
        powerStatus: 100,
      },
    ];

    defaultRelays = [
      {
        id: 'RELAY_MARS_JEZERO',
        name: 'Jezero Surface Relay',
        deploymentLocation: DestinationId.MARS,
        locationType: RelayLocationType.SURFACE,
        operationalState: RelayOperationalState.OPERATIONAL,
        networkContribution: {
          localSurfaceBonus: 45,
          rangeMultiplier: 1.35,
          linkRating: 200,
        },
        upgradeLevel: 1,
        maxUpgradeLevel: 4,
        upgradeOptions: [],
        maintenanceCost: 400,
        lastServicedTimestamp: Date.now(),
        conditionRating: 100,
      },
    ];
  });

  it('determines that Earth orbit coverage scales with ground stations across longitudes', () => {
    // 1 Station only
    const singleStationCov = engine.evaluateCoverage(
      DestinationId.EARTH_ORBIT_LEO,
      [defaultStations[0]],
      [],
      [],
      []
    );
    expect(singleStationCov.coveragePercentage).toBe(40);
    expect(singleStationCov.bottlenecks.length).toBeGreaterThan(0);

    // 2 Stations
    const twoStationsCov = engine.evaluateCoverage(
      DestinationId.EARTH_ORBIT_LEO,
      [defaultStations[0], defaultStations[1]],
      [],
      [],
      []
    );
    expect(twoStationsCov.coveragePercentage).toBe(70);

    // 3 Stations (Goldstone, Madrid, Canberra) eliminates rotational blind spots
    const threeStationsCov = engine.evaluateCoverage(
      DestinationId.EARTH_ORBIT_LEO,
      defaultStations,
      [],
      [],
      []
    );
    expect(threeStationsCov.coveragePercentage).toBe(95);
    expect(threeStationsCov.rating).toBe(CoverageRating.OPTIMAL);
  });

  it('adds satellite network contribution to achieve 100% Earth LEO coverage', () => {
    const cov = engine.evaluateCoverage(
      DestinationId.EARTH_ORBIT_LEO,
      defaultStations,
      defaultSatellites,
      [],
      []
    );
    expect(cov.coveragePercentage).toBe(100);
    expect(cov.rating).toBe(CoverageRating.OPTIMAL);
    expect(cov.telemetryFidelity).toBe(100);
    expect(cov.hasContinuousLineOfSight).toBe(true);
  });

  it('evaluates Lunar coverage correctly with and without dedicated lunar relays', () => {
    // Without lunar relay: only Earth near-side visibility (max 50%)
    const noRelayCov = engine.evaluateCoverage(
      DestinationId.MOON,
      defaultStations,
      [],
      [],
      []
    );
    expect(noRelayCov.coveragePercentage).toBeLessThanOrEqual(50);
    expect(noRelayCov.bottlenecks[0]).toContain('Far-side is completely occluded');

    // With Lunar Polar Orbiter satellite
    const lunarSat: SatelliteRecord = {
      id: 'SAT_LUNAR_1',
      name: 'Lunar Polar Relay',
      satelliteType: SatelliteType.LUNAR_ORBITER,
      status: SatelliteStatus.ACTIVE,
      networkContribution: {
        coverageBonus: 45,
        bandwidthBonus: 80,
        latencyReduction: 0.2,
        signalStrengthBonus: 20,
      },
      destinationId: DestinationId.MOON,
      upgradeLevel: 1,
      maxUpgradeLevel: 4,
      operationalCost: 300,
      powerStatus: 100,
    };

    const withRelayCov = engine.evaluateCoverage(
      DestinationId.MOON,
      defaultStations,
      [lunarSat],
      [],
      []
    );
    expect(withRelayCov.coveragePercentage).toBeGreaterThanOrEqual(90);
    expect(withRelayCov.rating).toBe(CoverageRating.OPTIMAL);
  });

  it('evaluates Mars coverage and highlights relay requirement', () => {
    // Mars with no local relay
    const noMarsRelayCov = engine.evaluateCoverage(
      DestinationId.MARS,
      defaultStations,
      [],
      [],
      []
    );
    expect(noMarsRelayCov.coveragePercentage).toBeLessThan(35);
    expect(noMarsRelayCov.bottlenecks.some((b) => b.includes('Mars relay infrastructure'))).toBe(true);

    // Mars with Jezero surface relay
    const withMarsRelayCov = engine.evaluateCoverage(
      DestinationId.MARS,
      defaultStations,
      [],
      defaultRelays,
      []
    );
    expect(withMarsRelayCov.coveragePercentage).toBeGreaterThan(60);
    expect(withMarsRelayCov.contributingRelays).toContain('RELAY_MARS_JEZERO');
  });

  it('dynamically reduces coverage when an active outage occurs', () => {
    const normalCov = engine.evaluateCoverage(
      DestinationId.EARTH_ORBIT_LEO,
      defaultStations,
      defaultSatellites,
      [],
      []
    );

    const outage: NetworkOutageRecord = {
      id: 'OUT_1',
      targetId: DestinationId.EARTH_ORBIT_LEO,
      targetType: InfrastructureType.SPACECRAFT,
      outageType: OutageType.SOLAR_FLARE,
      severity: 0.8,
      startTime: Date.now(),
      durationSeconds: 100,
      expiryTime: Date.now() + 100000,
      description: 'Solar flare disruption',
      isResolved: false,
    };

    const outageCov = engine.evaluateCoverage(
      DestinationId.EARTH_ORBIT_LEO,
      defaultStations,
      defaultSatellites,
      [],
      [outage]
    );

    expect(outageCov.coveragePercentage).toBeLessThan(normalCov.coveragePercentage);
    expect(outageCov.activeOutages.length).toBe(1);
    expect(outageCov.hasContinuousLineOfSight).toBe(false);
  });

  it('is completely deterministic: identical inputs yield identical coverage metrics', () => {
    const run1 = engine.evaluateCoverage(
      DestinationId.MARS,
      defaultStations,
      [],
      defaultRelays,
      []
    );
    const run2 = engine.evaluateCoverage(
      DestinationId.MARS,
      defaultStations,
      [],
      defaultRelays,
      []
    );

    expect(run1.coveragePercentage).toBe(run2.coveragePercentage);
    expect(run1.rating).toBe(run2.rating);
    expect(run1.telemetryFidelity).toBe(run2.telemetryFidelity);
    expect(run1.scienceMultiplier).toBe(run2.scienceMultiplier);
    expect(run1.latencySeconds).toBe(run2.latencySeconds);
  });
});

