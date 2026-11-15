import { Container, Graphics } from 'pixi.js';
import { IScene } from '../IScene';
import { ISceneTransition } from './SceneTransition';

export class FadeTransition implements ISceneTransition {
  public readonly id = 'FadeTransition';
  public readonly durationSeconds: number;
  private color: number;

  constructor(durationSeconds: number = 0.5, color: number = 0x030712) {
    this.durationSeconds = durationSeconds;
    this.color = color;
  }

  public async execute(
    _fromScene: IScene | null,
    _toScene: IScene,
    overlayContainer: Container,
    performSwitch: () => Promise<void>
  ): Promise<void> {
    const halfDuration = Math.max(0.05, this.durationSeconds / 2);
    const overlay = new Graphics();
    overlay.rect(0, 0, 1920, 1080);
    overlay.fill({ color: this.color, alpha: 1 });
    overlay.alpha = 0;
    overlayContainer.addChild(overlay);

    // Fade to black
    await this.animateAlpha(overlay, 0, 1, halfDuration);

    // Perform scene swap while screen is opaque
    await performSwitch();

    // Fade in to new scene
    await this.animateAlpha(overlay, 1, 0, halfDuration);

    overlayContainer.removeChild(overlay);
    overlay.destroy();
  }

  private animateAlpha(target: Graphics, from: number, to: number, durationSec: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const durationMs = durationSec * 1000;

      const scheduleFrame = typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);

      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);
        target.alpha = from + (to - from) * progress;

        if (progress < 1.0) {
          scheduleFrame(step);
        } else {
          target.alpha = to;
          resolve();
        }
      };

      step();
    });
  }
}
