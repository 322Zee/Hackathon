/**
 * INTERSTELLAR CONTINUUM - Planetary Base Location & Environment Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import {
  BaseLocationRegistry,
  EnvironmentAdapter,
  DEFAULT_BASE_LOCATIONS,
} from '../../src/bases';

describe('Base Location & Environment Evaluation', () => {
  let locationRegistry: BaseLocationRegistry;
  let destinationRegistry: DestinationRegistry;
  let environmentAdapter: EnvironmentAdapter;

  beforeEach(() => {
    BaseLocationRegistry.resetInstance();
    locationRegistry = BaseLocationRegistry.getInstance();
    destinationRegistry = DestinationRegistry.getInstance();
    environmentAdapter = new EnvironmentAdapter(destinationRegistry, locationRegistry);
  });

  it('initializes with canonical default locations', () => {
    const all = locationRegistry.listAllLocations();
    expect(all.length).toBeGreaterThanOrEqual(DEFAULT_BASE_LOCATIONS.length);

    const lunar = locationRegistry.getLocationsByDestination(DestinationId.MOON);
    expect(lunar.length).toBeGreaterThanOrEqual(2);
    expect(lunar.some((l) => l.id === 'loc_moon_shackleton')).toBe(true);

    const mars = locationRegistry.getLocationsByDestination(DestinationId.MARS);
    expect(mars.length).toBeGreaterThanOrEqual(2);
    expect(mars.some((l) => l.id === 'loc_mars_jezero')).toBe(true);
  });

  it('allows registering custom outpost locations', () => {
    locationRegistry.registerLocation({
      id: 'loc_custom_mars_olympus',
      destinationId: DestinationId.MARS,
      name: 'Olympus Mons Caldera Base',
      description: 'High-altitude research facility along the caldera shield.',
      coordinates: { latitude: 18.65, longitude: 226.2 },
      terrainType: 'CRATER_RIM',
      suitabilityScore: 85,
      hazardRating: 'MODERATE',
      solarExposurePercent: 80,
      dustHazardFactor: 0.3,
      radiationProtectionFactor: 0.1,
      resourceAbundance: { rawMinerals: 90, waterIce: 20, volatiles: 30 },
      recommendedFor: 'Volcanology research and low-atmosphere launch facility.',
    });

    const custom = locationRegistry.getLocation('loc_custom_mars_olympus');
    expect(custom).toBeDefined();
    expect(custom?.name).toBe('Olympus Mons Caldera Base');
  });

  it('rejects ineligible destinations for surface bases (e.g. gas giants, stars, orbits)', () => {
    const sunCheck = environmentAdapter.isDestinationEligible(DestinationId.SUN);
    expect(sunCheck.eligible).toBe(false);

    const jupiterCheck = environmentAdapter.isDestinationEligible(DestinationId.JUPITER);
    expect(jupiterCheck.eligible).toBe(false);

    const leoCheck = environmentAdapter.isDestinationEligible(DestinationId.EARTH_ORBIT_LEO);
    expect(leoCheck.eligible).toBe(false);

    const moonCheck = environmentAdapter.isDestinationEligible(DestinationId.MOON);
    expect(moonCheck.eligible).toBe(true);

    const marsCheck = environmentAdapter.isDestinationEligible(DestinationId.MARS);
    expect(marsCheck.eligible).toBe(true);
  });

  it('evaluates environmental suitability for Shackleton Crater on the Moon', () => {
    const evalReport = environmentAdapter.evaluateLocation(
      DestinationId.MOON,
      'loc_moon_shackleton'
    );

    expect(evalReport.isEligible).toBe(true);
    expect(evalReport.destinationId).toBe(DestinationId.MOON);
    expect(evalReport.locationId).toBe('loc_moon_shackleton');
    expect(evalReport.suitabilityScore).toBeGreaterThanOrEqual(85);
    expect(evalReport.hazardLevel).toBe('LOW');
    expect(evalReport.solarEfficiencyMultiplier).toBeGreaterThan(0);
    expect(evalReport.resourceRichnessMultiplier).toBeGreaterThan(0);
  });

  it('evaluates environmental suitability for Europa and applies radiation/hazard warnings', () => {
    const evalReport = environmentAdapter.evaluateLocation(
      DestinationId.EUROPA,
      'loc_europa_conamara'
    );

    expect(evalReport.isEligible).toBe(true);
    expect(evalReport.hazardLevel).toBe('HIGH');
    expect(evalReport.solarEfficiencyMultiplier).toBeLessThan(0.3); // Far from Sun
  });

  it('returns ineligible evaluation report when evaluating an invalid destination', () => {
    const evalReport = environmentAdapter.evaluateLocation(
      DestinationId.JUPITER,
      'loc_any'
    );

    expect(evalReport.isEligible).toBe(false);
    expect(evalReport.suitabilityScore).toBe(0);
    expect(evalReport.reasonsForIneligibility).toBeDefined();
    expect(evalReport.reasonsForIneligibility?.length).toBeGreaterThan(0);
  });
});
