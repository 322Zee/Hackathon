/**
 * INTERSTELLAR CONTINUUM - Default Facility Definitions
 * Authoritative registry dataset for all 10 Headquarters Facilities,
 * Pad Alpha Launch Complex, and Arrival Gate.
 */

import { InteractionCategory } from '../interaction/InteractionTypes';
import {
  FacilityId,
  FacilityCategory,
  FacilityAvailabilityState,
  FutureGameplaySystem,
  FacilityRecord,
} from './FacilityTypes';
import { SceneId } from '../scenes/SceneId';

export const INITIAL_FACILITY_RECORDS: Record<string, FacilityRecord> = {
  // =========================================================================
  // 1. MISSION OPERATIONS CENTRE
  // =========================================================================
  [FacilityId.MISSION_OPERATIONS]: {
    id: FacilityId.MISSION_OPERATIONS,
    name: 'Mission Operations Centre (MOC)',
    shortCode: 'MOC-01',
    department: 'FLIGHT DYNAMICS & MISSION CONTROL',
    category: FacilityCategory.MISSION_CONTROL,
    interactionCategory: InteractionCategory.MISSION_CONSOLE,
    worldPosition: { x: 1800, y: 1850 },
    entrancePosition: { x: 1800, y: 1730 },
    width: 380,
    height: 220,
    description:
      'The central coordination nexus for all active spaceflights. The MOC manages flight paths, orbital telemetry, Capcom communications, and solar exploration planning.',
    purpose:
      'The central location for selecting missions, reviewing mission objectives, managing destinations, and planning exploration operations across the Solar System.',
    iconName: 'MISSION_CONTROL',
    accentColor: 0x00e5ff,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.MISSION_OPERATIONS,
    futureSystemDescription:
      'Coordinates mission briefings, Solar System destination charting, orbital timelines, and active mission tracking.',
    futureCapabilities: [
      'Mission Selection & Launch Manifest Creation',
      'Solar System Orbital Navigation & Destination Planner',
      'Telemetry Downlink & Real-time Trajectory Telemetry',
      'Mission Objective Tracking & Milestone Validation',
    ],
    destinationSceneId: SceneId.MISSION_OPERATIONS,
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Deep Space Flight Operations Center',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'FLIGHT STATUS', value: 'GREEN // MONITORING LEO', highlight: true },
      { label: 'PRIMARY DSN RELAY', value: 'CANBERRA / GOLDSTONE LINK', highlight: false },
      { label: 'LAUNCH READINESS', value: 'GO FOR COUNTDOWN', highlight: true },
    ],
  },

  // =========================================================================
  // 2. ROCKET ENGINEERING FACILITY
  // =========================================================================
  [FacilityId.ROCKET_ENGINEERING]: {
    id: FacilityId.ROCKET_ENGINEERING,
    name: 'Rocket Engineering Facility (VAB)',
    shortCode: 'VAB-01',
    department: 'LAUNCH VEHICLE INTEGRATION & PROPULSION',
    category: FacilityCategory.ENGINEERING,
    interactionCategory: InteractionCategory.BUILDING,
    worldPosition: { x: 2750, y: 1050 },
    entrancePosition: { x: 2750, y: 1210 },
    width: 440,
    height: 280,
    description:
      'Heavy-duty industrial high-bay Vehicle Assembly Building equipped with multi-axis gantry cranes, hydrostatic test rigs, and staging integration bays.',
    purpose:
      'Design, assemble, inspect, and validate launch vehicles prior to transport and rollout to the launchpad.',
    iconName: 'ROCKET_ENGINEERING',
    accentColor: 0xf59e0b,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.ROCKET_ENGINEERING,
    futureSystemDescription:
      'Multi-stage rocket construction, propulsion sizing, propellant mass fraction balancing, and aerodynamics validation.',
    futureCapabilities: [
      'Multi-Stage Launch Vehicle CAD Staging Bay',
      'Propulsion Engineering: Liquid, Solid & Hybrid Engines',
      'Delta-V Calculation, TWR & Atmospheric Drag Analysis',
      'Booster Recovery, Heat Shields & Avionics Integration',
    ],
    destinationSceneId: SceneId.ROCKET_ENGINEERING,
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Heavy-Lift Assembly Bay',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'HIGH-BAY CRANE CAPACITY', value: '150 METRIC TONS', highlight: false },
      { label: 'ACTIVE STACK', value: 'ORBITAL-I LIGHT LAUNCH VEHICLE', highlight: true },
      { label: 'TRANSFER RAIL', value: 'DUAL-GAUGE TO PAD ALPHA', highlight: true },
    ],
  },

  // =========================================================================
  // 3. SPACECRAFT AND SATELLITE LABORATORY
  // =========================================================================
  [FacilityId.SPACECRAFT_LAB]: {
    id: FacilityId.SPACECRAFT_LAB,
    name: 'Spacecraft & Satellite Laboratory',
    shortCode: 'SAT-01',
    department: 'PAYLOAD INTEGRATION & CLEANROOM',
    category: FacilityCategory.LABORATORY,
    interactionCategory: InteractionCategory.RESEARCH,
    worldPosition: { x: 650, y: 450 },
    entrancePosition: { x: 650, y: 565 },
    width: 320,
    height: 200,
    description:
      'ISO Class 5 certified positive-pressure cleanroom equipped with acoustic vibration tables, thermal-vacuum chambers, and solar simulator arrays.',
    purpose:
      'Develop satellites, orbiters, landers, probes, scientific instruments, and specialized spacecraft modules.',
    iconName: 'SPACECRAFT_LAB',
    accentColor: 0x60a5fa,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.SPACECRAFT_LABORATORY,
    futureSystemDescription:
      'Modular spacecraft bus design, scientific payload fitting, power budgets, and thermal management.',
    futureCapabilities: [
      'Satellite Bus Architecture (CubeSat, SmallSat, Deep Space Probe)',
      'Scientific Sensor Packages (Spectrometers, Magnetometers, Radar)',
      'Power Architecture: Solar Arrays, Fuel Cells & RTG Generators',
      'Payload Fairing Integration & Cleanroom Separation Testing',
    ],
    destinationSceneId: SceneId.SPACECRAFT_LABORATORY,
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Deep Space Autonomy Cleanroom',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'AIRLOCK OVERPRESSURE', value: '+35 Pa POSITIVE PRESSURE', highlight: true },
      { label: 'THERMAL VAC CHAMBER', value: 'CHAMBER ALPHA: ACTIVE', highlight: false },
      { label: 'PAYLOAD INTERFACE', value: '0.9m STANDARD ADAPTER', highlight: false },
    ],
  },

  // =========================================================================
  // 4. RESEARCH AND DEVELOPMENT CENTRE
  // =========================================================================
  [FacilityId.RESEARCH_DEVELOPMENT]: {
    id: FacilityId.RESEARCH_DEVELOPMENT,
    name: 'Research & Development Centre',
    shortCode: 'R&D-01',
    department: 'ADVANCED PROPULSION & MATERIALS SCIENCE',
    category: FacilityCategory.RESEARCH,
    interactionCategory: InteractionCategory.RESEARCH,
    worldPosition: { x: 1800, y: 420 },
    entrancePosition: { x: 1800, y: 540 },
    width: 360,
    height: 210,
    description:
      'Advanced research facility investigating regenerative cooling, aerospike nozzles, carbon nanotube composites, and magnetoplasmadynamic drives.',
    purpose:
      'Conduct cutting-edge research, develop new aerospace technologies, and improve agency engineering capabilities.',
    iconName: 'RESEARCH_DEVELOPMENT',
    accentColor: 0xa855f7,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.RESEARCH_DEVELOPMENT,
    futureSystemDescription:
      'Multi-tiered Technology Tree, Research Data accumulation, Technology Point spending, and research projects.',
    futureCapabilities: [
      'Comprehensive Aerospace Technology Tree Progression',
      'Research Data Translation into Usable Engineering Blueprints',
      'Propulsion Innovation: Methane-LOX, Aerospike & Nuclear Thermal',
      'Advanced Metallurgy & Carbon-Fiber Cryotank Optimization',
    ],
    destinationSceneId: 'FAC_RESEARCH_DEVELOPMENT_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Quantum Materials & Propulsion Lab',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'DATA THROUGHPUT', value: '+15% REVERBERATION INDEX', highlight: true },
      { label: 'SUPERCOMPUTING CLUSTER', value: 'ONLINE // TRAJECTORY OPT', highlight: false },
      { label: 'REGISTERED PATENTS', value: '28 PROPRIETARY DESIGNS', highlight: true },
    ],
  },

  // =========================================================================
  // 5. FINANCE AND ADMINISTRATION
  // =========================================================================
  [FacilityId.FINANCE_ADMIN]: {
    id: FacilityId.FINANCE_ADMIN,
    name: 'Finance & Administration Centre',
    shortCode: 'ADM-01',
    department: 'AGENCY GOVERNANCE & CONTRACT MANAGEMENT',
    category: FacilityCategory.ADMINISTRATION,
    interactionCategory: InteractionCategory.BUILDING,
    worldPosition: { x: 480, y: 920 },
    entrancePosition: { x: 480, y: 1030 },
    width: 280,
    height: 190,
    description:
      'Executive governance wing housing the Mission Director office, corporate treasury ledgers, government grant negotiators, and personnel recruitment.',
    purpose:
      'Manage organisation finances, funding, expenses, staff, commercial grants, contracts, and strategic investments.',
    iconName: 'FINANCE_ADMIN',
    accentColor: 0x10b981,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.FINANCE_ADMINISTRATION,
    futureSystemDescription:
      'Balance Mission Credits, negotiate high-value satellite deployment contracts, allocate operational budgets, and manage agency staff.',
    futureCapabilities: [
      'Agency Financial Ledger & Mission Credits Treasury',
      'Commercial Satellite & Scientific Grant Contracts',
      'Staff Payroll, Personnel Hiring & Training Programs',
      'Insurance Policies & Risk Underwriting for High-Stakes Launches',
    ],
    destinationSceneId: 'FAC_FINANCE_ADMIN_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Global Commercial Space Syndicate',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'TREASURY BALANCE', value: '1,250,000 CREDITS // NOMINAL', highlight: true },
      { label: 'COMMERCIAL CONTRACTS', value: '3 PROPOSALS PENDING REVIEW', highlight: false },
      { label: 'AGENCY PRESTIGE', value: 'RANK 1: INDEPENDENT VENTURE', highlight: true },
    ],
  },

  // =========================================================================
  // 6. RESOURCE AND MANUFACTURING CENTRE
  // =========================================================================
  [FacilityId.MANUFACTURING_CENTRE]: {
    id: FacilityId.MANUFACTURING_CENTRE,
    name: 'Resource & Manufacturing Centre',
    shortCode: 'MFG-01',
    department: 'ADVANCED MACHINING & PROPELLANT SYNTHESIS',
    category: FacilityCategory.MANUFACTURING,
    interactionCategory: InteractionCategory.MANUFACTURING,
    worldPosition: { x: 2750, y: 420 },
    entrancePosition: { x: 2750, y: 535 },
    width: 360,
    height: 200,
    description:
      'Automated production floor with multi-axis CNC milling centers, selective laser melting 3D metal printers, and cryo-distillation propellant plants.',
    purpose:
      'Manage materials, inventory, production, component manufacturing, and facility construction.',
    iconName: 'MANUFACTURING_CENTRE',
    accentColor: 0xf97316,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.RESOURCE_MANUFACTURING,
    futureSystemDescription:
      'Refine Raw Materials into aerospace alloys, manufacture standardized rocket components, and streamline supply chains.',
    futureCapabilities: [
      'Raw Materials Inventory (Inconel, Titanium, Carbon Composites)',
      'Automated Production Queue for Thrust Chambers & Nozzles',
      'Propellant Synthesis: Liquid Oxygen, RP-1, Liquid Methane, LH2',
      'Recycling & Scrappage of Expended or Recovered Hardware',
    ],
    destinationSceneId: 'FAC_MANUFACTURING_CENTRE_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Automated Additive Foundry',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'ALLOY INVENTORY', value: 'INCONEL-718 & AL-LI ALLOY', highlight: false },
      { label: 'FABRICATION QUEUE', value: 'NOZZLE EXPANSION CONES', highlight: true },
      { label: 'RETENTION EFFICIENCY', value: '94.2% MATERIAL UTILIZATION', highlight: true },
    ],
  },

  // =========================================================================
  // 7. ROBOTICS AND EXPLORATION CENTRE
  // =========================================================================
  [FacilityId.ROBOTICS_CENTRE]: {
    id: FacilityId.ROBOTICS_CENTRE,
    name: 'Robotics & Exploration Centre',
    shortCode: 'ROB-01',
    department: 'AUTONOMOUS ROVERS & SURFACE PROBES',
    category: FacilityCategory.ROBOTICS,
    interactionCategory: InteractionCategory.PLANETARY_EQUIPMENT,
    worldPosition: { x: 650, y: 1950 },
    entrancePosition: { x: 650, y: 1835 },
    width: 320,
    height: 200,
    description:
      'Robotics testing hangar featuring a 600m² simulated lunar and Martian regolith obstacle course, mechanical arm test stands, and hazard vision rigs.',
    purpose:
      'Develop and manage robotic exploration systems for surface operations on the Moon, Mars, and extraterrestrial bodies.',
    iconName: 'ROBOTICS_CENTRE',
    accentColor: 0xeab308,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.ROBOTICS_EXPLORATION,
    futureSystemDescription:
      'Engineer autonomous rovers, robotic sampling arms, hazard detection sensors, drills, and surface exploration hardware.',
    futureCapabilities: [
      'Modular Rover Chassis Engineering (Rocker-Bogie, Wheels, Tracks)',
      'Robotic Arm Integration & Surface Soil Sampling Drills',
      'Autonomous Pathfinding AI & Hazard Avoidance Navigation',
      'Extreme-Environment Surface Survival Systems & RTG Power',
    ],
    destinationSceneId: 'FAC_ROBOTICS_CENTRE_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Planetary Autonomous Rover Bay',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'REGOLITH YARD', value: 'ACTIVE SIMULATION TEST BED', highlight: true },
      { label: 'ROVER PROTOTYPE', value: 'TERRA-EXPLORER MK II', highlight: true },
      { label: 'AUTONOMOUS AI', value: 'LEVEL 4 HAZARD MITIGATION', highlight: false },
    ],
  },

  // =========================================================================
  // 8. COMMUNICATION AND SATELLITE NETWORK CENTRE
  // =========================================================================
  [FacilityId.COMMUNICATIONS_CENTRE]: {
    id: FacilityId.COMMUNICATIONS_CENTRE,
    name: 'Communication & Network Centre',
    shortCode: 'COM-01',
    department: 'DEEP SPACE NETWORK & GROUND STATIONS',
    category: FacilityCategory.COMMUNICATIONS,
    interactionCategory: InteractionCategory.EQUIPMENT,
    worldPosition: { x: 1200, y: 1950 },
    entrancePosition: { x: 1200, y: 1845 },
    width: 280,
    height: 180,
    description:
      'Ground control station linked to twin 18-meter parabolic Cassegrain antennae, managing deep-space RF links, orbital relays, and signal modulation.',
    purpose:
      'Monitor communication infrastructure, deployed satellites, ground stations, relay systems, and network coverage.',
    iconName: 'COMMUNICATIONS_CENTRE',
    accentColor: 0x06b6d4,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.COMMUNICATIONS_NETWORK,
    futureSystemDescription:
      'Deploy and calibrate satellite relay constellations, ensure continuous Solar System telemetry coverage, and boost signal gain.',
    futureCapabilities: [
      'Global Ground Station Relay Network Configuration',
      'Interplanetary Communication Delay & Bandwidth Modeling',
      'Orbital Constellation Management (LEO, GEO, Lunar Transfer)',
      'High-Gain Deep Space Downlink & Science Packet Retrieval',
    ],
    destinationSceneId: 'FAC_COMMUNICATIONS_CENTRE_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Interplanetary Quantum DSN Array',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'PRIMARY DISH', value: '18M CASSEGRAIN REFLECTOR', highlight: true },
      { label: 'DATA LINK BUDGET', value: '+14.2 dB GAIN MARGIN', highlight: false },
      { label: 'ORBITAL RELAY', value: 'SYNCHRONIZED // 3 GEO SATS', highlight: true },
    ],
  },

  // =========================================================================
  // 9. PLANETARY RESEARCH AND DATA CENTRE
  // =========================================================================
  [FacilityId.PLANETARY_DATA_CENTRE]: {
    id: FacilityId.PLANETARY_DATA_CENTRE,
    name: 'Planetary Research & Data Centre',
    shortCode: 'PLN-01',
    department: 'ASTROBIOLOGY & GEOLOGICAL COMPENDIUM',
    category: FacilityCategory.PLANETARY_SCIENCE,
    interactionCategory: InteractionCategory.RESEARCH,
    worldPosition: { x: 3300, y: 420 },
    entrancePosition: { x: 3300, y: 535 },
    width: 300,
    height: 200,
    description:
      'Planetary science institute featuring an optical observatory dome, astronomical spectrogram database, and bio-sealed extraterrestrial sample vault.',
    purpose:
      'Analyse scientific observations, planetary images, geological data, atmospheric measurements, and collected research from missions.',
    iconName: 'PLANETARY_DATA_CENTRE',
    accentColor: 0x8b5cf6,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.PLANETARY_DATA,
    futureSystemDescription:
      'Catalogue discoveries, study planetary surface geology and atmospheric spectra, analyze core samples, and uncover Solar System secrets.',
    futureCapabilities: [
      'Celestial Compendium & Planetary Atlas (Atmosphere, Gravity, Terrain)',
      'Scientific Sample Spectrometry & Geological Crystallography',
      'Extraterrestrial Atmosphere Analysis & Biosignature Detection',
      'Research Data Multipliers from Returned Planetary Missions',
    ],
    destinationSceneId: 'FAC_PLANETARY_DATA_CENTRE_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Exoplanetary Bio-Containment Vault',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'OBSERVATORY DOME', value: '0.8M RITCHEY-CHRÉTIEN TELESCOPE', highlight: true },
      { label: 'SURVEYED BODIES', value: 'EARTH, MOON, MARS BASELINE', highlight: false },
      { label: 'SAMPLE VAULT', value: 'CRYOGENIC N2 BIO-SEALED', highlight: true },
    ],
  },

  // =========================================================================
  // 10. SETTINGS AND SYSTEM ADMINISTRATION
  // =========================================================================
  [FacilityId.SETTINGS_ADMIN]: {
    id: FacilityId.SETTINGS_ADMIN,
    name: 'Settings & System Administration',
    shortCode: 'SYS-00',
    department: 'CAMPUS ADMINISTRATION & PREFERENCES',
    category: FacilityCategory.SYSTEM_SETTINGS,
    interactionCategory: InteractionCategory.TERMINAL,
    worldPosition: { x: 1800, y: 1200 },
    entrancePosition: { x: 1800, y: 1260 },
    width: 140,
    height: 100,
    description:
      'Central administrative wayfinding and configuration nexus in the Central Plaza providing direct access to system settings, accessibility, and profiles.',
    purpose:
      'Control the game configuration and organisation-level system preferences.',
    iconName: 'SETTINGS_ADMIN',
    accentColor: 0x00f0ff,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.SYSTEM_ADMINISTRATION,
    futureSystemDescription:
      'Configure graphics quality, display scaling, audio channels, keyboard rebinding, accessibility options, and game save files.',
    futureCapabilities: [
      'Graphics & Display Configuration (Fullscreen, Resolution, VSync)',
      'Master, Music & SFX Audio Volume Channel Mixing',
      'Centralized Keyboard & Gamepad Input Mapping Controls',
      'Game Profile, Save Slot Management & Organization Preferences',
    ],
    destinationSceneId: SceneId.SETTINGS,
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 1,
      upgradeName: 'Campus Administrative Mainframe',
      upgradeStatus: 'COMPLETED',
    },
    specs: [
      { label: 'SYSTEM ACCESS', value: 'ADMINISTRATIVE ACCESS POINT', highlight: true },
      { label: 'CAMPUS NETWORK', value: 'FIBER OPTIC BACKBONE ONLINE', highlight: true },
      { label: 'SYSTEM TIME', value: 'UTC // MISSION CLOCK SYNCHRONIZED', highlight: false },
    ],
  },

  // =========================================================================
  // 11. PHYSICAL LAUNCH COMPLEX (PAD ALPHA)
  // =========================================================================
  [FacilityId.LAUNCH_COMPLEX_PAD_ALPHA]: {
    id: FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
    name: 'Launch Complex Pad Alpha',
    shortCode: 'PAD-01',
    department: 'LAUNCH OPERATIONS & GROUND SUPPORT',
    category: FacilityCategory.LAUNCH_INFRASTRUCTURE,
    interactionCategory: InteractionCategory.LAUNCH_INFRASTRUCTURE,
    worldPosition: { x: 3050, y: 1850 },
    entrancePosition: { x: 2850, y: 1850 },
    width: 480,
    height: 380,
    description:
      'Heavy-duty hexagonal reinforced launch pad with flame exhaust trench, 180px umbilical propellant tower, sound suppression deluge water nozzles, and lightning arrestors.',
    purpose:
      'Physical launchpad and ground operations complex for orbital countdown, propellant fueling, vehicle hold-down checks, and space vehicle launch.',
    iconName: 'LAUNCH_PAD',
    accentColor: 0xef4444,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.LAUNCH_OPERATIONS,
    futureSystemDescription:
      'Launch countdown sequencing, ignition abort thresholds, cryogenic fuel loading, and atmospheric launch trajectory simulation.',
    futureCapabilities: [
      'Launchpad Systems Checkout & Umbilical Boom Release',
      'Cryogenic LOX/RP-1 Fueling Manifolds & Boil-Off Venting',
      'Acoustic Deluge Water Suppression System Activation',
      'Real-time Launch Simulation & Sub-Orbital/Orbital Ascent',
    ],
    destinationSceneId: 'LAUNCH_COMPLEX_CHECKOUT',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 4,
      upgradeName: 'Super-Heavy Orbital Launch Mount',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'PAD STATUS', value: 'ACTIVE // READY FOR ROLLOUT', highlight: true },
      { label: 'PROPELLANT DEPOT', value: 'LOX & RP-1 CRYOMANIFOLDS ONLINE', highlight: true },
      { label: 'DELUGE SUPPRESSION', value: '1.2M LITRES / MINUTE CAPACITY', highlight: false },
      { label: 'SAFETY PERIMETER', value: 'BLAST ZONE RESTRICTED ACCESS', highlight: true },
    ],
  },

  // =========================================================================
  // 12. CAMPUS ARRIVAL & SECURITY GATE
  // =========================================================================
  [FacilityId.ARRIVAL_GATE]: {
    id: FacilityId.ARRIVAL_GATE,
    name: 'Main Campus Arrival & Security',
    shortCode: 'SEC-01',
    department: 'CAMPUS SECURITY & VISITOR LOGISTICS',
    category: FacilityCategory.SECURITY,
    interactionCategory: InteractionCategory.BUILDING,
    worldPosition: { x: 380, y: 1250 },
    entrancePosition: { x: 380, y: 1350 },
    width: 240,
    height: 160,
    description:
      'Primary security checkpoint, vehicular gate, and visitor clearance center controlling access between the external world and the aerospace campus.',
    purpose:
      'Authenticate staff credentials, manage incoming logistical deliveries, and secure campus perimeter boundaries.',
    iconName: 'SECURITY_GATE',
    accentColor: 0x38bdf8,
    availability: FacilityAvailabilityState.OPERATIONAL,
    requiredRank: 0,
    requiredRankTitle: 'RANK 1: INDEPENDENT VENTURE',
    futureSystem: FutureGameplaySystem.CAMPUS_SECURITY,
    futureSystemDescription:
      'Manage security clearances, contractor permits, VIP inspections, and campus surveillance networks.',
    futureCapabilities: [
      'Staff Credential Verification & Identity Manifests',
      'Delivery Screening & Heavy Transport Permitting',
      'Campus Lockdown & Emergency Protocol Sequencing',
    ],
    destinationSceneId: 'FAC_ARRIVAL_GATE_INTERIOR',
    visitState: { visited: false, visitCount: 0 },
    upgradeState: {
      currentTier: 1,
      maxTier: 3,
      upgradeName: 'Automated Biometric Security Gate',
      upgradeStatus: 'NONE',
    },
    specs: [
      { label: 'GATE STATUS', value: 'OPERATIONAL // SECURE', highlight: true },
      { label: 'CLEARANCE REQ', value: 'DIRECTOR / STAFF PASS GRANTED', highlight: false },
      { label: 'SURVEILLANCE', value: '360° AI PERIMETER MONITORING', highlight: true },
    ],
  },
};
