import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { BaseScene } from '../../../src/scenes/BaseScene';
import { FadeTransition } from '../../../src/scenes/transitions/FadeTransition';
import { OpacityTransition } from '../../../src/scenes/transitions/OpacityTransition';
import { LoadingTransition } from '../../../src/scenes/transitions/LoadingTransition';
import { CinematicTransition } from '../../../src/scenes/transitions/CinematicTransition';

class TestScene extends BaseScene {
  public readonly id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
  protected onInitialize(): void {}
}

describe('SceneTransitions', () => {
  let overlayContainer: Container;
  let fromScene: TestScene;
  let toScene: TestScene;

  beforeEach(() => {
    overlayContainer = new Container();
    fromScene = new TestScene('FromScene');
    toScene = new TestScene('ToScene');

    // Polyfill requestAnimationFrame in Node test environment if needed
    if (typeof globalThis.requestAnimationFrame === 'undefined') {
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        return setTimeout(() => cb(performance.now()), 10);
      });
    }
  });

  it('executes FadeTransition and calls switch callback', async () => {
    const fade = new FadeTransition(0.05);
    let switchExecuted = false;

    await fade.execute(fromScene, toScene, overlayContainer, async () => {
      switchExecuted = true;
    });

    expect(switchExecuted).toBe(true);
    expect(overlayContainer.children.length).toBe(0);
  });

  it('executes OpacityTransition crossfading scene alpha', async () => {
    const opacity = new OpacityTransition(0.05);
    let switchExecuted = false;

    await opacity.execute(fromScene, toScene, overlayContainer, async () => {
      switchExecuted = true;
    });

    expect(switchExecuted).toBe(true);
    expect(toScene.container.alpha).toBe(1.0);
  });

  it('executes LoadingTransition with animated progress hold', async () => {
    const loading = new LoadingTransition(0.05);
    let switchExecuted = false;

    await loading.execute(fromScene, toScene, overlayContainer, async () => {
      switchExecuted = true;
    });

    expect(switchExecuted).toBe(true);
    expect(overlayContainer.children.length).toBe(0);
  });

  it('executes CinematicTransition with letterbox curtain animation', async () => {
    const cinematic = new CinematicTransition(0.05);
    let switchExecuted = false;

    await cinematic.execute(fromScene, toScene, overlayContainer, async () => {
      switchExecuted = true;
    });

    expect(switchExecuted).toBe(true);
    expect(overlayContainer.children.length).toBe(0);
  });
});
