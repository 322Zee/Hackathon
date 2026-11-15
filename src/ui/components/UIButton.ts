/**
 * INTERSTELLAR CONTINUUM - Reusable Aerospace Button Component
 * Multi-variant tactile button with hover, active, and disabled states.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';
import { ServiceLocator } from '../../core/ServiceLocator';
import { AudioService } from '../../audio/AudioService';

export type ButtonVariant = 'PRIMARY' | 'SECONDARY' | 'OUTLINE' | 'DANGER' | 'GHOST';

export interface UIButtonOptions {
  label: string;
  width?: number;
  height?: number;
  variant?: ButtonVariant;
  shortcut?: string;
  disabled?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

export class UIButton extends UIComponent {
  private options: Required<Omit<UIButtonOptions, 'tooltip'>> & { tooltip?: string };
  private backgroundGfx: Graphics;
  private labelText: Text;
  private shortcutText?: Text;

  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor(options: UIButtonOptions) {
    super(`Button_${options.label}`);

    this.options = {
      label: options.label,
      width: options.width ?? 180,
      height: options.height ?? 36,
      variant: options.variant ?? 'PRIMARY',
      shortcut: options.shortcut ?? '',
      disabled: options.disabled ?? false,
      tooltip: options.tooltip,
      onClick: options.onClick ?? (() => {}),
    };

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);

    const textStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: this.getTextColor(),
      letterSpacing: 1.0,
    });

    this.labelText = new Text({
      text: this.options.label,
      style: textStyle,
    });
    this.labelText.anchor.set(0.5, 0.5);
    this.labelText.position.set(this.options.width / 2, this.options.height / 2);
    this.container.addChild(this.labelText);

    if (this.options.shortcut) {
      const shortcutStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fill: UI_COLORS.TEXT_MUTED,
        letterSpacing: 0.5,
      });
      this.shortcutText = new Text({
        text: `[${this.options.shortcut}]`,
        style: shortcutStyle,
      });
      this.shortcutText.anchor.set(1.0, 0.5);
      this.shortcutText.position.set(
        this.options.width - UI_SPACING.SM,
        this.options.height / 2
      );
      this.container.addChild(this.shortcutText);
    }

    this.setupInteractivity();
    this.redraw();
  }

  private setupInteractivity(): void {
    this.container.eventMode = 'static';
    this.container.cursor = this.options.disabled ? 'not-allowed' : 'pointer';

    this.container.on('pointerover', () => {
      if (this.options.disabled) return;
      this.isHovered = true;
      this.redraw();
      this.playAudio('ui_hover');
    });

    this.container.on('pointerout', () => {
      if (this.options.disabled) return;
      this.isHovered = false;
      this.isPressed = false;
      this.redraw();
    });

    this.container.on('pointerdown', () => {
      if (this.options.disabled) return;
      this.isPressed = true;
      this.redraw();
    });

    this.container.on('pointerup', () => {
      if (this.options.disabled) return;
      this.isPressed = false;
      this.redraw();
    });

    this.container.on('pointertap', (e) => {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      if (this.options.disabled) return;
      this.playAudio('ui_confirm');
      this.options.onClick();
    });
  }

  private playAudio(key: string): void {
    if (ServiceLocator.has('AudioService')) {
      try {
        const audio = ServiceLocator.get<AudioService>('AudioService');
        audio.playSfx(key, 0.4);
      } catch {
        // Safe fallback
      }
    }
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.container.cursor = disabled ? 'not-allowed' : 'pointer';
    this.redraw();
  }

  public isDisabled(): boolean {
    return this.options.disabled;
  }

  public setLabel(label: string): void {
    this.options.label = label;
    this.labelText.text = label;
  }

  public getLabel(): string {
    return this.options.label;
  }

  private getTextColor(): number {
    if (this.options.disabled) return UI_COLORS.TEXT_MUTED;
    switch (this.options.variant) {
      case 'DANGER':
        return UI_COLORS.TEXT_DANGER;
      case 'PRIMARY':
        return UI_COLORS.CYAN;
      case 'GHOST':
        return UI_COLORS.TEXT_SECONDARY;
      default:
        return UI_COLORS.TEXT_PRIMARY;
    }
  }

  public redraw(): void {
    this.backgroundGfx.clear();

    const w = this.options.width;
    const h = this.options.height;
    const r = UI_RADIUS.SM;

    if (this.options.disabled) {
      this.backgroundGfx.roundRect(0, 0, w, h, r);
      this.backgroundGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.5 });
      this.backgroundGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.0, alpha: 0.4 });
      this.labelText.style.fill = UI_COLORS.TEXT_MUTED;
      return;
    }

    let fillColor: number = UI_COLORS.BG_PANEL;
    let fillAlpha: number = 0.85;
    let borderColor: number = UI_COLORS.BORDER_DEFAULT;
    let borderAlpha: number = 0.7;
    let borderWidth: number = 1.2;

    switch (this.options.variant) {
      case 'PRIMARY':
        fillColor = this.isHovered ? 0x0c2744 : UI_COLORS.BG_PANEL;
        borderColor = this.isHovered ? UI_COLORS.CYAN : UI_COLORS.BORDER_DEFAULT;
        borderAlpha = this.isHovered ? 1.0 : 0.75;
        borderWidth = this.isHovered ? 1.5 : 1.2;
        break;
      case 'SECONDARY':
        fillColor = this.isHovered ? UI_COLORS.BG_PANEL_ELEVATED : UI_COLORS.BG_PANEL;
        borderColor = this.isHovered ? UI_COLORS.BORDER_HIGHLIGHT : UI_COLORS.BORDER_SUBTLE;
        break;
      case 'OUTLINE':
        fillAlpha = this.isHovered ? 0.3 : 0.05;
        borderColor = this.isHovered ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE;
        break;
      case 'DANGER':
        fillColor = this.isHovered ? 0x3f1212 : UI_COLORS.BG_PANEL;
        borderColor = this.isHovered ? UI_COLORS.RED : 0x991b1b;
        break;
      case 'GHOST':
        fillAlpha = this.isHovered ? 0.25 : 0.0;
        borderAlpha = this.isHovered ? 0.6 : 0.0;
        borderColor = UI_COLORS.BORDER_SUBTLE;
        break;
    }

    if (this.isPressed) {
      fillAlpha = Math.min(1.0, fillAlpha + 0.2);
    }

    this.backgroundGfx.roundRect(0, 0, w, h, r);
    this.backgroundGfx.fill({ color: fillColor, alpha: fillAlpha });
    if (borderAlpha > 0) {
      this.backgroundGfx.stroke({ color: borderColor, width: borderWidth, alpha: borderAlpha });
    }

    this.labelText.style.fill = this.isHovered ? 0xffffff : this.getTextColor();
  }
}
