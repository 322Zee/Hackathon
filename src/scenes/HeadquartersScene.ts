/**
 * INTERSTELLAR CONTINUUM - Earth-Based Headquarters Campus Scene
 * Complete, navigable 2D/2.5D aerospace research and engineering campus
 * Integrates 12 major facilities, Central Plaza, Pad Alpha Launch Complex,
 * independent-axis collision sliding, depth sorting, lighting, camera tracking, and interaction framework.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { SceneManager } from './SceneManager';
import { ServiceLocator } from '../core/ServiceLocator';
import { RenderEngine, RenderPipeline, RenderLayerType } from '../rendering';
import { CameraSystem } from '../camera/CameraSystem';
import { CameraMode, ZoomPreset } from '../camera/CameraMode';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { EventBus } from '../core/EventBus';
import { CollisionSystem } from '../collision/CollisionSystem';
import { PlayerCharacter, FacingDirection } from '../player/PlayerCharacter';
import { MovementComponent } from '../player/MovementComponent';
import { PlayerController } from '../player/PlayerController';
import { PlayerSystem } from '../player/PlayerSystem';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { Logger } from '../core/logging/Logger';

import { CAMPUS_WIDTH, CAMPUS_HEIGHT, CAMPUS_FACILITIES } from '../environment/headquarters/CampusTypes';
import { CampusGroundRenderer } from '../environment/headquarters/CampusGroundRenderer';
import { CampusBuilding } from '../environment/headquarters/CampusBuilding';
import { CampusDecorations } from '../environment/headquarters/CampusDecorations';
import { LaunchComplexInteractiveZones } from '../environment/headquarters/LaunchComplexInteractiveZones';
import { FacilityRegistry } from '../facilities/FacilityRegistry';
import { FacilityRecord, FacilityId } from '../facilities/FacilityTypes';
import { FacilityAccessModal } from '../facilities/FacilityAccessModal';
import { LaunchDeploymentManager } from '../launch/LaunchDeploymentManager';
import { LaunchpadRocketVisual } from '../launch/ui/LaunchpadRocketVisual';
import { LaunchOperationsDashboardModal } from '../launch/ui/LaunchOperationsDashboardModal';
import { LaunchObservationView } from '../launch/ui/LaunchObservationView';
import { RocketProjectManager } from '../engineering/RocketProjectManager';
import { MissionLifecycleManager } from '../missions/MissionLifecycleManager';
import { GlobalHUD } from '../ui';
import { PauseMenu } from '../ui/pause/PauseMenu';
import { SettingsManager } from '../settings/SettingsManager';
import { TutorialManager } from '../tutorial/TutorialManager';
import { TutorialSequenceId } from '../tutorial/TutorialTypes';
import { TutorialWaypointMarker } from '../tutorial/TutorialWaypointMarker';
import { TutorialPanel } from '../ui/tutorial/TutorialPanel';

export class HeadquartersScene extends BaseScene {
  public readonly id = SceneId.HEADQUARTERS;

  public readonly mapWidth: number = CAMPUS_WIDTH;
  public readonly mapHeight: number = CAMPUS_HEIGHT;

  public globalHud?: GlobalHUD;
  public pauseMenu?: PauseMenu;
  public tutorialManager?: TutorialManager;
  public waypointMarker?: TutorialWaypointMarker;
  public tutorialPanel?: TutorialPanel;
  private windowBlurHandler?: () => void;

  private pipeline?: RenderPipeline;
  private cameraSystem?: CameraSystem;
  private collisionSystem?: CollisionSystem;
  private inputManager?: InputManager;
  private eventBus?: EventBus;
  private interactionSystem?: InteractionSystem;
  private sceneManager?: SceneManager;
  private facilityRegistry?: FacilityRegistry;

  private player?: PlayerCharacter;
  private controller?: PlayerController;
  private playerSystem?: PlayerSystem;

  private groundRenderer?: CampusGroundRenderer;
  private decorations?: CampusDecorations;
  private launchZones?: LaunchComplexInteractiveZones;
  private buildings: Map<string, CampusBuilding> = new Map();
  private facilityAccessModal?: FacilityAccessModal;

  // Launch Complex Operations & Launchpad Visual
  private launchpadRocketVisual?: LaunchpadRocketVisual;
  private launchDashboardModal?: LaunchOperationsDashboardModal;
  private launchObservationView?: LaunchObservationView;
  private deploymentManager?: LaunchDeploymentManager;
  private rocketProjectManager?: RocketProjectManager;

  // Floating atmospheric dust / pollen particles
  private atmosphericDustGfx?: Graphics;
  private dustParticles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }> = [];

  // Diagnostics HUD
  private telemetryText?: Text;
  private logMessageText?: Text;
  private debugNavContainer?: Container;
  private activeFeedbackTimer: number = 0;

  protected async onInitialize(): Promise<void> {
    Logger.info('HEADQUARTERS_SCENE', 'Initializing Headquarters Aerospace Campus Scene...');

    // 1. Resolve or establish Core Services
    if (ServiceLocator.has('EventBus')) {
      this.eventBus = ServiceLocator.get<EventBus>('EventBus');
    } else {
      this.eventBus = new EventBus();
      ServiceLocator.register('EventBus', this.eventBus);
    }

    this.deploymentManager = LaunchDeploymentManager.getInstance(this.eventBus);
    this.rocketProjectManager = RocketProjectManager.getInstance(this.eventBus);

    if (ServiceLocator.has('SceneManager')) {
      this.sceneManager = ServiceLocator.get<SceneManager>('SceneManager');
    }

    if (ServiceLocator.has('FacilityRegistry')) {
      this.facilityRegistry = ServiceLocator.get<FacilityRegistry>('FacilityRegistry');
    } else {
      this.facilityRegistry = FacilityRegistry.getInstance(this.eventBus);
      ServiceLocator.register('FacilityRegistry', this.facilityRegistry);
    }

    if (ServiceLocator.has('RenderEngine')) {
      const renderEngine = ServiceLocator.get<RenderEngine>('RenderEngine');
      this.pipeline = renderEngine.getPipeline();
    } else {
      this.pipeline = new RenderPipeline(this.container);
    }

    if (ServiceLocator.has('CameraSystem')) {
      this.cameraSystem = ServiceLocator.get<CameraSystem>('CameraSystem');
    } else {
      this.cameraSystem = new CameraSystem();
      this.cameraSystem.setLayerManager(this.pipeline.layerManager);
    }

    if (ServiceLocator.has('InputManager')) {
      this.inputManager = ServiceLocator.get<InputManager>('InputManager');
    } else {
      this.inputManager = new InputManager();
      this.inputManager.initialize();
    }

    // 2. Establish Collision System
    if (ServiceLocator.has('CollisionSystem')) {
      this.collisionSystem = ServiceLocator.get<CollisionSystem>('CollisionSystem');
    } else {
      this.collisionSystem = new CollisionSystem({ eventBus: this.eventBus });
      this.collisionSystem.initialize();
      ServiceLocator.register('CollisionSystem', this.collisionSystem);
    }
    this.collisionSystem.setEventBus(this.eventBus);

    // 3. Establish Interaction System
    if (ServiceLocator.has('InteractionSystem')) {
      this.interactionSystem = ServiceLocator.get<InteractionSystem>('InteractionSystem');
    } else {
      this.interactionSystem = new InteractionSystem({
        eventBus: this.eventBus,
        inputManager: this.inputManager,
      });
      this.interactionSystem.initialize();
      ServiceLocator.register('InteractionSystem', this.interactionSystem);
    }
    if (this.eventBus) this.interactionSystem.setEventBus(this.eventBus);
    if (this.inputManager) this.interactionSystem.setInputManager(this.inputManager);

    // 4. Configure Camera for 3600x2400 Campus Bounds
    this.cameraSystem.setBounds({
      minX: 0,
      minY: 0,
      maxX: this.mapWidth,
      maxY: this.mapHeight,
    });
    this.cameraSystem.setMode(CameraMode.PLAYER_FOLLOW);
    this.cameraSystem.setZoomPreset(ZoomPreset.NORMAL_EXPLORATION);

    // 5. Build Campus Environment (Ground, Buildings, Props, Lighting)
    this.buildCampusEnvironment();

    // 6. Spawn Mission Director Player Character
    this.setupPlayer();

    // 7. Connect Camera Target Tracking
    this.cameraSystem.setTarget(this.player!);
    this.cameraSystem.setDeadzone(140, 90);
    this.cameraSystem.setLookahead({
      leadTimeSeconds: 0.35,
      maxDistance: 240,
      smoothing: 0.1,
    });

    // 8. Connect Interaction System Visuals & Register Facility Portals
    if (this.pipeline && this.interactionSystem) {
      this.interactionSystem.setPlayer(this.player);

      // Attach in-world contextual prompt to GAMEPLAY_OBJECTS
      const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
      gameplayContainer.addChild(this.interactionSystem.getContextualPrompt().container);

      // Attach information modal dialog to UI_OVERLAY
      const uiOverlayContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);
      uiOverlayContainer.addChild(this.interactionSystem.getInformationPanel().container);

      // Attach facility access modal dialog to UI_OVERLAY
      this.facilityAccessModal = new FacilityAccessModal(this.inputManager, this.eventBus);
      uiOverlayContainer.addChild(this.facilityAccessModal.container);

      // Attach Launch Operations Dashboard & Observation View to UI_OVERLAY
      this.launchDashboardModal = new LaunchOperationsDashboardModal({
        onObserveAtPad: () => {
          this.cameraSystem?.setPosition(3050, 1830);
        },
        onNavigateToMOC: () => {
          if (this.sceneManager) {
            this.sceneManager.switchScene(SceneId.MISSION_OPERATIONS);
          }
        },
        onOpenTestBench: (projectId) => {
          if (this.sceneManager) {
            this.sceneManager.switchScene(SceneId.ROCKET_ENGINEERING, {
              payload: { activeSection: 'SIMULATION', projectId },
            });
          }
        },
        onLaunchInitiated: (deploymentId) => {
          this.openLaunchObservation(deploymentId);
        },
      });
      uiOverlayContainer.addChild(this.launchDashboardModal.container);

      this.launchObservationView = new LaunchObservationView({
        onOpenDashboard: () => {
          this.openLaunchOperationsDashboard();
        },
        onLaunchCompleted: () => {
          this.refreshLaunchpadVisual();
        },
      });
      uiOverlayContainer.addChild(this.launchObservationView.container);

      // Connect launch zone interaction callbacks
      if (this.launchZones) {
        this.launchZones.setCallbacks({
          onOpenLaunchDashboard: () => this.openLaunchOperationsDashboard(),
          onOpenObservationBunker: () => this.openLaunchObservation(),
        });
      }

      // Register all facility entrances in the InteractionSystem
      for (const building of this.buildings.values()) {
        this.interactionSystem.registerObject(building.interactiveObject);
      }

      // Register all launch complex interactive installations
      if (this.launchZones) {
        for (const obj of this.launchZones.interactiveObjects) {
          this.interactionSystem.registerObject(obj);
        }
      }
    }

    // 9. Setup Environmental Lighting & Atmospheric Dust Particles
    this.setupAtmosphereAndLighting();

    // 10. Setup Diagnostics HUD & Navigation Controls
    this.setupHud();

    // 11. Subscribe to Interaction & Building Transition Events
    this.subscribeEvents();

    Logger.info('HEADQUARTERS_SCENE', 'Headquarters Campus initialized successfully. All 12 facilities online.');
  }

  private buildCampusEnvironment(): void {
    if (!this.pipeline || !this.collisionSystem) return;

    // -------------------------------------------------------------
    // LAYER: BACKGROUND (Ground, Roads, Plaza Pavers, Tracks, Pad)
    // -------------------------------------------------------------
    const bgContainer = this.pipeline.getLayerContainer(RenderLayerType.BACKGROUND);
    this.groundRenderer = new CampusGroundRenderer();
    bgContainer.addChild(this.groundRenderer.container);

    // -------------------------------------------------------------
    // LAYER: GAMEPLAY_OBJECTS (Buildings, Fences, Props, Depth-Sorted)
    // -------------------------------------------------------------
    const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
    gameplayContainer.sortableChildren = true;

    // A. Environmental Decorations (Fences, Trees, Streetlights, DSN Dishes, Launch Tower)
    this.decorations = new CampusDecorations();
    gameplayContainer.addChild(this.decorations.container);

    // Register all decoration colliders
    for (const col of this.decorations.colliders) {
      this.collisionSystem.addCollider(col);
    }

    // B. Instantiate all 12 Campus Facilities
    for (const [key, data] of Object.entries(CAMPUS_FACILITIES)) {
      const building = new CampusBuilding(data, async (bId) => {
        return this.handleFacilityInteraction(bId);
      });
      this.buildings.set(key, building);

      // Add visual container to GAMEPLAY_OBJECTS (depth sorted by building.container.zIndex)
      gameplayContainer.addChild(building.container);

      // Add solid footprint collider to collision system
      this.collisionSystem.addCollider(building.collider);
    }

    // C. Physical Launch Complex Interactive Installations (7 distinct zones)
    this.launchZones = new LaunchComplexInteractiveZones();
    gameplayContainer.addChild(this.launchZones.container);

    for (const col of this.launchZones.colliders) {
      this.collisionSystem.addCollider(col);
    }

    // D. Launchpad Rocket 2D/2.5D Visual standing on Pad Alpha
    this.launchpadRocketVisual = new LaunchpadRocketVisual({ x: 3050, y: 1830 });
    gameplayContainer.addChild(this.launchpadRocketVisual.container);
  }

  private setupPlayer(): void {
    if (!this.pipeline || !this.collisionSystem || !this.inputManager) return;

    // Spawn Mission Director at Central Plaza Compass Rose (1800, 1260)
    this.player = new PlayerCharacter({
      id: 'mission_director',
      initialX: 1800,
      initialY: 1260,
      facing: FacingDirection.NORTH,
    });

    // Add player foot collider to collision system
    this.collisionSystem.addCollider(this.player.getCollider());

    // Add player visual display container to GAMEPLAY_OBJECTS layer
    const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
    gameplayContainer.addChild(this.player.container);

    // Initialize controller and movement
    const movement = new MovementComponent({
      walkSpeed: 180,
      sprintSpeed: 310,
      acceleration: 1400,
      deceleration: 1800,
    });

    this.controller = new PlayerController({
      character: this.player,
      movement,
      inputManager: this.inputManager,
      collisionSystem: this.collisionSystem,
      eventBus: this.eventBus,
    });

    // Register with PlayerSystem & ServiceLocator
    this.playerSystem = new PlayerSystem({
      controller: this.controller,
      character: this.player,
    });
    this.playerSystem.initialize();
    ServiceLocator.register('PlayerSystem', this.playerSystem);
  }

  private setupAtmosphereAndLighting(): void {
    if (!this.pipeline) return;

    // 1. Environmental Lighting Layer: Soft natural daylight with warm tint
    const lightingContainer = this.pipeline.getLayerContainer(RenderLayerType.LIGHTING);
    const ambientLight = new Graphics();
    ambientLight.rect(0, 0, this.mapWidth, this.mapHeight);
    ambientLight.fill({ color: 0xd6eaff, alpha: 0.08 }); // Gentle daylight sky bounce
    lightingContainer.addChild(ambientLight);

    // 2. Atmospheric Dust / Pollen Motes on PARTICLES_ATMOSPHERE layer
    const particleContainer = this.pipeline.getLayerContainer(RenderLayerType.PARTICLES_ATMOSPHERE);
    this.atmosphericDustGfx = new Graphics();
    particleContainer.addChild(this.atmosphericDustGfx);

    // Spawn 60 subtle floating particles
    for (let i = 0; i < 60; i++) {
      this.dustParticles.push({
        x: Math.random() * this.mapWidth,
        y: Math.random() * this.mapHeight,
        vx: 8 + Math.random() * 12, // Gentle eastward breeze
        vy: -3 + Math.random() * 6,
        radius: 1.2 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
  }

  private setupHud(): void {
    if (!this.pipeline) return;

    const hudContainer = this.pipeline.getLayerContainer(RenderLayerType.HUD);
    const uiContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);

    // Initialize Pause Menu
    this.pauseMenu = new PauseMenu({
      sceneManager: this.sceneManager,
      inputManager: this.inputManager,
      gameStateManager: ServiceLocator.has('GameStateManager')
        ? ServiceLocator.get('GameStateManager')
        : undefined,
      saveService: ServiceLocator.has('SaveService')
        ? ServiceLocator.get('SaveService')
        : undefined,
    });
    uiContainer.addChild(this.pauseMenu.container);

    // Initialize Global Strategic HUD
    this.globalHud = new GlobalHUD({
      eventBus: this.eventBus,
      gameStateManager: ServiceLocator.has('GameStateManager')
        ? ServiceLocator.get('GameStateManager')
        : undefined,
      interactionSystem: this.interactionSystem,
      onOpenMenu: () => {
        this.pauseMenu?.show();
      },
    });
    hudContainer.addChild(this.globalHud.container);

    // Auto-pause on focus loss (window blur)
    if (typeof window !== 'undefined') {
      this.windowBlurHandler = () => {
        if (ServiceLocator.has('SettingsManager')) {
          const sm = ServiceLocator.get<SettingsManager>('SettingsManager');
          if (sm.getSettings().gameplay.autoPauseOnFocusLoss) {
            this.pauseMenu?.show();
          }
        }
      };
      window.addEventListener('blur', this.windowBlurHandler);
    }

    // Initialize Tutorial Manager service
    if (ServiceLocator.has('TutorialManager')) {
      this.tutorialManager = ServiceLocator.get<TutorialManager>('TutorialManager');
      if (this.eventBus) this.tutorialManager.setEventBus(this.eventBus);
      if (this.inputManager) this.tutorialManager.setInputManager(this.inputManager);
      if (this.facilityRegistry) this.tutorialManager.setFacilityRegistry(this.facilityRegistry);
    } else {
      this.tutorialManager = TutorialManager.getInstance(
        this.eventBus,
        this.inputManager,
        this.facilityRegistry
      );
      ServiceLocator.register('TutorialManager', this.tutorialManager);
    }

    // Initialize Waypoint Marker
    const groundContainer = this.pipeline.getLayerContainer(RenderLayerType.WORLD);
    this.waypointMarker = new TutorialWaypointMarker(this.cameraSystem);
    groundContainer.addChild(this.waypointMarker.worldContainer);
    hudContainer.addChild(this.waypointMarker.hudContainer);

    // Initialize Tutorial HUD Panel
    this.tutorialPanel = new TutorialPanel({
      tutorialManager: this.tutorialManager,
    });
    hudContainer.addChild(this.tutorialPanel.container);

    this.subscribeTutorialEvents();

    // Setup developer / diagnostics overlay
    this.setupDiagnosticsOverlay(hudContainer, uiContainer);
  }

  private subscribeTutorialEvents(): void {
    if (!this.eventBus) return;

    this.eventBus.on('tutorial:step-changed', (payload: any) => {
      if (this.tutorialPanel) {
        this.tutorialPanel.setStep(payload.step, payload.stepIndex, payload.totalSteps);
      }
      if (this.waypointMarker && payload.step) {
        this.waypointMarker.setTarget(payload.step.highlight);
      }
    });

    this.eventBus.on('tutorial:completed', () => {
      if (this.tutorialPanel) {
        this.tutorialPanel.setStep(null);
      }
      if (this.waypointMarker) {
        this.waypointMarker.setTarget(null);
      }
      this.showFeedback('ONBOARDING DIRECTIVE COMPLETED // FULL ACCESS GRANTED');
    });

    this.eventBus.on('tutorial:skipped', () => {
      if (this.tutorialPanel) {
        this.tutorialPanel.setStep(null);
      }
      if (this.waypointMarker) {
        this.waypointMarker.setTarget(null);
      }
      this.showFeedback('ONBOARDING DIRECTIVE BYPASS // RESUMING FREE OPERATIONS');
    });

    this.eventBus.on('tutorial:dismissed', (payload: any) => {
      if (this.tutorialPanel && payload.isDismissed !== this.tutorialPanel.getIsMinimized()) {
        this.tutorialPanel.toggleMinimize();
      }
    });
  }

  private setupDiagnosticsOverlay(hudContainer: Container, uiContainer: Container): void {
    const telemetryStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x94a3b8,
      lineHeight: 18,
    });

    this.telemetryText = new Text({
      text: 'INITIALIZING CAMPUS TELEMETRY...',
      style: telemetryStyle,
    });
    this.telemetryText.position.set(35, 140);
    this.telemetryText.visible = false; // Hidden by default; visible in debug mode

    this.logMessageText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x4ade80,
      }),
    });
    this.logMessageText.position.set(35, 200);
    this.logMessageText.visible = false;

    hudContainer.addChild(this.telemetryText);
    hudContainer.addChild(this.logMessageText);

    // Setup Interactive Navigation Waypoint Buttons
    this.setupNavigationButtons(uiContainer);
  }

  private setupNavigationButtons(parent: Container): void {
    this.debugNavContainer = new Container();
    this.debugNavContainer.visible = false; // Hidden by default, toggled with F1/debug

    // Quick Navigation Waypoints
    const btnPlaza = this.createButton(760, 80, 'CENTRAL PLAZA', () => {
      this.teleportPlayer(1800, 1260, 'NAVIGATED TO CENTRAL HEADQUARTERS PLAZA');
    });

    const btnLaunchPad = this.createButton(760, 120, 'PAD ALPHA LAUNCH COMPLEX', () => {
      this.teleportPlayer(2850, 1850, 'NAVIGATED TO PAD ALPHA LAUNCH COMPLEX');
    });

    const btnVab = this.createButton(760, 160, 'ROCKET ENGINEERING (VAB)', () => {
      this.teleportPlayer(2750, 1220, 'NAVIGATED TO ROCKET ENGINEERING VAB');
    });

    const btnMoc = this.createButton(1040, 80, 'MISSION OPERATIONS (MOC)', () => {
      this.teleportPlayer(1800, 1720, 'NAVIGATED TO MISSION OPERATIONS CENTRE');
    });

    const btnResearch = this.createButton(1040, 120, 'RESEARCH & DEVELOPMENT', () => {
      this.teleportPlayer(1800, 560, 'NAVIGATED TO RESEARCH & DEVELOPMENT CENTRE');
    });

    const btnArrival = this.createButton(1040, 160, 'MAIN ARRIVAL GATE', () => {
      this.teleportPlayer(450, 1350, 'NAVIGATED TO MAIN ARRIVAL & SECURITY GATE');
    });

    const btnCamOverview = this.createButton(1320, 80, 'CAMPUS OVERVIEW [0.35x]', () => {
      this.cameraSystem?.setMode(CameraMode.MISSION_OVERVIEW);
      this.cameraSystem?.setZoom(0.35);
      this.showFeedback('CAMERA: CAMPUS STRATEGIC OVERVIEW (0.35x)');
    });

    const btnCamFollow = this.createButton(1320, 120, 'EXPLORATION CAM [1.0x]', () => {
      this.cameraSystem?.setMode(CameraMode.PLAYER_FOLLOW);
      this.cameraSystem?.setZoom(1.0);
      this.showFeedback('CAMERA: DIRECTOR FOLLOW (1.0x)');
    });

    const btnDebugCol = this.createButton(1320, 160, 'COLLISION MESH [F1 / C]', () => {
      this.toggleCollisionDebug();
    });

    this.debugNavContainer.addChild(btnPlaza);
    this.debugNavContainer.addChild(btnLaunchPad);
    this.debugNavContainer.addChild(btnVab);
    this.debugNavContainer.addChild(btnMoc);
    this.debugNavContainer.addChild(btnResearch);
    this.debugNavContainer.addChild(btnArrival);
    this.debugNavContainer.addChild(btnCamOverview);
    this.debugNavContainer.addChild(btnCamFollow);
    this.debugNavContainer.addChild(btnDebugCol);

    parent.addChild(this.debugNavContainer);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): Container {
    const btn = new Container();
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, 260, 32, 4);
    bg.fill({ color: 0x0f172a, alpha: 0.92 });
    bg.stroke({ color: 0x00f0ff, width: 1.2, alpha: 0.7 });

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x38bdf8,
        letterSpacing: 0.8,
      }),
    });
    txt.position.set(12, 8);

    btn.addChild(bg);
    btn.addChild(txt);

    btn.on('pointerover', () => {
      bg.stroke({ color: 0xffffff, width: 1.5, alpha: 1.0 });
    });
    btn.on('pointerout', () => {
      bg.stroke({ color: 0x00f0ff, width: 1.2, alpha: 0.7 });
    });
    btn.on('pointertap', onClick);

    return btn;
  }

  private teleportPlayer(x: number, y: number, message: string): void {
    if (this.player && this.cameraSystem) {
      this.player.updatePosition(x, y);
      this.cameraSystem.setPosition(x, y, true);
      this.showFeedback(message);
    }
  }

  public toggleCollisionDebug(): void {
    if (!this.collisionSystem) return;
    const current = this.collisionSystem.isDebugEnabled();
    const nextState = !current;
    this.collisionSystem.setDebugEnabled(nextState);
    if (this.telemetryText) {
      this.telemetryText.visible = nextState;
    }
    if (this.debugNavContainer) {
      this.debugNavContainer.visible = nextState;
    }
    this.showFeedback(`COLLISION WIREFRAME MESH: ${nextState ? 'ENABLED' : 'DISABLED'}`);
  }

  private showFeedback(msg: string): void {
    if (this.logMessageText) {
      this.logMessageText.text = `>> ${msg}`;
      this.activeFeedbackTimer = 3.5;
    }
    if (this.globalHud) {
      this.globalHud.notificationManager.notify({
        title: 'HQ Operations',
        message: msg,
        category: 'SYSTEM',
        level: 'INFO',
      });
    }
  }

  private subscribeEvents(): void {
    if (!this.events) return;

    this.events.subscribe('building:entered', (payload: any) => {
      this.showFeedback(`ENTERING FACILITY: ${payload.buildingId} (${payload.interiorId})`);
      this.cameraSystem?.shake(6);
    });

    this.events.subscribe('building:exited', (payload: any) => {
      this.showFeedback(`EXITING FACILITY: ${payload.buildingId}`);
    });

    this.events.subscribe('interaction:executed', (payload: any) => {
      this.showFeedback(`INTERACTION ACCESSED: [${payload.category}] ${payload.targetId}`);
    });
  }

  protected onUpdate(deltaSeconds: number): void {
    // 0. Check Pause state & toggle
    if (this.pauseMenu?.isOpen()) {
      this.pauseMenu.update(deltaSeconds);
      if (
        this.inputManager?.isActionJustPressed(InputAction.Pause) ||
        this.inputManager?.isActionJustPressed(InputAction.Cancel)
      ) {
        this.pauseMenu.hide();
        return;
      }
      if (this.globalHud) {
        this.globalHud.update(deltaSeconds);
      }
      return;
    }

    if (this.inputManager?.isActionJustPressed(InputAction.Pause)) {
      this.pauseMenu?.show();
      return;
    }

    // 1. Toggle Collision Wireframe hotkey (F1 or KeyC)
    if (this.inputManager?.isActionJustPressed(InputAction.ToggleDebug)) {
      this.toggleCollisionDebug();
    }

    // 2. Toggle Minimap hotkey (M key)
    if (this.inputManager?.isActionJustPressed(InputAction.OpenMap)) {
      this.globalHud?.minimap.toggleCollapse();
    }

    // 2.5. Tutorial Hotkeys & Updates
    if (this.tutorialPanel && this.tutorialPanel.container.visible) {
      if (this.inputManager?.isKeyJustPressed('KeyH')) {
        this.tutorialPanel.toggleMinimize();
      }
      if (
        !this.tutorialPanel.getIsMinimized() &&
        (this.inputManager?.isActionJustPressed(InputAction.Confirm) ||
          this.inputManager?.isKeyJustPressed('Space'))
      ) {
        this.tutorialManager?.advanceStep();
      }
    }

    if (this.player) {
      const pos = this.player.getPosition();
      this.tutorialManager?.update(deltaSeconds, {
        playerX: pos.x,
        playerY: pos.y,
      });
      this.waypointMarker?.update(deltaSeconds, pos.x, pos.y);
    }

    // 3. Update Player Controller (input reading, movement, 2.5D sliding collision)
    if (this.controller) {
      this.controller.update(deltaSeconds);
    }

    // 4. Update Camera System (follows player with deadzone and velocity lookahead)
    if (this.cameraSystem) {
      this.cameraSystem.update(deltaSeconds);
    }

    // 5. Update Collision System
    if (this.collisionSystem) {
      this.collisionSystem.update(deltaSeconds);
    }

    // 6. Update Interaction System (hysteresis targeting, prompt, modal dialog)
    if (this.interactionSystem) {
      this.interactionSystem.update(deltaSeconds);
    }

    // 7. Update Global HUD (organisation badge, minimap, notifications, tooltips)
    if (this.globalHud) {
      this.globalHud.update(deltaSeconds);
    }

    // 8. Update Atmospheric Dust Motes
    this.updateAtmosphericDust(deltaSeconds);

    // 8B. Update Launchpad Rocket Cryogenic Venting Effects
    if (this.launchpadRocketVisual) {
      this.launchpadRocketVisual.tick(deltaSeconds);
    }

    // 9. Update Telemetry HUD
    this.updateTelemetryHud();

    // 10. Decay feedback message timer
    if (this.activeFeedbackTimer > 0) {
      this.activeFeedbackTimer -= deltaSeconds;
      if (this.activeFeedbackTimer <= 0 && this.logMessageText) {
        this.logMessageText.text = '';
      }
    }

    // 11. Update Rendering Pipeline
    if (this.pipeline) {
      this.pipeline.update(deltaSeconds);
    }
  }

  private updateAtmosphericDust(deltaSeconds: number): void {
    if (!this.atmosphericDustGfx) return;

    this.atmosphericDustGfx.clear();

    for (const p of this.dustParticles) {
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;

      // Wrap around campus bounds
      if (p.x > this.mapWidth) p.x = 0;
      if (p.y < 0) p.y = this.mapHeight;
      if (p.y > this.mapHeight) p.y = 0;

      this.atmosphericDustGfx
        .circle(p.x, p.y, p.radius)
        .fill({ color: 0x93c5fd, alpha: p.alpha });
    }
  }

  private updateTelemetryHud(): void {
    if (!this.player || !this.cameraSystem) return;

    const pos = this.player.getPosition();
    const vel = this.player.getVelocity();
    const facing = this.player.getFacing();
    const state = this.player.getState();
    const district = this.getDistrictName(pos.x, pos.y);

    if (this.globalHud) {
      let frustumRect: { x: number; y: number; width: number; height: number } | undefined;
      try {
        const frustum = this.cameraSystem.getVisibleFrustum();
        if (frustum) {
          frustumRect = {
            x: frustum.minX,
            y: frustum.minY,
            width: frustum.width,
            height: frustum.height,
          };
        }
      } catch {
        // Fallback for headless test environments where viewport transform might not be bound
      }

      this.globalHud.setLocation('EARTH HEADQUARTERS', district);
      this.globalHud.updatePlayerTelemetry(
        pos.x,
        pos.y,
        vel.x,
        vel.y,
        facing,
        state,
        frustumRect
      );
    }

    if (this.telemetryText && this.telemetryText.visible) {
      const speed = Math.round(Math.hypot(vel.x, vel.y));
      const zoom = this.cameraSystem.getZoom();
      this.telemetryText.text =
        `DIRECTOR POS: (${Math.round(pos.x)}, ${Math.round(pos.y)}) | ZONE: ${district}\n` +
        `VELOCITY: ${speed} px/s [${state}:${facing}] | CAMERA ZOOM: ${zoom.toFixed(2)}x\n` +
        `CAMPUS BOUNDS: ${this.mapWidth} x ${this.mapHeight} px | ALL 12 FACILITIES ONLINE`;
    }
  }

  private getDistrictName(x: number, y: number): string {
    if (x > 2500 && y > 1500) return 'PAD ALPHA LAUNCH COMPLEX';
    if (x > 2400 && y >= 800 && y <= 1450) return 'ROCKET ENGINEERING & ASSEMBLY (VAB)';
    if (x > 1400 && x < 2200 && y >= 950 && y <= 1450) return 'CENTRAL HEADQUARTERS PLAZA';
    if (x > 1400 && x < 2200 && y > 1600) return 'MISSION OPERATIONS FLIGHT CENTRE';
    if (y < 800) return 'NORTH SCIENCE & RESEARCH QUAD';
    if (x < 1000 && y > 1600) return 'ROBOTICS & DEEP SPACE NETWORK ARRAY';
    if (x < 1000) return 'CAMPUS ARRIVAL & ADMINISTRATION';
    return 'CAMPUS ARTERIAL PROMENADE';
  }

  protected override async onActivate(payload?: any): Promise<void> {
    super.onActivate(payload);

    if (payload && typeof payload.spawnX === 'number' && typeof payload.spawnY === 'number') {
      if (this.player && this.cameraSystem) {
        this.player.updatePosition(payload.spawnX, payload.spawnY);
        this.cameraSystem.setPosition(payload.spawnX, payload.spawnY, true);
        this.showFeedback(
          `RETURNED TO CAMPUS EXTERIOR: (${Math.round(payload.spawnX)}, ${Math.round(payload.spawnY)})`
        );
      }
    }

    if (this.inputManager) {
      this.inputManager.unlockInput('FacilityAccessModal');
      this.inputManager.unlockInput('InteractionExecution');
    }

    // 3. Evaluate Tutorial / Onboarding Activation
    if (this.tutorialManager) {
      const tState = this.tutorialManager.getState();
      const shouldLaunchOnboarding =
        payload?.isNewGame === true ||
        payload?.startTutorial === true ||
        (!tState.hasStarted && !tState.isOnboardingComplete);

      if (shouldLaunchOnboarding) {
        this.tutorialManager.startSequence(
          TutorialSequenceId.INITIAL_ONBOARDING,
          Boolean(payload?.isReplay)
        );
      } else if (tState.activeSequenceId && this.tutorialPanel) {
        const step = this.tutorialManager.getCurrentStep();
        if (step) {
          this.tutorialPanel.setStep(step, tState.currentStepIndex + 1, 7);
          this.waypointMarker?.setTarget(step.highlight);
        }
      }
    }

    // 4. Launch Complex Pad Alpha Routing & Deployment Preservation
    if (payload?.targetFacilityId === FacilityId.LAUNCH_COMPLEX_PAD_ALPHA) {
      if (payload.deployedVehicle && this.deploymentManager) {
        const vehicle = payload.deployedVehicle;
        const activeDep = this.deploymentManager.getActiveDeployment();
        if (activeDep) {
          this.deploymentManager.assignRocket(activeDep.deploymentId, vehicle.projectId);
        } else if (vehicle.missionId) {
          const activeInst = MissionLifecycleManager.getInstance().getActiveInstances().find((i) => i.missionId === vehicle.missionId);
          if (activeInst) {
            this.deploymentManager.createDeployment({
              missionInstanceId: activeInst.instanceId,
              missionId: vehicle.missionId,
              projectId: vehicle.projectId,
            });
          }
        }
      }

      if (payload.openDashboard) {
        this.openLaunchOperationsDashboard();
      }
    }

    this.refreshLaunchpadVisual();
  }

  public async handleFacilityInteraction(buildingId: string): Promise<any> {
    if (!this.facilityRegistry) {
      this.facilityRegistry = ServiceLocator.has('FacilityRegistry')
        ? ServiceLocator.get<FacilityRegistry>('FacilityRegistry')
        : FacilityRegistry.getInstance(this.eventBus);
    }

    const facility = this.facilityRegistry.getFacility(buildingId);
    if (!facility) {
      this.showFeedback(`FACILITY DATA NOT FOUND: ${buildingId}`);
      return { success: false, action: 'NONE' };
    }

    this.showFeedback(`ACCESSING FACILITY PORTAL: ${facility.name}`);
    this.openFacilityAccess(facility);
    return {
      success: true,
      action: 'OPEN_FACILITY_ACCESS',
      message: `Opened access experience for ${facility.name}`,
      data: facility,
    };
  }

  public openFacilityAccess(facility: FacilityRecord): void {
    if (!this.facilityAccessModal) return;

    this.facilityAccessModal.show(facility, {
      onEnter: async (fac) => {
        await this.enterFacility(fac);
      },
      onClose: (fac) => {
        this.showFeedback(`STANDBY OUTSIDE: ${fac.name}`);
      },
    });
  }

  public async enterFacility(facility: FacilityRecord): Promise<void> {
    Logger.info('HEADQUARTERS_SCENE', `Director entering facility: ${facility.name} (${facility.id})`);
    this.facilityRegistry?.recordVisit(facility.id);
    this.showFeedback(`ENTERING FACILITY: ${facility.name}...`);
    this.cameraSystem?.shake(5);

    if (facility.id === FacilityId.LAUNCH_COMPLEX_PAD_ALPHA) {
      this.openLaunchOperationsDashboard();
      return;
    }

    if (this.sceneManager) {
      const destScene = facility.destinationSceneId || 'FACILITY_INTERIOR';
      const targetSceneId = this.sceneManager.has(destScene) ? destScene : 'FACILITY_INTERIOR';

      await this.sceneManager.switchScene(targetSceneId, {
        payload: {
          facilityId: facility.id,
          returnX: facility.entrancePosition.x,
          returnY: facility.entrancePosition.y,
          facilityRecord: facility,
        },
        cleanupPrevious: false,
      });
    }
  }

  // ==================== GETTERS FOR VERIFICATION ====================

  public getPlayer(): PlayerCharacter | undefined {
    return this.player;
  }

  public getController(): PlayerController | undefined {
    return this.controller;
  }

  public getCollisionSystem(): CollisionSystem | undefined {
    return this.collisionSystem;
  }

  public getCameraSystem(): CameraSystem | undefined {
    return this.cameraSystem;
  }

  public getInteractionSystem(): InteractionSystem | undefined {
    return this.interactionSystem;
  }

  public getFacilityRegistry(): FacilityRegistry | undefined {
    return this.facilityRegistry;
  }

  public getFacilityAccessModal(): FacilityAccessModal | undefined {
    return this.facilityAccessModal;
  }

  public getLaunchZones(): LaunchComplexInteractiveZones | undefined {
    return this.launchZones;
  }

  public getBuildings(): Map<string, CampusBuilding> {
    return this.buildings;
  }

  public getBuilding(key: string): CampusBuilding | undefined {
    return this.buildings.get(key);
  }

  // ==================== LAUNCH OPERATIONS INTERACTION ====================

  public openLaunchOperationsDashboard(deploymentId?: string): void {
    if (this.launchObservationView?.container.visible) {
      this.launchObservationView.hide();
    }
    this.launchDashboardModal?.show(deploymentId);
    this.showFeedback('ACCESSING LAUNCH COMPLEX OPERATIONS DASHBOARD (PAD-01)...');
  }

  public openLaunchObservation(deploymentId?: string): void {
    if (this.launchDashboardModal?.container.visible) {
      this.launchDashboardModal.hide();
    }
    this.launchObservationView?.show(deploymentId);
    this.showFeedback('ACCESSING LAUNCH OBSERVATION AREA & BLAST BUNKER...');
  }

  public refreshLaunchpadVisual(): void {
    if (!this.launchpadRocketVisual) return;
    const activeDep = this.deploymentManager?.getActiveDeployment();
    const activeProj = activeDep?.projectId
      ? this.rocketProjectManager?.getProject(activeDep.projectId)
      : undefined;
    this.launchpadRocketVisual.update(activeProj, activeDep);
  }

  public getLaunchpadVisual(): LaunchpadRocketVisual | undefined {
    return this.launchpadRocketVisual;
  }

  public getLaunchDashboardModal(): LaunchOperationsDashboardModal | undefined {
    return this.launchDashboardModal;
  }

  public getLaunchObservationView(): LaunchObservationView | undefined {
    return this.launchObservationView;
  }

  public getDeploymentManager(): LaunchDeploymentManager | undefined {
    return this.deploymentManager;
  }

  protected onCleanup(): void {
    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }
    if (this.collisionSystem) {
      this.collisionSystem.clear();
    }
    if (this.playerSystem) {
      this.playerSystem.shutdown();
    }
    if (this.interactionSystem) {
      this.interactionSystem.shutdown();
    }
    for (const b of this.buildings.values()) {
      b.destroy();
    }
    this.buildings.clear();
    if (this.decorations) {
      this.decorations.destroy();
      this.decorations = undefined;
    }
    if (this.launchZones) {
      this.launchZones.destroy();
      this.launchZones = undefined;
    }
    if (this.launchpadRocketVisual) {
      this.launchpadRocketVisual.destroy();
      this.launchpadRocketVisual = undefined;
    }
    if (this.launchDashboardModal) {
      this.launchDashboardModal.destroy();
      this.launchDashboardModal = undefined;
    }
    if (this.launchObservationView) {
      this.launchObservationView.destroy();
      this.launchObservationView = undefined;
    }
    if (this.facilityAccessModal) {
      this.facilityAccessModal.destroy();
      this.facilityAccessModal = undefined;
    }
    if (this.globalHud) {
      this.globalHud.destroy();
      this.globalHud = undefined;
    }
    if (typeof window !== 'undefined' && this.windowBlurHandler) {
      window.removeEventListener('blur', this.windowBlurHandler);
      this.windowBlurHandler = undefined;
    }
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = undefined;
    }
    if (this.tutorialPanel) {
      this.tutorialPanel.destroy();
      this.tutorialPanel = undefined;
    }
    if (this.waypointMarker) {
      this.waypointMarker.destroy();
      this.waypointMarker = undefined;
    }
    Logger.info('HEADQUARTERS_SCENE', 'Headquarters Campus Scene cleaned up.');
  }
}
