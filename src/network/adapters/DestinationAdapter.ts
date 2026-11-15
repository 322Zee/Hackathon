/**
 * INTERSTELLAR CONTINUUM - Destination Network Adapter
 * Translates celestial destination parameters, distance tiers, and communication
 * profiles from the DestinationRegistry into abstract network requirements.
 */

import { DestinationRegistry } from '../../destinations/DestinationRegistry';
import { DestinationId } from '../../destinations/DestinationTypes';

export enum DistanceTier {
  EARTH_ORBIT = 'EARTH_ORBIT',
  LUNAR = 'LUNAR',
  INNER_SYSTEM = 'INNER_SYSTEM',
  MARS = 'MARS',
  ASTEROID_BELT = 'ASTEROID_BELT',
  JOVIAN = 'JOVIAN',
  OUTER_SYSTEM = 'OUTER_SYSTEM',
}

export interface DestinationNetworkProfile {
  destinationId: string;
  name: string;
  parentId?: string;
  distanceTier: DistanceTier;
  baseLatencySeconds: number;
  relayRequirement: 'DIRECT_LINE_OF_SIGHT' | 'EARTH_GROUND_STATION' | 'ORBITAL_RELAY_CONSTELLATION' | 'DEEP_SPACE_NETWORK_ARRAY';
  blackoutRisks: string[];
}

export class DestinationAdapter {
  private destinationRegistry?: DestinationRegistry;

  constructor(destinationRegistry?: DestinationRegistry) {
    this.destinationRegistry = destinationRegistry;
  }

  public setDestinationRegistry(registry?: DestinationRegistry): void {
    this.destinationRegistry = registry;
  }

  public getDestinationProfile(destinationId: string): DestinationNetworkProfile {
    if (this.destinationRegistry) {
      const dest = this.destinationRegistry.getDestination(destinationId);
      if (dest) {
        return {
          destinationId: dest.id,
          name: dest.name,
          parentId: dest.parentId,
          distanceTier: this.resolveDistanceTier(dest.id, dest.parentId),
          baseLatencySeconds: dest.communication?.oneWayLatencySeconds ?? this.fallbackLatency(dest.id),
          relayRequirement: dest.communication?.relayRequirement ?? 'DIRECT_LINE_OF_SIGHT',
          blackoutRisks: dest.communication?.blackoutRisks ?? [],
        };
      }
    }

    // Authored fallback definitions
    return this.getFallbackProfile(destinationId);
  }

  private resolveDistanceTier(id: string, parentId?: string): DistanceTier {
    if (id === DestinationId.EARTH || id === DestinationId.EARTH_ORBIT_LEO ||
        id === DestinationId.EARTH_ORBIT_MEO || id === DestinationId.EARTH_ORBIT_GEO ||
        id === DestinationId.EARTH_ORBIT_HEO) {
      return DistanceTier.EARTH_ORBIT;
    }
    if (id === DestinationId.MOON || parentId === DestinationId.MOON) {
      return DistanceTier.LUNAR;
    }
    if (id === DestinationId.MERCURY || id === DestinationId.VENUS || id === DestinationId.SUN) {
      return DistanceTier.INNER_SYSTEM;
    }
    if (id === DestinationId.MARS || id === DestinationId.PHOBOS || id === DestinationId.DEIMOS || parentId === DestinationId.MARS) {
      return DistanceTier.MARS;
    }
    if (id === DestinationId.ASTEROID_BELT || id === DestinationId.CERES || id === DestinationId.VESTA) {
      return DistanceTier.ASTEROID_BELT;
    }
    if (id === DestinationId.JUPITER || id === DestinationId.EUROPA || id === DestinationId.IO ||
        id === DestinationId.GANYMEDE || id === DestinationId.CALLISTO || parentId === DestinationId.JUPITER) {
      return DistanceTier.JOVIAN;
    }
    return DistanceTier.OUTER_SYSTEM;
  }

  private fallbackLatency(destinationId: string): number {
    switch (destinationId) {
      case DestinationId.EARTH:
      case DestinationId.EARTH_ORBIT_LEO:
        return 0.03;
      case DestinationId.EARTH_ORBIT_MEO:
        return 0.12;
      case DestinationId.EARTH_ORBIT_GEO:
        return 0.24;
      case DestinationId.MOON:
        return 1.28;
      case DestinationId.MARS:
        return 780; // ~13 mins
      case DestinationId.MERCURY:
        return 350;
      case DestinationId.VENUS:
        return 260;
      case DestinationId.CERES:
      case DestinationId.ASTEROID_BELT:
        return 1600;
      case DestinationId.JUPITER:
      case DestinationId.EUROPA:
        return 2600;
      case DestinationId.SATURN:
      case DestinationId.TITAN:
        return 4800;
      case DestinationId.URANUS:
        return 9600;
      case DestinationId.NEPTUNE:
        return 14400;
      case DestinationId.PLUTO:
        return 18000;
      default:
        return 1.0;
    }
  }

  private getFallbackProfile(destinationId: string): DestinationNetworkProfile {
    return {
      destinationId,
      name: destinationId,
      distanceTier: this.resolveDistanceTier(destinationId),
      baseLatencySeconds: this.fallbackLatency(destinationId),
      relayRequirement: destinationId === DestinationId.EARTH_ORBIT_LEO ? 'EARTH_GROUND_STATION' : 'DEEP_SPACE_NETWORK_ARRAY',
      blackoutRisks: ['Solar Conjunction', 'Interplanetary Path Loss'],
    };
  }
}

