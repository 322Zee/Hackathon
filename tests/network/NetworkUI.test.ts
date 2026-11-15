import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import {
  CommunicationsNetworkManager,
  CommunicationsManagementView,
  NetworkSchematicMap,
} from '../../src/network';

describe('Communications Network UI Components', () => {
  let eventBus: EventBus;
  let manager: CommunicationsNetworkManager;

  beforeEach(() => {
    eventBus = new EventBus();
    CommunicationsNetworkManager.resetInstance();
    manager = CommunicationsNetworkManager.getInstance(eventBus);
  });

  describe('CommunicationsManagementView', () => {
    it('creates view container and initializes hidden', () => {
      let closed = false;
      const view = new CommunicationsManagementView({
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

      view.destroy();
    });

    it('navigates through all tabs without throwing exceptions', () => {
      const view = new CommunicationsManagementView({ manager });
      view.show();

      expect(() => {
        view.switchTab('tab_overview');
        view.switchTab('tab_stations');
        view.switchTab('tab_satellites');
        view.switchTab('tab_relays');
        view.switchTab('tab_coverage');
      }).not.toThrow();

      view.destroy();
    });

    it('updates animation on tick', () => {
      const view = new CommunicationsManagementView({ manager });
      view.show();
      view.switchTab('tab_overview');

      expect(() => {
        view.update(0.016);
        view.update(0.016);
      }).not.toThrow();

      view.destroy();
    });
  });

  describe('NetworkSchematicMap', () => {
    it('initializes and renders schematic nodes and links', () => {
      const map = new NetworkSchematicMap({
        width: 800,
        height: 500,
        manager,
      });

      expect(map.container).toBeDefined();
      expect(map.container.children.length).toBeGreaterThanOrEqual(4);

      expect(() => {
        map.updateAnimation(0.05);
      }).not.toThrow();

      map.destroy();
    });
  });
});

