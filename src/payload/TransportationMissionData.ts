/**
 * INTERSTELLAR CONTINUUM - Authoritative Transportation Mission Dataset
 * Authored mission definitions featuring multi-payload transport, orbital and surface
 * delivery specifications, follow-up planetary exploration phases, and educational briefings.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { MissionDifficulty } from '../missions/MissionTypes';
import { TransportationMissionDefinition } from './TransportationMissionTypes';

export const INITIAL_TRANSPORTATION_MISSIONS: TransportationMissionDefinition[] = [
  // =========================================================================
  // 1. EARTH ORBIT: SATELLITE TELECOM TRANSPORT
  // =========================================================================
  {
    id: 'TRANS_LEO_PIONEER_RELAY',
    name: 'Project Vanguard: LEO Telecom Transponder Delivery',
    shortCode: 'TRN-LEO-01',
    destinationId: DestinationId.EARTH_ORBIT_LEO,
    briefing: {
      summary: 'Transport and deploy the Pioneer Orbital Transponder into circular Low Earth Orbit.',
      description:
        'Ground station coverage gaps currently limit continuous flight telemetry during Atlantic overflights. Deliver the Pioneer Orbital Transponder to 250 km altitude to establish the foundation of the Continuum satellite constellation.',
      scientificPurpose:
        'Validate telemetry handoff protocols and low-latency digital voice links between ground control and ascending launch vehicles.',
      educationalConcept:
        'Line-of-Sight Communications: Low Earth Orbit satellites travel at ~7.8 km/s, passing horizon-to-horizon in roughly 10 minutes, necessitating relay constellations for continuous contact.',
      realWorldParallel:
        'NASA Tracking and Data Relay Satellite System (TDRSS) and modern Starlink satellite constellations.',
    },
    requiredPayloads: [
      {
        payloadId: 'payload_sat_pioneer_transponder',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Deploy in circular Low Earth Orbit (200 - 300 km altitude).',
      },
    ],
    deliveryConditions: {
      destinationId: DestinationId.EARTH_ORBIT_LEO,
      targetOrbit: {
        altitudeKmMin: 200,
        altitudeKmMax: 300,
        inclinationDeg: 28.5,
        eccentricityMax: 0.015,
      },
      maxTransitDurationDays: 1,
    },
    missionCost: {
      allocatedCredits: 120000,
      launchCostCapCredits: 95000,
    },
    estimatedDurationDays: 1,
    difficulty: MissionDifficulty.EASY,
    rewards: {
      credits: 160000,
      researchData: 150,
      rawMaterials: 80,
      technologyPoints: 2,
      agencyPrestige: 25,
    },
    unlockRequirements: {
      requiredDirectorRank: 1,
      requiredMissionIds: [],
      requiredTechNodeIds: ['tech_basic_rocketry'],
      requiredDestinationUnlocked: true,
    },
    optionalSecondaryObjectives: [
      {
        id: 'opt_zero_orbital_eccentricity',
        title: 'Precision Circular Insertion',
        description: 'Achieve orbital eccentricity under 0.005 during payload separation.',
        isCompleted: false,
        bonusCredits: 20000,
        bonusPrestige: 10,
      },
    ],
    completionCriteria: [
      'Pioneer Orbital Transponder deployed into Low Earth Orbit',
      'Target altitude maintained between 200 km and 300 km',
      'Two-way telemetry verified',
    ],
    isReplayable: true,
  },

  // =========================================================================
  // 2. LUNAR SURFACE: MULTI-PAYLOAD OUTPOST EXPEDITION (MULTIPLE PAYLOADS)
  // =========================================================================
  {
    id: 'TRANS_LUNAR_BASE_MODULES_01',
    name: 'Artemis Logistics: Lunar Surface Outpost Delivery',
    shortCode: 'TRN-LUNA-02',
    destinationId: DestinationId.MOON,
    briefing: {
      summary:
        'Deliver three distinct infrastructure payloads to the Moon: Kilopower FSP-10 Reactor, Regolith Sintering Printer, and Atmosphere Canisters.',
      description:
        'Establishing the Shackleton Base Camp requires robust electrical generation, additive in-situ manufacturing, and breathable buffer gases. This multi-payload freight mission tests heavy lander payload capacity and multi-manifest mass balancing.',
      scientificPurpose:
        'Commission the first extraterrestrial surface nuclear reactor and demonstrate thermal 3D-printing using native lunar titanium-rich basaltic regolith.',
      educationalConcept:
        'In-Situ Resource Utilisation (ISRU): Bringing everything from Earth is economically prohibitive. Utilizing local surface minerals ($TiO_2$, silicates) drastically reduces mission launch mass.',
      realWorldParallel:
        'NASA Artemis Base Camp architecture and ESA Moon Village additive manufacturing initiatives.',
    },
    requiredPayloads: [
      {
        payloadId: 'payload_pwr_fission_reactor_10',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Soft-landed upright at Shackleton Crater rim rim-flat.',
      },
      {
        payloadId: 'payload_mfg_regolith_sintering_printer',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Touchdown within 200m of planned power grid node.',
      },
      {
        payloadId: 'payload_cargo_life_support_gases',
        requiredQuantity: 2,
        deliveredQuantity: 0,
        conditionDescription: 'Undamaged pressurized canister transfer to habitat depot.',
      },
    ],
    deliveryConditions: {
      destinationId: DestinationId.MOON,
      surfaceLanding: {
        latitude: -89.9,
        longitude: 0.0,
        maxLandingVelocityRating: 3.5, // Fictional landing velocity rating
        hazardClearanceMeters: 50,
      },
      maxTransitDurationDays: 4,
    },
    missionCost: {
      allocatedCredits: 450000,
      launchCostCapCredits: 380000,
    },
    estimatedDurationDays: 4,
    difficulty: MissionDifficulty.HARD,
    rewards: {
      credits: 620000,
      researchData: 650,
      rawMaterials: 450,
      technologyPoints: 6,
      agencyPrestige: 90,
    },
    unlockRequirements: {
      requiredDirectorRank: 2,
      requiredMissionIds: ['TRANS_LEO_PIONEER_RELAY'],
      requiredTechNodeIds: ['tech_heavy_rocketry', 'tech_precision_landing'],
      requiredDestinationUnlocked: true,
    },
    optionalSecondaryObjectives: [
      {
        id: 'opt_zero_landing_damage',
        title: 'Flawless Touchdown Dynamics',
        description: 'Execute touchdown with vertical velocity rating under 1.5 and zero structural damage.',
        isCompleted: false,
        bonusCredits: 50000,
        bonusPrestige: 25,
      },
    ],
    completionCriteria: [
      '1x Kilopower FSP-10 Reactor delivered to Lunar Surface',
      '1x Additive Regolith Sintering Printer delivered to Lunar Surface',
      '2x Pressurized O2/N2 Gas Canisters delivered to Lunar Surface',
      'All cargo confirmed operational upon post-landing diagnostic scan',
    ],
    isReplayable: true,
  },

  // =========================================================================
  // 3. MARS COMBINED MISSION: ROVER DELIVERY + FOLLOW-UP EXPLORATION
  // =========================================================================
  {
    id: 'TRANS_MARS_ROVER_COMBINED_01',
    name: 'Red Frontier: Mars Titan Rover Transport & Jezero Survey',
    shortCode: 'TRN-MARS-03',
    destinationId: DestinationId.MARS,
    briefing: {
      summary:
        'Deliver the Titan Heavy Science Rover and AeroBrake Heatshield to Mars Jezero Crater, followed by a 5 km autonomous geologic survey.',
      description:
        'A comprehensive combined transport and exploration flight: survive interplanetary cruise, execute entry/descent/landing using the AeroBrake shield and SkyCrane, deploy the Titan Rover, and subsequently execute a multi-stop surface exploration survey.',
      scientificPurpose:
        'Investigate deltaic lacustrine clay sediments for organic biosignatures and collect sealed drill core samples.',
      educationalConcept:
        'Atmospheric Entry Deceleration: Mars possesses an atmosphere with only ~1% of Earth surface density—thick enough to burn a spacecraft, but too thin to slow it down without retrorockets.',
      realWorldParallel:
        'NASA Mars 2020 Perseverance Rover and Curiosity Mars Science Laboratory.',
    },
    requiredPayloads: [
      {
        payloadId: 'payload_rover_titan_heavy',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Safely deployed onto Jezero Crater alluvial fan.',
      },
      {
        payloadId: 'payload_land_aeroshell_shield',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Jettisoned after hypersonic atmospheric entry deceleration.',
      },
      {
        payloadId: 'payload_land_skycrane_descent',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Flyaway disposal completed after tether release.',
      },
    ],
    deliveryConditions: {
      destinationId: DestinationId.MARS,
      surfaceLanding: {
        latitude: 18.38,
        longitude: 77.58,
        maxLandingVelocityRating: 2.0,
      },
      environmentalProtectionRequired: ['ATMOSPHERIC_ENTRY', 'RADIATION_HARDENED'],
      maxTransitDurationDays: 210,
    },
    // Follow-up Exploration Objectives: Unlocked ONLY after successful delivery!
    explorationObjectives: [
      {
        id: 'exp_mars_jezero_traversal',
        title: 'Traverse 5 km Across Jezero Delta',
        description: 'Navigate autonomous rover across sedimentary mudstone outcrops.',
        explorationType: 'ROVER_TRAVERSAL',
        targetValue: 5000, // 5000 meters
        currentValue: 0,
        isCompleted: false,
        activeOnlyAfterDelivery: true,
      },
      {
        id: 'exp_mars_core_sample_drill',
        title: 'Acquire 3 Lacustrine Rock Core Samples',
        description: 'Use the rotary percussive drill to collect hermetically sealed sample cores.',
        explorationType: 'SURFACE_SAMPLING',
        targetValue: 3,
        currentValue: 0,
        isCompleted: false,
        activeOnlyAfterDelivery: true,
      },
    ],
    missionCost: {
      allocatedCredits: 850000,
      launchCostCapCredits: 720000,
    },
    estimatedDurationDays: 240,
    difficulty: MissionDifficulty.VERY_HARD,
    rewards: {
      credits: 1250000,
      researchData: 1800,
      rawMaterials: 900,
      technologyPoints: 12,
      agencyPrestige: 220,
    },
    unlockRequirements: {
      requiredDirectorRank: 3,
      requiredMissionIds: ['TRANS_LUNAR_BASE_MODULES_01'],
      requiredTechNodeIds: ['tech_deep_space_propulsion', 'tech_heavy_robotics'],
      requiredDestinationUnlocked: true,
    },
    optionalSecondaryObjectives: [
      {
        id: 'opt_identify_organic_volatiles',
        title: 'Organic Volatile Confirmation',
        description: 'Detect aromatic ring hydrocarbons using onboard Raman spectrometer.',
        isCompleted: false,
        bonusCredits: 100000,
        bonusPrestige: 50,
      },
    ],
    completionCriteria: [
      'Titan Heavy Science Rover safely landed on Mars Jezero Crater',
      'All delivery support hardware safely accounted for',
      'Rover autonomous drive reaches 5,000 meters traversal goal',
      '3 rock core sample tubes filled and sealed in caching carousel',
    ],
    isReplayable: false,
  },

  // =========================================================================
  // 4. OUTER PLANETS: EUROPA CRYO-DRILL ROVER TRANSPORT & ICE SOUNDING
  // =========================================================================
  {
    id: 'TRANS_EUROPA_CRYO_DRILL_01',
    name: 'Jovian Deep-Ice: Europa Boreas Rover & Radar Transport',
    shortCode: 'TRN-EUR-04',
    destinationId: DestinationId.EUROPA,
    briefing: {
      summary:
        'Deliver the Boreas Cryo-Drill Rover and Hyperion Deep-Radar Sounder to the icy crust of Europa.',
      description:
        'Jupiter’s moon Europa harbors a global subsurface saltwater ocean beneath a 15-25 km ice shell. Deliver specialized cryogenic drilling equipment and deep ground-penetrating radar to measure ice thickness and sample active fractures.',
      scientificPurpose:
        'Direct sampling of cryovolcanic salts and radar tomography of chaotic terrain lenticulae.',
      educationalConcept:
        'Tidal Heating: Gravitational orbital resonances between Io, Europa, and Ganymede continuously flex Europa’s rocky interior, maintaining liquid oceans billions of kilometers from the Sun.',
      realWorldParallel:
        'ESA Juice, NASA Europa Clipper, and future proposed Europa Lander concept studies.',
    },
    requiredPayloads: [
      {
        payloadId: 'payload_rover_boreas_cryo_drill',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Landed intact on ridged chaos terrain.',
      },
      {
        payloadId: 'payload_inst_subsurface_radar',
        requiredQuantity: 1,
        deliveredQuantity: 0,
        conditionDescription: 'Integrated into surface telemetry transmitter array.',
      },
    ],
    deliveryConditions: {
      destinationId: DestinationId.EUROPA,
      surfaceLanding: {
        latitude: 9.6,
        longitude: 271.8,
        maxLandingVelocityRating: 1.8,
      },
      environmentalProtectionRequired: ['CRYOGENIC_STABLE', 'RADIATION_HARDENED'],
      maxTransitDurationDays: 950,
    },
    explorationObjectives: [
      {
        id: 'exp_europa_ice_core_drill',
        title: 'Thermal Drill 100m Subsurface Ice Core',
        description: 'Melt through surface radiation crust and retrieve pristine cryogenic ice.',
        explorationType: 'SURFACE_SAMPLING',
        targetValue: 100,
        currentValue: 0,
        isCompleted: false,
        activeOnlyAfterDelivery: true,
      },
    ],
    missionCost: {
      allocatedCredits: 1400000,
      launchCostCapCredits: 1100000,
    },
    estimatedDurationDays: 1000,
    difficulty: MissionDifficulty.EXTREME,
    rewards: {
      credits: 2200000,
      researchData: 3500,
      rawMaterials: 1600,
      technologyPoints: 20,
      agencyPrestige: 400,
    },
    unlockRequirements: {
      requiredDirectorRank: 4,
      requiredMissionIds: ['TRANS_MARS_ROVER_COMBINED_01'],
      requiredTechNodeIds: ['tech_cryo_exploration', 'tech_nuclear_electric'],
      requiredDestinationUnlocked: true,
    },
    optionalSecondaryObjectives: [],
    completionCriteria: [
      'Boreas Cryo-Drill Rover delivered to Europa Surface',
      'Hyperion Subsurface Radar Sounder deployed',
      'Subsurface ice penetration objective completed',
    ],
    isReplayable: false,
  },
];
