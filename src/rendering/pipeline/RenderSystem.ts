/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * RenderSystem: Game system wrapper around RenderPipeline implementing IRenderSystem
 */

import { Container } from 'pixi.js';
import { IRenderSystem } from '../../systems/interfaces/CoreSystemInterfaces';
import { SystemId } from '../../systems/interfaces/IGameSystem';
import { ViewportTransform } from '../VirtualResolution';
import { RenderPipeline } from './RenderPipeline';
import { RenderLayerType } from '../layers/RenderLayerType';
import { Logger } from '../../core/logging/Logger';

export class RenderSystem implements IRenderSystem {
  public readonly id = SystemId.RENDERING;
  public readonly priority = 15; // Initializes right after Input (priority 10)
  public readonly pipeline: RenderPipeline;

  constructor(pipeline: RenderPipeline) {
    this.pipeline = pipeline;
  }

  public initialize(): void {
    Logger.info('RENDER_SYSTEM', 'RenderSystem registered and initialized.');
  }

  public update(deltaSeconds: number): void {
    this.pipeline.update(deltaSeconds);
  }

  public getRootContainer(): Container {
    return this.pipeline.rootContainer;
  }

  public getLayer(layerName: string): Container | undefined {
    try {
      const type = layerName as RenderLayerType;
      return this.pipeline.getLayerContainer(type);
    } catch {
      return undefined;
    }
  }

  public getTransform(): ViewportTransform {
    return this.pipeline.virtualResolution.getTransform();
  }

  public shutdown(): void {
    Logger.info('RENDER_SYSTEM', 'RenderSystem shutdown.');
  }
}
