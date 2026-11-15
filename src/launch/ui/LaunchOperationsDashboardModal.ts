/**
 * INTERSTELLAR CONTINUUM - Launch Operations Dashboard Modal
 * Authoritative interface accessible from Launch Complex Pad Alpha, displaying:
 * 1. Assigned Mission
 * 2. Selected Rocket Project
 * 3. Rocket Design Version
 * 4. Payload / Spacecraft Assignment
 * 5. Rocket Validation Status
 * 6. Testing Status
 * 7. Mission Compatibility
 * 8. Deployment Status
 * 9. Outstanding Requirements
 *
 * NOTE: Strictly utilizes real-time data from actual project, mission, validation,
 * testing, and inventory subsystems. Zero fabricated readiness or manual overrides.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_SPACING, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { LaunchDeploymentManager } from '../LaunchDeploymentManager';
import { DeploymentRecord, DeploymentState, PayloadIntegrationStatus } from '../LaunchDeploymentTypes';
import { RocketProjectManager } from '../../engineering/RocketProjectManager';
import { MissionCatalogueRegistry } from '../../missions/MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../../missions/MissionLifecycleManager';
import { RocketValidationEngine } from '../../engineering/validation/RocketValidationEngine';
import { RocketTestingManager } from '../../engineering/testing/RocketTestingManager';
import { NotificationManager } from '../../ui/notifications/NotificationManager';

export interface LaunchOperationsDashboardModalOptions {
  onClose?: () => void;
  onNavigateToMOC?: () => void;
  onObserveAtPad?: () => void;
  onOpenTestBench?: (projectId: string) => void;
  onLaunchInitiated?: (deploymentId: string) => void;
}

export class LaunchOperationsDashboardModal {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private panelGfx: Graphics;
  private headerContainer: Container;
  private leftColContainer: Container;
  private rightColContainer: Container;
  private bottomBarContainer: Container;
  private selectorModalContainer: Container;

  private width: number = 1560;
  private height: number = 880;

  private deploymentManager: LaunchDeploymentManager;
  private projectManager: RocketProjectManager;
  private missionRegistry: MissionCatalogueRegistry;
  private lifecycleManager: MissionLifecycleManager;
  private validationEngine: RocketValidationEngine;
  private testingManager: RocketTestingManager;

  private activeDeploymentId?: string;
  private options: LaunchOperationsDashboardModalOptions;

  constructor(options: LaunchOperationsDashboardModalOptions = {}) {
    this.options = options;
    this.container = new Container();
    this.container.label = 'LaunchOperationsDashboardModal';
    this.container.visible = false;
    this.container.zIndex = 1000;

    this.deploymentManager = LaunchDeploymentManager.getInstance();
    this.projectManager = RocketProjectManager.getInstance();
    this.missionRegistry = MissionCatalogueRegistry.getInstance();
    this.lifecycleManager = MissionLifecycleManager.getInstance();
    this.validationEngine = RocketValidationEngine.getInstance();
    this.testingManager = RocketTestingManager.getInstance();

    // 1. Full-screen blocking backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x020617, alpha: 0.85 });
    this.backdropGfx.eventMode = 'static';
    this.container.addChild(this.backdropGfx);

    // 2. Main Terminal Panel
    const panelX = (1920 - this.width) / 2;
    const panelY = (1080 - this.height) / 2;

    this.panelGfx = new Graphics();
    this.panelGfx.position.set(panelX, panelY);
    this.panelGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.MD);
    this.panelGfx.fill({ color: 0x07111e, alpha: 0.98 });
    this.panelGfx.stroke({ color: UI_COLORS.CYAN, width: 2 });
    this.panelGfx.eventMode = 'static';
    this.container.addChild(this.panelGfx);

    // Sub-containers
    this.headerContainer = new Container();
    this.headerContainer.position.set(panelX, panelY);
    this.container.addChild(this.headerContainer);

    this.leftColContainer = new Container();
    this.leftColContainer.position.set(panelX + UI_SPACING.LG, panelY + 65);
    this.container.addChild(this.leftColContainer);

    this.rightColContainer = new Container();
    this.rightColContainer.position.set(panelX + 790, panelY + 65);
    this.container.addChild(this.rightColContainer);

    this.bottomBarContainer = new Container();
    this.bottomBarContainer.position.set(panelX + UI_SPACING.LG, panelY + this.height - 65);
    this.container.addChild(this.bottomBarContainer);

    this.selectorModalContainer = new Container();
    this.selectorModalContainer.position.set(panelX, panelY);
    this.selectorModalContainer.visible = false;
    this.container.addChild(this.selectorModalContainer);
  }

  public show(deploymentId?: string): void {
    if (deploymentId) {
      this.activeDeploymentId = deploymentId;
    } else {
      const active = this.deploymentManager.getActiveDeployment();
      this.activeDeploymentId = active?.deploymentId;
    }

    // Auto-create or resolve deployment if none exists
    if (!this.activeDeploymentId) {
      this.ensureActiveDeployment();
    }

    if (this.activeDeploymentId) {
      this.deploymentManager.evaluateDeploymentEligibility(this.activeDeploymentId);
    }

    this.container.visible = true;
    this.render();
  }

  public hide(): void {
    this.container.visible = false;
    this.selectorModalContainer.visible = false;
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  private ensureActiveDeployment(): void {
    const activeInstances = this.lifecycleManager.getActiveInstances();
    if (activeInstances.length > 0) {
      const firstInst = activeInstances[0]!;
      const existing = this.deploymentManager.getDeploymentByMission(firstInst.instanceId);
      if (existing) {
        this.activeDeploymentId = existing.deploymentId;
      } else {
        const activeProj = this.projectManager.getActiveProject();
        const dep = this.deploymentManager.createDeployment({
          missionInstanceId: firstInst.instanceId,
          missionId: firstInst.missionId,
          projectId: activeProj?.projectId,
        });
        this.activeDeploymentId = dep.deploymentId;
      }
    }
  }

  public render(): void {
    this.headerContainer.removeChildren();
    this.leftColContainer.removeChildren();
    this.rightColContainer.removeChildren();
    this.bottomBarContainer.removeChildren();

    const deployment = this.activeDeploymentId
      ? this.deploymentManager.getDeployment(this.activeDeploymentId)
      : undefined;

    this.renderHeader(deployment);
    this.renderLeftColumn(deployment);
    this.renderRightColumn(deployment);
    this.renderBottomBar(deployment);
  }

  // =========================================================================
  // HEADER BAR
  // =========================================================================

  private renderHeader(deployment?: DeploymentRecord): void {
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, this.width, 56, UI_RADIUS.MD);
    headerBg.fill({ color: 0x0b1c30 });
    headerBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.headerContainer.addChild(headerBg);

    const title = new Text({
      text: '🚀 LAUNCH COMPLEX OPERATIONS // PAD-01 CHECKOUT & DEPLOYMENT',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.2,
      }),
    });
    title.position.set(UI_SPACING.LG, 18);
    this.headerContainer.addChild(title);

    // State Badge
    const status = deployment?.status ?? DeploymentState.NOT_ASSIGNED;
    const badgeColor = deployment?.isEligible ? 0x22c55e : status === DeploymentState.NOT_ASSIGNED ? 0x94a3b8 : 0xf59e0b;

    const badgeGfx = new Graphics();
    badgeGfx.roundRect(820, 12, 280, 32, 4);
    badgeGfx.fill({ color: 0x050f1c });
    badgeGfx.stroke({ color: badgeColor, width: 1.5 });
    this.headerContainer.addChild(badgeGfx);

    const badgeText = new Text({
      text: `STATUS: ${status}`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: badgeColor,
      }),
    });
    badgeText.anchor.set(0.5, 0.5);
    badgeText.position.set(960, 28);
    this.headerContainer.addChild(badgeText);

    // Close Button [X]
    const closeBtn = new UIButton({
      label: '✕ CLOSE',
      width: 100,
      height: 34,
      variant: 'DANGER',
      onClick: () => this.hide(),
    });
    closeBtn.container.position.set(this.width - 120, 11);
    this.headerContainer.addChild(closeBtn.container);
  }

  // =========================================================================
  // LEFT COLUMN: MISSION, ROCKET, PAYLOAD, VALIDATION/TESTING
  // =========================================================================

  private renderLeftColumn(deployment?: DeploymentRecord): void {
    const colWidth = 740;
    let curY = 0;

    // 1. Assigned Mission Card
    curY = this.renderMissionCard(deployment, colWidth, curY);

    // 2. Selected Rocket Project & Design Version Card
    curY = this.renderRocketCard(deployment, colWidth, curY + 12);

    // 3. Payload & Spacecraft Assignment Card
    curY = this.renderPayloadCard(deployment, colWidth, curY + 12);

    // 4. Engineering Validation & Test Benchmark Card
    this.renderCertificationCard(deployment, colWidth, curY + 12);
  }

  private renderMissionCard(deployment: DeploymentRecord | undefined, width: number, y: number): number {
    const cardH = 150;
    const mission = deployment?.missionId ? this.missionRegistry.getMissionById(deployment.missionId) : undefined;
    const instance = deployment?.missionInstanceId ? this.lifecycleManager.getInstance(deployment.missionInstanceId) : undefined;

    const bg = new Graphics();
    bg.roundRect(0, y, width, cardH, UI_RADIUS.SM);
    bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.leftColContainer.addChild(bg);

    const title = new Text({
      text: '1. ASSIGNED MISSION CONTRACT',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    title.position.set(14, y + 10);
    this.leftColContainer.addChild(title);

    if (mission && instance) {
      const nameText = new Text({
        text: mission.name,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 16, fontWeight: 'bold', fill: 0xffffff }),
      });
      nameText.position.set(14, y + 32);
      this.leftColContainer.addChild(nameText);

      const destText = new Text({
        text: `TARGET DESTINATION: ${mission.destinationId}   |   CATEGORY: ${mission.category}   |   DIFFICULTY: ${mission.difficulty}`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: UI_COLORS.AMBER }),
      });
      destText.position.set(14, y + 60);
      this.leftColContainer.addChild(destText);

      const descText = new Text({
        text: mission.description.length > 170 ? mission.description.substring(0, 168) + '...' : mission.description,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: 0x94a3b8, wordWrap: true, wordWrapWidth: width - 30 }),
      });
      descText.position.set(14, y + 84);
      this.leftColContainer.addChild(descText);

      const lifecycleText = new Text({
        text: `LIFECYCLE: ${instance.status}   |   INSTANCE: ${instance.instanceId}`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0x22c55e }),
      });
      lifecycleText.position.set(14, y + 124);
      this.leftColContainer.addChild(lifecycleText);
    } else {
      const noMissText = new Text({
        text: 'NO ACTIVE MISSION BOUND TO DEPLOYMENT.\nAccept a contract in Mission Operations Centre to begin flight rollout.',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: 0xef4444 }),
      });
      noMissText.position.set(14, y + 55);
      this.leftColContainer.addChild(noMissText);
    }

    return y + cardH;
  }

  private renderRocketCard(deployment: DeploymentRecord | undefined, width: number, y: number): number {
    const cardH = 160;
    const project = deployment?.projectId ? this.projectManager.getProject(deployment.projectId) : undefined;

    const bg = new Graphics();
    bg.roundRect(0, y, width, cardH, UI_RADIUS.SM);
    bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.leftColContainer.addChild(bg);

    const title = new Text({
      text: '2. SELECTED LAUNCH VEHICLE & VERSION INTEGRITY',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    title.position.set(14, y + 10);
    this.leftColContainer.addChild(title);

    // Button: Select / Switch Rocket
    const selectBtn = new UIButton({
      label: 'SWITCH VEHICLE',
      width: 140,
      height: 28,
      variant: 'OUTLINE',
      onClick: () => this.openRocketSelectorModal(),
    });
    selectBtn.container.position.set(width - 155, y + 8);
    this.leftColContainer.addChild(selectBtn.container);

    if (project) {
      const nameText = new Text({
        text: project.name,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 16, fontWeight: 'bold', fill: 0xffffff }),
      });
      nameText.position.set(14, y + 32);
      this.leftColContainer.addChild(nameText);

      // Version badge
      const badgeX = Math.max(220, 14 + project.name.length * 10);
      const verGfx = new Graphics();
      verGfx.roundRect(badgeX, y + 32, 68, 22, 3);
      verGfx.fill({ color: 0x1e3a5f });
      verGfx.stroke({ color: UI_COLORS.CYAN, width: 1 });
      this.leftColContainer.addChild(verGfx);

      const verText = new Text({
        text: project.designVersion,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
      });
      verText.position.set(badgeX + 6, y + 35);
      this.leftColContainer.addChild(verText);

      const specsText = new Text({
        text: `CLASS: ${project.design.classRating}   |   STAGES: ${project.design.stages.length}   |   WET MASS: ${Math.round(project.design.totalWetMassKg)} kg   |   VAC DELTA-V: ${Math.round(project.design.totalVacuumDeltaV)} m/s   |   LIFT: ${project.design.maxPayloadCapacityLeoKg} kg`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: 0x94a3b8 }),
      });
      specsText.position.set(14, y + 64);
      this.leftColContainer.addChild(specsText);

      const hashText = new Text({
        text: `CONFIG HASH: ${deployment?.configurationHash ? deployment.configurationHash.substring(0, 48) + '...' : 'none'}`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 9.5, fill: 0x64748b }),
      });
      hashText.position.set(14, y + 90);
      this.leftColContainer.addChild(hashText);

      const versionMatch = deployment?.designVersion === project.designVersion;
      const statusText = new Text({
        text: versionMatch
          ? '✓ Design version is current. Rollout hardware configuration locked.'
          : `⚠ Rollout version (${deployment?.designVersion}) differs from project (${project.designVersion}). Re-assignment required.`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: versionMatch ? 0x22c55e : 0xf59e0b }),
      });
      statusText.position.set(14, y + 126);
      this.leftColContainer.addChild(statusText);
    } else {
      const noRocText = new Text({
        text: 'NO LAUNCH VEHICLE SELECTED.\nSelect a certified rocket project created in Rocket Engineering Facility.',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: 0xef4444 }),
      });
      noRocText.position.set(14, y + 60);
      this.leftColContainer.addChild(noRocText);
    }

    return y + cardH;
  }

  private renderPayloadCard(deployment: DeploymentRecord | undefined, width: number, y: number): number {
    const cardH = 150;
    const payload = deployment?.payload;

    const bg = new Graphics();
    bg.roundRect(0, y, width, cardH, UI_RADIUS.SM);
    bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.leftColContainer.addChild(bg);

    const title = new Text({
      text: '3. PAYLOAD & SPACECRAFT ASSIGNMENT',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    title.position.set(14, y + 10);
    this.leftColContainer.addChild(title);

    if (payload) {
      const nameText = new Text({
        text: payload.name,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 15, fontWeight: 'bold', fill: 0xffffff }),
      });
      nameText.position.set(14, y + 32);
      this.leftColContainer.addChild(nameText);

      // Status pill
      const pillColor =
        payload.status === PayloadIntegrationStatus.MOUNTED_IN_VEHICLE
          ? 0x22c55e
          : payload.status === PayloadIntegrationStatus.INTEGRATED
          ? 0x38bdf8
          : 0xf59e0b;

      const pillX = Math.max(260, 14 + payload.name.length * 9);
      const pillGfx = new Graphics();
      pillGfx.roundRect(pillX, y + 32, 160, 22, 3);
      pillGfx.fill({ color: 0x050f1c });
      pillGfx.stroke({ color: pillColor, width: 1 });
      this.leftColContainer.addChild(pillGfx);

      const pillText = new Text({
        text: payload.status,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 9.5, fontWeight: 'bold', fill: pillColor }),
      });
      pillText.anchor.set(0.5, 0.5);
      pillText.position.set(pillX + 80, y + 43);
      this.leftColContainer.addChild(pillText);

      const typeText = new Text({
        text: `CATEGORY: ${payload.category}   |   TYPE: ${payload.payloadType}   |   MIN MASS: ${payload.massKg} kg`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: UI_COLORS.AMBER }),
      });
      typeText.position.set(14, y + 62);
      this.leftColContainer.addChild(typeText);

      const notesText = new Text({
        text: payload.statusNotes,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: 0x94a3b8, wordWrap: true, wordWrapWidth: width - 30 }),
      });
      notesText.position.set(14, y + 86);
      this.leftColContainer.addChild(notesText);

      const compText = new Text({
        text: payload.componentId
          ? `✓ Vehicle Payload Module: "${payload.componentId}" detected in upper stage.`
          : '⚠ Upper stage fairing empty. Spacecraft cleanroom fabrication pending future phase.',
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: payload.componentId ? 0x22c55e : 0xf59e0b }),
      });
      compText.position.set(14, y + 122);
      this.leftColContainer.addChild(compText);
    }

    return y + cardH;
  }

  private renderCertificationCard(deployment: DeploymentRecord | undefined, width: number, y: number): number {
    const cardH = 150;
    const project = deployment?.projectId ? this.projectManager.getProject(deployment.projectId) : undefined;
    const valReport = project?.comprehensiveValidation ?? (project ? this.validationEngine.getLatestReport(project.projectId) : undefined);
    const testReport = project ? this.testingManager.getLatestTestReport(project.projectId) : undefined;

    const bg = new Graphics();
    bg.roundRect(0, y, width, cardH, UI_RADIUS.SM);
    bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.leftColContainer.addChild(bg);

    const title = new Text({
      text: '4. VALIDATION & TESTING BENCHMARK',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    title.position.set(14, y + 10);
    this.leftColContainer.addChild(title);

    // Validation Status Line
    const valPassed = valReport?.isValid ?? false;
    const valErrors = valReport ? valReport.issues.filter(i => i.severity === 'ERROR').length : 0;
    const valWarnings = valReport ? valReport.issues.filter(i => i.severity === 'WARNING').length : 0;
    const valLine = new Text({
      text: valReport
        ? `VALIDATION: ${valReport.status} (Errors: ${valErrors}, Warnings: ${valWarnings})`
        : 'VALIDATION: NOT RUN',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: valPassed ? 0x22c55e : 0xef4444 }),
    });
    valLine.position.set(14, y + 36);
    this.leftColContainer.addChild(valLine);

    const valSummary = new Text({
      text: valReport ? valReport.summaryText : 'Execute validation in Rocket Engineering Facility to certify flight.',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: 0x94a3b8 }),
    });
    valSummary.position.set(14, y + 56);
    this.leftColContainer.addChild(valSummary);

    // Testing Benchmark Line
    const testPassed = testReport?.status === 'PASSED' || testReport?.status === 'PASSED_WITH_WARNINGS';
    const isStale = testReport && project && testReport.designVersion !== project.designVersion;

    const testLine = new Text({
      text: testReport
        ? `TEST BENCH: ${testReport.status} (Score: ${testReport.overallScore}/100, Reliability: ${testReport.ratingsSummary.reliabilityRating}%)${isStale ? ' [OUTDATED]' : ''}`
        : 'TEST BENCH: NO TEST RECORD',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: isStale ? 0xf59e0b : testPassed ? 0x22c55e : 0xef4444,
      }),
    });
    testLine.position.set(14, y + 84);
    this.leftColContainer.addChild(testLine);

    const testSummary = new Text({
      text: testReport
        ? testReport.summaryText
        : 'Execute abstract simulation on testing workbench before launch authorization.',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: 0x94a3b8 }),
    });
    testSummary.position.set(14, y + 104);
    this.leftColContainer.addChild(testSummary);

    return y + cardH;
  }

  // =========================================================================
  // RIGHT COLUMN: REQUIREMENTS, READINESS CHECKLIST, EVENT LOG
  // =========================================================================

  private renderRightColumn(deployment?: DeploymentRecord): void {
    const colWidth = 740;

    // 1. Outstanding Requirements & Deployment Eligibility Checklist
    const checkH = 430;
    const bg = new Graphics();
    bg.roundRect(0, 0, colWidth, checkH, UI_RADIUS.SM);
    bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.rightColContainer.addChild(bg);

    const title = new Text({
      text: '5. DETERMINISTIC PRE-LAUNCH READINESS CRITERIA (10 CHECKPOINTS)',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    title.position.set(14, 10);
    this.rightColContainer.addChild(title);

    const reqs = deployment?.requirements ?? [];
    let rY = 32;

    reqs.forEach((req, idx) => {
      const satisfied = req.satisfied;
      const icon = satisfied ? '✓' : req.blocking ? '✕' : '⚠';
      const color = satisfied ? 0x22c55e : req.blocking ? 0xef4444 : 0xf59e0b;

      const rowGfx = new Graphics();
      rowGfx.roundRect(10, rY, colWidth - 20, 36, 3);
      rowGfx.fill({ color: satisfied ? 0x091e1e : 0x1f0d14, alpha: 0.6 });
      rowGfx.stroke({ color, width: 1 });
      this.rightColContainer.addChild(rowGfx);

      const iconText = new Text({
        text: icon,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', fill: color }),
      });
      iconText.position.set(18, rY + 8);
      this.rightColContainer.addChild(iconText);

      const nameText = new Text({
        text: `${idx + 1}. ${req.name}`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: 0xffffff }),
      });
      nameText.position.set(38, rY + 4);
      this.rightColContainer.addChild(nameText);

      const detailsText = new Text({
        text: req.details,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: 0x94a3b8 }),
      });
      detailsText.position.set(38, rY + 18);
      this.rightColContainer.addChild(detailsText);

      rY += 39;
    });

    // 2. Audit Event Log
    const logH = 200;
    const logY = checkH + 12;

    const logBg = new Graphics();
    logBg.roundRect(0, logY, colWidth, logH, UI_RADIUS.SM);
    logBg.fill({ color: 0x071322, alpha: 0.9 });
    logBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.rightColContainer.addChild(logBg);

    const logTitle = new Text({
      text: '6. LAUNCH OPERATIONS AUDIT LOG (RECENT EVENTS)',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    logTitle.position.set(14, logY + 10);
    this.rightColContainer.addChild(logTitle);

    const events = (deployment?.events ?? []).slice(-4).reverse();
    let eY = logY + 34;

    events.forEach(evt => {
      const timeStr = new Date(evt.timestamp).toLocaleTimeString();
      const lineText = new Text({
        text: `[${timeStr}] [${evt.actor}] ${evt.eventType}: ${evt.description}`,
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 10,
          fill: evt.eventType.includes('Conflict') || evt.eventType.includes('Failed') ? 0xef4444 : 0x38bdf8,
        }),
      });
      lineText.position.set(14, eY);
      this.rightColContainer.addChild(lineText);
      eY += 20;
    });
  }

  // =========================================================================
  // BOTTOM ACTION BAR
  // =========================================================================

  private renderBottomBar(deployment?: DeploymentRecord): void {
    const isEligible = deployment?.isEligible ?? false;
    const isScheduled = deployment?.status === DeploymentState.DEPLOYMENT_SCHEDULED;
    const isInitiated = deployment?.status === DeploymentState.DEPLOYMENT_INITIATED;

    // 1. Observe at Pad Button
    const observeBtn = new UIButton({
      label: '🔭 OBSERVE AT PAD',
      width: 170,
      height: 38,
      variant: 'SECONDARY',
      onClick: () => {
        this.hide();
        if (this.options.onObserveAtPad) {
          this.options.onObserveAtPad();
        }
      },
    });
    observeBtn.container.position.set(0, 8);
    this.bottomBarContainer.addChild(observeBtn.container);

    // 2. Return to MOC Button
    const mocBtn = new UIButton({
      label: '🛰 MISSION OPERATIONS',
      width: 190,
      height: 38,
      variant: 'SECONDARY',
      onClick: () => {
        this.hide();
        if (this.options.onNavigateToMOC) {
          this.options.onNavigateToMOC();
        }
      },
    });
    mocBtn.container.position.set(185, 8);
    this.bottomBarContainer.addChild(mocBtn.container);

    // 3. Test Bench Jump Button
    if (deployment?.projectId) {
      const testBtn = new UIButton({
        label: '🔬 TEST BENCH',
        width: 140,
        height: 38,
        variant: 'SECONDARY',
        onClick: () => {
          this.hide();
          if (this.options.onOpenTestBench) {
            this.options.onOpenTestBench(deployment.projectId);
          }
        },
      });
      testBtn.container.position.set(390, 8);
      this.bottomBarContainer.addChild(testBtn.container);
    }

    // 4. Schedule Deployment Button
    const canSchedule = isEligible && !isScheduled && !isInitiated;
    const schedBtn = new UIButton({
      label: '⏱ SCHEDULE COUNTDOWN',
      width: 210,
      height: 38,
      variant: canSchedule ? 'PRIMARY' : 'SECONDARY',
      disabled: !canSchedule,
      onClick: () => {
        if (!deployment) return;
        const success = this.deploymentManager.scheduleDeployment(deployment.deploymentId, 10);
        if (success) {
          NotificationManager.getInstance().notify({
            title: 'LAUNCH COUNTDOWN SCHEDULED',
            message: 'T-minus 10s countdown initiated for Pad Alpha deployment.',
            level: 'INFO',
          });
          this.render();
        }
      },
    });
    schedBtn.container.position.set(this.width - 550, 8);
    this.bottomBarContainer.addChild(schedBtn.container);

    // 5. Initiate Launch Sequence Button
    const canLaunch = isScheduled || isEligible;
    const launchBtn = new UIButton({
      label: '🚀 INITIATE LAUNCH',
      width: 190,
      height: 38,
      variant: canLaunch ? 'PRIMARY' : 'SECONDARY',
      disabled: !canLaunch,
      onClick: () => {
        if (!deployment) return;
        const success = this.deploymentManager.initiateDeployment(deployment.deploymentId);
        if (success) {
          NotificationManager.getInstance().notify({
            title: 'IGNITION COMMAND CONFIRMED',
            message: `Launch vehicle "${deployment.projectId}" departing Pad Alpha!`,
            level: 'SUCCESS',
          });
          this.hide();
          if (this.options.onLaunchInitiated) {
            this.options.onLaunchInitiated(deployment.deploymentId);
          }
        }
      },
    });
    launchBtn.container.position.set(this.width - 325, 8);
    this.bottomBarContainer.addChild(launchBtn.container);

    // 6. Cancel Deployment Button
    if (deployment && deployment.status !== DeploymentState.CANCELLED && deployment.status !== DeploymentState.NOT_ASSIGNED) {
      const cancelBtn = new UIButton({
        label: 'STAND DOWN',
        width: 110,
        height: 38,
        variant: 'DANGER',
        onClick: () => {
          this.deploymentManager.cancelDeployment(deployment.deploymentId, 'Stood down by Flight Director');
          NotificationManager.getInstance().notify({
            title: 'DEPLOYMENT CANCELLED',
            message: 'Vehicle stood down. Launchpad Pad Alpha returned to standby.',
            level: 'WARNING',
          });
          this.render();
        },
      });
      cancelBtn.container.position.set(this.width - 120, 8);
      this.bottomBarContainer.addChild(cancelBtn.container);
    }
  }

  // =========================================================================
  // VEHICLE SELECTOR MODAL
  // =========================================================================

  private openRocketSelectorModal(): void {
    this.selectorModalContainer.removeChildren();
    this.selectorModalContainer.visible = true;

    const modalW = 860;
    const modalH = 560;
    const mX = (this.width - modalW) / 2;
    const mY = (this.height - modalH) / 2;

    const modalBg = new Graphics();
    modalBg.roundRect(mX, mY, modalW, modalH, UI_RADIUS.MD);
    modalBg.fill({ color: 0x050f1c, alpha: 0.98 });
    modalBg.stroke({ color: UI_COLORS.CYAN, width: 2 });
    this.selectorModalContainer.addChild(modalBg);

    const mTitle = new Text({
      text: 'SELECT LAUNCH VEHICLE FOR PAD ALPHA DEPLOYMENT',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 15, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    mTitle.position.set(mX + UI_SPACING.LG, mY + 16);
    this.selectorModalContainer.addChild(mTitle);

    const closeMBtn = new UIButton({
      label: '✕ CANCEL',
      width: 100,
      height: 30,
      variant: 'DANGER',
      onClick: () => {
        this.selectorModalContainer.visible = false;
      },
    });
    closeMBtn.container.position.set(mX + modalW - 120, mY + 12);
    this.selectorModalContainer.addChild(closeMBtn.container);

    const projects = this.projectManager.getAllProjects();
    let rowY = mY + 60;

    projects.forEach(p => {
      const rowBg = new Graphics();
      rowBg.roundRect(mX + 16, rowY, modalW - 32, 64, 4);
      rowBg.fill({ color: 0x0b1a2e });
      rowBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.selectorModalContainer.addChild(rowBg);

      const pName = new Text({
        text: `${p.name} (${p.designVersion})`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 14, fontWeight: 'bold', fill: 0xffffff }),
      });
      pName.position.set(mX + 28, rowY + 10);
      this.selectorModalContainer.addChild(pName);

      const pDetails = new Text({
        text: `CLASS: ${p.design.classRating}   |   DELTA-V: ${Math.round(p.design.totalVacuumDeltaV)} m/s   |   LIFT: ${p.design.maxPayloadCapacityLeoKg} kg   |   MASS: ${Math.round(p.design.totalWetMassKg)} kg`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: 0x94a3b8 }),
      });
      pDetails.position.set(mX + 28, rowY + 34);
      this.selectorModalContainer.addChild(pDetails);

      const assignBtn = new UIButton({
        label: 'ASSIGN TO PAD',
        width: 130,
        height: 32,
        variant: 'PRIMARY',
        onClick: () => {
          if (this.activeDeploymentId) {
            const success = this.deploymentManager.assignRocket(this.activeDeploymentId, p.projectId);
            if (success) {
              NotificationManager.getInstance().notify({
                title: 'VEHICLE ASSIGNED',
                message: `Assigned "${p.name}" (${p.designVersion}) to Launch Complex Pad Alpha.`,
                level: 'SUCCESS',
              });
            }
          }
          this.selectorModalContainer.visible = false;
          this.render();
        },
      });
      assignBtn.container.position.set(mX + modalW - 170, rowY + 16);
      this.selectorModalContainer.addChild(assignBtn.container);

      rowY += 72;
    });

    if (projects.length === 0) {
      const noneText = new Text({
        text: 'NO SAVED ROCKET PROJECTS ON FILE.\nVisit the Rocket Engineering Facility to design and save a vehicle.',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 13, fill: 0xef4444 }),
      });
      noneText.position.set(mX + 30, rowY + 30);
      this.selectorModalContainer.addChild(noneText);
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
