export interface IGameSystem {
  readonly id: string;
  readonly priority: number; // Lower priority initializes and updates first
  initialize(): Promise<void> | void;
  update?(deltaSeconds: number): void;
  shutdown(): Promise<void> | void;
}

export enum SystemId {
  RENDERING = 'RENDERING',
  INPUT = 'INPUT',
  CAMERA = 'CAMERA',
  AUDIO = 'AUDIO',
  ASSETS = 'ASSETS',
  COLLISION = 'COLLISION',
  INTERACTION = 'INTERACTION',
  WORLD = 'WORLD',
  PLAYER = 'PLAYER',
  MISSION = 'MISSION',
  ECONOMY = 'ECONOMY',
  RESEARCH = 'RESEARCH',
  INVENTORY = 'INVENTORY',
  PROGRESSION = 'PROGRESSION',
  SAVE = 'SAVE',
  UI = 'UI',
  MULTIPLAYER = 'MULTIPLAYER',
}
