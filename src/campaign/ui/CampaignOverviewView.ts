/**
 * INTERSTELLAR CONTINUUM - Campaign Overview & Exploration Dossier View
 * Provides the Flight Director with a full operational briefing:
 * active chapter directives, objective tracking, milestones, and exploration journal.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  CampaignOverview,
  CampaignObjective,
  CampaignObjectiveStatus,
} from '../CampaignTypes';
import { UIButton } from '../../ui/components/UIButton';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';

export interface CampaignOverviewViewOptions {
  onClose?: () => void;
  onSelectObjective?: (objective: CampaignObjective) => void;
}

export class CampaignOverviewView {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private panelContainer: Container;
  private panelGfx: Graphics;

  private headerText: Text;
  private subtitleText: Text;
  private synopsisText: Text;
  private progressStatsText: Text;

  private objectivesContainer: Container;
  private journalContainer: Container;

  private closeButton: UIButton;
  private tabObjectivesButton: UIButton;
  private tabJournalButton: UIButton;

  private overviewData: CampaignOverview | null = null;
  private options: CampaignOverviewViewOptions;

  private readonly viewWidth: number = 1000;
  private readonly viewHeight: number = 680;

  constructor(options: CampaignOverviewViewOptions = {}) {
    this.options = options;

    this.container = new Container();
    this.container.label = 'CampaignOverviewView';
    this.container.visible = false;

    this.backdropGfx = new Graphics();
    this.container.addChild(this.backdropGfx);

    this.panelContainer = new Container();
    this.panelContainer.label = 'OverviewPanel';
    this.container.addChild(this.panelContainer);

    this.panelGfx = new Graphics();
    this.panelContainer.addChild(this.panelGfx);

    // Header labels
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 22,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    this.headerText = new Text({ text: 'CAMPAIGN OPERATIONS DOSSIER', style: titleStyle });
    this.headerText.position.set(35, 25);
    this.panelContainer.addChild(this.headerText);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fill: UI_COLORS.AMBER,
      fontWeight: 'bold',
    });
    this.subtitleText = new Text({ text: 'Chapter 1: Project Genesis', style: subStyle });
    this.subtitleText.position.set(35, 56);
    this.panelContainer.addChild(this.subtitleText);

    const synopsisStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: 930,
      lineHeight: 18,
    });
    this.synopsisText = new Text({ text: '', style: synopsisStyle });
    this.synopsisText.position.set(35, 82);
    this.panelContainer.addChild(this.synopsisText);

    const statsStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fill: UI_COLORS.TEXT_PRIMARY,
    });
    this.progressStatsText = new Text({ text: 'OVERALL PROGRESS: 0%', style: statsStyle });
    this.progressStatsText.position.set(35, 128);
    this.panelContainer.addChild(this.progressStatsText);

    // Tab buttons
    this.tabObjectivesButton = new UIButton({
      label: 'DIRECTIVES & OBJECTIVES',
      variant: 'PRIMARY',
      width: 220,
      height: 32,
      onClick: () => this.switchTab('OBJECTIVES'),
    });
    this.tabObjectivesButton.container.position.set(35, 155);
    this.panelContainer.addChild(this.tabObjectivesButton.container);

    this.tabJournalButton = new UIButton({
      label: 'EXPLORATION JOURNAL',
      variant: 'SECONDARY',
      width: 200,
      height: 32,
      onClick: () => this.switchTab('JOURNAL'),
    });
    this.tabJournalButton.container.position.set(265, 155);
    this.panelContainer.addChild(this.tabJournalButton.container);

    // Scroll/List containers
    this.objectivesContainer = new Container();
    this.objectivesContainer.position.set(35, 200);
    this.panelContainer.addChild(this.objectivesContainer);

    this.journalContainer = new Container();
    this.journalContainer.position.set(35, 200);
    this.journalContainer.visible = false;
    this.panelContainer.addChild(this.journalContainer);

    // Close button
    this.closeButton = new UIButton({
      label: 'DISMISS DOSSIER',
      variant: 'GHOST',
      width: 160,
      height: 36,
      onClick: () => this.handleClose(),
    });
    this.closeButton.container.position.set(805, 625);
    this.panelContainer.addChild(this.closeButton.container);
  }

  public setOverviewData(data: CampaignOverview): void {
    this.overviewData = data;

    this.headerText.text = `CAMPAIGN DOSSIER // CHAPTER ${data.currentChapter.number}: ${data.currentChapter.codename}`;
    this.subtitleText.text = `${data.currentChapter.title} — ${data.currentChapter.subtitle}`;
    this.synopsisText.text = data.currentChapter.synopsis;
    this.progressStatsText.text = `CAMPAIGN COMPLETION: ${data.campaignProgressPercentage}% | OBJECTIVES COMPLETED: ${data.completedObjectivesCount}/${data.totalObjectivesCount} | MILESTONES: ${data.completedMilestones.length}`;

    this.renderObjectives();
    this.renderJournal();
    this.redraw();
  }

  private switchTab(tab: 'OBJECTIVES' | 'JOURNAL'): void {
    this.objectivesContainer.visible = tab === 'OBJECTIVES';
    this.journalContainer.visible = tab === 'JOURNAL';
  }

  private renderObjectives(): void {
    this.objectivesContainer.removeChildren();
    if (!this.overviewData) return;

    let yOffset = 0;
    const objectives = this.overviewData.activeObjectives.slice(0, 5); // display up to 5 on current screen

    for (const obj of objectives) {
      const card = this.createObjectiveCard(obj, yOffset);
      this.objectivesContainer.addChild(card);
      yOffset += 76;
    }
  }

  private createObjectiveCard(obj: CampaignObjective, yOffset: number): Container {
    const card = new Container();
    card.position.set(0, yOffset);

    const bgGfx = new Graphics();
    bgGfx.roundRect(0, 0, 930, 70, 6);
    bgGfx.fill({ color: 0x111c2e, alpha: 0.95 });
    bgGfx.stroke({
      color: obj.status === CampaignObjectiveStatus.COMPLETED ? 0x00ff88 : 0x224466,
      width: 1,
    });
    card.addChild(bgGfx);

    // Status badge color & text
    let statusText = 'LOCKED';
    let statusColor = 0x667788;
    if (obj.status === CampaignObjectiveStatus.COMPLETED) {
      statusText = '✓ COMPLETED';
      statusColor = 0x00ff88;
    } else if (obj.status === CampaignObjectiveStatus.IN_PROGRESS) {
      statusText = `▶ IN PROGRESS (${obj.currentProgress}%)`;
      statusColor = 0x00d2ff;
    } else if (obj.status === CampaignObjectiveStatus.AVAILABLE) {
      statusText = 'AVAILABLE';
      statusColor = 0xffb300;
    }

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
    });
    const title = new Text({
      text: `${obj.title} ${obj.isMilestone ? '★ [MILESTONE]' : ''} ${obj.isOptional ? '[OPTIONAL]' : ''}`,
      style: titleStyle,
    });
    title.position.set(16, 10);
    card.addChild(title);

    const badgeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: statusColor,
    });
    const badge = new Text({ text: statusText, style: badgeStyle });
    badge.position.set(780, 10);
    card.addChild(badge);

    const descStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: 740,
    });
    const desc = new Text({ text: obj.description, style: descStyle });
    desc.position.set(16, 32);
    card.addChild(desc);

    const guidanceStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.CYAN,
    });
    const guidance = new Text({ text: `DIRECTIVE: ${obj.guidanceText}`, style: guidanceStyle });
    guidance.position.set(16, 50);
    card.addChild(guidance);

    return card;
  }

  private renderJournal(): void {
    this.journalContainer.removeChildren();
    if (!this.overviewData || this.overviewData.journalEntries.length === 0) {
      const emptyText = new Text({
        text: 'No exploration journal entries logged yet. Complete objectives and milestones to build operational history.',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(20, 20);
      this.journalContainer.addChild(emptyText);
      return;
    }

    let yOffset = 0;
    for (const entry of this.overviewData.journalEntries.slice(0, 5)) {
      const entryCard = new Container();
      entryCard.position.set(0, yOffset);

      const bgGfx = new Graphics();
      bgGfx.roundRect(0, 0, 930, 64, 4);
      bgGfx.fill({ color: 0x0a1424, alpha: 0.9 });
      bgGfx.stroke({ color: 0x1f3c5f, width: 1 });
      entryCard.addChild(bgGfx);

      const entryTitle = new Text({
        text: `[CH ${entry.chapter}] ${entry.title}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 13,
          fontWeight: 'bold',
          fill: UI_COLORS.AMBER,
        }),
      });
      entryTitle.position.set(14, 8);
      entryCard.addChild(entryTitle);

      const entrySummary = new Text({
        text: entry.summary,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fill: UI_COLORS.TEXT_PRIMARY,
          wordWrap: true,
          wordWrapWidth: 880,
        }),
      });
      entrySummary.position.set(14, 30);
      entryCard.addChild(entrySummary);

      this.journalContainer.addChild(entryCard);
      yOffset += 70;
    }
  }

  private redraw(): void {
    this.backdropGfx.clear();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x050810, alpha: 0.88 });

    const x = Math.max(0, (1920 - this.viewWidth) / 2);
    const y = Math.max(0, (1080 - this.viewHeight) / 2);
    this.panelContainer.position.set(x, y);

    this.panelGfx.clear();
    this.panelGfx.roundRect(0, 0, this.viewWidth, this.viewHeight, 8);
    this.panelGfx.fill({ color: 0x0c1527, alpha: 0.98 });
    this.panelGfx.stroke({ color: 0x1e3a5a, width: 2 });

    // Accent line
    this.panelGfx.rect(10, 0, this.viewWidth - 20, 3);
    this.panelGfx.fill({ color: 0x00d2ff, alpha: 0.8 });
  }

  public show(): void {
    this.container.visible = true;
    this.redraw();
  }

  public hide(): void {
    this.container.visible = false;
  }

  private handleClose(): void {
    this.hide();
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  public destroy(): void {
    this.closeButton.destroy();
    this.tabObjectivesButton.destroy();
    this.tabJournalButton.destroy();
    this.container.destroy({ children: true });
  }
}
