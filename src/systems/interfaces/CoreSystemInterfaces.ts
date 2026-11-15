import { IGameSystem, SystemId } from './IGameSystem';
import { ViewportTransform } from '../../rendering/VirtualResolution';
import { Container } from 'pixi.js';

// ==================== RENDERING ====================
export interface IRenderSystem extends IGameSystem {
  readonly id: SystemId.RENDERING;
  getRootContainer(): Container;
  getLayer(layerName: string): Container | undefined;
  getTransform(): ViewportTransform;
}

// ==================== INPUT ====================
export interface IInputSystem extends IGameSystem {
  readonly id: SystemId.INPUT;
  isActionActive(actionName: string): boolean;
  isActionJustPressed(actionName: string): boolean;
  isActionJustReleased(actionName: string): boolean;
  getPointerVirtualPosition(): { x: number; y: number };
  setContext(contextName: string): void;
  lockInput(reason?: string): void;
  unlockInput(): void;
  isInputLocked(): boolean;
}

// ==================== CAMERA ====================
export interface ICameraSystem extends IGameSystem {
  readonly id: SystemId.CAMERA;
  setPosition(x: number, y: number, immediate?: boolean): void;
  setZoom(zoom: number, immediate?: boolean): void;
  panBy(dx: number, dy: number): void;
  zoomBy(delta: number): void;
  shake(intensity: number): void;
  screenToWorld(sx: number, sy: number): { x: number; y: number };
  worldToScreen(wx: number, wy: number): { x: number; y: number };
}

// ==================== AUDIO ====================
export interface IAudioSystem extends IGameSystem {
  readonly id: SystemId.AUDIO;
  playMusic(trackId: string, loop?: boolean, fadeDurationMs?: number): void;
  stopMusic(fadeDurationMs?: number): void;
  playSfx(sfxId: string, volumeScale?: number): void;
  playUi(soundId: string): void;
  setChannelVolume(channel: string, volume: number): void;
  setMuted(muted: boolean): void;
}

// ==================== ASSET LOADING ====================
export interface IAssetSystem extends IGameSystem {
  readonly id: SystemId.ASSETS;
  loadBundle(bundleName: string, onProgress?: (ratio: number) => void): Promise<void>;
  isBundleLoaded(bundleName: string): boolean;
  getAsset<T = any>(key: string): T | undefined;
  unloadBundle(bundleName: string): Promise<void>;
}

// ==================== COLLISION ====================
export interface ICollisionSystem extends IGameSystem {
  readonly id: SystemId.COLLISION;
  addCollider(collider: any): void;
  removeCollider(colliderId: string): void;
  getCollider(colliderId: string): any | undefined;
  resolveMovement(
    currentX: number,
    currentY: number,
    deltaX: number,
    deltaY: number,
    collider: any
  ): { x: number; y: number; collidedX: boolean; collidedY: boolean; hitColliders: any[] };
  checkOverlaps(collider: any): any[];
  setDebugEnabled(enabled: boolean): void;
  isDebugEnabled(): boolean;
  clear(): void;
}

// ==================== INTERACTION ====================
export interface IInteractionSystem extends IGameSystem {
  readonly id: SystemId.INTERACTION;
  registerObject(object: any): void;
  unregisterObject(objectId: string): void;
  getObject(objectId: string): any | undefined;
  getAllObjects(): any[];
  getNearbyObjects(playerX: number, playerY: number): any[];
  getActiveTarget(): any | null;
  interactWithActiveTarget(): Promise<any>;
  interactWith(objectId: string): Promise<any>;
  setInteractionRangeMultiplier(mult: number): void;
  getInteractionRangeMultiplier(): number;
}

// ==================== WORLD MANAGEMENT ====================
export interface IWorldSystem extends IGameSystem {
  readonly id: SystemId.WORLD;
  getCurrentEnvironment(): string;
  loadEnvironment(environmentId: string): Promise<void>;
  getGravityConstant(): number;
  getTimeScale(): number;
  setTimeScale(scale: number): void;
}

// ==================== PLAYER MANAGEMENT ====================
export interface IPlayerSystem extends IGameSystem {
  readonly id: SystemId.PLAYER;
  getPlayerPosition(): { x: number; y: number; heading: number };
  setPlayerPosition(x: number, y: number, heading?: number): void;
  isPlayerControllable(): boolean;
  setPlayerControllable(controllable: boolean): void;
}

// ==================== MISSION MANAGEMENT ====================
export interface IMissionSystem extends IGameSystem {
  readonly id: SystemId.MISSION;
  getActiveMission(): any | null;
  startMission(missionId: string): void;
  abortMission(reason: string): void;
  completeMission(missionId: string, score: number): void;
  getCompletedMissionCount(): number;
}

// ==================== ECONOMY ====================
export interface IEconomySystem extends IGameSystem {
  readonly id: SystemId.ECONOMY;
  getCredits(): number;
  getResearchData(): number;
  getRawMaterials(): number;
  getTechnologyPoints(): number;
  canAfford(cost: { credits?: number; researchData?: number; rawMaterials?: number; technologyPoints?: number }): boolean;
  spend(cost: { credits?: number; researchData?: number; rawMaterials?: number; technologyPoints?: number }): boolean;
  grant(reward: { credits?: number; researchData?: number; rawMaterials?: number; technologyPoints?: number }): void;
}

// ==================== RESEARCH ====================
export interface IResearchSystem extends IGameSystem {
  readonly id: SystemId.RESEARCH;
  isTechnologyUnlocked(techId: string): boolean;
  unlockTechnology(techId: string): boolean;
  getUnlockedTechnologies(): string[];
}

// ==================== INVENTORY ====================
export interface IInventorySystem extends IGameSystem {
  readonly id: SystemId.INVENTORY;
  getItemCount(itemId: string): number;
  addItem(itemId: string, quantity: number): void;
  removeItem(itemId: string, quantity: number): boolean;
  hasItem(itemId: string, quantity?: number): boolean;
}

// ==================== PROGRESSION ====================
export interface IProgressionSystem extends IGameSystem {
  readonly id: SystemId.PROGRESSION;
  getAgencyRank(): number;
  getAgencyRankTitle(): string;
  getPrestigeScore(): number;
  addPrestige(amount: number): void;
}

// ==================== SAVE MANAGEMENT ====================
export interface ISaveSystem extends IGameSystem {
  readonly id: SystemId.SAVE;
  saveGame(slot: number): Promise<boolean>;
  loadGame(slot: number): Promise<boolean>;
  hasSave(slot: number): boolean;
  exportSave(slot: number): string | null;
  importSave(slot: number, jsonData: string): boolean;
}

// ==================== USER INTERFACE ====================
export interface IUISystem extends IGameSystem {
  readonly id: SystemId.UI;
  showModal(modalId: string, data?: any): void;
  closeModal(modalId: string): void;
  showNotification(message: string, type?: 'info' | 'warn' | 'success' | 'error'): void;
}

// ==================== MULTIPLAYER ====================
export interface IMultiplayerSystem extends IGameSystem {
  readonly id: SystemId.MULTIPLAYER;
  isMultiplayerActive(): boolean;
  isHost(): boolean;
  getPlayerRole(): string;
  sendAction(actionType: string, payload: any): void;
}
