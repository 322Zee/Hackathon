/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Scanline Hologram Filter: Tactical HUD scanlines, flicker, and chromatic shift
 */

import { Filter, GlProgram } from 'pixi.js';
import { IGameShaderFilter, ShaderManager } from '../ShaderManager';

export interface ScanlineHologramOptions {
  lineCount?: number;
  flickerSpeed?: number;
  chromaticShift?: number;
}

export class ScanlineHologramFilter implements IGameShaderFilter {
  public readonly id = 'ScanlineHologram';
  public readonly filter: Filter;
  public enabled: boolean = true;
  private uniforms: {
    uLineCount: { value: number; type: 'f32' };
    uFlickerSpeed: { value: number; type: 'f32' };
    uChromaticShift: { value: number; type: 'f32' };
    uTime: { value: number; type: 'f32' };
  };

  constructor(options?: ScanlineHologramOptions) {
    this.uniforms = {
      uLineCount: { value: options?.lineCount ?? 280.0, type: 'f32' },
      uFlickerSpeed: { value: options?.flickerSpeed ?? 12.0, type: 'f32' },
      uChromaticShift: { value: options?.chromaticShift ?? 0.002, type: 'f32' },
      uTime: { value: 0.0, type: 'f32' },
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
          uniform float uLineCount;
          uniform float uFlickerSpeed;
          uniform float uChromaticShift;
          uniform float uTime;

          void main(void) {
            // Subtle chromatic aberration
            vec2 redUV = vUV + vec2(uChromaticShift, 0.0);
            vec2 blueUV = vUV - vec2(uChromaticShift, 0.0);
            float r = texture2D(uTexture, redUV).r;
            float g = texture2D(uTexture, vUV).g;
            float b = texture2D(uTexture, blueUV).b;
            float a = texture2D(uTexture, vUV).a;

            // Scanline horizontal bands
            float scanline = sin((vUV.y + uTime * 0.05) * uLineCount * 3.14159) * 0.08;
            // Subtle micro flicker
            float flicker = 0.97 + 0.03 * sin(uTime * uFlickerSpeed);

            vec3 color = (vec3(r, g, b) - scanline) * flicker;
            gl_FragColor = vec4(color, a);
          }
        `;

        const glProgram = GlProgram.from({ vertex, fragment, name: 'scanline-hologram' });
        this.filter = new Filter({
          glProgram,
          resources: {
            hologramUniforms: this.uniforms,
          },
        });
      } catch {
        this.filter = new Filter({});
      }
    } else {
      this.filter = new Filter({});
    }
  }

  public update(_deltaSeconds: number, totalTime: number): void {
    this.uniforms.uTime.value = totalTime;
  }
}
