/**
 * INTERSTELLAR CONTINUUM - Rover Telemetry Panel
 * In-game HUD panel rendering vehicle vital statistics, power reserves,
 * communication fidelity, speed, and heading telemetry.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RoverRecord, RoverCommStatus, RoverOperationalStatus } from '../ExplorationTypes';
import { UI_COLORS } from '../../ui/core/UIDesignTokens';

export class RoverTelemetryPanel {
  public readonly container: Container = new Container();

  private background: Graphics = new Graphics();
  private titleText: Text;
  private modelBadgeText: Text;
  private energyBar: Graphics = new Graphics();
  private energyText: Text;
  private conditionBar: Graphics = new Graphics();
  private conditionText: Text;
  private speedText: Text;
  private headingText: Text;
  private commsBadgeText: Text;
  private statusText: Text;

  private readonly PANEL_WIDTH = 340;
  private readonly PANEL_HEIGHT = 210;

  constructor() {
    this.container.label = 'RoverTelemetryPanel';
    this.container.addChild(this.background);

    const baseStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: UI_COLORS.TEXT_PRIMARY as number,
    });

    const headerStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN as number,
      letterSpacing: 1,
    });

    const badgeStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fontWeight: 'bold',
      fill: UI_COLORS.BLUE as number,
    });

    this.titleText = new Text({ text: 'ROVER TELEMETRY // [STANDBY]', style: headerStyle });
    this.titleText.position.set(16, 12);
    this.container.addChild(this.titleText);

    this.modelBadgeText = new Text({ text: '[MODEL: SCOUT]', style: badgeStyle });
    this.modelBadgeText.position.set(16, 32);
    this.container.addChild(this.modelBadgeText);

    // Energy Readout
    this.energyText = new Text({ text: 'BATTERY RESERVE: 100%', style: baseStyle });
    this.energyText.position.set(16, 52);
    this.container.addChild(this.energyText);
    this.container.addChild(this.energyBar);

    // Condition Readout
    this.conditionText = new Text({ text: 'HULL INTEGRITY: 100%', style: baseStyle });
    this.conditionText.position.set(16, 88);
    this.container.addChild(this.conditionText);
    this.container.addChild(this.conditionBar);

    // Speed & Heading
    this.speedText = new Text({ text: 'SPEED: 0.0 m/s', style: baseStyle });
    this.speedText.position.set(16, 126);
    this.container.addChild(this.speedText);

    this.headingText = new Text({ text: 'HEADING: 000° [N]', style: baseStyle });
    this.headingText.position.set(170, 126);
    this.container.addChild(this.headingText);

    // Communications
    this.commsBadgeText = new Text({
      text: 'DSN LINK: CONNECTED (95%)',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: UI_COLORS.GREEN as any }),
    });
    this.commsBadgeText.position.set(16, 150);
    this.container.addChild(this.commsBadgeText);

    // Operational Status
    this.statusText = new Text({ text: 'MODE: MANUAL DRIVING', style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: UI_COLORS.TEXT_PRIMARY as any }) });
    this.statusText.position.set(16, 174);
    this.container.addChild(this.statusText);

    this.drawBackground();
  }

  private drawBackground(): void {
    this.background.clear();
    // Glass sci-fi backdrop
    this.background.roundRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 6);
    this.background.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.90 });
    this.background.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Corner decorative brackets
    this.background.moveTo(0, 12);
    this.background.lineTo(0, 0);
    this.background.lineTo(12, 0);
    this.background.stroke({ color: UI_COLORS.CYAN, width: 2.0 });

    this.background.moveTo(this.PANEL_WIDTH - 12, 0);
    this.background.lineTo(this.PANEL_WIDTH, 0);
    this.background.lineTo(this.PANEL_WIDTH, 12);
    this.background.stroke({ color: UI_COLORS.CYAN, width: 2.0 });
  }

  public updateTelemetry(rover: RoverRecord): void {
    this.titleText.text = `${rover.name.toUpperCase()}`;
    this.modelBadgeText.text = `[MODEL: ${rover.model}] // DEST: ${rover.destinationId}`;

    // Energy Bar
    const energyPercent = Math.max(0, Math.min(100, rover.energyRating));
    const powerSourceTag = rover.powerSource === 'RADIOISOTOPE_RTG' ? 'RTG' : 'SOLAR';
    this.energyText.text = `POWER RESERVE [${powerSourceTag}]: ${energyPercent.toFixed(0)}%`;

    this.energyBar.clear();
    this.energyBar.rect(16, 68, 308, 10);
    this.energyBar.fill({ color: 0x0f172a });
    this.energyBar.stroke({ color: 0x334155, width: 1.0 });

    const energyColor = energyPercent > 40 ? UI_COLORS.CYAN : energyPercent > 15 ? UI_COLORS.AMBER : UI_COLORS.RED;
    this.energyBar.rect(16, 68, (308 * energyPercent) / 100, 10);
    this.energyBar.fill({ color: energyColor });

    // Condition Bar
    const conditionPercent = Math.max(0, Math.min(100, rover.vehicleConditionRating));
    this.conditionText.text = `VEHICLE INTEGRITY: ${conditionPercent.toFixed(0)}%`;

    this.conditionBar.clear();
    this.conditionBar.rect(16, 104, 308, 10);
    this.conditionBar.fill({ color: 0x0f172a });
    this.conditionBar.stroke({ color: 0x334155, width: 1.0 });

    const conditionColor = conditionPercent > 50 ? UI_COLORS.GREEN : conditionPercent > 25 ? UI_COLORS.AMBER : UI_COLORS.RED;
    this.conditionBar.rect(16, 104, (308 * conditionPercent) / 100, 10);
    this.conditionBar.fill({ color: conditionColor });

    // Speed & Heading
    const speedMps = Math.abs(rover.speed) * 0.1;
    this.speedText.text = `SPEED: ${speedMps.toFixed(1)} m/s`;

    const heading = Math.round(rover.location.headingDeg);
    let cardinal = 'N';
    if (heading >= 45 && heading < 135) cardinal = 'E';
    else if (heading >= 135 && heading < 225) cardinal = 'S';
    else if (heading >= 225 && heading < 315) cardinal = 'W';

    this.headingText.text = `HEADING: ${String(heading).padStart(3, '0')}° [${cardinal}]`;

    // Communications
    let commColor: any = UI_COLORS.GREEN;
    if (rover.communicationStatus === RoverCommStatus.DISCONNECTED) commColor = UI_COLORS.RED;
    else if (rover.communicationStatus === RoverCommStatus.OCCLUDED || rover.communicationStatus === RoverCommStatus.INTERMITTENT) {
      commColor = UI_COLORS.AMBER;
    }
    this.commsBadgeText.text = `DSN LINK: ${rover.communicationStatus} (${rover.communicationFidelity.toFixed(0)}%)`;
    this.commsBadgeText.style.fill = commColor;

    // Operational Status
    if (rover.autonomousMode) {
      this.statusText.text = 'MODE: [AUTONOMOUS WAYPOINT TRAVERSAL]';
      this.statusText.style.fill = UI_COLORS.CYAN as any;
    } else if (rover.operationalStatus === RoverOperationalStatus.DEPLETED) {
      this.statusText.text = 'STATUS: [BATTERY DEPLETED - RECHARGING]';
      this.statusText.style.fill = UI_COLORS.RED as any;
    } else {
      this.statusText.text = `MODE: MANUAL REMOTE CONTROL (${rover.location.currentTerrain})`;
      this.statusText.style.fill = UI_COLORS.TEXT_PRIMARY as any;
    }
  }
}
