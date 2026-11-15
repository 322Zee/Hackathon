/**
 * INTERSTELLAR CONTINUUM - Interactive Rocket Testing Workbench Interface
 * 8-panel engineering test stand, design inspector, abstract performance assessment matrix,
 * rolling test history, and 10-point pre-launch deployment certification interface.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../../ui/core/UIDesignTokens';
import { UIButton } from '../../../ui/components/UIButton';
import { NotificationManager } from '../../../ui/notifications/NotificationManager';
import { RocketTestingManager } from '../RocketTestingManager';
import {
  TestingWorkbenchSubTab,
  ComponentInspectionDetail,
  RocketTestStatus,
  PreLaunchReadinessStatus,
  AssessmentCategory,
} from '../RocketTestingTypes';
import { RocketProject } from '../../RocketProjectTypes';
import { RocketBuilderEngine } from '../../builder/RocketBuilderEngine';

export interface RocketTestingWorkbenchViewProps {
  projectId: string;
  missionContext?: {
    missionId: string;
    instanceId?: string;
  };
  initialSubTab?: TestingWorkbenchSubTab;
  onNavigateToBuilder?: (slotId?: string) => void;
  onProceedToLaunchComplex?: () => void;
}

export class RocketTestingWorkbenchView {
  public readonly container: Container;
  private props: RocketTestingWorkbenchViewProps;
  private testingManager: RocketTestingManager;
  private builderEngine: RocketBuilderEngine;

  private activeSubTab: TestingWorkbenchSubTab;
  private selectedSlotId?: string;

  private headerContainer: Container;
  private bodyContainer: Container;

  constructor(props: RocketTestingWorkbenchViewProps) {
    this.props = props;
    this.testingManager = RocketTestingManager.getInstance();
    this.builderEngine = RocketBuilderEngine.getInstance();

    this.activeSubTab = props.initialSubTab ?? TestingWorkbenchSubTab.DESIGN_INSPECTION;
    this.container = new Container();

    this.headerContainer = new Container();
    this.bodyContainer = new Container();

    this.container.addChild(this.headerContainer);
    this.container.addChild(this.bodyContainer);

    this.render();
  }

  public setSubTab(subTab: TestingWorkbenchSubTab): void {
    this.activeSubTab = subTab;
    this.render();
  }

  public getActiveSubTab(): TestingWorkbenchSubTab {
    return this.activeSubTab;
  }

  public setSelectedSlot(slotId?: string): void {
    this.selectedSlotId = slotId;
    this.render();
  }

  public refresh(): void {
    this.render();
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }

  // =========================================================================
  // MAIN RENDER PIPELINE
  // =========================================================================

  private render(): void {
    this.headerContainer.removeChildren();
    this.bodyContainer.removeChildren();

    const inspection = this.testingManager.inspectDesign(this.props.projectId);
    const config = this.builderEngine.getConfiguration();
    const latestTest = this.testingManager.getLatestTestReport(this.props.projectId);
    const readiness = this.testingManager.evaluatePreLaunchReadiness(this.props.projectId);

    // Default slot selection to first slot if unset
    if (!this.selectedSlotId && inspection.componentInspections.length > 0) {
      this.selectedSlotId = inspection.componentInspections[0]?.slotId;
    }

    // 1. TOP HEADER & SUB-TAB BAR
    this.renderHeaderBar(config.name, config.version, readiness.status, inspection.isStale);

    // 2. ACTIVE SUB-TAB CONTENT
    switch (this.activeSubTab) {
      case TestingWorkbenchSubTab.DESIGN_INSPECTION:
        this.renderDesignInspection(inspection.componentInspections, inspection.project, inspection.isStale);
        break;

      case TestingWorkbenchSubTab.SYSTEM_COMPATIBILITY:
        this.renderAssessmentCategoryView(AssessmentCategory.COMPATIBILITY, latestTest);
        break;

      case TestingWorkbenchSubTab.PERFORMANCE_ASSESSMENT:
        this.renderAssessmentCategoryView(AssessmentCategory.PERFORMANCE, latestTest);
        break;

      case TestingWorkbenchSubTab.RELIABILITY_ASSESSMENT:
        this.renderAssessmentCategoryView(AssessmentCategory.RELIABILITY, latestTest);
        break;

      case TestingWorkbenchSubTab.MISSION_SUITABILITY:
        this.renderAssessmentCategoryView(AssessmentCategory.MISSION_SUITABILITY, latestTest);
        break;

      case TestingWorkbenchSubTab.TEST_HISTORY:
        this.renderTestHistory(config.version);
        break;

      case TestingWorkbenchSubTab.PRE_LAUNCH_READINESS:
        this.renderPreLaunchReadiness(readiness);
        break;
    }
  }

  // =========================================================================
  // HEADER BAR & SUB-TABS
  // =========================================================================

  private renderHeaderBar(
    name: string,
    version: string,
    readinessStatus: PreLaunchReadinessStatus,
    isStale: boolean
  ): void {
    const bg = new Graphics();
    bg.roundRect(0, 0, 1860, 56, 4);
    bg.fill({ color: 0x091424, alpha: 0.95 });
    bg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.headerContainer.addChild(bg);

    // Title & Version
    const titleText = new Text({
      text: `TESTING & CERTIFICATION // ${name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1,
      }),
    });
    titleText.position.set(20, 12);
    this.headerContainer.addChild(titleText);

    const versionText = new Text({
      text: `BUILD: ${version} ${isStale ? '(UNVALIDATED CHANGES)' : '(SYNCED)'}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: isStale ? UI_COLORS.AMBER : UI_COLORS.TEXT_MUTED,
      }),
    });
    versionText.position.set(20, 32);
    this.headerContainer.addChild(versionText);

    // Sub-Tabs
    const subTabs: { id: TestingWorkbenchSubTab; label: string }[] = [
      { id: TestingWorkbenchSubTab.DESIGN_INSPECTION, label: '1. INSPECT' },
      { id: TestingWorkbenchSubTab.SYSTEM_COMPATIBILITY, label: '2. COMPATIBILITY' },
      { id: TestingWorkbenchSubTab.PERFORMANCE_ASSESSMENT, label: '3. PERFORMANCE' },
      { id: TestingWorkbenchSubTab.RELIABILITY_ASSESSMENT, label: '4. RELIABILITY' },
      { id: TestingWorkbenchSubTab.MISSION_SUITABILITY, label: '5. MISSION FIT' },
      { id: TestingWorkbenchSubTab.TEST_HISTORY, label: '6. TEST LOGS' },
      { id: TestingWorkbenchSubTab.PRE_LAUNCH_READINESS, label: '7. PRE-LAUNCH' },
    ];

    const tabStartX = 480;
    const tabW = 115;
    subTabs.forEach((tab, idx) => {
      const tabX = tabStartX + idx * (tabW + 6);
      const isSelected = this.activeSubTab === tab.id;

      const tabGfx = new Graphics();
      tabGfx.roundRect(tabX, 10, tabW, 36, 4);
      tabGfx.fill({ color: isSelected ? 0x143457 : 0x0c1b30, alpha: 0.9 });
      tabGfx.stroke({ color: isSelected ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE, width: isSelected ? 1.5 : 1.0 });
      tabGfx.interactive = true;
      (tabGfx as any).cursor = 'pointer';
      tabGfx.on('pointerdown', () => this.setSubTab(tab.id));
      this.headerContainer.addChild(tabGfx);

      const tabLabel = new Text({
        text: tab.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: isSelected ? 'bold' : 'normal',
          fill: isSelected ? UI_COLORS.CYAN : UI_COLORS.TEXT_SECONDARY,
        }),
      });
      tabLabel.position.set(tabX + 10, 21);
      this.headerContainer.addChild(tabLabel);
    });

    // Action: Run Test
    const btnTest = new UIButton({
      label: '⟳ RUN TEST BENCH',
      variant: 'PRIMARY',
      width: 160,
      height: 36,
      onClick: () => this.handleRunTest(),
    });
    btnTest.container.position.set(1490, 10);
    this.headerContainer.addChild(btnTest.container);

    // Action: Builder Jump
    const btnBuilder = new UIButton({
      label: '📐 BUILDER',
      variant: 'OUTLINE',
      width: 110,
      height: 36,
      onClick: () => {
        if (this.props.onNavigateToBuilder) {
          this.props.onNavigateToBuilder(this.selectedSlotId);
        }
      },
    });
    btnBuilder.container.position.set(1660, 10);
    this.headerContainer.addChild(btnBuilder.container);

    // Readiness Status Pill on Far Right
    let pillColor: number = UI_COLORS.GREEN;
    let pillLabel = 'CLEARED';
    if (readinessStatus === PreLaunchReadinessStatus.READY_WITH_WARNINGS) {
      pillColor = UI_COLORS.AMBER;
      pillLabel = 'WARNINGS';
    } else if (readinessStatus !== PreLaunchReadinessStatus.READY_FOR_MISSION_DEPLOYMENT) {
      pillColor = UI_COLORS.RED;
      pillLabel = 'NOT READY';
    }

    const pillGfx = new Graphics();
    pillGfx.roundRect(1780, 14, 70, 26, 3);
    pillGfx.fill({ color: pillColor, alpha: 0.15 });
    pillGfx.stroke({ color: pillColor, width: 1.0 });
    this.headerContainer.addChild(pillGfx);

    const pillTxt = new Text({
      text: pillLabel,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: pillColor,
      }),
    });
    pillTxt.position.set(1788, 20);
    this.headerContainer.addChild(pillTxt);
  }

  // =========================================================================
  // SUB-TAB 1: DESIGN & COMPONENT INSPECTION
  // =========================================================================

  private renderDesignInspection(
    slots: ComponentInspectionDetail[],
    project: RocketProject,
    _isStale: boolean
  ): void {
    const yStart = 66;

    // LEFT CARD: Vehicle Configuration Hierarchy & Staging Diagram
    const leftW = 910;
    const cardH = 820;

    const leftCard = new Graphics();
    leftCard.roundRect(0, yStart, leftW, cardH, 4);
    leftCard.fill({ color: 0x08101e, alpha: 0.95 });
    leftCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.bodyContainer.addChild(leftCard);

    const leftTitle = new Text({
      text: 'CONFIGURATION STAGING BREAKDOWN // CLICK TO INSPECT COMPONENT',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    leftTitle.position.set(20, yStart + 16);
    this.bodyContainer.addChild(leftTitle);

    // Render Slots as interactive cards
    let rowY = yStart + 48;
    slots.forEach(slot => {
      const isSelected = this.selectedSlotId === slot.slotId;
      const rowGfx = new Graphics();
      rowGfx.roundRect(20, rowY, leftW - 40, 52, 4);
      rowGfx.fill({ color: isSelected ? 0x143457 : 0x0c1b30, alpha: 0.9 });
      rowGfx.stroke({
        color: isSelected
          ? UI_COLORS.CYAN
          : slot.status === 'VALIDATION_FAILED'
          ? UI_COLORS.RED
          : slot.status === 'UNAVAILABLE'
          ? UI_COLORS.AMBER
          : UI_COLORS.BORDER_SUBTLE,
        width: isSelected ? 1.5 : 1.0,
      });
      rowGfx.interactive = true;
      (rowGfx as any).cursor = 'pointer';
      rowGfx.on('pointerdown', () => this.setSelectedSlot(slot.slotId));
      this.bodyContainer.addChild(rowGfx);

      // Stage & Type badge
      const stageText = new Text({
        text: `STG ${slot.stageNumber} // ${slot.slotType}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      stageText.position.set(35, rowY + 8);
      this.bodyContainer.addChild(stageText);

      // Component Name
      const nameText = new Text({
        text: slot.componentName,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: isSelected ? UI_COLORS.CYAN : UI_COLORS.TEXT_PRIMARY,
        }),
      });
      nameText.position.set(35, rowY + 26);
      this.bodyContainer.addChild(nameText);

      // Status Badge
      let statusColor: number = UI_COLORS.GREEN;
      if (slot.status === 'VALIDATION_FAILED') statusColor = UI_COLORS.RED;
      else if (slot.status === 'UNAVAILABLE' || slot.status === 'MISSING') statusColor = UI_COLORS.AMBER;

      const badgeGfx = new Graphics();
      badgeGfx.roundRect(leftW - 170, rowY + 14, 130, 24, 3);
      badgeGfx.fill({ color: statusColor, alpha: 0.15 });
      badgeGfx.stroke({ color: statusColor, width: 1.0 });
      this.bodyContainer.addChild(badgeGfx);

      const badgeText = new Text({
        text: slot.status,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: statusColor,
        }),
      });
      badgeText.position.set(leftW - 160, rowY + 19);
      this.bodyContainer.addChild(badgeText);

      rowY += 58;
    });

    // RIGHT SIDE: Detailed Component Inspector (Top) & Vehicle Metrics Summary (Bottom)
    const rightX = leftW + 20;
    const rightW = 1860 - rightX;

    // TOP RIGHT: Component Detail Inspector
    const inspectorH = 430;
    const insCard = new Graphics();
    insCard.roundRect(rightX, yStart, rightW, inspectorH, 4);
    insCard.fill({ color: 0x08101e, alpha: 0.95 });
    insCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.bodyContainer.addChild(insCard);

    const selectedSlot = slots.find(s => s.slotId === this.selectedSlotId) ?? slots[0];

    const insTitle = new Text({
      text: `COMPONENT INSPECTION // ${selectedSlot?.slotLabel.toUpperCase() ?? 'NONE'}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    insTitle.position.set(rightX + 20, yStart + 16);
    this.bodyContainer.addChild(insTitle);

    if (selectedSlot) {
      const compName = new Text({
        text: selectedSlot.componentName,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 16,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      compName.position.set(rightX + 20, yStart + 44);
      this.bodyContainer.addChild(compName);

      // Specifications Grid
      const specs = [
        { label: 'SLOT TYPE', value: selectedSlot.slotType },
        { label: 'CATEGORY', value: selectedSlot.category ?? 'Unassigned' },
        { label: 'MASS UNITS', value: `${selectedSlot.massUnits} MU` },
        { label: 'RELIABILITY', value: `${selectedSlot.reliabilityRating}%` },
        { label: 'POWER BALANCE', value: `${selectedSlot.powerGenerationWatts ? `+${selectedSlot.powerGenerationWatts}W` : selectedSlot.powerDemandWatts ? `-${selectedSlot.powerDemandWatts}W` : '0 W'}` },
        { label: 'MANDATORY', value: selectedSlot.isRequired ? 'YES (Core Slot)' : 'NO (Auxiliary)' },
      ];

      const gridStartX = rightX + 20;
      const gridStartY = yStart + 80;
      const cellW = (rightW - 50) / 3;
      specs.forEach((spec, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cellX = gridStartX + col * (cellW + 5);
        const cellY = gridStartY + row * 46;

        const cell = new Graphics();
        cell.roundRect(cellX, cellY, cellW, 40, 3);
        cell.fill({ color: 0x0c1b30, alpha: 0.8 });
        cell.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
        this.bodyContainer.addChild(cell);

        const lbl = new Text({
          text: spec.label,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 8.5, fill: UI_COLORS.TEXT_MUTED }),
        });
        lbl.position.set(cellX + 8, cellY + 6);
        this.bodyContainer.addChild(lbl);

        const val = new Text({
          text: spec.value,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
        });
        val.position.set(cellX + 8, cellY + 20);
        this.bodyContainer.addChild(val);
      });

      // Role & Educational Description
      const descBox = new Graphics();
      descBox.roundRect(rightX + 20, yStart + 185, rightW - 40, 95, 3);
      descBox.fill({ color: 0x0c1b30, alpha: 0.8 });
      descBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.bodyContainer.addChild(descBox);

      const descTitle = new Text({
        text: 'AEROSPACE ROLE & EDUCATIONAL SUMMARY',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
      });
      descTitle.position.set(rightX + 30, yStart + 195);
      this.bodyContainer.addChild(descTitle);

      const descText = new Text({
        text: selectedSlot.roleExplanation,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: rightW - 60,
        }),
      });
      descText.position.set(rightX + 30, yStart + 215);
      this.bodyContainer.addChild(descText);

      // Issue callout if any
      if (selectedSlot.issueSummary) {
        const issBox = new Graphics();
        issBox.roundRect(rightX + 20, yStart + 290, rightW - 40, 48, 3);
        issBox.fill({ color: 0x2b0b0b, alpha: 0.9 });
        issBox.stroke({ color: UI_COLORS.RED, width: 1.0 });
        this.bodyContainer.addChild(issBox);

        const issTxt = new Text({
          text: `▲ IDENTIFIED DEFECT: ${selectedSlot.issueSummary}`,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.RED }),
        });
        issTxt.position.set(rightX + 32, yStart + 306);
        this.bodyContainer.addChild(issTxt);
      }

      // Quick Action: Fix in Builder
      const btnFix = new UIButton({
        label: '🔧 CONFIGURE IN BUILDER',
        variant: 'PRIMARY',
        width: 220,
        height: 36,
        onClick: () => {
          if (this.props.onNavigateToBuilder) {
            this.props.onNavigateToBuilder(selectedSlot.slotId);
          }
        },
      });
      btnFix.container.position.set(rightX + 20, yStart + 355);
      this.bodyContainer.addChild(btnFix.container);
    }

    // BOTTOM RIGHT: Vehicle Metrics Overview
    const metricsY = yStart + inspectorH + 16;
    const metricsH = cardH - inspectorH - 16;
    const mCard = new Graphics();
    mCard.roundRect(rightX, metricsY, rightW, metricsH, 4);
    mCard.fill({ color: 0x08101e, alpha: 0.95 });
    mCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.bodyContainer.addChild(mCard);

    const mTitle = new Text({
      text: 'VEHICLE SPECIFICATIONS & CERTIFICATION OVERVIEW',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    mTitle.position.set(rightX + 20, metricsY + 16);
    this.bodyContainer.addChild(mTitle);

    const valRep = project.comprehensiveValidation;
    const ratings = valRep?.ratings;

    const vMetrics = [
      { label: 'TOTAL MASS', value: `${ratings?.totalMassUnits ?? 0} MU` },
      { label: 'LIFT PERFORMANCE', value: `${ratings?.overallPerformanceRating ?? 0} Pts` },
      { label: 'PAYLOAD CAPACITY', value: `${ratings?.payloadCapacityRating ?? 0} Units` },
      { label: 'COMPOSITE RELIABILITY', value: `${(ratings?.reliabilityRating ?? 0).toFixed(1)}%` },
      { label: 'POWER BALANCE', value: `${(ratings?.netPowerWatts ?? 0) >= 0 ? '+' : ''}${ratings?.netPowerWatts ?? 0} W` },
      { label: 'COMPLETENESS', value: `${ratings?.completenessPercent ?? 0}%` },
      { label: 'ESTIMATED COST', value: `₵${(ratings?.estimatedCostCredits ?? 0).toLocaleString()}` },
      { label: 'VALIDATION STATUS', value: valRep ? valRep.status : 'NOT VALIDATED' },
    ];

    const vGridStartX = rightX + 20;
    const vGridStartY = metricsY + 48;
    const vCellW = (rightW - 60) / 4;
    vMetrics.forEach((m, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cellX = vGridStartX + col * (vCellW + 6);
      const cellY = vGridStartY + row * 54;

      const cell = new Graphics();
      cell.roundRect(cellX, cellY, vCellW, 46, 3);
      cell.fill({ color: 0x0c1b30, alpha: 0.8 });
      cell.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.bodyContainer.addChild(cell);

      const lbl = new Text({
        text: m.label,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 8.5, fill: UI_COLORS.TEXT_MUTED }),
      });
      lbl.position.set(cellX + 10, cellY + 6);
      this.bodyContainer.addChild(lbl);

      const val = new Text({
        text: m.value,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      val.position.set(cellX + 10, cellY + 22);
      this.bodyContainer.addChild(val);
    });
  }

  // =========================================================================
  // SUB-TABS 2-5: ABSTRACT ASSESSMENT MATRIX VIEW
  // =========================================================================

  private renderAssessmentCategoryView(category: AssessmentCategory, latestTest?: any): void {
    const yStart = 66;
    const card = new Graphics();
    card.roundRect(0, yStart, 1860, 820, 4);
    card.fill({ color: 0x08101e, alpha: 0.95 });
    card.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.bodyContainer.addChild(card);

    const title = new Text({
      text: `ABSTRACT ASSESSMENT MATRIX // CATEGORY: ${category.replace(/_/g, ' ')}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    title.position.set(30, yStart + 20);
    this.bodyContainer.addChild(title);

    const checkpoints = latestTest?.checkpoints?.filter((c: any) => c.category === category) ?? [];

    if (checkpoints.length === 0) {
      const emptyText = new Text({
        text: 'No active assessment records generated for this category yet. Click "RUN TEST BENCH" to execute simulation.',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: UI_COLORS.TEXT_MUTED }),
      });
      emptyText.position.set(30, yStart + 60);
      this.bodyContainer.addChild(emptyText);
      return;
    }

    // Render Table Header
    const hdrY = yStart + 60;
    const hdrGfx = new Graphics();
    hdrGfx.roundRect(30, hdrY, 1800, 32, 3);
    hdrGfx.fill({ color: 0x142842, alpha: 0.9 });
    this.bodyContainer.addChild(hdrGfx);

    const colHeaders = [
      { text: 'CHECKPOINT LABEL', x: 45 },
      { text: 'CURRENT RATING', x: 420 },
      { text: 'MISSION TARGET', x: 650 },
      { text: 'OUTCOME', x: 880 },
      { text: 'EVALUATION & EXPLANATION', x: 1040 },
    ];
    colHeaders.forEach(ch => {
      const t = new Text({
        text: ch.text,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
      });
      t.position.set(ch.x, hdrY + 8);
      this.bodyContainer.addChild(t);
    });

    // Rows
    let rY = hdrY + 38;
    checkpoints.forEach((cp: any) => {
      const row = new Graphics();
      row.roundRect(30, rY, 1800, 52, 3);
      row.fill({ color: 0x0c1b30, alpha: 0.85 });
      row.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.bodyContainer.addChild(row);

      const lbl = new Text({
        text: cp.label,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      lbl.position.set(45, rY + 16);
      this.bodyContainer.addChild(lbl);

      const cur = new Text({
        text: String(cp.currentRating),
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.CYAN }),
      });
      cur.position.set(420, rY + 16);
      this.bodyContainer.addChild(cur);

      const tgt = new Text({
        text: String(cp.missionRequirement),
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY }),
      });
      tgt.position.set(650, rY + 16);
      this.bodyContainer.addChild(tgt);

      // Outcome badge
      let outColor: number = UI_COLORS.GREEN;
      if (cp.outcome === 'FAIL') outColor = UI_COLORS.RED;
      else if (cp.outcome === 'WARN') outColor = UI_COLORS.AMBER;
      else if (cp.outcome === 'NOT_APPLICABLE') outColor = UI_COLORS.TEXT_MUTED;

      const outGfx = new Graphics();
      outGfx.roundRect(880, rY + 12, 100, 26, 3);
      outGfx.fill({ color: outColor, alpha: 0.15 });
      outGfx.stroke({ color: outColor, width: 1.0 });
      this.bodyContainer.addChild(outGfx);

      const outTxt = new Text({
        text: cp.outcome,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fontWeight: 'bold', fill: outColor }),
      });
      outTxt.position.set(890, rY + 18);
      this.bodyContainer.addChild(outTxt);

      const exp = new Text({
        text: cp.explanation,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: 740,
        }),
      });
      exp.position.set(1040, rY + 10);
      this.bodyContainer.addChild(exp);

      rY += 58;
    });
  }

  // =========================================================================
  // SUB-TAB 6: TEST HISTORY
  // =========================================================================

  private renderTestHistory(currentVersion: string): void {
    const yStart = 66;
    const card = new Graphics();
    card.roundRect(0, yStart, 1860, 820, 4);
    card.fill({ color: 0x08101e, alpha: 0.95 });
    card.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.bodyContainer.addChild(card);

    const title = new Text({
      text: 'HISTORICAL TEST BENCH SIMULATION RECORDS (MAX 20 RUNS)',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    title.position.set(30, yStart + 20);
    this.bodyContainer.addChild(title);

    const history = this.testingManager.getTestHistory(this.props.projectId);

    if (history.length === 0) {
      const emptyText = new Text({
        text: 'No historical test records found for this rocket project. Execute a test bench assessment to log results.',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fill: UI_COLORS.TEXT_MUTED }),
      });
      emptyText.position.set(30, yStart + 60);
      this.bodyContainer.addChild(emptyText);
      return;
    }

    let rY = yStart + 60;
    history.forEach(rec => {
      const isOutdated = rec.designVersion !== currentVersion;
      const row = new Graphics();
      row.roundRect(30, rY, 1800, 52, 3);
      row.fill({ color: 0x0c1b30, alpha: 0.85 });
      row.stroke({ color: isOutdated ? UI_COLORS.BORDER_SUBTLE : UI_COLORS.CYAN, width: 1.0 });
      this.bodyContainer.addChild(row);

      // Test ID
      const tId = new Text({
        text: rec.testId,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_MUTED }),
      });
      tId.position.set(45, rY + 16);
      this.bodyContainer.addChild(tId);

      // Version tag with outdated indicator
      const verText = new Text({
        text: `${rec.designVersion} ${isOutdated ? '(OUTDATED VERSION)' : '(CURRENT BUILD)'}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: isOutdated ? UI_COLORS.AMBER : UI_COLORS.CYAN,
        }),
      });
      verText.position.set(320, rY + 16);
      this.bodyContainer.addChild(verText);

      // Score
      const sc = new Text({
        text: `SCORE: ${rec.overallScore}/100`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      sc.position.set(580, rY + 16);
      this.bodyContainer.addChild(sc);

      // Status Badge
      let sColor: number = UI_COLORS.GREEN;
      if (rec.status === RocketTestStatus.FAILED) sColor = UI_COLORS.RED;
      else if (rec.status === RocketTestStatus.PASSED_WITH_WARNINGS) sColor = UI_COLORS.AMBER;

      const sBadge = new Graphics();
      sBadge.roundRect(750, rY + 12, 130, 26, 3);
      sBadge.fill({ color: sColor, alpha: 0.15 });
      sBadge.stroke({ color: sColor, width: 1.0 });
      this.bodyContainer.addChild(sBadge);

      const sTxt = new Text({
        text: rec.status,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fontWeight: 'bold', fill: sColor }),
      });
      sTxt.position.set(760, rY + 18);
      this.bodyContainer.addChild(sTxt);

      // Summary snippet
      const sm = new Text({
        text: rec.summaryText,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_SECONDARY }),
      });
      sm.position.set(910, rY + 16);
      this.bodyContainer.addChild(sm);

      rY += 58;
    });
  }

  // =========================================================================
  // SUB-TAB 7: PRE-LAUNCH READINESS EVALUATION (10 CRITERIA)
  // =========================================================================

  private renderPreLaunchReadiness(readiness: any): void {
    const yStart = 66;

    // TOP BANNER: Readiness Clearance Card
    const bannerH = 100;
    const banner = new Graphics();
    banner.roundRect(0, yStart, 1860, bannerH, 4);

    let bannerBg = 0x064e3b;
    let bannerBorder: number = UI_COLORS.GREEN;
    let bannerTitle = '✔ PRE-LAUNCH READINESS: CERTIFIED FOR MISSION DEPLOYMENT';

    if (!readiness.isReadyForDeployment) {
      bannerBg = 0x3b0707;
      bannerBorder = UI_COLORS.RED;
      bannerTitle = '✖ PRE-LAUNCH READINESS: DEFICIENT (BLOCKING CONSTRAINTS UNMET)';
    } else if (readiness.status === PreLaunchReadinessStatus.READY_WITH_WARNINGS) {
      bannerBg = 0x2d1f04;
      bannerBorder = UI_COLORS.AMBER;
      bannerTitle = '▲ PRE-LAUNCH READINESS: CLEARED WITH ADVISORY WARNINGS';
    }

    banner.fill({ color: bannerBg, alpha: 0.95 });
    banner.stroke({ color: bannerBorder, width: 1.5 });
    this.bodyContainer.addChild(banner);

    const bTitle = new Text({
      text: bannerTitle,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: bannerBorder,
      }),
    });
    bTitle.position.set(30, yStart + 18);
    this.bodyContainer.addChild(bTitle);

    const bMsg = new Text({
      text: readiness.message,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    bMsg.position.set(30, yStart + 48);
    this.bodyContainer.addChild(bMsg);

    // Deployment Action on Banner
    if (readiness.isReadyForDeployment) {
      const btnDeploy = new UIButton({
        label: '🚀 PROCEED TO LAUNCH COMPLEX',
        variant: 'PRIMARY',
        width: 250,
        height: 42,
        onClick: () => this.handleDeployToLaunchComplex(),
      });
      btnDeploy.container.position.set(1560, yStart + 28);
      this.bodyContainer.addChild(btnDeploy.container);
    }

    // 10 CRITERIA CHECKLIST (Two Columns of 5)
    const listY = yStart + bannerH + 16;
    const colW = 910;
    const rowH = 92;

    readiness.criteria.forEach((crit: any, idx: number) => {
      const col = idx < 5 ? 0 : 1;
      const row = idx % 5;
      const cardX = col * (colW + 40);
      const cardY = listY + row * (rowH + 8);

      const card = new Graphics();
      card.roundRect(cardX, cardY, colW, rowH, 3);
      card.fill({ color: crit.satisfied ? 0x091c15 : 0x180c0c, alpha: 0.9 });
      card.stroke({
        color: crit.satisfied ? UI_COLORS.GREEN : crit.severity === 'BLOCKING' ? UI_COLORS.RED : UI_COLORS.AMBER,
        width: 1.0,
      });
      this.bodyContainer.addChild(card);

      // Icon & Number
      const numTxt = new Text({
        text: `CRITERION ${crit.number} // ${crit.severity}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: crit.satisfied ? UI_COLORS.GREEN : crit.severity === 'BLOCKING' ? UI_COLORS.RED : UI_COLORS.AMBER,
        }),
      });
      numTxt.position.set(cardX + 16, cardY + 10);
      this.bodyContainer.addChild(numTxt);

      // Label
      const lbl = new Text({
        text: crit.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      lbl.position.set(cardX + 16, cardY + 28);
      this.bodyContainer.addChild(lbl);

      // Current vs Required
      const valTxt = new Text({
        text: `Current: ${crit.currentValue}  |  Required: ${crit.requiredValue}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fill: UI_COLORS.CYAN,
        }),
      });
      valTxt.position.set(cardX + 16, cardY + 48);
      this.bodyContainer.addChild(valTxt);

      // Details
      const detTxt = new Text({
        text: crit.details,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: colW - 32,
        }),
      });
      detTxt.position.set(cardX + 16, cardY + 68);
      this.bodyContainer.addChild(detTxt);
    });
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  private handleRunTest(): void {
    const report = this.testingManager.runTestAssessment(this.props.projectId);

    NotificationManager.getInstance().notify({
      title: 'TEST BENCH SIMULATION COMPLETE',
      message: `${report.projectName} (${report.designVersion}): ${report.status} (Score: ${report.overallScore}/100)`,
      level: report.status === RocketTestStatus.PASSED ? 'SUCCESS' : report.status === RocketTestStatus.PASSED_WITH_WARNINGS ? 'WARNING' : 'ERROR',
    });

    this.activeSubTab = TestingWorkbenchSubTab.PERFORMANCE_ASSESSMENT;
    this.render();
  }

  private handleDeployToLaunchComplex(): void {
    const res = this.testingManager.deployToLaunchComplex(this.props.projectId);

    if (res.success) {
      NotificationManager.getInstance().notify({
        title: 'VEHICLE DEPLOYED TO PAD ALPHA',
        message: res.message,
        level: 'SUCCESS',
      });

      if (this.props.onProceedToLaunchComplex) {
        this.props.onProceedToLaunchComplex();
      }
    } else {
      NotificationManager.getInstance().notify({
        title: 'DEPLOYMENT REJECTED',
        message: res.message,
        level: 'ERROR',
      });
    }
  }
}
