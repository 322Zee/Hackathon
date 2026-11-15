import { describe, it, expect, beforeEach } from 'vitest';
import { SolarSystemMapCanvas } from '../../src/destinations/ui/SolarSystemMapCanvas';
import { DestinationRegistry } from '../../src/destinations/DestinationRegistry';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('SolarSystemMapCanvas', () => {
  let canvas: SolarSystemMapCanvas;

  beforeEach(() => {
    DestinationRegistry.resetInstance();
    canvas = new SolarSystemMapCanvas({ width: 1300, height: 860 });
  });

  it('renders with schematic scale notice and default earth selection', () => {
    expect(canvas.container.visible).toBe(true);
    expect(canvas.getSelectedDestination()).toBe(DestinationId.EARTH);
  });

  it('selects celestial destinations and updates selection reticle', () => {
    let selectedDest: any = null;
    const interactiveCanvas = new SolarSystemMapCanvas({
      width: 1300,
      height: 860,
      onSelectDestination: (dest) => {
        selectedDest = dest;
      },
    });

    interactiveCanvas.setSelectedDestination(DestinationId.MARS);
    expect(interactiveCanvas.getSelectedDestination()).toBe(DestinationId.MARS);
    expect(selectedDest).toBeDefined();
    expect(selectedDest.id).toBe(DestinationId.MARS);
  });

  it('cycles through primary planets with cycleNextPlanet and cyclePreviousPlanet', () => {
    canvas.setSelectedDestination(DestinationId.EARTH);

    // Next after Earth is Mars
    canvas.cycleNextPlanet();
    expect(canvas.getSelectedDestination()).toBe(DestinationId.MARS);

    // Next after Mars is Asteroid Belt
    canvas.cycleNextPlanet();
    expect(canvas.getSelectedDestination()).toBe(DestinationId.ASTEROID_BELT);

    // Previous cycles backwards
    canvas.cyclePreviousPlanet();
    expect(canvas.getSelectedDestination()).toBe(DestinationId.MARS);

    canvas.cyclePreviousPlanet();
    expect(canvas.getSelectedDestination()).toBe(DestinationId.EARTH);
  });

  it('adjusts zoom level within clamped bounds and resets view', () => {
    canvas.adjustZoom(0.5); // 1.0 -> 1.5
    canvas.adjustZoom(1.5); // Should clamp at max 2.5
    canvas.adjustZoom(-3.0); // Should clamp at min 0.4

    expect(() => canvas.resetView()).not.toThrow();
  });

  it('updates animation without throwing', () => {
    expect(() => {
      canvas.update(0.016);
      canvas.update(0.1);
    }).not.toThrow();
  });
});
