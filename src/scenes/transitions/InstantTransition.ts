import { Container } from 'pixi.js';
import { IScene } from '../IScene';
import { ISceneTransition } from './SceneTransition';

export class InstantTransition implements ISceneTransition {
  public readonly id = 'InstantTransition';
  public readonly durationSeconds = 0;

  public async execute(
    _fromScene: IScene | null,
    toScene: IScene,
    _overlayContainer: Container,
    performSwitch: () => Promise<void>
  ): Promise<void> {
    toScene.container.alpha = 1.0;
    await performSwitch();
  }
}
