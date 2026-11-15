/**
 * INTERSTELLAR CONTINUUM - Mission Scoring Engine
 * Authoritative, transparent, and data-driven scoring calculation model.
 * Evaluates Mission Objectives (30), Engineering Efficiency (25), Budget Management (20),
 * Scientific Contribution (15), and Reliability (10).
 */

import {
  ScoringCategory,
  ScoringWeightsConfig,
  DEFAULT_SCORING_WEIGHTS,
  GradeThreshold,
  DEFAULT_GRADE_THRESHOLDS,
  PerformanceGrade,
  CategoryScoreResult,
  ScoreBreakdownItem,
  EvaluatedObjective,
  MissionEvaluationInput,
  MissionCompletionStatus,
  PerformanceAnalysisFeedback,
} from './ResultsTypes';

export class ScoringEngine {
  private weights: ScoringWeightsConfig;
  private gradeThresholds: GradeThreshold[];

  constructor(
    weights: ScoringWeightsConfig = { ...DEFAULT_SCORING_WEIGHTS },
    gradeThresholds: GradeThreshold[] = [...DEFAULT_GRADE_THRESHOLDS]
  ) {
    this.weights = { ...weights };
    this.gradeThresholds = [...gradeThresholds].sort((a, b) => b.minScore - a.minScore);
  }

  public getWeights(): Readonly<ScoringWeightsConfig> {
    return { ...this.weights };
  }

  public setWeights(weights: Partial<ScoringWeightsConfig>): void {
    this.weights = {
      ...this.weights,
      ...weights,
    };
  }

  public getGradeThresholds(): ReadonlyArray<GradeThreshold> {
    return [...this.gradeThresholds];
  }

  public setGradeThresholds(thresholds: GradeThreshold[]): void {
    this.gradeThresholds = [...thresholds].sort((a, b) => b.minScore - a.minScore);
  }

  /**
   * Calculates the authoritative performance grade for a given numeric score.
   */
  public calculatePerformanceGrade(score: number): {
    grade: PerformanceGrade;
    letter: string;
    label: string;
    description: string;
    colorHex: number;
    reasons: string[];
  } {
    const clampedScore = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
    const matched =
      this.gradeThresholds.find((t) => clampedScore >= t.minScore) ??
      this.gradeThresholds[this.gradeThresholds.length - 1] ??
      DEFAULT_GRADE_THRESHOLDS[DEFAULT_GRADE_THRESHOLDS.length - 1]!;

    const reasons: string[] = [
      `Overall evaluation achieved ${clampedScore}/100 points, qualifying for grade ${matched.letter} (${matched.label}).`,
    ];

    if (clampedScore >= 90) {
      reasons.push('Outstanding performance across flight dynamics, budget control, and scientific return.');
    } else if (clampedScore >= 80) {
      reasons.push('Nominal mission execution with high efficiency across primary objectives.');
    } else if (clampedScore >= 70) {
      reasons.push('Standard mission completion with acceptable engineering and operational parameters.');
    } else if (clampedScore >= 60) {
      reasons.push('Baseline requirements satisfied; one or more performance areas encountered friction.');
    } else if (clampedScore >= 40) {
      reasons.push('Significant variances from flight envelope, budget caps, or secondary milestones.');
    } else {
      reasons.push('Mission failed to satisfy primary objectives or experienced mission-critical abort conditions.');
    }

    return {
      grade: matched.grade,
      letter: matched.letter,
      label: matched.label,
      description: matched.description,
      colorHex: matched.colorHex,
      reasons,
    };
  }

  /**
   * Evaluates mission objectives category (Weight: default 30)
   */
  public evaluateObjectives(
    input: MissionEvaluationInput
  ): { categoryResult: CategoryScoreResult; evaluatedObjectives: EvaluatedObjective[] } {
    const maxScore = this.weights.missionObjectives;
    const items: ScoreBreakdownItem[] = [];
    const feedback: string[] = [];
    const evaluatedObjectives: EvaluatedObjective[] = [];

    const rawObjs = input.objectives || [];
    if (rawObjs.length === 0) {
      // Fallback if no explicit objectives provided
      const defaultScore = input.isFailed ? 0 : maxScore;
      items.push({
        name: 'Standard Flight Envelope',
        pointsAwarded: defaultScore,
        maxPoints: maxScore,
        reason: input.isFailed
          ? 'Mission terminated prior to verifiable objective execution.'
          : 'Standard flight envelope completed with baseline flight objectives.',
        isDeduction: input.isFailed ?? false,
      });

      return {
        categoryResult: {
          category: ScoringCategory.MISSION_OBJECTIVES,
          categoryLabel: 'Mission Objectives',
          score: defaultScore,
          maxScore,
          percentage: (defaultScore / maxScore) * 100,
          weight: maxScore,
          items,
          feedback: [items[0]?.reason ?? 'Standard flight envelope completed.'],
          metrics: { completedCount: input.isFailed ? 0 : 1, totalCount: 1 },
        },
        evaluatedObjectives: [],
      };
    }

    const mandatoryObjs = rawObjs.filter((o) => o.isMandatory !== false);
    const optionalObjs = rawObjs.filter((o) => o.isMandatory === false);

    // 80% of weight to mandatory, 20% to optional (or 100% to mandatory if no optional)
    const mandatoryPool = optionalObjs.length > 0 ? maxScore * 0.8 : maxScore;
    const optionalPool = optionalObjs.length > 0 ? maxScore * 0.2 : 0;

    let earnedScore = 0;
    const pointsPerMandatory = mandatoryObjs.length > 0 ? mandatoryPool / mandatoryObjs.length : 0;
    const pointsPerOptional = optionalObjs.length > 0 ? optionalPool / optionalObjs.length : 0;

    let completedMandatory = 0;
    let completedOptional = 0;

    // Evaluate Mandatory Objectives
    for (const obj of mandatoryObjs) {
      const progress = typeof obj.currentProgress === 'number' ? Math.max(0, Math.min(100, obj.currentProgress)) : (obj.isCompleted ? 100 : 0);
      const points = (progress / 100) * pointsPerMandatory;
      const roundedPoints = Math.round(points * 10) / 10;
      earnedScore += points;

      if (obj.isCompleted || progress >= 100) {
        completedMandatory++;
        items.push({
          name: obj.title,
          pointsAwarded: roundedPoints,
          maxPoints: Math.round(pointsPerMandatory * 10) / 10,
          reason: `Mandatory objective "${obj.title}" fully achieved.`,
          isDeduction: false,
        });
      } else {
        const missedPoints = Math.round((pointsPerMandatory - points) * 10) / 10;
        items.push({
          name: obj.title,
          pointsAwarded: roundedPoints,
          maxPoints: Math.round(pointsPerMandatory * 10) / 10,
          reason: `Mandatory objective "${obj.title}" unfulfilled (${progress}% completed; -${missedPoints} pts).`,
          isDeduction: true,
        });
        feedback.push(`Mandatory flight milestone "${obj.title}" was not completed.`);
      }

      evaluatedObjectives.push({
        id: obj.id,
        title: obj.title,
        description: obj.description || '',
        isMandatory: true,
        isCompleted: obj.isCompleted || progress >= 100,
        isOptional: false,
        progressPercentage: progress,
        targetValue: obj.targetValue,
        actualValue: obj.actualValue,
        pointsAwarded: roundedPoints,
        maxPoints: Math.round(pointsPerMandatory * 10) / 10,
        feedback: obj.isCompleted ? 'Nominal completion' : `Incomplete: ${progress}% achieved`,
      });
    }

    // Evaluate Optional Objectives
    for (const obj of optionalObjs) {
      const progress = typeof obj.currentProgress === 'number' ? Math.max(0, Math.min(100, obj.currentProgress)) : (obj.isCompleted ? 100 : 0);
      const points = (progress / 100) * pointsPerOptional;
      const roundedPoints = Math.round(points * 10) / 10;
      earnedScore += points;

      if (obj.isCompleted || progress >= 100) {
        completedOptional++;
        items.push({
          name: `[Bonus] ${obj.title}`,
          pointsAwarded: roundedPoints,
          maxPoints: Math.round(pointsPerOptional * 10) / 10,
          reason: `Secondary bonus objective "${obj.title}" successfully completed (+${roundedPoints} pts).`,
          isDeduction: false,
        });
        feedback.push(`Optional milestone "${obj.title}" fulfilled with distinction.`);
      } else {
        items.push({
          name: `[Optional] ${obj.title}`,
          pointsAwarded: roundedPoints,
          maxPoints: Math.round(pointsPerOptional * 10) / 10,
          reason: `Secondary objective "${obj.title}" bypassed (${progress}% completed).`,
          isDeduction: false,
        });
      }

      evaluatedObjectives.push({
        id: obj.id,
        title: obj.title,
        description: obj.description || '',
        isMandatory: false,
        isCompleted: obj.isCompleted || progress >= 100,
        isOptional: true,
        progressPercentage: progress,
        targetValue: obj.targetValue,
        actualValue: obj.actualValue,
        pointsAwarded: roundedPoints,
        maxPoints: Math.round(pointsPerOptional * 10) / 10,
        feedback: obj.isCompleted ? 'Optional goal achieved' : 'Optional goal not fulfilled',
      });
    }

    // Cancellation or abort adjustment
    if (input.isCancelled) {
      const cancellationPenalty = Math.round(earnedScore * 0.4 * 10) / 10;
      earnedScore = Math.max(0, earnedScore - cancellationPenalty);
      items.push({
        name: 'Mission Abort Deduction',
        pointsAwarded: -cancellationPenalty,
        maxPoints: 0,
        reason: `Mission cancelled before orbital schedule completion: -${cancellationPenalty} pts. ${input.cancellationReason || ''}`,
        isDeduction: true,
      });
      feedback.push('Mission operations aborted early per flight controller order.');
    }

    const finalScore = Math.min(maxScore, Math.max(0, Math.round(earnedScore * 10) / 10));

    if (completedMandatory === mandatoryObjs.length && mandatoryObjs.length > 0) {
      feedback.unshift('All primary mission objectives completed successfully.');
    }

    return {
      categoryResult: {
        category: ScoringCategory.MISSION_OBJECTIVES,
        categoryLabel: 'Mission Objectives',
        score: finalScore,
        maxScore,
        percentage: Math.round((finalScore / maxScore) * 100),
        weight: maxScore,
        items,
        feedback,
        metrics: {
          mandatoryTotal: mandatoryObjs.length,
          mandatoryCompleted: completedMandatory,
          optionalTotal: optionalObjs.length,
          optionalCompleted: completedOptional,
          totalObjectives: rawObjs.length,
        },
      },
      evaluatedObjectives,
    };
  }

  /**
   * Evaluates engineering efficiency category (Weight: default 25)
   */
  public evaluateEngineering(input: MissionEvaluationInput): CategoryScoreResult {
    const maxScore = this.weights.engineeringEfficiency;
    const items: ScoreBreakdownItem[] = [];
    const feedback: string[] = [];

    const eng = input.engineering || {};
    const structuralHealth = eng.structuralIntegrityFinal ?? (input.isFailed ? 25 : 95);
    const deltaVUsed = eng.deltaVUsedMps ?? 2800;
    const deltaVPlanned = eng.deltaVPlannedMps ?? 3000;
    const fuelRemaining = eng.fuelRemainingPercentage ?? (input.isFailed ? 5 : 22);
    const powerMargin = eng.powerMarginPercentage ?? 85;

    // 1. Structural Integrity (8 pts)
    const structWeight = Math.round(maxScore * 0.32 * 10) / 10; // ~8 pts
    const structScore = structuralHealth >= 95
      ? structWeight
      : Math.round((Math.max(0, Math.min(100, structuralHealth)) / 100) * structWeight * 10) / 10;
    const structDeduction = structWeight - structScore;
    items.push({
      name: 'Hull & Structural Integrity',
      pointsAwarded: structScore,
      maxPoints: structWeight,
      reason: structuralHealth >= 90
        ? `Spacecraft structure returned in pristine condition (${structuralHealth}% integrity).`
        : `Structural wear and tear logged (${structuralHealth}% integrity; -${Math.round(structDeduction * 10) / 10} pts).`,
      isDeduction: structDeduction > 0.5,
    });
    if (structuralHealth >= 90) {
      feedback.push(`Spacecraft hull and structural assemblies maintained exceptional integrity (${structuralHealth}%).`);
    } else {
      feedback.push(`Vehicle sustained structural strain during flight (${structuralHealth}% final integrity).`);
    }

    // 2. Trajectory & Delta-V Management (6 pts)
    const deltaVWeight = Math.round(maxScore * 0.24 * 10) / 10; // ~6 pts
    let deltaVScore = deltaVWeight;
    if (deltaVPlanned > 0 && deltaVUsed > deltaVPlanned) {
      const overrunRatio = (deltaVUsed - deltaVPlanned) / deltaVPlanned;
      const deduction = Math.min(deltaVWeight, deltaVWeight * overrunRatio * 2);
      deltaVScore = Math.max(0, Math.round((deltaVWeight - deduction) * 10) / 10);
      items.push({
        name: 'Delta-V Trajectory Efficiency',
        pointsAwarded: deltaVScore,
        maxPoints: deltaVWeight,
        reason: `Exceeded planned trajectory burn budget: ${deltaVUsed} m/s used vs ${deltaVPlanned} m/s planned (-${Math.round(deduction * 10) / 10} pts).`,
        isDeduction: true,
      });
      feedback.push('Orbital burns exceeded planned trajectory margins, consuming contingency propellant.');
    } else {
      items.push({
        name: 'Delta-V Trajectory Efficiency',
        pointsAwarded: deltaVScore,
        maxPoints: deltaVWeight,
        reason: `Maneuvers executed within planned trajectory budget (${deltaVUsed} m/s / ${deltaVPlanned} m/s).`,
        isDeduction: false,
      });
      feedback.push('Orbital maneuvers executed with high precision inside nominal delta-V budget.');
    }

    // 3. Propellant Reserve Margin (6 pts)
    const fuelWeight = Math.round(maxScore * 0.24 * 10) / 10; // ~6 pts
    let fuelScore = Math.round((Math.min(30, fuelRemaining) / 30) * fuelWeight * 10) / 10;
    if (fuelRemaining >= 15) {
      fuelScore = fuelWeight;
      items.push({
        name: 'Propellant Reserve Conservation',
        pointsAwarded: fuelScore,
        maxPoints: fuelWeight,
        reason: `Safe fuel reserve retained post-mission (${fuelRemaining}% propellant remaining).`,
        isDeduction: false,
      });
    } else {
      const deduction = Math.round((fuelWeight - fuelScore) * 10) / 10;
      items.push({
        name: 'Propellant Reserve Depletion',
        pointsAwarded: fuelScore,
        maxPoints: fuelWeight,
        reason: `Low propellant reserves upon mission completion (${fuelRemaining}%; -${deduction} pts).`,
        isDeduction: true,
      });
      feedback.push('Propellant reserves reached near-critical depletion levels.');
    }

    // 4. Electrical Power & Subsystems Margin (5 pts)
    const powerWeight = Math.round(maxScore * 0.20 * 10) / 10; // ~5 pts
    const powerScore = powerMargin >= 80
      ? powerWeight
      : Math.round((Math.max(0, Math.min(100, powerMargin)) / 100) * powerWeight * 10) / 10;
    items.push({
      name: 'EPS Power Bus Stability',
      pointsAwarded: powerScore,
      maxPoints: powerWeight,
      reason: powerMargin >= 80
        ? `EPS bus maintained nominal generation and distribution (${powerMargin}% margin).`
        : `Power draw brownout risk logged during high-thrust operations (${powerMargin}% margin).`,
      isDeduction: powerMargin < 80,
    });

    const totalEarned = Math.min(maxScore, Math.max(0, Math.round(items.reduce((acc, i) => acc + i.pointsAwarded, 0) * 10) / 10));

    return {
      category: ScoringCategory.ENGINEERING_EFFICIENCY,
      categoryLabel: 'Engineering Efficiency',
      score: totalEarned,
      maxScore,
      percentage: Math.round((totalEarned / maxScore) * 100),
      weight: maxScore,
      items,
      feedback,
      metrics: {
        structuralIntegrity: structuralHealth,
        deltaVUsedMps: deltaVUsed,
        deltaVPlannedMps: deltaVPlanned,
        fuelRemainingPercentage: fuelRemaining,
        powerMarginPercentage: powerMargin,
      },
    };
  }

  /**
   * Evaluates budget management category (Weight: default 20)
   */
  public evaluateBudget(input: MissionEvaluationInput): CategoryScoreResult {
    const maxScore = this.weights.budgetManagement;
    const items: ScoreBreakdownItem[] = [];
    const feedback: string[] = [];

    const budget = input.budget || {
      allocatedCredits: 500000,
      actualCostCredits: input.isFailed ? 540000 : 440000,
    };

    const allocated = Math.max(1, budget.allocatedCredits);
    const actual = Math.max(0, budget.actualCostCredits);
    const variance = allocated - actual; // positive = under budget, negative = overrun

    let totalScore = maxScore;

    if (actual <= allocated) {
      // Completed within or under budget
      const savingsPercent = Math.round((variance / allocated) * 100);
      items.push({
        name: 'Budget Compliance',
        pointsAwarded: maxScore,
        maxPoints: maxScore,
        reason: `Operations executed within allocated budget cap of ₵${allocated.toLocaleString()} (Cost: ₵${actual.toLocaleString()}).`,
        isDeduction: false,
      });

      if (savingsPercent >= 10) {
        items.push({
          name: 'Fiscal Economy Commendation',
          pointsAwarded: 0,
          maxPoints: 0,
          reason: `Commended for ₵${variance.toLocaleString()} (${savingsPercent}%) agency cost savings.`,
          isDeduction: false,
        });
        feedback.push(`Outstanding cost containment generated ₵${variance.toLocaleString()} in fiscal surplus.`);
      } else {
        feedback.push(`Mission concluded strictly inside the approved ₵${allocated.toLocaleString()} financial allocation.`);
      }
    } else {
      // Over budget
      const overrunCredits = actual - allocated;
      const overrunPercentage = (overrunCredits / allocated) * 100;
      // Deduct 1 pt per 5% overrun, down to 0
      const deductionPoints = Math.min(maxScore, Math.round((overrunPercentage / 5) * 10) / 10);
      totalScore = Math.max(0, Math.round((maxScore - deductionPoints) * 10) / 10);

      items.push({
        name: 'Cost Cap Overrun',
        pointsAwarded: totalScore,
        maxPoints: maxScore,
        reason: `Exceeded authorized project allocation by ₵${overrunCredits.toLocaleString()} (+${Math.round(overrunPercentage)}%; -${deductionPoints} pts).`,
        isDeduction: true,
      });
      feedback.push(`Financial overrun of ₵${overrunCredits.toLocaleString()} incurred due to unbudgeted trajectory burns or hardware replacements.`);
    }

    return {
      category: ScoringCategory.BUDGET_MANAGEMENT,
      categoryLabel: 'Budget Management',
      score: totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      weight: maxScore,
      items,
      feedback,
      metrics: {
        allocatedCredits: allocated,
        actualCostCredits: actual,
        varianceCredits: variance,
        isUnderBudget: actual <= allocated,
      },
    };
  }

  /**
   * Evaluates scientific contribution category (Weight: default 15)
   */
  public evaluateScience(input: MissionEvaluationInput): CategoryScoreResult {
    const maxScore = this.weights.scientificContribution;
    const items: ScoreBreakdownItem[] = [];
    const feedback: string[] = [];

    const sci = input.science || {};
    const targetPoints = sci.targetDataPoints ?? 100;
    const collectedPoints = sci.collectedDataPoints ?? (input.isFailed ? 25 : 100);
    const discoveries = sci.discoveriesLogged ?? (input.isFailed ? 0 : 2);
    const fidelityMultiplier = sci.downlinkFidelityMultiplier ?? 1.0;

    // 1. Data Collection Harvest (10 pts)
    const harvestWeight = Math.round(maxScore * 0.67 * 10) / 10; // ~10 pts
    const harvestRatio = targetPoints > 0 ? Math.min(1.2, collectedPoints / targetPoints) : 1;
    const rawHarvestScore = Math.round(harvestRatio * harvestWeight * 10) / 10;
    const harvestScore = Math.min(harvestWeight, rawHarvestScore);

    items.push({
      name: 'Scientific Data Yield',
      pointsAwarded: harvestScore,
      maxPoints: harvestWeight,
      reason: collectedPoints >= targetPoints
        ? `Successfully harvested ${collectedPoints}/${targetPoints} scientific telemetry datasets.`
        : `Partial scientific data collected (${collectedPoints}/${targetPoints} datasets; -${Math.round((harvestWeight - harvestScore) * 10) / 10} pts).`,
      isDeduction: harvestScore < harvestWeight,
    });

    if (collectedPoints >= targetPoints) {
      feedback.push(`Scientific suite met or exceeded all observational data collection quotas (${collectedPoints} packets).`);
    } else {
      feedback.push(`Scientific instruments collected ${collectedPoints} of ${targetPoints} planned data packets.`);
    }

    // 2. Discoveries & Downlink Multiplier (5 pts)
    const discoveryWeight = Math.round(maxScore * 0.33 * 10) / 10; // ~5 pts
    let discoveryScore = 0;
    if (discoveries > 0) {
      discoveryScore = Math.min(discoveryWeight, discoveries * 2.5);
      items.push({
        name: 'Notable Planetary Discoveries',
        pointsAwarded: discoveryScore,
        maxPoints: discoveryWeight,
        reason: `Logged ${discoveries} peer-review planetary discoveries and surface anomalies (+${discoveryScore} pts).`,
        isDeduction: false,
      });
      feedback.push(`Mission logged ${discoveries} breakthrough discoveries published to the global research archive.`);
    } else {
      items.push({
        name: 'Planetary Findings Baseline',
        pointsAwarded: 1.5,
        maxPoints: discoveryWeight,
        reason: 'Standard baseline sensor observations recorded without novel anomalies.',
        isDeduction: false,
      });
      discoveryScore = 1.5;
    }

    if (fidelityMultiplier > 1.0) {
      feedback.push(`High-gain telemetry relay amplified data downlink resolution by ${(fidelityMultiplier * 100).toFixed(0)}%.`);
    }

    const totalScore = Math.min(maxScore, Math.max(0, Math.round((harvestScore + discoveryScore) * 10) / 10));

    return {
      category: ScoringCategory.SCIENTIFIC_CONTRIBUTION,
      categoryLabel: 'Scientific Contribution',
      score: totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      weight: maxScore,
      items,
      feedback,
      metrics: {
        collectedDataPoints: collectedPoints,
        targetDataPoints: targetPoints,
        discoveriesLogged: discoveries,
        downlinkFidelityMultiplier: fidelityMultiplier,
      },
    };
  }

  /**
   * Evaluates flight reliability & operations category (Weight: default 10)
   */
  public evaluateReliability(input: MissionEvaluationInput): CategoryScoreResult {
    const maxScore = this.weights.reliability;
    const items: ScoreBreakdownItem[] = [];
    const feedback: string[] = [];

    const rel = input.reliability || {};
    const anomalies = rel.anomaliesEncountered ?? (input.isFailed ? 2 : 0);
    const resolved = rel.anomaliesResolved ?? (input.isFailed ? 0 : anomalies);
    const commUptime = rel.commUptimePercentage ?? (input.isFailed ? 60 : 98);
    const subsystemHealth = rel.subsystemHealthAverage ?? (input.isFailed ? 45 : 92);

    // 1. In-flight Anomalies & Resolution (5 pts)
    const anomalyWeight = 5;
    let anomalyScore = anomalyWeight;
    if (anomalies === 0) {
      items.push({
        name: 'Zero In-Flight Anomalies',
        pointsAwarded: anomalyWeight,
        maxPoints: anomalyWeight,
        reason: 'Zero flight computer cautions or subsystem malfunctions encountered.',
        isDeduction: false,
      });
      feedback.push('Mission systems performed without a single telemetry glitch or avionics fault.');
    } else {
      const unmitigated = anomalies - resolved;
      const deduction = unmitigated * 2 + (anomalies * 0.5);
      anomalyScore = Math.max(0, Math.round((anomalyWeight - deduction) * 10) / 10);
      items.push({
        name: 'In-Flight Malfunction Response',
        pointsAwarded: anomalyScore,
        maxPoints: anomalyWeight,
        reason: `${anomalies} anomalies encountered (${resolved} resolved, ${unmitigated} unmitigated; -${Math.round((anomalyWeight - anomalyScore) * 10) / 10} pts).`,
        isDeduction: true,
      });
      if (resolved > 0) {
        feedback.push(`Flight controllers successfully neutralized ${resolved} of ${anomalies} in-flight system anomalies.`);
      }
      if (unmitigated > 0) {
        feedback.push(`${unmitigated} unresolved subsystem anomaly impacted terminal flight operations.`);
      }
    }

    // 2. Communications Uptime (3 pts)
    const commWeight = 3;
    const commScore = Math.round((Math.max(0, Math.min(100, commUptime)) / 100) * commWeight * 10) / 10;
    items.push({
      name: 'Deep Space Network Lock & Uptime',
      pointsAwarded: commScore,
      maxPoints: commWeight,
      reason: commUptime >= 95
        ? `Continuous carrier lock maintained (${commUptime}% DSN link uptime).`
        : `Intermittent signal blackout periods recorded (${commUptime}% uptime; -${Math.round((commWeight - commScore) * 10) / 10} pts).`,
      isDeduction: commUptime < 95,
    });
    if (commUptime < 90) {
      feedback.push(`Telemetry carrier link suffered intermittent occlusion (${commUptime}% link uptime).`);
    }

    // 3. Subsystem Health Resilience (2 pts)
    const healthWeight = 2;
    const healthScore = Math.round((Math.max(0, Math.min(100, subsystemHealth)) / 100) * healthWeight * 10) / 10;
    items.push({
      name: 'Subsystem Mean Time Between Faults',
      pointsAwarded: healthScore,
      maxPoints: healthWeight,
      reason: `Average subsystem reliability score: ${subsystemHealth}%.`,
      isDeduction: subsystemHealth < 80,
    });

    // Resilience recovery bonus
    if (input.recoveredFromFailure) {
      items.push({
        name: 'Failure Recovery Commendation',
        pointsAwarded: 0,
        maxPoints: 0,
        reason: 'Mission successfully recovered from transient flight fault condition.',
        isDeduction: false,
      });
      feedback.push('Commended for exceptional flight contingency recovery following initial telemetry fault.');
    }

    const totalScore = Math.min(maxScore, Math.max(0, Math.round((anomalyScore + commScore + healthScore) * 10) / 10));

    return {
      category: ScoringCategory.RELIABILITY,
      categoryLabel: 'Reliability & Operations',
      score: totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      weight: maxScore,
      items,
      feedback,
      metrics: {
        anomaliesEncountered: anomalies,
        anomaliesResolved: resolved,
        commUptimePercentage: commUptime,
        subsystemHealthAverage: subsystemHealth,
      },
    };
  }

  /**
   * Calculates complete mission evaluation score across all 5 categories.
   */
  public calculateMissionScore(input: MissionEvaluationInput): {
    finalScore: number;
    breakdown: CategoryScoreResult[];
    evaluatedObjectives: EvaluatedObjective[];
    feedback: PerformanceAnalysisFeedback;
  } {
    const { categoryResult: objectivesResult, evaluatedObjectives } = this.evaluateObjectives(input);
    const engineeringResult = this.evaluateEngineering(input);
    const budgetResult = this.evaluateBudget(input);
    const scienceResult = this.evaluateScience(input);
    const reliabilityResult = this.evaluateReliability(input);

    const breakdown: CategoryScoreResult[] = [
      objectivesResult,
      engineeringResult,
      budgetResult,
      scienceResult,
      reliabilityResult,
    ];

    const sumScore = breakdown.reduce((acc, cat) => acc + cat.score, 0);
    const finalScore = Math.min(100, Math.max(0, Math.round(sumScore * 10) / 10));

    // Synthesize comprehensive feedback
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    for (const cat of breakdown) {
      if (cat.percentage >= 80) {
        strengths.push(...cat.feedback);
      } else {
        areasForImprovement.push(...cat.feedback);
      }
    }

    const feedback: PerformanceAnalysisFeedback = {
      strengths: strengths.slice(0, 5),
      areasForImprovement: areasForImprovement.slice(0, 5),
      engineeringFeedback: engineeringResult.feedback.join(' ') || 'Engineering parameters remained nominal.',
      budgetFeedback: budgetResult.feedback.join(' ') || 'Budget tracked within expectations.',
      scientificFeedback: scienceResult.feedback.join(' ') || 'Science harvest satisfied baseline parameters.',
      reliabilityFeedback: reliabilityResult.feedback.join(' ') || 'Reliability metrics logged nominally.',
      executiveSummary: this.generateExecutiveSummary(input, finalScore),
    };

    return {
      finalScore,
      breakdown,
      evaluatedObjectives,
      feedback,
    };
  }

  private generateExecutiveSummary(input: MissionEvaluationInput, finalScore: number): string {
    const status = input.status || (input.isFailed ? MissionCompletionStatus.FAILED : MissionCompletionStatus.COMPLETED);
    const grade = this.calculatePerformanceGrade(finalScore);

    if (status === MissionCompletionStatus.COMPLETED) {
      return `Mission "${input.missionName}" concluded successfully with a final score of ${finalScore}/100 (${grade.label}). All operational directives satisfied.`;
    } else if (status === MissionCompletionStatus.PARTIALLY_COMPLETED) {
      return `Mission "${input.missionName}" concluded with partial mission success (${finalScore}/100, Grade ${grade.letter}). Primary flight milestones were logged with minor unfulfilled secondary directives.`;
    } else if (status === MissionCompletionStatus.CANCELLED) {
      return `Mission "${input.missionName}" was aborted early by Mission Operations (${finalScore}/100). Logged preliminary telemetry and assets recovered safely.`;
    } else {
      return `Mission "${input.missionName}" experienced terminal flight interruption: ${input.failureReason || 'Flight envelope failure'}. Partial salvageable data preserved (${finalScore}/100).`;
    }
  }
}
