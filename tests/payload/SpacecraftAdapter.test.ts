import { describe, it, expect, beforeEach } from 'vitest';
import {
  SpacecraftAdapterRegistry,
  RocketProjectPayloadAdapter,
  StandaloneSpacecraftPayloadAdapter,
  PayloadCompatibilityTag,
} from '../../src/payload';
import { RocketProjectManager } from '../../src/engineering/RocketProjectManager';

describe('SpacecraftAdapter', () => {
  let adapterRegistry: SpacecraftAdapterRegistry;
  let rocketManager: RocketProjectManager;

  beforeEach(() => {
    RocketProjectManager.resetInstance();
    SpacecraftAdapterRegistry.resetInstance();
    rocketManager = RocketProjectManager.getInstance();
    adapterRegistry = SpacecraftAdapterRegistry.getInstance(rocketManager);
  });

  it('adapts RocketProject into universal IVehiclePayloadTarget with derived capacities', () => {
    const astraProject = rocketManager.getProject('proj_astra_1');
    expect(astraProject).toBeDefined();

    const adapter = new RocketProjectPayloadAdapter(astraProject!);
    expect(adapter.id).toBe('proj_astra_1');
    expect(adapter.name).toBe('Astra-1 Sounding Test Rig');
    expect(adapter.kind).toBe('ROCKET');

    // Astra-1 has maxPayloadCapacityLeoKg = 250 => derived mass rating = 125 MU
    expect(adapter.capacity.maxPayloadMassRating).toBe(125);
    expect(adapter.capacity.fairingDiameterM).toBe(1.8);
    expect(adapter.capacity.supportedTags).toContain(PayloadCompatibilityTag.BASIC_VEHICLE);
    expect(adapter.capacity.supportedTags).toContain(PayloadCompatibilityTag.FAIRING_1_8M);
  });

  it('provides standalone spacecraft platform adapters', () => {
    const bus = adapterRegistry.getVehicle('platform_sat_bus_standard');
    expect(bus).toBeDefined();
    expect(bus?.name).toBe('Astra-Bus Mk-1 Satellite Platform');
    expect(bus?.kind).toBe('SPACECRAFT_PLATFORM');
    expect(bus?.capacity.maxPayloadMassRating).toBe(90);
    expect(bus?.capacity.maxPowerRating).toBe(80);
    expect(bus?.capacity.maxStorageSlots).toBe(2);

    const lander = adapterRegistry.getVehicle('platform_surface_lander_heavy');
    expect(lander).toBeDefined();
    expect(lander?.capacity.maxPayloadMassRating).toBe(450);
    expect(lander?.capacity.fairingDiameterM).toBe(3.8);
    expect(lander?.capacity.supportedTags).toContain(PayloadCompatibilityTag.SURFACE_LANDER);
  });

  it('allows registering and resolving custom vehicle targets', () => {
    const customTarget = new StandaloneSpacecraftPayloadAdapter({
      id: 'custom_interstellar_freighter',
      name: 'Prometheus Deep-Space Cargo Vessel',
      maxPayloadMassRating: 800,
      maxPowerRating: 500,
      maxStorageSlots: 20,
      fairingDiameterM: 5.0,
      supportedTags: [
        PayloadCompatibilityTag.SUPER_HEAVY_VEHICLE,
        PayloadCompatibilityTag.DEEP_SPACE_CERTIFIED,
        PayloadCompatibilityTag.FAIRING_5_0M,
      ],
    });

    adapterRegistry.registerCustomVehicle(customTarget);

    const retrieved = adapterRegistry.getVehicle('custom_interstellar_freighter');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Prometheus Deep-Space Cargo Vessel');
    expect(retrieved?.capacity.maxPayloadMassRating).toBe(800);
  });

  it('lists all available vehicles combining spacecraft platforms and rocket projects', () => {
    const allVehicles = adapterRegistry.listAllVehicles();
    expect(allVehicles.length).toBeGreaterThanOrEqual(4); // 3 platforms + rocket projects

    const ids = allVehicles.map((v) => v.id);
    expect(ids).toContain('platform_sat_bus_standard');
    expect(ids).toContain('platform_deepspace_explorer');
    expect(ids).toContain('platform_surface_lander_heavy');
    expect(ids).toContain('proj_astra_1');
  });
});
