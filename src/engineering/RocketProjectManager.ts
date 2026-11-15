/**
 * INTERSTELLAR CONTINUUM - Rocket Project Manager
 * Authoritative lifecycle manager for rocket projects, project CRUD,
 * engineering validation engine, mission compatibility checks, hot-fire simulation,
 * and engineering activity records.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { MissionDefinition } from '../missions/MissionTypes';
import { RocketValidationEngine } from './validation/RocketValidationEngine';
import { ComprehensiveRocketValidationReport } from './validation/RocketValidationTypes';
import { RocketBuilderEngine } from './builder/RocketBuilderEngine';
import {
  RocketProject,
  RocketProjectStatus,
  RocketClassRating,
  RocketDesign,
  RocketValidationReport,
  RocketValidationCheck,
  RocketEngineeringEvent,
  RocketEngineeringEventType,
  RocketCompatibilityAnalysis,
  RocketEngineeringSaveData,
} from './RocketProjectTypes';

export class RocketProjectManager {
  private static instance?: RocketProjectManager;
  private eventBus?: EventBus;

  private projects: Map<string, RocketProject> = new Map();
  private activeProjectId?: string;
  private globalHistory: RocketEngineeringEvent[] = [];

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.initializeDefaultProjects();
  }

  public static getInstance(eventBus?: EventBus): RocketProjectManager {
    if (!RocketProjectManager.instance) {
      RocketProjectManager.instance = new RocketProjectManager(eventBus);
    }
    return RocketProjectManager.instance;
  }

  public static resetInstance(): void {
    RocketProjectManager.instance = undefined;
  }

  /**
   * Initializes initial standard starter project configurations.
   */
  private initializeDefaultProjects(): void {
    // 1. Astra-1 Sounding Test Rig
    const astra1: RocketProject = {
      projectId: 'proj_astra_1',
      name: 'Astra-1 Sounding Test Rig',
      shortCode: 'AST-1',
      description: 'Single-stage kerolox sounding vehicle built for suborbital atmospheric and mesospheric research flights.',
      createdTimestamp: 1731600000000,
      updatedTimestamp: 1731600000000,
      status: RocketProjectStatus.VALIDATED,
      designVersion: 'v1.2.0',
      design: {
        designId: 'des_astra_1',
        name: 'Astra-1 Configuration B',
        classRating: RocketClassRating.SUBORBITAL_TEST,
        stages: [
          {
            stageNumber: 1,
            name: 'Core Booster',
            engineName: 'Astra-100 Sea-Level Kerolox Engine',
            engineCount: 1,
            thrustSeaLevelKn: 480,
            thrustVacuumKn: 540,
            specificImpulseSec: 282,
            dryMassKg: 1125,
            propellantMassKg: 4500,
            burnDurationSec: 58,
            separationType: 'Direct Sounding Rail',
          },
        ],
        totalWetMassKg: 5625,
        totalDryMassKg: 1125,
        seaLevelThrustKn: 480,
        vacuumThrustKn: 540,
        initialTwr: 8.69,
        totalVacuumDeltaV: 4450,
        maxPayloadCapacityLeoKg: 250,
        fairingDiameterM: 1.8,
        buildCostCredits: 28800,
      },
      validation: {
        isValid: true,
        summaryText: 'All 5 engineering validation checks passed. Vehicle certified for suborbital operations.',
        validatedAt: 1731600000000,
        checks: [
          {
            id: 'val_twr',
            label: 'Thrust-to-Weight Ratio (TWR >= 1.15)',
            passed: true,
            metricValue: '8.69 TWR',
            thresholdValue: '1.15 TWR min',
            detail: 'Initial liftoff acceleration well above minimum requirement.',
          },
          {
            id: 'val_deltav',
            label: 'Total Propulsion Delta-V',
            passed: true,
            metricValue: '4,450 m/s',
            thresholdValue: '1,500 m/s min',
            detail: 'Exceeds suborbital research burn envelope.',
          },
          {
            id: 'val_mass_ratio',
            label: 'Structural Mass & Propellant Fraction',
            passed: true,
            metricValue: '80.0% Propellant',
            thresholdValue: '65.0% min',
            detail: 'Favorable structural mass fraction for aluminum-lithium construction.',
          },
          {
            id: 'val_avionics',
            label: 'Guidance & Staging Redundancy',
            passed: true,
            metricValue: 'Redundant Dual-Core',
            thresholdValue: 'Primary Avionics',
            detail: 'Flight guidance computer verified and bus connected.',
          },
          {
            id: 'val_fairing',
            label: 'Aerodynamic Envelope & Shroud',
            passed: true,
            metricValue: '1.8 m Shroud',
            thresholdValue: '1.0 m min',
            detail: 'Suborbital instrument bay provides complete aerodynamic protection.',
          },
        ],
      },
      history: [
        {
          id: 'hist_ast1_01',
          projectId: 'proj_astra_1',
          timestamp: 1731600000000,
          type: RocketEngineeringEventType.PROJECT_CREATED,
          summary: 'Project initialized from baseline Suborbital Sounding specification.',
        },
        {
          id: 'hist_ast1_02',
          projectId: 'proj_astra_1',
          timestamp: 1731601000000,
          type: RocketEngineeringEventType.VALIDATION_PASSED,
          summary: 'Baseline engineering validation passed with certified flight status.',
        },
      ],
    };

    // 2. Pioneer Orbital-1
    const pioneer1: RocketProject = {
      projectId: 'proj_pioneer_orb1',
      name: 'Pioneer Orbital-1',
      shortCode: 'PIO-1',
      description: 'Two-stage medium-capacity light orbital rocket designed for Low Earth Orbit payload delivery and satellite deployment.',
      createdTimestamp: 1731605000000,
      updatedTimestamp: 1731605000000,
      status: RocketProjectStatus.VALIDATED,
      designVersion: 'v1.0.0',
      design: {
        designId: 'des_pioneer_1',
        name: 'Pioneer Orbital Standard',
        classRating: RocketClassRating.LIGHT_ORBITAL,
        stages: [
          {
            stageNumber: 1,
            name: 'Booster Stage (Kerolox Cluster)',
            engineName: 'Astra-100 Sea-Level Kerolox Engine',
            engineCount: 2,
            thrustSeaLevelKn: 960,
            thrustVacuumKn: 1080,
            specificImpulseSec: 282,
            dryMassKg: 1950,
            propellantMassKg: 12000,
            burnDurationSec: 110,
            separationType: 'Pneumatic 2.0m Ring',
          },
          {
            stageNumber: 2,
            name: 'Vacuum Orbital Inserter',
            engineName: 'Astra-Vac Orbital-8',
            engineCount: 1,
            thrustSeaLevelKn: 0,
            thrustVacuumKn: 95,
            specificImpulseSec: 348,
            dryMassKg: 650,
            propellantMassKg: 4500,
            burnDurationSec: 180,
            separationType: 'Payload Fairing Clamshell',
          },
        ],
        totalWetMassKg: 19100,
        totalDryMassKg: 2600,
        seaLevelThrustKn: 960,
        vacuumThrustKn: 1080,
        initialTwr: 5.12,
        totalVacuumDeltaV: 8920,
        maxPayloadCapacityLeoKg: 1200,
        fairingDiameterM: 2.5,
        buildCostCredits: 68500,
      },
      validation: {
        isValid: true,
        summaryText: 'All 5 engineering validation checks passed. Vehicle certified for orbital insertions up to 1,200 kg.',
        validatedAt: 1731605000000,
        checks: [
          {
            id: 'val_twr',
            label: 'Thrust-to-Weight Ratio (TWR >= 1.15)',
            passed: true,
            metricValue: '5.12 TWR',
            thresholdValue: '1.15 TWR min',
            detail: 'Twin first-stage engines supply ample liftoff margin.',
          },
          {
            id: 'val_deltav',
            label: 'Total Propulsion Delta-V',
            passed: true,
            metricValue: '8,920 m/s',
            thresholdValue: '8,500 m/s min',
            detail: 'Sufficient delta-V for nominal 300 km Low Earth Orbit insertion.',
          },
          {
            id: 'val_mass_ratio',
            label: 'Structural Mass & Propellant Fraction',
            passed: true,
            metricValue: '86.4% Propellant',
            thresholdValue: '75.0% min',
            detail: 'Two-stage mass distribution optimizes orbital mass fraction.',
          },
          {
            id: 'val_avionics',
            label: 'Guidance & Staging Redundancy',
            passed: true,
            metricValue: 'Pneumatic Decoupler + Flight Computer',
            thresholdValue: 'Stage Separation Hardware',
            detail: 'Pneumatic 2.0m interstage ring decoupler and avionics fully operational.',
          },
          {
            id: 'val_fairing',
            label: 'Aerodynamic Envelope & Shroud',
            passed: true,
            metricValue: '2.5 m Shroud',
            thresholdValue: '2.0 m min',
            detail: '2.5m carbon composite payload fairing protects standard satellite buses.',
          },
        ],
      },
      history: [
        {
          id: 'hist_pio_01',
          projectId: 'proj_pioneer_orb1',
          timestamp: 1731605000000,
          type: RocketEngineeringEventType.PROJECT_CREATED,
          summary: 'Project initialized: Pioneer Orbital-1 light orbital launch vehicle.',
        },
        {
          id: 'hist_pio_02',
          projectId: 'proj_pioneer_orb1',
          timestamp: 1731605500000,
          type: RocketEngineeringEventType.VALIDATION_PASSED,
          summary: 'Two-stage orbital validation checklist fully verified.',
        },
      ],
    };

    // 3. Continuum Heavy-1
    const continuumHeavy: RocketProject = {
      projectId: 'proj_continuum_heavy',
      name: 'Continuum Heavy-1',
      shortCode: 'CTM-HVY',
      description: 'Heavy multi-stage launch vehicle with cryogenic upper-stage relight capability for lunar and interplanetary transfer trajectories.',
      createdTimestamp: 1731610000000,
      updatedTimestamp: 1731610000000,
      status: RocketProjectStatus.UNDER_DEVELOPMENT,
      designVersion: 'v0.9.1',
      design: {
        designId: 'des_continuum_heavy',
        name: 'Continuum Heavy Baseline',
        classRating: RocketClassRating.HEAVY_INTERPLANETARY,
        stages: [
          {
            stageNumber: 1,
            name: 'Heavy Core Booster + Dual Solid Strapons',
            engineName: 'HydroCore-Sustainer V2 x3 + Starfire SRM-50 x2',
            engineCount: 5,
            thrustSeaLevelKn: 3700,
            thrustVacuumKn: 4120,
            specificImpulseSec: 330,
            dryMassKg: 10500,
            propellantMassKg: 71400,
            burnDurationSec: 145,
            separationType: 'Heavy Interstage Truss',
          },
          {
            stageNumber: 2,
            name: 'Cryogenic Interplanetary Transporter',
            engineName: 'Selene-RL Cryogenic Relight Unit',
            engineCount: 1,
            thrustSeaLevelKn: 0,
            thrustVacuumKn: 125,
            specificImpulseSec: 450,
            dryMassKg: 1500,
            propellantMassKg: 18000,
            burnDurationSec: 380,
            separationType: 'Fairing Jettison Ring',
          },
        ],
        totalWetMassKg: 101400,
        totalDryMassKg: 12000,
        seaLevelThrustKn: 3700,
        vacuumThrustKn: 4120,
        initialTwr: 3.72,
        totalVacuumDeltaV: 13450,
        maxPayloadCapacityLeoKg: 8500,
        fairingDiameterM: 3.8,
        buildCostCredits: 185000,
      },
      validation: {
        isValid: false,
        summaryText: 'Draft stage configuration under active development. Final cryogenic checkout pending.',
        validatedAt: undefined,
        checks: [
          {
            id: 'val_twr',
            label: 'Thrust-to-Weight Ratio (TWR >= 1.15)',
            passed: true,
            metricValue: '3.72 TWR',
            thresholdValue: '1.15 TWR min',
            detail: 'Heavy core cluster delivers sufficient thrust for liftoff.',
          },
          {
            id: 'val_deltav',
            label: 'Total Propulsion Delta-V',
            passed: true,
            metricValue: '13,450 m/s',
            thresholdValue: '12,000 m/s min',
            detail: 'Sufficient delta-V for lunar and interplanetary transfer burns.',
          },
          {
            id: 'val_mass_ratio',
            label: 'Structural Mass & Propellant Fraction',
            passed: true,
            metricValue: '88.2% Propellant',
            thresholdValue: '80.0% min',
            detail: 'Cryogenic core maintains high propellant mass fraction.',
          },
          {
            id: 'val_avionics',
            label: 'Guidance & Staging Redundancy',
            passed: false,
            metricValue: 'Multi-Engine Gimbal Sync Unverified',
            thresholdValue: 'Full Redundancy Checkout',
            detail: 'Gimbal sync calibration needed across 3 sustained core engines.',
          },
          {
            id: 'val_fairing',
            label: 'Aerodynamic Envelope & Shroud',
            passed: true,
            metricValue: '3.8 m Shroud',
            thresholdValue: '3.0 m min',
            detail: '3.8m fairing ready for deep space lander payloads.',
          },
        ],
      },
      history: [
        {
          id: 'hist_ctm_01',
          projectId: 'proj_continuum_heavy',
          timestamp: 1731610000000,
          type: RocketEngineeringEventType.PROJECT_CREATED,
          summary: 'Project initialized: Continuum Heavy-1 interplanetary vehicle blueprint.',
        },
      ],
    };

    this.projects.set(astra1.projectId, astra1);
    this.projects.set(pioneer1.projectId, pioneer1);
    this.projects.set(continuumHeavy.projectId, continuumHeavy);

    this.activeProjectId = pioneer1.projectId;

    // Populate initial global history
    this.globalHistory.push(...astra1.history);
    this.globalHistory.push(...pioneer1.history);
    this.globalHistory.push(...continuumHeavy.history);
    this.globalHistory.sort((a, b) => b.timestamp - a.timestamp);
  }

  // =========================================================================
  // PROJECT QUERY & RETRIEVAL
  // =========================================================================

  public getAllProjects(): RocketProject[] {
    return Array.from(this.projects.values());
  }

  public getProject(projectId: string): RocketProject | undefined {
    return this.projects.get(projectId);
  }

  public getActiveProject(): RocketProject | undefined {
    if (!this.activeProjectId) {
      const first = this.projects.values().next().value;
      if (first) this.activeProjectId = first.projectId;
    }
    return this.activeProjectId ? this.projects.get(this.activeProjectId) : undefined;
  }

  public setActiveProject(projectId: string): boolean {
    if (this.projects.has(projectId)) {
      this.activeProjectId = projectId;
      Logger.info('ROCKET_PROJECT_MANAGER', `Active rocket project switched to: ${projectId}`);
      if (this.eventBus) {
        this.eventBus.emit('rocket:project_selected' as any, { projectId });
      }
      return true;
    }
    Logger.warn('ROCKET_PROJECT_MANAGER', `Cannot set active project, ID not found: ${projectId}`);
    return false;
  }

  // =========================================================================
  // PROJECT CRUD
  // =========================================================================

  public createProject(
    name: string,
    description: string,
    classRating: RocketClassRating = RocketClassRating.LIGHT_ORBITAL
  ): RocketProject {
    const idSuffix = Date.now().toString(36).substring(4);
    const projectId = `proj_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16)}_${idSuffix}`;
    const shortCode = name.split(' ').map(w => w[0]?.toUpperCase() || '').join('').substring(0, 4) || 'RCK';
    const now = Date.now();

    const newProject: RocketProject = {
      projectId,
      name,
      shortCode,
      description,
      createdTimestamp: now,
      updatedTimestamp: now,
      status: RocketProjectStatus.DRAFT,
      designVersion: 'v0.1.0',
      design: {
        designId: `des_${idSuffix}`,
        name: `${name} Initial Draft`,
        classRating,
        stages: [
          {
            stageNumber: 1,
            name: 'Stage 1 Booster',
            engineName: 'Astra-100 Sea-Level Kerolox Engine',
            engineCount: 1,
            thrustSeaLevelKn: 480,
            thrustVacuumKn: 540,
            specificImpulseSec: 282,
            dryMassKg: 1070,
            propellantMassKg: 4500,
            burnDurationSec: 60,
            separationType: 'Direct Rail',
          },
        ],
        totalWetMassKg: 5570,
        totalDryMassKg: 1070,
        seaLevelThrustKn: 480,
        vacuumThrustKn: 540,
        initialTwr: 8.78,
        totalVacuumDeltaV: 4500,
        maxPayloadCapacityLeoKg: 300,
        fairingDiameterM: 1.8,
        buildCostCredits: 26500,
      },
      validation: {
        isValid: false,
        summaryText: 'Newly created draft project. Engineering validation required.',
        checks: [],
      },
      history: [],
    };

    this.projects.set(projectId, newProject);
    this.activeProjectId = projectId;

    this.logEvent(
      projectId,
      RocketEngineeringEventType.PROJECT_CREATED,
      `Rocket project "${name}" created with class rating: ${classRating}`
    );

    Logger.info('ROCKET_PROJECT_MANAGER', `Created rocket project: ${projectId} (${name})`);

    if (this.eventBus) {
      this.eventBus.emit('rocket:project_created' as any, { projectId, project: newProject });
    }

    return newProject;
  }

  public updateProjectDesign(projectId: string, partialDesign: Partial<RocketDesign>): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    project.design = {
      ...project.design,
      ...partialDesign,
    };
    project.updatedTimestamp = Date.now();

    // If design changed, invalidate previous validation
    if (project.status === RocketProjectStatus.VALIDATED) {
      project.status = RocketProjectStatus.UNDER_DEVELOPMENT;
      project.validation.isValid = false;
      project.validation.summaryText = 'Design updated; re-validation required.';
    }

    this.logEvent(
      projectId,
      RocketEngineeringEventType.DESIGN_UPDATED,
      `Vehicle design parameters updated for project "${project.name}"`
    );

    if (this.eventBus) {
      this.eventBus.emit('rocket:design_updated' as any, { projectId, design: project.design });
    }

    return true;
  }

  public archiveProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    if (project.status === RocketProjectStatus.ASSIGNED_TO_MISSION) {
      Logger.warn('ROCKET_PROJECT_MANAGER', `Cannot archive project ${projectId} while assigned to a mission.`);
      return false;
    }

    project.status = RocketProjectStatus.ARCHIVED;
    project.updatedTimestamp = Date.now();

    this.logEvent(
      projectId,
      RocketEngineeringEventType.PROJECT_ARCHIVED,
      `Project "${project.name}" moved to historical archive.`
    );

    if (this.activeProjectId === projectId) {
      // Find another non-archived project
      const nextActive = Array.from(this.projects.values()).find(
        p => p.projectId !== projectId && p.status !== RocketProjectStatus.ARCHIVED
      );
      this.activeProjectId = nextActive?.projectId;
    }

    return true;
  }

  public deleteProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    if (project.status === RocketProjectStatus.ASSIGNED_TO_MISSION) {
      Logger.warn('ROCKET_PROJECT_MANAGER', `Cannot delete project ${projectId} while assigned to a mission.`);
      return false;
    }

    this.projects.delete(projectId);
    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects.keys().next().value;
    }

    Logger.info('ROCKET_PROJECT_MANAGER', `Deleted project ${projectId}`);
    return true;
  }

  // =========================================================================
  // ENGINEERING VALIDATION ENGINE
  // =========================================================================

  /**
   * Evaluates 5-point engineering validation checklist for the specified project.
   */
  public validateProject(projectId: string): RocketValidationReport {
    const project = this.projects.get(projectId);
    if (!project) {
      return {
        isValid: false,
        summaryText: `Project not found: ${projectId}`,
        checks: [],
      };
    }

    const design = project.design;
    const checks: RocketValidationCheck[] = [];

    // Check 1: Liftoff Thrust-to-Weight Ratio
    const twrPassed = design.initialTwr >= 1.15;
    checks.push({
      id: 'val_twr',
      label: 'Thrust-to-Weight Ratio (TWR >= 1.15)',
      passed: twrPassed,
      metricValue: `${design.initialTwr.toFixed(2)} TWR`,
      thresholdValue: '1.15 TWR min',
      detail: twrPassed
        ? 'First-stage liftoff thrust exceeds gravity load with positive vertical acceleration.'
        : 'INSUFFICIENT THRUST: Vehicle cannot lift off launch mount under sea-level gravity.',
    });

    // Check 2: Total Propulsion Delta-V
    const minDeltaV = design.classRating === RocketClassRating.SUBORBITAL_TEST ? 1500 : 7000;
    const deltaVPassed = design.totalVacuumDeltaV >= minDeltaV;
    checks.push({
      id: 'val_deltav',
      label: 'Propulsion Delta-V Capacity',
      passed: deltaVPassed,
      metricValue: `${design.totalVacuumDeltaV.toLocaleString()} m/s`,
      thresholdValue: `${minDeltaV.toLocaleString()} m/s min`,
      detail: deltaVPassed
        ? `Sufficient delta-V reserve for ${design.classRating} mission flight envelope.`
        : `INSUFFICIENT DELTA-V: Target profile requires at least ${minDeltaV.toLocaleString()} m/s.`,
    });

    // Check 3: Structural Mass Ratio
    const massRatioPassed =
      design.totalWetMassKg > design.totalDryMassKg &&
      design.totalDryMassKg > 0 &&
      (design.totalWetMassKg - design.totalDryMassKg) / design.totalWetMassKg >= 0.5;
    const propFraction = design.totalWetMassKg > 0
      ? (((design.totalWetMassKg - design.totalDryMassKg) / design.totalWetMassKg) * 100).toFixed(1)
      : '0.0';
    checks.push({
      id: 'val_mass_ratio',
      label: 'Structural Mass & Propellant Fraction',
      passed: massRatioPassed,
      metricValue: `${propFraction}% Propellant`,
      thresholdValue: '50.0% min',
      detail: massRatioPassed
        ? 'Mass distribution verified with safe structural margin and propellant density.'
        : 'MASS BALANCE FLAW: Dry mass excessive or propellant load insufficient.',
    });

    // Check 4: Guidance Avionics & Multi-Stage Decouplers
    const multiStage = design.stages.length > 1;
    const avionicsPassed = design.stages.length >= 1;
    checks.push({
      id: 'val_avionics',
      label: 'Guidance & Staging Separation Architecture',
      passed: avionicsPassed,
      metricValue: multiStage ? `${design.stages.length} Stages Configured` : 'Single Stage Core',
      thresholdValue: 'Avionics Bus Active',
      detail: avionicsPassed
        ? 'Stage sequencing and guidance architecture verified.'
        : 'AVIONICS DEFICIENT: Staging sequencing unverified.',
    });

    // Check 5: Aerodynamic Shroud / Fairing Clearance
    const fairingPassed = design.fairingDiameterM >= 1.2;
    checks.push({
      id: 'val_fairing',
      label: 'Payload Fairing & Aerodynamic Envelope',
      passed: fairingPassed,
      metricValue: `${design.fairingDiameterM.toFixed(1)} m Fairing`,
      thresholdValue: '1.2 m min',
      detail: fairingPassed
        ? 'Aerodynamic nose cone and payload shroud protect mission equipment through ascent.'
        : 'SHROUD INADEQUATE: Fairing diameter too narrow for standard payload envelopes.',
    });

    const allPassed = checks.every(c => c.passed);
    const report: RocketValidationReport = {
      isValid: allPassed,
      summaryText: allPassed
        ? `All 5 engineering validation checks passed. Vehicle certified for flight.`
        : `Validation failed: ${checks.filter(c => !c.passed).length} check(s) did not meet standards.`,
      validatedAt: Date.now(),
      checks,
    };

    project.validation = report;
    project.updatedTimestamp = Date.now();

    if (allPassed) {
      if (project.status !== RocketProjectStatus.ASSIGNED_TO_MISSION) {
        project.status = RocketProjectStatus.VALIDATED;
      }
      this.logEvent(
        projectId,
        RocketEngineeringEventType.VALIDATION_PASSED,
        `Validation successful: ${report.summaryText}`
      );
    } else {
      if (project.status !== RocketProjectStatus.ASSIGNED_TO_MISSION) {
        project.status = RocketProjectStatus.AWAITING_VALIDATION;
      }
      this.logEvent(
        projectId,
        RocketEngineeringEventType.VALIDATION_FAILED,
        `Validation check failure: ${report.summaryText}`
      );
    }

    if (this.eventBus) {
      this.eventBus.emit('rocket:validation_completed' as any, { projectId, report });
    }

    return report;
  }

  /**
   * Run authoritative 7-category validation on the specified project using the central engine.
   */
  public validateProjectComprehensive(
    projectId: string,
    mission?: MissionDefinition
  ): ComprehensiveRocketValidationReport {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const builderEngine = RocketBuilderEngine.getInstance();
    const config = builderEngine.getConfiguration();
    const validationEngine = RocketValidationEngine.getInstance(this.eventBus);

    const report = validationEngine.validate({
      projectId: project.projectId,
      configuration: config,
      mission,
    });

    project.comprehensiveValidation = report;
    project.updatedTimestamp = Date.now();

    return report;
  }

  // =========================================================================
  // MISSION COMPATIBILITY EVALUATION
  // =========================================================================

  public evaluateMissionCompatibility(
    projectId: string,
    mission: MissionDefinition
  ): RocketCompatibilityAnalysis {
    const project = this.projects.get(projectId);
    const req = mission.engineeringRequirements;

    const payloadMin = req?.minPayloadMassKg ?? 0;
    const payloadMax = req?.maxPayloadMassKg ?? 500;

    if (!project) {
      return {
        isCompatible: false,
        missionId: mission.id,
        missionName: mission.name,
        missionCategory: mission.category,
        requiredPayloadMassKg: { min: payloadMin, max: payloadMax },
        rocketPayloadCapacityKg: 0,
        payloadCapacityOk: false,
        requiredDeltaVEstimate: 8500,
        rocketTotalDeltaV: 0,
        deltaVOk: false,
        initialTwr: 0,
        twrOk: false,
        fairingClearanceOk: false,
        overallRating: 'INCOMPATIBLE',
        recommendations: ['Select a valid rocket project to analyze compatibility.'],
      };
    }

    const design = project.design;
    const payloadCapacityOk = design.maxPayloadCapacityLeoKg >= payloadMax;

    // Estimate delta-V required based on destination / spacecraft type
    let estimatedDeltaV = 8500; // Baseline LEO
    if (mission.engineeringRequirements?.spacecraftType?.includes('SOUNDING')) {
      estimatedDeltaV = 1500;
    } else if (mission.destinationId.includes('moon') || mission.destinationId.includes('lunar')) {
      estimatedDeltaV = 12500;
    } else if (mission.destinationId.includes('mars') || mission.destinationId.includes('interplanetary')) {
      estimatedDeltaV = 14500;
    } else if (mission.destinationId.includes('geo')) {
      estimatedDeltaV = 11800;
    }

    const deltaVOk = design.totalVacuumDeltaV >= estimatedDeltaV;
    const twrOk = design.initialTwr >= 1.15;
    const fairingClearanceOk = design.fairingDiameterM >= 1.8;

    const recommendations: string[] = [];
    if (!payloadCapacityOk) {
      recommendations.push(
        `PAYLOAD OVERLOAD: Rocket capacity (${design.maxPayloadCapacityLeoKg.toLocaleString()} kg) is under mission maximum (${payloadMax.toLocaleString()} kg). Upgrade first-stage boosters or add strap-ons.`
      );
    } else {
      recommendations.push(
        `Payload Capacity OK: Reserve margin is +${(design.maxPayloadCapacityLeoKg - payloadMax).toLocaleString()} kg.`
      );
    }

    if (!deltaVOk) {
      recommendations.push(
        `DELTA-V DEFICIENT: Total vehicle delta-V (${design.totalVacuumDeltaV.toLocaleString()} m/s) is below required ${estimatedDeltaV.toLocaleString()} m/s for target orbit.`
      );
    } else {
      recommendations.push(
        `Delta-V Margin OK: Reserve margin is +${(design.totalVacuumDeltaV - estimatedDeltaV).toLocaleString()} m/s.`
      );
    }

    if (!twrOk) {
      recommendations.push('LIFTOFF TWR INSUFFICIENT: Sea-level thrust does not provide 1.15 TWR.');
    }

    let overallRating: 'OPTIMAL' | 'ACCEPTABLE' | 'DEFICIENT' | 'INCOMPATIBLE';
    if (payloadCapacityOk && deltaVOk && twrOk && fairingClearanceOk) {
      overallRating = (design.maxPayloadCapacityLeoKg >= payloadMax * 1.3 && design.totalVacuumDeltaV >= estimatedDeltaV * 1.1)
        ? 'OPTIMAL'
        : 'ACCEPTABLE';
    } else if (payloadCapacityOk || deltaVOk) {
      overallRating = 'DEFICIENT';
    } else {
      overallRating = 'INCOMPATIBLE';
    }

    const isCompatible = overallRating === 'OPTIMAL' || overallRating === 'ACCEPTABLE';

    return {
      isCompatible,
      missionId: mission.id,
      missionName: mission.name,
      missionCategory: mission.category,
      requiredPayloadMassKg: { min: payloadMin, max: payloadMax },
      rocketPayloadCapacityKg: design.maxPayloadCapacityLeoKg,
      payloadCapacityOk,
      requiredDeltaVEstimate: estimatedDeltaV,
      rocketTotalDeltaV: design.totalVacuumDeltaV,
      deltaVOk,
      initialTwr: design.initialTwr,
      twrOk,
      fairingClearanceOk,
      overallRating,
      recommendations,
    };
  }

  // =========================================================================
  // MISSION ASSIGNMENT
  // =========================================================================

  public assignToMission(projectId: string, missionId: string, instanceId?: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    project.assignedMissionId = missionId;
    project.assignedInstanceId = instanceId;
    project.status = RocketProjectStatus.ASSIGNED_TO_MISSION;
    project.updatedTimestamp = Date.now();

    this.logEvent(
      projectId,
      RocketEngineeringEventType.ASSIGNED_TO_MISSION,
      `Vehicle assigned to active mission flight: "${missionId}"`
    );

    Logger.info('ROCKET_PROJECT_MANAGER', `Assigned project ${projectId} to mission ${missionId}`);

    if (this.eventBus) {
      this.eventBus.emit('rocket:assigned_to_mission' as any, { projectId, missionId, instanceId });
    }

    return true;
  }

  public unassignFromMission(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const prevMissionId = project.assignedMissionId;
    project.assignedMissionId = undefined;
    project.assignedInstanceId = undefined;
    project.status = project.validation.isValid
      ? RocketProjectStatus.VALIDATED
      : RocketProjectStatus.UNDER_DEVELOPMENT;
    project.updatedTimestamp = Date.now();

    this.logEvent(
      projectId,
      RocketEngineeringEventType.UNASSIGNED_FROM_MISSION,
      `Vehicle released from mission assignment: "${prevMissionId}"`
    );

    if (this.eventBus) {
      this.eventBus.emit('rocket:unassigned_from_mission' as any, { projectId, prevMissionId });
    }

    return true;
  }

  // =========================================================================
  // HOT-FIRE SIMULATION TELEMETRY
  // =========================================================================

  public runHotFireSimulation(projectId: string): {
    success: boolean;
    peakChamberPressureBar: number;
    nominalThrustKn: number;
    specificImpulseSec: number;
    telemetryLog: string[];
  } {
    const project = this.projects.get(projectId);
    if (!project) {
      return {
        success: false,
        peakChamberPressureBar: 0,
        nominalThrustKn: 0,
        specificImpulseSec: 0,
        telemetryLog: ['Error: Project not found.'],
      };
    }

    const firstStage = project.design.stages[0];
    const thrust = firstStage ? firstStage.thrustSeaLevelKn : project.design.seaLevelThrustKn;
    const isp = firstStage ? firstStage.specificImpulseSec : 282;
    const chamberPress = 98.4;

    const telemetryLog = [
      'T-00:03.000: Ignition command sequence sent to engine gimbal avionics.',
      'T-00:01.500: Turbopump spin-up and propellant valve sequencing nominal.',
      `T+00:00.000: Mainstage combustion confirmed. Thrust reached ${thrust.toLocaleString()} kN.`,
      `T+00:02.000: Chamber pressure steady at ${chamberPress} bar. ISP steady at ${isp} s.`,
      'T+00:05.000: Hot-fire test completed. All thermal and structural margins within limits.',
    ];

    this.logEvent(
      projectId,
      RocketEngineeringEventType.TEST_FIRE_SIMULATED,
      `Static hot-fire simulation conducted successfully. Peak thrust: ${thrust} kN.`
    );

    return {
      success: true,
      peakChamberPressureBar: chamberPress,
      nominalThrustKn: thrust,
      specificImpulseSec: isp,
      telemetryLog,
    };
  }

  // =========================================================================
  // ENGINEERING ACTIVITY LOGGING
  // =========================================================================

  public logEvent(
    projectId: string,
    type: RocketEngineeringEventType,
    summary: string,
    details?: Record<string, any>
  ): RocketEngineeringEvent {
    const event: RocketEngineeringEvent = {
      id: `ev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      timestamp: Date.now(),
      type,
      summary,
      details,
    };

    const project = this.projects.get(projectId);
    if (project) {
      project.history.unshift(event);
    }

    this.globalHistory.unshift(event);
    if (this.globalHistory.length > 200) {
      this.globalHistory.pop();
    }

    return event;
  }

  public getProjectHistory(projectId: string): RocketEngineeringEvent[] {
    const project = this.projects.get(projectId);
    return project ? project.history : [];
  }

  public getAllHistory(): RocketEngineeringEvent[] {
    return this.globalHistory;
  }

  // =========================================================================
  // PERSISTENCE (SERIALIZATION & DESERIALIZATION)
  // =========================================================================

  public serialize(): RocketEngineeringSaveData {
    const projectsObj: Record<string, RocketProject> = {};
    for (const [id, p] of this.projects.entries()) {
      projectsObj[id] = p;
    }

    return {
      projects: projectsObj,
      activeProjectId: this.activeProjectId,
      recentActivity: this.globalHistory.slice(0, 50),
    };
  }

  public deserialize(data?: Partial<RocketEngineeringSaveData>): void {
    if (!data) return;

    if (data.projects) {
      this.projects.clear();
      for (const [id, p] of Object.entries(data.projects)) {
        this.projects.set(id, p);
      }
    }

    if (data.activeProjectId && this.projects.has(data.activeProjectId)) {
      this.activeProjectId = data.activeProjectId;
    }

    if (data.recentActivity && Array.isArray(data.recentActivity)) {
      this.globalHistory = [...data.recentActivity];
    }

    Logger.info('ROCKET_PROJECT_MANAGER', `Deserialized ${this.projects.size} rocket projects.`);
  }
}
