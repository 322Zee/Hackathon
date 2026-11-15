/**
 * INTERSTELLAR CONTINUUM - Mission Lifecycle, Instance & Objective Architecture
 * Strongly typed schemas for the centralized mission lifecycle state machine,
 * active mission instances, preparation task requirements, and objective tracking.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { FacilityId } from '../facilities/FacilityTypes';

/**
 * 11 Canonical Mission Lifecycle States
 */
export enum MissionLifecycleState {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_VALIDATION = 'READY_FOR_VALIDATION',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Historical Mission Event Types
 */
export enum MissionHistoryEventType {
  MISSION_ACCEPTED = 'MISSION_ACCEPTED',
  PREPARATION_STARTED = 'PREPARATION_STARTED',
  CONFIGURATION_UPDATED = 'CONFIGURATION_UPDATED',
  VALIDATION_REQUESTED = 'VALIDATION_REQUESTED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSION_READY = 'MISSION_READY',
  MISSION_ACTIVATED = 'MISSION_ACTIVATED',
  OBJECTIVE_UPDATED = 'OBJECTIVE_UPDATED',
  OBJECTIVE_COMPLETED = 'OBJECTIVE_COMPLETED',
  MISSION_PAUSED = 'MISSION_PAUSED',
  MISSION_RESUMED = 'MISSION_RESUMED',
  MISSION_COMPLETED = 'MISSION_COMPLETED',
  MISSION_FAILED = 'MISSION_FAILED',
  MISSION_CANCELLED = 'MISSION_CANCELLED',
  MISSION_RESTARTED = 'MISSION_RESTARTED',
}

/**
 * Recorded History Event Log
 */
export interface MissionHistoryEvent {
  id: string;
  timestamp: number;
  type: MissionHistoryEventType;
  summary: string;
  details?: Record<string, any>;
}

/**
 * Mission Preparation Task Categories
 */
export enum PreparationTaskType {
  LAUNCH_VEHICLE_CONFIGURATION = 'LAUNCH_VEHICLE_CONFIGURATION',
  SPACECRAFT_DESIGN = 'SPACECRAFT_DESIGN',
  PAYLOAD_INTEGRATION = 'PAYLOAD_INTEGRATION',
  ROBOTICS_CONFIGURATION = 'ROBOTICS_CONFIGURATION',
  COMMUNICATION_SETUP = 'COMMUNICATION_SETUP',
  INSTRUMENT_INTEGRATION = 'INSTRUMENT_INTEGRATION',
}

/**
 * Task Status in Mission Preparation
 */
export enum PreparationTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CONFIGURED = 'CONFIGURED',
  NOT_AVAILABLE_IN_BUILD = 'NOT_AVAILABLE_IN_BUILD',
}

/**
 * Individual Preparation Task Record
 */
export interface MissionPreparationTask {
  id: string;
  type: PreparationTaskType;
  title: string;
  description: string;
  facilityId: FacilityId;
  facilityName: string;
  required: boolean;
  status: PreparationTaskStatus;
  systemImplemented: boolean;
  configRef?: string;
  statusNotes?: string;
}

/**
 * Full Mission Preparation State
 */
export interface MissionPreparationState {
  tasks: MissionPreparationTask[];
  isAllMandatoryConfigured: boolean;
  validationErrors: string[];
  lastValidatedTimestamp?: number;
}

/**
 * 11 Canonical Objective Categories
 */
export enum ObjectiveCategory {
  DELIVER_PAYLOAD = 'DELIVER_PAYLOAD',
  REACH_DESTINATION = 'REACH_DESTINATION',
  DEPLOY_SPACECRAFT = 'DEPLOY_SPACECRAFT',
  ESTABLISH_COMMUNICATION = 'ESTABLISH_COMMUNICATION',
  COLLECT_SCIENTIFIC_DATA = 'COLLECT_SCIENTIFIC_DATA',
  MAP_AREA = 'MAP_AREA',
  ANALYSE_SAMPLE = 'ANALYSE_SAMPLE',
  DEPLOY_ROVER = 'DEPLOY_ROVER',
  COMPLETE_RESEARCH = 'COMPLETE_RESEARCH',
  CONSTRUCT_FACILITY = 'CONSTRUCT_FACILITY',
  MAINTAIN_OPERATIONS = 'MAINTAIN_OPERATIONS',
}

/**
 * Tracked Mission Objective State
 */
export interface TrackedObjectiveState {
  id: string;
  missionInstanceId: string;
  title: string;
  description: string;
  category: ObjectiveCategory;
  isMandatory: boolean;
  isCompleted: boolean;
  currentProgress: number;
  targetValue?: number | string;
  conditionDescription: string;
  completedTimestamp?: number;
  rewardReference?: string;
}

/**
 * Dedicated Mission Instance Model
 * Lightweight runtime representation referencing the canonical MissionDefinition
 */
export interface MissionInstance {
  instanceId: string;
  missionId: string;
  destinationId: DestinationId;
  status: MissionLifecycleState;
  acceptedTimestamp: number;
  currentObjectiveId?: string;
  objectives: TrackedObjectiveState[];
  preparation: MissionPreparationState;
  spacecraftConfigRef?: string;
  rocketConfigRef?: string;
  payloadConfigRef?: string;
  committedResources: {
    credits: number;
    researchData: number;
  };
  history: MissionHistoryEvent[];
  checkpointRef?: string;
  completionInfo?: {
    timestamp: number;
    durationDays: number;
    rewardsGranted: boolean;
    finalPrestigeYield: number;
  };
  failureInfo?: {
    timestamp: number;
    reason: string;
    retryCount: number;
    checkpointRef?: string;
  };
}

/**
 * Transition Result Telemetry
 */
export interface MissionTransitionResult {
  success: boolean;
  instanceId: string;
  fromState: MissionLifecycleState;
  toState: MissionLifecycleState;
  reason?: string;
  errors?: string[];
}

/**
 * Persistence Serialization DTOs
 */
export interface MissionInstanceSaveData {
  instanceId: string;
  missionId: string;
  destinationId: DestinationId;
  status: MissionLifecycleState;
  acceptedTimestamp: number;
  currentObjectiveId?: string;
  objectives: TrackedObjectiveState[];
  preparation: MissionPreparationState;
  spacecraftConfigRef?: string;
  rocketConfigRef?: string;
  payloadConfigRef?: string;
  committedResources: {
    credits: number;
    researchData: number;
  };
  history: MissionHistoryEvent[];
  checkpointRef?: string;
  completionInfo?: {
    timestamp: number;
    durationDays: number;
    rewardsGranted: boolean;
    finalPrestigeYield: number;
  };
  failureInfo?: {
    timestamp: number;
    reason: string;
    retryCount: number;
    checkpointRef?: string;
  };
}

export interface MissionManagementSaveData {
  instances: Record<string, MissionInstanceSaveData>;
  activeInstanceIds: string[];
  archivedInstanceIds: string[];
}
