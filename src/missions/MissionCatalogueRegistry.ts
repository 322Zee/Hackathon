/**
 * INTERSTELLAR CONTINUUM - Authoritative Mission Catalogue Registry
 * Central registry service managing all authored spaceflight missions,
 * data integrity validation, prerequisite evaluations, and destination synchronization.
 */

import { EventBus } from '../core/EventBus';
import { Logger } from '../core/logging/Logger';
import { DestinationRegistry } from '../destinations/DestinationRegistry';
import { DestinationId } from '../destinations/DestinationTypes';
import { DestinationProgressionManager, ProgressionContext } from '../destinations/DestinationProgressionManager';
import {
  MissionDefinition,
  MissionCategory,
  MissionStageType,
  MissionDifficulty,
  MissionStatus,
  EvaluatedMissionStatus,
} from './MissionTypes';
import { INITIAL_MISSION_DEFINITIONS } from './MissionData';
import { MissionValidation, ValidationReport } from './MissionValidation';

export class MissionCatalogueRegistry {
  private static instance?: MissionCatalogueRegistry;
  private missions: Map<string, MissionDefinition> = new Map();
  private completedMissionIds: Set<string> = new Set();
  private activeMissionIds: Set<string> = new Set();
  private destinationRegistry: DestinationRegistry;
  private progressionManager: DestinationProgressionManager;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus, initialCompleted: string[] = []) {
    this.eventBus = eventBus;
    this.destinationRegistry = DestinationRegistry.getInstance();
    this.progressionManager = DestinationProgressionManager.getInstance();
    this.completedMissionIds = new Set(initialCompleted);
    this.initializeDefaults();
  }

  public static getInstance(eventBus?: EventBus): MissionCatalogueRegistry {
    if (!MissionCatalogueRegistry.instance) {
      MissionCatalogueRegistry.instance = new MissionCatalogueRegistry(eventBus);
    } else if (eventBus && !MissionCatalogueRegistry.instance.eventBus) {
      MissionCatalogueRegistry.instance.setEventBus(eventBus);
    }
    return MissionCatalogueRegistry.instance;
  }

  public static resetInstance(): void {
    if (MissionCatalogueRegistry.instance) {
      MissionCatalogueRegistry.instance.reset();
      MissionCatalogueRegistry.instance = undefined;
    }
  }

  public setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  public reset(): void {
    this.missions.clear();
    this.completedMissionIds.clear();
    this.activeMissionIds.clear();
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    this.missions.clear();
    for (const def of INITIAL_MISSION_DEFINITIONS) {
      // Deep clone to prevent reference mutations
      this.missions.set(def.id, JSON.parse(JSON.stringify(def)));
    }

    // Run authoritative validation
    const report: ValidationReport = MissionValidation.validateCatalogue(
      Array.from(this.missions.values()),
      this.destinationRegistry
    );

    if (!report.isValid) {
      const errorMsg = report.errors.map((e) => `[${e.missionId}] ${e.field}: ${e.message}`).join(' | ');
      Logger.error('MISSION_CATALOGUE', `Mission catalogue validation failed: ${errorMsg}`);
      throw new Error(`Mission catalogue validation failed: ${errorMsg}`);
    }

    Logger.info(
      'MISSION_CATALOGUE',
      `Mission Catalogue initialized and validated with ${this.missions.size} authored missions.`
    );

    this.syncDestinationMissionCounts();
  }

  /**
   * Dynamically register a new mission definition with validation.
   */
  public registerMission(definition: MissionDefinition): void {
    const tempCatalogue = [...Array.from(this.missions.values()), definition];
    const report = MissionValidation.validateCatalogue(tempCatalogue, this.destinationRegistry);

    if (!report.isValid) {
      const errorMsg = report.errors.map((e) => `[${e.missionId}] ${e.field}: ${e.message}`).join(' | ');
      throw new Error(`Cannot register invalid mission "${definition.id}": ${errorMsg}`);
    }

    this.missions.set(definition.id, JSON.parse(JSON.stringify(definition)));
    Logger.info('MISSION_CATALOGUE', `Registered mission: ${definition.name} (${definition.id})`);
    this.syncDestinationMissionCounts();
  }

  public getMissionById(id: string): MissionDefinition | undefined {
    return this.missions.get(id);
  }

  public getAllMissions(): MissionDefinition[] {
    return Array.from(this.missions.values());
  }

  public getMissionsByDestination(destinationId: DestinationId): MissionDefinition[] {
    return Array.from(this.missions.values()).filter((m) => m.destinationId === destinationId);
  }

  public getMissionsForDestination(destinationId: DestinationId): MissionDefinition[] {
    return this.getMissionsByDestination(destinationId);
  }

  public getMissionsByCategory(category: MissionCategory): MissionDefinition[] {
    return Array.from(this.missions.values()).filter((m) => m.category === category);
  }

  public getMissionsByStage(stage: MissionStageType): MissionDefinition[] {
    return Array.from(this.missions.values()).filter((m) => m.stageType === stage);
  }

  public getMissionsByDifficulty(difficulty: MissionDifficulty): MissionDefinition[] {
    return Array.from(this.missions.values()).filter((m) => m.difficulty === difficulty);
  }

  /**
   * Evaluates the operational status of a mission against agency progression.
   */
  public evaluateMissionStatus(
    missionId: string,
    customContext?: Partial<ProgressionContext>
  ): EvaluatedMissionStatus {
    const mission = this.missions.get(missionId);
    if (!mission) {
      return {
        missionId,
        status: MissionStatus.LOCKED,
        isUnlocked: false,
        isAvailable: false,
        isCompleted: false,
        isActive: false,
        unmetPrerequisites: [`Mission ID "${missionId}" not found in catalogue.`],
        destinationUnlocked: false,
        rankMet: false,
        prerequisiteMissionsMet: false,
        techMet: false,
      };
    }

    // 1. Check if already completed
    if (this.completedMissionIds.has(missionId)) {
      return {
        missionId,
        status: MissionStatus.COMPLETED,
        isUnlocked: true,
        isAvailable: false,
        isCompleted: true,
        isActive: false,
        unmetPrerequisites: [],
        destinationUnlocked: true,
        rankMet: true,
        prerequisiteMissionsMet: true,
        techMet: true,
      };
    }

    // 2. Check if currently active
    if (this.activeMissionIds.has(missionId)) {
      return {
        missionId,
        status: MissionStatus.ACTIVE,
        isUnlocked: true,
        isAvailable: false,
        isCompleted: false,
        isActive: true,
        unmetPrerequisites: [],
        destinationUnlocked: true,
        rankMet: true,
        prerequisiteMissionsMet: true,
        techMet: true,
      };
    }

    // 3. Resolve progression context
    const ctx = {
      ...this.progressionManager.getContext(),
      ...customContext,
    };

    const unmet: string[] = [];

    // Check Destination Unlock
    const destUnlocked = this.destinationRegistry.isUnlocked(mission.destinationId);
    if (mission.prerequisites.requiredDestinationUnlocked && !destUnlocked) {
      unmet.push(`Target destination "${mission.destinationId}" is locked.`);
    }

    // Check Director Rank
    const rankMet = ctx.rank >= mission.prerequisites.requiredDirectorRank;
    if (!rankMet) {
      unmet.push(`Requires Director Rank ${mission.prerequisites.requiredDirectorRank} (Current: Rank ${ctx.rank}).`);
    }

    // Check Prerequisite Missions
    let prereqMissionsMet = true;
    for (const reqMissionId of mission.prerequisites.requiredMissionIds) {
      const isPrereqDone = this.completedMissionIds.has(reqMissionId) || ctx.completedMissionIds.includes(reqMissionId);
      if (!isPrereqDone) {
        prereqMissionsMet = false;
        const prereqName = this.missions.get(reqMissionId)?.name ?? reqMissionId;
        unmet.push(`Requires prior mission completion: ${reqMissionId} ("${prereqName}").`);
      }
    }

    // Check Technologies
    let techMet = true;
    for (const reqTechId of mission.prerequisites.requiredTechNodeIds) {
      if (!ctx.unlockedTechIds.includes(reqTechId)) {
        techMet = false;
        unmet.push(`Requires researched technology: "${reqTechId}".`);
      }
    }

    const isAvailable = unmet.length === 0;
    const status = isAvailable ? MissionStatus.AVAILABLE : MissionStatus.LOCKED;

    return {
      missionId,
      status,
      isUnlocked: isAvailable,
      isAvailable,
      isCompleted: false,
      isActive: false,
      unmetPrerequisites: unmet,
      destinationUnlocked: destUnlocked,
      rankMet,
      prerequisiteMissionsMet: prereqMissionsMet,
      techMet,
    };
  }

  public getAvailableMissions(customContext?: Partial<ProgressionContext>): MissionDefinition[] {
    return Array.from(this.missions.values()).filter((m) => {
      const evalStatus = this.evaluateMissionStatus(m.id, customContext);
      return evalStatus.status === MissionStatus.AVAILABLE;
    });
  }

  public setMissionActive(missionId: string): void {
    if (this.missions.has(missionId)) {
      this.activeMissionIds.add(missionId);
      if (this.eventBus) {
        this.eventBus.emit('mission:started' as any, { missionId });
      }
      this.syncDestinationMissionCounts();
    }
  }

  public setMissionCompleted(missionId: string): void {
    if (this.missions.has(missionId)) {
      this.activeMissionIds.delete(missionId);
      this.completedMissionIds.add(missionId);
      if (this.eventBus) {
        this.eventBus.emit('mission:completed' as any, { missionId });
      }
      this.syncDestinationMissionCounts();
    }
  }

  public setMissionFailed(missionId: string, reason?: string): void {
    if (this.missions.has(missionId)) {
      this.activeMissionIds.delete(missionId);
      if (this.eventBus) {
        this.eventBus.emit('mission:failed' as any, { missionId, reason });
      }
      this.syncDestinationMissionCounts();
    }
  }

  public isMissionCompleted(missionId: string): boolean {
    return this.completedMissionIds.has(missionId);
  }

  public isMissionActive(missionId: string): boolean {
    return this.activeMissionIds.has(missionId);
  }

  public getActiveMissionIds(): string[] {
    return Array.from(this.activeMissionIds);
  }

  public getActiveMissions(): MissionDefinition[] {
    return Array.from(this.activeMissionIds)
      .map((id) => this.missions.get(id))
      .filter((m): m is MissionDefinition => m !== undefined);
  }

  /**
   * Authoritative mission acceptance with validation, duplicate prevention,
   * progression prerequisite verification, and domain event dispatching.
   */
  public acceptMission(
    missionId: string,
    customContext?: Partial<ProgressionContext>
  ): { success: boolean; reason?: string; mission?: MissionDefinition } {
    const mission = this.missions.get(missionId);
    if (!mission) {
      const reason = `Mission ID "${missionId}" does not exist in the catalogue.`;
      Logger.warn('MISSION_CATALOGUE', reason);
      if (this.eventBus) {
        this.eventBus.emit('mission:rejected' as any, { missionId, reason });
      }
      return { success: false, reason };
    }

    if (this.completedMissionIds.has(missionId)) {
      const reason = `Mission "${mission.name}" (${mission.id}) has already been completed.`;
      Logger.warn('MISSION_CATALOGUE', reason);
      if (this.eventBus) {
        this.eventBus.emit('mission:rejected' as any, { missionId, reason });
      }
      return { success: false, reason };
    }

    if (this.activeMissionIds.has(missionId)) {
      const reason = `Mission "${mission.name}" (${mission.id}) is already active in flight preparations.`;
      Logger.warn('MISSION_CATALOGUE', reason);
      if (this.eventBus) {
        this.eventBus.emit('mission:rejected' as any, { missionId, reason });
      }
      return { success: false, reason };
    }

    const evalStatus = this.evaluateMissionStatus(missionId, customContext);
    if (!evalStatus.isAvailable) {
      const reason = `Progression prerequisites unmet: ${evalStatus.unmetPrerequisites.join('; ')}`;
      Logger.warn('MISSION_CATALOGUE', `Rejected acceptance for "${mission.name}": ${reason}`);
      if (this.eventBus) {
        this.eventBus.emit('mission:rejected' as any, { missionId, reason });
      }
      return { success: false, reason };
    }

    // Mark active
    this.activeMissionIds.add(missionId);
    Logger.info('MISSION_CATALOGUE', `Mission accepted: "${mission.name}" (${mission.id})`);

    if (this.eventBus) {
      this.eventBus.emit('mission:accepted' as any, {
        missionId: mission.id,
        name: mission.name,
        category: mission.category,
        destinationId: mission.destinationId,
      });
      this.eventBus.emit('mission:started' as any, { missionId: mission.id });
    }

    this.syncDestinationMissionCounts();
    return { success: true, mission };
  }

  public recordMissionCompletion(missionId: string): boolean {
    if (this.missions.has(missionId)) {
      this.setMissionCompleted(missionId);
      return true;
    }
    return false;
  }

  public getCompletedMissionIds(): string[] {
    return Array.from(this.completedMissionIds);
  }

  public resetProgress(): void {
    this.completedMissionIds.clear();
    this.activeMissionIds.clear();
    this.syncDestinationMissionCounts();
  }

  public getCompletedMissionCount(): number {
    return this.completedMissionIds.size;
  }

  /**
   * Synchronizes available & completed mission counts with DestinationRegistry.
   */
  public syncDestinationMissionCounts(): void {
    const allDestinations = this.destinationRegistry.getAllDestinations();

    for (const dest of allDestinations) {
      const destMissions = this.getMissionsByDestination(dest.id);
      let available = 0;
      let completed = 0;

      for (const m of destMissions) {
        if (this.completedMissionIds.has(m.id)) {
          completed++;
        } else {
          const evalStatus = this.evaluateMissionStatus(m.id);
          if (evalStatus.status === MissionStatus.AVAILABLE) {
            available++;
          }
        }
      }

      this.destinationRegistry.recordMissionAvailability(dest.id, available, completed);
    }
  }
}
