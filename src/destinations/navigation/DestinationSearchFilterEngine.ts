/**
 * INTERSTELLAR CONTINUUM - Destination Search & Filter Engine
 * Multi-criteria search and taxonomy filtering across celestial bodies,
 * orbital regimes, exploration status, and mission opportunities.
 */

import { DestinationRegistry } from '../DestinationRegistry';
import { DestinationRecord, DestinationCategory, SurfaceAvailability } from '../DestinationTypes';
import {
  DestinationFilterOptions,
  ExplorationStatusBadge,
} from './NavigationTypes';
import { DestinationHierarchyEngine } from './DestinationHierarchyEngine';
import { MissionOperationsAdapter } from '../adapters/MissionOperationsAdapter';
import { MissionHistoryAdapter } from '../adapters/MissionHistoryAdapter';
import { PlanetaryBaseAdapter } from '../adapters/PlanetaryBaseAdapter';
import { CommunicationsNetworkAdapter } from '../adapters/CommunicationsNetworkAdapter';
import { OrganisationProgressionAdapter } from '../adapters/OrganisationProgressionAdapter';

export interface FilterStatsSummary {
  readonly total: number;
  readonly unlocked: number;
  readonly locked: number;
  readonly visited: number;
  readonly unexplored: number;
  readonly activeMissions: number;
  readonly hasBase: number;
  readonly hasComms: number;
  readonly matching: number;
}

export class DestinationSearchFilterEngine {
  private static instance: DestinationSearchFilterEngine | null = null;

  private registry: DestinationRegistry;
  private hierarchyEngine: DestinationHierarchyEngine;
  private missionOpsAdapter: MissionOperationsAdapter;
  private missionHistoryAdapter: MissionHistoryAdapter;
  private baseAdapter: PlanetaryBaseAdapter;
  private commsAdapter: CommunicationsNetworkAdapter;
  private progressionAdapter: OrganisationProgressionAdapter;

  constructor(
    registry?: DestinationRegistry,
    hierarchyEngine?: DestinationHierarchyEngine,
    missionOpsAdapter?: MissionOperationsAdapter,
    missionHistoryAdapter?: MissionHistoryAdapter,
    baseAdapter?: PlanetaryBaseAdapter,
    commsAdapter?: CommunicationsNetworkAdapter,
    progressionAdapter?: OrganisationProgressionAdapter
  ) {
    this.registry = registry ?? DestinationRegistry.getInstance();
    this.hierarchyEngine = hierarchyEngine ?? DestinationHierarchyEngine.getInstance();
    this.missionOpsAdapter = missionOpsAdapter ?? new MissionOperationsAdapter();
    this.missionHistoryAdapter = missionHistoryAdapter ?? new MissionHistoryAdapter();
    this.baseAdapter = baseAdapter ?? new PlanetaryBaseAdapter();
    this.commsAdapter = commsAdapter ?? new CommunicationsNetworkAdapter();
    this.progressionAdapter = progressionAdapter ?? new OrganisationProgressionAdapter(this.registry);
  }

  public static getInstance(): DestinationSearchFilterEngine {
    if (!DestinationSearchFilterEngine.instance) {
      DestinationSearchFilterEngine.instance = new DestinationSearchFilterEngine();
    }
    return DestinationSearchFilterEngine.instance;
  }

  public static resetInstance(): void {
    DestinationSearchFilterEngine.instance = null;
  }

  /**
   * Applies multi-criteria filters and text query across all registered destinations.
   */
  public filterDestinations(options: DestinationFilterOptions = {}): DestinationRecord[] {
    let list = this.registry.getAllDestinations();

    // 1. Text Search Query
    if (options.query && options.query.trim().length > 0) {
      const q = options.query.trim().toLowerCase();
      list = list.filter((d: DestinationRecord) => {
        const matchName = d.name.toLowerCase().includes(q);
        const matchCode = d.shortCode.toLowerCase().includes(q);
        const matchSubtitle = d.subtitle.toLowerCase().includes(q);
        const matchCategory = d.category.toLowerCase().includes(q);
        const matchAtmo = d.atmosphericDetails?.compositionSummary.toLowerCase().includes(q) ?? false;
        const matchHazards = d.atmosphericDetails?.hazards.some((h) => h.toLowerCase().includes(q)) ?? false;
        return matchName || matchCode || matchSubtitle || matchCategory || matchAtmo || matchHazards;
      });
    }

    // 2. Category Filter
    if (options.category && options.category !== 'ALL') {
      const cat = options.category;
      if (cat === DestinationCategory.PLANET || (cat as string) === 'PLANET') {
        list = list.filter(
          (d: DestinationRecord) =>
            d.category === DestinationCategory.ROCKY_PLANET ||
            d.category === DestinationCategory.GAS_GIANT ||
            d.category === DestinationCategory.ICE_GIANT ||
            d.category === DestinationCategory.PLANET
        );
      } else if (cat === DestinationCategory.ASTEROID || (cat as string) === 'ASTEROID') {
        list = list.filter(
          (d: DestinationRecord) =>
            d.category === DestinationCategory.ASTEROID_BELT ||
            d.category === DestinationCategory.DWARF_PLANET ||
            d.category === DestinationCategory.ASTEROID
        );
      } else {
        list = list.filter((d: DestinationRecord) => d.category === cat);
      }
    }

    // 3. Parent Destination Filter
    if (options.parentDestinationId) {
      list = list.filter(
        (d: DestinationRecord) =>
          d.parentId === options.parentDestinationId ||
          (d as any).parentBodyId === options.parentDestinationId
      );
    }

    // 4. Solid Surface Only Filter
    if (options.solidSurfaceOnly) {
      list = list.filter((d: DestinationRecord) => d.surfaceAvailability !== SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY);
    }

    // 5. Available Missions Only Filter
    if (options.hasAvailableMissions) {
      list = list.filter((d: DestinationRecord) => this.missionOpsAdapter.getAvailableOpportunitiesCount(d.id) > 0);
    }

    // 6. Exploration Status Filter
    if (options.status && options.status !== 'ALL') {
      switch (options.status) {
        case 'UNLOCKED':
          list = list.filter((d: DestinationRecord) => this.progressionAdapter.isUnlocked(d.id));
          break;
        case 'LOCKED':
          list = list.filter((d: DestinationRecord) => !this.progressionAdapter.isUnlocked(d.id));
          break;
        case 'VISITED':
          list = list.filter((d: DestinationRecord) => this.missionHistoryAdapter.hasBeenVisited(d.id));
          break;
        case 'UNEXPLORED':
          list = list.filter(
            (d: DestinationRecord) =>
              this.progressionAdapter.isUnlocked(d.id) && !this.missionHistoryAdapter.hasBeenVisited(d.id)
          );
          break;
        case 'ACTIVE_MISSION':
          list = list.filter((d: DestinationRecord) => this.missionOpsAdapter.getActiveMissionsForDestination(d.id).length > 0);
          break;
        case 'HAS_BASE':
          list = list.filter((d: DestinationRecord) => this.baseAdapter.hasOperationalBase(d.id));
          break;
        case 'HAS_COMMS':
          list = list.filter((d: DestinationRecord) => this.commsAdapter.hasCommsInfrastructure(d.id));
          break;
      }
    }

    return list;
  }

  /**
   * Alias for filterDestinations
   */
  public filter(options?: DestinationFilterOptions): DestinationRecord[] {
    return this.filterDestinations(options);
  }

  /**
   * Searches destinations by text query and optional filters
   */
  public search(query: string, options?: DestinationFilterOptions): DestinationRecord[] {
    return this.filterDestinations({ ...options, query });
  }

  /**
   * Computes dynamic count statistics across all filtering categories.
   */
  public getFilterStats(currentOptions?: DestinationFilterOptions): FilterStatsSummary {
    const all = this.registry.getAllDestinations();
    const matching = this.filterDestinations(currentOptions ?? {});

    let unlocked = 0;
    let locked = 0;
    let visited = 0;
    let unexplored = 0;
    let activeMissions = 0;
    let hasBase = 0;
    let hasComms = 0;

    for (const d of all) {
      const isUn = this.progressionAdapter.isUnlocked(d.id);
      if (isUn) {
        unlocked++;
        const hasV = this.missionHistoryAdapter.hasBeenVisited(d.id);
        if (hasV) visited++;
        else unexplored++;
      } else {
        locked++;
      }

      if (this.missionOpsAdapter.getActiveMissionsForDestination(d.id).length > 0) {
        activeMissions++;
      }
      if (this.baseAdapter.hasOperationalBase(d.id)) {
        hasBase++;
      }
      if (this.commsAdapter.hasCommsInfrastructure(d.id)) {
        hasComms++;
      }
    }

    return {
      total: all.length,
      unlocked,
      locked,
      visited,
      unexplored,
      activeMissions,
      hasBase,
      hasComms,
      matching: matching.length,
    };
  }

  /**
   * Alias for getFilterStats
   */
  public getStats(currentOptions?: DestinationFilterOptions): FilterStatsSummary {
    return this.getFilterStats(currentOptions);
  }
}
