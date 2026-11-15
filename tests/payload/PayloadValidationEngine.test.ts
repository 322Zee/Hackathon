import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PayloadValidationEngine,
  PayloadRegistry,
  PayloadInventoryManager,
  SpacecraftAdapterRegistry,
  PayloadAssignmentService,
  PayloadValidationCode,
} from '../../src/payload';

describe('PayloadValidationEngine', () => {
  let validationEngine: PayloadValidationEngine;
  let registry: PayloadRegistry;
  let inventory: PayloadInventoryManager;
  let adapterRegistry: SpacecraftAdapterRegistry;
  let assignmentService: PayloadAssignmentService;

  beforeEach(() => {
    PayloadRegistry.resetInstance();
    PayloadInventoryManager.resetInstance();
    SpacecraftAdapterRegistry.resetInstance();
    PayloadValidationEngine.resetInstance();
    PayloadAssignmentService.resetInstance();

    registry = PayloadRegistry.getInstance();
    inventory = PayloadInventoryManager.getInstance(registry);
    adapterRegistry = SpacecraftAdapterRegistry.getInstance();
    validationEngine = PayloadValidationEngine.getInstance(registry, inventory);
    assignmentService = PayloadAssignmentService.getInstance(
      registry,
      inventory,
      adapterRegistry,
      validationEngine
    );
  });

  it('validates a compliant manifest with zero errors', () => {
    const vehicleId = 'platform_sat_bus_standard'; // 90 Mass, 80 Power, 2 Slots
    assignmentService.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 1); // 45 Mass, 35 Power, 1 Slot

    const result = assignmentService.validateVehicleAssignment(vehicleId);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.metrics.isFullyWithinLimits).toBe(true);
  });

  it('flags error when payload mass exceeds vehicle capacity rating', () => {
    const vehicleId = 'platform_sat_bus_standard'; // 90 Mass max
    // Assign 2x Pioneer (90 Mass) + 1x Gamma Spectrometer (30 Mass) = 120 Mass > 90 Mass
    assignmentService.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 2);
    assignmentService.assignPayload(vehicleId, 'payload_inst_gamma_spectrometer', 1);

    const result = assignmentService.validateVehicleAssignment(vehicleId);
    expect(result.isValid).toBe(false);

    const massError = result.errors.find(
      (e) => e.code === PayloadValidationCode.CAPACITY_MASS_EXCEEDED
    );
    expect(massError).toBeDefined();
    expect(massError?.message).toContain('Total payload mass (120 Mass Units) exceeds vehicle capacity of 90 MU');
    expect(massError?.remedyRecommendation).toContain('Remove heavy cargo items');
  });

  it('flags error when power demand exceeds available budget', () => {
    const vehicleId = 'platform_sat_bus_standard'; // 80 Power max
    // Assign 2x Pioneer (70 Power) + 1x Gamma Spectrometer (25 Power) = 95 Power > 80 Power
    assignmentService.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 2);
    assignmentService.assignPayload(vehicleId, 'payload_inst_gamma_spectrometer', 1);

    const result = assignmentService.validateVehicleAssignment(vehicleId);
    const powerError = result.errors.find(
      (e) => e.code === PayloadValidationCode.CAPACITY_POWER_EXCEEDED
    );
    expect(powerError).toBeDefined();
    expect(powerError?.message).toContain('Payload power demand (95 PWR) exceeds vehicle available electrical budget (80 PWR)');
  });

  it('flags error when storage slots are exceeded', () => {
    const vehicleId = 'platform_sat_bus_standard'; // 2 Slots max
    // Assign 3x Pioneer (3 Slots) > 2 Slots
    assignmentService.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 3);

    const result = assignmentService.validateVehicleAssignment(vehicleId);
    const storageError = result.errors.find(
      (e) => e.code === PayloadValidationCode.CAPACITY_STORAGE_EXCEEDED
    );
    expect(storageError).toBeDefined();
    expect(storageError?.message).toContain('Payload storage requirement (3 Slots) exceeds vehicle compartment volume (2 Slots)');
  });

  it('flags error when payload is incompatible with vehicle classification', () => {
    const vehicleId = 'platform_sat_bus_standard'; // Satellite Bus only
    // Force mount a heavy rover without appropriate carrier
    const roverPayload = registry.getPayload('payload_rover_titan_heavy')!;
    const vehicle = adapterRegistry.getVehicle(vehicleId)!;

    const manifest = assignmentService.getVehicleManifest(vehicleId);
    manifest.assignedPayloads.set(roverPayload.id, {
      payloadId: roverPayload.id,
      quantity: 1,
      unitMassRating: roverPayload.massRating,
      totalMassRating: roverPayload.massRating,
      unitPowerRequirement: roverPayload.powerRequirementRating,
      totalPowerRequirement: roverPayload.powerRequirementRating,
      unitStorageRequirement: roverPayload.storageRequirement,
      totalStorageRequirement: roverPayload.storageRequirement,
      assignedTimestamp: Date.now(),
    });

    const result = validationEngine.validateManifest(manifest, vehicle);
    const tagError = result.errors.find(
      (e) => e.code === PayloadValidationCode.INCOMPATIBLE_VEHICLE_TAG
    );
    expect(tagError).toBeDefined();
    expect(tagError?.message).toContain('is incompatible with vehicle');
  });

  it('flags error when required technology is locked', () => {
    const vehicleId = 'platform_deepspace_explorer';
    const chronosSat = registry.getPayload('payload_sat_chronos_phased_array')!;

    // Assign Chronos Phased Array which requires tech_advanced_telecom
    assignmentService.assignPayload(vehicleId, chronosSat.id, 1);

    // Validate with empty tech progression
    const result = assignmentService.validateVehicleAssignment(vehicleId, {
      playerProgression: {
        unlockedTechNodeIds: new Set(),
      },
    });

    const techError = result.errors.find(
      (e) => e.code === PayloadValidationCode.TECHNOLOGY_LOCKED
    );
    expect(techError).toBeDefined();
    expect(techError?.message).toContain('Required technology for payload "Chronos High-Bandwidth Array" is locked');
  });

  it('flags error when destination restriction is not satisfied', () => {
    const vehicleId = 'platform_surface_lander_heavy';
    const boreasRover = registry.getPayload('payload_rover_boreas_cryo_drill')!; // Only Europa, Titan, Enceladus, Moon

    assignmentService.assignPayload(vehicleId, boreasRover.id, 1);

    // Validate for Mars (prohibited for Boreas)
    const result = assignmentService.validateVehicleAssignment(vehicleId, {
      destinationId: DestinationId.MARS,
    });

    const destError = result.errors.find(
      (e) => e.code === PayloadValidationCode.DESTINATION_RESTRICTION_UNMET
    );
    expect(destError).toBeDefined();
    expect(destError?.message).toContain('cannot be delivered to destination');
  });

  it('flags error when mandatory mission payload is missing', () => {
    const vehicleId = 'platform_sat_bus_standard';

    // Mission requires 1x Pioneer Transponder and 1x Gamma Spectrometer
    // Assign only Pioneer
    assignmentService.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 1);

    const result = assignmentService.validateVehicleAssignment(vehicleId, {
      requiredMissionPayloads: [
        { payloadId: 'payload_sat_pioneer_transponder', requiredQuantity: 1 },
        { payloadId: 'payload_inst_gamma_spectrometer', requiredQuantity: 1 },
      ],
    });

    const missingError = result.errors.find(
      (e) => e.code === PayloadValidationCode.MISSING_REQUIRED_PAYLOAD
    );
    expect(missingError).toBeDefined();
    expect(missingError?.message).toContain('Mission requires 1x "Gamma-Ray & Neutron Spectrometer", but only 0x is assigned');
  });

  it('generates warning when payload is near maximum mass capacity (>90%)', () => {
    const vehicleId = 'platform_sat_bus_standard'; // 90 Mass max
    assignmentService.assignPayload(vehicleId, 'payload_sat_pioneer_transponder', 2); // 90 Mass (100% capacity)

    const result = assignmentService.validateVehicleAssignment(vehicleId);
    expect(result.isValid).toBe(true); // Still valid because <= 90
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain('Payload mass is at 100% of maximum capacity');
  });
});
