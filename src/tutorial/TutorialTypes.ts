/**
 * INTERSTELLAR CONTINUUM - Tutorial & Onboarding Data Contracts
 * Strongly typed definitions for tutorial sequences, steps, conditions,
 * progress tracking, highlighting, and persistence.
 */

import { InputAction } from '../input/InputAction';

export enum TutorialSequenceId {
  INITIAL_ONBOARDING = 'INITIAL_ONBOARDING',
  MISSION_OPERATIONS = 'TUTORIAL_MISSION_OPERATIONS',
  ROCKET_ENGINEERING = 'TUTORIAL_ROCKET_ENGINEERING',
  SPACECRAFT_LAB = 'TUTORIAL_SPACECRAFT_LAB',
  PLANETARY_EXPLORATION = 'TUTORIAL_PLANETARY_EXPLORATION',
}

export enum TutorialStepId {
  STEP_1_ARRIVAL = 'ONBOARDING_ARRIVAL',
  STEP_2_MOVEMENT = 'ONBOARDING_MOVEMENT',
  STEP_3_CAMPUS_EXPLORATION = 'ONBOARDING_CAMPUS_EXPLORATION',
  STEP_4_FACILITY_DISCOVERY = 'ONBOARDING_FACILITY_DISCOVERY',
  STEP_5_LAUNCH_COMPLEX = 'ONBOARDING_LAUNCH_COMPLEX',
  STEP_6_MISSION_PREPARATION = 'ONBOARDING_MISSION_PREPARATION',
  STEP_7_FREE_EXPLORATION = 'ONBOARDING_FREE_EXPLORATION',
}

export type TutorialCompletionCondition =
  | 'MANUAL_CONFIRM'
  | 'PLAYER_MOVED'
  | 'FACILITY_DISCOVERED'
  | 'LAUNCH_APPROACHED'
  | 'INTERACTION_EXECUTED'
  | 'CUSTOM';

export interface TutorialHighlightTarget {
  type: 'FACILITY' | 'ZONE' | 'POSITION' | 'NONE';
  targetId?: string;
  worldPosition?: { x: number; y: number };
  radius?: number;
  label?: string;
}

export interface TutorialActionPrompt {
  action?: InputAction;
  customKeyLabel?: string;
  description: string;
}

export interface TutorialStepContext {
  playerX: number;
  playerY: number;
  playerMovedDistance: number;
  visitedFacilityCount: number;
  activeTargetId: string | null;
  keysPressed: Set<string>;
}

export interface TutorialStep {
  id: string;
  sequenceId: string;
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  description: string;
  detailedNotes?: string[];
  suggestedActions: TutorialActionPrompt[];
  highlight: TutorialHighlightTarget;
  completionCondition: TutorialCompletionCondition;
  minDurationSeconds?: number;
  autoProgressCheck?: (context: TutorialStepContext) => boolean;
  allowSkip?: boolean;
}

export interface TutorialProgressState {
  schemaVersion: number;
  hasStarted: boolean;
  completedStepIds: string[];
  completedSequenceIds: string[];
  isOnboardingComplete: boolean;
  isSkipped: boolean;
  tutorialsEnabled: boolean;
  activeSequenceId: string | null;
  currentStepIndex: number;
  isDismissed: boolean;
  lastActiveTimestamp: number;
}

export const DEFAULT_TUTORIAL_STATE: TutorialProgressState = {
  schemaVersion: 1,
  hasStarted: false,
  completedStepIds: [],
  completedSequenceIds: [],
  isOnboardingComplete: false,
  isSkipped: false,
  tutorialsEnabled: true,
  activeSequenceId: null,
  currentStepIndex: 0,
  isDismissed: false,
  lastActiveTimestamp: Date.now(),
};
