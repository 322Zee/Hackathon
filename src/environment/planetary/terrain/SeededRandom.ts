/**
 * INTERSTELLAR CONTINUUM - Deterministic Seeded PRNG
 * Fast, reproducible 32-bit Mulberry32 generator for procedural planetary environments.
 */

export class SeededRandom {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = (seed >>> 0) || 1337;
  }

  /**
   * Resets the generator state to a specific seed.
   */
  public setSeed(seed: number): void {
    this.state = (seed >>> 0) || 1337;
  }

  /**
   * Returns current internal state integer for checkpointing.
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Restores internal state integer.
   */
  public setState(state: number): void {
    this.state = (state >>> 0) || 1337;
  }

  /**
   * Returns a deterministic pseudo-random float in [0.0, 1.0).
   */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a deterministic integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a deterministic float in range [min, max).
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Picks a random element from an array.
   */
  public pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * array.length);
    const item = array[idx];
    if (item === undefined) {
      throw new Error('Index out of bounds');
    }
    return item;
  }

  /**
   * Returns true with given probability [0.0, 1.0].
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Returns 2D value noise sample given integer lattice coords.
   */
  public lattice2D(x: number, y: number): number {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ this.state;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
}
