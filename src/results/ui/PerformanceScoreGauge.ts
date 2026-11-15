/**
 * INTERSTELLAR CONTINUUM - Performance Score Gauge Component
 * Visual presentation for mission evaluation scores and performance grades.
 * Built with PixiJS v8 and UI design tokens.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_COLORS, UI_FONTS } from '../../ui/core/UIDesignTokens';

export interface PerformanceScoreGaugeOptions {
  radius?: number;
  score?: number;
  gradeLetter?: string;
  gradeLabel?: string;
  gradeColorHex?: number;
}

export class PerformanceScoreGauge {
  public readonly container: Container;

  private radius: number;
  private score: number;
  private gradeLetter: string;
  private gradeLabel: string;
  private gradeColorHex: number;

  private gaugeGfx: Graphics;
  private scoreText: Text;
  private gradeText: Text;
  private labelText: Text;

  constructor(options: PerformanceScoreGaugeOptions = {}) {
    this.radius = options.radius ?? 68;
    this.score = options.score ?? 0;
    this.gradeLetter = options.gradeLetter ?? 'S';
    this.gradeLabel = options.gradeLabel ?? 'Exceptional';
    this.gradeColorHex = options.gradeColorHex ?? UI_COLORS.CYAN;

    this.container = new Container();

    this.gaugeGfx = new Graphics();
    this.container.addChild(this.gaugeGfx);

    // Grade Letter Display (Large Center)
    this.gradeText = new Text({
      text: this.gradeLetter,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: Math.round(this.radius * 0.72),
        fontWeight: 'bold',
        fill: this.gradeColorHex,
      }),
    });
    this.gradeText.anchor.set(0.5, 0.65);
    this.container.addChild(this.gradeText);

    // Score Value Subtext (e.g. "94 / 100")
    this.scoreText = new Text({
      text: `${this.score} / 100`,
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: Math.round(this.radius * 0.22),
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_PRIMARY,
        letterSpacing: 1,
      }),
    });
    this.scoreText.anchor.set(0.5, -0.4);
    this.container.addChild(this.scoreText);

    // Grade Label (e.g. "EXCEPTIONAL")
    this.labelText = new Text({
      text: this.gradeLabel.toUpperCase(),
      style: new TextStyle({
        fontFamily: UI_FONTS.FAMILY,
        fontSize: Math.max(10, Math.round(this.radius * 0.16)),
        fontWeight: 'bold',
        fill: UI_COLORS.TEXT_SECONDARY,
        letterSpacing: 1.5,
      }),
    });
    this.labelText.anchor.set(0.5, -1.8);
    this.container.addChild(this.labelText);

    this.renderGauge();
  }

  public update(score: number, gradeLetter: string, gradeLabel: string, colorHex?: number): void {
    this.score = Math.round(score * 10) / 10;
    this.gradeLetter = gradeLetter;
    this.gradeLabel = gradeLabel;
    if (colorHex !== undefined) {
      this.gradeColorHex = colorHex;
    }

    this.scoreText.text = `${this.score} / 100`;
    this.gradeText.text = this.gradeLetter;
    this.gradeText.style.fill = this.gradeColorHex;
    this.labelText.text = this.gradeLabel.toUpperCase();

    this.renderGauge();
  }

  private renderGauge(): void {
    this.gaugeGfx.clear();

    const r = this.radius;
    const thickness = 8;
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const totalAngle = endAngle - startAngle;

    // 1. Background Track Arc
    this.gaugeGfx.circle(0, 0, r + thickness);
    this.gaugeGfx.fill({ color: UI_COLORS.BG_PANEL, alpha: 0.9 });
    this.gaugeGfx.stroke({ color: UI_COLORS.BORDER_SUBTLE, width: 2 });

    // Inner shadow circle
    this.gaugeGfx.circle(0, 0, r - thickness - 4);
    this.gaugeGfx.fill({ color: UI_COLORS.BG_DARK, alpha: 0.95 });
    this.gaugeGfx.stroke({ color: UI_COLORS.BORDER_DIM, width: 1 });

    // Arc base
    const progress = Math.max(0, Math.min(1, this.score / 100));
    const currentAngle = startAngle + totalAngle * progress;

    // Draw active progress arc with tick marks
    const segments = 36;
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (totalAngle * (i / segments));
      const isFilled = angle <= currentAngle;
      const x1 = Math.cos(angle) * (r - 2);
      const y1 = Math.sin(angle) * (r - 2);
      const x2 = Math.cos(angle) * (r + 4);
      const y2 = Math.sin(angle) * (r + 4);

      this.gaugeGfx.moveTo(x1, y1);
      this.gaugeGfx.lineTo(x2, y2);
      this.gaugeGfx.stroke({
        color: isFilled ? this.gradeColorHex : UI_COLORS.BORDER_DIM,
        width: 2,
        alpha: isFilled ? 1.0 : 0.4,
      });
    }

    // Outer accent glow ring
    this.gaugeGfx.circle(0, 0, r + 10);
    this.gaugeGfx.stroke({ color: this.gradeColorHex, width: 1, alpha: 0.25 });
  }
}
