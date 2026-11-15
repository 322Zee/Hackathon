/**
 * INTERSTELLAR CONTINUUM - Tactical Tooltip Component
 * Context-sensitive popover displaying title, description, and keyboard shortcuts.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export interface UITooltipData {
  title?: string;
  text: string;
  shortcut?: string;
  category?: string;
}

export class UITooltip extends UIComponent {
  private bgGfx: Graphics;
  private titleText: Text;
  private bodyText: Text;
  private shortcutText: Text;

  constructor() {
    super('Tooltip');

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_ACCENT,
      letterSpacing: 1.0,
    });
    this.titleText = new Text({ text: '', style: titleStyle });
    this.container.addChild(this.titleText);

    const bodyStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: 260,
      lineHeight: 15,
    });
    this.bodyText = new Text({ text: '', style: bodyStyle });
    this.container.addChild(this.bodyText);

    const shortcutStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
    });
    this.shortcutText = new Text({ text: '', style: shortcutStyle });
    this.container.addChild(this.shortcutText);

    this.container.visible = false;
    this.container.alpha = 0;
  }

  public setData(data: UITooltipData): void {
    let currentY = UI_SPACING.SM;
    let maxWidth = 160;

    if (data.title) {
      this.titleText.text = data.title.toUpperCase();
      this.titleText.visible = true;
      this.titleText.position.set(UI_SPACING.SM, currentY);
      currentY += 16;
      let titleW = (data.title.length || 0) * 8;
      try {
        if (typeof document !== 'undefined') titleW = this.titleText.width;
      } catch {
        // Fallback in headless environment
      }
      maxWidth = Math.max(maxWidth, titleW + UI_SPACING.SM * 2);
    } else {
      this.titleText.visible = false;
    }

    this.bodyText.text = data.text;
    this.bodyText.position.set(UI_SPACING.SM, currentY);
    let bodyH = 16;
    let bodyW = Math.min(260, (data.text.length || 0) * 7);
    try {
      if (typeof document !== 'undefined') {
        bodyH = this.bodyText.height || 16;
        bodyW = this.bodyText.width || bodyW;
      }
    } catch {
      // Fallback in headless environment
    }
    currentY += bodyH + UI_SPACING.SM;
    maxWidth = Math.max(maxWidth, bodyW + UI_SPACING.SM * 2);

    if (data.shortcut) {
      this.shortcutText.text = `KEY: [${data.shortcut}]`;
      this.shortcutText.visible = true;
      this.shortcutText.position.set(UI_SPACING.SM, currentY);
      currentY += 14;
    } else {
      this.shortcutText.visible = false;
    }

    const totalHeight = currentY + UI_SPACING.XS;

    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, maxWidth, totalHeight, UI_RADIUS.SM);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.95 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
  }

  public setPosition(x: number, y: number): void {
    // Clamp inside 1920x1080 virtual viewport
    let w = 180;
    let h = 60;
    try {
      if (typeof document !== 'undefined') {
        w = this.container.width || 180;
        h = this.container.height || 60;
      }
    } catch {
      // Fallback
    }

    let targetX = x + 12;
    let targetY = y + 12;

    if (targetX + w > 1900) {
      targetX = x - w - 8;
    }
    if (targetY + h > 1060) {
      targetY = y - h - 8;
    }

    this.container.position.set(Math.max(10, targetX), Math.max(10, targetY));
  }
}
