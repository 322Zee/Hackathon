/**
 * INTERSTELLAR CONTINUUM - Planetary Base Maintenance Engine
 * Models structural wear, environmental degradation, maintenance urgency,
 * module repairs, and non-punitive recovery cycles.
 */

import {
  BaseRecord,
  BaseOperationalStatus,
  MaintenanceUrgency,
  MaintenanceOptions,
  MaintenanceResult,
  ModuleOperationalState,
} from '../BaseTypes';

export class MaintenanceEngine {
  /**
   * Evaluates and applies environmental wear over time.
   */
  public evaluateWear(
    base: BaseRecord,
    wearMultiplier: number = 1.0,
    cycleCount: number = 1
  ): {
    conditionChanged: boolean;
    previousCondition: number;
    newCondition: number;
    urgency: MaintenanceUrgency;
    statusChanged: boolean;
    previousStatus: BaseOperationalStatus;
    newStatus: BaseOperationalStatus;
  } {
    const previousCondition = base.maintenanceStatus.overallCondition;
    const previousStatus = base.operationalStatus;

    // 1. Calculate wear mitigation from installed maintenance facilities
    let wearMitigationFactor = 0;
    for (const mod of base.installedModules) {
      if (
        mod.operationalState === ModuleOperationalState.ACTIVE &&
        mod.outputMetrics.wearReduction
      ) {
        wearMitigationFactor += mod.outputMetrics.wearReduction;
      }
    }
    wearMitigationFactor = Math.min(0.6, wearMitigationFactor); // Cap mitigation at 60%

    // 2. Base wear rate per cycle
    const effectiveRate = Math.max(
      0.2,
      base.maintenanceStatus.wearRatePerCycle * wearMultiplier * (1 - wearMitigationFactor)
    );

    const totalDegradation = effectiveRate * cycleCount;
    const newCondition = Math.max(10, Math.round((previousCondition - totalDegradation) * 10) / 10);
    base.maintenanceStatus.overallCondition = newCondition;

    // Also degrade individual module health slightly
    for (const mod of base.installedModules) {
      mod.health = Math.max(15, Math.round((mod.health - totalDegradation * 0.7) * 10) / 10);
    }

    // 3. Evaluate maintenance urgency
    let urgency = MaintenanceUrgency.OPTIMAL;
    if (newCondition < 30) urgency = MaintenanceUrgency.CRITICAL;
    else if (newCondition < 60) urgency = MaintenanceUrgency.ATTENTION_NEEDED;
    else if (newCondition < 85) urgency = MaintenanceUrgency.NORMAL;

    base.maintenanceStatus.maintenanceState = urgency;

    // Supplies required to restore to 100% (1 supply unit per 10% deficit, minimum 1)
    const conditionDeficit = 100 - newCondition;
    base.maintenanceStatus.requiredSupplies = Math.max(1, Math.ceil(conditionDeficit / 10));

    // 4. Update base operational status if appropriate
    let newStatus = base.operationalStatus;
    if (base.operationalStatus === BaseOperationalStatus.OPERATIONAL) {
      if (newCondition < 20) {
        newStatus = BaseOperationalStatus.LIMITED_OPERATION;
      } else if (newCondition < 50) {
        newStatus = BaseOperationalStatus.MAINTENANCE_REQUIRED;
      }
    } else if (base.operationalStatus === BaseOperationalStatus.MAINTENANCE_REQUIRED) {
      if (newCondition < 20) {
        newStatus = BaseOperationalStatus.LIMITED_OPERATION;
      }
    }

    base.operationalStatus = newStatus;

    return {
      conditionChanged: previousCondition !== newCondition,
      previousCondition,
      newCondition,
      urgency,
      statusChanged: previousStatus !== newStatus,
      previousStatus,
      newStatus,
    };
  }

  /**
   * Performs maintenance overhaul on the target base.
   * Can use local maintenance supplies or credits if supplies are depleted.
   */
  public performMaintenance(
    base: BaseRecord,
    options?: MaintenanceOptions
  ): MaintenanceResult {
    const previousCondition = base.maintenanceStatus.overallCondition;
    const neededSupplies = base.maintenanceStatus.requiredSupplies;

    let suppliesConsumed = 0;
    let creditsConsumed = 0;

    const availableSupplies = base.inventory.maintenanceSupplies;

    if (!options?.useCreditsOnly && availableSupplies >= neededSupplies) {
      // Satisfy fully with supplies
      suppliesConsumed = neededSupplies;
      base.inventory.maintenanceSupplies -= suppliesConsumed;
    } else if (!options?.useCreditsOnly && availableSupplies > 0) {
      // Partial supplies, remainder in credits
      suppliesConsumed = availableSupplies;
      base.inventory.maintenanceSupplies = 0;
      const remainingDeficit = neededSupplies - suppliesConsumed;
      creditsConsumed = remainingDeficit * 2500;
    } else {
      // Emergency field service using credits (preventing game lock)
      creditsConsumed = neededSupplies * 3000;
    }

    // Deduct credits from base buffer if possible, or leave for caller adapter
    if (creditsConsumed > 0 && base.inventory.creditsBuffer >= creditsConsumed) {
      base.inventory.creditsBuffer -= creditsConsumed;
    }

    // Restore condition and module health
    base.maintenanceStatus.overallCondition = 100;
    base.maintenanceStatus.maintenanceState = MaintenanceUrgency.OPTIMAL;
    base.maintenanceStatus.requiredSupplies = 0;
    base.maintenanceStatus.lastMaintenanceTimestamp = Date.now();

    let repairedCount = 0;
    for (const mod of base.installedModules) {
      if (mod.health < 100) {
        mod.health = 100;
        repairedCount++;
      }
      if (mod.operationalState === ModuleOperationalState.DEGRADED) {
        mod.operationalState = ModuleOperationalState.ACTIVE;
      }
    }

    // Restore operational status
    if (
      base.operationalStatus === BaseOperationalStatus.MAINTENANCE_REQUIRED ||
      base.operationalStatus === BaseOperationalStatus.LIMITED_OPERATION
    ) {
      base.operationalStatus = BaseOperationalStatus.OPERATIONAL;
    }

    return {
      success: true,
      baseId: base.id,
      previousCondition,
      restoredCondition: 100,
      suppliesConsumed,
      creditsConsumed,
      modulesRepairedCount: repairedCount,
      message: `Base maintenance completed successfully. Restored condition to 100% using ${suppliesConsumed} supplies and ₵${creditsConsumed} credits.`,
    };
  }
}
