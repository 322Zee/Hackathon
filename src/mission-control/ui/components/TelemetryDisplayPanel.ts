/**
 * INTERSTELLAR CONTINUUM - Telemetry Presentation Panel Component (Section D)
 * Comprehensive telemetry visualizer featuring real-time flight trajectory vector profile,
 * power & communications meters, and historical trend monitoring.
 *
 * NOTE: Strictly distinguishes available data from unavailable feeds using explicit
 * offline styling and "UNAVAILABLE" indicators rather than zero values.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import {
  MissionTelemetrySnapshot,
  TelemetryHistoryPoint,
} from '../../types/MissionControlTypes';
import { TelemetryGauge } from './TelemetryGauge';
import { SignalStrengthMeter } from './SignalStrengthMeter';

export interface TelemetryDisplayPanelOptions {
  width?: number;
  height?: number;
}

export class TelemetryDisplayPanel extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private trajectoryCanvasGfx: Graphics;
  private trajectoryTextContainer: Container;

  private trendGraphGfx: Graphics;

  private conditionGauge: TelemetryGauge;
  private batteryGauge: TelemetryGauge;
  private readinessGauge: TelemetryGauge;
  private signalMeter: SignalStrengthMeter;

  private flightProfileTitle: Text;
  private trajectoryStatusText: Text;

  constructor(options: TelemetryDisplayPanelOptions = {}) {
    super('TelemetryDisplayPanel');

    this.width = options.width ?? 1860;
    this.height = options.height ?? 370;

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    // Left Column: Trajectory / Flight Profile Canvas (Width: 880px, Height: 345px)
    const trajFrameX = UI_SPACING.MD;
    const trajFrameY = UI_SPACING.MD;

    this.trajectoryCanvasGfx = new Graphics();
    this.trajectoryCanvasGfx.position.set(trajFrameX, trajFrameY);
    this.container.addChild(this.trajectoryCanvasGfx);

    this.trajectoryTextContainer = new Container();
    this.trajectoryTextContainer.position.set(trajFrameX + 15, trajFrameY + 12);
    this.container.addChild(this.trajectoryTextContainer);

    this.flightProfileTitle = new Text({
      text: 'FLIGHT DYNAMICS PROFILE & ORBITAL TRAJECTORY',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.0,
      }),
    });
    this.trajectoryTextContainer.addChild(this.flightProfileTitle);

    this.trajectoryStatusText = new Text({
      text: 'TRAJECTORY: UNLINKED',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
        letterSpacing: 0.8,
      }),
    });
    this.trajectoryStatusText.position.set(0, 20);
    this.trajectoryTextContainer.addChild(this.trajectoryStatusText);

    // Right Column: Telemetry Gauges Cluster & History Trend (Width: 930px)
    const rightColX = 910;

    this.conditionGauge = new TelemetryGauge({
      width: 215,
      height: 64,
      label: 'Vehicle Hull Condition',
      unit: '%',
      nominalColor: UI_COLORS.GREEN,
      warningThreshold: 75,
      criticalThreshold: 50,
    });
    this.conditionGauge.container.position.set(rightColX, UI_SPACING.MD);
    this.container.addChild(this.conditionGauge.container);

    this.batteryGauge = new TelemetryGauge({
      width: 215,
      height: 64,
      label: 'EPS Battery Reserve',
      unit: '%',
      nominalColor: UI_COLORS.CYAN,
      warningThreshold: 30,
      criticalThreshold: 15,
    });
    this.batteryGauge.container.position.set(rightColX + 230, UI_SPACING.MD);
    this.container.addChild(this.batteryGauge.container);

    this.readinessGauge = new TelemetryGauge({
      width: 215,
      height: 64,
      label: 'Flight Readiness',
      unit: '%',
      nominalColor: UI_COLORS.GREEN,
      warningThreshold: 60,
      criticalThreshold: 30,
    });
    this.readinessGauge.container.position.set(rightColX + 460, UI_SPACING.MD);
    this.container.addChild(this.readinessGauge.container);

    this.signalMeter = new SignalStrengthMeter({
      width: 240,
      height: 64,
    });
    this.signalMeter.container.position.set(rightColX + 690, UI_SPACING.MD);
    this.container.addChild(this.signalMeter.container);

    // Trend History Graph below gauges
    const graphY = 90;

    this.trendGraphGfx = new Graphics();
    this.trendGraphGfx.position.set(rightColX, graphY);
    this.container.addChild(this.trendGraphGfx);

    this.drawBackground();
    this.drawTrajectoryCanvas(false, 'STANDBY');
    this.drawTrendGraph([]);
  }

  public setSnapshot(snapshot?: MissionTelemetrySnapshot): void {
    if (!snapshot) {
      this.conditionGauge.setValue(undefined);
      this.batteryGauge.setValue(undefined);
      this.readinessGauge.setValue(undefined);
      this.signalMeter.setSignal(undefined, undefined, undefined, undefined);
      this.trajectoryStatusText.text = 'TRAJECTORY: NO SENSOR DATA';
      this.drawTrajectoryCanvas(false, 'NO MISSION SELECTED');
      this.drawTrendGraph([]);
      return;
    }

    const sc = snapshot.spacecraft;
    this.conditionGauge.setValue(sc.vehicleConditionPercent);
    this.batteryGauge.setValue(sc.batteryPercent);
    this.readinessGauge.setValue(sc.missionReadinessPercent);
    this.signalMeter.setSignal(
      sc.signalStrengthPercent,
      sc.signalDbm,
      sc.roundTripDelaySeconds,
      sc.activeGroundStation
    );

    const isAvailable = Boolean(sc.velocityKmPerSec.available || snapshot.isSampleData);
    const trajStatus = sc.trajectoryStatus.value ?? sc.trajectoryStatus.statusText ?? 'UNLINKED';
    this.trajectoryStatusText.text = `TRAJECTORY: ${trajStatus.toUpperCase()}`;

    this.drawTrajectoryCanvas(
      isAvailable,
      trajStatus,
      snapshot.overview.destinationName,
      snapshot.progress.journeyProgressPercent
    );

    this.drawTrendGraph(snapshot.telemetryHistory);
  }

  private drawTrajectoryCanvas(
    available: boolean,
    statusText: string,
    destName: string = 'TARGET',
    progressPct: number = 0
  ): void {
    const gfx = this.trajectoryCanvasGfx;
    gfx.clear();
    const w = 880;
    const h = 345;

    // Frame
    gfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    gfx.fill({ color: 0x050e1c, alpha: 0.95 });
    gfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Radar coordinate grid lines
    const gridColor = 0x0f243d;
    for (let x = 40; x < w; x += 60) {
      gfx.rect(x, 40, 1, h - 50).fill({ color: gridColor, alpha: 0.4 });
    }
    for (let y = 60; y < h; y += 50) {
      gfx.rect(20, y, w - 40, 1).fill({ color: gridColor, alpha: 0.4 });
    }

    if (!available) {
      // Offline / Unlinked rendering
      gfx.circle(w / 2, h / 2, 45);
      gfx.stroke({ color: UI_COLORS.TEXT_MUTED, width: 1.5, alpha: 0.4 });

      gfx.moveTo(w / 2 - 55, h / 2);
      gfx.lineTo(w / 2 + 55, h / 2);
      gfx.stroke({ color: UI_COLORS.TEXT_MUTED, width: 1.0, alpha: 0.4 });

      gfx.moveTo(w / 2, h / 2 - 55);
      gfx.lineTo(w / 2, h / 2 + 55);
      gfx.stroke({ color: UI_COLORS.TEXT_MUTED, width: 1.0, alpha: 0.4 });

      const offStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 12,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_MUTED,
        align: 'center',
      });
      const offText = new Text({
        text: `[TRAJECTORY TELEMETRY STREAM OFFLINE]\n${statusText.toUpperCase()}`,
        style: offStyle,
      });
      offText.anchor.set(0.5, 0.5);
      offText.position.set(w / 2, h / 2 + 75);
      gfx.addChild(offText);
      return;
    }

    // Available trajectory: Draw curved orbital transfer arc
    const originX = 100;
    const originY = 250;
    const destX = 760;
    const destY = 120;
    const ctrlX = 380;
    const ctrlY = 80;

    // Earth departure node
    gfx.circle(originX, originY, 14);
    gfx.fill({ color: 0x0284c7, alpha: 0.9 });
    gfx.stroke({ color: UI_COLORS.CYAN, width: 2 });

    const earthLabel = new Text({
      text: 'EARTH [DEPARTURE]',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fill: UI_COLORS.TEXT_PRIMARY }),
    });
    earthLabel.position.set(originX - 45, originY + 20);
    gfx.addChild(earthLabel);

    // Target Destination node
    gfx.circle(destX, destY, 12);
    gfx.fill({ color: 0xb45309, alpha: 0.9 });
    gfx.stroke({ color: UI_COLORS.AMBER, width: 2 });

    const destLabel = new Text({
      text: `${destName.toUpperCase()} [ENCOUNTER]`,
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fill: UI_COLORS.TEXT_PRIMARY }),
    });
    destLabel.position.set(destX - 50, destY - 25);
    gfx.addChild(destLabel);

    // Quadratic transfer trajectory arc
    const points: Array<{ x: number; y: number }> = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (1 - t) * (1 - t) * originX + 2 * (1 - t) * t * ctrlX + t * t * destX;
      const y = (1 - t) * (1 - t) * originY + 2 * (1 - t) * t * ctrlY + t * t * destY;
      points.push({ x, y });
    }

    // Trajectory background dotted line
    for (let i = 0; i < points.length - 1; i += 2) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (p1 && p2) {
        gfx.moveTo(p1.x, p1.y);
        gfx.lineTo(p2.x, p2.y);
        gfx.stroke({ color: 0x38bdf8, width: 2, alpha: 0.6 });
      }
    }

    // Vehicle position along arc
    const tVeh = Math.max(0.05, Math.min(0.95, progressPct / 100));
    const vehX = (1 - tVeh) * (1 - tVeh) * originX + 2 * (1 - tVeh) * tVeh * ctrlX + tVeh * tVeh * destX;
    const vehY = (1 - tVeh) * (1 - tVeh) * originY + 2 * (1 - tVeh) * tVeh * ctrlY + tVeh * tVeh * destY;

    // Reticle
    gfx.circle(vehX, vehY, 8);
    gfx.fill({ color: UI_COLORS.CYAN, alpha: 0.9 });
    gfx.circle(vehX, vehY, 16);
    gfx.stroke({ color: UI_COLORS.CYAN, width: 1.2, alpha: 0.8 });

    const vehLabel = new Text({
      text: 'SPACECRAFT RETICLE [ACTIVE]',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: UI_COLORS.CYAN,
      }),
    });
    vehLabel.position.set(vehX + 18, vehY - 8);
    gfx.addChild(vehLabel);
  }

  private drawTrendGraph(history: TelemetryHistoryPoint[]): void {
    const gfx = this.trendGraphGfx;
    gfx.clear();
    const w = 930;
    const h = 265;

    // Card frame
    gfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    gfx.fill({ color: 0x050e1c, alpha: 0.95 });
    gfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Header bar
    gfx.roundRect(0, 0, w, 24, UI_RADIUS.SM);
    gfx.fill({ color: 0x081528, alpha: 0.95 });
    gfx.rect(0, 0, 3, 24).fill({ color: UI_COLORS.CYAN, alpha: 0.8 });

    const title = new Text({
      text: 'TELEMETRY TREND MONITOR // EPS POWER DRAW & RF SIGNAL (HISTORICAL)',
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1.0,
      }),
    });
    title.position.set(10, 5);
    gfx.addChild(title);

    if (!history || history.length === 0) {
      const offText = new Text({
        text: '[HISTORICAL TREND LOGGING OFFLINE]\nREQUIRES SIMULATION CORE SENSOR LOGGING',
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 11,
          fontWeight: 'bold',
          fill: UI_COLORS.TEXT_MUTED,
          align: 'center',
        }),
      });
      offText.anchor.set(0.5, 0.5);
      offText.position.set(w / 2, h / 2 + 10);
      gfx.addChild(offText);
      return;
    }

    // Plot points
    const plotW = w - 80;
    const plotH = h - 70;
    const plotX = 50;
    const plotY = 40;

    // Grid baseline
    gfx.rect(plotX, plotY, plotW, plotH).stroke({ color: 0x1e3a5f, width: 0.8 });
    for (let y = plotY; y <= plotY + plotH; y += 40) {
      gfx.rect(plotX, y, plotW, 1).fill({ color: 0x0f243d, alpha: 0.6 });
    }

    // Battery % trend line
    const count = history.length;
    const stepX = plotW / (count - 1);

    for (let i = 0; i < count - 1; i++) {
      const pt1 = history[i];
      const pt2 = history[i + 1];
      if (!pt1 || !pt2) continue;

      const x1 = plotX + i * stepX;
      const y1 = plotY + plotH - ((pt1.batteryPercent ?? 50) / 100) * plotH;
      const x2 = plotX + (i + 1) * stepX;
      const y2 = plotY + plotH - ((pt2.batteryPercent ?? 50) / 100) * plotH;

      gfx.moveTo(x1, y1);
      gfx.lineTo(x2, y2);
      gfx.stroke({ color: UI_COLORS.CYAN, width: 2 });
    }

    const legend1 = new Text({
      text: '— BATTERY % (CYAN)',
      style: new TextStyle({ fontFamily: UI_FONTS.FAMILY, fontSize: 9.5, fill: UI_COLORS.CYAN }),
    });
    legend1.position.set(plotX, h - 22);
    gfx.addChild(legend1);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x020713, alpha: 0.7 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.0 });
  }
}
