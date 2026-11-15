import { describe, it, expect } from 'vitest';
import { RenderingTestScene } from '../../src/scenes/RenderingTestScene';
import { SceneId } from '../../src/scenes/SceneId';
import { EventBus } from '../../src/core/EventBus';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';

describe('RenderingTestScene', () => {
  it('initializes with correct SceneId and populates all 12 layers', async () => {
    const scene = new RenderingTestScene();
    expect(scene.id).toBe(SceneId.PLANETARY_ENVIRONMENTS);

    const eventBus = new EventBus();
    const transform = new VirtualResolution(1920, 1080).getTransform();
    await scene.initialize({ eventBus, transform });

    const pipeline = scene.getPipeline();
    expect(pipeline).toBeDefined();

    const stats = pipeline!.getStats();
    expect(stats.layerCount).toBe(12);
    expect(stats.activeLightCount).toBe(3); // Beacon, lander floodlight, rover light
  });

  it('updates smoothly on tick without errors', async () => {
    const scene = new RenderingTestScene();
    const transform = new VirtualResolution(1920, 1080).getTransform();
    await scene.initialize({ eventBus: new EventBus(), transform });

    scene.activate();
    // Simulate 10 frames
    for (let i = 0; i < 10; i++) {
      scene.update(0.016);
    }

    await scene.deactivate();
    await scene.cleanup();
  });
});
