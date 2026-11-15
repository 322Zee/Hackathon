/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Predefined Lighting Environments
 */

import { LightingEnvironmentPreset } from './LightTypes';

export const LIGHTING_PRESETS: Record<string, LightingEnvironmentPreset> = {
  HEADQUARTERS: {
    name: 'HEADQUARTERS',
    ambient: { color: 0x334155, intensity: 0.8 },
    defaultLightColor: 0xe2e8f0,
    fogDensity: 0.1,
    description: 'Clean indoor fluorescent and digital terminal lighting',
  },
  ROCKET_FACILITY: {
    name: 'ROCKET_FACILITY',
    ambient: { color: 0x1e293b, intensity: 0.55 },
    defaultLightColor: 0xfbbf24, // Amber warning floodlights
    fogDensity: 0.25,
    description: 'Industrial assembly bay with amber hazard floodlights and gantries',
  },
  PLANETARY_DAY: {
    name: 'PLANETARY_DAY',
    ambient: { color: 0xffffff, intensity: 0.95 },
    defaultLightColor: 0xffedd5, // Warm solar illumination
    fogDensity: 0.2,
    description: 'Direct high-noon solar illumination on planetary surface',
  },
  PLANETARY_NIGHT: {
    name: 'PLANETARY_NIGHT',
    ambient: { color: 0x060d17, intensity: 0.18 },
    defaultLightColor: 0x38bdf8, // Cold lunar cyan rim light
    fogDensity: 0.4,
    description: 'Pitch-dark planetary night with rover headlights and starshine',
  },
  MARS_SURFACE: {
    name: 'MARS_SURFACE',
    ambient: { color: 0x4a1e17, intensity: 0.45 },
    defaultLightColor: 0xf97316, // Rust orange atmosphere
    fogDensity: 0.5,
    description: 'Red planet twilight with dust suspension and low-angle sun',
  },
  DEEP_SPACE: {
    name: 'DEEP_SPACE',
    ambient: { color: 0x020408, intensity: 0.08 },
    defaultLightColor: 0xe0f2fe, // Hard, stark unfiltered starlight
    fogDensity: 0.05,
    description: 'Deep cosmic void with intense local spacecraft exterior spotters',
  },
};
