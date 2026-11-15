/**
 * INTERSTELLAR CONTINUUM - Results Simulation Adapter
 * Adapts mission simulation and flight telemetry into scoring parameters.
 */

export interface FlightTelemetryData {
  durationSeconds: number;
  structuralIntegrityFinal: number;
  deltaVUsedMps: number;
  deltaVPlannedMps: number;
  fuelRemainingPercentage: number;
  powerMarginPercentage: number;
  massEfficiencyRatio: number;
  anomaliesEncountered: number;
  anomaliesResolved: number;
  commUptimePercentage: number;
  subsystemHealthAverage: number;
  recoveredFromFailure?: boolean;
}

export class ResultsSimulationAdapter {
  /**
   * Builds normalized flight telemetry from available simulation or runtime state.
   */
  public extractFlightTelemetry(raw: Partial<FlightTelemetryData> = {}): FlightTelemetryData {
    return {
      durationSeconds: raw.durationSeconds ?? 86400 * 2, // 2 days default
      structuralIntegrityFinal: raw.structuralIntegrityFinal ?? 95,
      deltaVUsedMps: raw.deltaVUsedMps ?? 2950,
      deltaVPlannedMps: raw.deltaVPlannedMps ?? 3100,
      fuelRemainingPercentage: raw.fuelRemainingPercentage ?? 20,
      powerMarginPercentage: raw.powerMarginPercentage ?? 90,
      massEfficiencyRatio: raw.massEfficiencyRatio ?? 0.35,
      anomaliesEncountered: raw.anomaliesEncountered ?? 0,
      anomaliesResolved: raw.anomaliesResolved ?? 0,
      commUptimePercentage: raw.commUptimePercentage ?? 98,
      subsystemHealthAverage: raw.subsystemHealthAverage ?? 95,
      recoveredFromFailure: raw.recoveredFromFailure ?? false,
    };
  }
}
