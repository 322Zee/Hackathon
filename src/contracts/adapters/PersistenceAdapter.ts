/**
 * INTERSTELLAR CONTINUUM - Contracts Persistence Adapter
 * Serializes and restores contracts, sponsors, agreements, and transaction history.
 */

import {
  ContractsFundingSaveState,
  ContractRecord,
  SponsorRecord,
  FundingTransaction,
  CONTRACTS_FUNDING_SCHEMA_VERSION,
} from '../ContractTypes';

export class ContractsPersistenceAdapter {
  public serialize(
    contracts: ContractRecord[],
    sponsors: SponsorRecord[],
    transactions: FundingTransaction[],
    claimedRewardContractIds: string[]
  ): ContractsFundingSaveState {
    return {
      schemaVersion: CONTRACTS_FUNDING_SCHEMA_VERSION,
      contracts: contracts.map((c) => ({
        ...c,
        objectives: c.objectives.map((o) => ({ ...o })),
        rewards: { ...c.rewards },
        penalties: { ...c.penalties },
        requiredEquipment: c.requiredEquipment ? [...c.requiredEquipment] : [],
      })),
      sponsors: sponsors.map((s) => ({
        ...s,
        activeAgreements: s.activeAgreements.map((a) => ({
          ...a,
          conditions: [...a.conditions],
        })),
        contractHistory: [...s.contractHistory],
      })),
      transactions: transactions.map((t) => ({ ...t })),
      claimedRewardContractIds: [...claimedRewardContractIds],
    };
  }

  public deserialize(saveState: ContractsFundingSaveState): {
    contracts: ContractRecord[];
    sponsors: SponsorRecord[];
    transactions: FundingTransaction[];
    claimedRewardContractIds: string[];
  } {
    if (!saveState || !Array.isArray(saveState.contracts) || !Array.isArray(saveState.sponsors)) {
      throw new Error('Invalid contracts funding save state: missing required arrays');
    }

    return {
      contracts: saveState.contracts.map((c) => ({
        ...c,
        objectives: Array.isArray(c.objectives) ? c.objectives.map((o) => ({ ...o })) : [],
        rewards: { ...c.rewards },
        penalties: { ...c.penalties },
        requiredEquipment: Array.isArray(c.requiredEquipment) ? [...c.requiredEquipment] : [],
      })),
      sponsors: saveState.sponsors.map((s) => ({
        ...s,
        activeAgreements: Array.isArray(s.activeAgreements)
          ? s.activeAgreements.map((a) => ({
              ...a,
              conditions: Array.isArray(a.conditions) ? [...a.conditions] : [],
            }))
          : [],
        contractHistory: Array.isArray(s.contractHistory) ? [...s.contractHistory] : [],
      })),
      transactions: Array.isArray(saveState.transactions)
        ? saveState.transactions.map((t) => ({ ...t }))
        : [],
      claimedRewardContractIds: Array.isArray(saveState.claimedRewardContractIds)
        ? [...saveState.claimedRewardContractIds]
        : [],
    };
  }
}
