/**
 * INTERSTELLAR CONTINUUM - Mission Preparation Service
 * Generates dynamic, data-driven preparation task checklists from MissionDefinitions
 * and routes tasks to the appropriate headquarters facilities.
 */

import { MissionDefinition, SpacecraftType, PayloadType } from './MissionTypes';
import { FacilityId } from '../facilities/FacilityTypes';
import { FacilityRegistry } from '../facilities/FacilityRegistry';
import {
  MissionPreparationTask,
  MissionPreparationState,
  PreparationTaskType,
  PreparationTaskStatus,
} from './MissionLifecycleTypes';

export class MissionPreparationService {
  private static instance?: MissionPreparationService;
  private facilityRegistry: FacilityRegistry;

  constructor(facilityRegistry?: FacilityRegistry) {
    this.facilityRegistry = facilityRegistry ?? FacilityRegistry.getInstance();
  }

  public static getInstance(facilityRegistry?: FacilityRegistry): MissionPreparationService {
    if (!MissionPreparationService.instance) {
      MissionPreparationService.instance = new MissionPreparationService(facilityRegistry);
    }
    return MissionPreparationService.instance;
  }

  public static resetInstance(): void {
    MissionPreparationService.instance = undefined;
  }

  /**
   * Generates a tailored preparation checklist for a mission definition.
   * Tasks are derived exclusively from real engineering requirements.
   */
  public generatePreparationState(mission: MissionDefinition): MissionPreparationState {
    const tasks: MissionPreparationTask[] = [];
    const eng = mission.engineeringRequirements;

    // 1. Launch Vehicle Configuration (Rocket Engineering)
    const rocketFacility = this.facilityRegistry.getFacility(FacilityId.ROCKET_ENGINEERING);
    tasks.push({
      id: `${mission.id}_TASK_ROCKET`,
      type: PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION,
      title: 'Launch Vehicle & Propulsion Staging',
      description: `Configure rocket booster stage with sufficient delta-V for target orbit/trajectory (${eng.targetOrbit ? `${eng.targetOrbit.altitudeKmMin}–${eng.targetOrbit.altitudeKmMax} km` : 'Escape Trajectory'}).`,
      facilityId: FacilityId.ROCKET_ENGINEERING,
      facilityName: rocketFacility?.name ?? 'Rocket Engineering Facility',
      required: true,
      status: PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD,
      systemImplemented: false, // Rocket Engineering system scheduled for PROMPT 21
      statusNotes: 'Rocket VAB design system pending implementation (PROMPT 21).',
    });

    // 2. Spacecraft Design & Bus Integration (Spacecraft Lab)
    const spacecraftFacility = this.facilityRegistry.getFacility(FacilityId.SPACECRAFT_LAB);
    tasks.push({
      id: `${mission.id}_TASK_SPACECRAFT`,
      type: PreparationTaskType.SPACECRAFT_DESIGN,
      title: `Spacecraft Platform Architecture (${eng.spacecraftType})`,
      description: `Integrate bus platform, attitude control, thermal protection, and power system ($\ge ${eng.minPowerWatts}W$, ${eng.minBatteryCapacityWh}Wh battery).`,
      facilityId: FacilityId.SPACECRAFT_LAB,
      facilityName: spacecraftFacility?.name ?? 'Spacecraft & Satellite Laboratory',
      required: true,
      status: PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD,
      systemImplemented: false, // Spacecraft Lab scheduled for PROMPT 22
      statusNotes: 'Spacecraft CAD integration system pending implementation (PROMPT 22).',
    });

    // 3. Payload Integration (Resource & Manufacturing Centre)
    const mfgFacility = this.facilityRegistry.getFacility(FacilityId.MANUFACTURING_CENTRE);
    tasks.push({
      id: `${mission.id}_TASK_PAYLOAD`,
      type: PreparationTaskType.PAYLOAD_INTEGRATION,
      title: `Payload Module Fabrication (${eng.payloadType})`,
      description: `Fabricate and balance payload module assembly within specified mass envelope (${eng.minPayloadMassKg}–${eng.maxPayloadMassKg} kg).`,
      facilityId: FacilityId.MANUFACTURING_CENTRE,
      facilityName: mfgFacility?.name ?? 'Resource & Manufacturing Centre',
      required: true,
      status: PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD,
      systemImplemented: false,
      statusNotes: 'Manufacturing fabrication assembly pending implementation.',
    });

    // 4. Communication Capability (Communications & Tracking)
    if (eng.relayRequired || eng.communicationBandwidthKbps > 0) {
      const commFacility = this.facilityRegistry.getFacility(FacilityId.COMMUNICATIONS_CENTRE);
      tasks.push({
        id: `${mission.id}_TASK_COMMS`,
        type: PreparationTaskType.COMMUNICATION_SETUP,
        title: 'High-Gain Telemetry & DSN Relay Calibration',
        description: `Establish uplink/downlink transponder capability meeting ${eng.communicationBandwidthKbps} kbps minimum bandwidth requirement${eng.relayRequired ? ' with Deep Space Network relay protocol' : ''}.`,
        facilityId: FacilityId.COMMUNICATIONS_CENTRE,
        facilityName: commFacility?.name ?? 'Communications Centre',
        required: eng.relayRequired,
        status: PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD,
        systemImplemented: false,
        statusNotes: 'Ground tracking and relay integration pending implementation.',
      });
    }

    // 5. Robotics / Rover Configuration (Robotics Centre)
    const isRoboticsMission =
      eng.spacecraftType === SpacecraftType.PLANETARY_ROVER ||
      eng.payloadType === PayloadType.ROBOTIC_ROVER ||
      eng.payloadType === PayloadType.SUBSURFACE_DRILL_SYSTEM;

    if (isRoboticsMission) {
      const roboticsFacility = this.facilityRegistry.getFacility(FacilityId.ROBOTICS_CENTRE);
      tasks.push({
        id: `${mission.id}_TASK_ROBOTICS`,
        type: PreparationTaskType.ROBOTICS_CONFIGURATION,
        title: 'Robotics Mobility & Autonomous Navigation',
        description: 'Verify rover suspension, surface terrain mobility chassis, hazard obstacle avoidance, and coring drill actuators.',
        facilityId: FacilityId.ROBOTICS_CENTRE,
        facilityName: roboticsFacility?.name ?? 'Robotics and Exploration Centre',
        required: true,
        status: PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD,
        systemImplemented: false,
        statusNotes: 'Robotics exploration chassis builder pending implementation.',
      });
    }

    // 6. Scientific Instruments Integration (R&D Centre)
    if (eng.requiredInstruments && eng.requiredInstruments.length > 0) {
      const rdFacility = this.facilityRegistry.getFacility(FacilityId.RESEARCH_DEVELOPMENT);
      tasks.push({
        id: `${mission.id}_TASK_INSTRUMENTS`,
        type: PreparationTaskType.INSTRUMENT_INTEGRATION,
        title: `Scientific Sensor Package (${eng.requiredInstruments.length} Instruments)`,
        description: `Mount and calibrate required instruments: ${eng.requiredInstruments.join(', ')}.`,
        facilityId: FacilityId.RESEARCH_DEVELOPMENT,
        facilityName: rdFacility?.name ?? 'Research & Development Centre',
        required: true,
        status: PreparationTaskStatus.NOT_AVAILABLE_IN_BUILD,
        systemImplemented: false,
        statusNotes: 'Instrument lab mounting system pending implementation.',
      });
    }

    return {
      tasks,
      isAllMandatoryConfigured: false,
      validationErrors: [],
    };
  }

  /**
   * Validates the preparation state of a mission.
   * Checks whether all mandatory tasks are configured AND whether required systems are implemented.
   */
  public validatePreparation(state: MissionPreparationState): {
    isValid: boolean;
    errors: string[];
    unimplementedTasks: MissionPreparationTask[];
    unconfiguredTasks: MissionPreparationTask[];
  } {
    const errors: string[] = [];
    const unimplementedTasks: MissionPreparationTask[] = [];
    const unconfiguredTasks: MissionPreparationTask[] = [];

    for (const task of state.tasks) {
      if (!task.required) continue;

      if (!task.systemImplemented) {
        unimplementedTasks.push(task);
        errors.push(
          `Mandatory task "${task.title}" requires ${task.facilityName}, which is currently pending system development.`
        );
      } else if (task.status !== PreparationTaskStatus.CONFIGURED) {
        unconfiguredTasks.push(task);
        errors.push(`Mandatory task "${task.title}" is not configured (${task.status}).`);
      }
    }

    const isValid = errors.length === 0;
    state.isAllMandatoryConfigured = unconfiguredTasks.length === 0;
    state.validationErrors = errors;
    state.lastValidatedTimestamp = Date.now();

    return {
      isValid,
      errors,
      unimplementedTasks,
      unconfiguredTasks,
    };
  }
}
