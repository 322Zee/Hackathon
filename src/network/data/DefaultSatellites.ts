/**
 * INTERSTELLAR CONTINUUM - Default Authored Communication Satellites
 * Initial orbital assets, relay constellations, and unlockable communications satellites.
 */

import { SatelliteRecord, SatelliteType, SatelliteStatus } from '../NetworkTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export const DEFAULT_SATELLITES: SatelliteRecord[] = [
  {
    id: 'SAT_LEO_RELAY_ALPHA',
    name: 'Astra-Link Relay Alpha',
    satelliteType: SatelliteType.LEO_RELAY,
    status: SatelliteStatus.ACTIVE,
    networkContribution: {
      coverageBonus: 20,
      bandwidthBonus: 50,
      latencyReduction: 0.15,
      signalStrengthBonus: 15,
    },
    destinationId: DestinationId.EARTH_ORBIT_LEO,
    upgradeLevel: 1,
    maxUpgradeLevel: 3,
    operationalCost: 120,
    powerStatus: 100,
    constellationId: 'CONST_LEO_RING',
    orbitalAltitudeKm: 550,
  },
  {
    id: 'SAT_LEO_RELAY_BETA',
    name: 'Astra-Link Relay Beta',
    satelliteType: SatelliteType.LEO_RELAY,
    status: SatelliteStatus.ACTIVE,
    networkContribution: {
      coverageBonus: 20,
      bandwidthBonus: 50,
      latencyReduction: 0.15,
      signalStrengthBonus: 15,
    },
    destinationId: DestinationId.EARTH_ORBIT_LEO,
    upgradeLevel: 1,
    maxUpgradeLevel: 3,
    operationalCost: 120,
    powerStatus: 100,
    constellationId: 'CONST_LEO_RING',
    orbitalAltitudeKm: 550,
  },
  {
    id: 'SAT_GEO_COMMSAT_01',
    name: 'TerraSync GEO CommSat East',
    satelliteType: SatelliteType.GEO_STATIONARY,
    status: SatelliteStatus.ACTIVE,
    networkContribution: {
      coverageBonus: 35,
      bandwidthBonus: 120,
      latencyReduction: 0.25,
      signalStrengthBonus: 25,
    },
    destinationId: DestinationId.EARTH_ORBIT_GEO,
    upgradeLevel: 1,
    maxUpgradeLevel: 4,
    operationalCost: 280,
    powerStatus: 98,
    constellationId: 'CONST_GEO_HIGHWAY',
    orbitalAltitudeKm: 35786,
  },
  {
    id: 'SAT_LUNAR_RELAY_01',
    name: 'SeleneCom Lunar Polar Orbiter',
    satelliteType: SatelliteType.LUNAR_ORBITER,
    status: SatelliteStatus.STANDBY,
    networkContribution: {
      coverageBonus: 40,
      bandwidthBonus: 80,
      latencyReduction: 0.2,
      signalStrengthBonus: 20,
    },
    destinationId: DestinationId.MOON,
    upgradeLevel: 1,
    maxUpgradeLevel: 4,
    operationalCost: 350,
    powerStatus: 95,
    constellationId: 'CONST_LUNAR_NET',
    orbitalAltitudeKm: 200,
  },
  {
    id: 'SAT_AREO_ORBITER_01',
    name: 'AreoComm Deep Relay Carrier',
    satelliteType: SatelliteType.INTERPLANETARY_CARRIER,
    status: SatelliteStatus.STANDBY,
    networkContribution: {
      coverageBonus: 45,
      bandwidthBonus: 150,
      latencyReduction: 0.3,
      signalStrengthBonus: 30,
    },
    destinationId: DestinationId.MARS,
    upgradeLevel: 1,
    maxUpgradeLevel: 5,
    operationalCost: 600,
    powerStatus: 92,
    constellationId: 'CONST_MARS_NET',
    orbitalAltitudeKm: 17000,
  },
];

