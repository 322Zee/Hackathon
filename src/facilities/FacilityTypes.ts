/**
 * INTERSTELLAR CONTINUUM - Facility Data Contracts & Architecture
 * Centralized data models for headquarters facilities, access control,
 * future system connections, visit telemetry, and upgrade progression.
 */

import { InteractionCategory } from '../interaction/InteractionTypes';

export enum FacilityId {
  MISSION_OPERATIONS = 'FAC_MISSION_OPERATIONS',
  ROCKET_ENGINEERING = 'FAC_ROCKET_ENGINEERING',
  SPACECRAFT_LAB = 'FAC_SPACECRAFT_LAB',
  RESEARCH_DEVELOPMENT = 'FAC_RESEARCH_DEVELOPMENT',
  FINANCE_ADMIN = 'FAC_FINANCE_ADMIN',
  MANUFACTURING_CENTRE = 'FAC_MANUFACTURING_CENTRE',
  ROBOTICS_CENTRE = 'FAC_ROBOTICS_CENTRE',
  COMMUNICATIONS_CENTRE = 'FAC_COMMUNICATIONS_CENTRE',
  PLANETARY_DATA_CENTRE = 'FAC_PLANETARY_DATA_CENTRE',
  SETTINGS_ADMIN = 'FAC_CENTRAL_PLAZA_KIOSK',
  ARRIVAL_GATE = 'FAC_ARRIVAL_GATE',
  LAUNCH_COMPLEX_PAD_ALPHA = 'FAC_LAUNCH_COMPLEX_PAD_ALPHA',
}

export enum FacilityCategory {
  MISSION_CONTROL = 'MISSION_CONTROL',
  ENGINEERING = 'ENGINEERING',
  LABORATORY = 'LABORATORY',
  RESEARCH = 'RESEARCH',
  ADMINISTRATION = 'ADMINISTRATION',
  MANUFACTURING = 'MANUFACTURING',
  ROBOTICS = 'ROBOTICS',
  COMMUNICATIONS = 'COMMUNICATIONS',
  PLANETARY_SCIENCE = 'PLANETARY_SCIENCE',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  LAUNCH_INFRASTRUCTURE = 'LAUNCH_INFRASTRUCTURE',
  SECURITY = 'SECURITY',
}

export enum FacilityAvailabilityState {
  AVAILABLE = 'AVAILABLE',
  OPERATIONAL = 'OPERATIONAL',
  RESTRICTED = 'RESTRICTED',
  LOCKED = 'LOCKED',
  UNDER_UPGRADE = 'UNDER_UPGRADE',
}

export enum FutureGameplaySystem {
  MISSION_OPERATIONS = 'MISSION_OPERATIONS_SYSTEM',
  ROCKET_ENGINEERING = 'ROCKET_ENGINEERING_SYSTEM',
  SPACECRAFT_LABORATORY = 'SPACECRAFT_LAB_SYSTEM',
  RESEARCH_DEVELOPMENT = 'RESEARCH_DEVELOPMENT_SYSTEM',
  FINANCE_ADMINISTRATION = 'FINANCE_ADMIN_SYSTEM',
  RESOURCE_MANUFACTURING = 'MANUFACTURING_SYSTEM',
  ROBOTICS_EXPLORATION = 'ROBOTICS_SYSTEM',
  COMMUNICATIONS_NETWORK = 'COMMUNICATIONS_SYSTEM',
  PLANETARY_DATA = 'PLANETARY_SCIENCE_SYSTEM',
  SYSTEM_ADMINISTRATION = 'SETTINGS_SYSTEM',
  LAUNCH_OPERATIONS = 'LAUNCH_OPERATIONS_SYSTEM',
  CAMPUS_SECURITY = 'CAMPUS_SECURITY_SYSTEM',
}

export interface FacilityVisitState {
  visited: boolean;
  visitCount: number;
  firstVisitedTimestamp?: number;
  lastVisitedTimestamp?: number;
}

export interface FacilityUpgradeState {
  currentTier: number;
  maxTier: number;
  upgradeName: string;
  upgradeStatus: 'NONE' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface FacilitySpecItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface FacilityRecord {
  id: FacilityId | string;
  name: string;
  shortCode: string;
  department: string;
  category: FacilityCategory;
  interactionCategory: InteractionCategory;
  worldPosition: { x: number; y: number };
  entrancePosition: { x: number; y: number };
  width: number;
  height: number;
  description: string;
  purpose: string;
  iconName: string;
  accentColor: number;
  availability: FacilityAvailabilityState;
  requiredRank: number; // 0 for unrestricted
  requiredRankTitle: string;
  lockReason?: string;
  futureSystem: FutureGameplaySystem;
  futureSystemDescription: string;
  futureCapabilities: string[];
  destinationSceneId: string;
  visitState: FacilityVisitState;
  upgradeState: FacilityUpgradeState;
  specs: FacilitySpecItem[];
}
