/**
 * INTERSTELLAR CONTINUUM - Default Authored Planetary Relays
 * Planetary surface and orbital relays supporting deep-space and surface operations.
 */

import {
  PlanetaryRelayRecord,
  RelayLocationType,
  RelayOperationalState,
} from '../NetworkTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export const DEFAULT_RELAYS: PlanetaryRelayRecord[] = [
  {
    id: 'RELAY_LUNAR_SOUTH_POLE',
    name: 'Shackleton Crater Surface Array',
    deploymentLocation: DestinationId.MOON,
    locationType: RelayLocationType.SURFACE,
    operationalState: RelayOperationalState.OPERATIONAL,
    networkContribution: {
      localSurfaceBonus: 40,
      rangeMultiplier: 1.25,
      linkRating: 150,
    },
    upgradeLevel: 1,
    maxUpgradeLevel: 4,
    upgradeOptions: [
      {
        upgradeId: 'OPT_SOLAR_TRACKER',
        name: 'Continuous Sun-Tracking Mast',
        costCredits: 12000,
        description: 'Elevates microwave tranceiver above crater rim for 90% direct sunlight illumination.',
        coverageBonus: 15,
        applied: false,
      },
      {
        upgradeId: 'OPT_LASER_TRANSCEIVER',
        name: 'Optical Deep Space Transceiver',
        costCredits: 28000,
        description: 'High-throughput laser downlink to Earth DSN stations.',
        coverageBonus: 25,
        applied: false,
      },
    ],
    maintenanceCost: 300,
    lastServicedTimestamp: Date.now(),
    conditionRating: 100,
  },
  {
    id: 'RELAY_MARS_JEZERO',
    name: 'Jezero Surface Terminal',
    deploymentLocation: DestinationId.MARS,
    locationType: RelayLocationType.SURFACE,
    operationalState: RelayOperationalState.OPERATIONAL,
    networkContribution: {
      localSurfaceBonus: 45,
      rangeMultiplier: 1.35,
      linkRating: 200,
    },
    upgradeLevel: 1,
    maxUpgradeLevel: 4,
    upgradeOptions: [
      {
        upgradeId: 'OPT_MARS_HIGH_GAIN',
        name: 'High-Gain Cassegrain Dish 5M',
        costCredits: 35000,
        description: 'Improves uplink margin through Martian dust storms.',
        coverageBonus: 20,
        applied: false,
      },
    ],
    maintenanceCost: 450,
    lastServicedTimestamp: Date.now(),
    conditionRating: 95,
  },
  {
    id: 'RELAY_EUROPA_ORBIT',
    name: 'Jovian Radiation-Hardened Relay',
    deploymentLocation: DestinationId.EUROPA,
    locationType: RelayLocationType.ORBITAL,
    operationalState: RelayOperationalState.MAINTENANCE_REQUIRED,
    networkContribution: {
      localSurfaceBonus: 30,
      rangeMultiplier: 1.5,
      linkRating: 250,
    },
    upgradeLevel: 1,
    maxUpgradeLevel: 3,
    upgradeOptions: [],
    maintenanceCost: 800,
    lastServicedTimestamp: Date.now() - 86400000,
    conditionRating: 72,
  },
];

