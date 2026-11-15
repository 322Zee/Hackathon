/**
 * INTERSTELLAR CONTINUUM - Launch Complex Operations Deployment Manager
 * Central authoritative service managing mission deployment records, controlled state machine,
 * rocket project assignment, payload integration, eligibility verification, and event dispatching.
 *
 * NOTE: Strictly adheres to abstract gameplay parameters and fictional agency mechanisms.
 * No real-world launch procedures, hazard checklists, or practical operational steps.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import {
  DeploymentRecord,
  DeploymentState,
  DeploymentRequirementCheck,
  DeploymentEvent,
  PayloadAssignment,
  PayloadCategory,
  PayloadIntegrationStatus,
  CreateDeploymentOptions,
  LaunchPadStatusSummary,
} from './LaunchDeploymentTypes';
import { MissionLifecycleManager } from '../missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../missions/MissionCatalogueRegistry';
import { MissionLifecycleState, PreparationTaskType, PreparationTaskStatus } from '../missions/MissionLifecycleTypes';
import { PayloadType, MissionDefinition, MissionCategory } from '../missions/MissionTypes';
import { RocketProjectManager } from '../engineering/RocketProjectManager';
import { RocketProject } from '../engineering/RocketProjectTypes';
import { RocketBuilderEngine } from '../engineering/builder/RocketBuilderEngine';
import { RocketValidationEngine } from '../engineering/validation/RocketValidationEngine';
import { RocketTestingManager } from '../engineering/testing/RocketTestingManager';
import { RocketTestStatus } from '../engineering/testing/RocketTestingTypes';
import { ComponentInventoryService } from '../engineering/ComponentInventoryService';
import { RocketComponentRegistry } from '../engineering/RocketComponentRegistry';
import { RocketComponentCategory } from '../engineering/RocketComponentTypes';
import { FacilityId } from '../facilities/FacilityTypes';

export class LaunchDeploymentManager {
  private static instance?: LaunchDeploymentManager;

  private eventBus?: EventBus;
  private lifecycleManager: MissionLifecycleManager;
  private catalogueRegistry: MissionCatalogueRegistry;
  private projectManager: RocketProjectManager;
  private builderEngine: RocketBuilderEngine;
  private validationEngine: RocketValidationEngine;
  private testingManager: RocketTestingManager;
  private inventoryService: ComponentInventoryService;
  private componentRegistry: RocketComponentRegistry;

  /** Central registry of all deployment records: deploymentId -> DeploymentRecord */
  private deployments: Map<string, DeploymentRecord> = new Map();

  /** Active deployment ID for Pad Alpha */
  private activePadAlphaDeploymentId?: string;

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.lifecycleManager = MissionLifecycleManager.getInstance(eventBus);
    this.catalogueRegistry = MissionCatalogueRegistry.getInstance(eventBus);
    this.projectManager = RocketProjectManager.getInstance(eventBus);
    this.builderEngine = RocketBuilderEngine.getInstance(eventBus);
    this.validationEngine = RocketValidationEngine.getInstance(eventBus);
    this.testingManager = RocketTestingManager.getInstance(eventBus);
    this.inventoryService = ComponentInventoryService.getInstance(eventBus);
    this.componentRegistry = RocketComponentRegistry.getInstance(eventBus);

    Logger.info('LAUNCH_DEPLOYMENT_MANAGER', 'Launch Deployment Manager initialized.');
  }

  public static getInstance(eventBus?: EventBus): LaunchDeploymentManager {
    if (!LaunchDeploymentManager.instance) {
      LaunchDeploymentManager.instance = new LaunchDeploymentManager(eventBus);
    }
    return LaunchDeploymentManager.instance;
  }

  public static resetInstance(): void {
    LaunchDeploymentManager.instance = undefined;
  }

  // =========================================================================
  // 1. DEPLOYMENT CREATION & LIFECYCLE
  // =========================================================================

  /**
   * Create a new centralized deployment record bound to a mission instance
   */
  public createDeployment(options: CreateDeploymentOptions): DeploymentRecord {
    const {
      missionInstanceId,
      missionId,
      projectId,
      launchLocation = FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
      padCode = 'PAD-01',
    } = options;

    const missionInstance = this.lifecycleManager.getInstance(missionInstanceId);
    if (!missionInstance) {
      throw new Error(`Mission instance "${missionInstanceId}" not found in lifecycle manager.`);
    }

    const missionDef = this.catalogueRegistry.getMissionById(missionId);
    if (!missionDef) {
      throw new Error(`Canonical mission definition "${missionId}" not found in catalogue.`);
    }

    const deploymentId = `dep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    // Default unassigned payload
    const defaultPayload = this.resolvePayloadRequirement(missionDef);

    const record: DeploymentRecord = {
      deploymentId,
      missionInstanceId,
      missionId,
      projectId: projectId ?? '',
      designVersion: '',
      configurationHash: '',
      payload: defaultPayload,
      launchLocation,
      padCode,
      status: DeploymentState.NOT_ASSIGNED,
      events: [
        {
          id: `evt_${now}_init`,
          timestamp: now,
          eventType: 'DeploymentCreated',
          description: `Deployment record initialized for mission "${missionDef.name}". Location: ${padCode}.`,
          actor: 'LAUNCH_OPERATIONS',
        },
      ],
      createdAt: now,
      updatedAt: now,
      requirements: [],
      isEligible: false,
    };

    this.deployments.set(deploymentId, record);

    if (launchLocation === FacilityId.LAUNCH_COMPLEX_PAD_ALPHA) {
      this.activePadAlphaDeploymentId = deploymentId;
    }

    Logger.info(
      'LAUNCH_DEPLOYMENT_MANAGER',
      `Created deployment "${deploymentId}" for mission "${missionDef.name}" on ${padCode}.`
    );

    if (this.eventBus) {
      this.eventBus.emit('deployment:created' as any, { deployment: record });
    }

    // If initial rocket project was provided, assign it now
    if (projectId) {
      this.assignRocket(deploymentId, projectId);
    } else {
      this.evaluateDeploymentEligibility(deploymentId);
    }

    return record;
  }

  // =========================================================================
  // 2. ROCKET PROJECT ASSIGNMENT
  // =========================================================================

  /**
   * Assign or reassign a rocket project to a deployment
   */
  public assignRocket(deploymentId: string, projectId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      Logger.error('LAUNCH_DEPLOYMENT_MANAGER', `Deployment "${deploymentId}" not found.`);
      return false;
    }

    // Check project existence
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      Logger.error('LAUNCH_DEPLOYMENT_MANAGER', `Rocket project "${projectId}" not found.`);
      return false;
    }

    // Check conflicting active deployment using same project
    for (const [otherId, otherDep] of this.deployments.entries()) {
      if (
        otherId !== deploymentId &&
        otherDep.projectId === projectId &&
        otherDep.status !== DeploymentState.CANCELLED &&
        otherDep.status !== DeploymentState.DEPLOYMENT_FAILED &&
        otherDep.status !== DeploymentState.DEPLOYED
      ) {
        Logger.warn(
          'LAUNCH_DEPLOYMENT_MANAGER',
          `Rocket project "${project.name}" is already assigned to conflicting active deployment "${otherId}".`
        );
        // Record conflict check
        this.addDeploymentEvent(
          deployment,
          'RocketAssignmentConflict',
          `Cannot assign "${project.name}": currently committed to deployment ${otherId}.`,
          'SYSTEM'
        );
        this.evaluateDeploymentEligibility(deploymentId);
        return false;
      }
    }

    // Load configuration to get current hash and verify version
    this.builderEngine.loadProject(project);
    const config = this.builderEngine.getConfiguration();
    const configHash = this.computeConfigurationHash(config);

    deployment.projectId = project.projectId;
    deployment.designVersion = project.designVersion;
    deployment.configurationHash = configHash;
    deployment.updatedAt = Date.now();

    // Link project's assigned mission
    project.assignedMissionId = deployment.missionId;

    // Check payload slot in vehicle configuration
    this.checkVehiclePayload(deployment, project);

    // Update mission preparation task for launch vehicle
    const missionInstance = this.lifecycleManager.getInstance(deployment.missionInstanceId);
    if (missionInstance) {
      const vehicleTask = missionInstance.preparation.tasks.find(
        t => t.type === PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION
      );
      if (vehicleTask) {
        vehicleTask.configRef = project.projectId;
        vehicleTask.status = PreparationTaskStatus.CONFIGURED;
        vehicleTask.statusNotes = `Vehicle "${project.name}" (${project.designVersion}) assigned for deployment.`;
      }
      missionInstance.rocketConfigRef = project.projectId;
    }

    this.addDeploymentEvent(
      deployment,
      'RocketAssignedToDeployment',
      `Assigned launch vehicle "${project.name}" (${project.designVersion}) to deployment.`,
      'MISSION_DIRECTOR',
      { projectId: project.projectId, version: project.designVersion }
    );

    Logger.info(
      'LAUNCH_DEPLOYMENT_MANAGER',
      `Assigned rocket "${project.name}" (${project.designVersion}) to deployment "${deploymentId}".`
    );

    if (this.eventBus) {
      this.eventBus.emit('deployment:rocket_assigned' as any, { deployment, project });
    }

    // Re-evaluate complete deployment eligibility
    this.evaluateDeploymentEligibility(deploymentId);

    return true;
  }

  // =========================================================================
  // 3. PAYLOAD INTEGRATION & RESOLUTION
  // =========================================================================

  /**
   * Resolves canonical payload requirement from mission definition
   */
  public resolvePayloadRequirement(mission: MissionDefinition): PayloadAssignment {
    const payloadType = mission.engineeringRequirements.payloadType;
    const category = this.mapPayloadTypeToCategory(payloadType);
    const massKg = mission.engineeringRequirements.minPayloadMassKg;

    return {
      payloadId: `payload_${mission.id}_req`,
      name: `${this.formatPayloadTypeName(payloadType)}`,
      category,
      payloadType,
      massKg,
      isMountedInRocket: false,
      systemImplemented: false, // Default until checked against vehicle or cleanroom
      status: PayloadIntegrationStatus.PENDING_INTEGRATION,
      statusNotes: `Payload assembly requirement: ${massKg}–${mission.engineeringRequirements.maxPayloadMassKg} kg envelope.`,
      referenceSpacecraftType: mission.engineeringRequirements.spacecraftType,
    };
  }

  /**
   * Checks whether the rocket's modular configuration contains a matching payload component
   */
  private checkVehiclePayload(deployment: DeploymentRecord, project: RocketProject): void {
    const config = (project as any).modularConfig ?? this.builderEngine.getConfiguration();
    if (!config?.stages) return;

    let mountedPayloadCompId: string | undefined;

    for (const stage of config.stages) {
      for (const slot of stage.slots) {
        if (slot.installedComponentId) {
          const comp = this.componentRegistry.getComponent(slot.installedComponentId);
          if (comp && comp.category === RocketComponentCategory.PAYLOAD_AND_FAIRING) {
            // Check if this component represents a payload module
            if (comp.referencePayloadType || comp.componentType.toLowerCase().includes('payload')) {
              mountedPayloadCompId = comp.id;
              break;
            }
          }
        }
      }
      if (mountedPayloadCompId) break;
    }

    if (mountedPayloadCompId) {
      const comp = this.componentRegistry.getComponent(mountedPayloadCompId)!;
      const matchesType = !comp.referencePayloadType || comp.referencePayloadType === deployment.payload.payloadType;

      deployment.payload.componentId = comp.id;
      deployment.payload.isMountedInRocket = true;
      deployment.payload.systemImplemented = true;

      if (matchesType) {
        deployment.payload.status = PayloadIntegrationStatus.MOUNTED_IN_VEHICLE;
        deployment.payload.statusNotes = `Mounted in upper stage: "${comp.name}" (${comp.massUnits * 10} kg payload envelope).`;
      } else {
        deployment.payload.status = PayloadIntegrationStatus.PENDING_INTEGRATION;
        deployment.payload.statusNotes = `Mounted payload "${comp.name}" differs from required mission type (${deployment.payload.payloadType}).`;
      }

      this.addDeploymentEvent(
        deployment,
        'PayloadAssignedToDeployment',
        `Payload verified in vehicle staging: "${comp.name}".`,
        'INTEGRATION_BAY',
        { componentId: comp.id, status: deployment.payload.status }
      );

      if (this.eventBus) {
        this.eventBus.emit('deployment:payload_assigned' as any, {
          deployment,
          payload: deployment.payload,
        });
      }
    } else {
      // Vehicle does not have a dedicated payload component mounted
      deployment.payload.isMountedInRocket = false;
      deployment.payload.componentId = undefined;
      deployment.payload.status = PayloadIntegrationStatus.UNAVAILABLE;
      deployment.payload.systemImplemented = false;
      deployment.payload.statusNotes =
        'No matching payload module mounted in vehicle slots. Spacecraft Laboratory CAD integration pending future implementation.';
    }
  }

  // =========================================================================
  // 4. ELIGIBILITY EVALUATION & STATE MACHINE
  // =========================================================================

  /**
   * Deterministically evaluates the 10 deployment requirement checkpoints
   */
  public evaluateDeploymentEligibility(deploymentId: string): DeploymentRecord {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment "${deploymentId}" not found for evaluation.`);
    }

    const checks: DeploymentRequirementCheck[] = [];

    // 1. Mission Assignment
    const missionInstance = this.lifecycleManager.getInstance(deployment.missionInstanceId);
    const missionDef = this.catalogueRegistry.getMissionById(deployment.missionId);
    const missionAssigned = Boolean(missionInstance && missionDef);
    checks.push({
      id: 'req_mission_assigned',
      name: 'Mission Contract Assigned',
      satisfied: missionAssigned,
      blocking: true,
      category: 'MISSION',
      details: missionAssigned
        ? `Bound to mission: "${missionDef?.name}" (${missionInstance?.instanceId}).`
        : 'No valid mission contract assigned.',
    });

    // 2. Mission Lifecycle State
    const validLifecycle =
      missionInstance?.status === MissionLifecycleState.ACCEPTED ||
      missionInstance?.status === MissionLifecycleState.PREPARING ||
      missionInstance?.status === MissionLifecycleState.READY_FOR_VALIDATION ||
      missionInstance?.status === MissionLifecycleState.READY;
    checks.push({
      id: 'req_mission_lifecycle',
      name: 'Mission Lifecycle Status',
      satisfied: Boolean(validLifecycle),
      blocking: true,
      category: 'MISSION',
      details: missionInstance
        ? `Lifecycle status: ${missionInstance.status}.`
        : 'Mission lifecycle inactive.',
    });

    // 3. Rocket Project Assigned
    const project = deployment.projectId ? this.projectManager.getProject(deployment.projectId) : undefined;
    const rocketAssigned = Boolean(project);
    checks.push({
      id: 'req_rocket_assigned',
      name: 'Launch Vehicle Assigned',
      satisfied: rocketAssigned,
      blocking: true,
      category: 'ROCKET',
      details: project
        ? `Vehicle "${project.name}" (Class: ${project.design.classRating}).`
        : 'No rocket project selected for rollout.',
    });

    // 4. Rocket Version Current
    const versionMatch = Boolean(project && project.designVersion === deployment.designVersion);
    checks.push({
      id: 'req_version_current',
      name: 'Design Version Integrity',
      satisfied: versionMatch,
      blocking: true,
      category: 'ROCKET',
      details: project
        ? versionMatch
          ? `Version ${project.designVersion} matches active configuration.`
          : `Version mismatch: Deployment has ${deployment.designVersion}, project is at ${project.designVersion}.`
        : 'Awaiting vehicle assignment.',
    });

    // 5. Validation Engine Status
    let validationPassed = false;
    let valDetails = 'Awaiting rocket validation.';
    if (project) {
      const valReport =
        project.comprehensiveValidation ?? this.validationEngine.getLatestReport(project.projectId);
      if (valReport) {
        deployment.readinessReportId = valReport.reportId;
        validationPassed = valReport.isValid;
        const valErrors = valReport.issues.filter(i => i.severity === 'ERROR').length;
        const valWarnings = valReport.issues.filter(i => i.severity === 'WARNING').length;
        valDetails = valReport.isValid
          ? `Certified (${valReport.status}): 0 blocking errors, ${valWarnings} warnings.`
          : `Validation failed (${valReport.status}): ${valErrors} blocking errors.`;
      } else {
        valDetails = 'No validation run on file for this vehicle.';
      }
    }
    checks.push({
      id: 'req_validation_status',
      name: 'Engineering Validation Report',
      satisfied: validationPassed,
      blocking: true,
      category: 'VALIDATION',
      details: valDetails,
    });

    // 6. Test Simulation Benchmark
    let testingPassed = false;
    let testDetails = 'Awaiting test-bench execution.';
    if (project) {
      const latestTest = this.testingManager.getLatestTestReport(project.projectId);
      if (latestTest) {
        const config = (project as any).modularConfig ?? this.builderEngine.getConfiguration();
        const activeVersion = config?.version ?? project.designVersion;
        const isStale =
          latestTest.designVersion !== project.designVersion &&
          latestTest.designVersion !== activeVersion;
        if (isStale) {
          testDetails = `Test run (${latestTest.designVersion}) is outdated for current design (${project.designVersion}).`;
        } else {
          testingPassed =
            latestTest.status === RocketTestStatus.PASSED ||
            latestTest.status === RocketTestStatus.PASSED_WITH_WARNINGS;
          testDetails = `Bench score: ${latestTest.overallScore}/100 (${latestTest.status}). Reliability: ${latestTest.ratingsSummary.reliabilityRating}%.`;
        }
      } else {
        testDetails = 'No test simulation executed for this vehicle.';
      }
    }
    checks.push({
      id: 'req_testing_benchmark',
      name: 'Ground Test & Simulation Benchmark',
      satisfied: testingPassed,
      blocking: true,
      category: 'TESTING',
      details: testDetails,
    });

    // 7. Mission Compatibility
    let missionCompat = false;
    let compatDetails = 'Pending vehicle and mission evaluation.';
    if (project && missionDef) {
      const minLift = missionDef.engineeringRequirements.minPayloadMassKg;
      const liftMargin = project.design.maxPayloadCapacityLeoKg - minLift;
      const reqDeltaV =
        missionDef.category === MissionCategory.SCIENTIFIC_EXPLORATION ||
        missionDef.category === MissionCategory.COMBINED
          ? 5000
          : 3500;
      const reachability = project.design.totalVacuumDeltaV >= reqDeltaV;

      missionCompat = liftMargin >= 0 && reachability;
      compatDetails = missionCompat
        ? `Nominal: Delta-V ${Math.round(project.design.totalVacuumDeltaV)} m/s (req: ${reqDeltaV}), Payload lift margin +${Math.round(liftMargin)} kg.`
        : `Deficient: Delta-V ${Math.round(project.design.totalVacuumDeltaV)} m/s (req: ${reqDeltaV}), Lift margin: ${Math.round(liftMargin)} kg.`;
    }
    checks.push({
      id: 'req_mission_compatibility',
      name: 'Mission Flight Envelope Compatibility',
      satisfied: missionCompat,
      blocking: true,
      category: 'ROCKET',
      details: compatDetails,
    });

    // 8. Payload Integration
    const payloadSatisfied =
      deployment.payload.status === PayloadIntegrationStatus.MOUNTED_IN_VEHICLE ||
      deployment.payload.status === PayloadIntegrationStatus.INTEGRATED;
    checks.push({
      id: 'req_payload_integration',
      name: 'Payload Module Integration',
      satisfied: payloadSatisfied,
      blocking: true,
      category: 'PAYLOAD',
      details: deployment.payload.statusNotes,
    });

    // 9. Inventory Stock Ownership
    let inventoryOwned = false;
    let invDetails = 'Pending vehicle check.';
    if (project) {
      const config = (project as any).modularConfig ?? this.builderEngine.getConfiguration();
      if (config?.stages) {
        let allOwned = true;
        let unownedCount = 0;
        for (const stage of config.stages) {
          for (const slot of stage.slots) {
            if (slot.installedComponentId) {
              const qty = this.inventoryService.getOwnedQuantity(slot.installedComponentId);
              if (qty <= 0) {
                allOwned = false;
                unownedCount++;
              }
            }
          }
        }
        inventoryOwned = allOwned;
        invDetails = allOwned
          ? 'All installed vehicle hardware confirmed owned in organizational inventory.'
          : `${unownedCount} unowned components detected in vehicle configuration.`;
      }
    }
    checks.push({
      id: 'req_inventory_commitment',
      name: 'Hardware Inventory Ownership',
      satisfied: inventoryOwned,
      blocking: true,
      category: 'ECONOMY',
      details: invDetails,
    });

    // 10. Conflict Detection
    let noConflict = true;
    let conflictDetails = 'No conflicting launchpad assignments detected.';
    for (const [otherId, otherDep] of this.deployments.entries()) {
      if (
        otherId !== deploymentId &&
        otherDep.projectId === deployment.projectId &&
        deployment.projectId !== '' &&
        otherDep.status !== DeploymentState.CANCELLED &&
        otherDep.status !== DeploymentState.DEPLOYMENT_FAILED &&
        otherDep.status !== DeploymentState.DEPLOYED
      ) {
        noConflict = false;
        conflictDetails = `Hardware committed to deployment ${otherId} on ${otherDep.padCode}.`;
        break;
      }
    }
    checks.push({
      id: 'req_conflict_check',
      name: 'Launchpad Commitment Conflict Check',
      satisfied: noConflict,
      blocking: true,
      category: 'CONFLICT',
      details: conflictDetails,
    });

    deployment.requirements = checks;

    // Evaluate overall eligibility
    const allBlockingPassed = checks.filter(c => c.blocking).every(c => c.satisfied);
    deployment.isEligible = allBlockingPassed;

    // Transition state machine deterministically if in pre-launch state
    this.updateDeploymentState(deployment);

    deployment.updatedAt = Date.now();

    if (this.eventBus) {
      this.eventBus.emit('deployment:readiness_updated' as any, {
        deployment,
        isEligible: deployment.isEligible,
      });
    }

    return deployment;
  }

  /**
   * Evaluates state machine transition according to deterministic requirements
   */
  private updateDeploymentState(deployment: DeploymentRecord): void {
    // Terminal and active countdown states are handled by explicit commands
    if (
      deployment.status === DeploymentState.DEPLOYMENT_SCHEDULED ||
      deployment.status === DeploymentState.DEPLOYMENT_INITIATED ||
      deployment.status === DeploymentState.DEPLOYED ||
      deployment.status === DeploymentState.CANCELLED ||
      deployment.status === DeploymentState.DEPLOYMENT_FAILED
    ) {
      return;
    }

    if (!deployment.projectId) {
      deployment.status = DeploymentState.AWAITING_ROCKET;
      return;
    }

    const payloadCheck = deployment.requirements.find(r => r.id === 'req_payload_integration');
    if (!payloadCheck?.satisfied) {
      deployment.status = DeploymentState.AWAITING_PAYLOAD;
      return;
    }

    const valCheck = deployment.requirements.find(r => r.id === 'req_validation_status');
    if (!valCheck?.satisfied) {
      deployment.status = DeploymentState.AWAITING_VALIDATION;
      return;
    }

    const testCheck = deployment.requirements.find(r => r.id === 'req_testing_benchmark');
    if (!testCheck?.satisfied || !deployment.isEligible) {
      deployment.status = DeploymentState.AWAITING_FINAL_READINESS;
      return;
    }

    // All requirements satisfied
    if (deployment.isEligible) {
      deployment.status = DeploymentState.ELIGIBLE_FOR_DEPLOYMENT;
    }
  }

  // =========================================================================
  // 5. CONTROLLED STATE TRANSITIONS
  // =========================================================================

  /**
   * Schedule deployment countdown (only valid from ELIGIBLE_FOR_DEPLOYMENT)
   */
  public scheduleDeployment(deploymentId: string, countdownSeconds: number = 10): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    // Re-verify eligibility
    this.evaluateDeploymentEligibility(deploymentId);
    if (!deployment.isEligible) {
      Logger.warn(
        'LAUNCH_DEPLOYMENT_MANAGER',
        `Cannot schedule deployment "${deploymentId}": outstanding blocking requirements remain.`
      );
      return false;
    }

    deployment.status = DeploymentState.DEPLOYMENT_SCHEDULED;
    deployment.scheduledLaunchTime = Date.now() + countdownSeconds * 1000;
    deployment.countdownRemainingSeconds = countdownSeconds;
    deployment.updatedAt = Date.now();

    this.addDeploymentEvent(
      deployment,
      'DeploymentScheduled',
      `Launch countdown scheduled (T-minus ${countdownSeconds}s).`,
      'RANGE_SAFETY_OFFICER',
      { countdownSeconds }
    );

    Logger.info(
      'LAUNCH_DEPLOYMENT_MANAGER',
      `Deployment "${deploymentId}" scheduled with ${countdownSeconds}s countdown.`
    );

    if (this.eventBus) {
      this.eventBus.emit('deployment:scheduled' as any, { deployment, countdownSeconds });
    }

    return true;
  }

  /**
   * Initiate launch sequence
   */
  public initiateDeployment(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    if (
      deployment.status !== DeploymentState.DEPLOYMENT_SCHEDULED &&
      deployment.status !== DeploymentState.ELIGIBLE_FOR_DEPLOYMENT
    ) {
      Logger.warn(
        'LAUNCH_DEPLOYMENT_MANAGER',
        `Cannot initiate launch: deployment is in invalid state (${deployment.status}).`
      );
      return false;
    }

    deployment.status = DeploymentState.DEPLOYMENT_INITIATED;
    deployment.executionRef = `exec_flight_${Date.now().toString(36)}`;
    deployment.updatedAt = Date.now();

    this.addDeploymentEvent(
      deployment,
      'DeploymentInitiated',
      `Main engine ignition command confirmed. Flight session: ${deployment.executionRef}.`,
      'FLIGHT_DIRECTOR',
      { executionRef: deployment.executionRef }
    );

    Logger.info(
      'LAUNCH_DEPLOYMENT_MANAGER',
      `Deployment "${deploymentId}" initiated. Flight ref: ${deployment.executionRef}.`
    );

    if (this.eventBus) {
      this.eventBus.emit('deployment:initiated' as any, { deployment });
    }

    return true;
  }

  /**
   * Complete launch deployment and clear pad
   */
  public completeDeployment(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    deployment.status = DeploymentState.DEPLOYED;
    deployment.updatedAt = Date.now();

    // Clear active assignment on Pad Alpha
    if (this.activePadAlphaDeploymentId === deploymentId) {
      this.activePadAlphaDeploymentId = undefined;
    }

    // Advance mission lifecycle state if appropriate
    const missionInstance = this.lifecycleManager.getInstance(deployment.missionInstanceId);
    if (missionInstance) {
      if (missionInstance.status === MissionLifecycleState.READY) {
        this.lifecycleManager.transitionState(
          missionInstance.instanceId,
          MissionLifecycleState.ACTIVE
        );
      } else {
        missionInstance.status = MissionLifecycleState.ACTIVE;
      }
    }

    this.addDeploymentEvent(
      deployment,
      'DeploymentCompleted',
      `Vehicle stack successfully cleared Pad Alpha. Orbit insertion phase active.`,
      'MISSION_OPERATIONS'
    );

    Logger.info('LAUNCH_DEPLOYMENT_MANAGER', `Deployment "${deploymentId}" completed successfully.`);

    if (this.eventBus) {
      this.eventBus.emit('deployment:completed' as any, { deployment });
    }

    return true;
  }

  /**
   * Cancel deployment
   */
  public cancelDeployment(deploymentId: string, reason: string = 'Director discretion'): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;

    deployment.status = DeploymentState.CANCELLED;
    deployment.updatedAt = Date.now();

    if (this.activePadAlphaDeploymentId === deploymentId) {
      this.activePadAlphaDeploymentId = undefined;
    }

    this.addDeploymentEvent(
      deployment,
      'DeploymentCancelled',
      `Deployment stood down. Reason: ${reason}.`,
      'MISSION_DIRECTOR',
      { reason }
    );

    Logger.info('LAUNCH_DEPLOYMENT_MANAGER', `Deployment "${deploymentId}" cancelled: ${reason}.`);

    if (this.eventBus) {
      this.eventBus.emit('deployment:cancelled' as any, { deployment, reason });
    }

    return true;
  }

  // =========================================================================
  // 6. QUERIES & GETTERS
  // =========================================================================

  public getDeployment(deploymentId: string): DeploymentRecord | undefined {
    return this.deployments.get(deploymentId);
  }

  public getDeployments(): DeploymentRecord[] {
    return Array.from(this.deployments.values());
  }

  public getActiveDeployment(): DeploymentRecord | undefined {
    if (!this.activePadAlphaDeploymentId) return undefined;
    return this.deployments.get(this.activePadAlphaDeploymentId);
  }

  public setActiveDeployment(deploymentId: string): void {
    if (this.deployments.has(deploymentId)) {
      this.activePadAlphaDeploymentId = deploymentId;
    }
  }

  public getDeploymentByProject(projectId: string): DeploymentRecord | undefined {
    return Array.from(this.deployments.values()).find(
      d =>
        d.projectId === projectId &&
        d.status !== DeploymentState.CANCELLED &&
        d.status !== DeploymentState.DEPLOYMENT_FAILED &&
        d.status !== DeploymentState.DEPLOYED
    );
  }

  public getDeploymentByMission(missionInstanceId: string): DeploymentRecord | undefined {
    return Array.from(this.deployments.values()).find(
      d =>
        d.missionInstanceId === missionInstanceId &&
        d.status !== DeploymentState.CANCELLED &&
        d.status !== DeploymentState.DEPLOYED
    );
  }

  public getLaunchPadSummary(padId: string = FacilityId.LAUNCH_COMPLEX_PAD_ALPHA): LaunchPadStatusSummary {
    const active = this.getActiveDeployment();
    const project = active?.projectId ? this.projectManager.getProject(active.projectId) : undefined;
    const mission = active?.missionId ? this.catalogueRegistry.getMissionById(active.missionId) : undefined;

    return {
      padId,
      padCode: active?.padCode ?? 'PAD-01',
      padName: 'Launch Complex Pad Alpha',
      isOccupied: Boolean(active && active.projectId),
      activeDeploymentId: active?.deploymentId,
      rocketName: project?.name,
      rocketVersion: active?.designVersion,
      missionName: mission?.name,
      status: active?.status ?? DeploymentState.NOT_ASSIGNED,
      isEligibleForLaunch: Boolean(active?.isEligible),
    };
  }

  // =========================================================================
  // 7. UTILITY & EVENT LOGGING
  // =========================================================================

  private addDeploymentEvent(
    deployment: DeploymentRecord,
    eventType: string,
    description: string,
    actor: string,
    data?: Record<string, any>
  ): void {
    const evt: DeploymentEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      eventType,
      description,
      actor,
      data,
    };
    deployment.events.push(evt);
  }

  private mapPayloadTypeToCategory(type: PayloadType): PayloadCategory {
    switch (type) {
      case PayloadType.COMMUNICATION_RELAY:
        return PayloadCategory.COMMUNICATION_SATELLITE;
      case PayloadType.EARTH_OBSERVATION_SUITE:
        return PayloadCategory.OBSERVATION_SATELLITE;
      case PayloadType.SURFACE_EQUIPMENT_CONTAINER:
        return PayloadCategory.SURFACE_DEPLOYMENT_MODULE;
      case PayloadType.RESEARCH_MODULE:
        return PayloadCategory.RESEARCH_MODULE;
      case PayloadType.ROBOTIC_ROVER:
        return PayloadCategory.ROVER_CARGO;
      case PayloadType.ATMOSPHERIC_AEROSHELL:
        return PayloadCategory.SCIENTIFIC_PROBE;
      case PayloadType.SAMPLE_RETURN_CAPSULE:
        return PayloadCategory.SCIENTIFIC_PROBE;
      case PayloadType.SCIENCE_INSTRUMENT_PACKAGE:
        return PayloadCategory.SCIENTIFIC_PROBE;
      case PayloadType.SUBSURFACE_DRILL_SYSTEM:
        return PayloadCategory.LANDER;
      default:
        return PayloadCategory.SATELLITE;
    }
  }

  private formatPayloadTypeName(type: PayloadType): string {
    return type
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  private computeConfigurationHash(config: any): string {
    if (!config) return 'empty';
    const slots = (config.stages ?? []).flatMap((stg: any) =>
      (stg.slots ?? []).map((s: any) => `${s.slotId}:${s.installedComponentId ?? 'none'}`)
    );
    return `${config.projectId}_${config.version}_${slots.join('|')}`;
  }
}
