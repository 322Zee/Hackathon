/**
 * INTERSTELLAR CONTINUUM - Reusable Loading Spinner Component
 * Tactical rotating radar reticle for async operations.
 */

import { Graphics } from 'pixi.js';
import { UIComponent } from '../core/UIComponent';
import { UI_COLORS } from '../core/UIDesignTokens';

export interface UISpinnerOptions {
  radius?: number;
  speed?: number;
}

export class UISpinner extends UIComponent {
  private spinnerGfx: Graphics;
  private radius: number;
  private rotationSpeed: number;
  private currentRotation: number = 0;
  private spinning: boolean = true;

  constructor(radiusOrOptions: number | UISpinnerOptions = 18, speed: number = 4.5) {
    super('Spinner');
    if (typeof radiusOrOptions === 'object') {
      this.radius = radiusOrOptions.radius ?? 18;
      this.rotationSpeed = radiusOrOptions.speed ?? 4.5;
    } else {
      this.radius = radiusOrOptions;
      this.rotationSpeed = speed;
    }

    this.spinnerGfx = new Graphics();
    this.container.addChild(this.spinnerGfx);
    this.drawReticle();
  }

  public isSpinning(): boolean {
    return this.spinning;
  }

  public stop(): void {
    this.spinning = false;
  }

  public start(): void {
    this.spinning = true;
  }

  private drawReticle(): void {
    this.spinnerGfx.clear();
    const r = this.radius;

    // Outer segmented arc
    this.spinnerGfx
      .arc(0, 0, r, 0, Math.PI * 1.4)
      .stroke({ color: UI_COLORS.CYAN, width: 2.0 });

    // Inner reticle dots
    this.spinnerGfx.circle(0, 0, 3).fill({ color: UI_COLORS.CYAN });
  }

  public override update(deltaSeconds: number): void {
    super.update(deltaSeconds);
    if (!this.container.visible || !this.spinning) return;

    this.currentRotation += deltaSeconds * this.rotationSpeed;
    this.spinnerGfx.rotation = this.currentRotation;
    this.container.rotation = this.currentRotation;
  }
}
