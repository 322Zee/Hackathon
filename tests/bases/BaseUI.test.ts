/**
 * INTERSTELLAR CONTINUUM - Planetary Base UI Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  PlanetaryBaseManager,
  PlanetaryBaseManagementView,
  BaseSchematicVisualizer,
} from '../../src/bases';

describe('Planetary Base UI Components', () => {
  let eventBus: EventBus;
  let manager: PlanetaryBaseManager;

  beforeEach(() => {
    PlanetaryBaseManager.resetInstance();
    eventBus = new EventBus();
    manager = PlanetaryBaseManager.getInstance(eventBus);
  });

  describe('BaseSchematicVisualizer', () => {
    it('initializes container and renders empty state cleanly', () => {
      const visualizer = new BaseSchematicVisualizer();
      expect(visualizer.container).toBeDefined();
      expect(visualizer.container.label).toBe('BaseSchematicVisualizer');
      visualizer.destroy();
    });

    it('renders base schematic with modules across different destination palettes', () => {
      const visualizer = new BaseSchematicVisualizer();

      const moonBase = manager.createBase({
        name: 'Moon Lab',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: [
          'mod_habitation_core_mk1',
          'mod_power_solar_array_mk1',
          'mod_research_station_mk1',
        ],
      });

      expect(() => {
        visualizer.setBase(moonBase);
      }).not.toThrow();

      const marsBase = manager.createBase({
        name: 'Mars Lab',
        destinationId: DestinationId.MARS,
        locationId: 'loc_mars_jezero',
        initialModules: ['mod_habitation_core_mk1', 'mod_resource_processing_mk1'],
      });

      expect(() => {
        visualizer.setBase(marsBase);
      }).not.toThrow();

      visualizer.destroy();
    });
  });

  describe('PlanetaryBaseManagementView', () => {
    it('creates view container and handles show/hide lifecycle', () => {
      let closed = false;
      const view = new PlanetaryBaseManagementView({
        manager,
        onClose: () => {
          closed = true;
        },
      });

      expect(view.container).toBeDefined();
      expect(view.isVisible()).toBe(false);

      view.show();
      expect(view.isVisible()).toBe(true);

      view.hide();
      expect(view.isVisible()).toBe(false);
      expect(closed).toBe(true);

      view.destroy();
    });

    it('navigates through all 5 tabs without errors', () => {
      manager.createBase({
        name: 'Alpha Outpost',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
        initialModules: ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'],
      });

      const view = new PlanetaryBaseManagementView({ manager });
      view.show();

      expect(() => {
        view.switchTab('tab_overview');
        view.switchTab('tab_construction');
        view.switchTab('tab_modules');
        view.switchTab('tab_logistics');
        view.switchTab('tab_history');
      }).not.toThrow();

      view.destroy();
    });

    it('switches between multiple bases seamlessly', () => {
      const b1 = manager.createBase({
        name: 'Lunar Colony',
        destinationId: DestinationId.MOON,
        locationId: 'loc_moon_shackleton',
      });
      const b2 = manager.createBase({
        name: 'Martian Colony',
        destinationId: DestinationId.MARS,
        locationId: 'loc_mars_jezero',
      });

      const view = new PlanetaryBaseManagementView({ manager });
      view.show(b1.id);

      expect(() => {
        view.selectBase(b2.id);
      }).not.toThrow();

      view.destroy();
    });

    it('updates view on simulation tick without throwing', () => {
      const view = new PlanetaryBaseManagementView({ manager });
      view.show();

      expect(() => {
        view.update(0.016);
      }).not.toThrow();

      view.destroy();
    });
  });
});
