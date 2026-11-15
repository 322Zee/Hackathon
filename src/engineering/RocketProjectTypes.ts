/**
 * INTERSTELLAR CONTINUUM - Rocket Project & Engineering Architecture
 * Fictional educational game models for rocket projects, stage configurations,
 * component categories, validation metrics, and engineering activity history.
 */

import { MissionCategory } from '../missions/MissionTypes';
import { ComprehensiveRocketValidationReport } from './validation/RocketValidationTypes';

/**
 * Rocket Project Lifecycle States
 */
export enum RocketProjectStatus {
  DRAFT = 'DRAFT',
  UNDER_DEVELOPMENT = 'UNDER_DEVELOPMENT',
  AWAITING_VALIDATION = 'AWAITING_VALIDATION',
  VALIDATED = 'VALIDATED',
  ASSIGNED_TO_MISSION = 'ASSIGNED_TO_MISSION',
  ARCHIVED = 'ARCHIVED',
}

/**
 * 8 Primary Workspace Sections in Rocket Engineering Facility
 */
export enum RocketWorkspaceSection {
  OVERVIEW = 'OVERVIEW',
  BUILDER = 'BUILDER',
  COMPONENTS = 'COMPONENTS',
  SAVED_DESIGNS = 'SAVED_DESIGNS',
  MISSION_COMPATIBILITY = 'MISSION_COMPATIBILITY',
  VALIDATION = 'VALIDATION',
  SIMULATION = 'SIMULATION',
  RECORDS = 'RECORDS',
}

/**
 * Rocket Vehicle Class Ratings (Game Balance Categories)
 */
export enum RocketClassRating {
  SUBORBITAL_TEST = 'SUBORBITAL_TEST',
  LIGHT_ORBITAL = 'LIGHT_ORBITAL',
  MEDIUM_FREIGHTER = 'MEDIUM_FREIGHTER',
  HEAVY_INTERPLANETARY = 'HEAVY_INTERPLANETARY',
  SUPER_HEAVY_CARRIER = 'SUPER_HEAVY_CARRIER',
}

/**
 * Single Propulsion Stage Configuration
 */
export interface RocketStageConfiguration {
  stageNumber: number;
  name: string;
  engineName: string;
  engineCount: number;
  thrustSeaLevelKn: number;
  thrustVacuumKn: number;
  specificImpulseSec: number; // Abstract game balance efficiency metric
  dryMassKg: number;
  propellantMassKg: number;
  burnDurationSec: number;
  separationType: string;
}

/**
 * Full Rocket Design Specification
 */
export interface RocketDesign {
  designId: string;
  name: string;
  classRating: RocketClassRating;
  stages: RocketStageConfiguration[];
  totalWetMassKg: number;
  totalDryMassKg: number;
  seaLevelThrustKn: number;
  vacuumThrustKn: number;
  initialTwr: number;
  totalVacuumDeltaV: number; // Calculated via fictional Tsiolkovsky relation
  maxPayloadCapacityLeoKg: number;
  fairingDiameterM: number;
  buildCostCredits: number;
}

/**
 * Individual Validation Inspection Check Item
 */
export interface RocketValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  metricValue: string | number;
  thresholdValue: string | number;
  detail: string;
}

/**
 * Comprehensive Validation Report
 */
export interface RocketValidationReport {
  isValid: boolean;
  checks: RocketValidationCheck[];
  validatedAt?: number;
  summaryText: string;
}

/**
 * Engineering Event Types for Records Log
 */
export enum RocketEngineeringEventType {
  PROJECT_CREATED = 'PROJECT_CREATED',
  DESIGN_UPDATED = 'DESIGN_UPDATED',
  STAGE_MODIFIED = 'STAGE_MODIFIED',
  VALIDATION_REQUESTED = 'VALIDATION_REQUESTED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ASSIGNED_TO_MISSION = 'ASSIGNED_TO_MISSION',
  UNASSIGNED_FROM_MISSION = 'UNASSIGNED_FROM_MISSION',
  DESIGN_VERSION_BUMPED = 'DESIGN_VERSION_BUMPED',
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  TEST_FIRE_SIMULATED = 'TEST_FIRE_SIMULATED',
}

/**
 * Single Recorded Activity Event
 */
export interface RocketEngineeringEvent {
  id: string;
  projectId: string;
  timestamp: number;
  type: RocketEngineeringEventType;
  summary: string;
  details?: Record<string, any>;
}

/**
 * Authoritative Rocket Project Model
 */
export interface RocketProject {
  projectId: string;
  name: string;
  shortCode: string;
  description: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  status: RocketProjectStatus;
  designVersion: string;
  assignedMissionId?: string;
  assignedInstanceId?: string;
  design: RocketDesign;
  validation: RocketValidationReport;
  comprehensiveValidation?: ComprehensiveRocketValidationReport;
  history: RocketEngineeringEvent[];
}

/**
 * Component Family Classifications for the Engineering Catalogue
 */
export enum RocketComponentFamily {
  PROPELLANT_TANKS = 'PROPELLANT_TANKS',
  BOOSTER_ENGINES = 'BOOSTER_ENGINES',
  UPPER_STAGE_ENGINES = 'UPPER_STAGE_ENGINES',
  SOLID_ROCKET_MOTORS = 'SOLID_ROCKET_MOTORS',
  AERODYNAMICS_FAIRINGS = 'AERODYNAMICS_FAIRINGS',
  STAGING_AVIONICS = 'STAGING_AVIONICS',
}

/**
 * Abstract Fictional Component Item in Catalogue
 */
export interface RocketComponentItem {
  id: string;
  name: string;
  family: RocketComponentFamily;
  tier: number;
  massKg: number;
  costCredits: number;
  description: string;
  keySpecs: {
    label: string;
    value: string | number;
  }[];
  unlockedByDefault: boolean;
}

/**
 * Mission Compatibility Analysis Telemetry
 */
export interface RocketCompatibilityAnalysis {
  isCompatible: boolean;
  missionId: string;
  missionName: string;
  missionCategory: MissionCategory;
  requiredPayloadMassKg: { min: number; max: number };
  rocketPayloadCapacityKg: number;
  payloadCapacityOk: boolean;
  requiredDeltaVEstimate: number;
  rocketTotalDeltaV: number;
  deltaVOk: boolean;
  initialTwr: number;
  twrOk: boolean;
  fairingClearanceOk: boolean;
  overallRating: 'OPTIMAL' | 'ACCEPTABLE' | 'DEFICIENT' | 'INCOMPATIBLE';
  recommendations: string[];
}

/**
 * Persistence Serialization Schema
 */
export interface RocketEngineeringSaveData {
  projects: Record<string, RocketProject>;
  activeProjectId?: string;
  recentActivity: RocketEngineeringEvent[];
}
