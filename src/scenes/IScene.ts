import { Container } from 'pixi.js';
import { ViewportTransform } from '../rendering/VirtualResolution';
import { EventBus } from '../core/EventBus';
import { ISystemRegistry } from '../systems/SystemRegistry';
import { SceneIdType } from './SceneId';

export interface SceneContext {
  eventBus: EventBus;
  systemRegistry?: ISystemRegistry;
  transform: ViewportTransform;
}

export interface IScene {
  readonly id: SceneIdType;
  readonly container: Container;
  readonly isInitialized: boolean;
  readonly isActive: boolean;

  initialize(context: SceneContext): Promise<void> | void;
  activate(payload?: any): Promise<void> | void;
  deactivate(): Promise<void> | void;
  update(deltaSeconds: number): void;
  render?(deltaSeconds: number): void;
  onResize(transform: ViewportTransform): void;
  cleanup(): Promise<void> | void;
}
