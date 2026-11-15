import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { ServiceLocator } from '../../src/core/ServiceLocator';
import { EconomyService } from '../../src/services/EconomyService';
import {
  RocketComponentRegistry,
  ComponentInventoryService,
} from '../../src/engineering';

describe('ComponentInventoryService', () => {
  let eventBus: EventBus;
  let registry: RocketComponentRegistry;
  let economyService: EconomyService;
  let inventoryService: ComponentInventoryService;

  beforeEach(() => {
    ServiceLocator.reset();
    RocketComponentRegistry.resetInstance();
    ComponentInventoryService.resetInstance();

    eventBus = new EventBus();
    ServiceLocator.register('EventBus', eventBus);

    economyService = new EconomyService(
      { credits: 50000, researchData: 1000, rawMaterials: 500, technologyPoints: 50 },
      eventBus
    );
    ServiceLocator.register('EconomyService', economyService);

    registry = RocketComponentRegistry.getInstance(eventBus);
    inventoryService = ComponentInventoryService.getInstance(eventBus, registry, economyService);
  });

  it('initializes default inventory with starter quantities for Tier-1 items', () => {
    const ownedCore = inventoryService.getOwnedQuantity('struct_main_core_alpha');
    expect(ownedCore).toBeGreaterThanOrEqual(2);

    const availableCore = inventoryService.getAvailableQuantity('struct_main_core_alpha');
    expect(availableCore).toBeGreaterThanOrEqual(2);

    const lockedItem = inventoryService.getOwnedQuantity('prop_advanced_heavy_cluster');
    expect(lockedItem).toBe(0);
  });

  it('purchases available component through EconomyService and updates inventory', () => {
    const initialCredits = economyService.getCredits();
    const initialOwned = inventoryService.getOwnedQuantity('struct_main_core_alpha');
    const compCost = registry.getComponent('struct_main_core_alpha')?.costCredits ?? 9500;

    let purchaseEventEmitted = false;
    eventBus.on('component:purchased' as any, () => {
      purchaseEventEmitted = true;
    });

    const result = inventoryService.purchaseComponent('struct_main_core_alpha', 1);

    expect(result.success).toBe(true);
    expect(result.creditsSpent).toBe(compCost);
    expect(economyService.getCredits()).toBe(initialCredits - compCost);
    expect(inventoryService.getOwnedQuantity('struct_main_core_alpha')).toBe(initialOwned + 1);
    expect(purchaseEventEmitted).toBe(true);
  });

  it('rejects purchase without subtracting credits when funds are insufficient', () => {
    // Attempt to buy high cost item with cost > 50,000 credits
    const initialCredits = economyService.getCredits();
    const initialOwned = inventoryService.getOwnedQuantity('payload_rover_carrier_dock'); // cost 72,000

    const result = inventoryService.purchaseComponent('payload_rover_carrier_dock', 1);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Cannot purchase');
    expect(economyService.getCredits()).toBe(initialCredits);
    expect(inventoryService.getOwnedQuantity('payload_rover_carrier_dock')).toBe(initialOwned);
  });

  it('tracks component installation and prevents overallocating beyond owned stock', () => {
    const compId = 'struct_payload_support_skirt';
    const initialOwned = inventoryService.getOwnedQuantity(compId);
    expect(initialOwned).toBeGreaterThanOrEqual(2);

    // Install in Project 1
    const inst1 = inventoryService.installComponent('proj_alpha', compId);
    expect(inst1.success).toBe(true);
    expect(inventoryService.getInstalledQuantity(compId)).toBe(1);
    expect(inventoryService.getAvailableQuantity(compId)).toBe(initialOwned - 1);
    expect(inventoryService.isComponentInstalled('proj_alpha', compId)).toBe(true);

    // Install in Project 2
    const inst2 = inventoryService.installComponent('proj_beta', compId);
    expect(inst2.success).toBe(true);
    expect(inventoryService.getInstalledQuantity(compId)).toBe(2);

    // Attempt to install when all units are allocated
    if (initialOwned === 2) {
      const inst3 = inventoryService.installComponent('proj_gamma', compId);
      expect(inst3.success).toBe(false);
      expect(inst3.reason).toContain('No unassigned units');
    }

    // Uninstall from Project 1
    const uninst = inventoryService.uninstallComponent('proj_alpha', compId);
    expect(uninst).toBe(true);
    expect(inventoryService.getInstalledQuantity(compId)).toBe(1);
    expect(inventoryService.isComponentInstalled('proj_alpha', compId)).toBe(false);
    expect(inventoryService.isComponentInstalled('proj_beta', compId)).toBe(true);
  });

  it('supports temporary component reservation and release', () => {
    const compId = 'struct_main_core_alpha';
    const initAvail = inventoryService.getAvailableQuantity(compId);

    const reserved = inventoryService.reserveComponent(compId, 1);
    expect(reserved).toBe(true);
    expect(inventoryService.getAvailableQuantity(compId)).toBe(initAvail - 1);

    const released = inventoryService.releaseReservedComponent(compId, 1);
    expect(released).toBe(true);
    expect(inventoryService.getAvailableQuantity(compId)).toBe(initAvail);
  });

  it('serializes and deserializes component inventory state correctly', () => {
    inventoryService.installComponent('proj_test_01', 'struct_main_core_alpha');

    const saveData = inventoryService.serialize();
    expect(Object.keys(saveData.inventory).length).toBeGreaterThan(0);

    ComponentInventoryService.resetInstance();
    const newService = ComponentInventoryService.getInstance(eventBus, registry, economyService);
    newService.deserialize(saveData);

    expect(newService.isComponentInstalled('proj_test_01', 'struct_main_core_alpha')).toBe(true);
  });
});
