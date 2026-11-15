/**
 * INTERSTELLAR CONTINUUM - Authoritative Rocket Testing & Pre-Launch Readiness Manager
 * Core logic engine coordinating vehicle design inspection, component status analysis,
 * abstract performance assessments, test-bench simulation execution, persistent test history,
 * and 10-point pre-launch deployment certification.
 *
 * NOTE: Fictional game mechanics only.
 * Physical propulsion equations, hazardous procedures, and real-world launch operations are excluded.
 */

import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import { RocketComponentRegistry } from '../RocketComponentRegistry';
import { ComponentInventoryService } from '../ComponentInventoryService';
import { RocketProjectManager } from '../RocketProjectManager';
import { RocketBuilderEngine } from '../builder/RocketBuilderEngine';
import { RocketValidationEngine } from '../validation/RocketValidationEngine';
import {
  ComprehensiveRocketValidationReport,
  ValidationOverallStatus,
  ValidationSeverity,
  ValidationCategory,
} from '../validation/RocketValidationTypes';
import { RocketClassRating, RocketProject, RocketProjectStatus } from '../RocketProjectTypes';
import { MissionCatalogueRegistry } from '../../missions/MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../../missions/MissionLifecycleManager';
import { MissionDefinition } from '../../missions/MissionTypes';
import { PreparationTaskType, PreparationTaskStatus } from '../../missions/MissionLifecycleTypes';
import {
  ComponentInspectionStatus,
  ComponentInspectionDetail,
  RocketTestStatus,
  AssessmentCategory,
  AssessmentCheckpoint,
  RocketTestRunReport,
  PreLaunchReadinessStatus,
  PreLaunchReadinessCriterion,
  PreLaunchReadinessEvaluation,
} from './RocketTestingTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export class RocketTestingManager {
  private static instance?: RocketTestingManager;
  public static readonly TEST_ENGINE_VERSION = '2.5.0';

  private eventBus?: EventBus;
  private validationEngine: RocketValidationEngine;
  private builderEngine: RocketBuilderEngine;
  private projectManager: RocketProjectManager;
  private registry: RocketComponentRegistry;
  private inventoryService: ComponentInventoryService;
  private missionRegistry: MissionCatalogueRegistry;
  private lifecycleManager: MissionLifecycleManager;

  // History of completed test runs indexed by projectId
  private testHistory: Map<string, RocketTestRunReport[]> = new Map();

  // Cached latest test report by projectId
  private latestTestReports: Map<string, RocketTestRunReport> = new Map();

  // Active deployment states
  private launchComplexDeployments: Map<
    string,
    {
      projectId: string;
      missionId?: string;
      designVersion: string;
      deployedAt: number;
    }
  > = new Map();

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.validationEngine = RocketValidationEngine.getInstance(eventBus);
    this.builderEngine = RocketBuilderEngine.getInstance(eventBus);
    this.projectManager = RocketProjectManager.getInstance(eventBus);
    this.registry = RocketComponentRegistry.getInstance(eventBus);
    this.inventoryService = ComponentInventoryService.getInstance(eventBus);
    this.missionRegistry = MissionCatalogueRegistry.getInstance(eventBus);
    this.lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
  }

  public static getInstance(eventBus?: EventBus): RocketTestingManager {
    if (!RocketTestingManager.instance) {
      RocketTestingManager.instance = new RocketTestingManager(eventBus);
    }
    return RocketTestingManager.instance;
  }

  public static resetInstance(): void {
    RocketTestingManager.instance = undefined;
  }

  // =========================================================================
  // 1. DESIGN & COMPONENT STATUS INSPECTION
  // =========================================================================

  /**
   * Run detailed design inspection on active configuration slots
   */
  public inspectDesign(projectId: string): {
    project: RocketProject;
    componentInspections: ComponentInspectionDetail[];
    validationReport: ComprehensiveRocketValidationReport;
    isStale: boolean;
  } {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Rocket project "${projectId}" not found for inspection.`);
    }

    const config = this.builderEngine.getConfiguration();
    let valReport = project.comprehensiveValidation ?? this.validationEngine.getLatestReport(projectId);

    if (!valReport) {
      valReport = this.validationEngine.validate({
        projectId: project.projectId,
        configuration: config,
      });
      project.comprehensiveValidation = valReport;
    }

    const isStale = this.validationEngine.isReportStale(valReport, config);

    // Map each slot to ComponentInspectionDetail
    const componentInspections: ComponentInspectionDetail[] = [];

    for (const stage of config.stages) {
      for (const slot of stage.slots) {
        if (!slot.installedComponentId) {
          componentInspections.push({
            slotId: slot.slotId,
            slotLabel: slot.label,
            slotType: slot.slotType,
            stageNumber: stage.stageNumber,
            isRequired: slot.required,
            componentName: 'Unpopulated Slot',
            status: ComponentInspectionStatus.MISSING,
            massUnits: 0,
            reliabilityRating: 0,
            roleExplanation: slot.required
              ? `Mandatory ${slot.slotType} slot for Stage ${stage.stageNumber} core operation.`
              : `Optional auxiliary ${slot.slotType} slot.`,
            compatibilityTags: [...slot.allowedTags],
            issueSummary: slot.required ? 'Mandatory component missing.' : undefined,
          });
          continue;
        }

        const comp = this.registry.getComponent(slot.installedComponentId);
        if (!comp) {
          componentInspections.push({
            slotId: slot.slotId,
            slotLabel: slot.label,
            slotType: slot.slotType,
            stageNumber: stage.stageNumber,
            isRequired: slot.required,
            componentId: slot.installedComponentId,
            componentName: `Unknown (${slot.installedComponentId})`,
            status: ComponentInspectionStatus.UNAVAILABLE,
            massUnits: 0,
            reliabilityRating: 0,
            roleExplanation: 'Corrupted or deprecated component reference.',
            compatibilityTags: [],
            issueSummary: 'Component reference missing from registry.',
          });
          continue;
        }

        // Determine component status
        let status = ComponentInspectionStatus.INSTALLED;
        let issueSummary: string | undefined;

        // Check validation issues for this slot
        const slotIssues = valReport.issues.filter(
          i => i.affectedSlotId === slot.slotId || i.affectedComponentId === comp.id
        );
        const errorIssue = slotIssues.find(i => i.severity === ValidationSeverity.ERROR);
        const warningIssue = slotIssues.find(i => i.severity === ValidationSeverity.WARNING);

        // Check ownership first
        const owned = this.inventoryService.getOwnedQuantity(comp.id);
        if (owned <= 0) {
          status = ComponentInspectionStatus.UNAVAILABLE;
          issueSummary = 'Unowned component in inventory';
        } else if (errorIssue) {
          status = ComponentInspectionStatus.VALIDATION_FAILED;
          issueSummary = errorIssue.title;
        } else if (warningIssue) {
          status = ComponentInspectionStatus.COMPATIBLE;
          issueSummary = warningIssue.title;
        } else {
          status = ComponentInspectionStatus.COMPATIBLE;
        }

        componentInspections.push({
          slotId: slot.slotId,
          slotLabel: slot.label,
          slotType: slot.slotType,
          stageNumber: stage.stageNumber,
          isRequired: slot.required,
          componentId: comp.id,
          componentName: comp.name,
          category: comp.category,
          status,
          massUnits: comp.massUnits,
          reliabilityRating: comp.stats.reliabilityRating,
          performanceRating: comp.stats.performanceRating,
          powerGenerationWatts: comp.stats.powerGenerationWatts,
          powerDemandWatts: comp.stats.powerDemandWatts,
          roleExplanation: comp.educationalExplanation || comp.description,
          compatibilityTags: [...comp.compatibilityTags],
          issueSummary,
        });
      }
    }

    return {
      project,
      componentInspections,
      validationReport: valReport,
      isStale,
    };
  }

  // =========================================================================
  // 2. ABSTRACT TEST-BENCH ASSESSMENT RUN
  // =========================================================================

  /**
   * Execute an abstract test run for a rocket project
   * Completely read-only: does NOT modify configuration or deduct inventory.
   */
  public runTestAssessment(projectId: string, missionOverride?: MissionDefinition): RocketTestRunReport {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Rocket project "${projectId}" not found for test execution.`);
    }

    const config = this.builderEngine.getConfiguration();
    const configHash = this.validationEngine.computeConfigurationHash(config);

    // Resolve assigned mission
    const missionId = missionOverride?.id ?? project.assignedMissionId;
    const mission = missionOverride ?? (missionId ? this.missionRegistry.getMissionById(missionId) : undefined);

    if (this.eventBus) {
      this.eventBus.emit('rocket:test_started' as any, {
        projectId,
        designVersion: config.version,
        missionId,
      });
    }

    // Run comprehensive validation to base test results on canonical checks
    const valReport = this.validationEngine.validate({
      projectId,
      configuration: config,
      mission,
    });

    const { componentInspections } = this.inspectDesign(projectId);

    // Build checkpoints across all 6 assessment categories
    const checkpoints: AssessmentCheckpoint[] = [];

    // 1. SYSTEM COMPATIBILITY
    const compIssues = valReport.issues.filter(i => i.category === ValidationCategory.COMPONENT_COMPATIBILITY);
    const hasCompatError = compIssues.some(i => i.severity === ValidationSeverity.ERROR);
    const hasCompatWarn = compIssues.some(i => i.severity === ValidationSeverity.WARNING);
    checkpoints.push({
      id: 'chk_compat_hardware',
      category: AssessmentCategory.COMPATIBILITY,
      label: 'Staging Hardware & Tag Compatibility',
      currentRating: hasCompatError ? 'Incompatible' : hasCompatWarn ? 'Sub-optimal' : 'Compatible',
      missionRequirement: '100% Authorized Fits',
      outcome: hasCompatError ? 'FAIL' : hasCompatWarn ? 'WARN' : 'PASS',
      isApplicable: true,
      explanation: hasCompatError
        ? compIssues.find(i => i.severity === ValidationSeverity.ERROR)?.explanation ?? 'Incompatible components detected.'
        : hasCompatWarn
        ? compIssues.find(i => i.severity === ValidationSeverity.WARNING)?.explanation ?? 'Advisory staging warnings.'
        : 'All staged components conform to structural slot categories and interface tags.',
    });

    // 2. PERFORMANCE ASSESSMENT
    const ratings = valReport.ratings;
    const minPerf = mission
      ? Math.max(100, Math.round((mission.engineeringRequirements?.minPayloadMassKg ?? 50) * 1.5))
      : Math.round(ratings.totalMassUnits * 0.85);

    const perfPass = ratings.overallPerformanceRating >= minPerf;
    checkpoints.push({
      id: 'chk_perf_propulsion',
      category: AssessmentCategory.PERFORMANCE,
      label: 'Propulsion Thrust Performance Rating',
      currentRating: `${ratings.overallPerformanceRating} Pts`,
      missionRequirement: `${minPerf} Pts min`,
      outcome: perfPass ? 'PASS' : 'FAIL',
      isApplicable: true,
      explanation: perfPass
        ? `Propulsion rating (${ratings.overallPerformanceRating}) safely exceeds lift threshold (${minPerf}).`
        : `Propulsion rating (${ratings.overallPerformanceRating}) is deficient to lift total mass (${ratings.totalMassUnits} MU).`,
    });

    const minPayloadCap = mission?.engineeringRequirements?.minPayloadMassKg ?? 0;
    const hasPayloadReq = minPayloadCap > 0;
    checkpoints.push({
      id: 'chk_perf_payload_cap',
      category: AssessmentCategory.PERFORMANCE,
      label: 'Payload Lift Capacity Rating',
      currentRating: `${ratings.payloadCapacityRating} Units`,
      missionRequirement: hasPayloadReq ? `${minPayloadCap} Units` : 'N/A',
      outcome: !hasPayloadReq
        ? 'NOT_APPLICABLE'
        : ratings.payloadCapacityRating >= minPayloadCap
        ? 'PASS'
        : 'FAIL',
      isApplicable: hasPayloadReq,
      explanation: hasPayloadReq
        ? ratings.payloadCapacityRating >= minPayloadCap
          ? `Payload capacity (${ratings.payloadCapacityRating}) meets contract threshold (${minPayloadCap}).`
          : `Payload capacity (${ratings.payloadCapacityRating}) is below contract demand (${minPayloadCap}).`
        : 'No specific minimum payload mass rating mandated for this flight test stand.',
    });

    // 3. RELIABILITY ASSESSMENT
    const minRel = mission ? Math.min(95, 70 + (mission.sequenceLevel ?? 1) * 3) : 75;
    const relPass = ratings.reliabilityRating >= minRel;
    const relWarn = ratings.reliabilityRating < 85 && ratings.reliabilityRating >= minRel;

    checkpoints.push({
      id: 'chk_rel_composite',
      category: AssessmentCategory.RELIABILITY,
      label: 'Subsystems Composite Reliability Rating',
      currentRating: `${ratings.reliabilityRating.toFixed(1)}%`,
      missionRequirement: `${minRel.toFixed(1)}% certified`,
      outcome: !relPass ? 'FAIL' : relWarn ? 'WARN' : 'PASS',
      isApplicable: true,
      explanation: !relPass
        ? `Composite reliability (${ratings.reliabilityRating.toFixed(1)}%) is below certification threshold (${minRel.toFixed(1)}%).`
        : relWarn
        ? `Reliability (${ratings.reliabilityRating.toFixed(1)}%) meets minimum threshold but carries elevated telemetry glitch risk.`
        : `Certified composite reliability rating (${ratings.reliabilityRating.toFixed(1)}%) exceeds target margin.`,
    });

    // 4. POWER-SYSTEM SUITABILITY
    const netPower = ratings.netPowerWatts;
    const powerPass = netPower >= 0;
    checkpoints.push({
      id: 'chk_power_balance',
      category: AssessmentCategory.POWER_SYSTEMS,
      label: 'Electrical Power Generation vs Systems Demand',
      currentRating: `${netPower >= 0 ? '+' : ''}${netPower} W`,
      missionRequirement: '≥ 0 W (Sustained)',
      outcome: powerPass ? 'PASS' : 'WARN',
      isApplicable: true,
      explanation: powerPass
        ? `Generation (${ratings.powerGenerationWatts} W) balances subsystem demand (${ratings.powerDemandWatts} W).`
        : `Power deficit of ${Math.abs(netPower)} W relies on battery drain reserve.`,
    });

    // 5. COMMUNICATION SUITABILITY
    const minComms = mission ? Math.max(1, Math.round((mission.engineeringRequirements?.communicationBandwidthKbps ?? 64) / 64)) : 0;
    const hasCommsReq = minComms > 0;
    const commsPass = ratings.communicationRating >= minComms;

    checkpoints.push({
      id: 'chk_comms_telemetry',
      category: AssessmentCategory.COMMUNICATION,
      label: 'Telemetry Bandwidth & Transceiver Gain',
      currentRating: `${ratings.communicationRating} Pts`,
      missionRequirement: hasCommsReq ? `${minComms} Pts` : 'N/A',
      outcome: !hasCommsReq ? 'NOT_APPLICABLE' : commsPass ? 'PASS' : 'WARN',
      isApplicable: hasCommsReq,
      explanation: hasCommsReq
        ? commsPass
          ? `Transceiver telemetry rating (${ratings.communicationRating}) meets mission profile.`
          : `Launch vehicle comms score (${ratings.communicationRating}) is below mission target (${minComms}). Spacecraft payload must fulfill primary link.`
        : 'Open range communication; no deep telemetry constraints enforced.',
    });

    // 6. MISSION SUITABILITY
    let missionSuitDetails = 'Vehicle suitable for test stand certification.';
    let missionOutcome: 'PASS' | 'WARN' | 'FAIL' | 'NOT_APPLICABLE' = 'PASS';

    if (mission) {
      if (mission.destinationId !== DestinationId.EARTH && config.classRating === RocketClassRating.SUBORBITAL_TEST) {
        missionOutcome = 'FAIL';
        missionSuitDetails = `Vehicle class (${config.classRating}) cannot reach destination "${mission.destinationId}".`;
      } else {
        missionSuitDetails = `Vehicle class and payload platform aligned with mission "${mission.name}".`;
      }
    } else {
      missionOutcome = 'NOT_APPLICABLE';
      missionSuitDetails = 'No active mission contract assigned. Running open engineering baseline.';
    }

    checkpoints.push({
      id: 'chk_mission_suitability',
      category: AssessmentCategory.MISSION_SUITABILITY,
      label: 'Target Destination & Flight Profile Match',
      currentRating: config.classRating,
      missionRequirement: mission ? mission.destinationId : 'N/A',
      outcome: missionOutcome,
      isApplicable: !!mission,
      explanation: missionSuitDetails,
    });

    // Derive test status
    const failedChecks = checkpoints.filter(c => c.outcome === 'FAIL').map(c => c.label);
    const warnings = checkpoints.filter(c => c.outcome === 'WARN').map(c => c.label);
    const passedChecks = checkpoints.filter(c => c.outcome === 'PASS').map(c => c.label);

    let status: RocketTestStatus;
    if (failedChecks.length > 0) {
      status = RocketTestStatus.FAILED;
    } else if (warnings.length > 0) {
      status = RocketTestStatus.PASSED_WITH_WARNINGS;
    } else {
      status = RocketTestStatus.PASSED;
    }

    // Calculate composite score (0-100)
    const applicableChecks = checkpoints.filter(c => c.isApplicable);
    const passScore = applicableChecks.length > 0 ? (passedChecks.length / applicableChecks.length) * 50 : 50;
    const relScore = (ratings.reliabilityRating / 100) * 30;
    const completenessScore = (ratings.completenessPercent / 100) * 20;
    const overallScore = Math.round(passScore + relScore + completenessScore);

    // Build recommendations
    const recommendations: string[] = [];
    if (failedChecks.length > 0) {
      recommendations.push('Resolve blocking failures in Rocket Builder before proceeding to launch checkout.');
    }
    if (warnings.length > 0) {
      recommendations.push('Review advisory warnings to maximize payload delivery efficiency and reliability.');
    }
    if (status === RocketTestStatus.PASSED) {
      recommendations.push('Vehicle design is certified across all engineering assessments. Cleared for pre-launch evaluation.');
    }

    const testId = `test_${projectId}_${Date.now()}`;
    const report: RocketTestRunReport = {
      testId,
      projectId,
      projectName: project.name,
      designVersion: config.version,
      configurationHash: configHash,
      timestamp: Date.now(),
      status,
      overallScore,
      isStale: false,
      assignedMissionId: mission?.id,
      assignedMissionName: mission?.name,
      checkpoints,
      componentInspections,
      ratingsSummary: ratings,
      warnings,
      failedChecks,
      passedChecks,
      recommendations,
      summaryText:
        status === RocketTestStatus.PASSED
          ? `Test bench assessment passed (${overallScore}/100). All systems verified for flight profile.`
          : status === RocketTestStatus.PASSED_WITH_WARNINGS
          ? `Test bench assessment passed with ${warnings.length} advisory trade-off(s) (${overallScore}/100).`
          : `Test bench assessment failed: ${failedChecks.length} blocking issue(s) detected.`,
      engineVersion: RocketTestingManager.TEST_ENGINE_VERSION,
    };

    // Store in latest cache & rolling history (max 20 per project)
    this.latestTestReports.set(projectId, report);
    const history = this.testHistory.get(projectId) ?? [];
    history.unshift(report);
    if (history.length > 20) history.pop();
    this.testHistory.set(projectId, history);

    if (this.eventBus) {
      this.eventBus.emit('rocket:test_completed' as any, {
        projectId,
        report,
        status,
        overallScore,
      });
    }

    Logger.info(
      'ROCKET_TESTING_MANAGER',
      `Test assessment completed for "${project.name}" (${config.version}): ${status} (Score: ${overallScore}/100).`
    );

    return report;
  }

  // =========================================================================
  // 3. PRE-LAUNCH READINESS EVALUATION (10 CANONICAL CRITERIA)
  // =========================================================================

  /**
   * Deterministically evaluate Pre-Launch Readiness across all 10 criteria
   */
  public evaluatePreLaunchReadiness(
    projectId: string,
    missionOverride?: MissionDefinition
  ): PreLaunchReadinessEvaluation {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Rocket project "${projectId}" not found for readiness evaluation.`);
    }

    const config = this.builderEngine.getConfiguration();
    const configHash = this.validationEngine.computeConfigurationHash(config);

    const missionId = missionOverride?.id ?? project.assignedMissionId;
    const mission = missionOverride ?? (missionId ? this.missionRegistry.getMissionById(missionId) : undefined);

    // Latest validation & test reports
    const valReport = project.comprehensiveValidation ?? this.validationEngine.getLatestReport(projectId);
    const testReport = this.latestTestReports.get(projectId);

    const isValStale = valReport ? this.validationEngine.isReportStale(valReport, config) : true;
    const isTestStale = testReport ? testReport.designVersion !== config.version || testReport.configurationHash !== configHash : true;
    const isOverallStale = isValStale || isTestStale;

    const criteria: PreLaunchReadinessCriterion[] = [];

    // 1. Rocket Configuration Validity
    const cfgValid = !isValStale && valReport?.categorySummaries.CONFIGURATION_COMPLETENESS.status === ValidationOverallStatus.PASSED;
    criteria.push({
      id: 'crit_cfg_valid',
      number: 1,
      label: 'Configuration Staging Completeness',
      satisfied: !!cfgValid,
      severity: 'BLOCKING',
      currentValue: cfgValid ? 'Complete' : 'Incomplete / Stale',
      requiredValue: '100% Staging Slots Populated',
      details: cfgValid ? 'All mandatory staging slots and core booster validated.' : 'Empty mandatory slots or missing stage architecture.',
    });

    // 2. Component Availability
    const availValid = !isValStale && (valReport?.categorySummaries.COMPONENT_AVAILABILITY.errorCount ?? 1) === 0;
    criteria.push({
      id: 'crit_comp_avail',
      number: 2,
      label: 'Hardware Ownership & Availability',
      satisfied: availValid,
      severity: 'BLOCKING',
      currentValue: availValid ? 'All Owned' : 'Hardware Deficit',
      requiredValue: 'All Components Owned in Inventory',
      details: availValid ? 'All staged hardware is in stock with zero project conflicts.' : 'Unowned components or project reservation conflicts detected.',
    });

    // 3. Component Compatibility
    const compatValid = !isValStale && (valReport?.categorySummaries.COMPONENT_COMPATIBILITY.errorCount ?? 1) === 0;
    criteria.push({
      id: 'crit_comp_compat',
      number: 3,
      label: 'Mechanical & Tag Compatibility',
      satisfied: compatValid,
      severity: 'BLOCKING',
      currentValue: compatValid ? 'Certified' : 'Incompatible',
      requiredValue: 'Zero Category or Tag Violations',
      details: compatValid ? 'All components match slot category and interface tags.' : 'Category mismatch or invalid staging tags.',
    });

    // 4. Mission Payload Suitability
    const payloadValid = !mission || (!isValStale && (valReport?.missionCompatibility?.requiredEquipmentSatisfied ?? false));
    criteria.push({
      id: 'crit_payload_suit',
      number: 4,
      label: 'Mission Payload Platform Suitability',
      satisfied: payloadValid,
      severity: mission ? 'BLOCKING' : 'ADVISORY',
      currentValue: mission
        ? valReport?.missionCompatibility?.payloadCategoryInstalled ?? 'None'
        : 'Standby / Unassigned',
      requiredValue: mission?.engineeringRequirements?.payloadType ?? 'Standard Bus',
      details: !mission
        ? 'No mission contract assigned. Staged for generic test flight.'
        : payloadValid
        ? 'Payload module matches mission contract requirement.'
        : 'Payload platform mismatch or missing mission payload module.',
    });

    // 5. Required Fictional Performance Ratings
    const minPerf = mission ? Math.max(100, Math.round((mission.engineeringRequirements?.minPayloadMassKg ?? 50) * 1.5)) : 100;
    const perfSatisfied = !isValStale && (valReport?.ratings.overallPerformanceRating ?? 0) >= minPerf;
    criteria.push({
      id: 'crit_perf_ratings',
      number: 5,
      label: 'Thrust & Propulsion Lift Performance',
      satisfied: perfSatisfied,
      severity: 'BLOCKING',
      currentValue: `${valReport?.ratings.overallPerformanceRating ?? 0} Pts`,
      requiredValue: `≥ ${minPerf} Pts`,
      details: perfSatisfied ? 'Propulsion rating satisfies vehicle mass lift demands.' : 'Insufficient thrust to satisfy mission ascent trajectory.',
    });

    // 6. Reliability Requirements
    const minRel = mission ? Math.min(95, 70 + (mission.sequenceLevel ?? 1) * 3) : 75;
    const relSatisfied = !isValStale && (valReport?.ratings.reliabilityRating ?? 0) >= minRel;
    criteria.push({
      id: 'crit_rel_ratings',
      number: 6,
      label: 'Certified Subsystems Reliability Rating',
      satisfied: relSatisfied,
      severity: 'BLOCKING',
      currentValue: `${(valReport?.ratings.reliabilityRating ?? 0).toFixed(1)}%`,
      requiredValue: `≥ ${minRel.toFixed(1)}%`,
      details: relSatisfied ? 'Certified composite reliability meets mission standards.' : 'Reliability score below organizational flight certification threshold.',
    });

    // 7. Technology & Rank Requirements
    const techSatisfied = !isValStale && (valReport?.categorySummaries.TECHNOLOGY_VALIDATION.errorCount ?? 1) === 0;
    criteria.push({
      id: 'crit_tech_rank',
      number: 7,
      label: 'Research Node & Director Rank Authorization',
      satisfied: techSatisfied,
      severity: 'BLOCKING',
      currentValue: techSatisfied ? 'Authorized' : 'Unresearched / Rank Locked',
      requiredValue: 'All Tech Nodes Researched & Rank Satisfied',
      details: techSatisfied ? 'All staged hardware authorized by agency research standing.' : 'Unresearched technology nodes or insufficient director rank.',
    });

    // 8. Applicable Testing Requirements
    const testSatisfied = !isTestStale && testReport && testReport.status !== RocketTestStatus.FAILED;
    criteria.push({
      id: 'crit_test_run',
      number: 8,
      label: 'Test-Bench Simulation Clearance',
      satisfied: !!testSatisfied,
      severity: 'BLOCKING',
      currentValue: isTestStale ? 'Stale / Required' : testReport ? testReport.status : 'Never Tested',
      requiredValue: 'Certified Test Run (PASSED or WARNINGS)',
      details: isTestStale
        ? 'Design changed after last test run. Execute test bench assessment.'
        : testReport?.status === RocketTestStatus.FAILED
        ? 'Latest test bench assessment failed. Resolve defects and re-run.'
        : testReport
        ? `Test bench assessment certified (Score: ${testReport.overallScore}/100).`
        : 'Test bench assessment required before launch rollout.',
    });

    // 9. Mission Assignment
    const missionAssigned = !!mission;
    criteria.push({
      id: 'crit_mission_assigned',
      number: 9,
      label: 'Formal Mission Contract Assignment',
      satisfied: missionAssigned,
      severity: 'ADVISORY',
      currentValue: mission ? mission.name : 'Unassigned Standby',
      requiredValue: 'Active Mission Contract',
      details: missionAssigned ? `Assigned to flight contract: ${mission.name}` : 'Unassigned vehicle will operate under engineering standby.',
    });

    // 10. Current Design Version Integrity
    const versionIntegrity = !isOverallStale;
    criteria.push({
      id: 'crit_version_integrity',
      number: 10,
      label: 'Design Version & Hash Integrity',
      satisfied: versionIntegrity,
      severity: 'BLOCKING',
      currentValue: config.version,
      requiredValue: `Matching Hash (${configHash.substring(0, 12)}...)`,
      details: versionIntegrity ? 'Validation and test records match active vehicle version.' : 'Configuration modified in builder since last validation/test run.',
    });

    const blockingErrorsCount = criteria.filter(c => !c.satisfied && c.severity === 'BLOCKING').length;
    const warningsCount = criteria.filter(c => !c.satisfied && c.severity === 'ADVISORY').length;

    let status: PreLaunchReadinessStatus;
    if (blockingErrorsCount > 0) {
      if (!valReport && !testReport) {
        status = PreLaunchReadinessStatus.NOT_PREPARED;
      } else if (!testReport || isTestStale) {
        status = PreLaunchReadinessStatus.AWAITING_ASSESSMENT;
      } else {
        status = PreLaunchReadinessStatus.ASSESSMENT_FAILED;
      }
    } else if (warningsCount > 0) {
      status = PreLaunchReadinessStatus.READY_WITH_WARNINGS;
    } else {
      status = PreLaunchReadinessStatus.READY_FOR_MISSION_DEPLOYMENT;
    }

    const isReadyForDeployment =
      status === PreLaunchReadinessStatus.READY_FOR_MISSION_DEPLOYMENT ||
      status === PreLaunchReadinessStatus.READY_WITH_WARNINGS;

    let message: string;
    if (isReadyForDeployment) {
      message = warningsCount > 0
        ? `Vehicle certified with ${warningsCount} advisory item(s). Cleared for launch pad rollout.`
        : 'All 10 pre-launch criteria fully satisfied. Vehicle is CLEARED FOR MISSION DEPLOYMENT.';
    } else {
      message = `Pre-launch readiness failed: ${blockingErrorsCount} blocking requirement(s) prevent rollout clearance.`;
    }

    const deploymentClearance = isReadyForDeployment
      ? {
          launchComplexEligible: true,
          launchComplexId: 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
          facilityName: 'Launch Complex Pad Alpha',
          padDesignation: 'PAD-01',
          clearedMissionId: mission?.id,
          clearedDesignVersion: config.version,
          rolloutStatus: 'CLEARED FOR ROLLOUT',
        }
      : undefined;

    const evaluation: PreLaunchReadinessEvaluation = {
      evaluationId: `readiness_${projectId}_${Date.now()}`,
      projectId,
      projectName: project.name,
      designVersion: config.version,
      status,
      isReadyForDeployment,
      assignedMissionId: mission?.id,
      assignedMissionName: mission?.name,
      criteria,
      blockingErrorsCount,
      warningsCount,
      evaluatedAt: Date.now(),
      isStale: isOverallStale,
      deploymentClearance,
      message,
    };

    if (this.eventBus) {
      this.eventBus.emit('rocket:readiness_evaluated' as any, {
        projectId,
        status,
        isReadyForDeployment,
        evaluation,
      });
    }

    return evaluation;
  }

  // =========================================================================
  // 4. LAUNCH COMPLEX INTEGRATION & DEPLOYMENT
  // =========================================================================

  /**
   * Authorize deployment of a certified rocket to Launch Complex Pad Alpha
   */
  public deployToLaunchComplex(projectId: string): {
    success: boolean;
    deploymentId?: string;
    launchComplexId?: string;
    padDesignation?: string;
    message: string;
  } {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      return { success: false, message: `Rocket project "${projectId}" not found.` };
    }

    const readiness = this.evaluatePreLaunchReadiness(projectId);
    if (!readiness.isReadyForDeployment) {
      return {
        success: false,
        message: `Deployment rejected: ${readiness.blockingErrorsCount} blocking criteria prevent launch rollout.`,
      };
    }

    const deploymentId = `deploy_${projectId}_${Date.now()}`;
    this.launchComplexDeployments.set(projectId, {
      projectId,
      missionId: project.assignedMissionId,
      designVersion: readiness.designVersion,
      deployedAt: Date.now(),
    });

    // Update rocket project status
    project.status = RocketProjectStatus.VALIDATED;

    // If an active mission is assigned, mark its vehicle task configured
    if (project.assignedMissionId) {
      const activeInstance = this.lifecycleManager.getActiveInstanceForMission(project.assignedMissionId);
      if (activeInstance) {
        const vehicleTask = activeInstance.preparation.tasks.find(
          t => t.type === PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION
        );
        if (vehicleTask) {
          vehicleTask.status = PreparationTaskStatus.CONFIGURED;
          vehicleTask.configRef = project.projectId;
          vehicleTask.statusNotes = `Vehicle deployed to Pad Alpha: ${project.name} (${readiness.designVersion})`;
        }
      }
    }

    if (this.eventBus) {
      this.eventBus.emit('rocket:deployed_to_launch_complex' as any, {
        projectId,
        deploymentId,
        launchComplexId: 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
        padDesignation: 'PAD-01',
        designVersion: readiness.designVersion,
        missionId: project.assignedMissionId,
      });
    }

    Logger.info(
      'ROCKET_TESTING_MANAGER',
      `Vehicle "${project.name}" (${readiness.designVersion}) authorized and deployed to Launch Complex Pad Alpha.`
    );

    return {
      success: true,
      deploymentId,
      launchComplexId: 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
      padDesignation: 'PAD-01',
      message: `Vehicle "${project.name}" deployed to Launch Complex Pad Alpha. Ready for pre-launch rollout.`,
    };
  }

  // =========================================================================
  // 5. TEST HISTORY & CACHE ACCESS
  // =========================================================================

  public getTestHistory(projectId: string): RocketTestRunReport[] {
    return [...(this.testHistory.get(projectId) ?? [])];
  }

  public getLatestTestReport(projectId: string): RocketTestRunReport | undefined {
    return this.latestTestReports.get(projectId);
  }

  public getDeployment(projectId: string) {
    return this.launchComplexDeployments.get(projectId);
  }
}
