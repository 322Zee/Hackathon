/**
 * INTERSTELLAR CONTINUUM - Initial Onboarding Sequence Definition
 * Authoritative 7-step sequence introducing the player as Mission Director,
 * teaching campus movement, facility infrastructure, Pad Alpha launch complex,
 * and mission architecture concepts.
 */

import {
  TutorialSequenceId,
  TutorialStepId,
  TutorialStep,
  TutorialStepContext,
} from '../TutorialTypes';
import { InputAction } from '../../input/InputAction';
import { FacilityRegistry } from '../../facilities/FacilityRegistry';
import { FacilityId } from '../../facilities/FacilityTypes';
import { InputManager } from '../../input/InputManager';

/**
 * Format key codes nicely (e.g. KeyW -> W, ArrowUp -> ▲ Up, Space -> Space).
 */
export function formatKeyCode(code: string): string {
  if (!code) return 'UNBOUND';
  if (code.startsWith('Key')) return code.substring(3);
  if (code.startsWith('Digit')) return code.substring(5);
  if (code === 'ArrowUp') return '▲ UP';
  if (code === 'ArrowDown') return '▼ DOWN';
  if (code === 'ArrowLeft') return '◀ LEFT';
  if (code === 'ArrowRight') return '▶ RIGHT';
  if (code === 'Escape') return 'ESC';
  return code;
}

/**
 * Retrieve active key labels for an action from InputManager or defaults.
 */
export function getActionKeyLabels(
  action: InputAction,
  inputManager?: InputManager
): string[] {
  if (inputManager) {
    const bindings = inputManager.getBindings();
    const binding = bindings[action];
    if (binding && binding.keys && binding.keys.length > 0) {
      return binding.keys.map(formatKeyCode);
    }
  }

  // Sensible defaults if InputManager is not bound or keys are empty
  switch (action) {
    case InputAction.MoveUp:
      return ['W', '▲ UP'];
    case InputAction.MoveDown:
      return ['S', '▼ DOWN'];
    case InputAction.MoveLeft:
      return ['A', '◀ LEFT'];
    case InputAction.MoveRight:
      return ['D', '▶ RIGHT'];
    case InputAction.Interact:
      return ['E', 'ENTER'];
    case InputAction.Pause:
      return ['ESC'];
    case InputAction.OpenMap:
      return ['M'];
    case InputAction.Confirm:
      return ['SPACE', 'ENTER'];
    case InputAction.Cancel:
      return ['ESC'];
    default:
      return [];
  }
}

/**
 * Builds the complete 7-step Initial Onboarding Sequence.
 * Pulls dynamic descriptions directly from the FacilityRegistry to guarantee consistency.
 */
export function createInitialOnboardingSequence(
  inputManager?: InputManager,
  facilityRegistry?: FacilityRegistry
): TutorialStep[] {
  const registry = facilityRegistry ?? FacilityRegistry.getInstance();

  // Helper to fetch facility purpose safely
  const getFacilitySummary = (id: FacilityId): { name: string; purpose: string } => {
    const rec = registry.getFacility(id);
    if (rec) {
      return { name: rec.name, purpose: rec.purpose || rec.description };
    }
    return { name: id, purpose: 'Operational headquarters facility.' };
  };

  const mocData = getFacilitySummary(FacilityId.MISSION_OPERATIONS);
  const launchData = getFacilitySummary(FacilityId.LAUNCH_COMPLEX_PAD_ALPHA);

  // Dynamic movement keys string (e.g. "W / A / S / D")
  const moveUpKeys = getActionKeyLabels(InputAction.MoveUp, inputManager).join('/');
  const moveLeftKeys = getActionKeyLabels(InputAction.MoveLeft, inputManager).join('/');
  const moveDownKeys = getActionKeyLabels(InputAction.MoveDown, inputManager).join('/');
  const moveRightKeys = getActionKeyLabels(InputAction.MoveRight, inputManager).join('/');
  const interactKeys = getActionKeyLabels(InputAction.Interact, inputManager).join(' / ');
  const pauseKeys = getActionKeyLabels(InputAction.Pause, inputManager).join(' / ');

  const steps: TutorialStep[] = [
    // -----------------------------------------------------------------------
    // STEP 1: ARRIVAL
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_1_ARRIVAL,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 1,
      totalSteps: 7,
      title: 'COMMAND DIRECTIVE // ARRIVAL',
      subtitle: 'WELCOME TO INTERSTELLAR CONTINUUM',
      description:
        'You have assumed command as Mission Director of an independent space exploration organisation. ' +
        'Our objective is to expand humanity into the Solar System. Before our first flight, familiarize yourself with headquarters operations.',
      detailedNotes: [
        'Role: Mission Director & Chief Flight Executive',
        'Headquarters: Earth Aerospace Operations Campus',
        'Initial Objective: Review facilities, inspect launch facilities, and prepare for suborbital operations.',
      ],
      suggestedActions: [
        {
          action: InputAction.Confirm,
          customKeyLabel: 'SPACE / CLICK',
          description: 'Acknowledge Directive and Proceed',
        },
      ],
      highlight: {
        type: 'NONE',
      },
      completionCondition: 'MANUAL_CONFIRM',
      allowSkip: true,
    },

    // -----------------------------------------------------------------------
    // STEP 2: MOVEMENT & INTERACTION
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_2_MOVEMENT,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 2,
      totalSteps: 7,
      title: 'CAMPUS MOBILITY & CONTROLS',
      subtitle: 'SURFACE NAVIGATION TELEMETRY',
      description:
        `Navigate the campus using [${moveUpKeys}, ${moveLeftKeys}, ${moveDownKeys}, ${moveRightKeys}]. ` +
        `Approach building entrances, interactive consoles, or info kiosks and press [${interactKeys}] to open facility interfaces. ` +
        `Press [${pauseKeys}] at any time to pause operations or adjust settings.`,
      detailedNotes: [
        `Move: [${moveUpKeys}, ${moveLeftKeys}, ${moveDownKeys}, ${moveRightKeys}]`,
        `Interact: [${interactKeys}] when near interactive objects`,
        `Pause Menu: [${pauseKeys}] to freeze simulation and review controls`,
      ],
      suggestedActions: [
        {
          action: InputAction.MoveUp,
          customKeyLabel: `${moveUpKeys}/${moveLeftKeys}/${moveDownKeys}/${moveRightKeys}`,
          description: 'Walk across the campus plaza',
        },
        {
          action: InputAction.Interact,
          customKeyLabel: interactKeys,
          description: 'Interact with nearby consoles',
        },
      ],
      highlight: {
        type: 'NONE',
      },
      completionCondition: 'PLAYER_MOVED',
      autoProgressCheck: (context: TutorialStepContext) => {
        return context.playerMovedDistance >= 120;
      },
      allowSkip: true,
    },

    // -----------------------------------------------------------------------
    // STEP 3: CAMPUS EXPLORATION
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_3_CAMPUS_EXPLORATION,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 3,
      totalSteps: 7,
      title: 'CAMPUS LAYOUT & ORIENTATION',
      subtitle: 'QUADRANT INFRASTRUCTURE',
      description:
        'The aerospace campus is structured into specialized zones. ' +
        `Head south along the central promenade toward the ${mocData.name}, the operational command hub for flight telemetry and Solar System missions.`,
      detailedNotes: [
        'Central Promenade connects the Arrival Gate to the Science and Engineering wings.',
        `South Hub: ${mocData.name}`,
        'East Perimeter: Vehicle Assembly Building (VAB) and Pad Alpha Launch Complex.',
        'North Quad: Planetary Research, Deep Space Laboratory, and R&D Centers.',
      ],
      suggestedActions: [
        {
          customKeyLabel: 'APPROACH MOC',
          description: 'Follow waypoint beacon south to Mission Operations Centre',
        },
        {
          action: InputAction.Confirm,
          customKeyLabel: 'SPACE',
          description: 'Continue when ready',
        },
      ],
      highlight: {
        type: 'FACILITY',
        targetId: FacilityId.MISSION_OPERATIONS,
        worldPosition: { x: 1800, y: 1730 },
        radius: 120,
        label: 'MISSION OPERATIONS CENTRE (MOC)',
      },
      completionCondition: 'FACILITY_DISCOVERED',
      autoProgressCheck: (context: TutorialStepContext) => {
        // Distance to MOC entrance (1800, 1730) < 180
        const dx = context.playerX - 1800;
        const dy = context.playerY - 1730;
        return Math.hypot(dx, dy) < 180;
      },
      allowSkip: true,
    },

    // -----------------------------------------------------------------------
    // STEP 4: FACILITY DISCOVERY
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_4_FACILITY_DISCOVERY,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 4,
      totalSteps: 7,
      title: 'FACILITY ARCHITECTURE',
      subtitle: 'ORGANISATIONAL CAPABILITIES OVERVIEW',
      description:
        'Our organisation operates 10 specialized headquarters installations. ' +
        'Each facility houses future engineering, scientific research, manufacturing, and financial systems required for solar exploration.',
      detailedNotes: [
        `1. ${getFacilitySummary(FacilityId.MISSION_OPERATIONS).name}: Flight planning and orbital tracking.`,
        `2. ${getFacilitySummary(FacilityId.ROCKET_ENGINEERING).name}: Rocket staging, propulsion, and assembly.`,
        `3. ${getFacilitySummary(FacilityId.SPACECRAFT_LAB).name}: Satellite buses, landers, and scientific payloads.`,
        `4. ${getFacilitySummary(FacilityId.RESEARCH_DEVELOPMENT).name}: Propulsion and materials research tech tree.`,
        `5. ${getFacilitySummary(FacilityId.FINANCE_ADMIN).name}: Agency budgets, commercial contracts, and grants.`,
        `6. ${getFacilitySummary(FacilityId.MANUFACTURING_CENTRE).name}: Component fabrication and alloy processing.`,
        `7. ${getFacilitySummary(FacilityId.ROBOTICS_CENTRE).name}: Autonomous rover and sample return mechanisms.`,
        `8. ${getFacilitySummary(FacilityId.COMMUNICATIONS_CENTRE).name}: Deep Space Network parabolic antenna array.`,
        `9. ${getFacilitySummary(FacilityId.PLANETARY_DATA_CENTRE).name}: Celestial bodies database and cartography.`,
        `10. ${getFacilitySummary(FacilityId.SETTINGS_ADMIN).name}: Central Plaza administrative and settings portal.`,
      ],
      suggestedActions: [
        {
          action: InputAction.Confirm,
          customKeyLabel: 'SPACE',
          description: 'Acknowledge Facility Capabilities',
        },
      ],
      highlight: {
        type: 'NONE',
      },
      completionCondition: 'MANUAL_CONFIRM',
      allowSkip: true,
    },

    // -----------------------------------------------------------------------
    // STEP 5: LAUNCH COMPLEX
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_5_LAUNCH_COMPLEX,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 5,
      totalSteps: 7,
      title: 'PAD ALPHA LAUNCH COMPLEX',
      subtitle: 'SURFACE LAUNCH INFRASTRUCTURE',
      description:
        `Located on the eastern campus perimeter, ${launchData.name} serves as our active orbital launch pad. ` +
        'Launches require a completed rocket stage stack, certified spacecraft payload, and cleared flight weather. Launches cannot be initiated without an active flight manifest.',
      detailedNotes: [
        'Flame trench, umbilical service tower, and acoustic water sound suppression system.',
        'High-security perimeter prevents unauthorized access during vehicle rollout.',
        'Integrated with the Vehicle Assembly Building (VAB) via heavy crawlerway transport.',
      ],
      suggestedActions: [
        {
          customKeyLabel: 'INSPECT PAD',
          description: 'Follow waypoint beacon east to Pad Alpha Launch Complex',
        },
        {
          action: InputAction.Confirm,
          customKeyLabel: 'SPACE',
          description: 'Proceed to Mission Planning',
        },
      ],
      highlight: {
        type: 'FACILITY',
        targetId: FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
        worldPosition: { x: 2850, y: 1850 },
        radius: 160,
        label: 'PAD ALPHA LAUNCH COMPLEX',
      },
      completionCondition: 'LAUNCH_APPROACHED',
      autoProgressCheck: (context: TutorialStepContext) => {
        // Distance to Pad Alpha (2850, 1850) < 260
        const dx = context.playerX - 2850;
        const dy = context.playerY - 1850;
        return Math.hypot(dx, dy) < 260;
      },
      allowSkip: true,
    },

    // -----------------------------------------------------------------------
    // STEP 6: MISSION PREPARATION
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_6_MISSION_PREPARATION,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 6,
      totalSteps: 7,
      title: 'MISSION ARCHITECTURE',
      subtitle: 'FLIGHT OBJECTIVES & SCIENTIFIC MANDATE',
      description:
        'All space missions require four coordinated pillars: Mission Objective, Launch Vehicle Configuration, Spacecraft Payload, and Telemetry Trajectory. ' +
        'Balanced management of agency funds, technology points, and research data ensures sustained exploration across the Solar System.',
      detailedNotes: [
        'Objective: Define mission target (Suborbital sounding, Low Earth Orbit, Lunar flyby).',
        'Vehicle: Stage propellant, engines, and fairings to meet Delta-V requirements.',
        'Payload: Equip solar panels, antennas, science spectrometers, and sensors.',
        'Execution: Monitor launch countdown and real-time orbital trajectory telemetry.',
      ],
      suggestedActions: [
        {
          action: InputAction.Confirm,
          customKeyLabel: 'SPACE',
          description: 'Validate Mission Architecture Guidelines',
        },
      ],
      highlight: {
        type: 'NONE',
      },
      completionCondition: 'MANUAL_CONFIRM',
      allowSkip: true,
    },

    // -----------------------------------------------------------------------
    // STEP 7: FREE EXPLORATION
    // -----------------------------------------------------------------------
    {
      id: TutorialStepId.STEP_7_FREE_EXPLORATION,
      sequenceId: TutorialSequenceId.INITIAL_ONBOARDING,
      stepIndex: 7,
      totalSteps: 7,
      title: 'COMMAND STATUS // ACTIVE',
      subtitle: 'HEADQUARTERS CLEARANCE GRANTED',
      description:
        'Onboarding complete, Director! You now hold full operational clearance. ' +
        'Walk through campus, inspect building portals, review telemetry on your HUD, and prepare our organisation for its first historic launch.',
      detailedNotes: [
        'Campus navigation and building portals remain fully accessible.',
        'Minimap: Press [M] to toggle minimap display.',
        'Pause Menu: Press [ESC] at any time to save or replay this onboarding tutorial.',
      ],
      suggestedActions: [
        {
          action: InputAction.Confirm,
          customKeyLabel: 'SPACE / ENTER',
          description: 'Dismiss and Begin Free Exploration',
        },
      ],
      highlight: {
        type: 'NONE',
      },
      completionCondition: 'MANUAL_CONFIRM',
      allowSkip: true,
    },
  ];

  return steps;
}
