/**
 * INTERSTELLAR CONTINUUM - Campaign Progression & Onboarding Contracts
 * Authoritative types, interfaces, and schemas for the 8-chapter narrative campaign,
 * data-driven objectives, 7-category interactive tutorials, contextual help index,
 * and persistent player progression states.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { FacilityId } from '../facilities/FacilityTypes';

/**
 * 8 Authoritative Campaign Chapters
 */
export enum CampaignChapterId {
  CHAPTER_1_PROJECT_GENESIS = 1,
  CHAPTER_2_LUNAR_INITIATIVE = 2,
  CHAPTER_3_EXPANDING_ORGANISATION = 3,
  CHAPTER_4_MARS_EXPEDITION = 4,
  CHAPTER_5_INNER_SOLAR_SYSTEM = 5,
  CHAPTER_6_ASTEROID_EXPLORATION = 6,
  CHAPTER_7_OUTER_SOLAR_SYSTEM = 7,
  CHAPTER_8_OUTER_FRONTIER = 8,
}

/**
 * Campaign Objective Status
 */
export enum CampaignObjectiveStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

/**
 * Objective Categories
 */
export enum CampaignObjectiveCategory {
  ORGANISATION = 'ORGANISATION',
  ENGINEERING = 'ENGINEERING',
  MISSION_FLIGHT = 'MISSION_FLIGHT',
  SCIENCE_RESEARCH = 'SCIENCE_RESEARCH',
  FACILITY_UPGRADE = 'FACILITY_UPGRADE',
  EXPLORATION = 'EXPLORATION',
}

/**
 * Data-Driven Campaign Objective Contract
 */
export interface CampaignObjective {
  id: string;
  chapter: number;
  category: CampaignObjectiveCategory;
  title: string;
  description: string;
  guidanceText?: string;
  completionConditions: string[];
  prerequisites: string[]; // IDs of preceding objectives that must be complete
  isOptional: boolean;
  isMilestone: boolean;
  status: CampaignObjectiveStatus;
  currentProgress: number; // 0 - 100%
  targetValue: number;
  currentValue: number;
  unitLabel?: string;
  associatedMissionIds?: string[];
  associatedFacilityIds?: FacilityId[];
  associatedTechIds?: string[];
  associatedDestinationIds?: DestinationId[];
  unlockRewards: {
    credits?: number;
    researchData?: number;
    rawMaterials?: number;
    technologyPoints?: number;
    agencyPrestige?: number;
    unlockedMissionIds?: string[];
    unlockedFacilityIds?: FacilityId[];
  };
  completedTimestamp?: number;
}

/**
 * Campaign Chapter Definition
 */
export interface CampaignChapter {
  number: number;
  id: CampaignChapterId;
  codename: string;
  title: string;
  subtitle: string;
  synopsis: string;
  briefingDirectives: string[];
  keyDestinations: DestinationId[];
  primaryMissions: string[];
  unlocked: boolean;
  completed: boolean;
  unlockedTimestamp?: number;
  completedTimestamp?: number;
  requiredPrecedingChapter?: number;
}

/**
 * 7 Authoritative Tutorial Categories
 */
export enum TutorialCategory {
  HEADQUARTERS = 'HEADQUARTERS',
  ROCKET_ENGINEERING = 'ROCKET_ENGINEERING',
  MISSION_OPERATIONS = 'MISSION_OPERATIONS',
  LAUNCH_OPERATIONS = 'LAUNCH_OPERATIONS',
  MISSION_CONTROL = 'MISSION_CONTROL',
  PLANETARY_EXPLORATION = 'PLANETARY_EXPLORATION',
  ORGANISATION_MANAGEMENT = 'ORGANISATION_MANAGEMENT',
}

/**
 * Individual Interactive Tutorial Step
 */
export interface InteractiveTutorialStep {
  id: string;
  stepIndex: number;
  title: string;
  subtitle: string;
  instruction: string;
  details?: string[];
  suggestedActionLabel?: string;
  highlightElement?: string;
  autoCompleteEvent?: string;
}

/**
 * Full Tutorial Definition
 */
export interface TutorialDefinition {
  id: string;
  category: TutorialCategory;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  steps: InteractiveTutorialStep[];
  isCompleted: boolean;
  isDismissed: boolean;
  completedTimestamp?: number;
}

/**
 * Contextual Help Topic
 */
export interface ContextualHelpTopic {
  id: string;
  category: TutorialCategory | 'GENERAL';
  title: string;
  summary: string;
  detailedExplanation: string;
  bulletPoints?: string[];
  relatedTutorialId?: string;
  relatedSystemRoute?: string;
  tags: string[];
}

/**
 * First-Time User Experience (FTUE) Introduction Content
 */
export interface NarrativeIntroductionStory {
  prologueTitle: string;
  organisationName: string;
  directorMandate: string;
  originSummary: string;
  resourceConstraints: string;
  solarSystemVision: string;
  longTermGoal: string;
  callToAction: string;
}

/**
 * Player Tutorial & Onboarding Preferences
 */
export interface TutorialPreferences {
  tutorialsEnabled: boolean;
  showContextualHints: boolean;
  autoDisplayFirstUseHelp: boolean;
  showKeybindHints: boolean;
  highContrastHighlights: boolean;
}

export const DEFAULT_TUTORIAL_PREFERENCES: TutorialPreferences = {
  tutorialsEnabled: true,
  showContextualHints: true,
  autoDisplayFirstUseHelp: true,
  showKeybindHints: true,
  highContrastHighlights: true,
};

export interface ExplorationJournalEntry {
  timestamp: number;
  chapter: number;
  title: string;
  summary: string;
}

/**
 * Comprehensive Persistent Campaign State
 */
export interface CampaignState {
  schemaVersion: number;
  hasStarted: boolean;
  hasCompletedNarrativeIntro: boolean;
  narrativeIntroSkipped: boolean;
  currentChapter: number;
  unlockedChapters: number[];
  completedChapters: number[];
  completedMilestoneIds: string[];
  objectives: Record<string, {
    status: CampaignObjectiveStatus;
    currentProgress: number;
    currentValue: number;
    completedTimestamp?: number;
  }>;
  activeTutorialId: string | null;
  activeTutorialStepIndex: number;
  completedTutorialIds: string[];
  skippedTutorialIds: string[];
  replayedTutorialIds: string[];
  viewedHelpTopicIds: string[];
  dismissedHelpTopicIds: string[];
  viewedFirstUseTopics: string[];
  tutorialPreferences: TutorialPreferences;
  lastActiveTimestamp: number;
  lastSavedTimestamp?: number;
  explorationJournal: ExplorationJournalEntry[];
}

export function createInitialCampaignState(): CampaignState {
  return {
    schemaVersion: 1,
    hasStarted: true,
    hasCompletedNarrativeIntro: false,
    narrativeIntroSkipped: false,
    currentChapter: 1,
    unlockedChapters: [1],
    completedChapters: [],
    completedMilestoneIds: [],
    objectives: {},
    activeTutorialId: null,
    activeTutorialStepIndex: 0,
    completedTutorialIds: [],
    skippedTutorialIds: [],
    replayedTutorialIds: [],
    viewedHelpTopicIds: [],
    dismissedHelpTopicIds: [],
    viewedFirstUseTopics: [],
    tutorialPreferences: { ...DEFAULT_TUTORIAL_PREFERENCES },
    lastActiveTimestamp: Date.now(),
    lastSavedTimestamp: Date.now(),
    explorationJournal: [],
  };
}

/**
 * High-Level Campaign Overview DTO for UI Presentation
 */
export interface CampaignOverview {
  currentChapter: CampaignChapter;
  allChapters: CampaignChapter[];
  activeObjectives: CampaignObjective[];
  completedObjectivesCount: number;
  totalObjectivesCount: number;
  campaignProgressPercentage: number;
  nextMilestoneTitle?: string;
  availableExplorationOpportunities: DestinationId[];
  completedMilestones: string[];
  journalEntries: ExplorationJournalEntry[];
}

/**
 * Tutorial Status Info DTO
 */
export interface TutorialStatusInfo {
  tutorialId: string;
  category: TutorialCategory;
  title: string;
  isCompleted: boolean;
  completed: boolean;
  isAvailable: boolean;
  available: boolean;
  isActive: boolean;
  active: boolean;
  isSkipped: boolean;
  skipped: boolean;
  currentStepIndex: number;
  totalSteps: number;
}
