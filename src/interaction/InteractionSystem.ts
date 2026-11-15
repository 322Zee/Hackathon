/**
 * INTERSTELLAR CONTINUUM - Environmental Interaction System
 * Central decoupled interaction coordinator managing discovery, hysteresis targeting, prompts, execution pipeline, and safe error recovery
 */

import { Container } from 'pixi.js';
import { IGameSystem, SystemId } from '../systems/interfaces/IGameSystem';
import { IInteractionSystem } from '../systems/interfaces/CoreSystemInterfaces';
import { EventBus } from '../core/EventBus';
import { InputManager } from '../input/InputManager';
import { InputAction } from '../input/InputAction';
import { Logger } from '../core/logging/Logger';
import {
  IInteractiveObject,
  InteractionContext,
  InteractionResult,
  InteractionEvaluationContext,
} from './InteractionTypes';
import { TargetSelector } from './TargetSelector';
import { ContextualPrompt } from './ContextualPrompt';
import { InformationPanel } from './InformationPanel';
import { CharacterAnimationState } from '../animation/AnimationTypes';

export interface InteractionSystemConfig {
  eventBus?: EventBus;
  inputManager?: InputManager;
  rangeMultiplier?: number;
  hysteresisRatio?: number;
}

export class InteractionSystem implements IInteractionSystem, IGameSystem {
  public readonly id = SystemId.INTERACTION;
  public readonly priority = 14; // Runs after Player (13) and before Render (15)

  private objects: Map<string, IInteractiveObject> = new Map();
  private targetSelector: TargetSelector;
  private contextualPrompt: ContextualPrompt;
  private informationPanel: InformationPanel;

  private eventBus?: EventBus;
  private inputManager?: InputManager;
  private playerRef?: any;
  private rangeMultiplier: number = 1.0;
  private isInteracting: boolean = false;
  private interactionTimeoutHandle?: any;

  // Visual container holding prompt and modal overlay for rendering layers
  public readonly container: Container;

  constructor(config?: InteractionSystemConfig) {
    this.eventBus = config?.eventBus;
    this.inputManager = config?.inputManager;
    this.rangeMultiplier = config?.rangeMultiplier ?? 1.0;

    this.targetSelector = new TargetSelector(config?.hysteresisRatio ?? 0.8);
    this.container = new Container();
    this.container.label = 'InteractionSystemContainer';

    // 1. Contextual Prompt (in-world badge)
    this.contextualPrompt = new ContextualPrompt({
      keyLabel: 'E',
      onClick: () => {
        this.interactWithActiveTarget().catch((err) => {
          Logger.error('INTERACTION_SYSTEM', 'Error executing click interaction:', err);
        });
      },
    });
    this.container.addChild(this.contextualPrompt.container);

    // 2. Information Panel (modal overlay)
    this.informationPanel = new InformationPanel(this.inputManager, this.eventBus);
    this.container.addChild(this.informationPanel.container);
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  public setInputManager(inputManager: InputManager): void {
    this.inputManager = inputManager;
  }

  public setPlayer(player: any): void {
    this.playerRef = player;
  }

  public getContextualPrompt(): ContextualPrompt {
    return this.contextualPrompt;
  }

  public getInformationPanel(): InformationPanel {
    return this.informationPanel;
  }

  // ==================== IGameSystem LIFECYCLE ====================

  public initialize(): void {
    Logger.info('INTERACTION_SYSTEM', 'Initializing Environmental Interaction System (Priority 14)...');
  }

  public update(deltaSeconds: number): void {
    // 0. Check for interaction key press directly from InputManager
    if (this.inputManager && this.inputManager.isActionJustPressed(InputAction.Interact)) {
      this.interactWithActiveTarget().catch((err) => {
        Logger.error('INTERACTION_SYSTEM', 'Failed to interact on key press:', err);
      });
    }

    // 1. Update cooldown timers for all registered objects
    for (const obj of this.objects.values()) {
      obj.update(deltaSeconds);
    }

    // 2. Update prompt fade transition
    this.contextualPrompt.update(deltaSeconds);

    // 3. Skip proximity discovery if input is locked or an interaction is actively executing
    if (this.isInteracting || (this.inputManager && this.inputManager.isInputLocked())) {
      if (this.informationPanel.isOpen()) {
        // Modal is active, keep prompt hidden
        this.contextualPrompt.setTarget(null);
      }
      return;
    }

    // 4. Query player position
    const playerPos = this.getPlayerPosition();
    if (!playerPos) {
      return;
    }

    // 5. Evaluate target selection with hysteresis
    const evalContext: Partial<InteractionEvaluationContext> = {
      playerX: playerPos.x,
      playerY: playerPos.y,
    };

    const objectList = Array.from(this.objects.values());
    const result = this.targetSelector.evaluateTargets(
      objectList,
      playerPos.x,
      playerPos.y,
      this.rangeMultiplier,
      evalContext
    );

    // 6. Handle target change events
    if (result.targetChanged) {
      if (this.eventBus) {
        this.eventBus.emit('interaction:target-changed', {
          previousTarget: null,
          currentTarget: result.bestTarget,
        });
      }
    }

    // 7. Update prompt position and content
    if (result.bestTarget) {
      const targetPos = result.bestTarget.getWorldPosition();
      const dist = Math.hypot(targetPos.x - playerPos.x, targetPos.y - playerPos.y);
      const check = result.bestTarget.canInteract({
        playerX: playerPos.x,
        playerY: playerPos.y,
        distance: dist,
      });

      this.contextualPrompt.setTarget(result.bestTarget, check.available, check.reason);
      this.contextualPrompt.updatePosition(targetPos.x, targetPos.y, -55);
    } else {
      this.contextualPrompt.setTarget(null);
    }
  }

  public shutdown(): void {
    Logger.info('INTERACTION_SYSTEM', 'Shutting down Environmental Interaction System...');
    if (this.interactionTimeoutHandle) {
      clearTimeout(this.interactionTimeoutHandle);
      this.interactionTimeoutHandle = undefined;
    }
    this.objects.clear();
    this.targetSelector.clearActiveTarget();
    this.contextualPrompt.destroy();
    this.informationPanel.destroy();
  }

  // ==================== IInteractionSystem CONTRACT ====================

  public registerObject(object: IInteractiveObject): void {
    if (this.objects.has(object.id)) {
      Logger.warn('INTERACTION_SYSTEM', `Object "${object.id}" already registered. Updating reference.`);
    }
    this.objects.set(object.id, object);
    Logger.debug('INTERACTION_SYSTEM', `Registered interactive object: ${object.id} (${object.displayName})`);
  }

  public unregisterObject(objectId: string): void {
    const active = this.targetSelector.getActiveTarget();
    if (active && active.id === objectId) {
      this.targetSelector.clearActiveTarget();
      this.contextualPrompt.setTarget(null);
    }
    this.objects.delete(objectId);
  }

  public getObject(objectId: string): IInteractiveObject | undefined {
    return this.objects.get(objectId);
  }

  public getAllObjects(): IInteractiveObject[] {
    return Array.from(this.objects.values());
  }

  public getNearbyObjects(playerX: number, playerY: number): IInteractiveObject[] {
    const nearby: IInteractiveObject[] = [];
    for (const obj of this.objects.values()) {
      if (!obj.enabled) continue;
      const pos = obj.getWorldPosition();
      const dist = Math.hypot(pos.x - playerX, pos.y - playerY);
      if (dist <= obj.interactionRadius * this.rangeMultiplier) {
        nearby.push(obj);
      }
    }
    return nearby;
  }

  public getActiveTarget(): IInteractiveObject | null {
    return this.targetSelector.getActiveTarget();
  }

  public setInteractionRangeMultiplier(mult: number): void {
    this.rangeMultiplier = Math.max(0.1, Math.min(5.0, mult));
  }

  public getInteractionRangeMultiplier(): number {
    return this.rangeMultiplier;
  }

  // ==================== INTERACTION EXECUTION PIPELINE ====================

  public async interactWithActiveTarget(): Promise<InteractionResult | null> {
    const activeTarget = this.targetSelector.getActiveTarget();
    if (!activeTarget) {
      return null;
    }
    return this.executeInteraction(activeTarget);
  }

  public async interactWith(objectId: string): Promise<InteractionResult | null> {
    const object = this.objects.get(objectId);
    if (!object) {
      Logger.warn('INTERACTION_SYSTEM', `Cannot interact with unknown object: ${objectId}`);
      return null;
    }
    return this.executeInteraction(object);
  }

  private async executeInteraction(target: IInteractiveObject): Promise<InteractionResult> {
    if (this.isInteracting) {
      Logger.debug('INTERACTION_SYSTEM', 'Interaction already in progress. Ignoring request.');
      return { success: false, action: 'NONE', message: 'Interaction already in progress' };
    }

    const playerPos = this.getPlayerPosition();
    const dist = playerPos
      ? Math.hypot(target.x - playerPos.x, target.y - playerPos.y)
      : 0;

    const evalContext: InteractionEvaluationContext = {
      playerX: playerPos?.x ?? target.x,
      playerY: playerPos?.y ?? target.y,
      distance: dist,
    };

    const check = target.canInteract(evalContext);
    if (!check.available) {
      Logger.info('INTERACTION_SYSTEM', `Interaction blocked: ${check.reason}`);
      return {
        success: false,
        action: 'NONE',
        message: check.reason ?? 'Interaction unavailable',
      };
    }

    this.isInteracting = true;

    // 1. Emit InteractionRequested event
    if (this.eventBus) {
      this.eventBus.emit('InteractionRequested', {
        targetId: target.id,
        targetType: target.category,
        initiatorId: this.playerRef?.id ?? 'player',
      });
      this.eventBus.emit('interaction:executed', {
        targetId: target.id,
        category: target.category,
        success: true,
      });
    }

    // 2. Lock player input for the duration of the action
    if (this.inputManager) {
      this.inputManager.lockInput('InteractionExecution');
    }

    // 3. Play character animation (e.g. typing or entering airlock)
    let animDuration = 0.8;
    if (this.playerRef) {
      if (target.customAnimation === CharacterAnimationState.ENTER_BUILDING) {
        animDuration = 1.0;
        if (typeof this.playerRef.playEnterBuilding === 'function') {
          this.playerRef.playEnterBuilding(animDuration);
        }
      } else if (target.customAnimation === CharacterAnimationState.EXIT_BUILDING) {
        animDuration = 1.0;
        if (typeof this.playerRef.playExitBuilding === 'function') {
          this.playerRef.playExitBuilding(animDuration);
        }
      } else {
        if (typeof this.playerRef.playInteraction === 'function') {
          this.playerRef.playInteraction(animDuration);
        }
      }
    }

    // 4. Safe recovery timeout safeguard (3.0s guarantee: never leave player locked)
    const timeoutPromise = new Promise<never>((_, reject) => {
      this.interactionTimeoutHandle = setTimeout(() => {
        reject(new Error('Interaction execution timed out after 3000ms.'));
      }, 3000);
    });

    try {
      const interactionContext: InteractionContext = {
        player: this.playerRef,
        object: target,
        eventBus: this.eventBus,
      };

      // Execute target's interaction logic race against timeout
      const result = await Promise.race([
        target.onInteract(interactionContext),
        timeoutPromise,
      ]);

      // 5. Handle action results
      if (result.action === 'OPEN_PANEL' && result.data) {
        this.informationPanel.show(result.data);
      }

      // 6. Emit InteractionCompleted
      if (this.eventBus) {
        this.eventBus.emit('InteractionCompleted', {
          targetId: target.id,
          targetType: target.category,
          success: result.success,
          result: result.action,
        });
      }

      return result;
    } catch (err: any) {
      Logger.error('INTERACTION_SYSTEM', `Failed during interaction execution with "${target.id}":`, err);
      return {
        success: false,
        action: 'NONE',
        message: err.message ?? 'Interaction failed',
      };
    } finally {
      if (this.interactionTimeoutHandle) {
        clearTimeout(this.interactionTimeoutHandle);
        this.interactionTimeoutHandle = undefined;
      }

      this.isInteracting = false;

      // Unlock execution input lock
      if (this.inputManager) {
        this.inputManager.unlockInput('InteractionExecution');
      }
    }
  }

  private getPlayerPosition(): { x: number; y: number } | null {
    if (this.playerRef && typeof this.playerRef.getPosition === 'function') {
      return this.playerRef.getPosition();
    }
    return null;
  }
}
