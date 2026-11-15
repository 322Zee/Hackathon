/**
 * INTERSTELLAR CONTINUUM - Planetary Base Manager Integration Tests
 * Comprehensive verification of base establishment, module construction,
 * power grids, resource transfers, expansion, maintenance, and persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PlanetaryBaseManager,
  BaseOperationalStatus,
  BaseModuleType,
  ModuleOperationalState,
  PlanetaryBasesSaveState,
} from '../../src/bases';

describe('PlanetaryBaseManager', () => {
  let eventBus: EventBus;
  let manager: PlanetaryBaseManager;

  beforeEach(() => {
    PlanetaryBaseManager.resetInstance();
    eventBus = new EventBus();
    manager = PlanetaryBaseManager.getInstance(eventBus);
  });

  describe('Base Creation & Querying', () => {
    it('creates and establishes a planetary base successfully', () => {
      let establishedEventEmitted = false;
      manager.getEventBus().on('BaseEstablished', (payload) => {
        if (payload.base.name === 'Artemis Outpost Alpha') {
          establishedEventEmitted = true;
        }
      });

      const base = manager.createBase({
        name: 'Artemis Outpost Alpha',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'],
      });

      expect(base).toBeDefined();
      expect(base.id).toBeDefined();
      expect(base.name).toBe('Artemis Outpost Alpha');
      expect(base.destinationId).toBe(DestinationId.MOON);
      expect(base.locationId).toBe('loc_moon_shackleton');
      expect(base.baseLevel).toBe(1);
      expect(base.operationalStatus).toBe(BaseOperationalStatus.OPERATIONAL);
      expect(base.installedModules.length).toBe(2);
      expect(base.maxSlots).toBe(6);
      expect(base.occupiedSlots).toBe(2);
      expect(base.availableSlots).toBe(4);
      expect(base.powerStatus.isPowered).toBe(true);
      expect(base.communicationsStatus.isConnected).toBe(true);
      expect(establishedEventEmitted).toBe(true);
    });

    it('rejects base creation with empty name or missing parameters', () => {
      expect(() => {
        manager.createBase({
          name: '',
          destinationId: DestinationId.MOON,
          locationId: 'loc_moon_shackleton',
        });
      }).toThrow();
    });

    it('retrieves base by ID and lists all active bases', () => {
      const b1 = manager.createBase({
        name: 'Base One',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
      });
      const b2 = manager.createBase({
        name: 'Base Two',
        destinationId: DestinationId.MARS,
        locationId: 'loc_mars_jezero',
      });

      expect(manager.getBase(b1.id)).toBeDefined();
      expect(manager.getBase(b2.id)).toBeDefined();
      expect(manager.listBases().length).toBe(2);
    });
  });

  describe('Deployment Planning & Submission', () => {
    it('prepares a base deployment plan and computes costs and suitability', () => {
      let plannedEventEmitted = false;
      manager.getEventBus().on('BasePlanned', (payload) => {
        if (payload.plan.baseName === 'Ares Station') {
          plannedEventEmitted = true;
        }
      });

      const plan = manager.createDeploymentPlan({
        baseName: 'Ares Station',
        destinationId: DestinationId.MARS,
        locationId: 'loc_mars_jezero',
        initialModuleTypeIds: ['mod_habitation_core_mk1', 'mod_power_fission_reactor_mk1'],
        assignedPayloadIds: [],
      });

      expect(plan).toBeDefined();
      expect(plan.baseName).toBe('Ares Station');
      expect(plan.totalCostCredits).toBeGreaterThan(0);
      expect(plan.totalMaterialsRequired).toBeGreaterThan(0);
      expect(plan.evaluation.isEligible).toBe(true);
      expect(plannedEventEmitted).toBe(true);
    });

    it('rejects deployment plans on ineligible bodies', () => {
      expect(() => {
        manager.createDeploymentPlan({
          baseName: 'Jovian Cloud Base',
          destinationId: DestinationId.JUPITER,
          locationId: 'loc_any',
          initialModuleTypeIds: [],
          assignedPayloadIds: [],
        });
      }).toThrow(/Ineligible/);
    });

    it('submits approved deployment plan and deploys base', () => {
      const plan = manager.createDeploymentPlan({
        baseName: 'Ceres Outpost One',
        destinationId: DestinationId.CERES,
        locationId: 'loc_ceres_occator',
        initialModuleTypeIds: ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'],
        assignedPayloadIds: [],
      });

      const base = manager.submitDeploymentPlan(plan.planId);
      expect(base).toBeDefined();
      expect(base.name).toBe('Ceres Outpost One');
      expect(manager.getBase(base.id)).toBeDefined();
    });
  });

  describe('Module Registration & Custom Extensibility', () => {
    it('registers a new custom module and makes it available for construction', () => {
      manager.registerBaseModule({
        id: 'mod_custom_telescope_mk1',
        name: 'Lunar Radio Telescope Array',
        type: BaseModuleType.RESEARCH_STATION,
        description: 'Far-side ultra-long-wavelength radio interferometry dish.',
        tier: 1,
        powerRequirementRating: 45,
        powerOutputRating: 0,
        massRating: 110,
        storageRequirementSlots: 1,
        buildCostCredits: 40000,
        buildCostMaterials: 80,
        buildTimeTicks: 20,
        baseResearchOutput: 30,
        visualAssetKey: 'base_radio_dish',
      });

      const base = manager.createBase({
        name: 'Far Side Observatory',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'],
      });

      const task = manager.startConstruction(base.id, 'mod_custom_telescope_mk1');
      expect(task).toBeDefined();
      expect(task.moduleTypeId).toBe('mod_custom_telescope_mk1');
    });
  });

  describe('Construction & Expansion Flow', () => {
    it('starts, tracks progress, and completes module construction', () => {
      let startedEvent = false;
      let completedEvent = false;

      manager.getEventBus().on('ModuleConstructionStarted', () => {
        startedEvent = true;
      });
      manager.getEventBus().on('ModuleConstructionCompleted', () => {
        completedEvent = true;
      });

      const base = manager.createBase({
        name: 'Lunar Hub',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'],
      });

      const task = manager.startConstruction(base.id, 'mod_storage_mk1');
      expect(task.status).toBe('IN_PROGRESS');
      expect(startedEvent).toBe(true);

      // Advance time by build duration
      manager.update(task.totalDurationTicks);

      expect(completedEvent).toBe(true);
      const updatedBase = manager.getBase(base.id)!;
      expect(updatedBase.activeConstructionTasks.length).toBe(0);
      expect(updatedBase.installedModules.some((m) => m.moduleTypeId === 'mod_storage_mk1')).toBe(true);
      expect(updatedBase.occupiedSlots).toBe(3);
    });

    it('cancels eligible in-progress construction and refunds materials', () => {
      let cancelEvent = false;
      manager.getEventBus().on('BaseConstructionCancelled', () => {
        cancelEvent = true;
      });

      const base = manager.createBase({
        name: 'Lunar Refinery',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_habitation_core_mk1'],
      });

      const initialCredits = base.inventory.creditsBuffer;
      const task = manager.startConstruction(base.id, 'mod_resource_processing_mk1');

      const cancelled = manager.cancelConstruction(base.id, task.taskId);
      expect(cancelled).toBe(true);
      expect(cancelEvent).toBe(true);

      const updatedBase = manager.getBase(base.id)!;
      expect(updatedBase.activeConstructionTasks.length).toBe(0);
      expect(updatedBase.inventory.creditsBuffer).toBeGreaterThan(initialCredits);
    });

    it('upgrades an installed module and scales statistics', () => {
      let upgradedEvent = false;
      manager.getEventBus().on('BaseModuleUpgraded', (p) => {
        if (p.newLevel === 2) {
          upgradedEvent = true;
        }
      });

      const base = manager.createBase({
        name: 'Science Outpost',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_research_station_mk1'],
      });

      const lab = base.installedModules.find((m) => m.moduleTypeId === 'mod_research_station_mk1')!;
      const initialScience = lab.outputMetrics.researchOutput || 0;

      const upgradeRes = manager.upgradeBaseModule(base.id, lab.id);
      expect(upgradeRes.success).toBe(true);
      expect(upgradeRes.newLevel).toBe(2);
      expect(lab.level).toBe(2);
      expect(lab.outputMetrics.researchOutput).toBeGreaterThan(initialScience);
      expect(upgradedEvent).toBe(true);
    });

    it('expands base capacity by unlocking expansion sectors', () => {
      let expandedEvent = false;
      manager.getEventBus().on('BaseExpanded', () => {
        expandedEvent = true;
      });

      const base = manager.createBase({
        name: 'Expanding Base',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        baseLevel: 2, // Eligible for sector beta
      });

      const initialMax = base.maxSlots;
      const expandRes = manager.expandBase(base.id);

      expect(expandRes.success).toBe(true);
      expect(expandRes.newMaxSlots).toBe(initialMax + 4);
      expect(base.maxSlots).toBe(initialMax + 4);
      expect(expandedEvent).toBe(true);
    });
  });

  describe('Resource Management & Logistics', () => {
    it('deposits and withdraws resources between base and organization', () => {
      const base = manager.createBase({
        name: 'Logistics Depot',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
      });

      const initialRaw = base.inventory.rawMaterials;

      // Deposit raw materials
      const depositRes = manager.transferBaseResources(base.id, {
        direction: 'DEPOSIT_TO_BASE',
        resourceType: 'rawMaterials',
        amount: 50,
      });

      expect(depositRes.success).toBe(true);
      expect(base.inventory.rawMaterials).toBe(initialRaw + 50);

      // Withdraw raw materials
      const withdrawRes = manager.transferBaseResources(base.id, {
        direction: 'WITHDRAW_FROM_BASE',
        resourceType: 'rawMaterials',
        amount: 20,
      });

      expect(withdrawRes.success).toBe(true);
      expect(base.inventory.rawMaterials).toBe(initialRaw + 30);
    });

    it('rejects deposits that exceed storage capacity', () => {
      const base = manager.createBase({
        name: 'Full Storage Depot',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
      });

      const overCapacity = base.storageCapacity + 500;
      const res = manager.transferBaseResources(base.id, {
        direction: 'DEPOSIT_TO_BASE',
        resourceType: 'rawMaterials',
        amount: overCapacity,
      });

      expect(res.success).toBe(false);
      expect(res.message).toMatch(/storage full/i);
    });
  });

  describe('Maintenance & Operational Health', () => {
    it('applies wear over time, triggers maintenance warning, and performs overhaul', () => {
      let maintenanceRequiredEvent = false;
      manager.getEventBus().on('BaseMaintenanceRequired', () => {
        maintenanceRequiredEvent = true;
      });

      const base = manager.createBase({
        name: 'Harsh Mars Outpost',
        destinationId: DestinationId.MARS,
        locationId: 'loc_mars_jezero',
      });

      // Advance time significantly to incur wear
      for (let i = 0; i < 20; i++) {
        manager.update(50);
      }

      expect(base.maintenanceStatus.overallCondition).toBeLessThan(100);

      // Perform maintenance
      const maintRes = manager.performBaseMaintenance(base.id);
      expect(maintRes.success).toBe(true);
      expect(maintRes.restoredCondition).toBe(100);
      expect(base.maintenanceStatus.overallCondition).toBe(100);
      expect(base.operationalStatus).toBe(BaseOperationalStatus.OPERATIONAL);
    });
  });

  describe('Comprehensive Operational Summary', () => {
    it('computes accurate operational summary metrics', () => {
      const base = manager.createBase({
        name: 'Science Complex',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: [
          'mod_habitation_core_mk1',
          'mod_power_solar_array_mk1',
          'mod_research_station_mk1',
        ],
      });

      const summary = manager.getBaseStatus(base.id);
      expect(summary.baseId).toBe(base.id);
      expect(summary.totalModules).toBe(3);
      expect(summary.activeModules).toBe(3);
      expect(summary.powerGeneration).toBeGreaterThan(0);
      expect(summary.powerConsumption).toBeGreaterThan(0);
      expect(summary.activeResearchOutput).toBeGreaterThan(0);
      expect(summary.commsConnected).toBe(true);
    });
  });

  describe('Save State & Restoration', () => {
    it('serializes and restores base state faithfully', () => {
      const b1 = manager.createBase({
        name: 'Alpha Moon',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_habitation_core_mk1', 'mod_power_fission_reactor_mk1'],
      });

      const b2 = manager.createBase({
        name: 'Beta Mars',
        destinationId: DestinationId.MARS,
        locationId: 'loc_mars_jezero',
        initialModules: ['mod_habitation_core_mk1', 'mod_research_station_mk1'],
      });

      const saveData = manager.saveState();
      expect(saveData.bases.length).toBe(2);

      // Reset and reload
      PlanetaryBaseManager.resetInstance();
      const newManager = PlanetaryBaseManager.getInstance(eventBus);
      expect(newManager.listBases().length).toBe(0);

      newManager.loadState(saveData);
      expect(newManager.listBases().length).toBe(2);

      const restoredB1 = newManager.getBase(b1.id);
      expect(restoredB1).toBeDefined();
      expect(restoredB1?.name).toBe('Alpha Moon');
      expect(restoredB1?.installedModules.length).toBe(2);

      const restoredB2 = newManager.getBase(b2.id);
      expect(restoredB2).toBeDefined();
      expect(restoredB2?.name).toBe('Beta Mars');
      expect(restoredB2?.destinationId).toBe(DestinationId.MARS);
    });
  });
});
