/**
 * INTERSTELLAR CONTINUUM - Category Breakdown Card Component
 * Renders the 5 authoritative scoring categories with visual progress meters,
 * itemized point breakdowns, and transparent audit logs.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';
import { CategoryScoreResult } from '../ResultsTypes';

export interface CategoryBreakdownCardOptions {
  width?: number;
  height?: number;
}

export class CategoryBreakdownCard {
  public readonly container: Container;

  private width: number;
  private height: number;
  private backgroundGfx: Graphics;
  private barsContainer: Container;

  constructor(options: CategoryBreakdownCardOptions = {}) {
    this.width = options.width ?? 460;
    this.height = options.height ?? 380;

    this.container = new Container();

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    this.barsContainer = new Container();
    this.container.addChild(this.barsContainer);

    this.renderCardBackground();
  }

  private renderCardBackground(): void {
    this.backgroundGfx.clear();
    this.backgroundGfx.roundRect(0, 0, this.width, this.height, 6);
    this.backgroundGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.85 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Header label
    const headerText = new Text({
      text: 'CATEGORY PERFORMANCE AUDIT',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 1.2,
      }),
    });
    headerText.position.set(16, 12);
    this.container.addChild(headerText);
  }

  public setCategories(categories: CategoryScoreResult[]): void {
    this.barsContainer.removeChildren();

    const startY = 40;
    const rowHeight = 64;

    categories.forEach((cat, idx) => {
      const y = startY + idx * rowHeight;
      const rowContainer = new Container();
      rowContainer.position.set(16, y);

      // Category Name & Weight
      const nameText = new Text({
        text: `${cat.categoryLabel.toUpperCase()}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 12,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_PRIMARY,
        }),
      });
      nameText.position.set(0, 0);
      rowContainer.addChild(nameText);

      // Score Value (e.g. "28.5 / 30 pts")
      const scoreText = new Text({
        text: `${cat.score} / ${cat.maxScore} pts`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: cat.percentage >= 80 ? UI_COLORS.GREEN : cat.percentage >= 60 ? UI_COLORS.AMBER : UI_COLORS.RED,
        }),
      });
      scoreText.anchor.set(1, 0);
      scoreText.position.set(this.width - 32, 0);
      rowContainer.addChild(scoreText);

      // Progress Meter Bar
      const meterGfx = new Graphics();
      const meterWidth = this.width - 32;
      const meterHeight = 6;
      meterGfx.roundRect(0, 18, meterWidth, meterHeight, 3);
      meterGfx.fill({ color: UI_COLORS.BG_DARK, alpha: 0.9 });
      meterGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });

      const fillWidth = Math.max(0, Math.min(meterWidth, (cat.percentage / 100) * meterWidth));
      const barColor = cat.percentage >= 80 ? UI_COLORS.CYAN : cat.percentage >= 60 ? UI_COLORS.AMBER : UI_COLORS.RED;
      meterGfx.roundRect(0, 18, fillWidth, meterHeight, 3);
      meterGfx.fill({ color: barColor, alpha: 0.95 });
      rowContainer.addChild(meterGfx);

      // Short Reason/Feedback snippet
      const topReason = cat.items[0]?.reason || cat.feedback[0] || 'Nominal telemetry logged.';
      const reasonText = new Text({
        text: topReason,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: this.width - 32,
        }),
      });
      reasonText.position.set(0, 30);
      rowContainer.addChild(reasonText);

      this.barsContainer.addChild(rowContainer);
    });
  }
}
