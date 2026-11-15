/**
 * INTERSTELLAR CONTINUUM - Authoritative Payload Architecture & Types
 * Strongly typed domain models for payloads, categories, delivery states,
 * fictional gameplay ratings, compatibility tags, and capacity metrics.
 * 
 * NOTE: All values are fictional educational game-balance ratings, NOT real-world specifications.
 */

import { DestinationId } from '../destinations/DestinationTypes';

/**
 * 11 Canonical Payload Categories (Extensible at runtime)
 */
export enum PayloadCategory {
  COMMUNICATION_SATELLITES = 'COMMUNICATION_SATELLITES',
  OBSERVATION_SATELLITES = 'OBSERVATION_SATELLITES',
  SCIENTIFIC_INSTRUMENTS = 'SCIENTIFIC_INSTRUMENTS',
  ROBOTIC_ROVERS = 'ROBOTIC_ROVERS',
  LANDING_EQUIPMENT = 'LANDING_EQUIPMENT',
  RESEARCH_STATION_MODULES = 'RESEARCH_STATION_MODULES',
  POWER_MODULES = 'POWER_MODULES',
  COMMUNICATIONS_RELAY_MODULES = 'COMMUNICATIONS_RELAY_MODULES',
  MANUFACTURING_MODULES = 'MANUFACTURING_MODULES',
  MAINTENANCE_SUPPLIES = 'MAINTENANCE_SUPPLIES',
  GENERAL_CARGO = 'GENERAL_CARGO',
}

/**
 * 7 Canonical Delivery & Inventory Lifecycle States
 */
export enum PayloadDeliveryState {
  AVAILABLE = 'AVAILABLE',     // In warehouse storage, ready for assignment
  RESERVED = 'RESERVED',       // Earmarked for a mission, not yet physically mounted
  ASSIGNED = 'ASSIGNED',       // Loaded onto a vehicle or spacecraft manifest
  IN_TRANSIT = 'IN_TRANSIT',   // Vehicle has launched; payload is en route
  DELIVERED = 'DELIVERED',     // Confirmed delivered at target destination
  RETURNED = 'RETURNED',       // Returned to Earth/warehouse from completed/aborted mission
  LOST = 'LOST',               // Destroyed or lost during transit or landing failure
}

/**
 * Dynamic Availability Status in the Agency Registry
 */
export enum PayloadAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  RESEARCH_REQUIRED = 'RESEARCH_REQUIRED',
  MANUFACTURING_REQUIRED = 'MANUFACTURING_REQUIRED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  RESERVED_FULL = 'RESERVED_FULL',
}

/**
 * Standardized Compatibility Tags for Vehicles and Spacecraft
 */
export enum PayloadCompatibilityTag {
  // Vehicle Class Compatibility
  BASIC_VEHICLE = 'BASIC_VEHICLE',
  ADVANCED_VEHICLE = 'ADVANCED_VEHICLE',
  HEAVY_VEHICLE = 'HEAVY_VEHICLE',
  SUPER_HEAVY_VEHICLE = 'SUPER_HEAVY_VEHICLE',

  // Platform Mounting Architecture
  SATELLITE_BUS = 'SATELLITE_BUS',
  ORBITAL_SURVEYOR = 'ORBITAL_SURVEYOR',
  SURFACE_LANDER = 'SURFACE_LANDER',
  PLANETARY_ROVER = 'PLANETARY_ROVER',
  STATION_HABITAT = 'STATION_HABITAT',
  CARGO_BAY = 'CARGO_BAY',

  // Environmental Certification
  LEO_CERTIFIED = 'LEO_CERTIFIED',
  LUNAR_CERTIFIED = 'LUNAR_CERTIFIED',
  DEEP_SPACE_CERTIFIED = 'DEEP_SPACE_CERTIFIED',
  ATMOSPHERIC_ENTRY = 'ATMOSPHERIC_ENTRY',
  RADIATION_HARDENED = 'RADIATION_HARDENED',
  CRYOGENIC_STABLE = 'CRYOGENIC_STABLE',

  // Fairing & Slot Dimensions
  FAIRING_1_8M = 'FAIRING_1_8M',
  FAIRING_2_5M = 'FAIRING_2_5M',
  FAIRING_3_8M = 'FAIRING_3_8M',
  FAIRING_5_0M = 'FAIRING_5_0M',
  SLOT_SMALL = 'SLOT_SMALL',
  SLOT_MEDIUM = 'SLOT_MEDIUM',
  SLOT_LARGE = 'SLOT_LARGE',
}

/**
 * Category Metadata for UI and Extensibility
 */
export interface CategoryMetadata {
  id: string;
  displayName: string;
  description: string;
  iconKey: string;
  defaultStorageType: 'INTERNAL_RACK' | 'EXTERNAL_BAY' | 'FAIRING_ENCLOSED';
  isCustom?: boolean;
}

/**
 * Technology and Unlock Prerequisites
 */
export interface PayloadUnlockRequirements {
  techTier: number;
  techNodeId?: string;
  requiredMissionId?: string;
  directorRank?: number;
  isUnlockedByDefault?: boolean;
}

/**
 * Fictional Game Ratings and Physical Envelope
 */
export interface PayloadFictionalRatings {
  massRating: number;              // Abstract game mass rating (e.g. 10 - 500 Mass Units)
  powerRequirementRating: number; // Abstract operational power draw (Watts rating, e.g. 15 - 350 PWR)
  storageRequirement: number;     // Abstract storage volume / slot units (e.g. 1 - 8 Slots)
}

/**
 * Core Authoritative Payload Definition
 */
export interface PayloadDefinition {
  id: string;
  name: string;
  category: PayloadCategory | string;
  description: string;
  visualAsset: string;             // Sprite key or SVG icon name
  massRating: number;              // Fictional mass rating (MU)
  powerRequirementRating: number; // Fictional power draw (PWR)
  storageRequirement: number;     // Storage capacity consumption (Slots)
  compatibilityTags: string[];     // Vehicle, fairing, and platform tags
  destinationRestrictions?: DestinationId[]; // If set, only deliverable to these destinations
  purpose: string;                 // Scientific, educational, or gameplay rationale
  acquisitionCost: number;         // Unit cost in agency credits
  unlockRequirements: PayloadUnlockRequirements;
  quantity: number;                // Stock quantity in agency warehouse
  availabilityStatus: PayloadAvailabilityStatus;
  customData?: Record<string, any>;
}

/**
 * Tracking Breakdown for Payload Quantities
 */
export interface PayloadInventoryRecord {
  payloadId: string;
  totalOwned: number;
  available: number;
  reserved: number;
  assigned: number;
  inTransit: number;
  delivered: number;
  returned: number;
  lost: number;
}

/**
 * An Assignment of a Payload to a Vehicle or Spacecraft
 */
export interface AssignedPayloadItem {
  payloadId: string;
  quantity: number;
  unitMassRating: number;
  totalMassRating: number;
  unitPowerRequirement: number;
  totalPowerRequirement: number;
  unitStorageRequirement: number;
  totalStorageRequirement: number;
  assignedTimestamp: number;
  missionId?: string;
}

/**
 * Manifest of Payloads Loaded onto a Target Vehicle
 */
export interface VehiclePayloadManifest {
  vehicleId: string;
  vehicleName: string;
  assignedPayloads: Map<string, AssignedPayloadItem>;
  totalMassRating: number;
  totalPowerRequirement: number;
  totalStorageUsed: number;
  lastUpdatedTimestamp: number;
}

/**
 * Abstract Vehicle Capacity Envelope (Provided by Adapters)
 */
export interface VehicleCapacity {
  vehicleId: string;
  vehicleName: string;
  maxPayloadMassRating: number;
  maxPowerRating: number;
  maxStorageSlots: number;
  fairingDiameterM: number;
  supportedTags: string[];
}

/**
 * Remaining Capacity Telemetry
 */
export interface RemainingCapacityMetrics {
  remainingMassRating: number;
  remainingPowerRating: number;
  remainingStorageSlots: number;
  massCapacityRatio: number;      // 0.0 to 1.0 (or >1.0 if overloaded)
  powerCapacityRatio: number;
  storageCapacityRatio: number;
  isWithinMassLimit: boolean;
  isWithinPowerLimit: boolean;
  isWithinStorageLimit: boolean;
  isFullyWithinLimits: boolean;
}

/**
 * Discrete Validation Issue Types
 */
export enum PayloadValidationSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum PayloadValidationCode {
  CAPACITY_MASS_EXCEEDED = 'CAPACITY_MASS_EXCEEDED',
  CAPACITY_POWER_EXCEEDED = 'CAPACITY_POWER_EXCEEDED',
  CAPACITY_STORAGE_EXCEEDED = 'CAPACITY_STORAGE_EXCEEDED',
  INCOMPATIBLE_VEHICLE_TAG = 'INCOMPATIBLE_VEHICLE_TAG',
  INSUFFICIENT_FAIRING_CLEARANCE = 'INSUFFICIENT_FAIRING_CLEARANCE',
  DESTINATION_RESTRICTION_UNMET = 'DESTINATION_RESTRICTION_UNMET',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  TECHNOLOGY_LOCKED = 'TECHNOLOGY_LOCKED',
  MISSING_REQUIRED_PAYLOAD = 'MISSING_REQUIRED_PAYLOAD',
  PAYLOAD_NOT_FOUND = 'PAYLOAD_NOT_FOUND',
  ZERO_QUANTITY_ASSIGNED = 'ZERO_QUANTITY_ASSIGNED',
}

/**
 * Individual Validation Item
 */
export interface PayloadValidationIssue {
  code: PayloadValidationCode;
  severity: PayloadValidationSeverity;
  payloadId?: string;
  payloadName?: string;
  message: string;
  remedyRecommendation: string;
  metricValue?: string | number;
  limitValue?: string | number;
}

/**
 * Comprehensive Validation Result
 */
export interface PayloadValidationResult {
  isValid: boolean;
  errors: PayloadValidationIssue[];
  warnings: PayloadValidationIssue[];
  metrics: RemainingCapacityMetrics;
  evaluatedAt: number;
}

/**
 * Filter Criteria for Querying Payloads
 */
export interface PayloadFilter {
  category?: PayloadCategory | string;
  searchQuery?: string;
  maxMassRating?: number;
  maxPowerRequirement?: number;
  destination?: DestinationId;
  compatibilityTag?: string;
  onlyAvailable?: boolean;
  onlyUnlocked?: boolean;
}
