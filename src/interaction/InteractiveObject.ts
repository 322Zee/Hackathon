/**
 * INTERSTELLAR CONTINUUM - Interactive Object Base Implementation
 * Highly reusable entity representing environmental interactables, terminals, consoles, and equipment
 */

import {
  IInteractiveObject,
  InteractionCategory,
  InteractionRequirement,
  InteractionEvaluationContext,
  InteractionContext,
  InteractionResult,
} from './InteractionTypes';
import { CharacterAnimationState } from '../animation/AnimationTypes';

export interface InteractiveObjectConfig {
  id: string;
  displayName: string;
  description?: string;
  actionText?: string;
  category?: InteractionCategory;
  x: number;
  y: number;
  interactionRadius?: number;
  priority?: number;
  enabled?: boolean;
  cooldownSeconds?: number;
  requirements?: InteractionRequirement[];
  customAnimation?: CharacterAnimationState;
  onInteract?: (context: InteractionContext) => Promise<InteractionResult>;
}

export class InteractiveObject implements IInteractiveObject {
  public readonly id: string;
  public displayName: string;
  public description: string;
  public actionText: string;
  public category: InteractionCategory;
  public x: number;
  public y: number;
  public interactionRadius: number;
  public priority: number;
  public enabled: boolean;
  public cooldownSeconds: number;
  public requirements: InteractionRequirement[];
  public customAnimation?: CharacterAnimationState;

  private currentCooldownTimer: number = 0;
  private onInteractHandler?: (context: InteractionContext) => Promise<InteractionResult>;

  constructor(config: InteractiveObjectConfig) {
    this.id = config.id;
    this.displayName = config.displayName;
    this.description = config.description ?? '';
    this.actionText = config.actionText ?? `Access ${config.displayName}`;
    this.category = config.category ?? InteractionCategory.EQUIPMENT;
    this.x = config.x;
    this.y = config.y;
    this.interactionRadius = Math.max(10, config.interactionRadius ?? 80);
    this.priority = config.priority ?? 1;
    this.enabled = config.enabled ?? true;
    this.cooldownSeconds = Math.max(0, config.cooldownSeconds ?? 0);
    this.requirements = config.requirements ?? [];
    this.customAnimation = config.customAnimation;
    this.onInteractHandler = config.onInteract;
  }

  public getWorldPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public isOnCooldown(): boolean {
    return this.currentCooldownTimer > 0;
  }

  public getRemainingCooldown(): number {
    return Math.max(0, this.currentCooldownTimer);
  }

  public triggerCooldown(): void {
    this.currentCooldownTimer = this.cooldownSeconds;
  }

  public update(deltaSeconds: number): void {
    if (this.currentCooldownTimer > 0) {
      this.currentCooldownTimer = Math.max(0, this.currentCooldownTimer - deltaSeconds);
    }
  }

  public canInteract(context: InteractionEvaluationContext): { available: boolean; reason?: string } {
    if (!this.enabled) {
      return { available: false, reason: 'Object is currently offline.' };
    }

    if (this.isOnCooldown()) {
      return {
        available: false,
        reason: `Recharging (${this.currentCooldownTimer.toFixed(1)}s)`,
      };
    }

    // Evaluate all requirements
    for (const req of this.requirements) {
      if (!req.evaluate(context)) {
        return { available: false, reason: req.description };
      }
    }

    return { available: true };
  }

  public async onInteract(context: InteractionContext): Promise<InteractionResult> {
    if (this.cooldownSeconds > 0) {
      this.triggerCooldown();
    }

    if (this.onInteractHandler) {
      return this.onInteractHandler(context);
    }

    return {
      success: true,
      action: 'TRIGGER_ACTION',
      message: `Interacted with ${this.displayName}`,
    };
  }
}
