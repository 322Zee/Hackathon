/**
 * INTERSTELLAR CONTINUUM - Cinematic Sequence Architecture
 * Formal types, interfaces, and state definitions for data-driven 2D/2.5D cinematics.
 */

export enum CinematicSceneId {
  EARTH = 'EARTH',
  SCALE_OF_SPACE = 'SCALE_OF_SPACE',
  INDEPENDENT_ORGANISATION = 'INDEPENDENT_ORGANISATION',
  THE_OPPORTUNITY = 'THE_OPPORTUNITY',
  PLAYERS_ROLE = 'PLAYERS_ROLE',
  THE_FIRST_STEP = 'THE_FIRST_STEP',
}

export enum CinematicPlaybackState {
  STOPPED = 'STOPPED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export interface CinematicNarrationCue {
  /** Timestamp in seconds relative to scene start when narration activates */
  time: number;
  /** Duration in seconds that the narration text remains visible */
  duration: number;
  /** Narrative voice/callsign header */
  speaker: string;
  /** Primary narration statement */
  text: string;
}

export interface CinematicCameraWaypoint {
  /** Timestamp in seconds relative to scene start */
  time: number;
  /** Target virtual X coordinate */
  x: number;
  /** Target virtual Y coordinate */
  y: number;
  /** Target camera zoom level */
  zoom: number;
  /** Optional camera rotation in radians */
  rotation?: number;
  /** Duration of interpolation to this waypoint */
  duration: number;
}

export interface CinematicSceneDefinition {
  id: CinematicSceneId;
  title: string;
  subtitle: string;
  duration: number;
  narrations: CinematicNarrationCue[];
  cameraWaypoints: CinematicCameraWaypoint[];
  audioTrack?: string;
}

export interface CinematicSequenceConfig {
  id: string;
  title: string;
  scenes: CinematicSceneDefinition[];
  autoAdvance?: boolean;
}
