/**
 * INTERSTELLAR CONTINUUM - Player Movement & Collision Test Scene
 * Headquarters test environment demonstrating Mission Director 2D/2.5D movement,
 * diagonal normalization, sliding collision resolution, interaction triggers, and camera tracking.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { ServiceLocator } from '../core/ServiceLocator';
import { RenderEngine, RenderPipeline, RenderLayerType } from '../rendering';
import { CameraSystem } from '../camera/CameraSystem';
import { CameraMode, ZoomPreset } from '../camera/CameraMode';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { EventBus } from '../core/EventBus';
import { CollisionSystem } from '../collision/CollisionSystem';
import { BoxCollider } from '../collision/BoxCollider';
import { CircleCollider } from '../collision/CircleCollider';
import { CollisionCategory, ICollider } from '../collision/ColliderTypes';
import { PlayerCharacter, FacingDirection } from '../player/PlayerCharacter';
import { MovementComponent } from '../player/MovementComponent';
import { PlayerController } from '../player/PlayerController';
import { PlayerSystem } from '../player/PlayerSystem';
import { Logger } from '../core/logging/Logger';
import {
  InteractionSystem,
  InteractiveObject,
  BuildingEntrance,
  InteractionCategory,
} from '../interaction';

export class PlayerMovementTestScene extends BaseScene {
  public readonly id = SceneId.HEADQUARTERS;

  private pipeline?: RenderPipeline;
  private cameraSystem?: CameraSystem;
  private collisionSystem?: CollisionSystem;
  private inputManager?: InputManager;
  private eventBus?: EventBus;

  private player?: PlayerCharacter;
  private controller?: PlayerController;
  private playerSystem?: PlayerSystem;
  private interactionSystem?: InteractionSystem;
  private playerClearanceLevel: number = 1;

  private hudContainer?: Container;
  private telemetryText?: Text;
  private interactionPromptText?: Text;
  private logMessageText?: Text;
  private activePromptTimeout: number = 0;

  // HQ Facility Map Dimensions
  private readonly mapWidth: number = 2400;
  private readonly mapHeight: number = 1600;

  protected async onInitialize(): Promise<void> {
    Logger.info('PLAYER_TEST_SCENE', 'Initializing Player Movement Test Scene...');

    // 1. Resolve or establish Core Services
    if (ServiceLocator.has('EventBus')) {
      this.eventBus = ServiceLocator.get<EventBus>('EventBus');
    } else {
      this.eventBus = new EventBus();
      ServiceLocator.register('EventBus', this.eventBus);
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

    // 2.5. Establish Environmental Interaction System
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
    if (this.eventBus) {
      this.interactionSystem.setEventBus(this.eventBus);
    }
    if (this.inputManager) {
      this.interactionSystem.setInputManager(this.inputManager);
    }

    // 3. Configure Camera for Headquarters Map
    this.cameraSystem.setBounds({
      minX: 0,
      minY: 0,
      maxX: this.mapWidth,
      maxY: this.mapHeight,
    });
    this.cameraSystem.setMode(CameraMode.PLAYER_FOLLOW);
    this.cameraSystem.setZoomPreset(ZoomPreset.NORMAL_EXPLORATION);

    // 4. Construct Headquarters Environment & Geometry
    this.buildHeadquartersEnvironment();

    // 5. Instantiate Mission Director Player
    this.setupPlayer();

    // 5.5. Wire Player and UI Containers into Interaction System
    if (this.interactionSystem && this.pipeline) {
      this.interactionSystem.setPlayer(this.player);
      const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
      gameplayContainer.addChild(this.interactionSystem.getContextualPrompt().container);

      const uiContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);
      uiContainer.addChild(this.interactionSystem.getInformationPanel().container);

      this.setupInteractiveObjects();
    }

    // 6. Connect Camera Target Tracker
    this.cameraSystem.setTarget(this.player!);
    this.cameraSystem.setDeadzone(120, 80);
    this.cameraSystem.setLookahead({
      leadTimeSeconds: 0.35,
      maxDistance: 220,
      smoothing: 0.1,
    });

    // 7. Setup HUD and Diagnostics
    this.setupHud();

    // 8. Subscribe to Interaction & Trigger Events
    this.subscribeEvents();

    Logger.info('PLAYER_TEST_SCENE', 'Player Movement Test Scene initialized successfully.');
  }

  private buildHeadquartersEnvironment(): void {
    if (!this.pipeline || !this.collisionSystem) return;

    // -------------------------------------------------------------
    // LAYER: BACKGROUND (High-tech Slate & Hexagonal Floor Tiles)
    // -------------------------------------------------------------
    const bgContainer = this.pipeline.getLayerContainer(RenderLayerType.BACKGROUND);
    const floor = new Graphics();

    // Base dark facility foundation
    floor.rect(0, 0, this.mapWidth, this.mapHeight);
    floor.fill({ color: 0x0b1320 });

    // Grid Floor Tiles (120x120 tiles)
    const tileSize = 120;
    floor.stroke({ color: 0x162235, width: 1.5 });
    for (let x = 0; x <= this.mapWidth; x += tileSize) {
      floor.moveTo(x, 0).lineTo(x, this.mapHeight);
    }
    for (let y = 0; y <= this.mapHeight; y += tileSize) {
      floor.moveTo(0, y).lineTo(this.mapWidth, y);
    }

    // Glowing Cyan Floor Guide Strips leading to departments
    // Main North-South Central Corridor
    floor
      .rect(1194, 60, 12, this.mapHeight - 120)
      .fill({ color: 0x00f0ff, alpha: 0.25 });
    // East-West Central Corridor
    floor
      .rect(60, 794, this.mapWidth - 120, 12)
      .fill({ color: 0x00f0ff, alpha: 0.25 });

    // Agency Logo Decal in Center of Hall
    floor
      .circle(1200, 800, 90)
      .stroke({ color: 0x00f0ff, width: 3, alpha: 0.4 })
      .circle(1200, 800, 80)
      .fill({ color: 0x111e30, alpha: 0.7 })
      .circle(1200, 800, 30)
      .fill({ color: 0x00f0ff, alpha: 0.6 });

    bgContainer.addChild(floor);

    // -------------------------------------------------------------
    // LAYER: WORLD & GAMEPLAY_OBJECTS (Walls, Consoles, Obstacles, Triggers)
    // -------------------------------------------------------------
    const worldContainer = this.pipeline.getLayerContainer(RenderLayerType.WORLD);
    const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);

    // 1. OUTER PERIMETER BULKHEAD WALLS
    const wallColor = 0x1e2d42;
    const wallTrim = 0x2e425e;

    // Top Wall
    this.createStaticObstacle(
      worldContainer,
      0,
      0,
      this.mapWidth,
      60,
      wallColor,
      wallTrim,
      CollisionCategory.BOUNDARY,
      'PERIMETER_NORTH'
    );
    // Bottom Wall
    this.createStaticObstacle(
      worldContainer,
      0,
      this.mapHeight - 60,
      this.mapWidth,
      60,
      wallColor,
      wallTrim,
      CollisionCategory.BOUNDARY,
      'PERIMETER_SOUTH'
    );
    // Left Wall
    this.createStaticObstacle(
      worldContainer,
      0,
      60,
      60,
      this.mapHeight - 120,
      wallColor,
      wallTrim,
      CollisionCategory.BOUNDARY,
      'PERIMETER_WEST'
    );
    // Right Wall
    this.createStaticObstacle(
      worldContainer,
      this.mapWidth - 60,
      60,
      60,
      this.mapHeight - 120,
      wallColor,
      wallTrim,
      CollisionCategory.BOUNDARY,
      'PERIMETER_EAST'
    );

    // 2. INTERIOR ZONE PARTITIONS
    // Left Bay Separator Wall (with corridor passage)
    this.createStaticObstacle(
      worldContainer,
      760,
      60,
      40,
      600,
      wallColor,
      wallTrim,
      CollisionCategory.SOLID,
      'WALL_ENG_TOP'
    );
    this.createStaticObstacle(
      worldContainer,
      760,
      940,
      40,
      600,
      wallColor,
      wallTrim,
      CollisionCategory.SOLID,
      'WALL_ENG_BOTTOM'
    );

    // Right Wing Separator Wall (with corridor passage)
    this.createStaticObstacle(
      worldContainer,
      1600,
      60,
      40,
      600,
      wallColor,
      wallTrim,
      CollisionCategory.SOLID,
      'WALL_SCI_TOP'
    );
    this.createStaticObstacle(
      worldContainer,
      1600,
      940,
      40,
      600,
      wallColor,
      wallTrim,
      CollisionCategory.SOLID,
      'WALL_SCI_BOTTOM'
    );

    // 3. MISSION CONTROL CENTER (CENTRAL ZONE)
    // Main Flight Director Command Console (Solid Obstacle)
    this.createStaticObstacle(
      gameplayContainer,
      1050,
      620,
      300,
      80,
      0x1c314a,
      0x00f0ff,
      CollisionCategory.OBSTACLE,
      'FLIGHT_DIRECTOR_CONSOLE'
    );

    // Interactive Mission Terminal (Trigger Collider)
    this.createTriggerZone(
      gameplayContainer,
      1150,
      560,
      100,
      60,
      0x00f0ff,
      CollisionCategory.TRIGGER,
      'MISSION_TERMINAL',
      'MISSION CONTROL TERMINAL'
    );

    // Lateral Telemetry Workstations
    this.createStaticObstacle(
      gameplayContainer,
      880,
      780,
      180,
      60,
      0x1e2b3c,
      0x4a6582,
      CollisionCategory.OBSTACLE,
      'TELEMETRY_BANK_A'
    );
    this.createStaticObstacle(
      gameplayContainer,
      1340,
      780,
      180,
      60,
      0x1e2b3c,
      0x4a6582,
      CollisionCategory.OBSTACLE,
      'TELEMETRY_BANK_B'
    );

    // 4. ROCKET ENGINEERING BAY (WEST ZONE)
    // Heavy Engineering Workbenches
    this.createStaticObstacle(
      gameplayContainer,
      180,
      350,
      280,
      70,
      0x273646,
      0xffa500,
      CollisionCategory.OBSTACLE,
      'ENGINEERING_BENCH_1'
    );
    this.createStaticObstacle(
      gameplayContainer,
      180,
      500,
      280,
      70,
      0x273646,
      0xffa500,
      CollisionCategory.OBSTACLE,
      'ENGINEERING_BENCH_2'
    );

    // Cylindrical Cryogenic Propellant Tanks (Circle Colliders)
    this.createCircleObstacle(
      gameplayContainer,
      580,
      400,
      45,
      0x384a5c,
      0x00e1d9,
      'CRYO_TANK_ALPHA'
    );
    this.createCircleObstacle(
      gameplayContainer,
      580,
      550,
      45,
      0x384a5c,
      0x00e1d9,
      'CRYO_TANK_BETA'
    );

    // Restricted Cleanroom Airlock Trigger
    this.createTriggerZone(
      gameplayContainer,
      740,
      720,
      80,
      160,
      0xff3366,
      CollisionCategory.RESTRICTED,
      'CLEANROOM_AIRLOCK',
      'PROPULSION CLEANROOM AIRLOCK'
    );

    // 5. SPACECRAFT & SCIENCE LAB (EAST ZONE)
    // Research Server Racks
    this.createStaticObstacle(
      gameplayContainer,
      1800,
      300,
      320,
      60,
      0x182433,
      0x3b82f6,
      CollisionCategory.OBSTACLE,
      'MAINFRAME_ROW_A'
    );
    this.createStaticObstacle(
      gameplayContainer,
      1800,
      440,
      320,
      60,
      0x182433,
      0x3b82f6,
      CollisionCategory.OBSTACLE,
      'MAINFRAME_ROW_B'
    );

    // Indoor Hydroponic Biome Planters (Circular)
    this.createCircleObstacle(
      gameplayContainer,
      1850,
      880,
      38,
      0x1d362d,
      0x10b981,
      'HYDROPONIC_PLANTER_1'
    );
    this.createCircleObstacle(
      gameplayContainer,
      2150,
      880,
      38,
      0x1d362d,
      0x10b981,
      'HYDROPONIC_PLANTER_2'
    );

    // Interactive Hologram Projector Trigger
    this.createTriggerZone(
      gameplayContainer,
      1940,
      650,
      120,
      90,
      0x8b5cf6,
      CollisionCategory.TRIGGER,
      'HOLOPROJECTOR',
      'AGENCY ARCHIVE HOLOGRAPHIC PROJECTOR'
    );

    // Attach collision debug wireframe overlay to gameplay container
    this.collisionSystem.attachDebugContainer(gameplayContainer);
  }

  private createStaticObstacle(
    parent: Container,
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor: number,
    strokeColor: number,
    category: CollisionCategory,
    tag: string
  ): void {
    const gfx = new Graphics();
    gfx.rect(x, y, w, h);
    gfx.fill({ color: fillColor });
    gfx.stroke({ color: strokeColor, width: 2 });
    parent.addChild(gfx);

    const collider = new BoxCollider({
      id: `col_${tag}`,
      x,
      y,
      width: w,
      height: h,
      category,
      isTrigger: false,
      tag,
    });

    this.collisionSystem?.addCollider(collider);
  }

  private createCircleObstacle(
    parent: Container,
    cx: number,
    cy: number,
    radius: number,
    fillColor: number,
    strokeColor: number,
    tag: string
  ): void {
    const gfx = new Graphics();
    gfx.circle(cx, cy, radius);
    gfx.fill({ color: fillColor });
    gfx.stroke({ color: strokeColor, width: 2 });
    parent.addChild(gfx);

    const collider = new CircleCollider({
      id: `col_${tag}`,
      x: cx,
      y: cy,
      radius,
      category: CollisionCategory.OBSTACLE,
      isTrigger: false,
      tag,
    });

    this.collisionSystem?.addCollider(collider);
  }

  private createTriggerZone(
    parent: Container,
    x: number,
    y: number,
    w: number,
    h: number,
    accentColor: number,
    category: CollisionCategory,
    tag: string,
    displayName: string
  ): void {
    const gfx = new Graphics();
    gfx.rect(x, y, w, h);
    gfx.fill({ color: accentColor, alpha: 0.12 });
    gfx.stroke({ color: accentColor, width: 2, alpha: 0.6 });

    // Decorative pulsing beacon icon in center of trigger
    gfx.circle(x + w / 2, y + h / 2, 6).fill({ color: accentColor, alpha: 0.8 });

    parent.addChild(gfx);

    const collider = new BoxCollider({
      id: `trigger_${tag}`,
      x,
      y,
      width: w,
      height: h,
      category,
      isTrigger: true,
      tag,
      data: { displayName },
    });

    this.collisionSystem?.addCollider(collider);
  }

  private setupPlayer(): void {
    if (!this.pipeline || !this.collisionSystem || !this.inputManager) return;

    // Spawn Mission Director in front of Flight Director console
    this.player = new PlayerCharacter({
      id: 'mission_director',
      initialX: 1200,
      initialY: 960,
      facing: FacingDirection.NORTH,
    });

    // Add player collider to collision system
    this.collisionSystem.addCollider(this.player.getCollider());

    // Add player visual display tree to GAMEPLAY_OBJECTS layer
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

  private setupInteractiveObjects(): void {
    if (!this.interactionSystem) return;

    // 1. Flight Director Command Console (Center of HQ Operations Room)
    const flightConsole = new InteractiveObject({
      id: 'CONSOLE_FLIGHT_DIRECTOR',
      displayName: 'Flight Director Console',
      actionText: 'Access Mission Control Console',
      category: InteractionCategory.MISSION_CONSOLE,
      x: 1200,
      y: 720,
      interactionRadius: 100,
      priority: 3,
      onInteract: async () => {
        return {
          success: true,
          action: 'OPEN_PANEL',
          message: 'Opened Flight Director Console',
          data: {
            title: 'MISSION CONTROL // FLIGHT DIRECTOR DESK',
            category: 'MISSION OPERATIONS',
            description:
              'Central command and countdown sequencing console for independent orbital missions. Real-time telemetry downlink from deep space tracking arrays is active.',
            specs: [
              { label: 'STATUS', value: 'ONLINE // READY', highlight: true },
              { label: 'ACTIVE MISSION', value: 'PROJECT DAWN - MK I PROBE', highlight: true },
              { label: 'DOWNLINK FREQ', value: '8.452 GHz X-BAND', highlight: false },
              { label: 'DIRECTOR CLEARANCE', value: 'AUTHORIZED (ALPHA)', highlight: false },
            ],
          },
        };
      },
    });
    this.interactionSystem.registerObject(flightConsole);

    // 2. Rocket Engineering Bay Airlock (West Wing Portal)
    const engineeringAirlock = new BuildingEntrance({
      id: 'AIRLOCK_ENGINEERING',
      buildingId: 'ROCKET_ENGINEERING_BAY',
      interiorId: 'ROCKET_FABRICATION_HANGAR',
      displayName: 'Rocket Engineering Hangar',
      actionText: 'Enter Rocket Engineering Bay',
      x: 240,
      y: 800,
      interactionRadius: 110,
      priority: 5,
    });
    this.interactionSystem.registerObject(engineeringAirlock);

    // 3. Spacecraft & Astrobiology Science Lab Airlock (East Wing Portal)
    const scienceAirlock = new BuildingEntrance({
      id: 'AIRLOCK_SCIENCE_LAB',
      buildingId: 'ASTROBIOLOGY_LAB',
      interiorId: 'SAMPLE_ANALYSIS_CLEANROOM',
      displayName: 'Astrobiology Science Lab',
      actionText: 'Enter Science & Materials Lab',
      x: 2160,
      y: 800,
      interactionRadius: 110,
      priority: 5,
    });
    this.interactionSystem.registerObject(scienceAirlock);

    // 4. Cryogenic Propellant Depot Storage Station
    const cryoDepot = new InteractiveObject({
      id: 'CRYO_PROPELLANT_DEPOT',
      displayName: 'Cryogenic Fuel Terminal',
      actionText: 'Inspect Cryo Propellant Manifold',
      category: InteractionCategory.RESOURCE_STATION,
      x: 580,
      y: 475,
      interactionRadius: 90,
      cooldownSeconds: 2.5,
      onInteract: async () => {
        return {
          success: true,
          action: 'OPEN_PANEL',
          message: 'Inspecting Cryo Propellant Depot',
          data: {
            title: 'CRYOGENIC PROPELLANT STORAGE DEPOT',
            category: 'PROPULSION LOGISTICS',
            description:
              'Vacuum-insulated cryogenic propellant manifold directly feeding the vertical launch vehicle integration bay. Monitored for boil-off and pressure deviations.',
            specs: [
              { label: 'LH2 LIQUID HYDROGEN', value: '42,500 L (98.2%)', highlight: true },
              { label: 'LOX LIQUID OXYGEN', value: '85,000 L (99.1%)', highlight: true },
              { label: 'MANIFOLD PRESSURE', value: '3.25 MPa [NOMINAL]', highlight: false },
              { label: 'SAFETY VENTING', value: 'CLOSED // SECURE', highlight: false },
            ],
          },
        };
      },
    });
    this.interactionSystem.registerObject(cryoDepot);

    // 5. Restricted Propulsion Cleanroom Airlock (Requires Clearance Level 2)
    const cleanroomEntrance = new BuildingEntrance({
      id: 'AIRLOCK_CLEANROOM_RESTRICTED',
      buildingId: 'PROPULSION_CLEANROOM',
      interiorId: 'ION_DRIVE_ASSEMBLY',
      displayName: 'Propulsion Cleanroom',
      actionText: 'Enter Propulsion Cleanroom',
      x: 740,
      y: 800,
      interactionRadius: 95,
      priority: 6,
      requirements: [
        {
          type: 'CLEARANCE',
          description: 'Security Clearance Level 2 Required',
          evaluate: () => this.playerClearanceLevel >= 2,
        },
      ],
    });
    this.interactionSystem.registerObject(cleanroomEntrance);

    // 6. Strategic Hologram Archive (Central Atrium)
    const hologramArchive = new InteractiveObject({
      id: 'HQ_HOLOGRAM_ARCHIVE',
      displayName: 'Agency Strategic Hologram',
      actionText: 'Open Road to Deep Space Archive',
      category: InteractionCategory.RESEARCH,
      x: 1200,
      y: 840,
      interactionRadius: 85,
      priority: 2,
      onInteract: async () => {
        return {
          success: true,
          action: 'OPEN_PANEL',
          message: 'Projecting Strategic Hologram',
          data: {
            title: 'INTERSTELLAR CONTINUUM // ARCHIVE',
            category: 'AGENCY ROADMAP',
            description:
              'Volumetric projection system rendering strategic progression pathways: from orbital rocket development to lunar relays, Martian outposts, and outer-system probes.',
            specs: [
              { label: 'CURRENT ERA', value: 'PHASE 1 // EARTH PROVING GROUND', highlight: true },
              { label: 'NEXT OBJECTIVE', value: 'ORBITAL LAUNCH TEST 01', highlight: true },
              { label: 'AGENCY PRESTIGE', value: 'LEVEL 1 (INDEPENDENT INITIATIVE)', highlight: false },
              { label: 'RESEARCH PAPERS', value: '14 ARCHIVED', highlight: false },
            ],
          },
        };
      },
    });
    this.interactionSystem.registerObject(hologramArchive);
  }

  private setupHud(): void {
    if (!this.pipeline) return;

    this.hudContainer = this.pipeline.getLayerContainer(RenderLayerType.HUD);

    // Top Header Diagnostics Bar
    const headerBg = new Graphics();
    headerBg.rect(20, 20, 680, 160);
    headerBg.fill({ color: 0x070c14, alpha: 0.85 });
    headerBg.stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.6 });

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x00f0ff,
      letterSpacing: 1.5,
    });

    const titleText = new Text({
      text: 'INTERSTELLAR CONTINUUM // MISSION DIRECTOR HQ // PHASE 5',
      style: titleStyle,
    });
    titleText.position.set(35, 30);

    const telemetryStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x94a3b8,
      lineHeight: 18,
    });

    this.telemetryText = new Text({
      text: 'INITIALIZING TELEMETRY...',
      style: telemetryStyle,
    });
    this.telemetryText.position.set(35, 58);

    // Bottom Center Interaction Prompt Bar
    const promptStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 15,
      fontWeight: 'bold',
      fill: 0xffd700,
      letterSpacing: 1.2,
      align: 'center',
    });

    this.interactionPromptText = new Text({
      text: '',
      style: promptStyle,
    });
    this.interactionPromptText.position.set(960 - 300, 940);
    this.interactionPromptText.visible = false;

    // Log message for interaction feedback
    const logStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fill: 0x22ee88,
    });
    this.logMessageText = new Text({
      text: '',
      style: logStyle,
    });
    this.logMessageText.position.set(35, 150);

    this.hudContainer.addChild(headerBg);
    this.hudContainer.addChild(titleText);
    this.hudContainer.addChild(this.telemetryText);
    this.hudContainer.addChild(this.interactionPromptText);
    this.hudContainer.addChild(this.logMessageText);

    // Setup interactive overlay buttons
    this.setupControlButtons();
  }

  private setupControlButtons(): void {
    if (!this.pipeline) return;
    const uiContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);

    const btnDebug = this.createButton(720, 30, 'COLLISION WIREFRAME (F1/C)', () => {
      this.toggleCollisionDebug();
    });

    const btnSprint = this.createButton(720, 75, 'TOGGLE SPRINT (Shift)', () => {
      // Toggle movement speed configuration
      if (this.controller) {
        const cur = this.controller.movement.getConfig().walkSpeed;
        if (cur === 180) {
          this.controller.movement.setConfig({ walkSpeed: 310 });
          this.showLogFeedback('RUNNING SPEED FORCED TO 310 px/s');
        } else {
          this.controller.movement.setConfig({ walkSpeed: 180 });
          this.showLogFeedback('RUNNING SPEED RESET TO 180 px/s');
        }
      }
    });

    const btnResetPos = this.createButton(720, 120, 'TELEPORT TO CENTER', () => {
      if (this.player) {
        this.player.updatePosition(1200, 960);
        this.cameraSystem?.setPosition(1200, 960, true);
        this.showLogFeedback('DIRECTOR TELEPORTED TO CENTRAL CONSOLE');
      }
    });

    const btnLockInput = this.createButton(1000, 30, 'TOGGLE INPUT LOCK', () => {
      if (this.inputManager) {
        if (this.inputManager.isInputLocked()) {
          this.inputManager.unlockInput();
          this.showLogFeedback('INPUT UNLOCKED - CONTROLS RESTORED');
        } else {
          this.inputManager.lockInput('Diagnostics Mode');
          this.showLogFeedback('INPUT LOCKED - PLAYER FROZEN');
        }
      }
    });

    const btnOverview = this.createButton(1000, 75, 'HQ OVERVIEW (0.5x)', () => {
      this.cameraSystem?.setMode(CameraMode.MISSION_OVERVIEW);
      this.cameraSystem?.setZoom(0.5);
      this.showLogFeedback('CAMERA MODE: MISSION_OVERVIEW (0.5x)');
    });

    const btnFollowCam = this.createButton(1000, 120, 'FOLLOW CAM (1.0x)', () => {
      this.cameraSystem?.setMode(CameraMode.PLAYER_FOLLOW);
      this.cameraSystem?.setZoom(1.0);
      this.showLogFeedback('CAMERA MODE: PLAYER_FOLLOW (1.0x)');
    });

    const btnAnimInteract = this.createButton(1280, 30, 'ANIM: CONSOLE TYPING', () => {
      if (this.player) {
        this.player.playInteraction(1.5);
        this.showLogFeedback('ANIMATION: CONSOLE TYPING ACTIVE');
      }
    });

    const btnAnimEnter = this.createButton(1280, 75, 'ANIM: ENTER AIRLOCK', () => {
      if (this.player) {
        this.player.playEnterBuilding(1.2);
        this.showLogFeedback('ANIMATION: ENTERING AIRLOCK (FADE OUT)');
      }
    });

    const btnAnimExit = this.createButton(1280, 120, 'ANIM: EXIT AIRLOCK', () => {
      if (this.player) {
        this.player.playExitBuilding(1.2);
        this.showLogFeedback('ANIMATION: EXITING AIRLOCK (EMERGE)');
      }
    });

    const btnInteractAction = this.createButton(1560, 30, 'INTERACT WITH TARGET [E]', () => {
      this.interactionSystem?.interactWithActiveTarget().then((res) => {
        if (res) {
          this.showLogFeedback(`ACTION RESULT: ${res.action} (${res.message ?? 'OK'})`);
        }
      });
    });

    const btnToggleClearance = this.createButton(1560, 75, 'TOGGLE CLEARANCE (LV 1/2)', () => {
      this.playerClearanceLevel = this.playerClearanceLevel === 1 ? 2 : 1;
      this.showLogFeedback(`DIRECTOR SECURITY CLEARANCE: LEVEL ${this.playerClearanceLevel}`);
    });

    uiContainer.addChild(btnDebug);
    uiContainer.addChild(btnSprint);
    uiContainer.addChild(btnResetPos);
    uiContainer.addChild(btnLockInput);
    uiContainer.addChild(btnOverview);
    uiContainer.addChild(btnFollowCam);
    uiContainer.addChild(btnAnimInteract);
    uiContainer.addChild(btnAnimEnter);
    uiContainer.addChild(btnAnimExit);
    uiContainer.addChild(btnInteractAction);
    uiContainer.addChild(btnToggleClearance);
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): Container {
    const btn = new Container();
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, 260, 34, 4);
    bg.fill({ color: 0x111c2e, alpha: 0.9 });
    bg.stroke({ color: 0x00f0ff, width: 1.2, alpha: 0.7 });

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x00f0ff,
        letterSpacing: 1,
      }),
    });
    txt.position.set(12, 9);

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

  private subscribeEvents(): void {
    if (!this.events) return;

    this.events.subscribe('collision:trigger-enter', (payload: any) => {
      const trigger = payload.trigger as ICollider;
      const displayName = trigger.data?.displayName || trigger.tag || trigger.id;
      if (this.interactionPromptText) {
        this.interactionPromptText.text = `[E] APPROACHING ${displayName}`;
        this.interactionPromptText.visible = true;
      }
    });

    this.events.subscribe('collision:trigger-exit', () => {
      if (this.interactionPromptText) {
        this.interactionPromptText.visible = false;
      }
    });

    this.events.subscribe('interaction:executed', (payload: any) => {
      this.showLogFeedback(`>> INTERACTION INITIATED: [${payload.category}] ${payload.objectId}`);
    });

    this.events.subscribe('InteractionCompleted', (payload: any) => {
      this.showLogFeedback(`>> INTERACTION COMPLETED: ${payload.objectId} (Result: ${payload.action})`);
    });

    this.events.subscribe('building:entered', (payload: any) => {
      this.showLogFeedback(`>> AIRLOCK TRANSITION: Entering ${payload.buildingId} (${payload.interiorId})`);
      this.cameraSystem?.shake(5);
    });

    this.events.subscribe('building:exited', (payload: any) => {
      this.showLogFeedback(`>> AIRLOCK TRANSITION: Exiting ${payload.buildingId}`);
    });

    this.events.subscribe('player:interact', (payload: any) => {
      const trigger = payload.trigger as ICollider;
      const name = trigger.data?.displayName || trigger.tag || trigger.id;
      this.showLogFeedback(`>> INTERACTION TRIGGERED: ${name}`);
      this.cameraSystem?.shake(8);
    });
  }

  public toggleCollisionDebug(): void {
    if (!this.collisionSystem) return;
    const current = this.collisionSystem.isDebugEnabled();
    this.collisionSystem.setDebugEnabled(!current);
    this.showLogFeedback(`COLLISION WIREFRAME DEBUG: ${!current ? 'ENABLED' : 'DISABLED'}`);
  }

  private showLogFeedback(msg: string): void {
    if (this.logMessageText) {
      this.logMessageText.text = msg;
      this.activePromptTimeout = 3.0; // Show for 3 seconds
    }
  }

  protected onUpdate(deltaSeconds: number): void {
    // 1. Check for debug toggle hotkey (F1 or KeyC)
    if (this.inputManager?.isActionJustPressed(InputAction.ToggleDebug)) {
      this.toggleCollisionDebug();
    }

    // 2. Update Player Controller (reads inputs, resolves movement & sliding collisions)
    if (this.controller) {
      this.controller.update(deltaSeconds);
    }

    // 3. Update Camera System (follows player with deadzone, clamps bounds, applies lookahead)
    if (this.cameraSystem) {
      this.cameraSystem.update(deltaSeconds);
    }

    // 4. Update Collision System
    if (this.collisionSystem) {
      this.collisionSystem.update(deltaSeconds);
    }

    // 4.5. Update Environmental Interaction System
    if (this.interactionSystem) {
      this.interactionSystem.update(deltaSeconds);
    }

    // 5. Update Telemetry UI
    if (this.player && this.telemetryText && this.cameraSystem) {
      const pos = this.player.getPosition();
      const vel = this.player.getVelocity();
      const speed = Math.round(Math.hypot(vel.x, vel.y));
      const state = this.player.getState();
      const facing = this.player.getFacing();
      const camPos = this.cameraSystem.getPosition();
      const zoom = this.cameraSystem.getZoom();
      const locked = this.inputManager?.isInputLocked() ? 'LOCKED' : 'ACTIVE';
      const animMachine = this.player.getAnimationStateMachine();
      const frameIndex = animMachine.getFrameIndex();
      const normTime = Math.round(animMachine.getNormalizedTime() * 100);

      this.telemetryText.text =
        `DIRECTOR POS: (${Math.round(pos.x)}, ${Math.round(pos.y)}) | SPEED: ${speed} px/s | STATE: ${state} [${facing}]\n` +
        `ANIMATION: Frame ${frameIndex}/8 (${normTime}%) | CAM: (${Math.round(camPos.x)}, ${Math.round(camPos.y)}) @ ${zoom.toFixed(2)}x | INPUT: ${locked}\n` +
        `MOVEMENT: [W,A,S,D / ARROWS] | SPRINT: [SHIFT] | INTERACT: [E] | DEBUG: [F1 / C]`;
    }

    // 6. Decay log message
    if (this.activePromptTimeout > 0) {
      this.activePromptTimeout -= deltaSeconds;
      if (this.activePromptTimeout <= 0 && this.logMessageText) {
        this.logMessageText.text = '';
      }
    }

    // 7. Update Rendering Pipeline
    if (this.pipeline) {
      this.pipeline.update(deltaSeconds);
    }
  }

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
    Logger.info('PLAYER_TEST_SCENE', 'Player Movement Test Scene cleaned up.');
  }
}
