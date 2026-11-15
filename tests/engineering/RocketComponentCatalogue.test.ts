import { describe, it, expect } from 'vitest';
import {
  INITIAL_ROCKET_COMPONENTS,
  RocketComponentFamily,
} from '../../src/engineering';

describe('RocketComponentCatalogue', () => {
  it('loads all standard educational rocket component items', () => {
    expect(INITIAL_ROCKET_COMPONENTS.length).toBeGreaterThanOrEqual(10);
  });

  it('covers all 6 component families', () => {
    const families = new Set(INITIAL_ROCKET_COMPONENTS.map(c => c.family));
    expect(families.has(RocketComponentFamily.PROPELLANT_TANKS)).toBe(true);
    expect(families.has(RocketComponentFamily.BOOSTER_ENGINES)).toBe(true);
    expect(families.has(RocketComponentFamily.UPPER_STAGE_ENGINES)).toBe(true);
    expect(families.has(RocketComponentFamily.SOLID_ROCKET_MOTORS)).toBe(true);
    expect(families.has(RocketComponentFamily.AERODYNAMICS_FAIRINGS)).toBe(true);
    expect(families.has(RocketComponentFamily.STAGING_AVIONICS)).toBe(true);
  });

  it('ensures every component has positive mass, positive cost, and key specs', () => {
    INITIAL_ROCKET_COMPONENTS.forEach(comp => {
      expect(comp.id).toBeDefined();
      expect(comp.name.length).toBeGreaterThan(0);
      expect(comp.massKg).toBeGreaterThan(0);
      expect(comp.costCredits).toBeGreaterThan(0);
      expect(comp.tier).toBeGreaterThanOrEqual(1);
      expect(comp.keySpecs.length).toBeGreaterThanOrEqual(1);
      expect(typeof comp.unlockedByDefault).toBe('boolean');
    });
  });

  it('has initial default unlocked items for starting players', () => {
    const defaultUnlocked = INITIAL_ROCKET_COMPONENTS.filter(c => c.unlockedByDefault);
    expect(defaultUnlocked.length).toBeGreaterThanOrEqual(5);
  });
});
