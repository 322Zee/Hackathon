/**
 * INTERSTELLAR CONTINUUM - Mission Catalogue Validation Engine
 * Verifies data integrity, reference validity against DestinationRegistry,
 * acyclic prerequisite graphs, valid engineering envelopes, and category contracts.
 */

import { DestinationRegistry } from '../destinations/DestinationRegistry';
import {
  MissionDefinition,
  MissionCategory,
} from './MissionTypes';

export interface ValidationIssue {
  missionId: string;
  type: 'ERROR' | 'WARNING';
  field: string;
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalMissions: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export class MissionValidation {
  /**
   * Validates an entire collection of mission definitions against DestinationRegistry.
   */
  public static validateCatalogue(
    missions: MissionDefinition[],
    registry: DestinationRegistry
  ): ValidationReport {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const idMap = new Map<string, MissionDefinition>();

    // 1. Duplicate ID check & Map population
    for (const m of missions) {
      if (!m.id || m.id.trim().length === 0) {
        errors.push({
          missionId: 'UNKNOWN',
          type: 'ERROR',
          field: 'id',
          message: 'Mission definition possesses an empty or undefined unique ID.',
        });
        continue;
      }

      if (idMap.has(m.id)) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'id',
          message: `Duplicate mission ID detected: "${m.id}".`,
        });
      } else {
        idMap.set(m.id, m);
      }
    }

    // 2. Comprehensive per-mission checks
    for (const m of missions) {
      // 1.1 Basic metadata check
      if (!m.name || m.name.trim().length === 0) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'name',
          message: 'Mission name cannot be empty.',
        });
      }

      if (!m.description || m.description.trim().length === 0) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'description',
          message: 'Mission description cannot be empty.',
        });
      }

      // Destination reference check
      if (!m.destinationId) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'destinationId',
          message: 'Destination ID is missing.',
        });
      } else {
        const dest = registry.getDestination(m.destinationId);
        if (!dest) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'destinationId',
            message: `Destination reference "${m.destinationId}" does not exist in DestinationRegistry.`,
          });
        }
      }

      // Parent destination reference check
      if (m.parentDestinationId) {
        const parentDest = registry.getDestination(m.parentDestinationId);
        if (!parentDest) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'parentDestinationId',
            message: `Parent destination reference "${m.parentDestinationId}" does not exist in DestinationRegistry.`,
          });
        }
      }

      // Objectives verification
      if (!m.mainObjectives || m.mainObjectives.length === 0) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'mainObjectives',
          message: 'Mission must define at least one main objective.',
        });
      } else {
        m.mainObjectives.forEach((obj, idx) => {
          if (!obj.title || obj.title.trim().length === 0 || !obj.description || obj.description.trim().length === 0) {
            errors.push({
              missionId: m.id,
              type: 'ERROR',
              field: `mainObjectives[${idx}]`,
              message: `Objective ${idx + 1} must have a non-empty title and description.`,
            });
          }
        });
      }

      // Combined mission category contract check:
      // Must contain separate delivery AND exploration objectives
      if (m.category === MissionCategory.COMBINED) {
        const hasDelivery = m.mainObjectives?.some((o) => o.isDeliveryObjective);
        const hasExploration = m.mainObjectives?.some((o) => o.isExplorationObjective);

        if (!hasDelivery) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'category',
            message: `Combined mission "${m.id}" must contain at least one designated delivery objective (isDeliveryObjective: true).`,
          });
        }
        if (!hasExploration) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'category',
            message: `Combined mission "${m.id}" must contain at least one designated exploration objective (isExplorationObjective: true).`,
          });
        }
      }

      // Engineering constraints verification
      if (m.engineeringRequirements) {
        const eng = m.engineeringRequirements;
        if (eng.minPayloadMassKg < 0) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'engineeringRequirements.minPayloadMassKg',
            message: 'minPayloadMassKg cannot be negative.',
          });
        }
        if (eng.maxPayloadMassKg < eng.minPayloadMassKg) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'engineeringRequirements.maxPayloadMassKg',
            message: 'maxPayloadMassKg cannot be less than minPayloadMassKg.',
          });
        }
        if (eng.minPowerWatts < 0) {
          errors.push({
            missionId: m.id,
            type: 'ERROR',
            field: 'engineeringRequirements.minPowerWatts',
            message: 'minPowerWatts cannot be negative.',
          });
        }
      } else {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'engineeringRequirements',
          message: 'Mission engineering requirements block is missing.',
        });
      }

      // Budget verification
      if (!m.budget || m.budget.allocatedCredits <= 0) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'budget.allocatedCredits',
          message: 'Mission budget allocatedCredits must be greater than zero.',
        });
      } else if (m.budget.launchCostCapCredits > m.budget.allocatedCredits) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'budget.launchCostCapCredits',
          message: 'launchCostCapCredits cannot exceed allocatedCredits.',
        });
      }

      // Completion conditions verification
      if (!m.completionConditions || m.completionConditions.length === 0) {
        errors.push({
          missionId: m.id,
          type: 'ERROR',
          field: 'completionConditions',
          message: 'Mission must define at least one explicit completion condition.',
        });
      }

      // Failure conditions verification
      if (!m.failureConditions || m.failureConditions.length === 0) {
        warnings.push({
          missionId: m.id,
          type: 'WARNING',
          field: 'failureConditions',
          message: 'Mission should define failure conditions.',
        });
      }

      // Educational content verification
      if (!m.educationalContent || !m.educationalContent.coreConcept) {
        warnings.push({
          missionId: m.id,
          type: 'WARNING',
          field: 'educationalContent',
          message: 'Mission lacks educational briefing content.',
        });
      }

      // Prerequisite references verification
      if (m.prerequisites && m.prerequisites.requiredMissionIds) {
        for (const prereqId of m.prerequisites.requiredMissionIds) {
          if (!idMap.has(prereqId)) {
            errors.push({
              missionId: m.id,
              type: 'ERROR',
              field: 'prerequisites.requiredMissionIds',
              message: `Prerequisite mission ID "${prereqId}" does not exist in the catalogue.`,
            });
          }
        }
      }
    }

    // 3. Acyclic Prerequisite Dependency Graph Check
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const checkCycles = (currId: string, path: string[]): boolean => {
      visited.add(currId);
      recStack.add(currId);

      const m = idMap.get(currId);
      if (m && m.prerequisites && m.prerequisites.requiredMissionIds) {
        for (const prereqId of m.prerequisites.requiredMissionIds) {
          if (!visited.has(prereqId)) {
            if (checkCycles(prereqId, [...path, prereqId])) {
              return true;
            }
          } else if (recStack.has(prereqId)) {
            errors.push({
              missionId: currId,
              type: 'ERROR',
              field: 'prerequisites',
              message: `Circular mission prerequisite dependency detected: ${path.join(' -> ')} -> ${prereqId}`,
            });
            return true;
          }
        }
      }

      recStack.delete(currId);
      return false;
    };

    for (const id of idMap.keys()) {
      if (!visited.has(id)) {
        checkCycles(id, [id]);
      }
    }

    return {
      isValid: errors.length === 0,
      totalMissions: missions.length,
      errors,
      warnings,
    };
  }
}

/**
 * Top-level convenience functions
 */
export function validateMissionCatalogue(
  missions: MissionDefinition[],
  registry: DestinationRegistry = DestinationRegistry.getInstance()
): ValidationReport {
  return MissionValidation.validateCatalogue(missions, registry);
}

export function validateMissionDefinition(
  mission: MissionDefinition,
  registry: DestinationRegistry = DestinationRegistry.getInstance()
): ValidationReport {
  return MissionValidation.validateCatalogue([mission], registry);
}
