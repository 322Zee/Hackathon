/**
 * INTERSTELLAR CONTINUUM - Spacecraft & Rocket Vehicle Payload Adapter
 * Establishes an adapter boundary bridging Rocket Engineering (Prompt 21),
 * Spacecraft Laboratory (Prompt 22), and Launch Operations (Prompt 26) into
 * a unified vehicle payload mounting and capacity contract.
 */

import { VehicleCapacity, PayloadCompatibilityTag } from '../PayloadTypes';
import { RocketProject, RocketClassRating } from '../../engineering/RocketProjectTypes';
import { RocketProjectManager } from '../../engineering/RocketProjectManager';

/**
 * Universal Target Vehicle Interface for Payload Mounting
 */
export interface IVehiclePayloadTarget {
  readonly id: string;
  readonly name: string;
  readonly kind: 'ROCKET' | 'SPACECRAFT_PLATFORM' | 'SURFACE_CARRIER' | 'STATION_BERTH';
  readonly capacity: VehicleCapacity;
  isAvailableForMission(): boolean;
}

/**
 * Adapts an authored RocketProject from Rocket Engineering (VAB) into an IVehiclePayloadTarget.
 */
export class RocketProjectPayloadAdapter implements IVehiclePayloadTarget {
  public readonly id: string;
  public readonly name: string;
  public readonly kind = 'ROCKET';
  public readonly capacity: VehicleCapacity;

  private project: RocketProject;

  constructor(project: RocketProject) {
    this.project = project;
    this.id = project.projectId;
    this.name = project.name;

    // Derive fictional payload ratings from rocket design
    const fairingDiameter = project.design.fairingDiameterM || 1.8;
    const maxMassRating = Math.max(25, Math.floor(project.design.maxPayloadCapacityLeoKg / 2)); // Fictional MU rating
    
    // Determine power rating capacity based on vehicle class
    let maxPowerRating = 100;
    let maxStorageSlots = 3;
    const supportedTags: string[] = [PayloadCompatibilityTag.BASIC_VEHICLE];

    if (fairingDiameter >= 1.8) supportedTags.push(PayloadCompatibilityTag.FAIRING_1_8M);
    if (fairingDiameter >= 2.5) supportedTags.push(PayloadCompatibilityTag.FAIRING_2_5M);
    if (fairingDiameter >= 3.8) supportedTags.push(PayloadCompatibilityTag.FAIRING_3_8M);
    if (fairingDiameter >= 5.0) supportedTags.push(PayloadCompatibilityTag.FAIRING_5_0M);

    switch (project.design.classRating) {
      case RocketClassRating.SUBORBITAL_TEST:
        maxPowerRating = 60;
        maxStorageSlots = 2;
        supportedTags.push(PayloadCompatibilityTag.SLOT_SMALL);
        break;

      case RocketClassRating.LIGHT_ORBITAL:
        maxPowerRating = 150;
        maxStorageSlots = 4;
        supportedTags.push(
          PayloadCompatibilityTag.ADVANCED_VEHICLE,
          PayloadCompatibilityTag.SATELLITE_BUS,
          PayloadCompatibilityTag.ORBITAL_SURVEYOR,
          PayloadCompatibilityTag.LEO_CERTIFIED,
          PayloadCompatibilityTag.SLOT_SMALL,
          PayloadCompatibilityTag.SLOT_MEDIUM
        );
        break;

      case RocketClassRating.MEDIUM_FREIGHTER:
        maxPowerRating = 300;
        maxStorageSlots = 8;
        supportedTags.push(
          PayloadCompatibilityTag.ADVANCED_VEHICLE,
          PayloadCompatibilityTag.HEAVY_VEHICLE,
          PayloadCompatibilityTag.SATELLITE_BUS,
          PayloadCompatibilityTag.ORBITAL_SURVEYOR,
          PayloadCompatibilityTag.SURFACE_LANDER,
          PayloadCompatibilityTag.PLANETARY_ROVER,
          PayloadCompatibilityTag.CARGO_BAY,
          PayloadCompatibilityTag.LEO_CERTIFIED,
          PayloadCompatibilityTag.LUNAR_CERTIFIED,
          PayloadCompatibilityTag.SLOT_SMALL,
          PayloadCompatibilityTag.SLOT_MEDIUM,
          PayloadCompatibilityTag.SLOT_LARGE
        );
        break;

      case RocketClassRating.HEAVY_INTERPLANETARY:
      case RocketClassRating.SUPER_HEAVY_CARRIER:
        maxPowerRating = 600;
        maxStorageSlots = 14;
        supportedTags.push(
          PayloadCompatibilityTag.ADVANCED_VEHICLE,
          PayloadCompatibilityTag.HEAVY_VEHICLE,
          PayloadCompatibilityTag.SUPER_HEAVY_VEHICLE,
          PayloadCompatibilityTag.SATELLITE_BUS,
          PayloadCompatibilityTag.ORBITAL_SURVEYOR,
          PayloadCompatibilityTag.SURFACE_LANDER,
          PayloadCompatibilityTag.PLANETARY_ROVER,
          PayloadCompatibilityTag.STATION_HABITAT,
          PayloadCompatibilityTag.CARGO_BAY,
          PayloadCompatibilityTag.LEO_CERTIFIED,
          PayloadCompatibilityTag.LUNAR_CERTIFIED,
          PayloadCompatibilityTag.DEEP_SPACE_CERTIFIED,
          PayloadCompatibilityTag.SLOT_SMALL,
          PayloadCompatibilityTag.SLOT_MEDIUM,
          PayloadCompatibilityTag.SLOT_LARGE
        );
        break;
    }

    this.capacity = {
      vehicleId: project.projectId,
      vehicleName: project.name,
      maxPayloadMassRating: maxMassRating,
      maxPowerRating,
      maxStorageSlots,
      fairingDiameterM: fairingDiameter,
      supportedTags,
    };
  }

  public isAvailableForMission(): boolean {
    return true;
  }

  public getRawProject(): RocketProject {
    return this.project;
  }
}

/**
 * Clean adapter for standalone spacecraft platforms (e.g. Prompt 22 Satellite Bus / Surface Lander).
 */
export class StandaloneSpacecraftPayloadAdapter implements IVehiclePayloadTarget {
  public readonly id: string;
  public readonly name: string;
  public readonly kind = 'SPACECRAFT_PLATFORM';
  public readonly capacity: VehicleCapacity;

  constructor(options: {
    id: string;
    name: string;
    maxPayloadMassRating: number;
    maxPowerRating: number;
    maxStorageSlots: number;
    fairingDiameterM?: number;
    supportedTags?: string[];
  }) {
    this.id = options.id;
    this.name = options.name;
    this.capacity = {
      vehicleId: options.id,
      vehicleName: options.name,
      maxPayloadMassRating: options.maxPayloadMassRating,
      maxPowerRating: options.maxPowerRating,
      maxStorageSlots: options.maxStorageSlots,
      fairingDiameterM: options.fairingDiameterM ?? 2.5,
      supportedTags: options.supportedTags ?? [
        PayloadCompatibilityTag.BASIC_VEHICLE,
        PayloadCompatibilityTag.ADVANCED_VEHICLE,
        PayloadCompatibilityTag.SATELLITE_BUS,
        PayloadCompatibilityTag.LEO_CERTIFIED,
        PayloadCompatibilityTag.SLOT_SMALL,
        PayloadCompatibilityTag.SLOT_MEDIUM,
      ],
    };
  }

  public isAvailableForMission(): boolean {
    return true;
  }
}

/**
 * Vehicle Adapter Registry resolving vehicles across engineering systems.
 */
export class SpacecraftAdapterRegistry {
  private static instance?: SpacecraftAdapterRegistry;
  private customAdapters: Map<string, IVehiclePayloadTarget> = new Map();
  private rocketProjectManager?: RocketProjectManager;

  private constructor(rocketProjectManager?: RocketProjectManager) {
    this.rocketProjectManager = rocketProjectManager;
    this.initializeDefaultSpacecraftPlatforms();
  }

  public static getInstance(
    rocketProjectManager?: RocketProjectManager
  ): SpacecraftAdapterRegistry {
    if (!SpacecraftAdapterRegistry.instance) {
      SpacecraftAdapterRegistry.instance = new SpacecraftAdapterRegistry(
        rocketProjectManager ?? RocketProjectManager.getInstance()
      );
    }
    return SpacecraftAdapterRegistry.instance;
  }

  public static resetInstance(): void {
    SpacecraftAdapterRegistry.instance = undefined;
  }

  /**
   * Registers default starter spacecraft buses and lunar lander platforms.
   */
  private initializeDefaultSpacecraftPlatforms(): void {
    // 1. Pioneer Standard Satellite Bus
    this.registerCustomVehicle(
      new StandaloneSpacecraftPayloadAdapter({
        id: 'platform_sat_bus_standard',
        name: 'Astra-Bus Mk-1 Satellite Platform',
        maxPayloadMassRating: 90,
        maxPowerRating: 80,
        maxStorageSlots: 2,
        fairingDiameterM: 1.8,
        supportedTags: [
          PayloadCompatibilityTag.BASIC_VEHICLE,
          PayloadCompatibilityTag.SATELLITE_BUS,
          PayloadCompatibilityTag.LEO_CERTIFIED,
          PayloadCompatibilityTag.FAIRING_1_8M,
          PayloadCompatibilityTag.SLOT_SMALL,
        ],
      })
    );

    // 2. Heavy Deep-Space Explorer Bus
    this.registerCustomVehicle(
      new StandaloneSpacecraftPayloadAdapter({
        id: 'platform_deepspace_explorer',
        name: 'Chronos Interplanetary Bus Platform',
        maxPayloadMassRating: 220,
        maxPowerRating: 220,
        maxStorageSlots: 5,
        fairingDiameterM: 2.5,
        supportedTags: [
          PayloadCompatibilityTag.ADVANCED_VEHICLE,
          PayloadCompatibilityTag.HEAVY_VEHICLE,
          PayloadCompatibilityTag.SATELLITE_BUS,
          PayloadCompatibilityTag.ORBITAL_SURVEYOR,
          PayloadCompatibilityTag.DEEP_SPACE_CERTIFIED,
          PayloadCompatibilityTag.FAIRING_2_5M,
          PayloadCompatibilityTag.SLOT_SMALL,
          PayloadCompatibilityTag.SLOT_MEDIUM,
        ],
      })
    );

    // 3. Autonomous Planetary Surface Lander
    this.registerCustomVehicle(
      new StandaloneSpacecraftPayloadAdapter({
        id: 'platform_surface_lander_heavy',
        name: 'Artemis Heavy Surface Lander Platform',
        maxPayloadMassRating: 450,
        maxPowerRating: 350,
        maxStorageSlots: 8,
        fairingDiameterM: 3.8,
        supportedTags: [
          PayloadCompatibilityTag.ADVANCED_VEHICLE,
          PayloadCompatibilityTag.HEAVY_VEHICLE,
          PayloadCompatibilityTag.SURFACE_LANDER,
          PayloadCompatibilityTag.PLANETARY_ROVER,
          PayloadCompatibilityTag.LUNAR_CERTIFIED,
          PayloadCompatibilityTag.DEEP_SPACE_CERTIFIED,
          PayloadCompatibilityTag.FAIRING_3_8M,
          PayloadCompatibilityTag.SLOT_SMALL,
          PayloadCompatibilityTag.SLOT_MEDIUM,
          PayloadCompatibilityTag.SLOT_LARGE,
        ],
      })
    );
  }

  public registerCustomVehicle(target: IVehiclePayloadTarget): void {
    this.customAdapters.set(target.id, target);
  }

  /**
   * Resolves a vehicle target by ID, querying custom adapters first, then rocket projects.
   */
  public getVehicle(vehicleId: string): IVehiclePayloadTarget | undefined {
    if (this.customAdapters.has(vehicleId)) {
      return this.customAdapters.get(vehicleId);
    }

    if (this.rocketProjectManager) {
      const proj = this.rocketProjectManager.getProject(vehicleId);
      if (proj) {
        return new RocketProjectPayloadAdapter(proj);
      }
    }

    return undefined;
  }

  /**
   * Lists all available vehicles across platforms and rocket engineering projects.
   */
  public listAllVehicles(): IVehiclePayloadTarget[] {
    const list: IVehiclePayloadTarget[] = Array.from(this.customAdapters.values());

    if (this.rocketProjectManager) {
      const projects = this.rocketProjectManager.getAllProjects();
      for (const p of projects) {
        list.push(new RocketProjectPayloadAdapter(p));
      }
    }

    return list;
  }
}
