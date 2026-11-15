/**
 * INTERSTELLAR CONTINUUM - Sample Mission Data Provider (Demonstration Mode)
 * Development-only preview provider supplying rich, realistic educational space mission telemetry.
 *
 * NOTE: Strictly isolated from persistent player saves and progression.
 * Every telemetry snapshot is explicitly watermarked with isSampleData: true.
 */

import { IMissionDataProvider } from './IMissionDataProvider';
import {
  MissionOverviewData,
  MissionTelemetrySnapshot,
  MissionControlEvent,
  MissionAlert,
  AlertPriority,
  MissionEventCategory,
  MilestoneState,
  MissionMilestone,
  MissionControlObjective,
  TelemetryHistoryPoint,
} from '../types/MissionControlTypes';
import { DestinationId } from '../../destinations/DestinationTypes';
import {
  MissionCategory,
  MissionStageType,
  SpacecraftType,
  PayloadType,
} from '../../missions/MissionTypes';
import { MissionLifecycleState } from '../../missions/MissionLifecycleTypes';

export class SampleMissionDataProvider implements IMissionDataProvider {
  public readonly isDemoProvider = true;

  private simulationMetSeconds: number = 86400 * 42 + 3600 * 7 + 1420; // 42 days, 7h, 23m, 40s
  private updateAccumulator: number = 0;

  private snapshotListeners: Map<string, Set<(snapshot: MissionTelemetrySnapshot) => void>> = new Map();
  private eventListeners: Map<string, Set<(event: MissionControlEvent) => void>> = new Map();
  private alertListeners: Map<string, Set<(alert: MissionAlert) => void>> = new Map();

  private dismissedAlertIds: Set<string> = new Set();

  private sampleAlerts: MissionAlert[] = [
    {
      id: 'SAMPLE_ALT_01',
      timestamp: Date.now() - 3600000 * 4,
      priority: AlertPriority.WARNING,
      subsystem: 'SOLAR_ARRAYS',
      title: 'Solar Flare Ionization Transient',
      message: 'Minor solar flare detected by radiation monitor. High-gain tracking auto-adjusted.',
      actionPrompt: 'Monitor solar panel charge current and maintain nominal battery reserve.',
    },
    {
      id: 'SAMPLE_ALT_02',
      timestamp: Date.now() - 3600000 * 12,
      priority: AlertPriority.INFO,
      subsystem: 'COMMUNICATIONS',
      title: 'DSN Canberra Handover Nominal',
      message: 'Deep Space Network antenna handover from Goldstone to Canberra completed successfully.',
      actionPrompt: 'No action required. Carrier frequency locked at 8.4 GHz.',
    },
    {
      id: 'SAMPLE_ALT_03',
      timestamp: Date.now() - 3600000 * 24,
      priority: AlertPriority.CRITICAL,
      subsystem: 'REACTION_CONTROL',
      title: 'Trajectory Correction Burn Delta-V Deviation',
      message: 'TCM-2 burn executed with 0.12% minor vector offset. Autopilot compensated within margin.',
      actionPrompt: 'Review telemetry log before next orbital trim maneuver.',
      acknowledged: true,
    },
  ];

  public getActiveMissions(): MissionOverviewData[] {
    return [
      {
        missionId: 'DEMO_ARES_SURVEYOR',
        instanceId: 'SAMPLE_ARES_01',
        name: 'ARES-I // Mars Atmospheric Surveyor',
        shortCode: 'ARES-01',
        destinationId: DestinationId.MARS,
        destinationName: 'Mars',
        destinationType: 'Terrestrial Planet',
        category: MissionCategory.SCIENTIFIC_EXPLORATION,
        stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
        status: MissionLifecycleState.ACTIVE,
        currentPhase: 'DEEP SPACE CRUISE // TRANS-MARS INJECTION',
        metSeconds: this.simulationMetSeconds,
        estimatedDurationDays: 210,
        estimatedRemainingSeconds: (210 * 86400) - this.simulationMetSeconds,
        launchTimestamp: Date.now() - this.simulationMetSeconds * 1000,
        isSampleData: true,
      },
      {
        missionId: 'DEMO_EUROPA_DISCOVERY',
        instanceId: 'SAMPLE_EUROPA_02',
        name: 'EUROPA-DISCOVERY // Jovian Subsurface Surveyor',
        shortCode: 'EUR-02',
        destinationId: DestinationId.JUPITER,
        destinationName: 'Jupiter (Europa)',
        destinationType: 'Gas Giant / Icy Moon',
        category: MissionCategory.COMBINED,
        stageType: MissionStageType.ADVANCED_RESEARCH,
        status: MissionLifecycleState.ACTIVE,
        currentPhase: 'JUPITER GRAVITY ASSIST APPROACH',
        metSeconds: 86400 * 540 + 7200,
        estimatedDurationDays: 1200,
        estimatedRemainingSeconds: (1200 * 86400) - (86400 * 540 + 7200),
        launchTimestamp: Date.now() - (86400 * 540 + 7200) * 1000,
        isSampleData: true,
      },
    ];
  }

  public getMissionSnapshot(instanceId: string): MissionTelemetrySnapshot | null {
    if (instanceId === 'SAMPLE_EUROPA_02') {
      return this.buildEuropaSnapshot();
    }
    return this.buildAresSnapshot();
  }

  public subscribeToSnapshot(
    instanceId: string,
    listener: (snapshot: MissionTelemetrySnapshot) => void
  ): () => void {
    if (!this.snapshotListeners.has(instanceId)) {
      this.snapshotListeners.set(instanceId, new Set());
    }
    this.snapshotListeners.get(instanceId)!.add(listener);

    const snapshot = this.getMissionSnapshot(instanceId);
    if (snapshot) listener(snapshot);

    return () => {
      this.snapshotListeners.get(instanceId)?.delete(listener);
    };
  }

  public subscribeToEvents(
    instanceId: string,
    listener: (event: MissionControlEvent) => void
  ): () => void {
    if (!this.eventListeners.has(instanceId)) {
      this.eventListeners.set(instanceId, new Set());
    }
    this.eventListeners.get(instanceId)!.add(listener);

    return () => {
      this.eventListeners.get(instanceId)?.delete(listener);
    };
  }

  public subscribeToAlerts(
    instanceId: string,
    listener: (alert: MissionAlert) => void
  ): () => void {
    if (!this.alertListeners.has(instanceId)) {
      this.alertListeners.set(instanceId, new Set());
    }
    this.alertListeners.get(instanceId)!.add(listener);

    return () => {
      this.alertListeners.get(instanceId)?.delete(listener);
    };
  }

  public dismissAlert(_instanceId: string, alertId: string): void {
    this.dismissedAlertIds.add(alertId);
  }

  public update(deltaSeconds: number): void {
    this.simulationMetSeconds += deltaSeconds;
    this.updateAccumulator += deltaSeconds;

    // Dispatch slight live telemetry fluctuation every 2 seconds
    if (this.updateAccumulator >= 2.0) {
      this.updateAccumulator = 0;
      for (const instanceId of ['SAMPLE_ARES_01', 'SAMPLE_EUROPA_02']) {
        const listeners = this.snapshotListeners.get(instanceId);
        if (listeners && listeners.size > 0) {
          const snapshot = this.getMissionSnapshot(instanceId);
          if (snapshot) {
            for (const l of listeners) l(snapshot);
          }
        }
      }
    }
  }

  public dispose(): void {
    this.snapshotListeners.clear();
    this.eventListeners.clear();
    this.alertListeners.clear();
    this.dismissedAlertIds.clear();
  }

  private buildAresSnapshot(): MissionTelemetrySnapshot {
    const met = this.simulationMetSeconds;
    const days = met / 86400;

    // Realistic fluctuating values based on MET
    const battery = 92.4 + Math.sin(met / 100) * 1.5;
    const powerGen = 1450 + Math.cos(met / 80) * 35;
    const powerDraw = 780 + Math.sin(met / 60) * 20;
    const signalDbm = -94.2 + Math.sin(met / 120) * 1.8;
    const velocity = 26.42 + Math.cos(met / 500) * 0.05;
    const distanceKm = 48200000 + (met * 0.02);

    const history: TelemetryHistoryPoint[] = [];
    for (let i = 10; i >= 0; i--) {
      const pastMet = met - i * 3600;
      history.push({
        timestamp: Date.now() - i * 3600000,
        metSeconds: pastMet,
        powerDrawWatts: 780 + Math.sin(pastMet / 60) * 20,
        batteryPercent: 92.4 + Math.sin(pastMet / 100) * 1.5,
        signalStrengthPercent: 78 + Math.cos(pastMet / 150) * 4,
        vehicleConditionPercent: 99.4,
        velocityKmPerSec: 26.42,
      });
    }

    const events: MissionControlEvent[] = [
      {
        id: 'EVT_01',
        timestamp: Date.now() - met * 1000,
        metSeconds: 0,
        category: MissionEventCategory.LIFECYCLE,
        title: 'Mission Launch & Lift-Off',
        description: 'Pad Alpha launch sequence initiated. Main engines nominal.',
        severity: 'NORMAL',
      },
      {
        id: 'EVT_02',
        timestamp: Date.now() - (met - 520) * 1000,
        metSeconds: 520,
        category: MissionEventCategory.TRAJECTORY,
        title: 'LEO Insertion Nominal',
        description: 'Trans-Mars Injection stage achieved parking orbit at 240 km.',
        severity: 'NORMAL',
      },
      {
        id: 'EVT_03',
        timestamp: Date.now() - (met - 3600) * 1000,
        metSeconds: 3600,
        category: MissionEventCategory.TRAJECTORY,
        title: 'Trans-Mars Injection Burn',
        description: 'Upper stage ignited for 840 seconds. Heliocentric escape confirmed.',
        severity: 'NOTICE',
      },
      {
        id: 'EVT_04',
        timestamp: Date.now() - (met - 7200) * 1000,
        metSeconds: 7200,
        category: MissionEventCategory.PAYLOAD,
        title: 'Solar Arrays & Instrument Booms Deployed',
        description: 'Photovoltaic wings deployed and locked. Magnetometer boom extended.',
        severity: 'NORMAL',
      },
      {
        id: 'EVT_05',
        timestamp: Date.now() - (met - 86400 * 14) * 1000,
        metSeconds: 86400 * 14,
        category: MissionEventCategory.COMMUNICATION,
        title: 'Deep Space Network Lock Established',
        description: 'X-band high-gain telemetry lock established with Goldstone 70m antenna.',
        severity: 'NORMAL',
      },
      {
        id: 'EVT_06',
        timestamp: Date.now() - (met - 86400 * 30) * 1000,
        metSeconds: 86400 * 30,
        category: MissionEventCategory.TRAJECTORY,
        title: 'TCM-1 Mid-Course Correction',
        description: 'Trajectory correction maneuver 1 completed. B-plane aimpoint accurate.',
        severity: 'NORMAL',
      },
      {
        id: 'EVT_07',
        timestamp: Date.now() - 3600000 * 6,
        metSeconds: met - 21600,
        category: MissionEventCategory.SCIENCE,
        title: 'Interplanetary Magnetic Field Calibration',
        description: 'Science instrument magnetometer completed background baseline survey.',
        severity: 'NOTICE',
      },
    ];

    const completedObjectives: MissionControlObjective[] = [
      {
        id: 'OBJ_01',
        title: 'Achieve Low Earth Orbit Parking Altitude',
        description: 'Establish initial circular orbit between 200 km and 300 km.',
        isMandatory: true,
        isCompleted: true,
        currentProgress: 1.0,
        targetValue: '250 km',
        currentValue: '254 km',
        conditionDescription: 'Orbit verified by flight dynamics radar.',
      },
      {
        id: 'OBJ_02',
        title: 'Execute Trans-Mars Injection Burn',
        description: 'Deliver vehicle onto hyperbolic Mars intercept trajectory.',
        isMandatory: true,
        isCompleted: true,
        currentProgress: 1.0,
        targetValue: 'Delta-V 3,600 m/s',
        currentValue: 'Delta-V 3,604 m/s',
        conditionDescription: 'Trans-Mars Injection burn confirmed.',
      },
    ];

    const pendingObjectives: MissionControlObjective[] = [
      {
        id: 'OBJ_03',
        title: 'Perform Deep Space Cruise Health Checkouts',
        description: 'Execute ongoing periodic subsystems telemetry checkouts.',
        isMandatory: true,
        isCompleted: false,
        currentProgress: 0.65,
        targetValue: 'Day 120 checkout',
        currentValue: `Day ${Math.floor(days)} checkout`,
        conditionDescription: 'Subsystem diagnostics reporting nominal telemetry.',
      },
    ];

    const remainingObjectives: MissionControlObjective[] = [
      {
        id: 'OBJ_04',
        title: 'Perform Mars Orbital Insertion (MOI)',
        description: 'Retrograde burn to enter elliptical Mars capture orbit.',
        isMandatory: true,
        isCompleted: false,
        currentProgress: 0,
        targetValue: 'Target Apoapsis 4,200 km',
        conditionDescription: 'Scheduled at MET T+210 days.',
      },
      {
        id: 'OBJ_05',
        title: 'Deploy Atmospheric Entry Probe',
        description: 'Release descending science capsule into Martian upper atmosphere.',
        isMandatory: false,
        isCompleted: false,
        currentProgress: 0,
        targetValue: '1 atmospheric probe',
        conditionDescription: 'Requires stable capture orbit verification.',
      },
    ];

    const milestones: MissionMilestone[] = [
      {
        id: 'MS_1',
        title: 'Terminal Launch & Ascent',
        description: 'Countdown and orbital injection.',
        scheduledMetSeconds: 0,
        completedMetSeconds: 520,
        state: MilestoneState.COMPLETED,
      },
      {
        id: 'MS_2',
        title: 'Trans-Mars Injection (TMI)',
        description: 'Hyperbolic departure burn.',
        scheduledMetSeconds: 3600,
        completedMetSeconds: 3600,
        state: MilestoneState.COMPLETED,
      },
      {
        id: 'MS_3',
        title: 'Trajectory Correction 1 (TCM-1)',
        description: 'Mid-course vector adjustment.',
        scheduledMetSeconds: 86400 * 30,
        completedMetSeconds: 86400 * 30,
        state: MilestoneState.COMPLETED,
      },
      {
        id: 'MS_4',
        title: 'Mid-Course Cruise Cruise Phase',
        description: 'Deep space cruise and instrument calibration.',
        scheduledMetSeconds: 86400 * 105,
        state: MilestoneState.IN_PROGRESS,
      },
      {
        id: 'MS_5',
        title: 'Mars Orbital Insertion (MOI)',
        description: 'Capture burn at Mars closest approach.',
        scheduledMetSeconds: 86400 * 210,
        state: MilestoneState.PENDING,
      },
      {
        id: 'MS_6',
        title: 'Atmospheric Probe Entry',
        description: 'Atmospheric entry science and aeroshell telemetry.',
        scheduledMetSeconds: 86400 * 215,
        state: MilestoneState.PENDING,
      },
    ];

    const activeAlerts = this.sampleAlerts.filter((a) => !this.dismissedAlertIds.has(a.id));

    return {
      overview: {
        missionId: 'DEMO_ARES_SURVEYOR',
        instanceId: 'SAMPLE_ARES_01',
        name: 'ARES-I // Mars Atmospheric Surveyor',
        shortCode: 'ARES-01',
        destinationId: DestinationId.MARS,
        destinationName: 'Mars',
        destinationType: 'Terrestrial Planet',
        category: MissionCategory.SCIENTIFIC_EXPLORATION,
        stageType: MissionStageType.SCIENTIFIC_EXPLORATION,
        status: MissionLifecycleState.ACTIVE,
        currentPhase: 'DEEP SPACE CRUISE // TRANS-MARS INJECTION',
        metSeconds: met,
        estimatedDurationDays: 210,
        estimatedRemainingSeconds: (210 * 86400) - met,
        launchTimestamp: Date.now() - met * 1000,
        isSampleData: true,
      },
      spacecraft: {
        vehicleName: { available: true, value: 'ARES PATHFINDER BUS-IV' },
        spacecraftType: { available: true, value: SpacecraftType.ORBITAL_SURVEYOR },
        vehicleConditionPercent: { available: true, value: 99.4, unit: '%' },
        thermalStatus: { available: true, value: 'NOMINAL // 284 K' },
        temperatureKelvin: { available: true, value: 284, unit: 'K' },

        batteryPercent: {
          available: true,
          value: Math.round(battery * 10) / 10,
          unit: '%',
        },
        powerGenerationWatts: {
          available: true,
          value: Math.round(powerGen),
          unit: 'W',
        },
        powerDrawWatts: {
          available: true,
          value: Math.round(powerDraw),
          unit: 'W',
        },
        powerSystemState: { available: true, value: 'NOMINAL // SOLAR TRACE ACTIVE' },

        signalStrengthPercent: { available: true, value: 78, unit: '%' },
        signalDbm: {
          available: true,
          value: Math.round(signalDbm * 10) / 10,
          unit: 'dBm',
        },
        uplinkRateKbps: { available: true, value: 16.0, unit: 'kbps' },
        downlinkRateKbps: { available: true, value: 256.0, unit: 'kbps' },
        roundTripDelaySeconds: { available: true, value: 321.4, unit: 's' },
        activeGroundStation: { available: true, value: 'DSN GOLDSTONE // DSS-14' },
        commsState: { available: true, value: 'X-BAND CARRIER LOCKED' },

        payloadType: { available: true, value: PayloadType.ATMOSPHERIC_AEROSHELL },
        payloadHealthPercent: { available: true, value: 100, unit: '%' },
        payloadDeployed: { available: true, value: false },
        payloadMassKg: { available: true, value: 480, unit: 'KG' },
        payloadInstrumentsActive: { available: true, value: '4/4 SENSORS READY' },

        velocityKmPerSec: {
          available: true,
          value: Math.round(velocity * 100) / 100,
          unit: 'km/s',
        },
        distanceToDestinationKm: {
          available: true,
          value: Math.round(distanceKm),
          unit: 'KM',
        },
        altitudeKm: {
          available: true,
          value: Math.round(distanceKm * 0.98),
          unit: 'KM',
        },
        trajectoryStatus: { available: true, value: 'HELIOCENTRIC TRANSFER ARC' },
        orbitalRegime: { available: true, value: 'HELIOCENTRIC ORBIT // 1.28 AU' },

        systemWarnings: ['MINOR SOLAR FLUX VARIATION (AUTOMATICALLY COMPENSATED)'],
        missionReadinessPercent: { available: true, value: 100, unit: '%' },
        missionReadinessState: { available: true, value: 'OPTIMAL FLIGHT TELEMETRY' },
      },
      progress: {
        journeyProgressPercent: Math.round((days / 210) * 100),
        currentPhase: 'TRANS-MARS CRUISE',
        phaseProgressPercent: Math.round(((days - 1) / (210 - 1)) * 100),
        completedObjectives,
        pendingObjectives,
        remainingObjectives,
        milestones,
      },
      scientificData: {
        totalDataCollectedMb: { available: true, value: 1420, unit: 'MB' },
        dataDownlinkedMb: { available: true, value: 1398, unit: 'MB' },
        activeSensorsCount: { available: true, value: 4 },
        primaryDiscoveries: [
          'Solar Wind Density Anomaly at 1.15 AU',
          'Interplanetary Dust Micro-Impact Baseline Logged',
        ],
      },
      recentEvents: events,
      alerts: activeAlerts,
      telemetryHistory: history,
      isSampleData: true,
    };
  }

  private buildEuropaSnapshot(): MissionTelemetrySnapshot {
    const met = 86400 * 540 + 7200;
    const days = met / 86400;

    return {
      overview: {
        missionId: 'DEMO_EUROPA_DISCOVERY',
        instanceId: 'SAMPLE_EUROPA_02',
        name: 'EUROPA-DISCOVERY // Jovian Subsurface Surveyor',
        shortCode: 'EUR-02',
        destinationId: DestinationId.JUPITER,
        destinationName: 'Jupiter (Europa)',
        destinationType: 'Gas Giant / Icy Moon',
        category: MissionCategory.COMBINED,
        stageType: MissionStageType.ADVANCED_RESEARCH,
        status: MissionLifecycleState.ACTIVE,
        currentPhase: 'JUPITER GRAVITY ASSIST APPROACH',
        metSeconds: met,
        estimatedDurationDays: 1200,
        estimatedRemainingSeconds: (1200 * 86400) - met,
        launchTimestamp: Date.now() - met * 1000,
        isSampleData: true,
      },
      spacecraft: {
        vehicleName: { available: true, value: 'EUROPA CLIPPER BUS-X' },
        spacecraftType: { available: true, value: SpacecraftType.DEEP_SPACE_OBSERVATORY },
        vehicleConditionPercent: { available: true, value: 98.1, unit: '%' },
        thermalStatus: { available: true, value: 'NOMINAL // 142 K' },
        temperatureKelvin: { available: true, value: 142, unit: 'K' },

        batteryPercent: { available: true, value: 84.5, unit: '%' },
        powerGenerationWatts: { available: true, value: 450, unit: 'W' }, // RTG
        powerDrawWatts: { available: true, value: 380, unit: 'W' },
        powerSystemState: { available: true, value: 'RADIOISOTOPE THERMAL GENERATOR ACTIVE' },

        signalStrengthPercent: { available: true, value: 46, unit: '%' },
        signalDbm: { available: true, value: -118.4, unit: 'dBm' },
        uplinkRateKbps: { available: true, value: 2.0, unit: 'kbps' },
        downlinkRateKbps: { available: true, value: 64.0, unit: 'kbps' },
        roundTripDelaySeconds: { available: true, value: 2540, unit: 's' }, // ~42 mins
        activeGroundStation: { available: true, value: 'DSN CANBERRA // DSS-43' },
        commsState: { available: true, value: 'KA-BAND CARRIER LOCKED // DEEP SPACE' },

        payloadType: { available: true, value: PayloadType.RESEARCH_MODULE },
        payloadHealthPercent: { available: true, value: 99, unit: '%' },
        payloadDeployed: { available: true, value: false },
        payloadMassKg: { available: true, value: 850, unit: 'KG' },
        payloadInstrumentsActive: { available: true, value: '5/5 SENSORS ACTIVE' },

        velocityKmPerSec: { available: true, value: 38.2, unit: 'km/s' },
        distanceToDestinationKm: { available: true, value: 628000000, unit: 'KM' },
        altitudeKm: { available: true, value: 628000000, unit: 'KM' },
        trajectoryStatus: { available: true, value: 'JOVIAN ENCOUNTER TRAJECTORY' },
        orbitalRegime: { available: true, value: 'JOVIAN SYSTEM APPROACH' },

        systemWarnings: ['RADIATION SHIELDING OPERATING AT 88% CAPACITY'],
        missionReadinessPercent: { available: true, value: 95, unit: '%' },
        missionReadinessState: { available: true, value: 'HIGH RADIATION FLIGHT PROFILE' },
      },
      progress: {
        journeyProgressPercent: Math.round((days / 1200) * 100),
        currentPhase: 'JUPITER APPROACH',
        phaseProgressPercent: 45,
        completedObjectives: [
          {
            id: 'EUR_OBJ_1',
            title: 'Earth Gravity Assist Flyby',
            description: 'Execute resonance slingshot past Earth.',
            isMandatory: true,
            isCompleted: true,
            currentProgress: 1.0,
            conditionDescription: 'Slingshot velocity gain confirmed.',
          },
        ],
        pendingObjectives: [
          {
            id: 'EUR_OBJ_2',
            title: 'Jupiter Capture & Deceleration Burn',
            description: 'Retrograde burn into Jovian orbit.',
            isMandatory: true,
            isCompleted: false,
            currentProgress: 0.45,
            conditionDescription: 'Targeting closest approach in 48 days.',
          },
        ],
        remainingObjectives: [
          {
            id: 'EUR_OBJ_3',
            title: 'Europa Ice Plume Spectrometry',
            description: 'Fly through ice vent plumes and capture chemical spectra.',
            isMandatory: true,
            isCompleted: false,
            currentProgress: 0,
            conditionDescription: 'Scheduled at Europa close encounter #1.',
          },
        ],
        milestones: [
          {
            id: 'MS_E1',
            title: 'Launch & Departure',
            description: 'Escape Earth gravity well.',
            scheduledMetSeconds: 0,
            completedMetSeconds: 3600,
            state: MilestoneState.COMPLETED,
          },
          {
            id: 'MS_E2',
            title: 'Jupiter Capture',
            description: 'Deceleration burn into Jovian orbit.',
            scheduledMetSeconds: 86400 * 590,
            state: MilestoneState.IN_PROGRESS,
          },
        ],
      },
      scientificData: {
        totalDataCollectedMb: { available: true, value: 8900, unit: 'MB' },
        dataDownlinkedMb: { available: true, value: 7420, unit: 'MB' },
        activeSensorsCount: { available: true, value: 5 },
        primaryDiscoveries: [
          'Magnetosphere Wave Spectrum at 4.2 AU Recorded',
          'Solar Particle Flux Depletion Zone Documented',
        ],
      },
      recentEvents: [
        {
          id: 'EVT_E1',
          timestamp: Date.now() - 86400000 * 10,
          metSeconds: met - 86400 * 10,
          category: MissionEventCategory.SCIENCE,
          title: 'Radiation Counter Active',
          description: 'Dosimeter arrays initiated for Jovian magnetosphere mapping.',
          severity: 'NOTICE',
        },
      ],
      alerts: [
        {
          id: 'ALERT_E1',
          timestamp: Date.now() - 3600000 * 2,
          priority: AlertPriority.WARNING,
          subsystem: 'RADIATION_MONITOR',
          title: 'Radiation Flux Exceeds Deep Space Average',
          message: 'Approaching Jovian inner radiation belts. Instrument shielding active.',
          actionPrompt: 'Telemetry frequency to be prioritized during occultation.',
        },
      ],
      telemetryHistory: [],
      isSampleData: true,
    };
  }
}
