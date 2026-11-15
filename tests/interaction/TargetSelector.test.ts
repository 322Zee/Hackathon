import { describe, it, expect, beforeEach } from 'vitest';
import { TargetSelector } from '../../src/interaction/TargetSelector';
import { InteractiveObject } from '../../src/interaction/InteractiveObject';

describe('TargetSelector', () => {
  let selector: TargetSelector;

  beforeEach(() => {
    selector = new TargetSelector(0.8);
  });

  it('selects single object when player is within interaction radius', () => {
    const obj = new InteractiveObject({
      id: 'terminal_1',
      displayName: 'Flight Terminal',
      x: 100,
      y: 100,
      interactionRadius: 80,
    });

    const result = selector.evaluateTargets([obj], 120, 100);
    expect(result.bestTarget).toBe(obj);
    expect(result.targetChanged).toBe(true);
    expect(selector.getActiveTarget()).toBe(obj);
  });

  it('ignores objects when player is beyond interaction radius', () => {
    const obj = new InteractiveObject({
      id: 'terminal_1',
      displayName: 'Flight Terminal',
      x: 100,
      y: 100,
      interactionRadius: 50,
    });

    const result = selector.evaluateTargets([obj], 200, 200);
    expect(result.bestTarget).toBeNull();
    expect(result.targetChanged).toBe(false);
    expect(selector.getActiveTarget()).toBeNull();
  });

  it('prefers higher priority target even if another is closer', () => {
    const lowPriorityCloser = new InteractiveObject({
      id: 'crate_1',
      displayName: 'Supply Crate',
      x: 105,
      y: 100,
      interactionRadius: 80,
      priority: 1,
    });

    const highPriorityFarther = new InteractiveObject({
      id: 'terminal_1',
      displayName: 'Main Airlock',
      x: 130,
      y: 100,
      interactionRadius: 80,
      priority: 5,
    });

    const result = selector.evaluateTargets([lowPriorityCloser, highPriorityFarther], 100, 100);
    expect(result.bestTarget).toBe(highPriorityFarther);
  });

  it('breaks ties between equal priority targets using distance', () => {
    const objA = new InteractiveObject({
      id: 'station_a',
      displayName: 'Station A',
      x: 130,
      y: 100,
      interactionRadius: 80,
      priority: 2,
    });

    const objB = new InteractiveObject({
      id: 'station_b',
      displayName: 'Station B',
      x: 110,
      y: 100,
      interactionRadius: 80,
      priority: 2,
    });

    const result = selector.evaluateTargets([objA, objB], 100, 100);
    expect(result.bestTarget).toBe(objB);
  });

  it('prevents target flickering using hysteresis', () => {
    // Current target is at distance 50
    const currentTarget = new InteractiveObject({
      id: 'current_station',
      displayName: 'Current Station',
      x: 150,
      y: 100,
      interactionRadius: 80,
      priority: 2,
    });

    // Initial evaluation selects currentTarget
    selector.evaluateTargets([currentTarget], 100, 100);
    expect(selector.getActiveTarget()).toBe(currentTarget);

    // Candidate B is at distance 45 (10% closer: 45 / 50 = 0.9 > 0.8 hysteresis ratio)
    // Under hysteresis (0.8), Candidate B must be < 40 away to steal focus
    const rivalCandidate = new InteractiveObject({
      id: 'rival_station',
      displayName: 'Rival Station',
      x: 145,
      y: 100,
      interactionRadius: 80,
      priority: 2,
    });

    const result = selector.evaluateTargets([currentTarget, rivalCandidate], 100, 100);
    // Focus should remain stably on currentTarget
    expect(result.bestTarget).toBe(currentTarget);
    expect(result.targetChanged).toBe(false);

    // When rival gets significantly closer (e.g. distance 35 < 50 * 0.8 = 40), it steals focus
    rivalCandidate.x = 135;
    const rivalStealsResult = selector.evaluateTargets([currentTarget, rivalCandidate], 100, 100);
    expect(rivalStealsResult.bestTarget).toBe(rivalCandidate);
    expect(rivalStealsResult.targetChanged).toBe(true);
  });

  it('scales detection radius with range multiplier', () => {
    const obj = new InteractiveObject({
      id: 'beacon',
      displayName: 'Signal Beacon',
      x: 100,
      y: 100,
      interactionRadius: 50,
    });

    // At dist 70 with 1.0x range: out of range
    const res1 = selector.evaluateTargets([obj], 170, 100, 1.0);
    expect(res1.bestTarget).toBeNull();

    // At dist 70 with 1.5x range (effective 75): in range
    const res2 = selector.evaluateTargets([obj], 170, 100, 1.5);
    expect(res2.bestTarget).toBe(obj);
  });
});
