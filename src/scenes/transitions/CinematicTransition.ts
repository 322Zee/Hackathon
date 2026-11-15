import { Container, Graphics } from 'pixi.js';
import { IScene } from '../IScene';
import { ISceneTransition } from './SceneTransition';

export class CinematicTransition implements ISceneTransition {
  public readonly id = 'CinematicTransition';
  public readonly durationSeconds: number;

  constructor(durationSeconds: number = 0.8) {
    this.durationSeconds = durationSeconds;
  }

  public async execute(
    _fromScene: IScene | null,
    _toScene: IScene,
    overlayContainer: Container,
    performSwitch: () => Promise<void>
  ): Promise<void> {
    const halfDuration = this.durationSeconds / 2;
    const topBar = new Graphics();
    const bottomBar = new Graphics();

    overlayContainer.addChild(topBar);
    overlayContainer.addChild(bottomBar);

    // Bars sweep inward
    await this.animateBars(topBar, bottomBar, 0, 540, halfDuration);

    // Perform scene switch while view is eclipsed
    await performSwitch();

    // Bars retract outward
    await this.animateBars(topBar, bottomBar, 540, 0, halfDuration);

    overlayContainer.removeChild(topBar);
    overlayContainer.removeChild(bottomBar);
    topBar.destroy();
    bottomBar.destroy();
  }

  private animateBars(
    topBar: Graphics,
    bottomBar: Graphics,
    fromHeight: number,
    toHeight: number,
    durationSec: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const durationMs = durationSec * 1000;

      const scheduleFrame = typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);

      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);
        const currentHeight = fromHeight + (toHeight - fromHeight) * progress;

        topBar.clear();
        topBar.rect(0, 0, 1920, currentHeight);
        topBar.fill({ color: 0x030712 });

        bottomBar.clear();
        bottomBar.rect(0, 1080 - currentHeight, 1920, currentHeight);
        bottomBar.fill({ color: 0x030712 });

        if (progress < 1.0) {
          scheduleFrame(step);
        } else {
          resolve();
        }
      };

      step();
    });
  }
}
