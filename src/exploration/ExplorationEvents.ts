/**
 * INTERSTELLAR CONTINUUM - Exploration Domain Events
 * Strongly typed domain events for robotic rovers and planetary surface exploration.
 */

import {
  RoverRecord,
  RoverOperationalStatus,
  RoverLocation,
  RoverCommStatus,
  Vector2D,
  PointOfInterest,
  ExplorationObjective,
  CollectedSample,
  RoverMaintenanceAction,
} from './ExplorationTypes';

export interface RoverRegisteredPayload {
  rover: RoverRecord;
  timestamp: number;
}

export interface RoverDeployedPayload {
  roverId: string;
  name: string;
  destinationId: string;
  missionId?: string;
  location: Vector2D;
  timestamp: number;
}

export interface RoverMovementStartedPayload {
  roverId: string;
  headingDeg: number;
  speed: number;
  timestamp: number;
}

export interface RoverPositionUpdatedPayload {
  roverId: string;
  location: RoverLocation;
  speed: number;
  energyPercent: number;
  conditionPercent: number;
  timestamp: number;
}

export interface PointOfInterestReachedPayload {
  roverId: string;
  poi: PointOfInterest;
  distance: number;
  timestamp: number;
}

export interface ScientificObservationCollectedPayload {
  roverId: string;
  instrumentId: string;
  instrumentCategory: string;
  dataYield: number;
  targetId?: string;
  sample?: CollectedSample;
  timestamp: number;
}

export interface ExplorationObjectiveCompletedPayload {
  roverId: string;
  objective: ExplorationObjective;
  rewardCredits: number;
  rewardResearchData: number;
  timestamp: number;
}

export interface RoverReturnedPayload {
  roverId: string;
  returnLocationId: string;
  samplesRecoveredCount: number;
  totalDataSecured: number;
  timestamp: number;
}

export interface RoverStatusChangedPayload {
  roverId: string;
  previousStatus: RoverOperationalStatus;
  currentStatus: RoverOperationalStatus;
  reason?: string;
  timestamp: number;
}

export interface RoverEnergyLowPayload {
  roverId: string;
  energyPercent: number;
  timestamp: number;
}

export interface RoverConditionDegradedPayload {
  roverId: string;
  conditionPercent: number;
  reason: string;
  timestamp: number;
}

export interface AutonomousTargetReachedPayload {
  roverId: string;
  targetLocation: Vector2D;
  timestamp: number;
}

export interface RoverMaintenancePerformedPayload {
  roverId: string;
  action: RoverMaintenanceAction;
  conditionDelta: number;
  energyDelta: number;
  timestamp: number;
}

export interface RoverCommStatusChangedPayload {
  roverId: string;
  previousStatus: RoverCommStatus;
  currentStatus: RoverCommStatus;
  fidelity: number;
  timestamp: number;
}

/**
 * Event map for the exploration domain
 */
export interface ExplorationEvents {
  RoverRegistered: RoverRegisteredPayload;
  RoverDeployed: RoverDeployedPayload;
  RoverMovementStarted: RoverMovementStartedPayload;
  RoverPositionUpdated: RoverPositionUpdatedPayload;
  PointOfInterestReached: PointOfInterestReachedPayload;
  ScientificObservationCollected: ScientificObservationCollectedPayload;
  ExplorationObjectiveCompleted: ExplorationObjectiveCompletedPayload;
  RoverReturned: RoverReturnedPayload;
  RoverStatusChanged: RoverStatusChangedPayload;
  RoverEnergyLow: RoverEnergyLowPayload;
  RoverConditionDegraded: RoverConditionDegradedPayload;
  AutonomousTargetReached: AutonomousTargetReachedPayload;
  RoverMaintenancePerformed: RoverMaintenancePerformedPayload;
  RoverCommStatusChanged: RoverCommStatusChangedPayload;
}
