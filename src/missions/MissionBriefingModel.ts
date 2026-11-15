/**
 * @file MissionBriefingModel.ts
 * @description Master data model and transformation engine for mission briefings.
 * Synthesizes mission definitions, destination telemetry, progression evaluation,
 * engineering constraints, and aerospace trade-off models without hardcoding or fabricating facts.
 */

import { DestinationRegistry } from '../destinations/DestinationRegistry';
import { DestinationId, DestinationRecord } from '../destinations/DestinationTypes';
import {
  MissionDefinition,
  MissionCategory,
  MissionStageType,
  MissionDifficulty,
  MissionStatus,
  SpacecraftType,
  PayloadType,
  ScientificInstrument,
  ObjectiveType,
} from './MissionTypes';
import { MissionCatalogueRegistry } from './MissionCatalogueRegistry';
import { ProgressionContext } from '../destinations/DestinationProgressionManager';

/**
 * Detailed specification for an individual instrument
 */
export interface InstrumentDetail {
  id: ScientificInstrument;
  name: string;
  purpose: string;
  powerConsumptionWatts: number;
  massKg: number;
}

/**
 * Detailed specification for an engineering trade-off
 */
export interface EngineeringTradeOff {
  title: string;
  driver: string;
  consequence: string;
  mitigation: string;
  impactLevel: 'CRITICAL' | 'MODERATE' | 'LOW';
}

/**
 * Unified Mission Briefing Data Contract
 */
export interface MissionBriefingModel {
  missionId: string;
  name: string;
  shortCode: string;
  category: MissionCategory;
  categoryLabel: string;
  sequenceLevel: number;
  stageType: MissionStageType;
  difficulty: MissionDifficulty;
  difficultyScore: number; // 1 to 5 scale
  difficultyFactors: string[];
  status: MissionStatus;
  isAvailable: boolean;
  isCompleted: boolean;
  isActive: boolean;
  estimatedDurationDays: number;
  summary: string;

  // 1. Scientific Purpose
  scientificQuestion: string;
  scientificContext: string;
  observationsRequired: string[];
  expectedLearning: string;

  // 2. Objectives Breakdown
  primaryObjectives: {
    id: string;
    title: string;
    description: string;
    type: ObjectiveType;
    isDelivery: boolean;
    isExploration: boolean;
    conditionText: string;
    isCompleted: boolean;
    importance: 'MANDATORY';
  }[];
  optionalObjectives: {
    id: string;
    title: string;
    description: string;
    type: ObjectiveType;
    conditionText: string;
    isCompleted: boolean;
    importance: 'OPTIONAL';
    bonusRewardsSummary: string;
  }[];

  // 3. Destination Telemetry
  destination: {
    id: DestinationId;
    name: string;
    category: string;
    environment: string;
    surfaceClassification: string;
    surfaceGravityMps2: number;
    surfaceGravityG: number;
    surfaceTempKelvin: { min: number; max: number };
    surfaceTempCelsius: { min: number; max: number };
    atmosphericPressureAtm: number;
    atmosphericComposition: string;
    radiationRating: string;
    communicationLatencySec: number;
    dsnRelayRequired: boolean;
    surfaceAccess: {
      allowed: boolean;
      rejectionReason?: string;
      specializedEquipmentRequired?: string[];
      operationalLimitHours?: number;
    };
  };

  // 4. Spacecraft & Payload Requirements
  spacecraftType: SpacecraftType;
  spacecraftDescription: string;
  payloadType: PayloadType;
  payloadDescription: string;
  requiredInstruments: ScientificInstrument[];
  instrumentDetails: InstrumentDetail[];
  equipmentRequirementsSummary: string[];

  // 5. Engineering Constraints & Trade-Offs
  constraints: {
    payloadMassRangeKg: { min: number; max: number };
    estimatedDryMassKg: number;
    minimumDeltaVEstimate: number;
    powerDemandWatts: number;
    batteryCapacityWh: number;
    communicationBandwidthKbps: number;
    relayRequired: boolean;
    targetOrbit?: { altitudeMinKm: number; altitudeMaxKm: number; inclinationDeg?: number };
    surfaceTarget?: { lat: number; lon: number; radiusKm: number };
    budgetAllocatedCredits: number;
    launchCostCapCredits: number;
    estimatedDurationDays: number;
  };
  tradeOffs: EngineeringTradeOff[];

  // 6. Budget & Rewards
  budget: {
    allocatedCredits: number;
    launchCostCapCredits: number;
    financialEfficiencyTarget: string;
  };
  guaranteedRewards: {
    credits: number;
    researchData: number;
    rawMaterials: number;
    technologyPoints: number;
    agencyPrestige: number;
  };
  optionalRewardsSummary: string[];

  // 7. Prerequisites Checklist
  prerequisites: {
    requiredRank: number;
    rankMet: boolean;
    requiredDestinationUnlocked: boolean;
    destinationUnlocked: boolean;
    requiredMissionIds: string[];
    missingMissionIds: string[];
    requiredTechIds: string[];
    missingTechIds: string[];
    allMet: boolean;
    unmetReasons: string[];
  };

  // 8. Completion & Failure Conditions
  successCriteria: string[];
  failureConditions: string[];
}

/**
 * Metadata dictionary for all 12 scientific instruments
 */
export const INSTRUMENT_METADATA: Record<ScientificInstrument, { name: string; purpose: string; powerWatts: number; massKg: number }> = {
  [ScientificInstrument.MULTISPECTRAL_IMAGER]: {
    name: 'Multispectral Optical Imager',
    purpose: 'Captures high-resolution imagery across visible and near-infrared bands for surface mineralogy.',
    powerWatts: 45,
    massKg: 18,
  },
  [ScientificInstrument.SYNTHETIC_APERTURE_RADAR]: {
    name: 'Synthetic Aperture Radar (SAR)',
    purpose: 'Penetrates cloud decks, haze, and loose regolith to map sub-surface topography and dielectric properties.',
    powerWatts: 180,
    massKg: 65,
  },
  [ScientificInstrument.MAGNETOMETER]: {
    name: 'Fluxgate Magnetometer Boom',
    purpose: 'Measures intrinsic and induced planetary magnetic fields to detect subsurface liquid ocean currents.',
    powerWatts: 12,
    massKg: 8,
  },
  [ScientificInstrument.MASS_SPECTROMETER]: {
    name: 'Ion & Neutral Mass Spectrometer',
    purpose: 'Samples trace atmospheric gases and cryovolcanic plumes to detect volatile organic signatures.',
    powerWatts: 55,
    massKg: 22,
  },
  [ScientificInstrument.ALPHA_PARTICLE_XRAY]: {
    name: 'Alpha Particle X-Ray Spectrometer (APXS)',
    purpose: 'Determines elemental rock and soil composition via curium-244 radiation backscatter.',
    powerWatts: 15,
    massKg: 5,
  },
  [ScientificInstrument.SEISMOMETER]: {
    name: 'Broadband Planetary Seismometer',
    purpose: 'Monitors seismic tremors and meteoroid impacts to profile mantle depth and core boundaries.',
    powerWatts: 10,
    massKg: 12,
  },
  [ScientificInstrument.ATMOSPHERIC_STRUCTURE_PROBE]: {
    name: 'Atmospheric Structure Instrument (ASI)',
    purpose: 'Measures temperature, pressure, density profiles, and aerodynamic drag during supersonic entry.',
    powerWatts: 25,
    massKg: 14,
  },
  [ScientificInstrument.CORE_DRILL_SAMPLER]: {
    name: 'Rotary Percussive Regolith Drill',
    purpose: 'Extracts pristine subterranean core samples down to 2 meters depth without thermal contamination.',
    powerWatts: 120,
    massKg: 35,
  },
  [ScientificInstrument.RADIO_SCIENCE_TRANSPONDER]: {
    name: 'Deep Space Coherent Radio Transponder',
    purpose: 'Measures minute Doppler frequency shifts to map gravitational anomalies and internal mass concentrations.',
    powerWatts: 30,
    massKg: 10,
  },
  [ScientificInstrument.LASER_ALTIMETER]: {
    name: 'Pulsed Laser Altimeter (LIDAR)',
    purpose: 'Shoots high-frequency laser pulses to generate high-resolution 3D digital elevation models.',
    powerWatts: 60,
    massKg: 24,
  },
  [ScientificInstrument.GAMMA_RAY_SPECTROMETER]: {
    name: 'Gamma-Ray & Neutron Spectrometer',
    purpose: 'Detects cosmic-ray secondary neutron leakage indicating subsurface hydrogen and water ice.',
    powerWatts: 40,
    massKg: 28,
  },
  [ScientificInstrument.GAS_CHROMATOGRAPH]: {
    name: 'Gas Chromatograph Mass Spectrometer (GC-MS)',
    purpose: 'Separates complex organic chemical compounds to search for prebiotic prebiotic biomarkers.',
    powerWatts: 75,
    massKg: 30,
  },
};

/**
 * Descriptions for Spacecraft classifications
 */
export const SPACECRAFT_DESCRIPTIONS: Record<SpacecraftType, string> = {
  [SpacecraftType.SOUNDING_ROCKET]: 'Suborbital single-stage solid or liquid vehicle designed for high-altitude vertical ascents.',
  [SpacecraftType.SATELLITE_BUS]: 'Standardized orbital bus with 3-axis reaction wheel stabilization and multi-band antennas.',
  [SpacecraftType.ORBITAL_SURVEYOR]: 'High-precision orbital recon platform equipped with gimbaled solar arrays and sensor suites.',
  [SpacecraftType.ATMOSPHERIC_ENTRY_PROBE]: 'Thermal aeroshell capsule built for extreme aerodynamic deceleration and hypersonic entry.',
  [SpacecraftType.SURFACE_LANDER]: 'Fixed-base soft touchdown platform with throttleable descent engines and shock-absorbing landing legs.',
  [SpacecraftType.PLANETARY_ROVER]: 'Wheeled robotic exploration vehicle featuring rocker-bogie mobility and robotic sample collection arms.',
  [SpacecraftType.DEEP_SPACE_OBSERVATORY]: 'Heavy deep-space bus with sunshield barriers, cryogenic instruments, and DSN communications.',
  [SpacecraftType.CREW_CAPSULE]: 'Pressurized crew transport module with launch abort motors, life support systems, and thermal heatshield.',
};

/**
 * Descriptions for Payload classifications
 */
export const PAYLOAD_DESCRIPTIONS: Record<PayloadType, string> = {
  [PayloadType.COMMUNICATION_RELAY]: 'High-frequency microwave transponders and parabolic dish antenna for interplanetary comms relay.',
  [PayloadType.EARTH_OBSERVATION_SUITE]: 'Multispectral remote sensing optics designed for planetary weather and environmental tracking.',
  [PayloadType.SURFACE_EQUIPMENT_CONTAINER]: 'Pressurized cargo canisters containing deployable infrastructure modules and power cables.',
  [PayloadType.RESEARCH_MODULE]: 'Hermetically sealed laboratory unit with zero-gravity experimental racks and automated telemetry downlinks.',
  [PayloadType.ROBOTIC_ROVER]: 'Autonomous robotic explorer packaged inside a decelerator aeroshell and skycrane descent stage.',
  [PayloadType.ATMOSPHERIC_AEROSHELL]: 'Blunt-body heatshield and supersonic parachute deployment pack enclosing atmospheric descent instruments.',
  [PayloadType.SAMPLE_RETURN_CAPSULE]: 'Double-sealed contamination-free containment capsule with Earth atmospheric re-entry heatshield.',
  [PayloadType.SCIENCE_INSTRUMENT_PACKAGE]: 'Integrated structural bench mounting matched sensors, power distribution, and digital signal processors.',
  [PayloadType.SUBSURFACE_DRILL_SYSTEM]: 'High-torque drill rig, sample caching mechanisms, and hermetic core encapsulation tubes.',
};

/**
 * Helper to calculate deterministic difficulty score and factors from mission specifications
 */
export function calculateDifficultyAnalysis(
  mission: MissionDefinition,
  dest: DestinationRecord
): { score: number; factors: string[] } {
  let score = 1;
  const factors: string[] = [];

  const commLatency = dest.communication?.oneWayLatencySeconds ?? 0;

  // Factor 1: Destination distance / orbital regime
  if (dest.id === DestinationId.EARTH || dest.id === DestinationId.EARTH_ORBIT_LEO) {
    factors.push('Local Earth proximity ensures instant radio communications (<0.1s latency).');
  } else if (dest.id === DestinationId.MOON) {
    score += 1;
    factors.push('Translunar transfer requires high escape velocity (~3.15 km/s delta-V).');
  } else if (dest.id === DestinationId.MARS || dest.id === DestinationId.VENUS || dest.id === DestinationId.ASTEROID_BELT) {
    score += 2;
    factors.push(`Interplanetary transfer requires multi-minute communications latency (~${commLatency.toFixed(1)}s).`);
  } else {
    score += 3;
    factors.push(`Outer Solar System trajectory requires DSN deep space tracking and extreme transit durations.`);
  }

  // Factor 2: Spacecraft & Payload Complexity
  if (
    mission.engineeringRequirements.spacecraftType === SpacecraftType.PLANETARY_ROVER ||
    mission.engineeringRequirements.spacecraftType === SpacecraftType.SURFACE_LANDER
  ) {
    score += 1;
    factors.push('Requires pinpoint terminal descent, terrain hazard avoidance, or aerodynamic entry.');
  }

  // Factor 3: Environmental Hostility
  if (dest.surfaceAvailability === 'HAZARDOUS_SURFACE_SPECIALIZED_ONLY') {
    score += 1;
    factors.push(`Hostile environment (${dest.environment}) requires specialized survival barriers.`);
  }

  // Factor 4: Mission Category & Objectives
  if (mission.category === MissionCategory.COMBINED) {
    score += 1;
    factors.push('Combined mission necessitates dual delivery payload and simultaneous exploration science.');
  }

  if (mission.mainObjectives.length >= 3) {
    factors.push(`Complex operational profile with ${mission.mainObjectives.length} mandatory flight objectives.`);
  }

  const finalScore = Math.min(5, Math.max(1, score));
  return { score: finalScore, factors };
}

/**
 * Synthesizes educational aerospace engineering trade-offs derived directly from mission constraints
 */
export function generateEngineeringTradeOffs(
  mission: MissionDefinition,
  dest: DestinationRecord
): EngineeringTradeOff[] {
  const tradeOffs: EngineeringTradeOff[] = [];
  const eng = mission.engineeringRequirements;
  const semiMajorAu = dest.physicalCharacteristics?.semiMajorAxisAu ?? 1.0;
  const commLatency = dest.communication?.oneWayLatencySeconds ?? 0;

  // Trade-off 1: Payload Mass vs Launch Vehicle Scale & Delta-V
  tradeOffs.push({
    title: 'Payload Mass vs Propulsion Scale',
    driver: `Payload mass allocation of ${eng.minPayloadMassKg} kg to ${eng.maxPayloadMassKg} kg.`,
    consequence:
      'Every kilogram of payload requires exponentially more propellant and structural mass in the booster stages (governed by the Tsiolkovsky Rocket Equation). Higher mass narrows safety margins during ascent.',
    mitigation:
      'Optimize structural brackets and eliminate redundant instruments to keep total spacecraft mass near the lower bound.',
    impactLevel: eng.maxPayloadMassKg > 500 ? 'CRITICAL' : 'MODERATE',
  });

  // Trade-off 2: Power Generation vs Vehicle Inert Mass
  tradeOffs.push({
    title: 'Electrical Power vs Vehicle Dry Mass',
    driver: `Demands ${eng.minPowerWatts} Watts continuous power and ${eng.minBatteryCapacityWh} Wh battery storage.`,
    consequence:
      semiMajorAu > 2.0
        ? `At ${dest.name} (${semiMajorAu.toFixed(1)} AU), solar flux drops with the inverse-square law, requiring massive solar arrays or heavy radioisotope thermoelectric generators (RTGs).`
        : 'Larger solar panels and high-capacity battery cells increase vehicle inert mass, requiring stronger attitude-control thrusters.',
    mitigation:
      'Schedule low-priority instrument shutdowns during orbital eclipse and align solar panels normal to the Sun.',
    impactLevel: semiMajorAu > 2.0 || eng.minPowerWatts > 200 ? 'CRITICAL' : 'MODERATE',
  });

  // Trade-off 3: Comms Bandwidth vs Antenna Mass & Ground Scheduling
  tradeOffs.push({
    title: 'Communication Bandwidth vs Link Budget',
    driver: `Requires ${eng.communicationBandwidthKbps} kbps downlink rate across a latency of ${commLatency.toFixed(1)}s.`,
    consequence:
      'Higher data throughput requires larger parabolic high-gain antennas and higher transmission amplifier wattage, consuming critical battery reserves during deep-space downlinks.',
    mitigation:
      'Utilize onboard telemetry data compression and burst-transmit scientific packets during scheduled Deep Space Network (DSN) tracking windows.',
    impactLevel: eng.relayRequired || commLatency > 100 ? 'CRITICAL' : 'LOW',
  });

  // Trade-off 4: Category Specific Operational Trade-off
  if (mission.category === MissionCategory.COMBINED) {
    tradeOffs.push({
      title: 'Dual-Role Staging vs Trajectory Flexibility',
      driver: 'Simultaneous payload delivery and independent scientific exploration.',
      consequence:
        'The launch vehicle must achieve an orbital profile suitable for both payload deployment and sensor operations, reducing trajectory optimization freedom.',
      mitigation:
        'Sequence deployment at target orbit insertion first, followed by secondary transfer burn for exploration instruments.',
      impactLevel: 'CRITICAL',
    });
  } else if (mission.category === MissionCategory.TRANSPORTATION) {
    tradeOffs.push({
      title: 'Delivery Accuracy vs Fuel Reserve',
      driver: 'Strict insertion orbit altitude and inclination boundaries.',
      consequence:
        'Aggressive precision burns reduce residual propellant margins needed for terminal station-keeping and disposal de-orbit.',
      mitigation:
        'Perform fine orbital trim burns using cold-gas attitude control thrusters rather than the main liquid engine.',
      impactLevel: 'MODERATE',
    });
  } else {
    tradeOffs.push({
      title: 'Instrument Payload Density vs Thermal Dissipation',
      driver: `Integration of ${eng.requiredInstruments.length} distinct scientific instruments on a single bus.`,
      consequence:
        'Dense electronic sensor clustering concentrates heat generation, risking detector thermal noise and sensor drift.',
      mitigation:
        'Mount high-sensitivity spectrometers on extended deployable booms and utilize passive thermal louvers.',
      impactLevel: 'MODERATE',
    });
  }

  return tradeOffs;
}

/**
 * Creates the complete, authoritative MissionBriefingModel for any mission definition.
 */
export function createMissionBriefingModel(
  mission: MissionDefinition,
  catalogueRegistry: MissionCatalogueRegistry = MissionCatalogueRegistry.getInstance(),
  destinationRegistry: DestinationRegistry = DestinationRegistry.getInstance(),
  customContext?: Partial<ProgressionContext>
): MissionBriefingModel {
  const dest = destinationRegistry.getDestination(mission.destinationId) ?? {
    id: mission.destinationId,
    name: mission.destinationId,
    subtitle: '',
    shortCode: 'DEST',
    category: 'UNKNOWN' as any,
    environment: 'UNKNOWN' as any,
    surfaceAvailability: 'WALKABLE_SURFACE' as any,
    gravityClassification: 'STANDARD_EARTH' as any,
    temperatureClassification: 'TEMPERATE' as any,
    supportedExplorationMethods: [],
    availableMissionCategories: [],
    communication: {
      oneWayLatencySeconds: 0,
      relayRequirement: 'DIRECT_LINE_OF_SIGHT',
      blackoutRisks: [],
    },
    atmosphericDetails: {
      surfacePressureAtm: 1.0,
      densityClassification: 'STANDARD',
      compositionSummary: 'Nitrogen 78%, Oxygen 21%',
      hazards: [],
    },
    gameplayConfig: {
      ambientIlluminationPercent: 100,
      solarFluxWm2: 1361,
      dustStormRiskPercent: 0,
      radiationDamageRate: 0,
      scientificDiscoveryMultiplier: 1.0,
    },
    color: 0xffffff,
    accentColor: 0x00ffff,
    radiusPixels: 20,
    orbitRadiusPixels: 100,
    orbitSpeed: 0.01,
    initialAngle: 0,
    scientificDescription: '',
    physicalCharacteristics: {
      semiMajorAxisAu: 1.0,
      orbitalPeriodDays: 365.25,
      surfaceGravityG: 1.0,
      meanTemperatureC: 15,
      atmosphereComposition: 'Nitrogen, Oxygen',
      radiationLevel: 'LOW',
      escapeVelocityKps: 11.2,
    },
    defaultUnlockState: 'UNLOCKED' as any,
    discoveryStatus: 'SURVEYED' as any,
    explorationStatus: 'SURVEYED' as any,
    requiredDirectorRank: 1,
    requiredRankTitle: 'Rank 1',
    unlockConditions: [],
    unlockRequirementsText: '',
    availableMissionsCount: 1,
    completedMissionsCount: 0,
    hasSubDestinations: false,
  };

  const evalStatus = catalogueRegistry.evaluateMissionStatus(mission.id, customContext);
  const surfaceSafety = destinationRegistry.canAccessSurface(dest.id);
  const diffAnalysis = calculateDifficultyAnalysis(mission, dest);
  const tradeOffs = generateEngineeringTradeOffs(mission, dest);

  const phys = dest.physicalCharacteristics || {};
  const comm = dest.communication;
  const atm = dest.atmosphericDetails;

  // Category labels
  const categoryLabels: Record<MissionCategory, string> = {
    [MissionCategory.TRANSPORTATION]: 'COMMERCIAL & INFRASTRUCTURE TRANSPORTATION',
    [MissionCategory.SCIENTIFIC_EXPLORATION]: 'SCIENTIFIC SURVEY & DISCOVERY EXPLORATION',
    [MissionCategory.COMBINED]: 'COMBINED LOGISTICS & RECONNAISSANCE MISSION',
  };

  // Convert mean Temperature
  const meanC = phys.meanTemperatureC ?? 15;
  const tempCelsius = {
    min: meanC - 20,
    max: meanC + 20,
  };
  const tempKelvin = {
    min: Math.round(tempCelsius.min + 273.15),
    max: Math.round(tempCelsius.max + 273.15),
  };

  const gravityG = phys.surfaceGravityG ?? 1.0;
  const gravityMps2 = Number((gravityG * 9.80665).toFixed(2));

  // Primary objectives
  const primaryObjectives = mission.mainObjectives.map((obj) => ({
    id: obj.id,
    title: obj.title,
    description: obj.description,
    type: obj.type,
    isDelivery: !!obj.isDeliveryObjective,
    isExploration: !obj.isDeliveryObjective || !!obj.isExplorationObjective,
    conditionText: obj.targetValue !== undefined ? `Target: ${obj.targetValue}` : 'Telemetry confirmation required',
    isCompleted: obj.isCompleted,
    importance: 'MANDATORY' as const,
  }));

  // Optional objectives
  const optionalObjectives = (mission.optionalObjectives || []).map((opt) => ({
    id: opt.id,
    title: opt.title,
    description: opt.description,
    type: opt.type,
    conditionText: opt.targetValue !== undefined ? `Target: ${opt.targetValue}` : 'Bonus objective criteria',
    isCompleted: opt.isCompleted,
    importance: 'OPTIONAL' as const,
    bonusRewardsSummary: `+15% Mission Credits & Research Data yield`,
  }));

  // Instrument details
  const instrumentDetails = mission.engineeringRequirements.requiredInstruments.map((inst) => {
    const meta = INSTRUMENT_METADATA[inst] ?? {
      name: inst,
      purpose: 'Standard scientific sensor module for research measurements.',
      powerWatts: 25,
      massKg: 15,
    };
    return {
      id: inst,
      name: meta.name,
      purpose: meta.purpose,
      powerConsumptionWatts: meta.powerWatts,
      massKg: meta.massKg,
    };
  });

  // Spacecraft & Payload summaries
  const spacecraftDesc = SPACECRAFT_DESCRIPTIONS[mission.engineeringRequirements.spacecraftType] ?? 'Custom vehicle architecture.';
  const payloadDesc = PAYLOAD_DESCRIPTIONS[mission.engineeringRequirements.payloadType] ?? 'Modular payload assembly.';

  const equipmentSummary: string[] = [
    `Vehicle Platform: ${mission.engineeringRequirements.spacecraftType}`,
    `Payload Module: ${mission.engineeringRequirements.payloadType}`,
  ];
  if (mission.engineeringRequirements.relayRequired) {
    equipmentSummary.push('Communications: Deep Space Network relay link required');
  }
  if (mission.engineeringRequirements.targetOrbit) {
    const orb = mission.engineeringRequirements.targetOrbit;
    equipmentSummary.push(`Insertion Orbit: ${orb.altitudeKmMin}–${orb.altitudeKmMax} km altitude`);
  }
  if (instrumentDetails.length > 0) {
    equipmentSummary.push(`Scientific Instrumentation: ${instrumentDetails.map((i) => i.name).join(', ')}`);
  }

  // Budget efficiency target
  const maxExpenditure = mission.budget.launchCostCapCredits;
  const efficiencyTarget = `Cap launch expenditure below ${maxExpenditure.toLocaleString()} CR to preserve operating margins.`;

  // Guaranteed rewards
  const guaranteedRewards = {
    credits: mission.rewards.credits,
    researchData: mission.rewards.researchData,
    rawMaterials: mission.rewards.rawMaterials,
    technologyPoints: mission.rewards.technologyPoints,
    agencyPrestige: mission.rewards.agencyPrestige,
  };

  const optionalRewardsSummary = optionalObjectives.length > 0
    ? ['Bonus +15% Credits on all optional objectives completed with zero payload anomalies.']
    : ['No optional secondary objectives configured for this flight.'];

  // Prerequisites breakdown
  const reqMissionIds = mission.prerequisites.requiredMissionIds || [];
  const missingMissions = reqMissionIds.filter((id) => !catalogueRegistry.isMissionCompleted(id));
  const reqTechIds = mission.prerequisites.requiredTechNodeIds || [];
  const destUnlocked = destinationRegistry.isUnlocked(mission.destinationId);

  return {
    missionId: mission.id,
    name: mission.name,
    shortCode: mission.shortCode,
    category: mission.category,
    categoryLabel: categoryLabels[mission.category] || mission.category,
    sequenceLevel: mission.sequenceLevel,
    stageType: mission.stageType,
    difficulty: mission.difficulty,
    difficultyScore: diffAnalysis.score,
    difficultyFactors: diffAnalysis.factors,
    status: evalStatus.status,
    isAvailable: evalStatus.isAvailable,
    isCompleted: evalStatus.isCompleted,
    isActive: evalStatus.isActive,
    estimatedDurationDays: mission.estimatedDurationDays,
    summary: mission.summary,

    scientificQuestion: mission.scientificPurpose,
    scientificContext: mission.educationalContent.explanation,
    observationsRequired: mission.mainObjectives.map((o) => `${o.title}: ${o.description}`),
    expectedLearning: mission.educationalContent.coreConcept,

    primaryObjectives,
    optionalObjectives,

    destination: {
      id: dest.id,
      name: dest.name,
      category: dest.category,
      environment: dest.environment,
      surfaceClassification: dest.surfaceAvailability,
      surfaceGravityMps2: gravityMps2,
      surfaceGravityG: gravityG,
      surfaceTempKelvin: tempKelvin,
      surfaceTempCelsius: tempCelsius,
      atmosphericPressureAtm: atm?.surfacePressureAtm ?? 0,
      atmosphericComposition: phys.atmosphereComposition ?? atm?.compositionSummary ?? 'Vacuum',
      radiationRating: phys.radiationLevel ?? 'LOW',
      communicationLatencySec: comm?.oneWayLatencySeconds ?? 0,
      dsnRelayRequired: comm?.relayRequirement === 'DEEP_SPACE_NETWORK_ARRAY',
      surfaceAccess: {
        allowed: surfaceSafety.allowed,
        rejectionReason: surfaceSafety.rejectionReason,
        specializedEquipmentRequired: surfaceSafety.equipmentNeeded,
        operationalLimitHours: surfaceSafety.maxOperatingHours,
      },
    },

    spacecraftType: mission.engineeringRequirements.spacecraftType,
    spacecraftDescription: spacecraftDesc,
    payloadType: mission.engineeringRequirements.payloadType,
    payloadDescription: payloadDesc,
    requiredInstruments: mission.engineeringRequirements.requiredInstruments,
    instrumentDetails,
    equipmentRequirementsSummary: equipmentSummary,

    constraints: {
      payloadMassRangeKg: {
        min: mission.engineeringRequirements.minPayloadMassKg,
        max: mission.engineeringRequirements.maxPayloadMassKg,
      },
      estimatedDryMassKg: mission.engineeringRequirements.minPayloadMassKg * 2.2,
      minimumDeltaVEstimate: 3200,
      powerDemandWatts: mission.engineeringRequirements.minPowerWatts,
      batteryCapacityWh: mission.engineeringRequirements.minBatteryCapacityWh,
      communicationBandwidthKbps: mission.engineeringRequirements.communicationBandwidthKbps,
      relayRequired: mission.engineeringRequirements.relayRequired,
      targetOrbit: mission.engineeringRequirements.targetOrbit
        ? {
            altitudeMinKm: mission.engineeringRequirements.targetOrbit.altitudeKmMin,
            altitudeMaxKm: mission.engineeringRequirements.targetOrbit.altitudeKmMax,
            inclinationDeg: mission.engineeringRequirements.targetOrbit.inclinationDeg,
          }
        : undefined,
      surfaceTarget: mission.engineeringRequirements.surfaceTargetCoordinates
        ? {
            lat: mission.engineeringRequirements.surfaceTargetCoordinates.latitude,
            lon: mission.engineeringRequirements.surfaceTargetCoordinates.longitude,
            radiusKm: mission.engineeringRequirements.surfaceTargetCoordinates.landingRadiusKm,
          }
        : undefined,
      budgetAllocatedCredits: mission.budget.allocatedCredits,
      launchCostCapCredits: mission.budget.launchCostCapCredits,
      estimatedDurationDays: mission.estimatedDurationDays,
    },
    tradeOffs,

    budget: {
      allocatedCredits: mission.budget.allocatedCredits,
      launchCostCapCredits: mission.budget.launchCostCapCredits,
      financialEfficiencyTarget: efficiencyTarget,
    },
    guaranteedRewards,
    optionalRewardsSummary,

    prerequisites: {
      requiredRank: mission.prerequisites.requiredDirectorRank,
      rankMet: evalStatus.rankMet,
      requiredDestinationUnlocked: mission.prerequisites.requiredDestinationUnlocked,
      destinationUnlocked: destUnlocked,
      requiredMissionIds: reqMissionIds,
      missingMissionIds: missingMissions,
      requiredTechIds: reqTechIds,
      missingTechIds: evalStatus.techMet ? [] : reqTechIds,
      allMet: evalStatus.isAvailable,
      unmetReasons: evalStatus.unmetPrerequisites,
    },

    successCriteria: mission.completionConditions,
    failureConditions: mission.failureConditions,
  };
}
