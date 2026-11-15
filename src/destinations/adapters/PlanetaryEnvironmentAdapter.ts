/**
 * INTERSTELLAR CONTINUUM - Planetary Environment Navigation Adapter
 * Interfaces with PlanetaryEnvironmentManager to query environmental difficulty,
 * surface characteristics, atmospheric density, and points of interest.
 */

import { PlanetaryEnvironmentManager } from '../../environment/planetary/PlanetaryEnvironmentManager';
import { PLANETARY_ENVIRONMENT_PROFILES } from '../../environment/planetary/data/PlanetaryEnvironmentProfiles';
import {
  PlanetaryEnvironmentDefinition,
  EnvironmentalDifficultyRatings,
} from '../../environment/planetary/PlanetaryEnvironmentTypes';

export class PlanetaryEnvironmentAdapter {
  private envManager?: PlanetaryEnvironmentManager;

  constructor(envManager?: PlanetaryEnvironmentManager) {
    this.envManager = envManager ?? this.tryGetEnvManager();
  }

  private tryGetEnvManager(): PlanetaryEnvironmentManager | undefined {
    try {
      return PlanetaryEnvironmentManager.getInstance();
    } catch {
      return undefined;
    }
  }

  /**
   * Retrieves full planetary environment definition for a destination.
   */
  public getEnvironmentDefinition(destinationId: string): PlanetaryEnvironmentDefinition | undefined {
    if (this.envManager) {
      const def = this.envManager.getEnvironmentDefinition(destinationId);
      if (def) return def;
    }
    return PLANETARY_ENVIRONMENT_PROFILES[destinationId];
  }

  /**
   * Retrieves abstract environmental difficulty ratings (1 to 5 scale).
   */
  public getDifficultyRatings(destinationId: string): EnvironmentalDifficultyRatings | undefined {
    const def = this.getEnvironmentDefinition(destinationId);
    return def ? def.difficultyRatings : undefined;
  }

  /**
   * Returns authored points of interest count for a destination.
   */
  public getPointOfInterestCount(destinationId: string): number {
    const def = this.getEnvironmentDefinition(destinationId);
    return def ? def.pointsOfInterest.length : 0;
  }

  /**
   * Returns surface walkability flag.
   */
  public isWalkableSurface(destinationId: string): boolean {
    const def = this.getEnvironmentDefinition(destinationId);
    return def ? def.isWalkableSurface : false;
  }

  public getEnvironmentalDifficulty(destinationId: string) {
    return this.getDifficultyRatings(destinationId);
  }

  public hasSurfaceEnvironment(destinationId: string): boolean {
    return this.isWalkableSurface(destinationId);
  }

  public getProfile(destinationId: string) {
    return this.getEnvironmentDefinition(destinationId);
  }
}
