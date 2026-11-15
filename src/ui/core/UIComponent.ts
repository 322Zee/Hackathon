/**
 * INTERSTELLAR CONTINUUM - Base UI Component
 * Foundation class for all UI elements providing lifecycle, visibility,
 * smooth animation, and accessibility configuration.
 */

import { Container } from 'pixi.js';

export abstract class UIComponent {
  public readonly container: Container;

  protected isVisibleState: boolean = true;
  protected reducedMotion: boolean = false;
  protected targetAlpha: number = 1.0;
  protected currentAlpha: number = 1.0;
  protected fadeSpeed: number = 6.0;

  constructor(label?: string) {
    this.container = new Container();
    if (label) {
      this.container.label = label;
    }
  }

  public show(immediate: boolean = false): void {
    this.isVisibleState = true;
    this.targetAlpha = 1.0;
    this.container.visible = true;
    if (immediate || this.reducedMotion) {
      this.currentAlpha = 1.0;
      this.container.alpha = 1.0;
    }
  }

  public hide(immediate: boolean = false): void {
    this.isVisibleState = false;
    this.targetAlpha = 0.0;
    if (immediate || this.reducedMotion) {
      this.currentAlpha = 0.0;
      this.container.alpha = 0.0;
      this.container.visible = false;
    }
  }

  public toggle(): void {
    if (this.isVisibleState) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isVisible(): boolean {
    return this.isVisibleState;
  }

  public setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
  }

  public update(deltaSeconds: number): void {
    if (!this.container.visible) return;

    if (this.currentAlpha !== this.targetAlpha) {
      if (this.reducedMotion) {
        this.currentAlpha = this.targetAlpha;
      } else {
        const step = deltaSeconds * this.fadeSpeed;
        if (this.currentAlpha < this.targetAlpha) {
          this.currentAlpha = Math.min(this.targetAlpha, this.currentAlpha + step);
        } else {
          this.currentAlpha = Math.max(this.targetAlpha, this.currentAlpha - step);
        }
      }

      this.container.alpha = this.currentAlpha;

      if (this.currentAlpha <= 0.001 && !this.isVisibleState) {
        this.container.visible = false;
      }
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
