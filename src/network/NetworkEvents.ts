/**
 * INTERSTELLAR CONTINUUM - Communications Network Domain Events
 * Strongly typed domain events and payloads dispatched across the network subsystem.
 */

import {
  GroundStationRecord,
  SatelliteRecord,
  PlanetaryRelayRecord,
  SpacecraftConnectionRecord,
  NetworkOutageRecord,
  CoverageRating,
  InfrastructureType,
  UpgradeResult,
} from './NetworkTypes';

export interface GroundStationRegisteredPayload {
  station: GroundStationRecord;
  timestamp: number;
}

export interface SatelliteRegisteredPayload {
  satellite: SatelliteRecord;
  timestamp: number;
}

export interface RelayDeployedPayload {
  relay: PlanetaryRelayRecord;
  timestamp: number;
}

export interface SpacecraftConnectedPayload {
  connection: SpacecraftConnectionRecord;
  timestamp: number;
}

export interface SpacecraftDisconnectedPayload {
  spacecraftId: string;
  reason?: string;
  timestamp: number;
}

export interface CoverageChangedPayload {
  destinationId: string;
  previousCoverage: number;
  currentCoverage: number;
  rating: CoverageRating;
  timestamp: number;
}

export interface NetworkOutageDetectedPayload {
  outage: NetworkOutageRecord;
  timestamp: number;
}

export interface NetworkServiceRestoredPayload {
  targetId: string;
  targetType: InfrastructureType;
  method?: string;
  timestamp: number;
}

export interface InfrastructureUpgradedPayload {
  upgrade: UpgradeResult;
  timestamp: number;
}

export interface NetworkMaintenanceCompletedPayload {
  totalCostPaid: number;
  degradedCount: number;
  operationalCount: number;
  timestamp: number;
}

/** Mapping of all event names to their typed payloads */
export interface CommunicationsNetworkEvents {
  GroundStationRegistered: GroundStationRegisteredPayload;
  SatelliteRegistered: SatelliteRegisteredPayload;
  RelayDeployed: RelayDeployedPayload;
  SpacecraftConnected: SpacecraftConnectedPayload;
  SpacecraftDisconnected: SpacecraftDisconnectedPayload;
  CoverageChanged: CoverageChangedPayload;
  NetworkOutageDetected: NetworkOutageDetectedPayload;
  NetworkServiceRestored: NetworkServiceRestoredPayload;
  InfrastructureUpgraded: InfrastructureUpgradedPayload;
  NetworkMaintenanceCompleted: NetworkMaintenanceCompletedPayload;
}
