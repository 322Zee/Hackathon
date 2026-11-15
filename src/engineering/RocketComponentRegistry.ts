/**
 * INTERSTELLAR CONTINUUM - Central Rocket Component Registry
 * Authoritative registry singleton providing querying, filtering, search,
 * dynamic availability evaluation, and side-by-side comparative analysis.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { ServiceLocator } from '../core/ServiceLocator';
import { EconomyService } from '../services/EconomyService';
import { ResearchService } from '../services/ResearchService';
import {
  RocketComponentCategory,
  RocketComponentDefinition,
  ComponentAvailabilityState,
  ComponentCompatibilityTag,
  ComponentComparisonResult,
  AttributeDiff,
  AvailabilityEvaluationContext,
} from './RocketComponentTypes';
import { BUILTIN_ROCKET_COMPONENTS } from './RocketComponentDatabase';

export class RocketComponentRegistry {
  private static instance?: RocketComponentRegistry;
  private eventBus?: EventBus;

  private components: Map<string, RocketComponentDefinition> = new Map();

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.loadBuiltinComponents();
  }

  public getEventBus(): EventBus | undefined {
    return this.eventBus;
  }

  public static getInstance(eventBus?: EventBus): RocketComponentRegistry {
    if (!RocketComponentRegistry.instance) {
      RocketComponentRegistry.instance = new RocketComponentRegistry(eventBus);
    }
    return RocketComponentRegistry.instance;
  }

  public static resetInstance(): void {
    RocketComponentRegistry.instance = undefined;
  }

  private loadBuiltinComponents(): void {
    for (const comp of BUILTIN_ROCKET_COMPONENTS) {
      this.registerComponent(comp);
    }
    Logger.info(
      'ROCKET_COMPONENT_REGISTRY',
      `Loaded ${this.components.size} authoritative rocket components across all 8 categories.`
    );
  }

  // =========================================================================
  // REGISTRATION & VALIDATION
  // =========================================================================

  public registerComponent(def: RocketComponentDefinition): boolean {
    if (!def.id || def.id.trim() === '') {
      Logger.error('ROCKET_COMPONENT_REGISTRY', 'Cannot register component with empty ID.');
      return false;
    }

    if (def.costCredits < 0 || def.massUnits <= 0) {
      Logger.error(
        'ROCKET_COMPONENT_REGISTRY',
        `Component ${def.id} has invalid non-positive mass or negative cost.`
      );
      return false;
    }

    this.components.set(def.id, def);
    return true;
  }

  // =========================================================================
  // RETRIEVAL & QUERYING
  // =========================================================================

  public getComponent(id: string): RocketComponentDefinition | undefined {
    return this.components.get(id);
  }

  public getAllComponents(): RocketComponentDefinition[] {
    return Array.from(this.components.values());
  }

  public getComponentsByCategory(category: RocketComponentCategory): RocketComponentDefinition[] {
    return this.getAllComponents().filter(c => c.category === category);
  }

  public getComponentsByTag(tag: ComponentCompatibilityTag): RocketComponentDefinition[] {
    return this.getAllComponents().filter(c => c.compatibilityTags.includes(tag));
  }

  public getComponentsByTier(tier: number): RocketComponentDefinition[] {
    return this.getAllComponents().filter(c => c.tier === tier);
  }

  public searchComponents(
    query: string,
    categoryFilter?: RocketComponentCategory
  ): RocketComponentDefinition[] {
    const q = query.toLowerCase().trim();
    return this.getAllComponents().filter(c => {
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.componentType.toLowerCase().includes(q) ||
        c.compatibilityTags.some(t => t.toLowerCase().includes(q))
      );
    });
  }

  // =========================================================================
  // AVAILABILITY EVALUATION
  // =========================================================================

  public evaluateAvailability(
    componentId: string,
    context?: AvailabilityEvaluationContext
  ): {
    state: ComponentAvailabilityState;
    reason: string;
    isUnlocked: boolean;
    canAfford: boolean;
  } {
    const comp = this.components.get(componentId);
    if (!comp) {
      return {
        state: ComponentAvailabilityState.LOCKED,
        reason: 'Component definition not found.',
        isUnlocked: false,
        canAfford: false,
      };
    }

    // Resolve EconomyService
    let playerCredits = context?.playerCredits;
    if (playerCredits === undefined) {
      if (ServiceLocator.has('EconomyService')) {
        const econ = ServiceLocator.get<EconomyService>('EconomyService');
        playerCredits = econ.getCredits();
      } else {
        playerCredits = 999999; // Default fallback for headless test environments
      }
    }

    // Resolve ResearchService
    let unlockedTechs = context?.unlockedTechIds;
    if (!unlockedTechs && ServiceLocator.has('ResearchService')) {
      const research = ServiceLocator.get<ResearchService>('ResearchService');
      unlockedTechs = new Set(research.getUnlockedTechnologies());
    }

    const canAfford = playerCredits >= comp.costCredits;

    // 1. Check Research Requirements
    if (comp.unlockRequirements.requiresResearch) {
      const techId = comp.unlockRequirements.techNodeId;
      if (techId && (!unlockedTechs || !unlockedTechs.has(techId))) {
        return {
          state: ComponentAvailabilityState.RESEARCH_REQUIRED,
          reason: `Requires Research & Development node "${techId}".`,
          isUnlocked: false,
          canAfford,
        };
      }
    }

    // 2. Check Manufacturing Requirements
    if (comp.unlockRequirements.requiresManufacturing && !comp.manufacturingAvailable) {
      return {
        state: ComponentAvailabilityState.MANUFACTURING_REQUIRED,
        reason: 'Requires production queue authorization at Resource & Manufacturing Centre.',
        isUnlocked: false,
        canAfford,
      };
    }

    // 3. Check Prerequisite Mission Requirements
    if (comp.unlockRequirements.requiredMissionId) {
      if (
        context?.completedMissionIds &&
        !context.completedMissionIds.has(comp.unlockRequirements.requiredMissionId)
      ) {
        return {
          state: ComponentAvailabilityState.LOCKED,
          reason: `Requires completion of mission "${comp.unlockRequirements.requiredMissionId}".`,
          isUnlocked: false,
          canAfford,
        };
      }
    }

    // 4. Check Credit Affordability
    if (!canAfford) {
      return {
        state: ComponentAvailabilityState.INSUFFICIENT_CREDITS,
        reason: `Insufficient Mission Credits (Cost: ₵${comp.costCredits.toLocaleString()} | Available: ₵${playerCredits.toLocaleString()}).`,
        isUnlocked: true,
        canAfford: false,
      };
    }

    // Fully available
    return {
      state: ComponentAvailabilityState.AVAILABLE,
      reason: 'Component certified and available for vehicle integration.',
      isUnlocked: true,
      canAfford: true,
    };
  }

  // =========================================================================
  // SIDE-BY-SIDE COMPONENT COMPARISON
  // =========================================================================

  public compareComponents(
    compAId: string,
    compBId: string
  ): ComponentComparisonResult | undefined {
    const compA = this.components.get(compAId);
    const compB = this.components.get(compBId);

    if (!compA || !compB) return undefined;

    const isSameCategory = compA.category === compB.category;
    const attributeDiffs: AttributeDiff[] = [];

    // 1. Cost in Mission Credits
    const costDiff = compB.costCredits - compA.costCredits;
    attributeDiffs.push({
      label: 'Mission Credits Cost',
      valueA: `₵${compA.costCredits.toLocaleString()}`,
      valueB: `₵${compB.costCredits.toLocaleString()}`,
      diff: costDiff === 0 ? 'Equal' : `${costDiff > 0 ? '+' : ''}${costDiff.toLocaleString()}`,
      advantage: costDiff === 0 ? 'EQUAL' : costDiff > 0 ? 'A' : 'B', // Lower cost is advantageous
      explanation: costDiff > 0
        ? `${compA.name} is cheaper by ₵${Math.abs(costDiff).toLocaleString()} Mission Credits.`
        : costDiff < 0
        ? `${compB.name} is cheaper by ₵${Math.abs(costDiff).toLocaleString()} Mission Credits.`
        : 'Identical procurement expenditure.',
    });

    // 2. Mass Units
    const massDiff = compB.massUnits - compA.massUnits;
    attributeDiffs.push({
      label: 'Mass Units',
      valueA: `${compA.massUnits} MU`,
      valueB: `${compB.massUnits} MU`,
      diff: massDiff === 0 ? 'Equal' : `${massDiff > 0 ? '+' : ''}${massDiff} MU`,
      advantage: massDiff === 0 ? 'EQUAL' : massDiff > 0 ? 'A' : 'B', // Lower mass is advantageous
      explanation: massDiff > 0
        ? `${compA.name} is lighter by ${Math.abs(massDiff)} Mass Units, improving vehicle delta-V ratio.`
        : massDiff < 0
        ? `${compB.name} is lighter by ${Math.abs(massDiff)} Mass Units, improving vehicle delta-V ratio.`
        : 'Identical vehicle mass footprint.',
    });

    // 3. Reliability Rating
    const relDiff = compB.stats.reliabilityRating - compA.stats.reliabilityRating;
    attributeDiffs.push({
      label: 'Reliability Rating',
      valueA: `${compA.stats.reliabilityRating}%`,
      valueB: `${compB.stats.reliabilityRating}%`,
      diff: relDiff === 0 ? 'Equal' : `${relDiff > 0 ? '+' : ''}${relDiff}%`,
      advantage: relDiff === 0 ? 'EQUAL' : relDiff > 0 ? 'B' : 'A',
      explanation: relDiff !== 0
        ? `Higher reliability reduces mission anomaly risk during flight execution.`
        : 'Identical mission reliability rating.',
    });

    // 4. Performance Rating (if either has it)
    if (compA.stats.performanceRating !== undefined || compB.stats.performanceRating !== undefined) {
      const pA = compA.stats.performanceRating ?? 0;
      const pB = compB.stats.performanceRating ?? 0;
      const pDiff = pB - pA;
      attributeDiffs.push({
        label: 'Performance / Thrust Rating',
        valueA: pA > 0 ? `${pA} pts` : '—',
        valueB: pB > 0 ? `${pB} pts` : '—',
        diff: pDiff === 0 ? 'Equal' : `${pDiff > 0 ? '+' : ''}${pDiff} pts`,
        advantage: pDiff === 0 ? 'EQUAL' : pDiff > 0 ? 'B' : 'A',
        explanation: 'Higher performance rating provides greater ascent acceleration and payload lifting force.',
      });
    }

    // 5. Efficiency Rating (if either has it)
    if (compA.stats.efficiencyRating !== undefined || compB.stats.efficiencyRating !== undefined) {
      const eA = compA.stats.efficiencyRating ?? 0;
      const eB = compB.stats.efficiencyRating ?? 0;
      const eDiff = +(eB - eA).toFixed(2);
      attributeDiffs.push({
        label: 'Resource Efficiency Rating',
        valueA: eA > 0 ? `${eA.toFixed(1)}x` : '—',
        valueB: eB > 0 ? `${eB.toFixed(1)}x` : '—',
        diff: eDiff === 0 ? 'Equal' : `${eDiff > 0 ? '+' : ''}${eDiff}x`,
        advantage: eDiff === 0 ? 'EQUAL' : eDiff > 0 ? 'B' : 'A',
        explanation: 'Higher efficiency yields greater delta-V per fuel unit consumed.',
      });
    }

    // 6. Capacity Rating (if either has it)
    if (compA.stats.capacityRating !== undefined || compB.stats.capacityRating !== undefined) {
      const cA = compA.stats.capacityRating ?? 0;
      const cB = compB.stats.capacityRating ?? 0;
      const cDiff = cB - cA;
      attributeDiffs.push({
        label: 'Resource / Energy Capacity',
        valueA: cA > 0 ? `${cA.toLocaleString()} units` : '—',
        valueB: cB > 0 ? `${cB.toLocaleString()} units` : '—',
        diff: cDiff === 0 ? 'Equal' : `${cDiff > 0 ? '+' : ''}${cDiff.toLocaleString()} units`,
        advantage: cDiff === 0 ? 'EQUAL' : cDiff > 0 ? 'B' : 'A',
        explanation: 'Higher capacity provides longer continuous burn or electrical endurance.',
      });
    }

    // 7. Power Generation & Demand
    if (
      compA.stats.powerDemandWatts !== undefined ||
      compB.stats.powerDemandWatts !== undefined ||
      compA.stats.powerGenerationWatts !== undefined ||
      compB.stats.powerGenerationWatts !== undefined
    ) {
      const netA = (compA.stats.powerGenerationWatts ?? 0) - (compA.stats.powerDemandWatts ?? 0);
      const netB = (compB.stats.powerGenerationWatts ?? 0) - (compB.stats.powerDemandWatts ?? 0);
      const netDiff = netB - netA;
      attributeDiffs.push({
        label: 'Net Power Balance',
        valueA: `${netA >= 0 ? '+' : ''}${netA} W`,
        valueB: `${netB >= 0 ? '+' : ''}${netB} W`,
        diff: netDiff === 0 ? 'Equal' : `${netDiff > 0 ? '+' : ''}${netDiff} W`,
        advantage: netDiff === 0 ? 'EQUAL' : netDiff > 0 ? 'B' : 'A',
        explanation: 'Positive net power charges batteries; negative net power drains vehicle power reserves.',
      });
    }

    // Compatibility Tags Comparison
    const setA = new Set(compA.compatibilityTags);
    const setB = new Set(compB.compatibilityTags);

    const sharedCompatibilityTags = compA.compatibilityTags.filter(t => setB.has(t));
    const uniqueTagsA = compA.compatibilityTags.filter(t => !setB.has(t));
    const uniqueTagsB = compB.compatibilityTags.filter(t => !setA.has(t));

    // Synthesize Educational Trade-off Analysis
    const educationalSynthesis = `ENGINEERING TRADE-OFF ANALYSIS:
• ${compA.name} [Tier ${compA.tier}]: ${compA.educationalExplanation}
• ${compB.name} [Tier ${compB.tier}]: ${compB.educationalExplanation}

Neither component is universally superior. A lighter or cheaper component (e.g. ${compA.massUnits <= compB.massUnits ? compA.name : compB.name}) is optimal for budget-constrained or high-delta-V suborbital flights, whereas a heavier, higher-rated component (e.g. ${compA.costCredits >= compB.costCredits ? compA.name : compB.name}) is necessary for heavy planetary payloads and demanding deep-space trajectories.`;

    return {
      componentA: compA,
      componentB: compB,
      isSameCategory,
      attributeDiffs,
      sharedCompatibilityTags,
      uniqueTagsA,
      uniqueTagsB,
      costDifference: costDiff,
      massDifference: massDiff,
      educationalSynthesis,
    };
  }
}
