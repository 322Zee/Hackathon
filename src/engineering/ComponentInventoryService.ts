/**
 * INTERSTELLAR CONTINUUM - Component Inventory & Procurement Service
 * Manages player component inventory quantities, installation tracking across
 * rocket projects, and Mission Credits transactions via EconomyService.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { ServiceLocator } from '../core/ServiceLocator';
import { EconomyService } from '../services/EconomyService';
import { RocketComponentRegistry } from './RocketComponentRegistry';
import {
  ComponentInventoryItem,
  ComponentPurchaseResult,
  ComponentAvailabilityState,
} from './RocketComponentTypes';

export interface ComponentInventorySaveData {
  inventory: Record<string, ComponentInventoryItem>;
}

export class ComponentInventoryService {
  private static instance?: ComponentInventoryService;
  private eventBus?: EventBus;
  private registry: RocketComponentRegistry;
  private economyService?: EconomyService;

  private inventory: Map<string, ComponentInventoryItem> = new Map();

  private constructor(
    eventBus?: EventBus,
    registry?: RocketComponentRegistry,
    economyService?: EconomyService
  ) {
    this.eventBus = eventBus;
    this.registry = registry ?? RocketComponentRegistry.getInstance(eventBus);
    this.economyService = economyService;

    this.initializeDefaultInventory();
  }

  public static getInstance(
    eventBus?: EventBus,
    registry?: RocketComponentRegistry,
    economyService?: EconomyService
  ): ComponentInventoryService {
    if (!ComponentInventoryService.instance) {
      ComponentInventoryService.instance = new ComponentInventoryService(
        eventBus,
        registry,
        economyService
      );
    }
    return ComponentInventoryService.instance;
  }

  public static resetInstance(): void {
    ComponentInventoryService.instance = undefined;
  }

  /**
   * Initializes starter inventory with baseline quantities of Tier-1 standard components.
   */
  private initializeDefaultInventory(): void {
    const starterComponentIds = [
      'struct_main_core_alpha',
      'struct_upper_truss_beta',
      'struct_stage_connector_ring',
      'struct_separation_pneumatic',
      'struct_payload_support_skirt',
      'prop_basic_booster_mk1',
      'prop_upper_vacuum_nozzle',
      'fuel_standard_cell_100',
      'guid_basic_inertial_unit',
      'power_basic_battery_bank',
      'payload_basic_satellite_bus',
      'fairing_standard_biconic_2m',
      'comm_basic_omni_beacon',
      'safety_separation_monitor',
      'safety_flight_termination_sys',
    ];

    for (const comp of this.registry.getAllComponents()) {
      const isStarter = starterComponentIds.includes(comp.id);
      this.inventory.set(comp.id, {
        componentId: comp.id,
        ownedQuantity: isStarter ? 2 : 0,
        installedQuantity: 0,
        reservedQuantity: 0,
        installedInProjects: [],
      });
    }

    Logger.info(
      'COMPONENT_INVENTORY_SERVICE',
      `Component inventory initialized with ${this.inventory.size} items.`
    );
  }

  private resolveEconomyService(): EconomyService | undefined {
    if (this.economyService) return this.economyService;
    if (ServiceLocator.has('EconomyService')) {
      this.economyService = ServiceLocator.get<EconomyService>('EconomyService');
      return this.economyService;
    }
    return undefined;
  }

  // =========================================================================
  // PURCHASING & ECONOMY INTEGRATION
  // =========================================================================

  public purchaseComponent(componentId: string, quantity: number = 1): ComponentPurchaseResult {
    const comp = this.registry.getComponent(componentId);
    if (!comp) {
      return {
        success: false,
        componentId,
        creditsSpent: 0,
        remainingCredits: 0,
        newOwnedQuantity: 0,
        errorMessage: `Component "${componentId}" not found in central registry.`,
      };
    }

    if (quantity <= 0) {
      return {
        success: false,
        componentId,
        creditsSpent: 0,
        remainingCredits: 0,
        newOwnedQuantity: this.getOwnedQuantity(componentId),
        errorMessage: 'Quantity to purchase must be at least 1.',
      };
    }

    const econ = this.resolveEconomyService();
    const currentCredits = econ ? econ.getCredits() : 999999;
    const totalCost = comp.costCredits * quantity;

    // 1. Verify Availability
    const availability = this.registry.evaluateAvailability(componentId, {
      playerCredits: currentCredits,
    });

    if (
      availability.state === ComponentAvailabilityState.RESEARCH_REQUIRED ||
      availability.state === ComponentAvailabilityState.LOCKED ||
      availability.state === ComponentAvailabilityState.MANUFACTURING_REQUIRED
    ) {
      return {
        success: false,
        componentId,
        creditsSpent: 0,
        remainingCredits: currentCredits,
        newOwnedQuantity: this.getOwnedQuantity(componentId),
        errorMessage: `Cannot purchase: ${availability.reason}`,
      };
    }

    // 2. Verify Credit Affordability
    if (currentCredits < totalCost) {
      return {
        success: false,
        componentId,
        creditsSpent: 0,
        remainingCredits: currentCredits,
        newOwnedQuantity: this.getOwnedQuantity(componentId),
        errorMessage: `Insufficient Mission Credits. Required: ₵${totalCost.toLocaleString()} | Available: ₵${currentCredits.toLocaleString()}`,
      };
    }

    // 3. Deduct Credits via EconomyService
    if (econ) {
      const spendSuccess = econ.spend({ credits: totalCost });
      if (!spendSuccess) {
        return {
          success: false,
          componentId,
          creditsSpent: 0,
          remainingCredits: econ.getCredits(),
          newOwnedQuantity: this.getOwnedQuantity(componentId),
          errorMessage: 'Transaction failed: EconomyService rejected credit deduction.',
        };
      }
    }

    // 4. Update Inventory
    let item = this.inventory.get(componentId);
    if (!item) {
      item = {
        componentId,
        ownedQuantity: 0,
        installedQuantity: 0,
        reservedQuantity: 0,
        installedInProjects: [],
      };
      this.inventory.set(componentId, item);
    }
    item.ownedQuantity += quantity;

    const remainingCredits = econ ? econ.getCredits() : currentCredits - totalCost;

    Logger.info(
      'COMPONENT_INVENTORY_SERVICE',
      `Purchased ${quantity}x ${comp.name} for ₵${totalCost.toLocaleString()}. Remaining balance: ₵${remainingCredits.toLocaleString()}`
    );

    // 5. Dispatch Event
    if (this.eventBus) {
      this.eventBus.emit('component:purchased' as any, {
        componentId,
        quantity,
        costCredits: totalCost,
        remainingCredits,
      });
    }

    return {
      success: true,
      componentId,
      creditsSpent: totalCost,
      remainingCredits,
      newOwnedQuantity: item.ownedQuantity,
    };
  }

  // =========================================================================
  // INSTALLATION & RESERVATION TRACKING
  // =========================================================================

  public installComponent(
    projectId: string,
    componentId: string
  ): { success: boolean; reason?: string } {
    let item = this.inventory.get(componentId);
    if (!item) {
      item = {
        componentId,
        ownedQuantity: 0,
        installedQuantity: 0,
        reservedQuantity: 0,
        installedInProjects: [],
      };
      this.inventory.set(componentId, item);
    }

    const available = item.ownedQuantity - item.installedQuantity - item.reservedQuantity;
    if (available <= 0) {
      return {
        success: false,
        reason: `No unassigned units of "${componentId}" available in inventory (Owned: ${item.ownedQuantity}, Installed: ${item.installedQuantity}). Purchase additional units.`,
      };
    }

    item.installedQuantity += 1;
    item.installedInProjects.push(projectId);

    if (this.eventBus) {
      this.eventBus.emit('component:installed' as any, { projectId, componentId });
    }

    return { success: true };
  }

  public uninstallComponent(projectId: string, componentId: string): boolean {
    const item = this.inventory.get(componentId);
    if (!item || item.installedQuantity <= 0) {
      return false;
    }

    item.installedQuantity -= 1;
    const projIdx = item.installedInProjects.indexOf(projectId);
    if (projIdx >= 0) {
      item.installedInProjects.splice(projIdx, 1);
    }

    if (this.eventBus) {
      this.eventBus.emit('component:uninstalled' as any, { projectId, componentId });
    }

    return true;
  }

  public reserveComponent(componentId: string, count: number = 1): boolean {
    const item = this.inventory.get(componentId);
    if (!item) return false;

    const available = item.ownedQuantity - item.installedQuantity - item.reservedQuantity;
    if (available < count) return false;

    item.reservedQuantity += count;
    return true;
  }

  public releaseReservedComponent(componentId: string, count: number = 1): boolean {
    const item = this.inventory.get(componentId);
    if (!item || item.reservedQuantity < count) return false;

    item.reservedQuantity -= count;
    return true;
  }

  // =========================================================================
  // INVENTORY QUERIES
  // =========================================================================

  public getInventoryItem(componentId: string): ComponentInventoryItem | undefined {
    return this.inventory.get(componentId);
  }

  public getOwnedQuantity(componentId: string): number {
    return this.inventory.get(componentId)?.ownedQuantity ?? 0;
  }

  public getInstalledQuantity(componentId: string): number {
    return this.inventory.get(componentId)?.installedQuantity ?? 0;
  }

  public getAvailableQuantity(componentId: string): number {
    const item = this.inventory.get(componentId);
    if (!item) return 0;
    return Math.max(0, item.ownedQuantity - item.installedQuantity - item.reservedQuantity);
  }

  public isComponentInstalled(projectId: string, componentId: string): boolean {
    const item = this.inventory.get(componentId);
    return item ? item.installedInProjects.includes(projectId) : false;
  }

  public getAllInventoryItems(): ComponentInventoryItem[] {
    return Array.from(this.inventory.values());
  }

  // =========================================================================
  // PERSISTENCE (SERIALIZATION & DESERIALIZATION)
  // =========================================================================

  public serialize(): ComponentInventorySaveData {
    const invObj: Record<string, ComponentInventoryItem> = {};
    for (const [id, item] of this.inventory.entries()) {
      invObj[id] = { ...item, installedInProjects: [...item.installedInProjects] };
    }
    return { inventory: invObj };
  }

  public deserialize(data?: Partial<ComponentInventorySaveData>): void {
    if (!data?.inventory) return;

    for (const [id, item] of Object.entries(data.inventory)) {
      this.inventory.set(id, {
        componentId: item.componentId,
        ownedQuantity: item.ownedQuantity,
        installedQuantity: item.installedQuantity,
        reservedQuantity: item.reservedQuantity,
        installedInProjects: Array.isArray(item.installedInProjects)
          ? [...item.installedInProjects]
          : [],
      });
    }

    Logger.info(
      'COMPONENT_INVENTORY_SERVICE',
      `Deserialized component inventory (${this.inventory.size} items).`
    );
  }
}
