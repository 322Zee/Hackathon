/**
 * INTERSTELLAR CONTINUUM - Rocket Mission Readiness Service
 * Bridge connecting the central Rocket Validation Engine to the Mission Lifecycle
 * and Mission Preparation Subsystem, enforcing partial readiness boundaries.
 *
 * NOTE: Passing vehicle validation satisfies launch vehicle staging requirements only.
 * Overall mission readiness requires all independent spacecraft, payload, and comms
 * preparation tasks to be fulfilled.
 */

import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import { RocketProjectManager } from '../RocketProjectManager';
import { RocketBuilderEngine } from '../builder/RocketBuilderEngine';
import { MissionLifecycleManager } from '../../missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../missions/MissionCatalogueRegistry';
import { MissionPreparationService } from '../../missions/MissionPreparationService';
import {
  MissionLifecycleState,
  PreparationTaskType,
  PreparationTaskStatus,
} from '../../missions/MissionLifecycleTypes';
import {
  ComprehensiveRocketValidationReport,
  ValidationOverallStatus,
  RocketValidationContext,
} from './RocketValidationTypes';
import { RocketValidationEngine } from './RocketValidationEngine';

export interface MissionReadinessEvaluationResult {
  success: boolean;
  rocketValidationPassed: boolean;
  overallMissionReady: boolean;
  validationReport: ComprehensiveRocketValidationReport;
  rocketStatus: ValidationOverallStatus;
  missionStatus: MissionLifecycleState;
  preparationSummary: {
    launchVehicleConfigured: boolean;
    spacecraftConfigured: boolean;
    payloadConfigured: boolean;
    communicationConfigured: boolean;
    remainingTasksCount: number;
  };
  message: string;
}

export class RocketMissionReadinessService {
  private static instance?: RocketMissionReadinessService;

  private eventBus?: EventBus;
  private validationEngine: RocketValidationEngine;
  private projectManager: RocketProjectManager;
  private lifecycleManager: MissionLifecycleManager;
  private catalogueRegistry: MissionCatalogueRegistry;
  private preparationService: MissionPreparationService;

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.validationEngine = RocketValidationEngine.getInstance(eventBus);
    this.projectManager = RocketProjectManager.getInstance(eventBus);
    this.lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
    this.catalogueRegistry = MissionCatalogueRegistry.getInstance(eventBus);
    this.preparationService = MissionPreparationService.getInstance();
  }

  public static getInstance(eventBus?: EventBus): RocketMissionReadinessService {
    if (!RocketMissionReadinessService.instance) {
      RocketMissionReadinessService.instance = new RocketMissionReadinessService(eventBus);
    }
    return RocketMissionReadinessService.instance;
  }

  public static resetInstance(): void {
    RocketMissionReadinessService.instance = undefined;
  }

  /**
   * Request Mission Readiness Verification for an assigned Rocket Project and Mission Instance
   */
  public verifyMissionReadiness(
    instanceId: string,
    projectId: string
  ): MissionReadinessEvaluationResult {
    // 1. Retrieve the mission instance
    const instance = this.lifecycleManager.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Mission instance "${instanceId}" not found in lifecycle manager.`);
    }

    // Retrieve canonical mission definition
    const mission = this.catalogueRegistry.getMissionById(instance.missionId);
    if (!mission) {
      throw new Error(`Canonical mission "${instance.missionId}" not found in catalogue.`);
    }

    // 2. Retrieve assigned rocket project and configuration
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Rocket project "${projectId}" not found in project manager.`);
    }

    const builderEngine = RocketBuilderEngine.getInstance();
    const config = builderEngine.getConfiguration();

    // 3. Run the validation engine (read-only)
    const context: RocketValidationContext = {
      projectId: project.projectId,
      configuration: config,
      mission,
    };

    const report = this.validationEngine.validate(context);
    const rocketValidationPassed = report.isValid;

    // 4. Update the mission preparation status for launch vehicle task
    const vehicleTask = instance.preparation.tasks.find(
      t => t.type === PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION
    );

    if (rocketValidationPassed) {
      if (vehicleTask) {
        vehicleTask.status = PreparationTaskStatus.CONFIGURED;
        vehicleTask.configRef = project.projectId;
        vehicleTask.statusNotes = `Vehicle certified (${report.status}): ${report.summaryText}`;
      }
      instance.rocketConfigRef = project.projectId;

      // Update project status if assigned
      this.projectManager.validateProject(projectId);

      Logger.info(
        'MISSION_READINESS_SERVICE',
        `Rocket validation passed for mission "${instance.missionId}". Launch vehicle task configured.`
      );
    } else {
      if (vehicleTask) {
        vehicleTask.status = PreparationTaskStatus.IN_PROGRESS;
        vehicleTask.statusNotes = `Validation failed: ${report.summaryText}`;
      }

      Logger.warn(
        'MISSION_READINESS_SERVICE',
        `Rocket validation failed for mission "${instance.missionId}". Launch vehicle task unconfigured.`
      );
    }

    // 5. Evaluate partial vs overall mission readiness
    const prepValidation = this.preparationService.validatePreparation(instance.preparation);
    const overallMissionReady = rocketValidationPassed && prepValidation.isValid;

    if (overallMissionReady) {
      // Follow lifecycle state transitions to reach READY
      if (instance.status === MissionLifecycleState.ACCEPTED) {
        this.lifecycleManager.transitionState(instanceId, MissionLifecycleState.PREPARING);
      }
      if (instance.status === MissionLifecycleState.PREPARING) {
        this.lifecycleManager.transitionState(instanceId, MissionLifecycleState.READY_FOR_VALIDATION);
      }
      if (instance.status === MissionLifecycleState.READY_FOR_VALIDATION) {
        this.lifecycleManager.transitionState(instanceId, MissionLifecycleState.READY);
      }
    }

    // Calculate preparation summary
    const spacecraftTask = instance.preparation.tasks.find(t => t.type === PreparationTaskType.SPACECRAFT_DESIGN);
    const payloadTask = instance.preparation.tasks.find(t => t.type === PreparationTaskType.PAYLOAD_INTEGRATION);
    const commsTask = instance.preparation.tasks.find(t => t.type === PreparationTaskType.COMMUNICATION_SETUP);

    const remainingTasksCount = instance.preparation.tasks.filter(
      t => t.required && t.status !== PreparationTaskStatus.CONFIGURED
    ).length;

    let message: string;
    if (overallMissionReady) {
      message = 'All mandatory mission preparation tasks complete. Mission is CERTIFIED READY for flight activation.';
    } else if (rocketValidationPassed) {
      message = `Launch vehicle configuration certified. Remaining unconfigured preparation tasks (${remainingTasksCount}) prevent overall mission readiness.`;
    } else {
      message = `Launch vehicle configuration failed validation with ${report.issues.filter(i => i.blocksReadiness).length} error(s). Mission cannot proceed.`;
    }

    const result: MissionReadinessEvaluationResult = {
      success: rocketValidationPassed,
      rocketValidationPassed,
      overallMissionReady,
      validationReport: report,
      rocketStatus: report.status,
      missionStatus: instance.status,
      preparationSummary: {
        launchVehicleConfigured: vehicleTask?.status === PreparationTaskStatus.CONFIGURED,
        spacecraftConfigured: spacecraftTask?.status === PreparationTaskStatus.CONFIGURED,
        payloadConfigured: payloadTask?.status === PreparationTaskStatus.CONFIGURED,
        communicationConfigured: commsTask?.status === PreparationTaskStatus.CONFIGURED,
        remainingTasksCount,
      },
      message,
    };

    if (this.eventBus) {
      this.eventBus.emit('mission:readiness_evaluated' as any, {
        instanceId,
        projectId,
        result,
      });
    }

    return result;
  }
}
