import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SolarSystemNavigationManager } from '../../src/destinations/navigation/SolarSystemNavigationManager';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId, DestinationCategory } from '../../src/destinations/DestinationTypes';
import { ExplorationStatusBadge } from '../../src/destinations/navigation/NavigationTypes';
import { NAVIGATION_EVENTS } from '../../src/destinations/navigation/NavigationEvents';

describe('SolarSystemNavigationManager', () => {
  let navManager: SolarSystemNavigationManager;

  beforeEach(() => {
    SolarSystemNavigationManager.resetInstance();
    DestinationRegistry.resetInstance();
    navManager = SolarSystemNavigationManager.getInstance();
  });

  afterEach(() => {
    SolarSystemNavigationManager.resetInstance();
    DestinationRegistry.resetInstance();
  });

  it('1. adheres to singleton contract and supports clean reset', () => {
    const inst1 = SolarSystemNavigationManager.getInstance();
    const inst2 = SolarSystemNavigationManager.getInstance();
    expect(inst1).toBe(inst2);

    SolarSystemNavigationManager.resetInstance();
    const inst3 = SolarSystemNavigationManager.getInstance();
    expect(inst3).not.toBe(inst1);
  });

  it('2. compiles Solar System overview telemetry with 8 primary planets', () => {
    const overview = navManager.getSolarSystemOverview();

    expect(overview.centralStar).toBeDefined();
    expect(overview.centralStar.id).toBe(DestinationId.SUN);

    expect(overview.primaryPlanets.length).toBe(8);
    const planetIds = overview.primaryPlanets.map((p) => p.id);
    expect(planetIds).toContain(DestinationId.MERCURY);
    expect(planetIds).toContain(DestinationId.VENUS);
    expect(planetIds).toContain(DestinationId.EARTH);
    expect(planetIds).toContain(DestinationId.MARS);
    expect(planetIds).toContain(DestinationId.JUPITER);
    expect(planetIds).toContain(DestinationId.SATURN);
    expect(planetIds).toContain(DestinationId.URANUS);
    expect(planetIds).toContain(DestinationId.NEPTUNE);

    expect(overview.totalDestinationsCount).toBe(28);
    expect(overview.unlockedCount).toBeGreaterThanOrEqual(2); // Earth & LEO
    expect(overview.overallAgencyFrontierPercent).toBeGreaterThanOrEqual(0);
    expect(overview.overallAgencyFrontierPercent).toBeLessThanOrEqual(100);
  });

  it('3. lists destinations and executes multi-criteria filtering', () => {
    const all = navManager.listDestinations();
    expect(all.length).toBe(28);

    const planets = navManager.listDestinations({ category: DestinationCategory.PLANET });
    expect(planets.length).toBe(8);

    const moons = navManager.listDestinations({ category: DestinationCategory.NATURAL_SATELLITE });
    expect(moons.length).toBeGreaterThanOrEqual(7);

    const unlocked = navManager.listDestinations({ status: 'UNLOCKED' });
    expect(unlocked.some((d) => d.id === DestinationId.EARTH)).toBe(true);

    const solidSurfaces = navManager.listDestinations({ solidSurfaceOnly: true });
    // Gas giants should not be included
    expect(solidSurfaces.some((d) => d.id === DestinationId.JUPITER)).toBe(false);
    expect(solidSurfaces.some((d) => d.id === DestinationId.SATURN)).toBe(false);
  });

  it('4. searches destinations by text query across name, code and features', () => {
    const marsResults = navManager.searchDestinations('mars');
    expect(marsResults.some((d) => d.id === DestinationId.MARS)).toBe(true);

    const iceMoonResults = navManager.searchDestinations('europa');
    expect(iceMoonResults.some((d) => d.id === DestinationId.EUROPA)).toBe(true);

    const codeResults = navManager.searchDestinations('TERRA');
    expect(codeResults.some((d) => d.id === DestinationId.EARTH)).toBe(true);
  });

  it('5. retrieves destination progress and available destinations', () => {
    const earthProgress = navManager.getDestinationProgress(DestinationId.EARTH);
    expect(earthProgress.percentage).toBe(100);

    const marsProgress = navManager.getDestinationProgress(DestinationId.MARS);
    expect(marsProgress.percentage).toBeGreaterThanOrEqual(0);

    const available = navManager.getAvailableDestinations();
    expect(available.some((d) => d.id === DestinationId.EARTH)).toBe(true);
  });

  it('6. handles destination selection and dispatches typed domain event', () => {
    const handler = vi.fn();
    const unsubscribe = navManager.on(NAVIGATION_EVENTS.DESTINATION_SELECTED, handler);

    navManager.setSelectedDestination(DestinationId.MARS);

    expect(navManager.getSelectedDestinationId()).toBe(DestinationId.MARS);
    expect(navManager.getSelectedDestination()?.name).toBe('Mars');
    expect(handler).toHaveBeenCalledTimes(1);

    const payload = handler.mock.calls[0]![0];
    expect(payload.destinationId).toBe(DestinationId.MARS);
    expect(payload.destination.id).toBe(DestinationId.MARS);
    expect(payload.statusBadge).toBeDefined();

    unsubscribe();
    navManager.setSelectedDestination(DestinationId.EUROPA);
    expect(handler).toHaveBeenCalledTimes(1); // No new dispatch after unsubscribe
  });

  it('7. inspects planetary systems and dispatches system navigation events', () => {
    const inspectHandler = vi.fn();
    const overviewHandler = vi.fn();

    navManager.on(NAVIGATION_EVENTS.SYSTEM_INSPECTED, inspectHandler);
    navManager.on(NAVIGATION_EVENTS.RETURNED_TO_OVERVIEW, overviewHandler);

    // Inspect Jupiter's moon system
    navManager.inspectSystem(DestinationId.JUPITER);
    expect(navManager.getInspectedSystemId()).toBe(DestinationId.JUPITER);
    expect(inspectHandler).toHaveBeenCalledTimes(1);

    const inspectPayload = inspectHandler.mock.calls[0]![0];
    expect(inspectPayload.parentDestinationId).toBe(DestinationId.JUPITER);
    expect(inspectPayload.children.length).toBeGreaterThanOrEqual(4); // Galilean moons

    // Return to overview
    navManager.inspectSystem(null);
    expect(navManager.getInspectedSystemId()).toBeNull();
    expect(overviewHandler).toHaveBeenCalledTimes(1);
  });

  it('8. aggregates comprehensive navigation summary for destination view', () => {
    const earthSummary = navManager.getDestinationSummary(DestinationId.EARTH);
    expect(earthSummary).toBeDefined();
    expect(earthSummary?.destination.id).toBe(DestinationId.EARTH);
    expect(earthSummary?.isUnlocked).toBe(true);
    expect(earthSummary?.statusBadge).toBeDefined();
    expect(earthSummary?.educationalSummary).toBeDefined();
    expect(earthSummary?.educationalSummary.planetaryRadiusKm).toBeCloseTo(6371, -1);
    expect(earthSummary?.commsCoverageSummary).toBeDefined();

    const europaSummary = navManager.getDestinationSummary(DestinationId.EUROPA);
    expect(europaSummary).toBeDefined();
    expect(europaSummary?.destination.name).toBe('Europa');
    expect(europaSummary?.educationalSummary.majorScientificInterests.length).toBeGreaterThan(0);
  });

  it('9. routes cross-system navigation actions correctly', () => {
    const actionHandler = vi.fn();
    const focusHandler = vi.fn();

    navManager.on(NAVIGATION_EVENTS.ACTION_TRIGGERED, actionHandler);
    navManager.on(NAVIGATION_EVENTS.DESTINATION_FOCUSED, focusHandler);

    // Trigger map focus
    navManager.triggerNavigationAction({
      action: 'FOCUS_MAP',
      destinationId: DestinationId.SATURN,
      metadata: { zoomLevel: 2.2 },
    });

    expect(actionHandler).toHaveBeenCalledTimes(1);
    expect(focusHandler).toHaveBeenCalledTimes(1);
    const focusPayload = focusHandler.mock.calls[0]![0];
    expect(focusPayload.destinationId).toBe(DestinationId.SATURN);
    expect(focusPayload.zoomLevel).toBe(2.2);

    // Trigger inspect system
    navManager.triggerNavigationAction({
      action: 'INSPECT_SYSTEM',
      destinationId: DestinationId.JUPITER,
    });
    expect(navManager.getInspectedSystemId()).toBe(DestinationId.JUPITER);

    // Trigger return overview
    navManager.triggerNavigationAction({
      action: 'RETURN_OVERVIEW',
      destinationId: 'SOLAR_SYSTEM',
    });
    expect(navManager.getInspectedSystemId()).toBeNull();
  });
});

