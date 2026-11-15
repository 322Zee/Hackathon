/**
 * INTERSTELLAR CONTINUUM - Mission Simulation Adapter
 * Connects exploration objective progress to active mission lifecycle and objectives.
 */

import { MissionLifecycleManager } from '../../missions/MissionLifecycleManager';
import { MissionLifecycleState } from '../../missions/MissionLifecycleTypes';

export interface IMissionExplorationStatus {
  hasActiveMission: boolean;
  activeMissionId?: string;
  isSurfaceDeploymentAllowed: boolean;
}

export class MissionSimulationAdapter {
  public getExplorationMissionStatus(destinationId: string): IMissionExplorationStatus {
    try {
      const manager = MissionLifecycleManager.getInstance();
      const activeMissions = manager.getActiveInstances();

      for (const inst of activeMissions) {
        if (
          inst.destinationId === destinationId &&
          (inst.status === MissionLifecycleState.ACTIVE ||
            inst.status === MissionLifecycleState.ACCEPTED ||
            inst.status === MissionLifecycleState.PREPARING)
        ) {
          return {
            hasActiveMission: true,
            activeMissionId: inst.instanceId,
            isSurfaceDeploymentAllowed: true,
          };
        }
      }

      return {
        hasActiveMission: false,
        isSurfaceDeploymentAllowed: true, // Allow sandbox exploration
      };
    } catch {
      return {
        hasActiveMission: false,
        isSurfaceDeploymentAllowed: true,
      };
    }
  }

  public notifyObjectiveCompleted(missionId: string, objectiveId: string): void {
    try {
      const manager = MissionLifecycleManager.getInstance();
      manager.updateObjectiveProgress(missionId, objectiveId, 1);
    } catch {
      // Ignored if mission system is not running in test context
    }
  }
}
