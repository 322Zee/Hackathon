/**
 * INTERSTELLAR CONTINUUM - Cinematic Launch Presentation System
 * Data contracts, state enumerations, input parameters, and event signatures
 * for the 2D/2.5D modular rocket launch cinematic experience.
 */

import { PayloadAssignment } from '../../launch/LaunchDeploymentTypes';

/**
 * 12 Logical Stages of the Cinematic Launch Sequence
 */
export enum LaunchCinematicStage {
  /** Stage 1: Mission launch confirmation, target orbit review, launch commitment window */
  CONFIRMATION = 'CONFIRMATION',

  /** Stage 2: Camera transitions toward the launch vehicle, establishing shot */
  APPROACH = 'APPROACH',

  /** Stage 3: Launch-site environmental presentation (cryo boil-off, gantry lights, sirens) */
  ATMOSPHERE = 'ATMOSPHERE',

  /** Stage 4: T-10s countdown sequencing with visual clock, audio cues, and range status */
  COUNTDOWN = 'COUNTDOWN',

  /** Stage 5: Main engine ignition event, pre-ignition sparklers, core flare bloom */
  IGNITION = 'IGNITION',

  /** Stage 6: Flame trench exhaust expansion, billowing smoke, shock diamonds, heat shimmer */
  EXHAUST_EXPANSION = 'EXHAUST_EXPANSION',

  /** Stage 7: Camera rumble crescendo, hold-down clamp release, tower vibration */
  CAMERA_RUMBLE = 'CAMERA_RUMBLE',

  /** Stage 8: Vehicle liftoff and ascent, tower clearance, vapor condensation cones */
  LIFTOFF_ASCENT = 'LIFTOFF_ASCENT',

  /** Stage 9: Upward camera tracking, multi-layer parallax, atmospheric sky gradient shift */
  SKY_TRANSITION = 'SKY_TRANSITION',

  /** Stage 10: High-altitude climb, vehicle vanishes into upper atmospheric corridor / space */
  SPACE_REACH = 'SPACE_REACH',

  /** Stage 11: Emission of authoritative mission handoff event to flight simulation core */
  MISSION_HANDOFF = 'MISSION_HANDOFF',

  /** Stage 12: Sequence completed, cinematic visual fade and cleanup */
  COMPLETED = 'COMPLETED',
}

/**
 * Overall Controller Playback State
 */
export enum LaunchCinematicState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  SKIPPED = 'SKIPPED',
  ABORTED = 'ABORTED',
  COMPLETED = 'COMPLETED',
}

/**
 * Visual Quality Presets for Performance Scaling
 */
export enum LaunchVisualQuality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Engine Thruster Visual Configuration
 */
export interface LaunchThrusterVisualData {
  count: number;
  nozzleDiameterPx: number;
  spacingPx: number;
  plumeColorCore: number;
  plumeColorOuter: number;
  heatDistortionEnabled: boolean;
  smokeDensityMultiplier: number;
}

/**
 * Normalized Rocket Vehicle Presentation Data
 */
export interface LaunchVehiclePresentationData {
  projectId?: string;
  vehicleName: string;
  designVersion?: string;
  stagesCount: number;
  heightPx: number;
  widthPx: number;
  primaryColor: number;
  accentColor: number;
  fairingColor: number;
  hasBoosters: boolean;
  boosterCount: number;
  thruster: LaunchThrusterVisualData;
  massKg: number;
  payloadName?: string;
}

/**
 * Launch Configuration & Environment Parameters
 */
export interface LaunchEnvironmentConfig {
  timeOfDay?: 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';
  cloudCover?: number; // 0.0 (clear) to 1.0 (heavy overcast)
  ambientWindSpeed?: number;
  targetOrbitAltitudeKm?: number;
  launchAzimuthDeg?: number;
}

/**
 * User & Accessibility Cinematic Settings
 */
export interface CinematicLaunchSettings {
  quality: LaunchVisualQuality;
  allowSkip: boolean;
  cameraShakeEnabled: boolean;
  cameraShakeIntensity: number; // 0.0 to 1.0
  reducedMotion: boolean;
  enableShaders: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  narrationEnabled: boolean;
}

/**
 * Default Settings Factory
 */
export const DEFAULT_LAUNCH_CINEMATIC_SETTINGS: CinematicLaunchSettings = {
  quality: LaunchVisualQuality.HIGH,
  allowSkip: true,
  cameraShakeEnabled: true,
  cameraShakeIntensity: 1.0,
  reducedMotion: false,
  enableShaders: true,
  soundEnabled: true,
  soundVolume: 1.0,
  narrationEnabled: true,
};

/**
 * Top-Level Input Contract for Starting a Launch Sequence
 */
export interface LaunchCinematicInput {
  missionId: string;
  missionName?: string;
  vehicleData: LaunchVehiclePresentationData;
  launchSiteId: string;
  launchSiteName?: string;
  padCode?: string;
  environment?: LaunchEnvironmentConfig;
  settings?: Partial<CinematicLaunchSettings>;
  payloadAssignment?: PayloadAssignment;
  customData?: Record<string, any>;
}

/**
 * Live Telemetry Calculated During Cinematic Ascent
 */
export interface LaunchCinematicTelemetry {
  stage: LaunchCinematicStage;
  countdownSeconds: number;
  missionTimeSeconds: number;
  altitudeKm: number;
  velocityMps: number;
  accelerationG: number;
  dynamicPressureKPa: number;
  throttlePercent: number;
  distanceDownrangeKm: number;
}

/**
 * Payload Emitted on Mission Handoff to Simulation Core
 */
export interface LaunchHandoffPayload {
  missionId: string;
  launchSiteId: string;
  timestamp: number;
  finalTelemetry: LaunchCinematicTelemetry;
  vehicleData: LaunchVehiclePresentationData;
  environment?: LaunchEnvironmentConfig;
  wasSkipped: boolean;
  handoffStatus: 'SUCCESS_NOMINAL_ASCENT' | 'SKIPPED_TO_ORBITAL_INSERTION';
}

/**
 * Event Names Emitted Throughout Sequence
 */
export const LAUNCH_CINEMATIC_EVENTS = {
  CINEMATIC_STARTED: 'cinematic:launch:started',
  COUNTDOWN_STARTED: 'cinematic:launch:countdown',
  IGNITION_PRESENTED: 'cinematic:launch:ignition',
  ASCENT_PRESENTED: 'cinematic:launch:ascent',
  CINEMATIC_SKIPPED: 'cinematic:launch:skipped',
  CINEMATIC_COMPLETED: 'cinematic:launch:completed',
  MISSION_HANDOFF_REQUESTED: 'cinematic:launch:handoff',
} as const;

/**
 * Event Bus Payload Signatures
 */
export interface LaunchCinematicEventPayloads {
  [LAUNCH_CINEMATIC_EVENTS.CINEMATIC_STARTED]: {
    missionId: string;
    vehicleName: string;
    launchSiteId: string;
    timestamp: number;
  };
  [LAUNCH_CINEMATIC_EVENTS.COUNTDOWN_STARTED]: {
    missionId: string;
    initialSeconds: number;
    timestamp: number;
  };
  [LAUNCH_CINEMATIC_EVENTS.IGNITION_PRESENTED]: {
    missionId: string;
    thrusterCount: number;
    throttlePercent: number;
    timestamp: number;
  };
  [LAUNCH_CINEMATIC_EVENTS.ASCENT_PRESENTED]: {
    missionId: string;
    altitudeKm: number;
    velocityMps: number;
    timestamp: number;
  };
  [LAUNCH_CINEMATIC_EVENTS.CINEMATIC_SKIPPED]: {
    missionId: string;
    skippedAtStage: LaunchCinematicStage;
    elapsedSeconds: number;
    timestamp: number;
  };
  [LAUNCH_CINEMATIC_EVENTS.CINEMATIC_COMPLETED]: {
    missionId: string;
    totalDurationSeconds: number;
    timestamp: number;
  };
  [LAUNCH_CINEMATIC_EVENTS.MISSION_HANDOFF_REQUESTED]: LaunchHandoffPayload;
}
