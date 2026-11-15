/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Central 2D/2.5D Rendering Pipeline
 * Coordinates the 12-layer hierarchy, depth simulation, lighting, shaders, and resolution scaling
 */

import { Container } from 'pixi.js';
import { LayerManager } from '../layers/LayerManager';
import { RenderLayerType } from '../layers/RenderLayerType';
import { DepthSystem } from '../depth/DepthSystem';
import { DepthSorter } from '../depth/DepthSorter';
import { LightingSystem } from '../lighting/LightingSystem';
import { ShaderManager } from '../shaders/ShaderManager';
import { TextureManager } from '../textures/TextureManager';
import { VirtualResolution, ViewportTransform } from '../VirtualResolution';
import { Logger } from '../../core/logging/Logger';

export interface RenderPipelineConfig {
  virtualWidth?: number;
  virtualHeight?: number;
  resolutionScale?: number;
}

export interface RenderPipelineStats {
  layerCount: number;
  visibleLayerCount: number;
  activeLightCount: number;
  shadersEnabled: boolean;
  viewportScale: number;
}

export class RenderPipeline {
  public readonly rootContainer: Container;
  public readonly layerManager: LayerManager;
  public readonly depthSystem: DepthSystem;
  public readonly lightingSystem: LightingSystem;
  public readonly shaderManager: ShaderManager;
  public readonly textureManager: TextureManager;
  public readonly virtualResolution: VirtualResolution;

  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraZoom: number = 1.0;

  constructor(
    rootContainer: Container,
    virtualResolution?: VirtualResolution,
    _config?: RenderPipelineConfig
  ) {
    this.rootContainer = rootContainer;
    this.rootContainer.label = 'RenderPipeline:Root';

    this.virtualResolution =
      virtualResolution ?? new VirtualResolution(1920, 1080, 1.0);

    // 1. Initialize 12-Layer Manager
    this.layerManager = new LayerManager(this.rootContainer);

    // 2. Initialize 2.5D Depth System
    this.depthSystem = new DepthSystem();

    // 3. Initialize Lighting System on the LIGHTING layer
    const lightingContainer = this.layerManager.getContainer(RenderLayerType.LIGHTING);
    this.lightingSystem = new LightingSystem(
      lightingContainer,
      this.virtualResolution.getVirtualWidth(),
      this.virtualResolution.getVirtualHeight()
    );

    // 4. Initialize Shader Manager
    this.shaderManager = new ShaderManager();

    // 5. Initialize Texture Manager
    this.textureManager = new TextureManager();

    Logger.info('RENDER_PIPELINE', 'Render Pipeline initialized with 12 layers, depth, lighting, and shaders.');
  }

  public getLayerContainer(type: RenderLayerType): Container {
    return this.layerManager.getContainer(type);
  }

  public setCamera(x: number, y: number, zoom: number = 1.0): void {
    this.cameraX = x;
    this.cameraY = y;
    this.cameraZoom = Math.max(0.1, zoom);
    this.layerManager.applyCamera(this.cameraX, this.cameraY, this.cameraZoom);
  }

  public getCamera(): { x: number; y: number; zoom: number } {
    return { x: this.cameraX, y: this.cameraY, zoom: this.cameraZoom };
  }

  /**
   * Performs dynamic Y-sorting on the gameplay object layer
   */
  public sortGameplayObjects(): void {
    const gameplayContainer = this.layerManager.getContainer(RenderLayerType.GAMEPLAY_OBJECTS);
    DepthSorter.sortContainerByY(gameplayContainer);
  }

  /**
   * Per-frame rendering pipeline tick
   */
  public update(deltaSeconds: number): void {
    // 1. Update lighting dynamics (pulsing, moving lights)
    this.lightingSystem.update(deltaSeconds);

    // 2. Update shader animations (hologram flicker, thruster ripples, limb glow)
    this.shaderManager.update(deltaSeconds);

    // 3. Y-sort dynamic entities
    this.sortGameplayObjects();
  }

  public onResize(transform: ViewportTransform): void {
    this.rootContainer.position.set(transform.offsetX, transform.offsetY);
    this.rootContainer.scale.set(transform.scale);
  }

  public getStats(): RenderPipelineStats {
    const layers = this.layerManager.getAllLayers();
    const visibleCount = layers.filter((l) => l.visible).length;
    return {
      layerCount: layers.length,
      visibleLayerCount: visibleCount,
      activeLightCount: this.lightingSystem.getLights().filter((l) => l.enabled).length,
      shadersEnabled: this.shaderManager.areShadersEnabled(),
      viewportScale: this.virtualResolution.getTransform().scale,
    };
  }

  public clearScene(): void {
    this.layerManager.clearAllLayers();
    this.lightingSystem.clearLights();
  }

  public destroy(): void {
    this.layerManager.destroy();
    this.lightingSystem.destroy();
    this.shaderManager.destroy();
    this.textureManager.clear();
    this.rootContainer.destroy({ children: true });
    Logger.info('RENDER_PIPELINE', 'Render Pipeline destroyed.');
  }
}
