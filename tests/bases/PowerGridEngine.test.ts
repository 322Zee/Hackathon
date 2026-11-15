/**
 * INTERSTELLAR CONTINUUM - Planetary Base Power Grid Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PowerGridEngine,
  BaseModuleRegistry,
  InstalledModuleRecord,
  BasePowerStatus,
  ModuleOperationalState,
  BaseModuleType,
} from '../../src/bases';

describe('PowerGridEngine', () => {
  let engine: PowerGridEngine;
  let registry: BaseModuleRegistry;

  beforeEach(() => {
    BaseModuleRegistry.resetInstance();
    registry = BaseModuleRegistry.getInstance();
    engine = new PowerGridEngine(registry);
  });

  const createSampleStatus = (batteryStored = 200, batteryCapacity = 400): BasePowerStatus => ({
    generation: 0,
    consumption: 0,
    netBalance: 0,
    batteryCapacity,
    batteryStored,
    gridEfficiency: 1.0,
    isPowered: true,
    activeDeficit: false,
  });

  it('calculates net surplus power and charges batteries', () => {
    const modules: InstalledModuleRecord[] = [
      {
        id: 'inst_pwr_1',
        instanceId: 'inst_pwr_1',
        moduleTypeId: 'mod_power_solar_array_mk1',
        name: 'Solar Array Mk I',
        type: BaseModuleType.POWER_FACILITY,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 0,
        powerProvided: 120,
        slotIndex: 0,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
      {
        id: 'inst_hab_1',
        instanceId: 'inst_hab_1',
        moduleTypeId: 'mod_habitation_core_mk1',
        name: 'Hab Core',
        type: BaseModuleType.HABITATION_CORE,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 30,
        powerProvided: 0,
        slotIndex: 1,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
    ];

    const currentStatus = createSampleStatus(100, 400);
    const result = engine.evaluatePowerGrid(modules, currentStatus, 1.0);

    expect(result.newStatus.generation).toBe(120);
    expect(result.newStatus.consumption).toBe(30);
    expect(result.newStatus.netBalance).toBe(90);
    expect(result.newStatus.batteryStored).toBeGreaterThan(100);
    expect(result.newStatus.isPowered).toBe(true);
    expect(result.newStatus.activeDeficit).toBe(false);
  });

  it('applies solar scaling on solar arrays based on destination solar flux', () => {
    const modules: InstalledModuleRecord[] = [
      {
        id: 'inst_pwr_1',
        instanceId: 'inst_pwr_1',
        moduleTypeId: 'mod_power_solar_array_mk1',
        name: 'Solar Array Mk I',
        type: BaseModuleType.POWER_FACILITY,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 0,
        powerProvided: 120,
        slotIndex: 0,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
    ];

    // Moon solar efficiency: 0.9
    const moonResult = engine.evaluatePowerGrid(modules, createSampleStatus(), 0.9);
    expect(moonResult.newStatus.generation).toBe(108);

    // Europa solar efficiency: 0.15
    const europaResult = engine.evaluatePowerGrid(modules, createSampleStatus(), 0.15);
    expect(europaResult.newStatus.generation).toBe(18);
  });

  it('drains battery buffer during power deficits before causing brownouts', () => {
    const modules: InstalledModuleRecord[] = [
      {
        id: 'inst_hab_1',
        instanceId: 'inst_hab_1',
        moduleTypeId: 'mod_habitation_core_mk1',
        name: 'Hab Core',
        type: BaseModuleType.HABITATION_CORE,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 50,
        powerProvided: 0,
        slotIndex: 0,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
    ];

    // With 100 stored buffer
    const statusWithBuffer = createSampleStatus(100, 300);
    const resultWithBuffer = engine.evaluatePowerGrid(modules, statusWithBuffer, 1.0);

    expect(resultWithBuffer.newStatus.netBalance).toBe(-50);
    expect(resultWithBuffer.newStatus.batteryStored).toBeLessThan(100);
    expect(resultWithBuffer.newStatus.activeDeficit).toBe(false); // buffer absorbed deficit
    expect(resultWithBuffer.newStatus.isPowered).toBe(true);

    // When battery is empty (0 stored buffer)
    const statusEmpty = createSampleStatus(0, 300);
    const resultEmpty = engine.evaluatePowerGrid(modules, statusEmpty, 1.0);

    expect(resultEmpty.newStatus.batteryStored).toBe(0);
    expect(resultEmpty.newStatus.activeDeficit).toBe(true);
  });

  it('sheds non-critical loads during active power deficits', () => {
    const modules: InstalledModuleRecord[] = [
      {
        id: 'inst_hab_1',
        instanceId: 'inst_hab_1',
        moduleTypeId: 'mod_habitation_core_mk1',
        name: 'Hab Core',
        type: BaseModuleType.HABITATION_CORE,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 30,
        powerProvided: 0,
        slotIndex: 0,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
      {
        id: 'inst_lab_1',
        instanceId: 'inst_lab_1',
        moduleTypeId: 'mod_research_station_mk1',
        name: 'Research Lab',
        type: BaseModuleType.RESEARCH_STATION,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 50,
        powerProvided: 0,
        slotIndex: 1,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
      {
        id: 'inst_mfg_1',
        instanceId: 'inst_mfg_1',
        moduleTypeId: 'mod_manufacturing_mk1',
        name: 'Manufacturing Gantry',
        type: BaseModuleType.MANUFACTURING_FACILITY,
        level: 1,
        health: 100,
        operationalState: ModuleOperationalState.ACTIVE,
        powerDraw: 80,
        powerProvided: 0,
        slotIndex: 2,
        sectorId: 'SECTOR_ALPHA',
        installedTimestamp: 1000,
        outputMetrics: {},
      },
    ];

    // Total draw = 160. Generation = 0. Batteries empty.
    const emptyStatus = createSampleStatus(0, 300);
    const result = engine.evaluatePowerGrid(modules, emptyStatus, 1.0);

    expect(result.newStatus.activeDeficit).toBe(true);

    // Manufacturing and Research should be degraded first
    const mfgMod = result.updatedModules.find((m) => m.type === BaseModuleType.MANUFACTURING_FACILITY);
    expect(mfgMod?.operationalState).toBe(ModuleOperationalState.DEGRADED);

    const labMod = result.updatedModules.find((m) => m.type === BaseModuleType.RESEARCH_STATION);
    expect(labMod?.operationalState).toBe(ModuleOperationalState.DEGRADED);
  });
});
