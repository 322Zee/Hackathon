/**
 * INTERSTELLAR CONTINUUM - Transportation Mission Domain Models & Contracts
 * Data-driven contracts for cargo and payload delivery missions, multi-payload logistics,
 * delivery destination criteria, follow-up exploration objectives, and reward schemas.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { MissionDifficulty } from '../missions/MissionTypes';

/**
 * Stages of a Transportation Mission Lifecycle
 */
export enum TransportationMissionStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  ACCEPTED = 'ACCEPTED',
  PAYLOAD_ASSIGNED = 'PAYLOAD_ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERY_ACHIEVED = 'DELIVERY_ACHIEVED',
  EXPLORATION_PHASE = 'EXPLORATION_PHASE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Fictional Destination Delivery Criteria
 */
export interface DeliveryConditionSpecification {
  destinationId: DestinationId;
  targetOrbit?: {
    altitudeKmMin: number;
    altitudeKmMax: number;
    inclinationDeg?: number;
    eccentricityMax?: number;
  };
  surfaceLanding?: {
    latitude: number;
    longitude: number;
    maxLandingVelocityRating: number;
    hazardClearanceMeters?: number;
  };
  environmentalProtectionRequired?: string[];
  maxTransitDurationDays?: number;
}

/**
 * Single Payload Delivery Requirement (Supports Multiple in Single Mission)
 */
export interface TransportationPayloadRequirement {
  payloadId: string;
  requiredQuantity: number;
  deliveredQuantity: number;
  conditionDescription?: string;
  specificConditions?: Partial<DeliveryConditionSpecification>;
}

/**
 * Follow-up Exploration Objectives for Combined Transportation Missions
 * Activated once primary delivery criteria are confirmed.
 */
export interface FollowUpExplorationObjective {
  id: string;
  title: string;
  description: string;
  explorationType:
    | 'ROVER_TRAVERSAL'
    | 'SURFACE_SAMPLING'
    | 'ATMOSPHERIC_SOUNDING'
    | 'STATION_EXPERIMENT_RUN'
    | 'TELEMETRY_CALIBRATION';
  targetValue: number | string;
  currentValue: number | string;
  isCompleted: boolean;
  activeOnlyAfterDelivery: boolean;
}

/**
 * Secondary / Bonus Mission Objectives
 */
export interface TransportationSecondaryObjective {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  bonusCredits?: number;
  bonusPrestige?: number;
}

/**
 * Educational & Backstory Briefing Content
 */
export interface TransportationBriefing {
  summary: string;
  description: string;
  scientificPurpose: string;
  educationalConcept: string;
  realWorldParallel: string;
}

/**
 * Authoritative Transportation Mission Definition
 */
export interface TransportationMissionDefinition {
  id: string;
  name: string;
  shortCode: string;
  briefing: TransportationBriefing;
  destinationId: DestinationId;
  requiredPayloads: TransportationPayloadRequirement[]; // Multi-payload delivery!
  deliveryConditions: DeliveryConditionSpecification;
  missionCost: {
    allocatedCredits: number;
    launchCostCapCredits: number;
  };
  estimatedDurationDays: number;
  difficulty: MissionDifficulty;
  rewards: {
    credits: number;
    researchData: number;
    rawMaterials: number;
    technologyPoints: number;
    agencyPrestige: number;
  };
  unlockRequirements: {
    requiredDirectorRank: number;
    requiredMissionIds: string[];
    requiredTechNodeIds: string[];
    requiredDestinationUnlocked: boolean;
  };
  optionalSecondaryObjectives: TransportationSecondaryObjective[];
  explorationObjectives?: FollowUpExplorationObjective[]; // Follow-up exploration phase!
  completionCriteria: string[];
  isReplayable: boolean;
}

/**
 * Active Runtime Transportation Mission Instance
 */
export interface TransportationMissionInstance {
  instanceId: string;
  missionId: string;
  definition: TransportationMissionDefinition;
  status: TransportationMissionStatus;
  acceptedTimestamp: number;
  assignedVehicleId?: string;
  payloadProgress: Map<string, { required: number; delivered: number; isSatisfied: boolean }>;
  explorationProgress: Map<string, FollowUpExplorationObjective>;
  allDeliveriesComplete: boolean;
  allExplorationsComplete: boolean;
  completedTimestamp?: number;
  failureReason?: string;
}
