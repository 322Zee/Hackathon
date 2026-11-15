/**
 * INTERSTELLAR CONTINUUM - Cinematic Subtitle & Narration Overlay
 * Aerospace tactical lower-third subtitle display presenting speaker callsign,
 * narration statements, and scene progress indicator.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class CinematicSubtitleRenderer {
  public readonly container: Container;

  private backdropGfx: Graphics;
  private speakerText: Text;
  private narrationText: Text;
  private progressText: Text;

  private targetAlpha: number = 0;
  private currentAlpha: number = 0;

  constructor() {
    this.container = new Container();
    this.container.label = 'CinematicSubtitleRenderer';
    this.container.position.set(960, 930);

    this.backdropGfx = new Graphics();
    this.container.addChild(this.backdropGfx);

    const speakerStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0x38bdf8,
      letterSpacing: 1.5,
    });

    this.speakerText = new Text({
      text: '',
      style: speakerStyle,
    });
    this.speakerText.anchor.set(0.5, 0.5);
    this.speakerText.position.set(0, -32);
    this.container.addChild(this.speakerText);

    const narrationStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 15,
      fontWeight: 'bold',
      fill: 0xf1f5f9,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 1400,
      lineHeight: 24,
      letterSpacing: 1.0,
    });

    this.narrationText = new Text({
      text: '',
      style: narrationStyle,
    });
    this.narrationText.anchor.set(0.5, 0.5);
    this.narrationText.position.set(0, 2);
    this.container.addChild(this.narrationText);

    const progressStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0x64748b,
      letterSpacing: 1.5,
    });

    this.progressText = new Text({
      text: '',
      style: progressStyle,
    });
    this.progressText.anchor.set(0.5, 0.5);
    this.progressText.position.set(0, 36);
    this.container.addChild(this.progressText);

    this.container.alpha = 0;
  }

  public setNarration(speaker: string, text: string, sceneInfo: string): void {
    this.speakerText.text = `// ${speaker.toUpperCase()} //`;
    this.narrationText.text = text;
    this.progressText.text = sceneInfo;

    this.targetAlpha = 1.0;
    this.redrawBackdrop();
  }

  public clearNarration(): void {
    this.targetAlpha = 0.0;
  }

  private redrawBackdrop(): void {
    this.backdropGfx.clear();
    // Dark letterbox glass background
    this.backdropGfx.roundRect(-750, -50, 1500, 100, 6);
    this.backdropGfx.fill({ color: 0x030712, alpha: 0.88 });
    this.backdropGfx.stroke({ color: 0x0284c7, width: 1.2, alpha: 0.7 });

    // Accent line
    this.backdropGfx.moveTo(-700, -20).lineTo(700, -20).stroke({ color: 0x38bdf8, width: 1.0, alpha: 0.25 });
  }

  public update(deltaSeconds: number): void {
    // Smooth alpha fade
    if (this.currentAlpha < this.targetAlpha) {
      this.currentAlpha = Math.min(this.targetAlpha, this.currentAlpha + deltaSeconds * 4.0);
    } else if (this.currentAlpha > this.targetAlpha) {
      this.currentAlpha = Math.max(this.targetAlpha, this.currentAlpha - deltaSeconds * 3.0);
    }
    this.container.alpha = this.currentAlpha;
  }
}
