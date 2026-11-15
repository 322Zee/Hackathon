import { Container } from 'pixi.js';
import { ViewportTransform } from '../rendering/VirtualResolution';

export interface IScreen {
  readonly id: string;
  readonly container: Container;

  init(): Promise<void> | void;
  update(deltaSeconds: number): void;
  onResize(transform: ViewportTransform): void;
  destroy(): void;
}
