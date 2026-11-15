/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Atmospheric Haze Filter: Planetary limb glow and atmospheric scatter
 */

import { Filter, GlProgram } from 'pixi.js';
import { IGameShaderFilter, ShaderManager } from '../ShaderManager';

export interface AtmosphericHazeOptions {
  glowColor?: number[]; // [r, g, b] 0 to 1
  intensity?: number;
  thickness?: number;
}

export class AtmosphericHazeFilter implements IGameShaderFilter {
  public readonly id = 'AtmosphericHaze';
  public readonly filter: Filter;
  public enabled: boolean = true;
  private uniforms: {
    uColor: { value: number[]; type: 'vec3<f32>' };
    uIntensity: { value: number; type: 'f32' };
    uThickness: { value: number; type: 'f32' };
    uTime: { value: number; type: 'f32' };
  };

  constructor(options?: AtmosphericHazeOptions) {
    const glowColor = options?.glowColor ?? [0.22, 0.58, 0.98]; // Cyan-blue Earth atmosphere
    const intensity = options?.intensity ?? 1.2;
    const thickness = options?.thickness ?? 0.08;

    this.uniforms = {
      uColor: { value: glowColor, type: 'vec3<f32>' },
      uIntensity: { value: intensity, type: 'f32' },
      uThickness: { value: thickness, type: 'f32' },
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
          uniform vec3 uColor;
          uniform float uIntensity;
          uniform float uThickness;
          uniform float uTime;

          void main(void) {
            vec4 baseColor = texture2D(uTexture, vUV);
            float distFromCenter = distance(vUV, vec2(0.5, 0.5));
            float rim = smoothstep(0.5 - uThickness, 0.5, distFromCenter);
            float pulse = 0.95 + 0.05 * sin(uTime * 1.5);
            vec3 haze = uColor * rim * uIntensity * pulse;
            gl_FragColor = vec4(baseColor.rgb + haze, max(baseColor.a, rim * 0.7));
          }
        `;

        const glProgram = GlProgram.from({ vertex, fragment, name: 'atmospheric-haze' });
        this.filter = new Filter({
          glProgram,
          resources: {
            hazeUniforms: this.uniforms,
          },
        });
      } catch {
        this.filter = new Filter({});
      }
    } else {
      // Headless / Node testing fallback
      this.filter = new Filter({});
    }
  }

  public setGlowColor(r: number, g: number, b: number): void {
    this.uniforms.uColor.value = [r, g, b];
  }

  public setIntensity(val: number): void {
    this.uniforms.uIntensity.value = val;
  }

  public update(_deltaSeconds: number, totalTime: number): void {
    this.uniforms.uTime.value = totalTime;
  }
}
