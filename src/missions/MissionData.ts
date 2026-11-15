/**
 * INTERSTELLAR CONTINUUM - Authoritative Master Mission Catalogue Dataset
 * 35 authored mission definitions covering Transportation, Scientific Exploration,
 * and Combined missions across the entire Solar System progression hierarchy.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import {
  MissionDefinition,
  MissionCategory,
  MissionDifficulty,
  MissionStageType,
  SpacecraftType,
  PayloadType,
  ScientificInstrument,
  ObjectiveType,
} from './MissionTypes';

export const INITIAL_MISSION_DEFINITIONS: MissionDefinition[] = [
  // =========================================================================
  // 1. EARTH & LOW EARTH ORBIT (LEO) MISSIONS
  // =========================================================================
  {
    id: 'EARTH_LEO_DEPLOYMENT_01',
    name: 'Project Pioneer: First Orbital Satellite',
    shortCode: 'MSN-EARTH-01',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deploy the agency’s first telemetry relay satellite into Low Earth Orbit.',
    description:
      'The Astra Continuum Project requires a dedicated communications relay in Low Earth Orbit to support future launch trajectories and spacecraft tracking. Construct a launch vehicle capable of injecting the Pioneer-1 satellite into a stable circular orbit between 160 km and 400 km.',
    destinationId: DestinationId.EARTH_ORBIT_LEO,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 1,
    stageType: MissionStageType.DEPLOYMENT,
    difficulty: MissionDifficulty.EASY,
    scientificPurpose:
      'Validate launch vehicle stage separation, orbital insertion telemetry, and real-time radio downlink with the Earth ground station network.',
    mainObjectives: [
      {
        id: 'obj_pioneer_orbit',
        title: 'Inject into Low Earth Orbit',
        description: 'Achieve stable orbit with perigee >= 160 km and apogee <= 400 km.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 200,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_pioneer_deploy',
        title: 'Release Pioneer-1 Satellite',
        description: 'Separate payload cleanly from upper stage without collision.',
        type: ObjectiveType.DELIVERY,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_pioneer_telemetry',
        title: 'Establish Telemetry Downlink',
        description: 'Verify two-way beacon communication with Mission Operations Centre.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 100,
        isCompleted: false,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_opt_eccentricity',
        title: 'High Orbital Precision',
        description: 'Achieve orbital eccentricity under 0.005.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 1,
      requiredMissionIds: [],
      requiredTechNodeIds: ['tech_basic_rocketry'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SATELLITE_BUS,
      payloadType: PayloadType.COMMUNICATION_RELAY,
      requiredInstruments: [ScientificInstrument.RADIO_SCIENCE_TRANSPONDER],
      minPayloadMassKg: 25,
      maxPayloadMassKg: 100,
      minPowerWatts: 45,
      minBatteryCapacityWh: 100,
      communicationBandwidthKbps: 128,
      relayRequired: false,
      targetOrbit: {
        altitudeKmMin: 160,
        altitudeKmMax: 400,
        inclinationDeg: 28.5,
        eccentricityMax: 0.02,
      },
    },
    budget: {
      allocatedCredits: 150000,
      launchCostCapCredits: 120000,
    },
    estimatedDurationDays: 1,
    rewards: {
      credits: 80000,
      researchData: 35,
      rawMaterials: 20,
      technologyPoints: 10,
      agencyPrestige: 100,
    },
    failureConditions: [
      'Ascent vehicle structural destruction or stage failure.',
      'Perigee below 120 km resulting in rapid atmospheric decay.',
      'Loss of telemetry communication exceeding 180 seconds.',
    ],
    completionConditions: [
      'Stable orbit confirmed for minimum 2 complete orbital revolutions.',
      '100% of telemetry verification packets received at MOC.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Orbital Velocity & Freefall Trajectory',
      explanation:
        'To stay in orbit, a spacecraft must travel sideways fast enough (~7.8 km/s in LEO) that as gravity pulls it down toward Earth, the planet’s surface curves away at the exact same rate. Orbiting is not flying without gravity—it is permanent freefall.',
      realWorldParallel: 'Sputnik 1 (1957) and Explorer 1 (1958) first orbital deployments.',
    },
  },

  {
    id: 'EARTH_ORBIT_OBSERVATION_01',
    name: 'Terra Vista: Global Multispectral Earth Survey',
    shortCode: 'MSN-EARTH-02',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Deploy an optical observation satellite to survey terrestrial weather and cloud formations.',
    description:
      'Following successful orbital insertion, the agency is commissioned to collect multispectral imagery of Earth’s weather systems and surface biomass. Deploy an earth-observation payload equipped with high-resolution visual and infrared imagers.',
    destinationId: DestinationId.EARTH_ORBIT_LEO,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 2,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.MEDIUM,
    scientificPurpose:
      'Calibrate spaceborne multispectral sensors and observe atmospheric moisture distributions across polar and equatorial weather cells.',
    mainObjectives: [
      {
        id: 'obj_terravista_orbit',
        title: 'Sun-Synchronous Orbit Insertion',
        description: 'Achieve circular orbit at 500 km with inclination 97.4°.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 500,
        isCompleted: false,
      },
      {
        id: 'obj_terravista_scan',
        title: 'Collect 100 Optical Survey Tiles',
        description: 'Acquire high-resolution land and meteorological imagery across 5 orbits.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 100,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_terravista_opt',
        title: 'Infrared Calibration',
        description: 'Downlink calibrated thermal infrared dataset with zero packet loss.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 1,
      requiredMissionIds: ['EARTH_LEO_DEPLOYMENT_01'],
      requiredTechNodeIds: ['tech_suborbital_telemetry'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.EARTH_OBSERVATION_SUITE,
      requiredInstruments: [
        ScientificInstrument.MULTISPECTRAL_IMAGER,
        ScientificInstrument.SYNTHETIC_APERTURE_RADAR,
      ],
      minPayloadMassKg: 120,
      maxPayloadMassKg: 350,
      minPowerWatts: 150,
      minBatteryCapacityWh: 300,
      communicationBandwidthKbps: 512,
      relayRequired: false,
      targetOrbit: {
        altitudeKmMin: 480,
        altitudeKmMax: 520,
        inclinationDeg: 97.4,
        eccentricityMax: 0.01,
      },
    },
    budget: {
      allocatedCredits: 220000,
      launchCostCapCredits: 175000,
    },
    estimatedDurationDays: 3,
    rewards: {
      credits: 110000,
      researchData: 60,
      rawMaterials: 30,
      technologyPoints: 15,
      agencyPrestige: 150,
    },
    failureConditions: [
      'Inadequate electrical power during 35-minute orbital eclipse.',
      'Sensor pointing error exceeding 2.0 degrees.',
    ],
    completionConditions: [
      '100 gigabits of raw Earth multispectral imagery successfully downlinked.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Sun-Synchronous Orbits & Remote Sensing Bands',
      explanation:
        'A Sun-synchronous orbit takes advantage of Earth’s equatorial bulge (nodal precession) to precess at the exact rate Earth orbits the Sun, ensuring the satellite passes over any given surface point at the exact same local solar mean time.',
      realWorldParallel: 'Landsat and Sentinel remote sensing constellations.',
    },
  },

  {
    id: 'EARTH_ORBIT_DELIVERY_01',
    name: 'Orbital Freight: CubeSat Dispenser Delivery',
    shortCode: 'MSN-EARTH-03',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deliver a 4-pod CubeSat deployer into Low Earth Orbit for commercial partners.',
    description:
      'Commercial aerospace partners require delivery of four research nanosatellites to a 350 km staging corridor. Launch a rideshare adapter carrying the deployer and eject all four pods with verified separation velocity.',
    destinationId: DestinationId.EARTH_ORBIT_LEO,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 2,
    stageType: MissionStageType.TRANSPORTATION,
    difficulty: MissionDifficulty.EASY,
    scientificPurpose:
      'Validate multi-payload rideshare dispensers and commercial orbital payload integration.',
    mainObjectives: [
      {
        id: 'obj_cubesat_orbit',
        title: 'Reach 350 km Orbit',
        description: 'Establish delivery trajectory at 350 km ±10 km.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 350,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_cubesat_deploy',
        title: 'Deploy All 4 CubeSats',
        description: 'Sequence deployment springs with 10-second intervals.',
        type: ObjectiveType.DELIVERY,
        targetValue: 4,
        isCompleted: false,
        isDeliveryObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 1,
      requiredMissionIds: ['EARTH_LEO_DEPLOYMENT_01'],
      requiredTechNodeIds: ['tech_basic_rocketry'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SATELLITE_BUS,
      payloadType: PayloadType.SURFACE_EQUIPMENT_CONTAINER,
      requiredInstruments: [ScientificInstrument.RADIO_SCIENCE_TRANSPONDER],
      minPayloadMassKg: 80,
      maxPayloadMassKg: 200,
      minPowerWatts: 80,
      minBatteryCapacityWh: 150,
      communicationBandwidthKbps: 256,
      relayRequired: false,
      targetOrbit: {
        altitudeKmMin: 340,
        altitudeKmMax: 360,
      },
    },
    budget: {
      allocatedCredits: 180000,
      launchCostCapCredits: 140000,
    },
    estimatedDurationDays: 1,
    rewards: {
      credits: 95000,
      researchData: 40,
      rawMaterials: 25,
      technologyPoints: 10,
      agencyPrestige: 120,
    },
    failureConditions: [
      'Dispenser jam or failure to release minimum 3 CubeSats.',
      'Premature upper stage passivation.',
    ],
    completionConditions: [
      'Separation confirmed for all 4 pods via telemetry confirmation.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Rideshare Adapters & SmallSat Dispensers',
      explanation:
        'Standardized form factors (such as 1U/3U CubeSats and P-POD dispensers) allow small scientific payloads to piggyback on primary launch vehicles, dramatically lowering the cost of orbital access.',
      realWorldParallel: 'Commercial small-satellite rideshare missions (e.g. Transporter missions).',
    },
  },

  {
    id: 'EARTH_MEO_COMM_TEST_01',
    name: 'Van Allen Transit: MEO Navigation Beacon',
    shortCode: 'MSN-EARTH-04',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deliver a radiation-shielded navigation beacon into Medium Earth Orbit.',
    description:
      'To build the agency’s long-range positioning network, a satellite must be delivered to a 20,200 km circular Medium Earth Orbit. The trajectory passes through the intense proton fluxes of the inner and outer Van Allen radiation belts.',
    destinationId: DestinationId.EARTH_ORBIT_MEO,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 3,
    stageType: MissionStageType.TRANSPORTATION,
    difficulty: MissionDifficulty.MEDIUM,
    scientificPurpose:
      'Measure trapped radiation belt energy spectra and demonstrate high-altitude atomic clock synchronization.',
    mainObjectives: [
      {
        id: 'obj_meo_orbit',
        title: 'Inject into 20,200 km Orbit',
        description: 'Circularize payload at 20,200 km with inclination 55°.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 20200,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_meo_signal',
        title: 'Broadcast Navigation Telemetry',
        description: 'Lock L-band signal on ground tracking dishes for 6 hours.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 360,
        isCompleted: false,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_meo_rad',
        title: 'Map Radiation Gradient',
        description: 'Acquire dosimeter readings during Van Allen crossing.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['EARTH_ORBIT_OBSERVATION_01'],
      requiredTechNodeIds: ['tech_radiation_hardened_avionics'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SATELLITE_BUS,
      payloadType: PayloadType.COMMUNICATION_RELAY,
      requiredInstruments: [
        ScientificInstrument.MAGNETOMETER,
        ScientificInstrument.GAMMA_RAY_SPECTROMETER,
      ],
      minPayloadMassKg: 350,
      maxPayloadMassKg: 900,
      minPowerWatts: 450,
      minBatteryCapacityWh: 800,
      communicationBandwidthKbps: 1024,
      relayRequired: false,
      targetOrbit: {
        altitudeKmMin: 20000,
        altitudeKmMax: 20400,
        inclinationDeg: 55,
      },
    },
    budget: {
      allocatedCredits: 380000,
      launchCostCapCredits: 300000,
    },
    estimatedDurationDays: 5,
    rewards: {
      credits: 190000,
      researchData: 110,
      rawMaterials: 60,
      technologyPoints: 30,
      agencyPrestige: 250,
    },
    failureConditions: [
      'Avionics single-event burnout during radiation belt transit.',
      'Apogee altitude below 19,000 km.',
    ],
    completionConditions: [
      'Stable 12-hour orbital period verified with synchronized carrier frequency.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Medium Earth Orbit & Satellite Navigation Constellations',
      explanation:
        'A 20,200 km altitude creates a 12-hour orbital period where satellites repeat ground tracks twice per day, providing the optimal geometric dilution of precision for global satellite positioning systems.',
      realWorldParallel: 'GPS (Navstar) and European Galileo navigation constellations.',
    },
  },

  {
    id: 'EARTH_GEO_RELAY_01',
    name: 'Continuum Zenith: Geostationary Telecom Station',
    shortCode: 'MSN-EARTH-05',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deliver a massive telecommunications relay into a 35,786 km geostationary orbital slot.',
    description:
      'Complete the Earth orbital architecture by placing a heavy high-bandwidth relay into Geostationary Orbit. At exactly 35,786 km above Earth’s equator, its orbital speed matches Earth’s 24-hour rotation, keeping it permanently locked above the Agency Headquarters.',
    destinationId: DestinationId.EARTH_ORBIT_GEO,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 4,
    stageType: MissionStageType.INFRASTRUCTURE_PREPARATION,
    difficulty: MissionDifficulty.HARD,
    scientificPurpose:
      'Establish permanent high-speed telemetry uplink with 99.999% availability for all upcoming deep-space planetary missions.',
    mainObjectives: [
      {
        id: 'obj_geo_apogee',
        title: 'Geostationary Transfer Insertion',
        description: 'Execute transfer burn raising apogee to 35,786 km.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 35786,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_geo_circ',
        title: 'Equatorial Circularization Burn',
        description: 'Fire apogee kick motor to reduce inclination to 0° and circularize.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 35786,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_geo_lock',
        title: 'Lock Ground Station Comms',
        description: 'Establish continuous X-band data pipeline with Earth HQ.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 1,
        isCompleted: false,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_geo_fuel',
        title: 'Propellant Reserve Conservation',
        description: 'Retain > 20% station-keeping propellant post-circularization.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['EARTH_MEO_COMM_TEST_01'],
      requiredTechNodeIds: ['tech_apogee_kick_motors'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SATELLITE_BUS,
      payloadType: PayloadType.COMMUNICATION_RELAY,
      requiredInstruments: [ScientificInstrument.RADIO_SCIENCE_TRANSPONDER],
      minPayloadMassKg: 1200,
      maxPayloadMassKg: 3000,
      minPowerWatts: 1200,
      minBatteryCapacityWh: 2500,
      communicationBandwidthKbps: 4096,
      relayRequired: false,
      targetOrbit: {
        altitudeKmMin: 35780,
        altitudeKmMax: 35792,
        inclinationDeg: 0.1,
        eccentricityMax: 0.001,
      },
    },
    budget: {
      allocatedCredits: 650000,
      launchCostCapCredits: 520000,
    },
    estimatedDurationDays: 7,
    rewards: {
      credits: 320000,
      researchData: 180,
      rawMaterials: 120,
      technologyPoints: 50,
      agencyPrestige: 400,
    },
    failureConditions: [
      'Apogee kick motor underburn resulting in graveyard orbit.',
      'Final orbital inclination greater than 1.5 degrees.',
    ],
    completionConditions: [
      'Stationary position maintained above prime meridian for 48 consecutive hours.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Geostationary Synchronization & Hohmann Apogee Burns',
      explanation:
        'Arthur C. Clarke demonstrated that an orbit at 35,786 km has a period of exactly 23 hours, 56 minutes, and 4 seconds (one sidereal day). When placed in the equatorial plane, the satellite appears motionless in the sky, allowing fixed ground dish antennas.',
      realWorldParallel: 'Intelsat, Inmarsat, and GOES weather monitoring networks.',
    },
  },

  // =========================================================================
  // 2. THE MOON (LUNA) MISSIONS
  // =========================================================================
  {
    id: 'MOON_ORBIT_SURVEY_01',
    name: 'Selene Prospect: Lunar Orbit & Polar Water Ice Mapping',
    shortCode: 'MSN-MOON-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Enter lunar polar orbit to map permanently shadowed craters for volatile water ice deposits.',
    description:
      'Execute the agency’s first translunar injection. Enter a 100 km polar orbit around the Moon to map the lunar South Pole with neutron spectrometers and laser altimetry, pinpointing water ice reservoirs in crater floors.',
    destinationId: DestinationId.MOON,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 2,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.MEDIUM,
    scientificPurpose:
      'Quantify hydrogen epithermal neutron flux depressions indicating subterranean ice trapped in permanently shadowed polar craters.',
    mainObjectives: [
      {
        id: 'obj_luna_tli',
        title: 'Translunar Injection Burn',
        description: 'Execute escape burn from LEO with delta-V ~3,150 m/s.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
      {
        id: 'obj_luna_capture',
        title: 'Lunar Orbit Insertion (LOI)',
        description: 'Perform retrograde capture into 100 km polar orbit.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 100,
        isCompleted: false,
      },
      {
        id: 'obj_luna_ice_map',
        title: 'Map Polar Hydrogen Concentrations',
        description: 'Acquire 500 scans over South Pole Shackleton & Faustini craters.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 500,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_luna_opt_farside',
        title: 'Lunar Far Side Gravity Anomalies',
        description: 'Map mass concentrations (mascons) along the lunar far side.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 1,
      requiredMissionIds: ['EARTH_LEO_DEPLOYMENT_01'],
      requiredTechNodeIds: ['tech_suborbital_telemetry'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.GAMMA_RAY_SPECTROMETER,
        ScientificInstrument.LASER_ALTIMETER,
        ScientificInstrument.MULTISPECTRAL_IMAGER,
      ],
      minPayloadMassKg: 200,
      maxPayloadMassKg: 650,
      minPowerWatts: 300,
      minBatteryCapacityWh: 600,
      communicationBandwidthKbps: 512,
      relayRequired: true,
      targetOrbit: {
        altitudeKmMin: 80,
        altitudeKmMax: 120,
        inclinationDeg: 90,
      },
    },
    budget: {
      allocatedCredits: 450000,
      launchCostCapCredits: 360000,
    },
    estimatedDurationDays: 14,
    rewards: {
      credits: 240000,
      researchData: 160,
      rawMaterials: 80,
      technologyPoints: 35,
      agencyPrestige: 350,
    },
    failureConditions: [
      'Failure to execute LOI burn resulting in heliocentric escape trajectory.',
      'Orbital perigee dropping below 20 km into lunar terrain.',
    ],
    completionConditions: [
      'Complete global topographic and neutron spectrometer dataset returned to Earth.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Translunar Trajectory & Permanently Shadowed Regions (PSRs)',
      explanation:
        'Because the Moon’s rotational axis is tilted only 1.5° from the ecliptic, the rims of deep polar craters block all sunlight perpetually. These dark cold-traps reach -240°C, preserving billions of years of volatile water ice that would otherwise sublimate into space.',
      realWorldParallel: 'Lunar Reconnaissance Orbiter (LRO) and Chandrayaan-1 water discovery.',
    },
  },

  {
    id: 'MOON_LANDER_DELIVERY_01',
    name: 'Tranquil Touchdown: Lunar Surface Equipment Delivery',
    shortCode: 'MSN-MOON-02',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deliver an automated scientific equipment container onto the Mare Tranquillitatis plains.',
    description:
      'Perform a controlled powered descent onto the basalt plain of Mare Tranquillitatis. Deliver a 350 kg autonomous surface instrumentation station to establish continuous seismic and thermal monitoring.',
    destinationId: DestinationId.MOON,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 3,
    stageType: MissionStageType.TRANSPORTATION,
    difficulty: MissionDifficulty.MEDIUM,
    scientificPurpose:
      'Deploy the first stationary lunar geophysics platform to record moonquakes and solar wind regolith charging.',
    mainObjectives: [
      {
        id: 'obj_luna_land_desc',
        title: 'Execute Powered Descent',
        description: 'Throttle descent thrusters to reduce vertical velocity under 1.5 m/s at touchdown.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_luna_deploy_station',
        title: 'Deploy Surface Station Container',
        description: 'Unpack instrument arms and anchor station to regolith.',
        type: ObjectiveType.STATION_DEPLOYMENT,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_luna_land_acc',
        title: 'Precision Touchdown',
        description: 'Land within 100 meters of target coordinates (0.67° N, 23.47° E).',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 1,
      requiredMissionIds: ['MOON_ORBIT_SURVEY_01'],
      requiredTechNodeIds: ['tech_basic_rocketry'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SURFACE_LANDER,
      payloadType: PayloadType.SURFACE_EQUIPMENT_CONTAINER,
      requiredInstruments: [
        ScientificInstrument.SEISMOMETER,
        ScientificInstrument.ALPHA_PARTICLE_XRAY,
      ],
      minPayloadMassKg: 300,
      maxPayloadMassKg: 850,
      minPowerWatts: 350,
      minBatteryCapacityWh: 1000,
      communicationBandwidthKbps: 512,
      relayRequired: false,
      surfaceTargetCoordinates: {
        latitude: 0.67,
        longitude: 23.47,
        landingRadiusKm: 5,
      },
    },
    budget: {
      allocatedCredits: 520000,
      launchCostCapCredits: 420000,
    },
    estimatedDurationDays: 10,
    rewards: {
      credits: 280000,
      researchData: 190,
      rawMaterials: 110,
      technologyPoints: 40,
      agencyPrestige: 420,
    },
    failureConditions: [
      'Touchdown impact velocity exceeding 3.5 m/s causing leg collapse.',
      'Vehicle tipping angle greater than 15 degrees on slope.',
    ],
    completionConditions: [
      'Telemetry confirming all four landing legs compressed and surface station active.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Vacuum Propulsive Descent & Gravity Turns',
      explanation:
        'Without an atmosphere, parachutes and aerocapture are impossible on the Moon. A lander must carry all the propellant required to completely nullify its 1.7 km/s orbital velocity using throttled bipropellant rocket engines.',
      realWorldParallel: 'Apollo 11 Lunar Module and Surveyor robotic landers.',
    },
  },

  {
    id: 'MOON_ROVER_EXPLORATION_01',
    name: 'Artemis Path: Lunar Rover Delivery & Highland Traverse',
    shortCode: 'MSN-MOON-03',
    category: MissionCategory.COMBINED,
    summary: 'Deliver the Selene-1 exploration rover to the South Pole and complete geological survey traverses.',
    description:
      'The definitive combined mission: transport the six-wheeled Selene-1 rover to the lunar South Pole rim, deploy its ramps, and navigate across pulverized regolith terrain to collect core samples from ancient impact ejecta.',
    destinationId: DestinationId.MOON,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 4,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.HARD,
    scientificPurpose:
      'Extract pristine pre-Imbrian highland anorthosite crust samples and measure subsurface thermal gradients.',
    mainObjectives: [
      // Delivery Objectives
      {
        id: 'obj_rover_delivery',
        title: 'Land Mobile Rover Platform',
        description: 'Touch down safely inside the South Pole-Aitken basin rim.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_rover_egress',
        title: 'Rover Ramps Egress',
        description: 'Drive Selene-1 off the lander deck onto the lunar surface.',
        type: ObjectiveType.DELIVERY,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      // Exploration Objectives
      {
        id: 'obj_rover_traverse',
        title: 'Complete 3.5 km Surface Traverse',
        description: 'Navigate across crater slopes while avoiding boulders > 0.5m.',
        type: ObjectiveType.ROVER_TRAVERSAL,
        targetValue: 3500,
        isCompleted: false,
        isExplorationObjective: true,
      },
      {
        id: 'obj_rover_drill',
        title: 'Extract 3 Regolith Core Samples',
        description: 'Use rotary percussive drill to retrieve samples from 1.0m depth.',
        type: ObjectiveType.SAMPLE_ACQUISITION,
        targetValue: 3,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_rover_opt_night',
        title: 'Survive 14-Day Lunar Night',
        description: 'Enter low-power sleep mode with radioisotope thermal heater.',
        type: ObjectiveType.DATA_COLLECTION,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['MOON_LANDER_DELIVERY_01'],
      requiredTechNodeIds: ['tech_basic_rocketry'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.PLANETARY_ROVER,
      payloadType: PayloadType.ROBOTIC_ROVER,
      requiredInstruments: [
        ScientificInstrument.ALPHA_PARTICLE_XRAY,
        ScientificInstrument.CORE_DRILL_SAMPLER,
        ScientificInstrument.MULTISPECTRAL_IMAGER,
      ],
      minPayloadMassKg: 550,
      maxPayloadMassKg: 1400,
      minPowerWatts: 450,
      minBatteryCapacityWh: 1800,
      communicationBandwidthKbps: 1024,
      relayRequired: true,
      surfaceTargetCoordinates: {
        latitude: -85.5,
        longitude: 0.0,
        landingRadiusKm: 2,
      },
    },
    budget: {
      allocatedCredits: 780000,
      launchCostCapCredits: 620000,
    },
    estimatedDurationDays: 30,
    rewards: {
      credits: 420000,
      researchData: 280,
      rawMaterials: 160,
      technologyPoints: 60,
      agencyPrestige: 550,
    },
    failureConditions: [
      'Rover wheel motor burnout in loose electrostatic regolith dust.',
      'Lander crash destroying mobile payload.',
    ],
    completionConditions: [
      'Both delivery confirmation and 3 full drill core spectrograms transmitted to Earth.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Regolith Mechanics & Rover Wheel Traction',
      explanation:
        'Lunar dust particles are jagged shards of glass that have never been rounded by wind or water. They cling electrostatically to spacesuits, solar panels, and mechanical joints, demanding hermetic rotary seals and compliant wire mesh wheels.',
      realWorldParallel: 'Apollo Lunar Roving Vehicle (LRV) and VIPER polar rover.',
    },
  },

  {
    id: 'MOON_STATION_DEPLOYMENT_01',
    name: 'Selene Basecamp: Permanent Habitat Module Transportation',
    shortCode: 'MSN-MOON-04',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deliver a heavy pressurized research habitat to the lunar South Pole ridge.',
    description:
      'Transport the 4-ton Selene Basecamp core module to a permanent high-illumination ridge near Shackleton crater. This serves as the foundation for future long-duration crewed lunar expeditions.',
    destinationId: DestinationId.MOON,
    parentDestinationId: DestinationId.EARTH,
    sequenceLevel: 5,
    stageType: MissionStageType.INFRASTRUCTURE_PREPARATION,
    difficulty: MissionDifficulty.HARD,
    scientificPurpose:
      'Establish permanent life-support systems, regenerative ECLSS testing, and high-gain orbital relay ground equipment on the lunar surface.',
    mainObjectives: [
      {
        id: 'obj_luna_base_land',
        title: 'Precision Heavy Module Landing',
        description: 'Land 4,000 kg habitat module within 50m of designated foundation pad.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_luna_base_pressurize',
        title: 'Deploy Solar Arrays & Pressurize',
        description: 'Extend vertical solar towers to capture 86% annual sunlight along the ridge.',
        type: ObjectiveType.STATION_DEPLOYMENT,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['MOON_ROVER_EXPLORATION_01'],
      requiredTechNodeIds: ['tech_radiation_hardened_avionics'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SURFACE_LANDER,
      payloadType: PayloadType.RESEARCH_MODULE,
      requiredInstruments: [ScientificInstrument.SEISMOMETER],
      minPayloadMassKg: 3500,
      maxPayloadMassKg: 6000,
      minPowerWatts: 3000,
      minBatteryCapacityWh: 10000,
      communicationBandwidthKbps: 4096,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 1200000,
      launchCostCapCredits: 950000,
    },
    estimatedDurationDays: 45,
    rewards: {
      credits: 600000,
      researchData: 350,
      rawMaterials: 300,
      technologyPoints: 80,
      agencyPrestige: 750,
    },
    failureConditions: [
      'Touchdown drift > 100m into boulder-strewn crater rim.',
      'Structural decompression during descent deceleration.',
    ],
    completionConditions: [
      'Full life support environmental telemetry locked at 1.0 atm nominal.',
    ],
    isReplayable: false,
    educationalContent: {
      coreConcept: 'Peaks of Eternal Light & In-Situ Surface Siting',
      explanation:
        'Certain elevated topographic ridges at the lunar poles receive sunlight for over 85% of the year due to grazing sun angles, minimizing the brutal 14-day lunar night and maximizing solar power generation.',
      realWorldParallel: 'Artemis Base Camp concepts and Shackleton crater rim outposts.',
    },
  },

  // =========================================================================
  // 3. MARS & MARTIAN MOONS MISSIONS
  // =========================================================================
  {
    id: 'MARS_ORBITER_01',
    name: 'Ares Global: Mars Orbit Reconnaissance & Atmospheric Entry',
    shortCode: 'MSN-MARS-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Achieve Mars orbit insertion to map global canyon systems and dust storm dynamics.',
    description:
      'Execute Trans-Mars Injection from Earth, navigate across 225 million kilometers of interplanetary space, and execute Mars Orbit Insertion. Characterize thin CO2 atmospheric density and scout candidate landing zones in Jezero and Gale craters.',
    destinationId: DestinationId.MARS,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 3,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.HARD,
    scientificPurpose:
      'Map hydrated silica, carbonate minerals, and clay deltas using imaging spectrometers from Mars orbit.',
    mainObjectives: [
      {
        id: 'obj_mars_tmi',
        title: 'Trans-Mars Injection Burn',
        description: 'Escape Earth gravity along hyperbolic departure asymptote (delta-V ~3,600 m/s).',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
      {
        id: 'obj_mars_moi',
        title: 'Mars Orbit Insertion',
        description: 'Execute retrograde burn to capture into elliptical Mars orbit.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 400,
        isCompleted: false,
      },
      {
        id: 'obj_mars_spectro',
        title: 'Map Jezero Paleolake Minerals',
        description: 'Acquire high-resolution CRISM-class spectrometer passes.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 200,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_mars_opt_aerobrake',
        title: 'Aerobraking Demonstration',
        description: 'Dip periapsis into upper atmosphere (125 km) to circularize with zero propellant.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['MOON_ORBIT_SURVEY_01'],
      requiredTechNodeIds: ['tech_interplanetary_trajectory'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.MULTISPECTRAL_IMAGER,
        ScientificInstrument.SYNTHETIC_APERTURE_RADAR,
        ScientificInstrument.ATMOSPHERIC_STRUCTURE_PROBE,
      ],
      minPayloadMassKg: 400,
      maxPayloadMassKg: 1200,
      minPowerWatts: 500,
      minBatteryCapacityWh: 1200,
      communicationBandwidthKbps: 256,
      relayRequired: true,
      targetOrbit: {
        altitudeKmMin: 250,
        altitudeKmMax: 400,
        inclinationDeg: 93,
      },
    },
    budget: {
      allocatedCredits: 850000,
      launchCostCapCredits: 680000,
    },
    estimatedDurationDays: 210,
    rewards: {
      credits: 460000,
      researchData: 320,
      rawMaterials: 180,
      technologyPoints: 70,
      agencyPrestige: 600,
    },
    failureConditions: [
      'Navigation trajectory error causing atmospheric burnout or heliocentric flyby.',
      'Communication antenna misalignment during Mars solar conjunction.',
    ],
    completionConditions: [
      'Full mineralogical map of candidate rover sites successfully received at Earth DSN.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Hohmann Transfer Windows & Orbital Aerobraking',
      explanation:
        'Because Earth and Mars orbit at different speeds, an energy-optimal transfer window opens only once every 26 months. Using atmospheric drag (aerobraking) to shed velocity over hundreds of gentle atmospheric passes saves thousands of kilograms of rocket fuel.',
      realWorldParallel: 'Mars Reconnaissance Orbiter (MRO) and Mars Odyssey.',
    },
  },

  {
    id: 'MARS_ROVER_EXPLORATION_01',
    name: 'Red Horizon: Jezero Rover Delivery & Astrobiology Traverse',
    shortCode: 'MSN-MARS-02',
    category: MissionCategory.COMBINED,
    summary: 'Deliver a nuclear-powered exploration rover to Jezero Crater and search for biosignatures.',
    description:
      'Survive the "Seven Minutes of Terror" using a heat shield, supersonic parachute, and rocket-powered sky crane. Touch down inside Jezero Crater, deploy the Pathfinder-2 rover, and begin exploration of an ancient river delta.',
    destinationId: DestinationId.MARS,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 4,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.VERY_HARD,
    scientificPurpose:
      'Search for preserved microfossils and organic molecules in lacustrine mudstone and clay sediments.',
    mainObjectives: [
      // Delivery Objectives
      {
        id: 'obj_mars_edl',
        title: 'Survive Entry, Descent, and Landing (EDL)',
        description: 'Deploy supersonic parachute at Mach 2.2 and execute sky-crane soft touchdown.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_mars_rover_deploy',
        title: 'Deploy Pathfinder-2 Rover',
        description: 'Verify RTG power output and release rover umbilical cables.',
        type: ObjectiveType.DELIVERY,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      // Exploration Objectives
      {
        id: 'obj_mars_traverse',
        title: 'Navigate 5.0 km Delta Traverse',
        description: 'Drive along ancient delta front slopes and avoid sand dune traps.',
        type: ObjectiveType.ROVER_TRAVERSAL,
        targetValue: 5000,
        isCompleted: false,
        isExplorationObjective: true,
      },
      {
        id: 'obj_mars_cores',
        title: 'Seal 4 Astrobiology Core Samples',
        description: 'Drill sedimentary delta rocks and hermetically seal titanium sample tubes.',
        type: ObjectiveType.SAMPLE_ACQUISITION,
        targetValue: 4,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [
      {
        id: 'obj_mars_opt_moxie',
        title: 'In-Situ Oxygen Production',
        description: 'Demonstrate MOXIE electrolysis extracting O2 from atmospheric CO2.',
        type: ObjectiveType.DATA_COLLECTION,
        isCompleted: false,
      },
    ],
    prerequisites: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['MARS_ORBITER_01'],
      requiredTechNodeIds: ['tech_interplanetary_trajectory'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.PLANETARY_ROVER,
      payloadType: PayloadType.ROBOTIC_ROVER,
      requiredInstruments: [
        ScientificInstrument.ALPHA_PARTICLE_XRAY,
        ScientificInstrument.CORE_DRILL_SAMPLER,
        ScientificInstrument.MASS_SPECTROMETER,
        ScientificInstrument.MULTISPECTRAL_IMAGER,
      ],
      minPayloadMassKg: 900,
      maxPayloadMassKg: 2200,
      minPowerWatts: 600,
      minBatteryCapacityWh: 2400,
      communicationBandwidthKbps: 512,
      relayRequired: true,
      surfaceTargetCoordinates: {
        latitude: 18.38,
        longitude: 77.58,
        landingRadiusKm: 3,
      },
    },
    budget: {
      allocatedCredits: 1400000,
      launchCostCapCredits: 1100000,
    },
    estimatedDurationDays: 360,
    rewards: {
      credits: 750000,
      researchData: 520,
      rawMaterials: 280,
      technologyPoints: 120,
      agencyPrestige: 900,
    },
    failureConditions: [
      'Parachute shredding during supersonic deployment.',
      'Sky crane bridle line tangling or premature separation.',
    ],
    completionConditions: [
      '4 sealed sample tubes deposited in cache and delta sediment analysis verified.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Supersonic Parachutes & Sky-Crane Architecture',
      explanation:
        'Mars’ atmosphere has less than 1% of Earth’s density—too thin to slow a heavy vehicle to landing speed with parachutes alone, but thick enough to generate extreme friction heating during entry. Heavy landers use a rocket-propelled crane to lower the rover on cables.',
      realWorldParallel: 'Curiosity (2012) and Perseverance (2021) rover landings.',
    },
  },

  // =========================================================================
  // 4. VENUS MISSIONS
  // =========================================================================
  {
    id: 'VENUS_ORBITAL_RADAR_01',
    name: 'Morning Star: Cloud-Piercing Synthetic Aperture Radar',
    shortCode: 'MSN-VEN-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Map the volcanic surface of Venus beneath its opaque global sulfuric acid clouds.',
    description:
      'Venus is shrouded in permanent, highly reflective clouds of concentrated sulfuric acid. Deploy an orbital radar probe using microwave SAR to penetrate the cloud deck and map volcanic coronae and tectonic tesserae.',
    destinationId: DestinationId.VENUS,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 4,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.HARD,
    scientificPurpose:
      'Probe the planetary lithosphere for active volcanic eruptions and map thermal emissivity anomalies.',
    mainObjectives: [
      {
        id: 'obj_venus_moi',
        title: 'Venus Orbit Insertion',
        description: 'Perform capture burn into 300 km polar orbit.',
        type: ObjectiveType.ORBITAL_INSERTION,
        targetValue: 300,
        isCompleted: false,
      },
      {
        id: 'obj_venus_sar_map',
        title: 'Acquire 1,000 Radar Strips',
        description: 'Map Venusian tesserae and volcanic shield volcanoes.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 1000,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 3,
      requiredMissionIds: ['EARTH_GEO_RELAY_01'],
      requiredTechNodeIds: ['tech_heavy_aeroshells'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.SYNTHETIC_APERTURE_RADAR,
        ScientificInstrument.LASER_ALTIMETER,
      ],
      minPayloadMassKg: 500,
      maxPayloadMassKg: 1300,
      minPowerWatts: 700,
      minBatteryCapacityWh: 1500,
      communicationBandwidthKbps: 512,
      relayRequired: true,
      targetOrbit: {
        altitudeKmMin: 250,
        altitudeKmMax: 350,
        inclinationDeg: 86,
      },
    },
    budget: {
      allocatedCredits: 950000,
      launchCostCapCredits: 750000,
    },
    estimatedDurationDays: 180,
    rewards: {
      credits: 520000,
      researchData: 380,
      rawMaterials: 220,
      technologyPoints: 85,
      agencyPrestige: 680,
    },
    failureConditions: [
      'Radar transmitter thermal runaway in high solar irradiance.',
    ],
    completionConditions: [
      'Global 100m-resolution topographic radar atlas downlinked to Earth.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Synthetic Aperture Radar (SAR) Microwave Imaging',
      explanation:
        'Optical cameras cannot see through Venus’s 20-kilometer-thick cloud decks. SAR transmits microwave radio pulses that penetrate clouds, haze, and darkness, using spacecraft motion to synthesize an antenna aperture kilometers wide.',
      realWorldParallel: 'Magellan radar mapper (1990–1994) and EnVision.',
    },
  },

  {
    id: 'VENUS_SURFACE_LANDER_01',
    name: 'Inferno Survivor: 120-Minute Basalt Geochemistry Probe',
    shortCode: 'MSN-VEN-02',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Descend through 92-bar crushing pressure and survive 120 minutes on the 464°C surface.',
    description:
      'The ultimate thermal engineering challenge: deploy a spherical titanium-armored lander equipped with phase-change heat sinks. Plunge through the supercritical carbon dioxide atmosphere to record surface geochemistry before thermal failure.',
    destinationId: DestinationId.VENUS,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 5,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.EXTREME,
    scientificPurpose:
      'Perform X-ray fluorescence spectrometry of pristine Venusian basalt and measure near-surface wind speeds.',
    mainObjectives: [
      {
        id: 'obj_venus_entry',
        title: 'Survive Atmospheric Entry',
        description: 'Decelerate through Mach 30 entry using carbon-phenolic heat shield.',
        type: ObjectiveType.DATA_COLLECTION,
        isCompleted: false,
      },
      {
        id: 'obj_venus_surface_touch',
        title: 'Touchdown on Aphrodite Terra',
        description: 'Impact surface safely with aerodynamic drag ring deceleration under 8 m/s.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isExplorationObjective: true,
      },
      {
        id: 'obj_venus_xrf',
        title: 'Transmit Surface Chemical Telemetry',
        description: 'Complete 120 minutes of continuous telemetry transmission prior to thermal shutdown.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 120,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 3,
      requiredMissionIds: ['VENUS_ORBITAL_RADAR_01'],
      requiredTechNodeIds: ['tech_heavy_aeroshells'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.SURFACE_LANDER,
      payloadType: PayloadType.ATMOSPHERIC_AEROSHELL,
      requiredInstruments: [
        ScientificInstrument.ALPHA_PARTICLE_XRAY,
        ScientificInstrument.MASS_SPECTROMETER,
        ScientificInstrument.ATMOSPHERIC_STRUCTURE_PROBE,
      ],
      minPayloadMassKg: 750,
      maxPayloadMassKg: 1800,
      minPowerWatts: 400,
      minBatteryCapacityWh: 1200,
      communicationBandwidthKbps: 256,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 1300000,
      launchCostCapCredits: 1050000,
    },
    estimatedDurationDays: 120,
    rewards: {
      credits: 720000,
      researchData: 550,
      rawMaterials: 300,
      technologyPoints: 130,
      agencyPrestige: 950,
    },
    failureConditions: [
      'Hull implosion before reaching surface under 92 bar ambient pressure.',
      'Electronics failure in first 10 minutes from internal heat soak.',
    ],
    completionConditions: [
      'Minimum 60 minutes of calibrated surface spectrometry received before loss of signal.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Supercritical Fluids & Phase-Change Thermal Sinks',
      explanation:
        'At Venus’s surface, 92 bar of pressure and 464°C heat transforms CO2 into a supercritical fluid—neither gas nor liquid. Spacecraft cannot use standard fans or cooling radiators; they must rely on spherical titanium hulls packed with melting lithium salts to absorb heat.',
      realWorldParallel: 'Soviet Venera 9–14 landers and DAVINCI probe concept.',
    },
  },

  // =========================================================================
  // 5. ASTEROID BELT & SMALL BODIES MISSIONS
  // =========================================================================
  {
    id: 'ASTEROID_PROXIMITY_SURVEY_01',
    name: 'Dawn Belt: Main Asteroid Belt Reconnaissance',
    shortCode: 'MSN-BELT-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Rendezvous with main belt asteroids and perform close-proximity laser scanning.',
    description:
      'Traverse beyond Mars to the primordial debris disc of the Main Asteroid Belt. Use high-efficiency electric ion propulsion to rendezvous with carbonaceous C-type and metallic M-type asteroids.',
    destinationId: DestinationId.ASTEROID_BELT,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 4,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.MEDIUM,
    scientificPurpose:
      'Determine asteroid mass, volume, and gravitational dipole moments to ascertain whether they are rubble piles or solid monometallic fragments.',
    mainObjectives: [
      {
        id: 'obj_belt_rendezvous',
        title: 'Match Trajectory with Target Asteroid',
        description: 'Reduce relative velocity under 1.0 m/s at 5 km proximity.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
      {
        id: 'obj_belt_shape',
        title: '3D Laser Radar Surface Model',
        description: 'Complete 360-degree rotation shape model using laser altimetry.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 1,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 3,
      requiredMissionIds: ['MARS_ORBITER_01'],
      requiredTechNodeIds: ['tech_ion_propulsion'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.LASER_ALTIMETER,
        ScientificInstrument.MULTISPECTRAL_IMAGER,
      ],
      minPayloadMassKg: 300,
      maxPayloadMassKg: 800,
      minPowerWatts: 600,
      minBatteryCapacityWh: 1200,
      communicationBandwidthKbps: 256,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 750000,
      launchCostCapCredits: 600000,
    },
    estimatedDurationDays: 320,
    rewards: {
      credits: 380000,
      researchData: 260,
      rawMaterials: 200,
      technologyPoints: 60,
      agencyPrestige: 480,
    },
    failureConditions: [
      'High-velocity collision with unmapped secondary asteroid debris.',
    ],
    completionConditions: [
      'Full shape model and surface reflectance spectrum downlinked.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Low-Thrust Trajectories & Rubble-Pile Asteroids',
      explanation:
        'Ion thrusters provide tiny amounts of force (comparable to the weight of a piece of paper) but operate continuously for months with high specific impulse, allowing spacecraft to visit multiple targets that chemical rockets could never reach.',
      realWorldParallel: 'NASA Dawn mission (Ceres & Vesta) and Hayabusa2.',
    },
  },

  {
    id: 'ASTEROID_SAMPLE_RETURN_01',
    name: 'Osiris Touch: Microgravity Regolith Sample Return',
    shortCode: 'MSN-BELT-02',
    category: MissionCategory.COMBINED,
    summary: 'Perform a touch-and-go sampling maneuver on a carbonaceous asteroid and return samples to Earth.',
    description:
      'Navigate to a primitive Near-Earth carbonaceous asteroid, extend a pneumatic sampling arm, execute a 5-second touch-and-go maneuver, and fire departure thrusters to return a sealed capsule through Earth’s atmosphere.',
    destinationId: DestinationId.ASTEROID_BELT,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 5,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.VERY_HARD,
    scientificPurpose:
      'Retrieve unaltered amino acids, hydrated clays, and organic compounds dating from the solar nebula 4.56 billion years ago.',
    mainObjectives: [
      // Delivery Objectives
      {
        id: 'obj_sample_tag',
        title: 'Execute Touch-and-Go (TAG) Maneuver',
        description: 'Contact asteroid surface at 10 cm/s with nitrogen gas blast.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_sample_collect',
        title: 'Acquire > 100g Regolith',
        description: 'Verify sample canister mass increase via arm load cells.',
        type: ObjectiveType.SAMPLE_ACQUISITION,
        targetValue: 100,
        isCompleted: false,
        isExplorationObjective: true,
      },
      // Exploration / Return Objectives
      {
        id: 'obj_sample_earth_entry',
        title: 'Deliver Sample Capsule to Earth',
        description: 'Target Utah / Woomera recovery corridor with hyperbolic entry.',
        type: ObjectiveType.DELIVERY,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 3,
      requiredMissionIds: ['ASTEROID_PROXIMITY_SURVEY_01'],
      requiredTechNodeIds: ['tech_ion_propulsion'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SAMPLE_RETURN_CAPSULE,
      requiredInstruments: [
        ScientificInstrument.MULTISPECTRAL_IMAGER,
        ScientificInstrument.CORE_DRILL_SAMPLER,
      ],
      minPayloadMassKg: 650,
      maxPayloadMassKg: 1500,
      minPowerWatts: 750,
      minBatteryCapacityWh: 1600,
      communicationBandwidthKbps: 512,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 1600000,
      launchCostCapCredits: 1250000,
    },
    estimatedDurationDays: 700,
    rewards: {
      credits: 900000,
      researchData: 650,
      rawMaterials: 400,
      technologyPoints: 160,
      agencyPrestige: 1100,
    },
    failureConditions: [
      'Capsule heat shield burn-through during 12 km/s Earth re-entry.',
      'Sample canister seal leak exposing vacuum grains to Earth air.',
    ],
    completionConditions: [
      'Sample return capsule recovered with confirmed extraterrestrial grains.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Microgravity Touch-and-Go (TAG) & Interplanetary Sample Return',
      explanation:
        'With surface gravity less than 0.0001g, a spacecraft cannot "land" normally—any bounce would launch it into space. Instead, it hovers, touches the surface for seconds while firing pressurized gas to kick dust into a collector, then backs away.',
      realWorldParallel: 'OSIRIS-REx (Bennu) and Hayabusa2 (Ryugu) sample returns.',
    },
  },

  // =========================================================================
  // 6. JUPITER & JOVIAN MOONS MISSIONS
  // =========================================================================
  {
    id: 'JUPITER_ORBITAL_OBSERVATION_01',
    name: 'Jovian Monarch: Jupiter Magnetosphere & Radiation Orbit',
    shortCode: 'MSN-JUP-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Navigate past the asteroid belt and enter orbit around Jupiter to map its massive radiation harness.',
    description:
      'Enter an inclined polar orbit around Jupiter, flying between the cloud tops and the lethal inner radiation belt. Measure the Jovian magnetic dipole and probe the depth of the Great Red Spot.',
    destinationId: DestinationId.JUPITER,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 5,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.VERY_HARD,
    scientificPurpose:
      'Determine the mass of Jupiter’s dense core and probe the transition zone to liquid metallic hydrogen.',
    mainObjectives: [
      {
        id: 'obj_jup_joi',
        title: 'Jupiter Orbit Insertion (JOI)',
        description: 'Execute high-thrust retrograde burn through perijove.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
      {
        id: 'obj_jup_red_spot',
        title: 'Great Red Spot Gravity Passes',
        description: 'Execute 10 close perijove flybys measuring gravity perturbations.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 10,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 4,
      requiredMissionIds: ['ASTEROID_PROXIMITY_SURVEY_01'],
      requiredTechNodeIds: ['tech_rtg_power_systems'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.MAGNETOMETER,
        ScientificInstrument.RADIO_SCIENCE_TRANSPONDER,
      ],
      minPayloadMassKg: 800,
      maxPayloadMassKg: 2000,
      minPowerWatts: 500,
      minBatteryCapacityWh: 2000,
      communicationBandwidthKbps: 256,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 1800000,
      launchCostCapCredits: 1400000,
    },
    estimatedDurationDays: 1100,
    rewards: {
      credits: 950000,
      researchData: 700,
      rawMaterials: 350,
      technologyPoints: 175,
      agencyPrestige: 1250,
    },
    failureConditions: [
      'Radiation vault failure causing avionics processor latchup.',
    ],
    completionConditions: [
      'Full gravitational harmonics and magnetic field model returned.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Jovian Radiation Belts & Titanium Radiation Vaults',
      explanation:
        'Jupiter’s magnetic field is 20,000 times stronger than Earth’s, trapping electrons at near-light speed. To survive, spacecraft electronics must be sealed inside a vault with walls of 1-centimeter-thick titanium.',
      realWorldParallel: 'NASA Juno mission and Galileo orbiter.',
    },
  },

  {
    id: 'EUROPA_PLUME_SURVEY_01',
    name: 'Europa Horizon: Subsurface Ocean Plume Flyby',
    shortCode: 'MSN-JUP-02',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Fly through cryogenic water vapor plumes venting from Europa’s subsurface ocean.',
    description:
      'Execute a 25 km low-altitude flyby through cryovolcanic vapor plumes erupting from fractures in Europa’s ice crust. Sample water vapor, salts, and organics directly without drilling.',
    destinationId: DestinationId.EUROPA,
    parentDestinationId: DestinationId.JUPITER,
    sequenceLevel: 6,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.EXTREME,
    scientificPurpose:
      'Analyze plume salinity, silica nanoparticles, and complex organic molecules indicating hydrothermal activity on the ocean floor.',
    mainObjectives: [
      {
        id: 'obj_europa_flyby',
        title: 'Precision 25 km Plume Flyby',
        description: 'Intercept south polar fissure vapor plume at 4.2 km/s relative speed.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 1,
        isCompleted: false,
        isExplorationObjective: true,
      },
      {
        id: 'obj_europa_mass_spec',
        title: 'Spectrometer Molecular Detection',
        description: 'Detect volatile organic compounds and sodium chloride salt ions.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 100,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 4,
      requiredMissionIds: ['JUPITER_ORBITAL_OBSERVATION_01'],
      requiredTechNodeIds: ['tech_cryogenic_radiation_shielding'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.MASS_SPECTROMETER,
        ScientificInstrument.GAS_CHROMATOGRAPH,
        ScientificInstrument.MULTISPECTRAL_IMAGER,
      ],
      minPayloadMassKg: 700,
      maxPayloadMassKg: 1800,
      minPowerWatts: 600,
      minBatteryCapacityWh: 1800,
      communicationBandwidthKbps: 512,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 2100000,
      launchCostCapCredits: 1700000,
    },
    estimatedDurationDays: 1200,
    rewards: {
      credits: 1200000,
      researchData: 900,
      rawMaterials: 450,
      technologyPoints: 220,
      agencyPrestige: 1600,
    },
    failureConditions: [
      'Radiation dose exceeding 500 krad resulting in payload failure.',
    ],
    completionConditions: [
      'Confirmed molecular spectrometry of ocean plume vapor returned.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Tidal Heating & Subsurface Liquid Oceans',
      explanation:
        'Europa is kept warm not by sunlight, but by orbital resonance: Io and Ganymede constantly pull Europa into an eccentric orbit, causing Jupiter’s gravitational tides to knead its rocky interior like clay, melting its ice into a liquid ocean.',
      realWorldParallel: 'Europa Clipper and ESA Juice missions.',
    },
  },

  // =========================================================================
  // 7. SATURN & SATURNIAN MOONS MISSIONS
  // =========================================================================
  {
    id: 'SATURN_RING_SURVEY_01',
    name: 'Cassini Crown: Saturn Ring Plane & Magnetospheric Recon',
    shortCode: 'MSN-SAT-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Enter Saturn orbit to map the intricate structure of the A, B, and C ring systems.',
    description:
      'Travel to the outer solar system and enter orbit around Saturn. Execute daring dives between the inner D-ring and the upper ammonia clouds to investigate ring spokes, shepherd moons, and magnetic field alignment.',
    destinationId: DestinationId.SATURN,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 6,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.EXTREME,
    scientificPurpose:
      'Determine the age and mass of Saturn’s rings and measure dust influx rates from micrometeoroid bombardment.',
    mainObjectives: [
      {
        id: 'obj_saturn_soi',
        title: 'Saturn Orbit Insertion (SOI)',
        description: 'Fire main engine through Cassini Division gap to capture into orbit.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
      {
        id: 'obj_saturn_ring_map',
        title: 'Map Ring Particle Density',
        description: 'Acquire radio occultation profiles across Saturn’s main ring discs.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 50,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 5,
      requiredMissionIds: ['JUPITER_ORBITAL_OBSERVATION_01'],
      requiredTechNodeIds: ['tech_deep_space_telemetry_array'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.RADIO_SCIENCE_TRANSPONDER,
        ScientificInstrument.SYNTHETIC_APERTURE_RADAR,
      ],
      minPayloadMassKg: 1000,
      maxPayloadMassKg: 2800,
      minPowerWatts: 700,
      minBatteryCapacityWh: 2500,
      communicationBandwidthKbps: 256,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 2500000,
      launchCostCapCredits: 2000000,
    },
    estimatedDurationDays: 2400,
    rewards: {
      credits: 1400000,
      researchData: 1100,
      rawMaterials: 600,
      technologyPoints: 280,
      agencyPrestige: 1900,
    },
    failureConditions: [
      'High-velocity ring particle impact penetrating main bus.',
    ],
    completionConditions: [
      'Radio occultation transmission of complete A/B ring system downlinked.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Roche Limit & Planetary Ring Formation',
      explanation:
        'Saturn’s rings exist inside the Roche limit—the distance within which a moon’s self-gravity cannot hold it together against tidal forces from the planet. Any icy moon straying inside is torn into billions of ring particles.',
      realWorldParallel: 'Cassini-Huygens mission (1997–2017).',
    },
  },

  {
    id: 'TITAN_AERIAL_EXPLORATION_01',
    name: 'Dragonfly Horizon: Titan Atmospheric Drone & Methane Lake Expedition',
    shortCode: 'MSN-SAT-02',
    category: MissionCategory.COMBINED,
    summary: 'Deploy an octocopter aerial drone onto Titan to explore prebiotic organic sand dunes.',
    description:
      'Enter Titan’s dense nitrogen atmosphere, discard the heat shield, and deploy an autonomous rotorcraft. Fly multi-kilometer hops between methane riverbeds and organic dunes to sample prebiotic chemistry.',
    destinationId: DestinationId.TITAN,
    parentDestinationId: DestinationId.SATURN,
    sequenceLevel: 7,
    stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
    difficulty: MissionDifficulty.EXTREME,
    scientificPurpose:
      'Sample complex carbon-nitrogen polymers (tholins) and measure methane rain hydrological cycles.',
    mainObjectives: [
      // Delivery Objectives
      {
        id: 'obj_titan_entry',
        title: 'Survive Atmospheric Parachute Entry',
        description: 'Descend through dense nitrogen atmosphere to Shangri-La dune field.',
        type: ObjectiveType.SURFACE_LANDING,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_titan_rotor_deploy',
        title: 'Deploy Octocopter Rotors',
        description: 'Verify rotor blade spin and RTG battery recharge cycle at -179°C.',
        type: ObjectiveType.DELIVERY,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      // Exploration Objectives
      {
        id: 'obj_titan_flight',
        title: 'Complete 12 km Aerial Flight',
        description: 'Perform low-altitude hop across organic hydrocarbon dunes.',
        type: ObjectiveType.ROVER_TRAVERSAL,
        targetValue: 12000,
        isCompleted: false,
        isExplorationObjective: true,
      },
      {
        id: 'obj_titan_sample',
        title: 'Mass Spectrometry of Tholin Dunes',
        description: 'Drill surface tholins and run gas chromatograph mass spectrometer.',
        type: ObjectiveType.SAMPLE_ACQUISITION,
        targetValue: 3,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 5,
      requiredMissionIds: ['SATURN_RING_SURVEY_01'],
      requiredTechNodeIds: ['tech_cryogenic_hydrocarbon_probes'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.PLANETARY_ROVER,
      payloadType: PayloadType.ROBOTIC_ROVER,
      requiredInstruments: [
        ScientificInstrument.MASS_SPECTROMETER,
        ScientificInstrument.GAS_CHROMATOGRAPH,
        ScientificInstrument.SEISMOMETER,
      ],
      minPayloadMassKg: 850,
      maxPayloadMassKg: 2000,
      minPowerWatts: 700,
      minBatteryCapacityWh: 3000,
      communicationBandwidthKbps: 512,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 2800000,
      launchCostCapCredits: 2200000,
    },
    estimatedDurationDays: 2800,
    rewards: {
      credits: 1600000,
      researchData: 1300,
      rawMaterials: 700,
      technologyPoints: 320,
      agencyPrestige: 2200,
    },
    failureConditions: [
      'Rotor blade icing or mechanical seizure in cryogenic methane fog.',
    ],
    completionConditions: [
      'Confirmed multi-hop flight telemetry and tholin molecular analysis received.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Heavy Atmospheric Flight in Low Gravity',
      explanation:
        'With surface air 4 times denser than Earth’s and gravity only 1/7 as strong, a human on Titan could strap wings to their arms and fly. For robotic probes, an octocopter can lift 10 times more science payload than on Earth.',
      realWorldParallel: 'NASA Dragonfly rotorcraft lander mission.',
    },
  },

  // =========================================================================
  // 8. ICE GIANTS (URANUS & NEPTUNE) MISSIONS
  // =========================================================================
  {
    id: 'URANUS_ORBITAL_RECON_01',
    name: 'Titania Deep: Uranus Orbital Insertion & Axial Tilt Study',
    shortCode: 'MSN-URA-01',
    category: MissionCategory.SCIENTIFIC_EXPLORATION,
    summary: 'Travel to the 7th planet to study its 98° tilted magnetic field and icy moon network.',
    description:
      'Execute a deep-space gravity-assist trajectory across 3 billion kilometers to reach Uranus. Insert into orbit around the ice giant to map its anomalous asymmetric magnetic field and fractured moon Titania.',
    destinationId: DestinationId.URANUS,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 7,
    stageType: MissionStageType.INITIAL_RECONNAISSANCE,
    difficulty: MissionDifficulty.EXTREME,
    scientificPurpose:
      'Investigate the dynamo mechanism generating an off-center magnetic field tilted 59 degrees from its rotational axis.',
    mainObjectives: [
      {
        id: 'obj_uranus_uoi',
        title: 'Uranus Orbit Insertion',
        description: 'Capture into ice giant orbit using high-impulse nuclear thermal burn.',
        type: ObjectiveType.ORBITAL_INSERTION,
        isCompleted: false,
      },
      {
        id: 'obj_uranus_magneto',
        title: 'Map Asymmetric Magnetosphere',
        description: 'Record 20 orbits of vector magnetometer data.',
        type: ObjectiveType.SCIENTIFIC_SURVEY,
        targetValue: 20,
        isCompleted: false,
        isExplorationObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 5,
      requiredMissionIds: ['SATURN_RING_SURVEY_01'],
      requiredTechNodeIds: ['tech_deep_space_telemetry_array'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ORBITAL_SURVEYOR,
      payloadType: PayloadType.SCIENCE_INSTRUMENT_PACKAGE,
      requiredInstruments: [
        ScientificInstrument.MAGNETOMETER,
        ScientificInstrument.MULTISPECTRAL_IMAGER,
      ],
      minPayloadMassKg: 1000,
      maxPayloadMassKg: 2500,
      minPowerWatts: 750,
      minBatteryCapacityWh: 3000,
      communicationBandwidthKbps: 128,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 3200000,
      launchCostCapCredits: 2600000,
    },
    estimatedDurationDays: 3800,
    rewards: {
      credits: 1900000,
      researchData: 1500,
      rawMaterials: 800,
      technologyPoints: 380,
      agencyPrestige: 2600,
    },
    failureConditions: [
      'RTG thermal decay exceeding 50% over decade-long transit.',
    ],
    completionConditions: [
      'Complete magnetospheric dataset returned to Earth Deep Space Network.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Ice Giant Interior Mantles & Off-Axis Dynamos',
      explanation:
        'Unlike Jupiter and Saturn, Uranus and Neptune are "Ice Giants" composed primarily of hot, dense fluids of water, methane, and ammonia over a small rocky core. The electric currents generating their magnetic fields flow in shallow convective mantles.',
      realWorldParallel: 'Voyager 2 Uranus flyby (1986) and proposed Uranus Orbiter and Probe.',
    },
  },

  {
    id: 'NEPTUNE_ATMOSPHERIC_PROBE_01',
    name: 'Triton Abyss: Neptune Descent Probe & Cryo-Geyser Survey',
    shortCode: 'MSN-NEP-01',
    category: MissionCategory.TRANSPORTATION,
    summary: 'Deliver a high-velocity atmospheric probe into Neptune’s 2,100 km/h supersonic wind bands.',
    description:
      'The outermost planetary frontier: deliver an atmospheric entry probe into Neptune’s azure atmosphere to measure ammonia-water cloud layers and wind speeds exceeding 2,100 km/h, the fastest recorded in the Solar System.',
    destinationId: DestinationId.NEPTUNE,
    parentDestinationId: DestinationId.SUN,
    sequenceLevel: 7,
    stageType: MissionStageType.TRANSPORTATION,
    difficulty: MissionDifficulty.EXTREME,
    scientificPurpose:
      'Measure noble gas abundances and probe vertical atmospheric convection under intense internal thermal radiation.',
    mainObjectives: [
      {
        id: 'obj_nep_entry',
        title: 'Release Neptune Entry Probe',
        description: 'Separate entry probe on ballistic trajectory with entry speed 24 km/s.',
        type: ObjectiveType.DELIVERY,
        targetValue: 1,
        isCompleted: false,
        isDeliveryObjective: true,
      },
      {
        id: 'obj_nep_telemetry',
        title: 'Relay Deep Atmospheric Telemetry',
        description: 'Receive probe data down to 20 bar depth before crushing destruction.',
        type: ObjectiveType.DATA_COLLECTION,
        targetValue: 20,
        isCompleted: false,
        isDeliveryObjective: true,
      },
    ],
    optionalObjectives: [],
    prerequisites: {
      requiredDirectorRank: 5,
      requiredMissionIds: ['URANUS_ORBITAL_RECON_01'],
      requiredTechNodeIds: ['tech_deep_space_telemetry_array'],
      requiredDestinationUnlocked: true,
    },
    engineeringRequirements: {
      spacecraftType: SpacecraftType.ATMOSPHERIC_ENTRY_PROBE,
      payloadType: PayloadType.ATMOSPHERIC_AEROSHELL,
      requiredInstruments: [
        ScientificInstrument.ATMOSPHERIC_STRUCTURE_PROBE,
        ScientificInstrument.MASS_SPECTROMETER,
      ],
      minPayloadMassKg: 900,
      maxPayloadMassKg: 2400,
      minPowerWatts: 800,
      minBatteryCapacityWh: 3500,
      communicationBandwidthKbps: 128,
      relayRequired: true,
    },
    budget: {
      allocatedCredits: 3600000,
      launchCostCapCredits: 2900000,
    },
    estimatedDurationDays: 4500,
    rewards: {
      credits: 2200000,
      researchData: 1800,
      rawMaterials: 1000,
      technologyPoints: 450,
      agencyPrestige: 3000,
    },
    failureConditions: [
      'Loss of probe relay carrier signal during supersonic descent.',
    ],
    completionConditions: [
      'Noble gas isotope ratios successfully relayed to carrier orbiter and transmitted home.',
    ],
    isReplayable: true,
    educationalContent: {
      coreConcept: 'Supersonic Planetary Winds & Internal Heat Engines',
      explanation:
        'Despite receiving 900 times less sunlight than Earth, Neptune has the most violent winds in the Solar System. This is because Neptune radiates 2.6 times more internal heat than it receives from the Sun, driving energetic atmospheric convection.',
      realWorldParallel: 'Voyager 2 Neptune flyby (1989) and proposed Neptune Odyssey.',
    },
  },
];

export const BUILTIN_MISSIONS: MissionDefinition[] = INITIAL_MISSION_DEFINITIONS;
