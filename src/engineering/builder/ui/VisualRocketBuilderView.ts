/**
 * INTERSTELLAR CONTINUUM - Visual Rocket Builder View
 * Comprehensive 8-panel engineering assembly interface integrating:
 * 1. 2D Blueprint Design Canvas (pan/zoom, vehicle stack, hotspot annotations)
 * 2. 8-Category Component Filter Tabs
 * 3. Component Selection Catalogue with inventory & procurement
 * 4. Staging Architecture & Configuration Slot Tree
 * 5. Real-Time Design Statistics Panel (mass, thrust, reliability, power, cost)
 * 6. Multi-Stage Overview (Booster Core, Upper Inserter, Add/Remove Stages)
 * 7. Component Details & Educational Inspector
 * 8. Save, Versioning, Duplication, and Validation Controls
 * Plus: Real-time Mission Requirements Overlay when mission context is active.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../../ui/core/UIDesignTokens';
import { UIButton } from '../../../ui/components/UIButton';
import { NotificationManager } from '../../../ui/notifications/NotificationManager';
import {
  RocketComponentCategory,
  ComponentAvailabilityState,
} from '../../RocketComponentTypes';
import { RocketProject } from '../../RocketProjectTypes';
import { MissionDefinition } from '../../../missions/MissionTypes';
import { RocketComponentRegistry } from '../../RocketComponentRegistry';
import { ComponentInventoryService } from '../../ComponentInventoryService';
import { RocketProjectManager } from '../../RocketProjectManager';
import {
  ModularStageGroup,
  RocketBuilderStats,
  MissionRequirementStatus,
} from '../RocketBuilderTypes';
import { RocketBuilderEngine } from '../RocketBuilderEngine';
import { RocketDesignCanvas } from './RocketDesignCanvas';

export interface VisualRocketBuilderViewOptions {
  width?: number;
  height?: number;
  project: RocketProject;
  missionContext?: MissionDefinition;
  onReturnToDashboard: () => void;
  onProjectUpdated?: (project: RocketProject) => void;
}

export class VisualRocketBuilderView {
  public readonly container: Container;

  private builderEngine: RocketBuilderEngine;
  private registry: RocketComponentRegistry;
  private inventoryService: ComponentInventoryService;
  private projectManager: RocketProjectManager;

  private activeProject: RocketProject;
  private missionContext?: MissionDefinition;
  private onReturnToDashboardCb: () => void;
  private onProjectUpdatedCb?: (project: RocketProject) => void;

  private selectedSlotId?: string;
  private selectedComponentId?: string;
  private activeCategoryFilter?: RocketComponentCategory;

  // Subcontainers
  private topBarContainer: Container;
  private leftPanelContainer: Container;
  private canvasContainer: Container;
  private rightPanelContainer: Container;

  private designCanvas: RocketDesignCanvas;

  private width: number;
  private height: number;

  constructor(options: VisualRocketBuilderViewOptions) {
    this.width = options.width ?? 1860;
    this.height = options.height ?? 880;
    this.activeProject = options.project;
    this.missionContext = options.missionContext;
    this.onReturnToDashboardCb = options.onReturnToDashboard;
    this.onProjectUpdatedCb = options.onProjectUpdated;

    this.builderEngine = RocketBuilderEngine.getInstance();
    this.registry = RocketComponentRegistry.getInstance();
    this.inventoryService = ComponentInventoryService.getInstance();
    this.projectManager = RocketProjectManager.getInstance();

    // Ensure engine has loaded the current project
    this.builderEngine.loadProject(this.activeProject);

    this.container = new Container();

    this.topBarContainer = new Container();
    this.leftPanelContainer = new Container();
    this.canvasContainer = new Container();
    this.rightPanelContainer = new Container();

    this.container.addChild(this.topBarContainer);
    this.container.addChild(this.leftPanelContainer);
    this.container.addChild(this.canvasContainer);
    this.container.addChild(this.rightPanelContainer);

    // Initialize 2D Blueprint Canvas
    const canvasWidth = 880;
    const canvasHeight = this.height - 54;
    this.canvasContainer.position.set(360, 54);

    this.designCanvas = new RocketDesignCanvas({
      width: canvasWidth,
      height: canvasHeight,
      onSlotSelected: (slotId) => {
        this.selectSlot(slotId);
      },
    });
    this.canvasContainer.addChild(this.designCanvas.container);

    // Select first slot by default if available
    const config = this.builderEngine.getConfiguration();
    if (config.stages && config.stages.length > 0) {
      const stage0 = config.stages[0];
      if (stage0 && stage0.slots && stage0.slots.length > 0) {
        const slot0 = stage0.slots[0];
        if (slot0) {
          this.selectedSlotId = slot0.slotId;
          this.selectedComponentId = slot0.installedComponentId;
        }
      }
    }

    this.render();
  }

  /**
   * Select a configuration slot on the vehicle
   */
  public selectSlot(slotId?: string): void {
    this.selectedSlotId = slotId;
    if (slotId) {
      const slot = this.builderEngine.findSlot(slotId);
      if (slot) {
        this.selectedComponentId = slot.installedComponentId;
        if (slot.allowedCategories.length > 0) {
          this.activeCategoryFilter = slot.allowedCategories[0];
        }
      }
    }
    this.render();
  }

  /**
   * Complete render / refresh of the entire builder interface
   */
  public render(): void {
    const config = this.builderEngine.getConfiguration();
    this.designCanvas.setConfiguration(config, this.selectedSlotId);

    this.renderTopBar();
    this.renderLeftPanel();
    this.renderRightPanel();
  }

  // =========================================================================
  // 1. TOP ACTION & STATUS BAR (PANEL 8)
  // =========================================================================

  private renderTopBar(): void {
    this.topBarContainer.removeChildren();

    const config = this.builderEngine.getConfiguration();
    const hasUnsaved = this.builderEngine.hasUnsavedChanges();

    // Background bar
    const barGfx = new Graphics();
    barGfx.roundRect(0, 0, this.width, 46, 4);
    barGfx.fill({ color: 0x071326, alpha: 0.98 });
    barGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.topBarContainer.addChild(barGfx);

    // Project Name & Version
    const titleText = new Text({
      text: `${this.activeProject.name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    titleText.position.set(16, 12);
    this.topBarContainer.addChild(titleText);

    // Version Tag
    const versionX = 260;
    const versionBadge = new Graphics();
    versionBadge.roundRect(versionX, 10, 64, 24, 3);
    versionBadge.fill({ color: 0x1e3a5f });
    versionBadge.stroke({ color: UI_COLORS.CYAN, width: 1 });
    this.topBarContainer.addChild(versionBadge);

    const versionText = new Text({
      text: `v${config.version}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    versionText.position.set(versionX + 8, 14);
    this.topBarContainer.addChild(versionText);

    // Class Rating Badge
    const classX = 334;
    const classBadge = new Graphics();
    classBadge.roundRect(classX, 10, 140, 24, 3);
    classBadge.fill({ color: 0x0f2238 });
    classBadge.stroke({ color: UI_COLORS.AMBER, width: 1 });
    this.topBarContainer.addChild(classBadge);

    const classText = new Text({
      text: config.classRating.replace(/_/g, ' '),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    classText.position.set(classX + 8, 15);
    this.topBarContainer.addChild(classText);

    // Unsaved Changes status
    const statusText = new Text({
      text: hasUnsaved ? '● UNSAVED MODIFICATIONS' : '✓ SYNCHRONIZED',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: hasUnsaved ? UI_COLORS.AMBER : UI_COLORS.GREEN,
      }),
    });
    statusText.position.set(490, 15);
    this.topBarContainer.addChild(statusText);

    // Right Action Buttons
    let btnX = this.width - 16;

    // 1. Return to Dashboard
    const btnDashboard = new UIButton({
      label: '◀ DASHBOARD',
      width: 130,
      height: 32,
      variant: 'OUTLINE',
      onClick: () => {
        this.onReturnToDashboardCb();
      },
    });
    btnX -= 130;
    btnDashboard.container.position.set(btnX, 7);
    this.topBarContainer.addChild(btnDashboard.container);

    // 2. Discard Changes
    btnX -= 110;
    const btnDiscard = new UIButton({
      label: 'DISCARD',
      width: 100,
      height: 32,
      variant: 'GHOST',
      disabled: !hasUnsaved,
      onClick: () => {
        this.builderEngine.discardChanges();
        NotificationManager.getInstance().notify({
          title: 'CHANGES DISCARDED',
          message: 'All unsaved modifications have been reverted.',
          level: 'INFO',
        });
        this.render();
      },
    });
    btnDiscard.container.position.set(btnX, 7);
    this.topBarContainer.addChild(btnDiscard.container);

    // 3. Duplicate Design
    btnX -= 120;
    const btnDuplicate = new UIButton({
      label: 'DUPLICATE',
      width: 110,
      height: 32,
      variant: 'SECONDARY',
      onClick: () => {
        const cloned = this.builderEngine.duplicateConfiguration();
        NotificationManager.getInstance().notify({
          title: 'CONFIGURATION DUPLICATED',
          message: `Created cloned configuration "${cloned.name}".`,
          level: 'SUCCESS',
        });
        this.render();
      },
    });
    btnDuplicate.container.position.set(btnX, 7);
    this.topBarContainer.addChild(btnDuplicate.container);

    // 4. Save As New Version
    btnX -= 160;
    const btnSaveNewVer = new UIButton({
      label: 'SAVE NEW VERSION',
      width: 150,
      height: 32,
      variant: 'SECONDARY',
      onClick: () => {
        const ok = this.builderEngine.saveToProject(this.activeProject.projectId, true);
        if (ok) {
          const updated = this.projectManager.getProject(this.activeProject.projectId);
          if (updated) {
            this.activeProject = updated;
            if (this.onProjectUpdatedCb) this.onProjectUpdatedCb(updated);
          }
          NotificationManager.getInstance().notify({
            title: 'NEW VERSION SAVED',
            message: `Design saved as version ${this.builderEngine.getConfiguration().version}.`,
            level: 'SUCCESS',
          });
        }
        this.render();
      },
    });
    btnSaveNewVer.container.position.set(btnX, 7);
    this.topBarContainer.addChild(btnSaveNewVer.container);

    // 5. Save Design
    btnX -= 130;
    const btnSave = new UIButton({
      label: 'SAVE DESIGN',
      width: 120,
      height: 32,
      variant: 'PRIMARY',
      onClick: () => {
        const ok = this.builderEngine.saveToProject(this.activeProject.projectId, false);
        if (ok) {
          const updated = this.projectManager.getProject(this.activeProject.projectId);
          if (updated) {
            this.activeProject = updated;
            if (this.onProjectUpdatedCb) this.onProjectUpdatedCb(updated);
          }
          NotificationManager.getInstance().notify({
            title: 'DESIGN SAVED',
            message: `Vehicle configuration saved to project "${this.activeProject.name}".`,
            level: 'SUCCESS',
          });
        }
        this.render();
      },
    });
    btnSave.container.position.set(btnX, 7);
    this.topBarContainer.addChild(btnSave.container);
  }

  // =========================================================================
  // 2. LEFT PANEL: STAGE OVERVIEW & CONFIGURATION SLOTS (PANELS 4 & 6)
  // =========================================================================

  private renderLeftPanel(): void {
    this.leftPanelContainer.removeChildren();
    this.leftPanelContainer.position.set(0, 54);

    const panelWidth = 350;
    const panelHeight = this.height - 54;

    // Background card
    const bgGfx = new Graphics();
    bgGfx.roundRect(0, 0, panelWidth, panelHeight, 4);
    bgGfx.fill({ color: 0x060e1b, alpha: 0.98 });
    bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.leftPanelContainer.addChild(bgGfx);

    // Header
    const headerText = new Text({
      text: 'STAGE ARCHITECTURE & SLOTS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    headerText.position.set(16, 14);
    this.leftPanelContainer.addChild(headerText);

    // Stage Management Buttons (Add / Remove Stage)
    const config = this.builderEngine.getConfiguration();

    const btnAddStage = new UIButton({
      label: '+ ADD STAGE',
      width: 152,
      height: 28,
      variant: 'SECONDARY',
      disabled: config.stages.length >= 3,
      onClick: () => {
        const res = this.builderEngine.addStageGroup();
        if (res.success) {
          NotificationManager.getInstance().notify({
            title: 'STAGE ADDED',
            message: `Stage ${res.stageNumber} auxiliary stage added to architecture.`,
            level: 'SUCCESS',
          });
          this.render();
        } else {
          NotificationManager.getInstance().notify({
            title: 'CANNOT ADD STAGE',
            message: res.reason ?? 'Stage limit reached.',
            level: 'WARNING',
          });
        }
      },
    });
    btnAddStage.container.position.set(16, 42);
    this.leftPanelContainer.addChild(btnAddStage.container);

    const btnRemoveStage = new UIButton({
      label: '- REMOVE TOP',
      width: 152,
      height: 28,
      variant: 'OUTLINE',
      disabled: config.stages.length <= 1,
      onClick: () => {
        const topStage = config.stages[config.stages.length - 1];
        if (topStage) {
          const res = this.builderEngine.removeStageGroup(topStage.stageNumber);
          if (res.success) {
            NotificationManager.getInstance().notify({
              title: 'STAGE REMOVED',
              message: `Stage ${topStage.stageNumber} removed. Uninstalled components returned to inventory.`,
              level: 'INFO',
            });
            this.selectedSlotId = undefined;
            this.render();
          }
        }
      },
    });
    btnRemoveStage.container.position.set(182, 42);
    this.leftPanelContainer.addChild(btnRemoveStage.container);

    // List of Stages and their Slots
    let curY = 82;

    // Render stages in reverse order (Top Stage / Upper Stage first, Booster at bottom)
    const reversedStages = [...config.stages].reverse();

    for (const stage of reversedStages) {
      curY = this.renderStageGroupCard(stage, curY, panelWidth);
    }
  }

  private renderStageGroupCard(stage: ModularStageGroup, startY: number, panelWidth: number): number {
    let curY = startY;

    // Stage Header Banner
    const stageHeaderGfx = new Graphics();
    stageHeaderGfx.roundRect(14, curY, panelWidth - 28, 28, 3);
    stageHeaderGfx.fill({ color: 0x0c223d });
    stageHeaderGfx.stroke({ color: stage.isUpperStage ? UI_COLORS.CYAN : UI_COLORS.AMBER, width: 1 });
    this.leftPanelContainer.addChild(stageHeaderGfx);

    const stageTitle = new Text({
      text: `${stage.name.toUpperCase()} (STAGE ${stage.stageNumber})`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: stage.isUpperStage ? UI_COLORS.CYAN : UI_COLORS.AMBER,
      }),
    });
    stageTitle.position.set(24, curY + 6);
    this.leftPanelContainer.addChild(stageTitle);

    curY += 34;

    // Slots under this stage
    for (const slot of stage.slots) {
      const isSelected = this.selectedSlotId === slot.slotId;
      const comp = slot.installedComponentId ? this.registry.getComponent(slot.installedComponentId) : undefined;

      const slotGfx = new Graphics();
      slotGfx.roundRect(14, curY, panelWidth - 28, 38, 3);
      slotGfx.fill({
        color: isSelected ? 0x143457 : (comp ? 0x091a30 : 0x081324),
        alpha: 0.95,
      });
      slotGfx.stroke({
        color: isSelected ? UI_COLORS.CYAN : (comp ? 0x1d4ed8 : (slot.required ? 0xb45309 : UI_COLORS.BORDER_SUBTLE)),
        width: isSelected ? 1.5 : 1,
      });
      slotGfx.interactive = true;
      (slotGfx as any).cursor = 'pointer';
      slotGfx.on('pointerdown', () => {
        this.selectSlot(slot.slotId);
      });
      this.leftPanelContainer.addChild(slotGfx);

      // Slot Type Tag
      const slotTypeLabel = this.getSlotTypeShortCode(slot.slotType);
      const tagGfx = new Graphics();
      tagGfx.roundRect(20, curY + 9, 44, 20, 2);
      tagGfx.fill({ color: 0x0f294a });
      tagGfx.stroke({ color: UI_COLORS.TEXT_SECONDARY, width: 0.8 });
      this.leftPanelContainer.addChild(tagGfx);

      const tagText = new Text({
        text: slotTypeLabel,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      tagText.position.set(24, curY + 12);
      this.leftPanelContainer.addChild(tagText);

      // Slot Label
      const labelText = new Text({
        text: slot.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      labelText.position.set(70, curY + 5);
      this.leftPanelContainer.addChild(labelText);

      // Installed component name or status
      let statusStr = '';
      let statusColor: number = UI_COLORS.TEXT_SECONDARY;

      if (comp) {
        statusStr = `● ${comp.name}`;
        statusColor = UI_COLORS.GREEN;
      } else if (slot.required) {
        statusStr = '▲ REQUIRED (EMPTY)';
        statusColor = UI_COLORS.AMBER;
      } else {
        statusStr = '○ OPTIONAL (EMPTY)';
        statusColor = UI_COLORS.TEXT_SECONDARY;
      }

      const statusText = new Text({
        text: statusStr,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: statusColor,
        }),
      });
      statusText.position.set(70, curY + 20);
      this.leftPanelContainer.addChild(statusText);

      curY += 44;
    }

    curY += 8;
    return curY;
  }

  private getSlotTypeShortCode(slotType: string): string {
    switch (slotType) {
      case 'STRUCTURE': return 'STR';
      case 'PROPULSION': return 'PROP';
      case 'FUEL': return 'FUEL';
      case 'GUIDANCE': return 'GUID';
      case 'POWER': return 'POW';
      case 'PAYLOAD': return 'PAYL';
      case 'COMMUNICATION': return 'COMM';
      case 'RECOVERY_SAFETY': return 'SAFE';
      default: return 'SLOT';
    }
  }

  // =========================================================================
  // 3. RIGHT PANEL: STATS, MISSION OVERLAY, COMPONENT CATALOGUE, DETAILS
  // =========================================================================

  private renderRightPanel(): void {
    this.rightPanelContainer.removeChildren();
    this.rightPanelContainer.position.set(1250, 54);

    const panelWidth = 610;
    const panelHeight = this.height - 54;

    // Background card
    const bgGfx = new Graphics();
    bgGfx.roundRect(0, 0, panelWidth, panelHeight, 4);
    bgGfx.fill({ color: 0x060e1b, alpha: 0.98 });
    bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.rightPanelContainer.addChild(bgGfx);

    let curY = 12;

    // 1. DESIGN STATISTICS (PANEL 5)
    curY = this.renderDesignStats(panelWidth, curY);

    // 2. MISSION REQUIREMENTS OVERLAY (IF MISSION CONTEXT)
    if (this.missionContext) {
      curY = this.renderMissionRequirementsOverlay(panelWidth, curY);
    }

    // 3. COMPONENT CATEGORY & CATALOGUE (PANELS 2 & 3)
    curY = this.renderComponentCatalogue(panelWidth, curY);

    // 4. COMPONENT DETAILS INSPECTOR (PANEL 7)
    this.renderComponentInspector(panelWidth, curY, panelHeight - curY - 10);
  }

  private renderDesignStats(panelWidth: number, startY: number): number {
    const stats: RocketBuilderStats = this.builderEngine.calculateStats();

    const titleText = new Text({
      text: 'DESIGN PERFORMANCE & STAGING METRICS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    titleText.position.set(16, startY);
    this.rightPanelContainer.addChild(titleText);

    // Flight Readiness Banner
    const readyGfx = new Graphics();
    readyGfx.roundRect(panelWidth - 190, startY - 2, 174, 22, 3);
    readyGfx.fill({ color: stats.isFlightReady ? 0x064e3b : 0x451a03 });
    readyGfx.stroke({ color: stats.isFlightReady ? UI_COLORS.GREEN : UI_COLORS.AMBER, width: 1 });
    this.rightPanelContainer.addChild(readyGfx);

    const readyText = new Text({
      text: stats.isFlightReady ? '● FLIGHT READY' : '▲ DEFICIENT STAGING',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: stats.isFlightReady ? UI_COLORS.GREEN : UI_COLORS.AMBER,
      }),
    });
    readyText.position.set(panelWidth - 176, startY + 2);
    this.rightPanelContainer.addChild(readyText);

    let gridY = startY + 26;

    // Metrics Grid (2 columns x 4 rows)
    const metrics: Array<{ label: string; value: string; color?: number }> = [
      { label: 'TOTAL MASS', value: `${stats.totalMassUnits} MU` },
      { label: 'PAYLOAD CAP', value: `${stats.payloadCapacityRating} UNITS` },
      { label: 'THRUST / PERF', value: `${stats.performanceRating} PTS` },
      {
        label: 'RELIABILITY',
        value: `${stats.reliabilityRating.toFixed(1)}%`,
        color: stats.reliabilityRating >= 80 ? UI_COLORS.GREEN : UI_COLORS.AMBER,
      },
      {
        label: 'NET POWER',
        value: `${stats.netPowerWatts >= 0 ? '+' : ''}${stats.netPowerWatts} W`,
        color: stats.netPowerWatts >= 0 ? UI_COLORS.GREEN : UI_COLORS.RED,
      },
      { label: 'COMMS RATING', value: `${stats.communicationRating} PTS` },
      {
        label: 'COMPLETENESS',
        value: `${stats.completenessPercent.toFixed(0)}% (${stats.filledRequiredSlotCount}/${stats.requiredSlotCount})`,
        color: stats.completenessPercent === 100 ? UI_COLORS.GREEN : UI_COLORS.CYAN,
      },
      { label: 'EST. COST', value: `₵${stats.estimatedCostCredits.toLocaleString()}` },
    ];

    const colWidth = (panelWidth - 44) / 2;
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      if (!metric) continue;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mX = 16 + col * (colWidth + 12);
      const mY = gridY + row * 34;

      const card = new Graphics();
      card.roundRect(mX, mY, colWidth, 30, 2);
      card.fill({ color: 0x08172b, alpha: 0.9 });
      card.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.rightPanelContainer.addChild(card);

      const mLabel = new Text({
        text: metric.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      mLabel.position.set(mX + 8, mY + 7);
      this.rightPanelContainer.addChild(mLabel);

      const mVal = new Text({
        text: metric.value,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: metric.color ?? UI_COLORS.TEXT_PRIMARY,
        }),
      });
      mVal.position.set(mX + colWidth - 110, mY + 6);
      this.rightPanelContainer.addChild(mVal);
    }

    gridY += 4 * 34 + 6;

    // Display top warning if any
    if (stats.warnings.length > 0) {
      const warnGfx = new Graphics();
      warnGfx.roundRect(16, gridY, panelWidth - 32, 22, 2);
      warnGfx.fill({ color: 0x3b1803 });
      warnGfx.stroke({ color: UI_COLORS.AMBER, width: 0.8 });
      this.rightPanelContainer.addChild(warnGfx);

      const warnText = new Text({
        text: `▲ ${stats.warnings[0]}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.AMBER,
        }),
      });
      warnText.position.set(24, gridY + 4);
      this.rightPanelContainer.addChild(warnText);

      gridY += 28;
    }

    return gridY;
  }

  private renderMissionRequirementsOverlay(panelWidth: number, startY: number): number {
    if (!this.missionContext) return startY;

    const overlayTitle = new Text({
      text: `MISSION COMPATIBILITY: ${this.missionContext.name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 1,
      }),
    });
    overlayTitle.position.set(16, startY);
    this.rightPanelContainer.addChild(overlayTitle);

    let curY = startY + 22;

    const reqStatuses: MissionRequirementStatus[] = this.builderEngine.evaluateMissionRequirements(this.missionContext);

    for (const req of reqStatuses) {
      const rowGfx = new Graphics();
      rowGfx.roundRect(16, curY, panelWidth - 32, 24, 2);
      rowGfx.fill({ color: req.satisfied ? 0x052e16 : 0x2e0808, alpha: 0.8 });
      rowGfx.stroke({ color: req.satisfied ? UI_COLORS.GREEN : UI_COLORS.RED, width: 0.8 });
      this.rightPanelContainer.addChild(rowGfx);

      const statusTag = req.satisfied ? '✓' : '✗';
      const statusColor = req.satisfied ? UI_COLORS.GREEN : UI_COLORS.RED;

      const labelText = new Text({
        text: `${statusTag} ${req.label}: Req ${req.requiredValue} | Curr ${req.currentValue}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: statusColor,
        }),
      });
      labelText.position.set(24, curY + 4);
      this.rightPanelContainer.addChild(labelText);

      curY += 28;
    }

    curY += 6;
    return curY;
  }

  // =========================================================================
  // 4. COMPONENT CATALOGUE & CATEGORY FILTER (PANELS 2 & 3)
  // =========================================================================

  private renderComponentCatalogue(panelWidth: number, startY: number): number {
    let curY = startY;

    const headerText = new Text({
      text: 'COMPONENT SELECTION & INVENTORY',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    headerText.position.set(16, curY);
    this.rightPanelContainer.addChild(headerText);

    curY += 22;

    const activeSlot = this.selectedSlotId ? this.builderEngine.findSlot(this.selectedSlotId) : undefined;

    // Slot context banner
    if (activeSlot) {
      const bannerGfx = new Graphics();
      bannerGfx.roundRect(16, curY, panelWidth - 32, 26, 2);
      bannerGfx.fill({ color: 0x0c2747 });
      bannerGfx.stroke({ color: UI_COLORS.CYAN, width: 0.8 });
      this.rightPanelContainer.addChild(bannerGfx);

      const bannerText = new Text({
        text: `Target Slot: ${activeSlot.label} (${activeSlot.slotType})`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      bannerText.position.set(24, curY + 5);
      this.rightPanelContainer.addChild(bannerText);

      curY += 32;
    } else {
      const promptText = new Text({
        text: 'Select a slot on the vehicle blueprint to view compatible components.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      promptText.position.set(16, curY);
      this.rightPanelContainer.addChild(promptText);

      curY += 24;
      return curY;
    }

    // Find compatible components for this slot
    let components = this.registry.getAllComponents();
    if (this.activeCategoryFilter) {
      components = components.filter(c => c.category === this.activeCategoryFilter);
    } else if (activeSlot.allowedCategories.length > 0) {
      components = components.filter(c => activeSlot.allowedCategories.includes(c.category));
    }
    if (activeSlot.allowedTags.length > 0) {
      components = components.filter(c =>
        c.compatibilityTags.some(t => activeSlot.allowedTags.includes(t))
      );
    }

    // Render component list (up to 4 items)
    const listLimit = Math.min(components.length, 4);

    for (let i = 0; i < listLimit; i++) {
      const comp = components[i];
      if (!comp) continue;
      const isInstalled = activeSlot.installedComponentId === comp.id;
      const isSelected = this.selectedComponentId === comp.id;
      const ownedQty = this.inventoryService.getOwnedQuantity(comp.id);
      const availQty = this.inventoryService.getAvailableQuantity(comp.id);
      const avail = this.registry.evaluateAvailability(comp.id);

      const compGfx = new Graphics();
      compGfx.roundRect(16, curY, panelWidth - 32, 46, 3);
      compGfx.fill({
        color: isInstalled ? 0x082b1c : (isSelected ? 0x112d4e : 0x081529),
        alpha: 0.95,
      });
      compGfx.stroke({
        color: isInstalled ? UI_COLORS.GREEN : (isSelected ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE),
        width: 1,
      });
      compGfx.interactive = true;
      (compGfx as any).cursor = 'pointer';
      compGfx.on('pointerdown', () => {
        this.selectedComponentId = comp.id;
        this.render();
      });
      this.rightPanelContainer.addChild(compGfx);

      // Component Name & Class
      const nameText = new Text({
        text: comp.name,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      nameText.position.set(24, curY + 6);
      this.rightPanelContainer.addChild(nameText);

      // Stats line
      const perfVal = comp.stats.performanceRating ?? comp.stats.capacityRating ?? 0;
      const statsLine = `Mass: ${comp.massUnits} MU | Perf: ${perfVal} | Rel: ${comp.stats.reliabilityRating}% | Cost: ₵${comp.costCredits.toLocaleString()}`;
      const statsText = new Text({
        text: statsLine,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      statsText.position.set(24, curY + 24);
      this.rightPanelContainer.addChild(statsText);

      // Inventory Owned & In Use
      const invStr = `Owned: ${ownedQty} (Avail: ${availQty})`;
      const invText = new Text({
        text: invStr,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: availQty > 0 ? UI_COLORS.GREEN : UI_COLORS.TEXT_SECONDARY,
        }),
      });
      invText.position.set(panelWidth - 260, curY + 6);
      this.rightPanelContainer.addChild(invText);

      // Action Button (INSTALL / UNINSTALL / BUY & INSTALL)
      if (isInstalled) {
        const btnUninstall = new UIButton({
          label: 'UNINSTALL',
          width: 90,
          height: 26,
          variant: 'OUTLINE',
          onClick: () => {
            const res = this.builderEngine.removeComponent(activeSlot.slotId);
            if (res.success) {
              NotificationManager.getInstance().notify({
                title: 'COMPONENT UNINSTALLED',
                message: `Uninstalled ${comp.name}. Released to inventory.`,
                level: 'INFO',
              });
              this.render();
            }
          },
        });
        btnUninstall.container.position.set(panelWidth - 116, curY + 10);
        this.rightPanelContainer.addChild(btnUninstall.container);
      } else if (availQty > 0) {
        const btnInstall = new UIButton({
          label: 'INSTALL',
          width: 90,
          height: 26,
          variant: 'PRIMARY',
          onClick: () => {
            const res = this.builderEngine.installComponent(activeSlot.slotId, comp.id);
            if (res.success) {
              NotificationManager.getInstance().notify({
                title: 'COMPONENT INSTALLED',
                message: `Installed ${comp.name} into ${activeSlot.label}.`,
                level: 'SUCCESS',
              });
              this.render();
            } else {
              NotificationManager.getInstance().notify({
                title: 'INSTALLATION FAILED',
                message: res.reason ?? 'Compatibility failure.',
                level: 'WARNING',
              });
            }
          },
        });
        btnInstall.container.position.set(panelWidth - 116, curY + 10);
        this.rightPanelContainer.addChild(btnInstall.container);
      } else {
        const canBuy = avail.canAfford && avail.state === ComponentAvailabilityState.AVAILABLE;
        const btnBuyInstall = new UIButton({
          label: 'BUY & INSTALL',
          width: 100,
          height: 26,
          variant: 'SECONDARY',
          disabled: !canBuy,
          onClick: () => {
            const buyRes = this.inventoryService.purchaseComponent(comp.id, 1);
            if (buyRes.success) {
              const instRes = this.builderEngine.installComponent(activeSlot.slotId, comp.id);
              if (instRes.success) {
                NotificationManager.getInstance().notify({
                  title: 'PURCHASED & INSTALLED',
                  message: `Purchased and mounted ${comp.name}.`,
                  level: 'SUCCESS',
                });
                this.render();
              }
            } else {
              NotificationManager.getInstance().notify({
                title: 'PURCHASE FAILED',
                message: buyRes.errorMessage ?? 'Insufficient credits.',
                level: 'WARNING',
              });
            }
          },
        });
        btnBuyInstall.container.position.set(panelWidth - 126, curY + 10);
        this.rightPanelContainer.addChild(btnBuyInstall.container);
      }

      curY += 52;
    }

    curY += 6;
    return curY;
  }

  // =========================================================================
  // 5. COMPONENT DETAILS & EDUCATIONAL INSPECTOR (PANEL 7)
  // =========================================================================

  private renderComponentInspector(panelWidth: number, startY: number, availableHeight: number): void {
    const titleText = new Text({
      text: 'COMPONENT DETAILS & EDUCATIONAL SPECIFICATIONS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    titleText.position.set(16, startY);
    this.rightPanelContainer.addChild(titleText);

    const comp = this.selectedComponentId ? this.registry.getComponent(this.selectedComponentId) : undefined;
    const cardY = startY + 22;
    const cardHeight = Math.max(availableHeight - 26, 120);

    const cardGfx = new Graphics();
    cardGfx.roundRect(16, cardY, panelWidth - 32, cardHeight, 3);
    cardGfx.fill({ color: 0x040b15, alpha: 0.95 });
    cardGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
    this.rightPanelContainer.addChild(cardGfx);

    if (!comp) {
      const emptyText = new Text({
        text: 'Select an installed slot or component to inspect its educational staging rationale and trade-offs.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      emptyText.position.set(26, cardY + 14);
      this.rightPanelContainer.addChild(emptyText);
      return;
    }

    // Name & Category
    const compNameText = new Text({
      text: `${comp.name.toUpperCase()}  [ ${comp.category.replace(/_/g, ' ')} ]`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    compNameText.position.set(26, cardY + 10);
    this.rightPanelContainer.addChild(compNameText);

    // Description
    const descText = new Text({
      text: comp.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: panelWidth - 60,
      }),
    });
    descText.position.set(26, cardY + 28);
    this.rightPanelContainer.addChild(descText);

    // Educational Staging Trade-Off Explanation
    const eduY = cardY + 70;
    const eduText = new Text({
      text: `🔬 STAGING TRADE-OFF: ${comp.educationalExplanation}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 8.5,
        fontStyle: 'italic',
        fill: UI_COLORS.AMBER,
        wordWrap: true,
        wordWrapWidth: panelWidth - 60,
      }),
    });
    eduText.position.set(26, eduY);
    this.rightPanelContainer.addChild(eduText);

    // Compatibility Tags List
    const tagsY = cardY + 112;
    const tagsText = new Text({
      text: `COMPATIBILITY TAGS: ${comp.compatibilityTags.join(', ')}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 8,
        fill: UI_COLORS.TEXT_SECONDARY,
      }),
    });
    tagsText.position.set(26, tagsY);
    this.rightPanelContainer.addChild(tagsText);
  }

  /**
   * Destroy and clean up resources
   */
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
