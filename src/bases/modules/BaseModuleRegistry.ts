/**
 * INTERSTELLAR CONTINUUM - Base Module Registry
 * Authoritative catalogue for planetary base module definitions.
 * Supports runtime registration and module querying.
 */

import { BaseModuleDefinition, BaseModuleType } from '../BaseTypes';
import { DEFAULT_BASE_MODULES } from './DefaultBaseModules';

export class BaseModuleRegistry {
  private static instance?: BaseModuleRegistry;
  private definitions: Map<string, BaseModuleDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  public static getInstance(): BaseModuleRegistry {
    if (!BaseModuleRegistry.instance) {
      BaseModuleRegistry.instance = new BaseModuleRegistry();
    }
    return BaseModuleRegistry.instance;
  }

  public static resetInstance(): void {
    BaseModuleRegistry.instance = undefined;
  }

  private registerDefaults(): void {
    for (const def of DEFAULT_BASE_MODULES) {
      this.definitions.set(def.id, { ...def });
    }
  }

  public registerModule(def: BaseModuleDefinition): void {
    if (!def.id || !def.name || !def.type) {
      throw new Error(`Invalid module definition: missing id, name, or type.`);
    }
    this.definitions.set(def.id, { ...def });
  }

  public getModule(id: string): BaseModuleDefinition | undefined {
    const found = this.definitions.get(id);
    return found ? { ...found } : undefined;
  }

  public hasModule(id: string): boolean {
    return this.definitions.has(id);
  }

  public listModules(): BaseModuleDefinition[] {
    return Array.from(this.definitions.values()).map((d) => ({ ...d }));
  }

  public getModulesByType(type: BaseModuleType | string): BaseModuleDefinition[] {
    return this.listModules().filter((m) => m.type === type);
  }

  /**
   * Calculates next upgrade attributes for a module level 1..5
   */
  public getUpgradeProfile(def: BaseModuleDefinition, currentLevel: number): {
    canUpgrade: boolean;
    nextLevel: number;
    creditsCost: number;
    materialsCost: number;
    improvedOutput: number;
    improvedPower: number;
  } {
    if (currentLevel >= 5) {
      return {
        canUpgrade: false,
        nextLevel: 5,
        creditsCost: 0,
        materialsCost: 0,
        improvedOutput: 0,
        improvedPower: 0,
      };
    }

    const nextLevel = currentLevel + 1;
    const multiplier = Math.pow(1.5, currentLevel);
    const creditsCost = Math.round(def.buildCostCredits * 0.6 * multiplier);
    const materialsCost = Math.round(def.buildCostMaterials * 0.5 * multiplier);

    let improvedOutput = 0;
    if (def.baseResearchOutput) {
      improvedOutput = Math.round(def.baseResearchOutput * 0.5);
    } else if (def.processingCapacity) {
      improvedOutput = Math.round(def.processingCapacity * 0.5);
    } else if (def.storageCapacityBoost) {
      improvedOutput = Math.round(def.storageCapacityBoost * 0.4);
    }

    // Power generation improves or power consumption slightly increases/optimizes
    let improvedPower = 0;
    if (def.powerOutputRating > 0) {
      improvedPower = Math.round(def.powerOutputRating * 0.4);
    }

    return {
      canUpgrade: true,
      nextLevel,
      creditsCost,
      materialsCost,
      improvedOutput,
      improvedPower,
    };
  }
}
