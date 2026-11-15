/**
 * INTERSTELLAR CONTINUUM - Planetary Environment Framework Events
 * Authoritative event names and strongly-typed payload contracts.
 */

import {
  EnvironmentQualityLevel,
  PointOfInterest,
  PlanetaryEnvironmentDefinition,
  GeneratedTerrainData,
} from './PlanetaryEnvironmentTypes';

export const PLANETARY_ENVIRONMENT_EVENTS = {
  LOADING_STARTED: 'planetary:environment:loading_started',
  LOADED: 'planetary:environment:loaded',
  GENERATION_COMPLETED: 'planetary:environment:generation_completed',
  UNLOADED: 'planetary:environment:unloaded',
  POI_DISCOVERED: 'planetary:environment:poi_discovered',
  QUALITY_CHANGED: 'planetary:environment:quality_changed',
  WEATHER_CHANGED: 'planetary:environment:weather_changed',
} as const;

export interface EnvironmentLoadingStartedPayload {
  readonly destinationId: string;
  readonly timestamp: number;
}

export interface EnvironmentLoadedPayload {
  readonly destinationId: string;
  readonly environment: PlanetaryEnvironmentDefinition;
  readonly terrain: GeneratedTerrainData;
  readonly timestamp: number;
}

export interface EnvironmentGenerationCompletedPayload {
  readonly destinationId: string;
  readonly seed: number;
  readonly verticesCount: number;
  readonly cratersCount: number;
  readonly rocksCount: number;
  readonly poiCount: number;
  readonly durationMs: number;
  readonly timestamp: number;
}

export interface EnvironmentUnloadedPayload {
  readonly destinationId: string;
  readonly timestamp: number;
}

export interface PointOfInterestDiscoveredPayload {
  readonly poiId: string;
  readonly destinationId: string;
  readonly poi: PointOfInterest;
  readonly timestamp: number;
}

export interface EnvironmentQualityChangedPayload {
  readonly previousQuality: EnvironmentQualityLevel;
  readonly newQuality: EnvironmentQualityLevel;
  readonly timestamp: number;
}

export interface WeatherConditionChangedPayload {
  readonly destinationId: string;
  readonly activeWeather: string;
  readonly intensity: number;
  readonly timestamp: number;
}

export type PlanetaryEnvironmentEventMap = {
  [PLANETARY_ENVIRONMENT_EVENTS.LOADING_STARTED]: EnvironmentLoadingStartedPayload;
  [PLANETARY_ENVIRONMENT_EVENTS.LOADED]: EnvironmentLoadedPayload;
  [PLANETARY_ENVIRONMENT_EVENTS.GENERATION_COMPLETED]: EnvironmentGenerationCompletedPayload;
  [PLANETARY_ENVIRONMENT_EVENTS.UNLOADED]: EnvironmentUnloadedPayload;
  [PLANETARY_ENVIRONMENT_EVENTS.POI_DISCOVERED]: PointOfInterestDiscoveredPayload;
  [PLANETARY_ENVIRONMENT_EVENTS.QUALITY_CHANGED]: EnvironmentQualityChangedPayload;
  [PLANETARY_ENVIRONMENT_EVENTS.WEATHER_CHANGED]: WeatherConditionChangedPayload;
};
