import { Container } from 'pixi.js';
import { IScene } from '../IScene';
import { ISceneTransition } from './SceneTransition';

export class OpacityTransition implements ISceneTransition {
  public readonly id = 'OpacityTransition';
  public readonly durationSeconds: number;

  constructor(durationSeconds: number = 0.4) {
    this.durationSeconds = durationSeconds;
  }

  public async execute(
    fromScene: IScene | null,
    toScene: IScene,
    _overlayContainer: Container,
    performSwitch: () => Promise<void>
  ): Promise<void> {
    const durationMs = this.durationSeconds * 1000;

    // Initialize next scene with alpha 0
    toScene.container.alpha = 0;
    await performSwitch();

    const scheduleFrame = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);

    return new Promise((resolve) => {
      const startTime = performance.now();

      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);

        if (fromScene && fromScene.container) {
          fromScene.container.alpha = 1 - progress;
        }
        toScene.container.alpha = progress;

        if (progress < 1.0) {
          scheduleFrame(step);
        } else {
          toScene.container.alpha = 1.0;
          if (fromScene && fromScene.container) {
            fromScene.container.alpha = 1.0;
          }
          resolve();
        }
      };

      step();
    });
  }
}
