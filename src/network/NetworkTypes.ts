/**
 * INTERSTELLAR CONTINUUM - Communications and Satellite Network Data Contracts
 * Strongly typed definitions for ground stations, communication satellites,
 * spacecraft connections, planetary relays, abstract coverage ratings,
 * outages, recovery protocols, and network management.
 *
 * NOTE: Strictly adheres to abstract game ratings and fictional agency mechanisms.
 * No real-world radio-frequency engineering, antenna design, or signal interception instructions.
 */

export enum InfrastructureType {
  GROUND_STATION = 'GROUND_STATION',
  COMMUNICATION_SATELLITE = 'COMMUNICATION_SATELLITE',
  PLANETARY_RELAY = 'PLANETARY_RELAY',
  SPACECRAFT = 'SPACECRAFT',
}

export enum GroundStationStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
}

export enum SatelliteType {
  LEO_RELAY = 'LEO_RELAY',
  GEO_STATIONARY = 'GEO_STATIONARY',
  LUNAR_ORBITER = 'LUNAR_ORBITER',
  INTERPLANETARY_CARRIER = 'INTERPLANETARY_CARRIER',
  DEEP_SPACE_COMMUNICATOR = 'DEEP_SPACE_COMMUNICATOR',
  POLAR_ORBITER = 'POLAR_ORBITER',
}

export enum SatelliteStatus {
  ACTIVE = 'ACTIVE',
  STANDBY = 'STANDBY',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  CALIBRATING = 'CALIBRATING',
}

export enum SpacecraftCommStatus {
  CONNECTED = 'CONNECTED',
  WEAK_SIGNAL = 'WEAK_SIGNAL',
  INTERMITTENT = 'INTERMITTENT',
  OCCLUDED = 'OCCLUDED',
  DISCONNECTED = 'DISCONNECTED',
}

export enum DataTransmissionStatus {
  TRANSMITTING = 'TRANSMITTING',
  IDLE = 'IDLE',
  BUFFERED = 'BUFFERED',
  BLOCKED = 'BLOCKED',
}

export enum RelayLocationType {
  ORBITAL = 'ORBITAL',
  SURFACE = 'SURFACE',
  ATMOSPHERIC = 'ATMOSPHERIC',
  LAGRANGE_POINT = 'LAGRANGE_POINT',
}

export enum RelayOperationalState {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  SOLAR_CONJUNCTION_BLACKOUT = 'SOLAR_CONJUNCTION_BLACKOUT',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
}

export enum CoverageRating {
  NONE = 'NONE',
  MINIMAL = 'MINIMAL',
  PARTIAL = 'PARTIAL',
  GOOD = 'GOOD',
  OPTIMAL = 'OPTIMAL',
}

export enum OutageType {
  SOLAR_FLARE = 'SOLAR_FLARE',
  ATMOSPHERIC_INTERFERENCE = 'ATMOSPHERIC_INTERFERENCE',
  SOLAR_CONJUNCTION = 'SOLAR_CONJUNCTION',
  EQUIPMENT_ANOMALY = 'EQUIPMENT_ANOMALY',
  MAINTENANCE_DEGRADATION = 'MAINTENANCE_DEGRADATION',
}

export enum RecoveryMethod {
  EMERGENCY_REPAIR = 'EMERGENCY_REPAIR',
  REMOTE_DIAGNOSTICS = 'REMOTE_DIAGNOSTICS',
  BACKUP_REROUTE = 'BACKUP_REROUTE',
  RECALIBRATION = 'RECALIBRATION',
}

/** Ground Station Unlock Requirements */
export interface StationUnlockRequirements {
  requiredRank?: number;
  costCredits?: number;
  requiredTechId?: string;
  isUnlockedByDefault?: boolean;
}

/** Ground Station Authoritative Domain Record */
export interface GroundStationRecord {
  id: string;
  name: string;
  location: string;
  longitudeDeg: number;
  latitudeDeg: number;
  status: GroundStationStatus;
  capacityRating: number; // Bandwidth throughput channel rating (e.g. 100 - 500)
  upgradeLevel: number;
  maxUpgradeLevel: number;
  maintenanceCost: number; // Credits per maintenance cycle
  unlockRequirements: StationUnlockRequirements;
  isUnlocked: boolean;
  signalGainDb: number; // Fictional gain rating (+12 to +30 dB)
  dishDiameterMeters: number;
  supportedBands: string[];
  activeConnectionsCount: number;
}

/** Parameters required to register or build a new Ground Station */
export interface GroundStationConfig {
  id: string;
  name: string;
  location: string;
  longitudeDeg?: number;
  latitudeDeg?: number;
  capacityRating?: number;
  upgradeLevel?: number;
  maintenanceCost?: number;
  unlockRequirements?: StationUnlockRequirements;
  signalGainDb?: number;
  dishDiameterMeters?: number;
  supportedBands?: string[];
}

/** Satellite Network Contribution */
export interface SatelliteNetworkContribution {
  coverageBonus: number; // Percentage contribution (e.g. 15-35%)
  bandwidthBonus: number; // Channel throughput bonus
  latencyReduction: number; // Fractional latency reduction (0.0 - 0.5)
  signalStrengthBonus: number; // Signal quality boost (0 - 30)
}

/** Communication Satellite Domain Record */
export interface SatelliteRecord {
  id: string;
  name: string;
  satelliteType: SatelliteType;
  status: SatelliteStatus;
  networkContribution: SatelliteNetworkContribution;
  destinationId: string; // Target body or orbital shell (e.g. DEST_EARTH_LEO, DEST_MARS)
  upgradeLevel: number;
  maxUpgradeLevel: number;
  operationalCost: number; // Credits per cycle
  powerStatus: number; // 0 - 100%
  constellationId?: string;
  orbitalAltitudeKm?: number;
  assignedMissionId?: string;
}

/** Parameters required to register a communication satellite */
export interface SatelliteConfig {
  id: string;
  name: string;
  satelliteType: SatelliteType;
  destinationId: string;
  networkContribution?: Partial<SatelliteNetworkContribution>;
  upgradeLevel?: number;
  operationalCost?: number;
  status?: SatelliteStatus;
  constellationId?: string;
  orbitalAltitudeKm?: number;
  assignedMissionId?: string;
}

/** Planetary Relay Upgrade Option */
export interface RelayUpgradeOption {
  upgradeId: string;
  name: string;
  costCredits: number;
  description: string;
  coverageBonus: number;
  applied: boolean;
}

/** Planetary Relay Station Domain Record */
export interface PlanetaryRelayRecord {
  id: string;
  name: string;
  deploymentLocation: string; // DestinationId (e.g. DEST_MOON, DEST_MARS)
  locationType: RelayLocationType;
  operationalState: RelayOperationalState;
  networkContribution: {
    localSurfaceBonus: number;
    rangeMultiplier: number;
    linkRating: number;
  };
  upgradeLevel: number;
  maxUpgradeLevel: number;
  upgradeOptions: RelayUpgradeOption[];
  maintenanceCost: number;
  lastServicedTimestamp: number;
  conditionRating: number; // 0 - 100%
}

/** Parameters required to deploy a planetary relay */
export interface RelayStationConfig {
  id: string;
  name: string;
  deploymentLocation: string;
  locationType?: RelayLocationType;
  networkContribution?: {
    localSurfaceBonus?: number;
    rangeMultiplier?: number;
    linkRating?: number;
  };
  upgradeLevel?: number;
  maintenanceCost?: number;
  upgradeOptions?: RelayUpgradeOption[];
}

/** Active Spacecraft Connection Route Information */
export interface ConnectionRoute {
  groundStationId?: string;
  satelliteId?: string;
  relayId?: string;
  hops: number;
  pathDescription: string[];
}

/** Spacecraft Connection Record */
export interface SpacecraftConnectionRecord {
  spacecraftId: string;
  name: string;
  missionId?: string;
  destinationId: string;
  communicationStatus: SpacecraftCommStatus;
  signalQualityRating: number; // 0.0 to 100.0%
  dataTransmissionStatus: DataTransmissionStatus;
  connectionAvailability: boolean;
  activeRoute: ConnectionRoute;
  downlinkRateMbps: number;
  effectiveLatencySeconds: number;
  telemetryFidelityRating: number; // 0.0 to 100.0%
  scienceDataMultiplier: number; // 0.5x to 2.5x
  connectedAtTimestamp: number;
  lastTelemetryTimestamp: number;
}

/** Request payload to connect a spacecraft */
export interface SpacecraftConnectionRequest {
  spacecraftId: string;
  name?: string;
  missionId?: string;
  destinationId: string;
  preferredGroundStationId?: string;
}

/** Outage Report Details */
export interface OutageReport {
  targetId: string; // Ground station, satellite, relay, or destinationId
  targetType: InfrastructureType;
  outageType: OutageType;
  severity: number; // 0.1 to 1.0 (1.0 = total blackout)
  durationSeconds: number;
  description: string;
}

/** Recorded Network Outage */
export interface NetworkOutageRecord {
  id: string;
  targetId: string;
  targetType: InfrastructureType;
  outageType: OutageType;
  severity: number;
  startTime: number;
  durationSeconds: number;
  expiryTime: number;
  description: string;
  isResolved: boolean;
}

/** Deterministic Coverage Evaluation for a Destination */
export interface DestinationCoverageRecord {
  destinationId: string;
  destinationName: string;
  coveragePercentage: number; // 0 to 100%
  rating: CoverageRating;
  telemetryFidelity: number; // 0 to 100%
  scienceMultiplier: number; // 0.5 to 2.5
  latencySeconds: number;
  hasContinuousLineOfSight: boolean;
  directEarthVisibility: boolean;
  contributingGroundStations: string[];
  contributingSatellites: string[];
  contributingRelays: string[];
  activeOutages: NetworkOutageRecord[];
  bottlenecks: string[];
  recommendations: string[];
}

/** Global Network Status Summary */
export interface NetworkStatusSummary {
  operationalGroundStations: number;
  totalGroundStations: number;
  activeSatellites: number;
  totalSatellites: number;
  operationalRelays: number;
  totalRelays: number;
  activeSpacecraftConnections: number;
  activeOutagesCount: number;
  totalNetworkCapacity: number;
  averageCoveragePercentage: number;
  networkHealthScore: number; // 0 - 100%
  totalCycleMaintenanceCost: number;
}

/** Infrastructure Upgrade Result */
export interface UpgradeResult {
  success: boolean;
  targetId: string;
  targetType: InfrastructureType;
  previousLevel: number;
  newLevel: number;
  costPaid: number;
  reason?: string;
}

/** Outage Recovery Result */
export interface RecoveryResult {
  success: boolean;
  targetId: string;
  method: RecoveryMethod;
  costPaid: number;
  restoredStatus: string;
  reason?: string;
}

/** Full Serializable State of the Communications Network */
export interface CommunicationsNetworkState {
  groundStations: GroundStationRecord[];
  satellites: SatelliteRecord[];
  relays: PlanetaryRelayRecord[];
  connections: SpacecraftConnectionRecord[];
  outages: NetworkOutageRecord[];
  lastMaintenanceTimestamp: number;
}

