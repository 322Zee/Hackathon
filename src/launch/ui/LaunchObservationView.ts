/**
 * INTERSTELLAR CONTINUUM - Launch Observation View
 * Dedicated observation bunker interface accessible from the launch complex,
 * reviewing mission identity, rocket identity, destination, payload, and live deployment status,
 * while managing the launch countdown sequencing and abort safety protocols.
 *
 * NOTE: Strictly abstract educational parameters and game mechanics.
 * Real-world operational procedures or actionable launch checklists are strictly excluded.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_SPACING, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { LaunchDeploymentManager } from '../LaunchDeploymentManager';
import { DeploymentRecord, DeploymentState } from '../LaunchDeploymentTypes';
import { RocketProjectManager } from '../../engineering/RocketProjectManager';
import { MissionCatalogueRegistry } from '../../missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../destinations/DestinationRegistry';
import { NotificationManager } from '../../ui/notifications/NotificationManager';

export interface LaunchObservationViewOptions {
  onClose?: () => void;
  onOpenDashboard?: () => void;
  onLaunchCompleted?: (deploymentId: string) => void;
}

export class LaunchObservationView {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private bunkerFrameGfx: Graphics;
  private headerContainer: Container;
  private periscopeContainer: Container;
  private telemetryContainer: Container;
  private countdownContainer: Container;
  private controlsContainer: Container;

  private width: number = 1560;
  private height: number = 880;

  private deploymentManager: LaunchDeploymentManager;
  private projectManager: RocketProjectManager;
  private missionRegistry: MissionCatalogueRegistry;
  private destinationRegistry: DestinationRegistry;

  private activeDeploymentId?: string;
  private options: LaunchObservationViewOptions;

  // Countdown timer state
  private countdownActive: boolean = false;
  private countdownSeconds: number = 10;
  private countdownInterval?: any;

  constructor(options: LaunchObservationViewOptions = {}) {
    this.options = options;
    this.container = new Container();
    this.container.label = 'LaunchObservationView';
    this.container.visible = false;
    this.container.zIndex = 1050;

    this.deploymentManager = LaunchDeploymentManager.getInstance();
    this.projectManager = RocketProjectManager.getInstance();
    this.missionRegistry = MissionCatalogueRegistry.getInstance();
    this.destinationRegistry = DestinationRegistry.getInstance();

    const pX = (1920 - this.width) / 2;
    const pY = (1080 - this.height) / 2;

    // Fullscreen backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080).fill({ color: 0x020617, alpha: 0.9 });
    this.backdropGfx.eventMode = 'static';
    this.container.addChild(this.backdropGfx);

    // Bunker Window Frame
    this.bunkerFrameGfx = new Graphics();
    this.bunkerFrameGfx.position.set(pX, pY);
    this.bunkerFrameGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.MD);
    this.bunkerFrameGfx.fill({ color: 0x060f1c, alpha: 0.98 });
    this.bunkerFrameGfx.stroke({ color: UI_COLORS.AMBER, width: 2 });
    this.bunkerFrameGfx.eventMode = 'static';
    this.container.addChild(this.bunkerFrameGfx);

    this.headerContainer = new Container();
    this.headerContainer.position.set(pX, pY);
    this.container.addChild(this.headerContainer);

    this.periscopeContainer = new Container();
    this.periscopeContainer.position.set(pX + UI_SPACING.LG, pY + 65);
    this.container.addChild(this.periscopeContainer);

    this.telemetryContainer = new Container();
    this.telemetryContainer.position.set(pX + 800, pY + 65);
    this.container.addChild(this.telemetryContainer);

    this.countdownContainer = new Container();
    this.countdownContainer.position.set(pX + UI_SPACING.LG, pY + this.height - 180);
    this.container.addChild(this.countdownContainer);

    this.controlsContainer = new Container();
    this.controlsContainer.position.set(pX + UI_SPACING.LG, pY + this.height - 65);
    this.container.addChild(this.controlsContainer);
  }

  public show(deploymentId?: string): void {
    if (deploymentId) {
      this.activeDeploymentId = deploymentId;
    } else {
      const active = this.deploymentManager.getActiveDeployment();
      this.activeDeploymentId = active?.deploymentId;
    }

    if (this.activeDeploymentId) {
      this.deploymentManager.evaluateDeploymentEligibility(this.activeDeploymentId);
    }

    this.container.visible = true;
    this.render();
  }

  public hide(): void {
    this.stopCountdown();
    this.container.visible = false;
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public render(): void {
    this.headerContainer.removeChildren();
    this.periscopeContainer.removeChildren();
    this.telemetryContainer.removeChildren();
    this.countdownContainer.removeChildren();
    this.controlsContainer.removeChildren();

    const deployment = this.activeDeploymentId
      ? this.deploymentManager.getDeployment(this.activeDeploymentId)
      : undefined;

    this.renderHeader(deployment);
    this.renderPeriscopeWindow(deployment);
    this.renderTelemetryPanels(deployment);
    this.renderCountdownClock(deployment);
    this.renderControlButtons(deployment);
  }

  // =========================================================================
  // 1. HEADER
  // =========================================================================

  private renderHeader(_deployment?: DeploymentRecord): void {
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, this.width, 56, UI_RADIUS.MD);
    headerBg.fill({ color: 0x091424 });
    headerBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.headerContainer.addChild(headerBg);

    const title = new Text({
      text: '🔭 LAUNCH OBSERVATION AREA & RANGE SAFETY BERM // PAD-01',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 1.2,
      }),
    });
    title.position.set(UI_SPACING.LG, 18);
    this.headerContainer.addChild(title);

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
  // 2. PERISCOPE LAUNCHPAD VIEWPORT
  // =========================================================================

  private renderPeriscopeWindow(deployment?: DeploymentRecord): void {
    const viewW = 750;
    const viewH = 550;

    const winGfx = new Graphics();
    winGfx.roundRect(0, 0, viewW, viewH, 6);
    winGfx.fill({ color: 0x081320 });
    winGfx.stroke({ color: 0x38bdf8, width: 2 });

    // Optical reticle crosshairs
    winGfx.moveTo(viewW / 2 - 40, viewH / 2).lineTo(viewW / 2 + 40, viewH / 2).stroke({ color: 0x38bdf8, width: 1, alpha: 0.5 });
    winGfx.moveTo(viewW / 2, viewH / 2 - 40).lineTo(viewW / 2, viewH / 2 + 40).stroke({ color: 0x38bdf8, width: 1, alpha: 0.5 });
    winGfx.circle(viewW / 2, viewH / 2, 24).stroke({ color: 0x38bdf8, width: 1, alpha: 0.4 });

    // Range safety boundary ring
    winGfx.circle(viewW / 2, viewH / 2 + 60, 140).stroke({ color: 0xf59e0b, width: 1, alpha: 0.3 });

    this.periscopeContainer.addChild(winGfx);

    // Live Telemetry Overlay in window
    const project = deployment?.projectId ? this.projectManager.getProject(deployment.projectId) : undefined;
    const overlayText = new Text({
      text: `LIVE OPTICAL TRACKER: PAD-01\nAZIMUTH: 090°  |  ELEVATION: 12°  |  DISTANCE: 850m\nVEHICLE: ${project ? project.name.toUpperCase() : 'NO VEHICLE'} (${project ? project.designVersion : 'N/A'})\nSTATUS: ${deployment?.status ?? 'STANDBY'}`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10.5,
        fill: 0x38bdf8,
        lineHeight: 18,
      }),
    });
    overlayText.position.set(16, 16);
    this.periscopeContainer.addChild(overlayText);

    // Draw stylized rocket silhouette inside periscope
    if (project) {
      const silGfx = new Graphics();
      const cx = viewW / 2;
      const cy = viewH / 2 + 80;

      // Base launch cradle
      silGfx.rect(cx - 50, cy, 100, 16).fill({ color: 0x1e293b });
      // Booster body
      silGfx.roundRect(cx - 24, cy - 140, 48, 140, 2).fill({ color: 0x1e3a5f }).stroke({ color: 0x38bdf8, width: 1 });
      // Upper stage
      silGfx.roundRect(cx - 20, cy - 220, 40, 80, 2).fill({ color: 0x0f2238 }).stroke({ color: 0x38bdf8, width: 1 });
      // Fairing cone
      silGfx.poly([
        { x: cx - 20, y: cy - 220 },
        { x: 0 + cx, y: cy - 280 },
        { x: cx + 20, y: cy - 220 },
      ]).fill({ color: 0x071526 }).stroke({ color: 0x38bdf8, width: 1 });

      // Service tower on right
      silGfx.rect(cx + 60, cy - 260, 24, 260).fill({ color: 0xdc2626 });
      silGfx.moveTo(cx + 60, cy - 120).lineTo(cx + 24, cy - 120).stroke({ color: 0x94a3b8, width: 3 });

      this.periscopeContainer.addChild(silGfx);
    }
  }

  // =========================================================================
  // 3. TELEMETRY CARDS (MISSION, ROCKET, DESTINATION, PAYLOAD)
  // =========================================================================

  private renderTelemetryPanels(deployment?: DeploymentRecord): void {
    const colW = 720;
    let curY = 0;

    const mission = deployment?.missionId ? this.missionRegistry.getMissionById(deployment.missionId) : undefined;
    const project = deployment?.projectId ? this.projectManager.getProject(deployment.projectId) : undefined;
    const dest = mission ? this.destinationRegistry.getDestination(mission.destinationId) : undefined;
    const payload = deployment?.payload;

    // A. Mission Identity Card
    const card1H = 130;
    const c1Bg = new Graphics();
    c1Bg.roundRect(0, curY, colW, card1H, UI_RADIUS.SM);
    c1Bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    c1Bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.telemetryContainer.addChild(c1Bg);

    const t1 = new Text({
      text: 'MISSION IDENTITY & CONTRACT OBJECTIVES',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    t1.position.set(14, curY + 10);
    this.telemetryContainer.addChild(t1);

    const mTitle = new Text({
      text: mission ? mission.name : 'No Mission Selected',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 15, fontWeight: 'bold', fill: 0xffffff }),
    });
    mTitle.position.set(14, curY + 30);
    this.telemetryContainer.addChild(mTitle);

    const mDetails = new Text({
      text: mission
        ? `CONTRACT: ${mission.id}   |   CLASSIFICATION: ${mission.category}   |   DIFFICULTY: ${mission.difficulty}\nPRIMARY GOAL: ${mission.mainObjectives[0]?.description ?? 'Execute flight mission'}`
        : 'Select an active mission in Mission Operations Centre.',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: 0x94a3b8, lineHeight: 18 }),
    });
    mDetails.position.set(14, curY + 56);
    this.telemetryContainer.addChild(mDetails);

    curY += card1H + 10;

    // B. Rocket Identity & Configuration Card
    const card2H = 130;
    const c2Bg = new Graphics();
    c2Bg.roundRect(0, curY, colW, card2H, UI_RADIUS.SM);
    c2Bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    c2Bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.telemetryContainer.addChild(c2Bg);

    const t2 = new Text({
      text: 'LAUNCH VEHICLE SPECIFICATIONS',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    t2.position.set(14, curY + 10);
    this.telemetryContainer.addChild(t2);

    const rName = new Text({
      text: project ? `${project.name} (${project.designVersion})` : 'No Rocket Assigned',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 15, fontWeight: 'bold', fill: 0xffffff }),
    });
    rName.position.set(14, curY + 30);
    this.telemetryContainer.addChild(rName);

    const rDetails = new Text({
      text: project
        ? `CLASS RATING: ${project.design.classRating}   |   STAGES: ${project.design.stages.length}   |   TOTAL MASS: ${Math.round(project.design.totalWetMassKg)} kg\nVACUUM DELTA-V: ${Math.round(project.design.totalVacuumDeltaV)} m/s   |   LEO CAPACITY: ${project.design.maxPayloadCapacityLeoKg} kg`
        : 'Assign a certified launch vehicle to this deployment.',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: 0x94a3b8, lineHeight: 18 }),
    });
    rDetails.position.set(14, curY + 56);
    this.telemetryContainer.addChild(rDetails);

    curY += card2H + 10;

    // C. Destination Telemetry Card
    const card3H = 130;
    const c3Bg = new Graphics();
    c3Bg.roundRect(0, curY, colW, card3H, UI_RADIUS.SM);
    c3Bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    c3Bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.telemetryContainer.addChild(c3Bg);

    const t3 = new Text({
      text: 'DESTINATION ORBITAL & SURFACE ENVIRONMENT',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    t3.position.set(14, curY + 10);
    this.telemetryContainer.addChild(t3);

    const dName = new Text({
      text: dest ? `${dest.name} (${dest.category})` : 'No Destination Target',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 15, fontWeight: 'bold', fill: 0xffffff }),
    });
    dName.position.set(14, curY + 30);
    this.telemetryContainer.addChild(dName);

    const dDetails = new Text({
      text: dest
        ? `ORBITAL DISTANCE: ${dest.physicalCharacteristics.semiMajorAxisAu ?? 1.0} AU   |   SURFACE GRAVITY: ${dest.physicalCharacteristics.surfaceGravityG ?? 1.0}g\nENVIRONMENT: ${dest.environment}   |   ATMOSPHERE: ${dest.atmosphericDetails && dest.atmosphericDetails.densityClassification !== 'VACUUM' ? 'Present' : 'None'}`
        : 'Destination parameters pending mission binding.',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: 0x94a3b8, lineHeight: 18 }),
    });
    dDetails.position.set(14, curY + 56);
    this.telemetryContainer.addChild(dDetails);

    curY += card3H + 10;

    // D. Payload Module Card
    const card4H = 130;
    const c4Bg = new Graphics();
    c4Bg.roundRect(0, curY, colW, card4H, UI_RADIUS.SM);
    c4Bg.fill({ color: 0x0b1a2e, alpha: 0.9 });
    c4Bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.telemetryContainer.addChild(c4Bg);

    const t4 = new Text({
      text: 'PAYLOAD & SATELLITE SYSTEM STATUS',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    t4.position.set(14, curY + 10);
    this.telemetryContainer.addChild(t4);

    const pTitle = new Text({
      text: payload ? `${payload.name} [${payload.status}]` : 'Payload Unassigned',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 15, fontWeight: 'bold', fill: 0xffffff }),
    });
    pTitle.position.set(14, curY + 30);
    this.telemetryContainer.addChild(pTitle);

    const pDetails = new Text({
      text: payload
        ? `CATEGORY: ${payload.category}   |   MIN MASS: ${payload.massKg} kg\nNOTES: ${payload.statusNotes}`
        : 'Payload integration pending.',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10.5, fill: 0x94a3b8, lineHeight: 18 }),
    });
    pDetails.position.set(14, curY + 56);
    this.telemetryContainer.addChild(pDetails);
  }

  // =========================================================================
  // 4. COUNTDOWN CLOCK
  // =========================================================================

  private renderCountdownClock(deployment?: DeploymentRecord): void {
    const clockW = 750;
    const clockH = 90;

    const bg = new Graphics();
    bg.roundRect(0, 0, clockW, clockH, 4);
    bg.fill({ color: 0x050d18 });
    bg.stroke({ color: this.countdownActive ? 0xef4444 : UI_COLORS.AMBER, width: 1.5 });
    this.countdownContainer.addChild(bg);

    const label = new Text({
      text: this.countdownActive ? 'COUNTDOWN IN PROGRESS' : 'COUNTDOWN SEQUENCER STATUS',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0x94a3b8 }),
    });
    label.position.set(16, 12);
    this.countdownContainer.addChild(label);

    const timeStr = this.countdownActive
      ? `T - 00:${this.countdownSeconds.toString().padStart(2, '0')}`
      : deployment?.status === DeploymentState.DEPLOYMENT_SCHEDULED
      ? 'T - 00:10 (SCHEDULED)'
      : 'T - HOLD (STANDBY)';

    const clockText = new Text({
      text: timeStr,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 32,
        fontWeight: 'bold',
        fill: this.countdownActive ? 0xef4444 : deployment?.isEligible ? 0x22c55e : 0xf59e0b,
        letterSpacing: 2,
      }),
    });
    clockText.position.set(16, 32);
    this.countdownContainer.addChild(clockText);

    // Abort button beside clock
    if (this.countdownActive) {
      const abortBtn = new UIButton({
        label: 'HOLD / ABORT',
        width: 140,
        height: 38,
        variant: 'DANGER',
        onClick: () => {
          this.stopCountdown();
          NotificationManager.getInstance().notify({
            title: 'COUNTDOWN HELD',
            message: 'Manual hold command issued by Range Safety Officer.',
            level: 'WARNING',
          });
          this.render();
        },
      });
      abortBtn.container.position.set(clockW - 160, 26);
      this.countdownContainer.addChild(abortBtn.container);
    }
  }

  // =========================================================================
  // 5. CONTROLS
  // =========================================================================

  private renderControlButtons(deployment?: DeploymentRecord): void {
    // 1. Dashboard Modal Button
    const dashBtn = new UIButton({
      label: '📋 LAUNCH OPERATIONS DASHBOARD',
      width: 280,
      height: 38,
      variant: 'SECONDARY',
      onClick: () => {
        this.hide();
        if (this.options.onOpenDashboard) {
          this.options.onOpenDashboard();
        }
      },
    });
    dashBtn.container.position.set(0, 8);
    this.controlsContainer.addChild(dashBtn.container);

    // 2. Start Countdown / Initiate Launch Button
    const isEligible = deployment?.isEligible ?? false;

    const startBtn = new UIButton({
      label: this.countdownActive ? 'COUNTING DOWN...' : 'START COUNTDOWN (T-10s)',
      width: 230,
      height: 38,
      variant: isEligible && !this.countdownActive ? 'PRIMARY' : 'SECONDARY',
      disabled: !isEligible || this.countdownActive,
      onClick: () => {
        if (!deployment) return;
        this.startCountdown(deployment);
      },
    });
    startBtn.container.position.set(this.width - 250, 8);
    this.controlsContainer.addChild(startBtn.container);
  }

  // =========================================================================
  // 6. COUNTDOWN SEQUENCER
  // =========================================================================

  private startCountdown(deployment: DeploymentRecord): void {
    this.stopCountdown();
    this.countdownActive = true;
    this.countdownSeconds = 10;
    this.deploymentManager.scheduleDeployment(deployment.deploymentId, 10);
    this.render();

    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.stopCountdown();
        this.executeLaunch(deployment);
      } else {
        this.renderCountdownClock(deployment);
      }
    }, 1000);
  }

  private stopCountdown(): void {
    this.countdownActive = false;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  private executeLaunch(deployment: DeploymentRecord): void {
    const success = this.deploymentManager.initiateDeployment(deployment.deploymentId);
    if (success) {
      this.deploymentManager.completeDeployment(deployment.deploymentId);
      NotificationManager.getInstance().notify({
        title: 'MAIN ENGINE IGNITION',
        message: 'Liftoff confirmed! Vehicle ascending into atmospheric corridor.',
        level: 'SUCCESS',
      });
      if (this.options.onLaunchCompleted) {
        this.options.onLaunchCompleted(deployment.deploymentId);
      }
      this.render();
    }
  }

  public destroy(): void {
    this.stopCountdown();
    this.container.destroy({ children: true });
  }
}
