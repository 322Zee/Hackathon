/**
 * INTERSTELLAR CONTINUUM - Spacecraft Systems Status Panel Component (Section B)
 * Authoritative monitoring panel displaying vehicle structural condition, electrical power,
 * communications telemetry, payload integration status, navigation, and system warnings.
 *
 * NOTE: Strictly distinguishes available data from unavailable feeds using explicit
 * offline/unlinked rendering rather than zero values.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { SpacecraftStatusTelemetry, TelemetryValue } from '../../types/MissionControlTypes';
import { TelemetryGauge } from './TelemetryGauge';
import { SignalStrengthMeter } from './SignalStrengthMeter';

export interface SpacecraftStatusPanelOptions {
  width?: number;
  height?: number;
}

export class SpacecraftStatusPanel extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;

  // Cards
  private vehicleCard: Container;
  private powerCard: Container;
  private commsCard: Container;
  private payloadCard: Container;
  private navCard: Container;
  private readinessCard: Container;

  // Gauges
  private conditionGauge: TelemetryGauge;
  private batteryGauge: TelemetryGauge;
  private payloadHealthGauge: TelemetryGauge;
  private readinessGauge: TelemetryGauge;
  private signalMeter: SignalStrengthMeter;

  // Readout text elements
  private vehicleNameText: Text;
  private vehicleTypeText: Text;
  private thermalText: Text;

  private powerGenText: Text;
  private powerDrawText: Text;
  private powerStateText: Text;

  private commsRatesText: Text;
  private commsStateText: Text;

  private payloadTypeText: Text;
  private payloadMassText: Text;
  private payloadDeployedText: Text;
  private payloadInstrumentsText: Text;

  private velocityText: Text;
  private distanceText: Text;
  private trajectoryText: Text;
  private orbitText: Text;

  private warningsContainer: Container;

  constructor(options: SpacecraftStatusPanelOptions = {}) {
    super('SpacecraftStatusPanel');

    this.width = options.width ?? 1860;
    this.height = options.height ?? 370;

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    // Initialize 6 cards
    const cardW = 590;
    const cardH = 170;
    const col2X = 635;
    const col3X = 1250;
    const row2Y = 190;

    this.vehicleCard = new Container();
    this.vehicleCard.position.set(UI_SPACING.MD, UI_SPACING.MD);
    this.container.addChild(this.vehicleCard);

    this.powerCard = new Container();
    this.powerCard.position.set(col2X, UI_SPACING.MD);
    this.container.addChild(this.powerCard);

    this.commsCard = new Container();
    this.commsCard.position.set(col3X, UI_SPACING.MD);
    this.container.addChild(this.commsCard);

    this.payloadCard = new Container();
    this.payloadCard.position.set(UI_SPACING.MD, row2Y);
    this.container.addChild(this.payloadCard);

    this.navCard = new Container();
    this.navCard.position.set(col2X, row2Y);
    this.container.addChild(this.navCard);

    this.readinessCard = new Container();
    this.readinessCard.position.set(col3X, row2Y);
    this.container.addChild(this.readinessCard);

    // 1. Vehicle Card
    this.drawCardFrame(this.vehicleCard, cardW, cardH, 'VEHICLE CONDITION & STRUCTURE');
    this.conditionGauge = new TelemetryGauge({
      width: 250,
      height: 64,
      label: 'Hull Structural Health',
      unit: '%',
      nominalColor: UI_COLORS.GREEN,
      warningThreshold: 75,
      criticalThreshold: 50,
    });
    this.conditionGauge.container.position.set(15, 35);
    this.vehicleCard.addChild(this.conditionGauge.container);

    this.vehicleNameText = this.createText(this.vehicleCard, 280, 40, 'DESIGNATION: --');
    this.vehicleTypeText = this.createText(this.vehicleCard, 280, 65, 'SPACECRAFT CLASS: --');
    this.thermalText = this.createText(this.vehicleCard, 15, 115, 'THERMAL STATE: --');

    // 2. Power Card
    this.drawCardFrame(this.powerCard, cardW, cardH, 'ELECTRICAL POWER SUBSYSTEM (EPS)');
    this.batteryGauge = new TelemetryGauge({
      width: 250,
      height: 64,
      label: 'Main Battery Reserve',
      unit: '%',
      nominalColor: UI_COLORS.CYAN,
      warningThreshold: 30,
      criticalThreshold: 15,
    });
    this.batteryGauge.container.position.set(15, 35);
    this.powerCard.addChild(this.batteryGauge.container);

    this.powerGenText = this.createText(this.powerCard, 280, 40, 'GENERATION: --');
    this.powerDrawText = this.createText(this.powerCard, 280, 65, 'BUS DRAW: --');
    this.powerStateText = this.createText(this.powerCard, 15, 115, 'POWER MODE: --');

    // 3. Communications Card
    this.drawCardFrame(this.commsCard, cardW, cardH, 'COMMUNICATIONS & TELEMETRY (RF/DSN)');
    this.signalMeter = new SignalStrengthMeter({
      width: 260,
      height: 80,
    });
    this.signalMeter.container.position.set(15, 35);
    this.commsCard.addChild(this.signalMeter.container);

    this.commsRatesText = this.createText(this.commsCard, 290, 40, 'DATA RATES: --');
    this.commsStateText = this.createText(this.commsCard, 290, 70, 'CARRIER: --');

    // 4. Payload Card
    this.drawCardFrame(this.payloadCard, cardW, cardH, 'PAYLOAD & INSTRUMENTATION ENVELOPE');
    this.payloadHealthGauge = new TelemetryGauge({
      width: 250,
      height: 64,
      label: 'Payload Module Health',
      unit: '%',
      nominalColor: UI_COLORS.PURPLE,
      warningThreshold: 80,
      criticalThreshold: 50,
    });
    this.payloadHealthGauge.container.position.set(15, 35);
    this.payloadCard.addChild(this.payloadHealthGauge.container);

    this.payloadTypeText = this.createText(this.payloadCard, 280, 40, 'PAYLOAD CLASS: --');
    this.payloadMassText = this.createText(this.payloadCard, 280, 65, 'NET MASS: --');
    this.payloadDeployedText = this.createText(this.payloadCard, 15, 115, 'DEPLOYMENT: --');
    this.payloadInstrumentsText = this.createText(this.payloadCard, 280, 115, 'INSTRUMENTS: --');

    // 5. Navigation Card
    this.drawCardFrame(this.navCard, cardW, cardH, 'FLIGHT DYNAMICS & NAVIGATION (GNC)');
    this.velocityText = this.createText(this.navCard, 15, 40, 'VELOCITY: --');
    this.distanceText = this.createText(this.navCard, 280, 40, 'TARGET RANGE: --');
    this.trajectoryText = this.createText(this.navCard, 15, 75, 'TRAJECTORY: --');
    this.orbitText = this.createText(this.navCard, 15, 115, 'REGIME: --');

    // 6. Readiness & Warnings Card
    this.drawCardFrame(this.readinessCard, cardW, cardH, 'SYSTEM READINESS & CAUTIONS');
    this.readinessGauge = new TelemetryGauge({
      width: 220,
      height: 64,
      label: 'Subsystems Readiness',
      unit: '%',
      nominalColor: UI_COLORS.GREEN,
      warningThreshold: 60,
      criticalThreshold: 30,
    });
    this.readinessGauge.container.position.set(15, 35);
    this.readinessCard.addChild(this.readinessGauge.container);

    this.warningsContainer = new Container();
    this.warningsContainer.position.set(250, 35);
    this.readinessCard.addChild(this.warningsContainer);

    this.drawBackground();
  }

  public setTelemetry(telemetry?: SpacecraftStatusTelemetry): void {
    if (!telemetry) {
      this.conditionGauge.setValue(undefined);
      this.batteryGauge.setValue(undefined);
      this.payloadHealthGauge.setValue(undefined);
      this.readinessGauge.setValue(undefined);
      this.signalMeter.setSignal(undefined, undefined, undefined, undefined);
      return;
    }

    // 1. Vehicle
    this.conditionGauge.setValue(telemetry.vehicleConditionPercent);
    this.setTextValue(this.vehicleNameText, 'DESIGNATION', telemetry.vehicleName);
    this.setTextValue(this.vehicleTypeText, 'SPACECRAFT CLASS', telemetry.spacecraftType);
    this.setTextValue(this.thermalText, 'THERMAL STATE', telemetry.thermalStatus);

    // 2. Power
    this.batteryGauge.setValue(telemetry.batteryPercent);
    this.setTextValue(this.powerGenText, 'GENERATION', telemetry.powerGenerationWatts, 'W');
    this.setTextValue(this.powerDrawText, 'BUS DRAW', telemetry.powerDrawWatts, 'W');
    this.setTextValue(this.powerStateText, 'POWER MODE', telemetry.powerSystemState);

    // 3. Comms
    this.signalMeter.setSignal(
      telemetry.signalStrengthPercent,
      telemetry.signalDbm,
      telemetry.roundTripDelaySeconds,
      telemetry.activeGroundStation
    );

    const upVal = telemetry.uplinkRateKbps.available ? `${telemetry.uplinkRateKbps.value} kbps` : 'N/A';
    const downVal = telemetry.downlinkRateKbps.available ? `${telemetry.downlinkRateKbps.value} kbps` : 'N/A';
    this.commsRatesText.text = `DATA RATES: UP ${upVal} // DOWN ${downVal}`;
    this.setTextValue(this.commsStateText, 'CARRIER', telemetry.commsState);

    // 4. Payload
    this.payloadHealthGauge.setValue(telemetry.payloadHealthPercent);
    this.setTextValue(this.payloadTypeText, 'PAYLOAD CLASS', telemetry.payloadType);
    this.setTextValue(this.payloadMassText, 'NET MASS', telemetry.payloadMassKg, 'KG');

    const deployedVal = telemetry.payloadDeployed.available
      ? telemetry.payloadDeployed.value ? 'DEPLOYED / RELEASED' : 'STOWED IN BUS'
      : telemetry.payloadDeployed.statusText ?? 'UNLINKED';
    this.payloadDeployedText.text = `DEPLOYMENT: ${deployedVal}`;
    this.setTextValue(this.payloadInstrumentsText, 'INSTRUMENTS', telemetry.payloadInstrumentsActive);

    // 5. Navigation
    this.setTextValue(this.velocityText, 'VELOCITY', telemetry.velocityKmPerSec, 'km/s');
    this.setTextValue(this.distanceText, 'TARGET RANGE', telemetry.distanceToDestinationKm, 'KM');
    this.setTextValue(this.trajectoryText, 'TRAJECTORY', telemetry.trajectoryStatus);
    this.setTextValue(this.orbitText, 'REGIME', telemetry.orbitalRegime);

    // 6. Readiness & Warnings
    this.readinessGauge.setValue(telemetry.missionReadinessPercent);
    this.renderWarnings(telemetry.systemWarnings);
  }

  private renderWarnings(warnings: string[]): void {
    this.warningsContainer.removeChildren();

    if (!warnings || warnings.length === 0) {
      const okStyle = new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: 10,
        fontWeight: 'bold',
        fill: UI_COLORS.GREEN,
      });
      const okText = new Text({
        text: 'SYSTEM STATUS: NOMINAL\nALL CHECKOUTS VERIFIED',
        style: okStyle,
      });
      this.warningsContainer.addChild(okText);
      return;
    }

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.AMBER,
    });
    const title = new Text({
      text: `ACTIVE SYSTEM CAUTIONS (${warnings.length}):`,
      style: titleStyle,
    });
    this.warningsContainer.addChild(title);

    let curY = 16;
    for (let i = 0; i < Math.min(3, warnings.length); i++) {
      const wText = new Text({
        text: `! ${warnings[i]}`,
        style: new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fill: UI_COLORS.TEXT_WARNING,
        }),
      });
      wText.position.set(0, curY);
      this.warningsContainer.addChild(wText);
      curY += 14;
    }
  }

  private createText(parent: Container, x: number, y: number, text: string): Text {
    const style = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10.5,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_SECONDARY,
      letterSpacing: 0.8,
    });
    const label = new Text({ text, style });
    label.position.set(x, y);
    parent.addChild(label);
    return label;
  }

  private setTextValue<T>(
    textElement: Text,
    prefix: string,
    telemetry: TelemetryValue<T>,
    unit?: string
  ): void {
    if (!telemetry || !telemetry.available) {
      textElement.text = `${prefix}: ${telemetry?.statusText ?? 'UNLINKED'}`;
      textElement.style.fill = UI_COLORS.TEXT_MUTED;
      return;
    }

    const valStr = telemetry.value !== undefined ? String(telemetry.value) : 'NOMINAL';
    const unitStr = unit ? ` ${unit}` : telemetry.unit ? ` ${telemetry.unit}` : '';
    textElement.text = `${prefix}: ${valStr}${unitStr}`;
    textElement.style.fill = UI_COLORS.TEXT_HIGHLIGHT;
  }

  private drawCardFrame(parent: Container, w: number, h: number, title: string): void {
    const gfx = new Graphics();
    gfx.roundRect(0, 0, w, h, UI_RADIUS.SM);
    gfx.fill({ color: 0x050e1c, alpha: 0.9 });
    gfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Header bar
    gfx.roundRect(0, 0, w, 24, UI_RADIUS.SM);
    gfx.fill({ color: 0x081528, alpha: 0.95 });
    gfx.rect(0, 0, 3, 24).fill({ color: UI_COLORS.CYAN, alpha: 0.8 });

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.0,
    });
    const titleText = new Text({ text: title, style: titleStyle });
    titleText.position.set(10, 5);
    gfx.addChild(titleText);

    parent.addChildAt(gfx, 0);
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x020713, alpha: 0.7 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1.0 });
  }
}
