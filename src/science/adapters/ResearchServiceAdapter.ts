/**
 * INTERSTELLAR CONTINUUM - Research Service Adapter
 * Clean adapter layer that interfaces with ResearchService without modifying or duplicating tech tree logic.
 */

import { ResearchService } from '../../services/ResearchService';

export class ResearchServiceAdapter {
  private researchService?: ResearchService;

  constructor(researchService?: ResearchService) {
    this.researchService = researchService;
  }

  public setResearchService(researchService: ResearchService): void {
    this.researchService = researchService;
  }

  /**
   * Check if a technology is already unlocked in the central tech tree.
   */
  public isTechUnlocked(techId: string): boolean {
    if (!this.researchService) return false;
    return this.researchService.isUnlocked(techId);
  }

  /**
   * Unlock one or more technologies resulting from scientific research completion.
   */
  public unlockTechnologies(techIds: string[]): string[] {
    if (!this.researchService) return [];

    const unlocked: string[] = [];
    for (const techId of techIds) {
      if (!this.researchService.isUnlocked(techId)) {
        this.researchService.unlock(techId);
        unlocked.push(techId);
      }
    }
    return unlocked;
  }

  /**
   * Get all currently unlocked technology identifiers.
   */
  public getUnlockedTechnologies(): string[] {
    if (!this.researchService) return [];
    return this.researchService.getUnlockedTechnologies();
  }
}
