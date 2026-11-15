import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DestinationSearchFilterEngine } from '../../src/destinations/navigation/DestinationSearchFilterEngine';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId, DestinationCategory, SurfaceAvailability } from '../../src/destinations/DestinationTypes';

describe('DestinationSearchFilterEngine', () => {
  let engine: DestinationSearchFilterEngine;

  beforeEach(() => {
    DestinationSearchFilterEngine.resetInstance();
    DestinationRegistry.resetInstance();
    engine = DestinationSearchFilterEngine.getInstance();
  });

  afterEach(() => {
    DestinationSearchFilterEngine.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('1. filters destinations by category', () => {
    const planets = engine.filter({ category: DestinationCategory.PLANET });
    expect(planets.length).toBe(8);
    expect(
      planets.every(
        (p) =>
          p.category === DestinationCategory.ROCKY_PLANET ||
          p.category === DestinationCategory.GAS_GIANT ||
          p.category === DestinationCategory.ICE_GIANT
      )
    ).toBe(true);

    const moons = engine.filter({ category: DestinationCategory.NATURAL_SATELLITE });
    expect(moons.length).toBeGreaterThanOrEqual(7);
    expect(moons.every((m) => m.category === DestinationCategory.NATURAL_SATELLITE)).toBe(true);
  });

  it('2. filters destinations by solid surface availability', () => {
    const solid = engine.filter({ solidSurfaceOnly: true });
    // Gas/ice giants must be excluded
    const solidIds = solid.map((s) => s.id);
    expect(solidIds).not.toContain(DestinationId.JUPITER);
    expect(solidIds).not.toContain(DestinationId.SATURN);
    expect(solidIds).not.toContain(DestinationId.URANUS);
    expect(solidIds).not.toContain(DestinationId.NEPTUNE);
    // Terrestrial planets and moons should be included
    expect(solidIds).toContain(DestinationId.EARTH);
    expect(solidIds).toContain(DestinationId.MARS);
    expect(solidIds).toContain(DestinationId.MOON);
  });

  it('3. filters destinations by parent body ID', () => {
    const jupiterMoons = engine.filter({ parentDestinationId: DestinationId.JUPITER });
    expect(jupiterMoons.length).toBe(4);
    const moonIds = jupiterMoons.map((m) => m.id);
    expect(moonIds).toContain(DestinationId.IO);
    expect(moonIds).toContain(DestinationId.EUROPA);
    expect(moonIds).toContain(DestinationId.GANYMEDE);
    expect(moonIds).toContain(DestinationId.CALLISTO);
  });

  it('4. filters destinations by progression and unlock status', () => {
    const unlocked = engine.filter({ status: 'UNLOCKED' });
    expect(unlocked.some((d) => d.id === DestinationId.EARTH)).toBe(true);

    const locked = engine.filter({ status: 'LOCKED' });
    expect(locked.some((d) => d.id === DestinationId.NEPTUNE)).toBe(true);
  });

  it('5. searches destinations using partial text queries', () => {
    const titanSearch = engine.search('titan');
    expect(titanSearch.some((d) => d.id === DestinationId.TITAN)).toBe(true);

    const redPlanetSearch = engine.search('red planet');
    expect(redPlanetSearch.some((d) => d.id === DestinationId.MARS)).toBe(true);
  });

  it('6. calculates comprehensive filter statistics', () => {
    const stats = engine.getStats();
    expect(stats.total).toBe(28);
    expect(stats.unlocked).toBeGreaterThanOrEqual(2);
    expect(stats.locked).toBeLessThanOrEqual(26);
    expect(stats.matching).toBe(28);

    const filteredStats = engine.getStats({ category: DestinationCategory.PLANET });
    expect(filteredStats.total).toBe(28);
    expect(filteredStats.matching).toBe(8);
  });
});
