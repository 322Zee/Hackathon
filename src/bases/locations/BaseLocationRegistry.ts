/**
 * INTERSTELLAR CONTINUUM - Base Location Registry
 * Authoritative catalogue for planetary base candidate locations.
 */

import { DestinationId } from '../../destinations/DestinationTypes';
import { BaseLocationCandidate } from '../BaseTypes';
import { DEFAULT_BASE_LOCATIONS } from './DefaultBaseLocations';

export class BaseLocationRegistry {
  private static instance?: BaseLocationRegistry;
  private locations: Map<string, BaseLocationCandidate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  public static getInstance(): BaseLocationRegistry {
    if (!BaseLocationRegistry.instance) {
      BaseLocationRegistry.instance = new BaseLocationRegistry();
    }
    return BaseLocationRegistry.instance;
  }

  public static resetInstance(): void {
    BaseLocationRegistry.instance = undefined;
  }

  private registerDefaults(): void {
    for (const loc of DEFAULT_BASE_LOCATIONS) {
      this.locations.set(loc.id, { ...loc });
    }
  }

  public registerLocation(loc: BaseLocationCandidate): void {
    if (!loc.id || !loc.destinationId || !loc.name) {
      throw new Error('Invalid location: missing id, destinationId, or name.');
    }
    this.locations.set(loc.id, { ...loc });
  }

  public getLocation(id: string): BaseLocationCandidate | undefined {
    const loc = this.locations.get(id);
    return loc ? { ...loc } : undefined;
  }

  public getLocationsByDestination(destinationId: DestinationId): BaseLocationCandidate[] {
    return Array.from(this.locations.values())
      .filter((l) => l.destinationId === destinationId)
      .map((l) => ({ ...l }));
  }

  public listAllLocations(): BaseLocationCandidate[] {
    return Array.from(this.locations.values()).map((l) => ({ ...l }));
  }
}
