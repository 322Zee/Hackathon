import { TutorialProgressState } from '../tutorial/TutorialTypes';

export interface AgencyProfile {
  agencyName: string;
  directorName: string;
  rank: number;
  rankTitle: string;
  foundedDate: number;
  totalMissionsLaunched: number;
  totalMissionsSuccessful: number;
}

export interface ResourceWallet {
  credits: number;
  researchData: number;
  rawMaterials: number;
  technologyPoints: number;
}

export interface FacilityState {
  id: string;
  level: number;
  operational: boolean;
  efficiency: number;
}

export interface GameSaveSchema {
  schemaVersion: number;
  timestamp: number;
  agency: AgencyProfile;
  resources: ResourceWallet;
  facilities: Record<string, FacilityState>;
  unlockedTechnologies: string[];
  completedMissions: string[];
  activeMissions: string[];
  tutorial?: TutorialProgressState;
}

export function createDefaultGameState(): GameSaveSchema {
  return {
    schemaVersion: 1,
    timestamp: Date.now(),
    agency: {
      agencyName: "Astra Continuum Project",
      directorName: "Mission Director",
      rank: 1,
      rankTitle: "Junior Flight Director",
      foundedDate: Date.now(),
      totalMissionsLaunched: 0,
      totalMissionsSuccessful: 0,
    },
    resources: {
      credits: 500000,
      researchData: 50,
      rawMaterials: 100,
      technologyPoints: 0,
    },
    facilities: {
      mission_control: { id: "mission_control", level: 1, operational: true, efficiency: 1.0 },
      rocket_engineering: { id: "rocket_engineering", level: 1, operational: true, efficiency: 1.0 },
      satellite_lab: { id: "satellite_lab", level: 1, operational: true, efficiency: 1.0 },
      rd_center: { id: "rd_center", level: 1, operational: true, efficiency: 1.0 },
      administration: { id: "administration", level: 1, operational: true, efficiency: 1.0 },
      manufacturing: { id: "manufacturing", level: 1, operational: true, efficiency: 1.0 },
      robotics: { id: "robotics", level: 1, operational: true, efficiency: 1.0 },
      tracking_station: { id: "tracking_station", level: 1, operational: true, efficiency: 1.0 },
      launch_pad: { id: "launch_pad", level: 1, operational: true, efficiency: 1.0 },
    },
    unlockedTechnologies: ["tech_basic_rocketry", "tech_suborbital_telemetry"],
    completedMissions: [],
    activeMissions: [],
  };
}
