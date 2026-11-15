/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Cinematic Vignette Filter: Peripheral lens shading and contrast framing
 */

import { Filter, GlProgram } from 'pixi.js';
import { IGameShaderFilter, ShaderManager } from '../ShaderManager';

export interface VignetteOptions {
  radius?: number; // Inner clear circle radius (0 to 1)
  softness?: number; // Edge falloff width (0 to 1)
  intensity?: number; // Darkness factor (0 to 1)
}

export class VignetteFilter implements IGameShaderFilter {
  public readonly id = 'Vignette';
  public readonly filter: Filter;
  public enabled: boolean = true;
  private uniforms: {
    uRadius: { value: number; type: 'f32' };
    uSoftness: { value: number; type: 'f32' };
    uIntensity: { value: number; type: 'f32' };
  };

  constructor(options?: VignetteOptions) {
    this.uniforms = {
      uRadius: { value: options?.radius ?? 0.45, type: 'f32' },
      uSoftness: { value: options?.softness ?? 0.45, type: 'f32' },
      uIntensity: { value: options?.intensity ?? 0.65, type: 'f32' },
    };

    if (ShaderManager.isShaderEnvironmentSupported()) {
      try {
        const vertex = `
          attribute vec2 aPosition;
          attribute vec2 aUV;
          varying vec2 vUV;
          void main(void) {
            gl_Position = vec4(aPosition, 0.0, 1.0);
            vUV = aUV;
          }
        `;

        const fragment = `
          precision mediump float;
          varying vec2 vUV;
          uniform sampler2D uTexture;
          uniform float uRadius;
          uniform float uSoftness;
          uniform float uIntensity;

          void main(void) {
            vec4 color = texture2D(uTexture, vUV);
            float dist = distance(vUV, vec2(0.5, 0.5));
            float vignette = smoothstep(uRadius, uRadius + uSoftness, dist);
            color.rgb = mix(color.rgb, color.rgb * (1.0 - uIntensity), vignette);
            gl_FragColor = color;
          }
        `;

        const glProgram = GlProgram.from({ vertex, fragment, name: 'cinematic-vignette' });
        this.filter = new Filter({
          glProgram,
          resources: {
            vignetteUniforms: this.uniforms,
          },
        });
      } catch {
        this.filter = new Filter({});
      }
    } else {
      this.filter = new Filter({});
    }
  }

  public update(_deltaSeconds: number, _totalTime: number): void {
    // Static uniforms unless updated via setter
  }
}
