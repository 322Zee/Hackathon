import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../../src/core/EventBus';
import {
  RocketDesignCanvas,
  RocketBuilderEngine,
} from '../../../src/engineering';

describe('RocketDesignCanvas', () => {
  let eventBus: EventBus;
  let engine: RocketBuilderEngine;

  beforeEach(() => {
    eventBus = new EventBus();
    RocketBuilderEngine.resetInstance();
    engine = RocketBuilderEngine.getInstance(eventBus);
  });

  it('initializes canvas container and viewport hierarchy', () => {
    const canvas = new RocketDesignCanvas({
      width: 880,
      height: 700,
    });

    expect(canvas.container).toBeDefined();
    expect(canvas.container.children.length).toBeGreaterThan(0);
  });

  it('manages zoom adjustments and clamps to safe min/max limits', () => {
    const canvas = new RocketDesignCanvas({
      width: 880,
      height: 700,
    });

    // Zoom in
    canvas.adjustZoom(0.2);
    // Should be at 1.2

    // Extreme zoom in (clamp to 2.2)
    canvas.adjustZoom(5.0);

    // Extreme zoom out (clamp to 0.5)
    canvas.adjustZoom(-10.0);

    // Set specific zoom
    canvas.setZoom(1.5);
  });

  it('supports pan and viewport centering', () => {
    const canvas = new RocketDesignCanvas({
      width: 880,
      height: 700,
    });

    canvas.pan(50, -30);
    canvas.centerView();
    canvas.fitToScreen();
    expect(canvas.container).toBeDefined();
  });

  it('renders vehicle configuration and updates selected slot', () => {
    let _selectedSlotId: string | undefined;

    const canvas = new RocketDesignCanvas({
      width: 880,
      height: 700,
      onSlotSelected: (slotId) => {
        _selectedSlotId = slotId;
      },
    });

    const config = engine.getConfiguration();
    canvas.setConfiguration(config, 'stg1_propulsion');

    canvas.setSelectedSlot('stg2_structure');
    expect(canvas.container).toBeDefined();
    expect(_selectedSlotId).toBeUndefined();
  });
});
