/**
 * INTERSTELLAR CONTINUUM - Mission Control & Telemetry Data Contracts
 * Strongly typed schemas for the Mission Control user interface, telemetry displays,
 * spacecraft status indicators, alerts, event logs, and decoupled data-provider contracts.
 */

import { DestinationId } from '../../destinations/DestinationTypes';
import { MissionCategory, MissionStageType, SpacecraftType, PayloadType } from '../../missions/MissionTypes';
import { MissionLifecycleState } from '../../missions/MissionLifecycleTypes';

/**
 * Explicit telemetry value wrapper distinguishing unavailable from zero values.
 */
export interface TelemetryValue<T> {
  readonly available: boolean;
  readonly value?: T;
  readonly unit?: string;
  readonly statusText?: string;
  readonly isWarning?: boolean;
  readonly isCritical?: boolean;
}

/**
 * Three Sensible Alert Priority Levels
 */
export enum AlertPriority {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Alert Record for Mission Control Monitoring
 */
export interface MissionAlert {
  readonly id: string;
  readonly timestamp: number;
  readonly priority: AlertPriority;
  readonly subsystem: string;
  readonly title: string;
  readonly message: string;
  readonly actionPrompt?: string;
  readonly acknowledged?: boolean;
}

/**
 * Mission Control Event Categories
 */
export enum MissionEventCategory {
  LIFECYCLE = 'LIFECYCLE',
  TRAJECTORY = 'TRAJECTORY',
  COMMUNICATION = 'COMMUNICATION',
  PAYLOAD = 'PAYLOAD',
  SCIENCE = 'SCIENCE',
  SYSTEM = 'SYSTEM',
}

/**
 * Chronological Mission Event Log Entry
 */
export interface MissionControlEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly metSeconds: number;
  readonly category: MissionEventCategory;
  readonly title: string;
  readonly description: string;
  readonly severity?: 'NORMAL' | 'NOTICE' | 'CAUTION' | 'CRITICAL';
  readonly details?: Record<string, any>;
}

/**
 * Mission Milestone Definition
 */
export enum MilestoneState {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export interface MissionMilestone {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly scheduledMetSeconds: number;
  readonly completedMetSeconds?: number;
  readonly state: MilestoneState;
}

/**
 * Mission Objective Summary for Dashboard
 */
export interface MissionControlObjective {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly isMandatory: boolean;
  readonly isCompleted: boolean;
  readonly currentProgress: number; // 0.0 to 1.0
  readonly targetValue?: number | string;
  readonly currentValue?: number | string;
  readonly conditionDescription: string;
}

/**
 * Section A: Mission Overview Data
 */
export interface MissionOverviewData {
  readonly missionId: string;
  readonly instanceId: string;
  readonly name: string;
  readonly shortCode: string;
  readonly destinationId: DestinationId;
  readonly destinationName: string;
  readonly destinationType?: string;
  readonly category: MissionCategory;
  readonly stageType: MissionStageType;
  readonly status: MissionLifecycleState;
  readonly currentPhase: string;
  readonly metSeconds: number;
  readonly estimatedDurationDays: number;
  readonly estimatedRemainingSeconds?: number;
  readonly launchTimestamp?: number;
  readonly isSampleData?: boolean;
}

/**
 * Section B: Spacecraft & Systems Telemetry
 */
export interface SpacecraftStatusTelemetry {
  readonly vehicleName: TelemetryValue<string>;
  readonly spacecraftType: TelemetryValue<SpacecraftType>;
  readonly vehicleConditionPercent: TelemetryValue<number>; // 0 to 100
  readonly thermalStatus: TelemetryValue<string>;
  readonly temperatureKelvin: TelemetryValue<number>;

  // Power Subsystem
  readonly batteryPercent: TelemetryValue<number>; // 0 to 100
  readonly powerGenerationWatts: TelemetryValue<number>;
  readonly powerDrawWatts: TelemetryValue<number>;
  readonly powerSystemState: TelemetryValue<string>;

  // Communication Subsystem
  readonly signalStrengthPercent: TelemetryValue<number>; // 0 to 100
  readonly signalDbm: TelemetryValue<number>;
  readonly uplinkRateKbps: TelemetryValue<number>;
  readonly downlinkRateKbps: TelemetryValue<number>;
  readonly roundTripDelaySeconds: TelemetryValue<number>;
  readonly activeGroundStation: TelemetryValue<string>;
  readonly commsState: TelemetryValue<string>;

  // Payload Subsystem
  readonly payloadType: TelemetryValue<PayloadType>;
  readonly payloadHealthPercent: TelemetryValue<number>; // 0 to 100
  readonly payloadDeployed: TelemetryValue<boolean>;
  readonly payloadMassKg: TelemetryValue<number>;
  readonly payloadInstrumentsActive: TelemetryValue<string>;

  // Navigation Subsystem
  readonly velocityKmPerSec: TelemetryValue<number>;
  readonly distanceToDestinationKm: TelemetryValue<number>;
  readonly altitudeKm: TelemetryValue<number>;
  readonly trajectoryStatus: TelemetryValue<string>;
  readonly orbitalRegime: TelemetryValue<string>;

  // Warnings & Readiness
  readonly systemWarnings: string[];
  readonly missionReadinessPercent: TelemetryValue<number>; // 0 to 100
  readonly missionReadinessState: TelemetryValue<string>;
}

/**
 * Section C: Mission Progress Telemetry
 */
export interface MissionProgressTelemetry {
  readonly journeyProgressPercent: number; // 0 to 100
  readonly currentPhase: string;
  readonly phaseProgressPercent: number; // 0 to 100
  readonly completedObjectives: MissionControlObjective[];
  readonly pendingObjectives: MissionControlObjective[];
  readonly remainingObjectives: MissionControlObjective[];
  readonly milestones: MissionMilestone[];
}

/**
 * Section D: Scientific Data Telemetry Summary
 */
export interface ScientificDataSummary {
  readonly totalDataCollectedMb: TelemetryValue<number>;
  readonly dataDownlinkedMb: TelemetryValue<number>;
  readonly activeSensorsCount: TelemetryValue<number>;
  readonly primaryDiscoveries: string[];
}

/**
 * Historical Telemetry Data Point (for trend visualizations)
 */
export interface TelemetryHistoryPoint {
  readonly timestamp: number;
  readonly metSeconds: number;
  readonly powerDrawWatts?: number;
  readonly batteryPercent?: number;
  readonly signalStrengthPercent?: number;
  readonly vehicleConditionPercent?: number;
  readonly velocityKmPerSec?: number;
}

/**
 * Complete Mission Control Telemetry Snapshot
 */
export interface MissionTelemetrySnapshot {
  readonly overview: MissionOverviewData;
  readonly spacecraft: SpacecraftStatusTelemetry;
  readonly progress: MissionProgressTelemetry;
  readonly scientificData: ScientificDataSummary;
  readonly recentEvents: MissionControlEvent[];
  readonly alerts: MissionAlert[];
  readonly telemetryHistory: TelemetryHistoryPoint[];
  readonly isSampleData: boolean;
}
