import { describe, it, expect, beforeEach } from 'vitest';
import { ContractsFundingManager } from '../../src/contracts/ContractsFundingManager';
import {
  FundingSourceType,
  SponsorCategory,
} from '../../src/contracts/ContractTypes';

describe('FundingAndSponsors', () => {
  let manager: ContractsFundingManager;

  beforeEach(() => {
    ContractsFundingManager.resetInstance();
    manager = ContractsFundingManager.getInstance();
  });

  describe('Sponsor Management & Institutional Agreements', () => {
    it('retrieves fictional sponsors and validates categories and funding tiers', () => {
      const sponsors = manager.listSponsors();
      expect(sponsors.length).toBeGreaterThanOrEqual(6);

      const gsc = manager.getSponsor('SPONSOR_GSC');
      expect(gsc).not.toBeNull();
      expect(gsc?.name).toBe('Global Space Coalition');
      expect(gsc?.category).toBe(SponsorCategory.GOVERNMENT_INSTITUTION);
      expect(gsc?.fundingTier).toBe(5);

      const helios = manager.getSponsor('SPONSOR_HELIOS');
      expect(helios?.category).toBe(SponsorCategory.COMMERCIAL_TELECOM);
    });

    it('creates new custom sponsorship agreements and tracks disbursements', () => {
      const agreement = manager.createSponsorshipAgreement(
        'SPONSOR_STELLARIS',
        'COMMERCIAL_PARTNERSHIP',
        {
          title: 'Heavy Booster Separation R&D Fellowship',
          periodicFunding: 45000,
          intervalGameDays: 14,
          durationGameDays: 56, // 4 intervals
          conditions: ['Maintain positive aerospace industrial reputation'],
        }
      );

      expect(agreement.id).toBeDefined();
      expect(agreement.periodicFunding).toBe(45000);
      expect(agreement.totalIntervals).toBe(4);
      expect(agreement.remainingIntervals).toBe(4);

      const sponsor = manager.getSponsor('SPONSOR_STELLARIS');
      expect(sponsor?.activeAgreements.some((a) => a.id === agreement.id)).toBe(true);
    });

    it('disburses periodic agreement funding on game-time advance', () => {
      const initialCredits = manager.getEconomyAdapter().getAvailableCredits();

      // Tick forward by 14 days to trigger the GSC operational baseline stipend (+$₵50,000 every 14 days)
      manager.tick(14 * 86400);

      const newCredits = manager.getEconomyAdapter().getAvailableCredits();
      expect(newCredits).toBeGreaterThanOrEqual(initialCredits + 50000);

      const gsc = manager.getSponsor('SPONSOR_GSC');
      const stipend = gsc?.activeAgreements.find((a) => a.id === 'AGREE_GSC_CORE_STIPEND');
      expect(stipend?.remainingIntervals).toBe(23); // Decremented from 24
    });
  });

  describe('Funding Ledger & Duplicate Claim Protection', () => {
    it('records immutable funding transactions in the ledger', () => {
      const initialTxCount = manager.getFundingEngine().getTransactions().length;

      const tx = manager.recordFundingTransaction({
        source: FundingSourceType.RESEARCH_GRANT,
        sourceEntityId: 'SPONSOR_ASTRAEA',
        sourceEntityName: 'Astraea Planetary Science Institute',
        amountCredits: 75000,
        reason: 'Autonomous Spectrometer Calibration Grant',
        optionalRewards: {
          researchData: 25,
          technologyPoints: 1,
        },
      });

      expect(tx.id).toBeDefined();
      expect(tx.amountCredits).toBe(75000);
      expect(manager.getFundingEngine().getTransactions().length).toBe(initialTxCount + 1);
    });

    it('strictly prevents claiming duplicate rewards from the same contract', () => {
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_01', 1);
      manager.updateContractProgress('CONTRACT_SAT_LEO_HELIOS_01', 'OBJ_SAT_LEO_02', 1);

      // First completion claims reward
      manager.completeContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(manager.getFundingEngine().isRewardClaimed('CONTRACT_SAT_LEO_HELIOS_01')).toBe(true);

      // Attempting to claim again must fail
      const contract = manager.getContract('CONTRACT_SAT_LEO_HELIOS_01')!;
      const secondClaim = manager.getFundingEngine().claimContractReward(
        contract,
        contract.rewards.credits,
        1000,
        false,
        false
      );
      expect(secondClaim.claimed).toBe(false);
      expect(secondClaim.error).toContain('already been claimed');
    });
  });

  describe('Funding Overview Metrics', () => {
    it('computes confirmed revenue, projected grants, and active contract value', () => {
      const overview = manager.getFundingOverview();

      expect(overview.sponsorsCount).toBeGreaterThanOrEqual(6);
      expect(overview.activeAgreementsCount).toBeGreaterThanOrEqual(2);
      expect(overview.projectedGrants).toBeGreaterThan(0);
      expect(overview.currentCreditsBalance).toBeGreaterThan(0);
      expect(overview.contractsAvailable).toBeGreaterThan(0);
    });
  });

  describe('Persistence & Save/Restoration', () => {
    it('safely serializes and restores contracts, agreements, and transaction ledger', () => {
      // Accept a contract and record a transaction
      manager.acceptContract('CONTRACT_SAT_LEO_HELIOS_01');
      manager.recordFundingTransaction({
        source: FundingSourceType.DATA_LICENSING,
        sourceEntityId: 'SPONSOR_CONTINUUM_MEDIA',
        sourceEntityName: 'Continuum Educational Media',
        amountCredits: 10000,
        reason: 'Telemetry Archive Royalty',
      });

      const serialized = manager.serialize();
      expect(serialized.schemaVersion).toBe(1);
      expect(serialized.contracts.length).toBeGreaterThan(0);
      expect(serialized.sponsors.length).toBeGreaterThan(0);
      expect(serialized.transactions.length).toBeGreaterThan(0);

      // Reset and restore
      ContractsFundingManager.resetInstance();
      const freshManager = ContractsFundingManager.getInstance();
      freshManager.deserialize(serialized);

      const restoredContract = freshManager.getContract('CONTRACT_SAT_LEO_HELIOS_01');
      expect(restoredContract?.status).toBe('ACCEPTED');

      const restoredTransactions = freshManager.getFundingEngine().getTransactions();
      expect(restoredTransactions.some((t) => t.amountCredits === 10000)).toBe(true);
    });
  });
});
