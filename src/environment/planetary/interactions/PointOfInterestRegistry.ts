/**
 * INTERSTELLAR CONTINUUM - Point of Interest Registry
 * Manages scientific, geological, landing, rover, and base deployment POIs
 * with spatial querying, discovery tracking, and reward analytics.
 */

import {
  PointOfInterest,
  POIDiscoveryStatus,
} from '../PlanetaryEnvironmentTypes';

export class PointOfInterestRegistry {
  private pois: Map<string, PointOfInterest> = new Map();

  /**
   * Registers a batch of points of interest for an environment.
   */
  public registerPOIs(pois: readonly PointOfInterest[]): void {
    for (const poi of pois) {
      // Store a shallow clone to permit mutable discovery tracking
      this.pois.set(poi.id, { ...poi });
    }
  }

  /**
   * Retrieves a point of interest by its ID.
   */
  public getPOI(poiId: string): PointOfInterest | undefined {
    return this.pois.get(poiId);
  }

  /**
   * Retrieves all POIs, optionally filtered by destination ID.
   */
  public getPOIsForDestination(destinationId?: string): PointOfInterest[] {
    const all = Array.from(this.pois.values());
    if (!destinationId) return all;
    return all.filter((p) => p.destinationId === destinationId);
  }

  /**
   * Spatial query returning POIs within interaction radius of target coordinates.
   */
  public findPOIsInRadius(
    x: number,
    y: number,
    radius: number,
    destinationId?: string
  ): PointOfInterest[] {
    const list = this.getPOIsForDestination(destinationId);
    return list.filter((poi) => {
      const dx = poi.position.x - x;
      const dy = poi.position.y - y;
      const distSq = dx * dx + dy * dy;
      const combinedRadius = radius + poi.radius;
      return distSq <= combinedRadius * combinedRadius;
    });
  }

  /**
   * Updates discovery state for a POI and returns whether newly discovered.
   */
  public discoverPOI(poiId: string): { newlyDiscovered: boolean; poi?: PointOfInterest } {
    const poi = this.pois.get(poiId);
    if (!poi) return { newlyDiscovered: false };

    if (poi.discoveryStatus === POIDiscoveryStatus.UNDISCOVERED) {
      poi.discoveryStatus = POIDiscoveryStatus.DISCOVERED;
      return { newlyDiscovered: true, poi };
    }

    return { newlyDiscovered: false, poi };
  }

  /**
   * Analyzes an already discovered POI, unlocking scientific value.
   */
  public analyzePOI(poiId: string): { success: boolean; poi?: PointOfInterest; scienceEarned: number } {
    const poi = this.pois.get(poiId);
    if (!poi) return { success: false, scienceEarned: 0 };

    if (poi.discoveryStatus === POIDiscoveryStatus.DISCOVERED) {
      poi.discoveryStatus = POIDiscoveryStatus.ANALYZED;
      return { success: true, poi, scienceEarned: poi.scienceReward };
    }

    return { success: false, poi, scienceEarned: 0 };
  }

  /**
   * Returns discovery statistics for a destination.
   */
  public getStats(destinationId?: string): { total: number; discovered: number; analyzed: number } {
    const list = this.getPOIsForDestination(destinationId);
    let discovered = 0;
    let analyzed = 0;

    for (const p of list) {
      if (p.discoveryStatus === POIDiscoveryStatus.DISCOVERED) discovered++;
      else if (p.discoveryStatus === POIDiscoveryStatus.ANALYZED) {
        discovered++;
        analyzed++;
      }
    }

    return { total: list.length, discovered, analyzed };
  }

  /**
   * Clears registry.
   */
  public clear(): void {
    this.pois.clear();
  }
}
