import { Container } from 'pixi.js';
import { IScene } from '../IScene';

export interface ISceneTransition {
  readonly id: string;
  readonly durationSeconds: number;
  execute(
    fromScene: IScene | null,
    toScene: IScene,
    overlayContainer: Container,
    performSwitch: () => Promise<void>
  ): Promise<void>;
}
