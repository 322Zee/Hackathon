/**
 * INTERSTELLAR CONTINUUM - Planetary Base Environment Adapter
 * Interacts with DestinationRegistry and BaseLocationRegistry to evaluate
 * destination eligibility, environmental suitability, solar exposure, and wear rates.
 */

import {
  DestinationId,
  DestinationRecord,
  DestinationCategory,
  SurfaceAvailability,
} from '../../destinations/DestinationTypes';
import { DestinationRegistry } from '../../destinations/DestinationRegistry';
import { BaseLocationRegistry } from '../locations/BaseLocationRegistry';
import { LocationSuitabilityEvaluation } from '../BaseTypes';

export class EnvironmentAdapter {
  private destinationRegistry?: DestinationRegistry;
  private locationRegistry: BaseLocationRegistry;

  constructor(
    destinationRegistry?: DestinationRegistry,
    locationRegistry?: BaseLocationRegistry
  ) {
    this.destinationRegistry = destinationRegistry;
    this.locationRegistry = locationRegistry || BaseLocationRegistry.getInstance();
  }

  public setDestinationRegistry(registry?: DestinationRegistry): void {
    this.destinationRegistry = registry;
  }

  /**
   * Checks if a destination is eligible for surface bases.
   * Gas giants, stars, and pure orbital regions are not eligible.
   */
  public isDestinationEligible(destinationId: DestinationId): {
    eligible: boolean;
    reason?: string;
  } {
    // Basic destination category check
    if (
      destinationId === DestinationId.SUN ||
      destinationId === DestinationId.JUPITER ||
      destinationId === DestinationId.SATURN ||
      destinationId === DestinationId.URANUS ||
      destinationId === DestinationId.NEPTUNE ||
      destinationId === DestinationId.EARTH_ORBIT_LEO ||
      destinationId === DestinationId.EARTH_ORBIT_MEO ||
      destinationId === DestinationId.EARTH_ORBIT_GEO ||
      destinationId === DestinationId.EARTH_ORBIT_HEO
    ) {
      return {
        eligible: false,
        reason: 'Celestial body lacks a solid surface suitable for outpost construction.',
      };
    }

    if (this.destinationRegistry) {
      const dest = this.destinationRegistry.getDestination(destinationId);
      if (dest) {
        if (
          dest.category === DestinationCategory.GAS_GIANT ||
          dest.category === DestinationCategory.ICE_GIANT ||
          dest.category === DestinationCategory.STAR ||
          dest.category === DestinationCategory.ORBITAL_REGION
        ) {
          return {
            eligible: false,
            reason: `Destination category ${dest.category} does not support surface outposts.`,
          };
        }

        if (
          dest.surfaceAvailability === SurfaceAvailability.NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY
        ) {
          return {
            eligible: false,
            reason: 'Surface is unavailable; destination requires orbital or atmospheric platforms only.',
          };
        }
      }
    }

    return { eligible: true };
  }

  /**
   * Evaluates location suitability and environmental factors.
   */
  public evaluateLocation(
    destinationId: DestinationId,
    locationId: string
  ): LocationSuitabilityEvaluation {
    const destEligibility = this.isDestinationEligible(destinationId);
    const candidate = this.locationRegistry.getLocation(locationId);

    const locationName = candidate ? candidate.name : locationId;

    if (!destEligibility.eligible) {
      return {
        destinationId,
        locationId,
        locationName,
        isEligible: false,
        suitabilityScore: 0,
        hazardLevel: 'EXTREME',
        solarEfficiencyMultiplier: 0,
        resourceRichnessMultiplier: 0,
        wearFactorMultiplier: 3.0,
        requiredProtections: ['FULL_ORBITAL_ENVELOPE'],
        environmentalSummary: destEligibility.reason || 'Ineligible destination.',
        reasonsForIneligibility: [destEligibility.reason || 'Surface outpost prohibited.'],
      };
    }

    // Default baseline values
    let solarMultiplier = 1.0;
    let resourceMultiplier = 1.0;
    let wearMultiplier = 1.0;
    let hazardLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'LOW';
    let baseScore = 80;
    const protections: string[] = [];

    // Extract destination-specific metrics if registry is available
    if (this.destinationRegistry) {
      const dest = this.destinationRegistry.getDestination(destinationId);
      if (dest) {
        if (dest.gameplayConfig) {
          // Solar flux: Earth standard ~ 1361 W/m2 -> 1.0
          const solarFlux = dest.gameplayConfig.solarFluxWm2 ?? 1361;
          solarMultiplier = Math.max(0.05, Math.min(2.0, solarFlux / 1361));

          // Dust storms increase wear
          const dustRisk = dest.gameplayConfig.dustStormRiskPercent ?? 0;
          if (dustRisk > 20) {
            wearMultiplier += (dustRisk / 100) * 0.5;
            protections.push('DUST_SEALED_AIRLOCKS');
          }

          // Radiation damage increases wear and hazard
          const radRate = dest.gameplayConfig.radiationDamageRate ?? 0;
          if (radRate > 1.5) {
            hazardLevel = 'HIGH';
            wearMultiplier += 0.4;
            protections.push('HEAVY_RADIATION_SHIELDING');
          }
        }

        // Atmosphere pressure
        if (dest.atmosphericDetails) {
          if (dest.atmosphericDetails.surfacePressureAtm > 50) {
            hazardLevel = 'EXTREME';
            wearMultiplier += 0.8;
            protections.push('SUPERCRITICAL_PRESSURE_HULL');
          } else if (dest.atmosphericDetails.surfacePressureAtm < 0.01) {
            protections.push('VACUUM_THERMAL_INSULATION');
          }
        }
      }
    }

    // Candidate location modifiers
    if (candidate) {
      baseScore = candidate.suitabilityScore;
      hazardLevel = candidate.hazardRating;
      solarMultiplier *= candidate.solarExposurePercent / 100;
      wearMultiplier *= 1 + candidate.dustHazardFactor * 0.4 - candidate.radiationProtectionFactor * 0.2;

      // Richness
      const avgAbundance =
        (candidate.resourceAbundance.rawMinerals +
          candidate.resourceAbundance.waterIce +
          candidate.resourceAbundance.volatiles) /
        3;
      resourceMultiplier = Math.max(0.5, avgAbundance / 50);
    }

    const summary = candidate
      ? `${candidate.name}: ${candidate.description} (Suitability: ${Math.round(baseScore)}%)`
      : `Location ${locationId} on ${destinationId}`;

    return {
      destinationId,
      locationId,
      locationName,
      isEligible: true,
      suitabilityScore: Math.round(baseScore),
      hazardLevel,
      solarEfficiencyMultiplier: Math.round(solarMultiplier * 100) / 100,
      resourceRichnessMultiplier: Math.round(resourceMultiplier * 100) / 100,
      wearFactorMultiplier: Math.round(wearMultiplier * 100) / 100,
      requiredProtections: protections,
      environmentalSummary: summary,
    };
  }
}
