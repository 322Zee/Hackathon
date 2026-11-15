/**
 * INTERSTELLAR CONTINUUM - Chapter Transition Banner
 * Celebratory HUD banner alerting the Director to chapter progression,
 * major solar system unlocks, and campaign milestone completions.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';

export class ChapterTransitionBanner {
  public readonly container: Container;

  private bannerGfx: Graphics;
  private titleText: Text;
  private subtitleText: Text;

  private isVisible: boolean = false;
  private readonly bannerWidth: number = 720;
  private readonly bannerHeight: number = 70;

  constructor() {
    this.container = new Container();
    this.container.label = 'ChapterTransitionBanner';
    this.container.visible = false;
    this.container.position.set(Math.max(0, (1920 - this.bannerWidth) / 2), 60);

    this.bannerGfx = new Graphics();
    this.container.addChild(this.bannerGfx);

    const titleStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 16,
      fontWeight: 'bold',
      fill: UI_COLORS.CYAN,
      letterSpacing: 1.5,
    });
    this.titleText = new Text({ text: 'CHAPTER UNLOCKED', style: titleStyle });
    this.titleText.position.set(24, 12);
    this.container.addChild(this.titleText);

    const subStyle = new TextStyle({
      fontFamily: UI_FONTS.FAMILY,
      fontSize: 13,
      fill: UI_COLORS.TEXT_PRIMARY,
    });
    this.subtitleText = new Text({ text: '', style: subStyle });
    this.subtitleText.position.set(24, 38);
    this.container.addChild(this.subtitleText);

    this.redraw();
  }

  private redraw(): void {
    this.bannerGfx.clear();
    this.bannerGfx.roundRect(0, 0, this.bannerWidth, this.bannerHeight, 6);
    this.bannerGfx.fill({ color: 0x091322, alpha: 0.95 });
    this.bannerGfx.stroke({ color: 0x00d2ff, width: 2 });

    // Left accent bar
    this.bannerGfx.rect(0, 0, 6, this.bannerHeight);
    this.bannerGfx.fill({ color: 0x00ff88, alpha: 1.0 });
  }

  public showBanner(title: string, subtitle: string): void {
    this.titleText.text = title.toUpperCase();
    this.subtitleText.text = subtitle;
    this.isVisible = true;
    this.container.visible = true;
    this.redraw();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.visible = false;
  }

  public getVisible(): boolean {
    return this.isVisible;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
