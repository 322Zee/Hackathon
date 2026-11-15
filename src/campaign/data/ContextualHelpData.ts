/**
 * INTERSTELLAR CONTINUUM - Contextual Help & Reference Index
 * Searchable encyclopaedia of aerospace mechanics, first-use explanations,
 * tooltips, operational hints, and quick-reference guides.
 */

import { ContextualHelpTopic, TutorialCategory } from '../CampaignTypes';

export const CONTEXTUAL_HELP_TOPICS: ContextualHelpTopic[] = [
  {
    id: 'help_delta_v',
    category: TutorialCategory.ROCKET_ENGINEERING,
    title: 'Delta-V (ΔV) & Orbital Mechanics',
    summary: 'The fundamental currency of spaceflight measuring a vehicle’s ability to change velocity.',
    detailedExplanation:
      'Delta-V (ΔV), expressed in meters per second (m/s), represents the total impulse capacity of a rocket. Reaching Low Earth Orbit (LEO) requires approximately 9,400 m/s of atmospheric delta-V, while reaching lunar orbit demands an additional ~3,100 m/s for Trans-Lunar Injection (TLI).',
    bulletPoints: [
      'Determined by Tsiolkovsky’s rocket equation based on mass ratio and exhaust velocity.',
      'Higher vacuum specific impulse (Isp) produces more ΔV per ton of propellant.',
      'Stage staging sheds empty deadweight, multiplying overall vehicle ΔV.',
    ],
    relatedTutorialId: 'TUT_ROCKET_ENGINEERING',
    tags: ['delta-v', 'staging', 'engines', 'orbital mechanics', 'propulsion'],
  },
  {
    id: 'help_twr',
    category: TutorialCategory.ROCKET_ENGINEERING,
    title: 'Thrust-to-Weight Ratio (TWR)',
    summary: 'The ratio between rocket engine thrust and the gravitational force pulling the vehicle downward.',
    detailedExplanation:
      'A rocket cannot lift off if its Thrust-to-Weight Ratio (TWR) is less than 1.0. An ideal liftoff TWR ranges between 1.25 and 1.60. Too low, and the rocket wastes massive fuel fighting gravity drag; too high, and aerodynamic pressure (Max-Q) can tear the vehicle apart.',
    bulletPoints: [
      'Liftoff TWR must exceed 1.15 to achieve positive acceleration off Pad Alpha.',
      'In orbit, TWR is less critical; low-thrust, high-efficiency engines (like ion drives) excel.',
    ],
    relatedTutorialId: 'TUT_ROCKET_ENGINEERING',
    tags: ['twr', 'thrust', 'mass', 'liftoff', 'pad'],
  },
  {
    id: 'help_first_use_vab',
    category: TutorialCategory.ROCKET_ENGINEERING,
    title: 'First Time in Rocket Engineering',
    summary: 'Quick guide for assembling your first suborbital sounding rocket.',
    detailedExplanation:
      'Welcome to the Vehicle Assembly Building (VAB). Start by selecting a Command & Guidance Core, attach a small solid or liquid propellant fuel tank below it, and add a booster engine. Open the Validation tab to verify flight readiness before wheeling out to Pad Alpha.',
    bulletPoints: [
      'Select parts from the left catalogue panel.',
      'Check TWR and Delta-V in the metrics card.',
      'Green validation badges indicate safe flight configuration.',
    ],
    relatedTutorialId: 'TUT_ROCKET_ENGINEERING',
    tags: ['first-use', 'vab', 'builder', 'assembly'],
  },
  {
    id: 'help_first_use_mission_control',
    category: TutorialCategory.MISSION_CONTROL,
    title: 'First Time in Mission Control',
    summary: 'Overview of flight telemetry consoles and active spacecraft tracking.',
    detailedExplanation:
      'Mission Control tracks all spacecraft currently in transit or in active service across the Solar System. Monitor vehicle hull integrity, electrical power bus draw, and Deep Space Network communications carrier lock.',
    bulletPoints: [
      'MET displays Mission Elapsed Time since pad liftoff.',
      'Acknowledge system cautions to prevent cascaded avionics failures.',
      'Check RF delay time when dispatching commands to deep space.',
    ],
    relatedTutorialId: 'TUT_MISSION_CONTROL',
    tags: ['first-use', 'telemetry', 'rf', 'flight control'],
  },
  {
    id: 'help_dsn_communications',
    category: TutorialCategory.MISSION_CONTROL,
    title: 'Deep Space Communications & Occultation',
    summary: 'Maintaining telemetry and science downlinks across interplanetary distances.',
    detailedExplanation:
      'Electromagnetic signals travel at the speed of light, introducing transmission latency when communicating with Mars or the outer planets. Spacecraft passing behind planets experience signal occultation until clear line-of-sight is re-established.',
    bulletPoints: [
      'Deploying orbital relay satellites eliminates planetary blackout zones.',
      'High-gain antennas amplify science downlink fidelity multipliers up to 2.5x.',
    ],
    relatedTutorialId: 'TUT_MISSION_CONTROL',
    tags: ['communications', 'dsn', 'latency', 'relays'],
  },
  {
    id: 'help_rover_science',
    category: TutorialCategory.PLANETARY_EXPLORATION,
    title: 'Robotic Rover Operations & Sampling',
    summary: 'Navigating surface terrain and extracting extraterrestrial scientific samples.',
    detailedExplanation:
      'Planetary rovers enable direct surface ground-truth exploration. Drive carefully across hazardous terrain to prevent chassis tipping. Use core drill samplers to gather mineral cores and transmit discovery packets to Earth.',
    bulletPoints: [
      'Monitor rover battery reserve; avoid driving during local night without RTGs.',
      'Surface discoveries earn prestige and bonus research data.',
    ],
    relatedTutorialId: 'TUT_PLANETARY_EXPLORATION',
    tags: ['rover', 'surface', 'mars', 'moon', 'drill'],
  },
  {
    id: 'help_finances_and_prestige',
    category: TutorialCategory.ORGANISATION_MANAGEMENT,
    title: 'Managing Finances & Agency Prestige',
    summary: 'Balancing development expenditures with commercial contract revenues.',
    detailedExplanation:
      'Every rocket part has an acquisition cost, and launches incur facility staging fees. Successfully delivering commercial payloads provides credits, while high flight evaluation scores boost Agency Prestige, which unlocks government funding grants.',
    bulletPoints: [
      'Keep actual launch costs under budget caps to earn fiscal surplus bonuses.',
      'Higher prestige attracts lucrative high-tier commercial customers.',
    ],
    relatedTutorialId: 'TUT_ORGANISATION_MANAGEMENT',
    tags: ['budget', 'credits', 'prestige', 'finance'],
  },
];
