/**
 * INTERSTELLAR CONTINUUM - Building Entrance & Airlock Portal
 * Specialized interactive object managing physical facility entry, door transitions, and interior loading hooks
 */

import { InteractiveObject, InteractiveObjectConfig } from './InteractiveObject';
import { InteractionCategory, InteractionContext, InteractionResult } from './InteractionTypes';
import { CharacterAnimationState } from '../animation/AnimationTypes';

export interface BuildingEntranceConfig extends Omit<InteractiveObjectConfig, 'category'> {
  buildingId: string;
  interiorId: string;
  isExit?: boolean;
}

export class BuildingEntrance extends InteractiveObject {
  public readonly buildingId: string;
  public readonly interiorId: string;
  public readonly isExit: boolean;

  constructor(config: BuildingEntranceConfig) {
    const isExit = config.isExit ?? false;
    super({
      ...config,
      category: isExit ? InteractionCategory.DOOR : InteractionCategory.BUILDING,
      actionText: config.actionText ?? (isExit ? 'Exit to Headquarters' : `Enter ${config.displayName}`),
      customAnimation: isExit
        ? CharacterAnimationState.EXIT_BUILDING
        : CharacterAnimationState.ENTER_BUILDING,
      interactionRadius: config.interactionRadius ?? 90,
      priority: config.priority ?? 5, // High priority for building entrances
    });

    this.buildingId = config.buildingId;
    this.interiorId = config.interiorId;
    this.isExit = isExit;
  }

  public override async onInteract(context: InteractionContext): Promise<InteractionResult> {
    const eventBus = context.eventBus;

    if (this.isExit) {
      if (eventBus) {
        eventBus.emit('building:exited', {
          buildingId: this.buildingId,
          interiorId: this.interiorId,
        });
      }

      return {
        success: true,
        action: 'EXIT_BUILDING',
        message: `Exited ${this.displayName}`,
        data: {
          buildingId: this.buildingId,
          interiorId: this.interiorId,
        },
      };
    } else {
      if (eventBus) {
        eventBus.emit('building:entered', {
          buildingId: this.buildingId,
          interiorId: this.interiorId,
        });

        // Also emit PascalCase domain event
        eventBus.emit('BuildingEntered', {
          buildingId: this.buildingId,
          interiorId: this.interiorId,
        });
      }

      return {
        success: true,
        action: 'ENTER_BUILDING',
        message: `Entered ${this.displayName}`,
        data: {
          buildingId: this.buildingId,
          interiorId: this.interiorId,
        },
      };
    }
  }
}
