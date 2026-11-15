import { describe, it, expect } from 'vitest';
import {
  BUILTIN_ROCKET_COMPONENTS,
  RocketComponentCategory,
  ComponentRarity,
} from '../../src/engineering';

describe('RocketComponentDatabase', () => {
  it('loads all built-in rocket components', () => {
    expect(BUILTIN_ROCKET_COMPONENTS.length).toBeGreaterThanOrEqual(24);
  });

  it('guarantees unique component IDs across the entire database', () => {
    const ids = new Set<string>();
    BUILTIN_ROCKET_COMPONENTS.forEach(comp => {
      expect(comp.id).toBeDefined();
      expect(comp.id.trim().length).toBeGreaterThan(0);
      expect(ids.has(comp.id)).toBe(false);
      ids.add(comp.id);
    });
  });

  it('represents all 8 canonical component categories with multiple entries', () => {
    const categoryCounts = new Map<RocketComponentCategory, number>();
    Object.values(RocketComponentCategory).forEach(cat => categoryCounts.set(cat, 0));

    BUILTIN_ROCKET_COMPONENTS.forEach(comp => {
      categoryCounts.set(comp.category, (categoryCounts.get(comp.category) ?? 0) + 1);
    });

    for (const [_cat, count] of categoryCounts.entries()) {
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it('ensures all components have valid abstract balancing attributes and non-hazardous educational explanations', () => {
    BUILTIN_ROCKET_COMPONENTS.forEach(comp => {
      expect(comp.name.length).toBeGreaterThan(0);
      expect(comp.description.length).toBeGreaterThan(0);
      expect(comp.educationalExplanation.length).toBeGreaterThan(15);
      expect(comp.iconKey.length).toBeGreaterThan(0);
      expect(comp.tier).toBeGreaterThanOrEqual(1);
      expect(comp.tier).toBeLessThanOrEqual(5);
      expect(Object.values(ComponentRarity)).toContain(comp.rarity);
      expect(comp.costCredits).toBeGreaterThan(0);
      expect(comp.massUnits).toBeGreaterThan(0);
      expect(comp.compatibilityTags.length).toBeGreaterThan(0);
      expect(comp.stats.reliabilityRating).toBeGreaterThanOrEqual(50);
      expect(comp.stats.reliabilityRating).toBeLessThanOrEqual(100);

      // Verify no dangerous chemistry/manufacturing words
      const text = `${comp.name} ${comp.description} ${comp.educationalExplanation}`.toLowerCase();
      expect(text).not.toContain('ammonium perchlorate');
      expect(text).not.toContain('hydrazine mixture');
      expect(text).not.toContain('chemical formula');
    });
  });
});
