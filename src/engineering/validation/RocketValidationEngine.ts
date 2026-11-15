/**
 * INTERSTELLAR CONTINUUM - Central Rocket Validation Engine
 * Authoritative, read-only validation engine evaluating vehicle configurations across
 * all 7 canonical categories, computing deterministic readiness status, educational
 * trade-off analyses, and maintaining historical validation records.
 *
 * NOTE: All validation is performed with abstract game-balance units.
 * Real-world physics, propellant chemistry, and launch procedures are strictly excluded.
 */

import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import {
  RocketComponentCategory,
  RocketComponentDefinition,
  ComponentAvailabilityState,
  ComponentCompatibilityTag,
} from '../RocketComponentTypes';
import {
  ModularRocketConfiguration,
  ConfigurationSlotType,
} from '../builder/RocketBuilderTypes';
import { RocketClassRating } from '../RocketProjectTypes';
import { RocketComponentRegistry } from '../RocketComponentRegistry';
import { ComponentInventoryService } from '../ComponentInventoryService';
import { MissionDefinition } from '../../missions/MissionTypes';
import { DestinationId } from '../../destinations/DestinationTypes';
import {
  ValidationCategory,
  ValidationSeverity,
  ValidationOverallStatus,
  ValidationIssue,
  CategoryValidationResult,
  StructuralAndConfigurationRatings,
  MissionCompatibilityCheckpoint,
  MissionCompatibilityReport,
  EducationalTradeOffTopic,
  EducationalTradeOffInsight,
  RocketValidationHistoryRecord,
  ComprehensiveRocketValidationReport,
  RocketValidationContext,
} from './RocketValidationTypes';

export class RocketValidationEngine {
  private static instance?: RocketValidationEngine;
  public static readonly ENGINE_VERSION = '2.4.0';

  private eventBus?: EventBus;
  private registry: RocketComponentRegistry;
  private inventoryService: ComponentInventoryService;

  // Historical validation records indexed by projectId
  private validationHistory: Map<string, RocketValidationHistoryRecord[]> = new Map();

  // Cached latest report by projectId
  private latestReports: Map<string, ComprehensiveRocketValidationReport> = new Map();

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.registry = RocketComponentRegistry.getInstance(eventBus);
    this.inventoryService = ComponentInventoryService.getInstance(eventBus);
  }

  public static getInstance(eventBus?: EventBus): RocketValidationEngine {
    if (!RocketValidationEngine.instance) {
      RocketValidationEngine.instance = new RocketValidationEngine(eventBus);
    }
    return RocketValidationEngine.instance;
  }

  public static resetInstance(): void {
    RocketValidationEngine.instance = undefined;
  }

  // =========================================================================
  // CORE VALIDATION PIPELINE (READ-ONLY)
  // =========================================================================

  /**
   * Run comprehensive validation across all 7 categories.
   * Completely read-only: does NOT deduct credits, mutate inventory, or alter configuration.
   */
  public validate(context: RocketValidationContext): ComprehensiveRocketValidationReport {
    const reportId = `val_rep_${context.projectId}_${Date.now()}`;
    const cfg = context.configuration;
    const configHash = this.computeConfigurationHash(cfg);

    const issues: ValidationIssue[] = [];

    // 1. CONFIGURATION COMPLETENESS
    const completenessIssues = this.validateCompleteness(cfg);
    issues.push(...completenessIssues);

    // 2. COMPONENT AVAILABILITY
    const availabilityIssues = this.validateAvailability(cfg, context);
    issues.push(...availabilityIssues);

    // 3. COMPONENT COMPATIBILITY
    const compatibilityIssues = this.validateCompatibility(cfg);
    issues.push(...compatibilityIssues);

    // 4. STRUCTURAL AND CONFIGURATION RATINGS
    const { ratings, ratingIssues } = this.evaluateRatingsAndStructural(cfg);
    issues.push(...ratingIssues);

    // 5. MISSION COMPATIBILITY
    let missionReport: MissionCompatibilityReport | undefined;
    if (context.mission) {
      const { report, missionIssues } = this.validateMissionCompatibility(cfg, ratings, context.mission);
      missionReport = report;
      issues.push(...missionIssues);
    } else {
      issues.push({
        id: 'iss_mission_unassigned',
        category: ValidationCategory.MISSION_COMPATIBILITY,
        severity: ValidationSeverity.INFORMATION,
        title: 'Unassigned Mission Profile',
        explanation: 'Vehicle is currently operating in open test stand configuration with no active mission constraints.',
        recommendedCorrection: 'Assign a mission contract in Mission Operations or Vehicle Overview to certify mission flight profile.',
        blocksReadiness: false,
      });
    }

    // 6. ECONOMIC VALIDATION
    const economicIssues = this.validateEconomics(cfg, ratings, context);
    issues.push(...economicIssues);

    // 7. TECHNOLOGY VALIDATION
    const techIssues = this.validateTechnology(cfg, context);
    issues.push(...techIssues);

    // Compute Category Summaries
    const categorySummaries = this.buildCategorySummaries(issues);

    // Compute Overall Deterministic Status
    const errorCount = issues.filter(i => i.severity === ValidationSeverity.ERROR).length;
    const warningCount = issues.filter(i => i.severity === ValidationSeverity.WARNING).length;

    let overallStatus: ValidationOverallStatus;
    if (errorCount > 0) {
      overallStatus = ValidationOverallStatus.FAILED;
    } else if (warningCount > 0) {
      overallStatus = ValidationOverallStatus.PASSED_WITH_WARNINGS;
    } else {
      overallStatus = ValidationOverallStatus.PASSED;
    }

    const isValid = overallStatus === ValidationOverallStatus.PASSED ||
                    overallStatus === ValidationOverallStatus.PASSED_WITH_WARNINGS;

    // Synthesize Educational Trade-Off Insights
    const educationalTradeOffs = this.synthesizeEducationalTradeOffs(cfg, ratings, context.mission);

    // Generate Human-Readable Summary Text
    const summaryText = this.buildSummaryText(overallStatus, errorCount, warningCount, ratings, context.mission);

    const report: ComprehensiveRocketValidationReport = {
      reportId,
      projectId: context.projectId,
      configurationId: cfg.configurationId,
      configurationVersion: cfg.version,
      configurationHash: configHash,
      validatedAt: Date.now(),
      status: overallStatus,
      isValid,
      isStale: false,
      issues,
      categorySummaries,
      ratings,
      missionCompatibility: missionReport,
      educationalTradeOffs,
      engineVersion: RocketValidationEngine.ENGINE_VERSION,
      summaryText,
    };

    // Store in latest cache & history
    this.latestReports.set(context.projectId, report);
    this.recordHistory(report, context.mission?.id);

    // Dispatch Events
    if (this.eventBus) {
      this.eventBus.emit('rocket:validation_completed' as any, {
        projectId: context.projectId,
        report,
        isValid,
        status: overallStatus,
      });

      if (isValid) {
        this.eventBus.emit('rocket:validation_passed' as any, {
          projectId: context.projectId,
          report,
          status: overallStatus,
        });
      } else {
        this.eventBus.emit('rocket:validation_failed' as any, {
          projectId: context.projectId,
          report,
          errorCount,
        });
      }
    }

    Logger.info(
      'ROCKET_VALIDATION_ENGINE',
      `Validation completed for project "${context.projectId}" (${cfg.version}): ${overallStatus} (${errorCount} errors, ${warningCount} warnings).`
    );

    return report;
  }

  // =========================================================================
  // 1. CONFIGURATION COMPLETENESS
  // =========================================================================

  private validateCompleteness(cfg: ModularRocketConfiguration): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Stage groups check
    if (!cfg.stages || cfg.stages.length === 0) {
      issues.push({
        id: 'iss_comp_no_stages',
        category: ValidationCategory.CONFIGURATION_COMPLETENESS,
        severity: ValidationSeverity.ERROR,
        title: 'Missing Stage Architecture',
        explanation: 'Rocket configuration defines zero stage groups. A vehicle must possess at least one core booster stage.',
        recommendedCorrection: 'Add a Stage 1 Booster Core group in the Stage Architecture panel.',
        blocksReadiness: true,
      });
      return issues;
    }

    // Check Stage 1 is Lower Booster
    const stage1 = cfg.stages.find(s => s.stageNumber === 1);
    if (!stage1) {
      issues.push({
        id: 'iss_comp_no_stage1',
        category: ValidationCategory.CONFIGURATION_COMPLETENESS,
        severity: ValidationSeverity.ERROR,
        title: 'Missing Stage 1 Core',
        explanation: 'Staging hierarchy does not define a primary Stage 1 Core Booster.',
        recommendedCorrection: 'Ensure Stage 1 is defined as the foundational core booster.',
        blocksReadiness: true,
      });
    } else if (stage1.isUpperStage) {
      issues.push({
        id: 'iss_comp_stage1_not_booster',
        category: ValidationCategory.CONFIGURATION_COMPLETENESS,
        severity: ValidationSeverity.ERROR,
        title: 'Invalid Stage 1 Classification',
        explanation: 'Stage 1 is classified as an upper stage. Stage 1 must be configured as a booster core.',
        recommendedCorrection: 'Reclassify Stage 1 as a lower booster stage.',
        blocksReadiness: true,
      });
    }

    // Required slot validation across all stages
    const installedCategories = new Set<RocketComponentCategory>();

    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (!slot.installedComponentId) {
          if (slot.required) {
            issues.push({
              id: `iss_comp_empty_req_${slot.slotId}`,
              category: ValidationCategory.CONFIGURATION_COMPLETENESS,
              severity: ValidationSeverity.ERROR,
              title: `Empty Required Slot: ${slot.label}`,
              explanation: `Stage ${stage.stageNumber} mandatory slot "${slot.label}" (${slot.slotType}) has no component mounted.`,
              affectedSlotId: slot.slotId,
              stageNumber: stage.stageNumber,
              recommendedCorrection: `Mount a compatible ${slot.allowedCategories.join(' / ')} component into ${slot.label}.`,
              blocksReadiness: true,
            });
          } else {
            issues.push({
              id: `iss_comp_empty_opt_${slot.slotId}`,
              category: ValidationCategory.CONFIGURATION_COMPLETENESS,
              severity: ValidationSeverity.INFORMATION,
              title: `Optional Slot Unpopulated: ${slot.label}`,
              explanation: `Stage ${stage.stageNumber} optional slot "${slot.label}" is currently unpopulated.`,
              affectedSlotId: slot.slotId,
              stageNumber: stage.stageNumber,
              recommendedCorrection: 'Mount an auxiliary system if additional functionality or redundancy is desired.',
              blocksReadiness: false,
            });
          }
        } else {
          // Check for duplicate references
          const comp = this.registry.getComponent(slot.installedComponentId);
          if (comp) {
            installedCategories.add(comp.category);
          }
        }
      }
    }

    // Essential category coverage check
    const essentialCategories = [
      { cat: RocketComponentCategory.STRUCTURE_AND_STAGING, name: 'Structural Airframe' },
      { cat: RocketComponentCategory.PROPULSION_SYSTEMS, name: 'Main Propulsion' },
      { cat: RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS, name: 'Propellant Reservoir' },
      { cat: RocketComponentCategory.GUIDANCE_AND_NAVIGATION, name: 'Flight Guidance Computer' },
    ];

    for (const req of essentialCategories) {
      if (!installedCategories.has(req.cat)) {
        issues.push({
          id: `iss_comp_missing_cat_${req.cat}`,
          category: ValidationCategory.CONFIGURATION_COMPLETENESS,
          severity: ValidationSeverity.ERROR,
          title: `Missing Category: ${req.name}`,
          explanation: `Vehicle configuration does not contain any component from the ${req.cat} category.`,
          recommendedCorrection: `Mount at least one ${req.name} component into the appropriate stage slot.`,
          blocksReadiness: true,
        });
      }
    }

    // Design metadata check
    if (!cfg.name || cfg.name.trim().length === 0) {
      issues.push({
        id: 'iss_comp_blank_name',
        category: ValidationCategory.CONFIGURATION_COMPLETENESS,
        severity: ValidationSeverity.WARNING,
        title: 'Unspecified Vehicle Name',
        explanation: 'Rocket design does not have an official organizational designation.',
        recommendedCorrection: 'Provide a formal project name in Vehicle Overview.',
        blocksReadiness: false,
      });
    }

    return issues;
  }

  // =========================================================================
  // 2. COMPONENT AVAILABILITY
  // =========================================================================

  private validateAvailability(cfg: ModularRocketConfiguration, context: RocketValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (!slot.installedComponentId) continue;

        const compId = slot.installedComponentId;
        const comp = this.registry.getComponent(compId);

        // 1. Definition check (handle corrupted / non-existent IDs)
        if (!comp) {
          issues.push({
            id: `iss_avail_missing_def_${slot.slotId}`,
            category: ValidationCategory.COMPONENT_AVAILABILITY,
            severity: ValidationSeverity.ERROR,
            title: `Corrupted Component Reference: ${compId}`,
            explanation: `Component ID "${compId}" installed in slot "${slot.label}" does not exist in the central registry.`,
            affectedSlotId: slot.slotId,
            affectedComponentId: compId,
            stageNumber: stage.stageNumber,
            recommendedCorrection: 'Remove the invalid component reference and install an authorized component.',
            blocksReadiness: true,
          });
          continue;
        }

        // 2. Dynamic availability state check
        const avail = this.registry.evaluateAvailability(compId);
        if (avail.state === ComponentAvailabilityState.LOCKED) {
          issues.push({
            id: `iss_avail_locked_${compId}`,
            category: ValidationCategory.COMPONENT_AVAILABILITY,
            severity: ValidationSeverity.ERROR,
            title: `Locked Component: ${comp.name}`,
            explanation: `Component "${comp.name}" is classified as LOCKED and is unavailable for flight staging.`,
            affectedSlotId: slot.slotId,
            affectedComponentId: compId,
            stageNumber: stage.stageNumber,
            recommendedCorrection: avail.reason ?? 'Unlock prerequisite organization milestones before staging.',
            blocksReadiness: true,
          });
        }

        // 3. Inventory ownership check
        const ownedQty = context.ownedComponentQuantities
          ? (context.ownedComponentQuantities.get(compId) ?? 0)
          : this.inventoryService.getOwnedQuantity(compId);

        if (ownedQty <= 0) {
          issues.push({
            id: `iss_avail_unowned_${compId}`,
            category: ValidationCategory.COMPONENT_AVAILABILITY,
            severity: ValidationSeverity.ERROR,
            title: `Unowned Component: ${comp.name}`,
            explanation: `Component "${comp.name}" is staged on the vehicle but is not owned in agency inventory.`,
            affectedSlotId: slot.slotId,
            affectedComponentId: compId,
            stageNumber: stage.stageNumber,
            recommendedCorrection: `Procure 1x ${comp.name} from Component Selection for ₵${comp.costCredits.toLocaleString()} Mission Credits.`,
            blocksReadiness: true,
          });
        }

        // 4. Project commitment / conflict check
        if (context.activeProjectReservations) {
          const committedProject = context.activeProjectReservations.get(compId);
          if (committedProject && committedProject !== context.projectId) {
            issues.push({
              id: `iss_avail_conflict_${compId}`,
              category: ValidationCategory.COMPONENT_AVAILABILITY,
              severity: ValidationSeverity.ERROR,
              title: `Inventory Conflict: ${comp.name}`,
              explanation: `Component "${comp.name}" is uniquely allocated to active project "${committedProject}".`,
              affectedSlotId: slot.slotId,
              affectedComponentId: compId,
              stageNumber: stage.stageNumber,
              recommendedCorrection: 'Procure an additional unit or release the component from the competing project.',
              blocksReadiness: true,
            });
          }
        }
      }
    }

    return issues;
  }

  // =========================================================================
  // 3. COMPONENT COMPATIBILITY
  // =========================================================================

  private validateCompatibility(cfg: ModularRocketConfiguration): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (!slot.installedComponentId) continue;

        const comp = this.registry.getComponent(slot.installedComponentId);
        if (!comp) continue;

        // 1. Slot Category Compatibility
        if (!slot.allowedCategories.includes(comp.category)) {
          issues.push({
            id: `iss_compat_cat_${slot.slotId}`,
            category: ValidationCategory.COMPONENT_COMPATIBILITY,
            severity: ValidationSeverity.ERROR,
            title: `Category Mismatch: ${slot.label}`,
            explanation: `Slot "${slot.label}" requires category ${slot.allowedCategories.join(' / ')}, but component "${comp.name}" is ${comp.category}.`,
            affectedSlotId: slot.slotId,
            affectedComponentId: comp.id,
            stageNumber: stage.stageNumber,
            recommendedCorrection: `Replace with a compatible ${slot.allowedCategories.join(' / ')} component.`,
            blocksReadiness: true,
          });
        }

        // 2. Compatibility Tags Check
        if (slot.allowedTags.length > 0) {
          const hasMatchingTag = comp.compatibilityTags.some(t => slot.allowedTags.includes(t));
          if (!hasMatchingTag) {
            issues.push({
              id: `iss_compat_tag_${slot.slotId}`,
              category: ValidationCategory.COMPONENT_COMPATIBILITY,
              severity: ValidationSeverity.ERROR,
              title: `Staging Tag Incompatibility: ${comp.name}`,
              explanation: `Component "${comp.name}" does not possess any required staging tags for slot "${slot.label}" (Expected: ${slot.allowedTags.join(', ')}).`,
              affectedSlotId: slot.slotId,
              affectedComponentId: comp.id,
              stageNumber: stage.stageNumber,
              recommendedCorrection: `Mount a component carrying one of the authorized compatibility tags: [${slot.allowedTags.join(', ')}].`,
              blocksReadiness: true,
            });
          }
        }

        // 3. Specific Staging Heuristics
        // Vacuum engine on sea-level booster core
        if (stage.stageNumber === 1 && comp.compatibilityTags.includes(ComponentCompatibilityTag.UPPER_SECTION)) {
          if (comp.category === RocketComponentCategory.PROPULSION_SYSTEMS) {
            issues.push({
              id: `iss_compat_vac_booster_${slot.slotId}`,
              category: ValidationCategory.COMPONENT_COMPATIBILITY,
              severity: ValidationSeverity.WARNING,
              title: `Sub-Optimal Propulsion: ${comp.name}`,
              explanation: `Vacuum-optimized propulsion unit "${comp.name}" installed on Stage 1 Booster Core will experience severe atmospheric efficiency loss at sea-level launch.`,
              affectedSlotId: slot.slotId,
              affectedComponentId: comp.id,
              stageNumber: stage.stageNumber,
              recommendedCorrection: 'Consider replacing with a sea-level thrust vector booster unit for optimal liftoff performance.',
              blocksReadiness: false,
            });
          }
        }

        // Heavy booster engine on upper vacuum stage
        if (stage.isUpperStage && comp.compatibilityTags.includes(ComponentCompatibilityTag.LOWER_BOOSTER)) {
          if (comp.category === RocketComponentCategory.PROPULSION_SYSTEMS) {
            issues.push({
              id: `iss_compat_booster_upper_${slot.slotId}`,
              category: ValidationCategory.COMPONENT_COMPATIBILITY,
              severity: ValidationSeverity.WARNING,
              title: `Excessive Mass Penalty: ${comp.name}`,
              explanation: `Heavy sea-level booster engine mounted on upper vacuum stage imposes an excessive dry mass penalty, reducing vacuum insertion capability.`,
              affectedSlotId: slot.slotId,
              affectedComponentId: comp.id,
              stageNumber: stage.stageNumber,
              recommendedCorrection: 'Replace with a lightweight upper-stage vacuum expander engine.',
              blocksReadiness: false,
            });
          }
        }
      }
    }

    return issues;
  }

  // =========================================================================
  // 4. STRUCTURAL AND CONFIGURATION RATINGS
  // =========================================================================

  private evaluateRatingsAndStructural(cfg: ModularRocketConfiguration): {
    ratings: StructuralAndConfigurationRatings;
    ratingIssues: ValidationIssue[];
  } {
    const ratingIssues: ValidationIssue[] = [];

    let totalMassUnits = 0;
    let performanceRating = 0;
    let structuralRating = 0;
    let payloadCapacityRating = 0;
    let powerGenWatts = 0;
    let powerDemandWatts = 0;
    let communicationRating = 0;
    let protectionRating = 0;
    let installedComponentCount = 0;
    let requiredSlotCount = 0;
    let filledRequiredSlotCount = 0;

    const reliabilities: number[] = [];

    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (slot.required) {
          requiredSlotCount++;
          if (slot.installedComponentId) {
            filledRequiredSlotCount++;
          }
        }

        if (!slot.installedComponentId) continue;
        const comp = this.registry.getComponent(slot.installedComponentId);
        if (!comp) continue;

        installedComponentCount++;
        totalMassUnits += comp.massUnits;

        const s = comp.stats;
        if (s.performanceRating) performanceRating += s.performanceRating;
        if (s.capacityRating) payloadCapacityRating += s.capacityRating;
        if (s.structuralRating) structuralRating += s.structuralRating;
        if (s.powerGenerationWatts) powerGenWatts += s.powerGenerationWatts;
        if (s.powerDemandWatts) powerDemandWatts += s.powerDemandWatts;
        if (s.communicationRating) communicationRating += s.communicationRating;
        if (s.protectionRating) protectionRating += s.protectionRating;

        reliabilities.push(s.reliabilityRating);
      }
    }

    // Composite reliability calculation (geometric/harmonic balance)
    let compositeReliability = 100;
    if (reliabilities.length > 0) {
      const avg = reliabilities.reduce((acc, r) => acc + r, 0) / reliabilities.length;
      const complexityPenalty = Math.max(0, (reliabilities.length - 6) * 0.8);
      compositeReliability = Math.max(50, Math.min(99.9, avg - complexityPenalty));
    } else {
      compositeReliability = 0;
    }

    const netPowerWatts = powerGenWatts - powerDemandWatts;
    const completenessPercent = requiredSlotCount > 0
      ? Math.round((filledRequiredSlotCount / requiredSlotCount) * 100)
      : 0;

    // Fictional cost calculation
    let estimatedCostCredits = 0;
    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (slot.installedComponentId) {
          const comp = this.registry.getComponent(slot.installedComponentId);
          if (comp) estimatedCostCredits += comp.costCredits;
        }
      }
    }

    // Rating rule evaluations
    // 1. Thrust-to-Weight / Performance check
    const minRequiredPerformance = Math.round(totalMassUnits * 0.85);
    if (performanceRating < minRequiredPerformance) {
      ratingIssues.push({
        id: 'iss_rate_perf_deficient',
        category: ValidationCategory.STRUCTURAL_AND_RATINGS,
        severity: ValidationSeverity.ERROR,
        title: 'Deficient Propulsion Performance',
        explanation: `Total propulsion performance score (${performanceRating}) is insufficient to lift total vehicle mass rating (${totalMassUnits} MU). Minimum required rating is ${minRequiredPerformance}.`,
        recommendedCorrection: 'Mount a higher-rated booster engine or reduce vehicle mass units.',
        blocksReadiness: true,
      });
    }

    // 2. Net Electrical Power deficit
    if (netPowerWatts < 0) {
      ratingIssues.push({
        id: 'iss_rate_power_deficit',
        category: ValidationCategory.STRUCTURAL_AND_RATINGS,
        severity: ValidationSeverity.WARNING,
        title: 'Negative Power Balance Margin',
        explanation: `Total system power demand (${powerDemandWatts} W) exceeds generation capability (${powerGenWatts} W) by ${Math.abs(netPowerWatts)} W. Vehicle is operating on limited battery reserve.`,
        recommendedCorrection: 'Install deployable solar panels or higher-capacity electrical generation components.',
        blocksReadiness: false,
      });
    }

    // 3. Low Reliability Warning
    if (compositeReliability < 80) {
      ratingIssues.push({
        id: 'iss_rate_low_reliability',
        category: ValidationCategory.STRUCTURAL_AND_RATINGS,
        severity: ValidationSeverity.WARNING,
        title: 'Sub-Optimal System Reliability',
        explanation: `Overall composite vehicle reliability rating is ${compositeReliability.toFixed(1)}% (below recommended 80.0% threshold). Increased probability of in-flight subsystems telemetry glitches.`,
        recommendedCorrection: 'Replace low-tier or high-risk components with high-reliability certified modules.',
        blocksReadiness: false,
      });
    }

    const isFlightReady = completenessPercent === 100 &&
                          performanceRating >= minRequiredPerformance &&
                          ratingIssues.filter(i => i.severity === ValidationSeverity.ERROR).length === 0;

    const ratings: StructuralAndConfigurationRatings = {
      totalMassUnits,
      overallPerformanceRating: performanceRating,
      structuralRating,
      payloadCapacityRating,
      reliabilityRating: compositeReliability,
      powerGenerationWatts: powerGenWatts,
      powerDemandWatts: powerDemandWatts,
      netPowerWatts,
      communicationRating,
      protectionRating,
      componentCount: installedComponentCount,
      completenessPercent,
      estimatedCostCredits,
      isFlightReady,
    };

    return { ratings, ratingIssues };
  }

  // =========================================================================
  // 5. MISSION COMPATIBILITY
  // =========================================================================

  private validateMissionCompatibility(
    cfg: ModularRocketConfiguration,
    ratings: StructuralAndConfigurationRatings,
    mission: MissionDefinition
  ): { report: MissionCompatibilityReport; missionIssues: ValidationIssue[] } {
    const missionIssues: ValidationIssue[] = [];
    const checkpoints: MissionCompatibilityCheckpoint[] = [];

    // Find installed payload component
    let installedPayloadComp: RocketComponentDefinition | undefined;
    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (slot.slotType === ConfigurationSlotType.PAYLOAD && slot.installedComponentId) {
          const comp = this.registry.getComponent(slot.installedComponentId);
          if (comp && comp.category === RocketComponentCategory.PAYLOAD_AND_FAIRING) {
            installedPayloadComp = comp;
            break;
          }
        }
      }
      if (installedPayloadComp) break;
    }

    // 1. Destination Requirement Check
    const destinationId = mission.destinationId;
    let destPassed = true;
    let destDetail = `Destination "${destinationId}" reachability verified.`;

    if (destinationId !== DestinationId.EARTH && cfg.classRating === RocketClassRating.SUBORBITAL_TEST) {
      destPassed = false;
      destDetail = `Suborbital vehicle class cannot achieve orbital trajectory for destination "${destinationId}".`;
      missionIssues.push({
        id: 'iss_miss_dest_class_mismatch',
        category: ValidationCategory.MISSION_COMPATIBILITY,
        severity: ValidationSeverity.ERROR,
        title: 'Destination Class Incompatibility',
        explanation: `Mission destination "${destinationId}" requires orbital capability, but vehicle is rated for ${cfg.classRating}.`,
        recommendedCorrection: 'Upgrade vehicle class to LIGHT_ORBITAL or MEDIUM_LIFT.',
        blocksReadiness: true,
      });
    }
    checkpoints.push({
      id: 'chk_dest',
      label: 'Target Destination Capability',
      passed: destPassed,
      requiredValue: destinationId.toUpperCase(),
      currentValue: cfg.classRating,
      details: destDetail,
    });

    // 2. Payload Category Match
    const requiredPayloadType = mission.engineeringRequirements?.payloadType;
    let payloadCatPassed = true;
    let payloadDetail = 'Payload envelope verified.';

    if (requiredPayloadType) {
      if (!installedPayloadComp) {
        payloadCatPassed = false;
        payloadDetail = `Mission requires payload platform [${requiredPayloadType}], but no payload module is installed.`;
        missionIssues.push({
          id: 'iss_miss_no_payload',
          category: ValidationCategory.MISSION_COMPATIBILITY,
          severity: ValidationSeverity.ERROR,
          title: 'Missing Mission Payload',
          explanation: `Mission "${mission.name}" requires payload platform "${requiredPayloadType}", but the payload slot is unpopulated.`,
          recommendedCorrection: `Mount a compatible ${requiredPayloadType} payload module into the Stage 2 Payload slot.`,
          blocksReadiness: true,
        });
      } else if (installedPayloadComp.referencePayloadType && installedPayloadComp.referencePayloadType !== requiredPayloadType) {
        payloadCatPassed = false;
        payloadDetail = `Payload platform mismatch: Installed "${installedPayloadComp.referencePayloadType}", Required "${requiredPayloadType}".`;
        missionIssues.push({
          id: 'iss_miss_payload_type_mismatch',
          category: ValidationCategory.MISSION_COMPATIBILITY,
          severity: ValidationSeverity.ERROR,
          title: 'Payload Platform Mismatch',
          explanation: `Mission requires "${requiredPayloadType}", but vehicle has "${installedPayloadComp.name}" (${installedPayloadComp.referencePayloadType}) mounted.`,
          affectedComponentId: installedPayloadComp.id,
          recommendedCorrection: `Replace with a certified ${requiredPayloadType} module.`,
          blocksReadiness: true,
        });
      }
    }
    checkpoints.push({
      id: 'chk_payload_type',
      label: 'Payload Platform Match',
      passed: payloadCatPassed,
      requiredValue: requiredPayloadType ?? 'Satellite / Probe',
      currentValue: installedPayloadComp?.name ?? 'None',
      details: payloadDetail,
    });

    // 3. Minimum Payload Lift Capacity
    const minPayloadCapacity = mission.engineeringRequirements?.minPayloadMassKg ?? 0;
    const payloadCapPassed = ratings.payloadCapacityRating >= minPayloadCapacity;
    if (!payloadCapPassed) {
      missionIssues.push({
        id: 'iss_miss_payload_cap_deficit',
        category: ValidationCategory.MISSION_COMPATIBILITY,
        severity: ValidationSeverity.ERROR,
        title: 'Insufficient Payload Capacity',
        explanation: `Mission requires ${minPayloadCapacity} payload capacity rating units. Current vehicle rating is ${ratings.payloadCapacityRating}.`,
        recommendedCorrection: 'Mount a higher-capacity payload interface or increase booster thrust output.',
        blocksReadiness: true,
      });
    }
    checkpoints.push({
      id: 'chk_payload_cap',
      label: 'Minimum Payload Capacity Rating',
      passed: payloadCapPassed,
      requiredValue: `${minPayloadCapacity} Units`,
      currentValue: `${ratings.payloadCapacityRating} Units`,
      details: payloadCapPassed ? 'Payload capacity rating meets mission profile.' : 'Payload capacity rating deficit.',
    });

    // 4. Minimum Propulsion Performance Rating
    const minPerf = Math.max(100, Math.round((mission.engineeringRequirements?.minPayloadMassKg ?? 50) * 1.5));
    const perfPassed = ratings.overallPerformanceRating >= minPerf;
    if (!perfPassed) {
      missionIssues.push({
        id: 'iss_miss_perf_deficit',
        category: ValidationCategory.MISSION_COMPATIBILITY,
        severity: ValidationSeverity.ERROR,
        title: 'Propulsion Performance Deficit',
        explanation: `Mission contract requires minimum performance score of ${minPerf}. Current configuration score is ${ratings.overallPerformanceRating}.`,
        recommendedCorrection: 'Upgrade Stage 1 booster propulsion or auxiliary staging.',
        blocksReadiness: true,
      });
    }
    checkpoints.push({
      id: 'chk_performance',
      label: 'Minimum Propulsion Performance',
      passed: perfPassed,
      requiredValue: `${minPerf} Pts`,
      currentValue: `${ratings.overallPerformanceRating} Pts`,
      details: perfPassed ? 'Sufficient propulsion performance.' : 'Thrust score below mission threshold.',
    });

    // 5. Certified Reliability Threshold
    const minRel = Math.min(95, 70 + (mission.sequenceLevel ?? 1) * 3);
    const relPassed = ratings.reliabilityRating >= minRel;
    if (!relPassed) {
      missionIssues.push({
        id: 'iss_miss_rel_deficit',
        category: ValidationCategory.MISSION_COMPATIBILITY,
        severity: ValidationSeverity.ERROR,
        title: 'Unsatisfied Reliability Threshold',
        explanation: `Mission contract mandates certified composite reliability of ${minRel.toFixed(1)}%. Current vehicle reliability is ${ratings.reliabilityRating.toFixed(1)}%.`,
        recommendedCorrection: 'Replace unreliable or uncertified components with certified flight hardware.',
        blocksReadiness: true,
      });
    }
    checkpoints.push({
      id: 'chk_reliability',
      label: 'Certified System Reliability',
      passed: relPassed,
      requiredValue: `${minRel.toFixed(1)}%`,
      currentValue: `${ratings.reliabilityRating.toFixed(1)}%`,
      details: relPassed ? 'Meets certified reliability threshold.' : 'Reliability score below contract requirement.',
    });

    // 6. Minimum Communication Rating
    const minComms = Math.max(1, Math.round((mission.engineeringRequirements?.communicationBandwidthKbps ?? 64) / 64));
    const commsPassed = ratings.communicationRating >= minComms;
    if (!commsPassed) {
      missionIssues.push({
        id: 'iss_miss_comms_deficit',
        category: ValidationCategory.MISSION_COMPATIBILITY,
        severity: ValidationSeverity.WARNING,
        title: 'Telemetry Telecommunication Advisory',
        explanation: `Mission specifies telemetry bandwidth rating of ${minComms}. Dedicated payload communications setup must fulfill telemetry requirements prior to flight.`,
        recommendedCorrection: 'Mount an auxiliary telemetry antenna or configure spacecraft communication transponder.',
        blocksReadiness: false,
      });
    }
    checkpoints.push({
      id: 'chk_comms',
      label: 'Communication Telemetry Rating',
      passed: commsPassed,
      requiredValue: `${minComms} Pts`,
      currentValue: `${ratings.communicationRating} Pts`,
      details: commsPassed ? 'Telemetry bandwidth certified.' : 'Insufficient communication antenna gain.',
    });

    const allCriteriaSatisfied = checkpoints.every(c => c.passed);

    const report: MissionCompatibilityReport = {
      missionId: mission.id,
      missionName: mission.name,
      destinationId: mission.destinationId,
      payloadCategoryRequired: requiredPayloadType ?? 'Satellite / Probe',
      payloadCategoryInstalled: installedPayloadComp?.name,
      minPayloadCapacity,
      currentPayloadCapacity: ratings.payloadCapacityRating,
      minPerformanceRating: minPerf,
      currentPerformanceRating: ratings.overallPerformanceRating,
      minReliabilityRating: minRel,
      currentReliabilityRating: ratings.reliabilityRating,
      minCommunicationRating: minComms,
      currentCommunicationRating: ratings.communicationRating,
      requiredEquipmentSatisfied: payloadCatPassed,
      allCriteriaSatisfied,
      checkpoints,
    };

    return { report, missionIssues };
  }

  // =========================================================================
  // 6. ECONOMIC VALIDATION
  // =========================================================================

  private validateEconomics(
    cfg: ModularRocketConfiguration,
    _ratings: StructuralAndConfigurationRatings,
    context: RocketValidationContext
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const availableCredits = context.availableCredits !== undefined
      ? context.availableCredits
      : 1_000_000; // default safe headroom if service not passed

    // Calculate unowned procurement cost
    let unownedCost = 0;
    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (!slot.installedComponentId) continue;
        const comp = this.registry.getComponent(slot.installedComponentId);
        if (!comp) continue;

        const owned = context.ownedComponentQuantities
          ? (context.ownedComponentQuantities.get(comp.id) ?? 0)
          : this.inventoryService.getOwnedQuantity(comp.id);

        if (owned <= 0) {
          unownedCost += comp.costCredits;
        }
      }
    }

    if (unownedCost > availableCredits) {
      issues.push({
        id: 'iss_econ_insufficient_credits',
        category: ValidationCategory.ECONOMIC_VALIDATION,
        severity: ValidationSeverity.ERROR,
        title: 'Insufficient Mission Credits for Staging',
        explanation: `Procuring unowned staged components requires ₵${unownedCost.toLocaleString()} Mission Credits, but agency balance is ₵${availableCredits.toLocaleString()}.`,
        recommendedCorrection: 'Complete existing contracts or replace costly components with standard inventory items.',
        blocksReadiness: true,
      });
    } else if (unownedCost > 0) {
      issues.push({
        id: 'iss_econ_procurement_pending',
        category: ValidationCategory.ECONOMIC_VALIDATION,
        severity: ValidationSeverity.WARNING,
        title: 'Procurement Investment Required',
        explanation: `Staged design incorporates ₵${unownedCost.toLocaleString()} in unowned hardware that will be purchased upon formal fabrication commit.`,
        recommendedCorrection: 'Verify agency financial reserves before locking in production orders.',
        blocksReadiness: false,
      });
    } else {
      issues.push({
        id: 'iss_econ_all_owned',
        category: ValidationCategory.ECONOMIC_VALIDATION,
        severity: ValidationSeverity.INFORMATION,
        title: 'Zero Procurement Overhead',
        explanation: `All components in this design configuration are fully owned and allocated from existing inventory.`,
        recommendedCorrection: 'Design is economically cleared for immediate integration.',
        blocksReadiness: false,
      });
    }

    return issues;
  }

  // =========================================================================
  // 7. TECHNOLOGY VALIDATION
  // =========================================================================

  private validateTechnology(cfg: ModularRocketConfiguration, context: RocketValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const unlockedTechs = new Set(
      context.unlockedTechIds ?? [
        'tech_basic_rocketry',
        'tech_orbital_dynamics',
        'tech_vacuum_engines',
        'tech_satellites',
      ]
    );
    const orgRank = context.organisationRank ?? 5;

    for (const stage of cfg.stages) {
      for (const slot of stage.slots) {
        if (!slot.installedComponentId) continue;

        const comp = this.registry.getComponent(slot.installedComponentId);
        if (!comp) continue;

        const unlockReqs = comp.unlockRequirements;

        // Check required technology node
        if (unlockReqs.techNodeId && !unlockedTechs.has(unlockReqs.techNodeId)) {
          issues.push({
            id: `iss_tech_locked_node_${comp.id}_${unlockReqs.techNodeId}`,
            category: ValidationCategory.TECHNOLOGY_VALIDATION,
            severity: ValidationSeverity.ERROR,
            title: `Unresearched Technology: ${unlockReqs.techNodeId}`,
            explanation: `Component "${comp.name}" requires unresearched technology node "${unlockReqs.techNodeId}".`,
            affectedSlotId: slot.slotId,
            affectedComponentId: comp.id,
            stageNumber: stage.stageNumber,
            recommendedCorrection: `Research node "${unlockReqs.techNodeId}" in R&D Centre or replace with a Tier 1 component.`,
            blocksReadiness: true,
          });
        }

        // Check required organisation rank
        if (unlockReqs.techTier > orgRank) {
          issues.push({
            id: `iss_tech_org_rank_${comp.id}`,
            category: ValidationCategory.TECHNOLOGY_VALIDATION,
            severity: ValidationSeverity.ERROR,
            title: `Insufficient Organisation Rank`,
            explanation: `Component "${comp.name}" requires Organisation Rank ${unlockReqs.techTier} (Current Rank: ${orgRank}).`,
            affectedSlotId: slot.slotId,
            affectedComponentId: comp.id,
            stageNumber: stage.stageNumber,
            recommendedCorrection: `Increase organizational prestige by completing introductory missions.`,
            blocksReadiness: true,
          });
        }
      }
    }

    return issues;
  }

  // =========================================================================
  // EDUCATIONAL TRADE-OFF ANALYSIS (NO PHYSICAL EQUATIONS)
  // =========================================================================

  private synthesizeEducationalTradeOffs(
    _cfg: ModularRocketConfiguration,
    ratings: StructuralAndConfigurationRatings,
    mission?: MissionDefinition
  ): EducationalTradeOffInsight[] {
    const insights: EducationalTradeOffInsight[] = [];

    // 1. MASS AND CAPABILITY
    insights.push({
      topic: EducationalTradeOffTopic.MASS_AND_CAPABILITY,
      title: 'Mass Penalty vs Propulsion Capability',
      observation: `Vehicle wet assembly totals ${ratings.totalMassUnits} Mass Units with a propulsion score of ${ratings.overallPerformanceRating} points.`,
      tradeOffAnalysis: 'In vehicle staging, every additional mass unit added to upper stages exponentially increases the thrust and fuel requirements demanded of the lower booster core.',
      recommendation: 'Minimizing unnecessary structural dry mass on upper stages produces greater payload capability than simply increasing booster engine size.',
    });

    // 2. PAYLOAD AND MISSION OBJECTIVES
    insights.push({
      topic: EducationalTradeOffTopic.PAYLOAD_AND_MISSION,
      title: 'Payload Configuration Alignment',
      observation: `Vehicle provides a certified payload capacity rating of ${ratings.payloadCapacityRating} units.`,
      tradeOffAnalysis: 'Oversizing a payload platform consumes excessive vehicle thrust budget, while undersizing payload capacity prevents secondary science instrument integration.',
      recommendation: mission
        ? `Ensure payload capacity closely tracks mission target (${mission.engineeringRequirements?.minPayloadMassKg ?? 0} units) to avoid performance wastage.`
        : 'Align payload envelope with the specific scientific requirements of the target flight profile.',
    });

    // 3. POWER AND SYSTEMS
    insights.push({
      topic: EducationalTradeOffTopic.POWER_AND_SYSTEMS,
      title: 'Electrical Generation vs Systems Demand',
      observation: `Total subsystem power demand is ${ratings.powerDemandWatts} W against ${ratings.powerGenerationWatts} W generation (Net: ${ratings.netPowerWatts >= 0 ? '+' : ''}${ratings.netPowerWatts} W).`,
      tradeOffAnalysis: 'High-gain transceivers and active diagnostic computers substantially increase flight director capabilities, but impose continuous electrical power drainage.',
      recommendation: ratings.netPowerWatts < 0
        ? 'Deploy supplemental solar array panels or install an RTG unit to prevent operational battery starvation.'
        : 'Maintain a positive power buffer to sustain scientific sensors during orbital dark-period passes.',
    });

    // 4. COMMUNICATION AND DATA
    insights.push({
      topic: EducationalTradeOffTopic.COMMUNICATION_AND_DATA,
      title: 'Telemetry Bandwidth vs Transmission Range',
      observation: `Current telemetry and comms rating is ${ratings.communicationRating} points.`,
      tradeOffAnalysis: 'Omnidirectional beacons provide robust, fail-safe near-Earth link margins, but lack the bandwidth and directional focus required for interplanetary data transmission.',
      recommendation: 'Deep-space planetary exploration requires high-gain directional array antennas to ensure mission science data return.',
    });

    // 5. COST AND PERFORMANCE
    insights.push({
      topic: EducationalTradeOffTopic.COST_AND_PERFORMANCE,
      title: 'Hardware Procurement vs Agency Treasury',
      observation: `Total configuration procurement cost evaluates to ₵${ratings.estimatedCostCredits.toLocaleString()} Mission Credits.`,
      tradeOffAnalysis: 'Higher-tier propulsion clusters and advanced composite airframes dramatically improve vehicle flight ratings, but significantly increase baseline development cost.',
      recommendation: 'Balance performance requirements with mission contract reward payouts to protect long-term agency liquidity.',
    });

    // 6. RELIABILITY AND COMPLEXITY
    insights.push({
      topic: EducationalTradeOffTopic.RELIABILITY_AND_COMPLEXITY,
      title: 'Multi-Stage Staging Complexity vs System Reliability',
      observation: `Overall composite vehicle reliability rating is ${ratings.reliabilityRating.toFixed(1)}% across ${ratings.componentCount} mounted components.`,
      tradeOffAnalysis: 'Adding multiple staging separation rings and auxiliary booster clusters introduces additional failure modes, subtly reducing overall mission reliability.',
      recommendation: 'Favor simplified two-stage architectures where feasible to maximize composite system reliability.',
    });

    return insights;
  }

  // =========================================================================
  // HELPER METHODS: CATEGORY SUMMARIES & TEXT
  // =========================================================================

  private buildCategorySummaries(issues: ValidationIssue[]): Record<ValidationCategory, CategoryValidationResult> {
    const categories = Object.values(ValidationCategory);
    const result: Partial<Record<ValidationCategory, CategoryValidationResult>> = {};

    for (const cat of categories) {
      const catIssues = issues.filter(i => i.category === cat);
      const errorCount = catIssues.filter(i => i.severity === ValidationSeverity.ERROR).length;
      const warningCount = catIssues.filter(i => i.severity === ValidationSeverity.WARNING).length;
      const infoCount = catIssues.filter(i => i.severity === ValidationSeverity.INFORMATION).length;

      let status: 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED' | 'SKIPPED';
      if (catIssues.length === 0) {
        status = 'PASSED';
      } else if (errorCount > 0) {
        status = 'FAILED';
      } else if (warningCount > 0) {
        status = 'PASSED_WITH_WARNINGS';
      } else {
        status = 'PASSED';
      }

      result[cat] = {
        category: cat,
        status,
        errorCount,
        warningCount,
        infoCount,
        issues: catIssues,
      };
    }

    return result as Record<ValidationCategory, CategoryValidationResult>;
  }

  private buildSummaryText(
    status: ValidationOverallStatus,
    errorCount: number,
    warningCount: number,
    _ratings: StructuralAndConfigurationRatings,
    mission?: MissionDefinition
  ): string {
    if (status === ValidationOverallStatus.PASSED) {
      return mission
        ? `Configuration verified. All engineering checks and mission requirements for "${mission.name}" are fully satisfied.`
        : 'All 7 engineering validation categories passed. Vehicle certified for unrestricted flight.';
    }

    if (status === ValidationOverallStatus.PASSED_WITH_WARNINGS) {
      return `Vehicle design certified with ${warningCount} advisory warning(s). Configuration is flight-ready, but review identified engineering trade-offs.`;
    }

    return `Vehicle validation failed: ${errorCount} blocking error(s) prevent flight certification. Resolve mandatory requirements to proceed.`;
  }

  /**
   * Deterministic hash representing configuration state
   */
  public computeConfigurationHash(cfg: ModularRocketConfiguration): string {
    const parts: string[] = [cfg.configurationId, cfg.version, cfg.classRating];
    for (const stg of cfg.stages) {
      parts.push(`s${stg.stageNumber}`);
      for (const slot of stg.slots) {
        parts.push(`${slot.slotId}:${slot.installedComponentId ?? 'none'}`);
      }
    }
    return parts.join('|');
  }

  /**
   * Check whether an existing report is stale relative to current configuration
   */
  public isReportStale(report: ComprehensiveRocketValidationReport, currentConfig: ModularRocketConfiguration): boolean {
    if (report.isStale) return true;
    if (report.configurationVersion !== currentConfig.version) return true;
    const currentHash = this.computeConfigurationHash(currentConfig);
    return report.configurationHash !== currentHash;
  }

  /**
   * Mark cached report for a project as stale
   */
  public invalidateReport(projectId: string): void {
    const report = this.latestReports.get(projectId);
    if (report) {
      report.isStale = true;
      Logger.info('ROCKET_VALIDATION_ENGINE', `Validation report invalidated for project "${projectId}".`);
    }
  }

  public getLatestReport(projectId: string): ComprehensiveRocketValidationReport | undefined {
    return this.latestReports.get(projectId);
  }

  // =========================================================================
  // VALIDATION HISTORY
  // =========================================================================

  private recordHistory(report: ComprehensiveRocketValidationReport, missionId?: string): void {
    const record: RocketValidationHistoryRecord = {
      historyId: `hist_${report.projectId}_${Date.now()}`,
      projectId: report.projectId,
      configurationVersion: report.configurationVersion,
      timestamp: report.validatedAt,
      status: report.status,
      errorCount: report.issues.filter(i => i.severity === ValidationSeverity.ERROR).length,
      warningCount: report.issues.filter(i => i.severity === ValidationSeverity.WARNING).length,
      infoCount: report.issues.filter(i => i.severity === ValidationSeverity.INFORMATION).length,
      assignedMissionId: missionId,
      summary: report.summaryText,
      engineVersion: report.engineVersion,
    };

    const history = this.validationHistory.get(report.projectId) ?? [];
    history.unshift(record);
    if (history.length > 20) history.pop(); // Keep last 20 validation runs
    this.validationHistory.set(report.projectId, history);
  }

  public getValidationHistory(projectId: string): RocketValidationHistoryRecord[] {
    return [...(this.validationHistory.get(projectId) ?? [])];
  }
}
