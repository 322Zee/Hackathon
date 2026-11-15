/**
 * INTERSTELLAR CONTINUUM - Solar System & Destination Data Contracts
 * Strongly typed definitions for celestial bodies, moons, orbital regions,
 * physical metrics, environmental classifications, surface availability,
 * exploration methods, communication profiles, and progression unlocks.
 */

export enum DestinationId {
  // Central Star
  SUN = 'DEST_SUN',

  // Terrestrial / Inner Planets
  MERCURY = 'DEST_MERCURY',
  VENUS = 'DEST_VENUS',
  EARTH = 'DEST_EARTH',
  MARS = 'DEST_MARS',

  // Small Bodies & Belts
  ASTEROID_BELT = 'DEST_ASTEROID_BELT',
  CERES = 'DEST_CERES',
  VESTA = 'DEST_VESTA',

  // Jovian / Outer Gas Giants
  JUPITER = 'DEST_JUPITER',
  SATURN = 'DEST_SATURN',

  // Ice Giants
  URANUS = 'DEST_URANUS',
  NEPTUNE = 'DEST_NEPTUNE',

  // Key Destination Moons
  MOON = 'DEST_MOON', // Earth
  PHOBOS = 'DEST_PHOBOS', // Mars
  DEIMOS = 'DEST_DEIMOS', // Mars
  IO = 'DEST_IO', // Jupiter
  EUROPA = 'DEST_EUROPA', // Jupiter
  GANYMEDE = 'DEST_GANYMEDE', // Jupiter
  CALLISTO = 'DEST_CALLISTO', // Jupiter
  TITAN = 'DEST_TITAN', // Saturn
  ENCELADUS = 'DEST_ENCELADUS', // Saturn
  TITANIA = 'DEST_TITANIA', // Uranus
  TRITON = 'DEST_TRITON', // Neptune

  // Earth Orbital Regions (Sub-Destinations)
  EARTH_ORBIT_LEO = 'DEST_EARTH_LEO',
  EARTH_ORBIT_MEO = 'DEST_EARTH_MEO',
  EARTH_ORBIT_GEO = 'DEST_EARTH_GEO',
  EARTH_ORBIT_HEO = 'DEST_EARTH_HEO',

  // Optional / Future Extensible Destinations
  PLUTO = 'DEST_PLUTO',
  COMET_67P = 'DEST_COMET_67P',
}

export enum DestinationCategory {
  STAR = 'STAR',
  ROCKY_PLANET = 'ROCKY_PLANET',
  NATURAL_SATELLITE = 'NATURAL_SATELLITE',
  GAS_GIANT = 'GAS_GIANT',
  ICE_GIANT = 'ICE_GIANT',
  ASTEROID_BELT = 'ASTEROID_BELT',
  DWARF_PLANET = 'DWARF_PLANET',
  ORBITAL_REGION = 'ORBITAL_REGION',
  COMET = 'COMET',
}

/**
 * 10 Canonical Reusable Environmental Classifications
 */
export enum EnvironmentalClassification {
  EARTH_TERRESTRIAL = 'EARTH_TERRESTRIAL',
  AIRLESS_ROCKY = 'AIRLESS_ROCKY',
  ROCKY_HOSTILE_ATMOSPHERE = 'ROCKY_HOSTILE_ATMOSPHERE',
  EXTREME_TEMP_ROCKY = 'EXTREME_TEMP_ROCKY',
  ICY_MOON = 'ICY_MOON',
  OCEAN_WORLD = 'OCEAN_WORLD',
  GAS_GIANT_ATMOSPHERE = 'GAS_GIANT_ATMOSPHERE',
  ICE_GIANT_ATMOSPHERE = 'ICE_GIANT_ATMOSPHERE',
  ASTEROID_SMALL_BODY = 'ASTEROID_SMALL_BODY',
  ORBITAL_SPACE = 'ORBITAL_SPACE',
  SOLAR_PLASMA = 'SOLAR_PLASMA',

  // Backward compatibility aliases
  SUPERCRITICAL_ATMOSPHERE = 'ROCKY_HOSTILE_ATMOSPHERE',
  TEMPERATE_TERRESTRIAL = 'EARTH_TERRESTRIAL',
  AIRLESS_ROCK = 'AIRLESS_ROCKY',
  COLD_DESERT = 'ROCKY_HOSTILE_ATMOSPHERE',
  MICROMETEOROID_HAZARD = 'ASTEROID_SMALL_BODY',
  MASSIVE_JOVIAN_RADIATION = 'GAS_GIANT_ATMOSPHERE',
  RING_SYSTEM_HAZARD = 'GAS_GIANT_ATMOSPHERE',
  CRYOGENIC_ICE = 'ICY_MOON',
  HYDROCARBON_ATMOSPHERE = 'ROCKY_HOSTILE_ATMOSPHERE',
  MICROGRAVITY_VACUUM = 'ORBITAL_SPACE',
  EARTH_UPPER_ATMOSPHERE = 'ORBITAL_SPACE',
  VAN_ALLEN_RADIATION = 'ORBITAL_SPACE',
  GEOSTATIONARY_REGIME = 'ORBITAL_SPACE',
  HIGHLY_ELLIPTICAL_REGIME = 'ORBITAL_SPACE',
}

/**
 * Clear Surface Availability & Environment Model
 */
export enum SurfaceAvailability {
  WALKABLE_SURFACE = 'WALKABLE_SURFACE',
  HAZARDOUS_SURFACE_SPECIALIZED_ONLY = 'HAZARDOUS_SURFACE_SPECIALIZED_ONLY',
  SMALL_BODY_MICROGRAVITY = 'SMALL_BODY_MICROGRAVITY',
  NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY = 'NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY',
}

export enum GravityClassification {
  MICROGRAVITY = 'MICROGRAVITY',
  VERY_LOW_GRAVITY = 'VERY_LOW_GRAVITY',
  LOW_GRAVITY = 'LOW_GRAVITY',
  EARTH_LIKE = 'EARTH_LIKE',
  HIGH_GRAVITY = 'HIGH_GRAVITY',
  EXTREME_GRAVITY = 'EXTREME_GRAVITY',
}

export enum TemperatureClassification {
  CRYOGENIC = 'CRYOGENIC',
  EXTREME_COLD = 'EXTREME_COLD',
  TEMPERATE = 'TEMPERATE',
  EXTREME_HEAT = 'EXTREME_HEAT',
  SUPERHEATED = 'SUPERHEATED',
}

export enum ExplorationMethod {
  ORBITAL_SURVEY = 'ORBITAL_SURVEY',
  ATMOSPHERIC_PROBE = 'ATMOSPHERIC_PROBE',
  ROBOTIC_LANDER = 'ROBOTIC_LANDER',
  SURFACE_ROVER = 'SURFACE_ROVER',
  CREWED_SURFACE_EXPEDITION = 'CREWED_SURFACE_EXPEDITION',
  SURFACE_SAMPLE_RETURN = 'SURFACE_SAMPLE_RETURN',
  OUTPOST_CONSTRUCTION = 'OUTPOST_CONSTRUCTION',
  DEEP_CORE_DRILLING = 'DEEP_CORE_DRILLING',
  SUBMERSIBLE_OCEAN_PROBE = 'SUBMERSIBLE_OCEAN_PROBE',
  RESOURCE_EXTRACTION = 'RESOURCE_EXTRACTION',
}

export enum DestinationUnlockState {
  LOCKED = 'LOCKED',
  DISCOVERED = 'DISCOVERED',
  AVAILABLE = 'AVAILABLE',
  UNDER_EXPLORATION = 'UNDER_EXPLORATION',
  FULLY_EXPLORED = 'FULLY_EXPLORED',
  // Backward compatibility alias:
  UNLOCKED = 'UNLOCKED',
  RESTRICTED = 'RESTRICTED',
}

export enum DiscoveryStatus {
  UNDISCOVERED = 'UNDISCOVERED',
  DETECTED = 'DETECTED',
  SURVEYED = 'SURVEYED',
  MAPPED = 'MAPPED',
}

export enum ExplorationStatus {
  UNVISITED = 'UNVISITED',
  ORBITAL_PRESENCE = 'ORBITAL_PRESENCE',
  SURFACE_LANDED = 'SURFACE_LANDED',
  ACTIVE_OUTPOST = 'ACTIVE_OUTPOST',
  FULLY_EXPLORED = 'FULLY_EXPLORED',
}

export enum UnlockConditionType {
  REQUIRED_RANK = 'REQUIRED_RANK',
  COMPLETED_MISSION = 'COMPLETED_MISSION',
  REQUIRED_TECH = 'REQUIRED_TECH',
  REQUIRED_RESEARCH_POINTS = 'REQUIRED_RESEARCH_POINTS',
  COMPLETED_MILESTONE = 'COMPLETED_MILESTONE',
  PREREQUISITE_DESTINATION_SURVEYED = 'PREREQUISITE_DESTINATION_SURVEYED',
}

export interface UnlockCondition {
  type: UnlockConditionType;
  targetId?: string;
  targetValue: number | string;
  description: string;
}

export interface UnlockRequirementStatus {
  condition: UnlockCondition;
  description: string;
  isMet: boolean;
  currentValue: string | number;
  requiredValue: string | number;
  progressPercent: number; // 0 to 100
}

export interface DestinationProgressionStatus {
  destinationId: DestinationId;
  isUnlocked: boolean;
  unlockState: DestinationUnlockState;
  discoveryStatus: DiscoveryStatus;
  explorationStatus: ExplorationStatus;
  requirements: UnlockRequirementStatus[];
  overallProgressPercent: number;
  nextMilestoneSummary: string;
}

export interface CommunicationCharacteristics {
  oneWayLatencySeconds: number;
  relayRequirement: 'DIRECT_LINE_OF_SIGHT' | 'EARTH_GROUND_STATION' | 'ORBITAL_RELAY_CONSTELLATION' | 'DEEP_SPACE_NETWORK_ARRAY';
  blackoutRisks: string[];
}

export interface AtmosphericCharacteristics {
  surfacePressureAtm: number;
  densityClassification: 'VACUUM' | 'TRACE_EXOSPHERE' | 'THIN' | 'STANDARD' | 'DENSE_CRUSHING' | 'GAS_ENVELOPE';
  compositionSummary: string;
  hazards: string[];
}

export interface SurfaceAccessEvaluation {
  allowed: boolean;
  surfaceAvailability: SurfaceAvailability;
  requiresSpecializedEquipment: boolean;
  equipmentNeeded: string[];
  maxOperatingHours?: number;
  rejectionReason?: string;
}

export enum EnvironmentLoadType {
  HEADQUARTERS_CAMPUS = 'HEADQUARTERS_CAMPUS',
  ORBITAL_SPACE = 'ORBITAL_SPACE',
  PLANETARY_SURFACE = 'PLANETARY_SURFACE',
  ATMOSPHERIC_DESCENT = 'ATMOSPHERIC_DESCENT',
  ASTEROID_SURFACE = 'ASTEROID_SURFACE',
  LUNAR_SURFACE = 'LUNAR_SURFACE',
}

export interface EnvironmentLoadConfig {
  destinationId: DestinationId;
  environmentType: EnvironmentLoadType;
  surfaceAvailability: SurfaceAvailability;
  canDeployRover: boolean;
  canDeployCrew: boolean;
  requiresSpecializedEquipment: boolean;
  equipmentNeeded: string[];
  gravityG: number;
  atmosphereDensity: number;
  surfacePressureAtm: number;
  safeSpawnAltitudeKm: number;
  skyboxKey: string;
}

export interface DestinationGameplayConfig {
  ambientIlluminationPercent: number;
  solarFluxWm2: number;
  dustStormRiskPercent: number;
  radiationDamageRate: number;
  scientificDiscoveryMultiplier: number;
}

export interface PhysicalMetrics {
  semiMajorAxisAu?: number;
  altitudeKmMin?: number;
  altitudeKmMax?: number;
  orbitalPeriodDays?: number;
  surfaceGravityG?: number;
  meanTemperatureC?: number;
  atmosphereComposition?: string;
  radiationLevel?: 'NEGLIGIBLE' | 'LOW' | 'MODERATE' | 'SEVERE' | 'LETHAL';
  escapeVelocityKps?: number;
}

export interface DestinationRecord {
  id: DestinationId;
  name: string;
  subtitle: string;
  shortCode: string;
  parentId?: DestinationId;
  category: DestinationCategory;
  environment: EnvironmentalClassification;
  surfaceAvailability: SurfaceAvailability;
  gravityClassification: GravityClassification;
  temperatureClassification: TemperatureClassification;
  supportedExplorationMethods: ExplorationMethod[];
  availableMissionCategories: string[];
  communication: CommunicationCharacteristics;
  atmosphericDetails?: AtmosphericCharacteristics;
  gameplayConfig: DestinationGameplayConfig;
  color: number;
  accentColor: number;
  radiusPixels: number;
  orbitRadiusPixels: number;
  orbitSpeed: number; // rad/s schematic orbit animation rate
  initialAngle: number;
  scientificDescription: string;
  physicalCharacteristics: PhysicalMetrics;
  defaultUnlockState: DestinationUnlockState;
  discoveryStatus: DiscoveryStatus;
  explorationStatus: ExplorationStatus;
  requiredDirectorRank: number;
  requiredRankTitle: string;
  unlockConditions: UnlockCondition[];
  unlockRequirementsText: string;
  availableMissionsCount: number;
  completedMissionsCount: number;
  hasSubDestinations: boolean;
  subDestinationIds?: DestinationId[];
  visualAssetKey?: string;
}

export type DestinationRecordMap = Record<string, DestinationRecord>;
