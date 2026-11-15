/**
 * INTERSTELLAR CONTINUUM - Settings Scene Architecture
 * Production scene for Central Plaza Settings & Administration Terminal (SceneId.SETTINGS).
 * Hosts the unified SettingsView and allows returning to headquarters campus.
 */

import { Container, Graphics } from 'pixi.js';
import { IScene, SceneContext } from './IScene';
import { SceneId } from './SceneId';
import { ViewportTransform } from '../rendering/VirtualResolution';
import { SettingsView } from '../ui/settings/SettingsView';
import { ServiceLocator } from '../core/ServiceLocator';
import { SceneManager } from './SceneManager';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { Logger } from '../core/logging/Logger';

export class SettingsScene implements IScene {
  public readonly id = SceneId.SETTINGS;
  public readonly container: Container;
  public isInitialized: boolean = false;
  public isActive: boolean = false;

  private settingsView?: SettingsView;
  private returnSceneId: string = SceneId.HEADQUARTERS;
  private backgroundGfx: Graphics;

  constructor() {
    this.container = new Container();
    this.container.label = 'SettingsScene';

    this.backgroundGfx = new Graphics();
    this.container.addChild(this.backgroundGfx);
  }

  public initialize(_context: SceneContext): void {
    this.isInitialized = true;
    this.renderBackground();
    Logger.info('SETTINGS_SCENE', 'SettingsScene initialized.');
  }

  public activate(payload?: any): void {
    this.isActive = true;
    this.returnSceneId = payload?.returnSceneId || SceneId.HEADQUARTERS;

    this.renderBackground();

    // Instantiate unified SettingsView
    if (this.settingsView) {
      this.container.removeChild(this.settingsView.container);
      this.settingsView.destroy();
    }

    this.settingsView = new SettingsView({
      initialCategory: payload?.initialCategory ?? 'GRAPHICS',
      onClose: () => {
        this.returnToPreviousScene();
      },
    });

    this.settingsView.container.position.set((1920 - 840) / 2, (1080 - 620) / 2);
    this.container.addChild(this.settingsView.container);

    Logger.info('SETTINGS_SCENE', `SettingsScene activated (return target: ${this.returnSceneId}).`);
  }

  public deactivate(): void {
    this.isActive = false;
    if (this.settingsView) {
      this.container.removeChild(this.settingsView.container);
      this.settingsView.destroy();
      this.settingsView = undefined;
    }
    Logger.info('SETTINGS_SCENE', 'SettingsScene deactivated.');
  }

  public update(_deltaSeconds: number): void {
    if (!this.isActive) return;

    if (ServiceLocator.has('InputManager')) {
      const input = ServiceLocator.get<InputManager>('InputManager');
      if (input.isActionJustPressed(InputAction.Cancel) || input.isActionJustPressed(InputAction.Pause)) {
        this.returnToPreviousScene();
      }
    }
  }

  public onResize(_transform: ViewportTransform): void {
    this.renderBackground();
  }

  public cleanup(): void {
    this.deactivate();
    this.backgroundGfx.clear();
    this.container.removeChildren();
    this.isInitialized = false;
    Logger.info('SETTINGS_SCENE', 'SettingsScene cleaned up.');
  }

  public async returnToPreviousScene(): Promise<boolean> {
    if (ServiceLocator.has('SceneManager')) {
      const sm = ServiceLocator.get<SceneManager>('SceneManager');
      return await sm.switchScene(this.returnSceneId as SceneId);
    }
    return false;
  }

  private renderBackground(): void {
    this.backgroundGfx.clear();
    this.backgroundGfx.rect(0, 0, 1920, 1080);
    this.backgroundGfx.fill({ color: 0x020611, alpha: 0.95 });

    // Subtle technical grid pattern
    for (let x = 0; x < 1920; x += 80) {
      this.backgroundGfx.moveTo(x, 0).lineTo(x, 1080).stroke({ color: 0x0d2038, width: 0.5, alpha: 0.3 });
    }
    for (let y = 0; y < 1080; y += 80) {
      this.backgroundGfx.moveTo(0, y).lineTo(1920, y).stroke({ color: 0x0d2038, width: 0.5, alpha: 0.3 });
    }
  }
}
