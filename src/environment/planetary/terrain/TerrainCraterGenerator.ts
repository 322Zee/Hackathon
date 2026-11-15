/**
 * INTERSTELLAR CONTINUUM - Procedural Crater Generator
 * Synthesizes impact craters with central depression floors and elevated rims.
 */

import { SeededRandom } from './SeededRandom';
import { TerrainConfiguration, TerrainCrater } from '../PlanetaryEnvironmentTypes';

export class TerrainCraterGenerator {
  private rng: SeededRandom;
  private config: TerrainConfiguration;

  constructor(config: TerrainConfiguration) {
    this.config = config;
    this.rng = new SeededRandom(config.seed + 997);
  }

  /**
   * Generates a deterministic list of craters distributed across the terrain width.
   */
  public generateCraters(): TerrainCrater[] {
    const craters: TerrainCrater[] = [];
    if (this.config.craterFrequency <= 0) {
      return craters;
    }

    // Number of candidate crater placement slots based on total world width
    const slotCount = Math.floor(this.config.totalWidth / 240);

    for (let i = 0; i < slotCount; i++) {
      if (this.rng.chance(this.config.craterFrequency * 0.75)) {
        const slotX = i * 240 + this.rng.nextFloat(30, 210);
        // Avoid placing craters too close to edges
        if (slotX < 150 || slotX > this.config.totalWidth - 150) {
          continue;
        }

        const radius = this.rng.nextFloat(
          this.config.minCraterRadius,
          this.config.maxCraterRadius
        );
        // Depth proportional to radius with minor random variation
        const depth = radius * this.rng.nextFloat(0.35, 0.65);
        // Rim height is elevated above normal surface
        const rimHeight = depth * this.rng.nextFloat(0.2, 0.35);

        craters.push({
          id: `crater_${i}_${Math.round(slotX)}`,
          centerX: slotX,
          radius,
          depth,
          rimHeight,
        });
      }
    }

    return craters;
  }

  /**
   * Calculates the vertical elevation displacement caused by all overlapping craters at point x.
   * Positive displacement pushes downward (+Y), negative pushes upward (-Y) for rims.
   */
  public getCraterDisplacementAt(x: number, craters: readonly TerrainCrater[]): { displacement: number; craterId?: string } {
    let totalDisplacement = 0;
    let dominantCraterId: string | undefined;

    for (const crater of craters) {
      const dist = Math.abs(x - crater.centerX);
      const r = crater.radius;

      if (dist < r) {
        // Inside crater bowl
        const u = dist / r;
        if (u < 0.8) {
          // Bowl depression: from +depth at center to 0 at 0.8*r
          const t = u / 0.8;
          const bowl = (1 - t * t) * crater.depth;
          totalDisplacement += bowl;
        } else {
          // Rising up to elevated rim lip: 0.8*r to 1.0*r
          const t = (u - 0.8) / 0.2;
          const rim = -crater.rimHeight * Math.sin((t * Math.PI) / 2);
          totalDisplacement += rim;
        }
        dominantCraterId = crater.id;
      } else if (dist <= r * 1.4) {
        // Outside crater rim: gentle quadratic falloff from rim crest down to 0
        const u = (dist - r) / (r * 0.4); // 0 at rim crest, 1 at outer boundary
        const falloff = (1 - u) * (1 - u);
        const rimEffect = -crater.rimHeight * falloff;
        totalDisplacement += rimEffect;
        if (!dominantCraterId) {
          dominantCraterId = crater.id;
        }
      }
    }

    return { displacement: totalDisplacement, craterId: dominantCraterId };
  }
}
