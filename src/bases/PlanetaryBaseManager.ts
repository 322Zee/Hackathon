/**
 * INTERSTELLAR CONTINUUM - Planetary Base Construction and Management Manager
 * Central authoritative service for establishing, constructing, maintaining,
 * powering, expanding, and operating planetary research outposts across the Solar System.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { DestinationId } from '../destinations/DestinationTypes';
import {
  BaseRecord,
  BaseOperationalStatus,
  BaseModuleDefinition,
  InstalledModuleRecord,
  CreateBaseConfig,
  LocationSuitabilityEvaluation,
  BaseDeploymentPlanConfig,
  BaseDeploymentPlan,
  ConstructionTask,
  UpgradeResult,
  BaseOperationalSummary,
  ResourceTransferRequest,
  ResourceTransferResult,
  MaintenanceOptions,
  MaintenanceResult,
  ExpansionResult,
  PlanetaryBasesSaveState,
  BaseModuleType,
  ModuleOperationalState,
  BaseActivityLogEntry,
} from './BaseTypes';
import { BaseEventBus } from './BaseEventBus';
import { BaseModuleRegistry } from './modules/BaseModuleRegistry';
import { BaseLocationRegistry } from './locations/BaseLocationRegistry';
import { PowerGridEngine } from './engines/PowerGridEngine';
import { ConstructionEngine } from './engines/ConstructionEngine';
import { MaintenanceEngine } from './engines/MaintenanceEngine';
import { ResourceEconomyAdapter } from './adapters/ResourceEconomyAdapter';
import { PayloadDeliveryAdapter } from './adapters/PayloadDeliveryAdapter';
import { EnvironmentAdapter } from './adapters/EnvironmentAdapter';
import { CommunicationsAdapter } from './adapters/CommunicationsAdapter';
import { EconomyService } from '../services/EconomyService';
import { DestinationRegistry } from '../destinations/DestinationRegistry';
import { PayloadInventoryManager } from '../payload/PayloadInventoryManager';
import { PayloadRegistry } from '../payload/PayloadRegistry';
import { CommunicationsNetworkManager } from '../network/CommunicationsNetworkManager';

export class PlanetaryBaseManager {
  private static instance?: PlanetaryBaseManager;

  // Event bus and subsystems
  private eventBus: BaseEventBus;
  private moduleRegistry: BaseModuleRegistry;
  private locationRegistry: BaseLocationRegistry;
  private powerGridEngine: PowerGridEngine;
  private constructionEngine: ConstructionEngine;
  private maintenanceEngine: MaintenanceEngine;

  // Adapters
  private economyAdapter: ResourceEconomyAdapter;
  private payloadAdapter: PayloadDeliveryAdapter;
  private environmentAdapter: EnvironmentAdapter;
  private communicationsAdapter: CommunicationsAdapter;

  // Authoritative in-memory state
  private bases: Map<string, BaseRecord> = new Map();
  private deploymentPlans: Map<string, BaseDeploymentPlan> = new Map();

  private constructor(
    coreEventBus?: EventBus,
    economyService?: EconomyService,
    destinationRegistry?: DestinationRegistry,
    payloadInventory?: PayloadInventoryManager,
    payloadRegistry?: PayloadRegistry,
    networkManager?: CommunicationsNetworkManager
  ) {
    this.eventBus = new BaseEventBus(coreEventBus);
    this.moduleRegistry = BaseModuleRegistry.getInstance();
    this.locationRegistry = BaseLocationRegistry.getInstance();
    this.powerGridEngine = new PowerGridEngine(this.moduleRegistry);
    this.constructionEngine = new ConstructionEngine(this.moduleRegistry);
    this.maintenanceEngine = new MaintenanceEngine();

    this.economyAdapter = new ResourceEconomyAdapter(economyService);
    this.environmentAdapter = new EnvironmentAdapter(destinationRegistry, this.locationRegistry);
    this.payloadAdapter = new PayloadDeliveryAdapter(payloadInventory, payloadRegistry);
    this.communicationsAdapter = new CommunicationsAdapter(networkManager);
  }

  public static getInstance(
    coreEventBus?: EventBus,
    economyService?: EconomyService,
    destinationRegistry?: DestinationRegistry,
    payloadInventory?: PayloadInventoryManager,
    payloadRegistry?: PayloadRegistry,
    networkManager?: CommunicationsNetworkManager
  ): PlanetaryBaseManager {
    if (!PlanetaryBaseManager.instance) {
      PlanetaryBaseManager.instance = new PlanetaryBaseManager(
        coreEventBus,
        economyService,
        destinationRegistry,
        payloadInventory,
        payloadRegistry,
        networkManager
      );
    }
    return PlanetaryBaseManager.instance;
  }

  public static resetInstance(): void {
    if (PlanetaryBaseManager.instance) {
      PlanetaryBaseManager.instance.bases.clear();
      PlanetaryBaseManager.instance.deploymentPlans.clear();
      PlanetaryBaseManager.instance.eventBus.clear();
      PlanetaryBaseManager.instance = undefined;
    }
  }

  // =========================================================================
  // ADAPTER CONFIGURATION ACCESSORS
  // =========================================================================

  public getEventBus(): BaseEventBus {
    return this.eventBus;
  }

  public getEconomyAdapter(): ResourceEconomyAdapter {
    return this.economyAdapter;
  }

  public getEnvironmentAdapter(): EnvironmentAdapter {
    return this.environmentAdapter;
  }

  public getPayloadAdapter(): PayloadDeliveryAdapter {
    return this.payloadAdapter;
  }

  public getCommunicationsAdapter(): CommunicationsAdapter {
    return this.communicationsAdapter;
  }

  // =========================================================================
  // PUBLIC API CONTRACT IMPLEMENTATIONS
  // =========================================================================

  /**
   * Evaluates environmental suitability of a destination location.
   */
  public evaluateBaseLocation(
    destinationId: DestinationId,
    locationId: string
  ): LocationSuitabilityEvaluation {
    return this.environmentAdapter.evaluateLocation(destinationId, locationId);
  }

  /**
   * Prepares and validates a formal base deployment plan.
   */
  public createDeploymentPlan(planConfig: BaseDeploymentPlanConfig): BaseDeploymentPlan {
    if (!planConfig.baseName || planConfig.baseName.trim() === '') {
      throw new Error('[BASE_MANAGER] Base name is required for deployment plan.');
    }
    if (!planConfig.destinationId) {
      throw new Error('[BASE_MANAGER] Destination ID is required for deployment plan.');
    }
    if (!planConfig.locationId) {
      throw new Error('[BASE_MANAGER] Location ID is required for deployment plan.');
    }

    const evaluation = this.evaluateBaseLocation(planConfig.destinationId, planConfig.locationId);
    if (!evaluation.isEligible) {
      throw new Error(`[BASE_MANAGER] Ineligible destination for base: ${evaluation.environmentalSummary}`);
    }

    const planId = `plan_${planConfig.destinationId}_${Date.now()}`;
    const initialModules = planConfig.initialModuleTypeIds || ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'];

    let totalCredits = 50000;
    let totalMaterials = 100;
    let estDuration = 20;

    for (const modId of initialModules) {
      const def = this.moduleRegistry.getModule(modId);
      if (def) {
        totalCredits += def.buildCostCredits;
        totalMaterials += def.buildCostMaterials;
        estDuration += def.buildTimeTicks;
      }
    }

    const payloadValidation = this.payloadAdapter.validatePayloadList(planConfig.assignedPayloadIds || []);

    const plan: BaseDeploymentPlan = {
      planId,
      baseName: planConfig.baseName.trim(),
      destinationId: planConfig.destinationId,
      locationId: planConfig.locationId,
      initialModuleTypeIds: initialModules,
      assignedPayloadIds: planConfig.assignedPayloadIds || [],
      evaluation,
      totalCostCredits: totalCredits,
      totalMaterialsRequired: totalMaterials,
      estimatedDeploymentDurationTicks: estDuration,
      isApproved: false,
      isPayloadRequirementsMet: payloadValidation.allSatisfied,
      missingRequirements: payloadValidation.missingPayloads,
      createdAt: Date.now(),
    };

    this.deploymentPlans.set(planId, plan);

    this.eventBus.emit('BasePlanned', {
      plan: { ...plan },
      timestamp: Date.now(),
    });

    return plan;
  }

  /**
   * Submits and begins deployment of an approved deployment plan.
   */
  public submitDeploymentPlan(planId: string): BaseRecord {
    const plan = this.deploymentPlans.get(planId);
    if (!plan) {
      throw new Error(`[BASE_MANAGER] Deployment plan ${planId} not found.`);
    }

    // Verify economy costs
    if (!this.economyAdapter.canAfford({ credits: plan.totalCostCredits, materials: plan.totalMaterialsRequired })) {
      throw new Error(`[BASE_MANAGER] Insufficient organization funds/materials to fund base deployment.`);
    }

    this.economyAdapter.spend({
      credits: plan.totalCostCredits,
      materials: plan.totalMaterialsRequired,
    });

    plan.isApproved = true;

    // Deduct assigned payloads if applicable
    for (const payloadId of plan.assignedPayloadIds) {
      this.payloadAdapter.consumePayload(payloadId, 1);
    }

    const baseId = `base_${plan.destinationId.toLowerCase()}_${Date.now()}`;

    this.eventBus.emit('BaseDeploymentStarted', {
      baseId,
      baseName: plan.baseName,
      destinationId: plan.destinationId,
      locationId: plan.locationId,
      timestamp: Date.now(),
    });

    // Create the base record
    const base = this.createBase({
      id: baseId,
      name: plan.baseName,
      destinationId: plan.destinationId,
      locationId: plan.locationId,
      initialModules: plan.initialModuleTypeIds,
      initialInventory: {
        creditsBuffer: 25000,
        rawMaterials: 150,
        processedMaterials: 50,
        maintenanceSupplies: 10,
        researchSamples: 0,
        lifeSupportConsumables: 100,
        customCargo: {},
      },
    });

    return base;
  }

  /**
   * Registers a new custom base module definition into the system.
   */
  public registerBaseModule(moduleDef: BaseModuleDefinition): void {
    this.moduleRegistry.registerModule(moduleDef);
    Logger.info('BASE_MANAGER', `Registered custom base module: ${moduleDef.name} (${moduleDef.id})`);
  }

  /**
   * Directly creates and establishes a new planetary base record.
   */
  public createBase(config: CreateBaseConfig): BaseRecord {
    if (!config.name || config.name.trim() === '') {
      throw new Error('[BASE_MANAGER] Base name cannot be empty.');
    }
    if (!config.destinationId) {
      throw new Error('[BASE_MANAGER] Destination ID is required.');
    }
    if (!config.locationId) {
      throw new Error('[BASE_MANAGER] Location ID is required.');
    }

    const baseId = config.id || `base_${config.destinationId.toLowerCase()}_${Date.now()}`;
    if (this.bases.has(baseId)) {
      throw new Error(`[BASE_MANAGER] Base with ID ${baseId} already exists.`);
    }

    // Default 6 building slots in baseline tier
    const initialMaxSlots = 6;
    const initialModulesList = config.initialModules || ['mod_habitation_core_mk1', 'mod_power_solar_array_mk1'];

    const installedModules: InstalledModuleRecord[] = [];
    let slotCounter = 0;
    let initialStorageCapacity = 1000;

    for (const modId of initialModulesList) {
      const def = this.moduleRegistry.getModule(modId);
      if (def && slotCounter < initialMaxSlots) {
        const instanceId = `inst_${baseId}_${def.type}_${slotCounter}`;
        installedModules.push({
          id: instanceId,
          instanceId,
          moduleTypeId: def.id,
          name: def.name,
          type: def.type,
          level: 1,
          health: 100,
          operationalState: ModuleOperationalState.ACTIVE,
          powerDraw: def.powerRequirementRating,
          powerProvided: def.powerOutputRating,
          slotIndex: slotCounter,
          sectorId: 'SECTOR_ALPHA',
          installedTimestamp: Date.now(),
          outputMetrics: {
            researchOutput: def.baseResearchOutput,
            processingThroughput: def.processingCapacity,
            storageBoost: def.storageCapacityBoost,
            signalGain: def.commsGainDb,
            wearReduction: def.maintenanceWearReduction,
          },
        });

        if (def.storageCapacityBoost) {
          initialStorageCapacity += def.storageCapacityBoost;
        }

        slotCounter++;
      }
    }

    const evaluation = this.evaluateBaseLocation(config.destinationId, config.locationId);

    // Initial power evaluation
    const initialPower = this.powerGridEngine.evaluatePowerGrid(
      installedModules,
      {
        generation: 0,
        consumption: 0,
        netBalance: 0,
        batteryCapacity: 300,
        batteryStored: 300,
        gridEfficiency: 1.0,
        isPowered: true,
        activeDeficit: false,
      },
      evaluation.solarEfficiencyMultiplier
    );

    // Initial comms link
    let totalCommsGain = 0;
    for (const m of installedModules) {
      if (m.outputMetrics.signalGain) totalCommsGain += m.outputMetrics.signalGain;
    }
    const commsStatus = this.communicationsAdapter.evaluateBaseLink(
      config.destinationId,
      totalCommsGain,
      initialPower.newStatus.isPowered
    );

    const baseRecord: BaseRecord = {
      id: baseId,
      name: config.name.trim(),
      destinationId: config.destinationId,
      locationId: config.locationId,
      establishmentDate: Date.now(),
      baseLevel: config.baseLevel || 1,
      operationalStatus: BaseOperationalStatus.OPERATIONAL,
      maxSlots: initialMaxSlots,
      occupiedSlots: installedModules.length,
      availableSlots: initialMaxSlots - installedModules.length,
      inventory: {
        creditsBuffer: config.initialInventory?.creditsBuffer ?? 25000,
        rawMaterials: config.initialInventory?.rawMaterials ?? 150,
        processedMaterials: config.initialInventory?.processedMaterials ?? 50,
        maintenanceSupplies: config.initialInventory?.maintenanceSupplies ?? 10,
        researchSamples: config.initialInventory?.researchSamples ?? 0,
        lifeSupportConsumables: config.initialInventory?.lifeSupportConsumables ?? 100,
        customCargo: config.initialInventory?.customCargo ?? {},
      },
      storageCapacity: initialStorageCapacity,
      installedModules: initialPower.updatedModules,
      powerStatus: initialPower.newStatus,
      communicationsStatus: commsStatus,
      maintenanceStatus: {
        overallCondition: 100,
        wearRatePerCycle: Math.max(0.2, 0.8 * evaluation.wearFactorMultiplier),
        requiredSupplies: 0,
        maintenanceState: 'OPTIMAL' as any,
        lastMaintenanceTimestamp: Date.now(),
      },
      expansionSectors: [
        {
          sectorId: 'SECTOR_ALPHA',
          name: 'Core Habitation Sector',
          isUnlocked: true,
          slotCount: 6,
          unlockLevelRequired: 1,
          unlockCostCredits: 0,
          unlockCostMaterials: 0,
        },
        {
          sectorId: 'SECTOR_BETA',
          name: 'Industrial Expansion Sector',
          isUnlocked: false,
          slotCount: 4,
          unlockLevelRequired: 2,
          unlockCostCredits: 75000,
          unlockCostMaterials: 150,
        },
        {
          sectorId: 'SECTOR_GAMMA',
          name: 'Deep Research Perimeter',
          isUnlocked: false,
          slotCount: 4,
          unlockLevelRequired: 3,
          unlockCostCredits: 150000,
          unlockCostMaterials: 300,
        },
      ],
      activeConstructionTasks: [],
      activityHistory: [
        {
          id: `act_${Date.now()}_init`,
          timestamp: Date.now(),
          category: 'CONSTRUCTION',
          message: `Base "${config.name}" established at ${config.locationId}.`,
        },
      ],
    };

    this.bases.set(baseId, baseRecord);

    Logger.info('BASE_MANAGER', `Established base ${baseRecord.name} (${baseRecord.id}) at ${baseRecord.destinationId}`);

    this.eventBus.emit('BaseEstablished', {
      base: { ...baseRecord },
      timestamp: Date.now(),
    });

    return baseRecord;
  }

  /**
   * Returns a base by ID.
   */
  public getBase(baseId: string): BaseRecord | undefined {
    return this.bases.get(baseId);
  }

  /**
   * Lists all existing planetary bases.
   */
  public listBases(): BaseRecord[] {
    return Array.from(this.bases.values());
  }

  /**
   * Begins construction of a new module on the target base.
   */
  public startConstruction(
    baseId: string,
    moduleTypeId: string,
    slotIndex?: number
  ): ConstructionTask {
    const base = this.bases.get(baseId);
    if (!base) {
      throw new Error(`[BASE_MANAGER] Base ${baseId} not found.`);
    }

    const moduleDef = this.moduleRegistry.getModule(moduleTypeId);
    if (!moduleDef) {
      throw new Error(`[BASE_MANAGER] Module type ${moduleTypeId} not recognized.`);
    }

    // Check costs
    const cost = {
      credits: moduleDef.buildCostCredits,
      materials: moduleDef.buildCostMaterials,
    };

    // Can draw from base local inventory first, then organization wallet
    let canAfford = false;
    let fromBaseCredits = 0;
    let fromBaseMaterials = 0;

    if (base.inventory.creditsBuffer >= cost.credits && base.inventory.processedMaterials >= cost.materials) {
      canAfford = true;
      fromBaseCredits = cost.credits;
      fromBaseMaterials = cost.materials;
    } else {
      canAfford = this.economyAdapter.canAfford(cost);
    }

    if (!canAfford) {
      throw new Error(`[BASE_MANAGER] Cannot start construction: Insufficient credits or materials.`);
    }

    // Deduct cost
    if (fromBaseCredits > 0) {
      base.inventory.creditsBuffer -= fromBaseCredits;
      base.inventory.processedMaterials -= fromBaseMaterials;
    } else {
      this.economyAdapter.spend(cost);
    }

    // Consume payload requirement if set
    if (moduleDef.constructionPayloadRequirement) {
      this.payloadAdapter.consumePayload(moduleDef.constructionPayloadRequirement, 1);
    }

    const task = this.constructionEngine.initiateConstructionTask(base, moduleDef, slotIndex);
    base.activeConstructionTasks.push(task);

    this.logActivity(base, 'CONSTRUCTION', `Started construction of ${moduleDef.name} at slot ${task.slotIndex}.`);

    this.eventBus.emit('ModuleConstructionStarted', {
      baseId: base.id,
      task: { ...task },
      timestamp: Date.now(),
    });

    return task;
  }

  /**
   * Cancels an in-progress construction task and refunds materials.
   */
  public cancelConstruction(baseId: string, taskId: string): boolean {
    const base = this.bases.get(baseId);
    if (!base) return false;

    const result = this.constructionEngine.cancelConstructionTask(base, taskId);
    if (!result.success) return false;

    // Refund credits & materials to base inventory
    base.inventory.creditsBuffer += result.refundedCredits;
    base.inventory.processedMaterials += result.refundedMaterials;

    this.logActivity(
      base,
      'CONSTRUCTION',
      `Cancelled construction task ${taskId}. Refunded ₵${result.refundedCredits} and ${result.refundedMaterials} materials.`
    );

    this.eventBus.emit('BaseConstructionCancelled', {
      baseId,
      taskId,
      refundedCredits: result.refundedCredits,
      refundedMaterials: result.refundedMaterials,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Upgrades an existing installed module to the next tier level.
   */
  public upgradeBaseModule(baseId: string, moduleId: string): UpgradeResult {
    const base = this.bases.get(baseId);
    if (!base) {
      return {
        success: false,
        baseId,
        targetId: moduleId,
        targetType: 'MODULE',
        previousLevel: 0,
        newLevel: 0,
        creditsCost: 0,
        materialsCost: 0,
        message: `Base ${baseId} not found.`,
      };
    }

    const mod = base.installedModules.find((m) => m.id === moduleId || m.instanceId === moduleId);
    if (!mod) {
      return {
        success: false,
        baseId,
        targetId: moduleId,
        targetType: 'MODULE',
        previousLevel: 0,
        newLevel: 0,
        creditsCost: 0,
        materialsCost: 0,
        message: `Module ${moduleId} not found on base.`,
      };
    }

    const def = this.moduleRegistry.getModule(mod.moduleTypeId);
    if (!def) {
      return {
        success: false,
        baseId,
        targetId: moduleId,
        targetType: 'MODULE',
        previousLevel: mod.level,
        newLevel: mod.level,
        creditsCost: 0,
        materialsCost: 0,
        message: 'Module definition missing.',
      };
    }

    const profile = this.moduleRegistry.getUpgradeProfile(def, mod.level);
    if (!profile.canUpgrade) {
      return {
        success: false,
        baseId,
        targetId: moduleId,
        targetType: 'MODULE',
        previousLevel: mod.level,
        newLevel: mod.level,
        creditsCost: 0,
        materialsCost: 0,
        message: `Module is already at maximum level (${mod.level}).`,
      };
    }

    // Check affordability
    const cost = { credits: profile.creditsCost, materials: profile.materialsCost };
    if (!this.economyAdapter.canAfford(cost)) {
      return {
        success: false,
        baseId,
        targetId: moduleId,
        targetType: 'MODULE',
        previousLevel: mod.level,
        newLevel: mod.level,
        creditsCost: profile.creditsCost,
        materialsCost: profile.materialsCost,
        message: `Insufficient funds/materials for upgrade. Required: ₵${profile.creditsCost}, ${profile.materialsCost} materials.`,
      };
    }

    this.economyAdapter.spend(cost);

    const prevLevel = mod.level;
    mod.level = profile.nextLevel;

    // Apply stat boosts
    if (mod.powerProvided > 0) {
      mod.powerProvided += profile.improvedPower;
    }
    if (mod.outputMetrics.researchOutput) {
      mod.outputMetrics.researchOutput += profile.improvedOutput;
    }
    if (mod.outputMetrics.processingThroughput) {
      mod.outputMetrics.processingThroughput += profile.improvedOutput;
    }
    if (mod.outputMetrics.storageBoost) {
      mod.outputMetrics.storageBoost += profile.improvedOutput;
      base.storageCapacity += profile.improvedOutput;
    }

    // Re-evaluate power grid
    this.recalculateBaseStatus(base);

    this.logActivity(
      base,
      'UPGRADE',
      `Upgraded ${mod.name} to Level ${mod.level}.`
    );

    this.eventBus.emit('BaseModuleUpgraded', {
      baseId: base.id,
      module: { ...mod },
      previousLevel: prevLevel,
      newLevel: mod.level,
      timestamp: Date.now(),
    });

    return {
      success: true,
      baseId: base.id,
      targetId: moduleId,
      targetType: 'MODULE',
      previousLevel: prevLevel,
      newLevel: mod.level,
      creditsCost: profile.creditsCost,
      materialsCost: profile.materialsCost,
      message: `Successfully upgraded ${mod.name} to Level ${mod.level}.`,
    };
  }

  /**
   * Expands base slot capacity by unlocking expansion sectors.
   */
  public expandBase(baseId: string): ExpansionResult {
    const base = this.bases.get(baseId);
    if (!base) {
      return {
        success: false,
        baseId,
        previousMaxSlots: 0,
        newMaxSlots: 0,
        creditsCost: 0,
        materialsCost: 0,
        message: `Base ${baseId} not found.`,
      };
    }

    // Find next locked sector
    const lockedSector = base.expansionSectors.find((s) => !s.isUnlocked);
    if (!lockedSector) {
      return {
        success: false,
        baseId,
        previousMaxSlots: base.maxSlots,
        newMaxSlots: base.maxSlots,
        creditsCost: 0,
        materialsCost: 0,
        message: 'All base expansion sectors are already unlocked.',
      };
    }

    // Check base level requirement
    if (base.baseLevel < lockedSector.unlockLevelRequired) {
      return {
        success: false,
        baseId,
        previousMaxSlots: base.maxSlots,
        newMaxSlots: base.maxSlots,
        creditsCost: lockedSector.unlockCostCredits,
        materialsCost: lockedSector.unlockCostMaterials,
        message: `Expansion requires Base Level ${lockedSector.unlockLevelRequired} (current: ${base.baseLevel}).`,
      };
    }

    const cost = {
      credits: lockedSector.unlockCostCredits,
      materials: lockedSector.unlockCostMaterials,
    };

    if (!this.economyAdapter.canAfford(cost)) {
      return {
        success: false,
        baseId,
        previousMaxSlots: base.maxSlots,
        newMaxSlots: base.maxSlots,
        creditsCost: lockedSector.unlockCostCredits,
        materialsCost: lockedSector.unlockCostMaterials,
        message: `Cannot afford expansion: Requires ₵${cost.credits} and ${cost.materials} materials.`,
      };
    }

    this.economyAdapter.spend(cost);

    const prevSlots = base.maxSlots;
    lockedSector.isUnlocked = true;
    base.maxSlots += lockedSector.slotCount;
    base.availableSlots = base.maxSlots - base.occupiedSlots;
    base.baseLevel = Math.min(5, base.baseLevel + 1);

    this.logActivity(
      base,
      'CONSTRUCTION',
      `Expanded base perimeter: Unlocked ${lockedSector.name} (+${lockedSector.slotCount} slots). Base reached Level ${base.baseLevel}.`
    );

    this.eventBus.emit('BaseExpanded', {
      baseId: base.id,
      previousSlots: prevSlots,
      newSlots: base.maxSlots,
      sectorId: lockedSector.sectorId,
      timestamp: Date.now(),
    });

    return {
      success: true,
      baseId: base.id,
      previousMaxSlots: prevSlots,
      newMaxSlots: base.maxSlots,
      unlockedSectorId: lockedSector.sectorId,
      creditsCost: cost.credits,
      materialsCost: cost.materials,
      message: `Expanded base with ${lockedSector.name}. Building capacity is now ${base.maxSlots} slots.`,
    };
  }

  /**
   * Executes maintenance to restore base condition and repair damaged modules.
   */
  public performBaseMaintenance(
    baseId: string,
    options?: MaintenanceOptions
  ): MaintenanceResult {
    const base = this.bases.get(baseId);
    if (!base) {
      return {
        success: false,
        baseId,
        previousCondition: 0,
        restoredCondition: 0,
        suppliesConsumed: 0,
        creditsConsumed: 0,
        modulesRepairedCount: 0,
        message: `Base ${baseId} not found.`,
      };
    }

    const result = this.maintenanceEngine.performMaintenance(base, options);

    // If credits were required and deducted from agency wallet
    if (result.creditsConsumed > 0 && base.inventory.creditsBuffer < result.creditsConsumed) {
      this.economyAdapter.spend({ credits: result.creditsConsumed });
    }

    this.recalculateBaseStatus(base);

    this.logActivity(
      base,
      'MAINTENANCE',
      `Performed base overhaul. Condition restored to 100%. (Supplies: ${result.suppliesConsumed}, Credits: ₵${result.creditsConsumed}).`
    );

    this.eventBus.emit('BaseStatusChanged', {
      baseId: base.id,
      previousStatus: BaseOperationalStatus.MAINTENANCE_REQUIRED,
      newStatus: base.operationalStatus,
      reason: 'Maintenance overhaul performed.',
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Transfers resources between base local inventory and external logistics.
   */
  public transferBaseResources(
    baseId: string,
    request: ResourceTransferRequest
  ): ResourceTransferResult {
    const base = this.bases.get(baseId);
    if (!base) {
      return {
        success: false,
        transferredAmount: 0,
        newBaseBalance: 0,
        message: `Base ${baseId} not found.`,
      };
    }

    if (request.amount <= 0) {
      return {
        success: false,
        transferredAmount: 0,
        newBaseBalance: (base.inventory[request.resourceType] as number) || 0,
        message: 'Transfer amount must be positive.',
      };
    }

    if (request.direction === 'DEPOSIT_TO_BASE') {
      // Check current storage limit
      const currentLoad =
        base.inventory.rawMaterials +
        base.inventory.processedMaterials +
        base.inventory.maintenanceSupplies +
        base.inventory.lifeSupportConsumables;

      if (currentLoad + request.amount > base.storageCapacity) {
        return {
          success: false,
          transferredAmount: 0,
          newBaseBalance: (base.inventory[request.resourceType] as number) || 0,
          message: `Base storage full! Available space: ${base.storageCapacity - currentLoad} units.`,
        };
      }

      // Check external availability
      if (request.resourceType === 'rawMaterials') {
        if (!this.economyAdapter.canAfford({ materials: request.amount })) {
          return { success: false, transferredAmount: 0, newBaseBalance: base.inventory.rawMaterials, message: 'Insufficient global raw materials.' };
        }
        this.economyAdapter.spend({ materials: request.amount });
      }

      (base.inventory[request.resourceType] as number) += request.amount;

      this.logActivity(base, 'LOGISTICS', `Deposited ${request.amount} of ${request.resourceType} into base storage.`);

      return {
        success: true,
        transferredAmount: request.amount,
        newBaseBalance: base.inventory[request.resourceType] as number,
        message: `Deposited ${request.amount} ${request.resourceType}.`,
      };
    } else {
      // WITHDRAW_FROM_BASE
      const current = (base.inventory[request.resourceType] as number) || 0;
      if (current < request.amount) {
        return {
          success: false,
          transferredAmount: 0,
          newBaseBalance: current,
          message: `Insufficient ${request.resourceType} in base storage (available: ${current}).`,
        };
      }

      (base.inventory[request.resourceType] as number) -= request.amount;

      // Grant to global economy if materials
      if (request.resourceType === 'rawMaterials') {
        this.economyAdapter.grant({ materials: request.amount });
      } else if (request.resourceType === 'creditsBuffer') {
        this.economyAdapter.grant({ credits: request.amount });
      }

      this.logActivity(base, 'LOGISTICS', `Withdrew ${request.amount} of ${request.resourceType} from base storage.`);

      return {
        success: true,
        transferredAmount: request.amount,
        newBaseBalance: base.inventory[request.resourceType] as number,
        message: `Withdrew ${request.amount} ${request.resourceType}.`,
      };
    }
  }

  /**
   * Generates a comprehensive operational status summary for UI or metrics.
   */
  public getBaseStatus(baseId: string): BaseOperationalSummary {
    const base = this.bases.get(baseId);
    if (!base) {
      throw new Error(`[BASE_MANAGER] Base ${baseId} not found.`);
    }

    let activeCount = 0;
    let degradedCount = 0;
    let researchOutput = 0;
    let processingRate = 0;

    for (const mod of base.installedModules) {
      if (mod.operationalState === ModuleOperationalState.ACTIVE) {
        activeCount++;
        if (mod.outputMetrics.researchOutput) researchOutput += mod.outputMetrics.researchOutput;
        if (mod.outputMetrics.processingThroughput) processingRate += mod.outputMetrics.processingThroughput;
      } else if (mod.operationalState === ModuleOperationalState.DEGRADED) {
        degradedCount++;
        if (mod.outputMetrics.researchOutput) researchOutput += Math.round(mod.outputMetrics.researchOutput * 0.4);
      }
    }

    const storageUsed =
      base.inventory.rawMaterials +
      base.inventory.processedMaterials +
      base.inventory.maintenanceSupplies +
      base.inventory.lifeSupportConsumables;

    return {
      baseId: base.id,
      baseName: base.name,
      destinationId: base.destinationId,
      locationId: base.locationId,
      operationalStatus: base.operationalStatus,
      baseLevel: base.baseLevel,
      totalModules: base.installedModules.length,
      activeModules: activeCount,
      degradedModules: degradedCount,
      powerGeneration: base.powerStatus.generation,
      powerConsumption: base.powerStatus.consumption,
      powerNetBalance: base.powerStatus.netBalance,
      isPowered: base.powerStatus.isPowered,
      commsConnected: base.communicationsStatus.isConnected,
      commsBandwidthGbps: base.communicationsStatus.bandwidthGbps,
      signalQuality: base.communicationsStatus.signalQuality,
      overallCondition: base.maintenanceStatus.overallCondition,
      maintenanceState: base.maintenanceStatus.maintenanceState,
      occupiedSlots: base.occupiedSlots,
      maxSlots: base.maxSlots,
      storageUsed,
      storageMax: base.storageCapacity,
      activeResearchOutput: researchOutput,
      activeProcessingRate: processingRate,
      activeConstructionCount: base.activeConstructionTasks.length,
    };
  }

  // =========================================================================
  // SIMULATION UPDATE & TICK CYCLE
  // =========================================================================

  /**
   * Advances simulation time across all planetary bases:
   * 1. Progresses active construction tasks.
   * 2. Runs maintenance wear cycles.
   * 3. Generates research points and processed materials.
   * 4. Updates power grid balances and communications telemetry.
   */
  public update(deltaTicks: number = 1): void {
    if (deltaTicks <= 0) return;

    for (const base of this.bases.values()) {
      // 1. Advance construction tasks
      if (base.activeConstructionTasks.length > 0) {
        const { completedTasks } = this.constructionEngine.tickConstruction(base, deltaTicks);

        for (const { task, newModule } of completedTasks) {
          base.installedModules.push(newModule);
          base.occupiedSlots = base.installedModules.length;
          base.availableSlots = base.maxSlots - base.occupiedSlots;

          if (newModule.outputMetrics.storageBoost) {
            base.storageCapacity += newModule.outputMetrics.storageBoost;
          }

          // If communications relay, register with network adapter
          if (newModule.type === BaseModuleType.COMMUNICATIONS_RELAY && newModule.outputMetrics.signalGain) {
            this.communicationsAdapter.registerBaseRelayNode(
              base.id,
              base.name,
              base.destinationId,
              newModule.outputMetrics.signalGain
            );
          }

          this.logActivity(
            base,
            'CONSTRUCTION',
            `Completed construction of ${newModule.name} at slot ${newModule.slotIndex}.`
          );

          this.eventBus.emit('ModuleConstructionCompleted', {
            baseId: base.id,
            module: { ...newModule },
            slotIndex: newModule.slotIndex,
            timestamp: Date.now(),
          });
        }
      }

      // 2. Evaluate wear cycles
      const evalLoc = this.evaluateBaseLocation(base.destinationId, base.locationId);
      const wearResult = this.maintenanceEngine.evaluateWear(base, evalLoc.wearFactorMultiplier, deltaTicks * 0.05);

      if (wearResult.urgency === 'CRITICAL' || wearResult.urgency === 'ATTENTION_NEEDED') {
        this.eventBus.emit('BaseMaintenanceRequired', {
          baseId: base.id,
          condition: base.maintenanceStatus.overallCondition,
          urgency: wearResult.urgency,
          requiredSupplies: base.maintenanceStatus.requiredSupplies,
          timestamp: Date.now(),
        });
      }

      if (wearResult.statusChanged) {
        this.logActivity(
          base,
          'ALERT',
          `Operational status transitioned to ${wearResult.newStatus} due to structural wear.`
        );

        this.eventBus.emit('BaseStatusChanged', {
          baseId: base.id,
          previousStatus: wearResult.previousStatus,
          newStatus: wearResult.newStatus,
          reason: 'Structural wear threshold crossed.',
          timestamp: Date.now(),
        });
      }

      // 3. Operational outputs (Science generation & Material processing)
      if (base.operationalStatus === BaseOperationalStatus.OPERATIONAL) {
        let cycleScience = 0;
        let cycleProcessing = 0;

        for (const mod of base.installedModules) {
          if (mod.operationalState === ModuleOperationalState.ACTIVE) {
            if (mod.outputMetrics.researchOutput) cycleScience += mod.outputMetrics.researchOutput;
            if (mod.outputMetrics.processingThroughput) cycleProcessing += mod.outputMetrics.processingThroughput;
          }
        }

        if (cycleScience > 0) {
          const earned = Math.round(cycleScience * 0.1 * deltaTicks);
          if (earned > 0) {
            this.economyAdapter.grant({ research: earned });
          }
        }

        if (cycleProcessing > 0 && base.inventory.rawMaterials > 0) {
          const rawToProcess = Math.min(base.inventory.rawMaterials, Math.round(cycleProcessing * 0.2 * deltaTicks));
          if (rawToProcess > 0) {
            base.inventory.rawMaterials -= rawToProcess;
            base.inventory.processedMaterials += rawToProcess;
          }
        }
      }

      // 4. Power & Comms recalculation
      this.recalculateBaseStatus(base);
    }
  }

  private recalculateBaseStatus(base: BaseRecord): void {
    const evaluation = this.evaluateBaseLocation(base.destinationId, base.locationId);
    const wasDeficit = base.powerStatus.activeDeficit;

    const powerEval = this.powerGridEngine.evaluatePowerGrid(
      base.installedModules,
      base.powerStatus,
      evaluation.solarEfficiencyMultiplier
    );

    base.powerStatus = powerEval.newStatus;
    base.installedModules = powerEval.updatedModules;

    if (wasDeficit !== powerEval.newStatus.activeDeficit) {
      this.eventBus.emit('BasePowerStatusChanged', {
        baseId: base.id,
        powerStatus: { ...base.powerStatus },
        wasDeficit,
        isDeficit: powerEval.newStatus.activeDeficit,
        timestamp: Date.now(),
      });
    }

    let totalGain = 0;
    for (const m of base.installedModules) {
      if (m.operationalState === ModuleOperationalState.ACTIVE && m.outputMetrics.signalGain) {
        totalGain += m.outputMetrics.signalGain;
      }
    }

    base.communicationsStatus = this.communicationsAdapter.evaluateBaseLink(
      base.destinationId,
      totalGain,
      base.powerStatus.isPowered
    );
  }

  private logActivity(
    base: BaseRecord,
    category: 'CONSTRUCTION' | 'UPGRADE' | 'SCIENCE' | 'LOGISTICS' | 'MAINTENANCE' | 'ALERT',
    message: string
  ): void {
    const entry: BaseActivityLogEntry = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      category,
      message,
    };
    base.activityHistory.unshift(entry);
    if (base.activityHistory.length > 50) {
      base.activityHistory.pop();
    }
  }

  // =========================================================================
  // STATE SERIALIZATION & RESTORATION
  // =========================================================================

  public saveState(): PlanetaryBasesSaveState {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      bases: Array.from(this.bases.values()).map((b) => ({ ...b })),
      activePlans: Array.from(this.deploymentPlans.values()).map((p) => ({ ...p })),
    };
  }

  public loadState(saveData: PlanetaryBasesSaveState): void {
    if (!saveData || !Array.isArray(saveData.bases)) {
      throw new Error('[BASE_MANAGER] Invalid save state format for PlanetaryBases.');
    }

    this.bases.clear();
    for (const base of saveData.bases) {
      this.bases.set(base.id, { ...base });
    }

    this.deploymentPlans.clear();
    if (Array.isArray(saveData.activePlans)) {
      for (const plan of saveData.activePlans) {
        this.deploymentPlans.set(plan.planId, { ...plan });
      }
    }

    Logger.info('BASE_MANAGER', `Restored ${this.bases.size} bases from save state.`);
  }
}
