/**
 * INTERSTELLAR CONTINUUM - Canonical Research Projects Database
 * Authored modular research projects linking scientific findings to agency progression.
 *
 * NOTE:
 * Research rewards and progress values are abstract game progression metrics.
 */

import {
  ResearchProject,
  ResearchProjectStatus,
  ScientificCategory,
  SCIENTIFIC_DATA_SCHEMA_VERSION,
} from '../ScientificTypes';

export const DEFAULT_RESEARCH_PROJECTS: ResearchProject[] = [
  {
    id: 'PROJ_LUNAR_VOLATILE_UTILIZATION',
    title: 'In-Situ Lunar Volatile Extraction & ISRU',
    description:
      'Synthesize spectroscopic and surface sample data from permanently shadowed lunar craters to engineer scalable thermal extraction techniques for cryogenic water ice and volatile trapped compounds.',
    category: ScientificCategory.ICE_AND_WATER,
    requiredFindingIds: ['FINDING_MOON_WATER_ICE_SHACKLETON'],
    requiredCategoryMinimums: {
      [ScientificCategory.ICE_AND_WATER]: 1,
    },
    progress: 100,
    status: ResearchProjectStatus.COMPLETED,
    unlockableTechIds: ['tech_lunar_isru_harvester', 'tech_closed_loop_life_support'],
    rewards: {
      researchData: 150,
      technologyPoints: 2,
      credits: 250000,
    },
    createdTimestamp: 1714050000000,
    completedTimestamp: 1714150000000,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
  {
    id: 'PROJ_MARTIAN_PALEO_HYDROLOGY',
    title: 'Noachian-Hesperian Paleohydrology & Biosignature Assay',
    description:
      'Correlate sedimentary clastic mudstone stratigraphy and seasonal atmospheric methane observations to reconstruct the paleo-lacustrine history of Jezero Crater and evaluate biosignature preservation targets.',
    category: ScientificCategory.MINERAL_COMPOSITION,
    requiredFindingIds: [
      'FINDING_MARS_JEZERO_PALEO_LAKE_SEDIMENTS',
      'FINDING_MARS_ATMOSPHERIC_METHANE_TRACE',
    ],
    requiredCategoryMinimums: {
      [ScientificCategory.MINERAL_COMPOSITION]: 1,
      [ScientificCategory.ATMOSPHERIC_OBSERVATIONS]: 1,
    },
    progress: 50,
    status: ResearchProjectStatus.IN_PROGRESS,
    unlockableTechIds: ['tech_deep_subsurface_drill', 'tech_xenobiology_containment'],
    rewards: {
      researchData: 300,
      technologyPoints: 4,
      credits: 400000,
    },
    createdTimestamp: 1715150000000,
    completedTimestamp: null,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
  {
    id: 'PROJ_OCEAN_WORLDS_HABITABILITY',
    title: 'Comparative Ocean Worlds & Cryogenic Vent Dynamics',
    description:
      'Contrast induced magnetic field induction data from Europa with direct cryoplume mass spectrometry readings from Enceladus to formulate convective hydrothermal circulation models for outer solar system subterranean oceans.',
    category: ScientificCategory.ICE_AND_WATER,
    requiredFindingIds: [
      'FINDING_EUROPA_SUBSURFACE_BRINE_OCEAN',
      'FINDING_ENCELADUS_CRYOPLUME_HYDROTHERMAL',
    ],
    requiredCategoryMinimums: {
      [ScientificCategory.ICE_AND_WATER]: 2,
    },
    progress: 100,
    status: ResearchProjectStatus.COMPLETED,
    unlockableTechIds: ['tech_subsurface_cryobot', 'tech_autonomous_ocean_probe'],
    rewards: {
      researchData: 500,
      technologyPoints: 6,
      credits: 750000,
    },
    createdTimestamp: 1720150000000,
    completedTimestamp: 1720250000000,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
  {
    id: 'PROJ_EXTREME_ENVIRONMENT_RADIATION_SHIELDING',
    title: 'Deep Space Active Magnetosphere & Radiation Hardening',
    description:
      'Combine Van Allen belt flux maps, Martian surface dosimeter profiles, and Jovian synchrotron electron flux data to design multi-layer electromagnetic deflection and lightweight boron-nitride polymer shielding for interplanetary vessels.',
    category: ScientificCategory.RADIATION_ENVIRONMENT,
    requiredFindingIds: [
      'FINDING_EARTH_VAN_ALLEN_TRAPPED_FLUX',
      'FINDING_MARS_SURFACE_RADIATION_FLUX',
    ],
    requiredCategoryMinimums: {
      [ScientificCategory.RADIATION_ENVIRONMENT]: 2,
    },
    progress: 100,
    status: ResearchProjectStatus.COMPLETED,
    unlockableTechIds: ['tech_active_plasma_shielding', 'tech_rad_hardened_avionics'],
    rewards: {
      researchData: 250,
      technologyPoints: 3,
      credits: 350000,
    },
    createdTimestamp: 1715300000000,
    completedTimestamp: 1715400000000,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
  {
    id: 'PROJ_SUPERCRITICAL_ATMOSPHERE_SURVIVAL',
    title: 'Supercritical Atmospheric Entry & High-Pressure Metallurgy',
    description:
      'Analyze the supercritical CO2 boundary layer and corrosive sulfur aerosol chemistry of Venus to engineer ceramic-matrix composites and high-temperature silicon-carbide microelectronics capable of prolonged surface operations.',
    category: ScientificCategory.ATMOSPHERIC_OBSERVATIONS,
    requiredFindingIds: ['FINDING_VENUS_SUPERCRITICAL_ATMOSPHERE'],
    requiredCategoryMinimums: {
      [ScientificCategory.ATMOSPHERIC_OBSERVATIONS]: 1,
    },
    progress: 100,
    status: ResearchProjectStatus.COMPLETED,
    unlockableTechIds: ['tech_high_pressure_bathysphere', 'tech_silicon_carbide_processors'],
    rewards: {
      researchData: 350,
      technologyPoints: 5,
      credits: 500000,
    },
    createdTimestamp: 1716150000000,
    completedTimestamp: 1716250000000,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
  {
    id: 'PROJ_PRIMORDIAL_NEBULA_ASTEROID_MINING',
    title: 'Asteroid Differentiation & In-Situ Platinum Group Metallurgy',
    description:
      'Synthesize spectral data from differentiated basaltic Vesta, carbonaceous chondrite samples, and Ahuna Mons salt cryovolcanism to establish autonomous small-body orbital refining and volatile extraction methodologies.',
    category: ScientificCategory.ASTEROID_COMPOSITION,
    requiredFindingIds: [
      'FINDING_CERES_AHUNA_MONS_CRYOMAGMA',
      'FINDING_ASTEROID_CARBONACEOUS_CHONDRITE',
    ],
    requiredCategoryMinimums: {
      [ScientificCategory.ASTEROID_COMPOSITION]: 1,
    },
    progress: 100,
    status: ResearchProjectStatus.COMPLETED,
    unlockableTechIds: ['tech_asteroid_harpoon_anchor', 'tech_centrifugal_refinery'],
    rewards: {
      researchData: 400,
      technologyPoints: 5,
      credits: 600000,
    },
    createdTimestamp: 1718250000000,
    completedTimestamp: 1718350000000,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
  {
    id: 'PROJ_OUTER_SYSTEM_CRYOGENIC_DYNAMICS',
    title: 'Cryovolcanic Nitrogen Propulsion & Outer System Meteorology',
    description:
      'Evaluate supersonic jet dynamics from Neptune with Triton nitrogen cryogeyser eruptions and Uranus magnetospheric tilt to formulate navigation models for outer ice giant atmospheric probes.',
    category: ScientificCategory.SURFACE_GEOLOGY,
    requiredFindingIds: ['FINDING_NEPTUNE_DYNAMIC_GREAT_DARK_SPOT'],
    requiredCategoryMinimums: {
      [ScientificCategory.SURFACE_GEOLOGY]: 1,
    },
    progress: 0,
    status: ResearchProjectStatus.NOT_STARTED,
    unlockableTechIds: ['tech_aerocapture_shield', 'tech_radioisotope_stirling_generator'],
    rewards: {
      researchData: 600,
      technologyPoints: 8,
      credits: 900000,
    },
    createdTimestamp: 1722200000000,
    completedTimestamp: null,
    schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
  },
];
