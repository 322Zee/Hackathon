/**
 * INTERSTELLAR CONTINUUM - Reusable Aerospace Panel Component
 * Tactical window frame with title bar, close action, and content viewport.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export interface UIPanelOptions {
  width: number;
  height: number;
  title?: string;
  hasCloseButton?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  headerHeight?: number;
}

export class UIPanel extends UIComponent {
  public readonly contentContainer: Container;

  private backgroundGfx: Graphics;
  private headerGfx: Graphics;
  private titleText?: Text;
  private closeBtn?: Container;

  private panelWidth: number;
  private panelHeight: number;
  private headerHeight: number;
  private onCloseCallback?: () => void;

  constructor(options: UIPanelOptions) {
    super(`Panel_${options.title ?? 'Window'}`);

    this.panelWidth = options.width;
    this.panelHeight = options.height;
    this.headerHeight = options.headerHeight ?? (options.title ? 38 : 0);
    this.onCloseCallback = options.onClose;

    this.backgroundGfx = new Graphics();
    this.headerGfx = new Graphics();
    this.contentContainer = new Container();
    this.contentContainer.label = 'PanelContent';
    this.contentContainer.position.set(UI_SPACING.MD, this.headerHeight + UI_SPACING.MD);

    this.container.addChild(this.backgroundGfx);
    this.container.addChild(this.headerGfx);
    this.container.addChild(this.contentContainer);

    this.drawBackground();

    if (options.title) {
      const showClose = options.showCloseButton ?? options.hasCloseButton ?? false;
      this.setupHeader(options.title, showClose);
    }
  }

  private drawBackground(): void {
    this.backgroundGfx.clear();

    const w = this.panelWidth;
    const h = this.panelHeight;
    const r = UI_RADIUS.MD;

    // Outer subtle glow / shadow
    this.backgroundGfx.roundRect(2, 2, w, h, r);
    this.backgroundGfx.fill({ color: 0x000000, alpha: 0.45 });

    // Panel body
    this.backgroundGfx.roundRect(0, 0, w, h, r);
    this.backgroundGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.92 });
    this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.2, alpha: 0.75 });
  }

  private setupHeader(title: string, hasClose: boolean): void {
    this.headerGfx.clear();

    const w = this.panelWidth;
    const hh = this.headerHeight;

    // Header divider bar
    this.headerGfx.roundRect(0, 0, w, hh, UI_RADIUS.MD);
    this.headerGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.9 });
    this.headerGfx.moveTo(0, hh).lineTo(w, hh).stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_ACCENT,
      letterSpacing: 1.2,
    });

    this.titleText = new Text({
      text: title.toUpperCase(),
      style: titleStyle,
    });
    this.titleText.position.set(UI_SPACING.MD, hh / 2 - 8);
    this.container.addChild(this.titleText);

    if (hasClose) {
      this.closeBtn = new Container();
      this.closeBtn.position.set(w - 28, hh / 2 - 10);
      this.closeBtn.eventMode = 'static';
      this.closeBtn.cursor = 'pointer';

      const closeTxt = new Text({
        text: '✕',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 14,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
        }),
      });

      this.closeBtn.addChild(closeTxt);

      this.closeBtn.on('pointerover', () => {
        closeTxt.style.fill = UI_COLORS.RED;
      });
      this.closeBtn.on('pointerout', () => {
        closeTxt.style.fill = UI_COLORS.TEXT_MUTED;
      });
      this.closeBtn.on('pointertap', (e) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
        if (this.onCloseCallback) {
          this.onCloseCallback();
        } else {
          this.hide();
        }
      });

      this.container.addChild(this.closeBtn);
    }
  }

  public setTitle(title: string): void {
    if (this.titleText) {
      this.titleText.text = title.toUpperCase();
    }
  }

  public getTitle(): string {
    return this.titleText?.text ?? '';
  }

  public resize(width: number, height: number): void {
    this.panelWidth = width;
    this.panelHeight = height;
    this.drawBackground();
  }
}
