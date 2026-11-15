/**
 * INTERSTELLAR CONTINUUM - Mission Operations Centre (MOC) Scene
 * Central flight planning and mission-design operations hub featuring
 * interactive 2D Solar System map, Earth orbital regimes, and destination telemetry.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { ServiceLocator } from '../core/ServiceLocator';
import { RenderEngine, RenderPipeline, RenderLayerType } from '../rendering';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { EventBus } from '../core/EventBus';
import { SceneManager } from './SceneManager';
import { FadeTransition } from './transitions/FadeTransition';
import { Logger } from '../core/logging/Logger';

import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../ui/core/UIDesignTokens';
import { UIButton } from '../ui/components/UIButton';
import { UITabGroup, UITabItem } from '../ui/components/UITabGroup';
import { SolarSystemMapCanvas } from '../destinations/ui/SolarSystemMapCanvas';
import { DestinationInfoPanel } from '../destinations/ui/DestinationInfoPanel';
import { EarthOrbitDisplay } from '../destinations/ui/EarthOrbitDisplay';
import { DestinationRegistry } from '../destinations/DestinationRegistry';
import { DestinationRecord, DestinationId } from '../destinations/DestinationTypes';
import { MissionCatalogueView } from '../missions/ui/MissionCatalogueView';
import { MissionBriefingView } from '../missions/ui/MissionBriefingView';
import { ActiveMissionsDashboardView } from '../missions/ui/ActiveMissionsDashboardView';
import { MissionCatalogueRegistry } from '../missions/MissionCatalogueRegistry';
import { FacilityRegistry } from '../facilities/FacilityRegistry';
import { FacilityId } from '../facilities/FacilityTypes';
import type { MissionDefinition } from '../missions/MissionTypes';

export enum MOCSection {
  SOLAR_SYSTEM = 'SOLAR_SYSTEM',
  MISSION_CATALOGUE = 'MISSION_CATALOGUE',
  ACTIVE_MISSIONS = 'ACTIVE_MISSIONS',
  MISSION_ARCHIVE = 'MISSION_ARCHIVE',
  DESTINATION_INTEL = 'DESTINATION_INTEL',
}

export class MissionOperationsScene extends BaseScene {
  public readonly id = SceneId.MISSION_OPERATIONS;

  private sceneManager?: SceneManager;
  private inputManager?: InputManager;
  private eventBus?: EventBus;
  private pipeline?: RenderPipeline;
  private destinationRegistry: DestinationRegistry;
  private missionRegistry: MissionCatalogueRegistry;

  private headerContainer: Container;
  private tabsContainer: Container;
  private contentContainer: Container;
  private placeholderContainer: Container;

  private tabGroup?: UITabGroup;
  private returnBtn?: UIButton;

  private mapCanvas?: SolarSystemMapCanvas;
  private infoPanel?: DestinationInfoPanel;
  private earthOrbitDisplay?: EarthOrbitDisplay;
  private missionCatalogueView?: MissionCatalogueView;
  private missionBriefingView?: MissionBriefingView;
  private activeMissionsDashboard?: ActiveMissionsDashboardView;
  private facilityRegistry: FacilityRegistry;

  private activeSection: MOCSection = MOCSection.SOLAR_SYSTEM;
  private selectedDestination: DestinationRecord | null = null;
  private isViewingEarthOrbits: boolean = false;
  private isViewingBriefing: boolean = false;

  private returnSpawnX: number = 1800;
  private returnSpawnY: number = 1730;

  constructor() {
    super();
    this.destinationRegistry = DestinationRegistry.getInstance();
    this.missionRegistry = MissionCatalogueRegistry.getInstance();
    this.facilityRegistry = FacilityRegistry.getInstance();
    this.headerContainer = new Container();
    this.tabsContainer = new Container();
    this.contentContainer = new Container();
    this.placeholderContainer = new Container();
  }

  protected async onInitialize(): Promise<void> {
    Logger.info('MISSION_OPERATIONS_SCENE', 'Initializing Mission Operations Centre Scene...');

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
    uiContainer.addChild(this.placeholderContainer);
    uiContainer.addChild(this.headerContainer);
    uiContainer.addChild(this.tabsContainer);

    this.setupHeader();
    this.setupTabs();
    this.setupMapAndPanels();

    // Default selection is Earth
    const earth = this.destinationRegistry.getDestination(DestinationId.EARTH);
    if (earth) {
      this.handleSelectDestination(earth);
    }
  }

  protected override async onActivate(payload?: any): Promise<void> {
    super.onActivate(payload);

    if (payload) {
      if (typeof payload.returnX === 'number') this.returnSpawnX = payload.returnX;
      if (typeof payload.returnY === 'number') this.returnSpawnY = payload.returnY;
    }

    if (this.inputManager) {
      this.inputManager.setContext('MISSION_OPERATIONS');
    }

    this.switchToSection(MOCSection.SOLAR_SYSTEM);
    Logger.info('MISSION_OPERATIONS_SCENE', 'Mission Operations Centre activated.');
  }

  private setupHeader(): void {
    this.headerContainer.removeChildren();

    // Background header bar
    const barGfx = new Graphics();
    barGfx.rect(0, 0, 1920, 68);
    barGfx.fill({ color: 0x020713, alpha: 0.95 });
    barGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Decorative top accent strip
    barGfx.rect(0, 0, 1920, 3).fill({ color: UI_COLORS.CYAN, alpha: 0.9 });
    this.headerContainer.addChild(barGfx);

    // Facility title & telemetry
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 2.0,
    });
    const title = new Text({
      text: 'MISSION OPERATIONS CENTRE // MOC-01',
      style: titleStyle,
    });
    title.position.set(30, 14);
    this.headerContainer.addChild(title);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10.5,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });
    const sub = new Text({
      text: 'FLIGHT DYNAMICS & SOLAR SYSTEM DESTINATIONS // STATUS: ONLINE',
      style: subStyle,
    });
    sub.position.set(30, 38);
    this.headerContainer.addChild(sub);

    // Return to Headquarters Button
    this.returnBtn = new UIButton({
      label: 'RETURN TO CAMPUS [ESC]',
      variant: 'OUTLINE',
      width: 230,
      height: 38,
      onClick: () => this.returnToHeadquarters(),
    });
    this.returnBtn.container.position.set(1660, 14);
    this.headerContainer.addChild(this.returnBtn.container);
  }

  private setupTabs(): void {
    this.tabsContainer.removeChildren();
    this.tabsContainer.position.set(30, 78);

    const tabs: UITabItem[] = [
      { id: MOCSection.SOLAR_SYSTEM, label: 'SOLAR SYSTEM MAP' },
      { id: MOCSection.MISSION_CATALOGUE, label: 'MISSION CATALOGUE' },
      { id: MOCSection.ACTIVE_MISSIONS, label: 'ACTIVE MISSIONS (0)' },
      { id: MOCSection.MISSION_ARCHIVE, label: 'MISSION ARCHIVE' },
      { id: MOCSection.DESTINATION_INTEL, label: 'DESTINATION INTEL' },
    ];

    this.tabGroup = new UITabGroup({
      tabs,
      initialTabId: MOCSection.SOLAR_SYSTEM,
      width: 1000,
      height: 36,
      onTabChange: (tabId: string) => {
        this.switchToSection(tabId as MOCSection);
      },
    });
    this.tabsContainer.addChild(this.tabGroup.container);
  }

  private setupMapAndPanels(): void {
    // 1. Solar System Map Canvas
    this.mapCanvas = new SolarSystemMapCanvas({
      x: 30,
      y: 130,
      width: 1330,
      height: 920,
      onSelectDestination: (dest) => this.handleSelectDestination(dest),
    });
    this.contentContainer.addChild(this.mapCanvas.container);

    // 2. Destination Information Panel
    this.infoPanel = new DestinationInfoPanel({
      x: 1380,
      y: 130,
      width: 510,
      height: 920,
      onBrowseMissions: (dest) => {
        this.switchToSection(MOCSection.MISSION_CATALOGUE);
        if (dest && this.missionCatalogueView) {
          this.missionCatalogueView.setDestinationFilter(dest.id);
        }
      },
      onViewSubDestinations: (dest) => {
        if (dest.id === DestinationId.EARTH) {
          this.toggleEarthOrbitDisplay(true);
        }
      },
      onClose: () => {
        this.mapCanvas?.setSelectedDestination(null);
        this.selectedDestination = null;
      },
    });
    this.contentContainer.addChild(this.infoPanel.container);

    // 3. Earth Orbit Display (Sub-Hierarchy)
    this.earthOrbitDisplay = new EarthOrbitDisplay({
      x: 30,
      y: 130,
      width: 1330,
      height: 920,
      onSelectDestination: (dest) => this.handleSelectDestination(dest),
      onReturnToSolarSystem: () => this.toggleEarthOrbitDisplay(false),
    });
    this.earthOrbitDisplay.container.visible = false;
    this.contentContainer.addChild(this.earthOrbitDisplay.container);

    // 4. Mission Catalogue View (Tab 2)
    this.missionCatalogueView = new MissionCatalogueView({
      x: 30,
      y: 130,
      width: 1860,
      height: 920,
      onSelectMission: (mission) => {
        Logger.info('MISSION_OPERATIONS_SCENE', `Selected mission: ${mission.id} - ${mission.name}`);
      },
      onCommencePlanning: (mission) => {
        Logger.info('MISSION_OPERATIONS_SCENE', `Opening briefing for mission: ${mission.id} - ${mission.name}`);
        this.openMissionBriefing(mission);
      },
      onViewOnMap: (destId) => {
        const dest = this.destinationRegistry.getDestination(destId);
        if (dest) {
          this.switchToSection(MOCSection.SOLAR_SYSTEM);
          this.handleSelectDestination(dest);
        }
      },
    });
    this.missionCatalogueView.container.visible = false;
    this.contentContainer.addChild(this.missionCatalogueView.container);

    // 5. Mission Briefing View (Detailed 10-section dossier)
    this.missionBriefingView = new MissionBriefingView({
      x: 30,
      y: 130,
      width: 1860,
      height: 920,
      onReturnToCatalogue: () => {
        this.closeMissionBriefing();
      },
      onMissionAccepted: (mission) => {
        Logger.info('MISSION_OPERATIONS_SCENE', `Mission accepted: ${mission.id} - ${mission.name}`);
      },
      onProceedToVehicleAssembly: (mission) => {
        Logger.info('MISSION_OPERATIONS_SCENE', `Proceeding to VAB for mission: ${mission.id}`);
        this.closeMissionBriefing();
        if (this.sceneManager) {
          this.sceneManager.switchScene(SceneId.ROCKET_ENGINEERING, {
            transition: new FadeTransition(0.4),
            payload: {
              missionContext: {
                missionId: mission.id,
                fromMoc: true,
              },
              returnX: 2750,
              returnY: 1210,
              fromMoc: true,
            },
          });
        } else {
          this.switchToSection(MOCSection.ACTIVE_MISSIONS);
        }
      },
      onViewOnSolarMap: (destId) => {
        const dest = this.destinationRegistry.getDestination(destId);
        if (dest) {
          this.closeMissionBriefing();
          this.switchToSection(MOCSection.SOLAR_SYSTEM);
          this.handleSelectDestination(dest);
        }
      },
    });
    this.missionBriefingView.container.visible = false;
    this.contentContainer.addChild(this.missionBriefingView.container);

    // 6. Active Missions Management Dashboard (Tab 3)
    this.activeMissionsDashboard = new ActiveMissionsDashboardView({
      x: 30,
      y: 130,
      width: 1860,
      height: 920,
      onBrowseCatalogue: () => {
        this.switchToSection(MOCSection.MISSION_CATALOGUE);
      },
      onNavigateToFacility: (facilityId, instance) => {
        const fac = this.facilityRegistry.getFacility(facilityId);
        Logger.info(
          'MISSION_OPERATIONS_SCENE',
          `Routing to facility "${fac?.name ?? facilityId}" with preserved mission context: "${instance.missionId}"`
        );
        if (facilityId === FacilityId.ROCKET_ENGINEERING) {
          if (this.sceneManager) {
            this.sceneManager.switchScene(SceneId.ROCKET_ENGINEERING, {
              transition: new FadeTransition(0.4),
              payload: {
                missionContext: {
                  missionId: instance.missionId,
                  instanceId: instance.instanceId,
                  fromMoc: true,
                },
                returnX: 2750,
                returnY: 1210,
                fromMoc: true,
              },
            });
          }
        } else if (facilityId === FacilityId.LAUNCH_COMPLEX_PAD_ALPHA) {
          if (this.sceneManager) {
            this.sceneManager.switchScene(SceneId.HEADQUARTERS, {
              transition: new FadeTransition(0.4),
              payload: {
                spawnX: 2850,
                spawnY: 1850,
                targetFacilityId: FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
                openDashboard: true,
                missionContext: {
                  missionId: instance.missionId,
                  instanceId: instance.instanceId,
                  fromMoc: true,
                },
              },
            });
          }
        }
      },
    });
    this.activeMissionsDashboard.container.visible = false;
    this.contentContainer.addChild(this.activeMissionsDashboard.container);
  }

  public handleSelectDestination(dest: DestinationRecord): void {
    if (this.selectedDestination?.id === dest.id) {
      this.infoPanel?.setDestination(dest);
      return;
    }

    this.selectedDestination = dest;
    this.infoPanel?.setDestination(dest);

    if (this.eventBus) {
      this.eventBus.emit('destination:selected' as any, {
        destinationId: dest.id,
        name: dest.name,
      });
    }

    if (this.isViewingEarthOrbits) {
      this.earthOrbitDisplay?.setSelectedDestination(dest.id);
    } else {
      this.mapCanvas?.setSelectedDestination(dest.id, false);
    }
  }

  public toggleEarthOrbitDisplay(show: boolean): void {
    this.isViewingEarthOrbits = show;

    if (this.earthOrbitDisplay && this.mapCanvas && this.infoPanel) {
      this.earthOrbitDisplay.container.visible = show;
      this.mapCanvas.container.visible = !show;
      this.infoPanel.container.visible = true;
      if (this.missionCatalogueView) {
        this.missionCatalogueView.container.visible = false;
      }
      if (this.missionBriefingView) {
        this.missionBriefingView.container.visible = false;
      }

      if (show) {
        const leo = this.destinationRegistry.getDestination(DestinationId.EARTH_ORBIT_LEO);
        if (leo) {
          this.handleSelectDestination(leo);
        }
      } else {
        const earth = this.destinationRegistry.getDestination(DestinationId.EARTH);
        if (earth) {
          this.handleSelectDestination(earth);
        }
      }
    }
  }

  public switchToSection(section: MOCSection): void {
    this.activeSection = section;
    this.tabGroup?.selectTab(section);

    if (section === MOCSection.SOLAR_SYSTEM) {
      this.contentContainer.visible = true;
      this.placeholderContainer.visible = false;
      if (this.missionCatalogueView) {
        this.missionCatalogueView.container.visible = false;
      }
      if (this.missionBriefingView) {
        this.missionBriefingView.container.visible = false;
      }
      if (this.activeMissionsDashboard) {
        this.activeMissionsDashboard.container.visible = false;
      }
      this.isViewingBriefing = false;
      this.toggleEarthOrbitDisplay(this.isViewingEarthOrbits);
    } else if (section === MOCSection.MISSION_CATALOGUE) {
      this.contentContainer.visible = true;
      this.placeholderContainer.visible = false;
      if (this.mapCanvas) this.mapCanvas.container.visible = false;
      if (this.infoPanel) this.infoPanel.container.visible = false;
      if (this.earthOrbitDisplay) this.earthOrbitDisplay.container.visible = false;
      if (this.activeMissionsDashboard) {
        this.activeMissionsDashboard.container.visible = false;
      }

      if (this.isViewingBriefing && this.missionBriefingView) {
        this.missionBriefingView.container.visible = true;
        if (this.missionCatalogueView) {
          this.missionCatalogueView.container.visible = false;
        }
      } else {
        if (this.missionBriefingView) {
          this.missionBriefingView.container.visible = false;
        }
        if (this.missionCatalogueView) {
          this.missionCatalogueView.container.visible = true;
          if (this.selectedDestination) {
            this.missionCatalogueView.setDestinationFilter(this.selectedDestination.id);
          }
        }
      }
    } else if (section === MOCSection.ACTIVE_MISSIONS) {
      this.contentContainer.visible = true;
      this.placeholderContainer.visible = false;
      if (this.mapCanvas) this.mapCanvas.container.visible = false;
      if (this.infoPanel) this.infoPanel.container.visible = false;
      if (this.earthOrbitDisplay) this.earthOrbitDisplay.container.visible = false;
      if (this.missionCatalogueView) this.missionCatalogueView.container.visible = false;
      if (this.missionBriefingView) this.missionBriefingView.container.visible = false;
      this.isViewingBriefing = false;

      if (this.activeMissionsDashboard) {
        this.activeMissionsDashboard.container.visible = true;
        this.activeMissionsDashboard.refresh();
      }
    } else {
      if (this.missionBriefingView) {
        this.missionBriefingView.container.visible = false;
      }
      if (this.activeMissionsDashboard) {
        this.activeMissionsDashboard.container.visible = false;
      }
      this.contentContainer.visible = false;
      this.placeholderContainer.visible = true;
      this.renderPlaceholderSection(section);
    }
  }

  public openMissionBriefing(mission: MissionDefinition): void {
    if (!this.missionBriefingView) return;
    this.isViewingBriefing = true;

    if (this.missionCatalogueView) {
      this.missionCatalogueView.container.visible = false;
    }
    if (this.mapCanvas) this.mapCanvas.container.visible = false;
    if (this.infoPanel) this.infoPanel.container.visible = false;
    if (this.earthOrbitDisplay) this.earthOrbitDisplay.container.visible = false;
    if (this.activeMissionsDashboard) this.activeMissionsDashboard.container.visible = false;
    this.placeholderContainer.visible = false;
    this.contentContainer.visible = true;

    this.missionBriefingView.container.visible = true;
    this.missionBriefingView.setMission(mission);

    if (this.eventBus) {
      this.eventBus.emit('mission:briefing:opened' as any, { missionId: mission.id });
    }
    Logger.info('MISSION_OPERATIONS_SCENE', `Opened mission briefing for: ${mission.id}`);
  }

  public closeMissionBriefing(): void {
    if (!this.missionBriefingView) return;
    const missionId = this.missionBriefingView.getMission()?.id;
    this.isViewingBriefing = false;
    this.missionBriefingView.container.visible = false;

    if (this.activeSection === MOCSection.MISSION_CATALOGUE && this.missionCatalogueView) {
      this.missionCatalogueView.container.visible = true;
    } else {
      this.switchToSection(this.activeSection);
    }

    if (this.eventBus && missionId) {
      this.eventBus.emit('mission:briefing:closed' as any, { missionId });
    }
    Logger.info('MISSION_OPERATIONS_SCENE', 'Closed mission briefing, returned to catalogue.');
  }

  public isBriefingActive(): boolean {
    return this.isViewingBriefing;
  }

  public getMissionBriefingView(): MissionBriefingView | undefined {
    return this.missionBriefingView;
  }

  public getActiveMissionsDashboard(): ActiveMissionsDashboardView | undefined {
    return this.activeMissionsDashboard;
  }

  private renderPlaceholderSection(section: MOCSection): void {
    this.placeholderContainer.removeChildren();

    const box = new Graphics();
    box.roundRect(30, 130, 1860, 920, UI_RADIUS.MD);
    box.fill({ color: 0x030814, alpha: 0.96 });
    box.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });
    this.placeholderContainer.addChild(box);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 20,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 2.0,
    });

    const bodyStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fill: UI_COLORS.TEXT_SECONDARY,
      lineHeight: 20,
    });

    let sectionTitle = '';
    let sectionDesc = '';

    switch (section) {
      case MOCSection.MISSION_CATALOGUE:
        sectionTitle = 'MISSION CATALOGUE // FLIGHT MANIFESTS';
        sectionDesc =
          `Selected Target: ${this.selectedDestination?.name ?? 'Earth & LEO'}\n\n` +
          'The complete mission catalogue and orbital flight contract bidding architecture will be integrated in subsequent phases.\n' +
          'Initial flight manifests will include suborbital atmospheric sounding, cubesat orbital insertion, and lunar reconnaissance.';
        break;

      case MOCSection.ACTIVE_MISSIONS:
        sectionTitle = 'ACTIVE MISSIONS // TELEMETRY DOWNLINK';
        sectionDesc =
          'NO ACTIVE FLIGHT MISSIONS IN PROGRESS.\n\n' +
          'All agency spacecraft and sounding probes are on launchpad standby or under assembly in the VAB.\n' +
          'Real-time flight trajectories, Capcom comms, and orbital staging monitors will stream here once a mission is launched.';
        break;

      case MOCSection.MISSION_ARCHIVE:
        sectionTitle = 'MISSION ARCHIVE // HISTORICAL FLIGHT LOG';
        sectionDesc =
          'AGENCY FLIGHT ARCHIVE INITIALIZED.\n\n' +
          'Completed and decommissioned space exploration missions, scientific milestone telemetry, and recovered research payloads will be cataloged in this repository.';
        break;

      case MOCSection.DESTINATION_INTEL:
        sectionTitle = 'DESTINATION INTEL // SCIENTIFIC COMPENDIUM';
        sectionDesc =
          `Detailed celestial body telemetry for: ${this.selectedDestination?.name ?? 'Solar System'}\n\n` +
          (this.selectedDestination?.scientificDescription ?? 'Select a destination from the Solar System map to review scientific compendium records.');
        break;
    }

    const t = new Text({ text: sectionTitle, style: titleStyle });
    t.position.set(60, 170);
    this.placeholderContainer.addChild(t);

    const d = new Text({ text: sectionDesc, style: bodyStyle });
    d.position.set(60, 220);
    this.placeholderContainer.addChild(d);

    const returnBtn = new UIButton({
      label: '◀ RETURN TO SOLAR SYSTEM MAP',
      variant: 'PRIMARY',
      width: 280,
      height: 40,
      onClick: () => this.switchToSection(MOCSection.SOLAR_SYSTEM),
    });
    returnBtn.container.position.set(60, 360);
    this.placeholderContainer.addChild(returnBtn.container);
  }

  protected onUpdate(deltaSeconds: number): void {
    // 1. ESC key: returns to headquarters or backs out of briefing / Earth orbit hierarchy
    if (this.inputManager?.isActionJustPressed(InputAction.Cancel)) {
      if (this.isViewingBriefing) {
        this.closeMissionBriefing();
      } else if (this.isViewingEarthOrbits) {
        this.toggleEarthOrbitDisplay(false);
      } else if (this.activeSection !== MOCSection.SOLAR_SYSTEM) {
        this.switchToSection(MOCSection.SOLAR_SYSTEM);
      } else {
        this.returnToHeadquarters();
      }
      return;
    }

    // 2. Keyboard cycling of planets: A/D or Left/Right
    if (this.activeSection === MOCSection.SOLAR_SYSTEM && !this.isViewingEarthOrbits) {
      if (
        this.inputManager?.isActionJustPressed(InputAction.MoveRight) ||
        this.inputManager?.isKeyJustPressed('ArrowRight') ||
        this.inputManager?.isKeyJustPressed('KeyD')
      ) {
        this.mapCanvas?.cycleNextPlanet();
      } else if (
        this.inputManager?.isActionJustPressed(InputAction.MoveLeft) ||
        this.inputManager?.isKeyJustPressed('ArrowLeft') ||
        this.inputManager?.isKeyJustPressed('KeyA')
      ) {
        this.mapCanvas?.cyclePreviousPlanet();
      }
    }

    // 3. Tab hotkeys 1..5
    if (this.inputManager?.isKeyJustPressed('Digit1')) this.switchToSection(MOCSection.SOLAR_SYSTEM);
    if (this.inputManager?.isKeyJustPressed('Digit2')) this.switchToSection(MOCSection.MISSION_CATALOGUE);
    if (this.inputManager?.isKeyJustPressed('Digit3')) this.switchToSection(MOCSection.ACTIVE_MISSIONS);
    if (this.inputManager?.isKeyJustPressed('Digit4')) this.switchToSection(MOCSection.MISSION_ARCHIVE);
    if (this.inputManager?.isKeyJustPressed('Digit5')) this.switchToSection(MOCSection.DESTINATION_INTEL);

    // 4. Update dynamic components
    if (this.contentContainer.visible) {
      if (this.isViewingEarthOrbits) {
        this.earthOrbitDisplay?.update(deltaSeconds);
      } else {
        this.mapCanvas?.update(deltaSeconds);
      }
    }

    // 5. Update Rendering Pipeline
    if (this.pipeline) {
      this.pipeline.update(deltaSeconds);
    }
  }

  public async returnToHeadquarters(): Promise<void> {
    Logger.info('MISSION_OPERATIONS_SCENE', 'Returning to Headquarters Campus exterior...');
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

  // Verification getters
  public getActiveSection(): MOCSection {
    return this.activeSection;
  }

  public getSelectedDestination(): DestinationRecord | null {
    return this.selectedDestination;
  }

  public getMapCanvas(): SolarSystemMapCanvas | undefined {
    return this.mapCanvas;
  }

  public getInfoPanel(): DestinationInfoPanel | undefined {
    return this.infoPanel;
  }

  public getEarthOrbitDisplay(): EarthOrbitDisplay | undefined {
    return this.earthOrbitDisplay;
  }

  public isEarthOrbitsActive(): boolean {
    return this.isViewingEarthOrbits;
  }

  public getMissionCatalogueView(): MissionCatalogueView | undefined {
    return this.missionCatalogueView;
  }

  public getMissionRegistry(): MissionCatalogueRegistry {
    return this.missionRegistry;
  }

  protected onCleanup(): void {
    Logger.info('MISSION_OPERATIONS_SCENE', 'Cleaning up Mission Operations Centre Scene...');
    this.mapCanvas?.destroy();
    this.infoPanel?.destroy();
    this.earthOrbitDisplay?.destroy();
    this.missionCatalogueView?.destroy();
    this.missionBriefingView?.destroy();
  }
}
