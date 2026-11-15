import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { EventBus } from '../../src/core/EventBus';

describe('MissionAcceptance Engine', () => {
  let catalogueRegistry: MissionCatalogueRegistry;
  let destinationRegistry: DestinationRegistry;
  let eventBus: EventBus;

  beforeEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
    eventBus = new EventBus();
    catalogueRegistry = MissionCatalogueRegistry.getInstance(eventBus);
    destinationRegistry = DestinationRegistry.getInstance(eventBus);
  });

  afterEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('accepts an available mission with satisfied prerequisites', () => {
    let acceptedEventPayload: any = null;
    let startedEventPayload: any = null;

    eventBus.on('mission:accepted', (payload) => {
      acceptedEventPayload = payload;
    });
    eventBus.on('mission:started', (payload) => {
      startedEventPayload = payload;
    });

    const result = catalogueRegistry.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(result.success).toBe(true);
    expect(result.mission?.id).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(result.reason).toBeUndefined();

    // Verify active status
    expect(catalogueRegistry.isMissionActive('EARTH_LEO_DEPLOYMENT_01')).toBe(true);
    expect(catalogueRegistry.getActiveMissionIds()).toContain('EARTH_LEO_DEPLOYMENT_01');
    expect(catalogueRegistry.getActiveMissions().some((m) => m.id === 'EARTH_LEO_DEPLOYMENT_01')).toBe(true);

    // Verify events
    expect(acceptedEventPayload).toBeDefined();
    expect(acceptedEventPayload.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(acceptedEventPayload.destinationId).toBe(DestinationId.EARTH_ORBIT_LEO);
    expect(startedEventPayload).toBeDefined();
    expect(startedEventPayload.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
  });

  it('rejects acceptance of nonexistent mission ID', () => {
    let rejectedEventPayload: any = null;
    eventBus.on('mission:rejected', (payload) => {
      rejectedEventPayload = payload;
    });

    const result = catalogueRegistry.acceptMission('NONEXISTENT_MISSION_ID');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('does not exist');

    expect(rejectedEventPayload).toBeDefined();
    expect(rejectedEventPayload.missionId).toBe('NONEXISTENT_MISSION_ID');
  });

  it('rejects duplicate acceptance of already active mission', () => {
    // Accept once
    const firstAccept = catalogueRegistry.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(firstAccept.success).toBe(true);

    // Attempt second accept
    const secondAccept = catalogueRegistry.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(secondAccept.success).toBe(false);
    expect(secondAccept.reason).toContain('already active');
  });

  it('rejects acceptance of already completed mission', () => {
    // Complete the mission
    catalogueRegistry.recordMissionCompletion('EARTH_LEO_DEPLOYMENT_01');
    expect(catalogueRegistry.isMissionCompleted('EARTH_LEO_DEPLOYMENT_01')).toBe(true);

    // Attempt accept
    const result = catalogueRegistry.acceptMission('EARTH_LEO_DEPLOYMENT_01');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('already been completed');
  });

  it('rejects acceptance of mission with unmet prerequisites (Mars Orbiter)', () => {
    let rejectedPayload: any = null;
    eventBus.on('mission:rejected', (payload) => {
      rejectedPayload = payload;
    });

    const result = catalogueRegistry.acceptMission('MARS_ORBITER_01');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('prerequisites unmet');
    expect(rejectedPayload).toBeDefined();
    expect(catalogueRegistry.isMissionActive('MARS_ORBITER_01')).toBe(false);
  });

  it('accepts dependent mission after prerequisite has been completed and destination unlocked', () => {
    // Complete prerequisite
    catalogueRegistry.recordMissionCompletion('EARTH_LEO_DEPLOYMENT_01');
    destinationRegistry.unlockDestination(DestinationId.MOON);

    // Moon survey requires EARTH_LEO_DEPLOYMENT_01 and Moon unlocked
    const result = catalogueRegistry.acceptMission('MOON_ORBIT_SURVEY_01');
    expect(result.success).toBe(true);
    expect(catalogueRegistry.isMissionActive('MOON_ORBIT_SURVEY_01')).toBe(true);
  });
});
