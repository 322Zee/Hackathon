/**
 * INTERSTELLAR CONTINUUM - Payload & Transportation Event Payloads
 * Strongly typed events dispatched during payload lifecycle transitions,
 * vehicle mounting/removal, transit tracking, and delivery objective completion.
 */

import { DestinationId } from '../../destinations/DestinationTypes';

export interface PayloadAssignedPayload {
  payloadId: string;
  payloadName: string;
  vehicleId: string;
  vehicleName: string;
  quantity: number;
  totalMassRating: number;
  totalPowerRequirement: number;
  totalStorageUsed: number;
  missionId?: string;
  timestamp: number;
}

export interface PayloadRemovedPayload {
  payloadId: string;
  payloadName: string;
  vehicleId: string;
  quantity: number;
  missionId?: string;
  timestamp: number;
}

export interface PayloadReservedPayload {
  payloadId: string;
  payloadName: string;
  missionId: string;
  quantity: number;
  timestamp: number;
}

export interface PayloadInTransitPayload {
  payloadId: string;
  payloadName: string;
  vehicleId: string;
  missionId: string;
  destinationId: DestinationId | string;
  quantity: number;
  timestamp: number;
}

export interface PayloadDeliveredPayload {
  payloadId: string;
  payloadName: string;
  missionId: string;
  destinationId: DestinationId | string;
  quantity: number;
  remainingRequired?: number;
  timestamp: number;
}

export interface DeliveryObjectiveCompletedPayload {
  missionId: string;
  objectiveId: string;
  payloadId: string;
  requiredQuantity: number;
  deliveredQuantity: number;
  destinationId: DestinationId | string;
  allDeliveryObjectivesComplete: boolean;
  timestamp: number;
}

/**
 * Event map for the Payload & Transportation domain
 */
export interface PayloadDomainEvents {
  PayloadAssigned: PayloadAssignedPayload;
  PayloadRemoved: PayloadRemovedPayload;
  PayloadReserved: PayloadReservedPayload;
  PayloadInTransit: PayloadInTransitPayload;
  PayloadDelivered: PayloadDeliveredPayload;
  DeliveryObjectiveCompleted: DeliveryObjectiveCompletedPayload;
}
