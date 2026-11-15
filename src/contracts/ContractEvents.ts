/**
 * INTERSTELLAR CONTINUUM - Contracts & Funding Domain Events
 * Strongly typed events dispatched across the contracts and funding subsystem.
 */

import {
  ContractRecord,
  SponsorRecord,
  SponsorAgreement,
  FundingTransaction,
  ContractStatus,
} from './ContractTypes';

export interface ContractAvailablePayload {
  contract: ContractRecord;
  timestamp: number;
}

export interface ContractAcceptedPayload {
  contract: ContractRecord;
  acceptedAt: number;
  deadlineSeconds: number | null;
}

export interface ContractProgressUpdatedPayload {
  contractId: string;
  objectiveId: string;
  previousValue: number;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  contractStatus: ContractStatus;
}

export interface ContractCompletedPayload {
  contract: ContractRecord;
  rewardsGranted: {
    credits: number;
    researchData?: number;
    rawMaterials?: number;
    technologyPoints?: number;
    reputationGain: number;
    isEarlyBonusAwarded?: boolean;
    isLatePenaltyApplied?: boolean;
  };
  completedAt: number;
}

export interface ContractExpiredPayload {
  contractId: string;
  contractTitle: string;
  expiredAt: number;
}

export interface ContractCancelledPayload {
  contractId: string;
  contractTitle: string;
  cancellationFeePaid: number;
  reputationLoss: number;
  reason?: string;
  cancelledAt: number;
}

export interface ContractFailedPayload {
  contractId: string;
  contractTitle: string;
  reputationLoss: number;
  reason?: string;
  failedAt: number;
}

export interface DeadlineExtendedPayload {
  contractId: string;
  newDeadlineSeconds: number;
  extensionCount: number;
  feePaid: number;
}

export interface SponsorAgreementCreatedPayload {
  agreement: SponsorAgreement;
  sponsor: SponsorRecord;
  timestamp: number;
}

export interface FundingReceivedPayload {
  transaction: FundingTransaction;
  newCreditsBalance: number;
  timestamp: number;
}

export interface SponsorReputationChangedPayload {
  sponsorId: string;
  sponsorName: string;
  previousReputation: number;
  currentReputation: number;
  delta: number;
}

export interface ContractsFundingEvents {
  ContractAvailable: ContractAvailablePayload;
  ContractAccepted: ContractAcceptedPayload;
  ContractProgressUpdated: ContractProgressUpdatedPayload;
  ContractCompleted: ContractCompletedPayload;
  ContractExpired: ContractExpiredPayload;
  ContractCancelled: ContractCancelledPayload;
  ContractFailed: ContractFailedPayload;
  DeadlineExtended: DeadlineExtendedPayload;
  SponsorAgreementCreated: SponsorAgreementCreatedPayload;
  FundingReceived: FundingReceivedPayload;
  SponsorReputationChanged: SponsorReputationChangedPayload;
}
