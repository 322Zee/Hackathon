import { describe, it, expect, beforeEach } from 'vitest';
import { MissionPreparationService } from '../../src/missions/MissionPreparationService';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import { FacilityId } from '../../src/facilities/FacilityTypes';
import { PreparationTaskType, PreparationTaskStatus } from '../../src/missions/MissionLifecycleTypes';

describe('MissionPreparationService', () => {
  let prepService: MissionPreparationService;
  let catalogueRegistry: MissionCatalogueRegistry;
  let facilityRegistry: FacilityRegistry;

  beforeEach(() => {
    MissionPreparationService.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    FacilityRegistry.resetInstance();

    facilityRegistry = FacilityRegistry.getInstance();
    catalogueRegistry = MissionCatalogueRegistry.getInstance();
    prepService = MissionPreparationService.getInstance(facilityRegistry);
  });

  it('generates dynamic preparation tasks tailored to mission requirements', () => {
    const pioneer = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(pioneer).toBeDefined();

    const prepState = prepService.generatePreparationState(pioneer!);
    expect(prepState.tasks.length).toBeGreaterThanOrEqual(3);

    const taskTypes = prepState.tasks.map((t) => t.type);
    expect(taskTypes).toContain(PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION);
    expect(taskTypes).toContain(PreparationTaskType.SPACECRAFT_DESIGN);
    expect(taskTypes).toContain(PreparationTaskType.PAYLOAD_INTEGRATION);
  });

  it('correctly maps preparation tasks to their designated facilities', () => {
    const pioneer = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    const prepState = prepService.generatePreparationState(pioneer!);

    const rocketTask = prepState.tasks.find(
      (t) => t.type === PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION
    );
    expect(rocketTask?.facilityId).toBe(FacilityId.ROCKET_ENGINEERING);
    expect(rocketTask?.facilityName).toContain('Rocket Engineering Facility');

    const spacecraftTask = prepState.tasks.find(
      (t) => t.type === PreparationTaskType.SPACECRAFT_DESIGN
    );
    expect(spacecraftTask?.facilityId).toBe(FacilityId.SPACECRAFT_LAB);
    expect(spacecraftTask?.facilityName).toBe('Spacecraft & Satellite Laboratory');
  });

  it('includes robotics configuration only for rover or surface drill missions', () => {
    const leoMission = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    const leoPrep = prepService.generatePreparationState(leoMission!);
    expect(
      leoPrep.tasks.some((t) => t.type === PreparationTaskType.ROBOTICS_CONFIGURATION)
    ).toBe(false);

    const moonRover = catalogueRegistry.getMissionById('MOON_ROVER_EXPLORATION_01');
    expect(moonRover).toBeDefined();
    const roverPrep = prepService.generatePreparationState(moonRover!);
    expect(
      roverPrep.tasks.some((t) => t.type === PreparationTaskType.ROBOTICS_CONFIGURATION)
    ).toBe(true);

    const roboticsTask = roverPrep.tasks.find(
      (t) => t.type === PreparationTaskType.ROBOTICS_CONFIGURATION
    );
    expect(roboticsTask?.facilityId).toBe(FacilityId.ROBOTICS_CENTRE);
  });

  it('flags unimplemented facilities as NOT_AVAILABLE_IN_BUILD without false readiness', () => {
    const pioneer = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    const prepState = prepService.generatePreparationState(pioneer!);

    for (const task of prepState.tasks) {
      if (!task.systemImplemented) {
        expect(task.status).toBe(PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD);
        expect(task.statusNotes).toBeDefined();
      }
    }

    const validation = prepService.validatePreparation(prepState);
    expect(validation.isValid).toBe(false);
    expect(validation.unimplementedTasks.length).toBeGreaterThan(0);
    expect(validation.errors.some((e) => e.includes('pending system development'))).toBe(true);
  });
});
