/**
 * INTERSTELLAR CONTINUUM - Contextual Help & Reference Encyclopaedia Modal
 * Displays searchable aerospace mechanics, first-use guides, field explanations,
 * and direct launches into interactive tutorials.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ContextualHelpTopic } from '../CampaignTypes';
import { ContextualHelpService } from '../ContextualHelpService';
import { UIButton } from '../../ui/components/UIButton';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';

export interface ContextualHelpModalOptions {
  onClose?: () => void;
  onLaunchTutorial?: (tutorialId: string) => void;
}

export class ContextualHelpModal {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private modalContainer: Container;
  private panelGfx: Graphics;

  private titleText: Text;
  private topicTitleText: Text;
  private topicCategoryText: Text;
  private topicSummaryText: Text;
  private topicDetailsText: Text;
  private topicBulletsText: Text;

  private helpService: ContextualHelpService;
  private activeTopic: ContextualHelpTopic | null = null;
  private options: ContextualHelpModalOptions;

  private launchTutorialBtn: UIButton;
  private closeBtn: UIButton;

  private readonly modalWidth: number = 820;
  private readonly modalHeight: number = 560;

  constructor(
    helpService: ContextualHelpService,
    options: ContextualHelpModalOptions = {}
  ) {
    this.helpService = helpService;
    this.options = options;

    this.container = new Container();
    this.container.label = 'ContextualHelpModal';
    this.container.visible = false;

    this.backdropGfx = new Graphics();
    this.container.addChild(this.backdropGfx);

    this.modalContainer = new Container();
    this.modalContainer.label = 'HelpCard';
    this.container.addChild(this.modalContainer);

    this.panelGfx = new Graphics();
    this.modalContainer.addChild(this.panelGfx);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 20,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1,
    });
    this.titleText = new Text({ text: 'FLIGHT OPERATIONS // CONTEXTUAL REFERENCE', style: titleStyle });
    this.titleText.position.set(30, 24);
    this.modalContainer.addChild(this.titleText);

    // Topic details
    const topicHeadingStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
    });
    this.topicTitleText = new Text({ text: 'Select a Reference Topic', style: topicHeadingStyle });
    this.topicTitleText.position.set(30, 65);
    this.modalContainer.addChild(this.topicTitleText);

    const catStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.AMBER,
    });
    this.topicCategoryText = new Text({ text: '', style: catStyle });
    this.topicCategoryText.position.set(30, 92);
    this.modalContainer.addChild(this.topicCategoryText);

    const summaryStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fontStyle: 'italic',
      fill: UI_COLORS.TEXT_PRIMARY,
      wordWrap: true,
      wordWrapWidth: 760,
    });
    this.topicSummaryText = new Text({ text: '', style: summaryStyle });
    this.topicSummaryText.position.set(30, 118);
    this.modalContainer.addChild(this.topicSummaryText);

    const detailStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: 760,
      lineHeight: 20,
    });
    this.topicDetailsText = new Text({ text: '', style: detailStyle });
    this.topicDetailsText.position.set(30, 160);
    this.modalContainer.addChild(this.topicDetailsText);

    const bulletStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fill: UI_COLORS.TEXT_PRIMARY,
      wordWrap: true,
      wordWrapWidth: 760,
      lineHeight: 22,
    });
    this.topicBulletsText = new Text({ text: '', style: bulletStyle });
    this.topicBulletsText.position.set(30, 275);
    this.modalContainer.addChild(this.topicBulletsText);

    // Buttons
    this.launchTutorialBtn = new UIButton({
      label: 'LAUNCH TUTORIAL',
      variant: 'PRIMARY',
      width: 200,
      height: 38,
      onClick: () => this.handleLaunchTutorial(),
    });
    this.launchTutorialBtn.container.position.set(30, 485);
    this.modalContainer.addChild(this.launchTutorialBtn.container);

    this.closeBtn = new UIButton({
      label: 'DISMISS',
      variant: 'GHOST',
      width: 140,
      height: 38,
      onClick: () => this.handleClose(),
    });
    this.closeBtn.container.position.set(650, 485);
    this.modalContainer.addChild(this.closeBtn.container);

    this.redraw();
  }

  public showTopic(topicId: string): void {
    const topic = this.helpService.getTopic(topicId);
    if (!topic) return;

    this.activeTopic = topic;
    this.helpService.markTopicViewed(topicId);

    this.topicTitleText.text = topic.title;
    this.topicCategoryText.text = `CATEGORY: ${topic.category.toUpperCase()} | TAGS: ${topic.tags.join(', ')}`;
    this.topicSummaryText.text = topic.summary;
    this.topicDetailsText.text = topic.detailedExplanation;

    const bulletsFormatted = (topic.bulletPoints || []).map((b) => `• ${b}`).join('\n');
    this.topicBulletsText.text = bulletsFormatted;

    this.launchTutorialBtn.container.visible = Boolean(topic.relatedTutorialId);

    this.show();
  }

  private redraw(): void {
    this.backdropGfx.clear();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x050810, alpha: 0.85 });

    const x = Math.max(0, (1920 - this.modalWidth) / 2);
    const y = Math.max(0, (1080 - this.modalHeight) / 2);
    this.modalContainer.position.set(x, y);

    this.panelGfx.clear();
    this.panelGfx.roundRect(0, 0, this.modalWidth, this.modalHeight, 8);
    this.panelGfx.fill({ color: 0x0c1424, alpha: 0.98 });
    this.panelGfx.stroke({ color: 0x1f3c60, width: 2 });

    this.panelGfx.rect(10, 0, this.modalWidth - 20, 3);
    this.panelGfx.fill({ color: 0x00d2ff, alpha: 0.9 });
  }

  public show(): void {
    this.container.visible = true;
    this.redraw();
  }

  public hide(): void {
    this.container.visible = false;
  }

  private handleLaunchTutorial(): void {
    if (this.activeTopic && this.activeTopic.relatedTutorialId) {
      this.hide();
      if (this.options.onLaunchTutorial) {
        this.options.onLaunchTutorial(this.activeTopic.relatedTutorialId);
      }
    }
  }

  private handleClose(): void {
    this.hide();
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public destroy(): void {
    this.launchTutorialBtn.destroy();
    this.closeBtn.destroy();
    this.container.destroy({ children: true });
  }
}
