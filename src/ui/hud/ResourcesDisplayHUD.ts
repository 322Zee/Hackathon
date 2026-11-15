/**
 * INTERSTELLAR CONTINUUM - Strategic Resources Display HUD
 * Tactical status bar displaying Mission Credits, Research Data,
 * Raw Materials, and Technology Points backed by actual game state.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS, UI_FONTS, UI_RADIUS, UI_SPACING } from '../core/UIDesignTokens';

export interface ResourcesData {
  credits: number;
  researchData: number;
  rawMaterials: number;
  technologyPoints: number;
}

export class ResourcesDisplayHUD extends UIComponent {
  private bgGfx: Graphics;
  private creditsText: Text;
  private researchText: Text;
  private materialsText: Text;
  private techPointsText: Text;

  private barWidth: number = 520;
  private barHeight: number = 34;

  constructor(x: number = 880, y: number = UI_SPACING.SAFE_MARGIN) {
    super('ResourcesDisplayHUD');
    this.container.position.set(x, y);

    this.bgGfx = new Graphics();
    this.container.addChild(this.bgGfx);

    const valStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 11,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_PRIMARY,
      letterSpacing: 0.6,
    });

    const lblStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 9,
      fontWeight: 'bold',
      fill: UI_COLORS.TEXT_MUTED,
      letterSpacing: 0.5,
    });

    // 1. Mission Credits
    const cBox = new Container();
    cBox.position.set(16, 8);
    const cLbl = new Text({ text: 'MC', style: new TextStyle({ ...lblStyle, fill: UI_COLORS.GREEN }) });
    this.creditsText = new Text({ text: '$0', style: valStyle });
    this.creditsText.position.set(22, 0);
    cBox.addChild(cLbl, this.creditsText);

    // 2. Research Data
    const rBox = new Container();
    rBox.position.set(150, 8);
    const rLbl = new Text({ text: 'RD', style: new TextStyle({ ...lblStyle, fill: UI_COLORS.CYAN }) });
    this.researchText = new Text({ text: '0', style: valStyle });
    this.researchText.position.set(22, 0);
    rBox.addChild(rLbl, this.researchText);

    // 3. Raw Materials
    const mBox = new Container();
    mBox.position.set(280, 8);
    const mLbl = new Text({ text: 'RM', style: new TextStyle({ ...lblStyle, fill: UI_COLORS.AMBER }) });
    this.materialsText = new Text({ text: '0 T', style: valStyle });
    this.materialsText.position.set(22, 0);
    mBox.addChild(mLbl, this.materialsText);

    // 4. Technology Points
    const tBox = new Container();
    tBox.position.set(410, 8);
    const tLbl = new Text({ text: 'TP', style: new TextStyle({ ...lblStyle, fill: UI_COLORS.PURPLE }) });
    this.techPointsText = new Text({ text: '0', style: valStyle });
    this.techPointsText.position.set(22, 0);
    tBox.addChild(tLbl, this.techPointsText);

    this.container.addChild(cBox, rBox, mBox, tBox);
    this.redraw();
  }

  public updateResources(data: ResourcesData): void {
    this.creditsText.text = `$${data.credits.toLocaleString()}`;
    this.researchText.text = `${data.researchData.toLocaleString()} RD`;
    this.materialsText.text = `${data.rawMaterials.toLocaleString()} T`;
    this.techPointsText.text = `${data.technologyPoints.toLocaleString()} TP`;
  }

  public getCreditsText(): string {
    return this.creditsText.text;
  }

  public getResearchText(): string {
    return this.researchText.text;
  }

  public getMaterialsText(): string {
    return this.materialsText.text;
  }

  public getTechPointsText(): string {
    return this.techPointsText.text;
  }

  private redraw(): void {
    this.bgGfx.clear();
    this.bgGfx.roundRect(0, 0, this.barWidth, this.barHeight, UI_RADIUS.SM);
    this.bgGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.9 });
    this.bgGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 1.0 });

    // Dividers between items
    const dividers = [135, 265, 395];
    for (const dx of dividers) {
      this.bgGfx.moveTo(dx, 6).lineTo(dx, this.barHeight - 6).stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 0.8 });
    }
  }
}
