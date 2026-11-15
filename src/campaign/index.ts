/**
 * INTERSTELLAR CONTINUUM - Campaign Progression & Onboarding Module Barrel
 */

// Types
export * from './CampaignTypes';
export * from './CampaignEvents';
export * from './CampaignEventBus';

// Core Services
export * from './CampaignProgressionEngine';
export * from './TutorialRegistry';
export * from './ContextualHelpService';
export * from './CampaignManager';

// Catalogs & Authoritative Data
export * from './data/CampaignChaptersData';
export * from './data/CampaignObjectivesData';
export * from './data/NarrativeIntroData';
export * from './data/TutorialDefinitions';
export * from './data/ContextualHelpData';

// Adapters
export * from './adapters/CampaignSaveAdapter';
export * from './adapters/MissionCompletionAdapter';
export * from './adapters/RocketEngineeringAdapter';
export * from './adapters/ResearchProgressionAdapter';
export * from './adapters/ContractsAdapter';
export * from './adapters/SolarSystemAdapter';
export * from './adapters/OrganisationAdapter';
export * from './adapters/HeadquartersAdapter';

// UI Components
export * from './ui/NarrativeIntroModal';
export * from './ui/CampaignOverviewView';
export * from './ui/ContextualHelpModal';
export * from './ui/ChapterTransitionBanner';
