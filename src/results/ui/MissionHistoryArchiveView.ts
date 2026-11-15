/**
 * INTERSTELLAR CONTINUUM - Mission History & Archive Interface View
 * Interactive archive interface enabling flight controllers to:
 * 1. Filter completed and failed missions by destination, category, and grade
 * 2. Search by mission name or code
 * 3. Inspect full debriefing reports
 * 4. Run side-by-side performance comparisons
 * 5. Track verified agency milestones
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UITabGroup } from '../../ui/components/UITabGroup';
import {
  MissionResultRecord,
  MissionCompletionStatus,
  MissionHistoryFilter,
} from '../ResultsTypes';
import { MissionResultsManager } from '../MissionResultsManager';

export interface MissionHistoryArchiveViewOptions {
  width?: number;
  height?: number;
  manager?: MissionResultsManager;
  onClose?: () => void;
  onOpenDebriefing?: (result: MissionResultRecord) => void;
}

export class MissionHistoryArchiveView {
  public readonly container: Container;

  private width: number;
  private height: number;
  private manager: MissionResultsManager;
  private onClose?: () => void;
  private onOpenDebriefing?: (result: MissionResultRecord) => void;

  private backgroundGfx: Graphics;
  private contentContainer: Container;

  private tabGroup?: UITabGroup;
  private activeTabId: string = 'tab_history';

  private currentFilter: MissionHistoryFilter = {};
  private selectedForCompare: string[] = [];

  constructor(options: MissionHistoryArchiveViewOptions = {}) {
    this.width = options.width ?? 1440;
    this.height = options.height ?? 860;
    this.manager = options.manager ?? MissionResultsManager.getInstance();
    this.onClose = options.onClose;
    this.onOpenDebriefing = options.onOpenDebriefing;

    this.container = new Container();

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    this.contentContainer = new Container();
    this.container.addChild(this.contentContainer);

    this.renderFrame();
    this.setupTabs();
    this.renderActiveTab();
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();
    this.backgroundGfx.rect(0, 0, this.width, this.height);
    this.backgroundGfx.fill({ color: UI_COLORS.BG_OVERLAY, alpha: 0.96 });

    const margin = 20;
    const panelW = this.width - margin * 2;
    const panelH = this.height - margin * 2;

    this.backgroundGfx.roundRect(margin, margin, panelW, panelH, 8);
    this.backgroundGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.94 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 2 });

    // Header bar separator
    this.backgroundGfx.moveTo(margin, margin + 65);
    this.backgroundGfx.lineTo(margin + panelW, margin + 65);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.5 });

    // Header Title
    const headerTitle = new Text({
      text: 'ASTRA CONTINUUM // HISTORICAL MISSION ARCHIVE & REPOSITORY',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.5,
      }),
    });
    headerTitle.position.set(margin + 24, margin + 20);
    this.container.addChild(headerTitle);

    // Close Button in top right
    const closeBtn = new UIButton({
      label: 'BACK',
      width: 100,
      height: 32,
      variant: 'SECONDARY',
      onClick: () => {
        if (this.onClose) this.onClose();
      },
    });
    closeBtn.container.position.set(this.width - margin - 124, margin + 16);
    this.container.addChild(closeBtn.container);
  }

  private setupTabs(): void {
    const margin = 20;
    this.tabGroup = new UITabGroup({
      tabs: [
        { id: 'tab_history', label: 'FLIGHT RECORDS' },
        { id: 'tab_milestones', label: 'ORGANISATIONAL MILESTONES' },
        { id: 'tab_compare', label: 'PERFORMANCE COMPARISON' },
      ],
      activeTabId: this.activeTabId,
      onTabChange: (id) => {
        this.activeTabId = id;
        this.renderActiveTab();
      },
    });
    this.tabGroup.container.position.set(margin + 24, margin + 80);
    this.container.addChild(this.tabGroup.container);
  }

  private renderActiveTab(): void {
    this.contentContainer.removeChildren();

    const margin = 20;
    const contentY = margin + 130;

    if (this.activeTabId === 'tab_history') {
      this.renderHistoryListTab(contentY);
    } else if (this.activeTabId === 'tab_milestones') {
      this.renderMilestonesTab(contentY);
    } else if (this.activeTabId === 'tab_compare') {
      this.renderComparisonTab(contentY);
    }
  }

  private renderHistoryListTab(startY: number): void {
    const margin = 20;
    const panelW = this.width - margin * 2;
    const tabContainer = new Container();
    tabContainer.position.set(margin + 24, startY);

    // Quick Filter Bar Buttons
    const filterRow = new Container();
    filterRow.position.set(0, 0);

    const filterAllBtn = new UIButton({
      label: 'ALL MISSIONS',
      width: 130,
      height: 28,
      variant: !this.currentFilter.completionStatus ? 'PRIMARY' : 'SECONDARY',
      onClick: () => {
        this.currentFilter.completionStatus = undefined;
        this.renderActiveTab();
      },
    });
    filterRow.addChild(filterAllBtn.container);

    const filterCompletedBtn = new UIButton({
      label: 'COMPLETED ONLY',
      width: 150,
      height: 28,
      variant: this.currentFilter.completionStatus === MissionCompletionStatus.COMPLETED ? 'PRIMARY' : 'SECONDARY',
      onClick: () => {
        this.currentFilter.completionStatus = MissionCompletionStatus.COMPLETED;
        this.renderActiveTab();
      },
    });
    filterCompletedBtn.container.position.set(140, 0);
    filterRow.addChild(filterCompletedBtn.container);

    const filterFailedBtn = new UIButton({
      label: 'FAILED / CANCELLED',
      width: 170,
      height: 28,
      variant: this.currentFilter.completionStatus === MissionCompletionStatus.FAILED ? 'PRIMARY' : 'SECONDARY',
      onClick: () => {
        this.currentFilter.completionStatus = MissionCompletionStatus.FAILED;
        this.renderActiveTab();
      },
    });
    filterFailedBtn.container.position.set(300, 0);
    filterRow.addChild(filterFailedBtn.container);

    tabContainer.addChild(filterRow);

    // List of Results
    const results = this.manager.listMissionHistory(this.currentFilter);
    const listScrollContainer = new Container();
    listScrollContainer.position.set(0, 44);

    if (results.length === 0) {
      const emptyText = new Text({
        text: 'NO MISSION RECORDS FOUND IN ARCHIVE FOR CURRENT FILTER CRITERIA.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(0, 40);
      listScrollContainer.addChild(emptyText);
    } else {
      results.slice(0, 8).forEach((rec, idx) => {
        const rowY = idx * 64;
        const rowGfx = new Graphics();
        rowGfx.roundRect(0, rowY, panelW - 48, 54, 4);
        rowGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.8 });
        rowGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
        listScrollContainer.addChild(rowGfx);

        // Grade Badge
        const gradeBadge = new Text({
          text: `[${rec.gradeLetter}]`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 16,
            fontWeight: 'bold',
            fill: rec.finalPerformanceScore >= 80 ? UI_COLORS.CYAN : rec.finalPerformanceScore >= 60 ? UI_COLORS.AMBER : UI_COLORS.RED,
          }),
        });
        gradeBadge.position.set(16, rowY + 16);
        listScrollContainer.addChild(gradeBadge);

        // Mission Title & Code
        const title = new Text({
          text: `${rec.shortCode ? rec.shortCode + ' ' : ''}${rec.missionName}`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 13,
            fontWeight: 'bold',
            fill: UI_COLORS.TEXT_PRIMARY,
          }),
        });
        title.position.set(65, rowY + 10);
        listScrollContainer.addChild(title);

        // Details: Destination | Score | Status | Duration
        const sub = new Text({
          text: `Dest: ${rec.destination}   |   Score: ${rec.finalPerformanceScore}/100   |   Status: ${rec.completionStatus}   |   Duration: ${rec.missionDurationFormatted}`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.TEXT_SECONDARY,
          }),
        });
        sub.position.set(65, rowY + 30);
        listScrollContainer.addChild(sub);

        // Inspect Button
        const inspectBtn = new UIButton({
          label: 'INSPECT DEBRIEF',
          width: 140,
          height: 28,
          variant: 'PRIMARY',
          onClick: () => {
            if (this.onOpenDebriefing) {
              this.onOpenDebriefing(rec);
            }
          },
        });
        inspectBtn.container.position.set(panelW - 220, rowY + 13);
        listScrollContainer.addChild(inspectBtn.container);

        // Select for compare checkbox button
        const isSelected = this.selectedForCompare.includes(rec.id);
        const compareBtn = new UIButton({
          label: isSelected ? 'DESELECT' : 'COMPARE',
          width: 90,
          height: 28,
          variant: isSelected ? 'DANGER' : 'SECONDARY',
          onClick: () => {
            if (isSelected) {
              this.selectedForCompare = this.selectedForCompare.filter((id) => id !== rec.id);
            } else {
              if (this.selectedForCompare.length >= 2) {
                this.selectedForCompare.shift(); // keep max 2
              }
              this.selectedForCompare.push(rec.id);
            }
            this.renderActiveTab();
          },
        });
        compareBtn.container.position.set(panelW - 320, rowY + 13);
        listScrollContainer.addChild(compareBtn.container);
      });
    }

    tabContainer.addChild(listScrollContainer);
    this.contentContainer.addChild(tabContainer);
  }

  private renderMilestonesTab(startY: number): void {
    const margin = 20;
    const panelW = this.width - margin * 2;
    const tabContainer = new Container();
    tabContainer.position.set(margin + 24, startY);

    const milestones = this.manager.getOrganisationalMilestones();

    milestones.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cardW = (panelW - 72) / 2;
      const cardH = 88;
      const cardX = col * (cardW + 24);
      const cardY = row * (cardH + 16);

      const cardGfx = new Graphics();
      cardGfx.roundRect(cardX, cardY, cardW, cardH, 6);
      cardGfx.fill({ color: m.unlocked ? UI_COLORS.BG_PANEL_ELEVATED : UI_COLORS.BG_DARK, alpha: 0.85 });
      cardGfx.stroke({ color: m.unlocked ? UI_COLORS.BORDER_HIGHLIGHT : UI_COLORS.BORDER_DIM, width: 1.5 });
      tabContainer.addChild(cardGfx);

      const statusTag = new Text({
        text: m.unlocked ? '[VERIFIED MILESTONE]' : '[LOCKED - PENDING]',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: m.unlocked ? UI_COLORS.GREEN : UI_COLORS.TEXT_MUTED,
        }),
      });
      statusTag.position.set(cardX + 16, cardY + 12);
      tabContainer.addChild(statusTag);

      const title = new Text({
        text: m.title.toUpperCase(),
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 13,
          fontWeight: 'bold',
          fill: m.unlocked ? UI_COLORS.TEXT_PRIMARY : UI_COLORS.TEXT_MUTED,
        }),
      });
      title.position.set(cardX + 16, cardY + 28);
      tabContainer.addChild(title);

      const desc = new Text({
        text: m.description,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: cardW - 32,
        }),
      });
      desc.position.set(cardX + 16, cardY + 48);
      tabContainer.addChild(desc);
    });

    this.contentContainer.addChild(tabContainer);
  }

  private renderComparisonTab(startY: number): void {
    const margin = 20;
    const panelW = this.width - margin * 2;
    const tabContainer = new Container();
    tabContainer.position.set(margin + 24, startY);

    if (this.selectedForCompare.length < 2) {
      const tipText = new Text({
        text: 'SELECT AT LEAST TWO MISSIONS IN THE "FLIGHT RECORDS" TAB TO COMPARE PERFORMANCE METRICS SIDE-BY-SIDE.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fontWeight: 'bold',
          fill: UI_COLORS.AMBER,
        }),
      });
      tipText.position.set(0, 40);
      tabContainer.addChild(tipText);
      this.contentContainer.addChild(tabContainer);
      return;
    }

    const comparison = this.manager.comparePerformances(
      this.selectedForCompare[0]!,
      this.selectedForCompare[1]!
    );

    if (!comparison) {
      return;
    }

    const compBox = new Graphics();
    compBox.roundRect(0, 0, panelW - 48, 540, 6);
    compBox.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.9 });
    compBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 2 });
    tabContainer.addChild(compBox);

    // Summary banner
    const summaryText = new Text({
      text: comparison.summary.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    summaryText.position.set(24, 20);
    tabContainer.addChild(summaryText);

    // Side-by-Side Mission Labels
    const colW = (panelW - 120) / 2;
    const colA = new Container();
    colA.position.set(24, 60);

    const aTitle = new Text({
      text: `FLIGHT A: ${comparison.missionA.missionName.toUpperCase()} (${comparison.missionA.gradeLetter})`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 13, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
    });
    colA.addChild(aTitle);

    const aScore = new Text({
      text: `Overall Score: ${comparison.missionA.finalPerformanceScore}/100\nDestination: ${comparison.missionA.destination}\nDuration: ${comparison.missionA.missionDurationFormatted}`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY, lineHeight: 18 }),
    });
    aScore.position.set(0, 24);
    colA.addChild(aScore);
    tabContainer.addChild(colA);

    const colB = new Container();
    colB.position.set(24 + colW + 40, 60);

    const bTitle = new Text({
      text: `FLIGHT B: ${comparison.missionB.missionName.toUpperCase()} (${comparison.missionB.gradeLetter})`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 13, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
    });
    colB.addChild(bTitle);

    const bScore = new Text({
      text: `Overall Score: ${comparison.missionB.finalPerformanceScore}/100\nDestination: ${comparison.missionB.destination}\nDuration: ${comparison.missionB.missionDurationFormatted}`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY, lineHeight: 18 }),
    });
    bScore.position.set(0, 24);
    colB.addChild(bScore);
    tabContainer.addChild(colB);

    // Category Delta Breakdown Table
    const tableHeader = new Text({
      text: 'CATEGORY PERFORMANCE DELTAS:',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_MUTED }),
    });
    tableHeader.position.set(24, 150);
    tabContainer.addChild(tableHeader);

    let rowIdx = 0;
    for (const [catKey, data] of Object.entries(comparison.categoryDeltas)) {
      const y = 180 + rowIdx * 34;
      const catLabel = new Text({
        text: `${catKey}:`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      catLabel.position.set(24, y);
      tabContainer.addChild(catLabel);

      const deltaColor = data.delta > 0 ? UI_COLORS.GREEN : data.delta < 0 ? UI_COLORS.RED : UI_COLORS.TEXT_MUTED;
      const deltaSign = data.delta > 0 ? `+${data.delta}` : `${data.delta}`;
      const deltaText = new Text({
        text: `Flight A: ${data.scoreA} pts   |   Flight B: ${data.scoreB} pts   |   Delta: ${deltaSign} pts`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: deltaColor }),
      });
      deltaText.position.set(300, y);
      tabContainer.addChild(deltaText);

      rowIdx++;
    }

    this.contentContainer.addChild(tabContainer);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
