import { describe, it, expect, beforeEach } from 'vitest';
import {
  PayloadAssignmentService,
  PayloadRegistry,
  PayloadInventoryManager,
  SpacecraftAdapterRegistry,
  PayloadEventBus,
} from '../../src/payload';

describe('PayloadAssignmentService', () => {
  let service: PayloadAssignmentService;
  let registry: PayloadRegistry;
  let inventory: PayloadInventoryManager;
  let adapterRegistry: SpacecraftAdapterRegistry;
  let eventBus: PayloadEventBus;

  beforeEach(() => {
    PayloadRegistry.resetInstance();
    PayloadInventoryManager.resetInstance();
    SpacecraftAdapterRegistry.resetInstance();
    PayloadEventBus.resetInstance();
    PayloadAssignmentService.resetInstance();

    registry = PayloadRegistry.getInstance();
    inventory = PayloadInventoryManager.getInstance(registry);
    adapterRegistry = SpacecraftAdapterRegistry.getInstance();
    eventBus = PayloadEventBus.getInstance();
    service = PayloadAssignmentService.getInstance(
      registry,
      inventory,
      adapterRegistry,
      undefined,
      eventBus
    );
  });

  it('assigns payloads to vehicle manifest and consumes warehouse stock', () => {
    const vehicleId = 'platform_sat_bus_standard';
    const payloadId = 'payload_sat_pioneer_transponder';

    const res = service.assignPayload(vehicleId, payloadId, 1);
    expect(res.success).toBe(true);

    const manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.size).toBe(1);

    const item = manifest.assignedPayloads.get(payloadId);
    expect(item?.quantity).toBe(1);
    expect(item?.totalMassRating).toBe(45);
    expect(item?.totalPowerRequirement).toBe(35);
    expect(item?.totalStorageRequirement).toBe(1);

    expect(manifest.totalMassRating).toBe(45);
    expect(manifest.totalPowerRequirement).toBe(35);
    expect(manifest.totalStorageUsed).toBe(1);

    // Available inventory should be reduced
    expect(inventory.getAvailableQuantity(payloadId)).toBe(2);
  });

  it('dispatches PayloadAssigned and PayloadRemoved typed domain events', () => {
    const vehicleId = 'platform_sat_bus_standard';
    const payloadId = 'payload_sat_pioneer_transponder';

    let assignedFired = false;
    let removedFired = false;

    eventBus.on('PayloadAssigned', (ev) => {
      assignedFired = true;
      expect(ev.payloadId).toBe(payloadId);
      expect(ev.vehicleId).toBe(vehicleId);
      expect(ev.quantity).toBe(1);
    });

    eventBus.on('PayloadRemoved', (ev) => {
      removedFired = true;
      expect(ev.payloadId).toBe(payloadId);
      expect(ev.quantity).toBe(1);
    });

    service.assignPayload(vehicleId, payloadId, 1);
    expect(assignedFired).toBe(true);

    service.removePayload(vehicleId, payloadId, 1);
    expect(removedFired).toBe(true);
  });

  it('modifies quantities dynamically with setPayloadQuantity', () => {
    const vehicleId = 'platform_sat_bus_standard';
    const payloadId = 'payload_sat_pioneer_transponder';

    // Increase to 2
    service.setPayloadQuantity(vehicleId, payloadId, 2);
    let manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.get(payloadId)?.quantity).toBe(2);
    expect(manifest.totalMassRating).toBe(90);

    // Decrease to 1
    service.setPayloadQuantity(vehicleId, payloadId, 1);
    manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.get(payloadId)?.quantity).toBe(1);
    expect(manifest.totalMassRating).toBe(45);

    // Decrease to 0 (removes from manifest)
    service.setPayloadQuantity(vehicleId, payloadId, 0);
    manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.has(payloadId)).toBe(false);
    expect(manifest.totalMassRating).toBe(0);
  });

  it('computes remaining capacity metrics accurately', () => {
    const vehicleId = 'platform_sat_bus_standard'; // Capacity: 90 Mass, 80 Power, 2 Slots
    const payloadId = 'payload_sat_pioneer_transponder'; // 45 Mass, 35 Power, 1 Slot

    service.assignPayload(vehicleId, payloadId, 1);
    const metrics = service.getRemainingCapacity(vehicleId);

    expect(metrics.remainingMassRating).toBe(45);
    expect(metrics.remainingPowerRating).toBe(45);
    expect(metrics.remainingStorageSlots).toBe(1);
    expect(metrics.isWithinMassLimit).toBe(true);
    expect(metrics.isWithinPowerLimit).toBe(true);
    expect(metrics.isWithinStorageLimit).toBe(true);
    expect(metrics.isFullyWithinLimits).toBe(true);
  });

  it('evaluates compatibility feedback between vehicle and payload', () => {
    const busVehicleId = 'platform_sat_bus_standard';
    const satellitePayloadId = 'payload_sat_pioneer_transponder';
    const heavyRoverPayloadId = 'payload_rover_titan_heavy';

    // Bus is compatible with Pioneer Transponder
    const goodFeedback = service.getCompatibilityFeedback(
      busVehicleId,
      satellitePayloadId
    );
    expect(goodFeedback.isCompatible).toBe(true);
    expect(goodFeedback.fairingClearanceOk).toBe(true);

    // Bus is NOT compatible with Titan Heavy Rover (requires 3.8m fairing, planetary rover mount)
    const badFeedback = service.getCompatibilityFeedback(
      busVehicleId,
      heavyRoverPayloadId
    );
    expect(badFeedback.isCompatible).toBe(false);
  });

  it('detects missing requirements for mission contracts', () => {
    const vehicleId = 'platform_sat_bus_standard';
    const required = [
      { payloadId: 'payload_sat_pioneer_transponder', requiredQuantity: 2 },
      { payloadId: 'payload_inst_gamma_spectrometer', requiredQuantity: 1 },
    ];

    // Assign only 1 Pioneer transponder
    service.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 1);

    const analysis = service.getMissingRequirements(vehicleId, required);
    expect(analysis.isComplete).toBe(false);
    expect(analysis.missingItems.length).toBe(2);

    expect(analysis.missingItems[0].payloadId).toBe('payload_sat_pioneer_transponder');
    expect(analysis.missingItems[0].deficit).toBe(1);

    expect(analysis.missingItems[1].payloadId).toBe('payload_inst_gamma_spectrometer');
    expect(analysis.missingItems[1].deficit).toBe(1);
  });

  it('clears vehicle manifest and restores inventory', () => {
    const vehicleId = 'platform_sat_bus_standard';
    service.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 2);
    expect(inventory.getAvailableQuantity('payload_sat_pioneer_transponder')).toBe(1);

    service.clearVehicleManifest(vehicleId);
    const manifest = service.getVehicleManifest(vehicleId);
    expect(manifest.assignedPayloads.size).toBe(0);
    expect(inventory.getAvailableQuantity('payload_sat_pioneer_transponder')).toBe(3);
  });
});
