import { describe, it, expect } from 'vitest';
import { DirectionSelector } from '../../src/animation/DirectionSelector';
import { FacingDirection } from '../../src/animation/AnimationTypes';

describe('DirectionSelector', () => {
  it('initializes with specified facing direction', () => {
    const selector = new DirectionSelector(FacingDirection.NORTH);
    expect(selector.getFacing()).toBe(FacingDirection.NORTH);
  });

  it('selects cardinal directions based on movement vector', () => {
    const selector = new DirectionSelector(FacingDirection.SOUTH);

    // Move East
    selector.update(100, 0);
    expect(selector.getFacing()).toBe(FacingDirection.EAST);

    // Move West
    selector.update(-100, 0);
    expect(selector.getFacing()).toBe(FacingDirection.WEST);

    // Move North
    selector.update(0, -100);
    expect(selector.getFacing()).toBe(FacingDirection.NORTH);

    // Move South
    selector.update(0, 100);
    expect(selector.getFacing()).toBe(FacingDirection.SOUTH);
  });

  it('preserves existing direction when speed is below minimum threshold', () => {
    const selector = new DirectionSelector(FacingDirection.EAST, { minMovementThreshold: 10 });

    // Tiny velocity below threshold
    const changed = selector.update(2, 3);
    expect(changed).toBe(false);
    expect(selector.getFacing()).toBe(FacingDirection.EAST);
  });

  it('applies directional hysteresis to prevent diagonal jitter', () => {
    // Current facing is EAST (horizontal)
    const selector = new DirectionSelector(FacingDirection.EAST, { hysteresisRatio: 1.25 });

    // Moving diagonally with slightly stronger vertical velocity (Y = 110, X = 100)
    // 110 is NOT > 100 * 1.25 (125), so hysteresis prevents switching to South!
    selector.update(100, 110);
    expect(selector.getFacing()).toBe(FacingDirection.EAST);

    // Once vertical velocity exceeds the 1.25x hysteresis threshold (Y = 135 > 125)
    selector.update(100, 135);
    expect(selector.getFacing()).toBe(FacingDirection.SOUTH);

    // Now current facing is SOUTH (vertical). Moving diagonally with X = 110, Y = 100
    // 110 is NOT > 100 * 1.25, so stays SOUTH
    selector.update(110, 100);
    expect(selector.getFacing()).toBe(FacingDirection.SOUTH);

    // Once X exceeds threshold (X = 135 > 125), switches to EAST
    selector.update(135, 100);
    expect(selector.getFacing()).toBe(FacingDirection.EAST);
  });

  it('detects diagonal motion accurately', () => {
    const selector = new DirectionSelector(FacingDirection.SOUTH);

    selector.update(100, 100);
    expect(selector.isDiagonal()).toBe(true);

    selector.update(150, 0);
    expect(selector.isDiagonal()).toBe(false);
  });

  it('supports explicit manual facing override', () => {
    const selector = new DirectionSelector(FacingDirection.SOUTH);
    selector.setFacing(FacingDirection.WEST);
    expect(selector.getFacing()).toBe(FacingDirection.WEST);
  });
});
