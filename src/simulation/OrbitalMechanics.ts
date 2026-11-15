export interface CelestialBodyConstants {
  name: string;
  radiusKm: number;
  massKg: number;
  mu: number; // Standard gravitational parameter km^3 / s^2
  soiRadiusKm: number; // Sphere of influence radius
}

export interface CelestialBodiesMap {
  EARTH: CelestialBodyConstants;
  MOON: CelestialBodyConstants;
  MARS: CelestialBodyConstants;
  VENUS: CelestialBodyConstants;
}

export const CELESTIAL_BODIES: CelestialBodiesMap = {
  EARTH: {
    name: "Earth",
    radiusKm: 6371,
    massKg: 5.972e24,
    mu: 398600.4418,
    soiRadiusKm: 924000,
  },
  MOON: {
    name: "Moon",
    radiusKm: 1737.4,
    massKg: 7.342e22,
    mu: 4902.8,
    soiRadiusKm: 66100,
  },
  MARS: {
    name: "Mars",
    radiusKm: 3389.5,
    massKg: 6.4171e23,
    mu: 42828.37,
    soiRadiusKm: 576000,
  },
  VENUS: {
    name: "Venus",
    radiusKm: 6051.8,
    massKg: 4.867e24,
    mu: 324859,
    soiRadiusKm: 616000,
  },
};

export const STANDARD_GRAVITY = 9.80665; // m/s^2

export class OrbitalMechanics {
  /**
   * Calculate orbital speed using the Vis-Viva equation:
   * v = sqrt(mu * (2/r - 1/a))
   * @param r Distance from central body focus (km)
   * @param semiMajorAxis Semi-major axis of orbit (km)
   * @param mu Standard gravitational parameter (km^3/s^2)
   */
  public static calculateOrbitalSpeed(r: number, semiMajorAxis: number, mu: number = CELESTIAL_BODIES.EARTH!.mu): number {
    if (r <= 0 || semiMajorAxis <= 0) {
      throw new Error("Radius and semi-major axis must be strictly positive");
    }
    const speedSquared = mu * (2 / r - 1 / semiMajorAxis);
    return Math.sqrt(Math.max(0, speedSquared));
  }

  /**
   * Calculate circular orbital speed at given radius:
   * v = sqrt(mu / r)
   */
  public static calculateCircularVelocity(r: number, mu: number = CELESTIAL_BODIES.EARTH!.mu): number {
    if (r <= 0) throw new Error("Orbital radius must be positive");
    return Math.sqrt(mu / r);
  }

  /**
   * Calculate escape velocity at given radius:
   * v_esc = sqrt(2 * mu / r)
   */
  public static calculateEscapeVelocity(r: number, mu: number = CELESTIAL_BODIES.EARTH!.mu): number {
    if (r <= 0) throw new Error("Orbital radius must be positive");
    return Math.sqrt((2 * mu) / r);
  }

  /**
   * Calculate orbital period in seconds:
   * T = 2 * pi * sqrt(a^3 / mu)
   */
  public static calculateOrbitalPeriod(semiMajorAxis: number, mu: number = CELESTIAL_BODIES.EARTH!.mu): number {
    if (semiMajorAxis <= 0) throw new Error("Semi-major axis must be positive");
    return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
  }

  /**
   * Calculate Hohmann transfer delta-V requirements between two circular co-planar orbits.
   * Returns deltaV1 (injection burn), deltaV2 (insertion burn), and totalDeltaV (km/s).
   */
  public static calculateHohmannTransfer(
    r1: number,
    r2: number,
    mu: number = CELESTIAL_BODIES.EARTH!.mu
  ): { deltaV1: number; deltaV2: number; totalDeltaV: number; transferTimeSeconds: number } {
    if (r1 <= 0 || r2 <= 0) {
      throw new Error("Orbital radii must be positive");
    }

    const v1 = Math.sqrt(mu / r1);
    const v2 = Math.sqrt(mu / r2);

    const aTransfer = (r1 + r2) / 2;
    const vTransfer1 = Math.sqrt(mu * (2 / r1 - 1 / aTransfer));
    const vTransfer2 = Math.sqrt(mu * (2 / r2 - 1 / aTransfer));

    const deltaV1 = Math.abs(vTransfer1 - v1);
    const deltaV2 = Math.abs(v2 - vTransfer2);
    const totalDeltaV = deltaV1 + deltaV2;
    const transferTimeSeconds = Math.PI * Math.sqrt(Math.pow(aTransfer, 3) / mu);

    return {
      deltaV1,
      deltaV2,
      totalDeltaV,
      transferTimeSeconds,
    };
  }

  /**
   * Tsiolkovsky Rocket Equation:
   * deltaV = Isp * g0 * ln(m0 / mf)
   * @param isp Specific impulse in seconds
   * @param wetMassInitial Initial launch mass (kg)
   * @param dryMassFinal Burnout / dry mass (kg)
   * @returns deltaV in m/s
   */
  public static calculateDeltaV(isp: number, wetMassInitial: number, dryMassFinal: number): number {
    if (wetMassInitial <= 0 || dryMassFinal <= 0) {
      throw new Error("Mass values must be positive");
    }
    if (dryMassFinal > wetMassInitial) {
      throw new Error("Dry mass cannot exceed initial wet mass");
    }
    return isp * STANDARD_GRAVITY * Math.log(wetMassInitial / dryMassFinal);
  }

  /**
   * Calculate required wet mass for a given dry mass and deltaV target:
   * m0 = mf * exp(deltaV / (Isp * g0))
   */
  public static calculateRequiredWetMass(isp: number, dryMassFinal: number, requiredDeltaVMetersPerSec: number): number {
    if (isp <= 0 || dryMassFinal <= 0) throw new Error("Isp and dry mass must be positive");
    return dryMassFinal * Math.exp(requiredDeltaVMetersPerSec / (isp * STANDARD_GRAVITY));
  }
}
