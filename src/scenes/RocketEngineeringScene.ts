/**
 * INTERSTELLAR CONTINUUM - Rocket Engineering Facility Scene (VAB)
 * Industrial engineering workspace for rocket project management, stage architecture,
 * component exploration, mission compatibility evaluation, 5-point validation,
 * hot-fire test stand telemetry, and engineering activity history.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { SceneManager } from './SceneManager';
import { FadeTransition } from './transitions/FadeTransition';
import { ServiceLocator } from '../core/ServiceLocator';
import { EventBus } from '../core/EventBus';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { Logger } from '../core/logging/Logger';
import { RenderEngine, RenderPipeline, RenderLayerType } from '../rendering';
import { UI_COLORS, UI_FONTS } from '../ui/core/UIDesignTokens';
import { UIButton } from '../ui/components/UIButton';
import { UITabGroup, UITabItem } from '../ui/components/UITabGroup';
import { NotificationManager } from '../ui/notifications/NotificationManager';
import { MissionCatalogueRegistry } from '../missions/MissionCatalogueRegistry';
import { MissionDefinition } from '../missions/MissionTypes';
import { EconomyService } from '../services/EconomyService';
import {
  RocketProject,
  RocketProjectStatus,
  RocketClassRating,
  RocketWorkspaceSection,
} from '../engineering/RocketProjectTypes';
import {
  RocketComponentCategory,
  ComponentAvailabilityState,
} from '../engineering/RocketComponentTypes';
import { RocketComponentRegistry } from '../engineering/RocketComponentRegistry';
import { ComponentInventoryService } from '../engineering/ComponentInventoryService';
import { ComponentComparisonModal } from '../engineering/ui/ComponentComparisonModal';
import { RocketProjectManager } from '../engineering/RocketProjectManager';
import { VisualRocketBuilderView } from '../engineering/builder/ui/VisualRocketBuilderView';
import { RocketBuilderEngine } from '../engineering/builder/RocketBuilderEngine';
import {
  RocketValidationEngine,
  ValidationCategory,
  ValidationSeverity,
  ValidationOverallStatus,
  RocketTestingWorkbenchView,
  TestingWorkbenchSubTab,
} from '../engineering';
import { FacilityId } from '../facilities/FacilityTypes';

export interface RocketEngineeringScenePayload {
  facilityId?: string;
  returnX?: number;
  returnY?: number;
  missionContext?: {
    missionId: string;
    instanceId?: string;
    fromMoc?: boolean;
  };
  fromMoc?: boolean;
}

export class RocketEngineeringScene extends BaseScene {
  public override readonly id = SceneId.ROCKET_ENGINEERING;

  private sceneManager?: SceneManager;
  private inputManager?: InputManager;
  private eventBus?: EventBus;
  private pipeline?: RenderPipeline;

  private projectManager: RocketProjectManager;
  private missionRegistry: MissionCatalogueRegistry;
  private componentRegistry: RocketComponentRegistry;
  private inventoryService: ComponentInventoryService;

  private headerContainer: Container;
  private missionBannerContainer: Container;
  private tabsContainer: Container;
  private contentContainer: Container;
  private modalContainer: Container;

  private tabGroup?: UITabGroup;
  private returnBtn?: UIButton;

  private activeSection: RocketWorkspaceSection = RocketWorkspaceSection.OVERVIEW;
  private missionContext?: {
    missionId: string;
    instanceId?: string;
    fromMoc?: boolean;
  };

  private returnSpawnX: number = 2750;
  private returnSpawnY: number = 1210;
  private fromMoc: boolean = false;

  private selectedComponentCategory: RocketComponentCategory | 'ALL' = 'ALL';
  private componentSearchQuery: string = '';
  private comparisonSelectedCompId?: string;
  private comparisonModal?: ComponentComparisonModal;
  private builderView?: VisualRocketBuilderView;
  private validationCategoryFilter: ValidationCategory | 'ALL' = 'ALL';
  private validationSeverityFilter: ValidationSeverity | 'ALL' = 'ALL';
  private targetTestingSubTab?: TestingWorkbenchSubTab;
  private testingWorkbenchView?: RocketTestingWorkbenchView;

  constructor() {
    super();
    this.projectManager = RocketProjectManager.getInstance();
    this.missionRegistry = MissionCatalogueRegistry.getInstance();
    this.componentRegistry = RocketComponentRegistry.getInstance();
    this.inventoryService = ComponentInventoryService.getInstance();

    this.headerContainer = new Container();
    this.missionBannerContainer = new Container();
    this.tabsContainer = new Container();
    this.contentContainer = new Container();
    this.modalContainer = new Container();
  }

  protected async onInitialize(): Promise<void> {
    Logger.info('ROCKET_ENGINEERING_SCENE', 'Initializing Rocket Engineering Facility Scene (VAB)...');

    if (ServiceLocator.has('SceneManager')) {
      this.sceneManager = ServiceLocator.get<SceneManager>('SceneManager');
    }
    if (ServiceLocator.has('InputManager')) {
      this.inputManager = ServiceLocator.get<InputManager>('InputManager');
    }
    if (ServiceLocator.has('EventBus')) {
      this.eventBus = ServiceLocator.get<EventBus>('EventBus');
    }

    if (ServiceLocator.has('RenderEngine')) {
      const renderEngine = ServiceLocator.get<RenderEngine>('RenderEngine');
      this.pipeline = renderEngine.getPipeline();
    } else {
      this.pipeline = new RenderPipeline(this.container);
    }

    const uiContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);
    uiContainer.addChild(this.contentContainer);
    uiContainer.addChild(this.tabsContainer);
    uiContainer.addChild(this.missionBannerContainer);
    uiContainer.addChild(this.headerContainer);
    uiContainer.addChild(this.modalContainer);
  }

  protected override async onActivate(payload?: RocketEngineeringScenePayload): Promise<void> {
    super.onActivate(payload);

    if (payload) {
      if (typeof payload.returnX === 'number') this.returnSpawnX = payload.returnX;
      if (typeof payload.returnY === 'number') this.returnSpawnY = payload.returnY;
      if (payload.missionContext) {
        this.missionContext = payload.missionContext;
        this.fromMoc = !!payload.missionContext.fromMoc;
      }
      if (payload.fromMoc !== undefined) {
        this.fromMoc = payload.fromMoc;
      }
    }

    if (this.inputManager) {
      this.inputManager.setContext('ROCKET_ENGINEERING');
    }

    this.setupHeader();
    this.setupMissionBanner();
    this.setupTabs();

    // If navigated with mission context, jump to mission compatibility by default, otherwise overview
    if (this.missionContext && !payload?.facilityId) {
      this.switchToSection(RocketWorkspaceSection.MISSION_COMPATIBILITY);
    } else {
      this.switchToSection(RocketWorkspaceSection.OVERVIEW);
    }

    Logger.info(
      'ROCKET_ENGINEERING_SCENE',
      `Rocket Engineering Facility activated. Context: ${this.missionContext ? this.missionContext.missionId : 'Free Engineering'}`
    );
  }

  // =========================================================================
  // HEADER & NAVIGATION
  // =========================================================================

  private setupHeader(): void {
    this.headerContainer.removeChildren();

    // Header background bar
    const barGfx = new Graphics();
    barGfx.rect(0, 0, 1920, 68);
    barGfx.fill({ color: 0x050b14, alpha: 0.96 });
    barGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Decorative industrial amber/cyan accent strip
    barGfx.rect(0, 0, 1920, 3).fill({ color: UI_COLORS.AMBER, alpha: 0.95 });
    this.headerContainer.addChild(barGfx);

    // Facility title & subtitle
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 2.0,
    });
    const title = new Text({
      text: 'ROCKET ENGINEERING FACILITY // VAB-01',
      style: titleStyle,
    });
    title.position.set(30, 14);
    this.headerContainer.addChild(title);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10.5,
      fontWeight: 'bold',
      fill: UI_COLORS.AMBER,
      letterSpacing: 1.0,
    });
    const sub = new Text({
      text: 'VEHICLE ASSEMBLY BUILDING & PROPULSION INTEGRATION // STATUS: OPERATIONAL',
      style: subStyle,
    });
    sub.position.set(30, 38);
    this.headerContainer.addChild(sub);

    // Active rocket project chip in header
    const activeProj = this.projectManager.getActiveProject();
    if (activeProj) {
      const chipGfx = new Graphics();
      chipGfx.roundRect(720, 16, 380, 36, 4);
      chipGfx.fill({ color: 0x0f172a, alpha: 0.8 });
      chipGfx.stroke({ color: UI_COLORS.CYAN, width: 1 });
      this.headerContainer.addChild(chipGfx);

      const chipTextStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      });
      const chipText = new Text({
        text: `ACTIVE VEHICLE: ${activeProj.name} (${activeProj.shortCode})`,
        style: chipTextStyle,
      });
      chipText.position.set(735, 25);
      this.headerContainer.addChild(chipText);
    }

    // Dynamic Return Button
    const returnLabel = this.fromMoc
      ? '◀ RETURN TO MISSION OPERATIONS [ESC]'
      : '◀ RETURN TO CAMPUS [ESC]';

    this.returnBtn = new UIButton({
      label: returnLabel,
      variant: 'OUTLINE',
      width: 310,
      height: 40,
      onClick: () => this.returnToPrevious(),
    });
    this.returnBtn.container.position.set(1580, 14);
    this.headerContainer.addChild(this.returnBtn.container);
  }

  private setupMissionBanner(): void {
    this.missionBannerContainer.removeChildren();
    if (!this.missionContext) {
      this.missionBannerContainer.visible = false;
      return;
    }

    this.missionBannerContainer.visible = true;
    const mission = this.missionRegistry.getMissionById(this.missionContext.missionId);

    const bannerGfx = new Graphics();
    bannerGfx.rect(0, 68, 1920, 34);
    bannerGfx.fill({ color: 0x0c1b33, alpha: 0.98 });
    bannerGfx.stroke({ color: UI_COLORS.CYAN, width: 1 });
    this.missionBannerContainer.addChild(bannerGfx);

    const bannerStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });

    const missionName = mission ? `${mission.name} (${mission.id})` : this.missionContext.missionId;
    const req = mission?.engineeringRequirements;
    const payloadReq = req
      ? `${req.minPayloadMassKg}–${req.maxPayloadMassKg} kg`
      : '250 kg';

    const bannerText = new Text({
      text: `▶ ACTIVE MISSION TARGET CONTEXT: ${missionName}  |  DESTINATION: ${mission?.destinationId ?? 'LEO'}  |  PAYLOAD REQ: ${payloadReq}`,
      style: bannerStyle,
    });
    bannerText.position.set(30, 77);
    this.missionBannerContainer.addChild(bannerText);

    const returnPrepBtn = new UIButton({
      label: 'RETURN TO MISSION PREPARATION',
      variant: 'PRIMARY',
      width: 260,
      height: 26,
      onClick: () => this.returnToPrevious(),
    });
    returnPrepBtn.container.position.set(1630, 72);
    this.missionBannerContainer.addChild(returnPrepBtn.container);
  }

  private setupTabs(): void {
    this.tabsContainer.removeChildren();

    const yPos = this.missionContext ? 106 : 72;

    const tabs: UITabItem[] = [
      { id: RocketWorkspaceSection.OVERVIEW, label: '1. OVERVIEW' },
      { id: RocketWorkspaceSection.BUILDER, label: '2. BLUEPRINT & STAGING' },
      { id: RocketWorkspaceSection.COMPONENTS, label: '3. COMPONENT CATALOGUE' },
      { id: RocketWorkspaceSection.SAVED_DESIGNS, label: '4. ROCKET PROJECTS' },
      { id: RocketWorkspaceSection.MISSION_COMPATIBILITY, label: '5. MISSION FIT' },
      { id: RocketWorkspaceSection.VALIDATION, label: '6. VALIDATION' },
      { id: RocketWorkspaceSection.SIMULATION, label: '7. TESTING WORKBENCH' },
      { id: RocketWorkspaceSection.RECORDS, label: '8. HISTORY LOG' },
    ];

    this.tabGroup = new UITabGroup({
      tabs,
      width: 1860,
      height: 38,
      initialTabId: this.activeSection,
      onTabChange: (tabId) => {
        this.switchToSection(tabId as RocketWorkspaceSection);
      },
    });

    this.tabGroup.container.position.set(30, yPos);
    this.tabsContainer.addChild(this.tabGroup.container);
  }

  public switchToSection(section: RocketWorkspaceSection): void {
    this.activeSection = section;
    this.tabGroup?.selectTab(section);

    if (this.builderView) {
      this.builderView.destroy();
      this.builderView = undefined;
    }

    this.contentContainer.removeChildren();

    switch (section) {
      case RocketWorkspaceSection.OVERVIEW:
        this.renderOverviewSection();
        break;
      case RocketWorkspaceSection.BUILDER:
        this.renderBuilderSection();
        break;
      case RocketWorkspaceSection.COMPONENTS:
        this.renderComponentsSection();
        break;
      case RocketWorkspaceSection.SAVED_DESIGNS:
        this.renderSavedDesignsSection();
        break;
      case RocketWorkspaceSection.MISSION_COMPATIBILITY:
        this.renderMissionCompatibilitySection();
        break;
      case RocketWorkspaceSection.VALIDATION:
        this.renderValidationSection();
        break;
      case RocketWorkspaceSection.SIMULATION:
        this.renderSimulationSection();
        break;
      case RocketWorkspaceSection.RECORDS:
        this.renderRecordsSection();
        break;
    }
  }

  // =========================================================================
  // 1. OVERVIEW SECTION
  // =========================================================================

  private renderOverviewSection(): void {
    const activeProj = this.projectManager.getActiveProject();
    if (!activeProj) return;

    const yStart = this.missionContext ? 152 : 118;

    // LEFT HERO CARD: Vehicle Summary & Telemetry Specs
    const leftCard = new Graphics();
    leftCard.roundRect(30, yStart, 910, 890, 6);
    leftCard.fill({ color: 0x08101e, alpha: 0.95 });
    leftCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(leftCard);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 20,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.0,
    });
    const projTitle = new Text({
      text: `${activeProj.name.toUpperCase()} [${activeProj.shortCode}]`,
      style: titleStyle,
    });
    projTitle.position.set(55, yStart + 25);
    this.contentContainer.addChild(projTitle);

    const descStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: 850,
      lineHeight: 18,
    });
    const descText = new Text({
      text: activeProj.description,
      style: descStyle,
    });
    descText.position.set(55, yStart + 58);
    this.contentContainer.addChild(descText);

    // Status & Class Badges
    const badgeGfx = new Graphics();
    badgeGfx.roundRect(55, yStart + 115, 140, 26, 4);
    badgeGfx.fill({
      color: activeProj.status === RocketProjectStatus.VALIDATED ? 0x064e3b : 0x78350f,
    });
    this.contentContainer.addChild(badgeGfx);

    const statusBadge = new Text({
      text: `STATUS: ${activeProj.status}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: activeProj.status === RocketProjectStatus.VALIDATED ? UI_COLORS.GREEN : UI_COLORS.AMBER,
      }),
    });
    statusBadge.position.set(65, yStart + 121);
    this.contentContainer.addChild(statusBadge);

    const classBadgeGfx = new Graphics();
    classBadgeGfx.roundRect(205, yStart + 115, 200, 26, 4);
    classBadgeGfx.fill({ color: 0x1e293b });
    this.contentContainer.addChild(classBadgeGfx);

    const classBadge = new Text({
      text: `CLASS: ${activeProj.design.classRating}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    classBadge.position.set(215, yStart + 121);
    this.contentContainer.addChild(classBadge);

    // SPECIFICATION GRID
    const specs = [
      { label: 'TOTAL WET MASS', val: `${activeProj.design.totalWetMassKg.toLocaleString()} kg` },
      { label: 'DRY STRUCTURAL MASS', val: `${activeProj.design.totalDryMassKg.toLocaleString()} kg` },
      { label: 'SEA-LEVEL THRUST', val: `${activeProj.design.seaLevelThrustKn.toLocaleString()} kN` },
      { label: 'VACUUM THRUST', val: `${activeProj.design.vacuumThrustKn.toLocaleString()} kN` },
      { label: 'INITIAL LIFTOFF TWR', val: `${activeProj.design.initialTwr.toFixed(2)}` },
      { label: 'TOTAL VACUUM DELTA-V', val: `${activeProj.design.totalVacuumDeltaV.toLocaleString()} m/s` },
      { label: 'MAX LEO PAYLOAD', val: `${activeProj.design.maxPayloadCapacityLeoKg.toLocaleString()} kg` },
      { label: 'FAIRING DIAMETER', val: `${activeProj.design.fairingDiameterM.toFixed(1)} m` },
      { label: 'ESTIMATED BUILD COST', val: `₵${activeProj.design.buildCostCredits.toLocaleString()}` },
      { label: 'STAGES CONFIGURED', val: `${activeProj.design.stages.length} Stage(s)` },
    ];

    specs.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const px = 55 + col * 420;
      const py = yStart + 165 + row * 62;

      const cell = new Graphics();
      cell.roundRect(px, py, 395, 52, 4);
      cell.fill({ color: 0x0d192c, alpha: 0.9 });
      cell.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(cell);

      const lbl = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      lbl.position.set(px + 15, py + 8);
      this.contentContainer.addChild(lbl);

      const val = new Text({
        text: item.val,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 15,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      val.position.set(px + 15, py + 26);
      this.contentContainer.addChild(val);
    });

    // RIGHT CARD: Staging Summary & Action Console
    const rightCard = new Graphics();
    rightCard.roundRect(960, yStart, 930, 890, 6);
    rightCard.fill({ color: 0x08101e, alpha: 0.95 });
    rightCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(rightCard);

    const rightTitle = new Text({
      text: 'PROPULSION STAGING ARCHITECTURE',
      style: titleStyle,
    });
    rightTitle.position.set(985, yStart + 25);
    this.contentContainer.addChild(rightTitle);

    // Staging cards
    activeProj.design.stages.forEach((stg, i) => {
      const sy = yStart + 70 + i * 145;
      const stgGfx = new Graphics();
      stgGfx.roundRect(985, sy, 880, 130, 4);
      stgGfx.fill({ color: 0x0b172a, alpha: 0.85 });
      stgGfx.stroke({ color: UI_COLORS.CYAN, width: 1 });
      this.contentContainer.addChild(stgGfx);

      const stgTitle = new Text({
        text: `STAGE ${stg.stageNumber}: ${stg.name.toUpperCase()}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      stgTitle.position.set(1005, sy + 14);
      this.contentContainer.addChild(stgTitle);

      const stgDetails = [
        `Main Propulsion: ${stg.engineName} (x${stg.engineCount})`,
        `Thrust (SL/Vac): ${stg.thrustSeaLevelKn} kN / ${stg.thrustVacuumKn} kN`,
        `Specific Impulse: ${stg.specificImpulseSec} s | Burn Duration: ${stg.burnDurationSec} s`,
        `Propellant Mass: ${stg.propellantMassKg.toLocaleString()} kg | Dry Mass: ${stg.dryMassKg.toLocaleString()} kg`,
        `Separation Mechanism: ${stg.separationType}`,
      ];

      stgDetails.forEach((line, lineIdx) => {
        const lineText = new Text({
          text: line,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 11,
            fill: UI_COLORS.TEXT_SECONDARY,
          }),
        });
        lineText.position.set(1005, sy + 38 + lineIdx * 18);
        this.contentContainer.addChild(lineText);
      });
    });

    // Action Console Buttons at bottom of right card
    const actionY = yStart + 680;
    const actionTitle = new Text({
      text: 'ENGINEERING WORKSPACE ACTIONS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.0,
      }),
    });
    actionTitle.position.set(985, actionY);
    this.contentContainer.addChild(actionTitle);

    const btnBlueprint = new UIButton({
      label: '📐 OPEN BLUEPRINT STAGING',
      variant: 'PRIMARY',
      width: 270,
      height: 42,
      onClick: () => this.switchToSection(RocketWorkspaceSection.BUILDER),
    });
    btnBlueprint.container.position.set(985, actionY + 30);
    this.contentContainer.addChild(btnBlueprint.container);

    const btnValidate = new UIButton({
      label: '✔ RUN 5-POINT VALIDATION',
      variant: 'OUTLINE',
      width: 270,
      height: 42,
      onClick: () => this.handleValidate(),
    });
    btnValidate.container.position.set(1280, actionY + 30);
    this.contentContainer.addChild(btnValidate.container);

    const btnTestFire = new UIButton({
      label: '🔬 TESTING WORKBENCH',
      variant: 'OUTLINE',
      width: 270,
      height: 42,
      onClick: () => this.switchToSection(RocketWorkspaceSection.SIMULATION),
    });
    btnTestFire.container.position.set(1575, actionY + 30);
    this.contentContainer.addChild(btnTestFire.container);

    const btnNewProj = new UIButton({
      label: '+ CREATE NEW ROCKET PROJECT',
      variant: 'PRIMARY',
      width: 420,
      height: 42,
      onClick: () => this.handleCreateProjectModal(),
    });
    btnNewProj.container.position.set(985, actionY + 85);
    this.contentContainer.addChild(btnNewProj.container);
  }

  // =========================================================================
  // 2. BUILDER (VISUAL MODULAR ROCKET BUILDER & BLUEPRINT CANVAS)
  // =========================================================================

  private renderBuilderSection(): void {
    const activeProj = this.projectManager.getActiveProject();
    if (!activeProj) return;

    const yStart = this.missionContext ? 152 : 118;
    const availHeight = 1040 - yStart;
    const missionDef = this.missionContext ? this.missionRegistry.getMissionById(this.missionContext.missionId) : undefined;

    this.builderView = new VisualRocketBuilderView({
      width: 1860,
      height: availHeight,
      project: activeProj,
      missionContext: missionDef,
      onReturnToDashboard: () => {
        this.switchToSection(RocketWorkspaceSection.OVERVIEW);
      },
      onProjectUpdated: (_updatedProj) => {
        this.setupHeader();
      },
    });

    this.builderView.container.position.set(30, yStart);
    this.contentContainer.addChild(this.builderView.container);
  }

  // =========================================================================
  // 3. COMPONENTS SECTION
  // =========================================================================

  private renderComponentsSection(): void {
    const yStart = this.missionContext ? 152 : 118;
    const allComponents = this.componentRegistry.getAllComponents();
    const econ = ServiceLocator.has('EconomyService')
      ? ServiceLocator.get<EconomyService>('EconomyService')
      : undefined;
    const playerCredits = econ ? econ.getCredits() : 999999;

    // TOP OVERVIEW & SEARCH BAR
    const topBar = new Graphics();
    topBar.roundRect(30, yStart, 1860, 48, 4);
    topBar.fill({ color: 0x08101e, alpha: 0.95 });
    topBar.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(topBar);

    const title = new Text({
      text: `CENTRAL ROCKET COMPONENT DATABASE // TOTAL DEFINITIONS: ${allComponents.length}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    title.position.set(50, yStart + 15);
    this.contentContainer.addChild(title);

    const creditsText = new Text({
      text: `MISSION CREDITS BALANCE: ₵${playerCredits.toLocaleString()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
      }),
    });
    creditsText.position.set(1450, yStart + 16);
    this.contentContainer.addChild(creditsText);

    // Active Comparison Banner (if 1 component is selected for comparison)
    let filterYOffset = 0;
    if (this.comparisonSelectedCompId) {
      filterYOffset = 42;
      const compA = this.componentRegistry.getComponent(this.comparisonSelectedCompId);

      const compBanner = new Graphics();
      compBanner.roundRect(30, yStart + 54, 1860, 36, 4);
      compBanner.fill({ color: 0x1a2e05, alpha: 0.95 });
      compBanner.stroke({ color: UI_COLORS.GREEN, width: 1.0 });
      this.contentContainer.addChild(compBanner);

      const compBannerText = new Text({
        text: `⚖ COMPARISON ACTIVE: Component [A] is "${compA?.name ?? this.comparisonSelectedCompId}". Select a second component below to launch side-by-side comparison matrix.`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11.5,
          fontWeight: 'bold',
          fill: UI_COLORS.GREEN,
        }),
      });
      compBannerText.position.set(50, yStart + 63);
      this.contentContainer.addChild(compBannerText);

      const cancelCompBtn = new UIButton({
        label: 'CANCEL COMPARISON',
        variant: 'OUTLINE',
        width: 180,
        height: 26,
        onClick: () => {
          this.comparisonSelectedCompId = undefined;
          this.switchToSection(RocketWorkspaceSection.COMPONENTS);
        },
      });
      cancelCompBtn.container.position.set(1700, yStart + 59);
      this.contentContainer.addChild(cancelCompBtn.container);
    }

    // 8 Canonical Category Filter Buttons + ALL
    const categories = [
      { id: 'ALL', label: 'ALL CATEGORIES' },
      { id: RocketComponentCategory.STRUCTURE_AND_STAGING, label: '1. STRUCTURE & STAGING' },
      { id: RocketComponentCategory.PROPULSION_SYSTEMS, label: '2. PROPULSION SYSTEMS' },
      { id: RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS, label: '3. FUEL & RES CAPACITY' },
      { id: RocketComponentCategory.GUIDANCE_AND_NAVIGATION, label: '4. GUIDANCE & NAV' },
      { id: RocketComponentCategory.ELECTRICAL_POWER, label: '5. ELECTRICAL POWER' },
      { id: RocketComponentCategory.PAYLOAD_AND_FAIRING, label: '6. PAYLOAD & FAIRINGS' },
      { id: RocketComponentCategory.COMMUNICATION_AND_TELEMETRY, label: '7. COMMS & TELEMETRY' },
      { id: RocketComponentCategory.RECOVERY_AND_SAFETY_SYSTEMS, label: '8. RECOVERY & SAFETY' },
    ];

    const catStartY = yStart + 54 + filterYOffset;
    categories.forEach((cat, idx) => {
      const isSelected = this.selectedComponentCategory === cat.id;
      const btn = new UIButton({
        label: cat.label,
        variant: isSelected ? 'PRIMARY' : 'OUTLINE',
        width: 200,
        height: 30,
        onClick: () => {
          this.selectedComponentCategory = cat.id as any;
          this.switchToSection(RocketWorkspaceSection.COMPONENTS);
        },
      });
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      btn.container.position.set(30 + col * 206, catStartY + row * 35);
      this.contentContainer.addChild(btn.container);
    });

    // Query & Filter Components
    const filtered = this.componentRegistry.searchComponents(
      this.componentSearchQuery,
      this.selectedComponentCategory === 'ALL' ? undefined : this.selectedComponentCategory
    );

    const gridY = catStartY + 76;
    filtered.slice(0, 6).forEach((comp, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = 30 + col * 935;
      const cy = gridY + row * 240;

      const avail = this.componentRegistry.evaluateAvailability(comp.id, { playerCredits });
      const ownedQty = this.inventoryService.getOwnedQuantity(comp.id);
      const availQty = this.inventoryService.getAvailableQuantity(comp.id);

      const card = new Graphics();
      card.roundRect(cx, cy, 920, 230, 6);
      card.fill({ color: 0x08101e, alpha: 0.95 });
      card.stroke({
        color:
          this.comparisonSelectedCompId === comp.id
            ? UI_COLORS.GREEN
            : UI_COLORS.BORDER_SUBTLE,
        width: this.comparisonSelectedCompId === comp.id ? 2.0 : 1.0,
      });
      this.contentContainer.addChild(card);

      // Component Header: Name, Tier, Rarity
      const name = new Text({
        text: `${comp.name} [Tier ${comp.tier} • ${comp.rarity}]`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      name.position.set(cx + 15, cy + 12);
      this.contentContainer.addChild(name);

      // Category & Type tag
      const typeTag = new Text({
        text: `${comp.category} // ${comp.componentType.toUpperCase()}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      typeTag.position.set(cx + 15, cy + 34);
      this.contentContainer.addChild(typeTag);

      // Cost, Mass Units, Reliability, Inventory Count
      const costMassText = new Text({
        text: `COST: ₵${comp.costCredits.toLocaleString()}  |  MASS: ${comp.massUnits} MU  |  RELIABILITY: ${comp.stats.reliabilityRating}%  |  INVENTORY: ${availQty} UNASSIGNED (${ownedQty} TOTAL)`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.AMBER,
        }),
      });
      costMassText.position.set(cx + 15, cy + 54);
      this.contentContainer.addChild(costMassText);

      // Availability State Chip
      let chipColor: number = UI_COLORS.GREEN;
      if (avail.state === ComponentAvailabilityState.RESEARCH_REQUIRED) chipColor = UI_COLORS.AMBER;
      else if (avail.state === ComponentAvailabilityState.MANUFACTURING_REQUIRED) chipColor = 0xa855f7;
      else if (avail.state === ComponentAvailabilityState.INSUFFICIENT_CREDITS) chipColor = UI_COLORS.RED;
      else if (avail.state === ComponentAvailabilityState.LOCKED) chipColor = 0x64748b;

      const availGfx = new Graphics();
      availGfx.roundRect(cx + 700, cy + 12, 205, 22, 4);
      availGfx.fill({ color: 0x0f172a, alpha: 0.9 });
      availGfx.stroke({ color: chipColor, width: 1.0 });
      this.contentContainer.addChild(availGfx);

      const availText = new Text({
        text: `STATE: ${avail.state}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: chipColor,
        }),
      });
      availText.position.set(cx + 710, cy + 16);
      this.contentContainer.addChild(availText);

      // Short Description
      const desc = new Text({
        text: comp.description,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: 890,
        }),
      });
      desc.position.set(cx + 15, cy + 76);
      this.contentContainer.addChild(desc);

      // Educational Trade-Off Box
      const eduBox = new Graphics();
      eduBox.roundRect(cx + 15, cy + 115, 890, 58, 4);
      eduBox.fill({ color: 0x0b172a, alpha: 0.85 });
      eduBox.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.contentContainer.addChild(eduBox);

      const eduTitle = new Text({
        text: 'EDUCATIONAL ENGINEERING TRADE-OFF:',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      eduTitle.position.set(cx + 25, cy + 122);
      this.contentContainer.addChild(eduTitle);

      const eduText = new Text({
        text: comp.educationalExplanation,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_PRIMARY,
          wordWrap: true,
          wordWrapWidth: 870,
          lineHeight: 14,
        }),
      });
      eduText.position.set(cx + 25, cy + 138);
      this.contentContainer.addChild(eduText);

      // Compatibility Tags
      const tagsStr = comp.compatibilityTags.map(t => `#${t}`).join(' ');
      const tagsText = new Text({
        text: `Tags: ${tagsStr}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      tagsText.position.set(cx + 15, cy + 182);
      this.contentContainer.addChild(tagsText);

      // Actions: Purchase (+1) & Compare
      const purchaseBtn = new UIButton({
        label: `PURCHASE (+1)`,
        variant: 'PRIMARY',
        width: 140,
        height: 30,
        disabled: !avail.canAfford || avail.state === ComponentAvailabilityState.RESEARCH_REQUIRED || avail.state === ComponentAvailabilityState.LOCKED,
        onClick: () => {
          const res = this.inventoryService.purchaseComponent(comp.id, 1);
          if (res.success) {
            NotificationManager.getInstance().notify({
              title: 'COMPONENT PROCURED',
              message: `Purchased 1x ${comp.name} for ₵${res.creditsSpent.toLocaleString()}. Total owned: ${res.newOwnedQuantity}`,
              level: 'SUCCESS',
            });
          } else {
            NotificationManager.getInstance().notify({
              title: 'PURCHASE FAILED',
              message: res.errorMessage ?? 'Unable to complete transaction.',
              level: 'WARNING',
            });
          }
          this.switchToSection(RocketWorkspaceSection.COMPONENTS);
        },
      });
      purchaseBtn.container.position.set(cx + 620, cy + 185);
      this.contentContainer.addChild(purchaseBtn.container);

      const isCompSelected = this.comparisonSelectedCompId === comp.id;
      const compareBtn = new UIButton({
        label: isCompSelected ? 'DESELECT [A]' : this.comparisonSelectedCompId ? 'COMPARE [B]' : 'COMPARE',
        variant: isCompSelected ? 'SECONDARY' : 'OUTLINE',
        width: 140,
        height: 30,
        onClick: () => {
          if (!this.comparisonSelectedCompId) {
            this.comparisonSelectedCompId = comp.id;
            this.switchToSection(RocketWorkspaceSection.COMPONENTS);
          } else if (this.comparisonSelectedCompId === comp.id) {
            this.comparisonSelectedCompId = undefined;
            this.switchToSection(RocketWorkspaceSection.COMPONENTS);
          } else {
            this.openComparisonModal(this.comparisonSelectedCompId, comp.id);
          }
        },
      });
      compareBtn.container.position.set(cx + 768, cy + 185);
      this.contentContainer.addChild(compareBtn.container);
    });
  }

  // =========================================================================
  // 4. SAVED DESIGNS (ROCKET PROJECTS)
  // =========================================================================

  private renderSavedDesignsSection(): void {
    const yStart = this.missionContext ? 152 : 118;
    const allProjects = this.projectManager.getAllProjects();
    const activeProj = this.projectManager.getActiveProject();

    const topBar = new Graphics();
    topBar.roundRect(30, yStart, 1860, 48, 4);
    topBar.fill({ color: 0x08101e, alpha: 0.95 });
    topBar.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(topBar);

    const title = new Text({
      text: `ORGANISATION VEHICLE INVENTORY // TOTAL PROJECTS: ${allProjects.length}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    title.position.set(50, yStart + 15);
    this.contentContainer.addChild(title);

    const createBtn = new UIButton({
      label: '+ NEW ROCKET PROJECT',
      variant: 'PRIMARY',
      width: 240,
      height: 32,
      onClick: () => this.handleCreateProjectModal(),
    });
    createBtn.container.position.set(1630, yStart + 8);
    this.contentContainer.addChild(createBtn.container);

    allProjects.forEach((proj, idx) => {
      const py = yStart + 60 + idx * 165;
      const isActive = activeProj?.projectId === proj.projectId;

      const card = new Graphics();
      card.roundRect(30, py, 1860, 150, 6);
      card.fill({ color: isActive ? 0x0d1e38 : 0x08101e, alpha: 0.95 });
      card.stroke({ color: isActive ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE, width: isActive ? 1.5 : 1 });
      this.contentContainer.addChild(card);

      const projName = new Text({
        text: `${proj.name} [${proj.shortCode}] - ${proj.designVersion}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 16,
          fontWeight: 'bold',
          fill: isActive ? UI_COLORS.CYAN : UI_COLORS.TEXT_PRIMARY,
        }),
      });
      projName.position.set(50, py + 15);
      this.contentContainer.addChild(projName);

      const status = new Text({
        text: `STATUS: ${proj.status}  |  CLASS: ${proj.design.classRating}  |  STAGES: ${proj.design.stages.length}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: proj.status === RocketProjectStatus.VALIDATED ? UI_COLORS.GREEN : UI_COLORS.AMBER,
        }),
      });
      status.position.set(50, py + 40);
      this.contentContainer.addChild(status);

      const metrics = `Wet Mass: ${proj.design.totalWetMassKg.toLocaleString()} kg | Dry Mass: ${proj.design.totalDryMassKg.toLocaleString()} kg | Delta-V: ${proj.design.totalVacuumDeltaV.toLocaleString()} m/s | LEO Capacity: ${proj.design.maxPayloadCapacityLeoKg.toLocaleString()} kg | Cost: ₵${proj.design.buildCostCredits.toLocaleString()}`;
      const metricsText = new Text({
        text: metrics,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      metricsText.position.set(50, py + 65);
      this.contentContainer.addChild(metricsText);

      const descText = new Text({
        text: proj.description,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      descText.position.set(50, py + 92);
      this.contentContainer.addChild(descText);

      // Buttons
      if (!isActive) {
        const activateBtn = new UIButton({
          label: 'SET AS ACTIVE',
          variant: 'PRIMARY',
          width: 170,
          height: 36,
          onClick: () => {
            this.projectManager.setActiveProject(proj.projectId);
            this.setupHeader();
            this.switchToSection(RocketWorkspaceSection.SAVED_DESIGNS);
          },
        });
        activateBtn.container.position.set(1450, py + 25);
        this.contentContainer.addChild(activateBtn.container);
      }

      const valBtn = new UIButton({
        label: 'VALIDATE',
        variant: 'OUTLINE',
        width: 170,
        height: 36,
        onClick: () => {
          this.projectManager.setActiveProject(proj.projectId);
          this.handleValidate();
        },
      });
      valBtn.container.position.set(1640, py + 25);
      this.contentContainer.addChild(valBtn.container);

      if (proj.status !== RocketProjectStatus.ARCHIVED && proj.status !== RocketProjectStatus.ASSIGNED_TO_MISSION) {
        const archiveBtn = new UIButton({
          label: 'ARCHIVE',
          variant: 'OUTLINE',
          width: 170,
          height: 32,
          onClick: () => {
            this.projectManager.archiveProject(proj.projectId);
            this.switchToSection(RocketWorkspaceSection.SAVED_DESIGNS);
          },
        });
        archiveBtn.container.position.set(1640, py + 80);
        this.contentContainer.addChild(archiveBtn.container);
      }
    });
  }

  // =========================================================================
  // 5. MISSION COMPATIBILITY SECTION
  // =========================================================================

  private renderMissionCompatibilitySection(): void {
    const yStart = this.missionContext ? 152 : 118;
    const activeProj = this.projectManager.getActiveProject();
    if (!activeProj) return;

    const mission = this.missionContext
      ? this.missionRegistry.getMissionById(this.missionContext.missionId)
      : (this.missionRegistry.getActiveMissions()[0] ?? this.missionRegistry.getAllMissions()[0]);

    const missionDef: MissionDefinition = mission ?? this.missionRegistry.getAllMissions()[0]!;
    const analysis = this.projectManager.evaluateMissionCompatibility(activeProj.projectId, missionDef);

    // Left card: Target Mission Requirements
    const leftCard = new Graphics();
    leftCard.roundRect(30, yStart, 910, 890, 6);
    leftCard.fill({ color: 0x08101e, alpha: 0.95 });
    leftCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(leftCard);

    const mTitle = new Text({
      text: `TARGET MISSION: ${missionDef.name.toUpperCase()}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    mTitle.position.set(55, yStart + 25);
    this.contentContainer.addChild(mTitle);

    const mDesc = new Text({
      text: missionDef.description,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12.5,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: 850,
      }),
    });
    mDesc.position.set(55, yStart + 55);
    this.contentContainer.addChild(mDesc);

    const reqItems = [
      { label: 'DESTINATION REGION', val: missionDef.destinationId.toUpperCase() },
      { label: 'MISSION CLASSIFICATION', val: missionDef.category },
      {
        label: 'REQUIRED PAYLOAD MASS',
        val: `${analysis.requiredPayloadMassKg.min}–${analysis.requiredPayloadMassKg.max} kg`,
      },
      {
        label: 'ESTIMATED DELTA-V NEEDED',
        val: `~${analysis.requiredDeltaVEstimate.toLocaleString()} m/s`,
      },
    ];

    reqItems.forEach((item, idx) => {
      const cy = yStart + 120 + idx * 70;
      const box = new Graphics();
      box.roundRect(55, cy, 850, 56, 4);
      box.fill({ color: 0x0d192c, alpha: 0.85 });
      box.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
      this.contentContainer.addChild(box);

      const lbl = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10.5,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      lbl.position.set(70, cy + 8);
      this.contentContainer.addChild(lbl);

      const val = new Text({
        text: item.val,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      val.position.set(70, cy + 28);
      this.contentContainer.addChild(val);
    });

    // Right card: Compatibility Analysis & Verification Matrix
    const rightCard = new Graphics();
    rightCard.roundRect(960, yStart, 930, 890, 6);
    rightCard.fill({ color: 0x08101e, alpha: 0.95 });
    rightCard.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(rightCard);

    const rTitle = new Text({
      text: 'VEHICLE COMPATIBILITY EVALUATION',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    rTitle.position.set(985, yStart + 25);
    this.contentContainer.addChild(rTitle);

    // Rating Badge
    const ratingGfx = new Graphics();
    ratingGfx.roundRect(985, yStart + 60, 220, 36, 4);
    ratingGfx.fill({
      color: analysis.isCompatible ? 0x064e3b : 0x7f1d1d,
    });
    this.contentContainer.addChild(ratingGfx);

    const ratingText = new Text({
      text: `RATING: ${analysis.overallRating}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: analysis.isCompatible ? UI_COLORS.GREEN : UI_COLORS.RED,
      }),
    });
    ratingText.position.set(1005, yStart + 70);
    this.contentContainer.addChild(ratingText);

    // Checks breakdown
    const checks = [
      {
        name: 'Payload Lift Capability',
        ok: analysis.payloadCapacityOk,
        detail: `Rocket: ${analysis.rocketPayloadCapacityKg.toLocaleString()} kg | Req: ${analysis.requiredPayloadMassKg.max.toLocaleString()} kg`,
      },
      {
        name: 'Total Delta-V Margin',
        ok: analysis.deltaVOk,
        detail: `Rocket: ${analysis.rocketTotalDeltaV.toLocaleString()} m/s | Req: ${analysis.requiredDeltaVEstimate.toLocaleString()} m/s`,
      },
      {
        name: 'Liftoff Thrust-to-Weight Ratio',
        ok: analysis.twrOk,
        detail: `Rocket: ${analysis.initialTwr.toFixed(2)} TWR | Req: >= 1.15 TWR`,
      },
      {
        name: 'Fairing Clearance Envelope',
        ok: analysis.fairingClearanceOk,
        detail: `Rocket: ${activeProj.design.fairingDiameterM} m | Req: >= 1.8 m standard`,
      },
    ];

    checks.forEach((chk, cIdx) => {
      const cy = yStart + 115 + cIdx * 65;
      const chkBox = new Graphics();
      chkBox.roundRect(985, cy, 880, 52, 4);
      chkBox.fill({ color: 0x0d192c, alpha: 0.85 });
      chkBox.stroke({ color: chk.ok ? UI_COLORS.GREEN : UI_COLORS.RED, width: 1 });
      this.contentContainer.addChild(chkBox);

      const chkTitle = new Text({
        text: `${chk.ok ? '✔' : '✖'} ${chk.name}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fontWeight: 'bold',
          fill: chk.ok ? UI_COLORS.GREEN : UI_COLORS.RED,
        }),
      });
      chkTitle.position.set(1005, cy + 8);
      this.contentContainer.addChild(chkTitle);

      const chkDetail = new Text({
        text: chk.detail,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_SECONDARY,
        }),
      });
      chkDetail.position.set(1005, cy + 28);
      this.contentContainer.addChild(chkDetail);
    });

    // Recommendations list
    const recY = yStart + 400;
    const recTitle = new Text({
      text: 'ENGINEERING ADVISORY & RECOMMENDATIONS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    recTitle.position.set(985, recY);
    this.contentContainer.addChild(recTitle);

    analysis.recommendations.forEach((rec, rIdx) => {
      const rText = new Text({
        text: `• ${rec}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11.5,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: 880,
        }),
      });
      rText.position.set(985, recY + 28 + rIdx * 28);
      this.contentContainer.addChild(rText);
    });

    // Action Assignment Buttons
    const btnY = yStart + 700;
    const isAssigned = activeProj.assignedMissionId === missionDef.id;

    if (isAssigned) {
      const unassignBtn = new UIButton({
        label: 'RELEASE VEHICLE FROM MISSION',
        variant: 'DANGER',
        width: 320,
        height: 42,
        onClick: () => this.handleUnassignMission(activeProj.projectId),
      });
      unassignBtn.container.position.set(985, btnY);
      this.contentContainer.addChild(unassignBtn.container);
    } else {
      const assignBtn = new UIButton({
        label: 'ASSIGN VEHICLE TO THIS MISSION',
        variant: 'PRIMARY',
        width: 320,
        height: 42,
        disabled: !analysis.isCompatible,
        onClick: () => this.handleAssignMission(activeProj.projectId, missionDef.id),
      });
      assignBtn.container.position.set(985, btnY);
      this.contentContainer.addChild(assignBtn.container);
    }

    const readinessBtn = new UIButton({
      label: '🚀 PRE-LAUNCH READINESS',
      variant: 'SECONDARY',
      width: 280,
      height: 42,
      onClick: () => {
        this.targetTestingSubTab = TestingWorkbenchSubTab.PRE_LAUNCH_READINESS;
        this.switchToSection(RocketWorkspaceSection.SIMULATION);
      },
    });
    readinessBtn.container.position.set(1330, btnY);
    this.contentContainer.addChild(readinessBtn.container);
  }

  // =========================================================================
  // 6. VALIDATION SECTION (COMPREHENSIVE 7-CATEGORY VALIDATION ENGINE)
  // =========================================================================

  private renderValidationSection(): void {
    const yStart = this.missionContext ? 152 : 118;
    const activeProj = this.projectManager.getActiveProject();
    if (!activeProj) return;

    const missionDef = this.missionContext ? this.missionRegistry.getMissionById(this.missionContext.missionId) : undefined;

    // Retrieve or run comprehensive validation
    if (!activeProj.comprehensiveValidation) {
      this.projectManager.validateProjectComprehensive(activeProj.projectId, missionDef);
    }
    const compRep = activeProj.comprehensiveValidation!;

    const builderConfig = RocketBuilderEngine.getInstance().getConfiguration();
    const isStale = RocketValidationEngine.getInstance().isReportStale(compRep, builderConfig);

    // 1. TOP CERTIFICATION HEADER BAR
    const bar = new Graphics();
    bar.roundRect(30, yStart, 1860, 68, 6);
    let barBg = 0x064e3b;
    let barBorder: number = UI_COLORS.GREEN;
    let barTitle = '✔ ENGINEERING CERTIFICATION: VERIFIED & FLIGHT-READY';

    if (isStale) {
      barBg = 0x381e05;
      barBorder = UI_COLORS.AMBER;
      barTitle = '▲ VALIDATION REPORT OUTDATED (DESIGN MODIFIED IN BUILDER)';
    } else if (compRep.status === ValidationOverallStatus.FAILED) {
      barBg = 0x3b0707;
      barBorder = UI_COLORS.RED;
      barTitle = '✖ ENGINEERING CERTIFICATION: DEFICIENT (BLOCKING ERRORS)';
    } else if (compRep.status === ValidationOverallStatus.PASSED_WITH_WARNINGS) {
      barBg = 0x2d1f04;
      barBorder = UI_COLORS.AMBER;
      barTitle = '▲ ENGINEERING CERTIFICATION: CERTIFIED WITH WARNINGS';
    }

    bar.fill({ color: barBg, alpha: 0.95 });
    bar.stroke({ color: barBorder, width: 1.5 });
    this.contentContainer.addChild(bar);

    const certTitle = new Text({
      text: barTitle,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 15,
        fontWeight: 'bold',
        fill: barBorder,
      }),
    });
    certTitle.position.set(50, yStart + 12);
    this.contentContainer.addChild(certTitle);

    const certSummary = new Text({
      text: compRep.summaryText,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    certSummary.position.set(50, yStart + 36);
    this.contentContainer.addChild(certSummary);

    // Right action buttons
    const btnBuilder = new UIButton({
      label: '📐 BUILDER',
      variant: 'OUTLINE',
      width: 140,
      height: 36,
      onClick: () => this.switchToSection(RocketWorkspaceSection.BUILDER),
    });
    btnBuilder.container.position.set(1390, yStart + 16);
    this.contentContainer.addChild(btnBuilder.container);

    const btnRevalidate = new UIButton({
      label: '⟳ RE-VALIDATE',
      variant: 'SECONDARY',
      width: 140,
      height: 36,
      onClick: () => this.handleValidate(),
    });
    btnRevalidate.container.position.set(1545, yStart + 16);
    this.contentContainer.addChild(btnRevalidate.container);

    const btnTestBench = new UIButton({
      label: '🔬 TEST BENCH',
      variant: 'PRIMARY',
      width: 155,
      height: 36,
      onClick: () => {
        this.targetTestingSubTab = TestingWorkbenchSubTab.DESIGN_INSPECTION;
        this.switchToSection(RocketWorkspaceSection.SIMULATION);
      },
    });
    btnTestBench.container.position.set(1700, yStart + 16);
    this.contentContainer.addChild(btnTestBench.container);

    // 2. 7 CATEGORY STATUS TILES ROW
    const categories = Object.values(ValidationCategory);
    const tileY = yStart + 76;
    const tileW = 257;

    categories.forEach((cat, idx) => {
      const tileX = 30 + idx * (tileW + 10);
      const catSum = compRep.categorySummaries[cat];
      const isSelected = this.validationCategoryFilter === cat;

      const tileGfx = new Graphics();
      tileGfx.roundRect(tileX, tileY, tileW, 44, 4);
      tileGfx.fill({
        color: isSelected ? 0x143457 : (catSum.errorCount > 0 ? 0x2e0808 : (catSum.warningCount > 0 ? 0x241604 : 0x09172a)),
        alpha: 0.95,
      });
      tileGfx.stroke({
        color: isSelected ? UI_COLORS.CYAN : (catSum.errorCount > 0 ? UI_COLORS.RED : (catSum.warningCount > 0 ? UI_COLORS.AMBER : UI_COLORS.BORDER_SUBTLE)),
        width: isSelected ? 1.5 : 1.0,
      });
      tileGfx.interactive = true;
      (tileGfx as any).cursor = 'pointer';
      tileGfx.on('pointerdown', () => {
        this.validationCategoryFilter = (this.validationCategoryFilter === cat ? 'ALL' : cat);
        this.switchToSection(RocketWorkspaceSection.VALIDATION);
      });
      this.contentContainer.addChild(tileGfx);

      const catShortName = cat.replace(/_/g, ' ');
      const catLabel = new Text({
        text: catShortName.length > 18 ? catShortName.substring(0, 16) + '..' : catShortName,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: isSelected ? UI_COLORS.CYAN : UI_COLORS.TEXT_PRIMARY,
        }),
      });
      catLabel.position.set(tileX + 10, tileY + 8);
      this.contentContainer.addChild(catLabel);

      let statusPillText = 'PASS';
      let statusPillColor: number = UI_COLORS.GREEN;
      if (catSum.errorCount > 0) {
        statusPillText = `${catSum.errorCount} ERR`;
        statusPillColor = UI_COLORS.RED;
      } else if (catSum.warningCount > 0) {
        statusPillText = `${catSum.warningCount} WARN`;
        statusPillColor = UI_COLORS.AMBER;
      }

      const pillText = new Text({
        text: statusPillText,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: statusPillColor,
        }),
      });
      pillText.position.set(tileX + 10, tileY + 24);
      this.contentContainer.addChild(pillText);
    });

    // 3. MAIN ISSUES LIST (LEFT: 1180px)
    const listX = 30;
    const listY = tileY + 54;
    const listW = 1180;
    const listH = 750;

    const listBg = new Graphics();
    listBg.roundRect(listX, listY, listW, listH, 4);
    listBg.fill({ color: 0x050e1a, alpha: 0.98 });
    listBg.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(listBg);

    // Issues header
    const headerTitle = new Text({
      text: `VALIDATION FINDINGS (${compRep.issues.length} TOTAL)  |  FILTER: ${this.validationCategoryFilter}`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    headerTitle.position.set(listX + 16, listY + 12);
    this.contentContainer.addChild(headerTitle);

    // Filter issues
    let filteredIssues = compRep.issues;
    if (this.validationCategoryFilter !== 'ALL') {
      filteredIssues = filteredIssues.filter(i => i.category === this.validationCategoryFilter);
    }
    if (this.validationSeverityFilter !== 'ALL') {
      filteredIssues = filteredIssues.filter(i => i.severity === this.validationSeverityFilter);
    }

    let curIssueY = listY + 40;
    const displayLimit = Math.min(filteredIssues.length, 5);

    if (filteredIssues.length === 0) {
      const emptyNotice = new Text({
        text: '✔ No validation issues found for the active filter. Configuration is fully verified in this area.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.GREEN,
        }),
      });
      emptyNotice.position.set(listX + 24, curIssueY + 20);
      this.contentContainer.addChild(emptyNotice);
    } else {
      for (let i = 0; i < displayLimit; i++) {
        const issue = filteredIssues[i];
        if (!issue) continue;

        const cardH = 118;
        const cardGfx = new Graphics();
        cardGfx.roundRect(listX + 14, curIssueY, listW - 28, cardH, 4);
        cardGfx.fill({ color: 0x081528, alpha: 0.95 });
        cardGfx.stroke({
          color: issue.severity === ValidationSeverity.ERROR ? UI_COLORS.RED : (issue.severity === ValidationSeverity.WARNING ? UI_COLORS.AMBER : UI_COLORS.CYAN),
          width: 1.0,
        });
        this.contentContainer.addChild(cardGfx);

        // Severity Tag Chip
        const chipGfx = new Graphics();
        chipGfx.roundRect(listX + 24, curIssueY + 10, 68, 20, 2);
        chipGfx.fill({
          color: issue.severity === ValidationSeverity.ERROR ? 0x450a0a : (issue.severity === ValidationSeverity.WARNING ? 0x451a03 : 0x082f49),
        });
        this.contentContainer.addChild(chipGfx);

        const chipText = new Text({
          text: issue.severity,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 9,
            fontWeight: 'bold',
            fill: issue.severity === ValidationSeverity.ERROR ? UI_COLORS.RED : (issue.severity === ValidationSeverity.WARNING ? UI_COLORS.AMBER : UI_COLORS.CYAN),
          }),
        });
        chipText.position.set(listX + 30, curIssueY + 13);
        this.contentContainer.addChild(chipText);

        // Issue Title & Category
        const titleText = new Text({
          text: `${issue.title}  [ ${issue.category} ]`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 11,
            fontWeight: 'bold',
            fill: UI_COLORS.TEXT_PRIMARY,
          }),
        });
        titleText.position.set(listX + 102, curIssueY + 12);
        this.contentContainer.addChild(titleText);

        // Explanation
        const expText = new Text({
          text: issue.explanation,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 9.5,
            fill: UI_COLORS.TEXT_SECONDARY,
            wordWrap: true,
            wordWrapWidth: listW - 180,
          }),
        });
        expText.position.set(listX + 26, curIssueY + 36);
        this.contentContainer.addChild(expText);

        // Recommended Correction
        const corrText = new Text({
          text: `💡 RECOMMENDED CORRECTION: ${issue.recommendedCorrection}`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 9.5,
            fontWeight: 'bold',
            fill: issue.severity === ValidationSeverity.ERROR ? UI_COLORS.AMBER : UI_COLORS.CYAN,
            wordWrap: true,
            wordWrapWidth: listW - 180,
          }),
        });
        corrText.position.set(listX + 26, curIssueY + 76);
        this.contentContainer.addChild(corrText);

        // Fix in Builder button
        if (issue.affectedSlotId) {
          const btnFix = new UIButton({
            label: 'FIX IN BUILDER',
            variant: 'OUTLINE',
            width: 120,
            height: 28,
            onClick: () => {
              this.switchToSection(RocketWorkspaceSection.BUILDER);
              if (this.builderView && issue.affectedSlotId) {
                this.builderView.selectSlot(issue.affectedSlotId);
              }
            },
          });
          btnFix.container.position.set(listX + listW - 156, curIssueY + 44);
          this.contentContainer.addChild(btnFix.container);
        }

        curIssueY += cardH + 10;
      }
    }

    // 4. RIGHT SIDE: MISSION FIT & EDUCATIONAL TRADE-OFFS (660px)
    const rightX = listX + listW + 20;
    const rightW = 660;

    // 4A. Mission Compatibility Panel
    const missCardH = 260;
    const missGfx = new Graphics();
    missGfx.roundRect(rightX, listY, rightW, missCardH, 4);
    missGfx.fill({ color: 0x050e1a, alpha: 0.98 });
    missGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(missGfx);

    const missTitle = new Text({
      text: compRep.missionCompatibility
        ? `MISSION FIT: ${compRep.missionCompatibility.missionName.toUpperCase()}`
        : 'MISSION COMPATIBILITY PROFILE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1,
      }),
    });
    missTitle.position.set(rightX + 16, listY + 12);
    this.contentContainer.addChild(missTitle);

    if (compRep.missionCompatibility) {
      let chkY = listY + 36;
      for (const chk of compRep.missionCompatibility.checkpoints) {
        const chkRow = new Graphics();
        chkRow.roundRect(rightX + 14, chkY, rightW - 28, 38, 2);
        chkRow.fill({ color: chk.passed ? 0x052e16 : 0x2e0808, alpha: 0.8 });
        chkRow.stroke({ color: chk.passed ? UI_COLORS.GREEN : UI_COLORS.RED, width: 0.8 });
        this.contentContainer.addChild(chkRow);

        const chkText = new Text({
          text: `${chk.passed ? '✓' : '✗'} ${chk.label}: Req [${chk.requiredValue}] | Curr [${chk.currentValue}]`,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 9,
            fontWeight: 'bold',
            fill: chk.passed ? UI_COLORS.GREEN : UI_COLORS.RED,
          }),
        });
        chkText.position.set(rightX + 24, chkY + 6);
        this.contentContainer.addChild(chkText);

        const chkDet = new Text({
          text: chk.details,
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 8.5,
            fill: UI_COLORS.TEXT_SECONDARY,
          }),
        });
        chkDet.position.set(rightX + 24, chkY + 22);
        this.contentContainer.addChild(chkDet);

        chkY += 44;
      }
    } else {
      const noMissText = new Text({
        text: 'No mission profile assigned to this vehicle project.\nAssign a mission contract from the Mission Operations Centre to evaluate mission payload, performance, and destination criteria.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: rightW - 40,
        }),
      });
      noMissText.position.set(rightX + 20, listY + 50);
      this.contentContainer.addChild(noMissText);
    }

    // 4B. Educational Trade-Off Analysis Panel
    const eduY = listY + missCardH + 16;
    const eduH = listH - missCardH - 16;

    const eduGfx = new Graphics();
    eduGfx.roundRect(rightX, eduY, rightW, eduH, 4);
    eduGfx.fill({ color: 0x050e1a, alpha: 0.98 });
    eduGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(eduGfx);

    const eduTitle = new Text({
      text: 'EDUCATIONAL ENGINEERING TRADE-OFF ANALYSIS',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.AMBER,
        letterSpacing: 1,
      }),
    });
    eduTitle.position.set(rightX + 16, eduY + 12);
    this.contentContainer.addChild(eduTitle);

    let insightY = eduY + 36;
    const insightLimit = Math.min(compRep.educationalTradeOffs.length, 3);

    for (let j = 0; j < insightLimit; j++) {
      const insight = compRep.educationalTradeOffs[j];
      if (!insight) continue;

      const insGfx = new Graphics();
      insGfx.roundRect(rightX + 14, insightY, rightW - 28, 108, 3);
      insGfx.fill({ color: 0x081528, alpha: 0.95 });
      insGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
      this.contentContainer.addChild(insGfx);

      const insTitle = new Text({
        text: `🔬 ${insight.title.toUpperCase()}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      insTitle.position.set(rightX + 24, insightY + 8);
      this.contentContainer.addChild(insTitle);

      const insObs = new Text({
        text: insight.observation,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      insObs.position.set(rightX + 24, insightY + 26);
      this.contentContainer.addChild(insObs);

      const insAnalysis = new Text({
        text: `Analysis: ${insight.tradeOffAnalysis}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fontStyle: 'italic',
          fill: UI_COLORS.AMBER,
          wordWrap: true,
          wordWrapWidth: rightW - 56,
        }),
      });
      insAnalysis.position.set(rightX + 24, insightY + 44);
      this.contentContainer.addChild(insAnalysis);

      const insRec = new Text({
        text: `Guidance: ${insight.recommendation}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 8.5,
          fill: UI_COLORS.GREEN,
          wordWrap: true,
          wordWrapWidth: rightW - 56,
        }),
      });
      insRec.position.set(rightX + 24, insightY + 76);
      this.contentContainer.addChild(insRec);

      insightY += 120;
    }
  }

  // =========================================================================
  // 7. TESTING WORKBENCH & PRE-LAUNCH READINESS
  // =========================================================================

  private renderSimulationSection(): void {
    const yStart = this.missionContext ? 152 : 118;
    const activeProj = this.projectManager.getActiveProject();
    if (!activeProj) return;

    if (this.testingWorkbenchView) {
      this.testingWorkbenchView.destroy();
      this.testingWorkbenchView = undefined;
    }

    this.testingWorkbenchView = new RocketTestingWorkbenchView({
      projectId: activeProj.projectId,
      missionContext: this.missionContext,
      initialSubTab: this.targetTestingSubTab ?? TestingWorkbenchSubTab.DESIGN_INSPECTION,
      onNavigateToBuilder: () => {
        this.switchToSection(RocketWorkspaceSection.BUILDER);
      },
      onProceedToLaunchComplex: () => {
        this.handleProceedToLaunchComplex();
      },
    });

    this.testingWorkbenchView.container.position.set(30, yStart);
    this.contentContainer.addChild(this.testingWorkbenchView.container);
  }

  private async handleProceedToLaunchComplex(): Promise<void> {
    const activeProj = this.projectManager.getActiveProject();
    if (!activeProj) return;

    NotificationManager.getInstance().notify({
      title: 'LAUNCH ROLLOUT INITIATED',
      message: `Vehicle "${activeProj.name}" cleared for rollout to Launch Complex Pad Alpha.`,
      level: 'SUCCESS',
    });

    Logger.info(
      'ROCKET_ENGINEERING_SCENE',
      `Vehicle "${activeProj.name}" deployed to Launch Complex Pad Alpha. Routing to Launch Complex.`
    );

    if (this.sceneManager) {
      await this.sceneManager.switchScene(SceneId.HEADQUARTERS, {
        transition: new FadeTransition(0.4),
        payload: {
          spawnX: 2850,
          spawnY: 1850,
          targetFacilityId: FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
          deployedVehicle: {
            projectId: activeProj.projectId,
            name: activeProj.name,
            version: activeProj.designVersion,
            missionId: activeProj.assignedMissionId,
          },
        },
      });
    }
  }

  // =========================================================================
  // 8. RECORDS (ENGINEERING HISTORY LOG)
  // =========================================================================

  private renderRecordsSection(): void {
    const yStart = this.missionContext ? 152 : 118;
    const history = this.projectManager.getAllHistory();

    const topBar = new Graphics();
    topBar.roundRect(30, yStart, 1860, 48, 4);
    topBar.fill({ color: 0x08101e, alpha: 0.95 });
    topBar.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
    this.contentContainer.addChild(topBar);

    const title = new Text({
      text: `ENGINEERING ACTIVITY & EVENT LOG // ${history.length} RECORDED ENTRIES`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      }),
    });
    title.position.set(50, yStart + 15);
    this.contentContainer.addChild(title);

    history.slice(0, 10).forEach((ev, idx) => {
      const ey = yStart + 60 + idx * 80;

      const card = new Graphics();
      card.roundRect(30, ey, 1860, 70, 4);
      card.fill({ color: 0x08101e, alpha: 0.9 });
      card.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
      this.contentContainer.addChild(card);

      const typeTag = new Text({
        text: `[${ev.type}]`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.CYAN,
        }),
      });
      typeTag.position.set(50, ey + 12);
      this.contentContainer.addChild(typeTag);

      const dateStr = new Date(ev.timestamp).toISOString().replace('T', ' ').substring(0, 19);
      const timeTag = new Text({
        text: `${dateStr} UTC  |  PROJECT: ${ev.projectId}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      timeTag.position.set(300, ey + 13);
      this.contentContainer.addChild(timeTag);

      const summary = new Text({
        text: ev.summary,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      summary.position.set(50, ey + 38);
      this.contentContainer.addChild(summary);
    });
  }

  // =========================================================================
  // ACTION HANDLERS
  // =========================================================================

  private handleValidate(): void {
    const active = this.projectManager.getActiveProject();
    if (!active) return;

    const missionDef = this.missionContext ? this.missionRegistry.getMissionById(this.missionContext.missionId) : undefined;
    const report = this.projectManager.validateProjectComprehensive(active.projectId, missionDef);
    NotificationManager.getInstance().notify({
      title: report.isValid ? 'VALIDATION CERTIFIED' : 'VALIDATION DEFICIENT',
      message: report.summaryText,
      level: report.isValid ? 'SUCCESS' : 'WARNING',
    });

    this.setupHeader();
    this.switchToSection(RocketWorkspaceSection.VALIDATION);
  }

  private handleAssignMission(projectId: string, missionId: string): void {
    this.projectManager.assignToMission(projectId, missionId, this.missionContext?.instanceId);
    NotificationManager.getInstance().notify({
      title: 'VEHICLE ASSIGNED',
      message: `Assigned to mission contract: ${missionId}`,
      level: 'SUCCESS',
    });
    this.switchToSection(RocketWorkspaceSection.MISSION_COMPATIBILITY);
  }

  private handleUnassignMission(projectId: string): void {
    this.projectManager.unassignFromMission(projectId);
    NotificationManager.getInstance().notify({
      title: 'VEHICLE RELEASED',
      message: 'Vehicle released to unassigned standby pool.',
      level: 'INFO',
    });
    this.switchToSection(RocketWorkspaceSection.MISSION_COMPATIBILITY);
  }

  private handleCreateProjectModal(): void {
    const newProj = this.projectManager.createProject(
      `Vehicle Project ${Date.now().toString(36).substring(4).toUpperCase()}`,
      'Custom launcher staging project initialized for mission flight profiles.',
      RocketClassRating.LIGHT_ORBITAL
    );

    NotificationManager.getInstance().notify({
      title: 'NEW PROJECT CREATED',
      message: `Created rocket project "${newProj.name}".`,
      level: 'SUCCESS',
    });

    this.setupHeader();
    this.switchToSection(RocketWorkspaceSection.BUILDER);
  }

  public openComparisonModal(compAId: string, compBId: string): void {
    const compResult = this.componentRegistry.compareComponents(compAId, compBId);
    if (!compResult) return;

    this.comparisonModal = new ComponentComparisonModal({
      comparison: compResult,
      onClose: () => this.closeComparisonModal(),
    });
    this.modalContainer.addChild(this.comparisonModal.container);
  }

  public closeComparisonModal(): void {
    if (this.comparisonModal) {
      this.modalContainer.removeChild(this.comparisonModal.container);
      this.comparisonModal = undefined;
      this.comparisonSelectedCompId = undefined;
      this.switchToSection(RocketWorkspaceSection.COMPONENTS);
    }
  }

  public async returnToPrevious(): Promise<void> {
    if (this.fromMoc) {
      Logger.info('ROCKET_ENGINEERING_SCENE', 'Returning to Mission Operations Centre...');
      if (this.sceneManager) {
        await this.sceneManager.switchScene(SceneId.MISSION_OPERATIONS, {
          transition: new FadeTransition(0.4),
        });
      }
    } else {
      Logger.info('ROCKET_ENGINEERING_SCENE', 'Returning to Headquarters Campus exterior...');
      if (this.sceneManager) {
        await this.sceneManager.switchScene(SceneId.HEADQUARTERS, {
          transition: new FadeTransition(0.4),
          payload: {
            spawnX: this.returnSpawnX,
            spawnY: this.returnSpawnY,
          },
        });
      }
    }
  }

  protected onUpdate(deltaSeconds: number): void {
    // ESC key closes comparison modal first if open
    if (this.comparisonModal) {
      if (this.inputManager?.isActionJustPressed(InputAction.Cancel)) {
        this.closeComparisonModal();
        return;
      }
    }

    // ESC key returns to previous scene
    if (this.inputManager?.isActionJustPressed(InputAction.Cancel)) {
      this.returnToPrevious();
      return;
    }

    if (this.pipeline) {
      this.pipeline.update(deltaSeconds);
    }
  }

  // =========================================================================
  // GETTERS FOR VERIFICATION
  // =========================================================================

  public getActiveSection(): RocketWorkspaceSection {
    return this.activeSection;
  }

  public getActiveProject(): RocketProject | undefined {
    return this.projectManager.getActiveProject();
  }

  public getProjectManager(): RocketProjectManager {
    return this.projectManager;
  }

  public getComponentRegistry(): RocketComponentRegistry {
    return this.componentRegistry;
  }

  public getInventoryService(): ComponentInventoryService {
    return this.inventoryService;
  }

  public getComparisonModal(): ComponentComparisonModal | undefined {
    return this.comparisonModal;
  }

  public getBuilderView(): VisualRocketBuilderView | undefined {
    return this.builderView;
  }

  public getMissionContext(): { missionId: string; instanceId?: string; fromMoc?: boolean } | undefined {
    return this.missionContext;
  }

  public getContentContainer(): Container {
    return this.contentContainer;
  }

  public getEventBus(): EventBus | undefined {
    return this.eventBus;
  }
}
