import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PointOfInterestRegistry,
  PointOfInterest,
  PointOfInterestType,
  POIDiscoveryStatus,
  EntityAccessType,
  HazardSeverity,
  PLANETARY_ENVIRONMENT_PROFILES,
} from '../../src/environment/planetary';

describe('Environmental Interactions & Difficulty Restrictions', () => {
  let poiRegistry: PointOfInterestRegistry;

  const mockPOIs: PointOfInterest[] = [
    {
      id: 'POI_TEST_OBSERVATION',
      destinationId: DestinationId.MOON,
      type: PointOfInterestType.POI_SCIENTIFIC_OBSERVATION,
      name: 'Lunar Laser Retroreflector Site',
      description: 'Passive optical retroreflector array.',
      position: { x: 500, y: 1300 },
      radius: 60,
      discoveryStatus: POIDiscoveryStatus.UNDISCOVERED,
      scienceReward: 100,
      accessibleBy: EntityAccessType.ANY,
      hazardRating: 1,
      metadata: { targetAccuracyMm: 2.5 },
    },
    {
      id: 'POI_TEST_GEOLOGY',
      destinationId: DestinationId.MOON,
      type: PointOfInterestType.POI_GEOLOGICAL_FEATURE,
      name: 'Anorthosite Highland Boulder',
      description: 'Pristine crustal sample.',
      position: { x: 900, y: 1320 },
      radius: 80,
      discoveryStatus: POIDiscoveryStatus.UNDISCOVERED,
      scienceReward: 150,
      accessibleBy: EntityAccessType.ROVER,
      hazardRating: 2,
      metadata: { plagioclaseContentPercent: 95 },
    },
    {
      id: 'POI_TEST_MARS_DELTA',
      destinationId: DestinationId.MARS,
      type: PointOfInterestType.POI_RESOURCE_DEPOSIT,
      name: 'Jezero Smectite Clay Deposit',
      description: 'Hydrated clays in river fan.',
      position: { x: 1200, y: 1400 },
      radius: 100,
      discoveryStatus: POIDiscoveryStatus.UNDISCOVERED,
      scienceReward: 200,
      accessibleBy: EntityAccessType.ROVER,
      hazardRating: 3,
      metadata: { clayType: 'Smectite' },
    },
  ];

  beforeEach(() => {
    poiRegistry = new PointOfInterestRegistry();
    poiRegistry.registerPOIs(mockPOIs);
  });

  it('filters and queries POIs by destination ID and spatial radius', () => {
    const moonPOIs = poiRegistry.getPOIsForDestination(DestinationId.MOON);
    expect(moonPOIs.length).toBe(2);

    const marsPOIs = poiRegistry.getPOIsForDestination(DestinationId.MARS);
    expect(marsPOIs.length).toBe(1);

    // Spatial proximity query at x=520, y=1310 with radius 50
    // Combined radius: 50 + 60 = 110. Distance = sqrt(20^2 + 10^2) = 22.36 <= 110. Matches!
    const hits = poiRegistry.findPOIsInRadius(520, 1310, 50, DestinationId.MOON);
    expect(hits.length).toBe(1);
    expect(hits[0]?.id).toBe('POI_TEST_OBSERVATION');

    // Far query: should yield nothing
    const noHits = poiRegistry.findPOIsInRadius(2000, 1300, 50, DestinationId.MOON);
    expect(noHits.length).toBe(0);
  });

  it('handles discovery state progression and scientific analysis rewards', () => {
    const poiId = 'POI_TEST_OBSERVATION';

    // 1. Initial state is UNDISCOVERED
    const initial = poiRegistry.getPOI(poiId);
    expect(initial?.discoveryStatus).toBe(POIDiscoveryStatus.UNDISCOVERED);

    // 2. Discover POI
    const discoveryResult = poiRegistry.discoverPOI(poiId);
    expect(discoveryResult.newlyDiscovered).toBe(true);
    expect(discoveryResult.poi?.discoveryStatus).toBe(POIDiscoveryStatus.DISCOVERED);

    // Re-discovering already discovered POI does not trigger duplicate newlyDiscovered
    const duplicateDiscovery = poiRegistry.discoverPOI(poiId);
    expect(duplicateDiscovery.newlyDiscovered).toBe(false);

    // 3. Analyze POI
    const analysisResult = poiRegistry.analyzePOI(poiId);
    expect(analysisResult.success).toBe(true);
    expect(analysisResult.scienceEarned).toBe(100);
    expect(analysisResult.poi?.discoveryStatus).toBe(POIDiscoveryStatus.ANALYZED);

    // 4. Verification of telemetry stats
    const stats = poiRegistry.getStats(DestinationId.MOON);
    expect(stats.total).toBe(2);
    expect(stats.discovered).toBe(1);
    expect(stats.analyzed).toBe(1);
  });

  it('validates abstract environmental difficulty ratings across all destinations', () => {
    for (const [id, profile] of Object.entries(PLANETARY_ENVIRONMENT_PROFILES)) {
      const diff = profile.difficultyRatings;

      // 1 to 5 scale validation
      expect(diff.temperatureDifficulty).toBeGreaterThanOrEqual(1);
      expect(diff.temperatureDifficulty).toBeLessThanOrEqual(5);

      expect(diff.terrainDifficulty).toBeGreaterThanOrEqual(1);
      expect(diff.terrainDifficulty).toBeLessThanOrEqual(5);

      expect(diff.visibilityDifficulty).toBeGreaterThanOrEqual(1);
      expect(diff.visibilityDifficulty).toBeLessThanOrEqual(5);

      expect(diff.atmosphericDifficulty).toBeGreaterThanOrEqual(1);
      expect(diff.atmosphericDifficulty).toBeLessThanOrEqual(5);

      expect(diff.surfaceAccessibility).toBeGreaterThanOrEqual(1);
      expect(diff.surfaceAccessibility).toBeLessThanOrEqual(5);

      expect(Object.values(HazardSeverity)).toContain(diff.overallHazardLevel);
      expect(diff.hazardNotes.length).toBeGreaterThan(0);
    }
  });

  it('verifies spawn locations contain safe landing areas and coordinate metadata', () => {
    const moon = PLANETARY_ENVIRONMENT_PROFILES[DestinationId.MOON]!;
    const defaultSpawn = moon.spawnLocations.find((s) => s.isDefault);
    expect(defaultSpawn).toBeDefined();
    expect(defaultSpawn?.isSafe).toBe(true);
    expect(defaultSpawn?.x).toBeGreaterThan(0);
    expect(defaultSpawn?.y).toBeGreaterThan(0);
  });
});

