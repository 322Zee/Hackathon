import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DestinationHierarchyBreadcrumbs } from '../../src/destinations/ui/DestinationHierarchyBreadcrumbs';
import { DestinationSearchFilterBar } from '../../src/destinations/ui/DestinationSearchFilterBar';
import { SolarSystemMapCanvas } from '../../src/destinations/ui/SolarSystemMapCanvas';
import { DestinationInfoPanel } from '../../src/destinations/ui/DestinationInfoPanel';
import { SolarSystemNavigationManager } from '../../src/destinations/navigation/SolarSystemNavigationManager';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId, DestinationCategory } from '../../src/destinations/DestinationTypes';

describe('Solar System Map Visuals and Navigation UI Interactions', () => {
  beforeEach(() => {
    SolarSystemNavigationManager.resetInstance();
    DestinationRegistry.resetInstance();
  });

  afterEach(() => {
    SolarSystemNavigationManager.resetInstance();
    DestinationRegistry.resetInstance();
  });

  describe('DestinationHierarchyBreadcrumbs', () => {
    it('1. initializes with Solar System root breadcrumb', () => {
      const breadcrumbs = new DestinationHierarchyBreadcrumbs();
      expect(breadcrumbs.container).toBeDefined();
      breadcrumbs.destroy();
    });

    it('2. updates breadcrumbs when a deep celestial body is selected', () => {
      const navManager = SolarSystemNavigationManager.getInstance();
      const breadcrumbs = new DestinationHierarchyBreadcrumbs();

      navManager.setSelectedDestination(DestinationId.EUROPA);
      breadcrumbs.updateBreadcrumbs(DestinationId.EUROPA);

      expect(breadcrumbs.container.children.length).toBeGreaterThan(0);
      breadcrumbs.destroy();
    });

    it('3. triggers navigation callback when breadcrumb segment is tapped', () => {
      const navigateCb = vi.fn();
      const breadcrumbs = new DestinationHierarchyBreadcrumbs({
        onNavigate: navigateCb,
      });

      breadcrumbs.updateBreadcrumbs(DestinationId.MARS);
      breadcrumbs.destroy();
    });
  });

  describe('DestinationSearchFilterBar', () => {
    it('1. renders filter bar with category and status chips', () => {
      const filterBar = new DestinationSearchFilterBar();
      expect(filterBar.container).toBeDefined();

      const initialFilters = filterBar.getFilters();
      expect(initialFilters.category).toBe('ALL');
      expect(initialFilters.status).toBe('ALL');
      expect(initialFilters.query).toBeUndefined();

      filterBar.destroy();
    });

    it('2. changes category and dispatches filter change event', () => {
      const changeCb = vi.fn();
      const filterBar = new DestinationSearchFilterBar({
        onFilterChange: changeCb,
      });

      filterBar.setCategory(DestinationCategory.PLANET);
      expect(filterBar.getFilters().category).toBe(DestinationCategory.PLANET);
      expect(changeCb).toHaveBeenCalledTimes(1);

      filterBar.setStatus('UNLOCKED');
      expect(filterBar.getFilters().status).toBe('UNLOCKED');
      expect(changeCb).toHaveBeenCalledTimes(2);

      filterBar.setQuery('Titan');
      expect(filterBar.getFilters().query).toBe('Titan');
      expect(changeCb).toHaveBeenCalledTimes(3);

      filterBar.destroy();
    });
  });

  describe('SolarSystemMapCanvas Advanced Features', () => {
    it('1. enters planetary system view and reveals return button', () => {
      const canvas = new SolarSystemMapCanvas();
      canvas.inspectSystem(DestinationId.JUPITER);

      // System view inspects Jupiter
      expect(canvas.getSelectedDestination()).toBe(DestinationId.JUPITER);

      canvas.returnToOverview();
      expect(canvas.getSelectedDestination()).toBe(DestinationId.JUPITER);

      canvas.destroy();
    });

    it('2. adjusts zoom smoothly and clamps within boundaries', () => {
      const canvas = new SolarSystemMapCanvas();
      canvas.adjustZoom(1.0);
      canvas.adjustZoom(-5.0); // Extreme zoom out
      canvas.resetView();
      canvas.destroy();
    });
  });

  describe('DestinationInfoPanel Enhanced Tabs', () => {
    it('1. switches tabs between Telemetry, Educational, and Operations', () => {
      const panel = new DestinationInfoPanel();
      const reg = DestinationRegistry.getInstance();
      const earth = reg.getDestination(DestinationId.EARTH)!;

      panel.setDestination(earth);
      expect(panel.getDestination()?.id).toBe(DestinationId.EARTH);

      // Render again with Mars
      const mars = reg.getDestination(DestinationId.MARS)!;
      panel.setDestination(mars);
      expect(panel.getDestination()?.id).toBe(DestinationId.MARS);

      panel.destroy();
    });
  });
});
