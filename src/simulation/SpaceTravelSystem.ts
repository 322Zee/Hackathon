/**
 * INTERSTELLAR CONTINUUM - Abstract Space Travel Progression System
 * Educational and deterministic travel progression engine tracking transit durations,
 * origin/destination relationships, journey progress fractions, sub-phases, and arrival states.
 *
 * NOTE: Fictional game parameters are used. Real rocket propulsion calculations and orbital
 * maneuvers are deliberately excluded.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import { TravelProgress, TravelSubPhase } from './MissionSimulationTypes';

export interface SpaceTravelInitOptions {
  originId?: DestinationId | string;
  destinationId: DestinationId | string;
  estimatedDurationSeconds?: number;
  totalDistanceUnits?: number;
  departureTime?: number;
}

export class SpaceTravelSystem {
  private originId: DestinationId | string = DestinationId.EARTH;
  private destinationId: DestinationId | string = DestinationId.MOON;
  private departureTime: number = 0;
  private estimatedDurationSeconds: number = 1800; // Default 30 game-minutes
  private elapsedTransitSeconds: number = 0;
  private totalDistanceUnits: number = 1000;
  private progress: number = 0; // 0.0 to 1.0
  private travelSubPhase: TravelSubPhase = TravelSubPhase.DEPARTING;
  private isArrived: boolean = false;
  private isReturnTrip: boolean = false;
  private isStarted: boolean = false;

  constructor(options?: SpaceTravelInitOptions) {
    if (options) {
      this.configure(options);
    }
  }

  /**
   * Configure or reconfigure travel trajectory
   */
  public configure(options: SpaceTravelInitOptions): void {
    if (options.originId) {
      this.originId = options.originId;
    }
    this.destinationId = options.destinationId;

    if (
      typeof options.estimatedDurationSeconds === 'number' &&
      options.estimatedDurationSeconds > 0
    ) {
      this.estimatedDurationSeconds = options.estimatedDurationSeconds;
    } else {
      this.estimatedDurationSeconds = SpaceTravelSystem.getDefaultEstimatedDuration(
        this.destinationId
      );
    }

    if (typeof options.totalDistanceUnits === 'number' && options.totalDistanceUnits > 0) {
      this.totalDistanceUnits = options.totalDistanceUnits;
    } else {
      this.totalDistanceUnits = SpaceTravelSystem.getDefaultEstimatedDistance(
        this.destinationId
      );
    }

    if (typeof options.departureTime === 'number') {
      this.departureTime = options.departureTime;
    }

    this.reset();
  }

  /**
   * Begin journey from origin
   */
  public startTravel(currentDepartureGameTime: number = 0): void {
    this.departureTime = currentDepartureGameTime;
    this.elapsedTransitSeconds = 0;
    this.progress = 0;
    this.isArrived = false;
    this.isStarted = true;
    this.travelSubPhase = this.isReturnTrip
      ? TravelSubPhase.RETURNING
      : TravelSubPhase.DEPARTING;
  }

  /**
   * Advance journey progress by game delta time in seconds
   * @param deltaGameSeconds Game seconds passed in simulation
   * @returns boolean true if arrival occurred during this step
   */
  public advance(deltaGameSeconds: number): boolean {
    if (!this.isStarted || this.isArrived || deltaGameSeconds <= 0) {
      return false;
    }

    this.elapsedTransitSeconds += deltaGameSeconds;
    const rawProgress = this.elapsedTransitSeconds / this.estimatedDurationSeconds;
    this.progress = Math.min(1.0, Math.max(0.0, rawProgress));

    // Update travel sub-phases based on normalized progress
    if (this.isReturnTrip) {
      if (this.progress >= 1.0) {
        this.travelSubPhase = TravelSubPhase.RETURNED;
        this.isArrived = true;
        return true;
      } else {
        this.travelSubPhase = TravelSubPhase.RETURNING;
      }
    } else {
      if (this.progress >= 1.0) {
        this.travelSubPhase = TravelSubPhase.ARRIVED;
        this.isArrived = true;
        return true;
      } else if (this.progress >= 0.85) {
        this.travelSubPhase = TravelSubPhase.APPROACHING;
      } else if (this.progress >= 0.15) {
        this.travelSubPhase = TravelSubPhase.CRUISING;
      } else {
        this.travelSubPhase = TravelSubPhase.DEPARTING;
      }
    }

    return false;
  }

  /**
   * Initiate a return voyage back to the original launch origin
   */
  public initiateReturn(
    estimatedReturnDurationSeconds?: number,
    currentDepartureGameTime: number = 0
  ): void {
    const previousOrigin = this.originId;
    this.originId = this.destinationId;
    this.destinationId = previousOrigin;

    if (
      typeof estimatedReturnDurationSeconds === 'number' &&
      estimatedReturnDurationSeconds > 0
    ) {
      this.estimatedDurationSeconds = estimatedReturnDurationSeconds;
    }

    this.departureTime = currentDepartureGameTime;
    this.elapsedTransitSeconds = 0;
    this.progress = 0;
    this.isArrived = false;
    this.isStarted = true;
    this.isReturnTrip = true;
    this.travelSubPhase = TravelSubPhase.RETURNING;
  }

  /**
   * Get comprehensive travel progress telemetry
   */
  public getProgress(): TravelProgress {
    return {
      originId: this.originId,
      destinationId: this.destinationId,
      departureTime: this.departureTime,
      estimatedDurationSeconds: this.estimatedDurationSeconds,
      elapsedTransitSeconds: this.elapsedTransitSeconds,
      progress: this.progress,
      distanceTraveledUnits: this.progress * this.totalDistanceUnits,
      totalDistanceUnits: this.totalDistanceUnits,
      travelSubPhase: this.travelSubPhase,
      isArrived: this.isArrived,
      isReturnTrip: this.isReturnTrip,
    };
  }

  /**
   * Has arrival been achieved
   */
  public hasArrived(): boolean {
    return this.isArrived;
  }

  /**
   * Has travel started
   */
  public hasStarted(): boolean {
    return this.isStarted;
  }

  /**
   * Get normalized progress (0.0 to 1.0)
   */
  public getNormalizedProgress(): number {
    return this.progress;
  }

  /**
   * Get current sub-phase
   */
  public getSubPhase(): TravelSubPhase {
    return this.travelSubPhase;
  }

  /**
   * Reset travel progression state
   */
  public reset(): void {
    this.elapsedTransitSeconds = 0;
    this.progress = 0;
    this.isArrived = false;
    this.isStarted = false;
    this.isReturnTrip = false;
    this.travelSubPhase = TravelSubPhase.DEPARTING;
  }

  /**
   * Restore from serialized progress snapshot
   */
  public restore(snapshot: TravelProgress): void {
    this.originId = snapshot.originId;
    this.destinationId = snapshot.destinationId;
    this.departureTime = snapshot.departureTime;
    this.estimatedDurationSeconds = Math.max(1, snapshot.estimatedDurationSeconds);
    this.elapsedTransitSeconds = Math.max(0, snapshot.elapsedTransitSeconds);
    this.progress = Math.min(1.0, Math.max(0.0, snapshot.progress));
    this.totalDistanceUnits = Math.max(1, snapshot.totalDistanceUnits);
    this.travelSubPhase = snapshot.travelSubPhase;
    this.isArrived = snapshot.isArrived;
    this.isReturnTrip = Boolean(snapshot.isReturnTrip);
    this.isStarted = this.elapsedTransitSeconds > 0 || this.isArrived;
  }

  /**
   * Fictional educational duration estimates based on destination
   */
  public static getDefaultEstimatedDuration(destinationId: string): number {
    switch (destinationId) {
      case DestinationId.EARTH_ORBIT_LEO:
        return 120; // 2 minutes (LEO insertion)
      case DestinationId.EARTH_ORBIT_MEO:
        return 240; // 4 minutes
      case DestinationId.EARTH_ORBIT_GEO:
      case DestinationId.EARTH_ORBIT_HEO:
        return 480; // 8 minutes
      case DestinationId.MOON:
        return 1800; // 30 minutes
      case DestinationId.MARS:
      case DestinationId.PHOBOS:
      case DestinationId.DEIMOS:
        return 5400; // 90 minutes
      case DestinationId.VENUS:
      case DestinationId.MERCURY:
        return 4200; // 70 minutes
      case DestinationId.ASTEROID_BELT:
      case DestinationId.CERES:
      case DestinationId.VESTA:
        return 7200; // 2 hours
      case DestinationId.JUPITER:
      case DestinationId.IO:
      case DestinationId.EUROPA:
      case DestinationId.GANYMEDE:
      case DestinationId.CALLISTO:
        return 10800; // 3 hours
      case DestinationId.SATURN:
      case DestinationId.TITAN:
      case DestinationId.ENCELADUS:
        return 14400; // 4 hours
      case DestinationId.URANUS:
      case DestinationId.TITANIA:
      case DestinationId.NEPTUNE:
      case DestinationId.TRITON:
        return 21600; // 6 hours
      case DestinationId.SUN:
        return 8000;
      default:
        return 1800; // Default 30 minutes
    }
  }

  /**
   * Fictional educational abstract distance units based on destination
   */
  public static getDefaultEstimatedDistance(destinationId: string): number {
    switch (destinationId) {
      case DestinationId.EARTH_ORBIT_LEO:
        return 200;
      case DestinationId.EARTH_ORBIT_MEO:
        return 2000;
      case DestinationId.EARTH_ORBIT_GEO:
      case DestinationId.EARTH_ORBIT_HEO:
        return 36000;
      case DestinationId.MOON:
        return 384400;
      case DestinationId.MARS:
      case DestinationId.PHOBOS:
      case DestinationId.DEIMOS:
        return 225000000;
      case DestinationId.VENUS:
        return 108000000;
      case DestinationId.MERCURY:
        return 150000000;
      default:
        return 500000;
    }
  }
}
