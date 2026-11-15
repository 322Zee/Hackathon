import { Container } from 'pixi.js';
import { IScreen } from './Screen';
import { ViewportTransform } from '../rendering/VirtualResolution';
import { Logger } from '../core/logging/Logger';
import { EventBus } from '../core/EventBus';

export class ScreenManager {
  private screens: Map<string, IScreen> = new Map();
  private activeScreen: IScreen | null = null;
  private rootContainer: Container;
  private currentTransform?: ViewportTransform;
  private eventBus?: EventBus;

  constructor(rootContainer: Container, eventBus?: EventBus) {
    this.rootContainer = rootContainer;
    this.eventBus = eventBus;
  }

  public register(screen: IScreen): void {
    if (this.screens.has(screen.id)) {
      Logger.warn('SCREEN_MANAGER', `Overwriting existing screen registration: "${screen.id}"`);
    }
    this.screens.set(screen.id, screen);
  }

  public async setScreen(screenId: string): Promise<void> {
    const nextScreen = this.screens.get(screenId);
    if (!nextScreen) {
      Logger.error('SCREEN_MANAGER', `Cannot transition to unknown screen: "${screenId}"`);
      return;
    }

    const previousId = this.activeScreen ? this.activeScreen.id : null;
    Logger.info('SCREEN_MANAGER', `Transitioning screen: [${previousId || 'NONE'}] -> [${screenId}]`);

    if (this.activeScreen) {
      this.rootContainer.removeChild(this.activeScreen.container);
      this.activeScreen.destroy();
    }

    this.activeScreen = nextScreen;
    await this.activeScreen.init();

    if (this.currentTransform) {
      this.activeScreen.onResize(this.currentTransform);
    }

    this.rootContainer.addChild(this.activeScreen.container);

    if (this.eventBus) {
      this.eventBus.emit('screen:changed', { from: previousId, to: screenId });
    }
  }

  public update(deltaSeconds: number): void {
    if (this.activeScreen) {
      this.activeScreen.update(deltaSeconds);
    }
  }

  public onResize(transform: ViewportTransform): void {
    this.currentTransform = transform;
    if (this.activeScreen) {
      this.activeScreen.onResize(transform);
    }
  }

  public getActiveScreen(): IScreen | null {
    return this.activeScreen;
  }

  public getActiveScreenId(): string | null {
    return this.activeScreen ? this.activeScreen.id : null;
  }

  public destroy(): void {
    if (this.activeScreen) {
      this.rootContainer.removeChild(this.activeScreen.container);
      this.activeScreen.destroy();
      this.activeScreen = null;
    }
    this.screens.clear();
  }
}
