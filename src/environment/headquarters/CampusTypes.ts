/**
 * INTERSTELLAR CONTINUUM - Headquarters Campus Data Contracts & Facility Metadata
 * Definitive layout constants, building footprints, and landmark coordinates
 */

import { InteractionCategory } from '../../interaction/InteractionTypes';

export interface CampusFacilityData {
  id: string;
  name: string;
  category: InteractionCategory;
  shortCode: string;
  department: string;
  x: number; // Building center X
  y: number; // Building center Y
  width: number;
  height: number;
  entranceX: number;
  entranceY: number;
  description: string;
  specs: Array<{ label: string; value: string; highlight?: boolean }>;
  accentColor: number;
  roofDetails: 'RADOME' | 'SOLAR' | 'CRANE' | 'ANTENNA' | 'DOME' | 'STANDARD';
}

export const CAMPUS_WIDTH = 3600;
export const CAMPUS_HEIGHT = 2400;

export const CAMPUS_FACILITIES: Record<string, CampusFacilityData> = {
  // 1. Arrival & Security Gate (West)
  ARRIVAL_GATE: {
    id: 'FAC_ARRIVAL_GATE',
    name: 'Main Campus Arrival & Security',
    category: InteractionCategory.BUILDING,
    shortCode: 'SEC-01',
    department: 'CAMPUS SECURITY & VISITOR LOGISTICS',
    x: 380,
    y: 1250,
    width: 240,
    height: 160,
    entranceX: 380,
    entranceY: 1350,
    description:
      'Primary security checkpoint and vehicular arrival portico. Staff authentication badges and visitor clearance manifests are processed here.',
    specs: [
      { label: 'STATUS', value: 'OPERATIONAL // SECURE', highlight: true },
      { label: 'CLEARANCE REQUIREMENT', value: 'DIRECTOR / STAFF PASS', highlight: false },
      { label: 'PERIMETER DEFENSE', value: 'SURVEILLANCE & BIOMETRIC GATE', highlight: true },
    ],
    accentColor: 0x38bdf8,
    roofDetails: 'ANTENNA',
  },

  // 2. Central Plaza Kiosk & Wayfinding (Center)
  CENTRAL_PLAZA_KIOSK: {
    id: 'FAC_CENTRAL_PLAZA_KIOSK',
    name: 'Campus Directory & Settings Terminal',
    category: InteractionCategory.TERMINAL,
    shortCode: 'DIR-00',
    department: 'CAMPUS WAYFINDING & ADMINISTRATION',
    x: 1800,
    y: 1200,
    width: 140,
    height: 100,
    entranceX: 1800,
    entranceY: 1260,
    description:
      'Central interactive directory terminal providing full campus maps, department telemetry, and agency system administration access.',
    specs: [
      { label: 'SYSTEM ACCESS', value: 'ADMINISTRATIVE ACCESS POINT', highlight: true },
      { label: 'CAMPUS NETWORK', value: 'FIBER BACKBONE // ACTIVE', highlight: true },
      { label: 'TIME REFERENCE', value: 'UTC // MISSION CLOCK SYNCED', highlight: false },
    ],
    accentColor: 0x00f0ff,
    roofDetails: 'RADOME',
  },

  // 3. Mission Operations Centre (South-Central)
  MISSION_OPERATIONS: {
    id: 'FAC_MISSION_OPERATIONS',
    name: 'Mission Operations Centre (MOC)',
    category: InteractionCategory.MISSION_CONSOLE,
    shortCode: 'MOC-01',
    department: 'FLIGHT DYNAMICS & MISSION CONTROL',
    x: 1800,
    y: 1850,
    width: 380,
    height: 220,
    entranceX: 1800,
    entranceY: 1730,
    description:
      'The beating heart of all active orbital and interplanetary flights. Features main tracking auditorium, flight dynamics stations, and high-frequency communication relays.',
    specs: [
      { label: 'FLIGHT STATUS', value: 'GREEN // MONITORING LEO', highlight: true },
      { label: 'PRIMARY DSN RELAY', value: 'CANBERRA / GOLDSTONE LINK', highlight: false },
      { label: 'LAUNCH READINESS', value: 'GO FOR COUNTDOWN', highlight: true },
    ],
    accentColor: 0x00e5ff,
    roofDetails: 'ANTENNA',
  },

  // 4. Rocket Engineering Facility / VAB (East)
  ROCKET_ENGINEERING: {
    id: 'FAC_ROCKET_ENGINEERING',
    name: 'Rocket Engineering Facility (VAB)',
    category: InteractionCategory.BUILDING,
    shortCode: 'VAB-01',
    department: 'LAUNCH VEHICLE INTEGRATION & PROPULSION',
    x: 2750,
    y: 1050,
    width: 440,
    height: 280,
    entranceX: 2750,
    entranceY: 1210,
    description:
      'High-bay Vehicle Assembly Building where multi-stage launch vehicles are constructed, propellant tanks pressure-tested, and booster engines aligned on overhead crane tracks.',
    specs: [
      { label: 'HIGH-BAY HOIST CAPACITY', value: '150 METRIC TONS', highlight: false },
      { label: 'ACTIVE STACK', value: 'ORBITAL-I LIGHT LAUNCH VEHICLE', highlight: true },
      { label: 'TRANSFER RAIL', value: 'DIRECT TO PAD ALPHA', highlight: true },
    ],
    accentColor: 0xf59e0b,
    roofDetails: 'CRANE',
  },

  // 5. Spacecraft & Satellite Laboratory (North-West)
  SPACECRAFT_LAB: {
    id: 'FAC_SPACECRAFT_LAB',
    name: 'Spacecraft & Satellite Laboratory',
    category: InteractionCategory.RESEARCH,
    shortCode: 'SAT-01',
    department: 'PAYLOAD INTEGRATION & CLEANROOM',
    x: 650,
    y: 450,
    width: 320,
    height: 200,
    entranceX: 650,
    entranceY: 565,
    description:
      'ISO Class 5 certified cleanroom facility dedicated to constructing high-reliability satellites, scientific instruments, deep space probes, and optical sensors.',
    specs: [
      { label: 'AIRLOCK PRESSURE', value: '+35 Pa OVERPRESSURE', highlight: true },
      { label: 'THERMAL VAC CHAMBER', value: 'CHAMBER ALPHA: ACTIVE', highlight: false },
      { label: 'PAYLOAD ATTACHMENT', value: '0.9m STANDARD INTERFACE', highlight: false },
    ],
    accentColor: 0x60a5fa,
    roofDetails: 'SOLAR',
  },

  // 6. Research & Development Centre (North-Central)
  RESEARCH_DEVELOPMENT: {
    id: 'FAC_RESEARCH_DEVELOPMENT',
    name: 'Research & Development Centre',
    category: InteractionCategory.RESEARCH,
    shortCode: 'R&D-01',
    department: 'ADVANCED PROPULSION & MATERIALS SCIENCE',
    x: 1800,
    y: 420,
    width: 360,
    height: 210,
    entranceX: 1800,
    entranceY: 540,
    description:
      'Cutting-edge laboratories investigating regenerative cooling, aerospike nozzles, lightweight carbon composites, and ion propulsion physics.',
    specs: [
      { label: 'TECH TREE ACCELERATION', value: '+15% DATA THROUGHPUT', highlight: true },
      { label: 'SUPERCOMPUTING CLUSTER', value: 'ONLINE // TRAJECTORY OPT', highlight: false },
      { label: 'PATENTS REGISTERED', value: '28 AEROSPACE DESIGNS', highlight: true },
    ],
    accentColor: 0xa855f7,
    roofDetails: 'RADOME',
  },

  // 7. Finance & Administration Building (West-Central)
  FINANCE_ADMIN: {
    id: 'FAC_FINANCE_ADMIN',
    name: 'Finance & Administration Centre',
    category: InteractionCategory.BUILDING,
    shortCode: 'ADM-01',
    department: 'AGENCY GOVERNANCE & CONTRACT MANAGEMENT',
    x: 480,
    y: 920,
    width: 280,
    height: 190,
    entranceX: 480,
    entranceY: 1030,
    description:
      'The administrative headquarters housing executive offices, financial ledgers, commercial space contract negotiators, and public relations.',
    specs: [
      { label: 'CREDIT BALANCE', value: 'FUNDS SECURED // NOMINAL', highlight: true },
      { label: 'COMMERCIAL CONTRACTS', value: '3 PROPOSALS PENDING', highlight: false },
      { label: 'AGENCY PRESTIGE', value: 'RANK 1: INDEPENDENT VENTURE', highlight: true },
    ],
    accentColor: 0x10b981,
    roofDetails: 'STANDARD',
  },

  // 8. Resource & Manufacturing Centre (North-East)
  MANUFACTURING_CENTRE: {
    id: 'FAC_MANUFACTURING_CENTRE',
    name: 'Resource & Manufacturing Centre',
    category: InteractionCategory.MANUFACTURING,
    shortCode: 'MFG-01',
    department: 'ADVANCED MACHINING & PROPELLANT SYNTHESIS',
    x: 2750,
    y: 420,
    width: 360,
    height: 200,
    entranceX: 2750,
    entranceY: 535,
    description:
      'Automated CNC machining shops, electron-beam 3D metal printers, and catalytic chemical synthesis plants manufacturing rocket alloys and specialized components.',
    specs: [
      { label: 'ALLOY INVENTORY', value: 'INCONEL-718 & AL-LI ALLOY', highlight: false },
      { label: 'FABRICATION QUEUE', value: 'NOZZLE EXPANSION CONES', highlight: true },
      { label: 'EFFICIENCY RATING', value: '94.2% MATERIAL RETENTION', highlight: true },
    ],
    accentColor: 0xf97316,
    roofDetails: 'CRANE',
  },

  // 9. Robotics & Exploration Centre (South-West)
  ROBOTICS_CENTRE: {
    id: 'FAC_ROBOTICS_CENTRE',
    name: 'Robotics & Exploration Centre',
    category: InteractionCategory.PLANETARY_EQUIPMENT,
    shortCode: 'ROB-01',
    department: 'AUTONOMOUS ROVERS & SURFACE PROBES',
    x: 650,
    y: 1950,
    width: 320,
    height: 200,
    entranceX: 650,
    entranceY: 1835,
    description:
      'Development hanger for planetary rovers, autonomous robotic sample collectors, Martian drill heads, and extreme-environment suspension systems.',
    specs: [
      { label: 'TEST COURSE STATUS', value: 'REGOLITH YARD ACTIVE', highlight: true },
      { label: 'ROVER PROTOTYPE', value: 'TERRA-EXPLORER MK II', highlight: true },
      { label: 'AUTONOMOUS AI', value: 'LEVEL 4 HAZARD AVOIDANCE', highlight: false },
    ],
    accentColor: 0xeab308,
    roofDetails: 'STANDARD',
  },

  // 10. Communication & Satellite Network Centre (South-West Central)
  COMMUNICATIONS_CENTRE: {
    id: 'FAC_COMMUNICATIONS_CENTRE',
    name: 'Communication & Network Centre',
    category: InteractionCategory.EQUIPMENT,
    shortCode: 'COM-01',
    department: 'DEEP SPACE NETWORK & GROUND STATIONS',
    x: 1200,
    y: 1950,
    width: 280,
    height: 180,
    entranceX: 1200,
    entranceY: 1845,
    description:
      'High-gain parabolic ground station monitoring space communications across S-band, X-band, and Ka-band frequencies. Coordinates multi-dish orbital downlinks.',
    specs: [
      { label: 'PRIMARY DISH', value: '18M CASSEGRAIN REFLECTOR', highlight: true },
      { label: 'DATA LINK BUDGET', value: '+14.2 dB MARGIN', highlight: false },
      { label: 'ORBITAL RELAY', value: 'SYNCHRONIZED // 3 GEO SATS', highlight: true },
    ],
    accentColor: 0x06b6d4,
    roofDetails: 'ANTENNA',
  },

  // 11. Planetary Research & Data Centre (Far North-East)
  PLANETARY_DATA_CENTRE: {
    id: 'FAC_PLANETARY_DATA_CENTRE',
    name: 'Planetary Research & Data Centre',
    category: InteractionCategory.RESEARCH,
    shortCode: 'PLN-01',
    department: 'ASTROBIOLOGY & GEOLOGICAL COMPENDIUM',
    x: 3300,
    y: 420,
    width: 300,
    height: 200,
    entranceX: 3300,
    entranceY: 535,
    description:
      'Scientific archive cataloguing celestial bodies, planetary spectroscopy, atmospheric compositions, and extraterrestrial sample containment.',
    specs: [
      { label: 'OBSERVATORY DOME', value: '0.8M RITCHEY-CHRÉTIEN', highlight: true },
      { label: 'SURVEYED BODIES', value: 'EARTH, MOON, MARS BASELINE', highlight: false },
      { label: 'SAMPLE VAULT', value: 'CRYOGENIC N2 BIO-SEALED', highlight: true },
    ],
    accentColor: 0x8b5cf6,
    roofDetails: 'DOME',
  },

  // 12. Physical Launch Complex (Pad Alpha - South-East)
  LAUNCH_COMPLEX_PAD_ALPHA: {
    id: 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
    name: 'Launch Complex Pad Alpha',
    category: InteractionCategory.LAUNCH_INFRASTRUCTURE,
    shortCode: 'PAD-01',
    department: 'LAUNCH OPERATIONS & GROUND SUPPORT',
    x: 3050,
    y: 1850,
    width: 480,
    height: 380,
    entranceX: 2850,
    entranceY: 1850,
    description:
      'Heavy-duty hexagonal reinforced launch pad with flame deflection trench, umbilical propellant service tower, sound suppression water nozzles, and lightning arrestors.',
    specs: [
      { label: 'PAD STATUS', value: 'ACTIVE // READY FOR ROLLOUT', highlight: true },
      { label: 'PROPELLANT DEPOT', value: 'LOX & RP-1 CRYOMANIFOLDS', highlight: true },
      { label: 'WATER SUPPRESSION', value: '1.2M LITRES / MINUTE', highlight: false },
      { label: 'SAFETY PERIMETER', value: 'BLAST ZONE RESTRICTED', highlight: true },
    ],
    accentColor: 0xef4444,
    roofDetails: 'CRANE',
  },
};
