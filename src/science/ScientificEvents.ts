/**
 * INTERSTELLAR CONTINUUM - Scientific Data Domain Events
 * Strongly typed domain events and payloads dispatched across the scientific data subsystem.
 */

import {
  ScientificFinding,
  ResearchProject,
  AnalysisStatus,
  ResearchProjectStatus,
} from './ScientificTypes';

export interface ScientificFindingRegisteredPayload {
  finding: ScientificFinding;
  timestamp: number;
}

export interface FindingAnalysisStartedPayload {
  findingId: string;
  initialProgress: number;
  timestamp: number;
}

export interface FindingAnalysisCompletedPayload {
  finding: ScientificFinding;
  previousStatus: AnalysisStatus;
  researchPointsGranted: number;
  timestamp: number;
}

export interface ResearchProjectCreatedPayload {
  project: ResearchProject;
  timestamp: number;
}

export interface ResearchProgressUpdatedPayload {
  projectId: string;
  previousProgress: number;
  currentProgress: number;
  status: ResearchProjectStatus;
  timestamp: number;
}

export interface ResearchProjectCompletedPayload {
  project: ResearchProject;
  rewardsGranted: {
    researchData: number;
    technologyPoints: number;
    credits: number;
  };
  unlockedTechIds: string[];
  timestamp: number;
}

/**
 * Mapping of all scientific event names to their typed payloads.
 */
export interface ScientificEvents {
  ScientificFindingRegistered: ScientificFindingRegisteredPayload;
  FindingAnalysisStarted: FindingAnalysisStartedPayload;
  FindingAnalysisCompleted: FindingAnalysisCompletedPayload;
  ResearchProjectCreated: ResearchProjectCreatedPayload;
  ResearchProgressUpdated: ResearchProgressUpdatedPayload;
  ResearchProjectCompleted: ResearchProjectCompletedPayload;
}
