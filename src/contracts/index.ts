/**
 * INTERSTELLAR CONTINUUM - Mission Contracts, Sponsors & Funding Management
 * Authoritative module exports.
 */

// Types & Contracts
export * from './ContractTypes';

// Events & Event Bus
export * from './ContractEvents';
export * from './ContractEventBus';

// Registries
export * from './ContractRegistry';
export * from './SponsorRegistry';

// Engines
export * from './ContractLifecycleEngine';
export * from './FundingEngine';

// Central Manager
export * from './ContractsFundingManager';

// Adapters
export * from './adapters/EconomyAdapter';
export * from './adapters/GameTimeAdapter';
export * from './adapters/ProgressionAdapter';
export * from './adapters/MissionAdapter';
export * from './adapters/PersistenceAdapter';

// User Interface
export * from './ui/ContractCard';
export * from './ui/SponsorDossierPanel';
export * from './ui/ContractsFundingView';
