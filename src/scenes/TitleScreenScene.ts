/**
 * INTERSTELLAR CONTINUUM - Title Screen & Main Menu Scene
 * Complete game startup experience:
 * 2.5D deep space background, original title treatment, "PRESS TO START" mode,
 * Main Menu with Continue, New Organisation, Settings, Credits, and Replay,
 * keyboard and mouse navigation, and centralized startup-flow routing.
 */

import { BaseScene } from './BaseScene';
import { SceneId } from './SceneId';
import { ServiceLocator } from '../core/ServiceLocator';
import { RenderEngine, RenderPipeline, RenderLayerType } from '../rendering';
import { CameraSystem } from '../camera/CameraSystem';
import { CameraMode } from '../camera/CameraMode';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { EventBus } from '../core/EventBus';
import { AudioService } from '../audio/AudioService';
import { ConfigManager } from '../configuration/ConfigManager';
import { SceneManager } from './SceneManager';

import { TitleBackgroundRenderer } from './title/TitleBackgroundRenderer';
import { TitleLogoRenderer } from './title/TitleLogoRenderer';
import { TitleMenuRenderer, MenuItemDefinition } from './title/TitleMenuRenderer';
import { ConfirmationDialog } from './title/ConfirmationDialog';
import { CreditsModal } from './title/CreditsModal';
import { SettingsModal } from './title/SettingsModal';
import { StartupFlowController } from '../startup/StartupFlowController';
import { Logger } from '../core/logging/Logger';

export class TitleScreenScene extends BaseScene {
  public readonly id = SceneId.TITLE_SCREEN;

  private pipeline?: RenderPipeline;
  private cameraSystem?: CameraSystem;
  private inputManager?: InputManager;
  private eventBus?: EventBus;
  private audioService?: AudioService;
  private configManager?: ConfigManager;
  private sceneManager?: SceneManager;

  private startupFlow?: StartupFlowController;
  private backgroundRenderer?: TitleBackgroundRenderer;
  private logoRenderer?: TitleLogoRenderer;
  private menuRenderer?: TitleMenuRenderer;

  private confirmationDialog?: ConfirmationDialog;
  private creditsModal?: CreditsModal;
  private settingsModal?: SettingsModal;

  protected async onInitialize(): Promise<void> {
    Logger.info('TITLE_SCREEN', 'Initializing Title Screen & Main Menu Scene...');

    // 1. Resolve Core Services
    if (ServiceLocator.has('EventBus')) {
      this.eventBus = ServiceLocator.get<EventBus>('EventBus');
    }
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
    if (ServiceLocator.has('AudioService')) {
      this.audioService = ServiceLocator.get<AudioService>('AudioService');
    }
    if (ServiceLocator.has('ConfigManager')) {
      this.configManager = ServiceLocator.get<ConfigManager>('ConfigManager');
    }
    if (ServiceLocator.has('SceneManager')) {
      this.sceneManager = ServiceLocator.get<SceneManager>('SceneManager');
    }

    // 2. Resolve or establish StartupFlowController
    if (ServiceLocator.has('StartupFlowController')) {
      this.startupFlow = ServiceLocator.get<StartupFlowController>('StartupFlowController');
    } else {
      this.startupFlow = new StartupFlowController({
        sceneManager: this.sceneManager,
        eventBus: this.eventBus,
      });
      ServiceLocator.register('StartupFlowController', this.startupFlow);
    }

    // 3. Setup Layers
    const bgContainer = this.pipeline.getLayerContainer(RenderLayerType.BACKGROUND);
    const hudContainer = this.pipeline.getLayerContainer(RenderLayerType.HUD);
    const uiOverlayContainer = this.pipeline.getLayerContainer(RenderLayerType.UI_OVERLAY);

    // 4. Instantiate Visual Renderers
    this.backgroundRenderer = new TitleBackgroundRenderer();
    bgContainer.addChild(this.backgroundRenderer.container);

    this.logoRenderer = new TitleLogoRenderer();
    hudContainer.addChild(this.logoRenderer.container);

    this.menuRenderer = new TitleMenuRenderer({
      onHover: () => {
        this.audioService?.playUi('ui_hover');
      },
      onSelect: () => {
        this.audioService?.playUi('ui_confirm');
      },
      onStartPressed: () => {
        this.audioService?.playUi('ui_confirm');
      },
    });
    hudContainer.addChild(this.menuRenderer.container);

    // 5. Instantiate Modals & Dialogs on UI_OVERLAY
    this.confirmationDialog = new ConfirmationDialog();
    uiOverlayContainer.addChild(this.confirmationDialog.container);

    this.creditsModal = new CreditsModal();
    uiOverlayContainer.addChild(this.creditsModal.container);

    this.settingsModal = new SettingsModal(this.configManager, this.audioService);
    uiOverlayContainer.addChild(this.settingsModal.container);

    // 6. Build and populate Menu Items
    this.refreshMenuItems();

    // 7. Mouse Pointer Tracking for Parallax
    this.container.eventMode = 'static';
    this.container.on('pointermove', (e) => {
      const pos = e.global;
      // Normalize -1 to 1 around 1920x1080 center
      const nx = (pos.x - 960) / 960;
      const ny = (pos.y - 540) / 540;
      this.backgroundRenderer?.setParallaxTarget(nx, ny);
    });

    Logger.info('TITLE_SCREEN', 'Title Screen & Main Menu initialized successfully.');
  }

  protected override async onActivate(_payload?: any): Promise<void> {
    Logger.info('TITLE_SCREEN', 'Activating Title Screen.');

    // Ensure camera is fixed at origin with 1.0x scale
    if (this.cameraSystem) {
      this.cameraSystem.setMode(CameraMode.FREE);
      this.cameraSystem.setPosition(0, 0, true);
      this.cameraSystem.setZoom(1.0);
    }

    // Refresh save state verification on activate
    this.refreshMenuItems();

    // Trigger Title Screen ambient music hook
    this.audioService?.playMusic('menu_theme', true, 1200);
  }

  public refreshMenuItems(): void {
    if (!this.startupFlow || !this.menuRenderer) return;

    const canContinue = this.startupFlow.canContinue();
    const savedAgency = this.startupFlow.getSavedAgencyInfo();

    const continueSubtitle = canContinue && savedAgency
      ? `${savedAgency.agencyName} // ${savedAgency.rankTitle}`
      : 'No active organisation save found';

    const items: MenuItemDefinition[] = [
      {
        id: 'CONTINUE',
        label: 'Continue',
        subtitle: continueSubtitle,
        enabled: canContinue,
        disabledReason: 'NO ACTIVE SAVE FOUND',
        onActivate: async () => {
          await this.startupFlow?.continueGame();
        },
      },
      {
        id: 'NEW_ORGANISATION',
        label: 'New Organisation',
        subtitle: 'Found an independent aerospace exploration venture',
        enabled: true,
        onActivate: () => {
          this.handleNewOrganisationOption();
        },
      },
      {
        id: 'SETTINGS',
        label: 'Settings',
        subtitle: 'Audio channels, display & control mappings',
        enabled: true,
        onActivate: () => {
          this.settingsModal?.show();
        },
      },
      {
        id: 'CREDITS',
        label: 'Credits',
        subtitle: 'Project architecture, science consultants & dedication',
        enabled: true,
        onActivate: () => {
          this.creditsModal?.show();
        },
      },
      {
        id: 'REPLAY_INTRO',
        label: 'Replay Introduction',
        subtitle: 'Review agency founding prelude & Solar System mandate',
        enabled: true,
        onActivate: async () => {
          await this.startupFlow?.replayIntroduction();
        },
      },
      {
        id: 'EXIT_GAME',
        label: 'Exit Game',
        subtitle: 'Terminate aerospace simulation runtime',
        enabled: true,
        onActivate: () => {
          this.handleExitOption();
        },
      },
    ];

    this.menuRenderer.setMenuItems(items);
  }

  private handleNewOrganisationOption(): void {
    if (!this.startupFlow) return;

    if (this.startupFlow.canContinue()) {
      // Prior save detected: Prompt with Confirmation Dialog preventing silent overwrite
      const agency = this.startupFlow.getSavedAgencyInfo();
      this.confirmationDialog?.show(agency, {
        onConfirm: async () => {
          await this.startupFlow?.startNewOrganisation(true);
        },
        onCancel: () => {
          Logger.info('TITLE_SCREEN', 'New organisation start cancelled. Existing save preserved.');
        },
      });
    } else {
      // First-time or empty slot: initialize directly
      this.startupFlow.startNewOrganisation(false);
    }
  }

  private handleExitOption(): void {
    Logger.info('TITLE_SCREEN', 'Exit option triggered.');

    // Check for native window or desktop runtime closure
    if (typeof window !== 'undefined') {
      const anyWin = window as any;
      if (typeof anyWin.__ELECTRON_CLOSE__ === 'function') {
        anyWin.__ELECTRON_CLOSE__();
        return;
      }
      if (typeof anyWin.close === 'function') {
        try {
          anyWin.close();
        } catch {
          Logger.info('TITLE_SCREEN', 'Web runtime does not allow window.close().');
        }
      }
    }
  }

  protected onUpdate(deltaSeconds: number): void {
    // 1. Update Visual Background & Parallax
    if (this.backgroundRenderer) {
      this.backgroundRenderer.update(deltaSeconds);
    }

    // 2. Update Logo Breathing
    if (this.logoRenderer) {
      this.logoRenderer.update(deltaSeconds);
    }

    // 3. Update Menu Renderer
    if (this.menuRenderer) {
      this.menuRenderer.update(deltaSeconds);
    }

    // 4. Handle Keyboard Navigation & Input
    this.handleInput();

    // 5. Update Rendering Pipeline
    if (this.pipeline) {
      this.pipeline.update(deltaSeconds);
    }
  }

  private handleInput(): void {
    if (!this.inputManager) return;

    // A. If Confirmation Dialog is open:
    if (this.confirmationDialog?.isOpen()) {
      if (this.inputManager.isActionJustPressed(InputAction.MoveLeft)) {
        this.confirmationDialog.navigateLeft();
      } else if (this.inputManager.isActionJustPressed(InputAction.MoveRight)) {
        this.confirmationDialog.navigateRight();
      } else if (
        this.inputManager.isActionJustPressed(InputAction.Confirm) ||
        this.inputManager.isActionJustPressed(InputAction.Interact)
      ) {
        this.confirmationDialog.selectCurrent();
      } else if (this.inputManager.isActionJustPressed(InputAction.Cancel)) {
        this.confirmationDialog.cancel();
      }
      return;
    }

    // B. If Credits Modal is open:
    if (this.creditsModal?.isOpen()) {
      if (
        this.inputManager.isActionJustPressed(InputAction.Cancel) ||
        this.inputManager.isActionJustPressed(InputAction.Confirm)
      ) {
        this.creditsModal.hide();
      }
      return;
    }

    // C. If Settings Modal is open:
    if (this.settingsModal?.isOpen()) {
      if (this.inputManager.isActionJustPressed(InputAction.Cancel)) {
        this.settingsModal.hide();
      }
      return;
    }

    // D. In "PRESS TO START" Mode:
    if (this.menuRenderer?.isStartMode()) {
      if (
        this.inputManager.isActionJustPressed(InputAction.Confirm) ||
        this.inputManager.isActionJustPressed(InputAction.Interact) ||
        this.inputManager.isActionJustPressed(InputAction.Cancel) ||
        this.inputManager.isActionJustPressed(InputAction.MoveUp) ||
        this.inputManager.isActionJustPressed(InputAction.MoveDown)
      ) {
        this.menuRenderer.triggerStart();
      }
      return;
    }

    // E. In Main Menu Navigation:
    if (this.menuRenderer && !this.menuRenderer.isStartMode()) {
      if (this.inputManager.isActionJustPressed(InputAction.MoveUp)) {
        this.menuRenderer.selectPrevious();
      } else if (this.inputManager.isActionJustPressed(InputAction.MoveDown)) {
        this.menuRenderer.selectNext();
      } else if (
        this.inputManager.isActionJustPressed(InputAction.Confirm) ||
        this.inputManager.isActionJustPressed(InputAction.Interact)
      ) {
        this.menuRenderer.activateSelected();
      }
    }
  }

  // Getters for Verification & Unit Testing
  public getMenuRenderer(): TitleMenuRenderer | undefined {
    return this.menuRenderer;
  }

  public getBackgroundRenderer(): TitleBackgroundRenderer | undefined {
    return this.backgroundRenderer;
  }

  public getStartupFlow(): StartupFlowController | undefined {
    return this.startupFlow;
  }

  public getConfirmationDialog(): ConfirmationDialog | undefined {
    return this.confirmationDialog;
  }

  public getCreditsModal(): CreditsModal | undefined {
    return this.creditsModal;
  }

  public getSettingsModal(): SettingsModal | undefined {
    return this.settingsModal;
  }

  protected onCleanup(): void {
    if (this.backgroundRenderer) {
      this.backgroundRenderer.destroy();
      this.backgroundRenderer = undefined;
    }
    if (this.logoRenderer) {
      this.logoRenderer.destroy();
      this.logoRenderer = undefined;
    }
    if (this.menuRenderer) {
      this.menuRenderer.destroy();
      this.menuRenderer = undefined;
    }
    if (this.confirmationDialog) {
      this.confirmationDialog.destroy();
      this.confirmationDialog = undefined;
    }
    if (this.creditsModal) {
      this.creditsModal.destroy();
      this.creditsModal = undefined;
    }
    if (this.settingsModal) {
      this.settingsModal.destroy();
      this.settingsModal = undefined;
    }
    Logger.info('TITLE_SCREEN', 'Title Screen cleaned up.');
  }
}
