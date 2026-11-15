/**
 * INTERSTELLAR CONTINUUM - Planetary Environment Adapter
 * Clean adapter translating environmental topology, obstacles, POIs, and boundaries
 * without modifying or duplicating external environment generators.
 */

import {
  ExplorationBoundary,
  PointOfInterest,
  ScientificDiscoveryLocation,
  SurfaceObstacle,
  TerrainType,
  Vector2D,
} from '../ExplorationTypes';
import {
  DEFAULT_EXPLORATION_SECTORS,
  PlanetaryExplorationSectorData,
} from '../data/DefaultExplorationObjectives';

export interface IPlanetaryEnvironmentProvider {
  getBoundary(destinationId: string): ExplorationBoundary;
  getTerrainTypeAt(destinationId: string, location: Vector2D): TerrainType;
  getTerrainDifficulty(destinationId: string, location: Vector2D): number;
  isLocationAccessible(destinationId: string, location: Vector2D): boolean;
  getObstacles(destinationId: string): SurfaceObstacle[];
  getPointsOfInterest(destinationId: string): PointOfInterest[];
  getScientificLocations(destinationId: string): ScientificDiscoveryLocation[];
  getLandingSite(destinationId: string): Vector2D;
}

export class PlanetaryEnvironmentAdapter implements IPlanetaryEnvironmentProvider {
  private sectors: Map<string, PlanetaryExplorationSectorData> = new Map();
  private customObstacles: Map<string, SurfaceObstacle[]> = new Map();

  constructor() {
    // Load default sectors
    for (const [key, sector] of Object.entries(DEFAULT_EXPLORATION_SECTORS)) {
      // Clone sector to avoid mutating defaults
      this.sectors.set(key, JSON.parse(JSON.stringify(sector)));
    }
  }

  public registerCustomSector(sector: PlanetaryExplorationSectorData): void {
    this.sectors.set(sector.destinationId, sector);
  }

  public getSector(destinationId: string): PlanetaryExplorationSectorData | undefined {
    return this.sectors.get(destinationId) || this.sectors.get('DEST_MARS'); // Mars as safe fallback
  }

  public getBoundary(destinationId: string): ExplorationBoundary {
    const sector = this.getSector(destinationId);
    return sector ? sector.boundary : { minX: 0, maxX: 3000, minY: 0, maxY: 2000 };
  }

  public getLandingSite(destinationId: string): Vector2D {
    const sector = this.getSector(destinationId);
    return sector ? sector.landingSite : { x: 500, y: 500 };
  }

  public getTerrainTypeAt(destinationId: string, location: Vector2D): TerrainType {
    const sector = this.getSector(destinationId);
    if (!sector) return TerrainType.SMOOTH_PLAINS;

    // Deterministic procedural terrain variations based on coordinates
    const seed = (Math.sin(location.x * 0.002) + Math.cos(location.y * 0.002)) * 0.5 + 0.5;
    if (seed > 0.85) return TerrainType.HAZARDOUS_FISSURE;
    if (seed > 0.65) return TerrainType.CRATER_SLOPES;
    if (seed > 0.40) return TerrainType.ROCKY_CRAGS;
    if (seed > 0.20) return TerrainType.REGOLITH_DUNES;
    return sector.baseTerrain;
  }

  public getTerrainDifficulty(destinationId: string, location: Vector2D): number {
    const terrain = this.getTerrainTypeAt(destinationId, location);
    switch (terrain) {
      case TerrainType.SMOOTH_PLAINS:
        return 1.0;
      case TerrainType.REGOLITH_DUNES:
        return 1.25;
      case TerrainType.ROCKY_CRAGS:
        return 1.5;
      case TerrainType.CRYOGENIC_ICE:
        return 1.35;
      case TerrainType.CRATER_SLOPES:
        return 1.8;
      case TerrainType.HAZARDOUS_FISSURE:
        return 2.5; // High strain terrain
      default:
        return 1.0;
    }
  }

  public isLocationAccessible(destinationId: string, location: Vector2D): boolean {
    const boundary = this.getBoundary(destinationId);
    if (
      location.x < boundary.minX + 20 ||
      location.x > boundary.maxX - 20 ||
      location.y < boundary.minY + 20 ||
      location.y > boundary.maxY - 20
    ) {
      return false; // Out of boundary
    }

    // Check collision with solid impassable obstacles
    const obstacles = this.getObstacles(destinationId);
    for (const obs of obstacles) {
      const dist = Math.hypot(location.x - obs.x, location.y - obs.y);
      if (dist < obs.radius + 15) {
        return false;
      }
    }

    // Hazardous fissures are restricted zones
    const terrain = this.getTerrainTypeAt(destinationId, location);
    if (terrain === TerrainType.HAZARDOUS_FISSURE) {
      // Impassable deep crevasse zone
      return false;
    }

    return true;
  }

  public getObstacles(destinationId: string): SurfaceObstacle[] {
    const sector = this.getSector(destinationId);
    const defaults = sector ? sector.obstacles : [];
    const custom = this.customObstacles.get(destinationId) || [];
    return [...defaults, ...custom];
  }

  public addObstacle(destinationId: string, obstacle: SurfaceObstacle): void {
    if (!this.customObstacles.has(destinationId)) {
      this.customObstacles.set(destinationId, []);
    }
    this.customObstacles.get(destinationId)!.push(obstacle);
  }

  public getPointsOfInterest(destinationId: string): PointOfInterest[] {
    const sector = this.getSector(destinationId);
    return sector ? sector.pointsOfInterest : [];
  }

  public getScientificLocations(destinationId: string): ScientificDiscoveryLocation[] {
    const sector = this.getSector(destinationId);
    return sector ? sector.scientificLocations : [];
  }
}
