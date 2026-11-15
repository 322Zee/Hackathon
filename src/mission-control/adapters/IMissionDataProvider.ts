/**
 * INTERSTELLAR CONTINUUM - Mission Data Provider Interface Contract
 * Decoupled integration boundary isolating Mission Control UI presentation
 * from future backend simulation engines (Mission Simulation Core, Comms Network,
 * Payload Systems, and Scientific Data Systems).
 */

import {
  MissionOverviewData,
  MissionTelemetrySnapshot,
  MissionControlEvent,
  MissionAlert,
} from '../types/MissionControlTypes';

export interface IMissionDataProvider {
  /**
   * Identifies whether this provider yields sample / simulation preview data
   * or live game state telemetry.
   */
  readonly isDemoProvider: boolean;

  /**
   * Retrieves list of active or available missions for Mission Control selection.
   */
  getActiveMissions(): MissionOverviewData[];

  /**
   * Retrieves full telemetry snapshot for a specific active mission instance.
   */
  getMissionSnapshot(instanceId: string): MissionTelemetrySnapshot | null;

  /**
   * Subscribes to real-time snapshot updates. Returns an unsubscribe teardown function.
   */
  subscribeToSnapshot(
    instanceId: string,
    listener: (snapshot: MissionTelemetrySnapshot) => void
  ): () => void;

  /**
   * Subscribes to new chronological mission events. Returns an unsubscribe teardown function.
   */
  subscribeToEvents(
    instanceId: string,
    listener: (event: MissionControlEvent) => void
  ): () => void;

  /**
   * Subscribes to mission alerts. Returns an unsubscribe teardown function.
   */
  subscribeToAlerts(
    instanceId: string,
    listener: (alert: MissionAlert) => void
  ): () => void;

  /**
   * Acknowledges or dismisses an alert for a mission instance.
   */
  dismissAlert(instanceId: string, alertId: string): void;

  /**
   * Frame tick update for real-time provider simulations or pollers.
   */
  update(deltaSeconds: number): void;

  /**
   * Cleans up all event listeners and active timers.
   */
  dispose(): void;
}
