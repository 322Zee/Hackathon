/**
 * INTERSTELLAR CONTINUUM - Rendering Architecture
 * Render Layer Types and Layer Metadata
 */

export enum RenderLayerType {
  /** 1. Background layer: Deep space, cosmological backdrop, distant nebulae */
  BACKGROUND = 'BACKGROUND',

  /** 2. Distant environment layer: Planets, moons, horizons, deep astronomical bodies */
  DISTANT_ENVIRONMENT = 'DISTANT_ENVIRONMENT',

  /** 3. Parallax layer: Starfields, dust lanes, orbital debris scrolling at scaled depth */
  PARALLAX = 'PARALLAX',

  /** 4. Main world layer: Terrain, static structures, launchpads, facility floors */
  WORLD = 'WORLD',

  /** 5. Gameplay object layer: Dynamic entities, rovers, spacecraft, astronauts, cargo */
  GAMEPLAY_OBJECTS = 'GAMEPLAY_OBJECTS',

  /** 6. Foreground environment layer: Silhouette structures, gantry towers, framing structures */
  FOREGROUND_ENVIRONMENT = 'FOREGROUND_ENVIRONMENT',

  /** 7. Particle and atmosphere layer: Thruster exhaust, atmospheric dust, re-entry sparks */
  PARTICLES_ATMOSPHERE = 'PARTICLES_ATMOSPHERE',

  /** 8. Lighting layer: 2D dynamic lightmap, ambient darkness mask, point lights */
  LIGHTING = 'LIGHTING',

  /** 9. World effects layer: Shockwaves, heat ripples, holographic scanner projections */
  WORLD_EFFECTS = 'WORLD_EFFECTS',

  /** 10. HUD layer: In-world trajectory lines, docking reticles, navigation markers */
  HUD = 'HUD',

  /** 11. Interface overlay layer: Screen-space UI panels, resource gauges, telemetry buttons */
  UI_OVERLAY = 'UI_OVERLAY',

  /** 12. Cinematic overlay layer: Anamorphic letterbox bars, color grading, transition wipes */
  CINEMATIC_OVERLAY = 'CINEMATIC_OVERLAY',
}

export interface LayerMetadata {
  readonly type: RenderLayerType;
  readonly zIndex: number;
  readonly isScreenSpace: boolean;
  readonly defaultBlendMode: string;
  readonly description: string;
}

/**
 * Canonical ordering of the 12 rendering layers.
 * Lower zIndex renders beneath higher zIndex.
 */
export const LAYER_DEFINITIONS: Record<RenderLayerType, LayerMetadata> = {
  [RenderLayerType.BACKGROUND]: {
    type: RenderLayerType.BACKGROUND,
    zIndex: 100,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Deep space cosmic background and distant celestial nebula',
  },
  [RenderLayerType.DISTANT_ENVIRONMENT]: {
    type: RenderLayerType.DISTANT_ENVIRONMENT,
    zIndex: 200,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Planetary limbs, celestial horizons, and astronomical bodies',
  },
  [RenderLayerType.PARALLAX]: {
    type: RenderLayerType.PARALLAX,
    zIndex: 300,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Layered parallax starfields and orbital debris',
  },
  [RenderLayerType.WORLD]: {
    type: RenderLayerType.WORLD,
    zIndex: 400,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Static planetary terrain, landing pads, and facility architecture',
  },
  [RenderLayerType.GAMEPLAY_OBJECTS]: {
    type: RenderLayerType.GAMEPLAY_OBJECTS,
    zIndex: 500,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Dynamic game objects, spacecraft, rovers, astronauts (Y-sorted)',
  },
  [RenderLayerType.FOREGROUND_ENVIRONMENT]: {
    type: RenderLayerType.FOREGROUND_ENVIRONMENT,
    zIndex: 600,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Foreground silhouettes, gantry frames, and overhangs',
  },
  [RenderLayerType.PARTICLES_ATMOSPHERE]: {
    type: RenderLayerType.PARTICLES_ATMOSPHERE,
    zIndex: 700,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Atmospheric weather, thruster plumes, exhaust particles',
  },
  [RenderLayerType.LIGHTING]: {
    type: RenderLayerType.LIGHTING,
    zIndex: 800,
    isScreenSpace: false,
    defaultBlendMode: 'multiply',
    description: '2D dynamic lighting lightmap and illumination mask',
  },
  [RenderLayerType.WORLD_EFFECTS]: {
    type: RenderLayerType.WORLD_EFFECTS,
    zIndex: 900,
    isScreenSpace: false,
    defaultBlendMode: 'add',
    description: 'Thermal distortion, scanning lasers, energy field telemetry',
  },
  [RenderLayerType.HUD]: {
    type: RenderLayerType.HUD,
    zIndex: 1000,
    isScreenSpace: false,
    defaultBlendMode: 'normal',
    description: 'Tactical telemetry, orbit trajectories, target indicators',
  },
  [RenderLayerType.UI_OVERLAY]: {
    type: RenderLayerType.UI_OVERLAY,
    zIndex: 1100,
    isScreenSpace: true,
    defaultBlendMode: 'normal',
    description: 'Screen-space UI controls, mission status, dialog panels',
  },
  [RenderLayerType.CINEMATIC_OVERLAY]: {
    type: RenderLayerType.CINEMATIC_OVERLAY,
    zIndex: 1200,
    isScreenSpace: true,
    defaultBlendMode: 'normal',
    description: 'Cinematic letterboxing, vignette, post-process screen effects',
  },
};
