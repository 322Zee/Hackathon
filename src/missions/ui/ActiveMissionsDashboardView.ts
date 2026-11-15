/**
 * INTERSTELLAR CONTINUUM - Active Mission Management Dashboard View
 * Operational command dashboard mounted in MOC Tab 3 (ACTIVE_MISSIONS).
 * Visualizes active mission instances, real-time objective tracking,
 * preparation checklists, facility routing, history logs, and lifecycle actions.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UIDialog } from '../../ui/components/UIDialog';
import { FacilityId } from '../../facilities/FacilityTypes';
import { MissionCatalogueRegistry } from '../MissionCatalogueRegistry';
import { MissionLifecycleManager } from '../MissionLifecycleManager';
import {
  MissionLifecycleState,
  MissionInstance,
  TrackedObjectiveState,
  MissionPreparationTask,
  PreparationTaskStatus,
} from '../MissionLifecycleTypes';
import { NotificationManager } from '../../ui/notifications/NotificationManager';

export enum ActiveMissionFilter {
  ALL_ACTIVE = 'ALL_ACTIVE',
  PREPARING = 'PREPARING',
  FLIGHT_READY = 'FLIGHT_READY',
  ARCHIVE = 'ARCHIVE',
}

export interface ActiveMissionsDashboardViewOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onNavigateToFacility?: (facilityId: FacilityId, instance: MissionInstance) => void;
  onBrowseCatalogue?: () => void;
}

export class ActiveMissionsDashboardView extends UIComponent {
  private viewWidth: number;
  private viewHeight: number;

  private lifecycleManager: MissionLifecycleManager;
  private catalogueRegistry: MissionCatalogueRegistry;

  private backgroundGfx: Graphics;
  private leftPanelContainer: Container;
  private rightPanelContainer: Container;
  private filterContainer: Container;
  private listContainer: Container;
  private dossierContainer: Container;

  private activeFilter: ActiveMissionFilter = ActiveMissionFilter.ALL_ACTIVE;
  private selectedInstanceId: string | null = null;

  private onNavigateToFacilityCb?: (facilityId: FacilityId, instance: MissionInstance) => void;
  private onBrowseCatalogueCb?: () => void;

  private cancelDialog?: UIDialog;

  constructor(options: ActiveMissionsDashboardViewOptions = {}) {
    super('ActiveMissionsDashboardView');

    this.viewWidth = options.width ?? 1860;
    this.viewHeight = options.height ?? 920;
    this.container.position.set(options.x ?? 30, options.y ?? 130);

    this.lifecycleManager = MissionLifecycleManager.getInstance();
    this.catalogueRegistry = MissionCatalogueRegistry.getInstance();

    this.onNavigateToFacilityCb = options.onNavigateToFacility;
    this.onBrowseCatalogueCb = options.onBrowseCatalogue;

    // 1. Background
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    // 2. Left Panel: Filters + Mission Instance Cards (Width: 540px)
    this.leftPanelContainer = new Container();
    this.leftPanelContainer.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.container.addChild(this.leftPanelContainer);

    this.filterContainer = new Container();
    this.leftPanelContainer.addChild(this.filterContainer);

    this.listContainer = new Container();
    this.listContainer.position.set(0, 50);
    this.leftPanelContainer.addChild(this.listContainer);

    // 3. Right Panel: Mission Dossier (Width: ~1280px)
    this.rightPanelContainer = new Container();
    this.rightPanelContainer.position.set(570, UI_SPACING.MD);
    this.container.addChild(this.rightPanelContainer);

    this.dossierContainer = new Container();
    this.rightPanelContainer.addChild(this.dossierContainer);

    this.renderFrame();
    this.renderFilters();
    this.refresh();
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();
    // Master background panel
    this.backgroundGfx.roundRect(0, 0, this.viewWidth, this.viewHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x030814, alpha: 0.96 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Panel vertical divider
    this.backgroundGfx.moveTo(555, 10);
    this.backgroundGfx.lineTo(555, this.viewHeight - 10);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
  }

  private renderFilters(): void {
    this.filterContainer.removeChildren();

    const filters = [
      { id: ActiveMissionFilter.ALL_ACTIVE, label: 'ACTIVE' },
      { id: ActiveMissionFilter.PREPARING, label: 'PREPARATION' },
      { id: ActiveMissionFilter.FLIGHT_READY, label: 'READY / FLIGHT' },
      { id: ActiveMissionFilter.ARCHIVE, label: 'ARCHIVE' },
    ];

    let currentX = 0;
    const btnWidth = 125;
    const btnHeight = 32;

    for (const f of filters) {
      const isSelected = this.activeFilter === f.id;
      const btn = new UIButton({
        label: f.label,
        width: btnWidth,
        height: btnHeight,
        variant: isSelected ? 'PRIMARY' : 'GHOST',
        onClick: () => {
          this.activeFilter = f.id;
          this.renderFilters();
          this.refresh();
        },
      });
      btn.container.position.set(currentX, 0);
      this.filterContainer.addChild(btn.container);
      currentX += btnWidth + 6;
    }
  }

  /**
   * Refreshes the instance list and dossier from the lifecycle manager.
   */
  public refresh(): void {
    this.renderInstanceList();
    this.renderDossier();
  }

  private getFilteredInstances(): MissionInstance[] {
    const allInstances = this.lifecycleManager.getAllInstances();

    switch (this.activeFilter) {
      case ActiveMissionFilter.PREPARING:
        return allInstances.filter(
          (i) =>
            i.status === MissionLifecycleState.ACCEPTED ||
            i.status === MissionLifecycleState.PREPARING ||
            i.status === MissionLifecycleState.READY_FOR_VALIDATION
        );
      case ActiveMissionFilter.FLIGHT_READY:
        return allInstances.filter(
          (i) =>
            i.status === MissionLifecycleState.READY ||
            i.status === MissionLifecycleState.ACTIVE ||
            i.status === MissionLifecycleState.PAUSED
        );
      case ActiveMissionFilter.ARCHIVE:
        return allInstances.filter(
          (i) =>
            i.status === MissionLifecycleState.COMPLETED ||
            i.status === MissionLifecycleState.FAILED ||
            i.status === MissionLifecycleState.CANCELLED
        );
      case ActiveMissionFilter.ALL_ACTIVE:
      default:
        return allInstances.filter(
          (i) =>
            i.status !== MissionLifecycleState.COMPLETED &&
            i.status !== MissionLifecycleState.CANCELLED
        );
    }
  }

  private renderInstanceList(): void {
    this.listContainer.removeChildren();
    const instances = this.getFilteredInstances();

    // Auto-select first if none selected or previous selection no longer in view
    if (instances.length > 0) {
      const exists = instances.some((i) => i.instanceId === this.selectedInstanceId);
      if (!exists) {
        const first = instances[0];
        if (first) {
          this.selectedInstanceId = first.instanceId;
        }
      }
    } else {
      this.selectedInstanceId = null;
    }

    if (instances.length === 0) {
      this.renderEmptyListState();
      return;
    }

    let cardY = 0;
    const cardWidth = 530;
    const cardHeight = 92;
    const gap = 8;

    for (const inst of instances) {
      const isSelected = inst.instanceId === this.selectedInstanceId;
      const card = this.createMissionInstanceCard(inst, cardWidth, cardHeight, isSelected);
      card.position.set(0, cardY);
      this.listContainer.addChild(card);
      cardY += cardHeight + gap;
    }
  }

  private renderEmptyListState(): void {
    const emptyBox = new Graphics();
    emptyBox.roundRect(0, 10, 530, 200, UI_RADIUS.MD);
    emptyBox.fill({ color: 0x050d1f, alpha: 0.8 });
    emptyBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.listContainer.addChild(emptyBox);

    const title = new Text({
      text: 'NO ACTIVE MISSIONS IN QUEUE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(20, 30);
    this.listContainer.addChild(title);

    const desc = new Text({
      text: 'Accept mission contracts from the Mission Catalogue to commence flight preparations and vehicle staging.',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: 480,
      }),
    });
    desc.position.set(20, 60);
    this.listContainer.addChild(desc);

    const browseBtn = new UIButton({
      label: 'BROWSE MISSION CATALOGUE',
      width: 250,
      height: 36,
      variant: 'PRIMARY',
      onClick: () => {
        if (this.onBrowseCatalogueCb) {
          this.onBrowseCatalogueCb();
        }
      },
    });
    browseBtn.container.position.set(20, 130);
    this.listContainer.addChild(browseBtn.container);
  }

  private createMissionInstanceCard(
    inst: MissionInstance,
    width: number,
    height: number,
    isSelected: boolean
  ): Container {
    const card = new Container();
    card.eventMode = 'static';
    card.cursor = 'pointer';

    const missionDef = this.catalogueRegistry.getMissionById(inst.missionId);
    const missionName = missionDef?.name ?? inst.missionId;
    const statusColor = this.getStatusColor(inst.status);

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, UI_RADIUS.SM);
    bg.fill({ color: isSelected ? 0x0f223d : 0x050e1e, alpha: 0.95 });
    bg.stroke({ color: isSelected ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE, width: isSelected ? 1.5 : 1 });

    // Status Accent indicator bar
    bg.roundRect(0, 0, 4, height, UI_RADIUS.SM);
    bg.fill({ color: statusColor });

    card.addChild(bg);

    // Title
    const titleText = new Text({
      text: missionName,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: isSelected ? 0xffffff : UI_COLORS.TEXT_PRIMARY,
      }),
    });
    titleText.position.set(16, 12);
    card.addChild(titleText);

    // Destination badge
    const destTag = new Text({
      text: `DEST: ${inst.destinationId}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    destTag.position.set(16, 36);
    card.addChild(destTag);

    // Status pill
    const statusPill = this.createStatusPill(inst.status, statusColor);
    statusPill.position.set(width - 140, 12);
    card.addChild(statusPill);

    // Progress readout
    const mandatoryCount = inst.objectives.filter((o) => o.isMandatory).length;
    const completedCount = inst.objectives.filter((o) => o.isMandatory && o.isCompleted).length;
    const progressText = new Text({
      text: `Objectives: ${completedCount}/${mandatoryCount} Mandatory Completed`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    progressText.position.set(16, 62);
    card.addChild(progressText);

    card.on('pointerdown', () => {
      this.selectedInstanceId = inst.instanceId;
      this.refresh();
    });

    return card;
  }

  private createStatusPill(status: MissionLifecycleState, color: number): Container {
    const pill = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, 120, 20, UI_RADIUS.SM);
    bg.fill({ color, alpha: 0.18 });
    bg.stroke({ color, width: 1 });
    pill.addChild(bg);

    const txt = new Text({
      text: status.replace(/_/g, ' '),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: color,
      }),
    });
    txt.position.set(8, 3);
    pill.addChild(txt);

    return pill;
  }

  private renderDossier(): void {
    this.dossierContainer.removeChildren();

    if (!this.selectedInstanceId) {
      this.renderEmptyDossierState();
      return;
    }

    const instance = this.lifecycleManager.getInstance(this.selectedInstanceId);
    if (!instance) {
      this.renderEmptyDossierState();
      return;
    }

    const missionDef = this.catalogueRegistry.getMissionById(instance.missionId);

    // Top Header: 70px
    const header = this.createDossierHeader(instance, missionDef);
    header.position.set(0, 0);
    this.dossierContainer.addChild(header);

    // Section 1: Objectives Tracking (Y: 85)
    const objSection = this.createObjectivesSection(instance);
    objSection.position.set(0, 85);
    this.dossierContainer.addChild(objSection);

    // Section 2: Preparation Checklist (Y: 340)
    const prepSection = this.createPreparationSection(instance);
    prepSection.position.set(0, 340);
    this.dossierContainer.addChild(prepSection);

    // Section 3: History & Telemetry Timeline (Y: 630)
    const histSection = this.createHistorySection(instance);
    histSection.position.set(0, 630);
    this.dossierContainer.addChild(histSection);

    // Footer Controls Bar (Y: 825)
    const footerBar = this.createActionFooter(instance);
    footerBar.position.set(0, 825);
    this.dossierContainer.addChild(footerBar);
  }

  private renderEmptyDossierState(): void {
    const emptyBox = new Graphics();
    emptyBox.roundRect(0, 0, 1260, 880, UI_RADIUS.MD);
    emptyBox.fill({ color: 0x050e1e, alpha: 0.5 });
    emptyBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.dossierContainer.addChild(emptyBox);

    const txt = new Text({
      text: 'SELECT AN ACTIVE MISSION FROM THE LIST TO MONITOR TELEMETRY',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 2,
      }),
    });
    txt.position.set(380, 430);
    this.dossierContainer.addChild(txt);
  }

  private createDossierHeader(instance: MissionInstance, mission?: any): Container {
    const header = new Container();
    const width = 1260;
    const height = 75;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, UI_RADIUS.SM);
    bg.fill({ color: 0x050d1e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    header.addChild(bg);

    const name = new Text({
      text: mission?.name ?? instance.missionId,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    name.position.set(18, 12);
    header.addChild(name);

    const meta = new Text({
      text: `CODE: ${mission?.shortCode ?? instance.missionId} | DESTINATION: ${instance.destinationId} | INSTANCE: ${instance.instanceId}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.CYAN,
      }),
    });
    meta.position.set(18, 42);
    header.addChild(meta);

    // Lifecycle status pill
    const statusColor = this.getStatusColor(instance.status);
    const pill = this.createStatusPill(instance.status, statusColor);
    pill.position.set(width - 160, 16);
    header.addChild(pill);

    return header;
  }

  private createObjectivesSection(instance: MissionInstance): Container {
    const sec = new Container();
    const width = 1260;
    const height = 240;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, UI_RADIUS.SM);
    bg.fill({ color: 0x040a18, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    sec.addChild(bg);

    const title = new Text({
      text: 'MISSION OBJECTIVES & TELEMETRY PROGRESS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(16, 12);
    sec.addChild(title);

    let rowY = 40;
    for (const obj of instance.objectives.slice(0, 4)) {
      const row = this.createObjectiveRow(obj, width - 32);
      row.position.set(16, rowY);
      sec.addChild(row);
      rowY += 46;
    }

    return sec;
  }

  private createObjectiveRow(obj: TrackedObjectiveState, width: number): Container {
    const row = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, width, 40, UI_RADIUS.SM);
    bg.fill({ color: obj.isCompleted ? 0x0a2419 : 0x050e1f, alpha: 0.9 });
    bg.stroke({
      color: obj.isCompleted ? UI_COLORS.GREEN : UI_COLORS.BORDER_SUBTLE,
      width: 1,
    });
    row.addChild(bg);

    const icon = new Text({
      text: obj.isCompleted ? '[COMPLETED]' : '[IN PROGRESS]',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: obj.isCompleted ? UI_COLORS.GREEN : UI_COLORS.AMBER,
      }),
    });
    icon.position.set(12, 12);
    row.addChild(icon);

    const title = new Text({
      text: obj.title,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    title.position.set(120, 12);
    row.addChild(title);

    const catBadge = new Text({
      text: `CATEGORY: ${obj.category.replace(/_/g, ' ')}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    catBadge.position.set(500, 13);
    row.addChild(catBadge);

    const progress = new Text({
      text: obj.conditionDescription,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.CYAN,
      }),
    });
    progress.position.set(width - 250, 13);
    row.addChild(progress);

    return row;
  }

  private createPreparationSection(instance: MissionInstance): Container {
    const sec = new Container();
    const width = 1260;
    const height = 275;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, UI_RADIUS.SM);
    bg.fill({ color: 0x040a18, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    sec.addChild(bg);

    const title = new Text({
      text: 'MISSION PREPARATION & ENGINEERING CHECKLIST',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(16, 12);
    sec.addChild(title);

    let taskY = 40;
    for (const task of instance.preparation.tasks.slice(0, 4)) {
      const taskRow = this.createPreparationTaskRow(task, instance, width - 32);
      taskRow.position.set(16, taskY);
      sec.addChild(taskRow);
      taskY += 54;
    }

    return sec;
  }

  private createPreparationTaskRow(
    task: MissionPreparationTask,
    instance: MissionInstance,
    width: number
  ): Container {
    const row = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, width, 48, UI_RADIUS.SM);
    bg.fill({ color: 0x050e1e, alpha: 0.9 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    row.addChild(bg);

    const title = new Text({
      text: task.title,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    title.position.set(12, 8);
    row.addChild(title);

    const facility = new Text({
      text: `FACILITY: ${task.facilityName}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.CYAN,
      }),
    });
    facility.position.set(12, 28);
    row.addChild(facility);

    // Status / System Pending Note
    const statusColor = task.systemImplemented
      ? task.status === PreparationTaskStatus.CONFIGURED
        ? UI_COLORS.GREEN
        : UI_COLORS.AMBER
      : UI_COLORS.AMBER;

    const statusNote = task.systemImplemented
      ? task.status
      : 'FACILITY DEVELOPMENT PENDING (PROMPT 21)';

    const noteText = new Text({
      text: statusNote,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: statusColor,
      }),
    });
    noteText.position.set(500, 16);
    row.addChild(noteText);

    // Facility Navigation action button
    const actionBtn = new UIButton({
      label: 'OPEN FACILITY',
      width: 140,
      height: 30,
      variant: 'OUTLINE',
      onClick: () => {
        if (this.onNavigateToFacilityCb) {
          this.onNavigateToFacilityCb(task.facilityId, instance);
        } else {
          NotificationManager.getInstance().notify({
            title: task.facilityName,
            message: `Facility context preserved for mission "${instance.missionId}". Engineering toolchain in active development.`,
            level: 'INFO',
          });
        }
      },
    });
    actionBtn.container.position.set(width - 150, 9);
    row.addChild(actionBtn.container);

    return row;
  }

  private createHistorySection(instance: MissionInstance): Container {
    const sec = new Container();
    const width = 1260;
    const height = 180;

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, UI_RADIUS.SM);
    bg.fill({ color: 0x040a18, alpha: 0.85 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    sec.addChild(bg);

    const title = new Text({
      text: 'MISSION HISTORY & EVENT LOG',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    title.position.set(16, 12);
    sec.addChild(title);

    let histY = 38;
    const recentHistory = instance.history.slice(-4).reverse();

    for (const evt of recentHistory) {
      const timeStr = new Date(evt.timestamp).toLocaleTimeString();
      const line = new Text({
        text: `[${timeStr}] ${evt.type}: ${evt.summary}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      line.position.set(16, histY);
      sec.addChild(line);
      histY += 26;
    }

    return sec;
  }

  private createActionFooter(instance: MissionInstance): Container {
    const footer = new Container();
    const isReady = instance.status === MissionLifecycleState.READY;
    const isActive = instance.status === MissionLifecycleState.ACTIVE;
    const isPaused = instance.status === MissionLifecycleState.PAUSED;
    const isFailed = instance.status === MissionLifecycleState.FAILED;
    const isCompleted = instance.status === MissionLifecycleState.COMPLETED;
    const isCancelled = instance.status === MissionLifecycleState.CANCELLED;

    let currentX = 0;

    // 1. Validate Readiness Button
    if (!isCompleted && !isCancelled && !isActive && !isPaused) {
      const validateBtn = new UIButton({
        label: 'VALIDATE READINESS',
        width: 190,
        height: 38,
        variant: 'SECONDARY',
        onClick: () => {
          const res = this.lifecycleManager.transitionState(
            instance.instanceId,
            MissionLifecycleState.READY
          );
          if (!res.success) {
            NotificationManager.getInstance().notify({
              title: 'READINESS CHECK REJECTED',
              message: res.reason ?? 'Mission requirements not satisfied.',
              level: 'WARNING',
            });
          } else {
            NotificationManager.getInstance().notify({
              title: 'MISSION READY',
              message: 'All mission readiness checks passed. Authorized for launch!',
              level: 'SUCCESS',
            });
          }
          this.refresh();
        },
      });
      validateBtn.container.position.set(currentX, 0);
      footer.addChild(validateBtn.container);
      currentX += 205;
    }

    // 2. Launch / Flight Activation
    if (!isCompleted && !isCancelled) {
      const launchBtn = new UIButton({
        label: 'ACTIVATE FLIGHT',
        width: 170,
        height: 38,
        variant: isReady ? 'PRIMARY' : 'GHOST',
        disabled: !isReady,
        onClick: () => {
          if (isReady) {
            this.lifecycleManager.transitionState(
              instance.instanceId,
              MissionLifecycleState.ACTIVE
            );
            NotificationManager.getInstance().notify({
              title: 'FLIGHT ACTIVATED',
              message: 'Mission transitioned to ACTIVE. Telemetry tracking engaged.',
              level: 'SUCCESS',
            });
            this.refresh();
          }
        },
      });
      launchBtn.container.position.set(currentX, 0);
      footer.addChild(launchBtn.container);
      currentX += 185;
    }

    // 3. Pause / Resume Operations
    if (isActive || isPaused) {
      const pauseBtn = new UIButton({
        label: isActive ? 'PAUSE FLIGHT' : 'RESUME FLIGHT',
        width: 160,
        height: 38,
        variant: 'SECONDARY',
        onClick: () => {
          const nextState = isActive
            ? MissionLifecycleState.PAUSED
            : MissionLifecycleState.ACTIVE;
          this.lifecycleManager.transitionState(instance.instanceId, nextState);
          this.refresh();
        },
      });
      pauseBtn.container.position.set(currentX, 0);
      footer.addChild(pauseBtn.container);
      currentX += 175;
    }

    // 4. Retry Mission (if Failed)
    if (isFailed) {
      const retryBtn = new UIButton({
        label: 'RETRY MISSION',
        width: 160,
        height: 38,
        variant: 'PRIMARY',
        onClick: () => {
          this.lifecycleManager.retryMission(instance.instanceId);
          NotificationManager.getInstance().notify({
            title: 'MISSION RESTARTED',
            message: 'Mission reset for preparation reconfiguration. Progression preserved.',
            level: 'INFO',
          });
          this.refresh();
        },
      });
      retryBtn.container.position.set(currentX, 0);
      footer.addChild(retryBtn.container);
      currentX += 175;
    }

    // 5. Cancel Mission (with Confirmation Dialog)
    if (!isCompleted && !isCancelled) {
      const cancelBtn = new UIButton({
        label: 'CANCEL MISSION',
        width: 160,
        height: 38,
        variant: 'DANGER',
        onClick: () => {
          this.promptCancelMission(instance);
        },
      });
      cancelBtn.container.position.set(1260 - 160, 0);
      footer.addChild(cancelBtn.container);
    }

    return footer;
  }

  private promptCancelMission(instance: MissionInstance): void {
    if (this.cancelDialog) {
      this.cancelDialog.destroy();
      this.cancelDialog = undefined;
    }

    this.cancelDialog = new UIDialog({
      title: 'CONFIRM MISSION CANCELLATION',
      message: `Are you sure you want to cancel "${instance.missionId}"?\n\nConsequences:\n- Mission contract will be terminated.\n- Preparation staging will be decommissioned.\n- Cancellation will be permanently logged in the Mission Archive.`,
      confirmLabel: 'CONFIRM CANCELLATION',
      cancelLabel: 'ABORT',
      isDanger: true,
      onConfirm: () => {
        this.lifecycleManager.cancelMission(
          instance.instanceId,
          'Cancelled by Mission Director authorization.'
        );
        NotificationManager.getInstance().notify({
          title: 'MISSION CANCELLED',
          message: 'Contract decommissioned and recorded in archive.',
          level: 'WARNING',
        });
        this.cancelDialog = undefined;
        this.refresh();
      },
      onCancel: () => {
        this.cancelDialog = undefined;
      },
    });

    this.container.addChild(this.cancelDialog.container);
  }

  private getStatusColor(status: MissionLifecycleState): number {
    switch (status) {
      case MissionLifecycleState.ACCEPTED:
        return UI_COLORS.CYAN;
      case MissionLifecycleState.PREPARING:
        return UI_COLORS.AMBER;
      case MissionLifecycleState.READY_FOR_VALIDATION:
        return UI_COLORS.PURPLE;
      case MissionLifecycleState.READY:
        return UI_COLORS.GREEN;
      case MissionLifecycleState.ACTIVE:
        return UI_COLORS.BLUE;
      case MissionLifecycleState.PAUSED:
        return UI_COLORS.AMBER;
      case MissionLifecycleState.COMPLETED:
        return UI_COLORS.GREEN;
      case MissionLifecycleState.FAILED:
        return UI_COLORS.RED;
      case MissionLifecycleState.CANCELLED:
      default:
        return UI_COLORS.TEXT_MUTED;
    }
  }

  public getSelectedInstanceId(): string | null {
    return this.selectedInstanceId;
  }

  public setSelectedInstanceId(id: string): void {
    this.selectedInstanceId = id;
    this.refresh();
  }

  public override destroy(): void {
    if (this.cancelDialog) {
      this.cancelDialog.destroy();
      this.cancelDialog = undefined;
    }
    super.destroy();
  }
}
