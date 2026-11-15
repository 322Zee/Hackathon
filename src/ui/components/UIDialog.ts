/**
 * INTERSTELLAR CONTINUUM - Reusable Modal Dialog Component
 * Backdrop dimmed modal window with title, body, and action buttons.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';
import { UIButton } from './UIButton';

export interface UIDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
}

export class UIDialog extends UIComponent {
  private backdropGfx: Graphics;
  private dialogPanel: Container;
  private confirmBtn: UIButton;
  private cancelBtn: UIButton;

  private onConfirmCallback?: () => void;
  private onCancelCallback?: () => void;

  constructor(options: UIDialogOptions) {
    super(`Dialog_${options.title}`);

    const w = options.width ?? 480;
    const h = options.height ?? 220;

    this.onConfirmCallback = options.onConfirm;
    this.onCancelCallback = options.onCancel;

    // Full screen backdrop blocker
    this.backdropGfx = new Graphics();
    this.backdropGfx.rect(0, 0, 1920, 1080);
    this.backdropGfx.fill({ color: 0x020617, alpha: 0.75 });
    this.backdropGfx.eventMode = 'static';
    this.container.addChild(this.backdropGfx);

    // Dialog centered frame
    this.dialogPanel = new Container();
    this.dialogPanel.position.set((1920 - w) / 2, (1080 - h) / 2);
    this.container.addChild(this.dialogPanel);

    const panelBg = new Graphics();
    panelBg.roundRect(0, 0, w, h, UI_RADIUS.LG);
    panelBg.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.96 });
    panelBg.stroke({
      color: options.isDanger ? UI_COLORS.RED : UI_COLORS.CYAN,
      width: 1.5,
    });
    this.dialogPanel.addChild(panelBg);

    // Title
    const titleTxt = new Text({
      text: options.title.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 14,
        fontWeight: 'bold',
        fill: options.isDanger ? UI_COLORS.RED : UI_COLORS.CYAN,
        letterSpacing: 1.2,
      }),
    });
    titleTxt.position.set(UI_SPACING.LG, UI_SPACING.LG);
    this.dialogPanel.addChild(titleTxt);

    // Message Body
    const msgTxt = new Text({
      text: options.message,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fill: UI_COLORS.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: w - UI_SPACING.LG * 2,
        lineHeight: 18,
      }),
    });
    msgTxt.position.set(UI_SPACING.LG, UI_SPACING.LG + 36);
    this.dialogPanel.addChild(msgTxt);

    // Action Buttons
    this.cancelBtn = new UIButton({
      label: options.cancelLabel ?? 'CANCEL',
      variant: 'GHOST',
      width: 130,
      height: 32,
      onClick: () => {
        this.hide();
        if (this.onCancelCallback) this.onCancelCallback();
      },
    });
    this.cancelBtn.container.position.set(w - 290, h - 48);

    this.confirmBtn = new UIButton({
      label: options.confirmLabel ?? 'CONFIRM',
      variant: options.isDanger ? 'DANGER' : 'PRIMARY',
      width: 130,
      height: 32,
      onClick: () => {
        this.hide();
        if (this.onConfirmCallback) this.onConfirmCallback();
      },
    });
    this.confirmBtn.container.position.set(w - 150, h - 48);

    this.dialogPanel.addChild(this.cancelBtn.container, this.confirmBtn.container);
  }

  public confirm(): void {
    this.hide();
    if (this.onConfirmCallback) this.onConfirmCallback();
  }

  public cancel(): void {
    this.hide();
    if (this.onCancelCallback) this.onCancelCallback();
  }
}
