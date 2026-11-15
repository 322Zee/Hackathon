import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialWaypointMarker } from '../../src/tutorial/TutorialWaypointMarker';
import { TutorialHighlightTarget } from '../../src/tutorial/TutorialTypes';

describe('TutorialWaypointMarker', () => {
  let marker: TutorialWaypointMarker;

  beforeEach(() => {
    marker = new TutorialWaypointMarker();
  });

  it('initializes containers hidden until target is assigned', () => {
    expect(marker.worldContainer.visible).toBe(false);
    expect(marker.hudContainer.visible).toBe(false);
  });

  it('sets target and positions world container at target coordinates', () => {
    const target: TutorialHighlightTarget = {
      type: 'FACILITY',
      targetId: 'MOC',
      worldPosition: { x: 1800, y: 1730 },
      radius: 120,
      label: 'MISSION OPERATIONS CENTRE',
    };

    marker.setTarget(target);
    expect(marker.getTarget()).toBe(target);
    expect(marker.worldContainer.position.x).toBe(1800);
    expect(marker.worldContainer.position.y).toBe(1730);
  });

  it('updates without crashing when target is set', () => {
    marker.setTarget({
      type: 'FACILITY',
      worldPosition: { x: 2850, y: 1850 },
      radius: 150,
      label: 'PAD ALPHA',
    });

    expect(() => {
      marker.update(0.016, 1000, 1000);
    }).not.toThrow();
  });

  it('clears target cleanly when passed null or NONE', () => {
    marker.setTarget({
      type: 'FACILITY',
      worldPosition: { x: 1800, y: 1730 },
    });
    marker.setTarget(null);
    expect(marker.getTarget()).toBeNull();
    expect(marker.worldContainer.visible).toBe(false);
    expect(marker.hudContainer.visible).toBe(false);
  });
});
