/**
 * INTERSTELLAR CONTINUUM - Introductory Cinematic Data Definition
 * Authoritative 6-scene sequence script detailing timestamps, narration,
 * camera waypoints, and narrative milestones.
 */

import {
  CinematicSceneId,
  CinematicSequenceConfig,
} from './CinematicTypes';

export const INTRO_CINEMATIC_SEQUENCE: CinematicSequenceConfig = {
  id: 'seq_intro_narrative',
  title: 'INTERSTELLAR CONTINUUM // ORIGINS OF EXPLORATION',
  autoAdvance: true,
  scenes: [
    {
      id: CinematicSceneId.EARTH,
      title: 'ACT I // THE STARTING POINT',
      subtitle: 'EARTH ORBIT // 1.000 AU FROM THE SUN',
      duration: 6.8,
      audioTrack: 'cinematic_intro',
      narrations: [
        {
          time: 0.5,
          duration: 5.8,
          speaker: 'PLANETARY OBSERVATION ARCHIVE',
          text: 'For generations, humanity gazed upward from a fragile world of ocean and atmosphere, bound to Earth by gravity.',
        },
      ],
      cameraWaypoints: [
        { time: 0.0, x: 960, y: 540, zoom: 1.0, duration: 0.0 },
        { time: 6.8, x: 930, y: 520, zoom: 1.08, duration: 6.8 },
      ],
    },
    {
      id: CinematicSceneId.SCALE_OF_SPACE,
      title: 'ACT II // THE SCALE OF SPACE',
      subtitle: 'HELIOCENTRIC DOMAIN // EIGHT WORLDS, COUNTLESS FRONTIERS',
      duration: 7.2,
      audioTrack: 'cinematic_intro',
      narrations: [
        {
          time: 0.5,
          duration: 6.2,
          speaker: 'ASTRODYNAMICS DIVISION',
          text: 'Beyond our skies lies the Solar System: billions of kilometers of silent vacuum, frozen moons, and unexplored planetary frontiers.',
        },
      ],
      cameraWaypoints: [
        { time: 0.0, x: 960, y: 540, zoom: 0.9, duration: 0.0 },
        { time: 7.2, x: 990, y: 540, zoom: 1.02, duration: 7.2 },
      ],
    },
    {
      id: CinematicSceneId.INDEPENDENT_ORGANISATION,
      title: 'ACT III // AN INDEPENDENT VENTURE',
      subtitle: 'EARTH HEADQUARTERS // MODEST BEGINNINGS',
      duration: 7.2,
      audioTrack: 'cinematic_intro',
      narrations: [
        {
          time: 0.5,
          duration: 6.2,
          speaker: 'FOUNDATION CHARTER // 2026',
          text: 'When traditional programs stagnated, an independent organisation was established on Earth: limited funding, modest facilities, but unwavering resolve.',
        },
      ],
      cameraWaypoints: [
        { time: 0.0, x: 960, y: 540, zoom: 0.95, duration: 0.0 },
        { time: 7.2, x: 950, y: 550, zoom: 1.06, duration: 7.2 },
      ],
    },
    {
      id: CinematicSceneId.THE_OPPORTUNITY,
      title: 'ACT IV // THE OPPORTUNITY',
      subtitle: 'AEROSPACE CAD & MISSION LAB // FIRST HORIZONS',
      duration: 7.2,
      audioTrack: 'cinematic_intro',
      narrations: [
        {
          time: 0.5,
          duration: 6.2,
          speaker: 'CHIEF ENGINEER LOG',
          text: 'Our engineers have drafted the first vehicle designs. By deploying scientific satellites and proving flight reliability, we build the pathway to deep space.',
        },
      ],
      cameraWaypoints: [
        { time: 0.0, x: 960, y: 540, zoom: 1.0, duration: 0.0 },
        { time: 7.2, x: 960, y: 535, zoom: 1.07, duration: 7.2 },
      ],
    },
    {
      id: CinematicSceneId.PLAYERS_ROLE,
      title: 'ACT V // THE MISSION DIRECTOR',
      subtitle: 'DIRECTORATE MANDATE // UNRESTRICTED OPERATIONAL COMMAND',
      duration: 7.5,
      audioTrack: 'cinematic_intro',
      narrations: [
        {
          time: 0.5,
          duration: 6.5,
          speaker: 'STEERING COMMITTEE MANDATE',
          text: 'Leadership of this venture is entrusted to you. Engineer launch vehicles, manage resources, direct flight operations, and lead our expedition outward.',
        },
      ],
      cameraWaypoints: [
        { time: 0.0, x: 960, y: 540, zoom: 1.0, duration: 0.0 },
        { time: 7.5, x: 960, y: 530, zoom: 1.05, duration: 7.5 },
      ],
    },
    {
      id: CinematicSceneId.THE_FIRST_STEP,
      title: 'ACT VI // THE FIRST STEP',
      subtitle: 'CAMPUS ARRIVAL // PAD ALPHA & VAB ONLINE',
      duration: 6.5,
      audioTrack: 'cinematic_intro',
      narrations: [
        {
          time: 0.5,
          duration: 5.5,
          speaker: 'FLIGHT CONTROL DISPATCH',
          text: 'The engineering bays are humming. The launchpad stands ready. Step through the arrival gates, Mission Director—the Continuum awaits.',
        },
      ],
      cameraWaypoints: [
        { time: 0.0, x: 960, y: 540, zoom: 1.0, duration: 0.0 },
        { time: 6.5, x: 960, y: 555, zoom: 1.12, duration: 6.5 },
      ],
    },
  ],
};
