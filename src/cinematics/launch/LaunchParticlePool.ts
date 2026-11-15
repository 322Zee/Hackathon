/**
 * INTERSTELLAR CONTINUUM - Launch Particle Pool
 * High-performance pre-allocated particle memory pool ensuring zero heap allocations
 * during runtime 60fps cinematic animation ticks.
 */

export type LaunchParticleType =
  | 'CORE_FLAME'
  | 'OUTER_FLAME'
  | 'SMOKE_FORE'
  | 'SMOKE_BACK'
  | 'TRENCH_SMOKE'
  | 'SPARK'
  | 'VAPOR'
  | 'CRYO';

export interface LaunchParticle {
  active: boolean;
  type: LaunchParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  scale: number;
  scaleSpeed: number;
  alpha: number;
  fadeSpeed: number;
  rotation: number;
  rotSpeed: number;
  color: number;
  age: number;
  maxAge: number;
}

export class LaunchParticlePool {
  private pool: LaunchParticle[];
  private capacity: number;
  private nextSearchIdx: number = 0;

  constructor(capacity: number = 600) {
    this.capacity = capacity;
    this.pool = new Array<LaunchParticle>(capacity);

    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        active: false,
        type: 'SMOKE_BACK',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        scale: 1,
        scaleSpeed: 0,
        alpha: 1,
        fadeSpeed: 0.5,
        rotation: 0,
        rotSpeed: 0,
        color: 0xffffff,
        age: 0,
        maxAge: 1,
      };
    }
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public getActiveCount(): number {
    let count = 0;
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (p && p.active) count++;
    }
    return count;
  }

  /**
   * Acquire a pre-allocated particle from the pool without heap allocation
   */
  public acquire(): LaunchParticle {
    // Search sequentially starting from last index
    for (let i = 0; i < this.capacity; i++) {
      const idx = (this.nextSearchIdx + i) % this.capacity;
      const candidate = this.pool[idx];
      if (candidate && !candidate.active) {
        this.nextSearchIdx = (idx + 1) % this.capacity;
        candidate.active = true;
        candidate.age = 0;
        return candidate;
      }
    }

    // If completely full, overwrite oldest slot to prevent drop-outs
    const fallbackIdx = this.nextSearchIdx;
    this.nextSearchIdx = (fallbackIdx + 1) % this.capacity;
    const p = this.pool[fallbackIdx]!;
    p.active = true;
    p.age = 0;
    return p;
  }

  public release(particle: LaunchParticle): void {
    particle.active = false;
  }

  public clear(): void {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (p) p.active = false;
    }
    this.nextSearchIdx = 0;
  }

  public getAll(): readonly LaunchParticle[] {
    return this.pool;
  }
}
