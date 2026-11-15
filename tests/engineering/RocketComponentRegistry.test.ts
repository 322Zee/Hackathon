import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import {
  RocketComponentRegistry,
  RocketComponentCategory,
  ComponentAvailabilityState,
  ComponentCompatibilityTag,
  ComponentRarity,
  RocketComponentDefinition,
} from '../../src/engineering';

describe('RocketComponentRegistry', () => {
  let eventBus: EventBus;
  let registry: RocketComponentRegistry;

  beforeEach(() => {
    RocketComponentRegistry.resetInstance();
    eventBus = new EventBus();
    registry = RocketComponentRegistry.getInstance(eventBus);
  });

  it('initializes as singleton and populates built-in components', () => {
    expect(registry.getAllComponents().length).toBeGreaterThanOrEqual(24);
    const booster = registry.getComponent('prop_basic_booster_mk1');
    expect(booster).toBeDefined();
    expect(booster?.category).toBe(RocketComponentCategory.PROPULSION_SYSTEMS);
  });

  it('rejects components with invalid or empty ID, negative cost, or non-positive mass', () => {
    const invalidEmptyId: RocketComponentDefinition = {
      id: '',
      name: 'Invalid Empty',
      category: RocketComponentCategory.STRUCTURE_AND_STAGING,
      componentType: 'Core',
      description: 'Invalid',
      educationalExplanation: 'Invalid',
      iconKey: 'icon',
      tier: 1,
      rarity: ComponentRarity.STANDARD,
      costCredits: 1000,
      massUnits: 10,
      compatibilityTags: [ComponentCompatibilityTag.BASIC_VEHICLE],
      stats: { reliabilityRating: 90 },
      unlockRequirements: { techTier: 1, requiresResearch: false, requiresManufacturing: false },
      upgradeLevel: 1,
      maxUpgradeLevel: 3,
      manufacturingAvailable: true,
    };
    expect(registry.registerComponent(invalidEmptyId)).toBe(false);

    const invalidNegativeCost: RocketComponentDefinition = {
      ...invalidEmptyId,
      id: 'inv_neg_cost',
      costCredits: -500,
    };
    expect(registry.registerComponent(invalidNegativeCost)).toBe(false);

    const invalidZeroMass: RocketComponentDefinition = {
      ...invalidEmptyId,
      id: 'inv_zero_mass',
      massUnits: 0,
    };
    expect(registry.registerComponent(invalidZeroMass)).toBe(false);
  });

  it('queries components by category accurately across all 8 categories', () => {
    for (const cat of Object.values(RocketComponentCategory)) {
      const list = registry.getComponentsByCategory(cat);
      expect(list.length).toBeGreaterThanOrEqual(2);
      list.forEach(c => expect(c.category).toBe(cat));
    }
  });

  it('queries components by compatibility tags and tiers', () => {
    const orbitalComponents = registry.getComponentsByTag(ComponentCompatibilityTag.ORBITAL_INSERTION);
    expect(orbitalComponents.length).toBeGreaterThanOrEqual(3);

    const tier1 = registry.getComponentsByTier(1);
    expect(tier1.length).toBeGreaterThanOrEqual(10);
    tier1.forEach(c => expect(c.tier).toBe(1));
  });

  it('searches components by query substring and category filter', () => {
    const searchThrust = registry.searchComponents('thrust');
    expect(searchThrust.length).toBeGreaterThanOrEqual(1);

    const searchFiltered = registry.searchComponents('fuel', RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS);
    expect(searchFiltered.length).toBeGreaterThanOrEqual(1);
    searchFiltered.forEach(c => expect(c.category).toBe(RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS));
  });

  it('evaluates dynamic availability state properly', () => {
    // 1. Tier 1 component with sufficient credits -> AVAILABLE
    const availTier1 = registry.evaluateAvailability('struct_main_core_alpha', {
      playerCredits: 50000,
    });
    expect(availTier1.state).toBe(ComponentAvailabilityState.AVAILABLE);
    expect(availTier1.isUnlocked).toBe(true);
    expect(availTier1.canAfford).toBe(true);

    // 2. Insufficient credits
    const poorCredits = registry.evaluateAvailability('struct_main_core_alpha', {
      playerCredits: 100,
    });
    expect(poorCredits.state).toBe(ComponentAvailabilityState.INSUFFICIENT_CREDITS);
    expect(poorCredits.canAfford).toBe(false);
    expect(poorCredits.isUnlocked).toBe(true);

    // 3. Research Required
    const researchReq = registry.evaluateAvailability('prop_standard_sustainer_v2', {
      playerCredits: 100000,
      unlockedTechIds: new Set(['tech_basic']), // missing 'tech_propulsion_sustainer'
    });
    expect(researchReq.state).toBe(ComponentAvailabilityState.RESEARCH_REQUIRED);
    expect(researchReq.isUnlocked).toBe(false);

    // 4. Research unlocked
    const researchMet = registry.evaluateAvailability('prop_standard_sustainer_v2', {
      playerCredits: 100000,
      unlockedTechIds: new Set(['tech_propulsion_sustainer']),
    });
    expect(researchMet.state).toBe(ComponentAvailabilityState.AVAILABLE);
    expect(researchMet.isUnlocked).toBe(true);

    // 5. Manufacturing Required
    const mfgReq = registry.evaluateAvailability('prop_advanced_heavy_cluster', {
      playerCredits: 200000,
      unlockedTechIds: new Set(['tech_heavy_propulsion']),
    });
    expect(mfgReq.state).toBe(ComponentAvailabilityState.MANUFACTURING_REQUIRED);
    expect(mfgReq.isUnlocked).toBe(false);
  });

  it('performs comprehensive side-by-side comparative analysis between two components', () => {
    const comparison = registry.compareComponents(
      'prop_basic_booster_mk1',
      'prop_upper_vacuum_nozzle'
    );

    expect(comparison).toBeDefined();
    expect(comparison?.componentA.id).toBe('prop_basic_booster_mk1');
    expect(comparison?.componentB.id).toBe('prop_upper_vacuum_nozzle');
    expect(comparison?.isSameCategory).toBe(true);
    expect(comparison?.attributeDiffs.length).toBeGreaterThanOrEqual(4);

    const costDiff = comparison?.attributeDiffs.find(d => d.label.includes('Cost'));
    expect(costDiff).toBeDefined();
    expect(costDiff?.advantage).toBe('A'); // Mk1 is 16k vs Nozzle 29k

    const massDiff = comparison?.attributeDiffs.find(d => d.label.includes('Mass'));
    expect(massDiff).toBeDefined();
    expect(massDiff?.advantage).toBe('B'); // Nozzle is 30 MU vs Mk1 55 MU

    expect(comparison?.educationalSynthesis).toContain('Neither component is universally superior');
  });
});
