/**
 * INTERSTELLAR CONTINUUM - Planetary Environment Framework Types
 * Strongly typed definitions for planetary exploration environments,
 * data-driven destination profiles, procedural terrain configurations,
 * multi-layer visual systems, environmental difficulty ratings, and interaction contracts.
 */

import { DestinationId, EnvironmentalClassification } from '../../destinations/DestinationTypes';

/**
 * Visual quality presets for environmental rendering and particle simulation
 */
export enum EnvironmentQualityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  ULTRA = 'ULTRA',
}

/**
 * Mode of environmental exploration / presentation
 */
export enum EnvironmentPresentationMode {
  /** Solid terrestrial or icy surface capable of rover or astronaut locomotion */
  WALKABLE_SURFACE = 'WALKABLE_SURFACE',
  /** Low-gravity microbody surface with minimal traction and anchoring requirements */
  LOW_GRAVITY_SURFACE = 'LOW_GRAVITY_SURFACE',
  /** Orbital observation environment with celestial body vistas (e.g. gas giants) */
  ORBITAL_OBSERVATION = 'ORBITAL_OBSERVATION',
  /** High-altitude atmospheric descent probe perspective (no solid surface) */
  ATMOSPHERIC_PROBE = 'ATMOSPHERIC_PROBE',
}

/**
 * Types of procedural and authored surface terrain features
 */
export enum TerrainFeatureType {
  CRATER = 'CRATER',
  BOULDER = 'BOULDER',
  RIDGE = 'RIDGE',
  CREVASSE = 'CREVASSE',
  LAKE_SHORELINE = 'LAKE_SHORELINE',
  VOLCANIC_VENT = 'VOLCANIC_VENT',
  CRYO_GEYSER = 'CRYO_GEYSER',
  DUNE = 'DUNE',
  FISSURE = 'FISSURE',
  HYDROCARBON_BASIN = 'HYDROCARBON_BASIN',
}

/**
 * Categorization of points of interest for future gameplay systems
 */
export enum PointOfInterestType {
  POI_SCIENTIFIC_OBSERVATION = 'POI_SCIENTIFIC_OBSERVATION',
  POI_GEOLOGICAL_FEATURE = 'POI_GEOLOGICAL_FEATURE',
  POI_ROVER_ROUTE = 'POI_ROVER_ROUTE',
  POI_BASE_SITE = 'POI_BASE_SITE',
  POI_RESOURCE_DEPOSIT = 'POI_RESOURCE_DEPOSIT',
  POI_LANDING_ZONE = 'POI_LANDING_ZONE',
}

/**
 * Discovery progression status for exploration points of interest
 */
export enum POIDiscoveryStatus {
  UNDISCOVERED = 'UNDISCOVERED',
  DISCOVERED = 'DISCOVERED',
  ANALYZED = 'ANALYZED',
}

/**
 * Entity accessibility classification for environmental sites
 */
export enum EntityAccessType {
  CREW = 'CREW',
  ROVER = 'ROVER',
  PROBE = 'PROBE',
  ANY = 'ANY',
}

/**
 * Environmental weather / particulate visual effects
 */
export enum WeatherEffectType {
  NONE = 'NONE',
  DUST_MOTES = 'DUST_MOTES',
  DUST_STORM = 'DUST_STORM',
  ACID_HAZE = 'ACID_HAZE',
  CRYO_PLUME = 'CRYO_PLUME',
  SOLAR_CORONA_FLARE = 'SOLAR_CORONA_FLARE',
  METHANE_MIST = 'METHANE_MIST',
  MICRO_METEOR_SHOWER = 'MICRO_METEOR_SHOWER',
}

/**
 * Severity rating for planetary environmental hazards
 */
export enum HazardSeverity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME',
  LETHAL = 'LETHAL',
}

/**
 * Abstract gameplay environmental difficulty ratings (1 to 5 scale)
 */
export interface EnvironmentalDifficultyRatings {
  /** Thermal extremity rating (1 = Temperate, 5 = Cryogenic -200C or Scorching +465C) */
  readonly temperatureDifficulty: number;
  /** Surface roughness and obstacle density rating (1 = Smooth plain, 5 = Rugged chasm) */
  readonly terrainDifficulty: number;
  /** Visual range and atmospheric scattering obstruction (1 = Clear vacuum, 5 = Choking haze) */
  readonly visibilityDifficulty: number;
  /** Atmospheric hostility or crushing pressure (1 = Vacuum/1-bar, 5 = Supercritical 92-bar acid) */
  readonly atmosphericDifficulty: number;
  /** Ease of landing and vehicle ingress (1 = Broad plateau, 5 = Microgravity tumbling boulder) */
  readonly surfaceAccessibility: number;
  /** Composite overall hazard classification */
  readonly overallHazardLevel: HazardSeverity;
  /** Curated gameplay hazard warnings */
  readonly hazardNotes: readonly string[];
  /** Fictional recommended mission equipment */
  readonly recommendedEquipment: readonly string[];
}

/**
 * Configuration parameters for procedural terrain synthesis
 */
export interface TerrainConfiguration {
  /** Deterministic PRNG seed for reproducible generation */
  readonly seed: number;
  /** Base ground plane Y coordinate in world space */
  readonly baseElevation: number;
  /** Maximum vertical displacement amplitude from base elevation */
  readonly heightVariation: number;
  /** Multi-octave noise roughness factor (0.0 to 1.0) */
  readonly roughness: number;
  /** Number of noise frequency octaves */
  readonly octaves: number;
  /** Persistence factor per octave */
  readonly persistence: number;
  /** Lacunarity multiplier per octave */
  readonly lacunarity: number;
  /** Horizontal width of each terrain chunk / section */
  readonly segmentWidth: number;
  /** Total horizontal width of the environment world */
  readonly totalWidth: number;
  /** Impact crater density factor (0.0 to 1.0) */
  readonly craterFrequency: number;
  /** Minimum crater radius in world units */
  readonly minCraterRadius: number;
  /** Maximum crater radius in world units */
  readonly maxCraterRadius: number;
  /** Surface boulder and rock distribution frequency */
  readonly rockFrequency: number;
  /** Minimum rock size */
  readonly minRockSize: number;
  /** Maximum rock size */
  readonly maxRockSize: number;
  /** Surface traction and friction coefficient (0.0 to 1.0) */
  readonly surfaceFriction: number;
  /** Horizontal sample step resolution (in pixels) */
  readonly stepResolution: number;
}

/**
 * Surface visual and material styling properties
 */
export interface SurfaceVisualProperties {
  /** Dominant topsoil / bedrock tint */
  readonly primaryColor: number;
  /** Secondary highlight or accent color */
  readonly secondaryColor: number;
  /** Vertical geological strata layer colors (top to bottom) */
  readonly strataColors: readonly number[];
  /** Scattered rock and boulder color palette */
  readonly rockColors: readonly number[];
  /** Elevated crater rim highlight color */
  readonly craterRimColor: number;
  /** Deep crater depression shadow tint */
  readonly craterFloorColor: number;
  /** Whether to render icy chaotic fracture lineae (e.g. Europa, Enceladus) */
  readonly icePatternOverlay?: boolean;
  /** Color of surface liquid bodies (e.g. Titan methane lakes) */
  readonly liquidLakeColor?: number;
  /** Specular reflectivity of liquid or ice surfaces (0.0 to 1.0) */
  readonly liquidReflectivity?: number;
  /** Texture styling archetype */
  readonly regolithTextureStyle: 'ROCKY' | 'SANDY' | 'ICY' | 'VOLCANIC' | 'METALLIC';
  /** Ground contact shadow tint */
  readonly shadowColor: number;
  /** Shadow opacity (0.0 to 1.0) */
  readonly shadowAlpha: number;
}

/**
 * Celestial body backdrop visual definition
 */
export interface CelestialBackdropConfig {
  readonly name: string;
  readonly radius: number;
  readonly xPercent: number;
  readonly yPercent: number;
  readonly color: number;
  readonly glowColor: number;
  readonly hasRings?: boolean;
  readonly surfaceDetail?: 'STRIPED_JOVIAN' | 'RINGED_SATURN' | 'BLUE_MARBLE_EARTH' | 'SOLAR_CORONA';
}

/**
 * Parallax mountain silhouette layer configuration
 */
export interface ParallaxMountainConfig {
  readonly peakColor: number;
  readonly baseColor: number;
  readonly height: number;
  readonly ruggedness: number;
  readonly frequency: number;
}

/**
 * Multi-layer parallax background layer specification
 */
export interface BackgroundLayerConfig {
  readonly id: string;
  readonly name: string;
  readonly parallaxFactorX: number;
  readonly parallaxFactorY: number;
  readonly type: 'SPACE_STARS' | 'CELESTIAL_BODY' | 'DISTANT_MOUNTAINS' | 'MIDGROUND_HILLS' | 'ATMOSPHERIC_GRADIENT';
  readonly tint: number;
  readonly alpha: number;
  readonly celestialBodyDetails?: CelestialBackdropConfig;
  readonly mountainParams?: ParallaxMountainConfig;
}

/**
 * Directional solar and ambient lighting configuration
 */
export interface EnvironmentLightingConfig {
  /** Ambient fill light color */
  readonly ambientColor: number;
  /** Ambient fill intensity (0.0 to 1.0) */
  readonly ambientIntensity: number;
  /** Primary solar directional light color */
  readonly sunColor: number;
  /** Solar light intensity (0.0 to 2.0) */
  readonly sunIntensity: number;
  /** Sun directional angle in radians */
  readonly sunAngleRadians: number;
  /** Cast shadow length multiplier */
  readonly shadowLengthMultiplier: number;
  /** Shadow edge softness (0.0 to 1.0) */
  readonly shadowSoftness: number;
  /** Secondary celestial body bounce light color */
  readonly celestialBounceColor?: number;
  /** Celestial bounce intensity */
  readonly celestialBounceIntensity?: number;
  /** Whether the environment simulates diurnal solar cycles */
  readonly dayNightCycleSupported: boolean;
  /** Optional cycle duration in seconds */
  readonly cycleDurationSeconds?: number;
}

/**
 * Atmospheric optical depth and haze configuration
 */
export interface AtmosphericEffectsConfig {
  /** Whether the destination possesses a discernible atmosphere */
  readonly hasAtmosphere: boolean;
  /** Primary haze and Rayleigh scattering tint */
  readonly hazeColor: number;
  /** Atmospheric haze density (0.0 to 1.0) */
  readonly hazeDensity: number;
  /** Optical depth and light extinction factor */
  readonly opticalDepth: number;
  /** Surface pressure in atmospheres (atm) */
  readonly atmosphericPressureAtm: number;
  /** Vertical height of horizon atmospheric fog */
  readonly horizonFogHeight: number;
  /** Sky gradient apex color */
  readonly skyGradientTop: number;
  /** Sky gradient horizon color */
  readonly skyGradientBottom: number;
  /** Whether thermal refraction / heat waves are active */
  readonly heatDistortion: boolean;
  /** Whether active dust storms or obscuring winds are blowing */
  readonly dustStormActive: boolean;
}

/**
 * Weather and particle simulation configuration
 */
export interface WeatherEffectConfig {
  /** Primary weather visual type */
  readonly type: WeatherEffectType;
  /** Effect intensity (0.0 to 1.0) */
  readonly intensity: number;
  /** Particle tint */
  readonly particleColor: number;
  /** Maximum active particle pool capacity */
  readonly particleCountMax: number;
  /** Minimum particle drift velocity */
  readonly particleSpeedMin: number;
  /** Maximum particle drift velocity */
  readonly particleSpeedMax: number;
  /** Dominant wind direction in radians */
  readonly windAngleRadians: number;
  /** Periodic geyser / eruption burst interval in seconds */
  readonly periodicPulseSeconds?: number;
}

/**
 * Player and vehicle spawn / arrival locations
 */
export interface SpawnLocation {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly x: number;
  readonly y: number;
  readonly isDefault: boolean;
  readonly isSafe: boolean;
  readonly landingDifficulty: number;
  readonly tag: string;
}

/**
 * Exploration point of interest for future mission and scientific gameplay
 */
export interface PointOfInterest {
  readonly id: string;
  readonly destinationId: string;
  readonly type: PointOfInterestType;
  readonly name: string;
  readonly description: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly radius: number;
  discoveryStatus: POIDiscoveryStatus;
  readonly scienceReward: number;
  readonly accessibleBy: EntityAccessType;
  readonly hazardRating: number;
  readonly metadata: Record<string, any>;
}

/**
 * World exploration bounds and perimeter warnings
 */
export interface ExplorationBoundaries {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly hazardWarningDistance: number;
  readonly hardBoundary: boolean;
}

/**
 * Camera and visual entry transition settings
 */
export interface EnvironmentTransitionConfig {
  readonly entryType: 'ORBITAL_INSERTION' | 'ATMOSPHERIC_ENTRY' | 'SURFACE_TOUCHDOWN' | 'PROBE_DEPLOYMENT';
  readonly transitionDurationSeconds: number;
  readonly initialCameraZoom: number;
  readonly targetCameraZoom: number;
  readonly fadeColor: number;
}

/**
 * Complete, authoritative data-driven planetary environment definition
 */
export interface PlanetaryEnvironmentDefinition {
  readonly id: string;
  readonly destinationId: DestinationId | string;
  readonly destinationName: string;
  readonly classification: EnvironmentalClassification | string;
  readonly presentationMode: EnvironmentPresentationMode;
  readonly isWalkableSurface: boolean;
  readonly difficultyRatings: EnvironmentalDifficultyRatings;
  readonly terrainConfig: TerrainConfiguration;
  readonly surfaceVisuals: SurfaceVisualProperties;
  readonly backgroundLayers: readonly BackgroundLayerConfig[];
  readonly lightingConfig: EnvironmentLightingConfig;
  readonly atmosphericEffects: AtmosphericEffectsConfig;
  readonly weatherConfig: WeatherEffectConfig;
  readonly boundaries: ExplorationBoundaries;
  readonly spawnLocations: readonly SpawnLocation[];
  readonly pointsOfInterest: readonly PointOfInterest[];
  readonly transition: EnvironmentTransitionConfig;
}

/**
 * Single vertex of procedural terrain geometry
 */
export interface TerrainVertex {
  readonly x: number;
  readonly y: number;
  readonly normalX: number;
  readonly normalY: number;
  readonly isCrater: boolean;
  readonly craterId?: string;
}

/**
 * Procedural or authored impact crater
 */
export interface TerrainCrater {
  readonly id: string;
  readonly centerX: number;
  readonly radius: number;
  readonly depth: number;
  readonly rimHeight: number;
}

/**
 * Surface rock or boulder geometry
 */
export interface TerrainRock {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly vertices: readonly { readonly x: number; readonly y: number }[];
  readonly color: number;
}

/**
 * Environmental landmark or regional feature
 */
export interface TerrainFeature {
  readonly id: string;
  readonly type: TerrainFeatureType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly properties: Record<string, any>;
}

/**
 * Result data generated by the terrain synthesis engine
 */
export interface GeneratedTerrainData {
  readonly destinationId: string;
  readonly seed: number;
  readonly vertices: readonly TerrainVertex[];
  readonly craters: readonly TerrainCrater[];
  readonly rocks: readonly TerrainRock[];
  readonly features: readonly TerrainFeature[];
  readonly elevationBounds: {
    readonly minY: number;
    readonly maxY: number;
    readonly avgY: number;
  };
}

/**
 * Runtime telemetry and status of the active planetary environment
 */
export interface PlanetaryEnvironmentStatus {
  readonly isLoaded: boolean;
  readonly currentDestinationId?: string;
  readonly currentEnvironmentName?: string;
  readonly presentationMode?: EnvironmentPresentationMode;
  readonly isWalkableSurface: boolean;
  readonly quality: EnvironmentQualityLevel;
  readonly activeParticlesCount: number;
  readonly discoveredPOIsCount: number;
  readonly totalPOIsCount: number;
  readonly worldDimensions: {
    readonly width: number;
    readonly height: number;
  };
  readonly cameraPosition: {
    readonly x: number;
    readonly y: number;
  };
}

/**
 * Options supplied to loadEnvironment(...)
 */
export interface EnvironmentLoadOptions {
  /** Optional deterministic seed overriding default profile */
  readonly seedOverride?: number;
  /** Specific spawn location identifier */
  readonly spawnLocationId?: string;
  /** Quality preset override */
  readonly qualityOverride?: EnvironmentQualityLevel;
  /** Whether to bypass camera intro transition */
  readonly skipTransition?: boolean;
}
