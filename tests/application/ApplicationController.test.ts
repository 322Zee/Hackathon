import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationController } from '../../src/application/ApplicationController';
import { RenderEngine } from '../../src/rendering/RenderEngine';
import { Container } from 'pixi.js';

describe('ApplicationController', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    mockContainer = {
      clientWidth: 1920,
      clientHeight: 1080,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    } as unknown as HTMLElement;

    // Provide mock layers so ScreenManager and application lifecycle can run in headless test
    vi.spyOn(RenderEngine.prototype, 'initialize').mockImplementation(async function (this: any) {
      this.layers = {
        background: new Container(),
        world: new Container(),
        entities: new Container(),
        effects: new Container(),
        hud: new Container(),
        screen: new Container(),
        transitionOverlay: new Container(),
      };
      this.isInitialized = true;
    });

    vi.spyOn(RenderEngine.prototype, 'getApp').mockReturnValue({
      ticker: {
        add: vi.fn(),
      },
      destroy: vi.fn(),
    } as any);

    vi.spyOn(RenderEngine.prototype, 'destroy').mockImplementation(function (this: any) {
      this.isInitialized = false;
    });
  });

  afterEach(() => {
    const app = ApplicationController.getInstance();
    if (app && app.getLifecycleState() !== 'SHUTDOWN') {
      app.shutdown();
    }
    vi.restoreAllMocks();
  });

  it('starts in UNINITIALIZED state and transitions to RUNNING after bootstrap', async () => {
    const app = new ApplicationController({ containerElement: mockContainer });
    expect(app.getLifecycleState()).toBe('UNINITIALIZED');

    await app.bootstrap();
    expect(app.getLifecycleState()).toBe('RUNNING');
  });

  it('prevents duplicate bootstrap calls', async () => {
    const app = new ApplicationController({ containerElement: mockContainer });
    await app.bootstrap();

    // Second bootstrap call should be ignored without throwing
    await app.bootstrap();
    expect(app.getLifecycleState()).toBe('RUNNING');
  });

  it('provides access to initialized core subsystems', async () => {
    const app = new ApplicationController({ containerElement: mockContainer });
    await app.bootstrap();

    expect(app.getConfigManager()).toBeDefined();
    expect(app.getGameStateManager()).toBeDefined();
    expect(app.getSystemRegistry()).toBeDefined();
    expect(app.getInputManager()).toBeDefined();
    expect(app.getRenderEngine()).toBeDefined();
    expect(app.getSceneManager()).toBeDefined();
    expect(app.getAssetManager()).toBeDefined();
    expect(app.getAudioService()).toBeDefined();
    expect(app.getEventBus()).toBeDefined();
  });

  it('shuts down cleanly and transitions to SHUTDOWN state', async () => {
    const app = new ApplicationController({ containerElement: mockContainer });
    await app.bootstrap();

    app.shutdown();
    expect(app.getLifecycleState()).toBe('SHUTDOWN');
    expect(ApplicationController.getInstance()).toBeNull();
  });
});
