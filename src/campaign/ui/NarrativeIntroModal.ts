/**
 * INTERSTELLAR CONTINUUM - Narrative Introduction Modal
 * Presents the Flight Director mandate, independent organisation origins,
 * resource reality, and multi-chapter Solar System exploration roadmap.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { NARRATIVE_INTRO_DATA } from '../data/NarrativeIntroData';
import { UIButton } from '../../ui/components/UIButton';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';

export interface NarrativeIntroModalOptions {
  onComplete?: () => void;
  onSkip?: () => void;
}

export class NarrativeIntroModal {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;

  private titleText: Text;
  private mandateBadgeText: Text;
  private bodyText1: Text;
  private bodyText2: Text;
  private callToActionText: Text;

  private beginButton: UIButton;
  private skipButton: UIButton;

  private isVisible: boolean = false;
  private options: NarrativeIntroModalOptions;

  private readonly modalWidth: number = 780;
  private readonly modalHeight: number = 540;

  constructor(options: NarrativeIntroModalOptions = {}) {
    this.options = options;

    this.container = new Container();
    this.container.label = 'NarrativeIntroModal';
    this.container.visible = false;

    // Dimmed backdrop
    this.backdropGfx = new Graphics();
    this.container.addChild(this.backdropGfx);

    // Modal dialog container
    this.modalContainer = new Container();
    this.modalContainer.label = 'ModalCard';
    this.container.addChild(this.modalContainer);

    // Panel styling
    this.panelGfx = new Graphics();
    this.modalContainer.addChild(this.panelGfx);

    // Typography
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 20,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1,
    });
    this.titleText = new Text({ text: NARRATIVE_INTRO_DATA.prologueTitle, style: titleStyle });
    this.titleText.position.set(30, 26);
    this.modalContainer.addChild(this.titleText);

    const badgeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_SECONDARY,
    });
    this.mandateBadgeText = new Text({
      text: `${NARRATIVE_INTRO_DATA.organisationName} // ${NARRATIVE_INTRO_DATA.directorMandate}`.toUpperCase(),
      style: badgeStyle,
    });
    this.mandateBadgeText.position.set(30, 56);
    this.modalContainer.addChild(this.mandateBadgeText);

    // Body texts
    const bodyStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fill: UI_COLORS.TEXT_PRIMARY,
      wordWrap: true,
      wordWrapWidth: 720,
      lineHeight: 22,
    });

    const paragraph1 = `${NARRATIVE_INTRO_DATA.originSummary}\n\n${NARRATIVE_INTRO_DATA.resourceConstraints}`;
    this.bodyText1 = new Text({ text: paragraph1, style: bodyStyle });
    this.bodyText1.position.set(30, 95);
    this.modalContainer.addChild(this.bodyText1);

    const paragraph2 = `${NARRATIVE_INTRO_DATA.solarSystemVision}\n\n${NARRATIVE_INTRO_DATA.longTermGoal}`;
    this.bodyText2 = new Text({ text: paragraph2, style: bodyStyle });
    this.bodyText2.position.set(30, 235);
    this.modalContainer.addChild(this.bodyText2);

    const ctaStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fontWeight: 'bold',
      fill: UI_COLORS.AMBER,
      wordWrap: true,
      wordWrapWidth: 720,
    });
    this.callToActionText = new Text({ text: NARRATIVE_INTRO_DATA.callToAction, style: ctaStyle });
    this.callToActionText.position.set(30, 420);
    this.modalContainer.addChild(this.callToActionText);

    // Action buttons
    this.beginButton = new UIButton({
      label: 'BEGIN MANDATE',
      variant: 'PRIMARY',
      width: 200,
      height: 40,
      onClick: () => this.handleBegin(),
    });
    this.beginButton.container.position.set(540, 470);
    this.modalContainer.addChild(this.beginButton.container);

    this.skipButton = new UIButton({
      label: 'SKIP BRIEFING',
      variant: 'GHOST',
      width: 150,
      height: 40,
      onClick: () => this.handleSkip(),
    });
    this.skipButton.container.position.set(370, 470);
    this.modalContainer.addChild(this.skipButton.container);

    this.redraw();
  }

  private redraw(): void {
    // Backdrop
    this.backdropGfx.clear();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x050810, alpha: 0.85 });

    // Panel
    const x = Math.max(0, (1920 - this.modalWidth) / 2);
    const y = Math.max(0, (1080 - this.modalHeight) / 2);
    this.modalContainer.position.set(x, y);

    this.panelGfx.clear();
    // Background
    this.panelGfx.roundRect(0, 0, this.modalWidth, this.modalHeight, 10);
    this.panelGfx.fill({ color: 0x0c1322, alpha: 0.98 });
    // Border
    this.panelGfx.stroke({ color: 0x1f3b5c, width: 2 });
    // Top highlight line
    this.panelGfx.rect(10, 0, this.modalWidth - 20, 3);
    this.panelGfx.fill({ color: 0x00d2ff, alpha: 0.9 });
  }

  public show(): void {
    this.isVisible = true;
    this.container.visible = true;
    this.redraw();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  public getVisible(): boolean {
    return this.isVisible;
  }

  private handleBegin(): void {
    this.hide();
    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }

  private handleSkip(): void {
    this.hide();
    if (this.options.onSkip) {
      this.options.onSkip();
    }
  }

  public destroy(): void {
    this.beginButton.destroy();
    this.skipButton.destroy();
    this.container.destroy({ children: true });
  }
}
