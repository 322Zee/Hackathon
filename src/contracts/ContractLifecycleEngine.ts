/**
 * INTERSTELLAR CONTINUUM - Contract Lifecycle Engine
 * Handles authoritative contract state transitions, objective tracking,
 * deadline countdowns, early bonus evaluation, grace periods, and extensions.
 */

import {
  ContractRecord,
  ContractStatus,
} from './ContractTypes';

export interface CompletionEvaluationResult {
  canComplete: boolean;
  unmetObjectives: string[];
  isEarlyBonusAwarded: boolean;
  isLatePenaltyApplied: boolean;
  finalCreditsReward: number;
}

export class ContractLifecycleEngine {
  /**
   * Validate and transition a contract to ACCEPTED.
   */
  public acceptContract(
    contract: ContractRecord,
    currentDirectorRank: number,
    currentReputation: number,
    _currentGameSeconds?: number
  ): { success: boolean; error?: string } {
    if (contract.status !== ContractStatus.AVAILABLE) {
      return {
        success: false,
        error: `Cannot accept contract "${contract.title}": contract is ${contract.status}, not AVAILABLE`,
      };
    }

    if (currentDirectorRank < contract.requiredDirectorRank) {
      return {
        success: false,
        error: `Cannot accept contract: requires Director Rank ${contract.requiredDirectorRank} (current: ${currentDirectorRank})`,
      };
    }

    if (currentReputation < contract.requiredReputation) {
      return {
        success: false,
        error: `Cannot accept contract: requires Sponsor Reputation ${contract.requiredReputation} (current: ${currentReputation})`,
      };
    }

    contract.status = ContractStatus.ACCEPTED;
    contract.acceptedTimestamp = Date.now();
    if (contract.deadlineSeconds !== null) {
      contract.timeRemainingSeconds = contract.deadlineSeconds;
    } else {
      contract.timeRemainingSeconds = null;
    }
    contract.isInGracePeriod = false;

    return { success: true };
  }

  /**
   * Transition contract to IN_PROGRESS when active flight operations begin.
   */
  public startContract(contract: ContractRecord): boolean {
    if (contract.status === ContractStatus.ACCEPTED) {
      contract.status = ContractStatus.IN_PROGRESS;
      return true;
    }
    return false;
  }

  /**
   * Update progress on a specific contract objective.
   */
  public updateObjectiveProgress(
    contract: ContractRecord,
    objectiveId: string,
    progressDelta: number
  ): {
    updated: boolean;
    objective?: ContractRecord['objectives'][0];
    allCompleted: boolean;
  } {
    if (
      contract.status !== ContractStatus.ACCEPTED &&
      contract.status !== ContractStatus.IN_PROGRESS
    ) {
      return { updated: false, allCompleted: false };
    }

    // Auto-advance to IN_PROGRESS if accepted
    if (contract.status === ContractStatus.ACCEPTED) {
      contract.status = ContractStatus.IN_PROGRESS;
    }

    const obj = contract.objectives.find((o) => o.id === objectiveId);
    if (!obj) {
      return { updated: false, allCompleted: false };
    }

    obj.currentValue = Math.min(obj.targetValue, Math.max(0, obj.currentValue + progressDelta));
    if (obj.currentValue >= obj.targetValue) {
      obj.isCompleted = true;
    }

    const allCompleted = contract.objectives.every((o) => o.isCompleted);
    return { updated: true, objective: { ...obj }, allCompleted };
  }

  /**
   * Evaluate whether all criteria are satisfied to complete the contract.
   */
  public evaluateCompletion(contract: ContractRecord): CompletionEvaluationResult {
    if (
      contract.status !== ContractStatus.ACCEPTED &&
      contract.status !== ContractStatus.IN_PROGRESS
    ) {
      return {
        canComplete: false,
        unmetObjectives: contract.objectives.filter((o) => !o.isCompleted).map((o) => o.description),
        isEarlyBonusAwarded: false,
        isLatePenaltyApplied: false,
        finalCreditsReward: 0,
      };
    }

    const unmet = contract.objectives.filter((o) => !o.isCompleted).map((o) => o.description);
    if (unmet.length > 0) {
      return {
        canComplete: false,
        unmetObjectives: unmet,
        isEarlyBonusAwarded: false,
        isLatePenaltyApplied: false,
        finalCreditsReward: 0,
      };
    }

    // Calculate early bonus vs late penalty
    let isEarlyBonusAwarded = false;
    let isLatePenaltyApplied = false;
    let finalCredits = contract.rewards.credits;

    if (contract.deadlineSeconds != null && contract.timeRemainingSeconds != null) {
      if (contract.isInGracePeriod) {
        // Late penalty applied
        isLatePenaltyApplied = true;
        const penaltyMultiplier = Math.max(0, 1 - contract.penalties.latePenaltyPercent / 100);
        finalCredits = Math.round(finalCredits * penaltyMultiplier);
      } else if (contract.rewards.earlyBonusCredits && contract.rewards.earlyBonusCredits > 0) {
        const thresholdPercent = contract.rewards.earlyBonusTimeThresholdPercent ?? 20;
        const remainingPercent = (contract.timeRemainingSeconds / contract.deadlineSeconds) * 100;
        if (remainingPercent >= thresholdPercent) {
          isEarlyBonusAwarded = true;
          finalCredits += contract.rewards.earlyBonusCredits;
        }
      }
    }

    return {
      canComplete: true,
      unmetObjectives: [],
      isEarlyBonusAwarded,
      isLatePenaltyApplied,
      finalCreditsReward: finalCredits,
    };
  }

  /**
   * Transition contract to COMPLETED if verified.
   */
  public completeContract(
    contract: ContractRecord
  ): { success: boolean; evaluation: CompletionEvaluationResult; error?: string } {
    if (contract.status === ContractStatus.COMPLETED) {
      return {
        success: false,
        evaluation: this.evaluateCompletion(contract),
        error: `Contract "${contract.title}" is already COMPLETED`,
      };
    }

    const evaluation = this.evaluateCompletion(contract);
    if (!evaluation.canComplete) {
      return {
        success: false,
        evaluation,
        error: `Cannot complete contract "${contract.title}": unmet objectives: [${evaluation.unmetObjectives.join(', ')}]`,
      };
    }

    contract.status = ContractStatus.COMPLETED;
    contract.completedTimestamp = Date.now();
    return { success: true, evaluation };
  }

  /**
   * Cancel an accepted contract.
   */
  public cancelContract(contract: ContractRecord): { success: boolean; error?: string } {
    if (
      contract.status !== ContractStatus.ACCEPTED &&
      contract.status !== ContractStatus.IN_PROGRESS
    ) {
      return {
        success: false,
        error: `Cannot cancel contract "${contract.title}": status is ${contract.status}`,
      };
    }

    contract.status = ContractStatus.CANCELLED;
    return { success: true };
  }

  /**
   * Request a deadline extension.
   */
  public requestDeadlineExtension(
    contract: ContractRecord,
    extensionSeconds: number = 10 * 86400
  ): { success: boolean; newDeadlineSeconds: number; error?: string } {
    if (
      contract.status !== ContractStatus.ACCEPTED &&
      contract.status !== ContractStatus.IN_PROGRESS
    ) {
      return {
        success: false,
        newDeadlineSeconds: 0,
        error: `Cannot extend deadline: contract is ${contract.status}`,
      };
    }

    if (contract.deadlineSeconds === null) {
      return {
        success: false,
        newDeadlineSeconds: 0,
        error: 'Contract has no deadline (open-ended programme)',
      };
    }

    if (contract.extensionsGranted >= contract.maxExtensions) {
      return {
        success: false,
        newDeadlineSeconds: contract.deadlineSeconds,
        error: `Maximum extension limit reached (${contract.maxExtensions} extensions allowed)`,
      };
    }

    contract.extensionsGranted++;
    contract.deadlineSeconds += extensionSeconds;
    if (contract.timeRemainingSeconds != null) {
      contract.timeRemainingSeconds += extensionSeconds;
      if (contract.timeRemainingSeconds > 0) {
        contract.isInGracePeriod = false;
      }
    }

    return {
      success: true,
      newDeadlineSeconds: contract.deadlineSeconds,
    };
  }

  /**
   * Tick countdown timer on active contracts.
   * Returns whether contract state transitioned (e.g. into grace period or expired).
   */
  public tickContractTime(
    contract: ContractRecord,
    deltaGameSeconds: number
  ): { statusChanged: boolean; expired: boolean; enteredGracePeriod: boolean } {
    if (
      contract.status !== ContractStatus.ACCEPTED &&
      contract.status !== ContractStatus.IN_PROGRESS
    ) {
      return { statusChanged: false, expired: false, enteredGracePeriod: false };
    }

    if (contract.deadlineSeconds == null || contract.timeRemainingSeconds == null) {
      return { statusChanged: false, expired: false, enteredGracePeriod: false };
    }

    contract.timeRemainingSeconds -= deltaGameSeconds;

    // Check if grace period has completely run out
    if (contract.timeRemainingSeconds <= -contract.gracePeriodSeconds) {
      contract.status = ContractStatus.EXPIRED;
      contract.isInGracePeriod = false;
      return { statusChanged: true, expired: true, enteredGracePeriod: false };
    }

    // Check if entered grace period
    if (contract.timeRemainingSeconds <= 0 && !contract.isInGracePeriod) {
      contract.isInGracePeriod = true;
      return { statusChanged: true, expired: false, enteredGracePeriod: true };
    }

    return { statusChanged: false, expired: false, enteredGracePeriod: false };
  }
}
