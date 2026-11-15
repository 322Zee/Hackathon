/**
 * INTERSTELLAR CONTINUUM - Camera & Viewport Architecture
 * Camera Modes and Zoom Presets
 */

export enum CameraMode {
  /** 1. Smoothly tracks the player/rover with deadzone and velocity lookahead */
  PLAYER_FOLLOW = 'PLAYER_FOLLOW',

  /** 2. Unconstrained or manual mouse/keyboard panning */
  FREE = 'FREE',

  /** 3. Scripted cinematic pans, gentle floating drift, and slow rotation */
  CINEMATIC = 'CINEMATIC',

  /** 4. High-altitude strategic view of the operational zone */
  MISSION_OVERVIEW = 'MISSION_OVERVIEW',

  /** 5. Large-scale surface map with terrain bounds clamping */
  PLANETARY_EXPLORATION = 'PLANETARY_EXPLORATION',

  /** 6. Facility room-to-room / floor-focused interior exploration */
  HEADQUARTERS = 'HEADQUARTERS',

  /** 7. Focus on a terminal, console, or workbench with screen offset */
  INTERFACE_FOCUSED = 'INTERFACE_FOCUSED',
}

export enum ZoomPreset {
  CLOSE_INTERACTION = 1.8,
  NORMAL_EXPLORATION = 1.0,
  WIDE_ENVIRONMENT = 0.65,
  MISSION_OVERVIEW = 0.4,
  MAP_VIEW = 0.25,
}

export interface CameraModeConfig {
  mode: CameraMode;
  followSmoothing: number; // 0.05 to 1.0 (lower is smoother, 1.0 is instant)
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  allowManualPan: boolean;
  allowManualZoom: boolean;
  useDeadzone: boolean;
  useLookahead: boolean;
}

export const CAMERA_MODE_DEFAULTS: Record<CameraMode, CameraModeConfig> = {
  [CameraMode.PLAYER_FOLLOW]: {
    mode: CameraMode.PLAYER_FOLLOW,
    followSmoothing: 0.12,
    defaultZoom: ZoomPreset.NORMAL_EXPLORATION,
    minZoom: 0.5,
    maxZoom: 2.5,
    allowManualPan: false,
    allowManualZoom: true,
    useDeadzone: true,
    useLookahead: true,
  },
  [CameraMode.FREE]: {
    mode: CameraMode.FREE,
    followSmoothing: 0.2,
    defaultZoom: ZoomPreset.NORMAL_EXPLORATION,
    minZoom: 0.2,
    maxZoom: 5.0,
    allowManualPan: true,
    allowManualZoom: true,
    useDeadzone: false,
    useLookahead: false,
  },
  [CameraMode.CINEMATIC]: {
    mode: CameraMode.CINEMATIC,
    followSmoothing: 0.04,
    defaultZoom: ZoomPreset.WIDE_ENVIRONMENT,
    minZoom: 0.4,
    maxZoom: 2.0,
    allowManualPan: false,
    allowManualZoom: false,
    useDeadzone: false,
    useLookahead: false,
  },
  [CameraMode.MISSION_OVERVIEW]: {
    mode: CameraMode.MISSION_OVERVIEW,
    followSmoothing: 0.1,
    defaultZoom: ZoomPreset.MISSION_OVERVIEW,
    minZoom: 0.2,
    maxZoom: 1.0,
    allowManualPan: true,
    allowManualZoom: true,
    useDeadzone: false,
    useLookahead: false,
  },
  [CameraMode.PLANETARY_EXPLORATION]: {
    mode: CameraMode.PLANETARY_EXPLORATION,
    followSmoothing: 0.1,
    defaultZoom: ZoomPreset.NORMAL_EXPLORATION,
    minZoom: 0.35,
    maxZoom: 2.5,
    allowManualPan: true,
    allowManualZoom: true,
    useDeadzone: true,
    useLookahead: true,
  },
  [CameraMode.HEADQUARTERS]: {
    mode: CameraMode.HEADQUARTERS,
    followSmoothing: 0.15,
    defaultZoom: ZoomPreset.NORMAL_EXPLORATION,
    minZoom: 0.8,
    maxZoom: 2.2,
    allowManualPan: false,
    allowManualZoom: true,
    useDeadzone: true,
    useLookahead: false,
  },
  [CameraMode.INTERFACE_FOCUSED]: {
    mode: CameraMode.INTERFACE_FOCUSED,
    followSmoothing: 0.18,
    defaultZoom: ZoomPreset.CLOSE_INTERACTION,
    minZoom: 1.2,
    maxZoom: 3.0,
    allowManualPan: false,
    allowManualZoom: true,
    useDeadzone: false,
    useLookahead: false,
  },
};
