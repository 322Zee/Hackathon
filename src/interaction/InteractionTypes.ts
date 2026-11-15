/**
 * INTERSTELLAR CONTINUUM - Environmental Interaction Framework
 * Interaction Categories, Interfaces, Requirements, and Execution Result Contracts
 */

import { CharacterAnimationState } from '../animation/AnimationTypes';

export enum InteractionCategory {
  BUILDING = 'BUILDING',
  DOOR = 'DOOR',
  TERMINAL = 'TERMINAL',
  MISSION_CONSOLE = 'MISSION_CONSOLE',
  EQUIPMENT = 'EQUIPMENT',
  RESEARCH = 'RESEARCH',
  MANUFACTURING = 'MANUFACTURING',
  SATELLITE_PANEL = 'SATELLITE_PANEL',
  LAUNCH_INFRASTRUCTURE = 'LAUNCH_INFRASTRUCTURE',
  PLANETARY_EQUIPMENT = 'PLANETARY_EQUIPMENT',
  ROVER_SYSTEM = 'ROVER_SYSTEM',
  RESOURCE_STATION = 'RESOURCE_STATION',
  CONSTRUCTION_MODULE = 'CONSTRUCTION_MODULE',
  INFO_SIGN = 'INFO_SIGN',
}

export type InteractionRequirementType =
  | 'CLEARANCE'
  | 'TECH'
  | 'RESOURCE'
  | 'MISSION'
  | 'CUSTOM';

export interface InteractionRequirement {
  type: InteractionRequirementType;
  description: string;
  evaluate: (context: InteractionEvaluationContext) => boolean;
}

export interface InteractionEvaluationContext {
  playerX: number;
  playerY: number;
  distance: number;
  clearanceLevel?: number;
  unlockedTechs?: string[];
  resources?: Record<string, number>;
}

export interface InteractionContext {
  player: any;
  object: IInteractiveObject;
  eventBus?: any;
}

export type InteractionActionType =
  | 'NONE'
  | 'OPEN_PANEL'
  | 'ENTER_BUILDING'
  | 'EXIT_BUILDING'
  | 'TRIGGER_ACTION';

export interface InteractionResult {
  success: boolean;
  action: InteractionActionType;
  message?: string;
  data?: any;
}

export interface IInteractiveObject {
  readonly id: string;
  displayName: string;
  description: string;
  actionText: string;
  category: InteractionCategory;
  x: number;
  y: number;
  interactionRadius: number;
  priority: number;
  enabled: boolean;
  cooldownSeconds: number;
  requirements: InteractionRequirement[];
  customAnimation?: CharacterAnimationState;

  canInteract(context: InteractionEvaluationContext): { available: boolean; reason?: string };
  onInteract(context: InteractionContext): Promise<InteractionResult>;
  getWorldPosition(): { x: number; y: number };
  isOnCooldown(): boolean;
  getRemainingCooldown(): number;
  triggerCooldown(): void;
  update(deltaSeconds: number): void;
}
