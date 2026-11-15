/**
 * INTERSTELLAR CONTINUUM - Authoritative Rocket Component Architecture
 * Strongly typed centralized data models for fictional educational rocket components,
 * categories, availability states, compatibility tags, and comparative analysis.
 * NOTE: All values are fictional educational game-balance ratings, NOT real-world specifications.
 */

import { SpacecraftType, PayloadType } from '../missions/MissionTypes';

/**
 * 8 Canonical Rocket Component Categories
 */
export enum RocketComponentCategory {
  STRUCTURE_AND_STAGING = 'STRUCTURE_AND_STAGING',
  PROPULSION_SYSTEMS = 'PROPULSION_SYSTEMS',
  FUEL_AND_PROPELLANT_SYSTEMS = 'FUEL_AND_PROPELLANT_SYSTEMS',
  GUIDANCE_AND_NAVIGATION = 'GUIDANCE_AND_NAVIGATION',
  ELECTRICAL_POWER = 'ELECTRICAL_POWER',
  PAYLOAD_AND_FAIRING = 'PAYLOAD_AND_FAIRING',
  COMMUNICATION_AND_TELEMETRY = 'COMMUNICATION_AND_TELEMETRY',
  RECOVERY_AND_SAFETY_SYSTEMS = 'RECOVERY_AND_SAFETY_SYSTEMS',
}

/**
 * Component Rarity / Technology Classification
 */
export enum ComponentRarity {
  STANDARD = 'STANDARD',
  REFINED = 'REFINED',
  SPECIALIZED = 'SPECIALIZED',
  EXPERIMENTAL = 'EXPERIMENTAL',
}

/**
 * Dynamic Component Availability States
 */
export enum ComponentAvailabilityState {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  RESEARCH_REQUIRED = 'RESEARCH_REQUIRED',
  MANUFACTURING_REQUIRED = 'MANUFACTURING_REQUIRED',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  UNAVAILABLE_FOR_CURRENT_MISSION = 'UNAVAILABLE_FOR_CURRENT_MISSION',
}

/**
 * Authoritative Data-Driven Compatibility Tags
 */
export enum ComponentCompatibilityTag {
  BASIC_VEHICLE = 'BASIC_VEHICLE',
  ADVANCED_VEHICLE = 'ADVANCED_VEHICLE',
  HEAVY_VEHICLE = 'HEAVY_VEHICLE',
  UPPER_SECTION = 'UPPER_SECTION',
  LOWER_BOOSTER = 'LOWER_BOOSTER',
  INTERSTAGE = 'INTERSTAGE',
  PAYLOAD_COMPATIBLE = 'PAYLOAD_COMPATIBLE',
  SATELLITE_DELIVERY = 'SATELLITE_DELIVERY',
  PROBE_DELIVERY = 'PROBE_DELIVERY',
  CARGO_DELIVERY = 'CARGO_DELIVERY',
  ROBOTIC_DELIVERY = 'ROBOTIC_DELIVERY',
  ROVER_DELIVERY = 'ROVER_DELIVERY',
  COMMUNICATION_MISSION = 'COMMUNICATION_MISSION',
  RESEARCH_MISSION = 'RESEARCH_MISSION',
  ATMOSPHERIC_FLIGHT = 'ATMOSPHERIC_FLIGHT',
  SUBORBITAL_FLIGHT = 'SUBORBITAL_FLIGHT',
  ORBITAL_INSERTION = 'ORBITAL_INSERTION',
  DEEP_SPACE_TRANSFER = 'DEEP_SPACE_TRANSFER',
  RECOVERABLE_STAGE = 'RECOVERABLE_STAGE',
}

/**
 * Component Unlock and Technology Requirements
 */
export interface ComponentUnlockRequirements {
  techTier: number;
  techNodeId?: string;
  requiredMissionId?: string;
  agencyMilestone?: string;
  requiresResearch: boolean;
  requiresManufacturing: boolean;
}

/**
 * Abstract Game-Only Balancing Attribute Ratings
 * Values are strictly game-design balancing units, NOT physical measurements.
 */
export interface ComponentPerformanceStats {
  performanceRating?: number;       // Abstract thrust / delivery capability (e.g. 50–600)
  efficiencyRating?: number;        // Abstract resource utilization ratio (e.g. 1.0–4.0)
  reliabilityRating: number;        // Reliability percentage (e.g. 85–99%)
  powerGenerationWatts?: number;    // Power output rating
  powerDemandWatts?: number;        // Power consumption rating
  capacityRating?: number;          // Fuel / resource / data capacity rating
  structuralRating?: number;        // Axial structural load tolerance rating
  navigationRating?: number;        // Flight path accuracy rating (1–10)
  communicationRating?: number;     // Telemetry range / bandwidth rating (1–10)
  protectionRating?: number;        // Thermal / acoustic shield rating (10–50)
  monitoringRating?: number;        // System sensor diagnostic fidelity (1–5)
  resourceDemandRating?: number;    // Abstract consumption rate
}

/**
 * Authoritative Rocket Component Data Definition
 */
export interface RocketComponentDefinition {
  id: string;
  name: string;
  category: RocketComponentCategory;
  componentType: string;
  description: string;
  educationalExplanation: string;
  iconKey: string;
  tier: number;
  rarity: ComponentRarity;
  costCredits: number;
  massUnits: number;                 // Abstract game mass rating (Mass Units)
  compatibilityTags: ComponentCompatibilityTag[];
  stats: ComponentPerformanceStats;
  unlockRequirements: ComponentUnlockRequirements;
  upgradeLevel: number;
  maxUpgradeLevel: number;
  manufacturingAvailable: boolean;
  referenceSpacecraftType?: SpacecraftType;
  referencePayloadType?: PayloadType;
  config?: Record<string, any>;
}

/**
 * Attribute Difference for Comparative Evaluation
 */
export interface AttributeDiff {
  label: string;
  valueA: number | string;
  valueB: number | string;
  diff: number | string;
  advantage: 'A' | 'B' | 'EQUAL' | 'TRADE_OFF';
  explanation: string;
}

/**
 * Side-by-Side Component Comparison Result
 */
export interface ComponentComparisonResult {
  componentA: RocketComponentDefinition;
  componentB: RocketComponentDefinition;
  isSameCategory: boolean;
  attributeDiffs: AttributeDiff[];
  sharedCompatibilityTags: ComponentCompatibilityTag[];
  uniqueTagsA: ComponentCompatibilityTag[];
  uniqueTagsB: ComponentCompatibilityTag[];
  costDifference: number;
  massDifference: number;
  educationalSynthesis: string;
}

/**
 * Component Inventory Tracking Item
 */
export interface ComponentInventoryItem {
  componentId: string;
  ownedQuantity: number;
  installedQuantity: number;
  reservedQuantity: number;
  installedInProjects: string[];     // Array of project IDs using this component
}

/**
 * Transaction Result for Economy Integration
 */
export interface ComponentPurchaseResult {
  success: boolean;
  componentId: string;
  creditsSpent: number;
  remainingCredits: number;
  newOwnedQuantity: number;
  errorMessage?: string;
}

/**
 * Availability Context for Dynamic Status Evaluation
 */
export interface AvailabilityEvaluationContext {
  playerCredits?: number;
  unlockedTechIds?: Set<string>;
  unlockedTiers?: Set<number>;
  completedMissionIds?: Set<string>;
  currentMissionCategory?: string;
  currentMissionRequiredPayloadMass?: number;
}
