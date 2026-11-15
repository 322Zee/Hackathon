import { EventBus, ApplicationLifecycleState } from '../core/EventBus';
import { ServiceLocator } from '../core/ServiceLocator';
import { ConfigManager } from '../configuration/ConfigManager';
import { Logger } from '../core/logging/Logger';
import { ErrorHandler } from '../core/errors/ErrorHandler';
import { RenderEngine } from '../rendering/RenderEngine';
import { RenderSystem } from '../rendering/pipeline/RenderSystem';
import { CameraSystem } from '../camera/CameraSystem';
import { AssetManager } from '../assets/AssetManager';
import { AudioService } from '../audio/AudioService';
import { SceneManager } from '../scenes/SceneManager';
import { LoadingScreen } from '../scenes/LoadingScreen';
import { RenderingTestScene } from '../scenes/RenderingTestScene';
import { HeadquartersScene } from '../scenes/HeadquartersScene';
import { FacilityInteriorScene } from '../scenes/FacilityInteriorScene';
import { TitleScreenScene } from '../scenes/TitleScreenScene';
import { IntroCinematicScene } from '../scenes/IntroCinematicScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { MissionOperationsScene } from '../scenes/MissionOperationsScene';
import { RocketEngineeringScene } from '../scenes/RocketEngineeringScene';
import { FadeTransition } from '../scenes/transitions/FadeTransition';
import { SceneId } from '../scenes/SceneId';
import { CollisionSystem } from '../collision/CollisionSystem';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { FacilityRegistry } from '../facilities/FacilityRegistry';
import { StartupFlowController } from '../startup/StartupFlowController';
import { SystemRegistry } from '../systems/SystemRegistry';
import { GameStateManager } from '../state/GameStateManager';
import { InputManager } from '../input/InputManager';
import { EconomyService } from '../services/EconomyService';
import { SaveService } from '../services/SaveService';
import { MissionService } from '../services/MissionService';
import { ResearchService } from '../services/ResearchService';
import { SettingsManager } from '../settings/SettingsManager';

export interface ApplicationOptions {
  containerElement: HTMLElement;
  autoStart?: boolean;
}

export class ApplicationController {
  private static instance: ApplicationController | null = null;

  private lifecycleState: ApplicationLifecycleState = 'UNINITIALIZED';
  private containerElement!: HTMLElement;
  private isDestroyed = false;

  private eventBus!: EventBus;
  private errorHandler!: ErrorHandler;
  private configManager!: ConfigManager;
  private gameStateManager!: GameStateManager;
  private systemRegistry!: SystemRegistry;
  private inputManager!: InputManager;
  private cameraSystem!: CameraSystem;
  private renderEngine!: RenderEngine;
  private assetManager!: AssetManager;
  private audioService!: AudioService;
  private sceneManager!: SceneManager;
  private loadingScreen!: LoadingScreen;

  // Domain services
  private saveService!: SaveService;
  private economyService!: EconomyService;
  private missionService!: MissionService;
  private researchService!: ResearchService;

  constructor(options: ApplicationOptions) {
    if (ApplicationController.instance && !ApplicationController.instance.isDestroyed) {
      Logger.warn('APP_CONTROLLER', 'Existing ApplicationController detected. Reusing existing instance.');
      return ApplicationController.instance;
    }

    this.containerElement = options.containerElement;
    ApplicationController.instance = this;
  }

  public static getInstance(): ApplicationController | null {
    return ApplicationController.instance;
  }

  public getLifecycleState(): ApplicationLifecycleState {
    return this.lifecycleState;
  }

  public async bootstrap(): Promise<void> {
    if (this.lifecycleState !== 'UNINITIALIZED') {
      Logger.warn(
        'APP_CONTROLLER',
        `Duplicate bootstrap call prevented. Current lifecycle state: ${this.lifecycleState}`
      );
      return;
    }

    this.setLifecycleState('INITIALIZING');
    Logger.info('APP_CONTROLLER', '=== INTERSTELLAR CONTINUUM // BOOTSTRAP COMMENCED ===');

    try {
      // 1. Initialize EventBus
      this.eventBus = new EventBus();
      ServiceLocator.register<EventBus>('EventBus', this.eventBus);

      // 2. Initialize ErrorHandler with EventBus integration
      this.errorHandler = ErrorHandler.initialize(this.eventBus);
      ServiceLocator.register<ErrorHandler>('ErrorHandler', this.errorHandler);

      // 3. Initialize Configuration Manager
      this.configManager = new ConfigManager(this.eventBus);
      ServiceLocator.register<ConfigManager>('ConfigManager', this.configManager);
      const config = this.configManager.getConfig();

      // 4. Initialize GameStateManager
      this.gameStateManager = new GameStateManager(this.eventBus);
      ServiceLocator.register<GameStateManager>('GameStateManager', this.gameStateManager);

      // 5. Initialize SystemRegistry
      this.systemRegistry = new SystemRegistry();
      ServiceLocator.register<SystemRegistry>('SystemRegistry', this.systemRegistry);

      // 6. Initialize Persistence and load saved profile
      this.saveService = new SaveService();
      ServiceLocator.register<SaveService>('SaveService', this.saveService);
      const savedState = this.saveService.loadFromSlot(1) || this.saveService.createNewGame();

      // 7. Initialize Domain Services
      this.economyService = new EconomyService(savedState.resources, this.eventBus);
      ServiceLocator.register<EconomyService>('EconomyService', this.economyService);

      this.missionService = new MissionService(this.eventBus, savedState.completedMissions);
      ServiceLocator.register<MissionService>('MissionService', this.missionService);

      this.researchService = new ResearchService(this.eventBus, savedState.unlockedTechnologies);
      ServiceLocator.register<ResearchService>('ResearchService', this.researchService);

      // 8. Initialize Audio System
      this.audioService = new AudioService(config.audio, this.eventBus);
      ServiceLocator.register<AudioService>('AudioService', this.audioService);

      // 9. Initialize PixiJS RenderEngine
      this.renderEngine = new RenderEngine(this.containerElement, config.display, this.eventBus);
      await this.renderEngine.initialize();
      ServiceLocator.register<RenderEngine>('RenderEngine', this.renderEngine);

      const renderSystem = new RenderSystem(this.renderEngine.getPipeline());
      this.systemRegistry.register(renderSystem);
      ServiceLocator.register<RenderSystem>('RenderSystem', renderSystem);

      // 10. Initialize CameraSystem linked to RenderPipeline's LayerManager
      this.cameraSystem = new CameraSystem(this.renderEngine.getVirtualResolution());
      const pipeline = this.renderEngine.getPipeline();
      if (pipeline && pipeline.layerManager) {
        this.cameraSystem.setLayerManager(pipeline.layerManager);
      }
      if (config.accessibility) {
        this.cameraSystem.setReducedMotion(config.accessibility.reducedMotion);
      }
      this.systemRegistry.register(this.cameraSystem);
      ServiceLocator.register<CameraSystem>('CameraSystem', this.cameraSystem);

      // 10.5. Initialize CollisionSystem
      const collisionSystem = new CollisionSystem({ eventBus: this.eventBus });
      collisionSystem.initialize();
      this.systemRegistry.register(collisionSystem);
      ServiceLocator.register<CollisionSystem>('CollisionSystem', collisionSystem);

      // 11. Initialize InputManager with VirtualResolution
      this.inputManager = new InputManager(this.renderEngine.getVirtualResolution());
      this.inputManager.initialize();
      ServiceLocator.register<InputManager>('InputManager', this.inputManager);
      this.systemRegistry.register(this.inputManager);

      // 11.4. Initialize FacilityRegistry
      const facilityRegistry = FacilityRegistry.getInstance(this.eventBus);
      ServiceLocator.register<FacilityRegistry>('FacilityRegistry', facilityRegistry);

      // 11.5. Initialize InteractionSystem
      const interactionSystem = new InteractionSystem({
        eventBus: this.eventBus,
        inputManager: this.inputManager,
      });
      interactionSystem.initialize();
      this.systemRegistry.register(interactionSystem);
      ServiceLocator.register<InteractionSystem>('InteractionSystem', interactionSystem);

      // 11.55. Initialize Centralized SettingsManager
      const settingsManager = new SettingsManager(this.eventBus, {
        audioService: this.audioService,
        shaderManager: this.renderEngine.getPipeline()?.shaderManager,
        virtualResolution: this.renderEngine.getVirtualResolution(),
        cameraSystem: this.cameraSystem,
        inputManager: this.inputManager,
        configManager: this.configManager,
      });
      ServiceLocator.register<SettingsManager>('SettingsManager', settingsManager);

      // 11.6. Initialize SceneManager & LoadingScreen
      const layers = this.renderEngine.getLayers();
      this.sceneManager = new SceneManager(
        layers.screen,
        layers.transitionOverlay,
        this.eventBus,
        this.systemRegistry
      );
      ServiceLocator.register<SceneManager>('SceneManager', this.sceneManager);
      ServiceLocator.register<any>('ScreenManager', this.sceneManager); // Compatibility alias

      this.loadingScreen = new LoadingScreen();
      this.sceneManager.register(this.loadingScreen);
      await this.sceneManager.switchScene(this.loadingScreen.id, { transition: null });

      const renderingTestScene = new RenderingTestScene();
      this.sceneManager.register(renderingTestScene);

      // 11.7. Initialize StartupFlowController
      const startupFlowController = new StartupFlowController({
        saveService: this.saveService,
        gameStateManager: this.gameStateManager,
        sceneManager: this.sceneManager,
        eventBus: this.eventBus,
      });
      ServiceLocator.register<StartupFlowController>('StartupFlowController', startupFlowController);

      const headquartersScene = new HeadquartersScene();
      this.sceneManager.register(headquartersScene);

      // Register Title Screen & Introductory Cinematic Scenes
      const titleScreenScene = new TitleScreenScene();
      this.sceneManager.register(titleScreenScene);

      const introCinematicScene = new IntroCinematicScene();
      this.sceneManager.register(introCinematicScene);

      // Register Interior Scenes for Facilities
      this.sceneManager.register(new FacilityInteriorScene('FACILITY_INTERIOR'));
      this.sceneManager.register(new MissionOperationsScene());
      this.sceneManager.register(new RocketEngineeringScene());
      this.sceneManager.register(new FacilityInteriorScene(SceneId.SPACECRAFT_LABORATORY));
      this.sceneManager.register(new SettingsScene());

      // 12. Initialize Asset Manager
      this.assetManager = new AssetManager(this.eventBus);
      await this.assetManager.initialize();
      ServiceLocator.register<AssetManager>('AssetManager', this.assetManager);
      this.systemRegistry.register(this.assetManager);

      // 13. Hook resize events to SceneManager
      this.eventBus.on('window:resized', () => {
        this.sceneManager.onResize(this.renderEngine.getTransform());
      });

      // 14. Connect Application Lifecycle Ticker loop
      this.startMainLoop();

      // 15. Simulate foundation asset bundle readiness
      this.loadingScreen.setProgress(0.6, 'CALIBRATING ORBITAL MECHANICS...');
      await this.assetManager.loadBundle('core');

      this.loadingScreen.setProgress(1.0, 'APPLICATION READY // ALL SYSTEMS NOMINAL');

      // 16. Transition smoothly to Title Screen
      await this.sceneManager.switchScene(SceneId.TITLE_SCREEN, {
        transition: new FadeTransition(0.4),
      });

      this.setLifecycleState('RUNNING');
      this.eventBus.emit('game:ready', undefined);
      Logger.info('APP_CONTROLLER', 'Application bootstrap completed successfully. Lifecycle: RUNNING');
    } catch (err: any) {
      this.setLifecycleState('ERROR');
      this.errorHandler.report(err, 'ApplicationController.bootstrap', true);
      throw err;
    }
  }

  private startMainLoop(): void {
    const app = this.renderEngine.getApp();

    app.ticker.add((ticker) => {
      if (this.lifecycleState !== 'RUNNING' && this.lifecycleState !== 'INITIALIZING') {
        return;
      }

      const deltaSeconds = ticker.deltaMS / 1000;

      // Lifecycle Update Order:
      // 1. Process Input / Events
      this.inputManager.update(deltaSeconds);

      // 2. Systems Update (physics, simulation, world)
      this.systemRegistry.updateAll(deltaSeconds);

      // 3. Scene / UI Updates
      this.sceneManager.update(deltaSeconds);

      // 4. Scene Render Pass
      this.sceneManager.render(deltaSeconds);
    });
  }

  private setLifecycleState(next: ApplicationLifecycleState): void {
    const prev = this.lifecycleState;
    this.lifecycleState = next;
    Logger.info('APP_CONTROLLER', `Lifecycle state change: ${prev} -> ${next}`);
    if (this.eventBus) {
      this.eventBus.emit('lifecycle:state_changed', { from: prev, to: next });
    }
  }

  public shutdown(): void {
    if (this.isDestroyed) return;

    Logger.info('APP_CONTROLLER', 'Shutting down INTERSTELLAR CONTINUUM...');
    this.setLifecycleState('SHUTDOWN');

    if (this.sceneManager) {
      this.sceneManager.destroy();
    }

    if (this.systemRegistry) {
      this.systemRegistry.shutdownAll();
    }

    if (this.inputManager) {
      this.inputManager.shutdown();
    }

    if (this.renderEngine) {
      this.renderEngine.destroy();
    }

    if (this.eventBus) {
      this.eventBus.clear();
    }

    ServiceLocator.reset();
    this.isDestroyed = true;
    ApplicationController.instance = null;
    Logger.info('APP_CONTROLLER', 'Shutdown complete.');
  }

  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  public getGameStateManager(): GameStateManager {
    return this.gameStateManager;
  }

  public getSystemRegistry(): SystemRegistry {
    return this.systemRegistry;
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public getRenderEngine(): RenderEngine {
    return this.renderEngine;
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getScreenManager(): any {
    return this.sceneManager;
  }

  public getAssetManager(): AssetManager {
    return this.assetManager;
  }

  public getAudioService(): AudioService {
    return this.audioService;
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }
}
