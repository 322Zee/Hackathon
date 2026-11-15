/**
 * INTERSTELLAR CONTINUUM - Planetary Base Power Grid Engine
 * Simulates power generation, load distribution, battery buffering,
 * and deterministic load-shedding during power deficits.
 */

import {
  InstalledModuleRecord,
  BasePowerStatus,
  BasePowerSourceType,
  ModuleOperationalState,
  BaseModuleType,
} from '../BaseTypes';
import { BaseModuleRegistry } from '../modules/BaseModuleRegistry';

export class PowerGridEngine {
  private moduleRegistry: BaseModuleRegistry;

  constructor(moduleRegistry?: BaseModuleRegistry) {
    this.moduleRegistry = moduleRegistry || BaseModuleRegistry.getInstance();
  }

  /**
   * Recalculates power generation and consumption for all installed modules.
   * Handles solar scaling and brownout shedding when consumption exceeds generation.
   */
  public evaluatePowerGrid(
    modules: InstalledModuleRecord[],
    currentStatus: BasePowerStatus,
    solarMultiplier: number = 1.0
  ): {
    newStatus: BasePowerStatus;
    updatedModules: InstalledModuleRecord[];
  } {
    let totalGeneration = 0;
    let baselineDemand = 0;

    // 1. Calculate potential power generation
    for (const mod of modules) {
      if (mod.health <= 0) continue;

      if (mod.powerProvided > 0) {
        const def = this.moduleRegistry.getModule(mod.moduleTypeId);
        let gen = mod.powerProvided;

        // Apply solar scaling if solar array
        if (def && def.powerSourceType === BasePowerSourceType.SOLAR_ARRAY) {
          gen *= Math.max(0.05, solarMultiplier);
        }

        // Module health factor (e.g. 50% health produces reduced power)
        const healthFactor = Math.max(0.4, mod.health / 100);
        gen *= healthFactor;

        totalGeneration += Math.round(gen);
      }

      baselineDemand += mod.powerDraw;
    }

    const net = totalGeneration - baselineDemand;
    let batteryStored = currentStatus.batteryStored;
    const batteryCap = Math.max(100, currentStatus.batteryCapacity);
    let activeDeficit = false;

    if (net >= 0) {
      // Surplus charges batteries
      batteryStored = Math.min(batteryCap, batteryStored + net * 0.1);
    } else {
      // Deficit drains batteries
      const drain = Math.abs(net) * 0.2;
      batteryStored -= drain;
      if (batteryStored <= 0) {
        batteryStored = 0;
        activeDeficit = true;
      }
    }

    // Clone modules for state updates
    const updatedModules = modules.map((m) => ({ ...m }));

    // 2. Load shedding logic if in active deficit
    if (activeDeficit) {
      // Priority for power (lowest priority sheds first):
      // 1. MANUFACTURING_FACILITY (sheds first)
      // 2. RESEARCH_STATION
      // 3. RESOURCE_PROCESSING
      // 4. STORAGE_FACILITY
      // 5. COMMUNICATIONS_RELAY
      // 6. MAINTENANCE_FACILITY
      // 7. HABITATION_CORE / POWER_FACILITY (keeps on if possible)
      const shedOrder = [
        BaseModuleType.MANUFACTURING_FACILITY,
        BaseModuleType.RESEARCH_STATION,
        BaseModuleType.RESOURCE_PROCESSING,
        BaseModuleType.STORAGE_FACILITY,
        BaseModuleType.COMMUNICATIONS_RELAY,
        BaseModuleType.MAINTENANCE_FACILITY,
      ];

      let deficitAmount = Math.abs(net);

      for (const shedType of shedOrder) {
        if (deficitAmount <= 0) break;

        for (const mod of updatedModules) {
          if (mod.type === shedType && mod.operationalState === ModuleOperationalState.ACTIVE) {
            mod.operationalState = ModuleOperationalState.DEGRADED;
            deficitAmount -= mod.powerDraw;
            if (deficitAmount <= 0) break;
          }
        }
      }
    } else {
      // Restore non-offline modules to ACTIVE if health > 25%
      for (const mod of updatedModules) {
        if (
          mod.operationalState === ModuleOperationalState.DEGRADED &&
          mod.health > 25
        ) {
          mod.operationalState = ModuleOperationalState.ACTIVE;
        }
      }
    }

    const isPowered = totalGeneration > 0 || batteryStored > 0 || baselineDemand === 0;

    const newStatus: BasePowerStatus = {
      generation: totalGeneration,
      consumption: baselineDemand,
      netBalance: net,
      batteryCapacity: batteryCap,
      batteryStored: Math.round(batteryStored * 10) / 10,
      gridEfficiency: baselineDemand > 0 ? Math.min(1.0, totalGeneration / baselineDemand) : 1.0,
      isPowered,
      activeDeficit,
    };

    return {
      newStatus,
      updatedModules,
    };
  }
}
