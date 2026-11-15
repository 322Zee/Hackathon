/**
 * INTERSTELLAR CONTINUUM - Extensible Payload Category Registry
 * Coordinates canonical and custom payload categories, icon associations,
 * display formatting, and storage type classifications.
 */

import { PayloadCategory, CategoryMetadata } from './PayloadTypes';

export class PayloadCategoryRegistry {
  private static instance?: PayloadCategoryRegistry;
  private categories: Map<string, CategoryMetadata> = new Map();

  private constructor() {
    this.registerDefaultCategories();
  }

  public static getInstance(): PayloadCategoryRegistry {
    if (!PayloadCategoryRegistry.instance) {
      PayloadCategoryRegistry.instance = new PayloadCategoryRegistry();
    }
    return PayloadCategoryRegistry.instance;
  }

  public static resetInstance(): void {
    PayloadCategoryRegistry.instance = undefined;
  }

  /**
   * Registers the 11 canonical baseline categories mandated by project specification.
   */
  private registerDefaultCategories(): void {
    const defaults: CategoryMetadata[] = [
      {
        id: PayloadCategory.COMMUNICATION_SATELLITES,
        displayName: 'Communication Satellites',
        description: 'Orbital transponders, antenna arrays, and high-gain telecom relay systems.',
        iconKey: 'icon_sat_comm',
        defaultStorageType: 'FAIRING_ENCLOSED',
        isCustom: false,
      },
      {
        id: PayloadCategory.OBSERVATION_SATELLITES,
        displayName: 'Observation Satellites',
        description: 'Planetary imaging platforms, atmospheric spectrometers, and environmental sensors.',
        iconKey: 'icon_sat_obs',
        defaultStorageType: 'FAIRING_ENCLOSED',
        isCustom: false,
      },
      {
        id: PayloadCategory.SCIENTIFIC_INSTRUMENTS,
        displayName: 'Scientific Instruments',
        description: 'Magnetometers, radiometers, mass spectrometers, and sub-surface radar sounders.',
        iconKey: 'icon_instrument',
        defaultStorageType: 'INTERNAL_RACK',
        isCustom: false,
      },
      {
        id: PayloadCategory.ROBOTIC_ROVERS,
        displayName: 'Robotic Rovers',
        description: 'Autonomous wheeled and tracked exploration vehicles designed for surface traversal.',
        iconKey: 'icon_rover',
        defaultStorageType: 'EXTERNAL_BAY',
        isCustom: false,
      },
      {
        id: PayloadCategory.LANDING_EQUIPMENT,
        displayName: 'Landing Equipment',
        description: 'Aeroshells, skycranes, descent stages, retro-thruster packs, and shock absorbers.',
        iconKey: 'icon_landing',
        defaultStorageType: 'EXTERNAL_BAY',
        isCustom: false,
      },
      {
        id: PayloadCategory.RESEARCH_STATION_MODULES,
        displayName: 'Research Station Modules',
        description: 'Pressurized laboratories, habitat nodes, hydroponics pods, and microgravity bays.',
        iconKey: 'icon_station_mod',
        defaultStorageType: 'FAIRING_ENCLOSED',
        isCustom: false,
      },
      {
        id: PayloadCategory.POWER_MODULES,
        displayName: 'Power Modules',
        description: 'Deployable photovoltaic arrays, surface fission reactors, and fuel cell banks.',
        iconKey: 'icon_power_mod',
        defaultStorageType: 'INTERNAL_RACK',
        isCustom: false,
      },
      {
        id: PayloadCategory.COMMUNICATIONS_RELAY_MODULES,
        displayName: 'Communications Relay Modules',
        description: 'Deep-space optical transceivers, halo-orbit relay buoys, and inter-satellite links.',
        iconKey: 'icon_relay_mod',
        defaultStorageType: 'FAIRING_ENCLOSED',
        isCustom: false,
      },
      {
        id: PayloadCategory.MANUFACTURING_MODULES,
        displayName: 'Manufacturing Modules',
        description: 'In-situ regolith sintering printers, catalytic propellant synthesis plants, and refineries.',
        iconKey: 'icon_mfg_mod',
        defaultStorageType: 'EXTERNAL_BAY',
        isCustom: false,
      },
      {
        id: PayloadCategory.MAINTENANCE_SUPPLIES,
        displayName: 'Maintenance Supplies',
        description: 'RCS thruster spares, thermal radiator loops, electrical harnesses, and heatshield tiles.',
        iconKey: 'icon_supplies',
        defaultStorageType: 'INTERNAL_RACK',
        isCustom: false,
      },
      {
        id: PayloadCategory.GENERAL_CARGO,
        displayName: 'General Cargo',
        description: 'Life support consumables, raw construction structural alloys, and expedition provisions.',
        iconKey: 'icon_cargo',
        defaultStorageType: 'INTERNAL_RACK',
        isCustom: false,
      },
    ];

    for (const cat of defaults) {
      this.categories.set(cat.id, cat);
    }
  }

  /**
   * Registers a new or custom payload category dynamically.
   */
  public registerCategory(metadata: CategoryMetadata): boolean {
    if (!metadata.id || !metadata.displayName) {
      return false;
    }
    this.categories.set(metadata.id, {
      ...metadata,
      isCustom: metadata.isCustom ?? true,
    });
    return true;
  }

  /**
   * Unregisters a custom category (canonical categories cannot be removed).
   */
  public unregisterCategory(categoryId: string): boolean {
    const existing = this.categories.get(categoryId);
    if (!existing || !existing.isCustom) {
      return false;
    }
    return this.categories.delete(categoryId);
  }

  public getCategory(categoryId: string): CategoryMetadata | undefined {
    return this.categories.get(categoryId);
  }

  public hasCategory(categoryId: string): boolean {
    return this.categories.has(categoryId);
  }

  public isStandardCategory(categoryId: string): boolean {
    return Object.values(PayloadCategory).includes(categoryId as PayloadCategory);
  }

  public getAllCategories(): CategoryMetadata[] {
    return Array.from(this.categories.values());
  }

  public getCategoryDisplayName(categoryId: string): string {
    return this.categories.get(categoryId)?.displayName ?? categoryId;
  }
}
