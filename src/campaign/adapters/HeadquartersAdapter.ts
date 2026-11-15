/**
 * INTERSTELLAR CONTINUUM - Headquarters & Campus Exploration Adapter
 * Bridges headquarters navigation, campus interaction, and facility exploration
 * into campaign progression objectives.
 */

import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import { CampaignManager } from '../CampaignManager';
import { FacilityRegistry } from '../../facilities/FacilityRegistry';
import { FacilityId } from '../../facilities/FacilityTypes';

export class HeadquartersAdapter {
  private eventBus?: EventBus;
  private campaignManager: CampaignManager;
  private facilityRegistry?: FacilityRegistry;

  private visitedFacilities: Set<string> = new Set();
  private readonly targetOrientationFacilities: string[] = [
    FacilityId.MISSION_OPERATIONS,
    FacilityId.ROCKET_ENGINEERING,
    FacilityId.LAUNCH_COMPLEX_PAD_ALPHA,
  ];

  constructor(campaignManager: CampaignManager, eventBus?: EventBus, facilityRegistry?: FacilityRegistry) {
    this.campaignManager = campaignManager;
    this.eventBus = eventBus;
    this.facilityRegistry = facilityRegistry;

    this.attachListeners();
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
    this.attachListeners();
  }

  public getFacilityRegistry(): FacilityRegistry | undefined {
    return this.facilityRegistry;
  }

  private attachListeners(): void {
    if (!this.eventBus) return;

    this.eventBus.on('facility:visited', (payload: any) => {
      if (payload && payload.facilityId) {
        this.recordFacilityVisited(payload.facilityId);
      }
    });

    (this.eventBus as any).on('headquarters:facility-entered', (payload: any) => {
      if (payload && payload.facilityId) {
        this.recordFacilityVisited(payload.facilityId);
      }
    });

    (this.eventBus as any).on('headquarters:tour-completed', () => {
      this.completeCampusOrientation();
    });
  }

  private normalizeFacilityId(id: string): string {
    const upper = id.toUpperCase();
    if (upper.includes('MISSION_OPERATION')) return FacilityId.MISSION_OPERATIONS;
    if (upper.includes('ROCKET_ENGINEERING') || upper.includes('VAB')) return FacilityId.ROCKET_ENGINEERING;
    if (upper.includes('LAUNCH_COMPLEX') || upper.includes('PAD_ALPHA') || upper.includes('LAUNCH_PAD')) return FacilityId.LAUNCH_COMPLEX_PAD_ALPHA;
    return id;
  }

  /**
   * Manually record a facility visit (from UI or scene interactions).
   */
  public recordFacilityVisited(facilityId: string): void {
    const normalized = this.normalizeFacilityId(facilityId);
    if (this.visitedFacilities.has(normalized)) {
      return;
    }

    this.visitedFacilities.add(normalized);
    Logger.info('HEADQUARTERS_ADAPTER', `Campus facility visited: ${normalized}. Total unique: ${this.visitedFacilities.size}`);

    // Check progress against Chapter 1 campus orientation
    const orientationVisits = this.targetOrientationFacilities.filter((id) => this.visitedFacilities.has(id)).length;
    const target = this.targetOrientationFacilities.length;

    this.campaignManager.updateObjectiveProgress('OBJ_C1_CAMPUS_ORIENTATION', orientationVisits, target);

    if (orientationVisits >= target) {
      this.completeCampusOrientation();
    }
  }

  public completeCampusOrientation(): void {
    Logger.info('HEADQUARTERS_ADAPTER', 'Headquarters campus orientation conditions satisfied.');
    this.campaignManager.getProgressionEngine().evaluateCondition('CAMPUS_ORIENTATION_COMPLETED', {
      visitedFacilities: Array.from(this.visitedFacilities),
    });
    this.campaignManager.getProgressionEngine().evaluateCondition('FACILITIES_DISCOVERED', {
      count: this.visitedFacilities.size,
    });
  }

  public getVisitedFacilities(): string[] {
    return Array.from(this.visitedFacilities);
  }

  public reset(): void {
    this.visitedFacilities.clear();
  }
}
