/**
 * INTERSTELLAR CONTINUUM - Rover Exploration Objectives Panel
 * HUD panel displaying planetary directives, surveying milestones, and rewards.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ExplorationObjective } from '../ExplorationTypes';
import { UI_COLORS } from '../../ui/core/UIDesignTokens';

export class RoverObjectivesPanel {
  public readonly container: Container = new Container();

  private background: Graphics = new Graphics();
  private titleText: Text;
  private contentContainer: Container = new Container();

  private readonly PANEL_WIDTH = 340;
  private readonly PANEL_HEIGHT = 200;

  constructor() {
    this.container.label = 'RoverObjectivesPanel';
    this.container.addChild(this.background);

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1,
    });

    this.titleText = new Text({ text: 'SURFACE EXPLORATION DIRECTIVES', style: titleStyle });
    this.titleText.position.set(16, 12);
    this.container.addChild(this.titleText);

    this.contentContainer.position.set(16, 36);
    this.container.addChild(this.contentContainer);

    this.drawBackground();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.roundRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 6);
    this.background.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.90 });
    this.background.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });
  }

  public updateObjectives(objectives: ExplorationObjective[]): void {
    this.contentContainer.removeChildren();

    const textStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: UI_COLORS.TEXT_PRIMARY,
    });

    const rewardStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fill: UI_COLORS.GREEN,
    });

    let yOffset = 0;
    for (const obj of objectives.slice(0, 4)) {
      const row = new Container();
      row.position.set(0, yOffset);

      // Checkbox indicator
      const check = new Graphics();
      check.roundRect(0, 2, 12, 12, 2);
      if (obj.isCompleted) {
        check.fill({ color: UI_COLORS.GREEN });
        check.stroke({ color: 0x15803d, width: 1.0 });
      } else {
        check.fill({ color: 0x0f172a });
        check.stroke({ color: 0x475569, width: 1.0 });
      }
      row.addChild(check);

      // Objective Title
      const title = new Text({
        text: obj.title.length > 28 ? obj.title.slice(0, 26) + '..' : obj.title,
        style: textStyle,
      });
      title.position.set(18, 0);
      if (obj.isCompleted) {
        title.style.fill = UI_COLORS.TEXT_MUTED;
      }
      row.addChild(title);

      // Rewards
      const rewards = new Text({
        text: obj.isCompleted ? '[COMPLETED]' : `+${obj.rewardResearchData} Sci / +$${obj.rewardCredits}`,
        style: rewardStyle,
      });
      rewards.position.set(18, 16);
      if (obj.isCompleted) {
        rewards.style.fill = UI_COLORS.GREEN;
      }
      row.addChild(rewards);

      this.contentContainer.addChild(row);
      yOffset += 38;
    }
  }
}
