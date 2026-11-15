import { describe, it, expect } from 'vitest';
import { CameraShake } from '../../src/camera/CameraShake';

describe('CameraShake (Trauma Model & Accessibility Guardrails)', () => {
  it('accumulates trauma up to 1.0 limit', () => {
    const shake = new CameraShake();
    expect(shake.getTrauma()).toBe(0);

    shake.addTrauma(0.4);
    expect(shake.getTrauma()).toBe(0.4);

    shake.addTrauma(0.8);
    expect(shake.getTrauma()).toBe(1.0); // Clamped at 1.0
  });

  it('produces non-zero offsets when trauma is active and decays over time', () => {
    const shake = new CameraShake({ decayRate: 1.0 });
    shake.addTrauma(1.0);

    shake.update(0.1);
    expect(shake.getTrauma()).toBeCloseTo(0.9, 2);
    // Non-zero offset during shake
    const hasMovement = Math.abs(shake.offsetX) > 0 || Math.abs(shake.offsetY) > 0;
    expect(hasMovement).toBe(true);

    // Let it decay completely
    shake.update(1.5);
    expect(shake.getTrauma()).toBe(0);
    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
  });

  it('completely suppresses all shake movement when reducedMotion accessibility is enabled', () => {
    const shake = new CameraShake({ reducedMotion: true });
    shake.addTrauma(1.0);

    expect(shake.getTrauma()).toBe(0);
    shake.update(0.1);

    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
    expect(shake.offsetRotation).toBe(0);
  });

  it('scales shake magnitude by intensityMultiplier', () => {
    const shakeHalf = new CameraShake({ intensityMultiplier: 0.5, decayRate: 0 });
    shakeHalf.addTrauma(1.0);
    shakeHalf.update(0.05);

    expect(Math.abs(shakeHalf.offsetX)).toBeLessThanOrEqual(24 * 0.5);
  });
});
