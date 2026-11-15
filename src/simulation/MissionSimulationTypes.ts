/**
 * INTERSTELLAR CONTINUUM - Mission Simulation Core & Space-Time Types
 * Strongly typed definitions for simulation lifecycle states, flight phases,
 * game-time progression, space travel tracking, objectives, snapshots, and event contracts.
 *
 * NOTE: Fictional and educational simulation model. Abstract travel units and
 * game parameters are used; actionable real-world rocket propulsion or orbital
 * flight manuals are strictly excluded.
 */

import { DestinationId } from '../destinations/DestinationTypes';

/**
 * 11 Canonical Simulation Mission States
 */
export enum SimulationMissionState {
  INACTIVE = 'INACTIVE',
  PREPARING = 'PREPARING',
  READY = 'READY',
  LAUNCHING = 'LAUNCHING',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVING = 'ARRIVING',
  ACTIVE = 'ACTIVE',
  RETURNING = 'RETURNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

/**
 * Granular Flight & Mission Phases
 */
export enum SimulationMissionPhase {
  IDLE = 'IDLE',
  PRE_LAUNCH = 'PRE_LAUNCH',
  LAUNCH_ASCENT = 'LAUNCH_ASCENT',
  ORBITAL_INSERTION = 'ORBITAL_INSERTION',
  TRANSIT_DEPARTURE = 'TRANSIT_DEPARTURE',
  TRANSIT_CRUISE = 'TRANSIT_CRUISE',
  DESTINATION_APPROACH = 'DESTINATION_APPROACH',
  DESTINATION_ARRIVAL = 'DESTINATION_ARRIVAL',
  PRIMARY_OPERATIONS = 'PRIMARY_OPERATIONS',
  RETURN_TRANSIT = 'RETURN_TRANSIT',
  MISSION_CONCLUDED = 'MISSION_CONCLUDED',
}

/**
 * Sub-phase for abstract space travel progression
 */
export enum TravelSubPhase {
  DEPARTING = 'DEPARTING',
  CRUISING = 'CRUISING',
  APPROACHING = 'APPROACHING',
  ARRIVED = 'ARRIVED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
}

/**
 * Simulation Speed Presets
 */
export enum SimulationSpeedPreset {
  PAUSED = 0,
  REALTIME = 1,
  NORMAL = 1,
  FAST = 2,
  RAPID = 5,
  VERY_RAPID = 10,
  WARP = 50,
  MAX_WARP = 100,
}

/**
 * Independent Game-Time Configuration
 */
export interface GameTimeConfig {
  /** Simulation speed scale multiplier (e.g. 1.0 = normal, 2.0 = 2x speed) */
  timeScale: number;
  /** Whether the simulation clock is paused */
  isPaused: boolean;
  /** Fixed time step size in seconds for deterministic updates (e.g. 0.05s = 20hz) */
  fixedTimeStep: number;
  /** Maximum delta time allowed per single tick update to prevent spiral of death */
  maxDeltaClamping: number;
  /** Maximum number of fixed-steps to process in a single advance call */
  maxSubSteps: number;
}

/**
 * Current Game-Time Telemetry State
 */
export interface GameTimeState {
  /** Total elapsed game-time seconds since mission launch */
  elapsedGameTimeSeconds: number;
  /** Total real-world seconds passed during simulation updates */
  totalRealTimeSeconds: number;
  /** Total accumulated fixed-step simulation ticks */
  totalTicks: number;
  /** Current time scale multiplier */
  timeScale: number;
  /** Whether time is paused */
  isPaused: boolean;
  /** Human-readable Mission Elapsed Time (MET) string (e.g., "T+ 00d 04h 32m 10s") */
  formattedMET: string;
}

/**
 * Abstract Space Travel Progress Model
 */
export interface TravelProgress {
  /** Origin celestial body or orbital region */
  originId: DestinationId | string;
  /** Destination celestial body or orbital region */
  destinationId: DestinationId | string;
  /** Game timestamp when departure occurred */
  departureTime: number;
  /** Total estimated journey duration in game seconds */
  estimatedDurationSeconds: number;
  /** Elapsed journey transit time in game seconds */
  elapsedTransitSeconds: number;
  /** Normalized journey progress from 0.0 (departure) to 1.0 (arrival) */
  progress: number;
  /** Abstract distance traveled in game distance units */
  distanceTraveledUnits: number;
  /** Total journey distance in game distance units */
  totalDistanceUnits: number;
  /** Current abstract travel sub-phase */
  travelSubPhase: TravelSubPhase;
  /** Whether the spacecraft has arrived at destination */
  isArrived: boolean;
  /** Whether this is a return trip */
  isReturnTrip: boolean;
}

/**
 * Tracked Objective within the Simulation Engine
 */
export interface SimulationObjective {
  /** Unique objective ID */
  id: string;
  /** Objective display title */
  title: string;
  /** Objective description */
  description?: string;
  /** Whether completion of this objective is required for mission completion */
  isMandatory: boolean;
  /** Completion flag */
  isCompleted: boolean;
  /** Current numerical progress value */
  currentProgress: number;
  /** Target value required for completion */
  targetValue: number;
  /** Objective category (optional reference) */
  category?: string;
}

/**
 * Configuration for Initializing a Simulation Mission
 */
export interface MissionSimulationConfig {
  /** Mission identifier (e.g., "MSN_EARTH_OBS_01") */
  missionId: string;
  /** Optional runtime instance ID */
  instanceId?: string;
  /** Mission title or name */
  missionName: string;
  /** Type or category of mission (e.g., "TRANSPORTATION", "SCIENTIFIC_EXPLORATION") */
  missionType: string;
  /** Origin body ID (defaults to DEST_EARTH) */
  originId?: DestinationId | string;
  /** Destination body ID */
  destinationId: DestinationId | string;
  /** Estimated journey duration in game seconds */
  estimatedDurationSeconds?: number;
  /** Total travel distance in abstract units */
  totalDistanceUnits?: number;
  /** Objectives required for this mission */
  objectives?: SimulationObjective[];
  /** Initial simulation speed settings */
  initialTimeScale?: number;
  /** Initial paused state (defaults to false) */
  startPaused?: boolean;
  /** Custom fixed step size (defaults to 0.05s) */
  fixedTimeStep?: number;
  /** Maximum delta clamp (defaults to 0.25s) */
  maxDeltaClamping?: number;
  /** Fictional payload mass or configuration reference if applicable */
  payloadConfigRef?: string;
  /** Vehicle design reference if applicable */
  rocketConfigRef?: string;
}

/**
 * Serializable Mission Simulation Snapshot (Versioned)
 */
export interface MissionSimulationSnapshot {
  /** Snapshot schema version for backward compatibility and migration */
  schemaVersion: number;
  /** Unique snapshot identifier */
  snapshotId: string;
  /** Mission identifier */
  missionId: string;
  /** Mission instance identifier */
  instanceId: string;
  /** Mission display title */
  missionName: string;
  /** Mission type */
  missionType: string;
  /** Origin body identifier */
  originId: string;
  /** Destination body identifier */
  destinationId: string;
  /** Current simulation lifecycle state */
  currentState: SimulationMissionState;
  /** Previous state retained when paused */
  previousResumableState: SimulationMissionState | null;
  /** Current flight or mission phase */
  currentPhase: SimulationMissionPhase;
  /** Elapsed game time in seconds */
  elapsedGameTime: number;
  /** Total real-world seconds elapsed */
  totalRealTime: number;
  /** Total simulation step ticks */
  totalTicks: number;
  /** Space travel telemetry progress */
  travelProgress: TravelProgress;
  /** Tracked objectives and progress */
  objectives: SimulationObjective[];
  /** Simulation engine settings */
  simulationSettings: {
    timeScale: number;
    isPaused: boolean;
    fixedTimeStep: number;
    maxDeltaClamping: number;
  };
  /** Reason for mission failure if applicable */
  failureReason: string | null;
  /** Completion timestamp in game time if completed */
  completedGameTime: number | null;
  /** System creation timestamp (wall clock ms) */
  createdAt: number;
  /** System last updated timestamp (wall clock ms) */
  updatedAt: number;
}

/**
 * State Transition Result
 */
export interface StateTransitionResult {
  /** Whether the transition succeeded */
  success: boolean;
  /** State transitioned from */
  fromState: SimulationMissionState;
  /** State transitioned to (or attempted to transition to) */
  toState: SimulationMissionState;
  /** Error message if transition failed */
  error?: string;
}

/**
 * Public Simulation Typed Event Map
 */
export interface SimulationEventMap {
  /** Fired when a mission is successfully initialized */
  MissionInitialized: {
    missionId: string;
    instanceId: string;
    snapshot: MissionSimulationSnapshot;
    timestamp: number;
  };

  /** Fired when mission progression starts */
  MissionStarted: {
    missionId: string;
    instanceId: string;
    state: SimulationMissionState;
    phase: SimulationMissionPhase;
    timestamp: number;
  };

  /** Fired when mission simulation is paused */
  MissionPaused: {
    missionId: string;
    instanceId: string;
    previousState: SimulationMissionState;
    reason?: string;
    timestamp: number;
  };

  /** Fired when mission simulation is resumed */
  MissionResumed: {
    missionId: string;
    instanceId: string;
    resumedState: SimulationMissionState;
    timestamp: number;
  };

  /** Fired when flight phase changes */
  MissionPhaseChanged: {
    missionId: string;
    instanceId: string;
    previousPhase: SimulationMissionPhase;
    newPhase: SimulationMissionPhase;
    state: SimulationMissionState;
    timestamp: number;
  };

  /** Fired on simulation step with updated travel and time metrics */
  MissionProgressUpdated: {
    missionId: string;
    instanceId: string;
    progress: number;
    elapsedGameTime: number;
    formattedMET: string;
    travelProgress: TravelProgress;
  };

  /** Fired when the spacecraft reaches the destination body/region */
  MissionArrived: {
    missionId: string;
    instanceId: string;
    destinationId: string;
    elapsedGameTime: number;
    timestamp: number;
  };

  /** Fired when all mandatory objectives are met and mission completes */
  MissionCompleted: {
    missionId: string;
    instanceId: string;
    elapsedGameTime: number;
    snapshot: MissionSimulationSnapshot;
    timestamp: number;
  };

  /** Fired when mission encounters a terminal failure condition */
  MissionFailed: {
    missionId: string;
    instanceId: string;
    reason: string;
    elapsedGameTime: number;
    snapshot: MissionSimulationSnapshot;
    timestamp: number;
  };

  /** Fired when an individual objective changes progress or completes */
  ObjectiveUpdated: {
    missionId: string;
    objectiveId: string;
    isCompleted: boolean;
    currentProgress: number;
    targetValue: number;
  };

  /** Fired when simulation speed or pause setting changes */
  SimulationSpeedChanged: {
    timeScale: number;
    isPaused: boolean;
  };
}

/**
 * Event unsubscribe function handle
 */
export type UnsubscribeFn = () => void;
