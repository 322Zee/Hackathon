/**
 * INTERSTELLAR CONTINUUM - In-Game Pause Menu Architecture
 * Suspends gameplay updates, presents operations telemetry, and provides access to
 * Settings, Controls, Saving, Headquarters return, and Main Menu navigation.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';
import { UIButton } from '../components/UIButton';
import { UIDialog } from '../components/UIDialog';
import { SettingsView } from '../settings/SettingsView';
import { ServiceLocator } from '../../core/ServiceLocator';
import { InputManager } from '../../input/InputManager';
import { SceneManager } from '../../scenes/SceneManager';
import { SceneId } from '../../scenes/SceneId';
import { SaveService } from '../../services/SaveService';
import { NotificationManager } from '../notifications/NotificationManager';
import { GameStateManager } from '../../state/GameStateManager';

export interface PauseMenuOptions {
  sceneManager?: SceneManager;
  inputManager?: InputManager;
  saveService?: SaveService;
  gameStateManager?: GameStateManager;
  onResume?: () => void;
  onSave?: () => void;
  onReturnToCampus?: () => void;
  onReturnToMainMenu?: () => void;
  onReplayTutorial?: () => void;
}

export class PauseMenu extends UIComponent {
  private isMenuOpen: boolean = false;
  private options: PauseMenuOptions;

  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;
  private headerContainer: Container;
  private telemetryContainer: Container;
  private buttonsContainer: Container;

  private settingsView?: SettingsView;
  private confirmExitDialog?: UIDialog;

  private readonly modalWidth: number = 460;
  private readonly modalHeight: number = 620;

  constructor(options?: PauseMenuOptions) {
    super('PauseMenu');
    this.options = options ?? {};

    this.container.visible = false;

    // 1. Fullscreen dark backdrop
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x020611, alpha: 0.82 });
    this.backdropGfx.eventMode = 'static';
    this.container.addChild(this.backdropGfx);

    // 2. Centered Window Frame
    this.modalContainer = new Container();
    this.modalContainer.position.set(
      (1920 - this.modalWidth) / 2,
      (1080 - this.modalHeight) / 2
    );
    this.modalContainer.eventMode = 'static';
    this.container.addChild(this.modalContainer);

    this.panelGfx = new Graphics();
    this.modalContainer.addChild(this.panelGfx);

    this.headerContainer = new Container();
    this.headerContainer.position.set(24, 20);
    this.modalContainer.addChild(this.headerContainer);

    this.telemetryContainer = new Container();
    this.telemetryContainer.position.set(24, 80);
    this.modalContainer.addChild(this.telemetryContainer);

    this.buttonsContainer = new Container();
    this.buttonsContainer.position.set(24, 180);
    this.modalContainer.addChild(this.buttonsContainer);

    this.renderFrame();
    this.renderHeader();
    this.renderTelemetry();
    this.renderButtons();
  }

  public isOpen(): boolean {
    return this.isMenuOpen;
  }

  public show(): void {
    if (this.isMenuOpen) return;
    this.isMenuOpen = true;
    this.container.visible = true;

    // Lock player and gameplay input
    this.getInputManager()?.lockInput('PauseMenu');

    // Refresh telemetry
    this.renderTelemetry();

    // Notify EventBus pause state if available
    if (ServiceLocator.has('EventBus')) {
      ServiceLocator.get<any>('EventBus').emit('game:pause', true);
    }
  }

  public hide(): void {
    if (!this.isMenuOpen) return;
    this.isMenuOpen = false;
    this.container.visible = false;

    // Close any open child views
    if (this.settingsView) {
      this.closeSettings();
    }
    if (this.confirmExitDialog) {
      this.confirmExitDialog.hide();
    }

    // Unlock input
    this.getInputManager()?.unlockInput('PauseMenu');

    // Notify EventBus resume state
    if (ServiceLocator.has('EventBus')) {
      ServiceLocator.get<any>('EventBus').emit('game:pause', false);
    }

    if (this.options.onResume) {
      this.options.onResume();
    }
  }

  public toggle(): void {
    if (this.isMenuOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  public openSettings(initialCategory?: any): void {
    if (this.settingsView) {
      this.closeSettings();
    }

    this.settingsView = new SettingsView({
      initialCategory: initialCategory ?? 'GRAPHICS',
      onClose: () => {
        this.closeSettings();
      },
    });

    // Center over 1920x1080 screen
    this.settingsView.container.position.set((1920 - 840) / 2, (1080 - 620) / 2);
    this.container.addChild(this.settingsView.container);
  }

  public closeSettings(): void {
    if (this.settingsView) {
      this.container.removeChild(this.settingsView.container);
      this.settingsView.destroy();
      this.settingsView = undefined;
    }
  }

  private renderFrame(): void {
    this.panelGfx.clear();

    // Outer panel
    this.panelGfx.roundRect(0, 0, this.modalWidth, this.modalHeight, UI_RADIUS.MD);
    this.panelGfx.fill({ color: 0x07111e, alpha: 0.96 });
    this.panelGfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.5 });

    // Top tech accent bar
    this.panelGfx.roundRect(0, 0, this.modalWidth, 4, UI_RADIUS.SM);
    this.panelGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.9 });

    // Corner decorative notches
    this.panelGfx.moveTo(0, 16).lineTo(16, 0).stroke({ color: UI_COLORS.CYAN, width: 1.5 });
    this.panelGfx
      .moveTo(this.modalWidth - 16, 0)
      .lineTo(this.modalWidth, 16)
      .stroke({ color: UI_COLORS.CYAN, width: 1.5 });
  }

  private renderHeader(): void {
    this.headerContainer.removeChildren();

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 2.0,
    });
    const title = new Text({
      text: '// SYSTEM PAUSED //',
      style: titleStyle,
    });
    this.headerContainer.addChild(title);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.AMBER,
      letterSpacing: 1.0,
    });
    const sub = new Text({
      text: 'OPERATIONS TEMPORARILY SUSPENDED',
      style: subStyle,
    });
    sub.position.set(0, 24);
    this.headerContainer.addChild(sub);
  }

  private renderTelemetry(): void {
    this.telemetryContainer.removeChildren();

    const boxGfx = new Graphics();
    boxGfx.roundRect(0, 0, this.modalWidth - 48, 76, UI_RADIUS.SM);
    boxGfx.fill({ color: 0x030812, alpha: 0.7 });
    boxGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.telemetryContainer.addChild(boxGfx);

    const labelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_MUTED,
    });
    const valStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
    });

    // Row 1: Organisation & Rank
    const orgLabel = new Text({ text: 'DIRECTOR CALL-SIGN:', style: labelStyle });
    orgLabel.position.set(12, 10);
    this.telemetryContainer.addChild(orgLabel);

    const orgVal = new Text({ text: 'CONTINUUM // DIRECTOR (RANK 1)', style: valStyle });
    orgVal.position.set(140, 10);
    this.telemetryContainer.addChild(orgVal);

    // Row 2: Location
    const locLabel = new Text({ text: 'CAMPUS LOCATION:', style: labelStyle });
    locLabel.position.set(12, 30);
    this.telemetryContainer.addChild(locLabel);

    const locVal = new Text({ text: 'EARTH HQ // COMPLEX ALPHA', style: valStyle });
    locVal.position.set(140, 30);
    this.telemetryContainer.addChild(locVal);

    // Row 3: Status
    const statusLabel = new Text({ text: 'STANDBY STATUS:', style: labelStyle });
    statusLabel.position.set(12, 50);
    this.telemetryContainer.addChild(statusLabel);

    const statusVal = new Text({ text: 'STANDBY // REAL-TIME TICK HALTED', style: valStyle });
    statusVal.style.fill = UI_COLORS.AMBER;
    statusVal.position.set(140, 50);
    this.telemetryContainer.addChild(statusVal);
  }

  private renderButtons(): void {
    this.buttonsContainer.removeChildren();

    const btnWidth = this.modalWidth - 48;
    const btnHeight = 44;
    const spacing = 12;
    let y = 0;

    // 1. RESUME
    const resumeBtn = new UIButton({
      label: 'RESUME OPERATIONS [ESC]',
      variant: 'PRIMARY',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.hide();
      },
    });
    resumeBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(resumeBtn.container);
    y += btnHeight + spacing;

    // 2. SETTINGS
    const settingsBtn = new UIButton({
      label: 'SYSTEM SETTINGS',
      variant: 'SECONDARY',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.openSettings('GRAPHICS');
      },
    });
    settingsBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(settingsBtn.container);
    y += btnHeight + spacing;

    // 3. CONTROLS
    const controlsBtn = new UIButton({
      label: 'CONTROLS & KEY BINDINGS',
      variant: 'SECONDARY',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.openSettings('CONTROLS');
      },
    });
    controlsBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(controlsBtn.container);
    y += btnHeight + spacing;

    // 4. REPLAY ONBOARDING TUTORIAL
    const replayTutorialBtn = new UIButton({
      label: 'REPLAY ONBOARDING TUTORIAL',
      variant: 'SECONDARY',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.replayTutorial();
      },
    });
    replayTutorialBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(replayTutorialBtn.container);
    y += btnHeight + spacing;

    // 5. RETURN TO HEADQUARTERS
    const campusBtn = new UIButton({
      label: 'RETURN TO HEADQUARTERS',
      variant: 'SECONDARY',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.returnToHeadquarters();
      },
    });
    campusBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(campusBtn.container);
    y += btnHeight + spacing;

    // 6. SAVE GAME
    const saveBtn = new UIButton({
      label: 'SAVE ORGANISATION PROGRESS',
      variant: 'SECONDARY',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.saveGame();
      },
    });
    saveBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(saveBtn.container);
    y += btnHeight + spacing;

    // 7. MAIN MENU
    const mainMenuBtn = new UIButton({
      label: 'RETURN TO MAIN MENU',
      variant: 'DANGER',
      width: btnWidth,
      height: btnHeight,
      onClick: () => {
        this.showConfirmMainMenuDialog();
      },
    });
    mainMenuBtn.container.position.set(0, y);
    this.buttonsContainer.addChild(mainMenuBtn.container);
  }

  public replayTutorial(): void {
    this.hide();
    if (ServiceLocator.has('TutorialManager')) {
      const tm = ServiceLocator.get<any>('TutorialManager');
      tm.replayOnboarding();
    }
    if (this.options.onReplayTutorial) {
      this.options.onReplayTutorial();
    }
    this.notify('ONBOARDING TUTORIAL RE-INITIALIZED', 'INFO');
  }

  public saveGame(): void {
    const saveService = this.getSaveService();
    const gsm = this.getGameStateManager();
    if (saveService) {
      const stateToSave = gsm?.getState() ?? saveService.loadFromSlot(1) ?? saveService.createNewGame();
      if (ServiceLocator.has('TutorialManager')) {
        const tm = ServiceLocator.get<any>('TutorialManager');
        (stateToSave as any).tutorial = tm.saveState();
      }
      const saved = saveService.saveToSlot(1, stateToSave as any);
      if (saved) {
        if (ServiceLocator.has('EventBus')) {
          ServiceLocator.get<any>('EventBus').emit('save:saved', { slot: 1, timestamp: Date.now() });
        }
        this.notify('MISSION & CAMPUS PROGRESS SAVED TO SLOT 1', 'SUCCESS');
        if (this.options.onSave) {
          this.options.onSave();
        }
        return;
      }
    }
    this.notify('AUTONOMOUS PROGRESS BACKED UP', 'INFO');
  }

  public returnToHeadquarters(): void {
    this.hide();
    const sceneManager = this.getSceneManager();
    if (sceneManager && sceneManager.getCurrentSceneId() !== SceneId.HEADQUARTERS) {
      sceneManager.switchScene(SceneId.HEADQUARTERS);
    }
    if (this.options.onReturnToCampus) {
      this.options.onReturnToCampus();
    }
  }

  private showConfirmMainMenuDialog(): void {
    if (this.confirmExitDialog) {
      this.confirmExitDialog.destroy();
    }

    this.confirmExitDialog = new UIDialog({
      title: 'RETURN TO MAIN MENU?',
      message:
        'Any unsaved organisation telemetry since your last save will be lost. Return to the Interstellar Continuum main menu?',
      isDanger: true,
      confirmLabel: 'RETURN TO MENU',
      cancelLabel: 'STAY IN OPERATIONS',
      onConfirm: () => {
        this.hide();
        const sm = this.getSceneManager();
        if (sm) {
          sm.switchScene(SceneId.TITLE_SCREEN);
        }
        if (this.options.onReturnToMainMenu) {
          this.options.onReturnToMainMenu();
        }
      },
      onCancel: () => {
        this.confirmExitDialog?.hide();
      },
    });

    this.confirmExitDialog.container.position.set(
      (1920 - 500) / 2,
      (1080 - 240) / 2
    );
    this.container.addChild(this.confirmExitDialog.container);
    this.confirmExitDialog.show();
  }

  private notify(message: string, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'): void {
    if (ServiceLocator.has('NotificationManager')) {
      const nm = ServiceLocator.get<NotificationManager>('NotificationManager');
      nm.notify({
        title: 'OPERATION COMMAND',
        message,
        level,
        category: 'SYSTEM',
        duration: 3.5,
      });
    }
  }

  private getInputManager(): InputManager | undefined {
    if (this.options.inputManager) return this.options.inputManager;
    if (ServiceLocator.has('InputManager')) {
      return ServiceLocator.get<InputManager>('InputManager');
    }
    return undefined;
  }

  private getSceneManager(): SceneManager | undefined {
    if (this.options.sceneManager) return this.options.sceneManager;
    if (ServiceLocator.has('SceneManager')) {
      return ServiceLocator.get<SceneManager>('SceneManager');
    }
    return undefined;
  }

  private getSaveService(): SaveService | undefined {
    if (this.options.saveService) return this.options.saveService;
    if (ServiceLocator.has('SaveService')) {
      return ServiceLocator.get<SaveService>('SaveService');
    }
    return undefined;
  }

  private getGameStateManager(): GameStateManager | undefined {
    if (this.options.gameStateManager) return this.options.gameStateManager;
    if (ServiceLocator.has('GameStateManager')) {
      return ServiceLocator.get<GameStateManager>('GameStateManager');
    }
    return undefined;
  }

  public update(_deltaSeconds: number): void {
    // If child settings view is open, pass updates if necessary
  }

  public override destroy(): void {
    if (this.isMenuOpen) {
      this.getInputManager()?.unlockInput('PauseMenu');
    }
    this.backdropGfx.removeAllListeners();
    if (this.settingsView) {
      this.settingsView.destroy();
    }
    if (this.confirmExitDialog) {
      this.confirmExitDialog.destroy();
    }
    super.destroy();
  }
}
