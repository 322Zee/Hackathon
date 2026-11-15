/**
 * INTERSTELLAR CONTINUUM - Planetary Base Domain Events & Payloads
 * Strongly typed event payloads dispatched across the Planetary Base lifecycle.
 */

import {
  BaseRecord,
  BaseOperationalStatus,
  InstalledModuleRecord,
  ConstructionTask,
  BaseDeploymentPlan,
  MaintenanceUrgency,
  BasePowerStatus,
} from './BaseTypes';

export interface BasePlannedEventPayload {
  plan: BaseDeploymentPlan;
  timestamp: number;
}

export interface BaseDeploymentStartedEventPayload {
  baseId: string;
  baseName: string;
  destinationId: string;
  locationId: string;
  timestamp: number;
}

export interface BaseEstablishedEventPayload {
  base: BaseRecord;
  timestamp: number;
}

export interface ModuleConstructionStartedEventPayload {
  baseId: string;
  task: ConstructionTask;
  timestamp: number;
}

export interface ModuleConstructionCompletedEventPayload {
  baseId: string;
  module: InstalledModuleRecord;
  slotIndex: number;
  timestamp: number;
}

export interface BaseModuleUpgradedEventPayload {
  baseId: string;
  module: InstalledModuleRecord;
  previousLevel: number;
  newLevel: number;
  timestamp: number;
}

export interface BaseStatusChangedEventPayload {
  baseId: string;
  previousStatus: BaseOperationalStatus;
  newStatus: BaseOperationalStatus;
  reason?: string;
  timestamp: number;
}

export interface BaseMaintenanceRequiredEventPayload {
  baseId: string;
  condition: number;
  urgency: MaintenanceUrgency;
  requiredSupplies: number;
  timestamp: number;
}

export interface BaseExpandedEventPayload {
  baseId: string;
  previousSlots: number;
  newSlots: number;
  sectorId?: string;
  timestamp: number;
}

export interface BasePowerStatusChangedEventPayload {
  baseId: string;
  powerStatus: BasePowerStatus;
  wasDeficit: boolean;
  isDeficit: boolean;
  timestamp: number;
}

export interface BaseConstructionCancelledEventPayload {
  baseId: string;
  taskId: string;
  refundedCredits: number;
  refundedMaterials: number;
  timestamp: number;
}

/**
 * Registry of all Planetary Base Events
 */
export interface PlanetaryBaseEvents {
  BasePlanned: BasePlannedEventPayload;
  BaseDeploymentStarted: BaseDeploymentStartedEventPayload;
  BaseEstablished: BaseEstablishedEventPayload;
  ModuleConstructionStarted: ModuleConstructionStartedEventPayload;
  ModuleConstructionCompleted: ModuleConstructionCompletedEventPayload;
  BaseModuleUpgraded: BaseModuleUpgradedEventPayload;
  BaseStatusChanged: BaseStatusChangedEventPayload;
  BaseMaintenanceRequired: BaseMaintenanceRequiredEventPayload;
  BaseExpanded: BaseExpandedEventPayload;
  BasePowerStatusChanged: BasePowerStatusChangedEventPayload;
  BaseConstructionCancelled: BaseConstructionCancelledEventPayload;
}
