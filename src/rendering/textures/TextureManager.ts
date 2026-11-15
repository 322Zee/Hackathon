/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Central Texture Manager and Cache
 */

import { Texture } from 'pixi.js';
import { ProceduralTextures } from './ProceduralTextures';
import { Logger } from '../../core/logging/Logger';

export class TextureManager {
  private textures: Map<string, Texture> = new Map();
  private placeholderTexture: Texture;

  constructor() {
    this.placeholderTexture = ProceduralTextures.createMissingTexturePlaceholder();
    this.register('fallback:missing', this.placeholderTexture);
    this.register('white', Texture.WHITE);
  }

  public register(id: string, texture: Texture): void {
    if (this.textures.has(id)) {
      Logger.warn('TEXTURE_MANAGER', `Texture with id "${id}" is already registered. Overwriting.`);
    }
    this.textures.set(id, texture);
  }

  public get(id: string): Texture {
    const tex = this.textures.get(id);
    if (!tex) {
      Logger.warn('TEXTURE_MANAGER', `Texture "${id}" not found in cache. Serving fallback placeholder.`);
      return this.placeholderTexture;
    }
    return tex;
  }

  public has(id: string): boolean {
    return this.textures.has(id);
  }

  public getOrCreateProcedural(id: string, generator: () => Texture): Texture {
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }
    const created = generator();
    this.register(id, created);
    return created;
  }

  public clear(): void {
    for (const [id, tex] of this.textures.entries()) {
      if (id !== 'fallback:missing' && id !== 'white') {
        try {
          tex.destroy(true);
        } catch {
          // Safe disposal
        }
      }
    }
    this.textures.clear();
    this.register('fallback:missing', this.placeholderTexture);
    this.register('white', Texture.WHITE);
  }
}
