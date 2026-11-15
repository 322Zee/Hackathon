/**
 * INTERSTELLAR CONTINUUM - Launch Complex Operations & Mission Deployment Types
 * Authoritative data models for deployment records, controlled state machine states,
 * payload integration specifications, readiness requirement checkpoints, and lifecycle events.
 *
 * NOTE: All launch operations use abstract gameplay parameters and fictional agency mechanisms.
 * Real-world launch checklists, operational procedures, and practical rocket staging are strictly excluded.
 */

import { PayloadType, SpacecraftType } from '../missions/MissionTypes';

/**
 * 11 Controlled States of the Deployment State Machine
 */
export enum DeploymentState {
  NOT_ASSIGNED = 'NOT_ASSIGNED',
  AWAITING_ROCKET = 'AWAITING_ROCKET',
  AWAITING_PAYLOAD = 'AWAITING_PAYLOAD',
  AWAITING_VALIDATION = 'AWAITING_VALIDATION',
  AWAITING_FINAL_READINESS = 'AWAITING_FINAL_READINESS',
  ELIGIBLE_FOR_DEPLOYMENT = 'ELIGIBLE_FOR_DEPLOYMENT',
  DEPLOYMENT_SCHEDULED = 'DEPLOYMENT_SCHEDULED',
  DEPLOYMENT_INITIATED = 'DEPLOYMENT_INITIATED',
  DEPLOYED = 'DEPLOYED',
  CANCELLED = 'CANCELLED',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
}

/**
 * Categorical Classification of Game Payloads
 */
export enum PayloadCategory {
  SATELLITE = 'SATELLITE',
  COMMUNICATION_SATELLITE = 'COMMUNICATION_SATELLITE',
  OBSERVATION_SATELLITE = 'OBSERVATION_SATELLITE',
  SCIENTIFIC_PROBE = 'SCIENTIFIC_PROBE',
  LANDER = 'LANDER',
  ROVER_CARGO = 'ROVER_CARGO',
  RESEARCH_MODULE = 'RESEARCH_MODULE',
  SURFACE_DEPLOYMENT_MODULE = 'SURFACE_DEPLOYMENT_MODULE',
}

/**
 * Payload Integration Status
 */
export enum PayloadIntegrationStatus {
  MOUNTED_IN_VEHICLE = 'MOUNTED_IN_VEHICLE',
  INTEGRATED = 'INTEGRATED',
  PENDING_INTEGRATION = 'PENDING_INTEGRATION',
  UNAVAILABLE = 'UNAVAILABLE',
}

/**
 * Reference & State of an Assigned Payload
 */
export interface PayloadAssignment {
  payloadId: string;
  name: string;
  category: PayloadCategory;
  payloadType: PayloadType;
  massKg: number;
  componentId?: string;
  isMountedInRocket: boolean;
  systemImplemented: boolean;
  status: PayloadIntegrationStatus;
  statusNotes: string;
  referenceSpacecraftType?: SpacecraftType;
}

/**
 * Deterministic Deployment Requirement Verification Checkpoint
 */
export interface DeploymentRequirementCheck {
  id: string;
  name: string;
  satisfied: boolean;
  blocking: boolean;
  category: 'MISSION' | 'ROCKET' | 'VALIDATION' | 'TESTING' | 'PAYLOAD' | 'ECONOMY' | 'CONFLICT';
  details: string;
}

/**
 * Historical Deployment Event Record
 */
export interface DeploymentEvent {
  id: string;
  timestamp: number;
  eventType: string;
  description: string;
  actor: string;
  data?: Record<string, any>;
}

/**
 * Centralized Authoritative Mission Deployment Record
 */
export interface DeploymentRecord {
  /** Unique deployment identifier (dep_...) */
  deploymentId: string;

  /** Active mission instance ID */
  missionInstanceId: string;

  /** Canonical mission catalogue ID */
  missionId: string;

  /** Assigned rocket project ID */
  projectId: string;

  /** Rocket design version snapshot (e.g. v1.0.0) */
  designVersion: string;

  /** Configuration hash representing vehicle state at assignment time */
  configurationHash: string;

  /** Assigned payload reference */
  payload: PayloadAssignment;

  /** Launch location facility ID (e.g. FAC_LAUNCH_COMPLEX_PAD_ALPHA) */
  launchLocation: string;

  /** Launchpad designator code (e.g. PAD-01) */
  padCode: string;

  /** Controlled state machine status */
  status: DeploymentState;

  /** Validation report ID reference */
  readinessReportId?: string;

  /** Complete chronological audit log of deployment events */
  events: DeploymentEvent[];

  /** Flight session execution reference (assigned when launched) */
  executionRef?: string;

  /** Creation timestamp (ms) */
  createdAt: number;

  /** Last updated timestamp (ms) */
  updatedAt: number;

  /** Scheduled launch time (if scheduled) */
  scheduledLaunchTime?: number;

  /** Remaining countdown seconds */
  countdownRemainingSeconds?: number;

  /** Evaluated checklist of all requirements */
  requirements: DeploymentRequirementCheck[];

  /** Overall eligibility flag */
  isEligible: boolean;
}

/**
 * Options for creating a new deployment
 */
export interface CreateDeploymentOptions {
  missionInstanceId: string;
  missionId: string;
  projectId?: string;
  launchLocation?: string;
  padCode?: string;
}

/**
 * Launch Complex Pad Overview Summary
 */
export interface LaunchPadStatusSummary {
  padId: string;
  padCode: string;
  padName: string;
  isOccupied: boolean;
  activeDeploymentId?: string;
  rocketName?: string;
  rocketVersion?: string;
  missionName?: string;
  status: DeploymentState;
  isEligibleForLaunch: boolean;
}
