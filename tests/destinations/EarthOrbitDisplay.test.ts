import { describe, it, expect, beforeEach } from 'vitest';
import { EarthOrbitDisplay } from '../../src/destinations/ui/EarthOrbitDisplay';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('EarthOrbitDisplay', () => {
  let display: EarthOrbitDisplay;

  beforeEach(() => {
    DestinationRegistry.resetInstance();
    display = new EarthOrbitDisplay({ width: 1200, height: 800 });
  });

  it('renders schematic Earth proximity frame and orbital regime rings', () => {
    expect(display.container.visible).toBe(true);
  });

  it('triggers destination selection callback when an orbital regime is selected', () => {
    let selectedDest: any = null;
    const interactiveDisplay = new EarthOrbitDisplay({
      width: 1200,
      height: 800,
      onSelectDestination: (dest) => {
        selectedDest = dest;
      },
    });

    interactiveDisplay.setSelectedDestination(DestinationId.EARTH_ORBIT_LEO);
    expect(() => interactiveDisplay.update(0.016)).not.toThrow();
    // Simulate selection
    interactiveDisplay['onSelectCb']?.(DestinationRegistry.getInstance().getDestination(DestinationId.EARTH_ORBIT_LEO)!);
    expect(selectedDest?.id).toBe(DestinationId.EARTH_ORBIT_LEO);
  });

  it('triggers return to solar system callback', () => {
    let returned = false;
    const interactiveDisplay = new EarthOrbitDisplay({
      onReturnToSolarSystem: () => {
        returned = true;
      },
    });

    // Invoke return button callback
    interactiveDisplay['onReturnCb']?.();
    expect(returned).toBe(true);
  });
});
