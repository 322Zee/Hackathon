/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Render Layer Instance Wrapper
 */

import { Container } from 'pixi.js';
import { RenderLayerType, LayerMetadata } from './RenderLayerType';

export class RenderLayer {
  public readonly type: RenderLayerType;
  public readonly metadata: LayerMetadata;
  public readonly container: Container;

  /**
   * Parallax scroll multiplier for this layer.
   * 0.0 = static / infinite distance
   * 1.0 = standard focal plane (moves 1:1 with camera)
   * > 1.0 = foreground layer (moves faster than camera)
   */
  public parallaxFactor: number = 1.0;

  constructor(metadata: LayerMetadata) {
    this.type = metadata.type;
    this.metadata = metadata;
    this.container = new Container();
    this.container.label = `Layer:${metadata.type}`;
    this.container.zIndex = metadata.zIndex;
    (this.container as any).blendMode = metadata.defaultBlendMode as any;

    // Enable child sorting for gameplay object layer
    if (this.type === RenderLayerType.GAMEPLAY_OBJECTS) {
      this.container.sortableChildren = true;
    }
  }

  public get visible(): boolean {
    return this.container.visible;
  }

  public set visible(val: boolean) {
    this.container.visible = val;
  }

  public get alpha(): number {
    return this.container.alpha;
  }

  public set alpha(val: number) {
    this.container.alpha = Math.max(0, Math.min(1, val));
  }

  public setBlendMode(mode: string): void {
    (this.container as any).blendMode = mode as any;
  }

  public addChild<T extends Container[]>(...children: T): T[0] {
    return this.container.addChild(...children);
  }

  public removeChild<T extends Container[]>(...children: T): T[0] {
    return this.container.removeChild(...children);
  }

  public clear(): void {
    this.container.removeChildren();
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
