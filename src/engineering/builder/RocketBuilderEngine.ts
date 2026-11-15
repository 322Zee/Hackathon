/**
 * INTERSTELLAR CONTINUUM - Authoritative Rocket Builder Engine
 * Core logic engine for configuration slots, multi-stage vehicle management,
 * component installation/removal, real-time stat calculation, and mission fit evaluation.
 */

import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/logging/Logger';
import {
  RocketComponentCategory,
  ComponentCompatibilityTag,
} from '../RocketComponentTypes';
import {
  RocketProject,
  RocketClassRating,
  RocketStageConfiguration,
} from '../RocketProjectTypes';
import { RocketComponentRegistry } from '../RocketComponentRegistry';
import { ComponentInventoryService } from '../ComponentInventoryService';
import { RocketProjectManager } from '../RocketProjectManager';
import { MissionDefinition } from '../../missions/MissionTypes';
import {
  ConfigurationSlotType,
  ModularConfigurationSlot,
  ModularStageGroup,
  ModularRocketConfiguration,
  RocketBuilderStats,
  MissionRequirementStatus,
} from './RocketBuilderTypes';

export class RocketBuilderEngine {
  private static instance?: RocketBuilderEngine;
  private eventBus?: EventBus;
  private registry: RocketComponentRegistry;
  private inventoryService: ComponentInventoryService;
  private projectManager: RocketProjectManager;

  private activeConfig: ModularRocketConfiguration;
  private initialConfigSnapshot?: string;
  private hasUnsaved: boolean = false;

  private constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
    this.registry = RocketComponentRegistry.getInstance(eventBus);
    this.inventoryService = ComponentInventoryService.getInstance(eventBus);
    this.projectManager = RocketProjectManager.getInstance(eventBus);

    this.activeConfig = this.createDefaultConfiguration('proj_pioneer_orb1', 'Pioneer Orbital Standard');
    this.initialConfigSnapshot = JSON.stringify(this.activeConfig);
  }

  public static getInstance(eventBus?: EventBus): RocketBuilderEngine {
    if (!RocketBuilderEngine.instance) {
      RocketBuilderEngine.instance = new RocketBuilderEngine(eventBus);
    }
    return RocketBuilderEngine.instance;
  }

  public static resetInstance(): void {
    RocketBuilderEngine.instance = undefined;
  }

  // =========================================================================
  // CONFIGURATION CREATION & TEMPLATING
  // =========================================================================

  public createDefaultConfiguration(
    projectId: string,
    name: string,
    classRating: RocketClassRating = RocketClassRating.LIGHT_ORBITAL
  ): ModularRocketConfiguration {
    // Stage 1: Booster Core
    const stage1Slots: ModularConfigurationSlot[] = [
      {
        slotId: 'stg1_structure',
        stageNumber: 1,
        slotType: ConfigurationSlotType.STRUCTURE,
        label: 'Booster Core Airframe',
        installedComponentId: 'struct_main_core_alpha',
        allowedCategories: [RocketComponentCategory.STRUCTURE_AND_STAGING],
        allowedTags: [ComponentCompatibilityTag.LOWER_BOOSTER, ComponentCompatibilityTag.BASIC_VEHICLE],
        required: true,
      },
      {
        slotId: 'stg1_propulsion',
        stageNumber: 1,
        slotType: ConfigurationSlotType.PROPULSION,
        label: 'Booster Main Propulsion',
        installedComponentId: 'prop_basic_booster_mk1',
        allowedCategories: [RocketComponentCategory.PROPULSION_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.LOWER_BOOSTER],
        required: true,
      },
      {
        slotId: 'stg1_fuel',
        stageNumber: 1,
        slotType: ConfigurationSlotType.FUEL,
        label: 'Booster Propellant Reservoir',
        installedComponentId: 'fuel_standard_cell_100',
        allowedCategories: [RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.LOWER_BOOSTER],
        required: true,
      },
      {
        slotId: 'stg1_interstage',
        stageNumber: 1,
        slotType: ConfigurationSlotType.STRUCTURE,
        label: 'Interstage Decoupler Ring',
        installedComponentId: 'struct_stage_connector_ring',
        allowedCategories: [RocketComponentCategory.STRUCTURE_AND_STAGING],
        allowedTags: [ComponentCompatibilityTag.INTERSTAGE],
        required: true,
      },
      {
        slotId: 'stg1_safety',
        stageNumber: 1,
        slotType: ConfigurationSlotType.RECOVERY_SAFETY,
        label: 'Range Safety & Telemetry',
        installedComponentId: 'safety_flight_termination_sys',
        allowedCategories: [RocketComponentCategory.RECOVERY_AND_SAFETY_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.LOWER_BOOSTER, ComponentCompatibilityTag.ATMOSPHERIC_FLIGHT],
        required: false,
      },
    ];

    // Stage 2: Upper Stage Inserter
    const stage2Slots: ModularConfigurationSlot[] = [
      {
        slotId: 'stg2_structure',
        stageNumber: 2,
        slotType: ConfigurationSlotType.STRUCTURE,
        label: 'Upper Stage Airframe',
        installedComponentId: 'struct_upper_truss_beta',
        allowedCategories: [RocketComponentCategory.STRUCTURE_AND_STAGING],
        allowedTags: [ComponentCompatibilityTag.UPPER_SECTION],
        required: true,
      },
      {
        slotId: 'stg2_propulsion',
        stageNumber: 2,
        slotType: ConfigurationSlotType.PROPULSION,
        label: 'Vacuum Inserter Engine',
        installedComponentId: 'prop_upper_vacuum_nozzle',
        allowedCategories: [RocketComponentCategory.PROPULSION_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.UPPER_SECTION],
        required: true,
      },
      {
        slotId: 'stg2_fuel',
        stageNumber: 2,
        slotType: ConfigurationSlotType.FUEL,
        label: 'Upper Stage Resource Cell',
        installedComponentId: 'fuel_standard_cell_100',
        allowedCategories: [RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.BASIC_VEHICLE, ComponentCompatibilityTag.UPPER_SECTION],
        required: true,
      },
      {
        slotId: 'stg2_guidance',
        stageNumber: 2,
        slotType: ConfigurationSlotType.GUIDANCE,
        label: 'Autonomous Flight Computer',
        installedComponentId: 'guid_basic_inertial_unit',
        allowedCategories: [RocketComponentCategory.GUIDANCE_AND_NAVIGATION],
        allowedTags: [ComponentCompatibilityTag.BASIC_VEHICLE, ComponentCompatibilityTag.ATMOSPHERIC_FLIGHT],
        required: true,
      },
      {
        slotId: 'stg2_power',
        stageNumber: 2,
        slotType: ConfigurationSlotType.POWER,
        label: 'Primary Battery Storage',
        installedComponentId: 'power_basic_battery_bank',
        allowedCategories: [RocketComponentCategory.ELECTRICAL_POWER],
        allowedTags: [ComponentCompatibilityTag.BASIC_VEHICLE],
        required: true,
      },
      {
        slotId: 'stg2_payload',
        stageNumber: 2,
        slotType: ConfigurationSlotType.PAYLOAD,
        label: 'Mission Payload Module',
        installedComponentId: 'payload_basic_satellite_bus',
        allowedCategories: [RocketComponentCategory.PAYLOAD_AND_FAIRING],
        allowedTags: [ComponentCompatibilityTag.PAYLOAD_COMPATIBLE],
        required: true,
      },
      {
        slotId: 'stg2_fairing',
        stageNumber: 2,
        slotType: ConfigurationSlotType.PAYLOAD,
        label: 'Aerodynamic Payload Shroud',
        installedComponentId: 'fairing_standard_biconic_2m',
        allowedCategories: [RocketComponentCategory.PAYLOAD_AND_FAIRING],
        allowedTags: [ComponentCompatibilityTag.UPPER_SECTION, ComponentCompatibilityTag.PAYLOAD_COMPATIBLE],
        required: true,
      },
      {
        slotId: 'stg2_comm',
        stageNumber: 2,
        slotType: ConfigurationSlotType.COMMUNICATION,
        label: 'Telemetry Tracking Antenna',
        installedComponentId: 'comm_basic_omni_beacon',
        allowedCategories: [RocketComponentCategory.COMMUNICATION_AND_TELEMETRY],
        allowedTags: [ComponentCompatibilityTag.BASIC_VEHICLE],
        required: true,
      },
    ];

    const stages: ModularStageGroup[] = [
      {
        stageNumber: 1,
        name: 'Stage 1: Booster Core',
        isUpperStage: false,
        slots: stage1Slots,
      },
      {
        stageNumber: 2,
        name: 'Stage 2: Vacuum Inserter',
        isUpperStage: true,
        slots: stage2Slots,
      },
    ];

    const now = Date.now();
    return {
      configurationId: `cfg_${projectId}_${now.toString(36)}`,
      projectId,
      name,
      version: 'v1.0.0',
      classRating,
      stages,
      createdAt: now,
      updatedAt: now,
    };
  }

  // =========================================================================
  // LOAD & SYNC WITH PROJECT
  // =========================================================================

  public loadProject(project: RocketProject): void {
    const existingConfig = (project as any).modularConfig as ModularRocketConfiguration | undefined;

    if (existingConfig) {
      this.activeConfig = JSON.parse(JSON.stringify(existingConfig));
    } else {
      this.activeConfig = this.createDefaultConfiguration(
        project.projectId,
        project.name,
        project.design.classRating
      );
    }

    this.initialConfigSnapshot = JSON.stringify(this.activeConfig);
    this.hasUnsaved = false;

    Logger.info(
      'ROCKET_BUILDER_ENGINE',
      `Loaded project "${project.name}" into visual rocket builder.`
    );

    if (this.eventBus) {
      this.eventBus.emit('builder:project_loaded' as any, { project, config: this.activeConfig });
    }
  }

  public getConfiguration(): ModularRocketConfiguration {
    return this.activeConfig;
  }

  public hasUnsavedChanges(): boolean {
    return this.hasUnsaved;
  }

  public discardChanges(): void {
    if (this.initialConfigSnapshot) {
      this.activeConfig = JSON.parse(this.initialConfigSnapshot);
      this.hasUnsaved = false;

      if (this.eventBus) {
        this.eventBus.emit('builder:changes_discarded' as any, { config: this.activeConfig });
      }
    }
  }

  // =========================================================================
  // COMPONENT INSTALLATION & REMOVAL
  // =========================================================================

  public findSlot(slotId: string): ModularConfigurationSlot | undefined {
    for (const stg of this.activeConfig.stages) {
      const slot = stg.slots.find(s => s.slotId === slotId);
      if (slot) return slot;
    }
    return undefined;
  }

  public canInstallComponent(
    slotId: string,
    componentId: string
  ): { allowed: boolean; reason?: string } {
    const slot = this.findSlot(slotId);
    if (!slot) {
      return { allowed: false, reason: `Configuration slot "${slotId}" does not exist.` };
    }

    const comp = this.registry.getComponent(componentId);
    if (!comp) {
      return { allowed: false, reason: `Component "${componentId}" not found in database.` };
    }

    // 1. Category check
    if (!slot.allowedCategories.includes(comp.category)) {
      return {
        allowed: false,
        reason: `Incompatible category. Slot accepts ${slot.allowedCategories.join(', ')}, but component is ${comp.category}.`,
      };
    }

    // 2. Compatibility tags check (if slot specifies required tags)
    if (slot.allowedTags.length > 0) {
      const hasMatchingTag = slot.allowedTags.some(t => comp.compatibilityTags.includes(t));
      if (!hasMatchingTag) {
        return {
          allowed: false,
          reason: `Staging tag mismatch. Slot requires one of [${slot.allowedTags.join(', ')}].`,
        };
      }
    }

    // 3. Availability & Tech check
    const avail = this.registry.evaluateAvailability(componentId);
    if (!avail.isUnlocked) {
      return { allowed: false, reason: avail.reason };
    }

    // 4. Inventory check: owned or currently installed in this slot
    const isCurrentInstalled = slot.installedComponentId === componentId;
    if (!isCurrentInstalled) {
      const availableQty = this.inventoryService.getAvailableQuantity(componentId);
      if (availableQty <= 0) {
        return {
          allowed: false,
          reason: `No unassigned inventory units of "${comp.name}". Procure additional units in the Component Catalogue.`,
        };
      }
    }

    return { allowed: true };
  }

  public installComponent(
    slotId: string,
    componentId: string
  ): { success: boolean; reason?: string } {
    const check = this.canInstallComponent(slotId, componentId);
    if (!check.allowed) {
      return { success: false, reason: check.reason };
    }

    const slot = this.findSlot(slotId)!;

    // If slot had previous component, uninstall it
    if (slot.installedComponentId && slot.installedComponentId !== componentId) {
      this.inventoryService.uninstallComponent(
        this.activeConfig.projectId,
        slot.installedComponentId
      );
    }

    // If new component, mark as installed in inventory
    if (slot.installedComponentId !== componentId) {
      this.inventoryService.installComponent(this.activeConfig.projectId, componentId);
    }

    slot.installedComponentId = componentId;
    this.activeConfig.updatedAt = Date.now();
    this.hasUnsaved = true;

    Logger.info(
      'ROCKET_BUILDER_ENGINE',
      `Installed component "${componentId}" into slot "${slotId}".`
    );

    if (this.eventBus) {
      this.eventBus.emit('builder:slot_installed' as any, {
        slotId,
        componentId,
        config: this.activeConfig,
      });
    }

    return { success: true };
  }

  public removeComponent(slotId: string): { success: boolean; reason?: string } {
    const slot = this.findSlot(slotId);
    if (!slot) {
      return { success: false, reason: `Slot "${slotId}" not found.` };
    }

    if (!slot.installedComponentId) {
      return { success: false, reason: 'Slot is already empty.' };
    }

    const prevId = slot.installedComponentId;
    this.inventoryService.uninstallComponent(this.activeConfig.projectId, prevId);
    slot.installedComponentId = undefined;

    this.activeConfig.updatedAt = Date.now();
    this.hasUnsaved = true;

    Logger.info('ROCKET_BUILDER_ENGINE', `Removed component "${prevId}" from slot "${slotId}".`);

    if (this.eventBus) {
      this.eventBus.emit('builder:slot_removed' as any, {
        slotId,
        removedComponentId: prevId,
        config: this.activeConfig,
      });
    }

    return { success: true };
  }

  // =========================================================================
  // MULTI-STAGE MANAGEMENT
  // =========================================================================

  public addStageGroup(): { success: boolean; stageNumber?: number; reason?: string } {
    if (this.activeConfig.stages.length >= 3) {
      return {
        success: false,
        reason: 'Maximum 3 vehicle stages supported in current aerospace classification tier.',
      };
    }

    const newStageNumber = this.activeConfig.stages.length + 1;
    const newStageSlots: ModularConfigurationSlot[] = [
      {
        slotId: `stg${newStageNumber}_structure`,
        stageNumber: newStageNumber,
        slotType: ConfigurationSlotType.STRUCTURE,
        label: `Stage ${newStageNumber} Airframe`,
        allowedCategories: [RocketComponentCategory.STRUCTURE_AND_STAGING],
        allowedTags: [ComponentCompatibilityTag.UPPER_SECTION],
        required: true,
      },
      {
        slotId: `stg${newStageNumber}_propulsion`,
        stageNumber: newStageNumber,
        slotType: ConfigurationSlotType.PROPULSION,
        label: `Stage ${newStageNumber} Propulsion Unit`,
        allowedCategories: [RocketComponentCategory.PROPULSION_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.UPPER_SECTION],
        required: true,
      },
      {
        slotId: `stg${newStageNumber}_fuel`,
        stageNumber: newStageNumber,
        slotType: ConfigurationSlotType.FUEL,
        label: `Stage ${newStageNumber} Fuel Cell`,
        allowedCategories: [RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS],
        allowedTags: [ComponentCompatibilityTag.BASIC_VEHICLE],
        required: true,
      },
      {
        slotId: `stg${newStageNumber}_connector`,
        stageNumber: newStageNumber,
        slotType: ConfigurationSlotType.STRUCTURE,
        label: `Stage ${newStageNumber} Separation Ring`,
        allowedCategories: [RocketComponentCategory.STRUCTURE_AND_STAGING],
        allowedTags: [ComponentCompatibilityTag.INTERSTAGE],
        required: true,
      },
    ];

    const newStage: ModularStageGroup = {
      stageNumber: newStageNumber,
      name: `Stage ${newStageNumber}: Trans-Orbital Auxiliary`,
      isUpperStage: true,
      slots: newStageSlots,
    };

    this.activeConfig.stages.push(newStage);
    this.activeConfig.updatedAt = Date.now();
    this.hasUnsaved = true;

    Logger.info(
      'ROCKET_BUILDER_ENGINE',
      `Added Stage Group ${newStageNumber} to active configuration.`
    );

    if (this.eventBus) {
      this.eventBus.emit('builder:stage_added' as any, {
        stageNumber: newStageNumber,
        config: this.activeConfig,
      });
    }

    return { success: true, stageNumber: newStageNumber };
  }

  public removeStageGroup(stageNumber: number): { success: boolean; reason?: string } {
    if (stageNumber === 1) {
      return { success: false, reason: 'Cannot remove primary Stage 1 booster core.' };
    }

    const stgIdx = this.activeConfig.stages.findIndex(s => s.stageNumber === stageNumber);
    if (stgIdx < 0) {
      return { success: false, reason: `Stage ${stageNumber} not found.` };
    }

    const stageToRemove = this.activeConfig.stages[stgIdx]!;

    // Uninstall all components in the removed stage to release inventory
    for (const slot of stageToRemove.slots) {
      if (slot.installedComponentId) {
        this.inventoryService.uninstallComponent(
          this.activeConfig.projectId,
          slot.installedComponentId
        );
      }
    }

    this.activeConfig.stages.splice(stgIdx, 1);

    // Renumber remaining stages
    this.activeConfig.stages.forEach((stg, idx) => {
      stg.stageNumber = idx + 1;
    });

    this.activeConfig.updatedAt = Date.now();
    this.hasUnsaved = true;

    Logger.info('ROCKET_BUILDER_ENGINE', `Removed Stage Group ${stageNumber}.`);

    if (this.eventBus) {
      this.eventBus.emit('builder:stage_removed' as any, {
        stageNumber,
        config: this.activeConfig,
      });
    }

    return { success: true };
  }

  // =========================================================================
  // REAL-TIME STATS CALCULATION
  // =========================================================================

  public calculateStats(): RocketBuilderStats {
    let totalMassUnits = 0;
    let totalCostCredits = 0;
    let rawPerformanceRating = 0;
    let reliabilitySum = 0;
    let reliabilityCount = 0;
    let powerGenerationWatts = 0;
    let powerDemandWatts = 0;
    let maxCommRating = 0;
    let maxNavRating = 0;
    let totalStructuralRating = 0;
    let totalProtectionRating = 0;
    let componentCount = 0;
    let requiredSlotCount = 0;
    let filledRequiredSlotCount = 0;

    const missingRequiredSlots: string[] = [];
    const warnings: string[] = [];

    for (const stg of this.activeConfig.stages) {
      for (const slot of stg.slots) {
        if (slot.required) {
          requiredSlotCount += 1;
        }

        if (slot.installedComponentId) {
          componentCount += 1;
          if (slot.required) {
            filledRequiredSlotCount += 1;
          }

          const comp = this.registry.getComponent(slot.installedComponentId);
          if (comp) {
            totalMassUnits += comp.massUnits;
            totalCostCredits += comp.costCredits;
            rawPerformanceRating += comp.stats.performanceRating ?? 0;
            totalStructuralRating += comp.stats.structuralRating ?? 0;
            totalProtectionRating += comp.stats.protectionRating ?? 0;

            reliabilitySum += comp.stats.reliabilityRating;
            reliabilityCount += 1;

            powerGenerationWatts += comp.stats.powerGenerationWatts ?? 0;
            powerDemandWatts += comp.stats.powerDemandWatts ?? 0;

            if (comp.stats.communicationRating) {
              maxCommRating = Math.max(maxCommRating, comp.stats.communicationRating);
            }
            if (comp.stats.navigationRating) {
              maxNavRating = Math.max(maxNavRating, comp.stats.navigationRating);
            }
          }
        } else if (slot.required) {
          missingRequiredSlots.push(`${stg.name}: ${slot.label}`);
        }
      }
    }

    const netPowerWatts = powerGenerationWatts - powerDemandWatts;
    const completenessPercent =
      requiredSlotCount > 0 ? Math.round((filledRequiredSlotCount / requiredSlotCount) * 100) : 0;
    const averageReliability =
      reliabilityCount > 0 ? Math.round(reliabilitySum / reliabilityCount) : 0;

    // Educational Game Balancing Stat: Payload Capacity Rating
    // Derived from thrust performance capacity less dead structural mass
    const payloadCapacityRating = Math.max(
      0,
      Math.round(rawPerformanceRating * 2.8 - totalMassUnits * 1.5)
    );

    // Warnings detection
    if (filledRequiredSlotCount < requiredSlotCount) {
      warnings.push(`Incomplete Configuration: ${requiredSlotCount - filledRequiredSlotCount} required slot(s) unfilled.`);
    }
    if (netPowerWatts < 0) {
      warnings.push(`Negative Power Balance: System demands ${powerDemandWatts}W but generates only ${powerGenerationWatts}W.`);
    }
    if (rawPerformanceRating <= 0) {
      warnings.push('Zero Liftoff Propulsion: Vehicle has no active booster propulsion units installed.');
    }

    const isFlightReady =
      filledRequiredSlotCount === requiredSlotCount &&
      rawPerformanceRating > 0 &&
      totalMassUnits > 0 &&
      warnings.length === 0;

    return {
      totalMassUnits,
      payloadCapacityRating,
      performanceRating: rawPerformanceRating,
      reliabilityRating: averageReliability,
      powerGenerationWatts,
      powerDemandWatts,
      netPowerWatts,
      communicationRating: maxCommRating,
      navigationRating: maxNavRating,
      structuralRating: totalStructuralRating,
      protectionRating: totalProtectionRating,
      componentCount,
      requiredSlotCount,
      filledRequiredSlotCount,
      completenessPercent,
      estimatedCostCredits: totalCostCredits,
      warnings,
      isFlightReady,
    };
  }

  // =========================================================================
  // MISSION REQUIREMENT EVALUATION
  // =========================================================================

  public evaluateMissionRequirements(mission: MissionDefinition): MissionRequirementStatus[] {
    const stats = this.calculateStats();
    const req = mission.engineeringRequirements;
    const statuses: MissionRequirementStatus[] = [];

    // 1. Destination Region
    statuses.push({
      id: 'req_destination',
      label: 'Target Destination Profile',
      requiredValue: mission.destinationId.toUpperCase(),
      currentValue: `${this.activeConfig.stages.length}-Stage Architecture`,
      satisfied: true,
      explanation: 'Vehicle staging configured for orbital ascent profile.',
    });

    // 2. Payload Category Compatibility
    const requiredPayloadType = req?.payloadType;
    let installedPayloadCompId: string | undefined;
    for (const stg of this.activeConfig.stages) {
      const pSlot = stg.slots.find(s => s.slotType === ConfigurationSlotType.PAYLOAD && s.installedComponentId);
      if (pSlot?.installedComponentId) {
        installedPayloadCompId = pSlot.installedComponentId;
        break;
      }
    }

    const payloadComp = installedPayloadCompId ? this.registry.getComponent(installedPayloadCompId) : undefined;
    const payloadSatisfied = !!payloadComp;
    statuses.push({
      id: 'req_payload_type',
      label: 'Payload Platform Integration',
      requiredValue: requiredPayloadType ?? 'Satellite / Science Module',
      currentValue: payloadComp ? payloadComp.name : 'No Payload Installed',
      satisfied: payloadSatisfied,
      explanation: payloadSatisfied
        ? `Installed payload "${payloadComp?.name}" provides compatible flight interfaces.`
        : 'Requires mounting a compatible satellite or probe in the payload slot.',
    });

    // 3. Payload Mass Capacity
    const minMass = req?.minPayloadMassKg ?? 100;
    const massSatisfied = stats.payloadCapacityRating >= minMass;
    statuses.push({
      id: 'req_payload_mass',
      label: 'Minimum Payload Lift Capacity',
      requiredValue: `${minMass.toLocaleString()} Rating`,
      currentValue: `${stats.payloadCapacityRating.toLocaleString()} Rating`,
      satisfied: massSatisfied,
      explanation: massSatisfied
        ? 'Propulsion configuration delivers positive capacity margin.'
        : `Capacity rating is ${minMass - stats.payloadCapacityRating} below mission requirement. Upgrade booster propulsion.`,
    });

    // 4. Mission Reliability Standard
    const requiredRel = 90;
    const relSatisfied = stats.reliabilityRating >= requiredRel;
    statuses.push({
      id: 'req_reliability',
      label: 'Certified Reliability Threshold',
      requiredValue: `${requiredRel}% Min`,
      currentValue: `${stats.reliabilityRating}%`,
      satisfied: relSatisfied,
      explanation: relSatisfied
        ? 'Composite component reliability exceeds mission threshold.'
        : 'Subsystem reliability below mission safety margin. Swap lower-tier modules for refined units.',
    });

    // 5. Electrical Power Balance
    const powerSatisfied = stats.netPowerWatts >= 0;
    statuses.push({
      id: 'req_power',
      label: 'Net Power Balance Margin',
      requiredValue: '>= 0 Watts Net',
      currentValue: `${stats.netPowerWatts >= 0 ? '+' : ''}${stats.netPowerWatts} W`,
      satisfied: powerSatisfied,
      explanation: powerSatisfied
        ? 'Generation units sustain onboard navigation and communication power draw.'
        : 'Deficit power balance will cause orbital bus brownout. Mount solar generation panels.',
    });

    return statuses;
  }

  // =========================================================================
  // SAVE, DUPLICATE & VERSIONING
  // =========================================================================

  public saveToProject(projectId: string, asNewVersion: boolean = false): boolean {
    const project = this.projectManager.getProject(projectId);
    if (!project) {
      Logger.error('ROCKET_BUILDER_ENGINE', `Project ${projectId} not found.`);
      return false;
    }

    const stats = this.calculateStats();

    // Increment version if requested
    if (asNewVersion) {
      const parts = this.activeConfig.version.replace('v', '').split('.').map(Number);
      const major = parts[0] ?? 1;
      const minor = (parts[1] ?? 0) + 1;
      this.activeConfig.version = `v${major}.${minor}.0`;
      project.designVersion = this.activeConfig.version;
    }

    this.activeConfig.name = project.name;
    this.activeConfig.updatedAt = Date.now();

    // Convert modular configuration into authoritative RocketDesign for physics/validation
    const stagesConfig: RocketStageConfiguration[] = this.activeConfig.stages.map(stg => {
      let thrustSL = 0;
      let thrustVac = 0;
      let engineName = 'Custom Propulsion';
      let engineCount = 1;
      let dryMass = 0;
      let propMass = 0;

      for (const slot of stg.slots) {
        if (slot.installedComponentId) {
          const comp = this.registry.getComponent(slot.installedComponentId);
          if (comp) {
            dryMass += comp.massUnits * 20; // Abstract conversion
            if (comp.category === RocketComponentCategory.PROPULSION_SYSTEMS) {
              engineName = comp.name;
              thrustSL += (comp.stats.performanceRating ?? 100) * 2;
              thrustVac += (comp.stats.performanceRating ?? 100) * 2.4;
            }
            if (comp.category === RocketComponentCategory.FUEL_AND_PROPELLANT_SYSTEMS) {
              propMass += (comp.stats.capacityRating ?? 500) * 3;
            }
          }
        }
      }

      return {
        stageNumber: stg.stageNumber,
        name: stg.name,
        engineName,
        engineCount,
        thrustSeaLevelKn: thrustSL,
        thrustVacuumKn: thrustVac,
        specificImpulseSec: 300,
        dryMassKg: Math.max(500, dryMass),
        propellantMassKg: Math.max(1000, propMass),
        burnDurationSec: 80,
        separationType: 'Pneumatic Interstage Ring',
      };
    });

    const totalWetMassKg = stagesConfig.reduce((acc, s) => acc + s.dryMassKg + s.propellantMassKg, 0);
    const totalDryMassKg = stagesConfig.reduce((acc, s) => acc + s.dryMassKg, 0);
    const slThrust = stagesConfig[0]?.thrustSeaLevelKn ?? 300;
    const initialTwr = totalWetMassKg > 0 ? (slThrust * 1000) / (totalWetMassKg * 9.81) : 1.2;

    project.design = {
      designId: `des_${this.activeConfig.configurationId}`,
      name: `${project.name} Modular Assembly`,
      classRating: this.activeConfig.classRating,
      stages: stagesConfig,
      totalWetMassKg,
      totalDryMassKg,
      seaLevelThrustKn: slThrust,
      vacuumThrustKn: stagesConfig.reduce((acc, s) => acc + s.thrustVacuumKn, 0),
      initialTwr: Math.max(1.15, +initialTwr.toFixed(2)),
      totalVacuumDeltaV: Math.max(3500, stats.performanceRating * 25),
      maxPayloadCapacityLeoKg: stats.payloadCapacityRating * 10,
      fairingDiameterM: 2.5,
      buildCostCredits: stats.estimatedCostCredits,
    };

    // Store modular config reference on project
    (project as any).modularConfig = JSON.parse(JSON.stringify(this.activeConfig));
    project.updatedTimestamp = Date.now();

    this.initialConfigSnapshot = JSON.stringify(this.activeConfig);
    this.hasUnsaved = false;

    Logger.info(
      'ROCKET_BUILDER_ENGINE',
      `Saved modular rocket configuration to project "${project.name}" (${project.designVersion}).`
    );

    if (this.eventBus) {
      this.eventBus.emit('builder:saved' as any, { project, config: this.activeConfig });
    }

    return true;
  }

  /**
   * Increment configuration design version (e.g. v1.0.0 -> v1.1.0)
   */
  public bumpVersion(): string {
    const parts = this.activeConfig.version.replace('v', '').split('.').map(Number);
    const major = parts[0] ?? 1;
    const minor = (parts[1] ?? 0) + 1;
    this.activeConfig.version = `v${major}.${minor}.0`;
    this.activeConfig.updatedAt = Date.now();

    const project = this.projectManager.getProject(this.activeConfig.projectId);
    if (project) {
      project.designVersion = this.activeConfig.version;
      (project as any).modularConfig = JSON.parse(JSON.stringify(this.activeConfig));
    }

    if (this.eventBus) {
      this.eventBus.emit('builder:version_bumped' as any, {
        version: this.activeConfig.version,
        projectId: this.activeConfig.projectId,
      });
    }

    return this.activeConfig.version;
  }

  public duplicateConfiguration(): ModularRocketConfiguration {
    const clone: ModularRocketConfiguration = JSON.parse(JSON.stringify(this.activeConfig));
    clone.configurationId = `cfg_dup_${Date.now().toString(36)}`;
    clone.name = `${this.activeConfig.name} (Copy)`;
    clone.version = 'v1.0.0';
    clone.createdAt = Date.now();
    clone.updatedAt = Date.now();

    this.activeConfig = clone;
    this.hasUnsaved = true;

    if (this.eventBus) {
      this.eventBus.emit('builder:duplicated' as any, { config: this.activeConfig });
    }

    return clone;
  }
}
