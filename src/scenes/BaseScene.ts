import { Container } from 'pixi.js';
import { IScene, SceneContext } from './IScene';
import { SceneIdType } from './SceneId';
import { ViewportTransform } from '../rendering/VirtualResolution';
import { ScopedEventSubscriber } from '../core/events/ScopedEventSubscriber';

export abstract class BaseScene implements IScene {
  public abstract readonly id: SceneIdType;
  public readonly container: Container = new Container();

  protected context!: SceneContext;
  protected events!: ScopedEventSubscriber;
  protected currentTransform?: ViewportTransform;

  private _isInitialized: boolean = false;
  private _isActive: boolean = false;

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public async initialize(context: SceneContext): Promise<void> {
    if (this._isInitialized) return;

    this.context = context;
    this.events = new ScopedEventSubscriber(context.eventBus, String(this.id));
    this.currentTransform = context.transform;
    this.container.label = `Scene:${String(this.id)}`;

    await this.onInitialize();
    this._isInitialized = true;
  }

  public async activate(payload?: any): Promise<void> {
    if (this._isActive) return;

    this._isActive = true;
    this.container.visible = true;
    await this.onActivate(payload);
  }

  public async deactivate(): Promise<void> {
    if (!this._isActive) return;

    this._isActive = false;
    this.container.visible = false;
    await this.onDeactivate();
  }

  public update(deltaSeconds: number): void {
    if (!this._isActive) return;
    this.onUpdate(deltaSeconds);
  }

  public onResize(transform: ViewportTransform): void {
    this.currentTransform = transform;
    this.handleResize(transform);
  }

  public async cleanup(): Promise<void> {
    if (this._isActive) {
      await this.deactivate();
    }

    if (this.events) {
      this.events.dispose();
    }

    await this.onCleanup();
    this.container.removeChildren();
    this._isInitialized = false;
  }

  // Protected extension hooks
  protected abstract onInitialize(): Promise<void> | void;
  protected onActivate(_payload?: any): Promise<void> | void {}
  protected onDeactivate(): Promise<void> | void {}
  protected onUpdate(_deltaSeconds: number): void {}
  protected handleResize(_transform: ViewportTransform): void {}
  protected onCleanup(): Promise<void> | void {}
}
