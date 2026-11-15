import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import {
  CommunicationsNetworkManager,
  InfrastructureType,
  GroundStationStatus,
  SatelliteStatus,
  SatelliteType,
  RelayOperationalState,
  RelayLocationType,
  SpacecraftCommStatus,
  DataTransmissionStatus,
  OutageType,
  RecoveryMethod,
  CoverageRating,
} from '../../src/network';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('CommunicationsNetworkManager', () => {
  let eventBus: EventBus;
  let manager: CommunicationsNetworkManager;

  beforeEach(() => {
    eventBus = new EventBus();
    CommunicationsNetworkManager.resetInstance();
    manager = CommunicationsNetworkManager.getInstance(eventBus);
  });

  // =========================================================================
  // 1. GROUND STATION REGISTRATION & VALIDATION
  // =========================================================================

  describe('Ground Station Registration', () => {
    it('initializes with default authored ground stations', () => {
      const stations = manager.getAllGroundStations();
      expect(stations.length).toBeGreaterThanOrEqual(4);

      const goldstone = manager.getGroundStation('GS_GOLDSTONE');
      expect(goldstone).toBeDefined();
      expect(goldstone?.status).toBe(GroundStationStatus.OPERATIONAL);
      expect(goldstone?.capacityRating).toBeGreaterThanOrEqual(200);
      expect(goldstone?.isUnlocked).toBe(true);
    });

    it('successfully registers and builds a new ground station', () => {
      let eventFired = false;
      manager.getEventBus().on('GroundStationRegistered', (payload) => {
        expect(payload.station.id).toBe('GS_PACIFIC_ISLAND');
        expect(payload.station.capacityRating).toBe(300);
        eventFired = true;
      });

      const station = manager.registerGroundStation({
        id: 'GS_PACIFIC_ISLAND',
        name: 'Pacific Equatorial Tracking Array',
        location: 'Kiritimati, Pacific Ocean',
        longitudeDeg: -157.4,
        latitudeDeg: 1.87,
        capacityRating: 300,
        upgradeLevel: 1,
        maintenanceCost: 350,
        signalGainDb: 22.0,
      });

      expect(station.id).toBe('GS_PACIFIC_ISLAND');
      expect(station.status).toBe(GroundStationStatus.OPERATIONAL);
      expect(eventFired).toBe(true);
      expect(manager.getGroundStation('GS_PACIFIC_ISLAND')).toBeDefined();
    });

    it('rejects invalid ground station data', () => {
      expect(() => {
        manager.registerGroundStation({ id: '', name: 'Test Station', location: 'Earth' });
      }).toThrow(/Missing or invalid id/);

      expect(() => {
        manager.registerGroundStation({ id: 'GS_TEST', name: '', location: 'Earth' });
      }).toThrow(/Missing or invalid name/);

      expect(() => {
        manager.registerGroundStation({
          id: 'GS_TEST',
          name: 'Negative Capacity Station',
          location: 'Earth',
          capacityRating: -50,
        });
      }).toThrow(/capacityRating cannot be negative/);

      expect(() => {
        manager.registerGroundStation({
          id: 'GS_TEST',
          name: 'Negative Cost Station',
          location: 'Earth',
          maintenanceCost: -100,
        });
      }).toThrow(/maintenanceCost cannot be negative/);
    });

    it('enforces rank and credit requirements when unlocking', () => {
      manager.getFacilityAdapter().setPlayerRank(1);

      expect(() => {
        manager.registerGroundStation({
          id: 'GS_HIGH_RANK',
          name: 'High Rank Station',
          location: 'Earth',
          unlockRequirements: { requiredRank: 4, costCredits: 50000 },
        });
      }).toThrow(/Insufficient organization rank/);

      manager.getFacilityAdapter().setPlayerRank(5);
      manager.getEconomyAdapter().resetFallbackCredits(100);

      expect(() => {
        manager.registerGroundStation({
          id: 'GS_EXPENSIVE',
          name: 'Expensive Station',
          location: 'Earth',
          unlockRequirements: { requiredRank: 2, costCredits: 50000 },
        });
      }).toThrow(/Insufficient credits/);
    });
  });

  // =========================================================================
  // 2. SATELLITE REGISTRATION
  // =========================================================================

  describe('Communication Satellite Registration', () => {
    it('registers communication satellites with network contributions', () => {
      let eventFired = false;
      manager.getEventBus().on('SatelliteRegistered', (payload) => {
        expect(payload.satellite.id).toBe('SAT_CUSTOM_GEO');
        eventFired = true;
      });

      const sat = manager.registerCommunicationSatellite({
        id: 'SAT_CUSTOM_GEO',
        name: 'GeoSync Quantum Carrier',
        satelliteType: SatelliteType.GEO_STATIONARY,
        destinationId: DestinationId.EARTH_ORBIT_GEO,
        networkContribution: {
          coverageBonus: 30,
          bandwidthBonus: 100,
          latencyReduction: 0.2,
          signalStrengthBonus: 20,
        },
        operationalCost: 200,
      });

      expect(sat.id).toBe('SAT_CUSTOM_GEO');
      expect(sat.status).toBe(SatelliteStatus.ACTIVE);
      expect(sat.networkContribution.coverageBonus).toBe(30);
      expect(eventFired).toBe(true);
      expect(manager.getSatellite('SAT_CUSTOM_GEO')).toBeDefined();
    });

    it('rejects invalid satellite data', () => {
      expect(() => {
        manager.registerCommunicationSatellite({
          id: '',
          name: 'Sat 1',
          satelliteType: SatelliteType.LEO_RELAY,
          destinationId: DestinationId.EARTH_ORBIT_LEO,
        });
      }).toThrow(/Missing or invalid id/);

      expect(() => {
        manager.registerCommunicationSatellite({
          id: 'SAT_NO_NAME',
          name: '',
          satelliteType: SatelliteType.LEO_RELAY,
          destinationId: DestinationId.EARTH_ORBIT_LEO,
        });
      }).toThrow(/Missing or invalid name/);

      expect(() => {
        manager.registerCommunicationSatellite({
          id: 'SAT_NO_DEST',
          name: 'Sat No Dest',
          satelliteType: SatelliteType.LEO_RELAY,
          destinationId: '',
        });
      }).toThrow(/destinationId is required/);
    });
  });

  // =========================================================================
  // 3. PLANETARY RELAYS
  // =========================================================================

  describe('Planetary Relay Deployment', () => {
    it('deploys planetary relays to target celestial bodies', () => {
      let eventFired = false;
      manager.getEventBus().on('RelayDeployed', (payload) => {
        expect(payload.relay.id).toBe('RELAY_CERES_BASE');
        eventFired = true;
      });

      const relay = manager.deployRelayStation({
        id: 'RELAY_CERES_BASE',
        name: 'Ceres Occator Crater Relay Terminal',
        deploymentLocation: DestinationId.CERES,
        locationType: RelayLocationType.SURFACE,
        networkContribution: {
          localSurfaceBonus: 40,
          rangeMultiplier: 1.3,
          linkRating: 180,
        },
        maintenanceCost: 350,
      });

      expect(relay.id).toBe('RELAY_CERES_BASE');
      expect(relay.operationalState).toBe(RelayOperationalState.OPERATIONAL);
      expect(eventFired).toBe(true);
      expect(manager.getRelay('RELAY_CERES_BASE')).toBeDefined();
    });

    it('rejects invalid relay deployment data', () => {
      expect(() => {
        manager.deployRelayStation({
          id: '',
          name: 'Relay',
          deploymentLocation: DestinationId.MARS,
        });
      }).toThrow(/Missing or invalid id/);

      expect(() => {
        manager.deployRelayStation({
          id: 'RELAY_ERR',
          name: 'Relay',
          deploymentLocation: '',
        });
      }).toThrow(/deploymentLocation is required/);
    });
  });

  // =========================================================================
  // 4. SPACECRAFT CONNECTIONS
  // =========================================================================

  describe('Spacecraft Connections & Telemetry Routing', () => {
    it('connects a spacecraft in Earth LEO with high signal quality', () => {
      let eventFired = false;
      manager.getEventBus().on('SpacecraftConnected', (payload) => {
        expect(payload.connection.spacecraftId).toBe('CRAFT_ORBITAL_1');
        eventFired = true;
      });

      const conn = manager.connectSpacecraft({
        spacecraftId: 'CRAFT_ORBITAL_1',
        name: 'Pioneer Orbiter One',
        missionId: 'EARTH_LEO_DEPLOYMENT_01',
        destinationId: DestinationId.EARTH_ORBIT_LEO,
      });

      expect(conn.spacecraftId).toBe('CRAFT_ORBITAL_1');
      expect(conn.communicationStatus).toBe(SpacecraftCommStatus.CONNECTED);
      expect(conn.signalQualityRating).toBeGreaterThanOrEqual(90);
      expect(conn.dataTransmissionStatus).toBe(DataTransmissionStatus.TRANSMITTING);
      expect(conn.activeRoute.hops).toBeGreaterThan(0);
      expect(conn.telemetryFidelityRating).toBeGreaterThanOrEqual(90);
      expect(conn.scienceDataMultiplier).toBeGreaterThanOrEqual(1.5);
      expect(eventFired).toBe(true);

      const retrieved = manager.getSpacecraftConnection('CRAFT_ORBITAL_1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.communicationStatus).toBe(SpacecraftCommStatus.CONNECTED);
    });

    it('disconnects spacecraft cleanly and decrements station load', () => {
      const conn = manager.connectSpacecraft({
        spacecraftId: 'CRAFT_DISCONNECT_TEST',
        destinationId: DestinationId.EARTH_ORBIT_LEO,
      });

      const gsId = conn.activeRoute.groundStationId!;
      const loadBefore = manager.getGroundStation(gsId)!.activeConnectionsCount;

      let eventFired = false;
      manager.getEventBus().on('SpacecraftDisconnected', (payload) => {
        expect(payload.spacecraftId).toBe('CRAFT_DISCONNECT_TEST');
        eventFired = true;
      });

      const disconnected = manager.disconnectSpacecraft('CRAFT_DISCONNECT_TEST');
      expect(disconnected).toBe(true);
      expect(eventFired).toBe(true);
      expect(manager.getSpacecraftConnection('CRAFT_DISCONNECT_TEST')).toBeUndefined();

      const loadAfter = manager.getGroundStation(gsId)!.activeConnectionsCount;
      expect(loadAfter).toBe(loadBefore - 1);
    });

    it('rejects connection request with missing parameters', () => {
      expect(() => {
        manager.connectSpacecraft({ spacecraftId: '', destinationId: DestinationId.MOON });
      }).toThrow(/Missing or invalid spacecraftId/);

      expect(() => {
        manager.connectSpacecraft({ spacecraftId: 'SC_TEST', destinationId: '' });
      }).toThrow(/destinationId is required/);
    });
  });

  // =========================================================================
  // 5. UPGRADES BEHAVIOUR
  // =========================================================================

  describe('Infrastructure Upgrades', () => {
    it('upgrades a ground station and improves bandwidth and signal gain', () => {
      const initial = manager.getGroundStation('GS_GOLDSTONE')!;
      const initialGain = initial.signalGainDb;
      const initialCap = initial.capacityRating;

      let eventFired = false;
      manager.getEventBus().on('InfrastructureUpgraded', (payload) => {
        expect(payload.upgrade.targetId).toBe('GS_GOLDSTONE');
        expect(payload.upgrade.newLevel).toBe(2);
        eventFired = true;
      });

      const res = manager.upgradeNetworkInfrastructure(InfrastructureType.GROUND_STATION, 'GS_GOLDSTONE');
      expect(res.success).toBe(true);
      expect(res.newLevel).toBe(2);
      expect(res.costPaid).toBeGreaterThan(0);
      expect(eventFired).toBe(true);

      const upgraded = manager.getGroundStation('GS_GOLDSTONE')!;
      expect(upgraded.upgradeLevel).toBe(2);
      expect(upgraded.signalGainDb).toBeGreaterThan(initialGain);
      expect(upgraded.capacityRating).toBeGreaterThan(initialCap);
    });

    it('upgrades a communication satellite and improves bonuses', () => {
      const initial = manager.getSatellite('SAT_GEO_COMMSAT_01')!;
      const initialBonus = initial.networkContribution.coverageBonus;

      const res = manager.upgradeNetworkInfrastructure(
        InfrastructureType.COMMUNICATION_SATELLITE,
        'SAT_GEO_COMMSAT_01'
      );
      expect(res.success).toBe(true);
      expect(res.newLevel).toBe(2);

      const upgraded = manager.getSatellite('SAT_GEO_COMMSAT_01')!;
      expect(upgraded.networkContribution.coverageBonus).toBeGreaterThan(initialBonus);
    });

    it('enforces maximum upgrade level cap', () => {
      const station = manager.getGroundStation('GS_HEADQUARTERS')!;
      // Max out level
      for (let i = station.upgradeLevel; i < station.maxUpgradeLevel; i++) {
        manager.upgradeNetworkInfrastructure(InfrastructureType.GROUND_STATION, 'GS_HEADQUARTERS');
      }

      const cappedRes = manager.upgradeNetworkInfrastructure(InfrastructureType.GROUND_STATION, 'GS_HEADQUARTERS');
      expect(cappedRes.success).toBe(false);
      expect(cappedRes.reason).toContain('maximum tier');
    });
  });

  // =========================================================================
  // 6. OUTAGES & RECOVERY
  // =========================================================================

  describe('Outage Handling & Recovery', () => {
    it('reports a network outage and degrades the affected target', () => {
      let eventFired = false;
      manager.getEventBus().on('NetworkOutageDetected', (payload) => {
        expect(payload.outage.outageType).toBe(OutageType.SOLAR_FLARE);
        eventFired = true;
      });

      const outage = manager.reportNetworkOutage({
        targetId: 'GS_GOLDSTONE',
        targetType: InfrastructureType.GROUND_STATION,
        outageType: OutageType.SOLAR_FLARE,
        severity: 0.8,
        durationSeconds: 120,
        description: 'Class X solar flare geomagnetically saturating dish feedhorn',
      });

      expect(outage.id).toBeDefined();
      expect(eventFired).toBe(true);

      const station = manager.getGroundStation('GS_GOLDSTONE');
      expect(station?.status).toBe(GroundStationStatus.DEGRADED);

      const activeOutages = manager.getActiveOutages();
      expect(activeOutages.some((o) => o.targetId === 'GS_GOLDSTONE')).toBe(true);
    });

    it('restores network service and clears active outages', () => {
      manager.reportNetworkOutage({
        targetId: 'GS_GOLDSTONE',
        targetType: InfrastructureType.GROUND_STATION,
        outageType: OutageType.EQUIPMENT_ANOMALY,
        severity: 0.5,
        durationSeconds: 300,
        description: 'Cryogenic receiver compressor failure',
      });

      let eventFired = false;
      manager.getEventBus().on('NetworkServiceRestored', (payload) => {
        expect(payload.targetId).toBe('GS_GOLDSTONE');
        eventFired = true;
      });

      const recovery = manager.restoreNetworkService('GS_GOLDSTONE', RecoveryMethod.EMERGENCY_REPAIR);
      expect(recovery.success).toBe(true);
      expect(eventFired).toBe(true);

      const station = manager.getGroundStation('GS_GOLDSTONE');
      expect(station?.status).toBe(GroundStationStatus.OPERATIONAL);

      const activeOutages = manager.getActiveOutages();
      expect(activeOutages.some((o) => o.targetId === 'GS_GOLDSTONE')).toBe(false);
    });

    it('auto-resolves expired outages during update ticks', () => {
      const outage = manager.reportNetworkOutage({
        targetId: 'GS_MADRID',
        targetType: InfrastructureType.GROUND_STATION,
        outageType: OutageType.ATMOSPHERIC_INTERFERENCE,
        severity: 0.6,
        durationSeconds: 1, // 1 second
        description: 'Severe weather attenuation',
      });

      // Force expiry time into past
      outage.expiryTime = Date.now() - 500;

      manager.update(1.0);

      const active = manager.getActiveOutages();
      expect(active.some((o) => o.targetId === 'GS_MADRID')).toBe(false);
      expect(manager.getGroundStation('GS_MADRID')?.status).toBe(GroundStationStatus.OPERATIONAL);
    });
  });

  // =========================================================================
  // 7. MAINTENANCE SYSTEM
  // =========================================================================

  describe('Maintenance Cycle', () => {
    it('successfully pays maintenance and keeps infrastructure operational', () => {
      manager.getEconomyAdapter().resetFallbackCredits(500000);

      const result = manager.processMaintenanceCycle();
      expect(result.totalCostPaid).toBeGreaterThan(0);
      expect(result.degradedCount).toBe(0);
      expect(result.operationalCount).toBeGreaterThan(0);
    });

    it('degrades infrastructure when organization has insufficient funds', () => {
      manager.getEconomyAdapter().resetFallbackCredits(0); // Bankrupt

      const result = manager.processMaintenanceCycle();
      expect(result.totalCostPaid).toBe(0);
      expect(result.degradedCount).toBeGreaterThan(0);

      const goldstone = manager.getGroundStation('GS_GOLDSTONE')!;
      expect(goldstone.status).toBe(GroundStationStatus.DEGRADED);
    });
  });

  // =========================================================================
  // 8. SERIALIZATION AND RESTORATION
  // =========================================================================

  describe('State Save & Restoration', () => {
    it('accurately serializes and deserializes communications network state', () => {
      // Modify some state
      manager.upgradeNetworkInfrastructure(InfrastructureType.GROUND_STATION, 'GS_GOLDSTONE');
      manager.connectSpacecraft({
        spacecraftId: 'SERIALIZE_CRAFT',
        destinationId: DestinationId.EARTH_ORBIT_LEO,
      });
      manager.reportNetworkOutage({
        targetId: 'GS_CANBERRA',
        targetType: InfrastructureType.GROUND_STATION,
        outageType: OutageType.EQUIPMENT_ANOMALY,
        severity: 0.5,
        durationSeconds: 500,
        description: 'Test anomaly',
      });

      const savedState = manager.serializeState();
      expect(savedState.groundStations.length).toBeGreaterThan(0);
      expect(savedState.connections.length).toBe(1);
      expect(savedState.outages.length).toBe(1);

      // Reset and restore
      CommunicationsNetworkManager.resetInstance();
      const newManager = CommunicationsNetworkManager.getInstance(eventBus);

      newManager.deserializeState(savedState);

      const restoredStation = newManager.getGroundStation('GS_GOLDSTONE');
      expect(restoredStation?.upgradeLevel).toBe(2);

      const restoredConn = newManager.getSpacecraftConnection('SERIALIZE_CRAFT');
      expect(restoredConn).toBeDefined();

      const restoredOutages = newManager.getActiveOutages();
      expect(restoredOutages.length).toBe(1);
    });
  });

  // =========================================================================
  // 9. OVERVIEW METRICS
  // =========================================================================

  describe('Network Overview Metrics', () => {
    it('computes accurate global network status summaries', () => {
      const summary = manager.getNetworkStatus();
      expect(summary.totalGroundStations).toBeGreaterThanOrEqual(4);
      expect(summary.operationalGroundStations).toBeGreaterThanOrEqual(3);
      expect(summary.activeSatellites).toBeGreaterThanOrEqual(2);
      expect(summary.totalNetworkCapacity).toBeGreaterThan(500);
      expect(summary.networkHealthScore).toBeGreaterThanOrEqual(80);
      expect(summary.totalCycleMaintenanceCost).toBeGreaterThan(0);
    });
  });
});

