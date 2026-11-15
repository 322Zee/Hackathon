/**
 * INTERSTELLAR CONTINUUM - Scientific Archive Interface View
 * Comprehensive planetary research database view providing:
 * 1. Global scientific database overview and telemetry KPIs
 * 2. Multi-discipline scientific findings browser with destination and category filtering
 * 3. In-depth discovery detail inspector with progressive data analysis controls
 * 4. Research projects roadmap with prerequisite findings verification and rewards
 * 5. Side-by-side comparative analysis lab
 *
 * NOTE: Strictly adheres to 2D UI architecture, PixiJS v8, and project design tokens.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { UITabGroup } from '../../ui/components/UITabGroup';
import { UIProgressBar } from '../../ui/components/UIProgressBar';
import { ScientificDataManager } from '../ScientificDataManager';
import {
  ScientificFinding,
  ScientificCategory,
  SCIENTIFIC_CATEGORY_LABELS,
  AnalysisStatus,
  ResearchProjectStatus,
} from '../ScientificTypes';
import { DestinationId } from '../../destinations/DestinationTypes';

export interface ScientificArchiveViewOptions {
  width?: number;
  height?: number;
  onClose?: () => void;
  manager?: ScientificDataManager;
}

export class ScientificArchiveView {
  public readonly container: Container;

  private width: number;
  private height: number;
  private manager: ScientificDataManager;
  private options: ScientificArchiveViewOptions;

  private backdropGfx: Graphics;
  private panelGfx: Graphics;
  private headerContainer: Container;
  private contentContainer: Container;
  private tabGroup?: UITabGroup;

  private currentTabId: string = 'tab_overview';
  private selectedFindingId: string | null = null;
  private filterDestination: DestinationId | 'ALL' = 'ALL';
  private filterCategory: ScientificCategory | 'ALL' = 'ALL';

  private compareIdA: string | null = null;
  private compareIdB: string | null = null;

  private feedbackText?: Text;
  private feedbackTimer: number = 0;

  constructor(options: ScientificArchiveViewOptions = {}) {
    this.options = options;
    this.width = options.width ?? 1560;
    this.height = options.height ?? 880;
    this.manager = options.manager ?? ScientificDataManager.getInstance();

    this.container = new Container();
    this.container.label = 'ScientificArchiveView';
    this.container.visible = false;
    this.container.zIndex = 1000;

    this.backdropGfx = new Graphics();
    this.panelGfx = new Graphics();
    this.headerContainer = new Container();
    this.contentContainer = new Container();

    this.container.addChild(this.backdropGfx);
    this.container.addChild(this.panelGfx);
    this.container.addChild(this.headerContainer);
    this.container.addChild(this.contentContainer);

    // Default select first available finding
    const findings = this.manager.listScientificFindings();
    if (findings.length > 0 && findings[0]) {
      this.selectedFindingId = findings[0].id;
    }

    this.buildBackdrop();
    this.buildPanel();
    this.buildHeader();
    this.buildTabGroup();
    this.switchTab('tab_overview');
  }

  public show(): void {
    this.container.visible = true;
    this.refreshContent();
  }

  public hide(): void {
    this.container.visible = false;
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public toggle(): void {
    if (this.container.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isVisible(): boolean {
    return this.container.visible;
  }

  public update(deltaSeconds: number): void {
    if (!this.container.visible) return;

    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= deltaSeconds;
      if (this.feedbackTimer <= 0 && this.feedbackText) {
        this.feedbackText.text = '';
      }
    }
  }

  public destroy(): void {
    if (this.tabGroup) {
      this.tabGroup.destroy();
    }
    this.container.destroy({ children: true });
  }

  // ─── Visual Shell Construction ───────────────────────────────────────────────

  private buildBackdrop(): void {
    this.backdropGfx.clear();
    this.backdropGfx.rect(0, 0, this.width, this.height);
    this.backdropGfx.fill({ color: UI_COLORS.BG_OVERLAY, alpha: 0.85 });
    this.backdropGfx.eventMode = 'static';
  }

  private buildPanel(): void {
    const pad = 24;
    const pWidth = this.width - pad * 2;
    const pHeight = this.height - pad * 2;

    this.panelGfx.clear();
    // Base panel
    this.panelGfx.roundRect(pad, pad, pWidth, pHeight, UI_RADIUS.LG);
    this.panelGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.96 });
    this.panelGfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.5, alpha: 0.8 });

    // Inner subtle glow header border
    this.panelGfx.moveTo(pad, pad + 72);
    this.panelGfx.lineTo(pad + pWidth, pad + 72);
    this.panelGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  private buildHeader(): void {
    this.headerContainer.removeChildren();

    const titleText = new Text({
      text: 'SCIENTIFIC ARCHIVE & RESEARCH FOUNDATION',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 2,
      }),
    });
    titleText.position.set(48, 40);
    this.headerContainer.addChild(titleText);

    const subText = new Text({
      text: 'SOLAR SYSTEM EXPLORATION REPOSITORY // ASTROPHYSICS & PLANETARY GEOSCIENCE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.2,
      }),
    });
    subText.position.set(48, 64);
    this.headerContainer.addChild(subText);

    // Feedback notification message
    this.feedbackText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SUCCESS,
        letterSpacing: 0.8,
      }),
    });
    this.feedbackText.position.set(700, 52);
    this.headerContainer.addChild(this.feedbackText);

    // Close button
    const closeBtn = new UIButton({
      label: 'CLOSE [ESC]',
      variant: 'GHOST',
      width: 130,
      height: 32,
      onClick: () => this.hide(),
    });
    closeBtn.container.position.set(this.width - 48 - 130, 42);
    this.headerContainer.addChild(closeBtn.container);
  }

  private buildTabGroup(): void {
    if (this.tabGroup) {
      this.headerContainer.removeChild(this.tabGroup.container);
      this.tabGroup.destroy();
    }

    this.tabGroup = new UITabGroup({
      tabs: [
        { id: 'tab_overview', label: 'DATABASE OVERVIEW' },
        { id: 'tab_archive', label: 'DISCOVERY ARCHIVE' },
        { id: 'tab_research', label: 'RESEARCH PROJECTS' },
        { id: 'tab_comparison', label: 'COMPARATIVE LAB' },
      ],
      width: 640,
      height: 32,
      initialTabId: this.currentTabId,
      onTabChange: (tabId) => this.switchTab(tabId),
    });

    this.tabGroup.container.position.set(48, 104);
    this.headerContainer.addChild(this.tabGroup.container);
  }

  private switchTab(tabId: string): void {
    this.currentTabId = tabId;
    this.refreshContent();
  }

  private showFeedback(message: string, isError: boolean = false): void {
    if (this.feedbackText) {
      this.feedbackText.text = message;
      this.feedbackText.style.fill = isError ? UI_COLORS.TEXT_DANGER : UI_COLORS.TEXT_SUCCESS;
      this.feedbackTimer = 3.5;
    }
  }

  // ─── Content Router ──────────────────────────────────────────────────────────

  private refreshContent(): void {
    this.contentContainer.removeChildren();

    switch (this.currentTabId) {
      case 'tab_overview':
        this.renderOverviewTab();
        break;
      case 'tab_archive':
        this.renderArchiveTab();
        break;
      case 'tab_research':
        this.renderResearchTab();
        break;
      case 'tab_comparison':
        this.renderComparisonTab();
        break;
      default:
        this.renderOverviewTab();
        break;
    }
  }

  // ─── TAB 1: Scientific Database Overview ─────────────────────────────────────

  private renderOverviewTab(): void {
    const overview = this.manager.getResearchOverview();
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    // 1. KPI Cards Row
    const kpis = [
      { label: 'TOTAL DISCOVERIES', value: `${overview.totalFindings}`, color: UI_COLORS.CYAN },
      {
        label: 'ANALYZED & VERIFIED',
        value: `${overview.findingsByStatus[AnalysisStatus.ANALYSED] + overview.findingsByStatus[AnalysisStatus.VERIFIED]} / ${overview.totalFindings}`,
        color: UI_COLORS.GREEN,
      },
      {
        label: 'PENDING ANALYSIS',
        value: `${overview.findingsByStatus[AnalysisStatus.UNANALYSED] + overview.findingsByStatus[AnalysisStatus.IN_PROGRESS]}`,
        color: UI_COLORS.AMBER,
      },
      {
        label: 'RESEARCH PROJECTS',
        value: `${overview.projectsByStatus[ResearchProjectStatus.COMPLETED]} / ${overview.totalProjects} COMPLETED`,
        color: UI_COLORS.BLUE,
      },
      {
        label: 'PROGRAM PROGRESS',
        value: `${overview.overallProgress}%`,
        color: UI_COLORS.PURPLE,
      },
    ];

    const cardWidth = Math.floor((usableWidth - 16 * (kpis.length - 1)) / kpis.length);
    kpis.forEach((kpi, idx) => {
      const cardX = startX + idx * (cardWidth + 16);
      const cardGfx = new Graphics();
      cardGfx.roundRect(cardX, startY, cardWidth, 80, UI_RADIUS.MD);
      cardGfx.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.9 });
      cardGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });

      const label = new Text({
        text: kpi.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
          letterSpacing: 0.8,
        }),
      });
      label.position.set(cardX + 16, startY + 14);

      const val = new Text({
        text: kpi.value,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 16,
          fontWeight: 'bold',
          fill: kpi.color,
          letterSpacing: 1.0,
        }),
      });
      val.position.set(cardX + 16, startY + 38);

      this.contentContainer.addChild(cardGfx);
      this.contentContainer.addChild(label);
      this.contentContainer.addChild(val);
    });

    // 2. Discipline Breakdown Matrix (Left Half)
    const leftX = startX;
    const colY = startY + 104;
    const colWidth = Math.floor((usableWidth - 24) / 2);
    const colHeight = 540;

    const leftPanel = new Graphics();
    leftPanel.roundRect(leftX, colY, colWidth, colHeight, UI_RADIUS.MD);
    leftPanel.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.6 });
    leftPanel.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(leftPanel);

    const leftTitle = new Text({
      text: 'DISCIPLINE DISTRIBUTION // 10 CANONICAL CATEGORIES',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    leftTitle.position.set(leftX + 20, colY + 18);
    this.contentContainer.addChild(leftTitle);

    const categories = Object.values(ScientificCategory);
    categories.forEach((cat, idx) => {
      const rowY = colY + 54 + idx * 46;
      const count = overview.findingsByCategory[cat] || 0;
      const pct = overview.totalFindings > 0 ? count / overview.totalFindings : 0;

      const catLabel = new Text({
        text: SCIENTIFIC_CATEGORY_LABELS[cat] || cat,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      catLabel.position.set(leftX + 20, rowY);
      this.contentContainer.addChild(catLabel);

      const countText = new Text({
        text: `${count} findings`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      countText.anchor.set(1.0, 0);
      countText.position.set(leftX + colWidth - 20, rowY);
      this.contentContainer.addChild(countText);

      const bar = new UIProgressBar({
        width: colWidth - 40,
        height: 8,
        fillColor: UI_COLORS.CYAN,
        showPercent: false,
        initialValue: pct,
      });
      bar.container.position.set(leftX + 20, rowY + 22);
      this.contentContainer.addChild(bar.container);
    });

    // 3. Planetary Exploration Coverage (Right Half)
    const rightX = leftX + colWidth + 24;
    const rightPanel = new Graphics();
    rightPanel.roundRect(rightX, colY, colWidth, colHeight, UI_RADIUS.MD);
    rightPanel.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.6 });
    rightPanel.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(rightPanel);

    const rightTitle = new Text({
      text: 'CELESTIAL DESTINATION CATALOGUE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    rightTitle.position.set(rightX + 20, colY + 18);
    this.contentContainer.addChild(rightTitle);

    const sampleDestinations: Array<{ id: DestinationId; label: string }> = [
      { id: DestinationId.MOON, label: 'The Moon' },
      { id: DestinationId.MARS, label: 'Mars' },
      { id: DestinationId.VENUS, label: 'Venus' },
      { id: DestinationId.MERCURY, label: 'Mercury' },
      { id: DestinationId.ASTEROID_BELT, label: 'Asteroid Belt & Ceres' },
      { id: DestinationId.EUROPA, label: 'Jupiter System (Europa/Io)' },
      { id: DestinationId.TITAN, label: 'Saturn System (Titan/Enceladus)' },
      { id: DestinationId.URANUS, label: 'Uranus' },
      { id: DestinationId.NEPTUNE, label: 'Neptune & Triton' },
      { id: DestinationId.SUN, label: 'Sun & Near-Earth Space' },
    ];

    sampleDestinations.forEach((dest, idx) => {
      const rowY = colY + 54 + idx * 46;
      const count = overview.findingsByDestination[dest.id] || 0;
      const pct = Math.min(1.0, count / 3);

      const dLabel = new Text({
        text: dest.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      dLabel.position.set(rightX + 20, rowY);
      this.contentContainer.addChild(dLabel);

      const dCount = new Text({
        text: count > 0 ? `${count} records logged` : 'Unsurveyed',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: count > 0 ? UI_COLORS.TEXT_ACCENT : UI_COLORS.TEXT_MUTED,
        }),
      });
      dCount.anchor.set(1.0, 0);
      dCount.position.set(rightX + colWidth - 20, rowY);
      this.contentContainer.addChild(dCount);

      const bar = new UIProgressBar({
        width: colWidth - 40,
        height: 8,
        fillColor: UI_COLORS.BLUE,
        showPercent: false,
        initialValue: pct,
      });
      bar.container.position.set(rightX + 20, rowY + 22);
      this.contentContainer.addChild(bar.container);
    });
  }

  // ─── TAB 2: Discovery Archive & Detail Inspector ─────────────────────────────

  private renderArchiveTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    // 1. Destination & Category Filters Header
    const filterRow = new Container();
    filterRow.position.set(startX, startY);
    this.contentContainer.addChild(filterRow);

    const destFilterLabel = new Text({
      text: 'DESTINATION:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    destFilterLabel.position.set(0, 6);
    filterRow.addChild(destFilterLabel);

    const destFilterOptions: Array<{ id: DestinationId | 'ALL'; label: string }> = [
      { id: 'ALL', label: 'ALL' },
      { id: DestinationId.MOON, label: 'MOON' },
      { id: DestinationId.MARS, label: 'MARS' },
      { id: DestinationId.VENUS, label: 'VENUS' },
      { id: DestinationId.MERCURY, label: 'MERCURY' },
      { id: DestinationId.ASTEROID_BELT, label: 'ASTEROIDS' },
      { id: DestinationId.EUROPA, label: 'JUPITER' },
      { id: DestinationId.TITAN, label: 'SATURN' },
      { id: DestinationId.NEPTUNE, label: 'OUTER GIANTS' },
    ];

    let currentBtnX = 90;
    destFilterOptions.forEach((opt) => {
      const isSelected = this.filterDestination === opt.id;
      const btn = new UIButton({
        label: opt.label,
        variant: isSelected ? 'PRIMARY' : 'GHOST',
        width: 100,
        height: 26,
        onClick: () => {
          this.filterDestination = opt.id;
          this.refreshContent();
        },
      });
      btn.container.position.set(currentBtnX, 0);
      filterRow.addChild(btn.container);
      currentBtnX += 106;
    });

    // Category Filter Row
    const catFilterRow = new Container();
    catFilterRow.position.set(startX, startY + 32);
    this.contentContainer.addChild(catFilterRow);

    const catFilterLabel = new Text({
      text: 'CATEGORY:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    catFilterLabel.position.set(0, 6);
    catFilterRow.addChild(catFilterLabel);

    const catFilterOptions: Array<{ id: ScientificCategory | 'ALL'; label: string }> = [
      { id: 'ALL', label: 'ALL DISCIPLINES' },
      { id: ScientificCategory.SURFACE_GEOLOGY, label: 'GEOLOGY' },
      { id: ScientificCategory.ATMOSPHERIC_OBSERVATIONS, label: 'ATMOSPHERE' },
      { id: ScientificCategory.MINERAL_COMPOSITION, label: 'MINERALS' },
      { id: ScientificCategory.ICE_AND_WATER, label: 'ICE & WATER' },
      { id: ScientificCategory.MAGNETIC_FIELD_OBSERVATIONS, label: 'MAGNETIC' },
      { id: ScientificCategory.RADIATION_ENVIRONMENT, label: 'RADIATION' },
    ];

    let catBtnX = 90;
    catFilterOptions.forEach((opt) => {
      const isSelected = this.filterCategory === opt.id;
      const btn = new UIButton({
        label: opt.label,
        variant: isSelected ? 'PRIMARY' : 'GHOST',
        width: 125,
        height: 26,
        onClick: () => {
          this.filterCategory = opt.id;
          this.refreshContent();
        },
      });
      btn.container.position.set(catBtnX, 0);
      catFilterRow.addChild(btn.container);
      catBtnX += 132;
    });

    // 2. Two-Column Layout (List on Left, Detail on Right)
    const colY = startY + 66;
    const listWidth = 460;
    const detailWidth = usableWidth - listWidth - 24;
    const colHeight = 580;

    // Left List Panel
    const listPanel = new Graphics();
    listPanel.roundRect(startX, colY, listWidth, colHeight, UI_RADIUS.MD);
    listPanel.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.7 });
    listPanel.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(listPanel);

    // Filter findings
    const allFindings = this.manager.listScientificFindings();
    const filteredFindings = allFindings.filter((f) => {
      if (this.filterCategory !== 'ALL' && f.category !== this.filterCategory) {
        return false;
      }
      if (this.filterDestination !== 'ALL') {
        if (this.filterDestination === DestinationId.EUROPA) {
          if (f.destinationId !== DestinationId.EUROPA && f.destinationId !== DestinationId.IO && f.destinationId !== DestinationId.JUPITER) {
            return false;
          }
        } else if (this.filterDestination === DestinationId.TITAN) {
          if (f.destinationId !== DestinationId.TITAN && f.destinationId !== DestinationId.ENCELADUS && f.destinationId !== DestinationId.SATURN) {
            return false;
          }
        } else if (this.filterDestination === DestinationId.NEPTUNE) {
          if (f.destinationId !== DestinationId.NEPTUNE && f.destinationId !== DestinationId.TRITON && f.destinationId !== DestinationId.URANUS) {
            return false;
          }
        } else if (this.filterDestination === DestinationId.ASTEROID_BELT) {
          if (f.destinationId !== DestinationId.ASTEROID_BELT && f.destinationId !== DestinationId.CERES && f.destinationId !== DestinationId.VESTA) {
            return false;
          }
        } else if (f.destinationId !== this.filterDestination) {
          return false;
        }
      }
      return true;
    });

    // Render list items (up to 8 fit nicely in the view)
    const listContainer = new Container();
    listContainer.position.set(startX + 12, colY + 12);
    this.contentContainer.addChild(listContainer);

    filteredFindings.slice(0, 8).forEach((finding, idx) => {
      const itemY = idx * 68;
      const isSelected = finding.id === this.selectedFindingId;

      const itemGfx = new Graphics();
      itemGfx.roundRect(0, itemY, listWidth - 24, 60, UI_RADIUS.SM);
      itemGfx.fill({
        color: isSelected ? UI_COLORS.BG_PANEL_ELEVATED : UI_COLORS.BG_GLASS,
        alpha: 0.9,
      });
      itemGfx.stroke({
        color: isSelected ? UI_COLORS.BORDER_FOCUS : UI_COLORS.BORDER_DIM,
        width: isSelected ? 1.5 : 1,
      });
      itemGfx.eventMode = 'static';
      itemGfx.cursor = 'pointer';
      itemGfx.on('pointerdown', () => {
        this.selectedFindingId = finding.id;
        this.refreshContent();
      });
      listContainer.addChild(itemGfx);

      const nameText = new Text({
        text: finding.name.length > 34 ? finding.name.substring(0, 31) + '...' : finding.name,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fontWeight: 'bold',
          fill: isSelected ? UI_COLORS.TEXT_ACCENT : UI_COLORS.TEXT_PRIMARY,
        }),
      });
      nameText.position.set(12, itemY + 10);
      listContainer.addChild(nameText);

      const metaText = new Text({
        text: `${SCIENTIFIC_CATEGORY_LABELS[finding.category]} // ${finding.destinationId.replace('DEST_', '')}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      metaText.position.set(12, itemY + 34);
      listContainer.addChild(metaText);

      // Status pill
      const statusColor =
        finding.analysisStatus === AnalysisStatus.VERIFIED
          ? UI_COLORS.GREEN
          : finding.analysisStatus === AnalysisStatus.ANALYSED
            ? UI_COLORS.CYAN
            : finding.analysisStatus === AnalysisStatus.IN_PROGRESS
              ? UI_COLORS.AMBER
              : UI_COLORS.TEXT_MUTED;

      const statusBadge = new Text({
        text: finding.analysisStatus,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: statusColor,
        }),
      });
      statusBadge.anchor.set(1.0, 0);
      statusBadge.position.set(listWidth - 36, itemY + 22);
      listContainer.addChild(statusBadge);
    });

    // 3. Right Detail View Panel
    const detailX = startX + listWidth + 24;
    const detailPanel = new Graphics();
    detailPanel.roundRect(detailX, colY, detailWidth, colHeight, UI_RADIUS.MD);
    detailPanel.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.8 });
    detailPanel.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(detailPanel);

    const activeFinding = this.selectedFindingId
      ? this.manager.getScientificFinding(this.selectedFindingId)
      : filteredFindings[0] || null;

    if (!activeFinding) {
      const emptyText = new Text({
        text: 'NO SCIENTIFIC DISCOVERY SELECTED',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(detailX + 40, colY + 40);
      this.contentContainer.addChild(emptyText);
      return;
    }

    // Detail Header
    const title = new Text({
      text: activeFinding.name,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.2,
      }),
    });
    title.position.set(detailX + 32, colY + 24);
    this.contentContainer.addChild(title);

    const catBadge = new Text({
      text: `CATEGORY: ${SCIENTIFIC_CATEGORY_LABELS[activeFinding.category].toUpperCase()} | DESTINATION: ${activeFinding.destinationId.replace('DEST_', '')} | SOURCE: ${activeFinding.collectionSource}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.0,
      }),
    });
    catBadge.position.set(detailX + 32, colY + 54);
    this.contentContainer.addChild(catBadge);

    // Scientific Authenticity Banner
    const authBanner = new Graphics();
    authBanner.roundRect(detailX + 32, colY + 84, detailWidth - 64, 32, UI_RADIUS.SM);
    authBanner.fill({
      color: activeFinding.isEstablishedScience ? 0x064e3b : 0x312e81,
      alpha: 0.5,
    });
    authBanner.stroke({
      color: activeFinding.isEstablishedScience ? UI_COLORS.GREEN : UI_COLORS.PURPLE,
      width: 1,
    });
    this.contentContainer.addChild(authBanner);

    const authText = new Text({
      text: activeFinding.isEstablishedScience
        ? 'ESTABLISHED SCIENTIFIC KNOWLEDGE // EMPIRICALLY CONFIRMED ASTRONOMICAL DATA'
        : 'SPECULATIVE PLANETARY DISCOVERY // HYPOTHETICAL EXPLORATION SITE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: activeFinding.isEstablishedScience ? UI_COLORS.GREEN : UI_COLORS.PURPLE,
        letterSpacing: 0.8,
      }),
    });
    authText.position.set(detailX + 48, colY + 92);
    this.contentContainer.addChild(authText);

    // Educational Description Box
    const descBox = new Graphics();
    descBox.roundRect(detailX + 32, colY + 132, detailWidth - 64, 160, UI_RADIUS.MD);
    descBox.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.8 });
    descBox.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });
    this.contentContainer.addChild(descBox);

    const descHeading = new Text({
      text: 'SCIENTIFIC SUMMARY & SENSOR TELEMETRY:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 1.0,
      }),
    });
    descHeading.position.set(detailX + 48, colY + 144);
    this.contentContainer.addChild(descHeading);

    const descBody = new Text({
      text: activeFinding.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        lineHeight: 18,
        wordWrap: true,
        wordWrapWidth: detailWidth - 96,
      }),
    });
    descBody.position.set(detailX + 48, colY + 168);
    this.contentContainer.addChild(descBody);

    // Metrics Row (Quality, Research Value, Status)
    const metricsY = colY + 312;
    const metricCols = [
      { label: 'DATA QUALITY', val: activeFinding.dataQuality, color: UI_COLORS.CYAN },
      { label: 'ABSTRACT VALUE', val: `${activeFinding.researchValue} PTS`, color: UI_COLORS.AMBER },
      { label: 'ANALYSIS STATUS', val: activeFinding.analysisStatus, color: UI_COLORS.GREEN },
      { label: 'MISSION ORIGIN', val: activeFinding.missionId, color: UI_COLORS.TEXT_PRIMARY },
    ];

    const mWidth = Math.floor((detailWidth - 64 - 36) / 4);
    metricCols.forEach((m, i) => {
      const mx = detailX + 32 + i * (mWidth + 12);
      const mBox = new Graphics();
      mBox.roundRect(mx, metricsY, mWidth, 54, UI_RADIUS.SM);
      mBox.fill({ color: UI_COLORS.BG_GLASS, alpha: 0.6 });
      mBox.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });
      this.contentContainer.addChild(mBox);

      const mLbl = new Text({
        text: m.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      mLbl.position.set(mx + 12, metricsY + 8);
      this.contentContainer.addChild(mLbl);

      const mVal = new Text({
        text: m.val,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: m.color,
        }),
      });
      mVal.position.set(mx + 12, metricsY + 26);
      this.contentContainer.addChild(mVal);
    });

    // Analysis Progress Bar
    const progY = colY + 386;
    const progLabel = new Text({
      text: 'SPECTROSCOPIC & COMPUTATIONAL ANALYSIS PROGRESS:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    progLabel.position.set(detailX + 32, progY);
    this.contentContainer.addChild(progLabel);

    const progressBar = new UIProgressBar({
      width: detailWidth - 64,
      height: 14,
      fillColor: UI_COLORS.CYAN,
      showPercent: true,
      initialValue: activeFinding.analysisProgress / 100,
    });
    progressBar.container.position.set(detailX + 32, progY + 24);
    this.contentContainer.addChild(progressBar.container);

    // Interactive Action Controls
    const btnY = colY + 440;
    const canAnalyse = activeFinding.analysisProgress < 100;
    const analyseBtn = new UIButton({
      label: !canAnalyse ? 'ANALYSIS COMPLETE' : 'ADVANCE ANALYSIS (+25%)',
      variant: !canAnalyse ? 'OUTLINE' : 'PRIMARY',
      width: 220,
      height: 36,
      disabled: !canAnalyse,
      onClick: () => {
        try {
          this.manager.analyseFinding(activeFinding.id, 25);
          this.showFeedback(`Analysis advanced for "${activeFinding.name}"!`);
          this.refreshContent();
        } catch (err: any) {
          this.showFeedback(err.message, true);
        }
      },
    });
    analyseBtn.container.position.set(detailX + 32, btnY);
    this.contentContainer.addChild(analyseBtn.container);

    const canVerify = activeFinding.analysisStatus === AnalysisStatus.ANALYSED;
    const verifyBtn = new UIButton({
      label: 'PEER VERIFICATION',
      variant: 'SECONDARY',
      width: 180,
      height: 36,
      disabled: !canVerify,
      onClick: () => {
        try {
          this.manager.verifyFinding(activeFinding.id);
          this.showFeedback(`Finding "${activeFinding.name}" verified!`);
          this.refreshContent();
        } catch (err: any) {
          this.showFeedback(err.message, true);
        }
      },
    });
    verifyBtn.container.position.set(detailX + 264, btnY);
    this.contentContainer.addChild(verifyBtn.container);

    // Related Discoveries
    const relY = colY + 500;
    const relLabel = new Text({
      text: 'CROSS-REFERENCED / RELATED DISCOVERIES:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    relLabel.position.set(detailX + 32, relY);
    this.contentContainer.addChild(relLabel);

    if (activeFinding.relatedFindingIds.length === 0) {
      const noRel = new Text({
        text: 'No associated observations mapped.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      noRel.position.set(detailX + 32, relY + 22);
      this.contentContainer.addChild(noRel);
    } else {
      activeFinding.relatedFindingIds.forEach((relId, rIdx) => {
        const related = this.manager.getScientificFinding(relId);
        if (related) {
          const rBtn = new UIButton({
            label: related.name.length > 28 ? related.name.substring(0, 25) + '...' : related.name,
            variant: 'OUTLINE',
            width: 260,
            height: 28,
            onClick: () => {
              this.selectedFindingId = related.id;
              this.refreshContent();
            },
          });
          rBtn.container.position.set(detailX + 32 + rIdx * 272, relY + 22);
          this.contentContainer.addChild(rBtn.container);
        }
      });
    }
  }

  // ─── TAB 3: Research Projects & Technology Progression ───────────────────────

  private renderResearchTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    const projects = this.manager.listResearchProjects();

    const title = new Text({
      text: 'AGENCY RESEARCH DIRECTIVES & APPLIED TECHNOLOGY PROJECTS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.2,
      }),
    });
    title.position.set(startX, startY);
    this.contentContainer.addChild(title);

    // Scrollable / structured list of research project cards
    const rowHeight = 120;
    projects.slice(0, 4).forEach((project, idx) => {
      const cardY = startY + 36 + idx * (rowHeight + 14);

      const card = new Graphics();
      card.roundRect(startX, cardY, usableWidth, rowHeight, UI_RADIUS.MD);
      card.fill({
        color: project.status === ResearchProjectStatus.COMPLETED ? 0x06281e : UI_COLORS.BG_SURFACE,
        alpha: 0.85,
      });
      card.stroke({
        color:
          project.status === ResearchProjectStatus.COMPLETED
            ? UI_COLORS.GREEN
            : project.status === ResearchProjectStatus.IN_PROGRESS
              ? UI_COLORS.BORDER_FOCUS
              : UI_COLORS.BORDER_SUBTLE,
        width: 1.5,
      });
      this.contentContainer.addChild(card);

      // Status indicator tag
      const statusText = new Text({
        text: project.status,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill:
            project.status === ResearchProjectStatus.COMPLETED
              ? UI_COLORS.GREEN
              : project.status === ResearchProjectStatus.IN_PROGRESS
                ? UI_COLORS.CYAN
                : UI_COLORS.TEXT_MUTED,
        }),
      });
      statusText.position.set(startX + 24, cardY + 16);
      this.contentContainer.addChild(statusText);

      // Project title
      const pTitle = new Text({
        text: project.title,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      pTitle.position.set(startX + 180, cardY + 14);
      this.contentContainer.addChild(pTitle);

      // Project description
      const pDesc = new Text({
        text: project.description,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          lineHeight: 15,
          wordWrap: true,
          wordWrapWidth: usableWidth - 360,
        }),
      });
      pDesc.position.set(startX + 24, cardY + 40);
      this.contentContainer.addChild(pDesc);

      // Prerequisites breakdown
      const missing = this.manager.getMissingRequirements(project.id);
      const reqText = new Text({
        text:
          missing.length === 0
            ? '✓ ALL SCIENTIFIC REQUIREMENTS SATISFIED'
            : `REQUIREMENTS: ${project.requiredFindingIds.length - missing.length}/${project.requiredFindingIds.length} FINDINGS ANALYSED (MISSING: ${missing.length})`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: missing.length === 0 ? UI_COLORS.TEXT_SUCCESS : UI_COLORS.TEXT_WARNING,
        }),
      });
      reqText.position.set(startX + 24, cardY + 92);
      this.contentContainer.addChild(reqText);

      // Rewards & Unlocks summary
      const rewardText = new Text({
        text: `REWARDS: +${project.rewards.researchData} RESEARCH DATA // +${project.rewards.technologyPoints} TP // $₵${project.rewards.credits.toLocaleString()}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      rewardText.position.set(startX + 400, cardY + 92);
      this.contentContainer.addChild(rewardText);

      // Progress bar
      const pBar = new UIProgressBar({
        width: 180,
        height: 10,
        fillColor: UI_COLORS.CYAN,
        showPercent: true,
        initialValue: project.progress / 100,
      });
      pBar.container.position.set(startX + usableWidth - 340, cardY + 36);
      this.contentContainer.addChild(pBar.container);

      // Action button
      const canComplete = missing.length === 0 && project.status !== ResearchProjectStatus.COMPLETED;
      const actBtn = new UIButton({
        label:
          project.status === ResearchProjectStatus.COMPLETED
            ? 'COMPLETED'
            : canComplete
              ? 'FINALIZE RESEARCH'
              : 'INCOMPLETE DATA',
        variant: canComplete ? 'PRIMARY' : 'OUTLINE',
        width: 140,
        height: 32,
        disabled: !canComplete,
        onClick: () => {
          try {
            this.manager.completeResearchProject(project.id);
            this.showFeedback(`Research Project "${project.title}" completed! Rewards granted.`);
            this.refreshContent();
          } catch (err: any) {
            this.showFeedback(err.message, true);
          }
        },
      });
      actBtn.container.position.set(startX + usableWidth - 160, cardY + 44);
      this.contentContainer.addChild(actBtn.container);
    });
  }

  // ─── TAB 4: Comparative Science Lab ──────────────────────────────────────────

  private renderComparisonTab(): void {
    const startY = 152;
    const startX = 48;
    const usableWidth = this.width - 96;

    const title = new Text({
      text: 'COMPARATIVE PLANETARY SCIENCE & ISOTOPIC CROSS-ANALYSIS LAB',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
        letterSpacing: 1.2,
      }),
    });
    title.position.set(startX, startY);
    this.contentContainer.addChild(title);

    // Instructions note
    const note = new Text({
      text: 'Select two distinct planetary findings to inspect compositional divergence, shared geological processes, and solar system evolution parallels.',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_MUTED,
      }),
    });
    note.position.set(startX, startY + 24);
    this.contentContainer.addChild(note);

    const findings = this.manager.listScientificFindings();
    if (!this.compareIdA && findings[0]) this.compareIdA = findings[0].id;
    if (!this.compareIdB && findings[1]) this.compareIdB = findings[1].id;

    const halfWidth = Math.floor((usableWidth - 24) / 2);
    const boxY = startY + 64;
    const boxHeight = 520;

    // Left Finding Card
    const panelA = new Graphics();
    panelA.roundRect(startX, boxY, halfWidth, boxHeight, UI_RADIUS.MD);
    panelA.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.8 });
    panelA.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(panelA);

    const fA = this.compareIdA ? this.manager.getScientificFinding(this.compareIdA) : null;
    if (fA) {
      this.renderComparisonItem(fA, startX + 24, boxY + 24, halfWidth - 48, (newId) => {
        this.compareIdA = newId;
        this.refreshContent();
      });
    }

    // Right Finding Card
    const rightX = startX + halfWidth + 24;
    const panelB = new Graphics();
    panelB.roundRect(rightX, boxY, halfWidth, boxHeight, UI_RADIUS.MD);
    panelB.fill({ color: UI_COLORS.BG_SURFACE, alpha: 0.8 });
    panelB.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.contentContainer.addChild(panelB);

    const fB = this.compareIdB ? this.manager.getScientificFinding(this.compareIdB) : null;
    if (fB) {
      this.renderComparisonItem(fB, rightX + 24, boxY + 24, halfWidth - 48, (newId) => {
        this.compareIdB = newId;
        this.refreshContent();
      });
    }
  }

  private renderComparisonItem(
    finding: ScientificFinding,
    x: number,
    y: number,
    w: number,
    onSelectOther: (id: string) => void
  ): void {
    const fTitle = new Text({
      text: finding.name,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    fTitle.position.set(x, y);
    this.contentContainer.addChild(fTitle);

    const fMeta = new Text({
      text: `${SCIENTIFIC_CATEGORY_LABELS[finding.category]} // ${finding.destinationId.replace('DEST_', '')}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_HIGHLIGHT,
      }),
    });
    fMeta.position.set(x, y + 26);
    this.contentContainer.addChild(fMeta);

    const fDesc = new Text({
      text: finding.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        lineHeight: 18,
        wordWrap: true,
        wordWrapWidth: w,
      }),
    });
    fDesc.position.set(x, y + 58);
    this.contentContainer.addChild(fDesc);

    // Quick selection buttons to switch candidate
    const switchLabel = new Text({
      text: 'CYCLE COMPARISON CANDIDATE:',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      }),
    });
    switchLabel.position.set(x, y + 360);
    this.contentContainer.addChild(switchLabel);

    const all = this.manager.listScientificFindings();
    all.slice(0, 3).forEach((candidate, i) => {
      const btn = new UIButton({
        label: candidate.name.length > 20 ? candidate.name.substring(0, 18) + '...' : candidate.name,
        variant: candidate.id === finding.id ? 'PRIMARY' : 'OUTLINE',
        width: 140,
        height: 26,
        onClick: () => onSelectOther(candidate.id),
      });
      btn.container.position.set(x + i * 148, y + 384);
      this.contentContainer.addChild(btn.container);
    });
  }
}
