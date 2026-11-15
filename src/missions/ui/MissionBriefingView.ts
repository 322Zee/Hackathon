/**
 * @file MissionBriefingView.ts
 * @description Master tactical mission briefing interface for the Mission Operations Centre.
 * Displays 10-section comprehensive briefings including scientific rationale, objectives,
 * planetary telemetry, equipment requirements, engineering trade-offs, and mission acceptance.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { UIButton } from '../../ui/components/UIButton';
import { DestinationId } from '../../destinations/DestinationTypes';
import { DestinationRegistry } from '../../destinations/DestinationRegistry';
import {
  MissionDefinition,
} from '../MissionTypes';
import { MissionCatalogueRegistry } from '../MissionCatalogueRegistry';
import {
  MissionBriefingModel,
  createMissionBriefingModel,
} from '../MissionBriefingModel';
import { NotificationManager } from '../../ui/notifications/NotificationManager';

export enum BriefingSectionTab {
  OVERVIEW_OBJECTIVES = 'OVERVIEW_OBJECTIVES',
  DESTINATION_ENVIRONMENT = 'DESTINATION_ENVIRONMENT',
  ENGINEERING_CONSTRAINTS = 'ENGINEERING_CONSTRAINTS',
  PREREQUISITES_BUDGET = 'PREREQUISITES_BUDGET',
}

export interface MissionBriefingViewOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onReturnToCatalogue?: () => void;
  onMissionAccepted?: (mission: MissionDefinition) => void;
  onProceedToVehicleAssembly?: (mission: MissionDefinition) => void;
  onViewOnSolarMap?: (destinationId: DestinationId) => void;
}

export class MissionBriefingView extends UIComponent {
  private viewWidth: number;
  private viewHeight: number;
  private catalogueRegistry: MissionCatalogueRegistry;
  private destinationRegistry: DestinationRegistry;

  private backgroundGfx: Graphics;
  private headerContainer: Container;
  private tabNavContainer: Container;
  private contentContainer: Container;
  private footerActionContainer: Container;

  private currentMission: MissionDefinition | null = null;
  private currentModel: MissionBriefingModel | null = null;
  private activeTab: BriefingSectionTab = BriefingSectionTab.OVERVIEW_OBJECTIVES;

  private onReturnToCatalogueCb?: () => void;
  private onMissionAcceptedCb?: (mission: MissionDefinition) => void;
  private onProceedToVehicleAssemblyCb?: (mission: MissionDefinition) => void;
  private onViewOnSolarMapCb?: (destinationId: DestinationId) => void;

  private acceptBtn?: UIButton;
  private proceedVabBtn?: UIButton;

  constructor(options: MissionBriefingViewOptions = {}) {
    super('MissionBriefingView');

    this.viewWidth = options.width ?? 1860;
    this.viewHeight = options.height ?? 920;
    this.container.position.set(options.x ?? 30, options.y ?? 130);

    this.catalogueRegistry = MissionCatalogueRegistry.getInstance();
    this.destinationRegistry = DestinationRegistry.getInstance();

    this.onReturnToCatalogueCb = options.onReturnToCatalogue;
    this.onMissionAcceptedCb = options.onMissionAccepted;
    this.onProceedToVehicleAssemblyCb = options.onProceedToVehicleAssembly;
    this.onViewOnSolarMapCb = options.onViewOnSolarMap;

    // 1. Background frame
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    // 2. Header Container (Top bar: 65px)
    this.headerContainer = new Container();
    this.headerContainer.position.set(UI_SPACING.LG, UI_SPACING.MD);
    this.container.addChild(this.headerContainer);

    // 3. Tab Navigation Container (Section selector: 40px)
    this.tabNavContainer = new Container();
    this.tabNavContainer.position.set(UI_SPACING.LG, 75);
    this.container.addChild(this.tabNavContainer);

    // 4. Main Content Container
    this.contentContainer = new Container();
    this.contentContainer.position.set(UI_SPACING.LG, 125);
    this.container.addChild(this.contentContainer);

    // 5. Footer Action Container
    this.footerActionContainer = new Container();
    this.footerActionContainer.position.set(UI_SPACING.LG, this.viewHeight - 55);
    this.container.addChild(this.footerActionContainer);

    this.renderFrame();
  }

  public setMission(mission: MissionDefinition): void {
    this.currentMission = mission;
    this.currentModel = createMissionBriefingModel(
      mission,
      this.catalogueRegistry,
      this.destinationRegistry
    );
    this.activeTab = BriefingSectionTab.OVERVIEW_OBJECTIVES;
    this.refreshAll();
  }

  public getMission(): MissionDefinition | null {
    return this.currentMission;
  }

  public getBriefingModel(): MissionBriefingModel | null {
    return this.currentModel;
  }

  public getActiveTab(): BriefingSectionTab {
    return this.activeTab;
  }

  public setActiveTab(tab: BriefingSectionTab): void {
    this.activeTab = tab;
    this.renderTabNav();
    this.renderCurrentTabContent();
  }

  private refreshAll(): void {
    if (!this.currentModel || !this.currentMission) return;
    this.renderHeader();
    this.renderTabNav();
    this.renderCurrentTabContent();
    this.renderFooterActions();
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();
    this.backgroundGfx.roundRect(0, 0, this.viewWidth, this.viewHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x020713, alpha: 0.98 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Decorative top accent strip
    this.backgroundGfx.rect(0, 0, this.viewWidth, 3).fill({ color: UI_COLORS.CYAN, alpha: 0.9 });
  }

  // =========================================================================
  // 1. TOP COMMAND & HEADER BAR
  // =========================================================================
  private renderHeader(): void {
    this.headerContainer.removeChildren();
    if (!this.currentModel) return;

    const m = this.currentModel;

    // Back button
    const backBtn = new UIButton({
      label: '◀ RETURN TO CATALOGUE',
      variant: 'OUTLINE',
      width: 210,
      height: 36,
      onClick: () => {
        if (this.onReturnToCatalogueCb) {
          this.onReturnToCatalogueCb();
        }
      },
    });
    this.headerContainer.addChild(backBtn.container);

    // Title & ID
    const titleText = new Text({
      text: `${m.shortCode} // ${m.name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 16,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.5,
      }),
    });
    titleText.position.set(230, 8);
    this.headerContainer.addChild(titleText);

    // Badges strip
    const badgesY = 34;
    const catText = new Text({
      text: `[${m.category}]  •  TARGET: ${m.destination.name.toUpperCase()}  •  DIFFICULTY: ${m.difficulty} (LVL ${m.sequenceLevel})  •  EST: ${m.estimatedDurationDays} DAYS`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.0,
      }),
    });
    catText.position.set(230, badgesY);
    this.headerContainer.addChild(catText);

    // Operational Status Badge (Top-Right)
    let statusLabel = '[STATUS: AVAILABLE FOR FLIGHT MANIFEST]';
    let statusColor: number = UI_COLORS.GREEN;

    if (m.isCompleted) {
      statusLabel = '✓ STATUS: MISSION COMPLETED';
      statusColor = UI_COLORS.CYAN;
    } else if (m.isActive) {
      statusLabel = '● STATUS: ACTIVE // PREPARING IN VAB';
      statusColor = UI_COLORS.AMBER;
    } else if (!m.isAvailable) {
      statusLabel = '🔒 STATUS: PREREQUISITES REQUIRED';
      statusColor = 0xef4444;
    }

    const statBadge = new Text({
      text: statusLabel,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: statusColor,
        letterSpacing: 1.0,
      }),
    });
    statBadge.anchor.set(1, 0);
    statBadge.position.set(this.viewWidth - UI_SPACING.LG * 2 - 20, 10);
    this.headerContainer.addChild(statBadge);
  }

  // =========================================================================
  // 2. TAB NAVIGATION BAR
  // =========================================================================
  private renderTabNav(): void {
    this.tabNavContainer.removeChildren();

    const tabs: { id: BriefingSectionTab; label: string }[] = [
      { id: BriefingSectionTab.OVERVIEW_OBJECTIVES, label: '1. OVERVIEW & OBJECTIVES' },
      { id: BriefingSectionTab.DESTINATION_ENVIRONMENT, label: '2. DESTINATION & ENVIRONMENT' },
      { id: BriefingSectionTab.ENGINEERING_CONSTRAINTS, label: '3. ENGINEERING & CONSTRAINTS' },
      { id: BriefingSectionTab.PREREQUISITES_BUDGET, label: '4. PREREQUISITES & BUDGET' },
    ];

    let currentX = 0;
    const tabWidth = 280;
    const tabHeight = 32;

    for (const t of tabs) {
      const isSelected = this.activeTab === t.id;
      const tabBg = new Graphics();
      tabBg.roundRect(0, 0, tabWidth, tabHeight, UI_RADIUS.SM);
      tabBg.fill({ color: isSelected ? 0x0f233f : 0x060f1e, alpha: 0.9 });
      tabBg.stroke({
        color: isSelected ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE,
        width: isSelected ? 1.5 : 1.0,
      });

      const tabText = new Text({
        text: t.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10.5,
          fontWeight: isSelected ? 'bold' : 'normal',
          fill: isSelected ? UI_COLORS.CYAN : UI_COLORS.TEXT_SECONDARY,
          letterSpacing: 1.0,
        }),
      });
      tabText.position.set(12, 8);

      const tabBtn = new Container();
      tabBtn.position.set(currentX, 0);
      tabBtn.eventMode = 'static';
      tabBtn.cursor = 'pointer';
      tabBtn.addChild(tabBg);
      tabBtn.addChild(tabText);

      tabBtn.on('pointerdown', () => {
        this.setActiveTab(t.id);
      });

      this.tabNavContainer.addChild(tabBtn);
      currentX += tabWidth + 12;
    }
  }

  // =========================================================================
  // 3. TAB CONTENT ROUTING
  // =========================================================================
  private renderCurrentTabContent(): void {
    this.contentContainer.removeChildren();
    if (!this.currentModel) return;

    switch (this.activeTab) {
      case BriefingSectionTab.OVERVIEW_OBJECTIVES:
        this.renderOverviewAndObjectivesTab();
        break;
      case BriefingSectionTab.DESTINATION_ENVIRONMENT:
        this.renderDestinationEnvironmentTab();
        break;
      case BriefingSectionTab.ENGINEERING_CONSTRAINTS:
        this.renderEngineeringConstraintsTab();
        break;
      case BriefingSectionTab.PREREQUISITES_BUDGET:
        this.renderPrerequisitesBudgetTab();
        break;
    }
  }

  // =========================================================================
  // TAB 1: OVERVIEW & OBJECTIVES
  // =========================================================================
  private renderOverviewAndObjectivesTab(): void {
    const m = this.currentModel!;
    const cardHeight = 720;

    // LEFT CARD: Mission Overview, Scientific Purpose, Completion Conditions (Width: 620px)
    const leftGfx = new Graphics();
    leftGfx.roundRect(0, 0, 620, cardHeight, UI_RADIUS.SM);
    leftGfx.fill({ color: 0x040b18, alpha: 0.95 });
    leftGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(leftGfx);

    // Section 1 Header: Mission Overview
    const s1Header = new Text({
      text: '// SECTION 1: MISSION OVERVIEW //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s1Header.position.set(16, 14);
    this.contentContainer.addChild(s1Header);

    const summaryText = new Text({
      text: m.summary,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: 588,
        lineHeight: 18,
      }),
    });
    summaryText.position.set(16, 38);
    this.contentContainer.addChild(summaryText);

    // Section 2 Header: Scientific Purpose & Rationale
    const s2Header = new Text({
      text: '// SECTION 2: SCIENTIFIC PURPOSE & RATIONALE //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s2Header.position.set(16, 125);
    this.contentContainer.addChild(s2Header);

    const sciQuestion = new Text({
      text: `PRIMARY RESEARCH INQUIRY:\n${m.scientificQuestion}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: 588,
        lineHeight: 17,
      }),
    });
    sciQuestion.position.set(16, 150);
    this.contentContainer.addChild(sciQuestion);

    const sciContext = new Text({
      text: `AEROSPACE CONTEXT & LEARNING:\n${m.scientificContext}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fill: UI_COLORS.TEXT_MUTED,
        wordWrap: true,
        wordWrapWidth: 588,
        lineHeight: 17,
      }),
    });
    sciContext.position.set(16, 235);
    this.contentContainer.addChild(sciContext);

    // Section 10: Completion & Failure Conditions
    const s10Header = new Text({
      text: '// SECTION 10: FLIGHT SUCCESS & FAILURE CRITERIA //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s10Header.position.set(16, 390);
    this.contentContainer.addChild(s10Header);

    const successTitle = new Text({
      text: 'SUCCESS CRITERIA (MANDATORY):',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.GREEN }),
    });
    successTitle.position.set(16, 415);
    this.contentContainer.addChild(successTitle);

    let succY = 435;
    for (const sc of m.successCriteria) {
      const scText = new Text({
        text: `✓ ${sc}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_PRIMARY, wordWrap: true, wordWrapWidth: 588, lineHeight: 16 }),
      });
      scText.position.set(24, succY);
      this.contentContainer.addChild(scText);
      succY += 32;
    }

    const failTitle = new Text({
      text: 'CRITICAL FAILURE TRIGGERS:',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fontWeight: 'bold', fill: 0xef4444 }),
    });
    failTitle.position.set(16, 540);
    this.contentContainer.addChild(failTitle);

    let failY = 560;
    for (const fc of m.failureConditions) {
      const fcText = new Text({
        text: `✖ ${fc}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 588, lineHeight: 16 }),
      });
      fcText.position.set(24, failY);
      this.contentContainer.addChild(fcText);
      failY += 32;
    }

    // RIGHT CARD: Primary & Optional Objectives (Width: 1180px)
    const rightGfx = new Graphics();
    rightGfx.roundRect(640, 0, 1180, cardHeight, UI_RADIUS.SM);
    rightGfx.fill({ color: 0x040b18, alpha: 0.95 });
    rightGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(rightGfx);

    // Primary Objectives Header
    const objHeader = new Text({
      text: `// SECTION 3: PRIMARY OBJECTIVES (${m.primaryObjectives.length} REQUIRED) //`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    objHeader.position.set(656, 14);
    this.contentContainer.addChild(objHeader);

    let currentObjY = 40;
    for (let i = 0; i < m.primaryObjectives.length; i++) {
      const obj = m.primaryObjectives[i]!;
      const rowBox = new Graphics();
      rowBox.roundRect(656, currentObjY, 1148, 80, UI_RADIUS.SM);
      rowBox.fill({ color: 0x07152a, alpha: 0.9 });
      rowBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

      // Left accent: Green for delivery, Purple for exploration, Amber for both
      let accentColor: number = UI_COLORS.GREEN;
      if (obj.isExploration && !obj.isDelivery) accentColor = UI_COLORS.PURPLE;
      else if (obj.isExploration && obj.isDelivery) accentColor = UI_COLORS.AMBER;

      rowBox.rect(656, currentObjY, 4, 80);
      rowBox.fill({ color: accentColor });
      this.contentContainer.addChild(rowBox);

      const titleStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11.5,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      });
      const tText = new Text({
        text: `OBJ ${i + 1}: ${obj.title.toUpperCase()}  [${obj.type}]`,
        style: titleStyle,
      });
      tText.position.set(672, currentObjY + 10);
      this.contentContainer.addChild(tText);

      const dStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: 860,
      });
      const dText = new Text({
        text: obj.description,
        style: dStyle,
      });
      dText.position.set(672, currentObjY + 32);
      this.contentContainer.addChild(dText);

      const cStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fill: UI_COLORS.CYAN,
      });
      const cText = new Text({
        text: `Target Condition: ${obj.conditionText}`,
        style: cStyle,
      });
      cText.position.set(672, currentObjY + 54);
      this.contentContainer.addChild(cText);

      // Status indicator on right
      const statColor: number = obj.isCompleted ? UI_COLORS.GREEN : UI_COLORS.AMBER;
      const statusBadge = new Text({
        text: obj.isCompleted ? '✓ SATISFIED' : '● PENDING FLIGHT',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: statColor,
        }),
      });
      statusBadge.anchor.set(1, 0);
      statusBadge.position.set(656 + 1130, currentObjY + 12);
      this.contentContainer.addChild(statusBadge);

      currentObjY += 92;
    }

    // Optional Objectives Header
    currentObjY += 15;
    const optHeader = new Text({
      text: `// SECTION 4: OPTIONAL OBJECTIVES (${m.optionalObjectives.length} CONFIGURED) //`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 1.5,
      }),
    });
    optHeader.position.set(656, currentObjY);
    this.contentContainer.addChild(optHeader);

    currentObjY += 26;
    if (m.optionalObjectives.length === 0) {
      const noOptText = new Text({
        text: 'No optional secondary objectives configured for this flight. Standard telemetry completion awards full rewards.',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_MUTED }),
      });
      noOptText.position.set(656, currentObjY);
      this.contentContainer.addChild(noOptText);
    } else {
      for (const opt of m.optionalObjectives) {
        const optBox = new Graphics();
        optBox.roundRect(656, currentObjY, 1148, 70, UI_RADIUS.SM);
        optBox.fill({ color: 0x051020, alpha: 0.85 });
        optBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
        optBox.rect(656, currentObjY, 4, 70).fill({ color: UI_COLORS.AMBER });
        this.contentContainer.addChild(optBox);

        const oTitle = new Text({
          text: `OPTIONAL: ${opt.title.toUpperCase()}`,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
        });
        oTitle.position.set(672, currentObjY + 10);
        this.contentContainer.addChild(oTitle);

        const oDesc = new Text({
          text: opt.description,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_SECONDARY }),
        });
        oDesc.position.set(672, currentObjY + 30);
        this.contentContainer.addChild(oDesc);

        const oRew = new Text({
          text: `Bonus Yield: ${opt.bonusRewardsSummary}`,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fill: UI_COLORS.GREEN }),
        });
        oRew.position.set(672, currentObjY + 48);
        this.contentContainer.addChild(oRew);

        currentObjY += 80;
      }
    }
  }

  // =========================================================================
  // TAB 2: DESTINATION & ENVIRONMENT
  // =========================================================================
  private renderDestinationEnvironmentTab(): void {
    const m = this.currentModel!;
    const cardHeight = 720;
    const dest = m.destination;

    // LEFT CARD: Celestial Specifications (Width: 880px)
    const leftGfx = new Graphics();
    leftGfx.roundRect(0, 0, 880, cardHeight, UI_RADIUS.SM);
    leftGfx.fill({ color: 0x040b18, alpha: 0.95 });
    leftGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(leftGfx);

    const s5Header = new Text({
      text: `// SECTION 5: DESTINATION TELEMETRY // ${dest.name.toUpperCase()} //`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s5Header.position.set(16, 14);
    this.contentContainer.addChild(s5Header);

    // Specs Grid
    const specs: { label: string; value: string }[] = [
      { label: 'CELESTIAL CATEGORY', value: dest.category },
      { label: 'ENVIRONMENTAL CLASS', value: dest.environment },
      { label: 'SURFACE CLASSIFICATION', value: dest.surfaceClassification },
      { label: 'SURFACE GRAVITY', value: `${dest.surfaceGravityMps2.toFixed(2)} m/s²  (${dest.surfaceGravityG.toFixed(2)}g)` },
      { label: 'SURFACE TEMPERATURE', value: `${dest.surfaceTempCelsius.min}°C to ${dest.surfaceTempCelsius.max}°C (${dest.surfaceTempKelvin.min}K–${dest.surfaceTempKelvin.max}K)` },
      { label: 'ATMOSPHERIC PRESSURE', value: `${dest.atmosphericPressureAtm.toFixed(3)} atm` },
      { label: 'ATMOSPHERIC COMPOSITION', value: dest.atmosphericComposition },
      { label: 'RADIATION HAZARD LEVEL', value: dest.radiationRating },
      { label: 'ONE-WAY COMM LATENCY', value: `${dest.communicationLatencySec.toFixed(2)} seconds` },
      { label: 'DSN RELAY REQUIRED', value: dest.dsnRelayRequired ? 'YES (Deep Space Network)' : 'NO (Direct Local Link)' },
    ];

    let gridY = 48;
    for (const spec of specs) {
      const row = new Graphics();
      row.roundRect(16, gridY, 848, 44, UI_RADIUS.SM);
      row.fill({ color: 0x061122, alpha: 0.8 });
      row.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.contentContainer.addChild(row);

      const lbl = new Text({
        text: spec.label,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.TEXT_MUTED, letterSpacing: 1.0 }),
      });
      lbl.position.set(30, gridY + 13);
      this.contentContainer.addChild(lbl);

      const val = new Text({
        text: spec.value,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      val.position.set(300, gridY + 13);
      this.contentContainer.addChild(val);

      gridY += 52;
    }

    // RIGHT CARD: Surface Access & Exploration Limitations (Width: 920px)
    const rightGfx = new Graphics();
    rightGfx.roundRect(900, 0, 920, cardHeight, UI_RADIUS.SM);
    rightGfx.fill({ color: 0x040b18, alpha: 0.95 });
    rightGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(rightGfx);

    const safeHeader = new Text({
      text: '// SURFACE SAFETY & OPERATIONAL LIMITATIONS //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    safeHeader.position.set(916, 14);
    this.contentContainer.addChild(safeHeader);

    // Surface access verdict box
    const verdictBox = new Graphics();
    verdictBox.roundRect(916, 48, 888, 110, UI_RADIUS.SM);
    verdictBox.fill({ color: dest.surfaceAccess.allowed ? 0x062419 : 0x240909, alpha: 0.9 });
    verdictBox.stroke({ color: dest.surfaceAccess.allowed ? UI_COLORS.GREEN : 0xef4444, width: 1.2 });
    this.contentContainer.addChild(verdictBox);

    const verdictTitle = new Text({
      text: dest.surfaceAccess.allowed
        ? '✦ SOLID SURFACE ACCESS AUTHORIZED'
        : '✖ OPEN SURFACE ACCESS PROHIBITED',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: dest.surfaceAccess.allowed ? UI_COLORS.GREEN : 0xef4444,
        letterSpacing: 1.5,
      }),
    });
    verdictTitle.position.set(936, 62);
    this.contentContainer.addChild(verdictTitle);

    const verdictDesc = new Text({
      text: dest.surfaceAccess.allowed
        ? 'This celestial body features a solid exterior surface supporting soft-touchdown landers, mobility rovers, and sample extractions.'
        : dest.surfaceAccess.rejectionReason || 'No solid surface available. Spacecraft must operate via orbital insertion or atmospheric descent probes.',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: 840,
        lineHeight: 18,
      }),
    });
    verdictDesc.position.set(936, 88);
    this.contentContainer.addChild(verdictDesc);

    // Specialized equipment notice
    const specEqHeader = new Text({
      text: 'SPECIALIZED SURVIVAL EQUIPMENT & OPERATIONAL LIMITS:',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    specEqHeader.position.set(916, 180);
    this.contentContainer.addChild(specEqHeader);

    let eqY = 208;
    const eqList = dest.surfaceAccess.specializedEquipmentRequired || ['Standard multi-layer thermal blankets and micrometeorite shielding.'];
    for (const eq of eqList) {
      const eqTxt = new Text({
        text: `▲ ${eq}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 880 }),
      });
      eqTxt.position.set(926, eqY);
      this.contentContainer.addChild(eqTxt);
      eqY += 28;
    }

    if (dest.surfaceAccess.operationalLimitHours) {
      const limTxt = new Text({
        text: `⏱ MAXIMUM OPERATIONAL SURFACE DURATION: ${dest.surfaceAccess.operationalLimitHours.toFixed(1)} Hours (Thermal/Pressure Decay Limit)`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
      });
      limTxt.position.set(926, eqY + 8);
      this.contentContainer.addChild(limTxt);
    }

    // View on solar map button
    const mapBtn = new UIButton({
      label: 'VIEW ON SOLAR SYSTEM MAP',
      variant: 'SECONDARY',
      width: 260,
      height: 38,
      onClick: () => {
        if (this.onViewOnSolarMapCb) {
          this.onViewOnSolarMapCb(dest.id);
        }
      },
    });
    mapBtn.container.position.set(916, cardHeight - 60);
    this.contentContainer.addChild(mapBtn.container);
  }

  // =========================================================================
  // TAB 3: ENGINEERING CONSTRAINTS & TRADE-OFFS
  // =========================================================================
  private renderEngineeringConstraintsTab(): void {
    const m = this.currentModel!;
    const cardHeight = 720;

    // LEFT CARD: Spacecraft & Payload Equipment (Width: 880px)
    const leftGfx = new Graphics();
    leftGfx.roundRect(0, 0, 880, cardHeight, UI_RADIUS.SM);
    leftGfx.fill({ color: 0x040b18, alpha: 0.95 });
    leftGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(leftGfx);

    const s6Header = new Text({
      text: '// SECTION 6: SPACECRAFT & PAYLOAD EQUIPMENT REQUIREMENTS //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s6Header.position.set(16, 14);
    this.contentContainer.addChild(s6Header);

    // Platform card
    const platBox = new Graphics();
    platBox.roundRect(16, 42, 848, 64, UI_RADIUS.SM);
    platBox.fill({ color: 0x07152a, alpha: 0.9 });
    platBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(platBox);

    const platTitle = new Text({
      text: `DESIGNATED SPACECRAFT CLASS: ${m.spacecraftType}`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    platTitle.position.set(28, 52);
    this.contentContainer.addChild(platTitle);

    const platDesc = new Text({
      text: m.spacecraftDescription,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 820 }),
    });
    platDesc.position.set(28, 74);
    this.contentContainer.addChild(platDesc);

    // Payload card
    const payBox = new Graphics();
    payBox.roundRect(16, 116, 848, 64, UI_RADIUS.SM);
    payBox.fill({ color: 0x07152a, alpha: 0.9 });
    payBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(payBox);

    const payTitle = new Text({
      text: `PAYLOAD TYPE: ${m.payloadType}`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.GREEN }),
    });
    payTitle.position.set(28, 126);
    this.contentContainer.addChild(payTitle);

    const payDesc = new Text({
      text: m.payloadDescription,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 820 }),
    });
    payDesc.position.set(28, 148);
    this.contentContainer.addChild(payDesc);

    // Scientific Instruments list
    const instHeader = new Text({
      text: `REQUIRED SCIENTIFIC INSTRUMENTS (${m.instrumentDetails.length} MANDATORY SENSORS):`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY, letterSpacing: 1.0 }),
    });
    instHeader.position.set(16, 196);
    this.contentContainer.addChild(instHeader);

    let instY = 222;
    for (const inst of m.instrumentDetails) {
      const iBox = new Graphics();
      iBox.roundRect(16, instY, 848, 66, UI_RADIUS.SM);
      iBox.fill({ color: 0x061122, alpha: 0.8 });
      iBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.contentContainer.addChild(iBox);

      const iTitle = new Text({
        text: `✦ ${inst.name.toUpperCase()}  [Power: ${inst.powerConsumptionWatts}W | Mass: ${inst.massKg}kg]`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
      });
      iTitle.position.set(28, instY + 10);
      this.contentContainer.addChild(iTitle);

      const iDesc = new Text({
        text: inst.purpose,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 820 }),
      });
      iDesc.position.set(28, instY + 32);
      this.contentContainer.addChild(iDesc);

      instY += 76;
    }

    // RIGHT CARD: Engineering Constraints & Aerospace Trade-Offs Matrix (Width: 920px)
    const rightGfx = new Graphics();
    rightGfx.roundRect(900, 0, 920, cardHeight, UI_RADIUS.SM);
    rightGfx.fill({ color: 0x040b18, alpha: 0.95 });
    rightGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(rightGfx);

    const s7Header = new Text({
      text: '// SECTION 7: ENGINEERING CONSTRAINTS & TRADE-OFF MATRIX //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s7Header.position.set(916, 14);
    this.contentContainer.addChild(s7Header);

    // Technical Constraints Bar
    const consBox = new Graphics();
    consBox.roundRect(916, 42, 888, 70, UI_RADIUS.SM);
    consBox.fill({ color: 0x06152b, alpha: 0.9 });
    consBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(consBox);

    const c = m.constraints;
    const consSummary = new Text({
      text:
        `MASS: ${c.payloadMassRangeKg.min}–${c.payloadMassRangeKg.max} kg Payload (Dry: ~${Math.round(c.estimatedDryMassKg)} kg)  |  ` +
        `POWER: ${c.powerDemandWatts} W  |  BATTERY: ${c.batteryCapacityWh} Wh\n` +
        `DOWNLINK: ${c.communicationBandwidthKbps} kbps  |  ` +
        `EST. DURATION: ${c.estimatedDurationDays} Days  |  LAUNCH CAP: ${c.launchCostCapCredits.toLocaleString()} CR`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.GREEN,
        lineHeight: 20,
      }),
    });
    consSummary.position.set(930, 52);
    this.contentContainer.addChild(consSummary);

    // Educational Trade-Off Matrix Cards
    const matrixHeader = new Text({
      text: 'AEROSPACE TRADE-OFF ANALYSIS (COMPETING MISSION REQUIREMENTS):',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.AMBER, letterSpacing: 1.0 }),
    });
    matrixHeader.position.set(916, 126);
    this.contentContainer.addChild(matrixHeader);

    let toY = 152;
    for (const to of m.tradeOffs) {
      const tBox = new Graphics();
      tBox.roundRect(916, toY, 888, 128, UI_RADIUS.SM);
      tBox.fill({ color: 0x07152a, alpha: 0.9 });
      tBox.stroke({ color: to.impactLevel === 'CRITICAL' ? UI_COLORS.AMBER : UI_COLORS.BORDER_SUBTLE, width: 1.0 });

      // Accent pill
      tBox.rect(916, toY, 4, 128).fill({ color: to.impactLevel === 'CRITICAL' ? UI_COLORS.AMBER : UI_COLORS.CYAN });
      this.contentContainer.addChild(tBox);

      const tTitle = new Text({
        text: `▲ ${to.title.toUpperCase()}  [${to.impactLevel} DESIGN DRIVER]`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: to.impactLevel === 'CRITICAL' ? UI_COLORS.AMBER : UI_COLORS.CYAN,
        }),
      });
      tTitle.position.set(930, toY + 10);
      this.contentContainer.addChild(tTitle);

      const tDriver = new Text({
        text: `Driver: ${to.driver}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      tDriver.position.set(930, toY + 30);
      this.contentContainer.addChild(tDriver);

      const tCons = new Text({
        text: `Consequence: ${to.consequence}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 860, lineHeight: 15 }),
      });
      tCons.position.set(930, toY + 50);
      this.contentContainer.addChild(tCons);

      const tMit = new Text({
        text: `Engineering Mitigation: ${to.mitigation}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.GREEN, wordWrap: true, wordWrapWidth: 860, lineHeight: 15 }),
      });
      tMit.position.set(930, toY + 92);
      this.contentContainer.addChild(tMit);

      toY += 138;
    }
  }

  // =========================================================================
  // TAB 4: PREREQUISITES & BUDGET
  // =========================================================================
  private renderPrerequisitesBudgetTab(): void {
    const m = this.currentModel!;
    const cardHeight = 720;

    // LEFT CARD: Prerequisites Checklist (Width: 880px)
    const leftGfx = new Graphics();
    leftGfx.roundRect(0, 0, 880, cardHeight, UI_RADIUS.SM);
    leftGfx.fill({ color: 0x040b18, alpha: 0.95 });
    leftGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(leftGfx);

    const s9Header = new Text({
      text: '// SECTION 9: MANDATORY PROGRESSION PREREQUISITES //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s9Header.position.set(16, 14);
    this.contentContainer.addChild(s9Header);

    const p = m.prerequisites;

    const prereqList: { title: string; detail: string; isMet: boolean }[] = [
      {
        title: 'DIRECTOR PROMOTION RANK',
        detail: `Requires Director Rank ${p.requiredRank}`,
        isMet: p.rankMet,
      },
      {
        title: 'DESTINATION CLEARANCE',
        detail: `Target destination "${m.destination.name}" orbital passage authorized`,
        isMet: p.destinationUnlocked,
      },
      {
        title: 'PRIOR MISSION FLIGHT MILESTONES',
        detail:
          p.requiredMissionIds.length === 0
            ? 'No prerequisite mission completions required.'
            : `Required flights: ${p.requiredMissionIds.join(', ')}`,
        isMet: p.missingMissionIds.length === 0,
      },
      {
        title: 'RESEARCHED TECHNOLOGIES',
        detail:
          p.requiredTechIds.length === 0
            ? 'No specific technology node research required.'
            : `Required tech nodes: ${p.requiredTechIds.join(', ')}`,
        isMet: p.missingTechIds.length === 0,
      },
    ];

    let pY = 48;
    for (const item of prereqList) {
      const pBox = new Graphics();
      pBox.roundRect(16, pY, 848, 64, UI_RADIUS.SM);
      pBox.fill({ color: item.isMet ? 0x061924 : 0x220a0a, alpha: 0.9 });
      pBox.stroke({ color: item.isMet ? UI_COLORS.GREEN : 0xef4444, width: 1.0 });
      this.contentContainer.addChild(pBox);

      const pTitle = new Text({
        text: item.title,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: item.isMet ? UI_COLORS.GREEN : 0xef4444,
          letterSpacing: 1.0,
        }),
      });
      pTitle.position.set(30, pY + 12);
      this.contentContainer.addChild(pTitle);

      const pDetail = new Text({
        text: item.detail,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_SECONDARY }),
      });
      pDetail.position.set(30, pY + 34);
      this.contentContainer.addChild(pDetail);

      const statusTag = new Text({
        text: item.isMet ? '✓ SATISFIED' : '✖ UNMET',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: item.isMet ? UI_COLORS.GREEN : 0xef4444,
        }),
      });
      statusTag.anchor.set(1, 0);
      statusTag.position.set(844, pY + 22);
      this.contentContainer.addChild(statusTag);

      pY += 76;
    }

    // Unmet reasons summary box if any
    if (p.unmetReasons.length > 0) {
      const warnBox = new Graphics();
      warnBox.roundRect(16, pY + 10, 848, 120, UI_RADIUS.SM);
      warnBox.fill({ color: 0x1f0808, alpha: 0.95 });
      warnBox.stroke({ color: 0xef4444, width: 1.0 });
      this.contentContainer.addChild(warnBox);

      const wHeader = new Text({
        text: '▲ REASONS PREVENTING MISSION ACCEPTANCE:',
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11, fontWeight: 'bold', fill: 0xef4444 }),
      });
      wHeader.position.set(30, pY + 24);
      this.contentContainer.addChild(wHeader);

      let wY = pY + 48;
      for (const reason of p.unmetReasons) {
        const rTxt = new Text({
          text: `• ${reason}`,
          style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_PRIMARY, wordWrap: true, wordWrapWidth: 800 }),
        });
        rTxt.position.set(40, wY);
        this.contentContainer.addChild(rTxt);
        wY += 22;
      }
    }

    // RIGHT CARD: Budget, Economics & Rewards (Width: 920px)
    const rightGfx = new Graphics();
    rightGfx.roundRect(900, 0, 920, cardHeight, UI_RADIUS.SM);
    rightGfx.fill({ color: 0x040b18, alpha: 0.95 });
    rightGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(rightGfx);

    const s8Header = new Text({
      text: '// SECTION 8: BUDGET ALLOCATION & AGENCY REWARDS //',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.5,
      }),
    });
    s8Header.position.set(916, 14);
    this.contentContainer.addChild(s8Header);

    // Budget card
    const b = m.budget;
    const bBox = new Graphics();
    bBox.roundRect(916, 48, 888, 84, UI_RADIUS.SM);
    bBox.fill({ color: 0x06152b, alpha: 0.9 });
    bBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(bBox);

    const bTitle = new Text({
      text: `TOTAL CONTRACT ALLOCATION: ${b.allocatedCredits.toLocaleString()} MISSION CREDITS`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 11.5, fontWeight: 'bold', fill: UI_COLORS.CYAN }),
    });
    bTitle.position.set(930, 58);
    this.contentContainer.addChild(bTitle);

    const bCap = new Text({
      text: `Maximum Launch Expenditure Cap: ${b.launchCostCapCredits.toLocaleString()} CR`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    bCap.position.set(930, 80);
    this.contentContainer.addChild(bCap);

    const bEff = new Text({
      text: b.financialEfficiencyTarget,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10, fill: UI_COLORS.TEXT_SECONDARY }),
    });
    bEff.position.set(930, 102);
    this.contentContainer.addChild(bEff);

    // Guaranteed Rewards Grid
    const rewHeader = new Text({
      text: 'GUARANTEED REWARDS UPON MISSION SUCCESS:',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.GREEN }),
    });
    rewHeader.position.set(916, 150);
    this.contentContainer.addChild(rewHeader);

    const r = m.guaranteedRewards;
    const rewGrid: { label: string; amount: string; color: number }[] = [
      { label: 'MISSION CREDITS (CR)', amount: `+${r.credits.toLocaleString()}`, color: UI_COLORS.GREEN },
      { label: 'RESEARCH DATA (DATA)', amount: `+${r.researchData}`, color: UI_COLORS.CYAN },
      { label: 'RAW MATERIALS (MT)', amount: `+${r.rawMaterials}`, color: UI_COLORS.AMBER },
      { label: 'TECHNOLOGY POINTS (TP)', amount: `+${r.technologyPoints}`, color: UI_COLORS.PURPLE },
      { label: 'AGENCY PRESTIGE', amount: `+${r.agencyPrestige}`, color: UI_COLORS.TEXT_PRIMARY },
    ];

    let rY = 176;
    for (const rew of rewGrid) {
      const rBox = new Graphics();
      rBox.roundRect(916, rY, 888, 44, UI_RADIUS.SM);
      rBox.fill({ color: 0x061122, alpha: 0.8 });
      rBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.contentContainer.addChild(rBox);

      const rLbl = new Text({
        text: rew.label,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.TEXT_MUTED }),
      });
      rLbl.position.set(930, rY + 13);
      this.contentContainer.addChild(rLbl);

      const rVal = new Text({
        text: rew.amount,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 12, fontWeight: 'bold', fill: rew.color }),
      });
      rVal.anchor.set(1, 0);
      rVal.position.set(916 + 868, rY + 12);
      this.contentContainer.addChild(rVal);

      rY += 52;
    }

    // Optional Rewards Summary
    const optRewHeader = new Text({
      text: 'OPTIONAL OBJECTIVES INCENTIVE BONUS:',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    optRewHeader.position.set(916, rY + 12);
    this.contentContainer.addChild(optRewHeader);

    let optRY = rY + 36;
    for (const optSummary of m.optionalRewardsSummary) {
      const optTxt = new Text({
        text: `★ ${optSummary}`,
        style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 10.5, fill: UI_COLORS.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 880 }),
      });
      optTxt.position.set(926, optRY);
      this.contentContainer.addChild(optTxt);
      optRY += 24;
    }
  }

  // =========================================================================
  // 4. FOOTER ACTIONS & ACCEPTANCE
  // =========================================================================
  private renderFooterActions(): void {
    this.footerActionContainer.removeChildren();
    if (!this.currentModel || !this.currentMission) return;

    const m = this.currentModel;

    // Acceptance Button
    let acceptLabel = 'ACCEPT MISSION // COMMENCE VEHICLE PREPARATION';
    let acceptVariant: 'PRIMARY' | 'SECONDARY' | 'DANGER' = 'PRIMARY';
    let isAcceptDisabled = false;

    if (m.isCompleted) {
      acceptLabel = '✓ MISSION ALREADY COMPLETED';
      acceptVariant = 'SECONDARY';
      isAcceptDisabled = true;
    } else if (m.isActive) {
      acceptLabel = '● MISSION ACTIVE // IN PREPARATION';
      acceptVariant = 'SECONDARY';
      isAcceptDisabled = true;
    } else if (!m.isAvailable) {
      acceptLabel = 'PREREQUISITES UNMET // ACCESS RESTRICTED';
      acceptVariant = 'DANGER';
      isAcceptDisabled = true;
    }

    this.acceptBtn = new UIButton({
      label: acceptLabel,
      variant: acceptVariant,
      width: 380,
      height: 42,
      disabled: isAcceptDisabled,
      onClick: () => this.handleAcceptMission(),
    });
    this.acceptBtn.container.position.set(0, 0);
    this.footerActionContainer.addChild(this.acceptBtn.container);

    // If mission is active, show route into vehicle assembly (VAB)
    if (m.isActive) {
      this.proceedVabBtn = new UIButton({
        label: '▶ PROCEED TO ROCKET ASSEMBLY (VAB)',
        variant: 'PRIMARY',
        width: 320,
        height: 42,
        onClick: () => {
          if (this.onProceedToVehicleAssemblyCb && this.currentMission) {
            this.onProceedToVehicleAssemblyCb(this.currentMission);
          }
        },
      });
      this.proceedVabBtn.container.position.set(400, 0);
      this.footerActionContainer.addChild(this.proceedVabBtn.container);
    }
  }

  /**
   * Performs authoritative mission acceptance with all validation checks.
   */
  public handleAcceptMission(): boolean {
    if (!this.currentMission) return false;

    const result = this.catalogueRegistry.acceptMission(this.currentMission.id);

    if (result.success) {
      NotificationManager.getInstance().notify({
        title: 'Mission Accepted',
        message: `Mission "${this.currentMission.name}" has been accepted for launch preparations!`,
        level: 'SUCCESS',
        category: 'SYSTEM',
        duration: 5.0,
      });

      // Update model to active
      this.setMission(this.currentMission);

      if (this.onMissionAcceptedCb) {
        this.onMissionAcceptedCb(this.currentMission);
      }
      return true;
    } else {
      NotificationManager.getInstance().notify({
        title: 'Mission Acceptance Rejected',
        message: result.reason || 'Cannot accept mission with unmet prerequisites.',
        level: 'WARNING',
        category: 'SYSTEM',
        duration: 5.0,
      });
      return false;
    }
  }

  public override destroy(): void {
    this.acceptBtn?.destroy();
    this.proceedVabBtn?.destroy();
    super.destroy();
  }
}
