/**
 * INTERSTELLAR CONTINUUM - Results Science Adapter
 * Translates scientific findings, telemetry packets, and discoveries into evaluation inputs.
 */

import { ResearchService } from '../../services/ResearchService';

export interface ScienceEvaluationTelemetry {
  targetDataPoints: number;
  collectedDataPoints: number;
  discoveriesLogged: number;
  instrumentsOperational: number;
  totalInstruments: number;
  downlinkFidelityMultiplier: number;
}

export class ResultsScienceAdapter {
  private researchService?: ResearchService;

  constructor(researchService?: ResearchService) {
    this.researchService = researchService;
  }

  public setResearchService(researchService?: ResearchService): void {
    this.researchService = researchService;
  }

  public getResearchService(): ResearchService | undefined {
    return this.researchService;
  }

  /**
   * Generates a telemetry payload for scientific scoring evaluation.
   */
  public generateTelemetry(options: Partial<ScienceEvaluationTelemetry> = {}): ScienceEvaluationTelemetry {
    return {
      targetDataPoints: options.targetDataPoints ?? 100,
      collectedDataPoints: options.collectedDataPoints ?? 100,
      discoveriesLogged: options.discoveriesLogged ?? 1,
      instrumentsOperational: options.instrumentsOperational ?? 4,
      totalInstruments: options.totalInstruments ?? 4,
      downlinkFidelityMultiplier: options.downlinkFidelityMultiplier ?? 1.0,
    };
  }
}
