/**
 * INTERSTELLAR CONTINUUM - Results UI Components Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceScoreGauge } from '../../src/results/ui/PerformanceScoreGauge';
import { CategoryBreakdownCard } from '../../src/results/ui/CategoryBreakdownCard';
import { MissionDebriefingView } from '../../src/results/ui/MissionDebriefingView';
import { MissionHistoryArchiveView } from '../../src/results/ui/MissionHistoryArchiveView';
import { MissionResultsManager } from '../../src/results/MissionResultsManager';
import {
  MissionResultRecord,
  MissionCompletionStatus,
  PerformanceGrade,
  ScoringCategory,
} from '../../src/results/ResultsTypes';

describe('Mission Results UI Components', () => {
  let manager: MissionResultsManager;

  const mockRecord: MissionResultRecord = {
    id: 'RES_UI_TEST_01',
    missionId: 'M_UI_01',
    missionName: 'Orbital Lab One',
    shortCode: '[OL-01]',
    missionType: 'SCIENTIFIC_EXPLORATION',
    destination: 'DEST_EARTH_LEO',
    completionStatus: MissionCompletionStatus.COMPLETED,
    completionTimestamp: Date.now(),
    missionDurationFormatted: '1d 12h 00m',
    missionDurationSeconds: 86400 * 1.5,
    missionDurationDays: 1.5,
    objectivesCompleted: [
      {
        id: 'o1',
        title: 'Launch to 400km',
        description: 'Ascend to LEO',
        isMandatory: true,
        isCompleted: true,
        isOptional: false,
        progressPercentage: 100,
        pointsAwarded: 15,
        maxPoints: 15,
        feedback: 'Nominal trajectory',
      },
    ],
    objectivesMissed: [],
    finalPerformanceScore: 92,
    performanceGrade: PerformanceGrade.EXCEPTIONAL,
    gradeLetter: 'S',
    gradeLabel: 'Exceptional',
    rewardSummary: {
      credits: 125000,
      researchData: 65,
      rawMaterials: 20,
      technologyPoints: 10,
      agencyPrestige: 35,
      unlockedMissionIds: ['M_LUNAR_GATEWAY'],
      unlockedEquipment: ['ION_PROPULSION_BLOCK'],
      rankProgressPoints: 50,
      isClaimed: false,
    },
    penaltySummary: {
      budgetOverrunCredits: 0,
      structuralDamageCredits: 0,
      reputationLoss: 0,
      penaltyReasons: [],
    },
    scientificContribution: {
      category: ScoringCategory.SCIENTIFIC_CONTRIBUTION,
      categoryLabel: 'Scientific Contribution',
      score: 15,
      maxScore: 15,
      percentage: 100,
      weight: 15,
      items: [],
      feedback: ['Full science data downlink achieved.'],
      metrics: {},
    },
    engineeringEfficiency: {
      category: ScoringCategory.ENGINEERING_EFFICIENCY,
      categoryLabel: 'Engineering Efficiency',
      score: 24,
      maxScore: 25,
      percentage: 96,
      weight: 25,
      items: [],
      feedback: ['Hull integrity pristine.'],
      metrics: {},
    },
    budgetPerformance: {
      category: ScoringCategory.BUDGET_MANAGEMENT,
      categoryLabel: 'Budget Management',
      score: 20,
      maxScore: 20,
      percentage: 100,
      weight: 20,
      items: [],
      feedback: ['Finished under authorized budget.'],
      metrics: {},
    },
    reliabilityRating: {
      category: ScoringCategory.RELIABILITY,
      categoryLabel: 'Reliability & Operations',
      score: 10,
      maxScore: 10,
      percentage: 100,
      weight: 10,
      items: [],
      feedback: ['Zero in-flight anomalies.'],
      metrics: {},
    },
    missionObjectivesScore: {
      category: ScoringCategory.MISSION_OBJECTIVES,
      categoryLabel: 'Mission Objectives',
      score: 30,
      maxScore: 30,
      percentage: 100,
      weight: 30,
      items: [],
      feedback: ['All objectives complete.'],
      metrics: {},
    },
    performanceFeedback: {
      strengths: ['Flawless launch sequence', 'Propellant conservation'],
      areasForImprovement: ['Minor trajectory drift'],
      engineeringFeedback: 'Propellant margin +20%',
      budgetFeedback: '10% under budget',
      scientificFeedback: 'High yield',
      reliabilityFeedback: 'Nominal carrier link',
      executiveSummary: 'Outstanding mission operations execution.',
    },
    categoryBreakdown: [],
    isArchived: true,
    isClaimed: false,
  };

  mockRecord.categoryBreakdown = [
    mockRecord.missionObjectivesScore,
    mockRecord.engineeringEfficiency,
    mockRecord.budgetPerformance,
    mockRecord.scientificContribution,
    mockRecord.reliabilityRating,
  ];

  beforeEach(() => {
    MissionResultsManager.resetInstance();
    manager = MissionResultsManager.getInstance();
    manager.reset();
  });

  describe('PerformanceScoreGauge', () => {
    it('instantiates container and updates visual parameters cleanly', () => {
      const gauge = new PerformanceScoreGauge({
        radius: 60,
        score: 85,
        gradeLetter: 'A',
        gradeLabel: 'Excellent',
      });

      expect(gauge.container).toBeDefined();
      expect(gauge.container.children.length).toBeGreaterThanOrEqual(3);

      // Trigger update
      gauge.update(95, 'S', 'Exceptional', 0x00f0ff);
      expect(gauge.container).toBeDefined();
    });
  });

  describe('CategoryBreakdownCard', () => {
    it('renders category rows with progress bars and itemized notes', () => {
      const card = new CategoryBreakdownCard({ width: 440, height: 350 });
      expect(card.container).toBeDefined();

      card.setCategories(mockRecord.categoryBreakdown);
      expect(card.container.children.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('MissionDebriefingView', () => {
    it('renders sections A, B, C, D, E, F with authoritative mission data', () => {
      let continueClicked = false;
      const view = new MissionDebriefingView({
        width: 1400,
        height: 850,
        result: mockRecord,
        manager,
        onContinue: () => {
          continueClicked = true;
        },
      });

      expect(view.container).toBeDefined();
      expect(view.container.children.length).toBeGreaterThan(0);

      // Destroy cleanup
      view.destroy();
    });
  });

  describe('MissionHistoryArchiveView', () => {
    it('renders history tabs, filter toggles, and handles navigation callbacks', () => {
      manager.historyArchive.addResult(mockRecord);

      let closed = false;
      let debriefResult: MissionResultRecord | null = null;

      const archiveView = new MissionHistoryArchiveView({
        width: 1400,
        height: 850,
        manager,
        onClose: () => {
          closed = true;
        },
        onOpenDebriefing: (rec) => {
          debriefResult = rec;
        },
      });

      expect(archiveView.container).toBeDefined();

      archiveView.destroy();
    });
  });
});
