/**
 * INTERSTELLAR CONTINUUM - Planetary Base Construction Engine
 * Coordinates modular module assembly tasks, building slot allocations,
 * simulation progress ticks, and task cancellations.
 */

import {
  BaseRecord,
  BaseModuleDefinition,
  ConstructionTask,
  ConstructionTaskStatus,
  InstalledModuleRecord,
  ModuleOperationalState,
} from '../BaseTypes';
import { BaseModuleRegistry } from '../modules/BaseModuleRegistry';

export class ConstructionEngine {
  private moduleRegistry: BaseModuleRegistry;

  constructor(moduleRegistry?: BaseModuleRegistry) {
    this.moduleRegistry = moduleRegistry || BaseModuleRegistry.getInstance();
  }

  /**
   * Initializes a new construction task on the target base.
   */
  public initiateConstructionTask(
    base: BaseRecord,
    moduleDef: BaseModuleDefinition,
    preferredSlotIndex?: number
  ): ConstructionTask {
    // 1. Validate building slot availability
    const occupiedSlotIndices = new Set<number>();
    for (const mod of base.installedModules) {
      occupiedSlotIndices.add(mod.slotIndex);
    }
    for (const task of base.activeConstructionTasks) {
      occupiedSlotIndices.add(task.slotIndex);
    }

    let assignedSlot = -1;
    if (preferredSlotIndex !== undefined && !occupiedSlotIndices.has(preferredSlotIndex)) {
      if (preferredSlotIndex >= 0 && preferredSlotIndex < base.maxSlots) {
        assignedSlot = preferredSlotIndex;
      }
    }

    if (assignedSlot === -1) {
      for (let i = 0; i < base.maxSlots; i++) {
        if (!occupiedSlotIndices.has(i)) {
          assignedSlot = i;
          break;
        }
      }
    }

    if (assignedSlot === -1) {
      throw new Error(`[CONSTRUCTION_ENGINE] Cannot start construction: No available building slots in base ${base.name}.`);
    }

    // Determine sector ID
    let sectorId = 'SECTOR_ALPHA';
    if (assignedSlot >= 8) sectorId = 'SECTOR_GAMMA';
    else if (assignedSlot >= 4) sectorId = 'SECTOR_BETA';

    const taskId = `task_${base.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const task: ConstructionTask = {
      taskId,
      baseId: base.id,
      moduleTypeId: moduleDef.id,
      slotIndex: assignedSlot,
      sectorId,
      status: ConstructionTaskStatus.IN_PROGRESS,
      progressPercent: 0,
      elapsedTicks: 0,
      totalDurationTicks: Math.max(1, moduleDef.buildTimeTicks),
      startedTimestamp: Date.now(),
      costRefundable: {
        credits: Math.round(moduleDef.buildCostCredits * 0.8), // 80% refund on cancellation
        materials: Math.round(moduleDef.buildCostMaterials * 0.8),
      },
    };

    return task;
  }

  /**
   * Ticks active construction tasks forward by deltaTicks.
   * Returns newly completed tasks.
   */
  public tickConstruction(
    base: BaseRecord,
    deltaTicks: number = 1
  ): {
    completedTasks: { task: ConstructionTask; newModule: InstalledModuleRecord }[];
  } {
    const completedTasks: { task: ConstructionTask; newModule: InstalledModuleRecord }[] = [];
    const remainingTasks: ConstructionTask[] = [];

    for (const task of base.activeConstructionTasks) {
      if (task.status !== ConstructionTaskStatus.IN_PROGRESS) {
        continue;
      }

      task.elapsedTicks += deltaTicks;
      task.progressPercent = Math.min(
        100,
        Math.round((task.elapsedTicks / task.totalDurationTicks) * 100)
      );

      if (task.elapsedTicks >= task.totalDurationTicks) {
        task.status = ConstructionTaskStatus.COMPLETED;
        task.progressPercent = 100;

        const def = this.moduleRegistry.getModule(task.moduleTypeId);
        if (def) {
          const instanceId = `mod_inst_${base.id}_${def.type}_${Date.now()}_${task.slotIndex}`;
          const newModule: InstalledModuleRecord = {
            id: instanceId,
            instanceId,
            moduleTypeId: def.id,
            name: def.name,
            type: def.type,
            level: 1,
            health: 100,
            operationalState: ModuleOperationalState.ACTIVE,
            powerDraw: def.powerRequirementRating,
            powerProvided: def.powerOutputRating,
            slotIndex: task.slotIndex,
            sectorId: task.sectorId,
            installedTimestamp: Date.now(),
            outputMetrics: {
              researchOutput: def.baseResearchOutput,
              processingThroughput: def.processingCapacity,
              storageBoost: def.storageCapacityBoost,
              signalGain: def.commsGainDb,
              wearReduction: def.maintenanceWearReduction,
            },
          };

          completedTasks.push({ task, newModule });
        }
      } else {
        remainingTasks.push(task);
      }
    }

    base.activeConstructionTasks = remainingTasks;
    return { completedTasks };
  }

  /**
   * Cancels an active construction task and returns refundable costs.
   */
  public cancelConstructionTask(
    base: BaseRecord,
    taskId: string
  ): {
    success: boolean;
    refundedCredits: number;
    refundedMaterials: number;
  } {
    const taskIndex = base.activeConstructionTasks.findIndex((t) => t.taskId === taskId);
    if (taskIndex === -1) {
      return { success: false, refundedCredits: 0, refundedMaterials: 0 };
    }

    const task = base.activeConstructionTasks[taskIndex];
    task.status = ConstructionTaskStatus.CANCELLED;
    base.activeConstructionTasks.splice(taskIndex, 1);

    return {
      success: true,
      refundedCredits: task.costRefundable.credits,
      refundedMaterials: task.costRefundable.materials,
    };
  }
}
