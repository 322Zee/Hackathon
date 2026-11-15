/**
 * INTERSTELLAR CONTINUUM - Rocket Testing Workbench & Pre-Launch Readiness Data Models
 * Authoritative contracts for design inspection, component status evaluation,
 * abstract performance & reliability assessments, test runs, persistent history,
 * and pre-launch deployment clearance.
 *
 * NOTE: All evaluations utilize abstract game-balance ratings.
 * Real-world physical test procedures, hazardous propellants, and launch checklists are strictly excluded.
 */

import { StructuralAndConfigurationRatings } from '../validation/RocketValidationTypes';

/**
 * Status of an individual component slot in Design Inspection
 */
export enum ComponentInspectionStatus {
  INSTALLED = 'INSTALLED',
  COMPATIBLE = 'COMPATIBLE',
  MISSING = 'MISSING',
  LOCKED = 'LOCKED',
  UNAVAILABLE = 'UNAVAILABLE',
  AWAITING_VALIDATION = 'AWAITING_VALIDATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

/**
 * Overall outcome of a test-bench simulation run
 */
export enum RocketTestStatus {
  PASSED = 'PASSED',
  PASSED_WITH_WARNINGS = 'PASSED_WITH_WARNINGS',
  FAILED = 'FAILED',
}

/**
 * Deterministic Pre-Launch Readiness States
 */
export enum PreLaunchReadinessStatus {
  NOT_PREPARED = 'NOT_PREPARED',
  PREPARATION_IN_PROGRESS = 'PREPARATION_IN_PROGRESS',
  AWAITING_ASSESSMENT = 'AWAITING_ASSESSMENT',
  ASSESSMENT_FAILED = 'ASSESSMENT_FAILED',
  READY_WITH_WARNINGS = 'READY_WITH_WARNINGS',
  READY_FOR_MISSION_DEPLOYMENT = 'READY_FOR_MISSION_DEPLOYMENT',
}

/**
 * Sub-Assessment Categories
 */
export enum AssessmentCategory {
  COMPATIBILITY = 'COMPATIBILITY',
  PERFORMANCE = 'PERFORMANCE',
  RELIABILITY = 'RELIABILITY',
  POWER_SYSTEMS = 'POWER_SYSTEMS',
  COMMUNICATION = 'COMMUNICATION',
  MISSION_SUITABILITY = 'MISSION_SUITABILITY',
}

/**
 * Individual Assessment Checkpoint
 */
export interface AssessmentCheckpoint {
  id: string;
  category: AssessmentCategory;
  label: string;
  currentRating: string | number;
  missionRequirement: string | number | 'N/A';
  outcome: 'PASS' | 'WARN' | 'FAIL' | 'NOT_APPLICABLE';
  isApplicable: boolean;
  explanation: string;
}

/**
 * Detailed Component Inspection Record
 */
export interface ComponentInspectionDetail {
  slotId: string;
  slotLabel: string;
  slotType: string;
  stageNumber: number;
  isRequired: boolean;
  componentId?: string;
  componentName: string;
  category?: string;
  status: ComponentInspectionStatus;
  massUnits: number;
  reliabilityRating: number;
  performanceRating?: number;
  powerGenerationWatts?: number;
  powerDemandWatts?: number;
  roleExplanation: string;
  compatibilityTags: string[];
  issueSummary?: string;
}

/**
 * Structured Test-Run Assessment Report
 */
export interface RocketTestRunReport {
  testId: string;
  projectId: string;
  projectName: string;
  designVersion: string;
  configurationHash: string;
  timestamp: number;
  status: RocketTestStatus;
  overallScore: number; // Abstract score 0-100
  isStale: boolean;
  assignedMissionId?: string;
  assignedMissionName?: string;
  checkpoints: AssessmentCheckpoint[];
  componentInspections: ComponentInspectionDetail[];
  ratingsSummary: StructuralAndConfigurationRatings;
  warnings: string[];
  failedChecks: string[];
  passedChecks: string[];
  recommendations: string[];
  summaryText: string;
  engineVersion: string;
}

/**
 * Pre-Launch Readiness Criterion (10 Canonical Factors)
 */
export interface PreLaunchReadinessCriterion {
  id: string;
  number: number; // 1 to 10
  label: string;
  satisfied: boolean;
  severity: 'BLOCKING' | 'ADVISORY' | 'INFO';
  currentValue: string;
  requiredValue: string;
  details: string;
}

/**
 * Pre-Launch Deployment Clearance Details
 */
export interface PreLaunchDeploymentClearance {
  launchComplexEligible: boolean;
  launchComplexId: string;
  facilityName: string;
  padDesignation: string;
  clearedMissionId?: string;
  clearedDesignVersion?: string;
  rolloutStatus: string;
}

/**
 * Authoritative Pre-Launch Readiness Evaluation Result
 */
export interface PreLaunchReadinessEvaluation {
  evaluationId: string;
  projectId: string;
  projectName: string;
  designVersion: string;
  status: PreLaunchReadinessStatus;
  isReadyForDeployment: boolean;
  assignedMissionId?: string;
  assignedMissionName?: string;
  criteria: PreLaunchReadinessCriterion[];
  blockingErrorsCount: number;
  warningsCount: number;
  evaluatedAt: number;
  isStale: boolean;
  deploymentClearance?: PreLaunchDeploymentClearance;
  message: string;
}

/**
 * Active Sub-Tab / View Mode inside the Testing Workbench
 */
export enum TestingWorkbenchSubTab {
  DESIGN_INSPECTION = 'DESIGN_INSPECTION',
  SYSTEM_COMPATIBILITY = 'SYSTEM_COMPATIBILITY',
  PERFORMANCE_ASSESSMENT = 'PERFORMANCE_ASSESSMENT',
  RELIABILITY_ASSESSMENT = 'RELIABILITY_ASSESSMENT',
  MISSION_SUITABILITY = 'MISSION_SUITABILITY',
  TEST_HISTORY = 'TEST_HISTORY',
  PRE_LAUNCH_READINESS = 'PRE_LAUNCH_READINESS',
}
