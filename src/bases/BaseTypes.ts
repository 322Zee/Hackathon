/**
 * INTERSTELLAR CONTINUUM - Planetary Base Domain Contracts & Types
 * Strongly typed definitions for planetary research outposts, surface facilities,
 * module construction, power grid balance, communications links, maintenance wear,
 * resource logistics, and expansion infrastructure.
 *
 * NOTE: Fictional educational game-balance ratings, NOT real-world engineering constraints.
 */

import { DestinationId } from '../destinations/DestinationTypes';

/**
 * 7 Authoritative Base Operational Lifecycle States
 */
export enum BaseOperationalStatus {
  PLANNED = 'PLANNED',
  DEPLOYING = 'DEPLOYING',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  LIMITED_OPERATION = 'LIMITED_OPERATION',
  INACTIVE = 'INACTIVE',
}

/**
 * Canonical Planetary Base Module Classifications
 */
export enum BaseModuleType {
  RESEARCH_STATION = 'RESEARCH_STATION',
  RESOURCE_PROCESSING = 'RESOURCE_PROCESSING',
  COMMUNICATIONS_RELAY = 'COMMUNICATIONS_RELAY',
  POWER_FACILITY = 'POWER_FACILITY',
  MANUFACTURING_FACILITY = 'MANUFACTURING_FACILITY',
  MAINTENANCE_FACILITY = 'MAINTENANCE_FACILITY',
  STORAGE_FACILITY = 'STORAGE_FACILITY',
  HABITATION_CORE = 'HABITATION_CORE',
}

/**
 * Operational State for an Installed Module
 */
export enum ModuleOperationalState {
  ACTIVE = 'ACTIVE',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
}

/**
 * Base Power Generation Types
 */
export enum BasePowerSourceType {
  SOLAR_ARRAY = 'SOLAR_ARRAY',
  FISSION_REACTOR = 'FISSION_REACTOR',
  FUEL_CELL = 'FUEL_CELL',
  RTG_GENERATOR = 'RTG_GENERATOR',
}

/**
 * Maintenance Urgency Classification
 */
export enum MaintenanceUrgency {
  OPTIMAL = 'OPTIMAL',
  NORMAL = 'NORMAL',
  ATTENTION_NEEDED = 'ATTENTION_NEEDED',
  CRITICAL = 'CRITICAL',
}

/**
 * Communication Link Type for Outpost
 */
export enum BaseCommLinkType {
  DIRECT_LOS = 'DIRECT_LOS',
  ORBITAL_RELAY = 'ORBITAL_RELAY',
  DEEP_SPACE_NETWORK = 'DEEP_SPACE_NETWORK',
  DISCONNECTED = 'DISCONNECTED',
}

/**
 * Construction Task Status
 */
export enum ConstructionTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Definition Blueprint for a Base Module Type
 */
export interface BaseModuleDefinition {
  id: string;
  name: string;
  type: BaseModuleType | string;
  description: string;
  tier: number; // 1 to 5
  powerRequirementRating: number; // Consumption in PWR (Watts)
  powerOutputRating: number; // Generation in PWR (Watts, if power facility)
  powerSourceType?: BasePowerSourceType;
  massRating: number; // Mass units
  storageRequirementSlots: number; // Number of building slots consumed (usually 1)
  buildCostCredits: number;
  buildCostMaterials: number;
  buildTimeTicks: number; // Duration in simulation ticks / seconds
  constructionPayloadRequirement?: string; // Matching payload ID from PayloadRegistry
  baseResearchOutput?: number; // Science points per cycle
  processingCapacity?: number; // Material refinement units per cycle
  storageCapacityBoost?: number; // Storage units added to base
  commsGainDb?: number; // Communication signal boost in dB
  maintenanceWearReduction?: number; // Fractional wear mitigation (0.05 to 0.25)
  visualAssetKey: string;
  customData?: Record<string, any>;
}

/**
 * Record of an Active Installed Module in a Base
 */
export interface InstalledModuleRecord {
  id: string;
  instanceId: string;
  moduleTypeId: string;
  name: string;
  type: BaseModuleType | string;
  level: number; // 1 to 5
  health: number; // 0 to 100%
  operationalState: ModuleOperationalState;
  powerDraw: number;
  powerProvided: number;
  slotIndex: number;
  sectorId: string;
  installedTimestamp: number;
  outputMetrics: {
    researchOutput?: number;
    processingThroughput?: number;
    storageBoost?: number;
    signalGain?: number;
    wearReduction?: number;
  };
  customData?: Record<string, any>;
}

/**
 * Local Resource Inventory of a Planetary Base
 */
export interface BaseInventory {
  creditsBuffer: number;
  rawMaterials: number;
  processedMaterials: number;
  maintenanceSupplies: number;
  researchSamples: number;
  lifeSupportConsumables: number;
  customCargo: Record<string, number>;
}

/**
 * Power Grid Status of a Base
 */
export interface BasePowerStatus {
  generation: number; // Total PWR generated
  consumption: number; // Total PWR required
  netBalance: number; // generation - consumption
  batteryCapacity: number; // Total energy buffer units
  batteryStored: number; // Current energy in buffer
  gridEfficiency: number; // 0.0 to 1.0 (100%)
  isPowered: boolean;
  activeDeficit: boolean;
}

/**
 * Communications Status of a Base
 */
export interface BaseCommunicationsStatus {
  isConnected: boolean;
  linkType: BaseCommLinkType;
  relayStationId?: string;
  signalQuality: number; // 0 to 100%
  bandwidthGbps: number;
  latencySeconds: number;
}

/**
 * Maintenance & Structural Health Status
 */
export interface BaseMaintenanceStatus {
  overallCondition: number; // 0 to 100%
  wearRatePerCycle: number; // % wear per update cycle
  requiredSupplies: number; // Units of maintenance supplies needed
  maintenanceState: MaintenanceUrgency;
  lastMaintenanceTimestamp: number;
}

/**
 * Expansion Sector Partition in a Base
 */
export interface BaseExpansionSector {
  sectorId: string;
  name: string;
  isUnlocked: boolean;
  slotCount: number;
  unlockLevelRequired: number;
  unlockCostCredits: number;
  unlockCostMaterials: number;
}

/**
 * Active Construction / Assembly Task
 */
export interface ConstructionTask {
  taskId: string;
  baseId: string;
  moduleTypeId: string;
  slotIndex: number;
  sectorId: string;
  status: ConstructionTaskStatus;
  progressPercent: number; // 0 to 100
  elapsedTicks: number;
  totalDurationTicks: number;
  startedTimestamp: number;
  costRefundable: {
    credits: number;
    materials: number;
  };
}

/**
 * Chronological Base Operational Activity Log Entry
 */
export interface BaseActivityLogEntry {
  id: string;
  timestamp: number;
  category: 'CONSTRUCTION' | 'UPGRADE' | 'SCIENCE' | 'LOGISTICS' | 'MAINTENANCE' | 'ALERT';
  message: string;
  details?: Record<string, any>;
}

/**
 * Core Authoritative Planetary Base Record
 */
export interface BaseRecord {
  id: string;
  name: string;
  destinationId: DestinationId;
  locationId: string;
  establishmentDate: number;
  baseLevel: number; // 1 to 5
  operationalStatus: BaseOperationalStatus;
  maxSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  inventory: BaseInventory;
  storageCapacity: number;
  installedModules: InstalledModuleRecord[];
  powerStatus: BasePowerStatus;
  communicationsStatus: BaseCommunicationsStatus;
  maintenanceStatus: BaseMaintenanceStatus;
  expansionSectors: BaseExpansionSector[];
  activeConstructionTasks: ConstructionTask[];
  activityHistory: BaseActivityLogEntry[];
}

/**
 * Authored Surface Deployment Location Metadata
 */
export interface BaseLocationCandidate {
  id: string;
  destinationId: DestinationId;
  name: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  terrainType: 'FLAT_BASIN' | 'CRATER_RIM' | 'LAVA_TUBE' | 'CHAOS_TERRAIN' | 'POLAR_ICE' | 'SHORELINE_COAST';
  suitabilityScore: number; // 0 to 100
  hazardRating: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  solarExposurePercent: number; // 0 to 100
  dustHazardFactor: number; // 0.0 to 1.0
  radiationProtectionFactor: number; // 0.0 to 1.0 (shielding benefit)
  resourceAbundance: {
    rawMinerals: number; // 0 to 100
    waterIce: number;
    volatiles: number;
  };
  recommendedFor: string;
}

/**
 * Environmental Suitability Evaluation Report
 */
export interface LocationSuitabilityEvaluation {
  destinationId: DestinationId;
  locationId: string;
  locationName: string;
  isEligible: boolean;
  suitabilityScore: number; // 0 to 100
  hazardLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  solarEfficiencyMultiplier: number;
  resourceRichnessMultiplier: number;
  wearFactorMultiplier: number;
  requiredProtections: string[];
  environmentalSummary: string;
  reasonsForIneligibility?: string[];
}

/**
 * Base Deployment Plan Specification
 */
export interface BaseDeploymentPlanConfig {
  baseName: string;
  destinationId: DestinationId;
  locationId: string;
  initialModuleTypeIds: string[];
  assignedPayloadIds: string[];
  initialCreditsBuffer?: number;
  initialSupplies?: number;
}

/**
 * Authoritative Prepared Deployment Plan
 */
export interface BaseDeploymentPlan {
  planId: string;
  baseName: string;
  destinationId: DestinationId;
  locationId: string;
  initialModuleTypeIds: string[];
  assignedPayloadIds: string[];
  evaluation: LocationSuitabilityEvaluation;
  totalCostCredits: number;
  totalMaterialsRequired: number;
  estimatedDeploymentDurationTicks: number;
  isApproved: boolean;
  isPayloadRequirementsMet: boolean;
  missingRequirements: string[];
  createdAt: number;
}

/**
 * Configuration for Direct Base Creation
 */
export interface CreateBaseConfig {
  id?: string;
  name: string;
  destinationId: DestinationId;
  locationId: string;
  initialModules?: string[];
  initialInventory?: Partial<BaseInventory>;
  baseLevel?: number;
}

/**
 * Request for Moving Resources In or Out of a Base
 */
export interface ResourceTransferRequest {
  direction: 'DEPOSIT_TO_BASE' | 'WITHDRAW_FROM_BASE';
  resourceType: keyof BaseInventory;
  amount: number;
  customCargoKey?: string;
}

/**
 * Result of a Resource Transfer
 */
export interface ResourceTransferResult {
  success: boolean;
  transferredAmount: number;
  newBaseBalance: number;
  message: string;
}

/**
 * Upgrade Operation Result
 */
export interface UpgradeResult {
  success: boolean;
  baseId: string;
  targetId: string;
  targetType: 'BASE' | 'MODULE';
  previousLevel: number;
  newLevel: number;
  creditsCost: number;
  materialsCost: number;
  message: string;
}

/**
 * Maintenance Action Options
 */
export interface MaintenanceOptions {
  useSuppliesOnly?: boolean;
  useCreditsOnly?: boolean;
  customSupplyCostMultiplier?: number;
}

/**
 * Maintenance Operation Result
 */
export interface MaintenanceResult {
  success: boolean;
  baseId: string;
  previousCondition: number;
  restoredCondition: number;
  suppliesConsumed: number;
  creditsConsumed: number;
  modulesRepairedCount: number;
  message: string;
}

/**
 * Expansion Operation Result
 */
export interface ExpansionResult {
  success: boolean;
  baseId: string;
  previousMaxSlots: number;
  newMaxSlots: number;
  unlockedSectorId?: string;
  creditsCost: number;
  materialsCost: number;
  message: string;
}

/**
 * Comprehensive Base Operational Summary
 */
export interface BaseOperationalSummary {
  baseId: string;
  baseName: string;
  destinationId: DestinationId;
  locationId: string;
  operationalStatus: BaseOperationalStatus;
  baseLevel: number;
  totalModules: number;
  activeModules: number;
  degradedModules: number;
  powerGeneration: number;
  powerConsumption: number;
  powerNetBalance: number;
  isPowered: boolean;
  commsConnected: boolean;
  commsBandwidthGbps: number;
  signalQuality: number;
  overallCondition: number;
  maintenanceState: MaintenanceUrgency;
  occupiedSlots: number;
  maxSlots: number;
  storageUsed: number;
  storageMax: number;
  activeResearchOutput: number;
  activeProcessingRate: number;
  activeConstructionCount: number;
}

/**
 * Serialized Save Format for Entire Base System
 */
export interface PlanetaryBasesSaveState {
  version: string;
  timestamp: number;
  bases: BaseRecord[];
  activePlans: BaseDeploymentPlan[];
}
