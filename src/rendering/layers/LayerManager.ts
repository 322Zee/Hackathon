/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Central Layer Manager coordinating the 12 rendering layers
 */

import { Container } from 'pixi.js';
import { RenderLayerType, LAYER_DEFINITIONS } from './RenderLayerType';
import { RenderLayer } from './RenderLayer';
import { Logger } from '../../core/logging/Logger';

export class LayerManager {
  private layers: Map<RenderLayerType, RenderLayer> = new Map();
  private rootWorldContainer: Container;
  private rootScreenContainer: Container;

  constructor(rootContainer: Container) {
    this.rootWorldContainer = new Container();
    this.rootWorldContainer.label = 'LayerGroup:WorldSpace';

    this.rootScreenContainer = new Container();
    this.rootScreenContainer.label = 'LayerGroup:ScreenSpace';

    rootContainer.addChild(this.rootWorldContainer);
    rootContainer.addChild(this.rootScreenContainer);

    this.initializeLayers();
  }

  private initializeLayers(): void {
    // Sort definitions by zIndex
    const sortedDefs = Object.values(LAYER_DEFINITIONS).sort((a, b) => a.zIndex - b.zIndex);

    for (const def of sortedDefs) {
      const layer = new RenderLayer(def);
      this.layers.set(def.type, layer);

      // Distribute layer to either world-space or screen-space root container
      if (def.isScreenSpace) {
        this.rootScreenContainer.addChild(layer.container);
      } else {
        this.rootWorldContainer.addChild(layer.container);
      }

      // Configure default parallax factors based on canonical layers
      this.configureDefaultParallax(layer);
    }

    Logger.info('LAYER_MANAGER', `Initialized ${this.layers.size} rendering layers.`);
  }

  private configureDefaultParallax(layer: RenderLayer): void {
    switch (layer.type) {
      case RenderLayerType.BACKGROUND:
        layer.parallaxFactor = 0.05; // Almost stationary deep space
        break;
      case RenderLayerType.DISTANT_ENVIRONMENT:
        layer.parallaxFactor = 0.15; // Slow-moving planets and moons
        break;
      case RenderLayerType.PARALLAX:
        layer.parallaxFactor = 0.35; // Distant starfield / orbital debris
        break;
      case RenderLayerType.WORLD:
      case RenderLayerType.GAMEPLAY_OBJECTS:
      case RenderLayerType.PARTICLES_ATMOSPHERE:
      case RenderLayerType.LIGHTING:
      case RenderLayerType.WORLD_EFFECTS:
      case RenderLayerType.HUD:
        layer.parallaxFactor = 1.0; // Main focal world plane
        break;
      case RenderLayerType.FOREGROUND_ENVIRONMENT:
        layer.parallaxFactor = 1.35; // Foreground structures move faster than focal camera
        break;
      case RenderLayerType.UI_OVERLAY:
      case RenderLayerType.CINEMATIC_OVERLAY:
        layer.parallaxFactor = 0.0; // Screen-locked
        break;
    }
  }

  public getLayer(type: RenderLayerType): RenderLayer {
    const layer = this.layers.get(type);
    if (!layer) {
      throw new Error(`[LayerManager] Layer "${type}" not found.`);
    }
    return layer;
  }

  public getContainer(type: RenderLayerType): Container {
    return this.getLayer(type).container;
  }

  public setVisibility(type: RenderLayerType, visible: boolean): void {
    this.getLayer(type).visible = visible;
  }

  public setAlpha(type: RenderLayerType, alpha: number): void {
    this.getLayer(type).alpha = alpha;
  }

  public setParallaxFactor(type: RenderLayerType, factor: number): void {
    this.getLayer(type).parallaxFactor = factor;
  }

  /**
   * Applies camera position and zoom to world-space layers according to parallax.
   * Screen-space layers (HUD, UI, Cinematic) remain pinned to virtual screen space.
   */
  public applyCamera(cameraX: number, cameraY: number, zoom: number): void {
    for (const layer of this.layers.values()) {
      if (layer.metadata.isScreenSpace) {
        // Pinned to screen
        layer.container.position.set(0, 0);
        layer.container.scale.set(1.0);
        continue;
      }

      // Parallax displacement relative to focal center
      const factor = layer.parallaxFactor;
      layer.container.position.set(-cameraX * factor, -cameraY * factor);

      // World layers scale with camera zoom, background parallax scales less
      if (layer.parallaxFactor === 1.0) {
        layer.container.scale.set(zoom);
      } else {
        // Attenuated zoom scaling for distant layers
        const attenuatedZoom = 1.0 + (zoom - 1.0) * factor;
        layer.container.scale.set(attenuatedZoom);
      }
    }
  }

  /**
   * Clears only dynamic world-space layers between mission/scene phases
   */
  public clearWorldLayers(): void {
    for (const layer of this.layers.values()) {
      if (!layer.metadata.isScreenSpace) {
        layer.clear();
      }
    }
  }

  /**
   * Clears all 12 layers
   */
  public clearAllLayers(): void {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
  }

  public getAllLayers(): RenderLayer[] {
    return Array.from(this.layers.values());
  }

  public destroy(): void {
    for (const layer of this.layers.values()) {
      layer.destroy();
    }
    this.layers.clear();
    this.rootWorldContainer.destroy({ children: true });
    this.rootScreenContainer.destroy({ children: true });
  }
}
