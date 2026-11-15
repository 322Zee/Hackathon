import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { MissionDifficulty } from '../../src/missions/MissionTypes';
import {
  TransportationMissionManager,
  PayloadRegistry,
  PayloadInventoryManager,
  PayloadAssignmentService,
  PayloadEventBus,
  TransportationMissionStatus,
  TransportationMissionDefinition,
} from '../../src/payload';

describe('TransportationMissionManager', () => {
  let missionManager: TransportationMissionManager;
  let registry: PayloadRegistry;
  let inventory: PayloadInventoryManager;
  let eventBus: PayloadEventBus;

  beforeEach(() => {
    PayloadRegistry.resetInstance();
    PayloadInventoryManager.resetInstance();
    PayloadEventBus.resetInstance();
    PayloadAssignmentService.resetInstance();
    TransportationMissionManager.resetInstance();

    registry = PayloadRegistry.getInstance();
    inventory = PayloadInventoryManager.getInstance(registry);
    eventBus = PayloadEventBus.getInstance();
    missionManager = TransportationMissionManager.getInstance(
      registry,
      inventory,
      undefined,
      eventBus
    );
  });

  it('loads authored default transportation missions covering all domains', () => {
    const missions = missionManager.listTransportationMissions();
    expect(missions.length).toBeGreaterThanOrEqual(4);

    const leoMission = missionManager.getTransportationMission('TRANS_LEO_PIONEER_RELAY');
    expect(leoMission).toBeDefined();
    expect(leoMission?.destinationId).toBe(DestinationId.EARTH_ORBIT_LEO);
    expect(leoMission?.briefing.educationalConcept).toContain('Line-of-Sight Communications');

    const lunarMulti = missionManager.getTransportationMission('TRANS_LUNAR_BASE_MODULES_01');
    expect(lunarMulti).toBeDefined();
    expect(lunarMulti?.requiredPayloads.length).toBe(3); // Multi-payload!
  });

  it('accepts a mission and reserves required inventory', () => {
    const missionId = 'TRANS_LEO_PIONEER_RELAY';
    let reservedEventFired = false;

    eventBus.on('PayloadReserved', (ev) => {
      if (ev.missionId === missionId) {
        reservedEventFired = true;
        expect(ev.payloadId).toBe('payload_sat_pioneer_transponder');
        expect(ev.quantity).toBe(1);
      }
    });

    const instance = missionManager.acceptMission(missionId, 'platform_sat_bus_standard');
    expect(instance).toBeDefined();
    expect(instance?.status).toBe(TransportationMissionStatus.ACCEPTED);
    expect(reservedEventFired).toBe(true);

    const inv = inventory.getInventoryRecord('payload_sat_pioneer_transponder');
    expect(inv?.reserved).toBe(1);
    expect(inv?.available).toBe(2);
  });

  it('manages multi-payload delivery progress and completes delivery objectives', () => {
    const missionId = 'TRANS_LUNAR_BASE_MODULES_01';
    missionManager.acceptMission(missionId, 'platform_surface_lander_heavy');

    let deliveryCompletedCount = 0;
    eventBus.on('DeliveryObjectiveCompleted', (ev) => {
      if (ev.missionId === missionId) {
        deliveryCompletedCount++;
      }
    });

    // 1. Deliver FSP-10 Reactor (1 required)
    const r1 = missionManager.confirmPayloadDelivery(
      missionId,
      'payload_pwr_fission_reactor_10',
      1
    );
    expect(r1.success).toBe(true);
    expect(r1.isPayloadRequirementComplete).toBe(true);
    expect(r1.allDeliveriesComplete).toBe(false);

    // 2. Deliver Regolith Sintering Printer (1 required)
    const r2 = missionManager.confirmPayloadDelivery(
      missionId,
      'payload_mfg_regolith_sintering_printer',
      1
    );
    expect(r2.success).toBe(true);
    expect(r2.isPayloadRequirementComplete).toBe(true);
    expect(r2.allDeliveriesComplete).toBe(false);

    // 3. Deliver Life Support Gases partially (1 of 2 delivered)
    const r3Part = missionManager.confirmPayloadDelivery(
      missionId,
      'payload_cargo_life_support_gases',
      1
    );
    expect(r3Part.success).toBe(true);
    expect(r3Part.isPayloadRequirementComplete).toBe(false);
    expect(r3Part.allDeliveriesComplete).toBe(false);

    // 4. Deliver remaining 1 Life Support Gas (2 of 2 delivered)
    const r3Final = missionManager.confirmPayloadDelivery(
      missionId,
      'payload_cargo_life_support_gases',
      1
    );
    expect(r3Final.success).toBe(true);
    expect(r3Final.isPayloadRequirementComplete).toBe(true);
    expect(r3Final.allDeliveriesComplete).toBe(true);
    expect(r3Final.isMissionFullyComplete).toBe(true);

    expect(deliveryCompletedCount).toBe(3);
    expect(missionManager.isMissionCompleted(missionId)).toBe(true);
  });

  it('supports combined missions where payload delivery transitions into a follow-up exploration phase', () => {
    const missionId = 'TRANS_MARS_ROVER_COMBINED_01';
    const instance = missionManager.acceptMission(missionId, 'platform_surface_lander_heavy')!;

    // Exploration objectives should be pending delivery
    const expTraversal = instance.explorationProgress.get('exp_mars_jezero_traversal')!;
    expect(expTraversal.isCompleted).toBe(false);

    // Attempting to advance exploration before delivery should be rejected
    const earlyDrive = missionManager.updateExplorationObjectiveProgress(
      missionId,
      'exp_mars_jezero_traversal',
      1000
    );
    expect(earlyDrive).toBe(false);

    // 1. Deliver all 3 required payloads (Rover, Aeroshell, SkyCrane)
    missionManager.confirmPayloadDelivery(missionId, 'payload_rover_titan_heavy', 1);
    missionManager.confirmPayloadDelivery(missionId, 'payload_land_aeroshell_shield', 1);
    const finalDeliv = missionManager.confirmPayloadDelivery(
      missionId,
      'payload_land_skycrane_descent',
      1
    );

    expect(finalDeliv.allDeliveriesComplete).toBe(true);
    expect(finalDeliv.enteredExplorationPhase).toBe(true);
    expect(finalDeliv.isMissionFullyComplete).toBe(false); // Not complete yet, exploration remains!
    expect(instance.status).toBe(TransportationMissionStatus.EXPLORATION_PHASE);

    // 2. Advance exploration phase: Drive rover 5,000 meters
    const driveOk = missionManager.updateExplorationObjectiveProgress(
      missionId,
      'exp_mars_jezero_traversal',
      5000
    );
    expect(driveOk).toBe(true);
    expect(instance.explorationProgress.get('exp_mars_jezero_traversal')?.isCompleted).toBe(true);
    expect(instance.status).toBe(TransportationMissionStatus.EXPLORATION_PHASE);

    // 3. Complete rock sampling drill objective: 3 core samples
    const sampleOk = missionManager.updateExplorationObjectiveProgress(
      missionId,
      'exp_mars_core_sample_drill',
      3
    );
    expect(sampleOk).toBe(true);
    expect(instance.explorationProgress.get('exp_mars_core_sample_drill')?.isCompleted).toBe(true);

    // Now all deliveries AND exploration objectives are complete!
    expect(instance.allExplorationsComplete).toBe(true);
    expect(instance.status).toBe(TransportationMissionStatus.COMPLETED);
    expect(missionManager.isMissionCompleted(missionId)).toBe(true);
  });

  it('cancels mission and safely rolls back reserved inventory', () => {
    const missionId = 'TRANS_LEO_PIONEER_RELAY';
    missionManager.acceptMission(missionId);

    const invBefore = inventory.getInventoryRecord('payload_sat_pioneer_transponder');
    expect(invBefore?.reserved).toBe(1);

    const cancelled = missionManager.cancelMission(missionId, 'Mission aborted by user');
    expect(cancelled).toBe(true);

    const invAfter = inventory.getInventoryRecord('payload_sat_pioneer_transponder');
    expect(invAfter?.reserved).toBe(0);
    expect(invAfter?.available).toBe(3); // Restored
  });

  it('creates and registers custom transportation missions dynamically', () => {
    const customMission: TransportationMissionDefinition = {
      id: 'TRANS_CUSTOM_VENUS_PROBE',
      name: 'Project Aphrodite: Venus Cloud Probe Delivery',
      shortCode: 'TRN-VEN-01',
      destinationId: DestinationId.VENUS,
      briefing: {
        summary: 'Deploy atmospheric mass spectrometer into Venus cloud layer.',
        description: 'Sample acidic clouds at 55 km altitude for phosphine traces.',
        scientificPurpose: 'Atmospheric chemistry.',
        educationalConcept: 'Super-rotation of Venusian atmosphere.',
        realWorldParallel: 'Pioneer Venus Multiprobe and Soviet Vega missions.',
      },
      requiredPayloads: [
        {
          payloadId: 'payload_inst_mass_spectrometer',
          requiredQuantity: 1,
          deliveredQuantity: 0,
        },
      ],
      deliveryConditions: {
        destinationId: DestinationId.VENUS,
      },
      missionCost: {
        allocatedCredits: 300000,
        launchCostCapCredits: 250000,
      },
      estimatedDurationDays: 120,
      difficulty: MissionDifficulty.MEDIUM,
      rewards: {
        credits: 400000,
        researchData: 500,
        rawMaterials: 200,
        technologyPoints: 5,
        agencyPrestige: 60,
      },
      unlockRequirements: {
        requiredDirectorRank: 2,
        requiredMissionIds: [],
        requiredTechNodeIds: [],
        requiredDestinationUnlocked: true,
      },
      optionalSecondaryObjectives: [],
      completionCriteria: ['Venus atmospheric spectrometer delivered'],
      isReplayable: true,
    };

    const registered = missionManager.registerTransportationMission(customMission);
    expect(registered).toBe(true);

    const retrieved = missionManager.getTransportationMission('TRANS_CUSTOM_VENUS_PROBE');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Project Aphrodite: Venus Cloud Probe Delivery');
  });
});
