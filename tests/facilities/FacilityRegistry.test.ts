/**
 * INTERSTELLAR CONTINUUM - Facility Registry Unit Tests
 * Verifies all 10 Headquarters Facilities, Pad Alpha, and Arrival Gate metadata,
 * availability states, rank progression gating, and visit tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FacilityRegistry } from '../../src/facilities/FacilityRegistry';
import {
  FacilityId,
  FacilityCategory,
  FacilityAvailabilityState,
  FutureGameplaySystem,
} from '../../src/facilities/FacilityTypes';
import { EventBus } from '../../src/core/EventBus';

describe('FacilityRegistry', () => {
  let registry: FacilityRegistry;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    registry = new FacilityRegistry(eventBus);
  });

  it('registers all 10 core facilities, Pad Alpha, and Arrival Gate with complete metadata', () => {
    const all = registry.getAllFacilities();
    expect(all.length).toBe(12);

    const requiredFacilityIds = [
      FacilityId.MISSION_OPERATIONS,
      FacilityId.ROCKET_ENGINEERING,
      FacilityId.SPACECRAFT_LAB,
      FacilityId.RESEARCH_DEVELOPMENT,
      FacilityId.FINANCE_ADMIN,
      FacilityId.MANUFACTURING_CENTRE,
      FacilityId.ROBOTICS_CENTRE,
      FacilityId.COMMUNICATIONS_CENTRE,
      FacilityId.PLANETARY_DATA_CENTRE,
      FacilityId.SETTINGS_ADMIN,
      FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
      FacilityId.ARRIVAL_GATE,
    ];

    for (const fid of requiredFacilityIds) {
      const f = registry.getFacility(fid);
      expect(f).toBeDefined();
      expect(f?.id).toBe(fid);
      expect(f?.name).toBeTruthy();
      expect(f?.department).toBeTruthy();
      expect(f?.description).toBeTruthy();
      expect(f?.purpose).toBeTruthy();
      expect(f?.iconName).toBeTruthy();
      expect(f?.worldPosition.x).toBeGreaterThan(0);
      expect(f?.worldPosition.y).toBeGreaterThan(0);
      expect(f?.entrancePosition.x).toBeGreaterThan(0);
      expect(f?.entrancePosition.y).toBeGreaterThan(0);
      expect(f?.futureSystem).toBeTruthy();
      expect(f?.futureCapabilities.length).toBeGreaterThan(0);
      expect(f?.visitState).toBeDefined();
      expect(f?.upgradeState).toBeDefined();
    }
  });

  it('correctly maps all 10 primary facilities to their intended future systems', () => {
    const moc = registry.getFacility(FacilityId.MISSION_OPERATIONS)!;
    expect(moc.futureSystem).toBe(FutureGameplaySystem.MISSION_OPERATIONS);
    expect(moc.purpose).toContain('missions');

    const vab = registry.getFacility(FacilityId.ROCKET_ENGINEERING)!;
    expect(vab.futureSystem).toBe(FutureGameplaySystem.ROCKET_ENGINEERING);
    expect(vab.purpose).toContain('launch vehicles');

    const sat = registry.getFacility(FacilityId.SPACECRAFT_LAB)!;
    expect(sat.futureSystem).toBe(FutureGameplaySystem.SPACECRAFT_LABORATORY);
    expect(sat.purpose).toContain('satellites');

    const rnd = registry.getFacility(FacilityId.RESEARCH_DEVELOPMENT)!;
    expect(rnd.futureSystem).toBe(FutureGameplaySystem.RESEARCH_DEVELOPMENT);
    expect(rnd.purpose).toContain('research');

    const adm = registry.getFacility(FacilityId.FINANCE_ADMIN)!;
    expect(adm.futureSystem).toBe(FutureGameplaySystem.FINANCE_ADMINISTRATION);
    expect(adm.purpose).toContain('finances');

    const mfg = registry.getFacility(FacilityId.MANUFACTURING_CENTRE)!;
    expect(mfg.futureSystem).toBe(FutureGameplaySystem.RESOURCE_MANUFACTURING);
    expect(mfg.purpose).toContain('materials');

    const rob = registry.getFacility(FacilityId.ROBOTICS_CENTRE)!;
    expect(rob.futureSystem).toBe(FutureGameplaySystem.ROBOTICS_EXPLORATION);
    expect(rob.purpose).toContain('robotic exploration');

    const com = registry.getFacility(FacilityId.COMMUNICATIONS_CENTRE)!;
    expect(com.futureSystem).toBe(FutureGameplaySystem.COMMUNICATIONS_NETWORK);
    expect(com.purpose).toContain('communication');

    const pln = registry.getFacility(FacilityId.PLANETARY_DATA_CENTRE)!;
    expect(pln.futureSystem).toBe(FutureGameplaySystem.PLANETARY_DATA);
    expect(pln.purpose).toContain('scientific observations');

    const sys = registry.getFacility(FacilityId.SETTINGS_ADMIN)!;
    expect(sys.futureSystem).toBe(FutureGameplaySystem.SYSTEM_ADMINISTRATION);
    expect(sys.purpose).toContain('game configuration');
  });

  it('evaluates facility availability and rank gating accurately', () => {
    // By default, initial facilities are operational and available at rank 0
    const checkOpen = registry.isAvailable(FacilityId.MISSION_OPERATIONS, 0);
    expect(checkOpen.available).toBe(true);
    expect(checkOpen.state).toBe(FacilityAvailabilityState.OPERATIONAL);

    // Lock a facility and verify it becomes unavailable
    registry.setAvailability(
      FacilityId.SPACECRAFT_LAB,
      FacilityAvailabilityState.LOCKED,
      'Classified military payload undergoing decontamination.'
    );

    const checkLocked = registry.isAvailable(FacilityId.SPACECRAFT_LAB, 0);
    expect(checkLocked.available).toBe(false);
    expect(checkLocked.state).toBe(FacilityAvailabilityState.LOCKED);
    expect(checkLocked.reason).toContain('Classified military payload');

    // Simulate high rank requirement
    const rnd = registry.getFacility(FacilityId.RESEARCH_DEVELOPMENT)!;
    rnd.requiredRank = 3;
    rnd.requiredRankTitle = 'RANK 3: INTERPLANETARY COALITION';

    const checkUnderRank = registry.isAvailable(FacilityId.RESEARCH_DEVELOPMENT, 1);
    expect(checkUnderRank.available).toBe(false);
    expect(checkUnderRank.reason).toContain('Requires Organisation Rank 3');

    const checkMetRank = registry.isAvailable(FacilityId.RESEARCH_DEVELOPMENT, 3);
    expect(checkMetRank.available).toBe(true);
  });

  it('tracks visits and records first/last timestamps while emitting domain events', () => {
    let emittedEvent: any = null;
    eventBus.on('facility:visited', (data: any) => {
      emittedEvent = data;
    });

    const fid = FacilityId.MISSION_OPERATIONS;
    const fac = registry.getFacility(fid)!;

    expect(fac.visitState.visited).toBe(false);
    expect(fac.visitState.visitCount).toBe(0);

    registry.recordVisit(fid);

    expect(fac.visitState.visited).toBe(true);
    expect(fac.visitState.visitCount).toBe(1);
    expect(fac.visitState.firstVisitedTimestamp).toBeGreaterThan(0);
    expect(fac.visitState.lastVisitedTimestamp).toBe(fac.visitState.firstVisitedTimestamp);
    expect(emittedEvent?.facilityId).toBe(fid);
    expect(emittedEvent?.visitCount).toBe(1);

    registry.recordVisit(fid);
    expect(fac.visitState.visitCount).toBe(2);
  });

  it('upgrades facility tiers and prevents exceeding maximum tier', () => {
    let upgradedData: any = null;
    eventBus.on('facility:upgraded', (data: any) => {
      upgradedData = data;
    });

    const fid = FacilityId.ROCKET_ENGINEERING;
    const fac = registry.getFacility(fid)!;
    expect(fac.upgradeState.currentTier).toBe(1);
    expect(fac.upgradeState.maxTier).toBe(4);

    const success = registry.upgradeFacility(fid);
    expect(success).toBe(true);
    expect(fac.upgradeState.currentTier).toBe(2);
    expect(upgradedData?.newTier).toBe(2);

    // Advance to max tier
    registry.upgradeFacility(fid);
    registry.upgradeFacility(fid);
    expect(fac.upgradeState.currentTier).toBe(4);

    // Attempting further upgrade fails gracefully
    const overflow = registry.upgradeFacility(fid);
    expect(overflow).toBe(false);
    expect(fac.upgradeState.currentTier).toBe(4);
  });

  it('filters facilities correctly by category', () => {
    const researchFacilities = registry.getFacilitiesByCategory(FacilityCategory.RESEARCH);
    expect(researchFacilities.length).toBe(1);
    expect(researchFacilities[0]?.id).toBe(FacilityId.RESEARCH_DEVELOPMENT);

    const controlFacilities = registry.getFacilitiesByCategory(FacilityCategory.MISSION_CONTROL);
    expect(controlFacilities.length).toBe(1);
    expect(controlFacilities[0]?.id).toBe(FacilityId.MISSION_OPERATIONS);
  });
});
