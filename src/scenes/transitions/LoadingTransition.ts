import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IScene } from '../IScene';
import { ISceneTransition } from './SceneTransition';

export class LoadingTransition implements ISceneTransition {
  public readonly id = 'LoadingTransition';
  public readonly durationSeconds: number;

  constructor(durationSeconds: number = 0.6) {
    this.durationSeconds = durationSeconds;
  }

  public async execute(
    _fromScene: IScene | null,
    _toScene: IScene,
    overlayContainer: Container,
    performSwitch: () => Promise<void>
  ): Promise<void> {
    const overlay = new Container();
    const bg = new Graphics();
    bg.rect(0, 0, 1920, 1080);
    bg.fill({ color: 0x030712, alpha: 0.95 });

    const spinner = new Graphics();
    spinner.arc(960, 520, 30, 0, Math.PI * 1.5);
    spinner.stroke({ color: 0x00e5ff, width: 3 });

    const textStyle = new TextStyle({
      fontFamily: 'Orbitron, sans-serif',
      fontSize: 16,
      fill: 0x00e5ff,
      letterSpacing: 2,
    });
    const label = new Text({ text: 'TRANSIT IN PROGRESS...', style: textStyle });
    label.anchor.set(0.5, 0.5);
    label.position.set(960, 580);

    overlay.addChild(bg);
    overlay.addChild(spinner);
    overlay.addChild(label);
    overlayContainer.addChild(overlay);

    const scheduleFrame = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);

    let isDone = false;
    const spinLoop = () => {
      if (isDone) return;
      spinner.rotation += 0.1;
      scheduleFrame(spinLoop);
    };
    spinLoop();

    // Perform scene switch
    await performSwitch();

    // Brief hold for smooth visual pacing
    await new Promise((r) => setTimeout(r, Math.max(100, this.durationSeconds * 400)));

    isDone = true;
    overlayContainer.removeChild(overlay);
    overlay.destroy({ children: true });
  }
}
