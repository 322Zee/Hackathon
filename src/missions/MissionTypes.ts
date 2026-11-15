/**
 * INTERSTELLAR CONTINUUM - Mission Architecture & Catalogue Contracts
 * Strongly typed definitions for mission categories, objectives, engineering constraints,
 * scientific instrument requirements, educational briefings, and reward schemas.
 */

import { DestinationId } from '../destinations/DestinationTypes';

/**
 * Three Primary Mission Categories
 */
export enum MissionCategory {
  TRANSPORTATION = 'TRANSPORTATION',
  SCIENTIFIC_EXPLORATION = 'SCIENTIFIC_EXPLORATION',
  COMBINED = 'COMBINED',
}

/**
 * Mission Operational Difficulty
 */
export enum MissionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  VERY_HARD = 'VERY_HARD',
  EXTREME = 'EXTREME',
}

/**
 * Mission Sequence Stages
 */
export enum MissionStageType {
  INITIAL_RECONNAISSANCE = 'INITIAL_RECONNAISSANCE',
  INFRASTRUCTURE_PREPARATION = 'INFRASTRUCTURE_PREPARATION',
  TRANSPORTATION = 'TRANSPORTATION',
  DEPLOYMENT = 'DEPLOYMENT',
  SCIENTIFIC_EXPLORATION = 'SCIENTIFIC_EXPLORATION',
  ADVANCED_RESEARCH = 'ADVANCED_RESEARCH',
}

/**
 * Spacecraft Classifications
 */
export enum SpacecraftType {
  SOUNDING_ROCKET = 'SOUNDING_ROCKET',
  SATELLITE_BUS = 'SATELLITE_BUS',
  ORBITAL_SURVEYOR = 'ORBITAL_SURVEYOR',
  ATMOSPHERIC_ENTRY_PROBE = 'ATMOSPHERIC_ENTRY_PROBE',
  SURFACE_LANDER = 'SURFACE_LANDER',
  PLANETARY_ROVER = 'PLANETARY_ROVER',
  DEEP_SPACE_OBSERVATORY = 'DEEP_SPACE_OBSERVATORY',
  CREW_CAPSULE = 'CREW_CAPSULE',
}

/**
 * Payload Classifications
 */
export enum PayloadType {
  COMMUNICATION_RELAY = 'COMMUNICATION_RELAY',
  EARTH_OBSERVATION_SUITE = 'EARTH_OBSERVATION_SUITE',
  SURFACE_EQUIPMENT_CONTAINER = 'SURFACE_EQUIPMENT_CONTAINER',
  RESEARCH_MODULE = 'RESEARCH_MODULE',
  ROBOTIC_ROVER = 'ROBOTIC_ROVER',
  ATMOSPHERIC_AEROSHELL = 'ATMOSPHERIC_AEROSHELL',
  SAMPLE_RETURN_CAPSULE = 'SAMPLE_RETURN_CAPSULE',
  SCIENCE_INSTRUMENT_PACKAGE = 'SCIENCE_INSTRUMENT_PACKAGE',
  SUBSURFACE_DRILL_SYSTEM = 'SUBSURFACE_DRILL_SYSTEM',
}

/**
 * Scientific Instruments
 */
export enum ScientificInstrument {
  MULTISPECTRAL_IMAGER = 'MULTISPECTRAL_IMAGER',
  SYNTHETIC_APERTURE_RADAR = 'SYNTHETIC_APERTURE_RADAR',
  MAGNETOMETER = 'MAGNETOMETER',
  MASS_SPECTROMETER = 'MASS_SPECTROMETER',
  ALPHA_PARTICLE_XRAY = 'ALPHA_PARTICLE_XRAY',
  SEISMOMETER = 'SEISMOMETER',
  ATMOSPHERIC_STRUCTURE_PROBE = 'ATMOSPHERIC_STRUCTURE_PROBE',
  CORE_DRILL_SAMPLER = 'CORE_DRILL_SAMPLER',
  RADIO_SCIENCE_TRANSPONDER = 'RADIO_SCIENCE_TRANSPONDER',
  LASER_ALTIMETER = 'LASER_ALTIMETER',
  GAMMA_RAY_SPECTROMETER = 'GAMMA_RAY_SPECTROMETER',
  GAS_CHROMATOGRAPH = 'GAS_CHROMATOGRAPH',
}

/**
 * Objective Types
 */
export enum ObjectiveType {
  DELIVERY = 'DELIVERY',
  ORBITAL_INSERTION = 'ORBITAL_INSERTION',
  SURFACE_LANDING = 'SURFACE_LANDING',
  SCIENTIFIC_SURVEY = 'SCIENTIFIC_SURVEY',
  DATA_COLLECTION = 'DATA_COLLECTION',
  SAMPLE_ACQUISITION = 'SAMPLE_ACQUISITION',
  ROVER_TRAVERSAL = 'ROVER_TRAVERSAL',
  STATION_DEPLOYMENT = 'STATION_DEPLOYMENT',
}

/**
 * Mission Status (11 Canonical Lifecycle States)
 */
export enum MissionStatus {
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
 * Individual Mission Objective Contract
 */
export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  targetValue?: number | string;
  currentValue?: number | string;
  isCompleted: boolean;
  // Distinct flags for combined missions
  isDeliveryObjective?: boolean;
  isExplorationObjective?: boolean;
}

/**
 * Mission Prerequisites Contract
 */
export interface MissionPrerequisites {
  requiredDirectorRank: number;
  requiredMissionIds: string[];
  requiredTechNodeIds: string[];
  requiredDestinationUnlocked: boolean;
}

/**
 * Target Orbital Specification
 */
export interface TargetOrbitSpecification {
  altitudeKmMin: number;
  altitudeKmMax: number;
  inclinationDeg?: number;
  eccentricityMax?: number;
}

/**
 * Engineering & Vehicle Requirements
 */
export interface EngineeringRequirements {
  spacecraftType: SpacecraftType;
  payloadType: PayloadType;
  requiredInstruments: ScientificInstrument[];
  minPayloadMassKg: number;
  maxPayloadMassKg: number;
  minPowerWatts: number;
  minBatteryCapacityWh: number;
  communicationBandwidthKbps: number;
  relayRequired: boolean;
  targetOrbit?: TargetOrbitSpecification;
  surfaceTargetCoordinates?: {
    latitude: number;
    longitude: number;
    landingRadiusKm: number;
  };
}

/**
 * Budget Constraints
 */
export interface MissionBudget {
  allocatedCredits: number;
  launchCostCapCredits: number;
}

/**
 * Reward Schema
 */
export interface MissionRewards {
  credits: number;
  researchData: number;
  rawMaterials: number;
  technologyPoints: number;
  agencyPrestige: number;
}

/**
 * Educational & Scientific Briefing Content
 */
export interface MissionEducationalContent {
  coreConcept: string;
  explanation: string;
  realWorldParallel: string;
}

/**
 * Full Mission Definition Contract
 */
export interface MissionDefinition {
  id: string;
  name: string;
  shortCode: string;
  category: MissionCategory;
  summary: string;
  description: string;
  destinationId: DestinationId;
  parentDestinationId?: DestinationId;
  sequenceLevel: number;
  stageType: MissionStageType;
  difficulty: MissionDifficulty;
  scientificPurpose: string;
  mainObjectives: MissionObjective[];
  optionalObjectives: MissionObjective[];
  prerequisites: MissionPrerequisites;
  engineeringRequirements: EngineeringRequirements;
  budget: MissionBudget;
  estimatedDurationDays: number;
  rewards: MissionRewards;
  failureConditions: string[];
  completionConditions: string[];
  isReplayable: boolean;
  educationalContent: MissionEducationalContent;
}

/**
 * Evaluated Mission State with Progression Breakdown
 */
export interface EvaluatedMissionStatus {
  missionId: string;
  status: MissionStatus;
  isUnlocked: boolean;
  isAvailable: boolean;
  isCompleted: boolean;
  isActive: boolean;
  unmetPrerequisites: string[];
  destinationUnlocked: boolean;
  rankMet: boolean;
  prerequisiteMissionsMet: boolean;
  techMet: boolean;
}
