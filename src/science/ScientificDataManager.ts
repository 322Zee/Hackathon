/**
 * INTERSTELLAR CONTINUUM - Scientific Data Collection & Research Manager
 * Central authoritative manager handling registration, integrity, analysis,
 * research project lifecycle, and persistence of scientific discoveries.
 */

import { DestinationId } from '../destinations/DestinationTypes';
import {
  ScientificFinding,
  FindingRegistrationRequest,
  CollectionConditions,
  ResearchProject,
  ResearchProjectCreationRequest,
  ResearchProjectStatus,
  ResearchOverview,
  ScientificDataSaveState,
  ScientificCategory,
  DataQualityRating,
  AnalysisStatus,
  CollectionSource,
  DATA_QUALITY_MULTIPLIERS,
  SCIENTIFIC_DATA_SCHEMA_VERSION,
} from './ScientificTypes';
import { ScientificEventBus } from './ScientificEventBus';
import { EconomyAdapter } from './adapters/EconomyAdapter';
import { ResearchServiceAdapter } from './adapters/ResearchServiceAdapter';
import { DEFAULT_SCIENTIFIC_DISCOVERIES } from './data/DefaultScientificDiscoveries';
import { DEFAULT_RESEARCH_PROJECTS } from './data/DefaultResearchProjects';

export class ScientificDataManager {
  private static instance: ScientificDataManager | null = null;

  private findings: Map<string, ScientificFinding> = new Map();
  private collectionConditions: Map<string, CollectionConditions> = new Map();
  private researchProjects: Map<string, ResearchProject> = new Map();

  private eventBus: ScientificEventBus;
  private economyAdapter: EconomyAdapter;
  private researchAdapter: ResearchServiceAdapter;

  private constructor(
    eventBus?: ScientificEventBus,
    economyAdapter?: EconomyAdapter,
    researchAdapter?: ResearchServiceAdapter
  ) {
    this.eventBus = eventBus || new ScientificEventBus();
    this.economyAdapter = economyAdapter || new EconomyAdapter();
    this.researchAdapter = researchAdapter || new ResearchServiceAdapter();

    this.initializeDefaultData();
  }

  public static getInstance(
    eventBus?: ScientificEventBus,
    economyAdapter?: EconomyAdapter,
    researchAdapter?: ResearchServiceAdapter
  ): ScientificDataManager {
    if (!ScientificDataManager.instance) {
      ScientificDataManager.instance = new ScientificDataManager(eventBus, economyAdapter, researchAdapter);
    }
    return ScientificDataManager.instance;
  }

  /**
   * Reset instance (primarily for testing isolation).
   */
  public static resetInstance(): void {
    if (ScientificDataManager.instance) {
      ScientificDataManager.instance.eventBus.clear();
      ScientificDataManager.instance = null;
    }
  }

  public getEventBus(): ScientificEventBus {
    return this.eventBus;
  }

  public getEconomyAdapter(): EconomyAdapter {
    return this.economyAdapter;
  }

  public getResearchAdapter(): ResearchServiceAdapter {
    return this.researchAdapter;
  }

  // ─── Initial Data Setup ────────────────────────────────────────────────────────

  private initializeDefaultData(): void {
    for (const finding of DEFAULT_SCIENTIFIC_DISCOVERIES) {
      this.findings.set(finding.id, { ...finding });
    }

    for (const project of DEFAULT_RESEARCH_PROJECTS) {
      this.researchProjects.set(project.id, {
        ...project,
        requiredFindingIds: [...project.requiredFindingIds],
        unlockableTechIds: [...project.unlockableTechIds],
        rewards: { ...project.rewards },
      });
    }
  }

  // ─── 1. Finding Registration & Collection ────────────────────────────────────

  /**
   * Register a new scientific finding produced by an exploration mission or instrument.
   * Enforces duplicate protection and data integrity.
   */
  public registerScientificFinding(request: FindingRegistrationRequest): ScientificFinding {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Scientific finding registration failed: name is required');
    }
    if (!request.destinationId) {
      throw new Error('Scientific finding registration failed: destinationId is required');
    }
    if (!request.category) {
      throw new Error('Scientific finding registration failed: category is required');
    }
    if (!request.missionId) {
      throw new Error('Scientific finding registration failed: missionId is required');
    }

    // Duplicate detection: check if a finding with identical name and destination already exists
    const normalizedName = request.name.trim().toLowerCase();
    for (const existing of this.findings.values()) {
      if (
        existing.destinationId === request.destinationId &&
        existing.name.trim().toLowerCase() === normalizedName
      ) {
        // If it's a re-observation, upgrade quality if higher, but do not create duplicate
        if (request.dataQuality) {
          const currentMult = DATA_QUALITY_MULTIPLIERS[existing.dataQuality];
          const newMult = DATA_QUALITY_MULTIPLIERS[request.dataQuality];
          if (newMult > currentMult) {
            existing.dataQuality = request.dataQuality;
            existing.researchValue = Math.round(existing.researchValue * (newMult / currentMult));
          }
        }
        return existing;
      }
    }

    const quality = request.dataQuality || DataQualityRating.STANDARD;
    const baseValue = request.researchValue ?? 50;
    const finalResearchValue = Math.max(10, Math.round(baseValue * DATA_QUALITY_MULTIPLIERS[quality]));

    const id = this.generateFindingId(request.destinationId, request.category);
    const newFinding: ScientificFinding = {
      id,
      name: request.name.trim(),
      destinationId: request.destinationId,
      category: request.category,
      description: request.description || 'No detailed analysis recorded.',
      collectionSource: request.collectionSource || CollectionSource.ORBITAL_SURVEY,
      missionId: request.missionId,
      collectionTimestamp: Date.now(),
      dataQuality: quality,
      researchValue: finalResearchValue,
      analysisStatus: AnalysisStatus.UNANALYSED,
      analysisProgress: 0,
      unlockRequirements: request.unlockRequirements ? [...request.unlockRequirements] : [],
      relatedFindingIds: request.relatedFindingIds ? [...request.relatedFindingIds] : [],
      visualAssetKey: request.visualAssetKey,
      isEstablishedScience: request.isEstablishedScience ?? false,
      schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
    };

    this.findings.set(id, newFinding);

    if (request.conditions) {
      this.collectionConditions.set(id, { ...request.conditions });
    }

    // Bidirectionally link related findings if valid
    if (request.relatedFindingIds) {
      for (const relatedId of request.relatedFindingIds) {
        const related = this.findings.get(relatedId);
        if (related && !related.relatedFindingIds.includes(id)) {
          related.relatedFindingIds.push(id);
        }
      }
    }

    this.eventBus.emit('ScientificFindingRegistered', {
      finding: { ...newFinding },
      timestamp: Date.now(),
    });

    return newFinding;
  }

  private generateFindingId(destination: DestinationId, category: ScientificCategory): string {
    const destTag = destination.replace('DEST_', '');
    const catTag = category.substring(0, 4);
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    return `FINDING_${destTag}_${catTag}_${randomHex}`;
  }

  // ─── 2. Finding Queries & Lookups ─────────────────────────────────────────────

  public getScientificFinding(id: string): ScientificFinding | null {
    const finding = this.findings.get(id);
    return finding ? { ...finding } : null;
  }

  public listScientificFindings(filter?: {
    destinationId?: DestinationId;
    category?: ScientificCategory;
    analysisStatus?: AnalysisStatus;
    missionId?: string;
  }): ScientificFinding[] {
    let result = Array.from(this.findings.values());

    if (filter) {
      if (filter.destinationId) {
        result = result.filter((f) => f.destinationId === filter.destinationId);
      }
      if (filter.category) {
        result = result.filter((f) => f.category === filter.category);
      }
      if (filter.analysisStatus) {
        result = result.filter((f) => f.analysisStatus === filter.analysisStatus);
      }
      if (filter.missionId) {
        result = result.filter((f) => f.missionId === filter.missionId);
      }
    }

    return result.map((f) => ({ ...f }));
  }

  public getFindingsByDestination(destinationId: DestinationId): ScientificFinding[] {
    return this.listScientificFindings({ destinationId });
  }

  public getFindingsByMission(missionId: string): ScientificFinding[] {
    return this.listScientificFindings({ missionId });
  }

  public getCollectionConditions(findingId: string): CollectionConditions | null {
    const cond = this.collectionConditions.get(findingId);
    return cond ? { ...cond } : null;
  }

  public setCollectionConditions(findingId: string, conditions: CollectionConditions): void {
    if (!this.findings.has(findingId)) {
      throw new Error(`Cannot record collection conditions: finding ${findingId} does not exist`);
    }
    this.collectionConditions.set(findingId, { ...conditions });
  }

  public updateFindingQuality(findingId: string, newQuality: DataQualityRating): ScientificFinding {
    const finding = this.findings.get(findingId);
    if (!finding) {
      throw new Error(`Finding ${findingId} not found`);
    }

    const oldQuality = finding.dataQuality;
    if (oldQuality !== newQuality) {
      const oldMult = DATA_QUALITY_MULTIPLIERS[oldQuality];
      const newMult = DATA_QUALITY_MULTIPLIERS[newQuality];
      finding.dataQuality = newQuality;
      finding.researchValue = Math.max(10, Math.round(finding.researchValue * (newMult / oldMult)));
    }

    return { ...finding };
  }

  // ─── 3. Data Analysis System ─────────────────────────────────────────────────

  /**
   * Advance the analysis of a scientific finding.
   * Progress advances from 0 to 100%. Upon reaching 100%, status becomes ANALYSED,
   * research points are granted via EconomyAdapter, and research projects are evaluated.
   */
  public analyseFinding(findingId: string, progressDelta: number = 25): ScientificFinding {
    const finding = this.findings.get(findingId);
    if (!finding) {
      throw new Error(`Finding with ID ${findingId} not found`);
    }

    const previousStatus = finding.analysisStatus;

    if (finding.analysisStatus === AnalysisStatus.UNANALYSED) {
      finding.analysisStatus = AnalysisStatus.IN_PROGRESS;
      this.eventBus.emit('FindingAnalysisStarted', {
        findingId,
        initialProgress: 0,
        timestamp: Date.now(),
      });
    }

    finding.analysisProgress = Math.min(100, Math.max(0, finding.analysisProgress + progressDelta));

    if (finding.analysisProgress >= 100) {
      if (finding.analysisStatus !== AnalysisStatus.ANALYSED && finding.analysisStatus !== AnalysisStatus.VERIFIED) {
        finding.analysisStatus = AnalysisStatus.ANALYSED;

        // Award research points through adapter
        this.economyAdapter.grantAnalysisPoints(finding.researchValue);

        this.eventBus.emit('FindingAnalysisCompleted', {
          finding: { ...finding },
          previousStatus,
          researchPointsGranted: finding.researchValue,
          timestamp: Date.now(),
        });

        // Trigger automatic research project re-evaluation
        this.evaluateProjectsProgress();
      }
    }

    return { ...finding };
  }

  /**
   * Verify an already analysed finding (e.g. through peer review or secondary confirmation).
   */
  public verifyFinding(findingId: string): ScientificFinding {
    const finding = this.findings.get(findingId);
    if (!finding) {
      throw new Error(`Finding ${findingId} not found`);
    }
    if (finding.analysisStatus !== AnalysisStatus.ANALYSED && finding.analysisStatus !== AnalysisStatus.VERIFIED) {
      throw new Error(`Finding ${findingId} must be analysed before it can be verified`);
    }

    if (finding.analysisStatus !== AnalysisStatus.VERIFIED) {
      const prevStatus = finding.analysisStatus;
      finding.analysisStatus = AnalysisStatus.VERIFIED;
      finding.analysisProgress = 100;

      // Bonus points for verification
      const bonus = Math.round(finding.researchValue * 0.25);
      this.economyAdapter.grantAnalysisPoints(bonus);

      this.eventBus.emit('FindingAnalysisCompleted', {
        finding: { ...finding },
        previousStatus: prevStatus,
        researchPointsGranted: bonus,
        timestamp: Date.now(),
      });
    }

    return { ...finding };
  }

  /**
   * Compare two related discoveries for educational / comparative analysis.
   */
  public compareDiscoveries(
    idA: string,
    idB: string
  ): { findingA: ScientificFinding; findingB: ScientificFinding; areRelated: boolean; sharedCategory: boolean } {
    const findingA = this.findings.get(idA);
    const findingB = this.findings.get(idB);
    if (!findingA || !findingB) {
      throw new Error('Both findings must exist to compare');
    }

    const areRelated =
      findingA.relatedFindingIds.includes(idB) || findingB.relatedFindingIds.includes(idA);
    const sharedCategory = findingA.category === findingB.category;

    return {
      findingA: { ...findingA },
      findingB: { ...findingB },
      areRelated,
      sharedCategory,
    };
  }

  // ─── 4. Research Projects & Progression ──────────────────────────────────────

  public createResearchProject(request: ResearchProjectCreationRequest): ResearchProject {
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('Research project title is required');
    }
    if (!request.category) {
      throw new Error('Research project category is required');
    }

    const id = `PROJ_${request.category.substring(0, 4)}_${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
    const project: ResearchProject = {
      id,
      title: request.title.trim(),
      description: request.description || '',
      category: request.category,
      requiredFindingIds: request.requiredFindingIds ? [...request.requiredFindingIds] : [],
      requiredCategoryMinimums: request.requiredCategoryMinimums
        ? { ...request.requiredCategoryMinimums }
        : undefined,
      progress: 0,
      status: ResearchProjectStatus.NOT_STARTED,
      unlockableTechIds: request.unlockableTechIds ? [...request.unlockableTechIds] : [],
      rewards: {
        researchData: request.rewards?.researchData ?? 100,
        technologyPoints: request.rewards?.technologyPoints ?? 1,
        credits: request.rewards?.credits ?? 100000,
      },
      createdTimestamp: Date.now(),
      completedTimestamp: null,
      schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
    };

    this.researchProjects.set(id, project);

    // Initial progress evaluation
    this.recalculateProjectProgress(project);

    this.eventBus.emit('ResearchProjectCreated', {
      project: { ...project },
      timestamp: Date.now(),
    });

    return { ...project };
  }

  public getResearchProject(id: string): ResearchProject | null {
    const project = this.researchProjects.get(id);
    return project ? { ...project } : null;
  }

  public listResearchProjects(filter?: {
    category?: ScientificCategory;
    status?: ResearchProjectStatus;
  }): ResearchProject[] {
    let result = Array.from(this.researchProjects.values());
    if (filter) {
      if (filter.category) {
        result = result.filter((p) => p.category === filter.category);
      }
      if (filter.status) {
        result = result.filter((p) => p.status === filter.status);
      }
    }
    return result.map((p) => ({ ...p }));
  }

  public updateResearchProgress(projectId: string, progressDelta: number): ResearchProject {
    const project = this.researchProjects.get(projectId);
    if (!project) {
      throw new Error(`Research project ${projectId} not found`);
    }

    if (project.status === ResearchProjectStatus.COMPLETED) {
      return { ...project };
    }

    const previousProgress = project.progress;
    project.progress = Math.min(100, Math.max(0, project.progress + progressDelta));

    if (project.progress > 0 && project.status === ResearchProjectStatus.NOT_STARTED) {
      project.status = ResearchProjectStatus.IN_PROGRESS;
    }

    this.eventBus.emit('ResearchProgressUpdated', {
      projectId,
      previousProgress,
      currentProgress: project.progress,
      status: project.status,
      timestamp: Date.now(),
    });

    if (project.progress >= 100) {
      return this.completeResearchProject(projectId);
    }

    return { ...project };
  }

  public completeResearchProject(projectId: string): ResearchProject {
    const project = this.researchProjects.get(projectId);
    if (!project) {
      throw new Error(`Research project ${projectId} not found`);
    }

    if (project.status === ResearchProjectStatus.COMPLETED) {
      return { ...project };
    }

    // Verify all required findings are analysed or verified
    const missingRequirements = this.getMissingRequirements(projectId);
    if (missingRequirements.length > 0) {
      throw new Error(
        `Cannot complete research project ${projectId}: missing analyzed findings [${missingRequirements.join(', ')}]`
      );
    }

    project.progress = 100;
    project.status = ResearchProjectStatus.COMPLETED;
    project.completedTimestamp = Date.now();

    // Grant rewards through EconomyAdapter
    this.economyAdapter.grantResearchRewards(project.rewards);

    // Unlock technologies through ResearchServiceAdapter
    const unlockedTechs = this.researchAdapter.unlockTechnologies(project.unlockableTechIds);

    this.eventBus.emit('ResearchProjectCompleted', {
      project: { ...project },
      rewardsGranted: { ...project.rewards },
      unlockedTechIds: unlockedTechs,
      timestamp: Date.now(),
    });

    return { ...project };
  }

  public getMissingRequirements(projectId: string): string[] {
    const project = this.researchProjects.get(projectId);
    if (!project) return [];

    const missing: string[] = [];
    for (const findingId of project.requiredFindingIds) {
      const finding = this.findings.get(findingId);
      if (!finding || (finding.analysisStatus !== AnalysisStatus.ANALYSED && finding.analysisStatus !== AnalysisStatus.VERIFIED)) {
        missing.push(findingId);
      }
    }
    return missing;
  }

  private evaluateProjectsProgress(): void {
    for (const project of this.researchProjects.values()) {
      if (project.status !== ResearchProjectStatus.COMPLETED) {
        this.recalculateProjectProgress(project);
      }
    }
  }

  private recalculateProjectProgress(project: ResearchProject): void {
    if (project.status === ResearchProjectStatus.COMPLETED) return;

    if (project.requiredFindingIds.length === 0) return;

    let satisfiedCount = 0;
    for (const findingId of project.requiredFindingIds) {
      const finding = this.findings.get(findingId);
      if (finding && (finding.analysisStatus === AnalysisStatus.ANALYSED || finding.analysisStatus === AnalysisStatus.VERIFIED)) {
        satisfiedCount++;
      }
    }

    const calculatedProgress = Math.round((satisfiedCount / project.requiredFindingIds.length) * 100);
    const prevProgress = project.progress;
    project.progress = calculatedProgress;

    if (project.progress > 0 && project.status === ResearchProjectStatus.NOT_STARTED) {
      project.status = ResearchProjectStatus.IN_PROGRESS;
    }

    if (prevProgress !== project.progress) {
      this.eventBus.emit('ResearchProgressUpdated', {
        projectId: project.id,
        previousProgress: prevProgress,
        currentProgress: project.progress,
        status: project.status,
        timestamp: Date.now(),
      });
    }
  }

  // ─── 5. Research Overview ─────────────────────────────────────────────────────

  public getResearchOverview(): ResearchOverview {
    const findingsList = Array.from(this.findings.values());
    const projectsList = Array.from(this.researchProjects.values());

    const findingsByStatus: Record<AnalysisStatus, number> = {
      [AnalysisStatus.UNANALYSED]: 0,
      [AnalysisStatus.IN_PROGRESS]: 0,
      [AnalysisStatus.ANALYSED]: 0,
      [AnalysisStatus.VERIFIED]: 0,
    };

    const findingsByCategory: Record<ScientificCategory, number> = {
      [ScientificCategory.SURFACE_GEOLOGY]: 0,
      [ScientificCategory.ATMOSPHERIC_OBSERVATIONS]: 0,
      [ScientificCategory.MINERAL_COMPOSITION]: 0,
      [ScientificCategory.ENVIRONMENTAL_MEASUREMENTS]: 0,
      [ScientificCategory.MAGNETIC_FIELD_OBSERVATIONS]: 0,
      [ScientificCategory.ICE_AND_WATER]: 0,
      [ScientificCategory.ASTEROID_COMPOSITION]: 0,
      [ScientificCategory.PLANETARY_IMAGING]: 0,
      [ScientificCategory.RADIATION_ENVIRONMENT]: 0,
      [ScientificCategory.GENERAL_ASTRONOMICAL]: 0,
    };

    const findingsByDestination: Partial<Record<DestinationId, number>> = {};

    for (const finding of findingsList) {
      findingsByStatus[finding.analysisStatus] = (findingsByStatus[finding.analysisStatus] || 0) + 1;
      findingsByCategory[finding.category] = (findingsByCategory[finding.category] || 0) + 1;
      findingsByDestination[finding.destinationId] = (findingsByDestination[finding.destinationId] || 0) + 1;
    }

    const projectsByStatus: Record<ResearchProjectStatus, number> = {
      [ResearchProjectStatus.NOT_STARTED]: 0,
      [ResearchProjectStatus.IN_PROGRESS]: 0,
      [ResearchProjectStatus.COMPLETED]: 0,
    };

    for (const project of projectsList) {
      projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
    }

    const completedProjects = projectsByStatus[ResearchProjectStatus.COMPLETED];
    const overallProgress = projectsList.length > 0 ? Math.round((completedProjects / projectsList.length) * 100) : 0;

    return {
      totalFindings: findingsList.length,
      findingsByStatus,
      findingsByCategory,
      findingsByDestination,
      totalProjects: projectsList.length,
      projectsByStatus,
      overallProgress,
    };
  }

  // ─── 6. Safe Serialization & Restoration ─────────────────────────────────────

  public serialize(): ScientificDataSaveState {
    const conditionsObj: Record<string, CollectionConditions> = {};
    for (const [id, cond] of this.collectionConditions.entries()) {
      conditionsObj[id] = { ...cond };
    }

    return {
      schemaVersion: SCIENTIFIC_DATA_SCHEMA_VERSION,
      findings: Array.from(this.findings.values()).map((f) => ({
        ...f,
        unlockRequirements: [...(f.unlockRequirements || [])],
        relatedFindingIds: [...f.relatedFindingIds],
      })),
      collectionConditions: conditionsObj,
      researchProjects: Array.from(this.researchProjects.values()).map((p) => ({
        ...p,
        requiredFindingIds: [...p.requiredFindingIds],
        unlockableTechIds: [...p.unlockableTechIds],
        rewards: { ...p.rewards },
      })),
    };
  }

  public deserialize(state: ScientificDataSaveState): void {
    if (!state || !Array.isArray(state.findings) || !Array.isArray(state.researchProjects)) {
      throw new Error('Failed to deserialize scientific data: invalid state schema');
    }

    this.findings.clear();
    this.collectionConditions.clear();
    this.researchProjects.clear();

    for (const finding of state.findings) {
      if (finding && finding.id) {
        this.findings.set(finding.id, {
          ...finding,
          unlockRequirements: [...(finding.unlockRequirements || [])],
          relatedFindingIds: [...(finding.relatedFindingIds || [])],
        });
      }
    }

    if (state.collectionConditions) {
      for (const [id, cond] of Object.entries(state.collectionConditions)) {
        if (cond) {
          this.collectionConditions.set(id, { ...cond });
        }
      }
    }

    for (const project of state.researchProjects) {
      if (project && project.id) {
        this.researchProjects.set(project.id, {
          ...project,
          requiredFindingIds: [...(project.requiredFindingIds || [])],
          unlockableTechIds: [...(project.unlockableTechIds || [])],
          rewards: { ...project.rewards },
        });
      }
    }
  }
}
