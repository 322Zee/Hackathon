import { GameConfiguration, DEFAULT_GAME_CONFIG } from '../configuration/GameConfig';

export interface SceneState {
  currentScene: string;
  previousScene: string | null;
  sceneHistory: string[];
}

export interface PlayerPositionState {
  bodyId: string;
  worldCoords: { x: number; y: number };
  surfaceCoords?: { latitude: number; longitude: number; altitudeMeters: number };
  headingDeg: number;
  speedMps: number;
}

export interface ActiveMissionState {
  missionId: string | null;
  code: string;
  title: string;
  phase: string;
  elapsedSeconds: number;
  trajectoryStage: number;
  completedObjectiveIds: string[];
}

export interface OrganisationProgressionState {
  agencyName: string;
  directorName: string;
  rank: number;
  rankTitle: string;
  prestigeScore: number;
  foundedDate: number;
  totalLaunches: number;
  successfulMissions: number;
}

export interface ResourceState {
  credits: number;
  researchData: number;
  rawMaterials: number;
  technologyPoints: number;
}

export interface ResearchState {
  unlockedNodeIds: string[];
  activeResearchNodeId: string | null;
  accumulatedResearchPoints: number;
}

export interface DestinationsState {
  unlockedBodyIds: string[];
  surveyedSiteIds: string[];
  surfaceFlagsPlanted: string[];
}

export interface CompletedMissionsState {
  completedMissionIds: string[];
  records: Array<{ missionId: string; date: number; score: number }>;
}

export interface FacilityState {
  id: string;
  tier: number;
  healthPercent: number;
  operational: boolean;
  efficiency: number;
}

export type BuildingStates = Record<string, FacilityState>;

export type MultiplayerRole = 'FLIGHT' | 'GNC' | 'CAPCOM' | 'EECOM' | 'SOLO';

export interface MultiplayerPeer {
  id: string;
  name: string;
  role: MultiplayerRole;
  pingMs: number;
}

export interface MultiplayerSessionState {
  isMultiplayer: boolean;
  sessionId: string | null;
  isHost: boolean;
  role: MultiplayerRole;
  peers: MultiplayerPeer[];
}

export interface FullGameState {
  scene: SceneState;
  player: PlayerPositionState;
  mission: ActiveMissionState;
  organisation: OrganisationProgressionState;
  resources: ResourceState;
  research: ResearchState;
  destinations: DestinationsState;
  completedMissions: CompletedMissionsState;
  buildings: BuildingStates;
  settings: GameConfiguration;
  multiplayer: MultiplayerSessionState;
}

export function createInitialGameState(): FullGameState {
  return {
    scene: {
      currentScene: 'LOADING_SCREEN',
      previousScene: null,
      sceneHistory: [],
    },
    player: {
      bodyId: 'EARTH',
      worldCoords: { x: 0, y: 0 },
      surfaceCoords: { latitude: 28.5721, longitude: -80.648, altitudeMeters: 5 }, // Cape Canaveral coords
      headingDeg: 90,
      speedMps: 0,
    },
    mission: {
      missionId: null,
      code: '',
      title: '',
      phase: 'STANDBY',
      elapsedSeconds: 0,
      trajectoryStage: 0,
      completedObjectiveIds: [],
    },
    organisation: {
      agencyName: 'Astra Continuum Project',
      directorName: 'Mission Director',
      rank: 1,
      rankTitle: 'Junior Flight Director',
      prestigeScore: 100,
      foundedDate: Date.now(),
      totalLaunches: 0,
      successfulMissions: 0,
    },
    resources: {
      credits: 500000,
      researchData: 50,
      rawMaterials: 100,
      technologyPoints: 0,
    },
    research: {
      unlockedNodeIds: ['tech_basic_rocketry', 'tech_suborbital_telemetry'],
      activeResearchNodeId: null,
      accumulatedResearchPoints: 0,
    },
    destinations: {
      unlockedBodyIds: ['EARTH', 'MOON'],
      surveyedSiteIds: [],
      surfaceFlagsPlanted: [],
    },
    completedMissions: {
      completedMissionIds: [],
      records: [],
    },
    buildings: {
      mission_control: { id: 'mission_control', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      rocket_engineering: { id: 'rocket_engineering', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      satellite_lab: { id: 'satellite_lab', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      rd_center: { id: 'rd_center', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      administration: { id: 'administration', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      manufacturing: { id: 'manufacturing', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      robotics: { id: 'robotics', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      tracking_station: { id: 'tracking_station', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
      launch_pad: { id: 'launch_pad', tier: 1, healthPercent: 100, operational: true, efficiency: 1.0 },
    },
    settings: JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG)),
    multiplayer: {
      isMultiplayer: false,
      sessionId: null,
      isHost: true,
      role: 'SOLO',
      peers: [],
    },
  };
}
