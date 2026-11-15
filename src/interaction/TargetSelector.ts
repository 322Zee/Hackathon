/**
 * INTERSTELLAR CONTINUUM - Interaction Target Selector with Hysteresis
 * Multi-target discovery, priority ranking, availability evaluation, and stable target selection
 */

import { IInteractiveObject, InteractionEvaluationContext } from './InteractionTypes';

export interface TargetCandidate {
  object: IInteractiveObject;
  distance: number;
  available: boolean;
  reason?: string;
}

export class TargetSelector {
  private activeTarget: IInteractiveObject | null = null;
  private hysteresisDistanceRatio: number = 0.8; // New candidate must be 20% closer to steal focus

  constructor(hysteresisRatio: number = 0.8) {
    this.hysteresisDistanceRatio = Math.max(0.5, Math.min(0.95, hysteresisRatio));
  }

  public getActiveTarget(): IInteractiveObject | null {
    return this.activeTarget;
  }

  public clearActiveTarget(): void {
    this.activeTarget = null;
  }

  /**
   * Evaluate all registered objects relative to player position and determine the best active target
   */
  public evaluateTargets(
    objects: IInteractiveObject[],
    playerX: number,
    playerY: number,
    rangeMultiplier: number = 1.0,
    evalContext?: Partial<InteractionEvaluationContext>
  ): {
    bestTarget: IInteractiveObject | null;
    nearbyCandidates: TargetCandidate[];
    targetChanged: boolean;
  } {
    const previousTargetId = this.activeTarget ? this.activeTarget.id : null;
    const candidates: TargetCandidate[] = [];

    // 1. Gather all candidates within effective interaction range
    for (const obj of objects) {
      if (!obj.enabled) continue;

      const pos = obj.getWorldPosition();
      const dist = Math.hypot(pos.x - playerX, pos.y - playerY);
      const effectiveRadius = obj.interactionRadius * rangeMultiplier;

      if (dist <= effectiveRadius) {
        const fullContext: InteractionEvaluationContext = {
          playerX,
          playerY,
          distance: dist,
          ...evalContext,
        };

        const check = obj.canInteract(fullContext);
        candidates.push({
          object: obj,
          distance: dist,
          available: check.available,
          reason: check.reason,
        });
      }
    }

    // 2. Filter viable candidates (available === true)
    const viableCandidates = candidates.filter((c) => c.available);

    if (viableCandidates.length === 0) {
      // No available targets in range
      const targetChanged = this.activeTarget !== null;
      this.activeTarget = null;
      return {
        bestTarget: null,
        nearbyCandidates: candidates,
        targetChanged,
      };
    }

    // 3. Determine if current active target remains valid
    const currentActiveCandidate = this.activeTarget
      ? viableCandidates.find((c) => c.object.id === this.activeTarget!.id)
      : null;

    let selectedTarget: IInteractiveObject;

    if (currentActiveCandidate) {
      // Current target is still viable. Apply hysteresis:
      // Another target can only steal focus if:
      // a) It has strictly higher priority, OR
      // b) Same priority but significantly closer (< activeDistance * hysteresisRatio)
      let superiorCandidate: TargetCandidate | null = null;

      for (const cand of viableCandidates) {
        if (cand.object.id === currentActiveCandidate.object.id) continue;

        if (cand.object.priority > currentActiveCandidate.object.priority) {
          if (!superiorCandidate || cand.object.priority > superiorCandidate.object.priority) {
            superiorCandidate = cand;
          }
        } else if (
          cand.object.priority === currentActiveCandidate.object.priority &&
          cand.distance < currentActiveCandidate.distance * this.hysteresisDistanceRatio
        ) {
          if (!superiorCandidate || cand.distance < superiorCandidate.distance) {
            superiorCandidate = cand;
          }
        }
      }

      selectedTarget = superiorCandidate ? superiorCandidate.object : currentActiveCandidate.object;
    } else {
      // No active target or previous target left range: select highest priority, then closest
      viableCandidates.sort((a, b) => {
        if (b.object.priority !== a.object.priority) {
          return b.object.priority - a.object.priority;
        }
        return a.distance - b.distance;
      });

      selectedTarget = viableCandidates[0]!.object;
    }

    const targetChanged = selectedTarget.id !== previousTargetId;
    this.activeTarget = selectedTarget;

    return {
      bestTarget: this.activeTarget,
      nearbyCandidates: candidates,
      targetChanged,
    };
  }
}
