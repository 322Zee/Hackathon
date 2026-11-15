/**
 * INTERSTELLAR CONTINUUM - Reusable Tactile UI Toggle Component
 * Accessible on/off toggle switch with glowing indicator and status readout.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS } from '../core/UIDesignTokens';

export interface UIToggleOptions {
  label: string;
  width?: number;
  height?: number;
  value?: boolean;
  onText?: string;
  offText?: string;
  onChange?: (value: boolean) => void;
}

export class UIToggle extends UIComponent {
  private options: Required<UIToggleOptions>;
  private currentValue: boolean;

  private labelText: Text;
  private statusText: Text;
  private switchGfx: Graphics;

  constructor(options: UIToggleOptions) {
    super(`Toggle_${options.label}`);

    this.options = {
      label: options.label,
      width: options.width ?? 480,
      height: options.height ?? 36,
      value: options.value ?? false,
      onText: options.onText ?? 'ENABLED',
      offText: options.offText ?? 'DISABLED',
      onChange: options.onChange ?? (() => {}),
    };

    this.currentValue = this.options.value;

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

    // Switch Graphics
    const switchX = this.options.width - 130;
    this.switchGfx = new Graphics();
    this.switchGfx.position.set(switchX, 6);
    this.switchGfx.eventMode = 'static';
    this.switchGfx.cursor = 'pointer';
    this.switchGfx.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.container.addChild(this.switchGfx);

    // Status text
    const statusStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: this.currentValue ? UI_COLORS.GREEN : UI_COLORS.TEXT_MUTED,
    });
    this.statusText = new Text({
      text: this.currentValue ? this.options.onText : this.options.offText,
      style: statusStyle,
    });
    this.statusText.position.set(switchX + 54, 8);
    this.container.addChild(this.statusText);

    this.renderSwitch();
  }

  public getValue(): boolean {
    return this.currentValue;
  }

  public setValue(val: boolean, emit: boolean = true): void {
    if (this.currentValue !== val) {
      this.currentValue = val;
      this.statusText.text = this.currentValue ? this.options.onText : this.options.offText;
      this.statusText.style.fill = this.currentValue ? UI_COLORS.GREEN : UI_COLORS.TEXT_MUTED;
      this.renderSwitch();
      if (emit) {
        this.options.onChange(this.currentValue);
      }
    }
  }

  public toggle(): void {
    this.setValue(!this.currentValue);
  }

  private renderSwitch(): void {
    this.switchGfx.clear();
    const switchWidth = 44;
    const switchHeight = 22;

    // Outer pill
    this.switchGfx.roundRect(0, 0, switchWidth, switchHeight, 11);
    this.switchGfx.fill({
      color: this.currentValue ? 0x063326 : 0x0a1420,
      alpha: 0.9,
    });
    this.switchGfx.stroke({
      color: this.currentValue ? UI_COLORS.GREEN : UI_COLORS.BORDER_SUBTLE,
      width: 1,
    });

    // Knob
    const knobRadius = 8;
    const knobX = this.currentValue ? switchWidth - knobRadius - 3 : knobRadius + 3;
    this.switchGfx.circle(knobX, switchHeight / 2, knobRadius);
    this.switchGfx.fill({
      color: this.currentValue ? UI_COLORS.GREEN : 0x4a5d78,
    });
    if (this.currentValue) {
      this.switchGfx.stroke({ color: 0xffffff, width: 1.5 });
    }
  }

  public override destroy(): void {
    this.switchGfx.removeAllListeners();
    super.destroy();
  }
}
