/**
 * INTERSTELLAR CONTINUUM - Tactical Notification Toast Component
 * Aerospace alert card with level indicator, countdown progress, and dismiss handler.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export type NotificationLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type NotificationCategory =
  | 'SYSTEM'
  | 'FACILITY'
  | 'INTERACTION'
  | 'MISSION'
  | 'RESEARCH'
  | 'ECONOMY'
  | 'WARNING'
  | 'ERROR';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  level?: NotificationLevel;
  category?: NotificationCategory;
  duration?: number; // in seconds
  onDismiss?: () => void;
}

export class UINotification extends UIComponent {
  public readonly id: string;
  public targetY: number = 0;

  private bgGfx: Graphics;
  private progressGfx: Graphics;
  private totalDuration: number;
  private remainingDuration: number;
  private onDismissCallback?: () => void;

  private readonly toastWidth: number = 340;
  private readonly toastHeight: number = 72;

  constructor(payload: NotificationPayload) {
    super(`Notification_${payload.id}`);

    this.id = payload.id;
    this.totalDuration = payload.duration ?? 4.5;
    this.remainingDuration = this.totalDuration;
    this.onDismissCallback = payload.onDismiss;

    this.bgGfx = new Graphics();
    this.progressGfx = new Graphics();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.progressGfx);

    this.drawNotification(payload);
    this.setupInteractivity();
  }

  private drawNotification(payload: NotificationPayload): void {
    const w = this.toastWidth;
    const h = this.toastHeight;
    const level = payload.level ?? 'INFO';
    const category = payload.category ?? 'SYSTEM';

    let accentColor: number = UI_COLORS.CYAN;
    switch (level) {
      case 'SUCCESS':
        accentColor = UI_COLORS.GREEN;
        break;
      case 'WARNING':
        accentColor = UI_COLORS.AMBER;
        break;
      case 'ERROR':
        accentColor = UI_COLORS.RED;
        break;
    }

    // Toast body
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, w, h, UI_RADIUS.MD);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.94 });
    this.bgGfx.stroke({ color: accentColor, width: 1.2, alpha: 0.8 });

    // Left accent bar
    this.bgGfx.roundRect(0, 0, 4, h, UI_RADIUS.XS);
    this.bgGfx.fill({ color: accentColor });

    // Category / System header
    const catText = new Text({
      text: `// ${category.toUpperCase()} //`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9,
        fontWeight: 'bold',
        fill: accentColor,
        letterSpacing: 1.0,
      }),
    });
    catText.position.set(UI_SPACING.MD, 8);
    this.container.addChild(catText);

    // Title
    const titleText = new Text({
      text: payload.title.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 0.8,
      }),
    });
    titleText.position.set(UI_SPACING.MD, 22);
    this.container.addChild(titleText);

    // Message
    const msgText = new Text({
      text: payload.message,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: w - UI_SPACING.MD * 2,
        lineHeight: 14,
      }),
    });
    msgText.position.set(UI_SPACING.MD, 38);
    this.container.addChild(msgText);
  }

  private setupInteractivity(): void {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.container.on('pointertap', () => {
      this.dismiss();
    });
  }

  public override update(deltaSeconds: number): void {
    super.update(deltaSeconds);
    if (!this.isVisibleState) return;

    this.remainingDuration -= deltaSeconds;

    // Smooth Y position interpolation
    this.container.y += (this.targetY - this.container.y) * Math.min(1.0, deltaSeconds * 10);

    // Countdown timer bar along the bottom
    this.progressGfx.clear();
    const progress = Math.max(0, this.remainingDuration / this.totalDuration);
    if (progress > 0) {
      this.progressGfx.rect(4, this.toastHeight - 2, (this.toastWidth - 8) * progress, 2);
      this.progressGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.7 });
    }

    if (this.remainingDuration <= 0) {
      this.dismiss();
    }
  }

  public dismiss(): void {
    this.hide();
    if (this.onDismissCallback) {
      this.onDismissCallback();
    }
  }

  public isExpired(): boolean {
    return this.remainingDuration <= 0;
  }
}
