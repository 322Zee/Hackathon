/**
 * INTERSTELLAR CONTINUUM - Title Screen Logo & Typography Architecture
 * Original typography treatment, glowing aerospace brackets,
 * subtitle, engine version metadata, and gentle breathing luminescence.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class TitleLogoRenderer {
  public readonly container: Container;

  private logoGfx: Graphics;
  private titleText: Text;
  private subtitleText: Text;
  private versionText: Text;

  private timeElapsed: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'TitleLogoRenderer';

    this.logoGfx = new Graphics();
    this.container.addChild(this.logoGfx);

    // Main Title Typography
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 54,
      fontWeight: 'bold',
      fill: 0xffffff,
      letterSpacing: 6.0,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 2,
        blur: 16,
        color: 0x00f0ff,
        distance: 0,
      },
    });

    this.titleText = new Text({
      text: 'INTERSTELLAR CONTINUUM',
      style: titleStyle,
    });
    this.titleText.anchor.set(0.5, 0.5);
    this.titleText.position.set(960, 260);
    this.container.addChild(this.titleText);

    // Subtitle Typography
    const subtitleStyle = new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x38bdf8,
      letterSpacing: 3.5,
    });

    this.subtitleText = new Text({
      text: 'A Solar System Exploration and Mission Design Experience',
      style: subtitleStyle,
    });
    this.subtitleText.anchor.set(0.5, 0.5);
    this.subtitleText.position.set(960, 316);
    this.container.addChild(this.subtitleText);

    // Engine & Version Metadata
    const versionStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0x64748b,
      letterSpacing: 1.5,
    });

    this.versionText = new Text({
      text: 'v0.1.0-alpha // ANTIGRAVITY 2.5D AEROSPACE ENGINE // SYSTEM READY',
      style: versionStyle,
    });
    this.versionText.anchor.set(0.5, 0.5);
    this.versionText.position.set(960, 348);
    this.container.addChild(this.versionText);

    this.renderDecorations();
  }

  private renderDecorations(): void {
    this.logoGfx.clear();

    const cx = 960;
    const cy = 260;
    const halfWidth = 560;

    // Glowing Top and Bottom Aerospace Accent Brackets
    this.logoGfx
      .moveTo(cx - halfWidth, cy - 50)
      .lineTo(cx - halfWidth + 80, cy - 50)
      .stroke({ color: 0x00f0ff, width: 2.0, alpha: 0.8 });

    this.logoGfx
      .moveTo(cx + halfWidth - 80, cy - 50)
      .lineTo(cx + halfWidth, cy - 50)
      .stroke({ color: 0x00f0ff, width: 2.0, alpha: 0.8 });

    // Center chevron diamonds
    this.logoGfx
      .moveTo(cx - 12, cy - 50)
      .lineTo(cx, cy - 56)
      .lineTo(cx + 12, cy - 50)
      .lineTo(cx, cy - 44)
      .closePath()
      .fill({ color: 0x38bdf8, alpha: 0.7 });

    // Under-title thin divider
    this.logoGfx
      .moveTo(cx - 380, cy + 34)
      .lineTo(cx + 380, cy + 34)
      .stroke({ color: 0x1e3a5f, width: 1.2, alpha: 0.6 });
  }

  public update(deltaSeconds: number): void {
    this.timeElapsed += deltaSeconds;

    // Gentle breathing luminescence (1.0 to 0.82)
    const breath = 0.91 + Math.sin(this.timeElapsed * 1.8) * 0.09;
    this.titleText.alpha = breath;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
