/**
 * INTERSTELLAR CONTINUUM - Default Rover Model Definitions
 * Authored rover chassis architectures with meaningfully distinct gameplay statistics.
 */

import {
  RoverModelDefinition,
  RoverModelType,
  RoverPowerSource,
  TerrainType,
} from '../ExplorationTypes';

export const DEFAULT_ROVER_MODELS: Record<RoverModelType, RoverModelDefinition> = {
  // -----------------------------------------------------------------------
  // 1. SCOUT ROVER (e.g. Pathfinder / Sojourner Archetype)
  // -----------------------------------------------------------------------
  [RoverModelType.SCOUT]: {
    modelId: 'ROVER_MODEL_SCOUT',
    modelType: RoverModelType.SCOUT,
    displayName: 'Aero-Pathfinder Scout Rover',
    description: 'Lightweight, agile reconnaissance vehicle with 6-wheel rocker-bogie suspension and wide sensor array, engineered for rapid terrain reconnaissance and rapid waypoint mapping.',
    baseCondition: 100,
    baseMaxEnergy: 100,
    powerSource: RoverPowerSource.SOLAR_ARRAY,
    solarGenerationRate: 2.2, // Fast solar recharge in day
    rtgGenerationRate: 0.0,
    maxInstrumentSlots: 2,
    maxStorageSlots: 4,
    baseMassKg: 110,
    autonomousCapabilityRating: 2,
    visualAssetKey: 'rover_scout_chassis',
    defaultMovementConfig: {
      maxSpeed: 210, // Fast
      maxReverseSpeed: 85,
      acceleration: 380,
      brakingDeceleration: 650,
      naturalFriction: 120,
      turnRateDegPerSec: 130, // Extremely nimble
      energyDrainPerSecond: 0.15,
      energyDrainPerMeter: 0.04, // Very energy efficient
      sensorDetectionRadius: 420, // Long sensor range
      terrainHandling: {
        [TerrainType.SMOOTH_PLAINS]: 1.0,
        [TerrainType.REGOLITH_DUNES]: 0.85,
        [TerrainType.ROCKY_CRAGS]: 0.65,
        [TerrainType.CRATER_SLOPES]: 0.55,
        [TerrainType.HAZARDOUS_FISSURE]: 0.25,
        [TerrainType.CRYOGENIC_ICE]: 0.80,
      },
    },
  },

  // -----------------------------------------------------------------------
  // 2. SCIENTIFIC ROVER (e.g. Curiosity / Perseverance Archetype)
  // -----------------------------------------------------------------------
  [RoverModelType.SCIENTIFIC]: {
    modelId: 'ROVER_MODEL_SCIENTIFIC',
    modelType: RoverModelType.SCIENTIFIC,
    displayName: 'Prometheus Astrobiology Science Rover',
    description: 'Heavy duty, nuclear-powered mobile planetary laboratory equipped with multiple scientific instruments, robotic sample arm, and internal analysis ovens.',
    baseCondition: 100,
    baseMaxEnergy: 140,
    powerSource: RoverPowerSource.RADIOISOTOPE_RTG,
    solarGenerationRate: 0.0,
    rtgGenerationRate: 1.2, // Continuous uninterrupted trickle power day or night, immune to dust
    maxInstrumentSlots: 5, // High instrument capacity
    maxStorageSlots: 8,
    baseMassKg: 340,
    autonomousCapabilityRating: 3,
    visualAssetKey: 'rover_science_chassis',
    defaultMovementConfig: {
      maxSpeed: 140, // Deliberate speed
      maxReverseSpeed: 60,
      acceleration: 240,
      brakingDeceleration: 500,
      naturalFriction: 140,
      turnRateDegPerSec: 75,
      energyDrainPerSecond: 0.35,
      energyDrainPerMeter: 0.09,
      sensorDetectionRadius: 320,
      terrainHandling: {
        [TerrainType.SMOOTH_PLAINS]: 1.0,
        [TerrainType.REGOLITH_DUNES]: 0.75,
        [TerrainType.ROCKY_CRAGS]: 0.70, // Sturdy wheels handle rocks well
        [TerrainType.CRATER_SLOPES]: 0.60,
        [TerrainType.HAZARDOUS_FISSURE]: 0.20,
        [TerrainType.CRYOGENIC_ICE]: 0.70,
      },
    },
  },

  // -----------------------------------------------------------------------
  // 3. HEAVY UTILITY ROVER (e.g. Colossus / Apollo LRV Freight Archetype)
  // -----------------------------------------------------------------------
  [RoverModelType.HEAVY_UTILITY]: {
    modelId: 'ROVER_MODEL_HEAVY_UTILITY',
    modelType: RoverModelType.HEAVY_UTILITY,
    displayName: 'Titan Colossus Heavy Utility Rover',
    description: 'Industrial heavy haul transport rover featuring reinforced titanium frame, extensive storage bays for sample containers and surface infrastructure, and heavy obstacle ramming bumpers.',
    baseCondition: 140, // Heavy structural armor
    baseMaxEnergy: 180,
    powerSource: RoverPowerSource.HYBRID_SOLAR_RTG,
    solarGenerationRate: 1.4,
    rtgGenerationRate: 0.8,
    maxInstrumentSlots: 3,
    maxStorageSlots: 16, // Massive cargo capacity
    baseMassKg: 520,
    autonomousCapabilityRating: 2,
    visualAssetKey: 'rover_heavy_chassis',
    defaultMovementConfig: {
      maxSpeed: 115, // Slow
      maxReverseSpeed: 50,
      acceleration: 190,
      brakingDeceleration: 420,
      naturalFriction: 160,
      turnRateDegPerSec: 55, // Wide turning radius
      energyDrainPerSecond: 0.50,
      energyDrainPerMeter: 0.14,
      sensorDetectionRadius: 260,
      terrainHandling: {
        [TerrainType.SMOOTH_PLAINS]: 1.0,
        [TerrainType.REGOLITH_DUNES]: 0.80,
        [TerrainType.ROCKY_CRAGS]: 0.80, // Heavy suspension powers over obstacles
        [TerrainType.CRATER_SLOPES]: 0.50,
        [TerrainType.HAZARDOUS_FISSURE]: 0.30,
        [TerrainType.CRYOGENIC_ICE]: 0.60,
      },
    },
  },

  // -----------------------------------------------------------------------
  // 4. ADVANCED AUTONOMOUS ROVER (e.g. Vanguard AI Explorer)
  // -----------------------------------------------------------------------
  [RoverModelType.ADVANCED_AUTONOMOUS]: {
    modelId: 'ROVER_MODEL_ADVANCED_AUTONOMOUS',
    modelType: RoverModelType.ADVANCED_AUTONOMOUS,
    displayName: 'Vanguard Autonomous Cyber-Explorer',
    description: 'Next-generation exploration vehicle powered by an on-board neuromorphic navigation co-processor, stereoscopic LIDAR, and automated hazard avoidance routines for high-speed robotic surveying.',
    baseCondition: 110,
    baseMaxEnergy: 125,
    powerSource: RoverPowerSource.HYBRID_SOLAR_RTG,
    solarGenerationRate: 1.8,
    rtgGenerationRate: 1.0,
    maxInstrumentSlots: 4,
    maxStorageSlots: 6,
    baseMassKg: 230,
    autonomousCapabilityRating: 5, // Top tier autonomous capability
    visualAssetKey: 'rover_autonomous_chassis',
    defaultMovementConfig: {
      maxSpeed: 185,
      maxReverseSpeed: 75,
      acceleration: 320,
      brakingDeceleration: 600,
      naturalFriction: 130,
      turnRateDegPerSec: 105,
      energyDrainPerSecond: 0.30,
      energyDrainPerMeter: 0.06,
      sensorDetectionRadius: 460, // Long-range LIDAR scanner
      terrainHandling: {
        [TerrainType.SMOOTH_PLAINS]: 1.0,
        [TerrainType.REGOLITH_DUNES]: 0.90,
        [TerrainType.ROCKY_CRAGS]: 0.75,
        [TerrainType.CRATER_SLOPES]: 0.70,
        [TerrainType.HAZARDOUS_FISSURE]: 0.35,
        [TerrainType.CRYOGENIC_ICE]: 0.85,
      },
    },
  },
};
