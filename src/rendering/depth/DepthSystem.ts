/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * 2.5D Depth Simulation System
 * Computes perspective scaling, parallax ratios, atmospheric haze, and depth tints
 */

export interface DepthConfig {
  focalDistance: number; // Virtual focal plane distance (default 10)
  maxDepth: number; // Farthest background depth (default 20)
  minDepth: number; // Closest foreground depth (default -5)
  atmosphericFogColor: number; // Fog / haze color (e.g. 0x050b14 for space, 0xc15c3d for Mars)
  atmosphericFogDensity: number; // 0.0 to 1.0
}

export interface DepthTransformResult {
  scale: number;
  parallaxFactor: number;
  alpha: number;
  tint: number;
  blur: number;
}

export class DepthSystem {
  private config: DepthConfig;

  constructor(config?: Partial<DepthConfig>) {
    this.config = {
      focalDistance: 10,
      maxDepth: 20,
      minDepth: -5,
      atmosphericFogColor: 0x0b132b,
      atmosphericFogDensity: 0.45,
      ...config,
    };
  }

  public setConfig(config: Partial<DepthConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): Readonly<DepthConfig> {
    return this.config;
  }

  /**
   * Computes perspective scale for a given virtual depth Z.
   * Z = 0 is the focal plane (scale 1.0).
   * Z > 0 is distant background (scale < 1.0).
   * Z < 0 is near foreground (scale > 1.0).
   */
  public calculateScale(z: number): number {
    const clampedZ = Math.max(this.config.minDepth, Math.min(this.config.maxDepth, z));
    const denom = this.config.focalDistance + clampedZ;
    if (denom <= 0.001) return 2.5;
    return this.config.focalDistance / denom;
  }

  /**
   * Computes parallax movement factor based on depth Z.
   * 0.0 = infinite distance (no camera movement)
   * 1.0 = focal plane (1:1 with camera)
   * > 1.0 = foreground (moves faster than camera)
   */
  public calculateParallaxFactor(z: number): number {
    if (z <= 0) {
      // Foreground: accelerates past camera
      return 1.0 - z * 0.12;
    }
    // Background: decelerates smoothly towards 0
    return Math.max(0.02, 1.0 / (1.0 + z * 0.22));
  }

  /**
   * Simulates atmospheric distance (aerial perspective) by blending
   * object color with atmospheric fog color based on depth.
   */
  public calculateAtmosphericTint(baseColor: number, z: number): number {
    if (z <= 0) return baseColor; // Foreground objects maintain crisp, un-hazed colors

    const fogRatio = Math.min(1.0, (z / this.config.maxDepth) * this.config.atmosphericFogDensity);

    const br = (baseColor >> 16) & 0xff;
    const bg = (baseColor >> 8) & 0xff;
    const bb = baseColor & 0xff;

    const fr = (this.config.atmosphericFogColor >> 16) & 0xff;
    const fg = (this.config.atmosphericFogColor >> 8) & 0xff;
    const fb = this.config.atmosphericFogColor & 0xff;

    const r = Math.round(br + (fr - br) * fogRatio);
    const g = Math.round(bg + (fg - bg) * fogRatio);
    const b = Math.round(bb + (fb - bb) * fogRatio);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Computes complete 2.5D depth transform for an object at virtual depth Z
   */
  public evaluateDepth(z: number, baseColor: number = 0xffffff): DepthTransformResult {
    const scale = this.calculateScale(z);
    const parallaxFactor = this.calculateParallaxFactor(z);
    const tint = this.calculateAtmosphericTint(baseColor, z);

    // Alpha slightly attenuates with extreme distance
    const alpha = z > 0 ? Math.max(0.4, 1.0 - (z / this.config.maxDepth) * 0.35) : 1.0;

    // Blur amount for depth-of-field simulation
    let blur = 0;
    if (z > 12) {
      blur = (z - 12) * 0.5; // Distant background softening
    } else if (z < -2) {
      blur = (-z - 2) * 0.75; // Foreground bokeh softening
    }

    return {
      scale,
      parallaxFactor,
      alpha,
      tint,
      blur,
    };
  }

  /**
   * Applies calculated depth transform directly to a PixiJS DisplayObject/Container
   */
  public applyDepthToObject(
    target: { scale: { set(s: number): void }; tint?: number; alpha: number },
    z: number,
    baseColor: number = 0xffffff
  ): DepthTransformResult {
    const result = this.evaluateDepth(z, baseColor);
    target.scale.set(result.scale);
    target.alpha = result.alpha;
    if (typeof target.tint === 'number') {
      target.tint = result.tint;
    }
    return result;
  }
}
