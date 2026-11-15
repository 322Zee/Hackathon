/**
 * INTERSTELLAR CONTINUUM - Default Scientific Instruments
 * Authored instrument suite for planetary exploration rovers across 5 canonical categories.
 */

import {
  ScientificInstrument,
  InstrumentCategory,
  RoverModelType,
} from '../ExplorationTypes';

export const DEFAULT_INSTRUMENTS: ScientificInstrument[] = [
  // -----------------------------------------------------------------------
  // 1. IMAGING INSTRUMENTS
  // -----------------------------------------------------------------------
  {
    id: 'INST_MASTCAM_STEREO',
    name: 'Mastcam Multispectral Stereo Mast',
    category: InstrumentCategory.IMAGING,
    dataCollectionRating: 45,
    powerConsumptionRating: 12,
    compatibilityRequirements: {
      minRoverLevel: 1,
      allowedModels: [
        RoverModelType.SCOUT,
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 25,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 1,
      researchCost: 0, // Default starter instrument
    },
    operationalRangeMeters: 180,
    samplingDurationSeconds: 1.5,
    description: 'Twin multispectral stereoscopic cameras mounted on a pan-tilt mast, capturing true-color panoramic and 3D terrain elevation imagery.',
  },
  {
    id: 'INST_MICROSCOPIC_IMAGER',
    name: 'Robotic Arm Micro-Imager',
    category: InstrumentCategory.IMAGING,
    dataCollectionRating: 60,
    powerConsumptionRating: 15,
    compatibilityRequirements: {
      minRoverLevel: 1,
      allowedModels: [
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 30,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 1,
      researchCost: 40,
    },
    operationalRangeMeters: 40,
    samplingDurationSeconds: 2.0,
    description: 'Extreme close-up micro-optical camera located on the rover arm for resolving sub-millimeter crystalline mineral grains and rock textures.',
  },

  // -----------------------------------------------------------------------
  // 2. GEOLOGICAL ANALYSIS INSTRUMENTS
  // -----------------------------------------------------------------------
  {
    id: 'INST_APXS_SPECTROMETER',
    name: 'Alpha Particle X-Ray Spectrometer (APXS)',
    category: InstrumentCategory.GEOLOGICAL_ANALYSIS,
    dataCollectionRating: 90,
    powerConsumptionRating: 18,
    compatibilityRequirements: {
      minRoverLevel: 1,
      allowedModels: [
        RoverModelType.SCOUT,
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 35,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 1,
      researchCost: 60,
    },
    operationalRangeMeters: 30,
    samplingDurationSeconds: 3.0,
    description: 'Irradiates rock surfaces with alpha particles and curium sources to determine elemental stoichiometry from sodium to uranium.',
  },
  {
    id: 'INST_CORE_DRILL_SYSTEM',
    name: 'Rotary-Percussive Rock Core Drill',
    category: InstrumentCategory.GEOLOGICAL_ANALYSIS,
    dataCollectionRating: 140,
    powerConsumptionRating: 32,
    compatibilityRequirements: {
      minRoverLevel: 2,
      allowedModels: [
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
      ],
      minPowerWatts: 60,
      slotCost: 2,
    },
    unlockRequirements: {
      techTier: 2,
      researchCost: 120,
    },
    operationalRangeMeters: 25,
    samplingDurationSeconds: 4.5,
    description: 'High-torque percussion drill capable of boring into rock strata to extract intact sealed core sample cylinders for caching and return.',
  },
  {
    id: 'INST_LASER_CHEMCAM',
    name: 'Standoff Laser-Induced Breakdown Spectrometer',
    category: InstrumentCategory.GEOLOGICAL_ANALYSIS,
    dataCollectionRating: 110,
    powerConsumptionRating: 28,
    compatibilityRequirements: {
      minRoverLevel: 2,
      allowedModels: [
        RoverModelType.SCIENTIFIC,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 50,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 2,
      researchCost: 100,
    },
    operationalRangeMeters: 140,
    samplingDurationSeconds: 2.2,
    description: 'Pulsed infrared laser vaporizing pinpoint targets on distant outcrops into luminous plasma, analyzing optical emissions via spectrometer.',
  },

  // -----------------------------------------------------------------------
  // 3. ENVIRONMENTAL OBSERVATION INSTRUMENTS
  // -----------------------------------------------------------------------
  {
    id: 'INST_METEOROLOGY_STATION',
    name: 'Surface Environmental & Weather Suite',
    category: InstrumentCategory.ENVIRONMENTAL_OBSERVATION,
    dataCollectionRating: 50,
    powerConsumptionRating: 8,
    compatibilityRequirements: {
      minRoverLevel: 1,
      allowedModels: [
        RoverModelType.SCOUT,
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 15,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 1,
      researchCost: 30,
    },
    operationalRangeMeters: 300,
    samplingDurationSeconds: 1.0,
    description: 'Continuous meteorological sensor boom recording ambient atmospheric pressure, thermal diurnal gradients, relative humidity, and wind vectors.',
  },
  {
    id: 'INST_RADIATION_DETECTOR',
    name: 'Cosmic Ray & Radiation Sensor (RAD)',
    category: InstrumentCategory.ENVIRONMENTAL_OBSERVATION,
    dataCollectionRating: 75,
    powerConsumptionRating: 10,
    compatibilityRequirements: {
      minRoverLevel: 1,
      allowedModels: [
        RoverModelType.SCOUT,
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 20,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 1,
      researchCost: 50,
    },
    operationalRangeMeters: 250,
    samplingDurationSeconds: 1.5,
    description: 'Solid-state silicon detector measuring Galactic Cosmic Rays (GCR) and Solar Particle Event (SPE) radiation dosages on the planetary surface.',
  },

  // -----------------------------------------------------------------------
  // 4. SURFACE SCANNING INSTRUMENTS
  // -----------------------------------------------------------------------
  {
    id: 'INST_GROUND_RADAR',
    name: 'Subsurface Sounding Radar (RIMFAX)',
    category: InstrumentCategory.SURFACE_SCANNING,
    dataCollectionRating: 125,
    powerConsumptionRating: 24,
    compatibilityRequirements: {
      minRoverLevel: 2,
      allowedModels: [
        RoverModelType.SCIENTIFIC,
        RoverModelType.HEAVY_UTILITY,
        RoverModelType.ADVANCED_AUTONOMOUS,
      ],
      minPowerWatts: 45,
      slotCost: 1,
    },
    unlockRequirements: {
      techTier: 2,
      researchCost: 90,
    },
    operationalRangeMeters: 100,
    samplingDurationSeconds: 2.5,
    description: 'Ground-penetrating radar antenna transmitting UHF/VHF waves to profile subsurface geological strata, buried boulders, and water ice horizons up to 15m deep.',
  },

  // -----------------------------------------------------------------------
  // 5. GENERAL SCIENTIFIC OBSERVATION EQUIPMENT
  // -----------------------------------------------------------------------
  {
    id: 'INST_SAMPLE_ANALYSIS_LAB',
    name: 'Miniature Internal Wet-Chemistry Laboratory',
    category: InstrumentCategory.GENERAL_OBSERVATION,
    dataCollectionRating: 180,
    powerConsumptionRating: 35,
    compatibilityRequirements: {
      minRoverLevel: 3,
      allowedModels: [
        RoverModelType.SCIENTIFIC,
      ],
      minPowerWatts: 75,
      slotCost: 2,
    },
    unlockRequirements: {
      techTier: 3,
      researchCost: 180,
    },
    operationalRangeMeters: 30,
    samplingDurationSeconds: 5.0,
    description: 'Oven carousel, quadrupole mass spectrometer, and gas chromatograph analyzing pyrolyzed regolith volatiles for organic carbon and amino signatures.',
  },
];
