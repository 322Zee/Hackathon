/**
 * INTERSTELLAR CONTINUUM - Global UI Design Tokens
 * Definitive design language: aerospace color palette, typography styles,
 * spacing constants, border geometry, and interaction timings.
 */

import { TextStyle } from 'pixi.js';

export const UI_COLORS = {
  // Backgrounds
  BG_DARK: 0x050a14,
  BG_PANEL: 0x091424,
  BG_PANEL_ELEVATED: 0x0f2038,
  BG_SURFACE: 0x0b172a,
  BG_GLASS: 0x07111e,
  BG_OVERLAY: 0x020617,

  // Borders & Accents
  BORDER_DIM: 0x1e293b,
  BORDER_SUBTLE: 0x1e3a5f,
  BORDER_DEFAULT: 0x0284c7,
  BORDER_HIGHLIGHT: 0x38bdf8,
  BORDER_FOCUS: 0x00f0ff,

  // Functional Accents
  CYAN: 0x00f0ff,
  BLUE: 0x38bdf8,
  GREEN: 0x4ade80,
  AMBER: 0xf59e0b,
  RED: 0xf87171,
  PURPLE: 0xa855f7,

  // Typography
  TEXT_PRIMARY: 0xf8fafc,
  TEXT_SECONDARY: 0x94a3b8,
  TEXT_MUTED: 0x64748b,
  TEXT_HIGHLIGHT: 0x38bdf8,
  TEXT_ACCENT: 0x00f0ff,
  TEXT_SUCCESS: 0x4ade80,
  TEXT_WARNING: 0xfbbf24,
  TEXT_DANGER: 0xf87171,

  // Status LEDs
  LED_ONLINE: 0x22c55e,
  LED_BUSY: 0xf59e0b,
  LED_OFFLINE: 0x64748b,
  LED_ALERT: 0xef4444,
} as const;

export const UI_SPACING = {
  XXS: 2,
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
  SAFE_MARGIN: 24,
} as const;

export const UI_RADIUS = {
  NONE: 0,
  XS: 2,
  SM: 4,
  MD: 6,
  LG: 8,
} as const;

export const UI_FONTS = {
  FAMILY: 'monospace',
} as const;

export const UI_TEXT_STYLES = {
  header: new TextStyle({
    fontFamily: UI_FONTS.FAMILY,
    fontSize: 16,
    fontWeight: 'bold',
    fill: UI_COLORS.TEXT_PRIMARY,
    letterSpacing: 1.5,
  }),
  subheader: new TextStyle({
    fontFamily: UI_FONTS.FAMILY,
    fontSize: 13,
    fontWeight: 'bold',
    fill: UI_COLORS.TEXT_HIGHLIGHT,
    letterSpacing: 1.2,
  }),
  body: new TextStyle({
    fontFamily: UI_FONTS.FAMILY,
    fontSize: 12,
    fill: UI_COLORS.TEXT_SECONDARY,
    lineHeight: 18,
    letterSpacing: 0.6,
  }),
  label: new TextStyle({
    fontFamily: UI_FONTS.FAMILY,
    fontSize: 11,
    fontWeight: 'bold',
    fill: UI_COLORS.TEXT_MUTED,
    letterSpacing: 1.0,
  }),
  code: new TextStyle({
    fontFamily: UI_FONTS.FAMILY,
    fontSize: 11,
    fill: UI_COLORS.TEXT_ACCENT,
    letterSpacing: 0.8,
  }),
  micro: new TextStyle({
    fontFamily: UI_FONTS.FAMILY,
    fontSize: 9,
    fill: UI_COLORS.TEXT_MUTED,
    letterSpacing: 0.5,
  }),
} as const;
