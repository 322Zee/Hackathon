import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { RenderPipeline } from '../../src/rendering/pipeline/RenderPipeline';
import { RenderSystem } from '../../src/rendering/pipeline/RenderSystem';
import { RenderLayerType, LAYER_DEFINITIONS } from '../../src/rendering/layers/RenderLayerType';
import { VirtualResolution } from '../../src/rendering/VirtualResolution';
import { SystemId } from '../../src/systems/interfaces/IGameSystem';

describe('RenderPipeline (Central 12-Layer Rendering Architecture)', () => {
  it('instantiates all 12 canonical layers with correct metadata and ordering', () => {
    const root = new Container();
    const vr = new VirtualResolution(1920, 1080);
    const pipeline = new RenderPipeline(root, vr);

    const layers = pipeline.layerManager.getAllLayers();
    expect(layers.length).toBe(12);

    // Verify all 12 layer enum keys exist
    for (const type of Object.values(RenderLayerType)) {
      const layer = pipeline.layerManager.getLayer(type);
      expect(layer).toBeDefined();
      expect(layer.type).toBe(type);
      expect(layer.container.zIndex).toBe(LAYER_DEFINITIONS[type].zIndex);
      expect(layer.metadata.isScreenSpace).toBe(LAYER_DEFINITIONS[type].isScreenSpace);
    }
  });

  it('allows setting visibility, alpha, and blend modes on individual layers', () => {
    const root = new Container();
    const pipeline = new RenderPipeline(root);

    pipeline.layerManager.setVisibility(RenderLayerType.PARTICLES_ATMOSPHERE, false);
    expect(pipeline.layerManager.getLayer(RenderLayerType.PARTICLES_ATMOSPHERE).visible).toBe(false);

    pipeline.layerManager.setAlpha(RenderLayerType.LIGHTING, 0.75);
    expect(pipeline.layerManager.getLayer(RenderLayerType.LIGHTING).alpha).toBe(0.75);
  });

  it('applies parallax camera transforms: world layers move proportionally, screen layers remain pinned', () => {
    const root = new Container();
    const pipeline = new RenderPipeline(root);

    // Set camera position to (100, 200) with zoom 1.0
    pipeline.setCamera(100, 200, 1.0);
    const camera = pipeline.getCamera();
    expect(camera.x).toBe(100);
    expect(camera.y).toBe(200);

    // World layer (parallaxFactor = 1.0) moves to (-100, -200)
    const worldLayer = pipeline.layerManager.getLayer(RenderLayerType.WORLD);
    expect(worldLayer.container.position.x).toBe(-100);
    expect(worldLayer.container.position.y).toBe(-200);

    // Background layer (parallaxFactor = 0.05) moves much slower (-5, -10)
    const bgLayer = pipeline.layerManager.getLayer(RenderLayerType.BACKGROUND);
    expect(bgLayer.container.position.x).toBe(-5);
    expect(bgLayer.container.position.y).toBe(-10);

    // Foreground layer (parallaxFactor = 1.35) moves faster (-135, -270)
    const fgLayer = pipeline.layerManager.getLayer(RenderLayerType.FOREGROUND_ENVIRONMENT);
    expect(fgLayer.container.position.x).toBe(-135);
    expect(fgLayer.container.position.y).toBe(-270);

    // UI Overlay (screen-space) remains pinned at (0, 0)
    const uiLayer = pipeline.layerManager.getLayer(RenderLayerType.UI_OVERLAY);
    expect(uiLayer.container.position.x).toBe(0);
    expect(uiLayer.container.position.y).toBe(0);
  });

  it('performs depth sorting on gameplay objects layer during update', () => {
    const root = new Container();
    const pipeline = new RenderPipeline(root);
    const gameplayContainer = pipeline.getLayerContainer(RenderLayerType.GAMEPLAY_OBJECTS);

    const objA = new Container();
    objA.y = 800;
    const objB = new Container();
    objB.y = 450;
    gameplayContainer.addChild(objA, objB);

    pipeline.update(0.016);

    expect(objA.zIndex).toBe(800);
    expect(objB.zIndex).toBe(450);
    expect(objA.zIndex).toBeGreaterThan(objB.zIndex);
  });

  it('computes accurate pipeline diagnostics stats', () => {
    const root = new Container();
    const pipeline = new RenderPipeline(root);

    const stats = pipeline.getStats();
    expect(stats.layerCount).toBe(12);
    expect(stats.visibleLayerCount).toBe(12);
    expect(stats.shadersEnabled).toBe(true);
    expect(stats.viewportScale).toBe(1.0);
  });

  it('integrates seamlessly with RenderSystem implementing IRenderSystem', () => {
    const root = new Container();
    const pipeline = new RenderPipeline(root);
    const renderSystem = new RenderSystem(pipeline);

    expect(renderSystem.id).toBe(SystemId.RENDERING);
    expect(renderSystem.priority).toBe(15);
    expect(renderSystem.getRootContainer()).toBe(root);

    const hudLayer = renderSystem.getLayer(RenderLayerType.HUD);
    expect(hudLayer).toBeDefined();

    expect(renderSystem.getTransform()).toBeDefined();

    renderSystem.update(0.016);
    renderSystem.shutdown();
  });
});
