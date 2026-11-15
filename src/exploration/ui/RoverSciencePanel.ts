/**
 * INTERSTELLAR CONTINUUM - Rover Scientific Instruments & Caching Panel
 * HUD panel displaying installed instruments, firing controls, and sample canister telemetry.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RoverRecord } from '../ExplorationTypes';
import { UI_COLORS } from '../../ui/core/UIDesignTokens';

export class RoverSciencePanel {
  public readonly container: Container = new Container();

  private background: Graphics = new Graphics();
  private titleText: Text;
  private instrumentContainer: Container = new Container();
  private storageText: Text;
  private samplesText: Text;

  private readonly PANEL_WIDTH = 340;
  private readonly PANEL_HEIGHT = 230;

  public onInstrumentActivated?: (instrumentId: string) => void;

  constructor() {
    this.container.label = 'RoverSciencePanel';
    this.container.addChild(this.background);

    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1,
    });

    const infoStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: UI_COLORS.TEXT_SECONDARY,
    });

    this.titleText = new Text({ text: 'SCIENTIFIC PAYLOAD & SAMPLING', style: titleStyle });
    this.titleText.position.set(16, 12);
    this.container.addChild(this.titleText);

    this.instrumentContainer.position.set(16, 36);
    this.container.addChild(this.instrumentContainer);

    this.storageText = new Text({ text: 'SAMPLE CAROUSEL: 0/4 SLOTS USED', style: infoStyle });
    this.storageText.position.set(16, 168);
    this.container.addChild(this.storageText);

    this.samplesText = new Text({ text: 'LATEST: None cached', style: infoStyle });
    this.samplesText.position.set(16, 190);
    this.container.addChild(this.samplesText);

    this.drawBackground();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.roundRect(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 6);
    this.background.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.90 });
    this.background.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.5 });

    // Decorative top-right accent
    this.background.moveTo(this.PANEL_WIDTH - 20, 0);
    this.background.lineTo(this.PANEL_WIDTH, 20);
    this.background.stroke({ color: UI_COLORS.CYAN, width: 1.5 });
  }

  public updatePanel(rover: RoverRecord): void {
    this.instrumentContainer.removeChildren();

    const instStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: UI_COLORS.TEXT_PRIMARY,
    });

    const statusStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fontWeight: 'bold',
      fill: UI_COLORS.GREEN,
    });

    let yOffset = 0;
    for (const slot of rover.instruments) {
      const row = new Container();
      row.position.set(0, yOffset);

      const inst = slot.instrument;
      const isReady = slot.isReady;

      // Status LED indicator
      const led = new Graphics();
      led.circle(4, 8, 3.5);
      led.fill({ color: isReady ? UI_COLORS.GREEN : UI_COLORS.AMBER });
      row.addChild(led);

      // Name & Category
      const nameTxt = new Text({
        text: `${inst.name.length > 28 ? inst.name.slice(0, 26) + '..' : inst.name}`,
        style: instStyle,
      });
      nameTxt.position.set(14, 2);
      row.addChild(nameTxt);

      // Status text
      const statusTxt = new Text({
        text: isReady ? '[READY]' : `[RECHARGING ${slot.cooldownRemaining.toFixed(1)}s]`,
        style: statusStyle,
      });
      statusTxt.style.fill = isReady ? UI_COLORS.GREEN : UI_COLORS.AMBER;
      statusTxt.position.set(210, 2);
      row.addChild(statusTxt);

      // Firing trigger button if ready
      if (isReady) {
        row.eventMode = 'static';
        row.cursor = 'pointer';
        row.on('pointerdown', () => {
          if (this.onInstrumentActivated) {
            this.onInstrumentActivated(inst.id);
          }
        });
      }

      this.instrumentContainer.addChild(row);
      yOffset += 26;
    }

    // Storage capacity update
    const used = rover.storageCapacity.usedSlots;
    const max = rover.storageCapacity.maxSlots;
    this.storageText.text = `SAMPLE CAROUSEL: ${used}/${max} SLOTS USED`;

    const samples = rover.storageCapacity.collectedSamples;
    if (samples.length > 0) {
      const last = samples[samples.length - 1]!;
      this.samplesText.text = `CACHED: "${last.name}" (+${last.dataRating} Sci)`;
      this.samplesText.style.fill = UI_COLORS.CYAN;
    } else {
      this.samplesText.text = 'CACHED: Canisters hermetically sealed & empty';
      this.samplesText.style.fill = UI_COLORS.TEXT_MUTED;
    }
  }
}
