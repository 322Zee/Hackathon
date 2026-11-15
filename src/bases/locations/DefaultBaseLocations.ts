/**
 * INTERSTELLAR CONTINUUM - Default Planetary Base Locations
 * Authored candidate deployment sites across eligible Solar System bodies.
 */

import { DestinationId } from '../../destinations/DestinationTypes';
import { BaseLocationCandidate } from '../BaseTypes';

export const DEFAULT_BASE_LOCATIONS: BaseLocationCandidate[] = [
  // =========================================================================
  // THE MOON (DEST_MOON)
  // =========================================================================
  {
    id: 'loc_moon_shackleton',
    destinationId: DestinationId.MOON,
    name: 'Shackleton Crater Rim',
    description: 'Lunar South Pole rim featuring 86% annual sunlight along the Peak of Eternal Light and shadowed water-ice traps.',
    coordinates: { latitude: -89.9, longitude: 0.0 },
    terrainType: 'CRATER_RIM',
    suitabilityScore: 95,
    hazardRating: 'LOW',
    solarExposurePercent: 90,
    dustHazardFactor: 0.35,
    radiationProtectionFactor: 0.40,
    resourceAbundance: { rawMinerals: 70, waterIce: 95, volatiles: 65 },
    recommendedFor: 'Primary lunar research, permanent propellant synthesis, and optical deep-space relay.',
  },
  {
    id: 'loc_moon_oceanus_procellarum',
    destinationId: DestinationId.MOON,
    name: 'Oceanus Procellarum Lowlands',
    description: 'Vast flat mare basalt plain providing expansive hazard-free construction area and abundant ilmenite deposits.',
    coordinates: { latitude: 18.4, longitude: -57.4 },
    terrainType: 'FLAT_BASIN',
    suitabilityScore: 88,
    hazardRating: 'LOW',
    solarExposurePercent: 50, // Standard 14-day lunar day/night
    dustHazardFactor: 0.50,
    radiationProtectionFactor: 0.20,
    resourceAbundance: { rawMinerals: 90, waterIce: 15, volatiles: 30 },
    recommendedFor: 'Large-scale manufacturing facilities and regolith refining operations.',
  },

  // =========================================================================
  // MARS (DEST_MARS)
  // =========================================================================
  {
    id: 'loc_mars_jezero',
    destinationId: DestinationId.MARS,
    name: 'Jezero Crater Paleolake',
    description: 'Ancient river delta rich in smectite clays, carbonates, and ancient sedimentary stratigraphy.',
    coordinates: { latitude: 18.38, longitude: 77.58 },
    terrainType: 'FLAT_BASIN',
    suitabilityScore: 92,
    hazardRating: 'MODERATE',
    solarExposurePercent: 75,
    dustHazardFactor: 0.65,
    radiationProtectionFactor: 0.35,
    resourceAbundance: { rawMinerals: 85, waterIce: 60, volatiles: 75 },
    recommendedFor: 'Astrobiology research station, atmospheric CO2 conversion, and sample analysis.',
  },
  {
    id: 'loc_mars_valles_marineris',
    destinationId: DestinationId.MARS,
    name: 'Valles Marineris Chasm',
    description: 'Deep canyon floor offering natural atmospheric shielding, geothermal gradients, and wind protection.',
    coordinates: { latitude: -13.9, longitude: -59.2 },
    terrainType: 'LAVA_TUBE',
    suitabilityScore: 86,
    hazardRating: 'MODERATE',
    solarExposurePercent: 60,
    dustHazardFactor: 0.40,
    radiationProtectionFactor: 0.70,
    resourceAbundance: { rawMinerals: 90, waterIce: 50, volatiles: 60 },
    recommendedFor: 'Subterranean habitats and sheltered heavy manufacturing.',
  },

  // =========================================================================
  // EUROPA (DEST_EUROPA)
  // =========================================================================
  {
    id: 'loc_europa_conamara',
    destinationId: DestinationId.EUROPA,
    name: 'Conamara Chaos Rafts',
    description: 'Fractured ice plate matrix where tectonic shifting brings deep oceanic slush within reachable drilling depth.',
    coordinates: { latitude: 9.7, longitude: 272.7 },
    terrainType: 'CHAOS_TERRAIN',
    suitabilityScore: 78,
    hazardRating: 'HIGH',
    solarExposurePercent: 15, // Low solar flux in outer solar system
    dustHazardFactor: 0.10,
    radiationProtectionFactor: 0.15, // Severe Jovian radiation
    resourceAbundance: { rawMinerals: 40, waterIce: 100, volatiles: 85 },
    recommendedFor: 'Oceanic exploration, cryo-drilling, and astrobiological research.',
  },

  // =========================================================================
  // TITAN (DEST_TITAN)
  // =========================================================================
  {
    id: 'loc_titan_kraken_coast',
    destinationId: DestinationId.TITAN,
    name: 'Kraken Mare Shoreline',
    description: 'Liquid methane coastline beneath a dense nitrogen atmosphere. Offers rich organic hydrocarbon reserves.',
    coordinates: { latitude: 68.0, longitude: 310.0 },
    terrainType: 'SHORELINE_COAST',
    suitabilityScore: 82,
    hazardRating: 'HIGH',
    solarExposurePercent: 5,
    dustHazardFactor: 0.05,
    radiationProtectionFactor: 0.95, // Dense atmosphere blocks cosmic rays
    resourceAbundance: { rawMinerals: 30, waterIce: 80, volatiles: 100 },
    recommendedFor: 'Liquid propellant manufacturing and complex prebiotic chemistry research.',
  },

  // =========================================================================
  // CERES (DEST_CERES)
  // =========================================================================
  {
    id: 'loc_ceres_occator',
    destinationId: DestinationId.CERES,
    name: 'Occator Crater Faculae',
    description: 'Impact crater exhibiting bright sodium carbonate deposits and intermittent water vapor outgassing.',
    coordinates: { latitude: 19.82, longitude: 239.33 },
    terrainType: 'CRATER_RIM',
    suitabilityScore: 84,
    hazardRating: 'LOW',
    solarExposurePercent: 40,
    dustHazardFactor: 0.20,
    radiationProtectionFactor: 0.25,
    resourceAbundance: { rawMinerals: 75, waterIce: 85, volatiles: 70 },
    recommendedFor: 'Asteroid belt logistics hub and resource processing facility.',
  },
];
