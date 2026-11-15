/**
 * INTERSTELLAR CONTINUUM - Scientific Data Collection & Research Foundation
 * Authoritative data contracts, enums, and interfaces for the scientific data system.
 *
 * NOTE ON SCIENTIFIC ACCURACY:
 * Descriptions in this module are educational summaries. Game-specific discovery
 * values (quality ratings, research values) are abstract gameplay parameters
 * and should not be interpreted as real scientific measurements.
 */

import { DestinationId } from '../destinations/DestinationTypes';

// ─── Scientific Categories ─────────────────────────────────────────────────────

/**
 * Ten canonical scientific disciplines supported by the data system.
 */
export enum ScientificCategory {
  SURFACE_GEOLOGY = 'SURFACE_GEOLOGY',
  ATMOSPHERIC_OBSERVATIONS = 'ATMOSPHERIC_OBSERVATIONS',
  MINERAL_COMPOSITION = 'MINERAL_COMPOSITION',
  ENVIRONMENTAL_MEASUREMENTS = 'ENVIRONMENTAL_MEASUREMENTS',
  MAGNETIC_FIELD_OBSERVATIONS = 'MAGNETIC_FIELD_OBSERVATIONS',
  ICE_AND_WATER = 'ICE_AND_WATER',
  ASTEROID_COMPOSITION = 'ASTEROID_COMPOSITION',
  PLANETARY_IMAGING = 'PLANETARY_IMAGING',
  RADIATION_ENVIRONMENT = 'RADIATION_ENVIRONMENT',
  GENERAL_ASTRONOMICAL = 'GENERAL_ASTRONOMICAL',
}

/**
 * Human-readable labels for each scientific category.
 */
export const SCIENTIFIC_CATEGORY_LABELS: Record<ScientificCategory, string> = {
  [ScientificCategory.SURFACE_GEOLOGY]: 'Surface Geology',
  [ScientificCategory.ATMOSPHERIC_OBSERVATIONS]: 'Atmospheric Observations',
  [ScientificCategory.MINERAL_COMPOSITION]: 'Mineral Composition',
  [ScientificCategory.ENVIRONMENTAL_MEASUREMENTS]: 'Environmental Measurements',
  [ScientificCategory.MAGNETIC_FIELD_OBSERVATIONS]: 'Magnetic Field Observations',
  [ScientificCategory.ICE_AND_WATER]: 'Ice & Water Observations',
  [ScientificCategory.ASTEROID_COMPOSITION]: 'Asteroid Composition',
  [ScientificCategory.PLANETARY_IMAGING]: 'Planetary Imaging',
  [ScientificCategory.RADIATION_ENVIRONMENT]: 'Radiation Environment',
  [ScientificCategory.GENERAL_ASTRONOMICAL]: 'General Astronomical Observations',
};

/**
 * Brief educational descriptions for each category.
 */
export const SCIENTIFIC_CATEGORY_DESCRIPTIONS: Record<ScientificCategory, string> = {
  [ScientificCategory.SURFACE_GEOLOGY]:
    'Study of landforms, rock formations, crater morphology, and tectonic features on planetary surfaces.',
  [ScientificCategory.ATMOSPHERIC_OBSERVATIONS]:
    'Analysis of atmospheric composition, pressure profiles, wind patterns, and weather phenomena.',
  [ScientificCategory.MINERAL_COMPOSITION]:
    'Identification and classification of minerals, ores, and chemical compounds in surface and subsurface samples.',
  [ScientificCategory.ENVIRONMENTAL_MEASUREMENTS]:
    'Recording of temperature, pressure, humidity, and other ambient conditions at exploration sites.',
  [ScientificCategory.MAGNETIC_FIELD_OBSERVATIONS]:
    'Measurement and mapping of magnetic field strength, orientation, and magnetosphere characteristics.',
  [ScientificCategory.ICE_AND_WATER]:
    'Detection and analysis of water ice deposits, subsurface oceans, and hydrological features.',
  [ScientificCategory.ASTEROID_COMPOSITION]:
    'Study of small-body mineralogy, spectral classification, structural integrity, and volatile content.',
  [ScientificCategory.PLANETARY_IMAGING]:
    'High-resolution imaging of planetary surfaces, cloud formations, ring systems, and orbital features.',
  [ScientificCategory.RADIATION_ENVIRONMENT]:
    'Measurement of radiation flux, charged particle density, and shielding requirements.',
  [ScientificCategory.GENERAL_ASTRONOMICAL]:
    'Broad astronomical observations including stellar measurements, gravitational surveys, and deep-space phenomena.',
};

// ─── Data Quality & Analysis ────────────────────────────────────────────────────

/**
 * Abstract quality rating for collected scientific data.
 * Higher quality findings yield greater research value.
 */
export enum DataQualityRating {
  PRELIMINARY = 'PRELIMINARY',
  STANDARD = 'STANDARD',
  HIGH_QUALITY = 'HIGH_QUALITY',
  EXCEPTIONAL = 'EXCEPTIONAL',
}

/**
 * Abstract numeric multipliers for data quality (gameplay values, not real measurements).
 */
export const DATA_QUALITY_MULTIPLIERS: Record<DataQualityRating, number> = {
  [DataQualityRating.PRELIMINARY]: 0.5,
  [DataQualityRating.STANDARD]: 1.0,
  [DataQualityRating.HIGH_QUALITY]: 1.5,
  [DataQualityRating.EXCEPTIONAL]: 2.0,
};

/**
 * Analysis status tracks the progression of a scientific finding through review.
 */
export enum AnalysisStatus {
  UNANALYSED = 'UNANALYSED',
  IN_PROGRESS = 'IN_PROGRESS',
  ANALYSED = 'ANALYSED',
  VERIFIED = 'VERIFIED',
}

/**
 * The type of collection source that produced the finding.
 */
export enum CollectionSource {
  ORBITAL_SURVEY = 'ORBITAL_SURVEY',
  ATMOSPHERIC_PROBE = 'ATMOSPHERIC_PROBE',
  SURFACE_LANDER = 'SURFACE_LANDER',
  SURFACE_ROVER = 'SURFACE_ROVER',
  SAMPLE_RETURN = 'SAMPLE_RETURN',
  DEEP_CORE_DRILL = 'DEEP_CORE_DRILL',
  SUBMERSIBLE_PROBE = 'SUBMERSIBLE_PROBE',
  TELESCOPE_OBSERVATION = 'TELESCOPE_OBSERVATION',
  CREWED_EXPEDITION = 'CREWED_EXPEDITION',
  AUTOMATED_STATION = 'AUTOMATED_STATION',
}

// ─── Scientific Finding Record ──────────────────────────────────────────────────

/**
 * A single scientific discovery or data record collected from an exploration mission.
 */
export interface ScientificFinding {
  /** Unique identifier for this finding (UUID format). */
  id: string;

  /** Human-readable name of the discovery. */
  name: string;

  /** The destination where this finding was collected. */
  destinationId: DestinationId;

  /** Scientific discipline category. */
  category: ScientificCategory;

  /** Educational description of what was found. */
  description: string;

  /** How this data was collected. */
  collectionSource: CollectionSource;

  /** The mission that produced this finding. */
  missionId: string;

  /** Timestamp of when the finding was registered (epoch ms). */
  collectionTimestamp: number;

  /** Abstract quality rating. */
  dataQuality: DataQualityRating;

  /** Abstract research value (gameplay points, not real measurements). */
  researchValue: number;

  /** Current analysis status. */
  analysisStatus: AnalysisStatus;

  /** Abstract analysis progress (0 to 100). */
  analysisProgress: number;

  /** Optional unlock requirements to access this finding. */
  unlockRequirements?: string[];

  /** IDs of related findings that provide cross-referencing context. */
  relatedFindingIds: string[];

  /** Optional visual/asset reference key. */
  visualAssetKey?: string;

  /** Whether this is based on established science vs fictional game discovery. */
  isEstablishedScience: boolean;

  /** Schema version for migration support. */
  schemaVersion: number;
}

// ─── Collection Conditions ──────────────────────────────────────────────────────

/**
 * Metadata about the conditions under which data was collected.
 */
export interface CollectionConditions {
  /** Signal quality at time of collection (0–100). */
  signalQuality: number;

  /** Instrument fidelity at time of collection (0–100). */
  instrumentFidelity: number;

  /** Environmental hazard level at collection site. */
  hazardLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

  /** Duration of data collection window in game-hours. */
  collectionDurationHours: number;

  /** Optional notes about collection circumstances. */
  notes?: string;
}

// ─── Finding Registration Request ───────────────────────────────────────────────

/**
 * Input contract for registering a new scientific finding.
 * Used by future exploration modules (rover, lander, orbital survey, etc.)
 */
export interface FindingRegistrationRequest {
  /** Human-readable name of the discovery. */
  name: string;

  /** Destination where data was collected. */
  destinationId: DestinationId;

  /** Scientific category. */
  category: ScientificCategory;

  /** Educational description. */
  description: string;

  /** Collection method. */
  collectionSource: CollectionSource;

  /** The mission that produced this finding. */
  missionId: string;

  /** Initial data quality. */
  dataQuality?: DataQualityRating;

  /** Initial abstract research value. */
  researchValue?: number;

  /** Optional unlock requirements. */
  unlockRequirements?: string[];

  /** IDs of related findings. */
  relatedFindingIds?: string[];

  /** Optional visual asset key. */
  visualAssetKey?: string;

  /** Whether based on established science. Defaults to false (game discovery). */
  isEstablishedScience?: boolean;

  /** Optional collection conditions metadata. */
  conditions?: CollectionConditions;
}

// ─── Research Project Types ─────────────────────────────────────────────────────

/**
 * Status of a research project.
 */
export enum ResearchProjectStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

/**
 * A research project that requires specific scientific findings to complete.
 */
export interface ResearchProject {
  /** Unique identifier for the research project. */
  id: string;

  /** Human-readable title. */
  title: string;

  /** Description of the research goal. */
  description: string;

  /** Scientific category this research falls under. */
  category: ScientificCategory;

  /** IDs of required scientific findings (must be ANALYSED or VERIFIED). */
  requiredFindingIds: string[];

  /** Optional: minimum number of findings from specified categories. */
  requiredCategoryMinimums?: Partial<Record<ScientificCategory, number>>;

  /** Current progress (0 to 100). */
  progress: number;

  /** Current status. */
  status: ResearchProjectStatus;

  /** Technology references that completing this project may unlock. */
  unlockableTechIds: string[];

  /** Abstract rewards for completing the project. */
  rewards: ResearchProjectRewards;

  /** When the project was created (epoch ms). */
  createdTimestamp: number;

  /** When the project was completed (epoch ms), or null. */
  completedTimestamp: number | null;

  /** Schema version for migration support. */
  schemaVersion: number;
}

/**
 * Rewards granted upon research project completion.
 */
export interface ResearchProjectRewards {
  /** Research data points granted. */
  researchData: number;

  /** Technology points granted. */
  technologyPoints: number;

  /** Credits granted. */
  credits: number;
}

/**
 * Request to create a new research project.
 */
export interface ResearchProjectCreationRequest {
  /** Human-readable title. */
  title: string;

  /** Description. */
  description: string;

  /** Category. */
  category: ScientificCategory;

  /** Required finding IDs. */
  requiredFindingIds?: string[];

  /** Category minimums. */
  requiredCategoryMinimums?: Partial<Record<ScientificCategory, number>>;

  /** Unlockable tech IDs. */
  unlockableTechIds?: string[];

  /** Rewards. */
  rewards?: Partial<ResearchProjectRewards>;
}

// ─── Research Overview ──────────────────────────────────────────────────────────

/**
 * Summary view of overall research progress across all categories.
 */
export interface ResearchOverview {
  /** Total findings collected. */
  totalFindings: number;

  /** Findings by analysis status. */
  findingsByStatus: Record<AnalysisStatus, number>;

  /** Findings by category. */
  findingsByCategory: Record<ScientificCategory, number>;

  /** Findings by destination. */
  findingsByDestination: Partial<Record<DestinationId, number>>;

  /** Total research projects. */
  totalProjects: number;

  /** Projects by status. */
  projectsByStatus: Record<ResearchProjectStatus, number>;

  /** Overall research completion percentage (0–100). */
  overallProgress: number;
}

// ─── Serializable State ─────────────────────────────────────────────────────────

/**
 * Complete serializable state for save/load.
 */
export interface ScientificDataSaveState {
  schemaVersion: number;
  findings: ScientificFinding[];
  collectionConditions: Record<string, CollectionConditions>;
  researchProjects: ResearchProject[];
}

/** Current schema version for the scientific data save state. */
export const SCIENTIFIC_DATA_SCHEMA_VERSION = 1;
