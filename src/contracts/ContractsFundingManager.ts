/**
 * INTERSTELLAR CONTINUUM - Contracts & Funding Manager
 * Authoritative central singleton coordinating mission contracts, sponsor relations,
 * funding agreements, deadline countdowns, and financial ledger integrity.
 */

import {
  ContractRecord,
  SponsorRecord,
  SponsorAgreement,
  FundingTransaction,
  FundingOverview,
  ContractFilter,
  ContractStatus,
  AgreementType,
  FundingSourceType,
  ContractsFundingSaveState,
} from './ContractTypes';
import { ContractEventBus } from './ContractEventBus';
import { ContractsEconomyAdapter } from './adapters/EconomyAdapter';
import { ContractsGameTimeAdapter } from './adapters/GameTimeAdapter';
import { ContractsProgressionAdapter } from './adapters/ProgressionAdapter';
import { ContractsMissionAdapter } from './adapters/MissionAdapter';
import { ContractsPersistenceAdapter } from './adapters/PersistenceAdapter';
import { ContractLifecycleEngine, CompletionEvaluationResult } from './ContractLifecycleEngine';
import { FundingEngine } from './FundingEngine';
import { DEFAULT_CONTRACTS } from './ContractRegistry';
import { DEFAULT_SPONSORS } from './SponsorRegistry';

export class ContractsFundingManager {
  private static instance: ContractsFundingManager | null = null;

  private contracts: Map<string, ContractRecord> = new Map();
  private sponsors: Map<string, SponsorRecord> = new Map();

  private eventBus: ContractEventBus;
  private economyAdapter: ContractsEconomyAdapter;
  private gameTimeAdapter: ContractsGameTimeAdapter;
  private progressionAdapter: ContractsProgressionAdapter;
  private missionAdapter: ContractsMissionAdapter;
  private persistenceAdapter: ContractsPersistenceAdapter;

  private lifecycleEngine: ContractLifecycleEngine;
  private fundingEngine: FundingEngine;

  private constructor(
    eventBus?: ContractEventBus,
    economyAdapter?: ContractsEconomyAdapter,
    gameTimeAdapter?: ContractsGameTimeAdapter,
    progressionAdapter?: ContractsProgressionAdapter,
    missionAdapter?: ContractsMissionAdapter
  ) {
    this.eventBus = eventBus || new ContractEventBus();
    this.economyAdapter = economyAdapter || new ContractsEconomyAdapter();
    this.gameTimeAdapter = gameTimeAdapter || new ContractsGameTimeAdapter();
    this.progressionAdapter = progressionAdapter || new ContractsProgressionAdapter();
    this.missionAdapter = missionAdapter || new ContractsMissionAdapter();
    this.persistenceAdapter = new ContractsPersistenceAdapter();

    this.lifecycleEngine = new ContractLifecycleEngine();
    this.fundingEngine = new FundingEngine(this.economyAdapter);

    this.initializeDefaultData();
    this.setupMissionBridge();
  }

  public static getInstance(
    eventBus?: ContractEventBus,
    economyAdapter?: ContractsEconomyAdapter,
    gameTimeAdapter?: ContractsGameTimeAdapter,
    progressionAdapter?: ContractsProgressionAdapter,
    missionAdapter?: ContractsMissionAdapter
  ): ContractsFundingManager {
    if (!ContractsFundingManager.instance) {
      ContractsFundingManager.instance = new ContractsFundingManager(
        eventBus,
        economyAdapter,
        gameTimeAdapter,
        progressionAdapter,
        missionAdapter
      );
    }
    return ContractsFundingManager.instance;
  }

  public static resetInstance(): void {
    if (ContractsFundingManager.instance) {
      ContractsFundingManager.instance.eventBus.clear();
      ContractsFundingManager.instance = null;
    }
  }

  // ─── Adapters & Engine Accessors ─────────────────────────────────────────────

  public getEventBus(): ContractEventBus {
    return this.eventBus;
  }

  public getEconomyAdapter(): ContractsEconomyAdapter {
    return this.economyAdapter;
  }

  public getGameTimeAdapter(): ContractsGameTimeAdapter {
    return this.gameTimeAdapter;
  }

  public getProgressionAdapter(): ContractsProgressionAdapter {
    return this.progressionAdapter;
  }

  public getMissionAdapter(): ContractsMissionAdapter {
    return this.missionAdapter;
  }

  public getFundingEngine(): FundingEngine {
    return this.fundingEngine;
  }

  // ─── Initialization ──────────────────────────────────────────────────────────

  private initializeDefaultData(): void {
    for (const sponsor of DEFAULT_SPONSORS) {
      this.sponsors.set(sponsor.id, {
        ...sponsor,
        activeAgreements: sponsor.activeAgreements.map((a) => ({
          ...a,
          conditions: [...a.conditions],
        })),
        contractHistory: [...sponsor.contractHistory],
      });
      this.progressionAdapter.setSponsorReputation(sponsor.id, sponsor.reputation);
    }

    for (const contract of DEFAULT_CONTRACTS) {
      this.contracts.set(contract.id, {
        ...contract,
        objectives: contract.objectives.map((o) => ({ ...o })),
        rewards: { ...contract.rewards },
        penalties: { ...contract.penalties },
        requiredEquipment: contract.requiredEquipment ? [...contract.requiredEquipment] : [],
      });
    }
  }

  private setupMissionBridge(): void {
    this.missionAdapter.setCallbacks(
      (update) => {
        // Forward objective progress if matching contracts exist
        for (const contract of this.contracts.values()) {
          if (
            contract.status === ContractStatus.ACCEPTED ||
            contract.status === ContractStatus.IN_PROGRESS
          ) {
            const matchingObj = contract.objectives.find((o) => o.id === update.objectiveId);
            if (matchingObj) {
              this.updateContractProgress(contract.id, update.objectiveId, update.currentProgress);
            }
          }
        }
      },
      (_completion) => {
        // Auto-check contracts linked to this mission type
        for (const contract of this.contracts.values()) {
          if (
            contract.status === ContractStatus.ACCEPTED ||
            contract.status === ContractStatus.IN_PROGRESS
          ) {
            this.evaluateContract(contract.id);
          }
        }
      }
    );
  }

  // ─── 1. Contract Listing & Retrieval ─────────────────────────────────────────

  public listContracts(filter?: ContractFilter): ContractRecord[] {
    let result = Array.from(this.contracts.values());

    if (filter) {
      if (filter.category) {
        result = result.filter((c) => c.category === filter.category);
      }
      if (filter.destinationId) {
        result = result.filter((c) => c.destinationId === filter.destinationId);
      }
      if (filter.status) {
        result = result.filter((c) => c.status === filter.status);
      }
      if (filter.sponsorId) {
        result = result.filter((c) => c.issuingSponsorId === filter.sponsorId);
      }
      if (filter.fundingSource) {
        result = result.filter((c) => c.fundingSource === filter.fundingSource);
      }
      if (typeof filter.minRank === 'number') {
        result = result.filter((c) => c.requiredDirectorRank <= (filter.minRank as number));
      }
    }

    return result.map((c) => ({
      ...c,
      objectives: c.objectives.map((o) => ({ ...o })),
      rewards: { ...c.rewards },
      penalties: { ...c.penalties },
    }));
  }

  public listAvailableContracts(filter?: Omit<ContractFilter, 'status'>): ContractRecord[] {
    return this.listContracts({ ...filter, status: ContractStatus.AVAILABLE });
  }

  public getContract(id: string): ContractRecord | null {
    const contract = this.contracts.get(id);
    if (!contract) return null;
    return {
      ...contract,
      objectives: contract.objectives.map((o) => ({ ...o })),
      rewards: { ...contract.rewards },
      penalties: { ...contract.penalties },
    };
  }

  // ─── 2. Contract Lifecycle Operations ────────────────────────────────────────

  public acceptContract(contractId: string): ContractRecord {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract with ID "${contractId}" not found`);
    }

    const currentRank = this.progressionAdapter.getDirectorRank();
    const currentRep = this.progressionAdapter.getSponsorReputation(contract.issuingSponsorId);
    const currentGameSeconds = this.gameTimeAdapter.getElapsedGameSeconds();

    const result = this.lifecycleEngine.acceptContract(
      contract,
      currentRank,
      currentRep,
      currentGameSeconds
    );
    if (!result.success) {
      throw new Error(result.error);
    }

    const sponsor = this.sponsors.get(contract.issuingSponsorId);
    if (sponsor && !sponsor.contractHistory.includes(contract.id)) {
      sponsor.contractHistory.push(contract.id);
    }

    this.eventBus.emit('ContractAccepted', {
      contract: { ...contract },
      acceptedAt: contract.acceptedTimestamp ?? Date.now(),
      deadlineSeconds: contract.deadlineSeconds,
    });

    return { ...contract };
  }

  public cancelContract(contractId: string, reason?: string): ContractRecord {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract with ID "${contractId}" not found`);
    }

    const result = this.lifecycleEngine.cancelContract(contract);
    if (!result.success) {
      throw new Error(result.error);
    }

    // Apply cancellation penalty
    const fee = contract.penalties.cancellationFeeCredits;
    const repLoss = contract.penalties.failureReputationLoss;

    this.economyAdapter.deductCredits(fee);
    const updatedRep = this.progressionAdapter.modifySponsorReputation(
      contract.issuingSponsorId,
      -repLoss
    );

    const sponsor = this.sponsors.get(contract.issuingSponsorId);
    if (sponsor) {
      sponsor.reputation = updatedRep;
    }

    this.eventBus.emit('ContractCancelled', {
      contractId: contract.id,
      contractTitle: contract.title,
      cancellationFeePaid: fee,
      reputationLoss: repLoss,
      reason,
      cancelledAt: Date.now(),
    });

    return { ...contract };
  }

  public updateContractProgress(
    contractId: string,
    objectiveId: string,
    progressDelta: number
  ): ContractRecord {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract with ID "${contractId}" not found`);
    }

    const result = this.lifecycleEngine.updateObjectiveProgress(
      contract,
      objectiveId,
      progressDelta
    );
    if (!result.updated || !result.objective) {
      return { ...contract };
    }

    this.eventBus.emit('ContractProgressUpdated', {
      contractId: contract.id,
      objectiveId,
      previousValue: result.objective.currentValue - progressDelta,
      currentValue: result.objective.currentValue,
      targetValue: result.objective.targetValue,
      isCompleted: result.objective.isCompleted,
      contractStatus: contract.status,
    });

    return { ...contract };
  }

  public evaluateContract(contractId: string): CompletionEvaluationResult {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract with ID "${contractId}" not found`);
    }
    return this.lifecycleEngine.evaluateCompletion(contract);
  }

  public completeContract(contractId: string): ContractRecord {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract with ID "${contractId}" not found`);
    }

    const result = this.lifecycleEngine.completeContract(contract);
    if (!result.success) {
      throw new Error(result.error);
    }

    const evalResult = result.evaluation;
    const currentGameSeconds = this.gameTimeAdapter.getElapsedGameSeconds();

    // Claim financial reward and log transaction through FundingEngine
    const claimResult = this.fundingEngine.claimContractReward(
      contract,
      evalResult.finalCreditsReward,
      currentGameSeconds,
      evalResult.isEarlyBonusAwarded,
      evalResult.isLatePenaltyApplied
    );

    if (!claimResult.claimed) {
      throw new Error(claimResult.error);
    }

    // Award reputation
    const repGain = contract.rewards.reputationGain;
    const updatedRep = this.progressionAdapter.modifySponsorReputation(
      contract.issuingSponsorId,
      repGain
    );
    const sponsor = this.sponsors.get(contract.issuingSponsorId);
    if (sponsor) {
      sponsor.reputation = updatedRep;
    }

    this.eventBus.emit('ContractCompleted', {
      contract: { ...contract },
      rewardsGranted: {
        credits: evalResult.finalCreditsReward,
        researchData: contract.rewards.researchData,
        rawMaterials: contract.rewards.rawMaterials,
        technologyPoints: contract.rewards.technologyPoints,
        reputationGain: repGain,
        isEarlyBonusAwarded: evalResult.isEarlyBonusAwarded,
        isLatePenaltyApplied: evalResult.isLatePenaltyApplied,
      },
      completedAt: contract.completedTimestamp ?? Date.now(),
    });

    return { ...contract };
  }

  public requestDeadlineExtension(
    contractId: string,
    extensionSeconds?: number
  ): { success: boolean; newDeadlineSeconds: number; error?: string } {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return { success: false, newDeadlineSeconds: 0, error: `Contract "${contractId}" not found` };
    }

    const extensionFee = 15000;
    if (this.economyAdapter.getAvailableCredits() < extensionFee) {
      return {
        success: false,
        newDeadlineSeconds: contract.deadlineSeconds ?? 0,
        error: `Insufficient credits for deadline extension fee ($₵${extensionFee.toLocaleString()})`,
      };
    }

    const result = this.lifecycleEngine.requestDeadlineExtension(contract, extensionSeconds);
    if (!result.success) {
      return result;
    }

    this.economyAdapter.deductCredits(extensionFee);

    this.eventBus.emit('DeadlineExtended', {
      contractId: contract.id,
      newDeadlineSeconds: result.newDeadlineSeconds,
      extensionCount: contract.extensionsGranted,
      feePaid: extensionFee,
    });

    return result;
  }

  // ─── 3. Sponsor Management & Agreements ──────────────────────────────────────

  public listSponsors(): SponsorRecord[] {
    return Array.from(this.sponsors.values()).map((s) => ({
      ...s,
      activeAgreements: s.activeAgreements.map((a) => ({
        ...a,
        conditions: [...a.conditions],
      })),
      contractHistory: [...s.contractHistory],
    }));
  }

  public getSponsor(id: string): SponsorRecord | null {
    const s = this.sponsors.get(id);
    if (!s) return null;
    return {
      ...s,
      activeAgreements: s.activeAgreements.map((a) => ({
        ...a,
        conditions: [...a.conditions],
      })),
      contractHistory: [...s.contractHistory],
    };
  }

  public createSponsorshipAgreement(
    sponsorId: string,
    type: AgreementType,
    terms: {
      title: string;
      periodicFunding: number;
      intervalGameDays: number;
      durationGameDays: number;
      conditions?: string[];
    }
  ): SponsorAgreement {
    const sponsor = this.sponsors.get(sponsorId);
    if (!sponsor) {
      throw new Error(`Sponsor with ID "${sponsorId}" not found`);
    }

    const intervals = Math.max(1, Math.floor(terms.durationGameDays / terms.intervalGameDays));
    const agreement: SponsorAgreement = {
      id: `AGREE_${sponsorId}_${Date.now()}`,
      sponsorId,
      title: terms.title,
      type,
      periodicFunding: terms.periodicFunding,
      intervalGameDays: terms.intervalGameDays,
      totalIntervals: intervals,
      remainingIntervals: intervals,
      isActive: true,
      conditions: terms.conditions ? [...terms.conditions] : [],
      lastDisbursedGameSeconds: this.gameTimeAdapter.getElapsedGameSeconds(),
      createdAt: Date.now(),
    };

    sponsor.activeAgreements.push(agreement);

    this.eventBus.emit('SponsorAgreementCreated', {
      agreement: { ...agreement },
      sponsor: { ...sponsor },
      timestamp: Date.now(),
    });

    return agreement;
  }

  // ─── 4. Funding Operations & Overview ────────────────────────────────────────

  public recordFundingTransaction(transactionInput: {
    source: FundingSourceType;
    sourceEntityId: string;
    sourceEntityName: string;
    amountCredits: number;
    reason: string;
    optionalRewards?: {
      researchData?: number;
      technologyPoints?: number;
      rawMaterials?: number;
    };
    contractId?: string;
  }): FundingTransaction {
    const currentGameSeconds = this.gameTimeAdapter.getElapsedGameSeconds();
    const tx = this.fundingEngine.recordTransaction(
      transactionInput.source,
      transactionInput.sourceEntityId,
      transactionInput.sourceEntityName,
      transactionInput.amountCredits,
      transactionInput.reason,
      currentGameSeconds,
      transactionInput.optionalRewards,
      transactionInput.contractId
    );

    this.eventBus.emit('FundingReceived', {
      transaction: { ...tx },
      newCreditsBalance: this.economyAdapter.getAvailableCredits(),
      timestamp: Date.now(),
    });

    return tx;
  }

  public getFundingOverview(): FundingOverview {
    return this.fundingEngine.computeOverview(
      Array.from(this.contracts.values()),
      Array.from(this.sponsors.values())
    );
  }

  // ─── 5. Periodic Tick & Simulation Clock ─────────────────────────────────────

  public tick(deltaGameSeconds: number): void {
    if (deltaGameSeconds <= 0) return;

    this.gameTimeAdapter.advanceFallbackTime(deltaGameSeconds);
    const currentGameSeconds = this.gameTimeAdapter.getElapsedGameSeconds();

    // 1. Tick contracts countdown
    for (const contract of this.contracts.values()) {
      if (
        contract.status === ContractStatus.ACCEPTED ||
        contract.status === ContractStatus.IN_PROGRESS
      ) {
        const tickRes = this.lifecycleEngine.tickContractTime(contract, deltaGameSeconds);
        if (tickRes.statusChanged && tickRes.expired) {
          this.eventBus.emit('ContractExpired', {
            contractId: contract.id,
            contractTitle: contract.title,
            expiredAt: Date.now(),
          });
        }
      }
    }

    // 2. Process periodic sponsorship disbursements
    const transactions = this.fundingEngine.processPeriodicAgreements(
      Array.from(this.sponsors.values()),
      currentGameSeconds
    );

    for (const tx of transactions) {
      this.eventBus.emit('FundingReceived', {
        transaction: { ...tx },
        newCreditsBalance: this.economyAdapter.getAvailableCredits(),
        timestamp: Date.now(),
      });
    }
  }

  // ─── 6. Persistence & Serialization ──────────────────────────────────────────

  public serialize(): ContractsFundingSaveState {
    return this.persistenceAdapter.serialize(
      Array.from(this.contracts.values()),
      Array.from(this.sponsors.values()),
      this.fundingEngine.getTransactions(),
      this.fundingEngine.getClaimedRewardContractIds()
    );
  }

  public deserialize(saveState: ContractsFundingSaveState): void {
    const data = this.persistenceAdapter.deserialize(saveState);

    this.contracts.clear();
    for (const c of data.contracts) {
      this.contracts.set(c.id, c);
    }

    this.sponsors.clear();
    for (const s of data.sponsors) {
      this.sponsors.set(s.id, s);
      this.progressionAdapter.setSponsorReputation(s.id, s.reputation);
    }

    this.fundingEngine.setRestoredState(data.transactions, data.claimedRewardContractIds);
  }
}
