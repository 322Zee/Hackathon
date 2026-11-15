/**
 * INTERSTELLAR CONTINUUM - Contracts Progression Adapter
 * Tracks agency director rank, sponsor relationship reputation, and prestige.
 */

export class ContractsProgressionAdapter {
  private directorRank: number = 1;
  private agencyPrestige: number = 0;
  private sponsorReputation: Map<string, number> = new Map();

  constructor(initialRank: number = 1) {
    this.directorRank = initialRank;
  }

  public getDirectorRank(): number {
    return this.directorRank;
  }

  public setDirectorRank(rank: number): void {
    this.directorRank = Math.max(1, rank);
  }

  public getAgencyPrestige(): number {
    return this.agencyPrestige;
  }

  public addPrestige(amount: number): void {
    this.agencyPrestige = Math.max(0, this.agencyPrestige + amount);
  }

  public getSponsorReputation(sponsorId: string): number {
    return this.sponsorReputation.get(sponsorId) ?? 0;
  }

  public modifySponsorReputation(sponsorId: string, delta: number): number {
    const current = this.getSponsorReputation(sponsorId);
    const updated = Math.max(-100, Math.min(100, current + delta));
    this.sponsorReputation.set(sponsorId, updated);
    return updated;
  }

  public setSponsorReputation(sponsorId: string, value: number): void {
    this.sponsorReputation.set(sponsorId, Math.max(-100, Math.min(100, value)));
  }

  public getAllSponsorReputations(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, rep] of this.sponsorReputation.entries()) {
      result[id] = rep;
    }
    return result;
  }
}
