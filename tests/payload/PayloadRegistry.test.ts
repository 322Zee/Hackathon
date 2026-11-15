import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PayloadRegistry,
  PayloadCategoryRegistry,
  PayloadCategory,
  PayloadAvailabilityStatus,
  PayloadDefinition,
} from '../../src/payload';

describe('PayloadRegistry', () => {
  let registry: PayloadRegistry;
  let categoryRegistry: PayloadCategoryRegistry;

  beforeEach(() => {
    PayloadCategoryRegistry.resetInstance();
    PayloadRegistry.resetInstance();
    categoryRegistry = PayloadCategoryRegistry.getInstance();
    registry = PayloadRegistry.getInstance(categoryRegistry);
  });

  it('initializes with default payloads across all 11 canonical categories', () => {
    const allPayloads = registry.listPayloads();
    expect(allPayloads.length).toBeGreaterThanOrEqual(25);

    const categoriesPresent = new Set(allPayloads.map((p) => p.category));
    expect(categoriesPresent.has(PayloadCategory.COMMUNICATION_SATELLITES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.OBSERVATION_SATELLITES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.SCIENTIFIC_INSTRUMENTS)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.ROBOTIC_ROVERS)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.LANDING_EQUIPMENT)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.RESEARCH_STATION_MODULES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.POWER_MODULES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.COMMUNICATIONS_RELAY_MODULES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.MANUFACTURING_MODULES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.MAINTENANCE_SUPPLIES)).toBe(true);
    expect(categoriesPresent.has(PayloadCategory.GENERAL_CARGO)).toBe(true);
  });

  it('retrieves specific payloads by ID with deep cloned immutability', () => {
    const payload = registry.getPayload('payload_sat_pioneer_transponder');
    expect(payload).toBeDefined();
    expect(payload?.name).toBe('Pioneer Orbital Transponder');
    expect(payload?.massRating).toBe(45);
    expect(payload?.powerRequirementRating).toBe(35);
    expect(payload?.storageRequirement).toBe(1);

    // Mutating retrieved object should not modify internal registry state
    payload!.massRating = 9999;
    const reFetched = registry.getPayload('payload_sat_pioneer_transponder');
    expect(reFetched?.massRating).toBe(45);
  });

  it('allows registering new custom payloads and automatically registers unknown categories', () => {
    const customPayload: PayloadDefinition = {
      id: 'custom_quantum_telescope',
      name: 'Exo-Quantum Deep Space Telescope',
      category: 'DEEP_SPACE_TELESCOPES',
      description: 'Superconducting optical quantum sensor array.',
      visualAsset: 'icon_telescope_quantum',
      massRating: 150,
      powerRequirementRating: 180,
      storageRequirement: 3,
      compatibilityTags: ['HEAVY_VEHICLE', 'DEEP_SPACE_CERTIFIED'],
      purpose: 'Observe exoplanetary atmospheres in the infrared band.',
      acquisitionCost: 80000,
      unlockRequirements: {
        techTier: 3,
      },
      quantity: 1,
      availabilityStatus: PayloadAvailabilityStatus.AVAILABLE,
    };

    const registered = registry.registerPayload(customPayload);
    expect(registered).toBe(true);

    const retrieved = registry.getPayload('custom_quantum_telescope');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Exo-Quantum Deep Space Telescope');

    // Custom category should be dynamically added to CategoryRegistry
    expect(categoryRegistry.hasCategory('DEEP_SPACE_TELESCOPES')).toBe(true);
    expect(categoryRegistry.isStandardCategory('DEEP_SPACE_TELESCOPES')).toBe(false);
  });

  it('filters payloads accurately by category, search query, and mass envelope', () => {
    const rovers = registry.listPayloads({ category: PayloadCategory.ROBOTIC_ROVERS });
    expect(rovers.length).toBeGreaterThanOrEqual(3);
    rovers.forEach((r) => expect(r.category).toBe(PayloadCategory.ROBOTIC_ROVERS));

    const searched = registry.listPayloads({ searchQuery: 'Boreas' });
    expect(searched.length).toBe(1);
    expect(searched[0].id).toBe('payload_rover_boreas_cryo_drill');

    const lightPayloads = registry.listPayloads({ maxMassRating: 50 });
    lightPayloads.forEach((p) => expect(p.massRating).toBeLessThanOrEqual(50));
  });

  it('filters payloads with destination restrictions correctly', () => {
    // Boreas Cryo-Drill has restrictions (Europa, Titan, Enceladus, Moon)
    const restrictedToEuropa = registry.listPayloads({
      destination: DestinationId.EUROPA,
    });
    const containsBoreas = restrictedToEuropa.some(
      (p) => p.id === 'payload_rover_boreas_cryo_drill'
    );
    expect(containsBoreas).toBe(true);

    // On Mars, Boreas should NOT be allowed
    const marsList = registry.listPayloads({
      destination: DestinationId.MARS,
    });
    const marsHasBoreas = marsList.some(
      (p) => p.id === 'payload_rover_boreas_cryo_drill'
    );
    expect(marsHasBoreas).toBe(false);
  });

  it('evaluates unlock requirements against player progression', () => {
    // Pioneer transponder is unlocked by default
    expect(registry.isPayloadUnlocked('payload_sat_pioneer_transponder')).toBe(true);

    // Chronos phased array requires tech_advanced_telecom
    expect(registry.isPayloadUnlocked('payload_sat_chronos_phased_array')).toBe(false);

    const unlockedContext = {
      unlockedTechNodeIds: new Set(['tech_advanced_telecom']),
      completedMissionIds: new Set(['EARTH_LEO_DEPLOYMENT_01']),
    };
    expect(
      registry.isPayloadUnlocked('payload_sat_chronos_phased_array', unlockedContext)
    ).toBe(true);
  });
});
