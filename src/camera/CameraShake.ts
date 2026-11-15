/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Trauma-Based Screen Shake System with Accessibility Guardrails
 */

export interface CameraShakeConfig {
  maxTranslationOffset: number; // Max pixel offset at trauma 1.0 (e.g. 25px)
  maxRotationAngle: number; // Max rotation angle in radians at trauma 1.0 (e.g. 0.03 rad)
  decayRate: number; // Trauma decay per second (e.g. 1.2)
  frequency: number; // Oscillation frequency (e.g. 24 Hz)
  intensityMultiplier: number; // User accessibility setting (0.0 to 1.0)
  reducedMotion: boolean; // Master accessibility toggle
}

export class CameraShake {
  private trauma: number = 0; // 0.0 to 1.0
  private time: number = 0;
  private config: CameraShakeConfig = {
    maxTranslationOffset: 24,
    maxRotationAngle: 0.025,
    decayRate: 1.4,
    frequency: 22,
    intensityMultiplier: 1.0,
    reducedMotion: false,
  };

  public offsetX: number = 0;
  public offsetY: number = 0;
  public offsetRotation: number = 0;

  constructor(config?: Partial<CameraShakeConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public setConfig(config: Partial<CameraShakeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): Readonly<CameraShakeConfig> {
    return this.config;
  }

  /**
   * Adds trauma to the camera shake system.
   * Traumatizes between 0.0 and 1.0.
   */
  public addTrauma(amount: number): void {
    if (this.config.reducedMotion || this.config.intensityMultiplier <= 0.01) {
      this.trauma = 0;
      return;
    }
    this.trauma = Math.min(1.0, this.trauma + Math.max(0, amount));
  }

  public getTrauma(): number {
    return this.trauma;
  }

  public clear(): void {
    this.trauma = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.offsetRotation = 0;
  }

  public update(deltaSeconds: number): void {
    if (this.trauma <= 0.001 || this.config.reducedMotion || this.config.intensityMultiplier <= 0) {
      this.trauma = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.offsetRotation = 0;
      return;
    }

    this.time += deltaSeconds * this.config.frequency;

    // Shake magnitude is quadratic in trauma (shake = trauma^2) for smooth natural falloff
    const shake = Math.pow(this.trauma, 2) * this.config.intensityMultiplier;

    // Pseudo-harmonic oscillation with multiple sine harmonics to avoid repetitive buzzing
    const harm1 = Math.sin(this.time);
    const harm2 = Math.cos(this.time * 1.37);
    const harm3 = Math.sin(this.time * 0.73);

    this.offsetX = harm1 * this.config.maxTranslationOffset * shake;
    this.offsetY = harm2 * this.config.maxTranslationOffset * shake;
    this.offsetRotation = harm3 * this.config.maxRotationAngle * shake;

    // Linear trauma decay
    this.trauma = Math.max(0, this.trauma - this.config.decayRate * deltaSeconds);
    if (this.trauma <= 0.001) {
      this.trauma = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.offsetRotation = 0;
    }
  }
}
