/**
 * INTERSTELLAR CONTINUUM - Scoring Engine Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine } from '../../src/results/ScoringEngine';
import {
  PerformanceGrade,
  ScoringCategory,
  MissionEvaluationInput,
  MissionCompletionStatus,
} from '../../src/results/ResultsTypes';

describe('ScoringEngine', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine();
  });

  describe('Configuration & Weights', () => {
    it('initializes with authoritative default weights summing to 100', () => {
      const weights = engine.getWeights();
      expect(weights.missionObjectives).toBe(30);
      expect(weights.engineeringEfficiency).toBe(25);
      expect(weights.budgetManagement).toBe(20);
      expect(weights.scientificContribution).toBe(15);
      expect(weights.reliability).toBe(10);

      const total =
        weights.missionObjectives +
        weights.engineeringEfficiency +
        weights.budgetManagement +
        weights.scientificContribution +
        weights.reliability;
      expect(total).toBe(100);
    });

    it('allows data-driven weight reconfiguration', () => {
      engine.setWeights({
        missionObjectives: 40,
        engineeringEfficiency: 20,
      });

      const updated = engine.getWeights();
      expect(updated.missionObjectives).toBe(40);
      expect(updated.engineeringEfficiency).toBe(20);
      expect(updated.budgetManagement).toBe(20);
    });

    it('allows grade threshold customization', () => {
      const customThresholds = [
        {
          grade: PerformanceGrade.EXCEPTIONAL,
          letter: 'S',
          minScore: 95,
          label: 'Mastery',
          description: 'Flawless',
          colorHex: 0x00f0ff,
        },
        {
          grade: PerformanceGrade.UNSUCCESSFUL,
          letter: 'F',
          minScore: 0,
          label: 'Failed',
          description: 'Abort',
          colorHex: 0xf87171,
        },
      ];

      engine.setGradeThresholds(customThresholds);
      expect(engine.calculatePerformanceGrade(92).letter).toBe('F');
      expect(engine.calculatePerformanceGrade(96).letter).toBe('S');
    });
  });

  describe('Performance Grades Attribution', () => {
    it('correctly maps standard scores to performance grades and provides transparent reasons', () => {
      const g95 = engine.calculatePerformanceGrade(95);
      expect(g95.grade).toBe(PerformanceGrade.EXCEPTIONAL);
      expect(g95.letter).toBe('S');
      expect(g95.label).toBe('Exceptional');
      expect(g95.reasons.length).toBeGreaterThan(0);

      const g84 = engine.calculatePerformanceGrade(84);
      expect(g84.grade).toBe(PerformanceGrade.EXCELLENT);
      expect(g84.letter).toBe('A');

      const g74 = engine.calculatePerformanceGrade(74);
      expect(g74.grade).toBe(PerformanceGrade.GOOD);
      expect(g74.letter).toBe('B');

      const g65 = engine.calculatePerformanceGrade(65);
      expect(g65.grade).toBe(PerformanceGrade.SATISFACTORY);
      expect(g65.letter).toBe('C');

      const g48 = engine.calculatePerformanceGrade(48);
      expect(g48.grade).toBe(PerformanceGrade.NEEDS_IMPROVEMENT);
      expect(g48.letter).toBe('D');

      const g20 = engine.calculatePerformanceGrade(20);
      expect(g20.grade).toBe(PerformanceGrade.UNSUCCESSFUL);
      expect(g20.letter).toBe('F');
    });

    it('clamps boundary scores (over 100 or below 0)', () => {
      expect(engine.calculatePerformanceGrade(150).grade).toBe(PerformanceGrade.EXCEPTIONAL);
      expect(engine.calculatePerformanceGrade(-20).grade).toBe(PerformanceGrade.UNSUCCESSFUL);
    });
  });

  describe('Category Evaluation: Objectives', () => {
    it('awards full points when all mandatory and optional objectives are complete', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_TEST_01',
        missionName: 'Test Lunar Insertion',
        category: 'ORBITAL_DEPLOYMENT',
        destinationId: 'DEST_MOON',
        objectives: [
          { id: 'obj_1', title: 'Achieve Orbit', isMandatory: true, isCompleted: true },
          { id: 'obj_2', title: 'Deploy Commsat', isMandatory: true, isCompleted: true },
          { id: 'obj_3', title: 'High Res Surface Scan', isMandatory: false, isCompleted: true },
        ],
      };

      const result = engine.evaluateObjectives(input);
      expect(result.categoryResult.score).toBe(30);
      expect(result.categoryResult.percentage).toBe(100);
      expect(result.evaluatedObjectives.length).toBe(3);
      expect(result.evaluatedObjectives.every((o) => o.isCompleted)).toBe(true);
    });

    it('awards partial points and itemizes deductions for missed mandatory objectives', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_TEST_02',
        missionName: 'Partial Mission',
        category: 'COMBINED',
        destinationId: 'DEST_MARS',
        objectives: [
          { id: 'obj_1', title: 'Cruising Phase', isMandatory: true, isCompleted: true, currentProgress: 100 },
          { id: 'obj_2', title: 'Orbital Insertion', isMandatory: true, isCompleted: false, currentProgress: 50 },
        ],
      };

      const result = engine.evaluateObjectives(input);
      expect(result.categoryResult.score).toBeLessThan(30);
      expect(result.categoryResult.score).toBeGreaterThan(10);
      expect(result.categoryResult.items.some((i) => i.isDeduction)).toBe(true);
    });

    it('penalizes cancelled missions while retaining progress made prior to abort', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_TEST_03',
        missionName: 'Aborted Mission',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_EARTH_LEO',
        isCancelled: true,
        cancellationReason: 'Excessive orbital debris threat.',
        objectives: [
          { id: 'obj_1', title: 'Launch', isMandatory: true, isCompleted: true },
          { id: 'obj_2', title: 'Rendezvous', isMandatory: true, isCompleted: false },
        ],
      };

      const result = engine.evaluateObjectives(input);
      expect(result.categoryResult.items.some((i) => i.name.includes('Abort'))).toBe(true);
      expect(result.categoryResult.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Category Evaluation: Engineering Efficiency', () => {
    it('scores high when vehicle returns with full structural health and within delta-V budget', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_ENG_01',
        missionName: 'High Efficiency Flight',
        category: 'SCIENTIFIC_EXPLORATION',
        destinationId: 'DEST_MOON',
        objectives: [],
        engineering: {
          structuralIntegrityFinal: 98,
          deltaVUsedMps: 2850,
          deltaVPlannedMps: 3100,
          fuelRemainingPercentage: 25,
          powerMarginPercentage: 92,
        },
      };

      const eng = engine.evaluateEngineering(input);
      expect(eng.score).toBe(25);
      expect(eng.percentage).toBe(100);
      expect(eng.items.every((i) => !i.isDeduction)).toBe(true);
    });

    it('applies deductions when structural health is low and delta-V exceeds planned budget', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_ENG_02',
        missionName: 'Damaged Flight',
        category: 'SCIENTIFIC_EXPLORATION',
        destinationId: 'DEST_MARS',
        objectives: [],
        engineering: {
          structuralIntegrityFinal: 40,
          deltaVUsedMps: 4500,
          deltaVPlannedMps: 3500, // +1000 m/s overrun
          fuelRemainingPercentage: 2,
          powerMarginPercentage: 60,
        },
      };

      const eng = engine.evaluateEngineering(input);
      expect(eng.score).toBeLessThan(15);
      expect(eng.items.some((i) => i.isDeduction)).toBe(true);
    });
  });

  describe('Category Evaluation: Budget Management', () => {
    it('awards 20 points and commendation when mission is under budget', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_BUD_01',
        missionName: 'Frugal Flight',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_EARTH_LEO',
        objectives: [],
        budget: {
          allocatedCredits: 500000,
          actualCostCredits: 400000, // ₵100,000 savings
        },
      };

      const bud = engine.evaluateBudget(input);
      expect(bud.score).toBe(20);
      expect(bud.feedback.some((f) => f.includes('surplus') || f.includes('savings'))).toBe(true);
    });

    it('deducts points when actual cost exceeds allocated budget', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_BUD_02',
        missionName: 'Over Budget Flight',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_EARTH_LEO',
        objectives: [],
        budget: {
          allocatedCredits: 500000,
          actualCostCredits: 700000, // 40% overrun
        },
      };

      const bud = engine.evaluateBudget(input);
      expect(bud.score).toBeLessThan(15);
      expect(bud.items.some((i) => i.isDeduction)).toBe(true);
    });
  });

  describe('Category Evaluation: Scientific Contribution', () => {
    it('awards points based on collected data points and bonus for discoveries', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_SCI_01',
        missionName: 'Mars Science Surveyor',
        category: 'SCIENTIFIC_EXPLORATION',
        destinationId: 'DEST_MARS',
        objectives: [],
        science: {
          targetDataPoints: 200,
          collectedDataPoints: 200,
          discoveriesLogged: 2,
          downlinkFidelityMultiplier: 1.25,
        },
      };

      const sci = engine.evaluateScience(input);
      expect(sci.score).toBe(15);
      expect(sci.feedback.some((f) => f.includes('breakthrough') || f.includes('discoveries'))).toBe(true);
    });
  });

  describe('Category Evaluation: Reliability', () => {
    it('awards full points when zero anomalies occur and high comm uptime is maintained', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_REL_01',
        missionName: 'Flawless Operations',
        category: 'TRANSPORTATION',
        destinationId: 'DEST_MOON',
        objectives: [],
        reliability: {
          anomaliesEncountered: 0,
          anomaliesResolved: 0,
          commUptimePercentage: 99,
          subsystemHealthAverage: 98,
        },
      };

      const rel = engine.evaluateReliability(input);
      expect(rel.score).toBe(10);
      expect(rel.items.some((i) => i.name.includes('Zero In-Flight Anomalies'))).toBe(true);
    });

    it('rewards emergency recovery when anomalies are successfully resolved', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_REL_02',
        missionName: 'Resilient Flight',
        category: 'COMBINED',
        destinationId: 'DEST_MARS',
        objectives: [],
        reliability: {
          anomaliesEncountered: 3,
          anomaliesResolved: 3, // All resolved!
          commUptimePercentage: 95,
          subsystemHealthAverage: 88,
        },
        recoveredFromFailure: true,
      };

      const rel = engine.evaluateReliability(input);
      expect(rel.score).toBeGreaterThanOrEqual(7);
      expect(rel.feedback.some((f) => f.includes('neutralized') || f.includes('recovery'))).toBe(true);
    });
  });

  describe('Full Composite Mission Scoring', () => {
    it('calculates aggregate score, builds itemized breakdown, and produces structured feedback', () => {
      const input: MissionEvaluationInput = {
        missionId: 'M_FULL_01',
        missionName: 'Ares Exploration 1',
        shortCode: '[ARES-01]',
        category: 'SCIENTIFIC_EXPLORATION',
        destinationId: 'DEST_MARS',
        objectives: [
          { id: 'o1', title: 'Trans-Mars Injection', isMandatory: true, isCompleted: true },
          { id: 'o2', title: 'Areostationary Insertion', isMandatory: true, isCompleted: true },
        ],
        engineering: {
          structuralIntegrityFinal: 96,
          deltaVUsedMps: 3400,
          deltaVPlannedMps: 3600,
          fuelRemainingPercentage: 22,
          powerMarginPercentage: 90,
        },
        budget: {
          allocatedCredits: 800000,
          actualCostCredits: 750000,
        },
        science: {
          targetDataPoints: 150,
          collectedDataPoints: 150,
          discoveriesLogged: 2,
        },
        reliability: {
          anomaliesEncountered: 0,
          anomaliesResolved: 0,
          commUptimePercentage: 98,
          subsystemHealthAverage: 95,
        },
      };

      const result = engine.calculateMissionScore(input);
      expect(result.finalScore).toBeGreaterThanOrEqual(90);
      expect(result.breakdown.length).toBe(5);
      expect(result.feedback.strengths.length).toBeGreaterThan(0);
      expect(result.feedback.executiveSummary).toContain('Ares Exploration 1');
    });
  });
});
