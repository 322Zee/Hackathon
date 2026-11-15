/**
 * INTERSTELLAR CONTINUUM - Interactive Tutorial Definitions
 * Authoritative tutorial guides across all 7 canonical operational categories.
 * Strictly covers gameplay systems that exist in the codebase.
 */

import { TutorialCategory, TutorialDefinition } from '../CampaignTypes';

export const TUTORIAL_DEFINITIONS: TutorialDefinition[] = [
  // 1. HEADQUARTERS
  {
    id: 'TUT_HEADQUARTERS',
    category: TutorialCategory.HEADQUARTERS,
    title: 'Headquarters Navigation & Campus Operations',
    subtitle: 'Directing Ground Operations and Accessing Facilities',
    description: 'Learn how to navigate the aerospace campus, interact with buildings, and monitor organization telemetry.',
    estimatedMinutes: 3,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'hq_step_movement',
        stepIndex: 1,
        title: 'Campus Traversal',
        subtitle: 'Movement Controls & Sprinting',
        instruction: 'Use W/A/S/D or Arrow Keys to move your Flight Director character across the campus plaza.',
        details: [
          'Hold SHIFT to sprint across long distances between launch complexes.',
          'The minimap in the top right shows your relative coordinates and nearby facility gates.',
        ],
        suggestedActionLabel: 'Walk across the central plaza',
        highlightElement: 'CampusMinimap',
      },
      {
        id: 'hq_step_entering_buildings',
        stepIndex: 2,
        title: 'Entering Campus Facilities',
        subtitle: 'Proximity Interaction System',
        instruction: 'Approach any facility entrance and press E (or ENTER) to open that department’s operational interface.',
        details: [
          'Mission Operations: Manage contracts and dispatch flights.',
          'Rocket Engineering: Assemble and validate launch vehicles.',
          'Launch Complex Pad Alpha: Fuel, prepare, and launch rockets.',
        ],
        suggestedActionLabel: 'Press E near a facility entrance',
        highlightElement: 'FAC_MISSION_OPERATIONS',
      },
      {
        id: 'hq_step_organisation_status',
        stepIndex: 3,
        title: 'Monitoring Organisation Health',
        subtitle: 'Resource Wallet & Director Rank HUD',
        instruction: 'Observe the top HUD bar displaying Credits (₵), Research Data, Raw Materials, and Technology Points.',
        details: [
          'Credits pay for vehicle fabrication, launch operations, and facility upgrades.',
          'Research Data collected from flight sensors unlocks nodes in the R&D Center.',
          'Your Director Rank unlocks larger rocket mass classes and interplanetary mission tiers.',
        ],
        suggestedActionLabel: 'Review top resource counters',
        highlightElement: 'GlobalHUD',
      },
    ],
  },

  // 2. ROCKET ENGINEERING
  {
    id: 'TUT_ROCKET_ENGINEERING',
    category: TutorialCategory.ROCKET_ENGINEERING,
    title: 'Vehicle Engineering & Staging',
    subtitle: 'Vehicle Assembly Building (VAB) Construction Protocols',
    description: 'Master rocket component selection, staging configuration, physical ratings (TWR, ΔV), and validation rules.',
    estimatedMinutes: 5,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'eng_step_components',
        stepIndex: 1,
        title: 'Rocket Component Categories',
        subtitle: 'Modular Aerospace Subsystems',
        instruction: 'Inspect the component catalogue: Command Pods, Fuel Tanks, Engines, Decouplers, Fairings, and Instruments.',
        details: [
          'Command pods supply avionics guidance and electrical power.',
          'Fuel tanks hold liquid propellant or solid grain oxidizer.',
          'Engines provide thrust but vary greatly between sea-level and vacuum efficiency.',
        ],
        suggestedActionLabel: 'Browse Component Catalogue',
        highlightElement: 'ComponentCataloguePanel',
      },
      {
        id: 'eng_step_builder_canvas',
        stepIndex: 2,
        title: 'Using the Visual Builder',
        subtitle: 'Assembling Multistage Rockets',
        instruction: 'Attach parts in sequential order from top payload down to booster engines.',
        details: [
          'Place stage decouplers between stages to discard empty propellant tanks.',
          'Add scientific instruments to collect data during flight.',
        ],
        suggestedActionLabel: 'Assemble First Stage',
        highlightElement: 'RocketCanvas',
      },
      {
        id: 'eng_step_fictional_ratings',
        stepIndex: 3,
        title: 'Understanding Physical Ratings',
        subtitle: 'Thrust-to-Weight Ratio (TWR) and Delta-V (ΔV)',
        instruction: 'Ensure Launchpad TWR exceeds 1.20 and total Delta-V satisfies mission requirements.',
        details: [
          'TWR < 1.0 means your rocket is too heavy to lift off the pad.',
          'Vacuum Specific Impulse (Isp) determines fuel efficiency in orbital space.',
        ],
        suggestedActionLabel: 'Verify TWR and Delta-V',
        highlightElement: 'VehicleMetricsCard',
      },
      {
        id: 'eng_step_validation',
        stepIndex: 4,
        title: 'Reviewing Validation Feedback',
        subtitle: 'Engineering Compliance Checks',
        instruction: 'Review the validation panel: all critical errors must be resolved before flight clearance is granted.',
        details: [
          'Checks include: staging legality, fuel feed connections, and center-of-mass stability.',
        ],
        suggestedActionLabel: 'Pass Engineering Validation',
        highlightElement: 'ValidationPanel',
      },
    ],
  },

  // 3. MISSION OPERATIONS
  {
    id: 'TUT_MISSION_OPERATIONS',
    category: TutorialCategory.MISSION_OPERATIONS,
    title: 'Mission Operations & Flight Directives',
    subtitle: 'Selecting Exploration Contracts and Planning Trajectories',
    description: 'Learn how to evaluate mission requirements, destination constraints, and dispatch flight directives.',
    estimatedMinutes: 4,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'mops_step_browsing',
        stepIndex: 1,
        title: 'Browsing Mission Catalogue',
        subtitle: 'Available Exploration Directives',
        instruction: 'Review active contracts: Transportation, Scientific Exploration, and Combined expeditions.',
        details: [
          'Each mission card indicates target destination, difficulty tier, and estimated duration.',
        ],
        suggestedActionLabel: 'Select Mission Card',
        highlightElement: 'MissionCatalogueView',
      },
      {
        id: 'mops_step_requirements',
        stepIndex: 2,
        title: 'Reviewing Constraints & Payload',
        subtitle: 'Engineering & Scientific Directives',
        instruction: 'Check required payload mass, scientific instruments, and minimum delta-V specifications.',
        details: [
          'Failing to mount required instruments will prevent scientific milestone completion.',
        ],
        suggestedActionLabel: 'Read Mission Requirements',
        highlightElement: 'MissionDossierView',
      },
      {
        id: 'mops_step_destination',
        stepIndex: 3,
        title: 'Destination Profiles',
        subtitle: 'Orbital Distance & Communication Latency',
        instruction: 'Inspect destination characteristics: surface gravity, atmospheric density, and communication light-delay.',
        details: [
          'Deep-space missions require relay satellites or high-gain antennas to maintain carrier lock.',
        ],
        suggestedActionLabel: 'Inspect Celestial Body',
        highlightElement: 'DestinationInfoCard',
      },
    ],
  },

  // 4. LAUNCH OPERATIONS
  {
    id: 'TUT_LAUNCH_OPERATIONS',
    category: TutorialCategory.LAUNCH_OPERATIONS,
    title: 'Launch Operations & Flight Monitoring',
    subtitle: 'Pad Alpha Countdown, Liftoff, and Staging Telemetry',
    description: 'Step through launchpad checklists, ignite rocket engines, and monitor trajectory ascent.',
    estimatedMinutes: 3,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'launch_step_preparation',
        stepIndex: 1,
        title: 'Pre-Flight Preparation',
        subtitle: 'Vehicle Checkouts & Propellant Loading',
        instruction: 'Verify propellant load, electrical umbilical integrity, and launchpad clearance.',
        details: [
          'Check weather and range safety before arming ignition systems.',
        ],
        suggestedActionLabel: 'Arm Launch Systems',
        highlightElement: 'LaunchpadControls',
      },
      {
        id: 'launch_step_ignition',
        stepIndex: 2,
        title: 'Countdown & Engine Ignition',
        subtitle: 'Ascent Cinematic & Trajectory Vector',
        instruction: 'Trigger terminal countdown: monitor thrust build-up, liftoff, and pitchover maneuvers.',
        details: [
          'Stage separation events trigger automatically based on propellant burnout.',
        ],
        suggestedActionLabel: 'Initiate Ignition Sequence',
        highlightElement: 'LaunchCountdownTimer',
      },
      {
        id: 'launch_step_monitoring',
        stepIndex: 3,
        title: 'Ascent Progress Monitoring',
        subtitle: 'Altitude, Velocity & Dynamic Pressure',
        instruction: 'Watch velocity vector climb toward orbital insertion speeds (7.8 km/s for LEO).',
        details: [
          'Mission Elapsed Time (MET) begins counting immediately at liftoff.',
        ],
        suggestedActionLabel: 'Monitor Ascent Telemetry',
        highlightElement: 'FlightTelemetryOverlay',
      },
    ],
  },

  // 5. MISSION CONTROL
  {
    id: 'TUT_MISSION_CONTROL',
    category: TutorialCategory.MISSION_CONTROL,
    title: 'Mission Control & Deep Space Telemetry',
    subtitle: 'Monitoring Active Spacecraft Across the Solar System',
    description: 'Read spacecraft health, electrical power generation, communication signals, and handle cautions/anomalies.',
    estimatedMinutes: 4,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'mc_step_telemetry_reading',
        stepIndex: 1,
        title: 'Reading Spacecraft Telemetry',
        subtitle: 'Subsystem Health Gauges',
        instruction: 'Monitor hull structural integrity, battery reserves (EPS), and propellant tank levels.',
        details: [
          'Spacecraft in planetary shadow lose solar power and run entirely on battery reserves.',
        ],
        suggestedActionLabel: 'Review Subsystems Panel',
        highlightElement: 'SubsystemsTelemetryCard',
      },
      {
        id: 'mc_step_comms_and_rf',
        stepIndex: 2,
        title: 'Communications & Signal Margins',
        subtitle: 'RF Carrier Lock & Light Time Delay',
        instruction: 'Verify Deep Space Network carrier lock and signal margin in dBm.',
        details: [
          'Planetary occultation causes temporary signal blackouts until line-of-sight is restored.',
        ],
        suggestedActionLabel: 'Check Communication Link',
        highlightElement: 'CommunicationsCard',
      },
      {
        id: 'mc_step_alerts_and_cautions',
        stepIndex: 3,
        title: 'Alerts, Cautions & Anomalies',
        subtitle: 'Emergency Mitigation Protocols',
        instruction: 'Acknowledge cautions and dispatch mitigation commands when flight computer anomalies occur.',
        details: [
          'Quick mitigation prevents irreversible structural degradation or premature mission aborts.',
        ],
        suggestedActionLabel: 'Acknowledge System Alerts',
        highlightElement: 'AlertsPanel',
      },
    ],
  },

  // 6. PLANETARY EXPLORATION
  {
    id: 'TUT_PLANETARY_EXPLORATION',
    category: TutorialCategory.PLANETARY_EXPLORATION,
    title: 'Planetary Exploration & Science Observations',
    subtitle: 'Surface Rovers, Atmospheric Probes, and Discovery Archives',
    description: 'Operate surface rovers, conduct core drills, and transmit peer-reviewed scientific discoveries.',
    estimatedMinutes: 4,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'exp_step_surface_operations',
        stepIndex: 1,
        title: 'Operating Surface Exploration Vehicles',
        subtitle: 'Robotic Rover Navigation & Hazards',
        instruction: 'Drive rovers across extraterrestrial surfaces, avoiding boulders and steep crater slopes.',
        details: [
          'Rovers consume battery power while moving and recharge via solar arrays or RTGs.',
        ],
        suggestedActionLabel: 'Traverse Alien Terrain',
        highlightElement: 'SurfaceExplorationCanvas',
      },
      {
        id: 'exp_step_science_sampling',
        stepIndex: 2,
        title: 'Scientific Data Sampling',
        subtitle: 'Drilling, Spectroscopy & Imaging',
        instruction: 'Deploy the robotic arm core drill on rock outcrops to collect mineral samples.',
        details: [
          'Raw data packets are analyzed on-site or buffered for downlink to Earth.',
        ],
        suggestedActionLabel: 'Collect Rock Sample',
        highlightElement: 'ScienceSamplingControls',
      },
      {
        id: 'exp_step_discoveries',
        stepIndex: 3,
        title: 'Publishing Planetary Discoveries',
        subtitle: 'Scientific Contribution & Research Yield',
        instruction: 'Downlink discoveries to earn bonus Research Data and advance organizational milestones.',
        details: [
          'Higher signal gain relays amplify data downlink multipliers up to 2.5x.',
        ],
        suggestedActionLabel: 'Downlink Science Data',
        highlightElement: 'ScientificArchivePanel',
      },
    ],
  },

  // 7. ORGANISATION MANAGEMENT
  {
    id: 'TUT_ORGANISATION_MANAGEMENT',
    category: TutorialCategory.ORGANISATION_MANAGEMENT,
    title: 'Organisation Management & Expansion',
    subtitle: 'Budgets, Commercial Contracts, and R&D Tech Trees',
    description: 'Balance mission budgets, expand campus facilities, manage research progress, and advance director rank.',
    estimatedMinutes: 4,
    isCompleted: false,
    isDismissed: false,
    steps: [
      {
        id: 'org_step_financial_budgeting',
        stepIndex: 1,
        title: 'Managing Budgets & Contracts',
        subtitle: 'Fiscal Reserves & Launch Caps',
        instruction: 'Keep launch costs below allocated mission budgets to earn fiscal surplus commendations.',
        details: [
          'Accepting commercial satellite delivery contracts provides steady operational cash flow.',
        ],
        suggestedActionLabel: 'Inspect Financial Ledger',
        highlightElement: 'FinanceOverviewCard',
      },
      {
        id: 'org_step_facility_upgrades',
        stepIndex: 2,
        title: 'Campus Facility Expansion',
        subtitle: 'Level 1 to 5 Facility Scaling',
        instruction: 'Invest credits and raw materials to upgrade facilities, boosting efficiency and unlocks.',
        details: [
          'Upgrading Rocket Engineering unlocks larger assembly bays and higher payload mass caps.',
        ],
        suggestedActionLabel: 'Review Facility Upgrades',
        highlightElement: 'FacilityUpgradePanel',
      },
      {
        id: 'org_step_tech_tree',
        stepIndex: 3,
        title: 'Research & Development Center',
        subtitle: 'Unlocking Advanced Aerospace Technologies',
        instruction: 'Spend Research Data in the R&D Center to unlock ion drives, nuclear thermal rockets, and heatshields.',
        details: [
          'Advanced technologies reduce vehicle mass and unlock missions to the outer gas giants.',
        ],
        suggestedActionLabel: 'Unlock New Technology Node',
        highlightElement: 'TechTreeNodeView',
      },
    ],
  },
];
