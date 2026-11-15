/**
 * INTERSTELLAR CONTINUUM - Deep Space Signal Strength Meter Component
 * Visual 5-segment radio carrier indicator, signal-to-noise dBm readout,
 * round-trip light time delay, and ground station tracking state.
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { TelemetryValue } from '../../types/MissionControlTypes';

export interface SignalStrengthMeterOptions {
  width?: number;
  height?: number;
}

export class SignalStrengthMeter extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private barsGfx: Graphics;
  private headerText: Text;
  private dbmText: Text;
  private delayText: Text;
  private stationText: Text;

  constructor(options: SignalStrengthMeterOptions = {}) {
    super('SignalStrengthMeter');

    this.width = options.width ?? 280;
    this.height = options.height ?? 88;

    this.bgGfx = new Graphics();
    this.barsGfx = new Graphics();
    this.container.addChild(this.bgGfx);
    this.container.addChild(this.barsGfx);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 1.0,
    });
    this.headerText = new Text({
      text: 'RADIO RF LINK TELEMETRY',
      style: titleStyle,
    });
    this.headerText.position.set(UI_SPACING.SM, 8);
    this.container.addChild(this.headerText);

    const dbmStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 0.5,
    });
    this.dbmText = new Text({
      text: '-- dBm',
      style: dbmStyle,
    });
    this.dbmText.position.set(this.width - UI_SPACING.SM, 8);
    this.dbmText.anchor.set(1, 0);
    this.container.addChild(this.dbmText);

    const delayStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_SECONDARY,
    });
    this.delayText = new Text({
      text: 'DELAY: --',
      style: delayStyle,
    });
    this.delayText.position.set(UI_SPACING.SM, this.height - 30);
    this.container.addChild(this.delayText);

    const stationStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9.5,
      fill: UI_COLORS.TEXT_MUTED,
    });
    this.stationText = new Text({
      text: 'STATION: --',
      style: stationStyle,
    });
    this.stationText.position.set(UI_SPACING.SM, this.height - 16);
    this.container.addChild(this.stationText);

    this.drawBackground();
    this.drawBars(0, false);
  }

  public setSignal(
    signalPercent?: TelemetryValue<number>,
    signalDbm?: TelemetryValue<number>,
    delaySec?: TelemetryValue<number>,
    station?: TelemetryValue<string>
  ): void {
    const isAvailable = Boolean(signalPercent?.available && typeof signalPercent.value === 'number');

    if (!isAvailable) {
      this.dbmText.text = 'NO CARRIER';
      this.dbmText.style.fill = UI_COLORS.TEXT_MUTED;
      this.delayText.text = `DELAY: ${delaySec?.statusText ?? 'UNLINKED'}`;
      this.delayText.style.fill = UI_COLORS.TEXT_MUTED;
      this.stationText.text = `TRACKING: ${station?.statusText ?? 'UNLINKED'}`;
      this.drawBars(0, false);
      return;
    }

    const val = signalPercent!.value!;
    this.dbmText.text = signalDbm?.value ? `${signalDbm.value} dBm` : `${val}%`;
    this.dbmText.style.fill = val < 25 ? UI_COLORS.RED : val < 50 ? UI_COLORS.AMBER : UI_COLORS.GREEN;

    if (delaySec?.value !== undefined) {
      const delay = delaySec.value;
      if (delay < 60) {
        this.delayText.text = `ROUND-TRIP LIGHT DELAY: ${delay.toFixed(1)}s`;
      } else {
        const mins = (delay / 60).toFixed(1);
        this.delayText.text = `ROUND-TRIP LIGHT DELAY: ${mins}m`;
      }
      this.delayText.style.fill = UI_COLORS.TEXT_SECONDARY;
    } else {
      this.delayText.text = 'DELAY: NOMINAL LEO';
    }

    this.stationText.text = `TRACKING: ${station?.value ?? 'DSN STATION 1'}`;
    this.stationText.style.fill = UI_COLORS.TEXT_MUTED;

    this.drawBars(val, true);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x050e1c, alpha: 0.85 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });
  }

  private drawBars(pct: number, available: boolean): void {
    this.barsGfx.clear();

    const startX = UI_SPACING.SM;
    const startY = 32;
    const totalBars = 5;
    const barW = 10;
    const barGap = 4;
    const maxBarH = 20;

    const litBars = available ? Math.ceil((pct / 100) * totalBars) : 0;
    const activeColor = pct < 25 ? UI_COLORS.RED : pct < 50 ? UI_COLORS.AMBER : UI_COLORS.GREEN;

    for (let i = 0; i < totalBars; i++) {
      const barH = 6 + (i * ((maxBarH - 6) / (totalBars - 1)));
      const bx = startX + i * (barW + barGap);
      const by = startY + (maxBarH - barH);

      this.barsGfx.roundRect(bx, by, barW, barH, 2);
      if (i < litBars) {
        this.barsGfx.fill({ color: activeColor, alpha: 0.95 });
      } else {
        this.barsGfx.fill({ color: 0x1e293b, alpha: 0.5 });
        this.barsGfx.stroke({ color: 0x334155, width: 0.5 });
      }
    }
  }
}
