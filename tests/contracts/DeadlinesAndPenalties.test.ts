import { describe, it, expect, beforeEach } from 'vitest';
import { ContractsFundingManager } from '../../src/contracts/ContractsFundingManager';
import { ContractStatus } from '../../src/contracts/ContractTypes';

describe('DeadlinesAndPenalties', () => {
  let manager: ContractsFundingManager;

  beforeEach(() => {
    ContractsFundingManager.resetInstance();
    manager = ContractsFundingManager.getInstance();
  });

  describe('Countdown Timer & Early Completion Bonus', () => {
    it('ticks down remaining time on accepted contracts', () => {
      const contract = manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      const initialRemaining = contract.timeRemainingSeconds!;
      expect(initialRemaining).toBe(30 * 86400);

      // Advance time by 5 game days
      manager.tick(5 * 86400);

      const updated = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(updated?.timeRemainingSeconds).toBe(initialRemaining - 5 * 86400);
    });

    it('awards early completion bonus when completed with sufficient time remaining', () => {
      const initialCredits = manager.getEconomyAdapter().getAvailableCredits();

      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      // Advance by only 2 days (out of 30 days, so ~93% remaining, exceeding the 25% threshold)
      manager.tick(2 * 86400);

      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_01', 1);
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_02', 1);

      const completed = manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(completed.status).toBe(ContractStatus.COMPLETED);

      const contract = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01')!;
      const expectedCredits =
        contract.rewards.credits + (contract.rewards.earlyBonusCredits ?? 0);

      const netEarned = manager.getEconomyAdapter().getAvailableCredits() - initialCredits;
      expect(netEarned).toBe(expectedCredits);
    });
  });

  describe('Grace Period & Late Penalties', () => {
    it('activates grace period when deadline expires, rather than immediately failing', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');

      // Tick past deadline (30 days + 1 hour)
      manager.tick(30 * 86400 + 3600);

      const updated = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(updated?.status).toBe(ContractStatus.ACCEPTED);
      expect(updated?.isInGracePeriod).toBe(true);
      expect(updated?.timeRemainingSeconds).toBeLessThan(0);
    });

    it('applies late penalty percent when completed during grace period', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      // Advance into grace period
      manager.tick(31 * 86400);

      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_01', 1);
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_02', 1);

      const creditsBeforeComplete = manager.getEconomyAdapter().getAvailableCredits();
      manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');

      const contract = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01')!;
      const penaltyMultiplier = 1 - contract.penalties.latePenaltyPercent / 100;
      const expectedCredits = Math.round(contract.rewards.credits * penaltyMultiplier);

      const netEarned = manager.getEconomyAdapter().getAvailableCredits() - creditsBeforeComplete;
      expect(netEarned).toBe(expectedCredits);
    });

    it('expires contract when grace period completely runs out', () => {
      let expiredEventFired = false;
      const sub = manager.getEventBus().on('ContractExpired', (p) => {
        if (p.contractId === 'CONTRACT_SAT_LEO_HELIOS_01') {
          expiredEventFired = true;
        }
      });

      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      // Advance past deadline (30 days) AND past grace period (5 days + 1 day)
      manager.tick(36 * 86400);

      const updated = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(updated?.status).toBe(ContractStatus.EXPIRED);
      expect(expiredEventFired).toBe(true);

      sub.unsubscribe();
    });
  });

  describe('Deadline Extensions', () => {
    it('extends contract deadline upon request and deducts extension fee', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');

      const initialCredits = manager.getEconomyAdapter().getAvailableCredits();
      const contract = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01')!;
      const oldDeadline = contract.deadlineSeconds!;

      const result = manager.requestDeadlineExtension('CONTRACT_SAT_LEO_HELIOS_01', 10 * 86400);
      expect(result.success).toBe(true);
      expect(result.newDeadlineSeconds).toBe(oldDeadline + 10 * 86400);

      // Fee deducted ($₵15,000)
      expect(manager.getEconomyAdapter().getAvailableCredits()).toBe(initialCredits - 15000);

      const updated = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01')!;
      expect(updated.extensionsGranted).toBe(1);
    });

    it('enforces maximum extension limit', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');

      // Max extensions is 2
      const res1 = manager.requestDeadlineExtension('CONTRACT_SAT_LEO_HELIOS_01');
      expect(res1.success).toBe(true);

      const res2 = manager.requestDeadlineExtension('CONTRACT_SAT_LEO_HELIOS_01');
      expect(res2.success).toBe(true);

      const res3 = manager.requestDeadlineExtension('CONTRACT_SAT_LEO_HELIOS_01');
      expect(res3.success).toBe(false);
      expect(res3.error).toContain('Maximum extension limit reached');
    });

    it('rejects deadline extension for open-ended programmes with no deadline', () => {
      manager.getProgressionAdapter().setDirectorRank(3);
      manager.acceptContract('CONTRACT_PROG_OUTER_GIANTS');

      const res = manager.requestDeadlineExtension('CONTRACT_PROG_OUTER_GIANTS');
      expect(res.success).toBe(false);
      expect(res.error).toContain('no deadline');
    });
  });
});
