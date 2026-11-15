/**
 * INTERSTELLAR CONTINUUM - Funding Engine
 * Manages financial transactions, ledger logging, duplicate claim prevention,
 * periodic sponsorship disbursements, and real-time funding analytics.
 */

import {
  FundingTransaction,
  FundingSourceType,
  FundingOverview,
  SponsorRecord,
  ContractRecord,
  ContractStatus,
} from './ContractTypes';
import { ContractsEconomyAdapter } from './adapters/EconomyAdapter';

export class FundingEngine {
  private transactions: FundingTransaction[] = [];
  private claimedRewardContractIds: Set<string> = new Set();
  private economyAdapter: ContractsEconomyAdapter;

  constructor(economyAdapter: ContractsEconomyAdapter) {
    this.economyAdapter = economyAdapter;
  }

  public getEconomyAdapter(): ContractsEconomyAdapter {
    return this.economyAdapter;
  }

  public getTransactions(): FundingTransaction[] {
    return [...this.transactions];
  }

  public getClaimedRewardContractIds(): string[] {
    return Array.from(this.claimedRewardContractIds);
  }

  public isRewardClaimed(contractId: string): boolean {
    return this.claimedRewardContractIds.has(contractId);
  }

  public recordTransaction(
    source: FundingSourceType,
    sourceEntityId: string,
    sourceEntityName: string,
    amountCredits: number,
    reason: string,
    currentGameSeconds: number,
    optionalRewards?: {
      researchData?: number;
      technologyPoints?: number;
      rawMaterials?: number;
    },
    contractId?: string
  ): FundingTransaction {
    const id = `TX_${Date.now()}_${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    const transaction: FundingTransaction = {
      id,
      source,
      sourceEntityId,
      sourceEntityName,
      amountCredits,
      researchData: optionalRewards?.researchData ?? 0,
      technologyPoints: optionalRewards?.technologyPoints ?? 0,
      rawMaterials: optionalRewards?.rawMaterials ?? 0,
      timestamp: Date.now(),
      gameTimeSeconds: currentGameSeconds,
      reason,
      contractId,
    };

    this.transactions.push(transaction);

    // Apply to economy
    this.economyAdapter.depositRewards({
      credits: amountCredits,
      researchData: optionalRewards?.researchData,
      technologyPoints: optionalRewards?.technologyPoints,
      rawMaterials: optionalRewards?.rawMaterials,
    });

    return transaction;
  }

  /**
   * Claim completion payout for a completed contract with duplicate prevention.
   */
  public claimContractReward(
    contract: ContractRecord,
    finalCreditsReward: number,
    currentGameSeconds: number,
    isEarlyBonus: boolean,
    isLatePenalty: boolean
  ): { claimed: boolean; transaction?: FundingTransaction; error?: string } {
    if (this.claimedRewardContractIds.has(contract.id) || contract.isClaimed) {
      return {
        claimed: false,
        error: `Reward for contract "${contract.title}" has already been claimed!`,
      };
    }

    if (contract.status !== ContractStatus.COMPLETED) {
      return {
        claimed: false,
        error: `Cannot claim reward: contract "${contract.title}" is ${contract.status}, not COMPLETED`,
      };
    }

    this.claimedRewardContractIds.add(contract.id);
    contract.isClaimed = true;

    let reason = `Contract Fulfillment: ${contract.title}`;
    if (isEarlyBonus) reason += ' [Early Completion Bonus]';
    if (isLatePenalty) reason += ' [Late Grace-Period Penalty Applied]';

    const tx = this.recordTransaction(
      contract.fundingSource,
      contract.issuingSponsorId,
      contract.sponsorName,
      finalCreditsReward,
      reason,
      currentGameSeconds,
      {
        researchData: contract.rewards.researchData,
        technologyPoints: contract.rewards.technologyPoints,
        rawMaterials: contract.rewards.rawMaterials,
      },
      contract.id
    );

    return { claimed: true, transaction: tx };
  }

  /**
   * Process periodic disbursements from active sponsorship agreements.
   */
  public processPeriodicAgreements(
    sponsors: SponsorRecord[],
    currentGameSeconds: number
  ): FundingTransaction[] {
    const executed: FundingTransaction[] = [];

    for (const sponsor of sponsors) {
      for (const agreement of sponsor.activeAgreements) {
        if (!agreement.isActive || agreement.remainingIntervals <= 0) {
          continue;
        }

        const intervalSeconds = agreement.intervalGameDays * 86400;
        const timeSinceLast = currentGameSeconds - agreement.lastDisbursedGameSeconds;

        if (timeSinceLast >= intervalSeconds) {
          agreement.remainingIntervals--;
          agreement.lastDisbursedGameSeconds = currentGameSeconds;
          if (agreement.remainingIntervals <= 0) {
            agreement.isActive = false;
          }

          const tx = this.recordTransaction(
            FundingSourceType.GOVERNMENT_GRANT,
            sponsor.id,
            sponsor.name,
            agreement.periodicFunding,
            `Periodic Stipend: ${agreement.title} (${agreement.totalIntervals - agreement.remainingIntervals}/${agreement.totalIntervals})`,
            currentGameSeconds
          );
          executed.push(tx);
        }
      }
    }

    return executed;
  }

  /**
   * Compute comprehensive overview of organization funding.
   */
  public computeOverview(
    contracts: ContractRecord[],
    sponsors: SponsorRecord[]
  ): FundingOverview {
    let totalEarnings = 0;
    for (const tx of this.transactions) {
      if (tx.amountCredits > 0) {
        totalEarnings += tx.amountCredits;
      }
    }

    let activeContractValue = 0;
    let contractsActive = 0;
    let contractsAvailable = 0;
    let contractsCompleted = 0;

    for (const c of contracts) {
      if (c.status === ContractStatus.AVAILABLE) {
        contractsAvailable++;
      } else if (c.status === ContractStatus.ACCEPTED || c.status === ContractStatus.IN_PROGRESS) {
        contractsActive++;
        activeContractValue += c.rewards.credits;
      } else if (c.status === ContractStatus.COMPLETED) {
        contractsCompleted++;
      }
    }

    let projectedGrants = 0;
    let activeAgreementsCount = 0;
    let totalRep = 0;

    for (const s of sponsors) {
      totalRep += s.reputation;
      for (const a of s.activeAgreements) {
        if (a.isActive) {
          activeAgreementsCount++;
          projectedGrants += a.periodicFunding * a.remainingIntervals;
        }
      }
    }

    const averageReputation = sponsors.length > 0 ? Math.round(totalRep / sponsors.length) : 0;
    const currentCreditsBalance = this.economyAdapter.getAvailableCredits();

    return {
      totalEarnings,
      activeContractValue,
      projectedGrants,
      confirmedFunding: totalEarnings,
      currentCreditsBalance,
      totalTransactions: this.transactions.length,
      sponsorsCount: sponsors.length,
      activeAgreementsCount,
      averageReputation,
      contractsCompleted,
      contractsActive,
      contractsAvailable,
    };
  }

  public setRestoredState(transactions: FundingTransaction[], claimedIds: string[]): void {
    this.transactions = [...transactions];
    this.claimedRewardContractIds = new Set(claimedIds);
  }
}
