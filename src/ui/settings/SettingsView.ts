/**
 * INTERSTELLAR CONTINUUM - Unified Settings View Architecture
 * Authoritative settings user interface used by Pause Menu, Title Screen,
 * and the Central Plaza Settings & Administration Terminal.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';
import { UITabGroup } from '../components/UITabGroup';
import { UIButton } from '../components/UIButton';
import { UISlider } from '../components/UISlider';
import { UIToggle } from '../components/UIToggle';
import { UIOptionStepper } from '../components/UIOptionStepper';
import { UIKeybindRow } from '../components/UIKeybindRow';
import { UIDialog } from '../components/UIDialog';
import { UIScrollList } from '../components/UIScrollList';
import {
  SettingsManager,
  SettingsCategory,
  GraphicsQualityPreset,
  QualityTier,
  ColorblindType,
  TextSizeOption,
  PromptStyleOption,
} from '../../settings';
import { InputAction } from '../../input/InputAction';
import { ServiceLocator } from '../../core/ServiceLocator';
import { NotificationManager } from '../notifications/NotificationManager';

export interface SettingsViewOptions {
  width?: number;
  height?: number;
  initialCategory?: SettingsCategory;
  onClose?: () => void;
}

export class SettingsView extends UIComponent {
  private settingsManager: SettingsManager;
  private width: number;
  private height: number;
  private activeCategory: SettingsCategory;
  private onCloseCallback: () => void;

  private backdropGfx: Graphics;
  private panelGfx: Graphics;
  private headerContainer: Container;
  private tabGroup: UITabGroup;
  private scrollList: UIScrollList;
  private footerContainer: Container;

  private confirmResetDialog?: UIDialog;
  private rebindingAction: InputAction | null = null;
  private keydownListener?: (e: KeyboardEvent) => void;

  constructor(options?: SettingsViewOptions) {
    super('SettingsView');

    this.width = options?.width ?? 840;
    this.height = options?.height ?? 620;
    this.activeCategory = options?.initialCategory ?? 'GRAPHICS';
    this.onCloseCallback = options?.onClose ?? (() => {});

    // Resolve or instantiate SettingsManager
    if (ServiceLocator.has('SettingsManager')) {
      this.settingsManager = ServiceLocator.get<SettingsManager>('SettingsManager');
    } else {
      this.settingsManager = new SettingsManager();
      ServiceLocator.register('SettingsManager', this.settingsManager);
    }

    // 1. Semi-transparent click shield (centers modal at 1920x1080)
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(-1920, -1080, 3840, 2160);
    this.backdropGfx.fill({ color: 0x020611, alpha: 0.75 });
    this.backdropGfx.eventMode = 'static';
    this.container.addChild(this.backdropGfx);

    // 2. Main Dialog Frame
    this.panelGfx = new Graphics();
    this.container.addChild(this.panelGfx);

    // 3. Header Container
    this.headerContainer = new Container();
    this.headerContainer.position.set(24, 20);
    this.container.addChild(this.headerContainer);

    // 4. Tab Bar (Graphics, Audio, Controls, Accessibility, Interface, Gameplay)
    this.tabGroup = new UITabGroup({
      tabs: [
        { id: 'GRAPHICS', label: 'GRAPHICS' },
        { id: 'AUDIO', label: 'AUDIO' },
        { id: 'CONTROLS', label: 'CONTROLS' },
        { id: 'ACCESSIBILITY', label: 'ACCESSIBILITY' },
        { id: 'INTERFACE', label: 'INTERFACE' },
        { id: 'GAMEPLAY', label: 'GAMEPLAY' },
      ],
      activeTabId: this.activeCategory,
      width: this.width - 48,
      onTabChange: (tabId) => {
        this.selectCategory(tabId as SettingsCategory);
      },
    });
    this.tabGroup.container.position.set(24, 76);
    this.container.addChild(this.tabGroup.container);

    // 5. Scroll List for setting rows
    this.scrollList = new UIScrollList({
      width: this.width - 48,
      height: this.height - 200,
      itemHeight: 46,
    });
    this.scrollList.container.position.set(24, 126);
    this.container.addChild(this.scrollList.container);

    // 6. Footer Action Bar
    this.footerContainer = new Container();
    this.footerContainer.position.set(24, this.height - 56);
    this.container.addChild(this.footerContainer);

    this.renderFrame();
    this.renderHeader();
    this.renderFooter();
    this.renderCategoryContent();
    this.setupRebindListener();
  }

  public setInitialCategory(category: SettingsCategory): void {
    this.selectCategory(category);
  }

  public selectCategory(category: SettingsCategory): void {
    if (this.rebindingAction) {
      this.cancelRebinding();
    }
    this.activeCategory = category;
    this.tabGroup.selectTab(category);
    this.renderCategoryContent();
  }

  public getActiveCategory(): SettingsCategory {
    return this.activeCategory;
  }

  private renderFrame(): void {
    this.panelGfx.clear();
    // Modal background
    this.panelGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.LG);
    this.panelGfx.fill({ color: 0x07111e, alpha: 0.98 });
    this.panelGfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.5 });

    // Top tech accent bar
    this.panelGfx.roundRect(0, 0, this.width, 4, UI_RADIUS.SM);
    this.panelGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.9 });

    // Inner subtle separator between scroll area and footer
    this.panelGfx
      .moveTo(24, this.height - 68)
      .lineTo(this.width - 24, this.height - 68)
      .stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  private renderHeader(): void {
    this.headerContainer.removeChildren();

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.5,
    });
    const title = new Text({
      text: '// SYSTEM SETTINGS // CONFIGURATION MATRIX',
      style: titleStyle,
    });
    this.headerContainer.addChild(title);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.TEXT_MUTED,
    });
    const sub = new Text({
      text: 'DIRECTORATE HARDWARE & RUNTIME PROFILE SPECIFICATIONS',
      style: subStyle,
    });
    sub.position.set(0, 24);
    this.headerContainer.addChild(sub);
  }

  private renderFooter(): void {
    this.footerContainer.removeChildren();

    // 1. Reset current tab button
    const resetTabBtn = new UIButton({
      label: 'RESET CATEGORY',
      variant: 'SECONDARY',
      width: 160,
      height: 36,
      onClick: () => {
        this.settingsManager.resetCategory(this.activeCategory);
        this.renderCategoryContent();
        this.notify('CATEGORY RESTORED TO FACTORY PROFILE', 'INFO');
      },
    });
    this.footerContainer.addChild(resetTabBtn.container);

    // 2. Reset all settings button
    const resetAllBtn = new UIButton({
      label: 'RESTORE ALL DEFAULTS',
      variant: 'DANGER',
      width: 190,
      height: 36,
      onClick: () => {
        this.showConfirmResetAllDialog();
      },
    });
    resetAllBtn.container.position.set(172, 0);
    this.footerContainer.addChild(resetAllBtn.container);

    // 3. Close button
    const closeBtn = new UIButton({
      label: 'CLOSE [ESC]',
      variant: 'PRIMARY',
      width: 140,
      height: 36,
      onClick: () => {
        this.close();
      },
    });
    closeBtn.container.position.set(this.width - 48 - 140, 0);
    this.footerContainer.addChild(closeBtn.container);
  }

  public close(): void {
    if (this.rebindingAction) {
      this.cancelRebinding();
    }
    this.onCloseCallback();
  }

  private renderCategoryContent(): void {
    this.scrollList.clearItems();
    const rowWidth = this.width - 68;

    switch (this.activeCategory) {
      case 'GRAPHICS':
        this.renderGraphicsSettings(rowWidth);
        break;
      case 'AUDIO':
        this.renderAudioSettings(rowWidth);
        break;
      case 'CONTROLS':
        this.renderControlsSettings(rowWidth);
        break;
      case 'ACCESSIBILITY':
        this.renderAccessibilitySettings(rowWidth);
        break;
      case 'INTERFACE':
        this.renderInterfaceSettings(rowWidth);
        break;
      case 'GAMEPLAY':
        this.renderGameplaySettings(rowWidth);
        break;
    }
  }

  private renderGraphicsSettings(rowWidth: number): void {
    const g = this.settingsManager.getSettings().graphics;

    // Quality Preset Stepper
    const presetStepper = new UIOptionStepper<GraphicsQualityPreset>({
      label: 'GRAPHICS QUALITY PRESET',
      width: rowWidth,
      value: g.quality,
      options: [
        { label: 'LOW', value: 'LOW' },
        { label: 'MEDIUM', value: 'MEDIUM' },
        { label: 'HIGH', value: 'HIGH' },
        { label: 'ULTRA', value: 'ULTRA' },
        { label: 'CUSTOM', value: 'CUSTOM' },
      ],
      onChange: (val) => {
        this.settingsManager.applyGraphicsPreset(val);
        this.renderCategoryContent();
      },
    });
    this.scrollList.addItem(presetStepper.container);

    // Resolution Scale
    const resStepper = new UIOptionStepper<number>({
      label: 'RESOLUTION SCALING',
      width: rowWidth,
      value: g.resolutionScale,
      options: [
        { label: '0.75x (PERFORMANCE)', value: 0.75 },
        { label: '1.00x (NATIVE 1080P)', value: 1.0 },
        { label: '1.25x (SHARP)', value: 1.25 },
        { label: '1.50x (ULTRA DENSE)', value: 1.5 },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { resolutionScale: val });
      },
    });
    this.scrollList.addItem(resStepper.container);

    // Target FPS
    const fpsStepper = new UIOptionStepper<number>({
      label: 'TARGET FRAMERATE',
      width: rowWidth,
      value: g.targetFps,
      options: [
        { label: '30 FPS', value: 30 },
        { label: '60 FPS (STANDARD)', value: 60 },
        { label: '120 FPS (HIGH REFRESH)', value: 120 },
        { label: 'UNLIMITED', value: 0 },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { targetFps: val });
      },
    });
    this.scrollList.addItem(fpsStepper.container);

    // Fullscreen Toggle
    const fullToggle = new UIToggle({
      label: 'FULLSCREEN DISPLAY MODE',
      width: rowWidth,
      value: g.fullscreen,
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { fullscreen: val });
        if (typeof document !== 'undefined') {
          if (val && !document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else if (!val && document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
        }
      },
    });
    this.scrollList.addItem(fullToggle.container);

    // V-Sync Toggle
    const vsyncToggle = new UIToggle({
      label: 'VERTICAL SYNCHRONIZATION (V-SYNC)',
      width: rowWidth,
      value: g.vSync,
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { vSync: val });
      },
    });
    this.scrollList.addItem(vsyncToggle.container);

    // Particle Quality
    const particleStepper = new UIOptionStepper<QualityTier>({
      label: 'PARTICLE SIMULATION DENSITY',
      width: rowWidth,
      value: g.particleQuality,
      options: [
        { label: 'LOW (MINIMAL)', value: 'LOW' },
        { label: 'MEDIUM (BALANCED)', value: 'MEDIUM' },
        { label: 'HIGH (FULL DENSITY)', value: 'HIGH' },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { particleQuality: val, quality: 'CUSTOM' });
      },
    });
    this.scrollList.addItem(particleStepper.container);

    // Atmospheric Shaders
    const atmoToggle = new UIToggle({
      label: 'ATMOSPHERIC & POST-PROCESS SHADERS',
      width: rowWidth,
      value: g.atmosphericShaders,
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { atmosphericShaders: val, quality: 'CUSTOM' });
      },
    });
    this.scrollList.addItem(atmoToggle.container);

    // Bloom
    const bloomToggle = new UIToggle({
      label: 'OPTICAL BLOOM EMISSIVE GLOW',
      width: rowWidth,
      value: g.bloomEnabled,
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { bloomEnabled: val, quality: 'CUSTOM' });
      },
    });
    this.scrollList.addItem(bloomToggle.container);

    // Parallax
    const parallaxToggle = new UIToggle({
      label: 'MULTI-PLANE PARALLAX DEPTH',
      width: rowWidth,
      value: g.parallaxEnabled,
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { parallaxEnabled: val, quality: 'CUSTOM' });
      },
    });
    this.scrollList.addItem(parallaxToggle.container);

    // Camera Effects
    const camEffectsToggle = new UIToggle({
      label: 'DYNAMIC CAMERA LOOKAHEAD & ZOOM FX',
      width: rowWidth,
      value: g.cameraEffects,
      onChange: (val) => {
        this.settingsManager.setCategory('graphics', { cameraEffects: val, quality: 'CUSTOM' });
      },
    });
    this.scrollList.addItem(camEffectsToggle.container);
  }

  private renderAudioSettings(rowWidth: number): void {
    const a = this.settingsManager.getSettings().audio;

    // Mute Switch
    const muteToggle = new UIToggle({
      label: 'MASTER AUDIO MUTE',
      width: rowWidth,
      value: a.muted,
      onText: 'MUTED',
      offText: 'ACTIVE',
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { muted: val });
      },
    });
    this.scrollList.addItem(muteToggle.container);

    // Master Volume Slider
    const masterSlider = new UISlider({
      label: 'MASTER VOLUME',
      width: rowWidth,
      value: a.masterVolume,
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { masterVolume: val });
      },
    });
    this.scrollList.addItem(masterSlider.container);

    // Music Volume Slider
    const musicSlider = new UISlider({
      label: 'MUSIC & ORCHESTRAL SCORE',
      width: rowWidth,
      value: a.musicVolume,
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { musicVolume: val });
      },
    });
    this.scrollList.addItem(musicSlider.container);

    // Ambience Volume Slider
    const ambienceSlider = new UISlider({
      label: 'ENVIRONMENTAL AMBIENCE & WIND',
      width: rowWidth,
      value: a.ambienceVolume,
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { ambienceVolume: val });
      },
    });
    this.scrollList.addItem(ambienceSlider.container);

    // SFX Volume Slider
    const sfxSlider = new UISlider({
      label: 'SOUND EFFECTS & ENGINES',
      width: rowWidth,
      value: a.sfxVolume,
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { sfxVolume: val });
      },
    });
    this.scrollList.addItem(sfxSlider.container);

    // UI Volume Slider
    const uiSlider = new UISlider({
      label: 'INTERFACE CLICKS & TELEMETRY BEEPS',
      width: rowWidth,
      value: a.uiVolume,
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { uiVolume: val });
      },
    });
    this.scrollList.addItem(uiSlider.container);

    // Dialogue Volume Slider
    const dialogueSlider = new UISlider({
      label: 'MISSION COMMUNICATIONS & CAPCOM VO',
      width: rowWidth,
      value: a.dialogueVolume,
      onChange: (val) => {
        this.settingsManager.setCategory('audio', { dialogueVolume: val });
      },
    });
    this.scrollList.addItem(dialogueSlider.container);
  }

  private renderControlsSettings(rowWidth: number): void {
    const c = this.settingsManager.getSettings().controls;

    const actionLabels: Array<{ action: InputAction; label: string }> = [
      { action: InputAction.MoveUp, label: 'MOVE NORTH / UP' },
      { action: InputAction.MoveDown, label: 'MOVE SOUTH / DOWN' },
      { action: InputAction.MoveLeft, label: 'MOVE WEST / LEFT' },
      { action: InputAction.MoveRight, label: 'MOVE EAST / RIGHT' },
      { action: InputAction.Sprint, label: 'SPRINT / RUN' },
      { action: InputAction.Interact, label: 'PHYSICAL INTERACTION' },
      { action: InputAction.Confirm, label: 'CONFIRM SELECTION' },
      { action: InputAction.Cancel, label: 'CANCEL / RETURN' },
      { action: InputAction.Pause, label: 'PAUSE OPERATIONS' },
      { action: InputAction.OpenMap, label: 'CAMPUS TACTICAL MAP' },
      { action: InputAction.OpenInventory, label: 'ORGANISATION MANIFEST' },
      { action: InputAction.CameraZoom, label: 'CAMERA ZOOM IN / OUT' },
      { action: InputAction.ToggleDebug, label: 'TOGGLE DEBUG TELEMETRY' },
    ];

    for (const item of actionLabels) {
      const keys = c.bindings[item.action] || [];
      const row = new UIKeybindRow({
        action: item.action,
        actionLabel: item.label,
        width: rowWidth,
        keys,
        onStartRebind: (act) => {
          this.startRebinding(act);
        },
      });
      if (this.rebindingAction === item.action) {
        row.setListening(true);
      }
      this.scrollList.addItem(row.container);
    }
  }

  private renderAccessibilitySettings(rowWidth: number): void {
    const acc = this.settingsManager.getSettings().accessibility;

    // UI Scale
    const scaleStepper = new UIOptionStepper<number>({
      label: 'USER INTERFACE SCALE',
      width: rowWidth,
      value: acc.uiScale,
      options: [
        { label: '0.8x (COMPACT)', value: 0.8 },
        { label: '1.0x (DEFAULT)', value: 1.0 },
        { label: '1.2x (ENLARGED)', value: 1.2 },
        { label: '1.4x (HIGH VISIBILITY)', value: 1.4 },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { uiScale: val });
      },
    });
    this.scrollList.addItem(scaleStepper.container);

    // Text Size
    const textStepper = new UIOptionStepper<TextSizeOption>({
      label: 'TYPOGRAPHY DISPLAY SIZE',
      width: rowWidth,
      value: acc.textSize,
      options: [
        { label: 'STANDARD (12PX)', value: 'NORMAL' },
        { label: 'LARGE (15PX HIGH-LEGIBILITY)', value: 'LARGE' },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { textSize: val });
      },
    });
    this.scrollList.addItem(textStepper.container);

    // Reduced Motion
    const motionToggle = new UIToggle({
      label: 'REDUCED MOTION (DISABLE TRANSITIONS)',
      width: rowWidth,
      value: acc.reducedMotion,
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { reducedMotion: val });
      },
    });
    this.scrollList.addItem(motionToggle.container);

    // Camera Shake Multiplier
    const shakeSlider = new UISlider({
      label: 'CAMERA SHAKE INTENSITY',
      width: rowWidth,
      value: acc.reducedCameraShake,
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { reducedCameraShake: val });
      },
    });
    this.scrollList.addItem(shakeSlider.container);

    // High Contrast Mode
    const contrastToggle = new UIToggle({
      label: 'HIGH CONTRAST INTERFACE BORDERS',
      width: rowWidth,
      value: acc.highContrastUI,
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { highContrastUI: val });
      },
    });
    this.scrollList.addItem(contrastToggle.container);

    // Colorblind Mode
    const colorblindStepper = new UIOptionStepper<ColorblindType>({
      label: 'COLOR VISION ASSIST FILTER',
      width: rowWidth,
      value: acc.colorblindMode,
      options: [
        { label: 'NONE (STANDARD RGB)', value: 'none' },
        { label: 'PROTANOPIA (RED-WEAK)', value: 'protanopia' },
        { label: 'DEUTERANOPIA (GREEN-WEAK)', value: 'deuteranopia' },
        { label: 'TRITANOPIA (BLUE-WEAK)', value: 'tritanopia' },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { colorblindMode: val });
      },
    });
    this.scrollList.addItem(colorblindStepper.container);

    // Subtitles
    const subtitleToggle = new UIToggle({
      label: 'COMMUNICATIONS SUBTITLES',
      width: rowWidth,
      value: acc.subtitlesEnabled,
      onChange: (val) => {
        this.settingsManager.setCategory('accessibility', { subtitlesEnabled: val });
      },
    });
    this.scrollList.addItem(subtitleToggle.container);
  }

  private renderInterfaceSettings(rowWidth: number): void {
    const ui = this.settingsManager.getSettings().interface;

    // HUD Visibility
    const hudToggle = new UIToggle({
      label: 'TACTICAL HEADS-UP DISPLAY (HUD)',
      width: rowWidth,
      value: ui.hudVisible,
      onChange: (val) => {
        this.settingsManager.setCategory('interface', { hudVisible: val });
      },
    });
    this.scrollList.addItem(hudToggle.container);

    // Minimap Visibility
    const minimapToggle = new UIToggle({
      label: 'CAMPUS RADAR MINIMAP OVERLAY',
      width: rowWidth,
      value: ui.minimapVisible,
      onChange: (val) => {
        this.settingsManager.setCategory('interface', { minimapVisible: val });
      },
    });
    this.scrollList.addItem(minimapToggle.container);

    // Tooltip Delay
    const delayStepper = new UIOptionStepper<number>({
      label: 'HOVER TOOLTIP DELAY',
      width: rowWidth,
      value: ui.tooltipDelayMs,
      options: [
        { label: 'INSTANT (50MS)', value: 50 },
        { label: 'DEFAULT (250MS)', value: 250 },
        { label: 'DELIBERATE (600MS)', value: 600 },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('interface', { tooltipDelayMs: val });
      },
    });
    this.scrollList.addItem(delayStepper.container);

    // Notification Duration
    const notifStepper = new UIOptionStepper<number>({
      label: 'TOAST NOTIFICATION PERSISTENCE',
      width: rowWidth,
      value: ui.notificationDuration,
      options: [
        { label: '3.0 SECONDS (BRIEF)', value: 3.0 },
        { label: '4.5 SECONDS (STANDARD)', value: 4.5 },
        { label: '7.0 SECONDS (EXTENDED)', value: 7.0 },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('interface', { notificationDuration: val });
      },
    });
    this.scrollList.addItem(notifStepper.container);

    // Reduce Interface Animations
    const animToggle = new UIToggle({
      label: 'REDUCE INTERFACE TRANSITION ANIMATIONS',
      width: rowWidth,
      value: ui.reduceInterfaceAnimations,
      onChange: (val) => {
        this.settingsManager.setCategory('interface', { reduceInterfaceAnimations: val });
      },
    });
    this.scrollList.addItem(animToggle.container);
  }

  private renderGameplaySettings(rowWidth: number): void {
    const gp = this.settingsManager.getSettings().gameplay;

    // Auto-Pause
    const autoPauseToggle = new UIToggle({
      label: 'AUTO-PAUSE OPERATIONS ON FOCUS LOSS',
      width: rowWidth,
      value: gp.autoPauseOnFocusLoss,
      onChange: (val) => {
        this.settingsManager.setCategory('gameplay', { autoPauseOnFocusLoss: val });
      },
    });
    this.scrollList.addItem(autoPauseToggle.container);

    // Prompt Style
    const promptStepper = new UIOptionStepper<PromptStyleOption>({
      label: 'INTERACTION PROMPT DISPLAY FORMAT',
      width: rowWidth,
      value: gp.interactionPromptStyle,
      options: [
        { label: 'DETAILED (BADGE + ACTION + TARGET)', value: 'DETAILED' },
        { label: 'COMPACT (BADGE + SHORT ACTION)', value: 'COMPACT' },
        { label: 'BADGE ONLY (KEY ICON)', value: 'BADGE_ONLY' },
      ],
      onChange: (val) => {
        this.settingsManager.setCategory('gameplay', { interactionPromptStyle: val });
      },
    });
    this.scrollList.addItem(promptStepper.container);

    // Tutorial Reminders
    const tutorialToggle = new UIToggle({
      label: 'HEADQUARTERS TUTORIAL REMINDERS',
      width: rowWidth,
      value: gp.tutorialReminders,
      onChange: (val) => {
        this.settingsManager.setCategory('gameplay', { tutorialReminders: val });
      },
    });
    this.scrollList.addItem(tutorialToggle.container);

    // Camera Sensitivity
    const camSensSlider = new UISlider({
      label: 'CAMERA TRACKING SENSITIVITY',
      width: rowWidth,
      min: 0.5,
      max: 2.0,
      step: 0.1,
      value: gp.cameraFollowSensitivity,
      formatFn: (v) => `${v.toFixed(1)}x`,
      onChange: (val) => {
        this.settingsManager.setCategory('gameplay', { cameraFollowSensitivity: val });
      },
    });
    this.scrollList.addItem(camSensSlider.container);

    // Camera Smoothing
    const camSmoothSlider = new UISlider({
      label: 'CAMERA INTERPOLATION SMOOTHING',
      width: rowWidth,
      min: 0.02,
      max: 0.3,
      step: 0.02,
      value: gp.cameraSmoothing,
      formatFn: (v) => `${Math.round(v * 100)}%`,
      onChange: (val) => {
        this.settingsManager.setCategory('gameplay', { cameraSmoothing: val });
      },
    });
    this.scrollList.addItem(camSmoothSlider.container);
  }

  public startRebinding(action: InputAction): void {
    if (this.rebindingAction === action) {
      this.cancelRebinding();
      return;
    }
    this.rebindingAction = action;
    this.renderCategoryContent();
    this.notify(`PRESS NEW PHYSICAL KEY FOR: ${action}`, 'WARNING');
  }

  public cancelRebinding(): void {
    this.rebindingAction = null;
    this.renderCategoryContent();
  }

  public handleRebindKey(code: string): boolean {
    if (!this.rebindingAction) return false;

    if (code === 'Escape') {
      this.cancelRebinding();
      this.notify('KEY REBINDING CANCELLED', 'INFO');
      return true;
    }

    const action = this.rebindingAction;
    const conflict = this.settingsManager.isKeyBound(code, action);

    if (conflict) {
      this.notify(`KEY ${code} CONFLICTS WITH: ${conflict}`, 'ERROR');
      return false;
    }

    const result = this.settingsManager.rebindKey(action, [code]);
    if (result.success) {
      this.notify(`BOUND ${action} TO ${code}`, 'SUCCESS');
      this.cancelRebinding();
      return true;
    } else {
      this.notify(`REBIND FAILED: CONFLICT WITH ${result.conflictAction}`, 'ERROR');
      return false;
    }
  }

  private setupRebindListener(): void {
    if (typeof window === 'undefined') return;

    this.keydownListener = (e: KeyboardEvent) => {
      if (this.rebindingAction) {
        e.preventDefault();
        e.stopPropagation();
        this.handleRebindKey(e.code);
      }
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  private showConfirmResetAllDialog(): void {
    if (this.confirmResetDialog) {
      this.confirmResetDialog.destroy();
    }

    this.confirmResetDialog = new UIDialog({
      title: 'RESTORE ALL SETTINGS TO FACTORY DEFAULTS?',
      message:
        'This will reset all Graphics, Audio, Controls, Accessibility, Interface, and Gameplay configurations. Your organisation save files and mission progression will NOT be affected.',
      isDanger: true,
      confirmLabel: 'CONFIRM RESTORE',
      cancelLabel: 'ABORT',
      onConfirm: () => {
        this.settingsManager.resetAll();
        this.renderCategoryContent();
        this.notify('ALL SETTINGS RESTORED TO FACTORY SPECIFICATIONS', 'SUCCESS');
        this.confirmResetDialog?.hide();
      },
      onCancel: () => {
        this.confirmResetDialog?.hide();
      },
    });

    this.confirmResetDialog.container.position.set(
      (this.width - 500) / 2,
      (this.height - 240) / 2
    );
    this.container.addChild(this.confirmResetDialog.container);
    this.confirmResetDialog.show();
  }

  private notify(message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'): void {
    if (ServiceLocator.has('NotificationManager')) {
      const nm = ServiceLocator.get<NotificationManager>('NotificationManager');
      nm.notify({
        title: 'SETTINGS CONTROLLER',
        message,
        level: type,
        category: 'SYSTEM',
        duration: 3.0,
      });
    }
  }

  public override destroy(): void {
    if (typeof window !== 'undefined' && this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
    }
    this.backdropGfx.removeAllListeners();
    this.tabGroup.destroy();
    this.scrollList.destroy();
    if (this.confirmResetDialog) {
      this.confirmResetDialog.destroy();
    }
    super.destroy();
  }
}
