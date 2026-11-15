/**
 * INTERSTELLAR CONTINUUM - Mission Results Domain Events
 * Authoritative event payloads emitted across the evaluation lifecycle.
 */

import {
  MissionResultRecord,
  MissionRewardSummary,
  OrganisationalMilestone,
} from './ResultsTypes';

export interface MissionEvaluationStartedPayload {
  missionId: string;
  missionName: string;
  timestamp: number;
}

export interface MissionEvaluationCompletedPayload {
  resultId: string;
  missionId: string;
  score: number;
  grade: string;
  timestamp: number;
}

export interface MissionResultsGeneratedPayload {
  result: MissionResultRecord;
  timestamp: number;
}

export interface MissionRewardsGrantedPayload {
  missionId: string;
  resultId: string;
  rewards: MissionRewardSummary;
  timestamp: number;
}

export interface MissionAchievementUnlockedPayload {
  milestone: OrganisationalMilestone;
  missionId: string;
  timestamp: number;
}

export interface MissionHistoryUpdatedPayload {
  totalArchived: number;
  latestResultId?: string;
  timestamp: number;
}

export interface ResultsDomainEvents {
  MissionEvaluationStarted: MissionEvaluationStartedPayload;
  MissionEvaluationCompleted: MissionEvaluationCompletedPayload;
  MissionResultsGenerated: MissionResultsGeneratedPayload;
  MissionRewardsGranted: MissionRewardsGrantedPayload;
  MissionAchievementUnlocked: MissionAchievementUnlockedPayload;
  MissionHistoryUpdated: MissionHistoryUpdatedPayload;
}
