/**
 * INTERSTELLAR CONTINUUM - Reusable Tactile UI Slider Component
 * Supports discrete stepping, track click/drag, and numerical formatting.
 */

import { Graphics, Text, TextStyle, Container } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';

export interface UISliderOptions {
  label: string;
  width?: number;
  height?: number;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  formatFn?: (value: number) => string;
  onChange?: (value: number) => void;
}

export class UISlider extends UIComponent {
  private options: Required<UISliderOptions>;
  private currentValue: number;

  private labelText: Text;
  private valueText: Text;
  private trackContainer: Container;
  private trackGfx: Graphics;
  private decBtnGfx: Graphics;
  private incBtnGfx: Graphics;

  private isDragging: boolean = false;

  constructor(options: UISliderOptions) {
    super(`Slider_${options.label}`);

    this.options = {
      label: options.label,
      width: options.width ?? 480,
      height: options.height ?? 36,
      min: options.min ?? 0,
      max: options.max ?? 1,
      step: options.step ?? 0.05,
      value: options.value ?? (options.min ?? 0),
      formatFn: options.formatFn ?? ((v: number) => `${Math.round(v * 100)}%`),
      onChange: options.onChange ?? (() => {}),
    };

    this.currentValue = Math.max(this.options.min, Math.min(this.options.max, this.options.value));

    // Label on left
    const labelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.5,
    });
    this.labelText = new Text({ text: this.options.label, style: labelStyle });
    this.labelText.position.set(0, 8);
    this.container.addChild(this.labelText);

    // Value readout on right
    const valStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
    });
    this.valueText = new Text({ text: this.options.formatFn(this.currentValue), style: valStyle });
    this.valueText.position.set(this.options.width - 50, 8);
    this.container.addChild(this.valueText);

    // Slider controls: [-] [ Track ] [+]
    const trackWidth = 160;
    const trackStartX = this.options.width - 50 - trackWidth - 36;

    // Decrement button
    this.decBtnGfx = new Graphics();
    this.decBtnGfx.position.set(trackStartX - 28, 6);
    this.decBtnGfx.eventMode = 'static';
    this.decBtnGfx.cursor = 'pointer';
    this.decBtnGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.stepValue(-this.options.step);
    });
    this.container.addChild(this.decBtnGfx);

    // Track
    this.trackContainer = new Container();
    this.trackContainer.position.set(trackStartX, 14);
    this.trackGfx = new Graphics();
    this.trackContainer.addChild(this.trackGfx);
    this.trackContainer.eventMode = 'static';
    this.trackContainer.cursor = 'pointer';

    this.trackContainer.on('pointerdown', (e) => {
      e.stopPropagation();
      this.isDragging = true;
      this.handleTrackPointer(e.global.x);
    });

    this.trackContainer.on('globalpointermove', (e) => {
      if (this.isDragging) {
        this.handleTrackPointer(e.global.x);
      }
    });

    this.trackContainer.on('pointerup', () => {
      this.isDragging = false;
    });
    this.trackContainer.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    this.container.addChild(this.trackContainer);

    // Increment button
    this.incBtnGfx = new Graphics();
    this.incBtnGfx.position.set(trackStartX + trackWidth + 8, 6);
    this.incBtnGfx.eventMode = 'static';
    this.incBtnGfx.cursor = 'pointer';
    this.incBtnGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.stepValue(this.options.step);
    });
    this.container.addChild(this.incBtnGfx);

    this.renderControls();
  }

  public getValue(): number {
    return this.currentValue;
  }

  public setValue(val: number, emit: boolean = true): void {
    const clamped = Math.max(this.options.min, Math.min(this.options.max, val));
    if (this.currentValue !== clamped) {
      this.currentValue = clamped;
      this.valueText.text = this.options.formatFn(this.currentValue);
      this.renderControls();
      if (emit) {
        this.options.onChange(this.currentValue);
      }
    }
  }

  private stepValue(delta: number): void {
    let next = this.currentValue + delta;
    // Round to step precision
    const precision = this.options.step.toString().split('.')[1]?.length ?? 0;
    next = Number(next.toFixed(precision));
    this.setValue(next);
  }

  private handleTrackPointer(globalX: number): void {
    const bounds = this.trackContainer.getBounds();
    const trackWidth = 160;
    const relX = Math.max(0, Math.min(trackWidth, globalX - bounds.minX));
    const ratio = relX / trackWidth;
    const rawVal = this.options.min + ratio * (this.options.max - this.options.min);
    const steps = Math.round((rawVal - this.options.min) / this.options.step);
    const steppedVal = this.options.min + steps * this.options.step;
    this.setValue(steppedVal);
  }

  private renderControls(): void {
    const trackWidth = 160;
    const trackHeight = 8;
    const ratio = (this.currentValue - this.options.min) / (this.options.max - this.options.min || 1);

    // 1. Decrement button
    this.decBtnGfx.clear();
    this.decBtnGfx.roundRect(0, 0, 20, 20, UI_RADIUS.SM);
    this.decBtnGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.8 });
    this.decBtnGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.decBtnGfx.moveTo(5, 10).lineTo(15, 10).stroke({ color: UI_COLORS.CYAN, width: 2 });

    // 2. Track
    this.trackGfx.clear();
    // Background groove
    this.trackGfx.roundRect(0, 0, trackWidth, trackHeight, 4);
    this.trackGfx.fill({ color: 0x07111e, alpha: 0.9 });
    this.trackGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });

    // Fill
    const fillWidth = Math.max(0, trackWidth * ratio);
    if (fillWidth > 0) {
      this.trackGfx.roundRect(0, 0, fillWidth, trackHeight, 4);
      this.trackGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.85 });
    }

    // Thumb handle
    const thumbX = Math.max(4, Math.min(trackWidth - 4, fillWidth));
    this.trackGfx.circle(thumbX, trackHeight / 2, 7);
    this.trackGfx.fill({ color: 0xffffff });
    this.trackGfx.stroke({ color: UI_COLORS.CYAN, width: 2 });

    // 3. Increment button
    this.incBtnGfx.clear();
    this.incBtnGfx.roundRect(0, 0, 20, 20, UI_RADIUS.SM);
    this.incBtnGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.8 });
    this.incBtnGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.incBtnGfx.moveTo(5, 10).lineTo(15, 10).stroke({ color: UI_COLORS.CYAN, width: 2 });
    this.incBtnGfx.moveTo(10, 5).lineTo(10, 15).stroke({ color: UI_COLORS.CYAN, width: 2 });
  }

  public override destroy(): void {
    this.decBtnGfx.removeAllListeners();
    this.incBtnGfx.removeAllListeners();
    this.trackContainer.removeAllListeners();
    super.destroy();
  }
}
