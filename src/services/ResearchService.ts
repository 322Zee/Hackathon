import { EventBus } from '../core/EventBus';

export interface TechNode {
  id: string;
  title: string;
  description: string;
  tier: number;
  costResearchData: number;
  prerequisites: string[];
  unlockedPayloads: string[];
}

export class ResearchService {
  private unlockedTechIds: Set<string>;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, initialUnlocked: string[] = []) {
    this.eventBus = eventBus;
    this.unlockedTechIds = new Set(initialUnlocked);
  }

  public isUnlocked(techId: string): boolean {
    return this.unlockedTechIds.has(techId);
  }

  public canUnlock(node: TechNode, availableResearchData: number): boolean {
    if (this.unlockedTechIds.has(node.id)) return false;
    if (availableResearchData < node.costResearchData) return false;
    for (const prereq of node.prerequisites) {
      if (!this.unlockedTechIds.has(prereq)) return false;
    }
    return true;
  }

  public unlock(techId: string): void {
    if (!this.unlockedTechIds.has(techId)) {
      this.unlockedTechIds.add(techId);
      this.eventBus.emit('research:unlocked', { techId });
    }
  }

  public getUnlockedTechnologies(): string[] {
    return Array.from(this.unlockedTechIds);
  }
}
