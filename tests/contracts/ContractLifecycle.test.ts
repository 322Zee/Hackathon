import { describe, it, expect, beforeEach } from 'vitest';
import { ContractsFundingManager } from '../../src/contracts/ContractsFundingManager';
import {
  ContractStatus,
  ContractCategory,
  FundingSourceType,
} from '../../src/contracts/ContractTypes';
import { DestinationId } from '../../src/destinations/DestinationTypes';

describe('ContractLifecycle', () => {
  let manager: ContractsFundingManager;

  beforeEach(() => {
    ContractsFundingManager.resetInstance();
    manager = ContractsFundingManager.getInstance();
  });

  describe('Contract Listing & Retrieval', () => {
    it('retrieves authored contracts across all 9 canonical categories', () => {
      const allContracts = manager.listContracts();
      expect(allContracts.length).toBeGreaterThanOrEqual(9);

      const categoriesFound = new Set(allContracts.map((c) => c.category));
      expect(categoriesFound.size).toBe(9);
      expect(categoriesFound.has(ContractCategory.SATELLITE_DEPLOYMENT)).toBe(true);
      expect(categoriesFound.has(ContractCategory.SCIENTIFIC_RESEARCH)).toBe(true);
      expect(categoriesFound.has(ContractCategory.ROBOTIC_EXPLORATION)).toBe(true);
      expect(categoriesFound.has(ContractCategory.PLANETARY_BASE_DEVELOPMENT)).toBe(true);
      expect(categoriesFound.has(ContractCategory.LONG_TERM_PROGRAMME)).toBe(true);
    });

    it('filters contracts by category and destination', () => {
      const satelliteContracts = manager.listContracts({
        category: ContractCategory.SATELLITE_DEPLOYMENT,
      });
      expect(satelliteContracts.length).toBeGreaterThan(0);
      expect(
        satelliteContracts.every((c) => c.category === ContractCategory.SATELLITE_DEPLOYMENT)
      ).toBe(true);

      const moonContracts = manager.listContracts({
        destinationId: DestinationId.MOON,
      });
      expect(moonContracts.length).toBeGreaterThan(0);
      expect(moonContracts.every((c) => c.destinationId === DestinationId.MOON)).toBe(true);
    });

    it('retrieves specific contract by unique ID', () => {
      const contract = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(contract).not.toBeNull();
      expect(contract?.title).toContain('Low Earth Orbit Broadband Relay');
      expect(contract?.status).toBe(ContractStatus.AVAILABLE);
    });

    it('returns null for non-existent contract ID', () => {
      expect(manager.getContract('UNKNOWN_CONTRACT_ID')).toBeNull();
    });
  });

  describe('Contract Acceptance & Prerequisites', () => {
    it('accepts available contract and transitions state to ACCEPTED', () => {
      const contract = manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(contract.status).toBe(ContractStatus.ACCEPTED);
      expect(contract.acceptedTimestamp).toBeDefined();

      const retrieved = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(retrieved?.status).toBe(ContractStatus.ACCEPTED);
    });

    it('prevents duplicate acceptance of already accepted contract', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(() => {
        manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      }).toThrow('not AVAILABLE');
    });

    it('enforces director rank requirement for advanced contracts', () => {
      // Long-term programme requires rank 3
      manager.getProgressionAdapter().setDirectorRank(1);
      expect(() => {
        manager.acceptContract('CONTRACT_PROG_OUTER_GIANTS');
      }).toThrow('requires Director Rank 3');

      // Promote to rank 3
      manager.getProgressionAdapter().setDirectorRank(3);
      const accepted = manager.acceptContract('CONTRACT_PROG_OUTER_GIANTS');
      expect(accepted.status).toBe(ContractStatus.ACCEPTED);
    });

    it('enforces sponsor reputation requirements', () => {
      // Set reputation below requirement
      manager.getProgressionAdapter().setSponsorReputation('SPONSOR_ASTRAEA', -20);
      expect(() => {
        manager.acceptContract('CONTRACT_SCI_LUNAR_VOLATILES');
      }).toThrow('requires Sponsor Reputation');

      // Elevate reputation
      manager.getProgressionAdapter().setSponsorReputation('SPONSOR_ASTRAEA', 20);
      const accepted = manager.acceptContract('CONTRACT_SCI_LUNAR_VOLATILES');
      expect(accepted.status).toBe(ContractStatus.ACCEPTED);
    });
  });

  describe('Objective Progression & Contract Completion', () => {
    it('updates objective progress and auto-transitions to IN_PROGRESS', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');

      const updated = manager.updateContractProgress(
        'CONTRACT_SAT_LEO_HELIOS_01',
        'OBJ_SAT_LEO_01',
        1
      );
      expect(updated.status).toBe(ContractStatus.IN_PROGRESS);

      const obj = updated.objectives.find((o) => o.id === 'OBJ_SAT_LEO_01');
      expect(obj?.currentValue).toBe(1);
      expect(obj?.isCompleted).toBe(true);
    });

    it('rejects contract completion when objectives are incomplete', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_01', 1);

      // Second objective is not yet completed
      expect(() => {
        manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');
      }).toThrow('unmet objectives');
    });

    it('completes contract when all objectives are satisfied and disburses payment', () => {
      const initialCredits = manager.getEconomyAdapter().getAvailableCredits();

      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_01', 1);
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_02', 1);

      const completed = manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(completed.status).toBe(ContractStatus.COMPLETED);
      expect(completed.completedTimestamp).toBeDefined();

      // Verified credits deposited
      const newCredits = manager.getEconomyAdapter().getAvailableCredits();
      expect(newCredits).toBeGreaterThan(initialCredits);
    });

    it('prevents duplicate completion of an already completed contract', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_01', 1);
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_02', 1);
      manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');

      expect(() => {
        manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');
      }).toThrow('already COMPLETED');
    });
  });

  describe('Contract Cancellation & Consequences', () => {
    it('cancels active contract, deducts fee, and reduces sponsor reputation', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');

      const initialCredits = manager.getEconomyAdapter().getAvailableCredits();
      const initialRep = manager
        .getProgressionAdapter()
        .getSponsorReputation('SPONSOR_HELIOS');

      const cancelled = manager.cancelContract(
        'CONTRACT_SAT_LEO_HELIOS_01',
        'Payload bay structural anomaly'
      );
      expect(cancelled.status).toBe(ContractStatus.CANCELLED);

      // Fee deducted
      expect(manager.getEconomyAdapter().getAvailableCredits()).toBe(
        initialCredits - cancelled.penalties.cancellationFeeCredits
      );

      // Reputation penalized
      expect(
        manager.getProgressionAdapter().getSponsorReputation('SPONSOR_HELIOS')
      ).toBe(initialRep - cancelled.penalties.failureReputationLoss);
    });

    it('rejects cancellation of unaccepted or available contracts', () => {
      expect(() => {
        manager.cancelContract('CONTRACT_COMMS_GEO_ARRAY');
      }).toThrow('Cannot cancel contract');
    });
  });
});
