/**
 * INTERSTELLAR CONTINUUM - Payload Capacity Indicator
 * Visual telemetry gauge presenting Mass, Power, and Storage capacity bars,
 * real-time usage ratios, warning thresholds, and overload alerts.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../ui/core/UIDesignTokens';
import { RemainingCapacityMetrics, VehicleCapacity } from '../PayloadTypes';

export interface CapacityIndicatorOptions {
  width?: number;
  height?: number;
}

export class PayloadCapacityIndicator {
  public readonly container: Container;
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private barGfx: Graphics;

  private massText: Text;
  private powerText: Text;
  private storageText: Text;
  private statusText: Text;

  constructor(options: CapacityIndicatorOptions = {}) {
    this.width = options.width ?? 480;
    this.height = options.height ?? 170;
    this.container = new Container();

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    this.barGfx = new Graphics();
    this.container.addChild(this.barGfx);

    const labelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.0,
    });

    const valStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.TEXT_SECONDARY,
    });

    const header = new Text({
      text: 'VEHICLE PAYLOAD ENVELOPE',
      style: labelStyle,
    });
    header.position.set(UI_SPACING.MD, UI_SPACING.SM);
    this.container.addChild(header);

    this.massText = new Text({ text: 'Mass: 0 / 0 MU (0%)', style: valStyle });
    this.massText.position.set(UI_SPACING.MD, 38);
    this.container.addChild(this.massText);

    this.powerText = new Text({ text: 'Power: 0 / 0 PWR (0%)', style: valStyle });
    this.powerText.position.set(UI_SPACING.MD, 76);
    this.container.addChild(this.powerText);

    this.storageText = new Text({ text: 'Slots: 0 / 0 (0%)', style: valStyle });
    this.storageText.position.set(UI_SPACING.MD, 114);
    this.container.addChild(this.storageText);

    this.statusText = new Text({
      text: 'CAPACITY: NOMINAL',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_SUCCESS,
      }),
    });
    this.statusText.position.set(UI_SPACING.MD, 146);
    this.container.addChild(this.statusText);

    this.renderBackground();
  }

  private renderBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.MD);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.95 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1 });
  }

  public updateCapacity(metrics: RemainingCapacityMetrics, capacity: VehicleCapacity): void {
    const usedMass = capacity.maxPayloadMassRating - metrics.remainingMassRating;
    const usedPower = capacity.maxPowerRating - metrics.remainingPowerRating;
    const usedStorage = capacity.maxStorageSlots - metrics.remainingStorageSlots;

    const massPct = Math.round(metrics.massCapacityRatio * 100);
    const powerPct = Math.round(metrics.powerCapacityRatio * 100);
    const storagePct = Math.round(metrics.storageCapacityRatio * 100);

    this.massText.text = `Mass: ${usedMass} / ${capacity.maxPayloadMassRating} MU (${massPct}%)`;
    this.powerText.text = `Power: ${usedPower} / ${capacity.maxPowerRating} PWR (${powerPct}%)`;
    this.storageText.text = `Slots: ${usedStorage} / ${capacity.maxStorageSlots} (${storagePct}%)`;

    if (!metrics.isFullyWithinLimits) {
      this.statusText.text = 'CAPACITY: OVERLOADED';
      this.statusText.style.fill = UI_COLORS.TEXT_DANGER;
    } else if (metrics.massCapacityRatio >= 0.85 || metrics.powerCapacityRatio >= 0.85) {
      this.statusText.text = 'CAPACITY: HEAVY LOAD';
      this.statusText.style.fill = UI_COLORS.TEXT_WARNING;
    } else {
      this.statusText.text = 'CAPACITY: NOMINAL';
      this.statusText.style.fill = UI_COLORS.TEXT_SUCCESS;
    }

    // Render Progress Bars
    this.barGfx.clear();
    const barX = 220;
    const barWidth = this.width - barX - UI_SPACING.MD;
    const barHeight = 8;

    this.renderSingleBar(barX, 42, barWidth, barHeight, metrics.massCapacityRatio, metrics.isWithinMassLimit);
    this.renderSingleBar(barX, 80, barWidth, barHeight, metrics.powerCapacityRatio, metrics.isWithinPowerLimit);
    this.renderSingleBar(barX, 118, barWidth, barHeight, metrics.storageCapacityRatio, metrics.isWithinStorageLimit);
  }

  private renderSingleBar(
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
    isWithinLimit: boolean
  ): void {
    // Background track
    this.barGfx.roundRect(x, y, width, height, UI_RADIUS.XS);
    this.barGfx.fill({ color: UI_COLORS.BG_DARK, alpha: 0.8 });

    // Filled portion
    const clampedRatio = Math.max(0, Math.min(1.0, ratio));
    const fillWidth = Math.max(2, width * clampedRatio);

    let color = UI_COLORS.CYAN;
    if (!isWithinLimit || ratio > 1.0) {
      color = UI_COLORS.RED;
    } else if (ratio >= 0.85) {
      color = UI_COLORS.AMBER;
    }

    this.barGfx.roundRect(x, y, fillWidth, height, UI_RADIUS.XS);
    this.barGfx.fill({ color, alpha: 1.0 });
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
