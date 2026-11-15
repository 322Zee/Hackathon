/**
 * INTERSTELLAR CONTINUUM - Reusable Progress Bar Component
 * Segmented or continuous telemetry bar with percentage readout.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';

export interface UIProgressBarOptions {
  width: number;
  height?: number;
  label?: string;
  color?: number;
  fillColor?: number;
  showPercent?: boolean;
  showPercentage?: boolean;
  initialValue?: number; // 0.0 to 1.0
}

export class UIProgressBar extends UIComponent {
  private barWidth: number;
  private barHeight: number;
  private barColor: number;
  private showPercent: boolean;
  private value: number = 0;

  private bgGfx: Graphics;
  private fillGfx: Graphics;
  private labelText?: Text;
  private percentText?: Text;

  constructor(options: UIProgressBarOptions) {
    super('ProgressBar');

    this.barWidth = options.width;
    this.barHeight = options.height ?? 16;
    this.barColor = options.fillColor ?? options.color ?? UI_COLORS.CYAN;
    this.showPercent = options.showPercentage ?? options.showPercent ?? true;
    this.value = Math.max(0, Math.min(1, options.initialValue ?? 0));

    this.bgGfx = new Graphics();
    this.fillGfx = new Graphics();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.fillGfx);

    if (options.label) {
      this.labelText = new Text({
        text: options.label.toUpperCase(),
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
          letterSpacing: 0.8,
        }),
      });
      this.labelText.position.set(0, -16);
      this.container.addChild(this.labelText);
    }

    if (this.showPercent) {
      this.percentText = new Text({
        text: `${Math.round(this.value * 100)}%`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 10,
          fill: UI_COLORS.TEXT_SECONDARY,
          letterSpacing: 0.5,
        }),
      });
      this.percentText.anchor.set(1.0, 0);
      this.percentText.position.set(this.barWidth, -16);
      this.container.addChild(this.percentText);
    }

    this.redraw();
  }

  public setValue(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    if (this.value === clamped) return;

    this.value = clamped;
    if (this.percentText) {
      this.percentText.text = `${Math.round(this.value * 100)}%`;
    }
    this.redrawFill();
  }

  public getValue(): number {
    return this.value;
  }

  public setProgress(val: number): void {
    this.setValue(val);
  }

  public getProgress(): number {
    return this.getValue();
  }

  public setColor(color: number): void {
    this.barColor = color;
    this.redrawFill();
  }

  private redraw(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.barWidth, this.barHeight, UI_RADIUS.XS);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL_ELEVATED, alpha: 0.9 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    this.redrawFill();
  }

  private redrawFill(): void {
    this.fillGfx.clear();
    const fillWidth = (this.barWidth - 4) * this.value;
    if (fillWidth > 2) {
      this.fillGfx.roundRect(2, 2, fillWidth, this.barHeight - 4, UI_RADIUS.XS);
      this.fillGfx.fill({ color: this.barColor, alpha: 0.9 });
    }
  }
}
