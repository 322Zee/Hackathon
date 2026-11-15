import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createMissionBriefingModel,
  INSTRUMENT_METADATA,
  SPACECRAFT_DESCRIPTIONS,
  PAYLOAD_DESCRIPTIONS,
} from '../../src/missions/MissionBriefingModel';
import { MissionCatalogueRegistry } from '../../src/missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { MissionCategory } from '../../src/missions/MissionTypes';

describe('MissionBriefingModel', () => {
  let catalogueRegistry: MissionCatalogueRegistry;
  let destinationRegistry: DestinationRegistry;

  beforeEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
    catalogueRegistry = MissionCatalogueRegistry.getInstance();
    destinationRegistry = DestinationRegistry.getInstance();
  });

  afterEach(() => {
    MissionCatalogueRegistry.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('generates a complete 10-section briefing model for an available mission (Pioneer-1 LEO)', () => {
    const mission = catalogueRegistry.getMissionById('EARTH_LEO_DEPLOYMENT_01');
    expect(mission).toBeDefined();

    const briefing = createMissionBriefingModel(mission!, catalogueRegistry, destinationRegistry);

    // 1. Mission Overview
    expect(briefing.missionId).toBe('EARTH_LEO_DEPLOYMENT_01');
    expect(briefing.name).toContain('Pioneer');
    expect(briefing.shortCode).toBe('MSN-EARTH-01');
    expect(briefing.category).toBe(MissionCategory.TRANSPORTATION);
    expect(briefing.isAvailable).toBe(true);
    expect(briefing.isCompleted).toBe(false);
    expect(briefing.isActive).toBe(false);
    expect(briefing.estimatedDurationDays).toBeGreaterThan(0);
    expect(briefing.summary.length).toBeGreaterThan(20);

    // 2. Scientific Purpose
    expect(briefing.scientificQuestion.length).toBeGreaterThan(10);
    expect(briefing.scientificContext.length).toBeGreaterThan(10);
    expect(briefing.expectedLearning.length).toBeGreaterThan(5);
    expect(briefing.observationsRequired.length).toBeGreaterThan(0);

    // 3. Primary Objectives
    expect(briefing.primaryObjectives.length).toBeGreaterThan(0);
    expect(briefing.primaryObjectives.every((o) => o.importance === 'MANDATORY')).toBe(true);
    expect(briefing.primaryObjectives[0]?.conditionText).toBeDefined();

    // 4. Optional Objectives
    expect(briefing.optionalObjectives).toBeDefined();

    // 5. Destination Information
    expect(briefing.destination.id).toBe(DestinationId.EARTH_ORBIT_LEO);
    expect(briefing.destination.name).toBeDefined();
    expect(briefing.destination.surfaceClassification).toBeDefined();
    expect(briefing.destination.surfaceTempCelsius.min).toBeDefined();
    expect(briefing.destination.communicationLatencySec).toBeLessThan(1.0);
    expect(briefing.destination.surfaceAccess.allowed).toBe(false); // LEO is orbital space, no walkable ground

    // 6. Spacecraft and Payload Requirements
    expect(briefing.spacecraftType).toBe(mission?.engineeringRequirements.spacecraftType);
    expect(briefing.payloadType).toBe(mission?.engineeringRequirements.payloadType);
    expect(briefing.spacecraftDescription.length).toBeGreaterThan(10);
    expect(briefing.payloadDescription.length).toBeGreaterThan(10);
    expect(briefing.equipmentRequirementsSummary.length).toBeGreaterThan(0);

    // 7. Engineering Constraints & Trade-Offs
    expect(briefing.constraints.payloadMassRangeKg.min).toBe(mission?.engineeringRequirements.minPayloadMassKg);
    expect(briefing.constraints.payloadMassRangeKg.max).toBe(mission?.engineeringRequirements.maxPayloadMassKg);
    expect(briefing.constraints.powerDemandWatts).toBe(mission?.engineeringRequirements.minPowerWatts);
    expect(briefing.constraints.batteryCapacityWh).toBe(mission?.engineeringRequirements.minBatteryCapacityWh);
    expect(briefing.constraints.communicationBandwidthKbps).toBe(mission?.engineeringRequirements.communicationBandwidthKbps);
    expect(briefing.constraints.budgetAllocatedCredits).toBe(mission?.budget.allocatedCredits);

    // Trade-off matrix
    expect(briefing.tradeOffs.length).toBeGreaterThanOrEqual(3);
    expect(briefing.tradeOffs.some((t) => t.title.includes('Payload Mass'))).toBe(true);
    expect(briefing.tradeOffs.some((t) => t.title.includes('Electrical Power'))).toBe(true);
    expect(briefing.tradeOffs.some((t) => t.title.includes('Communication'))).toBe(true);

    // 8. Budget and Rewards
    expect(briefing.budget.allocatedCredits).toBe(mission?.budget.allocatedCredits);
    expect(briefing.budget.launchCostCapCredits).toBe(mission?.budget.launchCostCapCredits);
    expect(briefing.guaranteedRewards.credits).toBe(mission?.rewards.credits);
    expect(briefing.guaranteedRewards.researchData).toBe(mission?.rewards.researchData);
    expect(briefing.guaranteedRewards.technologyPoints).toBe(mission?.rewards.technologyPoints);
    expect(briefing.guaranteedRewards.agencyPrestige).toBe(mission?.rewards.agencyPrestige);

    // 9. Prerequisites
    expect(briefing.prerequisites.allMet).toBe(true);
    expect(briefing.prerequisites.unmetReasons).toHaveLength(0);

    // 10. Completion & Failure Conditions
    expect(briefing.successCriteria.length).toBeGreaterThan(0);
    expect(briefing.failureConditions.length).toBeGreaterThan(0);

    // Difficulty score
    expect(briefing.difficultyScore).toBeGreaterThanOrEqual(1);
    expect(briefing.difficultyScore).toBeLessThanOrEqual(5);
    expect(briefing.difficultyFactors.length).toBeGreaterThan(0);
  });

  it('correctly reports unmet prerequisites for a locked mission (Mars Orbiter)', () => {
    const marsMission = catalogueRegistry.getMissionById('MARS_ORBITER_01');
    expect(marsMission).toBeDefined();

    const briefing = createMissionBriefingModel(marsMission!, catalogueRegistry, destinationRegistry);

    expect(briefing.destination.id).toBe(DestinationId.MARS);
    expect(briefing.isAvailable).toBe(false);
    expect(briefing.prerequisites.allMet).toBe(false);
    expect(briefing.prerequisites.destinationUnlocked).toBe(false); // Mars is locked initially
    expect(briefing.prerequisites.unmetReasons.length).toBeGreaterThan(0);
    expect(briefing.prerequisites.unmetReasons.some((r) => r.includes('locked'))).toBe(true);
  });

  it('correctly models hazardous surface safety and equipment on Venus lander', () => {
    const venusLander = catalogueRegistry.getMissionById('VENUS_SURFACE_LANDER_01');
    expect(venusLander).toBeDefined();

    const briefing = createMissionBriefingModel(venusLander!, catalogueRegistry, destinationRegistry);

    expect(briefing.destination.id).toBe(DestinationId.VENUS);
    expect(briefing.destination.surfaceAccess.allowed).toBe(true); // Venus has a solid surface
    expect(briefing.destination.surfaceAccess.specializedEquipmentRequired).toBeDefined();
    expect(briefing.destination.surfaceAccess.specializedEquipmentRequired?.length).toBeGreaterThan(0);
    expect(briefing.destination.surfaceAccess.operationalLimitHours).toBeDefined();
    expect(briefing.destination.surfaceAccess.operationalLimitHours).toBeLessThanOrEqual(5.0);
  });

  it('populates instrument details accurately from scientific instrument metadata', () => {
    const terraVista = catalogueRegistry.getMissionById('EARTH_ORBIT_OBSERVATION_01');
    expect(terraVista).toBeDefined();

    const briefing = createMissionBriefingModel(terraVista!, catalogueRegistry, destinationRegistry);

    expect(briefing.instrumentDetails.length).toBe(terraVista?.engineeringRequirements.requiredInstruments.length);
    for (const inst of briefing.instrumentDetails) {
      expect(inst.name).toBeDefined();
      expect(inst.purpose.length).toBeGreaterThan(10);
      expect(inst.powerConsumptionWatts).toBeGreaterThan(0);
      expect(inst.massKg).toBeGreaterThan(0);
    }
  });

  it('generates distinct combined mission trade-offs for COMBINED missions', () => {
    const combinedMissions = catalogueRegistry.getMissionsByCategory(MissionCategory.COMBINED);
    expect(combinedMissions.length).toBeGreaterThan(0);

    const briefing = createMissionBriefingModel(combinedMissions[0]!, catalogueRegistry, destinationRegistry);

    expect(briefing.category).toBe(MissionCategory.COMBINED);
    expect(briefing.tradeOffs.some((t) => t.title.includes('Dual-Role'))).toBe(true);
  });

  it('provides metadata dictionaries for all instruments, spacecraft, and payloads', () => {
    expect(Object.keys(INSTRUMENT_METADATA).length).toBe(12);
    expect(Object.keys(SPACECRAFT_DESCRIPTIONS).length).toBe(8);
    expect(Object.keys(PAYLOAD_DESCRIPTIONS).length).toBe(9);
  });
});
