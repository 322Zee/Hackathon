/**
 * INTERSTELLAR CONTINUUM - Destination Hierarchy Engine
 * Manages multi-level Solar System hierarchy (Solar System -> Planetary Systems -> Moons & Orbital Regimes)
 * with breadcrumb path construction, parent-child relations, and aggregated system statistics.
 */

import { DestinationRegistry } from '../DestinationRegistry';
import { DestinationRecord, DestinationId, DestinationCategory } from '../DestinationTypes';
import {
  DestinationHierarchyNode,
  ExplorationStatusBadge,
} from './NavigationTypes';
import { MissionOperationsAdapter } from '../adapters/MissionOperationsAdapter';
import { MissionHistoryAdapter } from '../adapters/MissionHistoryAdapter';
import { PlanetaryBaseAdapter } from '../adapters/PlanetaryBaseAdapter';
import { ScientificDiscoveryAdapter } from '../adapters/ScientificDiscoveryAdapter';
import { CommunicationsNetworkAdapter } from '../adapters/CommunicationsNetworkAdapter';
import { OrganisationProgressionAdapter } from '../adapters/OrganisationProgressionAdapter';

export class DestinationHierarchyEngine {
  private static instance: DestinationHierarchyEngine | null = null;

  private registry: DestinationRegistry;
  private missionOpsAdapter: MissionOperationsAdapter;
  private missionHistoryAdapter: MissionHistoryAdapter;
  private baseAdapter: PlanetaryBaseAdapter;
  private scienceAdapter: ScientificDiscoveryAdapter;
  private commsAdapter: CommunicationsNetworkAdapter;
  private progressionAdapter: OrganisationProgressionAdapter;

  constructor(
    registry?: DestinationRegistry,
    missionOpsAdapter?: MissionOperationsAdapter,
    missionHistoryAdapter?: MissionHistoryAdapter,
    baseAdapter?: PlanetaryBaseAdapter,
    scienceAdapter?: ScientificDiscoveryAdapter,
    commsAdapter?: CommunicationsNetworkAdapter,
    progressionAdapter?: OrganisationProgressionAdapter
  ) {
    this.registry = registry ?? DestinationRegistry.getInstance();
    this.missionOpsAdapter = missionOpsAdapter ?? new MissionOperationsAdapter();
    this.missionHistoryAdapter = missionHistoryAdapter ?? new MissionHistoryAdapter();
    this.baseAdapter = baseAdapter ?? new PlanetaryBaseAdapter();
    this.scienceAdapter = scienceAdapter ?? new ScientificDiscoveryAdapter();
    this.commsAdapter = commsAdapter ?? new CommunicationsNetworkAdapter();
    this.progressionAdapter = progressionAdapter ?? new OrganisationProgressionAdapter(this.registry);
  }

  public static getInstance(): DestinationHierarchyEngine {
    if (!DestinationHierarchyEngine.instance) {
      DestinationHierarchyEngine.instance = new DestinationHierarchyEngine();
    }
    return DestinationHierarchyEngine.instance;
  }

  public static resetInstance(): void {
    DestinationHierarchyEngine.instance = null;
  }

  /**
   * Builds the complete Solar System hierarchy tree starting from the central star (Sol).
   */
  public getHierarchyTree(): DestinationHierarchyNode {
    const sun = this.registry.getDestination(DestinationId.SUN) ?? this.registry.getAllDestinations()[0]!;
    return this.buildNode(sun, 0);
  }

  /**
   * Alias for getHierarchyTree for API compatibility
   */
  public buildHierarchy(): DestinationHierarchyNode {
    return this.getHierarchyTree();
  }

  /**
   * Retrieves a hierarchy node by destination ID.
   */
  public getNode(destinationId: string): DestinationHierarchyNode | undefined {
    const dest = this.registry.getDestination(destinationId);
    if (!dest) return undefined;
    const level = dest.parentId ? 1 : 0;
    return this.buildNode(dest, level);
  }

  /**
   * Returns children records (moons, sub-regions) for a parent celestial body.
   */
  public getChildren(parentId: string): DestinationRecord[] {
    return this.registry.getSubDestinations(parentId);
  }

  /**
   * Returns child hierarchy nodes for a parent celestial body.
   */
  public getChildrenNodes(parentId: string): readonly DestinationHierarchyNode[] {
    const childrenRecords = this.getChildren(parentId);
    return childrenRecords.map((c) => this.buildNode(c, 1));
  }

  /**
   * Returns the immediate parent destination if one exists.
   */
  public getParent(destinationId: string): DestinationRecord | undefined {
    const dest = this.registry.getDestination(destinationId);
    if (!dest || !dest.parentId) return undefined;
    return this.registry.getDestination(dest.parentId);
  }

  /**
   * Checks whether a destination possesses moons or orbital sub-destinations.
   */
  public hasChildren(destinationId: string): boolean {
    const children = this.getChildren(destinationId);
    return children.length > 0;
  }

  /**
   * Constructs navigation breadcrumb path from root down to destination.
   * e.g. [Sol, Jupiter, Europa]
   */
  public getBreadcrumbs(destinationId: string): DestinationRecord[] {
    const path: DestinationRecord[] = [];
    let current = this.registry.getDestination(destinationId);

    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = this.registry.getDestination(current.parentId);
      } else if (current.id !== DestinationId.SUN) {
        const sun = this.registry.getDestination(DestinationId.SUN);
        if (sun) path.unshift(sun);
        break;
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Returns all major planetary systems that contain child moons/orbitals.
   */
  public getPlanetarySystems(): { parent: DestinationRecord; children: DestinationRecord[] }[] {
    const primaryPlanets = this.registry.getPrimaryPlanets();
    const systems: { parent: DestinationRecord; children: DestinationRecord[] }[] = [];

    for (const planet of primaryPlanets) {
      const children = this.getChildren(planet.id);
      if (children.length > 0) {
        systems.push({ parent: planet, children });
      }
    }

    return systems;
  }

  /**
   * Computes the authoritative exploration status badge for a destination.
   */
  public resolveExplorationStatus(destinationId: string): ExplorationStatusBadge {
    const isUnlocked = this.progressionAdapter.isUnlocked(destinationId);
    if (!isUnlocked) {
      return ExplorationStatusBadge.LOCKED;
    }

    const hasBase = this.baseAdapter.hasOperationalBase(destinationId);
    if (hasBase) {
      return ExplorationStatusBadge.BASE_ESTABLISHED;
    }

    const hasSurface = this.missionHistoryAdapter.hasSurfaceLanding(destinationId);
    if (hasSurface) {
      return ExplorationStatusBadge.SURFACE_EXPLORED;
    }

    const hasVisited = this.missionHistoryAdapter.hasBeenVisited(destinationId);
    if (hasVisited) {
      return ExplorationStatusBadge.VISITED;
    }

    const hasComms = this.commsAdapter.hasCommsInfrastructure(destinationId);
    if (hasComms) {
      return ExplorationStatusBadge.COMMS_CONNECTED;
    }

    return ExplorationStatusBadge.UNEXPLORED;
  }

  /**
   * Alias for resolveExplorationStatus
   */
  public getExplorationStatus(destinationId: string): ExplorationStatusBadge {
    return this.resolveExplorationStatus(destinationId);
  }

  private buildNode(dest: DestinationRecord, level: number): DestinationHierarchyNode {
    const childrenRecords = this.registry.getSubDestinations(dest.id);
    const children = childrenRecords.map((c) => this.buildNode(c, level + 1));

    const missions = this.missionOpsAdapter.getMissionsForDestination(dest.id);
    const completed = this.missionHistoryAdapter.getCompletedMissionsForDestination(dest.id);
    const discoveries = this.scienceAdapter.getFindingsForDestination(dest.id);
    const hasBase = this.baseAdapter.hasOperationalBase(dest.id);
    const hasComms = this.commsAdapter.hasCommsInfrastructure(dest.id);

    return {
      destination: dest,
      level,
      parentId: dest.parentId,
      children,
      hasChildren: children.length > 0,
      stats: {
        totalMissions: missions.length,
        availableMissions: missions.filter((m) => m.isAvailable).length,
        completedMissions: completed.length,
        discoveriesCount: discoveries.length,
        hasBase,
        hasComms,
        statusBadge: this.resolveExplorationStatus(dest.id),
      },
    };
  }
}
