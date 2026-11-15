/**
 * INTERSTELLAR CONTINUUM - Scientific Data Collection & Research Subsystem
 * Authoritative module exports.
 */

// Types & Contracts
export * from './ScientificTypes';

// Events & Event Bus
export * from './ScientificEvents';
export * from './ScientificEventBus';

// Central Manager
export * from './ScientificDataManager';

// Adapters
export * from './adapters/EconomyAdapter';
export * from './adapters/ResearchServiceAdapter';

// Authored Datasets
export * from './data/DefaultScientificDiscoveries';
export * from './data/DefaultResearchProjects';

// User Interface
export * from './ui/ScientificArchiveView';
