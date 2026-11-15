/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * 2D Lighting System Types and Interfaces
 */

export enum LightType {
  POINT = 'POINT',
  SPOT = 'SPOT',
  AMBIENT = 'AMBIENT',
  DIRECTIONAL = 'DIRECTIONAL',
}

export enum FalloffType {
  LINEAR = 'LINEAR',
  SMOOTH = 'SMOOTH',
  EXPONENTIAL = 'EXPONENTIAL',
}

export interface LightSourceConfig {
  id: string;
  type: LightType;
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number; // 0.0 to 1.0+
  falloff?: FalloffType;
  direction?: number; // In radians for spot lights
  coneAngle?: number; // In radians for spot lights
  pulseSpeed?: number; // Radians per second for pulsation
  pulseIntensityMin?: number;
  pulseIntensityMax?: number;
  castsShadow?: boolean;
  enabled?: boolean;
}

export interface AmbientLightConfig {
  color: number;
  intensity: number; // 0.0 (pitch black) to 1.0 (fully lit)
}

export interface LightingEnvironmentPreset {
  name: string;
  ambient: AmbientLightConfig;
  defaultLightColor: number;
  fogDensity: number;
  description: string;
}
