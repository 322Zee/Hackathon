import { describe, it, expect, beforeEach } from 'vitest';
import { AssetManager } from '../../src/assets/AssetManager';
import { AssetType } from '../../src/assets/AssetType';
import { EventBus } from '../../src/core/EventBus';

describe('AssetManager Architecture', () => {
  let eventBus: EventBus;
  let assetManager: AssetManager;

  beforeEach(() => {
    eventBus = new EventBus();
    assetManager = new AssetManager(eventBus);
  });

  it('registers asset metadata with initial UNLOADED state', () => {
    assetManager.registerAsset('engine_plume', AssetType.PARTICLE_TEXTURE, '/assets/particles/plume.png');

    expect(assetManager.getAssetState('engine_plume')).toBe('UNLOADED');
  });

  it('tracks bundle loading state and emits events', async () => {
    let loadedBundle = '';
    eventBus.on('assets:loaded', ({ bundle }) => {
      loadedBundle = bundle;
    });

    await assetManager.loadBundle('textures');

    expect(assetManager.isBundleLoaded('textures')).toBe(true);
    expect(loadedBundle).toBe('textures');
  });

  it('prevents redundant bundle loading when already loaded', async () => {
    await assetManager.loadBundle('core');
    expect(assetManager.isBundleLoaded('core')).toBe(true);

    let progressCalls = 0;
    await assetManager.loadBundle('core', (progress) => {
      if (progress === 1.0) progressCalls++;
    });

    expect(progressCalls).toBe(1);
  });

  it('shuts down cleanly and clears asset cache', async () => {
    await assetManager.loadBundle('audio');
    expect(assetManager.isBundleLoaded('audio')).toBe(true);

    await assetManager.shutdown();
    expect(assetManager.isBundleLoaded('audio')).toBe(false);
  });
});
