/**
 * INTERSTELLAR CONTINUUM - Settings & Configuration Architecture
 * Strongly typed settings data model, categories, validation rules, and presets.
 */

import { InputAction } from '../input/InputAction';

export type SettingsCategory =
  | 'GRAPHICS'
  | 'AUDIO'
  | 'CONTROLS'
  | 'ACCESSIBILITY'
  | 'INTERFACE'
  | 'GAMEPLAY';

export type GraphicsQualityPreset = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'CUSTOM';
export type QualityTier = 'LOW' | 'MEDIUM' | 'HIGH';
export type ColorblindType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type TextSizeOption = 'NORMAL' | 'LARGE';
export type PromptStyleOption = 'DETAILED' | 'COMPACT' | 'BADGE_ONLY';

export interface GraphicsSettings {
  quality: GraphicsQualityPreset;
  resolutionScale: number;
  fullscreen: boolean;
  targetFps: number; // 30, 60, 120, 0 (0 = unlimited)
  vSync: boolean;
  particleQuality: QualityTier;
  lightingQuality: QualityTier;
  shadowQuality: QualityTier;
  atmosphericShaders: boolean;
  bloomEnabled: boolean;
  parallaxEnabled: boolean;
  cameraEffects: boolean;
  uiVisualEffects: boolean;
}

export interface AudioSettings {
  masterVolume: number; // 0.0 - 1.0
  musicVolume: number;
  ambienceVolume: number;
  uiVolume: number;
  sfxVolume: number;
  dialogueVolume: number;
  muted: boolean;
}

export interface ControlsSettings {
  bindings: Record<InputAction, string[]>;
}

export interface AccessibilitySettings {
  uiScale: number; // 0.8, 1.0, 1.2, 1.4
  textSize: TextSizeOption;
  reducedMotion: boolean;
  reducedCameraShake: number; // 0.0 - 1.0 multiplier
  highContrastUI: boolean;
  colorIndependentIndicators: boolean;
  interactionReminders: boolean;
  subtitlesEnabled: boolean;
  highContrastSubtitles: boolean;
  colorblindMode: ColorblindType;
}

export interface InterfaceSettings {
  hudVisible: boolean;
  minimapVisible: boolean;
  tooltipVisible: boolean;
  tooltipDelayMs: number;
  notificationDuration: number;
  reduceInterfaceAnimations: boolean;
}

export interface GameplaySettings {
  autoPauseOnFocusLoss: boolean;
  interactionPromptStyle: PromptStyleOption;
  tutorialReminders: boolean;
  cameraFollowSensitivity: number; // 0.5 - 2.0
  cameraSmoothing: number; // 0.05 - 0.3
}

export interface FullSettingsSchema {
  schemaVersion: number;
  graphics: GraphicsSettings;
  audio: AudioSettings;
  controls: ControlsSettings;
  accessibility: AccessibilitySettings;
  interface: InterfaceSettings;
  gameplay: GameplaySettings;
}

export const GRAPHICS_PRESETS: Record<
  Exclude<GraphicsQualityPreset, 'CUSTOM'>,
  Omit<GraphicsSettings, 'quality' | 'resolutionScale' | 'fullscreen' | 'targetFps' | 'vSync'>
> = {
  LOW: {
    particleQuality: 'LOW',
    lightingQuality: 'LOW',
    shadowQuality: 'LOW',
    atmosphericShaders: false,
    bloomEnabled: false,
    parallaxEnabled: false,
    cameraEffects: false,
    uiVisualEffects: false,
  },
  MEDIUM: {
    particleQuality: 'MEDIUM',
    lightingQuality: 'MEDIUM',
    shadowQuality: 'MEDIUM',
    atmosphericShaders: true,
    bloomEnabled: false,
    parallaxEnabled: true,
    cameraEffects: true,
    uiVisualEffects: true,
  },
  HIGH: {
    particleQuality: 'HIGH',
    lightingQuality: 'HIGH',
    shadowQuality: 'HIGH',
    atmosphericShaders: true,
    bloomEnabled: true,
    parallaxEnabled: true,
    cameraEffects: true,
    uiVisualEffects: true,
  },
  ULTRA: {
    particleQuality: 'HIGH',
    lightingQuality: 'HIGH',
    shadowQuality: 'HIGH',
    atmosphericShaders: true,
    bloomEnabled: true,
    parallaxEnabled: true,
    cameraEffects: true,
    uiVisualEffects: true,
  },
};

export const DEFAULT_CONTROLS_BINDINGS: Record<InputAction, string[]> = {
  [InputAction.MoveUp]: ['KeyW', 'ArrowUp'],
  [InputAction.MoveDown]: ['KeyS', 'ArrowDown'],
  [InputAction.MoveLeft]: ['KeyA', 'ArrowLeft'],
  [InputAction.MoveRight]: ['KeyD', 'ArrowRight'],
  [InputAction.Sprint]: ['ShiftLeft', 'ShiftRight'],
  [InputAction.Interact]: ['KeyE'],
  [InputAction.Confirm]: ['Enter', 'Space'],
  [InputAction.Cancel]: ['Escape', 'Backspace'],
  [InputAction.Pause]: ['Escape', 'KeyP'],
  [InputAction.OpenMap]: ['KeyM'],
  [InputAction.OpenInventory]: ['KeyI', 'Tab'],
  [InputAction.CameraZoom]: ['Equal', 'Minus'],
  [InputAction.CameraPan]: [],
  [InputAction.ToggleDebug]: ['F1', 'KeyC'],
};

export const DEFAULT_SETTINGS: FullSettingsSchema = {
  schemaVersion: 1,
  graphics: {
    quality: 'HIGH',
    resolutionScale: 1.0,
    fullscreen: false,
    targetFps: 60,
    vSync: true,
    particleQuality: 'HIGH',
    lightingQuality: 'HIGH',
    shadowQuality: 'HIGH',
    atmosphericShaders: true,
    bloomEnabled: true,
    parallaxEnabled: true,
    cameraEffects: true,
    uiVisualEffects: true,
  },
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.7,
    ambienceVolume: 0.7,
    uiVolume: 0.8,
    sfxVolume: 0.8,
    dialogueVolume: 0.9,
    muted: false,
  },
  controls: {
    bindings: { ...DEFAULT_CONTROLS_BINDINGS },
  },
  accessibility: {
    uiScale: 1.0,
    textSize: 'NORMAL',
    reducedMotion: false,
    reducedCameraShake: 1.0,
    highContrastUI: false,
    colorIndependentIndicators: true,
    interactionReminders: true,
    subtitlesEnabled: true,
    highContrastSubtitles: true,
    colorblindMode: 'none',
  },
  interface: {
    hudVisible: true,
    minimapVisible: true,
    tooltipVisible: true,
    tooltipDelayMs: 250,
    notificationDuration: 4.5,
    reduceInterfaceAnimations: false,
  },
  gameplay: {
    autoPauseOnFocusLoss: true,
    interactionPromptStyle: 'DETAILED',
    tutorialReminders: true,
    cameraFollowSensitivity: 1.0,
    cameraSmoothing: 0.1,
  },
};
