/**
 * INTERSTELLAR CONTINUUM - Mission Progress Panel Component (Section C)
 * Visualizes comprehensive mission journey progress, operational flight phases,
 * completed/pending/remaining objectives dossiers, and milestone event pipelines.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { MissionProgressTelemetry, MissionControlObjective } from '../../types/MissionControlTypes';
import { MilestoneTracker } from './MilestoneTracker';

export interface MissionProgressPanelOptions {
  width?: number;
  height?: number;
}

export class MissionProgressPanel extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private journeyTrackGfx: Graphics;
  private progressText: Text;
  private phaseText: Text;

  private milestoneTracker: MilestoneTracker;

  private completedColContainer: Container;
  private pendingColContainer: Container;
  private remainingColContainer: Container;

  constructor(options: MissionProgressPanelOptions = {}) {
    super('MissionProgressPanel');

    this.width = options.width ?? 1860;
    this.height = options.height ?? 370;

    this.bgGfx = new Graphics();
    this.journeyTrackGfx = new Graphics();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.journeyTrackGfx);

    // Journey Progress Header
    const phaseLabelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 1.0,
    });
    const pLabel = new Text({ text: 'JOURNEY TRAJECTORY PROGRESS', style: phaseLabelStyle });
    pLabel.position.set(UI_SPACING.LG, 10);
    this.container.addChild(pLabel);

    this.phaseText = new Text({
      text: 'PHASE: --',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 1.0,
      }),
    });
    this.phaseText.position.set(280, 8);
    this.container.addChild(this.phaseText);

    this.progressText = new Text({
      text: '0% COMPLETE',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.GREEN,
        letterSpacing: 1.0,
      }),
    });
    this.progressText.position.set(this.width - 150, 8);
    this.container.addChild(this.progressText);

    // Milestone Tracker (Width: 1820px, Height: 90px)
    this.milestoneTracker = new MilestoneTracker({
      width: this.width - UI_SPACING.LG * 2,
      height: 85,
    });
    this.milestoneTracker.container.position.set(UI_SPACING.LG, 48);
    this.container.addChild(this.milestoneTracker.container);

    // 3 Columns for Objectives
    const colW = 590;
    const colH = 215;
    const colY = 142;

    this.completedColContainer = new Container();
    this.completedColContainer.position.set(UI_SPACING.LG, colY);
    this.container.addChild(this.completedColContainer);

    this.pendingColContainer = new Container();
    this.pendingColContainer.position.set(UI_SPACING.LG + colW + 25, colY);
    this.container.addChild(this.pendingColContainer);

    this.remainingColContainer = new Container();
    this.remainingColContainer.position.set(UI_SPACING.LG + (colW + 25) * 2, colY);
    this.container.addChild(this.remainingColContainer);

    this.drawObjectiveFrame(this.completedColContainer, colW, colH, 'COMPLETED OBJECTIVES', UI_COLORS.GREEN);
    this.drawObjectiveFrame(this.pendingColContainer, colW, colH, 'IN-PROGRESS OBJECTIVES', UI_COLORS.CYAN);
    this.drawObjectiveFrame(this.remainingColContainer, colW, colH, 'REMAINING OBJECTIVES', UI_COLORS.AMBER);

    this.drawBackground();
  }

  public setProgress(telemetry?: MissionProgressTelemetry): void {
    if (!telemetry) {
      this.progressText.text = '--% COMPLETE';
      this.phaseText.text = 'PHASE: STANDBY';
      this.drawJourneyBar(0);
      this.milestoneTracker.setMilestones([]);
      this.renderObjectiveList(this.completedColContainer, []);
      this.renderObjectiveList(this.pendingColContainer, []);
      this.renderObjectiveList(this.remainingColContainer, []);
      return;
    }

    const pct = Math.max(0, Math.min(100, telemetry.journeyProgressPercent));
    this.progressText.text = `${pct}% COMPLETE`;
    this.phaseText.text = `PHASE: ${telemetry.currentPhase.toUpperCase()}`;
    this.drawJourneyBar(pct);

    this.milestoneTracker.setMilestones(telemetry.milestones);

    this.renderObjectiveList(this.completedColContainer, telemetry.completedObjectives, true);
    this.renderObjectiveList(this.pendingColContainer, telemetry.pendingObjectives, false, true);
    this.renderObjectiveList(this.remainingColContainer, telemetry.remainingObjectives, false, false);
  }

  private drawJourneyBar(pct: number): void {
    this.journeyTrackGfx.clear();
    const barX = UI_SPACING.LG;
    const barY = 28;
    const barW = this.width - UI_SPACING.LG * 2;
    const barH = 8;

    // Track
    this.journeyTrackGfx.roundRect(barX, barY, barW, barH, UI_RADIUS.XS);
    this.journeyTrackGfx.fill({ color: 0x071526, alpha: 0.9 });
    this.journeyTrackGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });

    // Fill
    const fillW = Math.max(0, (pct / 100) * barW);
    if (fillW > 0) {
      this.journeyTrackGfx.roundRect(barX, barY, fillW, barH, UI_RADIUS.XS);
      this.journeyTrackGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.95 });
      this.journeyTrackGfx.rect(barX, barY, fillW, 2).fill({ color: 0xffffff, alpha: 0.4 });
    }
  }

  private renderObjectiveList(
    col: Container,
    objectives: MissionControlObjective[],
    isCompleted: boolean = false,
    isInProgress: boolean = false
  ): void {
    // Clear previous items (keep header frame which is at index 0)
    while (col.children.length > 1) {
      col.removeChildAt(1);
    }

    const listContainer = new Container();
    listContainer.position.set(10, 32);
    col.addChild(listContainer);

    if (objectives.length === 0) {
      const emptyText = new Text({
        text: 'NO OBJECTIVES IN THIS CATEGORY',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });
      emptyText.position.set(10, 10);
      listContainer.addChild(emptyText);
      return;
    }

    let curY = 0;
    for (let i = 0; i < Math.min(4, objectives.length); i++) {
      const obj = objectives[i];
      if (!obj) continue;
      const itemGfx = new Graphics();
      itemGfx.roundRect(0, curY, 570, 40, UI_RADIUS.XS);
      itemGfx.fill({ color: 0x050e1c, alpha: 0.8 });
      itemGfx.stroke({ color: 0x1e293b, width: 0.5 });
      listContainer.addChild(itemGfx);

      // Icon / check indicator
      let iconColor: number = UI_COLORS.TEXT_MUTED;
      let iconChar = 'o';
      if (isCompleted) {
        iconColor = UI_COLORS.GREEN;
        iconChar = '[OK]';
      } else if (isInProgress) {
        iconColor = UI_COLORS.CYAN;
        iconChar = '[>>]';
      } else {
        iconColor = UI_COLORS.AMBER;
        iconChar = '[..]';
      }

      const iconStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: iconColor,
      });
      const icon = new Text({ text: iconChar, style: iconStyle });
      icon.position.set(8, curY + 6);
      listContainer.addChild(icon);

      // Title
      const titleStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10.5,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      });
      const title = new Text({
        text: obj.title.length > 55 ? `${obj.title.substring(0, 52)}...` : obj.title,
        style: titleStyle,
      });
      title.position.set(45, curY + 5);
      listContainer.addChild(title);

      // Condition description
      const descStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.TEXT_SECONDARY,
      });
      const desc = new Text({
        text: obj.conditionDescription || obj.description,
        style: descStyle,
      });
      desc.position.set(45, curY + 22);
      listContainer.addChild(desc);

      curY += 44;
    }
  }

  private drawObjectiveFrame(col: Container, w: number, h: number, title: string, color: number): void {
    const gfx = new Graphics();
    gfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    gfx.fill({ color: 0x050e1c, alpha: 0.9 });
    gfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Header strip
    gfx.roundRect(0, 0, w, 24, UI_RADIUS.SM);
    gfx.fill({ color: 0x081528, alpha: 0.95 });
    gfx.rect(0, 0, 3, 24).fill({ color, alpha: 0.9 });

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.0,
    });
    const titleText = new Text({ text: title, style: titleStyle });
    titleText.position.set(10, 5);
    gfx.addChild(titleText);

    col.addChildAt(gfx, 0);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x020713, alpha: 0.7 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.0 });
  }
}
