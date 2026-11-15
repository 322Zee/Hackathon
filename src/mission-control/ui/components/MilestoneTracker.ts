/**
 * INTERSTELLAR CONTINUUM - Milestone Timeline Tracker Component
 * Renders an aerospace mission timeline pipeline displaying sequential flight milestones,
 * scheduled execution MET, completion badges, and active operational stage.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { MissionMilestone, MilestoneState } from '../../types/MissionControlTypes';

export interface MilestoneTrackerOptions {
  width?: number;
  height?: number;
}

export class MilestoneTracker extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private pipelineGfx: Graphics;
  private nodesContainer: Container;

  constructor(options: MilestoneTrackerOptions = {}) {
    super('MilestoneTracker');

    this.width = options.width ?? 1100;
    this.height = options.height ?? 110;

    this.bgGfx = new Graphics();
    this.pipelineGfx = new Graphics();
    this.nodesContainer = new Container();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.pipelineGfx);
    this.container.addChild(this.nodesContainer);

    this.drawBackground();
  }

  public setMilestones(milestones: MissionMilestone[]): void {
    this.nodesContainer.removeChildren();
    this.pipelineGfx.clear();

    if (!milestones || milestones.length === 0) return;

    const count = milestones.length;
    const paddingX = 40;
    const trackY = 48;
    const availableWidth = this.width - paddingX * 2;
    const step = count > 1 ? availableWidth / (count - 1) : 0;

    // Draw baseline track
    this.pipelineGfx.rect(paddingX, trackY - 2, availableWidth, 4);
    this.pipelineGfx.fill({ color: 0x1e3a5f, alpha: 0.6 });

    // Node rendering
    for (let i = 0; i < count; i++) {
      const ms = milestones[i];
      if (!ms) continue;
      const nodeX = paddingX + i * step;

      let nodeColor: number = UI_COLORS.TEXT_MUTED;
      let stateLabel = 'PENDING';
      if (ms.state === MilestoneState.COMPLETED) {
        nodeColor = UI_COLORS.GREEN;
        stateLabel = 'DONE';
      } else if (ms.state === MilestoneState.IN_PROGRESS) {
        nodeColor = UI_COLORS.CYAN;
        stateLabel = 'ACTIVE';
      } else if (ms.state === MilestoneState.FAILED) {
        nodeColor = UI_COLORS.RED;
        stateLabel = 'FAILED';
      }

      // Draw node circle on pipeline
      this.pipelineGfx.circle(nodeX, trackY, 9);
      this.pipelineGfx.fill({ color: nodeColor, alpha: 0.95 });
      this.pipelineGfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });

      // Node card container
      const nodeCont = new Container();
      nodeCont.position.set(nodeX, trackY);

      // Title above node
      const titleStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: nodeColor,
        align: 'center',
      });
      const titleText = new Text({
        text: ms.title.toUpperCase(),
        style: titleStyle,
      });
      titleText.anchor.set(0.5, 1);
      titleText.position.set(0, -14);
      nodeCont.addChild(titleText);

      // Sub-label below node
      const metHours = Math.floor(ms.scheduledMetSeconds / 3600);
      const subStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fill: UI_COLORS.TEXT_MUTED,
        align: 'center',
      });
      const subText = new Text({
        text: `T+${metHours}h // ${stateLabel}`,
        style: subStyle,
      });
      subText.anchor.set(0.5, 0);
      subText.position.set(0, 14);
      nodeCont.addChild(subText);

      this.nodesContainer.addChild(nodeCont);
    }
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x050e1c, alpha: 0.75 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    const headerStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 1.0,
    });
    const header = new Text({
      text: 'MISSION MILESTONE PIPELINE',
      style: headerStyle,
    });
    header.position.set(UI_SPACING.MD, 8);
    this.bgGfx.addChild(header);
  }
}
