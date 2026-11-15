/**
 * INTERSTELLAR CONTINUUM - Authoritative Central Destination Registry
 * Single authoritative source of truth for all celestial bodies, planetary environments,
 * surface availability validation, environment loading configurations, and progression states.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import {
  DestinationId,
  DestinationRecord,
  DestinationCategory,
  EnvironmentalClassification,
  SurfaceAvailability,
  DestinationUnlockState,
  DiscoveryStatus,
  ExplorationStatus,
  SurfaceAccessEvaluation,
  EnvironmentLoadConfig,
  EnvironmentLoadType,
  DestinationProgressionStatus,
} from './DestinationTypes';
import { INITIAL_DESTINATION_RECORDS } from './DestinationData';
import { DestinationProgressionManager, ProgressionContext } from './DestinationProgressionManager';

export class DestinationRegistry {
  private static instance?: DestinationRegistry;
  private destinations: Map<string, DestinationRecord> = new Map();
  private eventBus?: EventBus;
  private progressionManager: DestinationProgressionManager;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.progressionManager = DestinationProgressionManager.getInstance();
    this.initializeDefaults();
  }

  public static getInstance(eventBus?: EventBus): DestinationRegistry {
    if (!DestinationRegistry.instance) {
      DestinationRegistry.instance = new DestinationRegistry(eventBus);
    } else if (eventBus && !DestinationRegistry.instance.eventBus) {
      DestinationRegistry.instance.setEventBus(eventBus);
    }
    return DestinationRegistry.instance;
  }

  public static resetInstance(): void {
    if (DestinationRegistry.instance) {
      DestinationRegistry.instance.reset();
      DestinationRegistry.instance = undefined;
    }
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  /**
   * Resets registry to initial master configuration.
   */
  public reset(): void {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    this.destinations.clear();
    for (const record of Object.values(INITIAL_DESTINATION_RECORDS)) {
      // Deep clone to prevent accidental reference mutation
      this.destinations.set(record.id, JSON.parse(JSON.stringify(record)));
    }
    Logger.info(
      'DESTINATION_REGISTRY',
      `Destination Registry initialized with ${this.destinations.size} registered bodies.`
    );
  }

  /**
   * Allows registering new or custom celestial bodies dynamically
   * without restructuring or rewriting the destination engine.
   */
  public registerDestination(record: DestinationRecord): void {
    if (!record.id || !record.name) {
      throw new Error(`Invalid destination record: ID and name are required.`);
    }
    this.destinations.set(record.id, JSON.parse(JSON.stringify(record)));
    Logger.info('DESTINATION_REGISTRY', `Dynamically registered destination: ${record.name} (${record.id})`);
  }

  public getDestination(id: string): DestinationRecord | undefined {
    return this.destinations.get(id);
  }

  public getAllDestinations(): DestinationRecord[] {
    return Array.from(this.destinations.values());
  }

  /**
   * Returns primary Solar System bodies ordered by schematic orbit distance from Sun.
   */
  public getPrimaryPlanets(): DestinationRecord[] {
    const primaryIds: DestinationId[] = [
      DestinationId.SUN,
      DestinationId.MERCURY,
      DestinationId.VENUS,
      DestinationId.EARTH,
      DestinationId.MARS,
      DestinationId.ASTEROID_BELT,
      DestinationId.JUPITER,
      DestinationId.SATURN,
      DestinationId.URANUS,
      DestinationId.NEPTUNE,
    ];

    return primaryIds
      .map((id) => this.destinations.get(id))
      .filter((d): d is DestinationRecord => Boolean(d));
  }

  /**
   * Returns natural satellites associated with a given parent celestial body.
   */
  public getMoonsForParent(parentId: string): DestinationRecord[] {
    return Array.from(this.destinations.values()).filter(
      (d) => d.parentId === parentId && d.category === DestinationCategory.NATURAL_SATELLITE
    );
  }

  /**
   * Returns the 4 Earth orbital regions (LEO, MEO, GEO, HEO).
   */
  public getEarthOrbitalRegions(): DestinationRecord[] {
    const orbitalIds: DestinationId[] = [
      DestinationId.EARTH_ORBIT_LEO,
      DestinationId.EARTH_ORBIT_MEO,
      DestinationId.EARTH_ORBIT_GEO,
      DestinationId.EARTH_ORBIT_HEO,
    ];

    return orbitalIds
      .map((id) => this.destinations.get(id))
      .filter((d): d is DestinationRecord => Boolean(d));
  }

  /**
   * Returns destinations filtered by category.
   */
  public getDestinationsByCategory(category: DestinationCategory): DestinationRecord[] {
    return Array.from(this.destinations.values()).filter((d) => d.category === category);
  }

  /**
   * Returns destinations filtered by environmental classification.
   */
  public getDestinationsByEnvironment(environment: EnvironmentalClassification): DestinationRecord[] {
    return Array.from(this.destinations.values()).filter((d) => d.environment === environment);
  }

  /**
   * Verifies whether a destination is currently accessible/unlocked.
   */
  public isUnlocked(id: string): boolean {
    const dest = this.destinations.get(id);
    if (!dest) return false;
    return (
      dest.defaultUnlockState === DestinationUnlockState.UNLOCKED ||
      dest.defaultUnlockState === DestinationUnlockState.AVAILABLE ||
      dest.defaultUnlockState === DestinationUnlockState.UNDER_EXPLORATION ||
      dest.defaultUnlockState === DestinationUnlockState.FULLY_EXPLORED
    );
  }

  /**
   * Explicitly unlocks a locked destination and dispatches typed domain event.
   */
  public unlockDestination(id: string): boolean {
    const dest = this.destinations.get(id);
    if (!dest) return false;

    if (!this.isUnlocked(id)) {
      dest.defaultUnlockState = DestinationUnlockState.AVAILABLE;
      dest.discoveryStatus = DiscoveryStatus.SURVEYED;
      Logger.info('DESTINATION_REGISTRY', `Unlocked destination: ${dest.name} (${dest.id})`);
      if (this.eventBus) {
        this.eventBus.emit('destination:unlocked' as any, {
          destinationId: dest.id,
          name: dest.name,
        });
      }
      return true;
    }
    return false;
  }

  /**
   * Locks a destination for progression control.
   */
  public lockDestination(id: string): boolean {
    const dest = this.destinations.get(id);
    if (!dest) return false;

    dest.defaultUnlockState = DestinationUnlockState.LOCKED;
    return true;
  }

  /**
   * Evaluates progression requirements against current or custom agency context.
   */
  public evaluateProgression(
    id: string,
    customContext?: Partial<ProgressionContext>
  ): DestinationProgressionStatus | undefined {
    const dest = this.destinations.get(id);
    if (!dest) return undefined;
    return this.progressionManager.evaluateDestination(dest, customContext);
  }

  /**
   * Safely checks whether surface access is permitted for a destination,
   * protecting against invalid open-world exploration on gas/ice giants, stars, or orbital zones.
   */
  public canAccessSurface(id: string): SurfaceAccessEvaluation {
    const dest = this.destinations.get(id);
    if (!dest) {
      return {
        allowed: false,
        surfaceAvailability: SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY,
        requiresSpecializedEquipment: false,
        equipmentNeeded: [],
        rejectionReason: `Destination "${id}" not found in registry.`,
      };
    }

    switch (dest.surfaceAvailability) {
      case SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY:
        return {
          allowed: false,
          surfaceAvailability: dest.surfaceAvailability,
          requiresSpecializedEquipment: false,
          equipmentNeeded: [],
          rejectionReason: `${dest.name} does not possess a conventional solid surface. Direct surface descent prohibited; orbital observation or atmospheric probe profiles only.`,
        };

      case SurfaceAvailability.HAZARDOUS_SURFACE_SPECIALIZED_ONLY: {
        const equipment: string[] = [];
        let maxHours: number | undefined;

        if (dest.id === DestinationId.VENUS) {
          equipment.push('Supercritical Pressure Hull (92 Bar Rating)', 'Active Refrigeration Heat Shield');
          maxHours = 2.0; // Limited duration lander survival window
        } else if (dest.id === DestinationId.MERCURY) {
          equipment.push('Thermal Multi-Layer Insulation', 'Direct Solar Radiation Hardening');
        } else if (dest.id === DestinationId.TITAN) {
          equipment.push('Cryogenic Buoyancy Hull', 'Methane-Proof Hydrocarbon Seals');
        } else if (dest.id === DestinationId.EUROPA || dest.id === DestinationId.ENCELADUS) {
          equipment.push('Ice Surface Thermal Drill / Penetrator', 'Jovian Radiation Vault');
        } else if (dest.id === DestinationId.IO) {
          equipment.push('Volcanic Ejecta Armor', 'Lethal Radiation Hardening');
        }

        return {
          allowed: true,
          surfaceAvailability: dest.surfaceAvailability,
          requiresSpecializedEquipment: true,
          equipmentNeeded: equipment,
          maxOperatingHours: maxHours,
        };
      }

      case SurfaceAvailability.SMALL_BODY_MICROGRAVITY:
        return {
          allowed: true,
          surfaceAvailability: dest.surfaceAvailability,
          requiresSpecializedEquipment: true,
          equipmentNeeded: [
            'Microgravity Anchoring Harpoon / Cold-Gas Thrusters',
            'Regolith Surface Touch-and-Go Sampler',
          ],
        };

      case SurfaceAvailability.WALKABLE_SURFACE:
      default:
        return {
          allowed: true,
          surfaceAvailability: dest.surfaceAvailability,
          requiresSpecializedEquipment: false,
          equipmentNeeded: [],
        };
    }
  }

  /**
   * Resolves the environment loading configuration for future gameplay scenes
   * (Orbital, Planetary Surface, Atmospheric Descent, Asteroid Surface, Lunar Surface).
   */
  public getEnvironmentLoadConfig(id: string): EnvironmentLoadConfig {
    const dest = this.destinations.get(id);
    if (!dest) {
      throw new Error(`Cannot generate environment config for unknown destination: ${id}`);
    }

    let envType: EnvironmentLoadType = EnvironmentLoadType.PLANETARY_SURFACE;
    let safeSpawnAltitude = 100;
    let canRover = false;
    let canCrew = false;
    const surfaceEval = this.canAccessSurface(id);

    if (dest.category === DestinationCategory.ORBITAL_REGION) {
      envType = EnvironmentLoadType.ORBITAL_SPACE;
      safeSpawnAltitude = dest.physicalCharacteristics.altitudeKmMin ?? 400;
      canCrew = true;
    } else if (
      dest.category === DestinationCategory.GAS_GIANT ||
      dest.category === DestinationCategory.ICE_GIANT ||
      dest.category === DestinationCategory.STAR
    ) {
      envType = EnvironmentLoadType.ATMOSPHERIC_DESCENT;
      safeSpawnAltitude = 250;
    } else if (
      dest.category === DestinationCategory.ASTEROID_BELT ||
      dest.category === DestinationCategory.DWARF_PLANET ||
      dest.surfaceAvailability === SurfaceAvailability.SMALL_BODY_MICROGRAVITY
    ) {
      envType = EnvironmentLoadType.ASTEROID_SURFACE;
      safeSpawnAltitude = 10;
    } else if (dest.id === DestinationId.MOON) {
      envType = EnvironmentLoadType.LUNAR_SURFACE;
      safeSpawnAltitude = 15;
      canRover = true;
      canCrew = true;
    } else if (dest.id === DestinationId.MARS) {
      envType = EnvironmentLoadType.PLANETARY_SURFACE;
      safeSpawnAltitude = 20;
      canRover = true;
      canCrew = true;
    } else if (dest.id === DestinationId.EARTH) {
      envType = EnvironmentLoadType.HEADQUARTERS_CAMPUS;
      safeSpawnAltitude = 0;
      canRover = false;
      canCrew = true;
    } else if (dest.surfaceAvailability === SurfaceAvailability.WALKABLE_SURFACE) {
      envType = EnvironmentLoadType.PLANETARY_SURFACE;
      safeSpawnAltitude = 25;
      canRover = true;
    }

    return {
      destinationId: dest.id,
      environmentType: envType,
      surfaceAvailability: dest.surfaceAvailability,
      canDeployRover: canRover,
      canDeployCrew: canCrew,
      requiresSpecializedEquipment: surfaceEval.requiresSpecializedEquipment,
      equipmentNeeded: surfaceEval.equipmentNeeded,
      gravityG: dest.physicalCharacteristics.surfaceGravityG ?? 1.0,
      atmosphereDensity: dest.atmosphericDetails?.surfacePressureAtm ?? 0.0,
      surfacePressureAtm: dest.atmosphericDetails?.surfacePressureAtm ?? 0.0,
      safeSpawnAltitudeKm: safeSpawnAltitude,
      skyboxKey: `skybox_${dest.shortCode.toLowerCase()}`,
    };
  }

  public recordMissionAvailability(id: string, available: number, completed: number): void {
    const dest = this.destinations.get(id);
    if (!dest) return;
    dest.availableMissionsCount = available;
    dest.completedMissionsCount = completed;
  }

  public setDiscoveryStatus(id: string, status: DiscoveryStatus): void {
    const dest = this.destinations.get(id);
    if (!dest) return;
    dest.discoveryStatus = status;
  }

  public setExplorationStatus(id: string, status: ExplorationStatus): void {
    const dest = this.destinations.get(id);
    if (!dest) return;
    dest.explorationStatus = status;
  }
}
