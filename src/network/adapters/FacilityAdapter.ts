/**
 * INTERSTELLAR CONTINUUM - Network Facility Adapter
 * Connects the Communications Network module with FacilityRegistry and
 * the physical Headquarters Communication & Network Centre (FAC_COMMUNICATIONS_CENTRE).
 */

import { FacilityRegistry } from '../../facilities/FacilityRegistry';
import { FacilityId, FacilityAvailabilityState } from '../../facilities/FacilityTypes';

export class FacilityAdapter {
  private facilityRegistry?: FacilityRegistry;
  private currentRank: number = 5;

  constructor(facilityRegistry?: FacilityRegistry, rank: number = 5) {
    this.facilityRegistry = facilityRegistry;
    this.currentRank = rank;
  }

  public setFacilityRegistry(facilityRegistry?: FacilityRegistry): void {
    this.facilityRegistry = facilityRegistry;
  }

  public setPlayerRank(rank: number): void {
    this.currentRank = rank;
  }

  public isCommunicationsCentreOperational(): boolean {
    if (!this.facilityRegistry) return true;
    const fac = this.facilityRegistry.getFacility(FacilityId.COMMUNICATIONS_CENTRE);
    if (!fac) return true;
    return (
      fac.availability === FacilityAvailabilityState.OPERATIONAL ||
      fac.availability === FacilityAvailabilityState.AVAILABLE
    );
  }

  public getCommunicationsCentreTier(): number {
    if (!this.facilityRegistry) return 1;
    const fac = this.facilityRegistry.getFacility(FacilityId.COMMUNICATIONS_CENTRE);
    return fac?.upgradeState?.currentTier ?? 1;
  }

  public recordCommunicationsCentreVisit(): void {
    if (this.facilityRegistry) {
      this.facilityRegistry.recordVisit(FacilityId.COMMUNICATIONS_CENTRE);
    }
  }

  public getPlayerRank(): number {
    return this.currentRank;
  }
}
