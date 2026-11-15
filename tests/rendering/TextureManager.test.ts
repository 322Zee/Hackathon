import { describe, it, expect } from 'vitest';
import { Texture } from 'pixi.js';
import { TextureManager } from '../../src/rendering/textures/TextureManager';
import { ProceduralTextures } from '../../src/rendering/textures/ProceduralTextures';

describe('TextureManager & ProceduralTextures', () => {
  it('initializes with fallback missing placeholder and white texture', () => {
    const tm = new TextureManager();
    expect(tm.has('fallback:missing')).toBe(true);
    expect(tm.has('white')).toBe(true);
    expect(tm.get('white')).toBe(Texture.WHITE);
  });

  it('returns fallback placeholder for missing unknown textures without throwing', () => {
    const tm = new TextureManager();
    const fallback = tm.get('non_existent_texture_key');
    expect(fallback).toBe(tm.get('fallback:missing'));
  });

  it('registers and retrieves custom textures', () => {
    const tm = new TextureManager();
    const customTex = ProceduralTextures.createRadialGlowTexture();
    tm.register('radial_glow', customTex);

    expect(tm.has('radial_glow')).toBe(true);
    expect(tm.get('radial_glow')).toBe(customTex);
  });

  it('deduplicates procedural textures using getOrCreateProcedural', () => {
    const tm = new TextureManager();
    let generatorCallCount = 0;

    const tex1 = tm.getOrCreateProcedural('cached_planet', () => {
      generatorCallCount++;
      return ProceduralTextures.createPlanetTexture();
    });

    const tex2 = tm.getOrCreateProcedural('cached_planet', () => {
      generatorCallCount++;
      return ProceduralTextures.createPlanetTexture();
    });

    expect(tex1).toBe(tex2);
    expect(generatorCallCount).toBe(1);
  });
});
