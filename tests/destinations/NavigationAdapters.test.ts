import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MissionOperationsAdapter,
  MissionHistoryAdapter,
  PlanetaryEnvironmentAdapter,
  PlanetaryBaseAdapter,
  ScientificDiscoveryAdapter,
  OrganisationProgressionAdapter,
  CommunicationsNetworkAdapter,
} from '../../src/destinations/adapters';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('Navigation Subsystem Adapters', () => {
  beforeEach(() => {
    DestinationRegistry.resetInstance();
  });

  afterEach(() => {
    DestinationRegistry.resetInstance();
  });

  it('1. MissionOperationsAdapter provides available missions and active state', () => {
    const adapter = new MissionOperationsAdapter();
    const missions = adapter.getMissionsForDestination(DestinationId.EARTH);
    expect(Array.isArray(missions)).toBe(true);

    const opps = adapter.getAllMissionOpportunities(DestinationId.EARTH);
    expect(Array.isArray(opps)).toBe(true);

    const hasActive = adapter.hasActiveMission(DestinationId.EARTH);
    expect(typeof hasActive).toBe('boolean');
  });

  it('2. MissionHistoryAdapter provides completed missions and visited check', () => {
    const adapter = new MissionHistoryAdapter();
    const completed = adapter.getCompletedMissions(DestinationId.EARTH);
    expect(Array.isArray(completed)).toBe(true);

    const count = adapter.getCompletedMissionCount(DestinationId.EARTH);
    expect(count).toBeGreaterThanOrEqual(0);

    const visited = adapter.isDestinationVisited(DestinationId.EARTH);
    expect(typeof visited).toBe('boolean');
  });

  it('3. PlanetaryEnvironmentAdapter provides difficulty ratings and hazard profiles', () => {
    const adapter = new PlanetaryEnvironmentAdapter();
    const moonDiff = adapter.getEnvironmentalDifficulty(DestinationId.MOON);
    expect(moonDiff).toBeDefined();
    expect(moonDiff?.temperatureDifficulty).toBeGreaterThanOrEqual(1);

    const marsProfile = adapter.getProfile(DestinationId.MARS);
    expect(marsProfile).toBeDefined();

    const isMoonWalkable = adapter.isWalkableSurface(DestinationId.MOON);
    expect(isMoonWalkable).toBe(true);
  });

  it('4. PlanetaryBaseAdapter provides constructed bases and module count', () => {
    const adapter = new PlanetaryBaseAdapter();
    const bases = adapter.getBases(DestinationId.MOON);
    expect(Array.isArray(bases)).toBe(true);

    const hasBase = adapter.hasOperationalBase(DestinationId.MOON);
    expect(typeof hasBase).toBe('boolean');

    const totalMods = adapter.getTotalModulesCount(DestinationId.MOON);
    expect(totalMods).toBeGreaterThanOrEqual(0);
  });

  it('5. ScientificDiscoveryAdapter provides logged findings and research points', () => {
    const adapter = new ScientificDiscoveryAdapter();
    const discoveries = adapter.getDiscoveries(DestinationId.MARS);
    expect(Array.isArray(discoveries)).toBe(true);

    const count = adapter.getDiscoveriesCount(DestinationId.MARS);
    expect(count).toBeGreaterThanOrEqual(0);

    const points = adapter.getTotalResearchPoints(DestinationId.MARS);
    expect(points).toBeGreaterThanOrEqual(0);
  });

  it('6. OrganisationProgressionAdapter evaluates unlocks and agency frontier', () => {
    const adapter = new OrganisationProgressionAdapter();
    const earthUnlocked = adapter.isUnlocked(DestinationId.EARTH);
    expect(earthUnlocked).toBe(true);

    const progress = adapter.getProgress(DestinationId.MARS);
    expect(progress).toBeDefined();
    expect(typeof progress.percentage).toBe('number');

    const frontier = adapter.getOverallFrontierPercentage();
    expect(frontier).toBeGreaterThanOrEqual(0);
    expect(frontier).toBeLessThanOrEqual(100);

    const unlockedList = adapter.getUnlockedDestinations();
    expect(unlockedList.length).toBeGreaterThanOrEqual(2);
  });

  it('7. CommunicationsNetworkAdapter provides coverage and connectivity stats', () => {
    const adapter = new CommunicationsNetworkAdapter();
    const coverage = adapter.getCoverage(DestinationId.EARTH);
    expect(coverage).toBeDefined();
    expect(typeof coverage.coverageScorePercent).toBe('number');
    expect(typeof coverage.signalRating).toBe('string');

    const isConnected = adapter.isCommsConnected(DestinationId.EARTH);
    expect(typeof isConnected).toBe('boolean');
  });
});
