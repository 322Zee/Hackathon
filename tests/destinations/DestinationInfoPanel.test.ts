import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DestinationInfoPanel } from '../../src/destinations/ui/DestinationInfoPanel';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('DestinationInfoPanel', () => {
  let panel: DestinationInfoPanel;
  let registry: DestinationRegistry;

  beforeEach(() => {
    DestinationRegistry.resetInstance();
    registry = DestinationRegistry.getInstance();
    panel = new DestinationInfoPanel({
      width: 500,
      height: 900,
    });
  });

  afterEach(() => {
    panel.destroy();
    DestinationRegistry.resetInstance();
  });

  it('initializes with hidden state when destination is null', () => {
    panel.setDestination(null);
    expect(panel.container.visible).toBe(false);
    expect(panel.getDestination()).toBeNull();
  });

  it('renders telemetry and surface badge for unlocked solid surface destination (Earth)', () => {
    const earth = registry.getDestination(DestinationId.EARTH);
    expect(earth).toBeDefined();

    panel.setDestination(earth!);
    expect(panel.container.visible).toBe(true);
    expect(panel.getDestination()?.id).toBe(DestinationId.EARTH);
  });

  it('renders restricted clearance and progression breakdown for locked destination (Mars)', () => {
    const mars = registry.getDestination(DestinationId.MARS);
    expect(mars).toBeDefined();

    panel.setDestination(mars!);
    expect(panel.container.visible).toBe(true);
    expect(panel.getDestination()?.id).toBe(DestinationId.MARS);
  });

  it('renders hazardous surface badge and restrictions for Venus', () => {
    const venus = registry.getDestination(DestinationId.VENUS);
    expect(venus).toBeDefined();

    panel.setDestination(venus!);
    expect(panel.container.visible).toBe(true);
    expect(panel.getDestination()?.id).toBe(DestinationId.VENUS);
  });

  it('renders no solid surface badge for gas giant Jupiter', () => {
    const jupiter = registry.getDestination(DestinationId.JUPITER);
    expect(jupiter).toBeDefined();

    panel.setDestination(jupiter!);
    expect(panel.container.visible).toBe(true);
    expect(panel.getDestination()?.id).toBe(DestinationId.JUPITER);
  });
});
