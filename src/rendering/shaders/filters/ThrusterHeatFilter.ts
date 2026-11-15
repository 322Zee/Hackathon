/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Thruster Heat Filter: Rocket engine exhaust thermal ripple and distortion
 */

import { Filter, GlProgram } from 'pixi.js';
import { IGameShaderFilter, ShaderManager } from '../ShaderManager';

export interface ThrusterHeatOptions {
  speed?: number;
  frequency?: number;
  amplitude?: number;
}

export class ThrusterHeatFilter implements IGameShaderFilter {
  public readonly id = 'ThrusterHeat';
  public readonly filter: Filter;
  public enabled: boolean = true;
  private uniforms: {
    uSpeed: { value: number; type: 'f32' };
    uFrequency: { value: number; type: 'f32' };
    uAmplitude: { value: number; type: 'f32' };
    uTime: { value: number; type: 'f32' };
  };

  constructor(options?: ThrusterHeatOptions) {
    this.uniforms = {
      uSpeed: { value: options?.speed ?? 4.0, type: 'f32' },
      uFrequency: { value: options?.frequency ?? 25.0, type: 'f32' },
      uAmplitude: { value: options?.amplitude ?? 0.006, type: 'f32' },
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
          uniform float uSpeed;
          uniform float uFrequency;
          uniform float uAmplitude;
          uniform float uTime;

          void main(void) {
            // Ripple displacement
            float wave = sin(vUV.y * uFrequency + uTime * uSpeed);
            vec2 distortedUV = vUV + vec2(wave * uAmplitude, 0.0);
            vec4 color = texture2D(uTexture, distortedUV);
            gl_FragColor = color;
          }
        `;

        const glProgram = GlProgram.from({ vertex, fragment, name: 'thruster-heat' });
        this.filter = new Filter({
          glProgram,
          resources: {
            heatUniforms: this.uniforms,
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
