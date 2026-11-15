import { describe, it, expect } from 'vitest';
import { MovementComponent } from '../../src/player/MovementComponent';

describe('MovementComponent', () => {
  it('normalizes diagonal input to prevent diagonal speed boosting', () => {
    const movement = new MovementComponent({
      walkSpeed: 200,
      acceleration: 10000, // Instant acceleration for testing max speed
      deceleration: 10000,
    });

    // Cardinal movement: (1, 0)
    const cardRes = movement.update(1, 0, false, 1.0);
    const cardSpeed = Math.hypot(cardRes.vx, cardRes.vy);
    expect(cardSpeed).toBeCloseTo(200, 1);

    // Diagonal movement: (1, 1)
    movement.stop();
    const diagRes = movement.update(1, 1, false, 1.0);
    const diagSpeed = Math.hypot(diagRes.vx, diagRes.vy);

    // Diagonal speed should equal walkSpeed (200), NOT 200 * sqrt(2) ≈ 282.8!
    expect(diagSpeed).toBeCloseTo(200, 1);
    expect(diagRes.vx).toBeCloseTo(200 / Math.SQRT2, 1);
    expect(diagRes.vy).toBeCloseTo(200 / Math.SQRT2, 1);
  });

  it('accelerates progressively from standstill', () => {
    const movement = new MovementComponent({
      walkSpeed: 200,
      acceleration: 400, // 400 px/s²
      deceleration: 800,
    });

    // 0.25 seconds of acceleration: 400 * 0.25 = 100 px/s
    const res1 = movement.update(1, 0, false, 0.25);
    expect(res1.vx).toBeCloseTo(100, 1);
    expect(res1.deltaX).toBeCloseTo(100 * 0.25, 1); // 25px

    // Another 0.25 seconds: 100 + 100 = 200 px/s (hits walkSpeed cap)
    const res2 = movement.update(1, 0, false, 0.25);
    expect(res2.vx).toBeCloseTo(200, 1);

    // Further acceleration does not exceed walkSpeed
    const res3 = movement.update(1, 0, false, 0.5);
    expect(res3.vx).toBe(200);
  });

  it('accelerates to higher sprintSpeed when isSprinting is true', () => {
    const movement = new MovementComponent({
      walkSpeed: 180,
      sprintSpeed: 300,
      acceleration: 10000,
    });

    // Walking
    const walkRes = movement.update(1, 0, false, 0.5);
    expect(walkRes.vx).toBe(180);

    // Sprinting
    const sprintRes = movement.update(1, 0, true, 0.5);
    expect(sprintRes.vx).toBe(300);
  });

  it('decelerates cleanly to 0 when input ceases', () => {
    const movement = new MovementComponent({
      walkSpeed: 200,
      acceleration: 10000,
      deceleration: 500, // 500 px/s²
    });

    // Accelerate to 200
    movement.update(1, 0, false, 0.1);
    expect(movement.getVelocity().x).toBe(200);

    // Cease input (0, 0) for 0.2 seconds: loses 500 * 0.2 = 100 px/s -> 100 px/s
    movement.update(0, 0, false, 0.2);
    expect(movement.getVelocity().x).toBeCloseTo(100, 1);

    // Another 0.3 seconds: loses 150 px/s -> clamps to 0
    movement.update(0, 0, false, 0.3);
    expect(movement.getVelocity().x).toBe(0);
    expect(movement.getVelocity().y).toBe(0);
  });

  it('handles zero or negative delta time without NaN', () => {
    const movement = new MovementComponent();
    const res = movement.update(1, 1, false, 0);
    expect(res.deltaX).toBe(0);
    expect(res.deltaY).toBe(0);
    expect(Number.isNaN(res.vx)).toBe(false);
  });
});
