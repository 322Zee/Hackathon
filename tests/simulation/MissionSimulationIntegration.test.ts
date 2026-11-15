import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { MissionSimulationEngine } from '../../src/simulation/MissionSimulationEngine';
import { DestinationId } from '../../src/destinations/DestinationTypes';
import {
  SimulationMissionState,
  SimulationMissionPhase,
  TravelSubPhase,
} from '../../src/simulation/MissionSimulationTypes';

describe('Mission Simulation Core Integration', () => {
  it('forwards simulation events to EventBus when provided', () => {
    const eventBus = new EventBus();
    const busSpy = vi.fn();

    // Listen on dynamic simulation events
    eventBus.on('simulation:MissionStarted' as any, busSpy);

    const engine = new MissionSimulationEngine({ eventBus });
    engine.initializeMission({
      missionId: 'MSN_BUS_TEST',
      missionName: 'Bus Forwarding Test',
      missionType: 'TRANSPORTATION',
      destinationId: DestinationId.EARTH_ORBIT_LEO,
    });

    engine.startMission();

    expect(busSpy).toHaveBeenCalledTimes(1);
    expect(busSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId: 'MSN_BUS_TEST',
        state: SimulationMissionState.LAUNCHING,
      })
    );
  });

  it('executes a complete end-to-end mission lifecycle including round-trip return journey', () => {
    const engine = new MissionSimulationEngine();

    // 1. Initialize
    engine.initializeMission({
      missionId: 'MSN_MARS_SAMPLE_RETURN',
      missionName: 'Mars Sample Return Initiative',
      missionType: 'COMBINED',
      originId: DestinationId.EARTH,
      destinationId: DestinationId.MARS,
      estimatedDurationSeconds: 100, // Shortened for deterministic test execution
      objectives: [
        {
          id: 'obj_land',
          title: 'Land on Martian Surface',
          isMandatory: true,
          isCompleted: false,
          currentProgress: 0,
          targetValue: 1,
        },
        {
          id: 'obj_sample',
          title: 'Collect Core Sample',
          isMandatory: true,
          isCompleted: false,
          currentProgress: 0,
          targetValue: 1,
        },
      ],
    });

    expect(engine.getMissionState()).toBe(SimulationMissionState.PREPARING);

    // 2. Launch
    expect(engine.startMission()).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.LAUNCHING);

    // 3. Ascent and In-Transit Cruise
    engine.setSimulationSpeed(50.0);
    engine.advanceSimulation(1.0); // 50 game-seconds -> in transit
    expect(engine.getMissionState()).toBe(SimulationMissionState.IN_TRANSIT);

    // 4. Transit to Mars and Arrive
    engine.advanceSimulation(2.0); // 100 game-seconds -> arrives at Mars
    expect(engine.getMissionState()).toBe(SimulationMissionState.ACTIVE);
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.PRIMARY_OPERATIONS);

    // 5. Complete surface exploration objectives
    engine.completeObjective('obj_land');
    engine.completeObjective('obj_sample');

    // 6. Initiate return journey back to Earth
    const returnInitiated = engine.initiateReturnJourney(100);
    expect(returnInitiated).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.RETURNING);
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.RETURN_TRANSIT);
    expect(engine.getTravelProgress().travelSubPhase).toBe(TravelSubPhase.RETURNING);

    // 7. Advance return transit
    engine.advanceSimulation(2.5); // 125 game-seconds -> completes return
    expect(engine.getTravelProgress().travelSubPhase).toBe(TravelSubPhase.RETURNED);

    // 8. Conclude and Complete Mission
    const completed = engine.completeMission();
    expect(completed).toBe(true);
    expect(engine.getMissionState()).toBe(SimulationMissionState.COMPLETED);
    expect(engine.getMissionPhase()).toBe(SimulationMissionPhase.MISSION_CONCLUDED);

    // Snapshot at end
    const finalSnapshot = engine.getMissionSnapshot();
    expect(finalSnapshot.currentState).toBe(SimulationMissionState.COMPLETED);
    expect(finalSnapshot.objectives.every((o) => o.isCompleted)).toBe(true);
    expect(finalSnapshot.completedGameTime).toBeGreaterThan(0);
  });
});
