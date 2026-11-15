/**
 * INTERSTELLAR CONTINUUM - Organisation Badge & Telemetry HUD Panel
 * Displays organisation identity, director rank, real-time location,
 * player status, and active mission objectives (strictly from game state).
 */

import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export interface OrganisationBadgeData {
  agencyName: string;
  rank: number;
  rankTitle: string;
  locationName: string;
  playerStatus: string;
  activeMissionTitle?: string;
  activeMissionObjective?: string;
}

export class OrganisationBadgeHUD extends UIComponent {
  private bgGfx: Graphics;
  private agencyText: Text;
  private rankText: Text;
  private locationText: Text;
  private statusText: Text;
  private missionText?: Text;

  private panelWidth: number = 460;
  private panelHeight: number = 96;

  constructor(x: number = UI_SPACING.SAFE_MARGIN, y: number = UI_SPACING.SAFE_MARGIN) {
    super('OrganisationBadgeHUD');
    this.container.position.set(x, y);

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_ACCENT,
      letterSpacing: 1.2,
    });
    this.agencyText = new Text({ text: 'ASTRUM CONTINUUM', style: titleStyle });
    this.agencyText.position.set(UI_SPACING.MD, UI_SPACING.SM);
    this.container.addChild(this.agencyText);

    const rankStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 0.8,
    });
    this.rankText = new Text({ text: 'RANK 1 // SUBORBITAL PIONEER', style: rankStyle });
    this.rankText.position.set(UI_SPACING.MD, UI_SPACING.SM + 18);
    this.container.addChild(this.rankText);

    const locStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.8,
    });
    this.locationText = new Text({ text: 'LOCATION: EARTH HEADQUARTERS', style: locStyle });
    this.locationText.position.set(UI_SPACING.MD, UI_SPACING.SM + 38);
    this.container.addChild(this.locationText);

    const statusStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 10,
      fill: UI_COLORS.TEXT_SECONDARY,
      letterSpacing: 0.6,
    });
    this.statusText = new Text({ text: 'STATUS: ACTIVE // IDLE', style: statusStyle });
    this.statusText.position.set(UI_SPACING.MD, UI_SPACING.SM + 56);
    this.container.addChild(this.statusText);

    this.redraw();
  }

  public updateData(data: OrganisationBadgeData): void {
    this.agencyText.text = data.agencyName.toUpperCase();
    this.rankText.text = `RANK ${data.rank} // ${data.rankTitle.toUpperCase()}`;
    this.locationText.text = `LOCATION: ${data.locationName.toUpperCase()}`;
    this.statusText.text = `STATUS: ${data.playerStatus.toUpperCase()}`;

    // Objective is displayed ONLY if an actual mission is active
    if (data.activeMissionTitle && data.activeMissionObjective) {
      if (!this.missionText) {
        this.missionText = new Text({
          text: '',
          style: new TextStyle({
            fontFamily: UI_FONTS.FAMILY,
            fontSize: 10,
            fill: UI_COLORS.AMBER,
            fontWeight: 'bold',
            letterSpacing: 0.6,
          }),
        });
        this.missionText.position.set(UI_SPACING.MD, UI_SPACING.SM + 74);
        this.container.addChild(this.missionText);
      }
      this.missionText.text = `MISSION: ${data.activeMissionTitle} (${data.activeMissionObjective})`;
      this.missionText.visible = true;
      this.panelHeight = 114;
    } else if (this.missionText) {
      this.missionText.visible = false;
      this.panelHeight = 96;
    }

    this.redraw();
  }

  public getAgencyName(): string {
    return this.agencyText.text;
  }

  public getLocationText(): string {
    return this.locationText.text;
  }

  public isMissionVisible(): boolean {
    return this.missionText?.visible ?? false;
  }

  private redraw(): void {
    this.bgGfx.clear();
    const w = this.panelWidth;
    const h = this.panelHeight;
    const r = UI_RADIUS.SM;

    // Background glass frame
    this.bgGfx.roundRect(0, 0, w, h, r);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.9 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Left accent status bar
    this.bgGfx.roundRect(0, 0, 3, h, r);
    this.bgGfx.fill({ color: UI_COLORS.CYAN });
  }
}
