/**
 * INTERSTELLAR CONTINUUM - Reusable Information Card Component
 * Standard tactical card with title, badge, specification list, and footer.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export interface UICardSpec {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface UICardOptions {
  title: string;
  badge?: string;
  badgeColor?: number;
  description?: string;
  specs?: UICardSpec[];
  width?: number;
  height?: number;
  accentColor?: number;
}

export class UICard extends UIComponent {
  private bgGfx: Graphics;
  private cardWidth: number;
  private cardHeight: number;
  private accentColor: number;

  constructor(options: UICardOptions) {
    super(`Card_${options.title}`);

    this.cardWidth = options.width ?? 320;
    this.cardHeight = options.height ?? 180;
    this.accentColor = options.accentColor ?? UI_COLORS.CYAN;

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.drawCard(options);
  }

  private drawCard(options: UICardOptions): void {
    const w = this.cardWidth;
    const h = this.cardHeight;
    const r = UI_RADIUS.MD;

    // Card frame
    this.bgGfx.roundRect(0, 0, w, h, r);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.9 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.2 });

    // Top accent border notch
    this.bgGfx.roundRect(0, 0, w, 3, r);
    this.bgGfx.fill({ color: this.accentColor });

    // Title
    const titleText = new Text({
      text: options.title.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 13,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.0,
      }),
    });
    titleText.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.container.addChild(titleText);

    // Optional Badge
    if (options.badge) {
      const badgeContainer = new Container();
      const badgeBg = new Graphics();
      const badgeColor = options.badgeColor ?? this.accentColor;

      const badgeTxt = new Text({
        text: options.badge.toUpperCase(),
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: badgeColor,
          letterSpacing: 0.5,
        }),
      });

      let badgeEstimatedWidth = 40;
      try {
        if (typeof document !== 'undefined') {
          badgeEstimatedWidth = badgeTxt.width;
        } else {
          badgeEstimatedWidth = (options.badge.length || 4) * 7;
        }
      } catch {
        badgeEstimatedWidth = (options.badge.length || 4) * 7;
      }
      const badgeTotalWidth = badgeEstimatedWidth + 12;

      badgeBg.roundRect(0, 0, badgeTotalWidth, 18, 3);
      badgeBg.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.8 });
      badgeBg.stroke({ color: badgeColor, width: 1.0, alpha: 0.6 });

      badgeTxt.position.set(6, 2);
      badgeContainer.addChild(badgeBg, badgeTxt);
      badgeContainer.position.set(w - badgeTotalWidth - UI_SPACING.MD, UI_SPACING.MD);
      this.container.addChild(badgeContainer);
    }

    let currentY = UI_SPACING.MD + 26;

    // Optional Description
    if (options.description) {
      const descText = new Text({
        text: options.description,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fill: UI_COLORS.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: w - UI_SPACING.MD * 2,
          lineHeight: 16,
        }),
      });
      descText.position.set(UI_SPACING.MD, currentY);
      this.container.addChild(descText);
      let descH = 18;
      try {
        if (typeof document !== 'undefined') {
          descH = descText.height || 18;
        }
      } catch {
        descH = 18;
      }
      currentY += descH + UI_SPACING.SM;
    }

    // Optional Key-Value Specs
    if (options.specs && options.specs.length > 0) {
      const specLabelStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.8,
      });

      const specValueStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
      });

      for (const spec of options.specs) {
        const row = new Container();
        row.position.set(UI_SPACING.MD, currentY);

        const lbl = new Text({ text: spec.label.toUpperCase(), style: specLabelStyle });
        const val = new Text({
          text: spec.value,
          style: spec.highlight
            ? new TextStyle({ ...specValueStyle, fill: this.accentColor })
            : specValueStyle,
        });
        val.anchor.set(1.0, 0);
        val.position.set(w - UI_SPACING.MD * 2, 0);

        row.addChild(lbl, val);
        this.container.addChild(row);
        currentY += 18;
      }
    }
  }
}
