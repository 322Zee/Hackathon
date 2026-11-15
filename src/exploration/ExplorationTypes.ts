/**
 * INTERSTELLAR CONTINUUM - Robotic Rover Exploration System
 * Authoritative domain models, contracts, and interfaces for planetary rover operations.
 */

export interface Vector2D {
  x: number;
  y: number;
}

/** Rover operational statuses */
export enum RoverOperationalStatus {
  ACTIVE = 'ACTIVE',
  STANDBY = 'STANDBY',
  EXPLORING = 'EXPLORING',
  AUTONOMOUS = 'AUTONOMOUS',
  SAMPLING = 'SAMPLING',
  RETURNING = 'RETURNING',
  DEGRADED = 'DEGRADED',
  DEPLETED = 'DEPLETED',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  RECOVERED = 'RECOVERED',
}

/** Rover communication link statuses */
export enum RoverCommStatus {
  CONNECTED = 'CONNECTED',
  WEAK_SIGNAL = 'WEAK_SIGNAL',
  INTERMITTENT = 'INTERMITTENT',
  OCCLUDED = 'OCCLUDED',
  DISCONNECTED = 'DISCONNECTED',
}

/** Canonical rover chassis classifications */
export enum RoverModelType {
  SCOUT = 'SCOUT',
  SCIENTIFIC = 'SCIENTIFIC',
  HEAVY_UTILITY = 'HEAVY_UTILITY',
  ADVANCED_AUTONOMOUS = 'ADVANCED_AUTONOMOUS',
}

/** Scientific instrument categories */
export enum InstrumentCategory {
  IMAGING = 'IMAGING',
  GEOLOGICAL_ANALYSIS = 'GEOLOGICAL_ANALYSIS',
  ENVIRONMENTAL_OBSERVATION = 'ENVIRONMENTAL_OBSERVATION',
  SURFACE_SCANNING = 'SURFACE_SCANNING',
  GENERAL_OBSERVATION = 'GENERAL_OBSERVATION',
}

/** Power source configuration */
export enum RoverPowerSource {
  SOLAR_ARRAY = 'SOLAR_ARRAY',
  RADIOISOTOPE_RTG = 'RADIOISOTOPE_RTG',
  HYBRID_SOLAR_RTG = 'HYBRID_SOLAR_RTG',
  FUEL_CELL = 'FUEL_CELL',
}

/** Exploration objective categories */
export enum ExplorationObjectiveType {
  EXPLORE_REGION = 'EXPLORE_REGION',
  VISIT_LANDMARK = 'VISIT_LANDMARK',
  SURVEY_TERRAIN = 'SURVEY_TERRAIN',
  INVESTIGATE_GEOLOGY = 'INVESTIGATE_GEOLOGY',
  COLLECT_OBSERVATION = 'COLLECT_OBSERVATION',
  PHOTOGRAPH_POI = 'PHOTOGRAPH_POI',
  REACH_LOCATION = 'REACH_LOCATION',
}

/** Terrain classification */
export enum TerrainType {
  SMOOTH_PLAINS = 'SMOOTH_PLAINS',
  REGOLITH_DUNES = 'REGOLITH_DUNES',
  ROCKY_CRAGS = 'ROCKY_CRAGS',
  CRATER_SLOPES = 'CRATER_SLOPES',
  HAZARDOUS_FISSURE = 'HAZARDOUS_FISSURE',
  CRYOGENIC_ICE = 'CRYOGENIC_ICE',
}

/** Point of interest classifications */
export enum POICategory {
  LANDMARK = 'LANDMARK',
  GEOLOGICAL_FORMATION = 'GEOLOGICAL_FORMATION',
  HISTORIC_SITE = 'HISTORIC_SITE',
  ANOMALY = 'ANOMALY',
  RESOURCE_LOCATION = 'RESOURCE_LOCATION',
  CRATER = 'CRATER',
}

/** Autonomous exploration behavior modes */
export enum AutonomousBehaviorMode {
  IDLE = 'IDLE',
  NAVIGATE_TO_WAYPOINT = 'NAVIGATE_TO_WAYPOINT',
  SURVEY_AREA = 'SURVEY_AREA',
  AUTO_SCAN_POIS = 'AUTO_SCAN_POIS',
  RETURN_TO_BASE = 'RETURN_TO_BASE',
}

/** Maintenance and recovery procedures */
export enum RoverMaintenanceAction {
  CLEAN_SOLAR_PANELS = 'CLEAN_SOLAR_PANELS',
  DIAGNOSTIC_REBOOT = 'DIAGNOSTIC_REBOOT',
  EMERGENCY_BATTERY_JUMP = 'EMERGENCY_BATTERY_JUMP',
  CHASSIS_FIELD_REPAIR = 'CHASSIS_FIELD_REPAIR',
  CALIBRATE_INSTRUMENTS = 'CALIBRATE_INSTRUMENTS',
}

// =========================================================================
// SCIENTIFIC INSTRUMENT CONTRACTS
// =========================================================================

export interface InstrumentCompatibility {
  minRoverLevel: number;
  allowedModels: RoverModelType[];
  minPowerWatts: number;
  slotCost: number;
}

export interface ScientificInstrument {
  id: string;
  name: string;
  category: InstrumentCategory;
  dataCollectionRating: number; // Science yield rating (10 - 250 data points)
  powerConsumptionRating: number; // Energy units consumed per use (5 - 35 units)
  compatibilityRequirements: InstrumentCompatibility;
  unlockRequirements: {
    techTier: number;
    researchCost: number;
    requiredTechId?: string;
  };
  operationalRangeMeters: number; // Max distance to target for scanning (e.g. 50 - 200m)
  samplingDurationSeconds: number; // Time required to complete observation
  description: string;
}

export interface RoverInstrumentSlot {
  slotIndex: number;
  instrument: ScientificInstrument;
  isReady: boolean;
  cooldownRemaining: number;
}

// =========================================================================
// ROVER CONFIGURATION & MOVEMENT
// =========================================================================

export interface RoverMovementConfig {
  maxSpeed: number; // Maximum forward speed in px/s (e.g. 120 - 240)
  maxReverseSpeed: number; // Maximum reverse speed in px/s (e.g. 50 - 100)
  acceleration: number; // Acceleration rate in px/s² (e.g. 200 - 500)
  brakingDeceleration: number; // Deceleration rate during active brake (e.g. 400 - 800)
  naturalFriction: number; // Rolling friction deceleration (e.g. 80 - 150)
  turnRateDegPerSec: number; // Turning / steering angular velocity in deg/s (e.g. 60 - 140)
  energyDrainPerSecond: number; // Idle energy consumption rate (e.g. 0.2 - 0.8)
  energyDrainPerMeter: number; // Driving energy cost per unit distance (e.g. 0.05 - 0.2)
  terrainHandling: Record<TerrainType, number>; // Speed multiplier per terrain (e.g. 1.0 down to 0.4)
  sensorDetectionRadius: number; // Detection radius for POIs and obstacles in px (e.g. 250 - 500)
}

export interface RoverLocation {
  x: number;
  y: number;
  headingDeg: number; // 0 = North, 90 = East, 180 = South, 270 = West
  sectorId?: string;
  currentTerrain: TerrainType;
}

export interface StorageCapacity {
  usedSlots: number;
  maxSlots: number;
  collectedSamples: CollectedSample[];
}

export interface CollectedSample {
  id: string;
  name: string;
  sourceLocationId: string;
  dataRating: number;
  massKg: number;
  collectedAtTimestamp: number;
  rockClassification?: string;
}

export interface RoverModelDefinition {
  modelId: string;
  modelType: RoverModelType;
  displayName: string;
  description: string;
  baseCondition: number;
  baseMaxEnergy: number;
  powerSource: RoverPowerSource;
  solarGenerationRate: number; // Energy regenerated per second in sunlight
  rtgGenerationRate: number; // Constant energy trickle per second
  maxInstrumentSlots: number;
  maxStorageSlots: number;
  defaultMovementConfig: RoverMovementConfig;
  visualAssetKey: string;
  baseMassKg: number;
  autonomousCapabilityRating: number; // 1 to 5 (determines autonomous speed/efficiency)
}

export interface RoverConfig {
  id: string;
  name: string;
  model: RoverModelType | string;
  destinationId: string;
  deploymentMissionId?: string;
  installedInstrumentIds?: string[];
  initialLocation?: Vector2D;
  initialHeadingDeg?: number;
}

export interface RoverRecord {
  id: string;
  name: string;
  model: RoverModelType;
  modelId: string;
  destinationId: string;
  deploymentMissionId?: string;
  vehicleConditionRating: number; // 0.0 - 100.0%
  energyRating: number; // 0.0 - 100.0%
  maxEnergy: number;
  communicationStatus: RoverCommStatus;
  communicationFidelity: number; // 0.0 - 100.0%
  storageCapacity: StorageCapacity;
  instruments: RoverInstrumentSlot[];
  movementConfig: RoverMovementConfig;
  upgradeLevel: number;
  location: RoverLocation;
  velocity: Vector2D;
  speed: number;
  operationalStatus: RoverOperationalStatus;
  powerSource: RoverPowerSource;
  solarGenerationRate: number;
  rtgGenerationRate: number;
  dustAccumulationPercent: number; // 0.0 - 100.0% (reduces solar efficiency)
  autonomousMode: boolean;
  autonomousBehavior: AutonomousBehaviorMode;
  autonomousTarget?: Vector2D;
  autonomousWaypoints: Vector2D[];
  stats: {
    distanceTraveledMeters: number;
    observationsCollected: number;
    objectivesCompleted: number;
    timeInOperationSeconds: number;
  };
}

// =========================================================================
// INPUT & CONTROL
// =========================================================================

export interface RoverControlInput {
  forward: number; // -1.0 (Reverse) to +1.0 (Forward)
  steer: number; // -1.0 (Left) to +1.0 (Right)
  brake: boolean; // Active braking
  boost?: boolean; // Temporary speed boost (costs double energy)
  crawl?: boolean; // Slow precision crawl mode (halves energy, improves obstacle clearance)
  headlightsToggle?: boolean;
}

export interface RoverTelemetryStatus {
  roverId: string;
  name: string;
  model: RoverModelType;
  destinationId: string;
  location: RoverLocation;
  speedMps: number;
  headingDeg: number;
  energyPercent: number;
  conditionPercent: number;
  commStatus: RoverCommStatus;
  commFidelity: number;
  operationalStatus: RoverOperationalStatus;
  activeInstrumentCount: number;
  storageUsage: { used: number; max: number };
  autonomousMode: boolean;
  autonomousTarget?: Vector2D;
  currentTerrain: TerrainType;
  distanceTraveledMeters: number;
}

// =========================================================================
// TERRAIN & ENVIRONMENT ADAPTER CONTRACTS
// =========================================================================

export interface SurfaceObstacle {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  obstacleType: 'BOULDER' | 'CRATER' | 'CREVICE' | 'DEBRIS' | 'CLIFF';
  hardnessRating: number; // Collision damage factor
}

export interface ExplorationBoundary {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  category: POICategory;
  x: number;
  y: number;
  discoveryRadius: number;
  isDiscovered: boolean;
  description: string;
  associatedObjectiveId?: string;
  scienceBonus: number;
}

export interface ScientificDiscoveryLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  samplingRadius: number;
  requiredInstrumentCategory: InstrumentCategory;
  dataYield: number;
  isSampled: boolean;
  sampleName: string;
  geologicalContext: string;
}

export interface ExplorationObjective {
  id: string;
  title: string;
  description: string;
  type: ExplorationObjectiveType;
  destinationId: string;
  targetId?: string; // POI ID or Discovery Location ID
  targetLocation?: Vector2D;
  targetRadiusMeters?: number;
  requiredObservationsCount?: number;
  currentObservationsCount: number;
  requiredSurveyPercentage?: number;
  currentSurveyPercentage: number;
  rewardCredits: number;
  rewardResearchData: number;
  isCompleted: boolean;
  completedAtTimestamp?: number;
}

// =========================================================================
// OPERATIONS RESULTS
// =========================================================================

export interface RoverDeploymentResult {
  success: boolean;
  rover?: RoverRecord;
  destinationId: string;
  landingCoordinates: Vector2D;
  message: string;
}

export interface ObservationResult {
  success: boolean;
  roverId: string;
  instrumentId: string;
  dataCollected: number;
  sampleCreated?: CollectedSample;
  objectiveUpdated?: string;
  energyConsumed: number;
  message: string;
}

export interface ObjectiveCompletionResult {
  success: boolean;
  objectiveId: string;
  rewardCredits: number;
  rewardResearchData: number;
  message: string;
}

export interface ReturnResult {
  success: boolean;
  roverId: string;
  returnLocation: Vector2D;
  samplesRecoveredCount: number;
  totalDataSecured: number;
  message: string;
}

export interface MaintenanceResult {
  success: boolean;
  roverId: string;
  action: RoverMaintenanceAction;
  conditionRestored: number;
  energyRestored: number;
  dustClearedPercent: number;
  message: string;
}
