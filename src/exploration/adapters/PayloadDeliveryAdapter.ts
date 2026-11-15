/**
 * INTERSTELLAR CONTINUUM - Payload Delivery Adapter
 * Bridges transported rover payloads to exploration deployment.
 */

import { PayloadTransportationService } from '../../payload/PayloadTransportationService';
import { PayloadCategory } from '../../payload/PayloadTypes';
import { RoverModelType } from '../ExplorationTypes';

export interface TransportedRoverPayload {
  payloadId: string;
  name: string;
  roverModel: RoverModelType;
  quantity: number;
}

export class PayloadDeliveryAdapter {
  public getDeliveredRovers(_destinationId: string): TransportedRoverPayload[] {
    try {
      const payloadService = new PayloadTransportationService();
      const available = payloadService.getAvailablePayloads();
      const results: TransportedRoverPayload[] = [];

      for (const p of available) {
        if (p.category === PayloadCategory.ROBOTIC_ROVERS) {
          let model = RoverModelType.SCOUT;
          if (p.id.includes('titan') || p.id.includes('heavy')) {
            model = RoverModelType.HEAVY_UTILITY;
          } else if (p.id.includes('science') || p.id.includes('cryo')) {
            model = RoverModelType.SCIENTIFIC;
          } else if (p.id.includes('autonomous') || p.id.includes('vanguard')) {
            model = RoverModelType.ADVANCED_AUTONOMOUS;
          }

          results.push({
            payloadId: p.id,
            name: p.name,
            roverModel: model,
            quantity: 1,
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  }
}
