/**
 * INTERSTELLAR CONTINUUM - Rover Selection & Surface Deployment Modal
 * Dedicated modal view for selecting a registered rover and authorizing planetary touchdown.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RoverRecord } from '../ExplorationTypes';
import { UI_COLORS } from '../../ui/core/UIDesignTokens';

export class RoverDeploymentModal {
  public readonly container: Container = new Container();

  private backdrop: Graphics = new Graphics();
  private panel: Container = new Container();
  private panelBackground: Graphics = new Graphics();
  private titleText: Text;
  private roverListContainer: Container = new Container();
  private detailsContainer: Container = new Container();

  private selectedRoverId?: string;
  private selectedDestinationId: string = 'DEST_MARS';

  public onDeployRequested?: (roverId: string, destinationId: string) => void;
  public onCloseRequested?: () => void;

  private readonly MODAL_WIDTH = 680;
  private readonly MODAL_HEIGHT = 440;

  constructor() {
    this.container.label = 'RoverDeploymentModal';
    this.container.visible = false;

    this.container.addChild(this.backdrop);
    this.container.addChild(this.panel);
    this.panel.addChild(this.panelBackground);

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });

    this.titleText = new Text({ text: 'SURFACE VEHICLE DEPLOYMENT & TOUCHDOWN MANIFEST', style: titleStyle });
    this.titleText.position.set(24, 18);
    this.panel.addChild(this.titleText);

    this.roverListContainer.position.set(24, 55);
    this.panel.addChild(this.roverListContainer);

    this.detailsContainer.position.set(340, 55);
    this.panel.addChild(this.detailsContainer);

    this.drawLayout();
  }

  private drawLayout(): void {
    // Backdrop darkener
    this.backdrop.clear();
    this.backdrop.rect(0, 0, 1920, 1080);
    this.backdrop.fill({ color: 0x000000, alpha: 0.65 });
    this.backdrop.eventMode = 'static';

    // Center panel
    this.panelBackground.clear();
    const px = (1920 - this.MODAL_WIDTH) * 0.5;
    const py = (1080 - this.MODAL_HEIGHT) * 0.5;
    this.panel.position.set(px, py);

    this.panelBackground.roundRect(0, 0, this.MODAL_WIDTH, this.MODAL_HEIGHT, 8);
    this.panelBackground.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.95 });
    this.panelBackground.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 2.0 });

    // Inner dividing line
    this.panelBackground.moveTo(320, 50);
    this.panelBackground.lineTo(320, this.MODAL_HEIGHT - 65);
    this.panelBackground.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Close button top-right
    const closeBtn = new Graphics();
    closeBtn.roundRect(this.MODAL_WIDTH - 36, 12, 24, 24, 4);
    closeBtn.fill({ color: 0x1e293b });
    closeBtn.stroke({ color: UI_COLORS.RED, width: 1.0 });
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => {
      this.hide();
      if (this.onCloseRequested) this.onCloseRequested();
    });
    this.panel.addChild(closeBtn);

    const closeTxt = new Text({
      text: 'X',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.RED }),
    });
    closeTxt.position.set(this.MODAL_WIDTH - 29, 16);
    this.panel.addChild(closeTxt);

    // Deploy action button at bottom right
    const deployBtn = new Graphics();
    deployBtn.roundRect(this.MODAL_WIDTH - 210, this.MODAL_HEIGHT - 50, 186, 36, 4);
    deployBtn.fill({ color: 0x0284c7 });
    deployBtn.stroke({ color: UI_COLORS.CYAN, width: 1.5 });
    deployBtn.eventMode = 'static';
    deployBtn.cursor = 'pointer';
    deployBtn.on('pointerdown', () => {
      if (this.selectedRoverId && this.onDeployRequested) {
        this.onDeployRequested(this.selectedRoverId, this.selectedDestinationId);
        this.hide();
      }
    });
    this.panel.addChild(deployBtn);

    const deployTxt = new Text({
      text: 'AUTHORIZE DEPLOYMENT',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
    });
    deployTxt.position.set(this.MODAL_WIDTH - 198, this.MODAL_HEIGHT - 38);
    this.panel.addChild(deployTxt);
  }

  public show(rovers: RoverRecord[], destinationId: string = 'DEST_MARS'): void {
    this.selectedDestinationId = destinationId;
    this.container.visible = true;

    if (rovers.length > 0 && !this.selectedRoverId) {
      this.selectedRoverId = rovers[0]!.id;
    }

    this.renderRoverList(rovers);
    this.renderDetails(rovers.find((r) => r.id === this.selectedRoverId) || rovers[0]);
  }

  public hide(): void {
    this.container.visible = false;
  }

  private renderRoverList(rovers: RoverRecord[]): void {
    this.roverListContainer.removeChildren();

    let yOffset = 0;
    for (const r of rovers) {
      const isSelected = r.id === this.selectedRoverId;
      const row = new Graphics();
      row.roundRect(0, yOffset, 280, 50, 4);
      row.fill({ color: isSelected ? 0x0f2b48 : 0x07111e });
      row.stroke({ color: isSelected ? UI_COLORS.CYAN : UI_COLORS.BORDER_SUBTLE, width: 1.2 });
      row.eventMode = 'static';
      row.cursor = 'pointer';

      row.on('pointerdown', () => {
        this.selectedRoverId = r.id;
        this.renderRoverList(rovers);
        this.renderDetails(r);
      });

      const name = new Text({
        text: r.name,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', fill: UI_COLORS.TEXT_PRIMARY }),
      });
      name.position.set(10, yOffset + 8);
      this.roverListContainer.addChild(row);
      this.roverListContainer.addChild(name);

      const sub = new Text({
        text: `MODEL: ${r.model} // STATUS: ${r.operationalStatus}`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: UI_COLORS.TEXT_MUTED }),
      });
      sub.position.set(10, yOffset + 26);
      this.roverListContainer.addChild(sub);

      yOffset += 56;
    }
  }

  private renderDetails(rover?: RoverRecord): void {
    this.detailsContainer.removeChildren();
    if (!rover) return;

    const baseStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: UI_COLORS.TEXT_PRIMARY,
    });

    const headerStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
    });

    const title = new Text({ text: `${rover.name.toUpperCase()}`, style: headerStyle });
    title.position.set(0, 0);
    this.detailsContainer.addChild(title);

    const specs = [
      `CHASSIS MODEL: ${rover.model}`,
      `PRIMARY POWER: ${rover.powerSource}`,
      `BATTERY CAPACITY: ${rover.maxEnergy.toFixed(0)} kWh`,
      `TOP FORWARD SPEED: ${(rover.movementConfig.maxSpeed * 0.1).toFixed(1)} m/s`,
      `SENSOR DETECTION RADIUS: ${rover.movementConfig.sensorDetectionRadius}m`,
      `SAMPLE CAROUSEL: ${rover.storageCapacity.maxSlots} SLOTS`,
      `MOUNTED INSTRUMENTS: ${rover.instruments.length} SENSORS`,
    ];

    let yOffset = 24;
    for (const spec of specs) {
      const txt = new Text({ text: spec, style: baseStyle });
      txt.position.set(0, yOffset);
      this.detailsContainer.addChild(txt);
      yOffset += 18;
    }

    // Installed instruments list
    yOffset += 8;
    const instTitle = new Text({
      text: 'INSTALLED SCIENTIFIC INSTRUMENTATION:',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', fill: UI_COLORS.AMBER }),
    });
    instTitle.position.set(0, yOffset);
    this.detailsContainer.addChild(instTitle);
    yOffset += 18;

    for (const slot of rover.instruments) {
      const instTxt = new Text({
        text: `• [${slot.instrument.category.slice(0, 4)}] ${slot.instrument.name}`,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: UI_COLORS.TEXT_SECONDARY }),
      });
      instTxt.position.set(4, yOffset);
      this.detailsContainer.addChild(instTxt);
      yOffset += 15;
    }
  }
}
