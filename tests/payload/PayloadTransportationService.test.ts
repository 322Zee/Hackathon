import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { MissionDifficulty } from '../../src/missions/MissionTypes';
import {
  PayloadTransportationService,
  PayloadCategory,
  TransportationMissionDefinition,
} from '../../src/payload';

describe('PayloadTransportationService - Integration Facade', () => {
  let service: PayloadTransportationService;

  beforeEach(() => {
    PayloadTransportationService.resetInstance();
    service = PayloadTransportationService.getInstance();
  });

  it('1. getPayload retrieves defined payload specifications', () => {
    const payload = service.getPayload('payload_sat_pioneer_transponder');
    expect(payload).toBeDefined();
    expect(payload?.name).toBe('Pioneer Orbital Transponder');
    expect(payload?.category).toBe(PayloadCategory.COMMUNICATION_SATELLITES);
    expect(payload?.massRating).toBe(45);
  });

  it('2. listPayloads lists and filters registered payloads', () => {
    const all = service.listPayloads();
    expect(all.length).toBeGreaterThanOrEqual(25);

    const rovers = service.listPayloads({ category: PayloadCategory.ROBOTIC_ROVERS });
    expect(rovers.length).toBeGreaterThanOrEqual(3);
  });

  it('3. getAvailablePayloads retrieves available in-stock payloads', () => {
    const available = service.getAvailablePayloads();
    expect(available.length).toBeGreaterThan(0);
    available.forEach((p) => {
      expect(p.quantity).toBeGreaterThan(0);
    });
  });

  it('4. assignPayload assigns payload to vehicle manifest', () => {
    const vehicleId = 'platform_sat_bus_standard';
    const payloadId = 'payload_sat_pioneer_transponder';

    const res = service.assignPayload(vehicleId, payloadId, 1);
    expect(res.success).toBe(true);

    const manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.get(payloadId)?.quantity).toBe(1);
    expect(manifest.totalMassRating).toBe(45);
  });

  it('5. removePayload removes assigned payload and refunds inventory', () => {
    const vehicleId = 'platform_sat_bus_standard';
    const payloadId = 'payload_sat_pioneer_transponder';

    service.assignPayload(vehicleId, payloadId, 2);
    expect(service.inventoryManager.getAvailableQuantity(payloadId)).toBe(1);

    const remRes = service.removePayload(vehicleId, payloadId, 1);
    expect(remRes.success).toBe(true);
    expect(service.inventoryManager.getAvailableQuantity(payloadId)).toBe(2);

    const manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.get(payloadId)?.quantity).toBe(1);
  });

  it('6. validatePayloadAssignment performs complete capacity and constraint checks', () => {
    const vehicleId = 'platform_sat_bus_standard'; // 90 Mass, 80 Power, 2 Slots

    // Valid assignment
    service.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 1);
    const validResult = service.validatePayloadAssignment(vehicleId);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors.length).toBe(0);

    // Overload mass (add 2 more pioneers = 135 Mass > 90 Mass)
    service.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 2);
    const invalidResult = service.validatePayloadAssignment(vehicleId);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('7. createTransportationMission registers a new data-driven mission definition', () => {
    const newMission: TransportationMissionDefinition = {
      id: 'TRANS_NEW_ORBITAL_STATION_SUPPLY',
      name: 'Project Horizon: Station Re-Supply Drop',
      shortCode: 'TRN-HOR-01',
      destinationId: DestinationId.EARTH_ORBIT_LEO,
      briefing: {
        summary: 'Deliver life support gas canisters to Horizon Station.',
        description: 'Scheduled orbital resupply run.',
        scientificPurpose: 'Station logistics.',
        educationalConcept: 'Orbital rendezvous mechanics.',
        realWorldParallel: 'SpaceX Dragon and Cygnus cargo resupply missions to ISS.',
      },
      requiredPayloads: [
        {
          payloadId: 'payload_cargo_life_support_gases',
          requiredQuantity: 4,
          deliveredQuantity: 0,
        },
      ],
      deliveryConditions: {
        destinationId: DestinationId.EARTH_ORBIT_LEO,
      },
      missionCost: {
        allocatedCredits: 100000,
        launchCostCapCredits: 80000,
      },
      estimatedDurationDays: 2,
      difficulty: MissionDifficulty.EASY,
      rewards: {
        credits: 140000,
        researchData: 100,
        rawMaterials: 150,
        technologyPoints: 2,
        agencyPrestige: 20,
      },
      unlockRequirements: {
        requiredDirectorRank: 1,
        requiredMissionIds: [],
        requiredTechNodeIds: [],
        requiredDestinationUnlocked: true,
      },
      optionalSecondaryObjectives: [],
      completionCriteria: ['4x Atmosphere Canisters delivered'],
      isReplayable: true,
    };

    const created = service.createTransportationMission(newMission);
    expect(created).toBe(true);

    const retrieved = service.getTransportationMission('TRANS_NEW_ORBITAL_STATION_SUPPLY');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Project Horizon: Station Re-Supply Drop');
  });

  it('8. getTransportationMission returns authored mission specifications', () => {
    const mission = service.getTransportationMission('TRANS_MARS_ROVER_COMBINED_01');
    expect(mission).toBeDefined();
    expect(mission?.destinationId).toBe(DestinationId.MARS);
    expect(mission?.explorationObjectives?.length).toBe(2);
  });

  it('9 & 10. updateDeliveryProgress and confirmPayloadDelivery verify deliveries', () => {
    const missionId = 'TRANS_LEO_PIONEER_RELAY';
    service.acceptTransportationMission(missionId, 'platform_sat_bus_standard');

    // Confirm delivery using confirmPayloadDelivery
    const res = service.confirmPayloadDelivery(
      missionId,
      'payload_sat_pioneer_transponder',
      1
    );

    expect(res.success).toBe(true);
    expect(res.isPayloadRequirementComplete).toBe(true);
    expect(res.allDeliveriesComplete).toBe(true);
    expect(res.isMissionFullyComplete).toBe(true);

    const instance = service.missionManager.getActiveInstance(missionId);
    expect(instance?.status).toBe('COMPLETED');
  });
});
