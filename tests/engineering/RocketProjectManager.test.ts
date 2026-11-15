import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import {
  RocketProjectManager,
  RocketProjectStatus,
  RocketClassRating,
  RocketEngineeringEventType,
} from '../../src/engineering';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';

describe('RocketProjectManager', () => {
  let eventBus: EventBus;
  let manager: RocketProjectManager;
  let missionRegistry: MissionCatalogueRegistry;

  beforeEach(() => {
    RocketProjectManager.resetInstance();
    MissionCatalogueRegistry.resetInstance();
    eventBus = new EventBus();
    manager = RocketProjectManager.getInstance(eventBus);
    missionRegistry = MissionCatalogueRegistry.getInstance(eventBus);
  });

  it('initializes with default starter rocket projects', () => {
    const projects = manager.getAllProjects();
    expect(projects.length).toBeGreaterThanOrEqual(3);

    const astra = manager.getProject('proj_astra_1');
    expect(astra).toBeDefined();
    expect(astra?.name).toContain('Astra-1');
    expect(astra?.design.classRating).toBe(RocketClassRating.SUBORBITAL_TEST);
    expect(astra?.status).toBe(RocketProjectStatus.VALIDATED);

    const pioneer = manager.getProject('proj_pioneer_orb1');
    expect(pioneer).toBeDefined();
    expect(pioneer?.name).toContain('Pioneer Orbital-1');
    expect(pioneer?.design.classRating).toBe(RocketClassRating.LIGHT_ORBITAL);

    const continuum = manager.getProject('proj_continuum_heavy');
    expect(continuum).toBeDefined();
    expect(continuum?.name).toContain('Continuum Heavy-1');
    expect(continuum?.design.classRating).toBe(RocketClassRating.HEAVY_INTERPLANETARY);
  });

  it('manages active project selection correctly', () => {
    expect(manager.getActiveProject()?.projectId).toBe('proj_pioneer_orb1');

    const switchSuccess = manager.setActiveProject('proj_astra_1');
    expect(switchSuccess).toBe(true);
    expect(manager.getActiveProject()?.projectId).toBe('proj_astra_1');

    const invalidSwitch = manager.setActiveProject('non_existent_project');
    expect(invalidSwitch).toBe(false);
    expect(manager.getActiveProject()?.projectId).toBe('proj_astra_1');
  });

  it('creates new rocket projects with initial draft status and logs event', () => {
    const newProj = manager.createProject(
      'Helios Cargo-1',
      'Solar logistics transport vehicle.',
      RocketClassRating.MEDIUM_FREIGHTER
    );

    expect(newProj.projectId).toBeDefined();
    expect(newProj.name).toBe('Helios Cargo-1');
    expect(newProj.status).toBe(RocketProjectStatus.DRAFT);
    expect(manager.getActiveProject()?.projectId).toBe(newProj.projectId);

    const history = manager.getProjectHistory(newProj.projectId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]?.type).toBe(RocketEngineeringEventType.PROJECT_CREATED);
  });

  it('updates project design parameters and resets validation state', () => {
    const pioneer = manager.getProject('proj_pioneer_orb1');
    expect(pioneer?.status).toBe(RocketProjectStatus.VALIDATED);

    const updateSuccess = manager.updateProjectDesign('proj_pioneer_orb1', {
      totalWetMassKg: 25000,
    });
    expect(updateSuccess).toBe(true);

    const updated = manager.getProject('proj_pioneer_orb1');
    expect(updated?.design.totalWetMassKg).toBe(25000);
    expect(updated?.status).toBe(RocketProjectStatus.UNDER_DEVELOPMENT);
  });

  it('runs 5-point engineering validation checklist', () => {
    const report = manager.validateProject('proj_pioneer_orb1');
    expect(report.checks.length).toBe(5);

    const twrCheck = report.checks.find(c => c.id === 'val_twr');
    expect(twrCheck).toBeDefined();
    expect(twrCheck?.passed).toBe(true);

    const deltaVCheck = report.checks.find(c => c.id === 'val_deltav');
    expect(deltaVCheck).toBeDefined();
    expect(deltaVCheck?.passed).toBe(true);

    const fairingCheck = report.checks.find(c => c.id === 'val_fairing');
    expect(fairingCheck).toBeDefined();
    expect(fairingCheck?.passed).toBe(true);

    expect(report.isValid).toBe(true);
  });

  it('evaluates mission compatibility accurately', () => {
    const missions = missionRegistry.getAllMissions();
    expect(missions.length).toBeGreaterThan(0);

    const testMission = missions[0]!;
    const analysis = manager.evaluateMissionCompatibility('proj_pioneer_orb1', testMission);

    expect(analysis.missionId).toBe(testMission.id);
    expect(analysis.rocketPayloadCapacityKg).toBeGreaterThan(0);
    expect(analysis.requiredPayloadMassKg).toBeDefined();
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(['OPTIMAL', 'ACCEPTABLE', 'DEFICIENT', 'INCOMPATIBLE']).toContain(analysis.overallRating);
  });

  it('assigns and releases vehicle to active mission', () => {
    const assignSuccess = manager.assignToMission('proj_pioneer_orb1', 'm_suborbital_sounding');
    expect(assignSuccess).toBe(true);

    const assigned = manager.getProject('proj_pioneer_orb1');
    expect(assigned?.assignedMissionId).toBe('m_suborbital_sounding');
    expect(assigned?.status).toBe(RocketProjectStatus.ASSIGNED_TO_MISSION);

    // Unassign
    const unassignSuccess = manager.unassignFromMission('proj_pioneer_orb1');
    expect(unassignSuccess).toBe(true);

    const unassigned = manager.getProject('proj_pioneer_orb1');
    expect(unassigned?.assignedMissionId).toBeUndefined();
    expect(unassigned?.status).toBe(RocketProjectStatus.VALIDATED);
  });

  it('executes hot-fire simulation telemetry test run', () => {
    const result = manager.runHotFireSimulation('proj_pioneer_orb1');
    expect(result.success).toBe(true);
    expect(result.nominalThrustKn).toBeGreaterThan(0);
    expect(result.peakChamberPressureBar).toBeGreaterThan(90);
    expect(result.telemetryLog.length).toBeGreaterThan(3);

    const history = manager.getProjectHistory('proj_pioneer_orb1');
    expect(history.some(e => e.type === RocketEngineeringEventType.TEST_FIRE_SIMULATED)).toBe(true);
  });

  it('serializes and deserializes engineering state properly', () => {
    const saveData = manager.serialize();
    expect(Object.keys(saveData.projects).length).toBeGreaterThanOrEqual(3);
    expect(saveData.activeProjectId).toBeDefined();

    RocketProjectManager.resetInstance();
    const newManager = RocketProjectManager.getInstance();
    newManager.deserialize(saveData);

    expect(newManager.getAllProjects().length).toBe(Object.keys(saveData.projects).length);
    expect(newManager.getActiveProject()?.projectId).toBe(saveData.activeProjectId);
  });
});
