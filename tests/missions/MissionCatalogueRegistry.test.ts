import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import {
  MissionCategory,
  MissionStageType,
  MissionStatus,
} from '../../src/missions/MissionTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';

describe('MissionCatalogueRegistry', () => {
  let registry: MissionCatalogueRegistry;
  let destinationRegistry: DestinationRegistry;

  beforeEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
    registry = MissionCatalogueRegistry.getInstance();
    destinationRegistry = DestinationRegistry.getInstance();
  });

  afterEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('initializes as singleton with built-in authored missions', () => {
    const all = registry.getAllMissions();
    expect(all.length).toBe(21);

    const instance2 = MissionCatalogueRegistry.getInstance();
    expect(instance2).toBe(registry);
  });

  it('retrieves missions by unique ID', () => {
    const pioneer = registry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(pioneer).toBeDefined();
    expect(pioneer?.name).toContain('Pioneer');
    expect(pioneer?.destinationId).toBe(DestinationId.EARTH_ORBIT_LEO);

    const nonExistent = registry.getMissionById('MSN-DOES-NOT-EXIST');
    expect(nonExistent).toBeUndefined();
  });

  it('filters missions by destination ID', () => {
    const leoMissions = registry.getMissionsForDestination(DestinationId.EARTH_ORBIT_LEO);
    expect(leoMissions.length).toBeGreaterThan(0);
    expect(leoMissions.every((m) => m.destinationId === DestinationId.EARTH_ORBIT_LEO)).toBe(true);

    const marsMissions = registry.getMissionsForDestination(DestinationId.MARS);
    expect(marsMissions.length).toBeGreaterThan(0);
    expect(marsMissions.every((m) => m.destinationId === DestinationId.MARS)).toBe(true);
  });

  it('filters missions by category (TRANSPORTATION, SCIENTIFIC_EXPLORATION, COMBINED)', () => {
    const transport = registry.getMissionsByCategory(MissionCategory.TRANSPORTATION);
    const science = registry.getMissionsByCategory(MissionCategory.SCIENTIFIC_EXPLORATION);
    const combined = registry.getMissionsByCategory(MissionCategory.COMBINED);

    expect(transport.length).toBeGreaterThan(0);
    expect(science.length).toBeGreaterThan(0);
    expect(combined.length).toBeGreaterThan(0);

    expect(transport.every((m) => m.category === MissionCategory.TRANSPORTATION)).toBe(true);
    expect(science.every((m) => m.category === MissionCategory.SCIENTIFIC_EXPLORATION)).toBe(true);
    expect(combined.every((m) => m.category === MissionCategory.COMBINED)).toBe(true);

    expect(transport.length + science.length + combined.length).toBe(registry.getAllMissions().length);
  });

  it('filters missions by stage', () => {
    const deploymentStage = registry.getMissionsByStage(MissionStageType.DEPLOYMENT);
    const scienceStage = registry.getMissionsByStage(MissionStageType.SCIENTIFIC_EXPLORATION);

    expect(deploymentStage.length).toBeGreaterThan(0);
    expect(scienceStage.length).toBeGreaterThan(0);
  });

  it('evaluates dynamic mission status (LOCKED vs AVAILABLE vs COMPLETED)', () => {
    // 1. Initial mission with no prerequisites is AVAILABLE
    const m1Status = registry.evaluateMissionStatus('EARTH_LEO_DEPLOYMENT_01');
    expect(m1Status.status).toBe(MissionStatus.AVAILABLE);
    expect(m1Status.isAvailable).toBe(true);
    expect(m1Status.unmetPrerequisites).toHaveLength(0);

    // 2. EARTH_ORBIT_OBSERVATION_01 has EARTH_LEO_DEPLOYMENT_01 as prerequisite -> should be LOCKED initially
    const obsStatus = registry.evaluateMissionStatus('EARTH_ORBIT_OBSERVATION_01');
    expect(obsStatus.status).toBe(MissionStatus.LOCKED);
    expect(obsStatus.isAvailable).toBe(false);
    expect(obsStatus.unmetPrerequisites.some((u) => u.includes('EARTH_LEO_DEPLOYMENT_01'))).toBe(true);

    // 3. Mark EARTH_LEO_DEPLOYMENT_01 as completed
    const markSuccess = registry.recordMissionCompletion('EARTH_LEO_DEPLOYMENT_01');
    expect(markSuccess).toBe(true);
    expect(registry.isMissionCompleted('EARTH_LEO_DEPLOYMENT_01')).toBe(true);

    // 4. Now EARTH_LEO_DEPLOYMENT_01 evaluates to COMPLETED
    const m1Updated = registry.evaluateMissionStatus('EARTH_LEO_DEPLOYMENT_01');
    expect(m1Updated.status).toBe(MissionStatus.COMPLETED);
    expect(m1Updated.isCompleted).toBe(true);

    // 5. EARTH_ORBIT_OBSERVATION_01 now has all prerequisites satisfied -> evaluates to AVAILABLE
    const obsUpdated = registry.evaluateMissionStatus('EARTH_ORBIT_OBSERVATION_01');
    expect(obsUpdated.status).toBe(MissionStatus.AVAILABLE);
    expect(obsUpdated.isAvailable).toBe(true);
    expect(obsUpdated.unmetPrerequisites).toHaveLength(0);
  });

  it('tracks completed mission IDs and allows resetting progress', () => {
    registry.recordMissionCompletion('EARTH_LEO_DEPLOYMENT_01');
    registry.recordMissionCompletion('EARTH_ORBIT_OBSERVATION_01');

    expect(registry.getCompletedMissionIds()).toEqual(
      expect.arrayContaining(['EARTH_LEO_DEPLOYMENT_01', 'EARTH_ORBIT_OBSERVATION_01'])
    );

    registry.resetProgress();
    expect(registry.getCompletedMissionIds()).toHaveLength(0);
    expect(registry.isMissionCompleted('EARTH_LEO_DEPLOYMENT_01')).toBe(false);
  });

  it('synchronizes mission counts with DestinationRegistry', () => {
    // 1. Initial sync: LEO has available missions, Moon has none because it is locked
    registry.syncDestinationMissionCounts();
    const leo = destinationRegistry.getDestination(DestinationId.EARTH_ORBIT_LEO);
    expect(leo?.availableMissionsCount).toBeGreaterThan(0);
    expect(leo?.completedMissionsCount).toBe(0);

    // 2. Complete prerequisite and unlock Moon
    registry.recordMissionCompletion('EARTH_LEO_DEPLOYMENT_01');
    destinationRegistry.unlockDestination(DestinationId.MOON);
    registry.syncDestinationMissionCounts();

    const moon = destinationRegistry.getDestination(DestinationId.MOON);
    const leoUpdated = destinationRegistry.getDestination(DestinationId.EARTH_ORBIT_LEO);

    expect(moon?.availableMissionsCount).toBeGreaterThan(0);
    expect(leoUpdated?.completedMissionsCount).toBe(1);
  });
});
