/**
 * INTERSTELLAR CONTINUUM - Reusable Facility Interior Scene
 * 2.5D interior room architecture for headquarters facilities
 * Features facility-specific consoles, cleanrooms, high-bays, interactive exit airlock,
 * collision bounds, and seamless round-trip navigation back to Earth campus.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { SceneId, SceneIdType } from './SceneId';
import { ServiceLocator } from '../core/ServiceLocator';
import { RenderEngine, RenderPipeline, RenderLayerType } from '../rendering';
import { CameraSystem } from '../camera/CameraSystem';
import { CameraMode, ZoomPreset } from '../camera/CameraMode';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { EventBus } from '../core/EventBus';
import { CollisionSystem } from '../collision/CollisionSystem';
import { BoxCollider } from '../collision/BoxCollider';
import { CollisionCategory } from '../collision/ColliderTypes';
import { PlayerCharacter, FacingDirection } from '../player/PlayerCharacter';
import { MovementComponent } from '../player/MovementComponent';
import { PlayerController } from '../player/PlayerController';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { BuildingEntrance } from '../interaction/BuildingEntrance';
import { SceneManager } from './SceneManager';
import { FacilityRegistry } from '../facilities/FacilityRegistry';
import { FacilityRecord, FacilityId } from '../facilities/FacilityTypes';
import { Logger } from '../core/logging/Logger';

export interface FacilityInteriorPayload {
  facilityId: string;
  returnX: number;
  returnY: number;
  facilityRecord?: FacilityRecord;
}

export class FacilityInteriorScene extends BaseScene {
  public readonly id: SceneIdType;

  public readonly roomWidth: number = 1600;
  public readonly roomHeight: number = 1000;

  private facilityId: string = FacilityId.MISSION_OPERATIONS;
  private facilityRecord?: FacilityRecord;
  private returnX: number = 1800;
  private returnY: number = 1730;

  private pipeline?: RenderPipeline;
  private cameraSystem?: CameraSystem;
  private collisionSystem?: CollisionSystem;
  private inputManager?: InputManager;
  private eventBus?: EventBus;
  private interactionSystem?: InteractionSystem;
  private sceneManager?: SceneManager;

  private player?: PlayerCharacter;
  private controller?: PlayerController;

  private interiorGfx?: Graphics;
  private exitDoor?: BuildingEntrance;
  private headerHud?: Container;

  constructor(sceneId: SceneIdType = 'FACILITY_INTERIOR') {
    super();
    this.id = sceneId;
  }

  protected async onInitialize(): Promise<void> {
    Logger.info('FACILITY_INTERIOR', `Initializing Interior Scene for "${String(this.id)}"...`);

    // 1. Resolve Services
    this.eventBus = ServiceLocator.has('EventBus')
      ? ServiceLocator.get<EventBus>('EventBus')
      : new EventBus();

    if (ServiceLocator.has('RenderEngine')) {
      const renderEngine = ServiceLocator.get<RenderEngine>('RenderEngine');
      this.pipeline = renderEngine.getPipeline();
    } else {
      this.pipeline = new RenderPipeline(this.container);
    }

    if (ServiceLocator.has('CameraSystem')) {
      this.cameraSystem = ServiceLocator.get<CameraSystem>('CameraSystem');
    }

    if (ServiceLocator.has('InputManager')) {
      this.inputManager = ServiceLocator.get<InputManager>('InputManager');
    }

    if (ServiceLocator.has('SceneManager')) {
      this.sceneManager = ServiceLocator.get<SceneManager>('SceneManager');
    }

    // 2. Collision & Interaction Subsystems for Interior
    this.collisionSystem = new CollisionSystem({ eventBus: this.eventBus });
    this.collisionSystem.initialize();

    this.interactionSystem = new InteractionSystem({
      eventBus: this.eventBus,
      inputManager: this.inputManager,
    });
    this.interactionSystem.initialize();

    // 3. Build Interior Architecture (Floor, Walls, Consoles, Lighting)
    this.buildRoomArchitecture();

    // 4. Setup Interior Mission Director Character
    this.setupInteriorPlayer();

    // 5. Setup Exit Door
    this.setupExitDoor();

    // 6. Connect Interaction Visuals
    if (this.pipeline && this.interactionSystem) {
      this.interactionSystem.setPlayer(this.player);
      const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
      gameplayContainer.addChild(this.interactionSystem.getContextualPrompt().container);

      const uiContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);
      uiContainer.addChild(this.interactionSystem.getInformationPanel().container);
    }

    // 7. Setup Interior Diagnostics HUD
    this.setupInteriorHud();
  }

  protected async onActivate(payload?: FacilityInteriorPayload): Promise<void> {
    Logger.info('FACILITY_INTERIOR', `Activating Interior with payload:`, payload);

    if (payload) {
      this.facilityId = payload.facilityId || this.facilityId;
      this.returnX = payload.returnX ?? this.returnX;
      this.returnY = payload.returnY ?? this.returnY;
      this.facilityRecord = payload.facilityRecord;
    }

    if (!this.facilityRecord && ServiceLocator.has('FacilityRegistry')) {
      const reg = ServiceLocator.get<FacilityRegistry>('FacilityRegistry');
      this.facilityRecord = reg.getFacility(this.facilityId);
    }

    // Rebuild room visual theme based on facility
    this.renderFacilityDecor();

    // Configure Camera for Interior Room Bounds
    if (this.cameraSystem) {
      this.cameraSystem.setBounds({
        minX: 0,
        minY: 0,
        maxX: this.roomWidth,
        maxY: this.roomHeight,
      });
      this.cameraSystem.setMode(CameraMode.PLAYER_FOLLOW);
      this.cameraSystem.setZoomPreset(ZoomPreset.NORMAL_EXPLORATION);
      if (this.player) {
        this.cameraSystem.setTarget(this.player);
      }
    }

    // Spawn player near South airlock door facing North into the room
    if (this.player) {
      this.player.updatePosition(800, 850);
      this.player.setFacing(FacingDirection.NORTH);
    }
    if (this.cameraSystem) {
      this.cameraSystem.setPosition(800, 850, true);
    }

    // Update HUD titles
    this.updateHudTitle();
  }

  private buildRoomArchitecture(): void {
    if (!this.pipeline || !this.collisionSystem) return;

    const bgContainer = this.pipeline.getLayerContainer(RenderLayerType.BACKGROUND);
    const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
    gameplayContainer.sortableChildren = true;

    this.interiorGfx = new Graphics();
    bgContainer.addChild(this.interiorGfx);

    // -----------------------------------------------------------------
    // SOLID WALL BOUNDARY COLLIDERS
    // -----------------------------------------------------------------
    // North Wall: (0, 0, roomWidth, 120)
    this.collisionSystem.addCollider(
      new BoxCollider({
        id: 'interior_wall_north',
        x: 0,
        y: 0,
        width: this.roomWidth,
        height: 120,
        category: CollisionCategory.SOLID,
        tag: 'INTERIOR_WALL',
      })
    );

    // South Wall Left: (0, roomHeight - 60, 720, 60)
    this.collisionSystem.addCollider(
      new BoxCollider({
        id: 'interior_wall_south_left',
        x: 0,
        y: this.roomHeight - 60,
        width: 720,
        height: 60,
        category: CollisionCategory.SOLID,
        tag: 'INTERIOR_WALL',
      })
    );

    // South Wall Right: (880, roomHeight - 60, 720, 60)
    this.collisionSystem.addCollider(
      new BoxCollider({
        id: 'interior_wall_south_right',
        x: 880,
        y: this.roomHeight - 60,
        width: 720,
        height: 60,
        category: CollisionCategory.SOLID,
        tag: 'INTERIOR_WALL',
      })
    );

    // West Wall: (0, 0, 60, roomHeight)
    this.collisionSystem.addCollider(
      new BoxCollider({
        id: 'interior_wall_west',
        x: 0,
        y: 0,
        width: 60,
        height: this.roomHeight,
        category: CollisionCategory.SOLID,
        tag: 'INTERIOR_WALL',
      })
    );

    // East Wall: (roomWidth - 60, 0, 60, roomHeight)
    this.collisionSystem.addCollider(
      new BoxCollider({
        id: 'interior_wall_east',
        x: this.roomWidth - 60,
        y: 0,
        width: 60,
        height: this.roomHeight,
        category: CollisionCategory.SOLID,
        tag: 'INTERIOR_WALL',
      })
    );
  }

  private renderFacilityDecor(): void {
    if (!this.interiorGfx) return;

    this.interiorGfx.clear();
    const w = this.roomWidth;
    const h = this.roomHeight;
    const accent = this.facilityRecord?.accentColor || 0x00f0ff;

    // 1. Flooring: Deep Navy Aerospace Tiles
    this.interiorGfx.rect(0, 0, w, h).fill({ color: 0x080f1d });

    // Grid tile lines
    const tileSize = 64;
    for (let x = 60; x <= w - 60; x += tileSize) {
      this.interiorGfx
        .moveTo(x, 120)
        .lineTo(x, h - 60)
        .stroke({ color: 0x111c2e, width: 1.0 });
    }
    for (let y = 120; y <= h - 60; y += tileSize) {
      this.interiorGfx
        .moveTo(60, y)
        .lineTo(w - 60, y)
        .stroke({ color: 0x111c2e, width: 1.0 });
    }

    // Directional Walkway Guide down center
    this.interiorGfx
      .rect(w / 2 - 80, 140, 160, h - 220)
      .fill({ color: 0x0b172a, alpha: 0.85 })
      .stroke({ color: accent, width: 1.2, alpha: 0.4 });

    // 2. North Wall Screen Display & Structural Bulkhead
    this.interiorGfx
      .rect(0, 0, w, 120)
      .fill({ color: 0x030712 })
      .stroke({ color: 0x1e293b, width: 2.5 });

    // Overhead Center Monitor Wall (800px wide)
    this.interiorGfx
      .rect(w / 2 - 400, 15, 800, 85)
      .fill({ color: 0x040812 })
      .stroke({ color: accent, width: 2.0 });

    // Monitor screen subdivisions
    for (let i = 0; i < 4; i++) {
      const sx = w / 2 - 380 + i * 190;
      this.interiorGfx
        .rect(sx, 25, 180, 65)
        .fill({ color: 0x071120 })
        .stroke({ color: 0x1e3a5f, width: 1.0 });

      // Holographic wave / telemetry bar
      this.interiorGfx
        .moveTo(sx + 10, 58)
        .lineTo(sx + 170, 58)
        .stroke({ color: accent, width: 1.5, alpha: 0.6 });
    }

    // 3. Perimeter Boundary Walls
    this.interiorGfx.rect(0, 0, 60, h).fill({ color: 0x030712 });
    this.interiorGfx.rect(w - 60, 0, 60, h).fill({ color: 0x030712 });
    this.interiorGfx.rect(0, h - 60, 720, 60).fill({ color: 0x030712 });
    this.interiorGfx.rect(880, h - 60, 720, 60).fill({ color: 0x030712 });

    // South Airlock Threshold
    this.interiorGfx
      .rect(720, h - 60, 160, 60)
      .fill({ color: 0x1e293b })
      .stroke({ color: accent, width: 2.0 });

    // Caution Striping on airlock threshold
    for (let cx = 730; cx < 870; cx += 20) {
      this.interiorGfx
        .moveTo(cx, h - 50)
        .lineTo(cx + 10, h - 10)
        .stroke({ color: 0xf59e0b, width: 3.0 });
    }
  }

  private setupInteriorPlayer(): void {
    if (!this.pipeline || !this.collisionSystem || !this.inputManager) return;

    this.player = new PlayerCharacter({
      id: 'mission_director_interior',
      initialX: 800,
      initialY: 850,
      facing: FacingDirection.NORTH,
    });

    this.collisionSystem.addCollider(this.player.getCollider());

    const gameplayContainer = this.pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);
    gameplayContainer.addChild(this.player.container);

    const movement = new MovementComponent({
      walkSpeed: 180,
      sprintSpeed: 300,
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
  }

  private setupExitDoor(): void {
    if (!this.interactionSystem) return;

    // Interactive Exit Airlock placed at South Entrance (800, 920)
    this.exitDoor = new BuildingEntrance({
      id: 'interior_exit_airlock',
      buildingId: this.facilityId,
      interiorId: 'INTERIOR_ROOM',
      displayName: 'Campus Exterior',
      actionText: 'Exit to Campus Exterior',
      x: 800,
      y: 920,
      interactionRadius: 85,
      isExit: true,
      priority: 10,
    });

    // Custom interaction logic returning to headquarters
    this.exitDoor.onInteract = async () => {
      await this.exitToHeadquarters();
      return {
        success: true,
        action: 'EXIT_BUILDING',
        message: 'Returning to Campus Exterior...',
        data: { returnX: this.returnX, returnY: this.returnY },
      };
    };

    this.interactionSystem.registerObject(this.exitDoor);
  }

  public async exitToHeadquarters(): Promise<void> {
    Logger.info(
      'FACILITY_INTERIOR',
      `Exiting interior. Returning to Headquarters at (${this.returnX}, ${this.returnY})`
    );

    if (this.sceneManager) {
      // Check if pushed on stack
      if (this.sceneManager.getActiveScene() === this) {
        // Switch or pop back to Headquarters
        await this.sceneManager.switchScene(SceneId.HEADQUARTERS, {
          payload: { spawnX: this.returnX, spawnY: this.returnY },
        });
      }
    }
  }

  private setupInteriorHud(): void {
    if (!this.pipeline) return;

    const uiContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);
    this.headerHud = new Container();

    const bannerBg = new Graphics();
    bannerBg.rect(20, 20, 680, 75);
    bannerBg.fill({ color: 0x050b16, alpha: 0.9 });
    bannerBg.stroke({ color: 0x00f0ff, width: 1.5, alpha: 0.7 });

    this.headerHud.addChild(bannerBg);

    // Direct Return Button in HUD
    const exitBtn = new Container();
    exitBtn.position.set(720, 20);
    exitBtn.eventMode = 'static';
    exitBtn.cursor = 'pointer';

    const btnBg = new Graphics();
    btnBg.roundRect(0, 0, 200, 42, 4);
    btnBg.fill({ color: 0x0f172a, alpha: 0.9 });
    btnBg.stroke({ color: 0x00f0ff, width: 1.2 });

    const btnTxt = new Text({
      text: 'EXIT TO CAMPUS [ESC]',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0x38bdf8,
        letterSpacing: 0.8,
      }),
    });
    btnTxt.position.set(16, 14);

    exitBtn.addChild(btnBg);
    exitBtn.addChild(btnTxt);

    exitBtn.on('pointerover', () => {
      btnBg.stroke({ color: 0xffffff, width: 1.5 });
      btnTxt.style.fill = 0xffffff;
    });
    exitBtn.on('pointerout', () => {
      btnBg.stroke({ color: 0x00f0ff, width: 1.2 });
      btnTxt.style.fill = 0x38bdf8;
    });
    exitBtn.on('pointertap', () => {
      this.exitToHeadquarters();
    });

    this.headerHud.addChild(exitBtn);
    uiContainer.addChild(this.headerHud);
  }

  private updateHudTitle(): void {
    if (!this.headerHud) return;

    // Remove previous title texts
    const existing = this.headerHud.children.filter((c) => c instanceof Text);
    for (const t of existing) {
      this.headerHud.removeChild(t);
    }

    const title = new Text({
      text: `${this.facilityRecord?.name?.toUpperCase() || 'FACILITY INTERIOR'}`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 15,
        fontWeight: 'bold',
        fill: this.facilityRecord?.accentColor || 0x00f0ff,
        letterSpacing: 1.0,
      }),
    });
    title.position.set(36, 30);

    const subtitle = new Text({
      text: `${this.facilityRecord?.department || 'HEADQUARTERS INTERIOR'} // AIRLOCK SECURED`,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fill: 0x94a3b8,
        letterSpacing: 0.8,
      }),
    });
    subtitle.position.set(36, 56);

    this.headerHud.addChild(title);
    this.headerHud.addChild(subtitle);
  }

  protected onUpdate(deltaSeconds: number): void {
    // 1. ESC key exits interior
    if (this.inputManager?.isActionJustPressed(InputAction.Cancel)) {
      this.exitToHeadquarters();
      return;
    }

    // 2. Update player controller & collision
    if (this.controller) {
      this.controller.update(deltaSeconds);
    }

    // 3. Update Camera
    if (this.cameraSystem) {
      this.cameraSystem.update(deltaSeconds);
    }

    // 4. Update Collision
    if (this.collisionSystem) {
      this.collisionSystem.update(deltaSeconds);
    }

    // 5. Update Interaction System
    if (this.interactionSystem) {
      this.interactionSystem.update(deltaSeconds);
    }

    // 6. Update Pipeline
    if (this.pipeline) {
      this.pipeline.update(deltaSeconds);
    }
  }

  // Verification getters
  public getPlayer(): PlayerCharacter | undefined {
    return this.player;
  }

  public getFacilityId(): string {
    return this.facilityId;
  }

  public getReturnCoords(): { x: number; y: number } {
    return { x: this.returnX, y: this.returnY };
  }

  public getExitDoor(): BuildingEntrance | undefined {
    return this.exitDoor;
  }

  protected onCleanup(): void {
    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }
    if (this.collisionSystem) {
      this.collisionSystem.clear();
    }
    if (this.interactionSystem) {
      this.interactionSystem.shutdown();
    }
    Logger.info('FACILITY_INTERIOR', 'Facility Interior Scene cleaned up.');
  }
}
