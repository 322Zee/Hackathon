/**
 * INTERSTELLAR CONTINUUM - Centralized Facility Registry
 * Data-driven registry managing facility records, availability states,
 * visit counters, rank progression validation, and event dispatch.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import {
  FacilityCategory,
  FacilityAvailabilityState,
  FacilityRecord,
} from './FacilityTypes';
import { INITIAL_FACILITY_RECORDS } from './FacilityData';

export class FacilityRegistry {
  private static instance?: FacilityRegistry;
  private facilities: Map<string, FacilityRecord> = new Map();
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.initializeDefaults();
  }

  public static getInstance(eventBus?: EventBus): FacilityRegistry {
    if (!FacilityRegistry.instance) {
      FacilityRegistry.instance = new FacilityRegistry(eventBus);
    } else if (eventBus && !FacilityRegistry.instance.eventBus) {
      FacilityRegistry.instance.setEventBus(eventBus);
    }
    return FacilityRegistry.instance;
  }

  public static resetInstance(): void {
    if (FacilityRegistry.instance) {
      FacilityRegistry.instance.reset();
      FacilityRegistry.instance = undefined;
    }
  }

  public setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  private initializeDefaults(): void {
    this.facilities.clear();
    for (const record of Object.values(INITIAL_FACILITY_RECORDS)) {
      // Deep copy to prevent mutation of static templates
      this.facilities.set(record.id, JSON.parse(JSON.stringify(record)));
    }
    Logger.info(
      'FACILITY_REGISTRY',
      `Facility Registry initialized with ${this.facilities.size} registered facilities.`
    );
  }

  public registerFacility(facility: FacilityRecord): void {
    this.facilities.set(facility.id, facility);
    Logger.info('FACILITY_REGISTRY', `Registered facility: ${facility.name} (${facility.id})`);
    if (this.eventBus) {
      this.eventBus.emit('facility:registered', { facilityId: facility.id, name: facility.name });
    }
  }

  public getFacility(id: string): FacilityRecord | undefined {
    return this.facilities.get(id);
  }

  public hasFacility(id: string): boolean {
    return this.facilities.has(id);
  }

  public getAllFacilities(): FacilityRecord[] {
    return Array.from(this.facilities.values());
  }

  public getFacilitiesByCategory(category: FacilityCategory): FacilityRecord[] {
    return Array.from(this.facilities.values()).filter((f) => f.category === category);
  }

  public isAvailable(id: string, currentRank: number = 0): {
    available: boolean;
    state: FacilityAvailabilityState;
    reason?: string;
  } {
    const facility = this.facilities.get(id);
    if (!facility) {
      return {
        available: false,
        state: FacilityAvailabilityState.LOCKED,
        reason: 'Facility does not exist.',
      };
    }

    if (
      facility.availability === FacilityAvailabilityState.LOCKED ||
      facility.availability === FacilityAvailabilityState.RESTRICTED
    ) {
      return {
        available: false,
        state: facility.availability,
        reason: facility.lockReason || 'Facility access is restricted by Agency Command.',
      };
    }

    if (facility.availability === FacilityAvailabilityState.UNDER_UPGRADE) {
      return {
        available: false,
        state: facility.availability,
        reason: 'Facility is undergoing structural upgrades. Access temporarily paused.',
      };
    }

    if (facility.requiredRank > currentRank) {
      return {
        available: false,
        state: FacilityAvailabilityState.RESTRICTED,
        reason: `Requires Organisation Rank ${facility.requiredRank} (${facility.requiredRankTitle}). Current Rank: ${currentRank}.`,
      };
    }

    return {
      available: true,
      state: facility.availability,
    };
  }

  public setAvailability(
    id: string,
    state: FacilityAvailabilityState,
    lockReason?: string
  ): boolean {
    const facility = this.facilities.get(id);
    if (!facility) {
      Logger.warn('FACILITY_REGISTRY', `Cannot set availability on unknown facility: ${id}`);
      return false;
    }

    const previousState = facility.availability;
    facility.availability = state;
    facility.lockReason = lockReason;

    Logger.info(
      'FACILITY_REGISTRY',
      `Facility "${facility.name}" state updated: ${previousState} -> ${state} (${lockReason || 'No reason provided'})`
    );

    if (this.eventBus) {
      this.eventBus.emit('facility:availability-changed', {
        facilityId: id,
        previousState,
        newState: state,
        reason: lockReason,
      });
    }

    return true;
  }

  public recordVisit(id: string): void {
    const facility = this.facilities.get(id);
    if (!facility) return;

    const now = Date.now();
    if (!facility.visitState.visited) {
      facility.visitState.visited = true;
      facility.visitState.firstVisitedTimestamp = now;
    }
    facility.visitState.visitCount += 1;
    facility.visitState.lastVisitedTimestamp = now;

    Logger.info(
      'FACILITY_REGISTRY',
      `Logged visit for "${facility.name}". Total visits: ${facility.visitState.visitCount}`
    );

    if (this.eventBus) {
      this.eventBus.emit('facility:visited', {
        facilityId: id,
        name: facility.name,
        visitCount: facility.visitState.visitCount,
        timestamp: now,
      });
    }
  }

  public upgradeFacility(id: string): boolean {
    const facility = this.facilities.get(id);
    if (!facility) return false;

    if (facility.upgradeState.currentTier >= facility.upgradeState.maxTier) {
      Logger.warn('FACILITY_REGISTRY', `Facility "${facility.name}" is already at maximum tier.`);
      return false;
    }

    facility.upgradeState.currentTier += 1;
    facility.upgradeState.upgradeStatus = 'COMPLETED';

    Logger.info(
      'FACILITY_REGISTRY',
      `Facility "${facility.name}" upgraded to Tier ${facility.upgradeState.currentTier}/${facility.upgradeState.maxTier}`
    );

    if (this.eventBus) {
      this.eventBus.emit('facility:upgraded', {
        facilityId: id,
        newTier: facility.upgradeState.currentTier,
        maxTier: facility.upgradeState.maxTier,
      });
    }

    return true;
  }

  public reset(): void {
    this.initializeDefaults();
  }
}
