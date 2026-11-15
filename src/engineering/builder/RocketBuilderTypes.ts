/**
 * INTERSTELLAR CONTINUUM - Visual Rocket Builder Architecture & Configuration Types
 * Strongly typed models for modular rocket configurations, stage groups,
 * configuration slots, design stats, and mission requirement evaluation.
 * NOTE: All values are fictional game-balance units, NOT real-world specifications.
 */

import {
  RocketComponentCategory,
  ComponentCompatibilityTag,
} from '../RocketComponentTypes';
import { RocketClassRating } from '../RocketProjectTypes';

/**
 * Supported Configuration Slot Types across vehicle stages
 */
export enum ConfigurationSlotType {
  STRUCTURE = 'STRUCTURE',
  PROPULSION = 'PROPULSION',
  FUEL = 'FUEL',
  GUIDANCE = 'GUIDANCE',
  POWER = 'POWER',
  PAYLOAD = 'PAYLOAD',
  COMMUNICATION = 'COMMUNICATION',
  RECOVERY_SAFETY = 'RECOVERY_SAFETY',
}

/**
 * Individual Configuration Slot on a Stage
 */
export interface ModularConfigurationSlot {
  slotId: string;
  stageNumber: number;
  slotType: ConfigurationSlotType;
  label: string;
  installedComponentId?: string;
  allowedCategories: RocketComponentCategory[];
  allowedTags: ComponentCompatibilityTag[];
  required: boolean;
}

/**
 * Modular Vehicle Stage Group (e.g. Stage 1 Booster Core, Stage 2 Inserter)
 */
export interface ModularStageGroup {
  stageNumber: number;
  name: string;
  isUpperStage: boolean;
  slots: ModularConfigurationSlot[];
}

/**
 * Authoritative Modular Rocket Configuration Data Model
 */
export interface ModularRocketConfiguration {
  configurationId: string;
  projectId: string;
  name: string;
  version: string;
  classRating: RocketClassRating;
  stages: ModularStageGroup[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Real-Time Design Statistics (Game-Only Balancing Units)
 */
export interface RocketBuilderStats {
  totalMassUnits: number;             // Sum of installed component massUnits
  payloadCapacityRating: number;      // Calculated payload lifting capacity rating
  performanceRating: number;          // Total thrust / performance score
  reliabilityRating: number;          // Composite system reliability percentage (0–100%)
  powerGenerationWatts: number;       // Total power generated
  powerDemandWatts: number;           // Total power demanded
  netPowerWatts: number;              // Net power balance
  communicationRating: number;        // Telemetry rating
  navigationRating: number;           // Navigation accuracy rating
  structuralRating: number;           // Axial structural load tolerance rating
  protectionRating: number;           // Thermal and fairing protection score
  componentCount: number;             // Total number of installed components
  requiredSlotCount: number;          // Total required slots across all stages
  filledRequiredSlotCount: number;    // Number of required slots currently filled
  completenessPercent: number;        // Configuration completeness (0–100%)
  estimatedCostCredits: number;       // Total cost of all installed components
  warnings: string[];                 // Operational or staging warnings
  isFlightReady: boolean;             // True if all required slots filled and TWR/integrity ok
}

/**
 * Evaluation Status of Individual Mission Requirement
 */
export interface MissionRequirementStatus {
  id: string;
  label: string;
  requiredValue: string | number;
  currentValue: string | number;
  satisfied: boolean;
  explanation: string;
}

/**
 * Canvas Pan and Zoom Viewport State
 */
export interface CanvasViewportState {
  zoom: number;
  panX: number;
  panY: number;
}
