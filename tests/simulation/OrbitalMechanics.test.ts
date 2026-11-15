import { describe, it, expect } from 'vitest';
import { OrbitalMechanics, CELESTIAL_BODIES } from '../../src/simulation/OrbitalMechanics';

describe('OrbitalMechanics', () => {
  it('calculates low Earth orbit circular velocity accurately (~7.78 km/s at 200km altitude)', () => {
    const leoRadius = CELESTIAL_BODIES.EARTH.radiusKm + 200; // 6571 km
    const vCirc = OrbitalMechanics.calculateCircularVelocity(leoRadius, CELESTIAL_BODIES.EARTH.mu);
    expect(vCirc).toBeCloseTo(7.788, 2);
  });

  it('calculates Earth escape velocity at surface (~11.18 km/s)', () => {
    const vEsc = OrbitalMechanics.calculateEscapeVelocity(CELESTIAL_BODIES.EARTH.radiusKm, CELESTIAL_BODIES.EARTH.mu);
    expect(vEsc).toBeCloseTo(11.186, 2);
  });

  it('calculates orbital period for geostationary orbit (~86164 seconds / 1 sidereal day)', () => {
    const geoAltitudeKm = 35786;
    const geoRadiusKm = CELESTIAL_BODIES.EARTH.radiusKm + geoAltitudeKm; // ~42157 km
    const periodSeconds = OrbitalMechanics.calculateOrbitalPeriod(geoRadiusKm, CELESTIAL_BODIES.EARTH.mu);
    expect(periodSeconds).toBeGreaterThan(86000);
    expect(periodSeconds).toBeLessThan(86500);
  });

  it('calculates Hohmann transfer deltaV between LEO and GEO', () => {
    const r1 = CELESTIAL_BODIES.EARTH.radiusKm + 300; // 6671 km
    const r2 = CELESTIAL_BODIES.EARTH.radiusKm + 35786; // 42157 km
    const transfer = OrbitalMechanics.calculateHohmannTransfer(r1, r2, CELESTIAL_BODIES.EARTH.mu);

    expect(transfer.deltaV1).toBeGreaterThan(2.3);
    expect(transfer.deltaV1).toBeLessThan(2.6);
    expect(transfer.deltaV2).toBeGreaterThan(1.3);
    expect(transfer.deltaV2).toBeLessThan(1.6);
    expect(transfer.totalDeltaV).toBeCloseTo(transfer.deltaV1 + transfer.deltaV2, 4);
    expect(transfer.transferTimeSeconds).toBeGreaterThan(18000); // ~5.2 hours
  });

  it('calculates Tsiolkovsky deltaV for rocket stage', () => {
    const isp = 350; // seconds
    const m0 = 100000; // kg initial wet mass
    const mf = 20000; // kg burnout dry mass
    const deltaV = OrbitalMechanics.calculateDeltaV(isp, m0, mf);

    // Delta-V = 350 * 9.80665 * ln(5) ~= 350 * 9.80665 * 1.6094379 ~= 5524 m/s
    expect(deltaV).toBeCloseTo(5524, 0);
  });
});
