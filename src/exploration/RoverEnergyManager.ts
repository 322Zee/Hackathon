/**
 * INTERSTELLAR CONTINUUM - Rover Energy & Condition Manager
 * Battery management, solar/RTG generation, wear & tear, dust accumulation,
 * and field maintenance procedures.
 */

import {
  MaintenanceResult,
  RoverMaintenanceAction,
  RoverOperationalStatus,
  RoverPowerSource,
  RoverRecord,
} from './ExplorationTypes';

export class RoverEnergyManager {
  /**
   * Updates energy generation, idle drains, dust accumulation, and condition wear.
   */
  public updateEnergyAndCondition(
    rover: RoverRecord,
    movementEnergyDrain: number,
    collisionDamage: number,
    terrainDifficulty: number,
    isDaytime: boolean,
    deltaSeconds: number
  ): {
    energyDelta: number;
    conditionDelta: number;
    dustAccumulated: number;
    isDepleted: boolean;
  } {
    if (deltaSeconds <= 0) {
      return { energyDelta: 0, conditionDelta: 0, dustAccumulated: 0, isDepleted: false };
    }

    // 1. Calculate Power Generation
    let generationRate = 0;

    // Solar panels produce power during daytime, diminished by dust accumulation
    if (
      rover.powerSource === RoverPowerSource.SOLAR_ARRAY ||
      rover.powerSource === RoverPowerSource.HYBRID_SOLAR_RTG
    ) {
      if (isDaytime) {
        const dustFactor = Math.max(0.2, (100 - rover.dustAccumulationPercent) / 100);
        generationRate += rover.solarGenerationRate * dustFactor;
      }
    }

    // RTG produces steady continuous power independent of day/night or dust
    if (
      rover.powerSource === RoverPowerSource.RADIOISOTOPE_RTG ||
      rover.powerSource === RoverPowerSource.HYBRID_SOLAR_RTG
    ) {
      generationRate += rover.rtgGenerationRate;
    }

    const energyGenerated = generationRate * deltaSeconds;

    // 2. Net Energy Balance
    const netEnergyDelta = energyGenerated - movementEnergyDrain;
    let newEnergy = rover.energyRating + netEnergyDelta;
    newEnergy = Math.max(0, Math.min(100, newEnergy));
    rover.energyRating = newEnergy;

    // Check if depleted
    const isDepleted = newEnergy <= 0.5;
    if (isDepleted && rover.operationalStatus !== RoverOperationalStatus.DEPLETED) {
      rover.operationalStatus = RoverOperationalStatus.DEPLETED;
    } else if (!isDepleted && rover.operationalStatus === RoverOperationalStatus.DEPLETED) {
      rover.operationalStatus = RoverOperationalStatus.ACTIVE;
    }

    // 3. Condition Wear & Tear
    // Traversal on rough terrain causes gradual wear
    let terrainWear = 0;
    if (Math.abs(rover.speed) > 10) {
      const roughnessMultiplier = Math.max(0, terrainDifficulty - 1.0);
      terrainWear = roughnessMultiplier * 0.05 * deltaSeconds;
    }

    const totalConditionLoss = collisionDamage + terrainWear;
    let newCondition = rover.vehicleConditionRating - totalConditionLoss;
    newCondition = Math.max(0, Math.min(100, newCondition));
    rover.vehicleConditionRating = newCondition;

    if (newCondition < 25 && rover.operationalStatus === RoverOperationalStatus.ACTIVE) {
      rover.operationalStatus = RoverOperationalStatus.DEGRADED;
    }

    // 4. Dust Accumulation (slowly settles on solar panels)
    let dustIncrement = 0;
    if (rover.powerSource !== RoverPowerSource.RADIOISOTOPE_RTG) {
      // Windblown dust deposition: ~1% per 100 seconds
      dustIncrement = 0.01 * deltaSeconds;
      rover.dustAccumulationPercent = Math.min(95, rover.dustAccumulationPercent + dustIncrement);
    }

    return {
      energyDelta: netEnergyDelta,
      conditionDelta: -totalConditionLoss,
      dustAccumulated: dustIncrement,
      isDepleted,
    };
  }

  /**
   * Executes field maintenance and diagnostics to restore rover systems.
   */
  public performMaintenance(
    rover: RoverRecord,
    action: RoverMaintenanceAction
  ): MaintenanceResult {
    let conditionRestored = 0;
    let energyRestored = 0;
    let dustCleared = 0;
    let message = '';

    switch (action) {
      case RoverMaintenanceAction.CLEAN_SOLAR_PANELS:
        dustCleared = rover.dustAccumulationPercent;
        rover.dustAccumulationPercent = 0;
        message = 'Solar panel wiper routine executed. Dust cleared 100%. Solar efficiency restored.';
        break;

      case RoverMaintenanceAction.DIAGNOSTIC_REBOOT:
        if (rover.operationalStatus === RoverOperationalStatus.DEGRADED) {
          rover.operationalStatus = RoverOperationalStatus.ACTIVE;
        }
        message = 'Onboard flight computers and motor controllers rebooted. Telemetry reset to nominal.';
        break;

      case RoverMaintenanceAction.EMERGENCY_BATTERY_JUMP:
        energyRestored = 35;
        rover.energyRating = Math.min(100, rover.energyRating + energyRestored);
        if (rover.operationalStatus === RoverOperationalStatus.DEPLETED) {
          rover.operationalStatus = RoverOperationalStatus.ACTIVE;
        }
        message = 'Emergency reserve capacitor activated. Battery recharged by +35%.';
        break;

      case RoverMaintenanceAction.CHASSIS_FIELD_REPAIR:
        conditionRestored = 25;
        rover.vehicleConditionRating = Math.min(100, rover.vehicleConditionRating + conditionRestored);
        if (rover.vehicleConditionRating >= 30 && rover.operationalStatus === RoverOperationalStatus.DEGRADED) {
          rover.operationalStatus = RoverOperationalStatus.ACTIVE;
        }
        message = 'Suspension actuators realigned and titanium struts reinforced. Condition restored +25%.';
        break;

      case RoverMaintenanceAction.CALIBRATE_INSTRUMENTS:
        for (const slot of rover.instruments) {
          slot.isReady = true;
          slot.cooldownRemaining = 0;
        }
        message = 'All installed scientific instruments recalibrated to zero baseline.';
        break;
    }

    return {
      success: true,
      roverId: rover.id,
      action,
      conditionRestored,
      energyRestored,
      dustClearedPercent: dustCleared,
      message,
    };
  }
}
