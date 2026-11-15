/**
 * INTERSTELLAR CONTINUUM - Mission Contracts, Sponsors & Funding Management
 * Authoritative data contracts, enums, interfaces, and schemas.
 *
 * NOTE: All monetary and financial figures are abstract in-game progression credits.
 * All sponsor names and institutional entities are 100% fictional.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { MissionCategory, PayloadType } from '../missions/MissionTypes';

// ─── Contract Categories ────────────────────────────────────────────────────────

export enum ContractCategory {
  SATELLITE_DEPLOYMENT = 'SATELLITE_DEPLOYMENT',
  COMMUNICATIONS_INFRASTRUCTURE = 'COMMUNICATIONS_INFRASTRUCTURE',
  SCIENTIFIC_RESEARCH = 'SCIENTIFIC_RESEARCH',
  PLANETARY_OBSERVATION = 'PLANETARY_OBSERVATION',
  ROBOTIC_EXPLORATION = 'ROBOTIC_EXPLORATION',
  PAYLOAD_TRANSPORTATION = 'PAYLOAD_TRANSPORTATION',
  PLANETARY_BASE_DEVELOPMENT = 'PLANETARY_BASE_DEVELOPMENT',
  TECHNOLOGY_DEMONSTRATION = 'TECHNOLOGY_DEMONSTRATION',
  LONG_TERM_PROGRAMME = 'LONG_TERM_PROGRAMME',
}

export const CONTRACT_CATEGORY_LABELS: Record<ContractCategory, string> = {
  [ContractCategory.SATELLITE_DEPLOYMENT]: 'Satellite Deployment',
  [ContractCategory.COMMUNICATIONS_INFRASTRUCTURE]: 'Communications Infrastructure',
  [ContractCategory.SCIENTIFIC_RESEARCH]: 'Scientific Research',
  [ContractCategory.PLANETARY_OBSERVATION]: 'Planetary Observation',
  [ContractCategory.ROBOTIC_EXPLORATION]: 'Robotic Exploration',
  [ContractCategory.PAYLOAD_TRANSPORTATION]: 'Payload Transportation',
  [ContractCategory.PLANETARY_BASE_DEVELOPMENT]: 'Planetary Base Development',
  [ContractCategory.TECHNOLOGY_DEMONSTRATION]: 'Technology Demonstration',
  [ContractCategory.LONG_TERM_PROGRAMME]: 'Long-Term Programme',
};

// ─── Contract Status & Lifecycle ────────────────────────────────────────────────

export enum ContractStatus {
  AVAILABLE = 'AVAILABLE',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

// ─── Funding Sources ────────────────────────────────────────────────────────────

export enum FundingSourceType {
  GOVERNMENT_GRANT = 'GOVERNMENT_GRANT',
  PRIVATE_SPONSOR = 'PRIVATE_SPONSOR',
  RESEARCH_GRANT = 'RESEARCH_GRANT',
  MISSION_CONTRACT = 'MISSION_CONTRACT',
  DATA_LICENSING = 'DATA_LICENSING',
  LONG_TERM_PROGRAMME = 'LONG_TERM_PROGRAMME',
}

export const FUNDING_SOURCE_LABELS: Record<FundingSourceType, string> = {
  [FundingSourceType.GOVERNMENT_GRANT]: 'Government & Institutional Grant',
  [FundingSourceType.PRIVATE_SPONSOR]: 'Private Commercial Sponsor',
  [FundingSourceType.RESEARCH_GRANT]: 'Academic Research Grant',
  [FundingSourceType.MISSION_CONTRACT]: 'Commercial Mission Contract',
  [FundingSourceType.DATA_LICENSING]: 'Scientific Data Licensing',
  [FundingSourceType.LONG_TERM_PROGRAMME]: 'Multi-Stage Exploration Programme',
};

// ─── Sponsor Categories ─────────────────────────────────────────────────────────

export enum SponsorCategory {
  GOVERNMENT_INSTITUTION = 'GOVERNMENT_INSTITUTION',
  COMMERCIAL_TELECOM = 'COMMERCIAL_TELECOM',
  AEROSPACE_INDUSTRIAL = 'AEROSPACE_INDUSTRIAL',
  SCIENTIFIC_FOUNDATION = 'SCIENTIFIC_FOUNDATION',
  MINING_CONSORTIUM = 'MINING_CONSORTIUM',
  MEDIA_BROADCASTER = 'MEDIA_BROADCASTER',
}

export const SPONSOR_CATEGORY_LABELS: Record<SponsorCategory, string> = {
  [SponsorCategory.GOVERNMENT_INSTITUTION]: 'Governmental & Global Coalition',
  [SponsorCategory.COMMERCIAL_TELECOM]: 'Satellite & Telecom Conglomerate',
  [SponsorCategory.AEROSPACE_INDUSTRIAL]: 'Aerospace Engineering Consortium',
  [SponsorCategory.SCIENTIFIC_FOUNDATION]: 'Planetary Science Institute',
  [SponsorCategory.MINING_CONSORTIUM]: 'Extraterrestrial Resources Syndicate',
  [SponsorCategory.MEDIA_BROADCASTER]: 'Educational Media Foundation',
};

// ─── Contract Objectives ───────────────────────────────────────────────────────

export interface ContractObjective {
  id: string;
  description: string;
  targetDestinationId?: DestinationId;
  requiredMissionCategory?: MissionCategory;
  requiredPayloadType?: PayloadType;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  unit?: string;
}

// ─── Rewards & Penalties ───────────────────────────────────────────────────────

export interface ContractReward {
  credits: number;
  researchData?: number;
  rawMaterials?: number;
  technologyPoints?: number;
  reputationGain: number;
  earlyBonusCredits?: number;
  earlyBonusTimeThresholdPercent?: number; // e.g. 25 = 25% of time remaining
}

export interface ContractPenalty {
  cancellationFeeCredits: number;
  failureReputationLoss: number;
  latePenaltyPercent: number; // e.g. 20% reduced payout if completed in grace period
}

// ─── Master Contract Record ────────────────────────────────────────────────────

export interface ContractRecord {
  id: string;
  title: string;
  issuingSponsorId: string;
  sponsorName: string;
  category: ContractCategory;
  fundingSource: FundingSourceType;
  description: string;
  destinationId: DestinationId;
  requiredMissionType: string;
  requiredPayloadType?: string;
  requiredEquipment?: string[];
  objectives: ContractObjective[];
  deadlineSeconds: number | null; // null for open-ended, or duration in game seconds from acceptance
  timeRemainingSeconds?: number | null;
  acceptedTimestamp?: number | null;
  completedTimestamp?: number | null;
  rewards: ContractReward;
  penalties: ContractPenalty;
  status: ContractStatus;
  requiredDirectorRank: number;
  requiredReputation: number;
  isClaimed: boolean;
  extensionsGranted: number;
  maxExtensions: number;
  gracePeriodSeconds: number;
  isInGracePeriod?: boolean;
  schemaVersion: number;
}

// ─── Sponsor & Agreement Models ────────────────────────────────────────────────

export type AgreementType =
  | 'EXPLORATION_GRANT'
  | 'COMMERCIAL_PARTNERSHIP'
  | 'DATA_LICENSE'
  | 'INFRASTRUCTURE_SUBSIDY';

export interface SponsorAgreement {
  id: string;
  sponsorId: string;
  title: string;
  type: AgreementType;
  periodicFunding: number;
  intervalGameDays: number;
  totalIntervals: number;
  remainingIntervals: number;
  isActive: boolean;
  conditions: string[];
  lastDisbursedGameSeconds: number;
  createdAt: number;
}

export interface SponsorRecord {
  id: string;
  name: string;
  description: string;
  category: SponsorCategory;
  fundingTier: number; // 1 to 5
  availableBudget: number;
  reputation: number; // -100 to +100
  minDirectorRank: number;
  activeAgreements: SponsorAgreement[];
  contractHistory: string[];
  logoAssetKey?: string;
}

// ─── Funding Transactions & Logs ───────────────────────────────────────────────

export interface FundingTransaction {
  id: string;
  source: FundingSourceType;
  sourceEntityId: string;
  sourceEntityName: string;
  amountCredits: number;
  researchData?: number;
  technologyPoints?: number;
  rawMaterials?: number;
  timestamp: number;
  gameTimeSeconds: number;
  reason: string;
  contractId?: string;
}

// ─── Funding Overview Summary ──────────────────────────────────────────────────

export interface FundingOverview {
  totalEarnings: number;
  activeContractValue: number;
  projectedGrants: number;
  confirmedFunding: number;
  currentCreditsBalance: number;
  totalTransactions: number;
  sponsorsCount: number;
  activeAgreementsCount: number;
  averageReputation: number;
  contractsCompleted: number;
  contractsActive: number;
  contractsAvailable: number;
}

// ─── Contracts Filter ──────────────────────────────────────────────────────────

export interface ContractFilter {
  category?: ContractCategory;
  destinationId?: DestinationId;
  status?: ContractStatus;
  sponsorId?: string;
  fundingSource?: FundingSourceType;
  minRank?: number;
}

// ─── Save State Schema ─────────────────────────────────────────────────────────

export interface ContractsFundingSaveState {
  schemaVersion: number;
  contracts: ContractRecord[];
  sponsors: SponsorRecord[];
  transactions: FundingTransaction[];
  claimedRewardContractIds: string[];
}

export const CONTRACTS_FUNDING_SCHEMA_VERSION = 1;
