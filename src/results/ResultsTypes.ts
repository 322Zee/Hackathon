/**
 * INTERSTELLAR CONTINUUM - Mission Results, Scoring & Performance Evaluation Contracts
 * Definitive schemas for mission evaluation, category scoring breakdowns,
 * performance grading scales, reward calculations, organizational milestones,
 * and persistent mission history records.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { MissionCategory } from '../missions/MissionTypes';

/**
 * Final Operational Mission Completion Status
 */
export enum MissionCompletionStatus {
  COMPLETED = 'COMPLETED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Standard Performance Grade Classifications
 */
export enum PerformanceGrade {
  EXCEPTIONAL = 'EXCEPTIONAL',      // 90 - 100
  EXCELLENT = 'EXCELLENT',          // 80 - 89
  GOOD = 'GOOD',                    // 70 - 79
  SATISFACTORY = 'SATISFACTORY',    // 60 - 69
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT', // 40 - 59
  UNSUCCESSFUL = 'UNSUCCESSFUL',    // 0 - 39
}

/**
 * 5 Authoritative Scoring Categories
 */
export enum ScoringCategory {
  MISSION_OBJECTIVES = 'MISSION_OBJECTIVES',
  ENGINEERING_EFFICIENCY = 'ENGINEERING_EFFICIENCY',
  BUDGET_MANAGEMENT = 'BUDGET_MANAGEMENT',
  SCIENTIFIC_CONTRIBUTION = 'SCIENTIFIC_CONTRIBUTION',
  RELIABILITY = 'RELIABILITY',
}

/**
 * Data-Driven Scoring Weights Configuration
 */
export interface ScoringWeightsConfig {
  missionObjectives: number;       // default: 30
  engineeringEfficiency: number;   // default: 25
  budgetManagement: number;        // default: 20
  scientificContribution: number;  // default: 15
  reliability: number;             // default: 10
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeightsConfig = {
  missionObjectives: 30,
  engineeringEfficiency: 25,
  budgetManagement: 20,
  scientificContribution: 15,
  reliability: 10,
};

/**
 * Data-Driven Grade Range Configuration
 */
export interface GradeThreshold {
  grade: PerformanceGrade;
  letter: string;
  minScore: number;
  label: string;
  description: string;
  colorHex: number;
}

export const DEFAULT_GRADE_THRESHOLDS: GradeThreshold[] = [
  {
    grade: PerformanceGrade.EXCEPTIONAL,
    letter: 'S',
    minScore: 90,
    label: 'Exceptional',
    description: 'Flawless execution exceeding operational and scientific milestones.',
    colorHex: 0x00f0ff, // CYAN
  },
  {
    grade: PerformanceGrade.EXCELLENT,
    letter: 'A',
    minScore: 80,
    label: 'Excellent',
    description: 'High proficiency across objectives, engineering, and telemetry protocols.',
    colorHex: 0x4ade80, // GREEN
  },
  {
    grade: PerformanceGrade.GOOD,
    letter: 'B',
    minScore: 70,
    label: 'Good',
    description: 'Solid performance satisfying flight criteria with minor parameter variances.',
    colorHex: 0x38bdf8, // BLUE
  },
  {
    grade: PerformanceGrade.SATISFACTORY,
    letter: 'C',
    minScore: 60,
    label: 'Satisfactory',
    description: 'Primary criteria achieved; engineering or budget margins strained.',
    colorHex: 0xf59e0b, // AMBER
  },
  {
    grade: PerformanceGrade.NEEDS_IMPROVEMENT,
    letter: 'D',
    minScore: 40,
    label: 'Needs Improvement',
    description: 'Substantial telemetry anomalies or missed secondary objectives.',
    colorHex: 0xfb923c, // ORANGE
  },
  {
    grade: PerformanceGrade.UNSUCCESSFUL,
    letter: 'F',
    minScore: 0,
    label: 'Unsuccessful',
    description: 'Mission aborted or critical failure preventing primary objective fulfillment.',
    colorHex: 0xf87171, // RED
  },
];

/**
 * Transparent Itemized Score Item
 */
export interface ScoreBreakdownItem {
  name: string;
  pointsAwarded: number;
  maxPoints: number;
  reason: string;
  isDeduction: boolean;
}

/**
 * Detailed Category Score Result
 */
export interface CategoryScoreResult {
  category: ScoringCategory;
  categoryLabel: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
  items: ScoreBreakdownItem[];
  feedback: string[];
  metrics: Record<string, number | string | boolean>;
}

/**
 * Evaluated Mission Objective Record
 */
export interface EvaluatedObjective {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  isCompleted: boolean;
  isOptional: boolean;
  progressPercentage: number;
  targetValue?: number | string;
  actualValue?: number | string;
  pointsAwarded: number;
  maxPoints: number;
  feedback: string;
}

/**
 * Itemized Reward Summary
 */
export interface MissionRewardSummary {
  credits: number;
  researchData: number;
  rawMaterials: number;
  technologyPoints: number;
  agencyPrestige: number;
  unlockedMissionIds: string[];
  unlockedEquipment: string[];
  rankProgressPoints: number;
  isClaimed: boolean;
  claimedTimestamp?: number;
}

/**
 * Itemized Penalty Summary
 */
export interface MissionPenaltySummary {
  budgetOverrunCredits: number;
  structuralDamageCredits: number;
  reputationLoss: number;
  penaltyReasons: string[];
}

/**
 * Comprehensive Performance Feedback
 */
export interface PerformanceAnalysisFeedback {
  strengths: string[];
  areasForImprovement: string[];
  engineeringFeedback: string;
  budgetFeedback: string;
  scientificFeedback: string;
  reliabilityFeedback: string;
  executiveSummary: string;
}

/**
 * Complete Mission Result Record (Serializable & Permanent)
 */
export interface MissionResultRecord {
  id: string;                                // Unique Results Record ID (e.g., 'RES_ARES_01_1710500000')
  missionId: string;                        // Canonical Mission Definition ID
  missionName: string;                      // Display Title
  shortCode?: string;                       // Short Mission Code (e.g., '[ARES-01]')
  missionType: MissionCategory | string;    // Mission Category
  destination: DestinationId | string;      // Destination Celestial Body
  completionStatus: MissionCompletionStatus;// Final Status
  completionTimestamp: number;              // Timestamp (epoch ms)
  missionDurationFormatted: string;         // e.g. "12d 06h 45m"
  missionDurationSeconds: number;           // Exact duration in seconds
  missionDurationDays: number;              // Duration in days
  objectivesCompleted: EvaluatedObjective[];
  objectivesMissed: EvaluatedObjective[];
  finalPerformanceScore: number;            // 0 - 100
  performanceGrade: PerformanceGrade;       // Grade enum
  gradeLetter: string;                      // 'S', 'A', 'B', etc.
  gradeLabel: string;                       // 'Exceptional', 'Good', etc.
  rewardSummary: MissionRewardSummary;      // Confirmed reward breakdown
  penaltySummary: MissionPenaltySummary;    // Applied penalties
  scientificContribution: CategoryScoreResult;
  engineeringEfficiency: CategoryScoreResult;
  budgetPerformance: CategoryScoreResult;
  reliabilityRating: CategoryScoreResult;
  missionObjectivesScore: CategoryScoreResult;
  performanceFeedback: PerformanceAnalysisFeedback;
  categoryBreakdown: CategoryScoreResult[];
  notes?: string;
  isArchived: boolean;
  isClaimed: boolean;
  recoveredFromFailure?: boolean;
}

/**
 * Input Data Model for Mission Evaluation
 */
export interface MissionEvaluationInput {
  missionId: string;
  missionName: string;
  shortCode?: string;
  category: MissionCategory | string;
  destinationId: DestinationId | string;
  status?: MissionCompletionStatus;
  isCancelled?: boolean;
  cancellationReason?: string;
  isFailed?: boolean;
  failureReason?: string;
  recoveredFromFailure?: boolean;
  startTimeTimestamp?: number;
  endTimeTimestamp?: number;
  actualDurationSeconds?: number;
  estimatedDurationDays?: number;

  // Objectives
  objectives: Array<{
    id: string;
    title: string;
    description?: string;
    isMandatory?: boolean;
    isCompleted: boolean;
    currentProgress?: number; // 0 - 100
    targetValue?: number | string;
    actualValue?: number | string;
  }>;

  // Engineering Telemetry
  engineering?: {
    structuralIntegrityFinal?: number; // 0 - 100%
    deltaVUsedMps?: number;
    deltaVPlannedMps?: number;
    fuelRemainingPercentage?: number;  // 0 - 100%
    powerMarginPercentage?: number;    // 0 - 100%
    massEfficiencyRatio?: number;      // payload mass / total wet mass (0 - 1)
    thermalStabilityPercentage?: number;
  };

  // Budget Telemetry
  budget?: {
    allocatedCredits: number;
    actualCostCredits: number;
    launchCostCredits?: number;
  };

  // Science Telemetry
  science?: {
    targetDataPoints?: number;
    collectedDataPoints?: number;
    discoveriesLogged?: number;
    instrumentsOperational?: number;
    totalInstruments?: number;
    downlinkFidelityMultiplier?: number;
  };

  // Reliability Telemetry
  reliability?: {
    anomaliesEncountered?: number;
    anomaliesResolved?: number;
    commUptimePercentage?: number;     // 0 - 100%
    subsystemHealthAverage?: number;   // 0 - 100%
    emergencyProtocolsTriggered?: number;
  };

  // Pre-configured Base Rewards from Mission Catalog
  baseRewards?: {
    credits?: number;
    researchData?: number;
    rawMaterials?: number;
    technologyPoints?: number;
    agencyPrestige?: number;
    unlockedMissionIds?: string[];
    unlockedEquipment?: string[];
  };
}

/**
 * Organizational Milestone Definition
 */
export interface OrganisationalMilestone {
  id: string;
  title: string;
  description: string;
  category: 'EXPLORATION' | 'ENGINEERING' | 'SCIENCE' | 'ORGANISATION';
  unlocked: boolean;
  unlockedTimestamp?: number;
  achievedInMissionId?: string;
  prestigeReward: number;
  directorRankRequirement: number;
  badgeIconKey?: string;
}

/**
 * Query & Filter Parameters for Mission History
 */
export interface MissionHistoryFilter {
  destination?: DestinationId | string;
  missionType?: MissionCategory | string;
  performanceGrade?: PerformanceGrade;
  completionStatus?: MissionCompletionStatus;
  searchQuery?: string;
  startDate?: number;
  endDate?: number;
  minScore?: number;
}

/**
 * Comparative Performance Analysis Between Two Missions
 */
export interface PerformanceComparison {
  missionA: MissionResultRecord;
  missionB: MissionResultRecord;
  scoreDifference: number; // A - B
  gradeComparison: {
    gradeA: PerformanceGrade;
    gradeB: PerformanceGrade;
    isHigher: 'A' | 'B' | 'EQUAL';
  };
  categoryDeltas: Record<ScoringCategory, {
    scoreA: number;
    scoreB: number;
    delta: number;
  }>;
  durationDifferenceDays: number;
  budgetDifferenceCredits: number;
  scienceDifferencePoints: number;
  summary: string;
}

/**
 * Serialized Storage Schema for Mission Results & Archive
 */
export interface MissionResultsSaveData {
  schemaVersion: number;
  timestamp: number;
  results: Record<string, MissionResultRecord>;
  claimedResultIds: string[];
  unlockedMilestones: string[];
}
