/**
 * INTERSTELLAR CONTINUUM - Solar System Navigation Manager
 * Central singleton orchestrator coordinating hierarchical celestial browsing,
 * dynamic search & filtering, real-time subsystem state aggregation (missions, bases,
 * scientific data, communications, progression, environments), and event dispatching.
 */

import {
  DestinationRecord,
  DestinationCategory,
} from '../DestinationTypes';
import { DestinationRegistry } from '../DestinationRegistry';
import {
  ExplorationStatusBadge,
  DestinationFilterOptions,
  DestinationHierarchyNode,
  DestinationNavigationSummary,
  SolarSystemOverviewData,
  NavigationActionRequest,
} from './NavigationTypes';
import {
  NAVIGATION_EVENTS,
  NavigationEventMap,
} from './NavigationEvents';
import { DestinationHierarchyEngine } from './DestinationHierarchyEngine';
import { DestinationSearchFilterEngine } from './DestinationSearchFilterEngine';
import { EducationalContentProvider } from './EducationalContentProvider';
import {
  MissionOperationsAdapter,
  MissionHistoryAdapter,
  PlanetaryEnvironmentAdapter,
  PlanetaryBaseAdapter,
  ScientificDiscoveryAdapter,
  OrganisationProgressionAdapter,
  CommunicationsNetworkAdapter,
} from '../adapters';

export class SolarSystemNavigationManager {
  private static instance: SolarSystemNavigationManager | null = null;

  private readonly registry: DestinationRegistry;
  private readonly hierarchyEngine: DestinationHierarchyEngine;
  private readonly filterEngine: DestinationSearchFilterEngine;
  private readonly educationalProvider: EducationalContentProvider;

  // Subsystem adapters
  private readonly missionOpsAdapter: MissionOperationsAdapter;
  private readonly missionHistoryAdapter: MissionHistoryAdapter;
  private readonly envAdapter: PlanetaryEnvironmentAdapter;
  private readonly baseAdapter: PlanetaryBaseAdapter;
  private readonly scienceAdapter: ScientificDiscoveryAdapter;
  private readonly progressionAdapter: OrganisationProgressionAdapter;
  private readonly commsAdapter: CommunicationsNetworkAdapter;

  private selectedDestinationId: string | null = null;
  private inspectedSystemId: string | null = null;
  private readonly eventListeners: Map<string, Set<(payload: any) => void>> = new Map();

  private constructor() {
    this.registry = DestinationRegistry.getInstance();
    this.hierarchyEngine = DestinationHierarchyEngine.getInstance();
    this.filterEngine = DestinationSearchFilterEngine.getInstance();
    this.educationalProvider = EducationalContentProvider.getInstance();

    this.missionOpsAdapter = new MissionOperationsAdapter();
    this.missionHistoryAdapter = new MissionHistoryAdapter();
    this.envAdapter = new PlanetaryEnvironmentAdapter();
    this.baseAdapter = new PlanetaryBaseAdapter();
    this.scienceAdapter = new ScientificDiscoveryAdapter();
    this.progressionAdapter = new OrganisationProgressionAdapter();
    this.commsAdapter = new CommunicationsNetworkAdapter();
  }

  public static getInstance(): SolarSystemNavigationManager {
    if (!SolarSystemNavigationManager.instance) {
      SolarSystemNavigationManager.instance = new SolarSystemNavigationManager();
    }
    return SolarSystemNavigationManager.instance;
  }

  public static resetInstance(): void {
    if (SolarSystemNavigationManager.instance) {
      SolarSystemNavigationManager.instance.eventListeners.clear();
      SolarSystemNavigationManager.instance = null;
    }
    DestinationHierarchyEngine.resetInstance();
    DestinationSearchFilterEngine.resetInstance();
    EducationalContentProvider.resetInstance();
  }

  /**
   * Retrieves high-level Solar System overview telemetry
   */
  public getSolarSystemOverview(): SolarSystemOverviewData {
    const all = this.registry.getAllDestinations();
    const centralStar = this.registry.getDestination('dest-sun') ?? all[0]!;

    const primaryPlanets = all.filter(
      (d) =>
        d.category === DestinationCategory.PLANET ||
        d.category === DestinationCategory.ROCKY_PLANET ||
        d.category === DestinationCategory.GAS_GIANT ||
        d.category === DestinationCategory.ICE_GIANT
    );
    const dwarfPlanets = all.filter(
      (d) => d.category === DestinationCategory.DWARF_PLANET
    );
    const asteroidBelt = this.registry.getDestination('dest-asteroid-belt');

    let unlockedCount = 0;
    let visitedCount = 0;
    let surfaceExploredCount = 0;
    let activeMissionsCount = 0;
    let operationalBasesCount = 0;
    let totalScientificDiscoveriesCount = 0;

    for (const d of all) {
      const isUnlocked = this.progressionAdapter.isUnlocked(d.id);
      if (isUnlocked) unlockedCount++;

      const isVisited = this.missionHistoryAdapter.isDestinationVisited(d.id);
      if (isVisited) visitedCount++;

      const status = this.getDestinationExplorationStatus(d.id);
      if (
        status === ExplorationStatusBadge.SURFACE_EXPLORED ||
        status === ExplorationStatusBadge.BASE_ESTABLISHED
      ) {
        surfaceExploredCount++;
      }

      if (this.missionOpsAdapter.hasActiveMission(d.id)) {
        activeMissionsCount++;
      }

      if (this.baseAdapter.hasOperationalBase(d.id)) {
        operationalBasesCount++;
      }

      totalScientificDiscoveriesCount += this.scienceAdapter.getDiscoveriesCount(d.id);
    }

    const frontierRatio = all.length > 0 ? (visitedCount / all.length) * 100 : 0;
    const overallAgencyFrontierPercent = Math.min(100, Math.round(frontierRatio));

    return {
      centralStar,
      primaryPlanets,
      dwarfPlanets,
      asteroidBelt,
      totalDestinationsCount: all.length,
      unlockedCount,
      visitedCount,
      surfaceExploredCount,
      activeMissionsCount,
      operationalBasesCount,
      totalScientificDiscoveriesCount,
      overallAgencyFrontierPercent,
    };
  }

  /**
   * Lists celestial destinations filtered by multi-criteria options
   */
  public listDestinations(options?: DestinationFilterOptions): DestinationRecord[] {
    return this.filterEngine.filter(options);
  }

  /**
   * Retrieves a destination record by ID
   */
  public getDestination(id: string): DestinationRecord | undefined {
    return this.registry.getDestination(id);
  }

  /**
   * Retrieves destination hierarchy node
   */
  public getDestinationHierarchy(id?: string): DestinationHierarchyNode {
    if (id) {
      const node = this.hierarchyEngine.getNode(id);
      if (node) return node;
    }
    return this.hierarchyEngine.buildHierarchy();
  }

  /**
   * Searches destinations by textual query and optional filters
   */
  public searchDestinations(
    query: string,
    options?: DestinationFilterOptions
  ): DestinationRecord[] {
    return this.filterEngine.search(query, options);
  }

  /**
   * Retrieves unlock and progression state for a destination
   */
  public getDestinationProgress(id: string): {
    state: string;
    percentage: number;
    unmetConditions: string[];
  } {
    return this.progressionAdapter.getProgress(id);
  }

  /**
   * Retrieves all destinations currently unlocked and accessible
   */
  public getAvailableDestinations(): DestinationRecord[] {
    return this.progressionAdapter.getUnlockedDestinations();
  }

  /**
   * Selects a destination and dispatches selection event
   */
  public setSelectedDestination(id: string | null): void {
    this.selectedDestinationId = id;
    if (id) {
      const dest = this.getDestination(id);
      if (dest) {
        const badge = this.getDestinationExplorationStatus(id);
        this.emit(NAVIGATION_EVENTS.DESTINATION_SELECTED, {
          destinationId: id,
          destination: dest,
          statusBadge: badge,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Returns current selected destination ID
   */
  public getSelectedDestinationId(): string | null {
    return this.selectedDestinationId;
  }

  /**
   * Returns current selected destination record
   */
  public getSelectedDestination(): DestinationRecord | null {
    if (!this.selectedDestinationId) return null;
    return this.getDestination(this.selectedDestinationId) ?? null;
  }

  /**
   * Returns current inspected planetary system ID
   */
  public getInspectedSystemId(): string | null {
    return this.inspectedSystemId;
  }

  /**
   * Sets inspected planetary system and dispatches SYSTEM_INSPECTED event
   */
  public inspectSystem(parentDestinationId: string | null): void {
    this.inspectedSystemId = parentDestinationId;
    if (parentDestinationId) {
      const parent = this.getDestination(parentDestinationId);
      if (parent) {
        const children = this.hierarchyEngine.getChildren(parentDestinationId);
        this.emit(NAVIGATION_EVENTS.SYSTEM_INSPECTED, {
          parentDestinationId,
          parentDestination: parent,
          children,
          timestamp: Date.now(),
        });
      }
    } else {
      this.emit(NAVIGATION_EVENTS.RETURNED_TO_OVERVIEW, {
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Resolves exploration status badge from live subsystem adapters
   */
  public getDestinationExplorationStatus(id: string): ExplorationStatusBadge {
    return this.hierarchyEngine.getExplorationStatus(id);
  }

  /**
   * Retrieves authored and dynamic mission opportunities for a destination
   */
  public getDestinationMissionOpportunities(id: string): any[] {
    return this.missionOpsAdapter.getAllMissionOpportunities(id);
  }

  /**
   * Aggregates complete navigation summary for detailed destination view
   */
  public getDestinationSummary(id: string): DestinationNavigationSummary | undefined {
    const destination = this.getDestination(id);
    if (!destination) return undefined;

    const statusBadge = this.getDestinationExplorationStatus(id);
    const isUnlocked = this.progressionAdapter.isUnlocked(id);
    const progress = this.progressionAdapter.getProgress(id);

    const availableMissions = this.missionOpsAdapter.getAvailableMissions(id);
    const activeMissions = this.missionOpsAdapter.getActiveMissions(id);
    const completedMissions = this.missionHistoryAdapter.getCompletedMissions(id);
    const knownDiscoveries = this.scienceAdapter.getDiscoveries(id);
    const operationalBases = this.baseAdapter.getBases(id);
    const commsCoverage = this.commsAdapter.getCoverage(id);
    const environmentalDifficulty = this.envAdapter.getEnvironmentalDifficulty(id);
    const educationalSummary = this.educationalProvider.getSummary(id);

    return {
      destination,
      statusBadge,
      isUnlocked,
      progressPercentage: progress.percentage,
      availableMissions,
      completedMissions,
      activeMissions,
      knownDiscoveries,
      operationalBases,
      commsCoverageSummary: {
        hasRelay: commsCoverage.hasRelay,
        hasSatellite: commsCoverage.hasSatellite,
        coverageScorePercent: commsCoverage.coverageScorePercent,
        signalRating: commsCoverage.signalRating,
      },
      environmentalDifficulty: environmentalDifficulty
        ? {
            temperatureDifficulty: environmentalDifficulty.temperatureDifficulty,
            terrainDifficulty: environmentalDifficulty.terrainDifficulty,
            visibilityDifficulty: environmentalDifficulty.visibilityDifficulty,
            atmosphericDifficulty: environmentalDifficulty.atmosphericDifficulty,
            surfaceAccessibility: environmentalDifficulty.surfaceAccessibility,
            overallHazardLevel: environmentalDifficulty.overallHazardLevel,
            hazardNotes: environmentalDifficulty.hazardNotes,
          }
        : undefined,
      educationalSummary,
    };
  }

  /**
   * Triggers a cross-system navigation action request
   */
  public triggerNavigationAction(request: NavigationActionRequest): void {
    this.emit(NAVIGATION_EVENTS.ACTION_TRIGGERED, {
      request,
      timestamp: Date.now(),
    });

    switch (request.action) {
      case 'FOCUS_MAP':
        this.emit(NAVIGATION_EVENTS.DESTINATION_FOCUSED, {
          destinationId: request.destinationId,
          zoomLevel: (request.metadata?.['zoomLevel'] as number) ?? 1.8,
          timestamp: Date.now(),
        });
        break;

      case 'INSPECT_SYSTEM':
        this.inspectSystem(request.destinationId);
        break;

      case 'RETURN_OVERVIEW':
        this.inspectSystem(null);
        break;

      default:
        // Other actions (BROWSE_MISSIONS, EXPLORE_SURFACE, etc.) are consumed by listeners
        break;
    }
  }

  /**
   * Event subscription
   */
  public on<E extends keyof NavigationEventMap>(
    event: E,
    handler: (payload: NavigationEventMap[E]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    const handlers = this.eventListeners.get(event)!;
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }

  /**
   * Unsubscribe from events
   */
  public off<E extends keyof NavigationEventMap>(
    event: E,
    handler: (payload: NavigationEventMap[E]) => void
  ): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Dispatches typed navigation event
   */
  public emit<E extends keyof NavigationEventMap>(
    event: E,
    payload: NavigationEventMap[E]
  ): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`Error in navigation event handler for ${event}:`, err);
        }
      }
    }
  }
}
