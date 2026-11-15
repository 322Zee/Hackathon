/**
 * INTERSTELLAR CONTINUUM - Central Communications and Satellite Network Manager
 * Authoritative service managing Solar System communication infrastructure:
 * Earth ground stations, orbital satellites, planetary relays, spacecraft telemetry,
 * coverage evaluation, outages, maintenance cycles, and infrastructure upgrades.
 *
 * NOTE: Strictly adheres to fictional game ratings and agency simulation rules.
 * No real-world RF engineering, antenna physics, or signal interception instructions.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import {
  GroundStationRecord,
  GroundStationConfig,
  GroundStationStatus,
  SatelliteRecord,
  SatelliteConfig,
  SatelliteStatus,
  SatelliteType,
  PlanetaryRelayRecord,
  RelayStationConfig,
  RelayOperationalState,
  RelayLocationType,
  SpacecraftConnectionRecord,
  SpacecraftConnectionRequest,
  SpacecraftCommStatus,
  DataTransmissionStatus,
  NetworkOutageRecord,
  OutageReport,
  RecoveryMethod,
  DestinationCoverageRecord,
  NetworkStatusSummary,
  UpgradeResult,
  RecoveryResult,
  InfrastructureType,
  CommunicationsNetworkState,
} from './NetworkTypes';
import { NetworkEventBus } from './NetworkEventBus';
import { NetworkCoverageEngine } from './NetworkCoverageEngine';
import { EconomyAdapter } from './adapters/EconomyAdapter';
import { FacilityAdapter } from './adapters/FacilityAdapter';
import { DestinationAdapter } from './adapters/DestinationAdapter';
import { DEFAULT_GROUND_STATIONS } from './data/DefaultGroundStations';
import { DEFAULT_SATELLITES } from './data/DefaultSatellites';
import { DEFAULT_RELAYS } from './data/DefaultRelays';
import { EconomyService } from '../services/EconomyService';
import { FacilityRegistry } from '../facilities/FacilityRegistry';
import { DestinationRegistry } from '../destinations/DestinationRegistry';

export class CommunicationsNetworkManager {
  private static instance?: CommunicationsNetworkManager;

  // Event bus and adapters
  private eventBus: NetworkEventBus;
  private coverageEngine: NetworkCoverageEngine;
  private economyAdapter: EconomyAdapter;
  private facilityAdapter: FacilityAdapter;
  private destinationAdapter: DestinationAdapter;

  // Authoritative registries
  private groundStations: Map<string, GroundStationRecord> = new Map();
  private satellites: Map<string, SatelliteRecord> = new Map();
  private relays: Map<string, PlanetaryRelayRecord> = new Map();
  private connections: Map<string, SpacecraftConnectionRecord> = new Map();
  private outages: Map<string, NetworkOutageRecord> = new Map();

  // Internal state
  private lastMaintenanceTimestamp: number = Date.now();
  private cachedCoverage: Map<string, DestinationCoverageRecord> = new Map();

  private constructor(
    coreEventBus?: EventBus,
    economyService?: EconomyService,
    facilityRegistry?: FacilityRegistry,
    destinationRegistry?: DestinationRegistry
  ) {
    this.eventBus = new NetworkEventBus(coreEventBus);
    this.economyAdapter = new EconomyAdapter(economyService);
    this.facilityAdapter = new FacilityAdapter(facilityRegistry);
    this.destinationAdapter = new DestinationAdapter(destinationRegistry);
    this.coverageEngine = new NetworkCoverageEngine(this.destinationAdapter);

    this.initializeDefaultInfrastructure();
  }

  public static getInstance(
    coreEventBus?: EventBus,
    economyService?: EconomyService,
    facilityRegistry?: FacilityRegistry,
    destinationRegistry?: DestinationRegistry
  ): CommunicationsNetworkManager {
    if (!CommunicationsNetworkManager.instance) {
      CommunicationsNetworkManager.instance = new CommunicationsNetworkManager(
        coreEventBus,
        economyService,
        facilityRegistry,
        destinationRegistry
      );
    } else {
      if (coreEventBus) CommunicationsNetworkManager.instance.setCoreEventBus(coreEventBus);
      if (economyService) CommunicationsNetworkManager.instance.setEconomyService(economyService);
      if (facilityRegistry) CommunicationsNetworkManager.instance.setFacilityRegistry(facilityRegistry);
      if (destinationRegistry) CommunicationsNetworkManager.instance.setDestinationRegistry(destinationRegistry);
    }
    return CommunicationsNetworkManager.instance;
  }

  public static resetInstance(): void {
    if (CommunicationsNetworkManager.instance) {
      CommunicationsNetworkManager.instance.eventBus.clear();
      CommunicationsNetworkManager.instance = undefined;
    }
  }

  public setCoreEventBus(eventBus?: EventBus): void {
    this.eventBus.setCoreEventBus(eventBus);
  }

  public setEconomyService(service?: EconomyService): void {
    this.economyAdapter.setEconomyService(service);
  }

  public setFacilityRegistry(registry?: FacilityRegistry): void {
    this.facilityAdapter.setFacilityRegistry(registry);
  }

  public setDestinationRegistry(registry?: DestinationRegistry): void {
    this.destinationAdapter.setDestinationRegistry(registry);
    this.coverageEngine.setDestinationAdapter(this.destinationAdapter);
  }

  public getEventBus(): NetworkEventBus {
    return this.eventBus;
  }

  public getEconomyAdapter(): EconomyAdapter {
    return this.economyAdapter;
  }

  public getFacilityAdapter(): FacilityAdapter {
    return this.facilityAdapter;
  }

  public getDestinationAdapter(): DestinationAdapter {
    return this.destinationAdapter;
  }

  /** Initialize baseline authored stations, satellites, and relays */
  private initializeDefaultInfrastructure(): void {
    this.groundStations.clear();
    for (const station of DEFAULT_GROUND_STATIONS) {
      this.groundStations.set(station.id, { ...station });
    }

    this.satellites.clear();
    for (const sat of DEFAULT_SATELLITES) {
      this.satellites.set(sat.id, {
        ...sat,
        networkContribution: { ...sat.networkContribution },
      });
    }

    this.relays.clear();
    for (const relay of DEFAULT_RELAYS) {
      this.relays.set(relay.id, {
        ...relay,
        networkContribution: { ...relay.networkContribution },
        upgradeOptions: relay.upgradeOptions.map((o) => ({ ...o })),
      });
    }

    this.connections.clear();
    this.outages.clear();
    this.cachedCoverage.clear();
  }

  // =========================================================================
  // 1. GROUND STATION MANAGEMENT
  // =========================================================================

  /**
   * Register or build a new Earth Ground Station.
   * Validates parameters, deducts unlock cost via economy adapter if applicable.
   */
  public registerGroundStation(config: GroundStationConfig): GroundStationRecord {
    if (!config || !config.id || typeof config.id !== 'string' || config.id.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot register ground station: Missing or invalid id.');
    }
    if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot register ground station: Missing or invalid name.');
    }
    if (config.capacityRating !== undefined && config.capacityRating < 0) {
      throw new Error('[NETWORK_MANAGER] Ground station capacityRating cannot be negative.');
    }
    if (config.maintenanceCost !== undefined && config.maintenanceCost < 0) {
      throw new Error('[NETWORK_MANAGER] Ground station maintenanceCost cannot be negative.');
    }

    const existing = this.groundStations.get(config.id);
    if (existing && existing.isUnlocked) {
      Logger.warn('NETWORK_MANAGER', `Ground station ${config.id} already registered and active.`);
      return existing;
    }

    const unlockReqs = config.unlockRequirements ?? { isUnlockedByDefault: true, requiredRank: 0 };
    const cost = unlockReqs.costCredits ?? 0;

    // Check rank and funds if unlocking
    const playerRank = this.facilityAdapter.getPlayerRank();
    if (unlockReqs.requiredRank && playerRank < unlockReqs.requiredRank) {
      throw new Error(
        `[NETWORK_MANAGER] Insufficient organization rank (Rank ${unlockReqs.requiredRank} required, current: ${playerRank}).`
      );
    }

    if (cost > 0) {
      if (!this.economyAdapter.canAfford(cost)) {
        throw new Error(`[NETWORK_MANAGER] Insufficient credits to build ground station (Requires ₵${cost}).`);
      }
      this.economyAdapter.spend(cost);
    }

    const station: GroundStationRecord = {
      id: config.id.trim(),
      name: config.name.trim(),
      location: config.location || 'Earth Surface',
      longitudeDeg: config.longitudeDeg ?? 0,
      latitudeDeg: config.latitudeDeg ?? 0,
      status: GroundStationStatus.OPERATIONAL,
      capacityRating: config.capacityRating ?? 200,
      upgradeLevel: config.upgradeLevel ?? 1,
      maxUpgradeLevel: 5,
      maintenanceCost: config.maintenanceCost ?? 300,
      unlockRequirements: unlockReqs,
      isUnlocked: true,
      signalGainDb: config.signalGainDb ?? 20.0,
      dishDiameterMeters: config.dishDiameterMeters ?? 30,
      supportedBands: config.supportedBands ?? ['S-Band', 'X-Band'],
      activeConnectionsCount: 0,
    };

    this.groundStations.set(station.id, station);
    this.cachedCoverage.clear();

    Logger.info('NETWORK_MANAGER', `Registered ground station: ${station.name} (${station.id})`);

    this.eventBus.emit('GroundStationRegistered', {
      station: { ...station },
      timestamp: Date.now(),
    });

    return station;
  }

  public getGroundStation(id: string): GroundStationRecord | undefined {
    const s = this.groundStations.get(id);
    return s ? { ...s } : undefined;
  }

  public getAllGroundStations(): GroundStationRecord[] {
    return Array.from(this.groundStations.values()).map((s) => ({ ...s }));
  }

  // =========================================================================
  // 2. COMMUNICATION SATELLITE MANAGEMENT
  // =========================================================================

  /**
   * Register a deployed communication satellite into the active network.
   */
  public registerCommunicationSatellite(config: SatelliteConfig): SatelliteRecord {
    if (!config || !config.id || typeof config.id !== 'string' || config.id.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot register satellite: Missing or invalid id.');
    }
    if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot register satellite: Missing or invalid name.');
    }
    if (!config.destinationId || typeof config.destinationId !== 'string') {
      throw new Error('[NETWORK_MANAGER] Cannot register satellite: destinationId is required.');
    }
    if (config.operationalCost !== undefined && config.operationalCost < 0) {
      throw new Error('[NETWORK_MANAGER] Satellite operationalCost cannot be negative.');
    }

    const satellite: SatelliteRecord = {
      id: config.id.trim(),
      name: config.name.trim(),
      satelliteType: config.satelliteType ?? SatelliteType.LEO_RELAY,
      status: config.status ?? SatelliteStatus.ACTIVE,
      networkContribution: {
        coverageBonus: config.networkContribution?.coverageBonus ?? 25,
        bandwidthBonus: config.networkContribution?.bandwidthBonus ?? 60,
        latencyReduction: config.networkContribution?.latencyReduction ?? 0.15,
        signalStrengthBonus: config.networkContribution?.signalStrengthBonus ?? 15,
      },
      destinationId: config.destinationId,
      upgradeLevel: config.upgradeLevel ?? 1,
      maxUpgradeLevel: 4,
      operationalCost: config.operationalCost ?? 150,
      powerStatus: 100,
      constellationId: config.constellationId,
      orbitalAltitudeKm: config.orbitalAltitudeKm ?? 500,
      assignedMissionId: config.assignedMissionId,
    };

    this.satellites.set(satellite.id, satellite);
    this.cachedCoverage.clear();

    Logger.info('NETWORK_MANAGER', `Registered communication satellite: ${satellite.name} (${satellite.id})`);

    this.eventBus.emit('SatelliteRegistered', {
      satellite: { ...satellite },
      timestamp: Date.now(),
    });

    return satellite;
  }

  public getSatellite(id: string): SatelliteRecord | undefined {
    const sat = this.satellites.get(id);
    return sat ? { ...sat } : undefined;
  }

  public getAllSatellites(): SatelliteRecord[] {
    return Array.from(this.satellites.values()).map((s) => ({ ...s }));
  }

  // =========================================================================
  // 3. PLANETARY RELAYS
  // =========================================================================

  /**
   * Deploy or register a planetary surface/orbital relay station.
   */
  public deployRelayStation(config: RelayStationConfig): PlanetaryRelayRecord {
    if (!config || !config.id || typeof config.id !== 'string' || config.id.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot deploy relay: Missing or invalid id.');
    }
    if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot deploy relay: Missing or invalid name.');
    }
    if (!config.deploymentLocation || typeof config.deploymentLocation !== 'string') {
      throw new Error('[NETWORK_MANAGER] Cannot deploy relay: deploymentLocation is required.');
    }
    if (config.maintenanceCost !== undefined && config.maintenanceCost < 0) {
      throw new Error('[NETWORK_MANAGER] Relay maintenanceCost cannot be negative.');
    }

    const relay: PlanetaryRelayRecord = {
      id: config.id.trim(),
      name: config.name.trim(),
      deploymentLocation: config.deploymentLocation,
      locationType: config.locationType ?? RelayLocationType.SURFACE,
      operationalState: RelayOperationalState.OPERATIONAL,
      networkContribution: {
        localSurfaceBonus: config.networkContribution?.localSurfaceBonus ?? 35,
        rangeMultiplier: config.networkContribution?.rangeMultiplier ?? 1.25,
        linkRating: config.networkContribution?.linkRating ?? 150,
      },
      upgradeLevel: config.upgradeLevel ?? 1,
      maxUpgradeLevel: 4,
      upgradeOptions: config.upgradeOptions ?? [],
      maintenanceCost: config.maintenanceCost ?? 250,
      lastServicedTimestamp: Date.now(),
      conditionRating: 100,
    };

    this.relays.set(relay.id, relay);
    this.cachedCoverage.clear();

    Logger.info('NETWORK_MANAGER', `Deployed planetary relay: ${relay.name} at ${relay.deploymentLocation}`);

    this.eventBus.emit('RelayDeployed', {
      relay: { ...relay },
      timestamp: Date.now(),
    });

    return relay;
  }

  public getRelay(id: string): PlanetaryRelayRecord | undefined {
    const r = this.relays.get(id);
    return r ? { ...r } : undefined;
  }

  public getAllRelays(): PlanetaryRelayRecord[] {
    return Array.from(this.relays.values()).map((r) => ({ ...r }));
  }

  // =========================================================================
  // 4. SPACECRAFT CONNECTIONS
  // =========================================================================

  /**
   * Connect an active spacecraft to the available network infrastructure.
   * Evaluates best signal path, latency, and transmission bandwidth.
   */
  public connectSpacecraft(request: SpacecraftConnectionRequest): SpacecraftConnectionRecord {
    if (!request || !request.spacecraftId || typeof request.spacecraftId !== 'string' || request.spacecraftId.trim() === '') {
      throw new Error('[NETWORK_MANAGER] Cannot connect spacecraft: Missing or invalid spacecraftId.');
    }
    if (!request.destinationId || typeof request.destinationId !== 'string') {
      throw new Error('[NETWORK_MANAGER] Cannot connect spacecraft: destinationId is required.');
    }

    const cov = this.evaluateCoverage(request.destinationId);

    // Determine path and route hops
    const path: string[] = [];
    let groundStationId: string | undefined;
    let satelliteId: string | undefined;
    let relayId: string | undefined;

    if (cov.contributingGroundStations.length > 0) {
      groundStationId = request.preferredGroundStationId && cov.contributingGroundStations.includes(request.preferredGroundStationId)
        ? request.preferredGroundStationId
        : cov.contributingGroundStations[0];
      path.push(`Ground Station: ${groundStationId}`);
    }

    if (cov.contributingSatellites.length > 0) {
      satelliteId = cov.contributingSatellites[0];
      path.push(`Satellite Relay: ${satelliteId}`);
    }

    if (cov.contributingRelays.length > 0) {
      relayId = cov.contributingRelays[0];
      path.push(`Planetary Relay: ${relayId}`);
    }

    path.push(`Spacecraft: ${request.spacecraftId}`);

    // Determine status based on coverage rating
    let commStatus: SpacecraftCommStatus;
    let transmissionStatus: DataTransmissionStatus;
    const isAvailable = cov.coveragePercentage > 0 && cov.activeOutages.length === 0;

    if (cov.coveragePercentage >= 85) {
      commStatus = SpacecraftCommStatus.CONNECTED;
      transmissionStatus = DataTransmissionStatus.TRANSMITTING;
    } else if (cov.coveragePercentage >= 60) {
      commStatus = SpacecraftCommStatus.CONNECTED;
      transmissionStatus = DataTransmissionStatus.TRANSMITTING;
    } else if (cov.coveragePercentage >= 30) {
      commStatus = SpacecraftCommStatus.WEAK_SIGNAL;
      transmissionStatus = DataTransmissionStatus.BUFFERED;
    } else if (cov.coveragePercentage > 0) {
      commStatus = SpacecraftCommStatus.INTERMITTENT;
      transmissionStatus = DataTransmissionStatus.BUFFERED;
    } else {
      commStatus = SpacecraftCommStatus.DISCONNECTED;
      transmissionStatus = DataTransmissionStatus.BLOCKED;
    }

    // Downlink rate (Mbps): based on fidelity and capacity
    const downlinkRateMbps = parseFloat(((cov.coveragePercentage / 100) * 125 * cov.scienceMultiplier).toFixed(1));

    const connection: SpacecraftConnectionRecord = {
      spacecraftId: request.spacecraftId.trim(),
      name: request.name || `Spacecraft ${request.spacecraftId}`,
      missionId: request.missionId,
      destinationId: request.destinationId,
      communicationStatus: commStatus,
      signalQualityRating: cov.coveragePercentage,
      dataTransmissionStatus: transmissionStatus,
      connectionAvailability: isAvailable,
      activeRoute: {
        groundStationId,
        satelliteId,
        relayId,
        hops: path.length - 1,
        pathDescription: path,
      },
      downlinkRateMbps,
      effectiveLatencySeconds: cov.latencySeconds,
      telemetryFidelityRating: cov.telemetryFidelity,
      scienceDataMultiplier: cov.scienceMultiplier,
      connectedAtTimestamp: Date.now(),
      lastTelemetryTimestamp: Date.now(),
    };

    this.connections.set(connection.spacecraftId, connection);

    // Update ground station connection count
    if (groundStationId) {
      const gs = this.groundStations.get(groundStationId);
      if (gs) gs.activeConnectionsCount += 1;
    }

    Logger.info(
      'NETWORK_MANAGER',
      `Spacecraft connected: ${connection.name} to ${connection.destinationId} (Signal: ${connection.signalQualityRating}%)`
    );

    this.eventBus.emit('SpacecraftConnected', {
      connection: { ...connection },
      timestamp: Date.now(),
    });

    return connection;
  }

  public disconnectSpacecraft(spacecraftId: string): boolean {
    if (!spacecraftId || !this.connections.has(spacecraftId)) {
      return false;
    }

    const conn = this.connections.get(spacecraftId)!;
    if (conn.activeRoute.groundStationId) {
      const gs = this.groundStations.get(conn.activeRoute.groundStationId);
      if (gs && gs.activeConnectionsCount > 0) {
        gs.activeConnectionsCount -= 1;
      }
    }

    this.connections.delete(spacecraftId);

    Logger.info('NETWORK_MANAGER', `Spacecraft disconnected: ${spacecraftId}`);

    this.eventBus.emit('SpacecraftDisconnected', {
      spacecraftId,
      timestamp: Date.now(),
    });

    return true;
  }

  public getSpacecraftConnection(spacecraftId: string): SpacecraftConnectionRecord | undefined {
    const c = this.connections.get(spacecraftId);
    return c ? { ...c } : undefined;
  }

  public getAllSpacecraftConnections(): SpacecraftConnectionRecord[] {
    return Array.from(this.connections.values()).map((c) => ({ ...c }));
  }

  // =========================================================================
  // 5. COVERAGE EVALUATION
  // =========================================================================

  /**
   * Deterministically evaluate network coverage for any celestial destination.
   */
  public evaluateCoverage(destinationId: string): DestinationCoverageRecord {
    const previous = this.cachedCoverage.get(destinationId);

    const record = this.coverageEngine.evaluateCoverage(
      destinationId,
      this.getAllGroundStations(),
      this.getAllSatellites(),
      this.getAllRelays(),
      this.getActiveOutages()
    );

    this.cachedCoverage.set(destinationId, record);

    if (previous && previous.coveragePercentage !== record.coveragePercentage) {
      this.eventBus.emit('CoverageChanged', {
        destinationId,
        previousCoverage: previous.coveragePercentage,
        currentCoverage: record.coveragePercentage,
        rating: record.rating,
        timestamp: Date.now(),
      });
    }

    return record;
  }

  public getAllDestinationCoverages(destinationIds: string[]): DestinationCoverageRecord[] {
    return destinationIds.map((id) => this.evaluateCoverage(id));
  }

  // =========================================================================
  // 6. INFRASTRUCTURE UPGRADES
  // =========================================================================

  /**
   * Upgrade any piece of network infrastructure (Ground Station, Satellite, Relay).
   * Validates level caps, cost, and automatically updates performance ratings.
   */
  public upgradeNetworkInfrastructure(
    targetType: InfrastructureType,
    targetId: string
  ): UpgradeResult {
    if (!targetId || typeof targetId !== 'string') {
      throw new Error('[NETWORK_MANAGER] Target ID is required for upgrade.');
    }

    let previousLevel = 1;
    let newLevel = 1;
    let cost = 0;

    switch (targetType) {
      case InfrastructureType.GROUND_STATION: {
        const station = this.groundStations.get(targetId);
        if (!station) {
          throw new Error(`[NETWORK_MANAGER] Ground station not found: ${targetId}`);
        }
        if (station.upgradeLevel >= station.maxUpgradeLevel) {
          return {
            success: false,
            targetId,
            targetType,
            previousLevel: station.upgradeLevel,
            newLevel: station.upgradeLevel,
            costPaid: 0,
            reason: 'Station already at maximum tier.',
          };
        }

        previousLevel = station.upgradeLevel;
        newLevel = previousLevel + 1;
        cost = previousLevel * 25000;

        if (!this.economyAdapter.canAfford(cost)) {
          return {
            success: false,
            targetId,
            targetType,
            previousLevel,
            newLevel: previousLevel,
            costPaid: 0,
            reason: `Insufficient credits. Upgrade requires ₵${cost}.`,
          };
        }

        this.economyAdapter.spend(cost);
        station.upgradeLevel = newLevel;
        station.capacityRating += 80;
        station.signalGainDb += 2.5;
        station.dishDiameterMeters += 4;
        station.maintenanceCost += 80;
        break;
      }

      case InfrastructureType.COMMUNICATION_SATELLITE: {
        const sat = this.satellites.get(targetId);
        if (!sat) {
          throw new Error(`[NETWORK_MANAGER] Satellite not found: ${targetId}`);
        }
        if (sat.upgradeLevel >= sat.maxUpgradeLevel) {
          return {
            success: false,
            targetId,
            targetType,
            previousLevel: sat.upgradeLevel,
            newLevel: sat.upgradeLevel,
            costPaid: 0,
            reason: 'Satellite already at maximum tier.',
          };
        }

        previousLevel = sat.upgradeLevel;
        newLevel = previousLevel + 1;
        cost = previousLevel * 18000;

        if (!this.economyAdapter.canAfford(cost)) {
          return {
            success: false,
            targetId,
            targetType,
            previousLevel,
            newLevel: previousLevel,
            costPaid: 0,
            reason: `Insufficient credits. Upgrade requires ₵${cost}.`,
          };
        }

        this.economyAdapter.spend(cost);
        sat.upgradeLevel = newLevel;
        sat.networkContribution.coverageBonus += 8;
        sat.networkContribution.bandwidthBonus += 30;
        sat.networkContribution.latencyReduction = Math.min(0.4, sat.networkContribution.latencyReduction + 0.05);
        sat.operationalCost += 50;
        break;
      }

      case InfrastructureType.PLANETARY_RELAY: {
        const relay = this.relays.get(targetId);
        if (!relay) {
          throw new Error(`[NETWORK_MANAGER] Relay not found: ${targetId}`);
        }
        if (relay.upgradeLevel >= relay.maxUpgradeLevel) {
          return {
            success: false,
            targetId,
            targetType,
            previousLevel: relay.upgradeLevel,
            newLevel: relay.upgradeLevel,
            costPaid: 0,
            reason: 'Relay already at maximum tier.',
          };
        }

        previousLevel = relay.upgradeLevel;
        newLevel = previousLevel + 1;
        cost = previousLevel * 30000;

        if (!this.economyAdapter.canAfford(cost)) {
          return {
            success: false,
            targetId,
            targetType,
            previousLevel,
            newLevel: previousLevel,
            costPaid: 0,
            reason: `Insufficient credits. Upgrade requires ₵${cost}.`,
          };
        }

        this.economyAdapter.spend(cost);
        relay.upgradeLevel = newLevel;
        relay.networkContribution.localSurfaceBonus += 10;
        relay.networkContribution.rangeMultiplier += 0.15;
        relay.maintenanceCost += 90;
        break;
      }

      default:
        throw new Error(`[NETWORK_MANAGER] Unsupported infrastructure type for upgrade: ${targetType}`);
    }

    this.cachedCoverage.clear();

    const result: UpgradeResult = {
      success: true,
      targetId,
      targetType,
      previousLevel,
      newLevel,
      costPaid: cost,
    };

    Logger.info('NETWORK_MANAGER', `Upgraded ${targetType} [${targetId}]: Level ${previousLevel} -> ${newLevel}`);

    this.eventBus.emit('InfrastructureUpgraded', {
      upgrade: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // =========================================================================
  // 7. OUTAGES AND RECOVERY
  // =========================================================================

  /**
   * Report an active network outage affecting ground stations, satellites,
   * relays, or celestial regions.
   */
  public reportNetworkOutage(outageReport: OutageReport): NetworkOutageRecord {
    if (!outageReport || !outageReport.targetId || typeof outageReport.targetId !== 'string') {
      throw new Error('[NETWORK_MANAGER] Target ID is required to report an outage.');
    }

    const id = `outage_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();
    const duration = Math.max(5, outageReport.durationSeconds || 60);

    const outage: NetworkOutageRecord = {
      id,
      targetId: outageReport.targetId,
      targetType: outageReport.targetType,
      outageType: outageReport.outageType,
      severity: Math.min(1.0, Math.max(0.1, outageReport.severity || 0.5)),
      startTime: now,
      durationSeconds: duration,
      expiryTime: now + duration * 1000,
      description: outageReport.description || `Outage event on ${outageReport.targetId}`,
      isResolved: false,
    };

    this.outages.set(outage.id, outage);

    // Apply immediate degraded status to target
    if (outage.targetType === InfrastructureType.GROUND_STATION) {
      const gs = this.groundStations.get(outage.targetId);
      if (gs) gs.status = GroundStationStatus.DEGRADED;
    } else if (outage.targetType === InfrastructureType.COMMUNICATION_SATELLITE) {
      const sat = this.satellites.get(outage.targetId);
      if (sat) sat.status = SatelliteStatus.DEGRADED;
    } else if (outage.targetType === InfrastructureType.PLANETARY_RELAY) {
      const relay = this.relays.get(outage.targetId);
      if (relay) relay.operationalState = RelayOperationalState.DEGRADED;
    }

    this.cachedCoverage.clear();

    Logger.warn('NETWORK_MANAGER', `Network outage detected: ${outage.outageType} on ${outage.targetId}`);

    this.eventBus.emit('NetworkOutageDetected', {
      outage: { ...outage },
      timestamp: now,
    });

    return outage;
  }

  public getActiveOutages(): NetworkOutageRecord[] {
    const now = Date.now();
    const active: NetworkOutageRecord[] = [];
    for (const o of this.outages.values()) {
      if (!o.isResolved && o.expiryTime > now) {
        active.push({ ...o });
      }
    }
    return active;
  }

  /**
   * Restore service on an unavailable or degraded piece of infrastructure.
   */
  public restoreNetworkService(
    targetId: string,
    method: RecoveryMethod = RecoveryMethod.REMOTE_DIAGNOSTICS
  ): RecoveryResult {
    if (!targetId || typeof targetId !== 'string') {
      throw new Error('[NETWORK_MANAGER] Target ID is required to restore service.');
    }

    let cost = 0;
    if (method === RecoveryMethod.EMERGENCY_REPAIR) {
      cost = 5000;
      if (!this.economyAdapter.canAfford(cost)) {
        return {
          success: false,
          targetId,
          method,
          costPaid: 0,
          restoredStatus: 'UNCHANGED',
          reason: `Insufficient credits for emergency repair (₵${cost} required).`,
        };
      }
      this.economyAdapter.spend(cost);
    }

    // Resolve any outages on this target
    let resolvedCount = 0;
    for (const outage of this.outages.values()) {
      if (outage.targetId === targetId && !outage.isResolved) {
        outage.isResolved = true;
        resolvedCount++;
      }
    }

    // Restore operational status
    let targetType: InfrastructureType = InfrastructureType.GROUND_STATION;
    let restoredStatus = 'OPERATIONAL';

    if (this.groundStations.has(targetId)) {
      const gs = this.groundStations.get(targetId)!;
      gs.status = GroundStationStatus.OPERATIONAL;
      targetType = InfrastructureType.GROUND_STATION;
    } else if (this.satellites.has(targetId)) {
      const sat = this.satellites.get(targetId)!;
      sat.status = SatelliteStatus.ACTIVE;
      sat.powerStatus = 100;
      targetType = InfrastructureType.COMMUNICATION_SATELLITE;
    } else if (this.relays.has(targetId)) {
      const relay = this.relays.get(targetId)!;
      relay.operationalState = RelayOperationalState.OPERATIONAL;
      relay.conditionRating = 100;
      relay.lastServicedTimestamp = Date.now();
      targetType = InfrastructureType.PLANETARY_RELAY;
    }

    this.cachedCoverage.clear();

    Logger.info('NETWORK_MANAGER', `Restored network service on ${targetId} using ${method}`);

    this.eventBus.emit('NetworkServiceRestored', {
      targetId,
      targetType,
      method,
      timestamp: Date.now(),
    });

    return {
      success: true,
      targetId,
      method,
      costPaid: cost,
      restoredStatus,
    };
  }

  // =========================================================================
  // 8. MAINTENANCE SYSTEM & TICKS
  // =========================================================================

  /**
   * Run a network maintenance cycle.
   * Calculates total operational maintenance cost across stations, satellites, and relays.
   * If organization lacks funds, assets degrade in performance.
   */
  public processMaintenanceCycle(): { totalCostPaid: number; degradedCount: number; operationalCount: number } {
    let totalCost = 0;

    for (const gs of this.groundStations.values()) {
      if (gs.isUnlocked) totalCost += gs.maintenanceCost;
    }
    for (const sat of this.satellites.values()) {
      if (sat.status === SatelliteStatus.ACTIVE) totalCost += sat.operationalCost;
    }
    for (const relay of this.relays.values()) {
      if (relay.operationalState !== RelayOperationalState.OFFLINE) totalCost += relay.maintenanceCost;
    }

    let degradedCount = 0;
    let operationalCount = 0;
    let costPaid = 0;

    if (this.economyAdapter.canAfford(totalCost)) {
      this.economyAdapter.spend(totalCost);
      costPaid = totalCost;

      // Normal maintenance upkeep
      for (const gs of this.groundStations.values()) {
        if (gs.status === GroundStationStatus.DEGRADED) gs.status = GroundStationStatus.OPERATIONAL;
        operationalCount++;
      }
      for (const relay of this.relays.values()) {
        relay.lastServicedTimestamp = Date.now();
        relay.conditionRating = Math.min(100, relay.conditionRating + 5);
      }
    } else {
      // Inability to pay maintenance causes degradation
      Logger.warn('NETWORK_MANAGER', 'Insufficient funds for full network maintenance cycle! Infrastructure degraded.');
      for (const gs of this.groundStations.values()) {
        if (gs.isUnlocked && gs.status === GroundStationStatus.OPERATIONAL) {
          gs.status = GroundStationStatus.DEGRADED;
          degradedCount++;
        }
      }
      for (const sat of this.satellites.values()) {
        if (sat.status === SatelliteStatus.ACTIVE) {
          sat.status = SatelliteStatus.DEGRADED;
          sat.powerStatus = Math.max(40, sat.powerStatus - 20);
          degradedCount++;
        }
      }
      for (const relay of this.relays.values()) {
        if (relay.operationalState === RelayOperationalState.OPERATIONAL) {
          relay.operationalState = RelayOperationalState.DEGRADED;
          relay.conditionRating = Math.max(30, relay.conditionRating - 25);
          degradedCount++;
        }
      }
    }

    this.lastMaintenanceTimestamp = Date.now();
    this.cachedCoverage.clear();

    this.eventBus.emit('NetworkMaintenanceCompleted', {
      totalCostPaid: costPaid,
      degradedCount,
      operationalCount,
      timestamp: Date.now(),
    });

    return { totalCostPaid: costPaid, degradedCount, operationalCount };
  }

  /**
   * Periodic update tick for real-time duration updates, outage expiry, and telemetry sync.
   */
  public update(_deltaSeconds?: number): void {
    const now = Date.now();

    // Check expired outages
    let outageExpired = false;
    for (const outage of this.outages.values()) {
      if (!outage.isResolved && outage.expiryTime <= now) {
        outage.isResolved = true;
        outageExpired = true;
        this.restoreNetworkService(outage.targetId, RecoveryMethod.RECALIBRATION);
      }
    }

    if (outageExpired) {
      this.cachedCoverage.clear();
    }
  }

  // =========================================================================
  // 9. OVERVIEW STATUS & METRICS
  // =========================================================================

  public getNetworkStatus(): NetworkStatusSummary {
    const stations = Array.from(this.groundStations.values());
    const sats = Array.from(this.satellites.values());
    const rels = Array.from(this.relays.values());

    const operationalGroundStations = stations.filter(
      (s) => s.isUnlocked && s.status === GroundStationStatus.OPERATIONAL
    ).length;
    const activeSatellites = sats.filter((s) => s.status === SatelliteStatus.ACTIVE).length;
    const operationalRelays = rels.filter((r) => r.operationalState === RelayOperationalState.OPERATIONAL).length;

    let totalCapacity = 0;
    for (const s of stations) {
      if (s.isUnlocked && s.status !== GroundStationStatus.OFFLINE) {
        totalCapacity += s.capacityRating;
      }
    }
    for (const sat of sats) {
      if (sat.status === SatelliteStatus.ACTIVE) {
        totalCapacity += sat.networkContribution.bandwidthBonus;
      }
    }

    let cycleCost = 0;
    for (const s of stations) if (s.isUnlocked) cycleCost += s.maintenanceCost;
    for (const sat of sats) if (sat.status === SatelliteStatus.ACTIVE) cycleCost += sat.operationalCost;
    for (const r of rels) if (r.operationalState !== RelayOperationalState.OFFLINE) cycleCost += r.maintenanceCost;

    const activeOutages = this.getActiveOutages();

    // Calculate network health score (0 - 100% based on active degradation/outages)
    const degradedCount =
      stations.filter((s) => s.isUnlocked && s.status === GroundStationStatus.DEGRADED).length +
      sats.filter((s) => s.status === SatelliteStatus.DEGRADED).length +
      rels.filter((r) => r.operationalState === RelayOperationalState.DEGRADED).length;

    const offlineCount =
      stations.filter((s) => s.isUnlocked && s.status === GroundStationStatus.OFFLINE).length +
      sats.filter((s) => s.status === SatelliteStatus.OFFLINE).length +
      rels.filter((r) => r.operationalState === RelayOperationalState.OFFLINE).length;

    const rawHealth = 100 - (degradedCount * 12) - (offlineCount * 25) - (activeOutages.length * 15);
    const networkHealthScore = Math.max(0, Math.min(100, Math.round(rawHealth)));

    return {
      operationalGroundStations,
      totalGroundStations: stations.length,
      activeSatellites,
      totalSatellites: sats.length,
      operationalRelays,
      totalRelays: rels.length,
      activeSpacecraftConnections: this.connections.size,
      activeOutagesCount: activeOutages.length,
      totalNetworkCapacity: totalCapacity,
      averageCoveragePercentage: Math.round(totalCapacity > 0 ? 82 : 0),
      networkHealthScore,
      totalCycleMaintenanceCost: cycleCost,
    };
  }

  // =========================================================================
  // 10. SERIALIZATION AND RESTORATION
  // =========================================================================

  public serializeState(): CommunicationsNetworkState {
    return {
      groundStations: this.getAllGroundStations(),
      satellites: this.getAllSatellites(),
      relays: this.getAllRelays(),
      connections: this.getAllSpacecraftConnections(),
      outages: Array.from(this.outages.values()).map((o) => ({ ...o })),
      lastMaintenanceTimestamp: this.lastMaintenanceTimestamp,
    };
  }

  public deserializeState(state: CommunicationsNetworkState): void {
    if (!state) return;

    this.groundStations.clear();
    for (const gs of state.groundStations || []) {
      this.groundStations.set(gs.id, { ...gs });
    }

    this.satellites.clear();
    for (const sat of state.satellites || []) {
      this.satellites.set(sat.id, { ...sat });
    }

    this.relays.clear();
    for (const relay of state.relays || []) {
      this.relays.set(relay.id, { ...relay });
    }

    this.connections.clear();
    for (const conn of state.connections || []) {
      this.connections.set(conn.spacecraftId, { ...conn });
    }

    this.outages.clear();
    for (const out of state.outages || []) {
      this.outages.set(out.id, { ...out });
    }

    this.lastMaintenanceTimestamp = state.lastMaintenanceTimestamp ?? Date.now();
    this.cachedCoverage.clear();

    Logger.info('NETWORK_MANAGER', 'Restored Communications Network state from save.');
  }
}
