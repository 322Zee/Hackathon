import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PayloadManagementView,
  PayloadTransportationService,
  PayloadCategory,
} from '../../src/payload';

describe('PayloadManagementView', () => {
  let view: PayloadManagementView;
  let service: PayloadTransportationService;

  beforeEach(() => {
    PayloadTransportationService.resetInstance();
    service = PayloadTransportationService.getInstance();

    view = new PayloadManagementView({
      x: 30,
      y: 130,
      width: 1860,
      height: 920,
      initialVehicleId: 'platform_sat_bus_standard',
      initialMissionId: 'TRANS_LEO_PIONEER_RELAY',
    });
  });

  afterEach(() => {
    view.destroy();
  });

  it('initializes UI layout and sets position', () => {
    expect(view.container.position.x).toBe(30);
    expect(view.container.position.y).toBe(130);
    expect(view.getActiveVehicleId()).toBe('platform_sat_bus_standard');
  });

  it('selects payload and updates details', () => {
    const selected = view.getSelectedPayload();
    expect(selected).toBeDefined();
    expect(selected?.id).toBe('payload_sat_pioneer_transponder');
  });

  it('switches active carrier vehicle and updates capacity telemetry', () => {
    view.setActiveVehicle('platform_surface_lander_heavy');
    expect(view.getActiveVehicleId()).toBe('platform_surface_lander_heavy');

    const metrics = service.getRemainingCapacity('platform_surface_lander_heavy');
    expect(metrics.isFullyWithinLimits).toBe(true);
    expect(metrics.remainingMassRating).toBe(450);
  });

  it('switches active mission and updates delivery context', () => {
    const marsMission = service.getTransportationMission('TRANS_MARS_ROVER_COMBINED_01')!;
    view.setActiveMission(marsMission);

    const missing = service.getMissingRequirements(
      'platform_sat_bus_standard',
      'TRANS_MARS_ROVER_COMBINED_01'
    );
    expect(missing.isComplete).toBe(false);
  });

  it('destroys container and subpanels cleanly', () => {
    expect(view.container.children.length).toBeGreaterThan(0);
    view.destroy();
    expect(view.container.children.length).toBe(0);
  });
});
