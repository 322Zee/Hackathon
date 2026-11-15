/**
 * INTERSTELLAR CONTINUUM - Mission Overview Panel Component (Section A)
 * Authoritative mission identification, destination telemetry, current flight phase,
 * lifecycle state badges, and precision Mission Elapsed Time (MET) clock.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../../../ui/core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../../../ui/core/UIDesignTokens';
import { MissionOverviewData } from '../../types/MissionControlTypes';
import { MissionLifecycleState } from '../../../missions/MissionLifecycleTypes';

export interface MissionOverviewPanelOptions {
  width?: number;
  height?: number;
}

export class MissionOverviewPanel extends UIComponent {
  private width: number;
  private height: number;

  private bgGfx: Graphics;
  private headerContainer: Container;
  private detailsContainer: Container;
  private clockContainer: Container;

  private titleText: Text;
  private codeBadgeText: Text;
  private statusBadgeText: Text;
  private statusLedGfx: Graphics;
  private phaseText: Text;
  private destinationText: Text;
  private categoryText: Text;

  private metClockText: Text;
  private etaText: Text;
  private sampleModeBanner?: Container;

  constructor(options: MissionOverviewPanelOptions = {}) {
    super('MissionOverviewPanel');

    this.width = options.width ?? 1860;
    this.height = options.height ?? 110;

    this.bgGfx = new Graphics();
    this.headerContainer = new Container();
    this.detailsContainer = new Container();
    this.clockContainer = new Container();

    this.container.addChild(this.bgGfx);
    this.container.addChild(this.headerContainer);
    this.container.addChild(this.detailsContainer);
    this.container.addChild(this.clockContainer);

    // Title Text
    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 18,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 1.5,
    });
    this.titleText = new Text({
      text: 'NO ACTIVE MISSION SELECTED',
      style: titleStyle,
    });
    this.titleText.position.set(UI_SPACING.LG, 14);
    this.headerContainer.addChild(this.titleText);

    // Code Badge
    const codeStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.0,
    });
    this.codeBadgeText = new Text({
      text: '[MOC-NONE]',
      style: codeStyle,
    });
    this.codeBadgeText.position.set(UI_SPACING.LG, 42);
    this.headerContainer.addChild(this.codeBadgeText);

    // Status LED & Label
    this.statusLedGfx = new Graphics();
    this.statusLedGfx.position.set(160, 48);
    this.headerContainer.addChild(this.statusLedGfx);

    const statusStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_SECONDARY,
      letterSpacing: 1.0,
    });
    this.statusBadgeText = new Text({
      text: 'STANDBY',
      style: statusStyle,
    });
    this.statusBadgeText.position.set(175, 42);
    this.headerContainer.addChild(this.statusBadgeText);

    // Middle Details: Destination, Category, Phase
    this.detailsContainer.position.set(520, 14);

    const metaLabelStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 1.0,
    });
    const metaValueStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 12,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_HIGHLIGHT,
      letterSpacing: 0.8,
    });

    const destLabel = new Text({ text: 'DESTINATION TARGET', style: metaLabelStyle });
    destLabel.position.set(0, 0);
    this.detailsContainer.addChild(destLabel);

    this.destinationText = new Text({ text: '--', style: metaValueStyle });
    this.destinationText.position.set(0, 16);
    this.detailsContainer.addChild(this.destinationText);

    const catLabel = new Text({ text: 'MISSION CATEGORY', style: metaLabelStyle });
    catLabel.position.set(240, 0);
    this.detailsContainer.addChild(catLabel);

    this.categoryText = new Text({ text: '--', style: metaValueStyle });
    this.categoryText.position.set(240, 16);
    this.detailsContainer.addChild(this.categoryText);

    const phaseLabel = new Text({ text: 'CURRENT OPERATIONAL PHASE', style: metaLabelStyle });
    phaseLabel.position.set(0, 44);
    this.detailsContainer.addChild(phaseLabel);

    this.phaseText = new Text({ text: '--', style: metaValueStyle });
    this.phaseText.position.set(0, 60);
    this.detailsContainer.addChild(this.phaseText);

    // Right Details: Precision MET Digital Clock & ETA
    this.clockContainer.position.set(this.width - 420, 14);

    const metLabel = new Text({ text: 'MISSION ELAPSED TIME (MET)', style: metaLabelStyle });
    metLabel.position.set(0, 0);
    this.clockContainer.addChild(metLabel);

    const clockStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 22,
      fontWeight: 'bold',
      fill: UI_COLORS.GREEN,
      letterSpacing: 2.0,
    });
    this.metClockText = new Text({
      text: 'T+ 00d 00:00:00',
      style: clockStyle,
    });
    this.metClockText.position.set(0, 18);
    this.clockContainer.addChild(this.metClockText);

    const etaStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fill: UI_COLORS.TEXT_SECONDARY,
      letterSpacing: 0.8,
    });
    this.etaText = new Text({
      text: 'ESTIMATED REMAINING: --',
      style: etaStyle,
    });
    this.etaText.position.set(0, 54);
    this.clockContainer.addChild(this.etaText);

    this.drawBackground();
  }

  public setOverview(data?: MissionOverviewData): void {
    if (!data) {
      this.titleText.text = 'NO ACTIVE MISSION SELECTED';
      this.codeBadgeText.text = '[MOC-STANDBY]';
      this.statusBadgeText.text = 'IDLE';
      this.drawStatusLed(UI_COLORS.LED_OFFLINE);
      this.destinationText.text = '--';
      this.categoryText.text = '--';
      this.phaseText.text = '--';
      this.metClockText.text = 'T+ 00d 00:00:00';
      this.etaText.text = 'ESTIMATED REMAINING: N/A';
      this.toggleSampleBanner(false);
      return;
    }

    this.titleText.text = data.name.toUpperCase();
    this.codeBadgeText.text = `[${data.shortCode}]`;
    this.statusBadgeText.text = data.status.replace(/_/g, ' ');

    let ledColor: number = UI_COLORS.LED_ONLINE;
    if (data.status === MissionLifecycleState.FAILED || data.status === MissionLifecycleState.CANCELLED) {
      ledColor = UI_COLORS.LED_ALERT;
    } else if (data.status === MissionLifecycleState.PAUSED || data.status === MissionLifecycleState.PREPARING) {
      ledColor = UI_COLORS.LED_BUSY;
    }
    this.drawStatusLed(ledColor);

    this.destinationText.text = `${data.destinationName.toUpperCase()} ${data.destinationType ? `(${data.destinationType.toUpperCase()})` : ''}`;
    this.categoryText.text = data.category ? data.category.replace(/_/g, ' ') : 'EXPLORATION';
    this.phaseText.text = data.currentPhase.toUpperCase();

    // Format MET
    this.metClockText.text = this.formatMET(data.metSeconds);

    // Format ETA
    if (data.estimatedRemainingSeconds !== undefined) {
      const remDays = Math.floor(data.estimatedRemainingSeconds / 86400);
      const remHours = Math.floor((data.estimatedRemainingSeconds % 86400) / 3600);
      this.etaText.text = `ESTIMATED REMAINING: ${remDays}d ${remHours}h (TOTAL: ${data.estimatedDurationDays}d)`;
    } else {
      this.etaText.text = `ESTIMATED DURATION: ${data.estimatedDurationDays} DAYS`;
    }

    this.toggleSampleBanner(Boolean(data.isSampleData));
  }

  private drawStatusLed(color: number): void {
    this.statusLedGfx.clear();
    this.statusLedGfx.circle(0, 0, 5);
    this.statusLedGfx.fill({ color, alpha: 0.95 });
    this.statusLedGfx.stroke({ color: 0xffffff, width: 1.0, alpha: 0.5 });
  }

  private formatMET(totalSecs: number): string {
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `T+ ${pad(days)}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }

  private toggleSampleBanner(show: boolean): void {
    if (show) {
      if (!this.sampleModeBanner) {
        this.sampleModeBanner = new Container();
        const gfx = new Graphics();
        gfx.roundRect(0, 0, 240, 20, UI_RADIUS.XS);
        gfx.fill({ color: 0xb45309, alpha: 0.9 });
        gfx.stroke({ color: UI_COLORS.AMBER, width: 1 });

        const txtStyle = new TextStyle({
          fontFamily: UI_FONTS.FAMILY,
          fontSize: 9,
          fontWeight: 'bold',
          fill: 0xffffff,
          letterSpacing: 1.0,
        });
        const txt = new Text({
          text: 'DEMO MODE // PREVIEW ONLY',
          style: txtStyle,
        });
        txt.position.set(10, 4);

        this.sampleModeBanner.addChild(gfx);
        this.sampleModeBanner.addChild(txt);
        this.sampleModeBanner.position.set(this.width - 260, 80);
        this.container.addChild(this.sampleModeBanner);
      }
      this.sampleModeBanner.visible = true;
    } else if (this.sampleModeBanner) {
      this.sampleModeBanner.visible = false;
    }
  }

  private drawBackground(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.width, this.height, UI_RADIUS.SM);
    this.bgGfx.fill({ color: 0x050e1c, alpha: 0.95 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_DEFAULT, width: 1.2 });

    // Accent top line
    this.bgGfx.rect(0, 0, this.width, 3);
    this.bgGfx.fill({ color: UI_COLORS.CYAN, alpha: 0.8 });

    // Vertical divider lines
    this.bgGfx.rect(500, 10, 1, this.height - 20);
    this.bgGfx.fill({ color: UI_COLORS.BORDER_SUBTLE, alpha: 0.6 });

    this.bgGfx.rect(this.width - 440, 10, 1, this.height - 20);
    this.bgGfx.fill({ color: UI_COLORS.BORDER_SUBTLE, alpha: 0.6 });
  }
}
