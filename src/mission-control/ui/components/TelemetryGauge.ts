/**
 * INTERSTELLAR CONTINUUM - Tactical Telemetry Gauge Component
 * Visual circular or horizontal bar meter with nominal, warning, and critical zones,
 * digital readout, and explicit unavailable state rendering.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { TelemetryValue } from '../../types/MissionControlTypes';

export interface TelemetryGaugeOptions {
  width?: number;
  height?: number;
  label: string;
  min?: number;
  max?: number;
  unit?: string;
  nominalColor?: number;
  warningThreshold?: number; // e.g. < 25 or > 80
  criticalThreshold?: number; // e.g. < 10 or > 95
  isThresholdHigh?: boolean; // True if higher value triggers warning/critical
}

export class TelemetryGauge extends UIComponent {
  private options: Required<TelemetryGaugeOptions>;
  private bgGfx: Graphics;
  private meterGfx: Graphics;
  private labelText: Text;
  private valueText: Text;
  private statusText: Text;

  private currentValue?: number;
  private isAvailable: boolean = false;

  constructor(options: TelemetryGaugeOptions) {
    super(`TelemetryGauge_${options.label}`);

    this.options = {
      width: options.width ?? 220,
      height: options.height ?? 64,
      label: options.label,
      min: options.min ?? 0,
      max: options.max ?? 100,
      unit: options.unit ?? '%',
      nominalColor: options.nominalColor ?? UI_COLORS.CYAN,
      warningThreshold: options.warningThreshold ?? 20,
      criticalThreshold: options.criticalThreshold ?? 10,
      isThresholdHigh: options.isThresholdHigh ?? false,
    };

    this.bgGfx = new Graphics();
    this.meterGfx = new Graphics();
    this.container.addChild(this.bgGfx);
    this.container.addChild(this.meterGfx);

    // Label Text
    const labelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 1.0,
    });
    this.labelText = new Text({
      text: this.options.label.toUpperCase(),
      style: labelStyle,
    });
    this.labelText.position.set(UI_SPACING.SM, 6);
    this.container.addChild(this.labelText);

    // Value Text
    const valueStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 14,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.8,
    });
    this.valueText = new Text({
      text: '--',
      style: valueStyle,
    });
    this.valueText.position.set(this.options.width - UI_SPACING.SM, 6);
    this.valueText.anchor.set(1, 0);
    this.container.addChild(this.valueText);

    // Status / Unavailable note
    const statusStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9,
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 0.5,
    });
    this.statusText = new Text({
      text: '',
      style: statusStyle,
    });
    this.statusText.position.set(UI_SPACING.SM, this.options.height - 18);
    this.container.addChild(this.statusText);

    this.drawBackground();
  }

  public setValue(telemetry?: TelemetryValue<number>): void {
    if (!telemetry || !telemetry.available || typeof telemetry.value !== 'number') {
      this.isAvailable = false;
      this.currentValue = undefined;
      this.valueText.text = 'N/A';
      this.valueText.style.fill = UI_COLORS.TEXT_MUTED;
      this.statusText.text = telemetry?.statusText ?? 'FEED DISCONNECTED';
      this.statusText.style.fill = UI_COLORS.TEXT_MUTED;
      this.drawMeterUnavailable();
      return;
    }

    this.isAvailable = true;
    this.currentValue = telemetry.value;
    const unit = telemetry.unit ?? this.options.unit;
    this.valueText.text = `${telemetry.value} ${unit}`.trim();

    // Determine color
    let barColor = this.options.nominalColor;
    if (this.options.isThresholdHigh) {
      if (telemetry.value >= this.options.criticalThreshold) {
        barColor = UI_COLORS.RED;
      } else if (telemetry.value >= this.options.warningThreshold) {
        barColor = UI_COLORS.AMBER;
      }
    } else {
      if (telemetry.value <= this.options.criticalThreshold) {
        barColor = UI_COLORS.RED;
      } else if (telemetry.value <= this.options.warningThreshold) {
        barColor = UI_COLORS.AMBER;
      }
    }

    this.valueText.style.fill = barColor;
    this.statusText.text = telemetry.statusText ?? (barColor === UI_COLORS.RED ? 'CRITICAL LEVEL' : barColor === UI_COLORS.AMBER ? 'WARNING LEVEL' : 'NOMINAL');
    this.statusText.style.fill = barColor;

    this.drawMeter(telemetry.value, barColor);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    const w = this.options.width;
    const h = this.options.height;

    // Card frame
    this.bgGfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x050e1c, alpha: 0.85 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Track for bar
    const barY = 28;
    const barW = w - UI_SPACING.SM * 2;
    const barH = 10;
    this.bgGfx.roundRect(UI_SPACING.SM, barY, barW, barH, UI_RADIUS.XS);
    this.bgGfx.fill({ color: 0x020713, alpha: 0.9 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 0.8 });
  }

  private drawMeter(val: number, color: number): void {
    this.meterGfx.clear();

    const w = this.options.width;
    const barY = 28;
    const barW = w - UI_SPACING.SM * 2;
    const barH = 10;

    const ratio = Math.max(0, Math.min(1, (val - this.options.min) / (this.options.max - this.options.min)));
    const fillW = Math.max(2, barW * ratio);

    this.meterGfx.roundRect(UI_SPACING.SM, barY, fillW, barH, UI_RADIUS.XS);
    this.meterGfx.fill({ color, alpha: 0.9 });

    // Subtle highlight glow line
    this.meterGfx.rect(UI_SPACING.SM, barY, fillW, 2);
    this.meterGfx.fill({ color: 0xffffff, alpha: 0.35 });
  }

  private drawMeterUnavailable(): void {
    this.meterGfx.clear();
    const w = this.options.width;
    const barY = 28;
    const barW = w - UI_SPACING.SM * 2;
    const barH = 10;

    // Dashed or hatched pattern indicating offline/unavailable
    const segmentWidth = 8;
    const count = Math.floor(barW / (segmentWidth * 2));
    for (let i = 0; i < count; i++) {
      const x = UI_SPACING.SM + i * (segmentWidth * 2);
      this.meterGfx.rect(x, barY + 1, segmentWidth, barH - 2);
      this.meterGfx.fill({ color: UI_COLORS.TEXT_MUTED, alpha: 0.25 });
    }
  }

  public getIsAvailable(): boolean {
    return this.isAvailable;
  }

  public getCurrentValue(): number | undefined {
    return this.currentValue;
  }
}
