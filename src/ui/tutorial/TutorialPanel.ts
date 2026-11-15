/**
 * INTERSTELLAR CONTINUUM - Compact Contextual Tutorial HUD Panel
 * Non-intrusive aerospace overlay displaying current step directives,
 * keybinding badges, progress indicators, and minimize/skip actions.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';
import { UIButton } from '../components/UIButton';
import { TutorialStep } from '../../tutorial/TutorialTypes';
import { TutorialManager } from '../../tutorial/TutorialManager';
import { ServiceLocator } from '../../core/ServiceLocator';
import { SettingsManager } from '../../settings/SettingsManager';

export interface TutorialPanelOptions {
  tutorialManager?: TutorialManager;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onAdvance?: () => void;
  onSkip?: () => void;
  onToggleMinimize?: (isMinimized: boolean) => void;
}

export class TutorialPanel extends UIComponent {
  private tutorialManager?: TutorialManager;
  private settingsManager?: SettingsManager;

  private panelWidth: number;
  private panelHeight: number;
  private isMinimized: boolean = false;

  private backgroundGfx: Graphics;
  private headerContainer: Container;
  private bodyContainer: Container;
  private actionsContainer: Container;
  private minimizedPillContainer: Container;

  private stepIndexText: Text;
  private titleText: Text;
  private subtitleText: Text;
  private descriptionText: Text;
  private minimizedText: Text;

  private continueBtn: UIButton;
  private minimizeBtn: UIButton;
  private skipBtn: UIButton;

  private currentStep: TutorialStep | null = null;
  private onAdvanceCb?: () => void;
  private onSkipCb?: () => void;
  private onToggleMinimizeCb?: (isMinimized: boolean) => void;

  constructor(options: TutorialPanelOptions = {}) {
    super('TutorialPanel');

    this.tutorialManager =
      options.tutorialManager ??
      (ServiceLocator.has('TutorialManager')
        ? ServiceLocator.get<TutorialManager>('TutorialManager')
        : undefined);

    this.panelWidth = options.width ?? 480;
    this.panelHeight = options.height ?? 240;
    this.container.position.set(options.x ?? 35, options.y ?? 780);

    this.onAdvanceCb = options.onAdvance;
    this.onSkipCb = options.onSkip;
    this.onToggleMinimizeCb = options.onToggleMinimize;

    // 1. Background Graphics Frame
    this.backgroundGfx = new Graphics();
    this.backgroundGfx.eventMode = 'static';
    this.container.addChild(this.backgroundGfx);

    // 2. Header Container
    this.headerContainer = new Container();
    this.headerContainer.position.set(UI_SPACING.MD, UI_SPACING.SM);
    this.container.addChild(this.headerContainer);

    const stepStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    this.stepIndexText = new Text({ text: 'STEP 1 / 7', style: stepStyle });
    this.headerContainer.addChild(this.stepIndexText);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.0,
    });
    this.titleText = new Text({ text: 'DIRECTIVE TITLE', style: titleStyle });
    this.titleText.position.set(0, 16);
    this.headerContainer.addChild(this.titleText);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.AMBER,
      letterSpacing: 0.8,
    });
    this.subtitleText = new Text({ text: 'SUBTITLE', style: subStyle });
    this.subtitleText.position.set(0, 36);
    this.headerContainer.addChild(this.subtitleText);

    // 3. Body Text Container
    this.bodyContainer = new Container();
    this.bodyContainer.position.set(UI_SPACING.MD, 68);
    this.container.addChild(this.bodyContainer);

    const descStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: this.panelWidth - UI_SPACING.MD * 2,
      lineHeight: 16,
    });
    this.descriptionText = new Text({ text: '', style: descStyle });
    this.bodyContainer.addChild(this.descriptionText);

    // 4. Action Buttons Container (Bottom Row)
    this.actionsContainer = new Container();
    this.actionsContainer.position.set(
      UI_SPACING.MD,
      this.panelHeight - 42
    );
    this.container.addChild(this.actionsContainer);

    this.continueBtn = new UIButton({
      label: 'CONTINUE [SPACE]',
      variant: 'PRIMARY',
      width: 160,
      height: 30,
      onClick: () => this.handleContinue(),
    });
    this.continueBtn.container.position.set(0, 0);
    this.actionsContainer.addChild(this.continueBtn.container);

    this.minimizeBtn = new UIButton({
      label: 'MINIMIZE [H]',
      variant: 'GHOST',
      width: 110,
      height: 30,
      onClick: () => this.toggleMinimize(),
    });
    this.minimizeBtn.container.position.set(170, 0);
    this.actionsContainer.addChild(this.minimizeBtn.container);

    this.skipBtn = new UIButton({
      label: 'SKIP TUTORIAL',
      variant: 'DANGER',
      width: 120,
      height: 30,
      onClick: () => this.handleSkip(),
    });
    this.skipBtn.container.position.set(this.panelWidth - UI_SPACING.MD * 2 - 120, 0);
    this.actionsContainer.addChild(this.skipBtn.container);

    // 5. Minimized Pill Container
    this.minimizedPillContainer = new Container();
    this.minimizedPillContainer.visible = false;
    this.minimizedPillContainer.eventMode = 'static';
    this.minimizedPillContainer.cursor = 'pointer';
    this.minimizedPillContainer.on('pointertap', () => this.toggleMinimize());

    const minGfx = new Graphics();
    minGfx.roundRect(0, 0, 360, 32, UI_RADIUS.SM);
    minGfx.fill({ color: 0x030814, alpha: 0.92 });
    minGfx.stroke({ color: UI_COLORS.CYAN, width: 1.2, alpha: 0.8 });
    this.minimizedPillContainer.addChild(minGfx);

    const minStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });
    this.minimizedText = new Text({
      text: '[H] OBJECTIVE GUIDANCE (CLICK TO EXPAND)',
      style: minStyle,
    });
    this.minimizedText.position.set(12, 8);
    this.minimizedPillContainer.addChild(this.minimizedText);

    this.container.addChild(this.minimizedPillContainer);

    this.renderFrame();
  }

  public setTutorialManager(tm: TutorialManager): void {
    this.tutorialManager = tm;
  }

  public getCurrentStep(): TutorialStep | null {
    return this.currentStep;
  }

  public setStep(step: TutorialStep | null, stepIndex: number = 1, totalSteps: number = 7): void {
    this.currentStep = step;
    if (!step) {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;
    this.stepIndexText.text = `STEP ${stepIndex} / ${totalSteps}`;
    this.titleText.text = step.title;
    this.subtitleText.text = step.subtitle;
    this.descriptionText.text = step.description;

    this.minimizedText.text = `[H] OBJECTIVE: ${step.title} (${stepIndex}/${totalSteps})`;

    // Check accessibility large text
    if (!this.settingsManager && ServiceLocator.has('SettingsManager')) {
      this.settingsManager = ServiceLocator.get<SettingsManager>('SettingsManager');
    }
    const isLargeText =
      this.settingsManager?.getSettings().accessibility.textSize === 'LARGE';

    if (isLargeText) {
      this.descriptionText.style.fontSize = 13;
      this.descriptionText.style.lineHeight = 18;
      this.panelHeight = 270;
      this.container.position.y = 750;
    } else {
      this.descriptionText.style.fontSize = 11;
      this.descriptionText.style.lineHeight = 16;
      this.panelHeight = 240;
      this.container.position.y = 780;
    }

    this.actionsContainer.position.y = this.panelHeight - 42;
    this.skipBtn.container.visible = Boolean(step.allowSkip);

    this.renderFrame();
  }

  public toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.backgroundGfx.visible = false;
      this.headerContainer.visible = false;
      this.bodyContainer.visible = false;
      this.actionsContainer.visible = false;
      this.minimizedPillContainer.visible = true;
      this.minimizedPillContainer.position.set(0, this.panelHeight - 34);
    } else {
      this.backgroundGfx.visible = true;
      this.headerContainer.visible = true;
      this.bodyContainer.visible = true;
      this.actionsContainer.visible = true;
      this.minimizedPillContainer.visible = false;
    }

    if (this.onToggleMinimizeCb) {
      this.onToggleMinimizeCb(this.isMinimized);
    }
  }

  public getIsMinimized(): boolean {
    return this.isMinimized;
  }

  public handleContinue(): void {
    if (this.onAdvanceCb) {
      this.onAdvanceCb();
    } else if (this.tutorialManager) {
      this.tutorialManager.advanceStep();
    }
  }

  public handleSkip(): void {
    if (this.onSkipCb) {
      this.onSkipCb();
    } else if (this.tutorialManager) {
      this.tutorialManager.skipCurrentSequence();
    }
  }

  private renderFrame(): void {
    this.backgroundGfx.clear();

    // Main translucent HUD panel
    this.backgroundGfx.roundRect(0, 0, this.panelWidth, this.panelHeight, UI_RADIUS.MD);
    this.backgroundGfx.fill({ color: 0x030814, alpha: 0.92 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.2 });

    // Decorative cyan tactical notch on top-left
    this.backgroundGfx.moveTo(0, 16);
    this.backgroundGfx.lineTo(16, 0);
    this.backgroundGfx.lineTo(60, 0);
    this.backgroundGfx.stroke({ color: UI_COLORS.CYAN, width: 2.0, alpha: 0.9 });

    // Subtle header separator line
    this.backgroundGfx.moveTo(UI_SPACING.MD, 58);
    this.backgroundGfx.lineTo(this.panelWidth - UI_SPACING.MD, 58);
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0, alpha: 0.5 });
  }

  public override destroy(): void {
    this.minimizedPillContainer.removeAllListeners();
    super.destroy();
  }
}
