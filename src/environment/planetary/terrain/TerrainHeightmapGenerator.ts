/**
 * INTERSTELLAR CONTINUUM - Procedural Terrain Heightmap Generator
 * Multi-octave continuous elevation synthesis with smooth Hermite interpolation.
 */

import { SeededRandom } from './SeededRandom';
import { TerrainConfiguration } from '../PlanetaryEnvironmentTypes';

export class TerrainHeightmapGenerator {
  private rng: SeededRandom;
  private config: TerrainConfiguration;

  constructor(config: TerrainConfiguration) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
  }

  /**
   * Smoothstep / Hermite quintic interpolation curve: 6t^5 - 15t^4 + 10t^3
   */
  private smooth(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * 1D gradient/value noise sample at continuous coordinate x.
   */
  private sampleNoise(x: number, wavelength: number): number {
    const unit = x / wavelength;
    const x0 = Math.floor(unit);
    const x1 = x0 + 1;
    const t = unit - x0;

    const s = this.smooth(t);
    const v0 = this.rng.lattice2D(x0, 101);
    const v1 = this.rng.lattice2D(x1, 101);

    return v0 * (1 - s) + v1 * s;
  }

  /**
   * Computes elevation (Y coordinate in 2D space, where smaller Y is higher altitude)
   * at a given horizontal coordinate x.
   */
  public getElevationAt(x: number): number {
    let totalNoise = 0;
    let amplitude = 1.0;
    let maxAmplitude = 0;
    let wavelength = Math.max(100, this.config.segmentWidth);

    for (let o = 0; o < this.config.octaves; o++) {
      const sample = (this.sampleNoise(x, wavelength) * 2 - 1);
      totalNoise += sample * amplitude;
      maxAmplitude += amplitude;

      amplitude *= this.config.persistence * (1.0 - this.config.roughness * 0.2);
      wavelength /= this.config.lacunarity;
      if (wavelength < 10) break;
    }

    const normalizedDisplacement = maxAmplitude > 0 ? totalNoise / maxAmplitude : 0;
    // Note: in 2D canvas/Pixi, ground Y increases downward. A positive hill displaces upward (-Y).
    const displacement = normalizedDisplacement * this.config.heightVariation;
    return this.config.baseElevation - displacement;
  }
}
