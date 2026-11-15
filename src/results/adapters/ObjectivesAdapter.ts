/**
 * INTERSTELLAR CONTINUUM - Results Objectives Adapter
 * Translates runtime mission objectives and tracked objective states into
 * standardized inputs for the Results Scoring Engine.
 */

import { TrackedObjectiveState } from '../../missions/MissionLifecycleTypes';
import { MissionObjective } from '../../missions/MissionTypes';

export interface StandardObjectiveInput {
  id: string;
  title: string;
  description?: string;
  isMandatory?: boolean;
  isCompleted: boolean;
  currentProgress?: number;
  targetValue?: number | string;
  actualValue?: number | string;
}

export class ResultsObjectivesAdapter {
  /**
   * Adapts runtime TrackedObjectiveState array into evaluation inputs.
   */
  public adaptTrackedObjectives(tracked: TrackedObjectiveState[]): StandardObjectiveInput[] {
    return tracked.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      isMandatory: t.isMandatory,
      isCompleted: t.isCompleted,
      currentProgress: t.currentProgress,
      targetValue: t.targetValue,
      actualValue: t.currentProgress,
    }));
  }

  /**
   * Adapts static catalog MissionObjective array into evaluation inputs with completed flags.
   */
  public adaptCatalogObjectives(
    mainObjectives: MissionObjective[],
    optionalObjectives: MissionObjective[] = []
  ): StandardObjectiveInput[] {
    const results: StandardObjectiveInput[] = [];

    for (const obj of mainObjectives) {
      results.push({
        id: obj.id,
        title: obj.title,
        description: obj.description,
        isMandatory: true,
        isCompleted: obj.isCompleted,
        currentProgress: obj.isCompleted ? 100 : 0,
        targetValue: obj.targetValue,
        actualValue: obj.currentValue,
      });
    }

    for (const obj of optionalObjectives) {
      results.push({
        id: obj.id,
        title: obj.title,
        description: obj.description,
        isMandatory: false,
        isCompleted: obj.isCompleted,
        currentProgress: obj.isCompleted ? 100 : 0,
        targetValue: obj.targetValue,
        actualValue: obj.currentValue,
      });
    }

    return results;
  }
}
