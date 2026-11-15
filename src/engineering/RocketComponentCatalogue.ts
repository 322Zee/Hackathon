/**
 * INTERSTELLAR CONTINUUM - Fictional Educational Rocket Component Catalogue
 * Abstract component families with game-balance attributes (mass, thrust, ISP, cost)
 * for vehicle design, component browsing, and engineering staging.
 * NOTE: All values are fictional game-balance parameters, NOT real-world specifications.
 */

import {
  RocketComponentItem,
  RocketComponentFamily,
} from './RocketProjectTypes';

export const INITIAL_ROCKET_COMPONENTS: RocketComponentItem[] = [
  // =========================================================================
  // 1. PROPELLANT TANKS (STRUCTURE & TANKAGE)
  // =========================================================================
  {
    id: 'tank_al_light_100',
    name: 'Al-Li Lightweight Fuselage 100',
    family: RocketComponentFamily.PROPELLANT_TANKS,
    tier: 1,
    massKg: 420,
    costCredits: 8500,
    description: 'Aluminum-lithium alloy tankage optimized for light orbital sounding and upper-stage volume.',
    keySpecs: [
      { label: 'Propellant Capacity', value: '4,500 kg' },
      { label: 'Dry Mass Ratio', value: '1:10.7' },
      { label: 'Diameter', value: '1.8 m' },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'tank_cryo_medium_200',
    name: 'Hydrolox CryoCore-200 Bulkhead',
    family: RocketComponentFamily.PROPELLANT_TANKS,
    tier: 2,
    massKg: 1250,
    costCredits: 22000,
    description: 'Multi-layer vacuum-insulated cryogenic tank suitable for liquid hydrogen and liquid oxygen stages.',
    keySpecs: [
      { label: 'Propellant Capacity', value: '18,000 kg' },
      { label: 'Thermal Boil-Off Shield', value: 'Rating A+' },
      { label: 'Diameter', value: '2.8 m' },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'tank_heavy_isogrid_500',
    name: 'Titan Stiffened Isogrid Core 500',
    family: RocketComponentFamily.PROPELLANT_TANKS,
    tier: 3,
    massKg: 3400,
    costCredits: 58000,
    description: 'Heavy isogrid milled core booster tankage built for multi-engine first-stage clusters.',
    keySpecs: [
      { label: 'Propellant Capacity', value: '65,000 kg' },
      { label: 'Max Axial Load', value: '3,200 kN' },
      { label: 'Diameter', value: '4.2 m' },
    ],
    unlockedByDefault: false,
  },

  // =========================================================================
  // 2. BOOSTER ENGINES (SEA-LEVEL MAIN PROPULSION)
  // =========================================================================
  {
    id: 'eng_merlin_astra_1',
    name: 'Astra-100 Sea-Level Kerolox Engine',
    family: RocketComponentFamily.BOOSTER_ENGINES,
    tier: 1,
    massKg: 650,
    costCredits: 14000,
    description: 'Reliable open-cycle gas generator booster engine offering high sea-level thrust and rapid throttling.',
    keySpecs: [
      { label: 'Sea-Level Thrust', value: '480 kN' },
      { label: 'Vacuum Thrust', value: '540 kN' },
      { label: 'Sea-Level ISP', value: '282 s' },
      { label: 'Gimbal Range', value: '±5.0°' },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'eng_hydro_booster_v2',
    name: 'HydroCore-Sustainer V2',
    family: RocketComponentFamily.BOOSTER_ENGINES,
    tier: 2,
    massKg: 1100,
    costCredits: 34000,
    description: 'High-efficiency staged-combustion engine designed for sustainer core ascent through max-Q.',
    keySpecs: [
      { label: 'Sea-Level Thrust', value: '820 kN' },
      { label: 'Vacuum Thrust', value: '960 kN' },
      { label: 'Vacuum ISP', value: '375 s' },
      { label: 'Gimbal Range', value: '±6.5°' },
    ],
    unlockedByDefault: true,
  },

  // =========================================================================
  // 3. UPPER STAGE VACUUM ENGINES (IN-SPACE INSERTION)
  // =========================================================================
  {
    id: 'eng_vac_orbital_8',
    name: 'Astra-Vac Orbital-8',
    family: RocketComponentFamily.UPPER_STAGE_ENGINES,
    tier: 1,
    massKg: 180,
    costCredits: 11000,
    description: 'Optimized radiation-cooled niobium nozzle extension for orbital circularization and orbital trim.',
    keySpecs: [
      { label: 'Vacuum Thrust', value: '95 kN' },
      { label: 'Vacuum ISP', value: '348 s' },
      { label: 'Restarts Permitted', value: '4 Ignitions' },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'eng_vac_cryo_relight',
    name: 'Selene-RL Cryogenic Relight Unit',
    family: RocketComponentFamily.UPPER_STAGE_ENGINES,
    tier: 2,
    massKg: 310,
    costCredits: 28000,
    description: 'Long-coast high-efficiency cryogenic upper-stage engine for translunar and escape burns.',
    keySpecs: [
      { label: 'Vacuum Thrust', value: '125 kN' },
      { label: 'Vacuum ISP', value: '450 s' },
      { label: 'Restarts Permitted', value: '6 Ignitions' },
    ],
    unlockedByDefault: false,
  },

  // =========================================================================
  // 4. SOLID ROCKET MOTORS (BOOSTER AUGMENTATION)
  // =========================================================================
  {
    id: 'srm_strap_on_50',
    name: 'Starfire SRM-50 Strap-On Booster',
    family: RocketComponentFamily.SOLID_ROCKET_MOTORS,
    tier: 1,
    massKg: 3200,
    costCredits: 9500,
    description: 'Strap-on composite solid rocket booster providing intense initial liftoff impulse with zero boil-off.',
    keySpecs: [
      { label: 'Sea-Level Thrust', value: '620 kN' },
      { label: 'Burn Duration', value: '45 s' },
      { label: 'Specific Impulse', value: '255 s' },
    ],
    unlockedByDefault: true,
  },

  // =========================================================================
  // 5. AERODYNAMICS & FAIRINGS
  // =========================================================================
  {
    id: 'fairing_composite_25',
    name: '2.5m Carbon Composite Payload Fairing',
    family: RocketComponentFamily.AERODYNAMICS_FAIRINGS,
    tier: 1,
    massKg: 360,
    costCredits: 6000,
    description: 'Bi-conic acoustic and aerodynamic shroud with pneumatic clam-shell jettison mechanism.',
    keySpecs: [
      { label: 'Usable Diameter', value: '2.3 m' },
      { label: 'Usable Height', value: '4.5 m' },
      { label: 'Acoustic Dampening', value: '-24 dB' },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'fairing_expanded_38',
    name: '3.8m Expanded Interplanetary Fairing',
    family: RocketComponentFamily.AERODYNAMICS_FAIRINGS,
    tier: 2,
    massKg: 780,
    costCredits: 15000,
    description: 'Bulbous payload shroud accommodates wide solar arrays, rovers, and planetary landers.',
    keySpecs: [
      { label: 'Usable Diameter', value: '3.5 m' },
      { label: 'Usable Height', value: '7.2 m' },
      { label: 'Acoustic Dampening', value: '-28 dB' },
    ],
    unlockedByDefault: false,
  },
  {
    id: 'fins_grid_titanium',
    name: 'Titanium Grid Fin Aerodynamic Control Set',
    family: RocketComponentFamily.AERODYNAMICS_FAIRINGS,
    tier: 1,
    massKg: 120,
    costCredits: 4500,
    description: 'Deployable grid fins providing active control during transonic ascent and booster return.',
    keySpecs: [
      { label: 'Max Control Authority', value: 'Mach 0.8–3.5' },
      { label: 'Actuation Speed', value: '45 deg/sec' },
    ],
    unlockedByDefault: true,
  },

  // =========================================================================
  // 6. STAGING & AVIONICS
  // =========================================================================
  {
    id: 'decoupler_ring_pneumatic_20',
    name: 'Pneumatic Ring Decoupler 2.0m',
    family: RocketComponentFamily.STAGING_AVIONICS,
    tier: 1,
    massKg: 95,
    costCredits: 3800,
    description: 'Clean separation ring using cold-gas pusher pistons with dual-fault-tolerant pyrotechnic release.',
    keySpecs: [
      { label: 'Separation Impulse', value: '15 m/s' },
      { label: 'Debris Generation', value: 'Zero Debris' },
    ],
    unlockedByDefault: true,
  },
  {
    id: 'avionics_flight_computer_v1',
    name: 'Centaur Dual-Core Guidance Computer',
    family: RocketComponentFamily.STAGING_AVIONICS,
    tier: 1,
    massKg: 35,
    costCredits: 12000,
    description: 'Triple-modular redundant flight computer executing inertial navigation and stage sequencing.',
    keySpecs: [
      { label: 'Attitude Resolution', value: '0.01 deg' },
      { label: 'Telemetry Rate', value: '100 Hz' },
    ],
    unlockedByDefault: true,
  },
];
