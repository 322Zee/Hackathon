/**
 * INTERSTELLAR CONTINUUM - Campaign Progression Domain Events
 * Authoritative strongly-typed event contracts emitted across the campaign lifecycle.
 */

import {
  CampaignChapter,
  CampaignObjective,
  TutorialDefinition,
} from './CampaignTypes';

export interface CampaignStartedPayload {
  chapter: number;
  timestamp: number;
}

export interface ChapterUnlockedPayload {
  chapter: CampaignChapter;
  timestamp: number;
}

export interface ChapterCompletedPayload {
  chapter: CampaignChapter;
  nextChapter?: CampaignChapter;
  timestamp: number;
}

export interface ObjectiveProgressUpdatedPayload {
  objective: CampaignObjective;
  previousProgress: number;
  newProgress: number;
  timestamp: number;
}

export interface CampaignObjectiveCompletedPayload {
  objective: CampaignObjective;
  unlockedRewards: CampaignObjective['unlockRewards'];
  chapterCompleted: boolean;
  timestamp: number;
}

export interface TutorialStartedPayload {
  tutorial: TutorialDefinition;
  isReplay: boolean;
  timestamp: number;
}

export interface TutorialCompletedPayload {
  tutorialId: string;
  category: string;
  timestamp: number;
}

export interface TutorialSkippedPayload {
  tutorialId?: string;
  timestamp: number;
}

export interface ContextualHelpViewedPayload {
  topicId: string;
  timestamp: number;
}

export interface CampaignDomainEvents {
  CampaignStarted: CampaignStartedPayload;
  ChapterUnlocked: ChapterUnlockedPayload;
  ChapterCompleted: ChapterCompletedPayload;
  ObjectiveProgressUpdated: ObjectiveProgressUpdatedPayload;
  CampaignObjectiveCompleted: CampaignObjectiveCompletedPayload;
  TutorialStarted: TutorialStartedPayload;
  TutorialCompleted: TutorialCompletedPayload;
  TutorialSkipped: TutorialSkippedPayload;
  ContextualHelpViewed: ContextualHelpViewedPayload;
}
