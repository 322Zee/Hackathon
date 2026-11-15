/**
 * INTERSTELLAR CONTINUUM - Solar System Map & Navigation Domain Contracts
 * Strongly typed definitions for interactive Solar System exploration,
 * hierarchical celestial navigation, multi-criteria filtering, exploration badges,
 * educational telemetry summaries, and cross-system navigation actions.
 */

import {
  DestinationRecord,
  DestinationCategory,
  EnvironmentalClassification,
} from '../DestinationTypes';

/**
 * High-level exploration progression status for celestial destinations
 */
export enum ExplorationStatusBadge {
  /** Locked / inaccessible behind progression requirements */
  LOCKED = 'LOCKED',
  /** Unlocked and accessible, but never visited or surveyed */
  UNEXPLORED = 'UNEXPLORED',
  /** Visited via flyby, orbital survey, or probe arrival */
  VISITED = 'VISITED',
  /** Landed upon with surface rover or crew excursion */
  SURFACE_EXPLORED = 'SURFACE_EXPLORED',
  /** Houses an active, operational planetary research base */
  BASE_ESTABLISHED = 'BASE_ESTABLISHED',
  /** Connected to operational interplanetary communications relay infrastructure */
  COMMS_CONNECTED = 'COMMS_CONNECTED',
}

/**
 * Filter criteria for destination search and tactical map display
 */
export type DestinationStatusFilter =
  | 'ALL'
  | 'UNLOCKED'
  | 'LOCKED'
  | 'VISITED'
  | 'UNEXPLORED'
  | 'ACTIVE_MISSION'
  | 'HAS_BASE'
  | 'HAS_COMMS';

/**
 * Multi-criteria filter options supplied to search and list methods
 */
export interface DestinationFilterOptions {
  /** Text search matching name, shortCode, subtitle, or educational keywords */
  readonly query?: string;
  /** Celestial body category filter */
  readonly category?: DestinationCategory | 'ALL';
  /** Exploration progression status filter */
  readonly status?: DestinationStatusFilter;
  /** Filter only destinations with currently available authored missions */
  readonly hasAvailableMissions?: boolean;
  /** Filter only sub-destinations or moons belonging to a parent body */
  readonly parentDestinationId?: string;
  /** Filter only solid walkable or rover-accessible surfaces */
  readonly solidSurfaceOnly?: boolean;
}

/**
 * Concise, scientifically responsible educational telemetry summary
 */
export interface EducationalDestinationSummary {
  readonly destinationId: string;
  readonly classification: string;
  readonly planetaryRadiusKm: number;
  readonly surfaceGravityG: number;
  readonly atmosphericPressureSummary: string;
  readonly atmosphericComposition: string;
  readonly surfaceTemperatureRange: string;
  readonly dayLengthSummary: string;
  readonly notableMoons: readonly string[];
  readonly majorScientificInterests: readonly string[];
  readonly explorationChallenges: readonly string[];
  readonly funFact: string;
}

/**
 * Tree node representing a celestial body in the Solar System hierarchy
 */
export interface DestinationHierarchyNode {
  readonly destination: DestinationRecord;
  readonly level: number; // 0 for star/planets, 1 for moons/orbital corridors
  readonly parentId?: string;
  readonly children: readonly DestinationHierarchyNode[];
  readonly hasChildren: boolean;
  readonly stats: {
    readonly totalMissions: number;
    readonly availableMissions: number;
    readonly completedMissions: number;
    readonly discoveriesCount: number;
    readonly hasBase: boolean;
    readonly hasComms: boolean;
    readonly statusBadge: ExplorationStatusBadge;
  };
}

/**
 * Comprehensive aggregated navigation summary for a destination
 */
export interface DestinationNavigationSummary {
  readonly destination: DestinationRecord;
  readonly statusBadge: ExplorationStatusBadge;
  readonly isUnlocked: boolean;
  readonly progressPercentage: number;
  readonly availableMissions: readonly any[];
  readonly completedMissions: readonly any[];
  readonly activeMissions: readonly any[];
  readonly knownDiscoveries: readonly any[];
  readonly operationalBases: readonly any[];
  readonly commsCoverageSummary: {
    readonly hasRelay: boolean;
    readonly hasSatellite: boolean;
    readonly coverageScorePercent: number;
    readonly signalRating: string;
  };
  readonly environmentalDifficulty?: {
    readonly temperatureDifficulty: number;
    readonly terrainDifficulty: number;
    readonly visibilityDifficulty: number;
    readonly atmosphericDifficulty: number;
    readonly surfaceAccessibility: number;
    readonly overallHazardLevel: string;
    readonly hazardNotes: readonly string[];
  };
  readonly educationalSummary: EducationalDestinationSummary;
}

/**
 * Global macroscopic telemetry of the entire Solar System exploration frontier
 */
export interface SolarSystemOverviewData {
  readonly centralStar: DestinationRecord;
  readonly primaryPlanets: readonly DestinationRecord[];
  readonly dwarfPlanets: readonly DestinationRecord[];
  readonly asteroidBelt?: DestinationRecord;
  readonly totalDestinationsCount: number;
  readonly unlockedCount: number;
  readonly visitedCount: number;
  readonly surfaceExploredCount: number;
  readonly activeMissionsCount: number;
  readonly operationalBasesCount: number;
  readonly totalScientificDiscoveriesCount: number;
  readonly overallAgencyFrontierPercent: number;
}

/**
 * Types of cross-system routing actions triggered from navigation panels
 */
export type NavigationActionType =
  | 'BROWSE_MISSIONS'
  | 'EXPLORE_SURFACE'
  | 'INSPECT_BASE'
  | 'VIEW_RESEARCH'
  | 'FOCUS_MAP'
  | 'INSPECT_SYSTEM'
  | 'RETURN_OVERVIEW';

/**
 * Request payload for cross-module navigation requests
 */
export interface NavigationActionRequest {
  readonly action: NavigationActionType;
  readonly destinationId: string;
  readonly metadata?: Record<string, any>;
}

