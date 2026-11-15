import { describe, it, expect, beforeEach } from 'vitest';
import { RoverEnergyManager } from '../../src/exploration/RoverEnergyManager';
import { RoverRegistry } from '../../src/exploration/RoverRegistry';
import {
  RoverMaintenanceAction,
  RoverOperationalStatus,
  RoverPowerSource,
  RoverRecord,
} from '../../src/exploration/ExplorationTypes';

describe('RoverEnergyManager and Maintenance Procedures', () => {
  let energyManager: RoverEnergyManager;
  let solarRover: RoverRecord;
  let rtgRover: RoverRecord;

  beforeEach(() => {
    RoverRegistry.resetInstance();
    const registry = RoverRegistry.getInstance();
    solarRover = registry.getRover('ROVER_SCOUT_01')!;
    rtgRover = registry.getRover('ROVER_SCIENCE_01')!;
    energyManager = new RoverEnergyManager();
  });

  it('recharges solar rovers during daytime, but generates 0 energy at night', () => {
    solarRover.energyRating = 50;

    // Daytime generation: 10 seconds of day
    const dayResult = energyManager.updateEnergyAndCondition(solarRover, 0, 0, 1.0, true, 10);
    expect(dayResult.energyDelta).toBeGreaterThan(0);
    expect(solarRover.energyRating).toBeGreaterThan(50);

    const energyAfterDay = solarRover.energyRating;

    // Nighttime: 0 solar generation
    const nightResult = energyManager.updateEnergyAndCondition(solarRover, 0, 0, 1.0, false, 10);
    expect(nightResult.energyDelta).toBe(0);
    expect(solarRover.energyRating).toBe(energyAfterDay);
  });

  it('rtg rovers generate steady continuous power both day and night', () => {
    rtgRover.energyRating = 50;
    expect(rtgRover.powerSource).toBe(RoverPowerSource.RADIOISOTOPE_RTG);

    // Night generation
    const nightResult = energyManager.updateEnergyAndCondition(rtgRover, 0, 0, 1.0, false, 5);
    expect(nightResult.energyDelta).toBeGreaterThan(0);
    expect(rtgRover.energyRating).toBeGreaterThan(50);
  });

  it('diminishes solar efficiency as dust accumulates on arrays', () => {
    solarRover.energyRating = 0;
    solarRover.dustAccumulationPercent = 0;

    energyManager.updateEnergyAndCondition(solarRover, 0, 0, 1.0, true, 5);
    const cleanRecharge = solarRover.energyRating;

    // Heavy dust deposition
    solarRover.energyRating = 0;
    solarRover.dustAccumulationPercent = 80;

    energyManager.updateEnergyAndCondition(solarRover, 0, 0, 1.0, true, 5);
    const dustyRecharge = solarRover.energyRating;

    expect(dustyRecharge).toBeLessThan(cleanRecharge);
  });

  it('transitions rover to DEPLETED state when battery runs completely dry', () => {
    solarRover.energyRating = 1.0;
    solarRover.operationalStatus = RoverOperationalStatus.ACTIVE;

    const result = energyManager.updateEnergyAndCondition(solarRover, 10.0, 0, 1.0, false, 1.0);

    expect(result.isDepleted).toBe(true);
    expect(solarRover.energyRating).toBe(0);
    expect(solarRover.operationalStatus).toBe(RoverOperationalStatus.DEPLETED);
  });

  it('executes field maintenance actions: solar cleaning, battery jump, chassis repair, and reboot', () => {
    // 1. Clean solar panels
    solarRover.dustAccumulationPercent = 75;
    const cleanResult = energyManager.performMaintenance(solarRover, RoverMaintenanceAction.CLEAN_SOLAR_PANELS);
    expect(cleanResult.success).toBe(true);
    expect(solarRover.dustAccumulationPercent).toBe(0);

    // 2. Emergency battery jump
    solarRover.energyRating = 0;
    solarRover.operationalStatus = RoverOperationalStatus.DEPLETED;
    const jumpResult = energyManager.performMaintenance(solarRover, RoverMaintenanceAction.EMERGENCY_BATTERY_JUMP);
    expect(jumpResult.success).toBe(true);
    expect(solarRover.energyRating).toBe(35);
    expect(solarRover.operationalStatus).toBe(RoverOperationalStatus.ACTIVE);

    // 3. Chassis repair
    solarRover.vehicleConditionRating = 30;
    solarRover.operationalStatus = RoverOperationalStatus.DEGRADED;
    const repairResult = energyManager.performMaintenance(solarRover, RoverMaintenanceAction.CHASSIS_FIELD_REPAIR);
    expect(repairResult.success).toBe(true);
    expect(solarRover.vehicleConditionRating).toBe(55);
    expect(solarRover.operationalStatus).toBe(RoverOperationalStatus.ACTIVE);

    // 4. Diagnostic reboot
    solarRover.operationalStatus = RoverOperationalStatus.DEGRADED;
    const rebootResult = energyManager.performMaintenance(solarRover, RoverMaintenanceAction.DIAGNOSTIC_REBOOT);
    expect(rebootResult.success).toBe(true);
    expect(solarRover.operationalStatus).toBe(RoverOperationalStatus.ACTIVE);
  });
});
