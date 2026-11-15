export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface DisplayConfig {
  virtualWidth: number;
  virtualHeight: number;
  resolutionScale: number;
  targetFps: number;
  vSync: boolean;
  fullscreen: boolean;
}

export interface GraphicsConfig {
  quality: GraphicsQuality;
  particlesEnabled: boolean;
  maxParticles: number;
  bloomEnabled: boolean;
  starfieldDensity: number;
  atmosphericShaders: boolean;
  antialias: boolean;
}

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  uiVolume: number;
  ambienceVolume: number;
  dialogueVolume?: number;
  muted: boolean;
}

export interface KeyBindings {
  panUp: string;
  panDown: string;
  panLeft: string;
  panRight: string;
  zoomIn: string;
  zoomOut: string;
  pauseTime: string;
  timeAccel: string;
  interact: string;
  abortMission: string;
  resetCamera: string;
}

export interface AccessibilityConfig {
  uiScale: number;
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
  highContrastSubtitles: boolean;
  screenReaderHints: boolean;
}

export interface GameConfiguration {
  display: DisplayConfig;
  graphics: GraphicsConfig;
  audio: AudioConfig;
  input: KeyBindings;
  accessibility: AccessibilityConfig;
}

export const DEFAULT_GAME_CONFIG: GameConfiguration = {
  display: {
    virtualWidth: 1920,
    virtualHeight: 1080,
    resolutionScale: 1.0,
    targetFps: 60,
    vSync: true,
    fullscreen: false,
  },
  graphics: {
    quality: 'HIGH',
    particlesEnabled: true,
    maxParticles: 2000,
    bloomEnabled: true,
    starfieldDensity: 300,
    atmosphericShaders: true,
    antialias: true,
  },
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiVolume: 0.8,
    ambienceVolume: 0.7,
    dialogueVolume: 0.9,
    muted: false,
  },
  input: {
    panUp: 'KeyW',
    panDown: 'KeyS',
    panLeft: 'KeyA',
    panRight: 'KeyD',
    zoomIn: 'Equal',
    zoomOut: 'Minus',
    pauseTime: 'Space',
    timeAccel: 'KeyT',
    interact: 'KeyE',
    abortMission: 'Backspace',
    resetCamera: 'KeyR',
  },
  accessibility: {
    uiScale: 1.0,
    colorblindMode: 'none',
    reducedMotion: false,
    highContrastSubtitles: true,
    screenReaderHints: false,
  },
};
