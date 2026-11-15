/**
 * INTERSTELLAR CONTINUUM - Solar System Map & Navigation Events
 * Strongly typed event constants and payload contracts for navigation interactions.
 */

import { DestinationRecord } from '../DestinationTypes';
import {
  DestinationFilterOptions,
  NavigationActionRequest,
  ExplorationStatusBadge,
} from './NavigationTypes';

export const NAVIGATION_EVENTS = {
  DESTINATION_SELECTED: 'navigation:destination_selected',
  DESTINATION_FOCUSED: 'navigation:destination_focused',
  SYSTEM_INSPECTED: 'navigation:system_inspected',
  RETURNED_TO_OVERVIEW: 'navigation:returned_to_overview',
  FILTER_CHANGED: 'navigation:filter_changed',
  ACTION_TRIGGERED: 'navigation:action_triggered',
  STATUS_UPDATED: 'navigation:status_updated',
} as const;

export interface DestinationSelectedPayload {
  readonly destinationId: string;
  readonly destination: DestinationRecord;
  readonly statusBadge: ExplorationStatusBadge;
  readonly timestamp: number;
}

export interface DestinationFocusedPayload {
  readonly destinationId: string;
  readonly zoomLevel: number;
  readonly timestamp: number;
}

export interface SystemInspectedPayload {
  readonly parentDestinationId: string;
  readonly parentDestination: DestinationRecord;
  readonly children: readonly DestinationRecord[];
  readonly timestamp: number;
}

export interface ReturnedToOverviewPayload {
  readonly timestamp: number;
}

export interface FilterChangedPayload {
  readonly filters: DestinationFilterOptions;
  readonly matchCount: number;
  readonly timestamp: number;
}

export interface NavigationActionTriggeredPayload {
  readonly request: NavigationActionRequest;
  readonly timestamp: number;
}

export interface NavigationEventMap {
  [NAVIGATION_EVENTS.DESTINATION_SELECTED]: DestinationSelectedPayload;
  [NAVIGATION_EVENTS.DESTINATION_FOCUSED]: DestinationFocusedPayload;
  [NAVIGATION_EVENTS.SYSTEM_INSPECTED]: SystemInspectedPayload;
  [NAVIGATION_EVENTS.RETURNED_TO_OVERVIEW]: ReturnedToOverviewPayload;
  [NAVIGATION_EVENTS.FILTER_CHANGED]: FilterChangedPayload;
  [NAVIGATION_EVENTS.ACTION_TRIGGERED]: NavigationActionTriggeredPayload;
}

