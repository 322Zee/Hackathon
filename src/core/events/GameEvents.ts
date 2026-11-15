import { GameConfiguration } from '../../configuration/GameConfig';
import { ApplicationLifecycleState } from '../EventBus';

export interface SceneChangedPayload {
  from: string | null;
  to: string;
  timestamp: number;
}

export interface PlayerMovedPayload {
  entityId: string;
  x: number;
  y: number;
  heading: number;
  velocity: { vx: number; vy: number };
}

export interface InteractionRequestedPayload {
  targetId: string;
  targetType: string;
  initiatorId: string;
}

export interface InteractionCompletedPayload {
  targetId: string;
  targetType: string;
  success: boolean;
  result?: any;
}

export interface MissionSelectedPayload {
  missionId: string;
  category: string;
}

export interface MissionStartedPayload {
  missionId: string;
  launchTimestamp: number;
}

export interface MissionCompletedPayload {
  missionId: string;
  score: number;
  rewards?: { credits?: number; researchData?: number; rawMaterials?: number; technologyPoints?: number };
}

export interface MissionFailedPayload {
  missionId: string;
  reason: string;
}

export interface ResourceCollectedPayload {
  resourceType: string;
  amount: number;
  source: string;
}

export interface ResearchUnlockedPayload {
  techId: string;
  category: string;
  cost: number;
}

export interface TechnologyUnlockedPayload {
  techId: string;
  blueprints: string[];
}

export interface CreditsChangedPayload {
  current: number;
  delta: number;
  reason: string;
}

export interface BuildingEnteredPayload {
  buildingId: string;
  interiorId: string;
}

export interface SaveRequestedPayload {
  slot: number;
  auto: boolean;
}

export interface SettingsChangedPayload {
  category: string;
  key?: string;
  value?: any;
}

export interface AllGameEvents {
  // Required Domain Events
  SceneChanged: SceneChangedPayload;
  PlayerMoved: PlayerMovedPayload;
  InteractionRequested: InteractionRequestedPayload;
  InteractionCompleted: InteractionCompletedPayload;
  MissionSelected: MissionSelectedPayload;
  MissionStarted: MissionStartedPayload;
  MissionCompleted: MissionCompletedPayload;
  MissionFailed: MissionFailedPayload;
  ResourceCollected: ResourceCollectedPayload;
  ResearchUnlocked: ResearchUnlockedPayload;
  TechnologyUnlocked: TechnologyUnlockedPayload;
  CreditsChanged: CreditsChangedPayload;
  BuildingEntered: BuildingEnteredPayload;
  SaveRequested: SaveRequestedPayload;
  SettingsChanged: SettingsChangedPayload;

  // System & Backward-Compatible Events
  'game:ready': void;
  'game:pause': boolean;
  'scene:change': { from: string; to: string };
  'screen:changed': { from: string | null; to: string };
  'economy:credits_changed': { current: number; delta: number };
  'economy:research_changed': { current: number; delta: number };
  'mission:started': { missionId: string };
  'mission:accepted': { missionId: string; name: string; category: string; destinationId: string };
  'mission:rejected': { missionId: string; reason: string };
  'mission:briefing:opened': { missionId: string };
  'mission:briefing:closed': { missionId: string };
  'mission:completed': { missionId: string; score?: number };
  'mission:failed': { missionId: string; reason?: string };
  'mission:instance:created': { instanceId: string; missionId: string };
  'mission:lifecycle:changed': { instanceId: string; missionId: string; fromState: string; toState: string };
  'mission:preparation:started': { instanceId: string; missionId: string };
  'mission:configuration:changed': { instanceId: string; missionId: string; taskId: string; configRef?: string };
  'mission:validation:requested': { instanceId: string; missionId: string };
  'mission:ready': { instanceId: string; missionId: string };
  'mission:activated': { instanceId: string; missionId: string };
  'mission:paused': { instanceId: string; missionId: string };
  'mission:resumed': { instanceId: string; missionId: string };
  'mission:objective:updated': { instanceId: string; objectiveId: string; currentProgress: number; isCompleted: boolean };
  'mission:objective:completed': { instanceId: string; objectiveId: string };
  'mission:cancelled': { instanceId: string; missionId: string; reason?: string };
  'mission:archived': { instanceId: string; missionId: string; finalStatus: string; timestamp: number };
  'research:unlocked': { techId: string };
  'save:saved': { slot: number; timestamp: number };
  'save:loaded': { slot: number };
  'config:changed': { category: string; config: GameConfiguration };
  'settings:changed': { category: string; settings: any };
  'lifecycle:state_changed': { from: ApplicationLifecycleState; to: ApplicationLifecycleState };
  'assets:progress': { bundle: string; progress: number };
  'assets:loaded': { bundle: string };
  'error:captured': { message: string; stack?: string; fatal: boolean };
  'window:resized': { width: number; height: number; scale: number };

  // Collision & Player Events
  'collision:trigger-enter': { entityId: string; entityCollider: any; trigger: any };
  'collision:trigger-exit': { entityId: string; entityCollider: any; trigger: any };
  'player:moved': { x: number; y: number; vx: number; vy: number; facing: string; state: string };
  'player:interact': { player: any; trigger: any; allTriggers?: any[] };

  // Environmental Interaction Events
  'interaction:target-changed': { previousTarget: any; currentTarget: any };
  'interaction:executed': { targetId: string; category: string; success: boolean };
  'interaction:modal-opened': { modalId: string; data?: any };
  'interaction:modal-closed': { modalId: string };
  'building:entered': { buildingId: string; interiorId: string };
  'building:exited': { buildingId: string; interiorId: string };

  // Facility Events
  'facility:modal-opened': { facilityId: string; name: string };
  'facility:modal-closed': { facilityId: string };
  'facility:registered': { facilityId: string; name: string };
  'facility:availability-changed': { facilityId: string; previousState: string; newState: string; reason?: string };
  'facility:visited': { facilityId: string; name: string; visitCount: number; timestamp: number };
  'facility:upgraded': { facilityId: string; newTier: number; maxTier: number };

  // Startup Flow & Menu Events
  'startup:continue': { agencyName: string; rank: number };
  'startup:new-game': { overwrite: boolean };
  'startup:replay-intro': void;
  'startup:destination-changed': { destination: string };

  // Cinematic Events
  'cinematic:started': { sequenceId: string };
  'cinematic:scene-changed': { sceneIndex: number; sceneId: string; title: string };
  'cinematic:narration': { text: string; speaker?: string };
  'cinematic:paused': void;
  'cinematic:resumed': void;
  'cinematic:skipped': { sceneIndex: number; timestamp: number };
  'cinematic:completed': { totalDuration: number };

  // Tutorial & Onboarding Events
  'tutorial:started': { sequenceId: string; step?: any; totalSteps?: number };
  'tutorial:step-changed': { sequenceId: string; step: any; stepIndex: number; totalSteps: number };
  'tutorial:step-completed': { sequenceId: string; stepId: string };
  'tutorial:completed': { sequenceId: string };
  'tutorial:skipped': { sequenceId: string };
  'tutorial:dismissed': { isDismissed: boolean };
  'tutorial:enabled-changed': { enabled: boolean };
}
