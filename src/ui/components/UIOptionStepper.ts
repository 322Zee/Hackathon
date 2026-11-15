/**
 * INTERSTELLAR CONTINUUM - Reusable Option Stepper Component
 * Discrete cyclical selector with left/right arrows for presets, tiers, and styles.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS } from '../core/UIDesignTokens';

export interface OptionItem<T> {
  label: string;
  value: T;
}

export interface UIOptionStepperOptions<T> {
  label: string;
  width?: number;
  height?: number;
  options: OptionItem<T>[];
  value?: T;
  onChange?: (value: T) => void;
}

export class UIOptionStepper<T = any> extends UIComponent {
  private options: Required<UIOptionStepperOptions<T>>;
  private currentIndex: number;

  private labelText: Text;
  private valueText: Text;
  private prevBtnGfx: Graphics;
  private nextBtnGfx: Graphics;

  constructor(options: UIOptionStepperOptions<T>) {
    super(`OptionStepper_${options.label}`);

    this.options = {
      label: options.label,
      width: options.width ?? 480,
      height: options.height ?? 36,
      options: options.options,
      value: options.value !== undefined ? options.value : (options.options[0]?.value as T),
      onChange: options.onChange ?? (() => {}),
    };

    const initialIdx = this.options.options.findIndex((opt) => opt.value === this.options.value);
    this.currentIndex = initialIdx !== -1 ? initialIdx : 0;

    // Label
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

    // Stepper control on right
    const stepperWidth = 180;
    const stepperStartX = this.options.width - stepperWidth;

    // Prev Button [<]
    this.prevBtnGfx = new Graphics();
    this.prevBtnGfx.position.set(stepperStartX, 6);
    this.prevBtnGfx.eventMode = 'static';
    this.prevBtnGfx.cursor = 'pointer';
    this.prevBtnGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.step(-1);
    });
    this.container.addChild(this.prevBtnGfx);

    // Centered Value Text
    const valStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      align: 'center',
    });
    const currentOpt = this.options.options[this.currentIndex];
    this.valueText = new Text({ text: currentOpt ? currentOpt.label : '', style: valStyle });
    this.valueText.position.set(stepperStartX + 30, 8);
    this.container.addChild(this.valueText);

    // Next Button [>]
    this.nextBtnGfx = new Graphics();
    this.nextBtnGfx.position.set(stepperStartX + stepperWidth - 24, 6);
    this.nextBtnGfx.eventMode = 'static';
    this.nextBtnGfx.cursor = 'pointer';
    this.nextBtnGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.step(1);
    });
    this.container.addChild(this.nextBtnGfx);

    this.renderButtons();
  }

  public getValue(): T {
    return (this.options.options[this.currentIndex]?.value ?? this.options.value) as T;
  }

  public setValue(val: T, emit: boolean = true): void {
    const idx = this.options.options.findIndex((opt) => opt.value === val);
    if (idx !== -1 && idx !== this.currentIndex) {
      this.currentIndex = idx;
      const opt = this.options.options[this.currentIndex];
      if (opt) {
        this.valueText.text = opt.label;
        if (emit) {
          this.options.onChange(opt.value);
        }
      }
    }
  }

  private step(delta: number): void {
    if (this.options.options.length <= 1) return;
    const len = this.options.options.length;
    this.currentIndex = (this.currentIndex + delta + len) % len;
    const opt = this.options.options[this.currentIndex];
    if (opt) {
      this.valueText.text = opt.label;
      this.options.onChange(opt.value);
    }
  }

  private renderButtons(): void {
    // Prev [<]
    this.prevBtnGfx.clear();
    this.prevBtnGfx.roundRect(0, 0, 24, 22, UI_RADIUS.SM);
    this.prevBtnGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.8 });
    this.prevBtnGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.prevBtnGfx.moveTo(15, 6).lineTo(9, 11).lineTo(15, 16).stroke({ color: UI_COLORS.CYAN, width: 2 });

    // Next [>]
    this.nextBtnGfx.clear();
    this.nextBtnGfx.roundRect(0, 0, 24, 22, UI_RADIUS.SM);
    this.nextBtnGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.8 });
    this.nextBtnGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
    this.nextBtnGfx.moveTo(9, 6).lineTo(15, 11).lineTo(9, 16).stroke({ color: UI_COLORS.CYAN, width: 2 });
  }

  public override destroy(): void {
    this.prevBtnGfx.removeAllListeners();
    this.nextBtnGfx.removeAllListeners();
    super.destroy();
  }
}
