/**
 * INTERSTELLAR CONTINUUM - Comprehensive Rocket Validation Architecture & Types
 * Authoritative data models for the 7-category validation engine, severity ratings,
 * structured validation reports, educational trade-off analyses, and validation history.
 *
 * NOTE: All validation uses fictional game-balance units and simplified rules.
 * Does NOT implement real-world physics, hazardous chemistry, or construction equations.
 */

import { ModularRocketConfiguration } from '../builder/RocketBuilderTypes';
import { MissionDefinition } from '../../missions/MissionTypes';

/**
 * The 7 Canonical Validation Categories
 */
export enum ValidationCategory {
  CONFIGURATION_COMPLETENESS = 'CONFIGURATION_COMPLETENESS',
  COMPONENT_AVAILABILITY = 'COMPONENT_AVAILABILITY',
  COMPONENT_COMPATIBILITY = 'COMPONENT_COMPATIBILITY',
  STRUCTURAL_AND_RATINGS = 'STRUCTURAL_AND_RATINGS',
  MISSION_COMPATIBILITY = 'MISSION_COMPATIBILITY',
  ECONOMIC_VALIDATION = 'ECONOMIC_VALIDATION',
  TECHNOLOGY_VALIDATION = 'TECHNOLOGY_VALIDATION',
}

/**
 * Three-Tier Issue Severity
 */
export enum ValidationSeverity {
  ERROR = 'ERROR',             // Mandatory requirement failed. BLOCKS flight readiness.
  WARNING = 'WARNING',         // Identified trade-off or sub-optimal choice. DOES NOT block readiness.
  INFORMATION = 'INFORMATION', // Explanatory observation or operational note. DOES NOT block readiness.
}

/**
 * Deterministic Overall Validation Status
 */
export enum ValidationOverallStatus {
  NOT_VALIDATED = 'NOT_VALIDATED',
  VALIDATING = 'VALIDATING',
  FAILED = 'FAILED',                                 // 1 or more ERRORs exist
  PASSED_WITH_WARNINGS = 'PASSED_WITH_WARNINGS',     // 0 ERRORs, 1 or more WARNINGs
  PASSED = 'PASSED',                                 // 0 ERRORs, 0 WARNINGs
}

/**
 * Individual Validation Issue
 */
export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  explanation: string;
  affectedSlotId?: string;
  affectedComponentId?: string;
  stageNumber?: number;
  recommendedCorrection: string;
  blocksReadiness: boolean;
}

/**
 * Per-Category Validation Summary
 */
export interface CategoryValidationResult {
  category: ValidationCategory;
  status: 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED' | 'SKIPPED';
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
}

/**
 * Evaluated Abstract Structural and Configuration Ratings
 */
export interface StructuralAndConfigurationRatings {
  totalMassUnits: number;
  overallPerformanceRating: number;
  structuralRating: number;
  payloadCapacityRating: number;
  reliabilityRating: number;
  powerGenerationWatts: number;
  powerDemandWatts: number;
  netPowerWatts: number;
  communicationRating: number;
  protectionRating: number;
  componentCount: number;
  completenessPercent: number;
  estimatedCostCredits: number;
  isFlightReady: boolean;
}

/**
 * Mission Criteria Checkpoint Result
 */
export interface MissionCompatibilityCheckpoint {
  id: string;
  label: string;
  passed: boolean;
  requiredValue: string | number;
  currentValue: string | number;
  details: string;
}

/**
 * Comprehensive Mission Fit Evaluation
 */
export interface MissionCompatibilityReport {
  missionId: string;
  missionName: string;
  destinationId: string;
  payloadCategoryRequired: string;
  payloadCategoryInstalled?: string;
  minPayloadCapacity: number;
  currentPayloadCapacity: number;
  minPerformanceRating: number;
  currentPerformanceRating: number;
  minReliabilityRating: number;
  currentReliabilityRating: number;
  minCommunicationRating: number;
  currentCommunicationRating: number;
  requiredEquipmentSatisfied: boolean;
  allCriteriaSatisfied: boolean;
  checkpoints: MissionCompatibilityCheckpoint[];
}

/**
 * Educational Trade-Off Topic Areas
 */
export enum EducationalTradeOffTopic {
  MASS_AND_CAPABILITY = 'MASS_AND_CAPABILITY',
  PAYLOAD_AND_MISSION = 'PAYLOAD_AND_MISSION',
  POWER_AND_SYSTEMS = 'POWER_AND_SYSTEMS',
  COMMUNICATION_AND_DATA = 'COMMUNICATION_AND_DATA',
  COST_AND_PERFORMANCE = 'COST_AND_PERFORMANCE',
  RELIABILITY_AND_COMPLEXITY = 'RELIABILITY_AND_COMPLEXITY',
}

/**
 * Educational Engineering Trade-Off Insight
 */
export interface EducationalTradeOffInsight {
  topic: EducationalTradeOffTopic;
  title: string;
  observation: string;
  tradeOffAnalysis: string;
  recommendation: string;
}

/**
 * Historical Validation Record
 */
export interface RocketValidationHistoryRecord {
  historyId: string;
  projectId: string;
  configurationVersion: string;
  timestamp: number;
  status: ValidationOverallStatus;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  assignedMissionId?: string;
  summary: string;
  engineVersion: string;
}

/**
 * Authoritative Comprehensive Rocket Validation Report
 */
export interface ComprehensiveRocketValidationReport {
  reportId: string;
  projectId: string;
  configurationId: string;
  configurationVersion: string;
  configurationHash: string;
  validatedAt: number;
  status: ValidationOverallStatus;
  isValid: boolean;                   // true if status is PASSED or PASSED_WITH_WARNINGS
  isStale: boolean;                   // true if configuration has mutated since validation
  issues: ValidationIssue[];
  categorySummaries: Record<ValidationCategory, CategoryValidationResult>;
  ratings: StructuralAndConfigurationRatings;
  missionCompatibility?: MissionCompatibilityReport;
  educationalTradeOffs: EducationalTradeOffInsight[];
  engineVersion: string;
  summaryText: string;
}

/**
 * Validation Context passed into the Validation Engine
 */
export interface RocketValidationContext {
  projectId: string;
  configuration: ModularRocketConfiguration;
  mission?: MissionDefinition;
  organisationRank?: number;
  availableCredits?: number;
  unlockedTechIds?: string[];
  ownedComponentQuantities?: Map<string, number>;
  allocatedComponentQuantities?: Map<string, number>;
  activeProjectReservations?: Map<string, string>; // componentId -> projectId
}
