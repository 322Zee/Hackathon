/**
 * INTERSTELLAR CONTINUUM - Performance Evaluator Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceEvaluator } from '../../src/results/PerformanceEvaluator';
import { ResultsEventBus } from '../../src/results/ResultsEventBus';
import {
  MissionEvaluationInput,
  MissionCompletionStatus,
  PerformanceGrade,
  ScoringCategory,
} from '../../src/results/ResultsTypes';

describe('PerformanceEvaluator', () => {
  let evaluator: PerformanceEvaluator;
  let eventBus: ResultsEventBus;

  beforeEach(() => {
    eventBus = new ResultsEventBus();
    evaluator = new PerformanceEvaluator(undefined, undefined, eventBus);
  });

  describe('Mission Evaluation Scenarios', () => {
    it('evaluates fully completed nominal missions with high score and grade', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_NOMINAL_01',
        missionName: 'Surveyor Alpha',
        category: 'SCIENTIFIC_EXPLORATION',
        destinationId: 'DEST_MOON',
        actualDurationSeconds: 86400 * 3 + 3600 * 5, // 3d 5h
        objectives: [
          { id: 'o1', title: 'Achieve Orbit', isMandatory: true, isCompleted: true },
          { id: 'o2', title: 'Complete Map', isMandatory: true, isCompleted: true },
        ],
        engineering: {
          structuralIntegrityFinal: 98,
          deltaVUsedMps: 2900,
          deltaVPlannedMps: 3000,
          fuelRemainingPercentage: 25,
          powerMarginPercentage: 90,
        },
        budget: {
          allocatedCredits: 500000,
          actualCostCredits: 450000,
        },
        science: {
          targetDataPoints: 100,
          collectedDataPoints: 100,
          discoveriesLogged: 2,
        },
        reliability: {
          anomaliesEncountered: 0,
          anomaliesResolved: 0,
          commUptimePercentage: 99,
          subsystemHealthAverage: 98,
        },
      };

      const result = evaluator.evaluateMission(input);

      expect(result.id).toMatch(/^RES_M_NOMINAL_01_/);
      expect(result.completionStatus).toBe(MissionCompletionStatus.COMPLETED);
      expect(result.finalPerformanceScore).toBeGreaterThanOrEqual(90);
      expect(result.performanceGrade).toBe(PerformanceGrade.EXCEPTIONAL);
      expect(result.gradeLetter).toBe('S');
      expect(result.missionDurationFormatted).toBe('3d 05h 00m');
      expect(result.objectivesCompleted.length).toBe(2);
      expect(result.objectivesMissed.length).toBe(0);
      expect(result.rewardSummary.credits).toBeGreaterThan(0);
      expect(result.isArchived).toBe(true);
      expect(result.isClaimed).toBe(false);
    });

    it('evaluates partially completed missions with accurate objective breakdown', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_PARTIAL_01',
        missionName: 'Partial Surface Probe',
        category: 'COMBINED',
        destinationId: 'DEST_MARS',
        actualDurationSeconds: 86400 * 10,
        objectives: [
          { id: 'o1', title: 'Atmospheric Entry', isMandatory: true, isCompleted: true },
          { id: 'o2', title: 'Surface Sample Retrieval', isMandatory: true, isCompleted: false, currentProgress: 40 },
          { id: 'o3', title: 'Panoramic Imaging', isMandatory: false, isCompleted: true },
        ],
      };

      const result = evaluator.evaluateMission(input);

      expect(result.completionStatus).toBe(MissionCompletionStatus.PARTIALLY_COMPLETED);
      expect(result.objectivesCompleted.length).toBe(2); // o1 and o3
      expect(result.objectivesMissed.length).toBe(1); // o2
      expect(result.finalPerformanceScore).toBeLessThan(90);
      expect(result.performanceFeedback.areasForImprovement.length).toBeGreaterThan(0);
    });

    it('evaluates failed missions without destroying unrelated progress and documents failure diagnostic', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_FAIL_01',
        missionName: 'Failed Insertion Mission',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_MARS',
        isFailed: true,
        failureReason: 'Terminal thruster manifold blowout during capture burn.',
        actualDurationSeconds: 3600 * 14,
        objectives: [
          { id: 'o1', title: 'Trans-Mars Cruise', isMandatory: true, isCompleted: true },
          { id: 'o2', title: 'Mars Orbital Capture', isMandatory: true, isCompleted: false },
        ],
        engineering: {
          structuralIntegrityFinal: 10,
        },
      };

      const result = evaluator.evaluateMission(input);

      expect(result.completionStatus).toBe(MissionCompletionStatus.FAILED);
      expect(result.performanceGrade).toBe(PerformanceGrade.UNSUCCESSFUL);
      expect(result.rewardSummary.credits).toBe(0);
      expect(result.penaltySummary.reputationLoss).toBeGreaterThan(0);
      expect(result.performanceFeedback.executiveSummary).toContain('thruster manifold blowout');
    });

    it('recognizes and rewards failure recovery when flight controllers overcome in-flight anomalies', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_RECOVERY_01',
        missionName: 'Recovery Test Flight',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_MOON',
        recoveredFromFailure: true,
        objectives: [
          { id: 'o1', title: 'Lunar Flyby', isMandatory: true, isCompleted: true },
        ],
        reliability: {
          anomaliesEncountered: 2,
          anomaliesResolved: 2,
        },
      };

      const result = evaluator.evaluateMission(input);
      expect(result.recoveredFromFailure).toBe(true);
      expect(result.reliabilityRating.feedback.some((f) => f.includes('recovery'))).toBe(true);
    });
  });

  describe('Edge Cases & Resilient Fallbacks', () => {
    it('handles minimal inputs with missing optional telemetry without throwing', () => {
      const minimalInput: MissionEvaluationInput = {
        missionId: 'M_MINIMAL_01',
        missionName: 'Minimal Flight',
        category: 'SUBORBITAL_TEST',
        destinationId: 'DEST_EARTH_LEO',
        objectives: [],
      };

      const result = evaluator.evaluateMission(minimalInput);
      expect(result).toBeDefined();
      expect(result.finalPerformanceScore).toBeGreaterThanOrEqual(0);
      expect(result.finalPerformanceScore).toBeLessThanOrEqual(100);
      expect(result.categoryBreakdown.length).toBe(5);
    });

    it('formats various mission durations cleanly', () => {
      const evalFormat = (secs: number) => {
        return (evaluator as any).formatDuration(secs);
      };

      expect(evalFormat(86400 * 5 + 3600 * 2 + 60 * 30)).toBe('5d 02h 30m');
      expect(evalFormat(3600 * 4 + 60 * 15)).toBe('4h 15m');
      expect(evalFormat(60 * 45)).toBe('45m');
    });
  });

  describe('Evaluation Lifecycle Events', () => {
    it('emits MissionEvaluationStarted, MissionEvaluationCompleted, and MissionResultsGenerated', () => {
      const eventsCaptured: string[] = [];

      eventBus.on('MissionEvaluationStarted', () => eventsCaptured.push('STARTED'));
      eventBus.on('MissionEvaluationCompleted', () => eventsCaptured.push('COMPLETED'));
      eventBus.on('MissionResultsGenerated', () => eventsCaptured.push('GENERATED'));

      evaluator.evaluateMission({
        missionId: 'M_EVT_TEST',
        missionName: 'Event Test Flight',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_MOON',
        objectives: [],
      });

      expect(eventsCaptured).toContain('STARTED');
      expect(eventsCaptured).toContain('COMPLETED');
      expect(eventsCaptured).toContain('GENERATED');
    });
  });
});
