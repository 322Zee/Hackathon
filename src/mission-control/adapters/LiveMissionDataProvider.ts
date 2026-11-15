/**
 * INTERSTELLAR CONTINUUM - Live Mission Data Provider
 * Connects the Mission Control UI to the real game systems:
 * MissionLifecycleManager, MissionCatalogueRegistry, DestinationRegistry,
 * LaunchDeploymentManager, and EventBus.
 *
 * NOTE: For systems not yet implemented on other laptops (Mission Simulation Core,
 * Communications Network, Payload Bus, Science Core), this provider strictly flags
 * values as { available: false, statusText: 'UNAVAILABLE' } rather than fabricating
 * fictional operational telemetry.
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
  TelemetryValue,
} from '../types/MissionControlTypes';
import { MissionLifecycleManager } from '../../missions/MissionLifecycleManager';
import { MissionCatalogueRegistry } from '../../missions/MissionCatalogueRegistry';
import { DestinationRegistry } from '../../destinations/DestinationRegistry';
import {
  MissionInstance,
  MissionLifecycleState,
  MissionHistoryEventType,
  TrackedObjectiveState,
} from '../../missions/MissionLifecycleTypes';
import { MissionDefinition } from '../../missions/MissionTypes';
import { EventBus, EventSubscription } from '../../core/EventBus';
import { ServiceLocator } from '../../core/ServiceLocator';

export class LiveMissionDataProvider implements IMissionDataProvider {
  public readonly isDemoProvider = false;

  private lifecycleManager: MissionLifecycleManager;
  private catalogueRegistry: MissionCatalogueRegistry;
  private destinationRegistry: DestinationRegistry;
  private eventBus?: EventBus;

  private snapshotListeners: Map<string, Set<(snapshot: MissionTelemetrySnapshot) => void>> = new Map();
  private eventListeners: Map<string, Set<(event: MissionControlEvent) => void>> = new Map();
  private alertListeners: Map<string, Set<(alert: MissionAlert) => void>> = new Map();

  private dismissedAlertIds: Set<string> = new Set();
  private eventSubscriptions: EventSubscription[] = [];

  constructor(eventBus?: EventBus) {
    this.lifecycleManager = MissionLifecycleManager.getInstance();
    this.catalogueRegistry = MissionCatalogueRegistry.getInstance();
    this.destinationRegistry = DestinationRegistry.getInstance();

    if (eventBus) {
      this.eventBus = eventBus;
    } else if (ServiceLocator.has('EventBus')) {
      this.eventBus = ServiceLocator.get<EventBus>('EventBus');
    }

    this.wireDomainEvents();
  }

  private wireDomainEvents(): void {
    if (!this.eventBus) return;

    const onMissionEvent = (payload: any) => {
      const instanceId = payload?.instanceId;
      if (instanceId && this.snapshotListeners.has(instanceId)) {
        const snapshot = this.getMissionSnapshot(instanceId);
        if (snapshot) {
          this.notifySnapshot(instanceId, snapshot);
        }
      }
    };

    const eventsToListen = [
      'mission:accepted',
      'mission:state_changed',
      'mission:objective_completed',
      'mission:completed',
      'mission:failed',
      'mission:cancelled',
      'deployment:scheduled',
      'deployment:completed',
      'deployment:aborted',
    ];

    for (const evt of eventsToListen) {
      const sub = this.eventBus.on(evt as any, onMissionEvent);
      if (sub) {
        this.eventSubscriptions.push(sub);
      }
    }
  }

  public getActiveMissions(): MissionOverviewData[] {
    const instances = this.lifecycleManager.getAllInstances();
    const activeInstances = instances.filter((inst) => {
      return (
        inst.status === MissionLifecycleState.ACCEPTED ||
        inst.status === MissionLifecycleState.PREPARING ||
        inst.status === MissionLifecycleState.READY_FOR_VALIDATION ||
        inst.status === MissionLifecycleState.READY ||
        inst.status === MissionLifecycleState.ACTIVE ||
        inst.status === MissionLifecycleState.PAUSED
      );
    });

    return activeInstances.map((inst) => {
      const def = this.catalogueRegistry.getMissionById(inst.missionId);
      return this.buildOverviewData(inst, def);
    });
  }

  public getMissionSnapshot(instanceId: string): MissionTelemetrySnapshot | null {
    const instance = this.lifecycleManager.getInstance(instanceId);
    if (!instance) return null;

    const def = this.catalogueRegistry.getMissionById(instance.missionId);
    if (!def) return null;

    const overview = this.buildOverviewData(instance, def);
    const spacecraft = this.buildSpacecraftTelemetry(instance, def);
    const progress = this.buildProgressTelemetry(instance, def);
    const scientificData = this.buildScientificDataSummary();
    const recentEvents = this.buildEvents(instance);
    const alerts = this.buildAlerts(instance, def);

    return {
      overview,
      spacecraft,
      progress,
      scientificData,
      recentEvents,
      alerts,
      telemetryHistory: [], // Real telemetry history requires Simulation Core recording
      isSampleData: false,
    };
  }

  public subscribeToSnapshot(
    instanceId: string,
    listener: (snapshot: MissionTelemetrySnapshot) => void
  ): () => void {
    if (!this.snapshotListeners.has(instanceId)) {
      this.snapshotListeners.set(instanceId, new Set());
    }
    this.snapshotListeners.get(instanceId)!.add(listener);

    // Initial dispatch
    const current = this.getMissionSnapshot(instanceId);
    if (current) {
      listener(current);
    }

    return () => {
      const set = this.snapshotListeners.get(instanceId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.snapshotListeners.delete(instanceId);
        }
      }
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
      const set = this.eventListeners.get(instanceId);
      if (set) {
        set.delete(listener);
      }
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
      const set = this.alertListeners.get(instanceId);
      if (set) {
        set.delete(listener);
      }
    };
  }

  public dismissAlert(_instanceId: string, alertId: string): void {
    this.dismissedAlertIds.add(alertId);
  }

  public update(_deltaSeconds: number): void {
    // Live polling / event triggers if needed
  }

  public dispose(): void {
    for (const sub of this.eventSubscriptions) {
      try {
        sub.unsubscribe();
      } catch {
        // Safe disposal
      }
    }
    this.eventSubscriptions = [];
    this.snapshotListeners.clear();
    this.eventListeners.clear();
    this.alertListeners.clear();
    this.dismissedAlertIds.clear();
  }

  private notifySnapshot(instanceId: string, snapshot: MissionTelemetrySnapshot): void {
    const listeners = this.snapshotListeners.get(instanceId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(snapshot);
        } catch {
          // Guard against listener failure
        }
      }
    }
  }

  // Helper builders
  private buildOverviewData(instance: MissionInstance, def?: MissionDefinition): MissionOverviewData {
    const dest = this.destinationRegistry.getDestination(instance.destinationId);
    const now = Date.now();
    const metSeconds = Math.max(0, Math.floor((now - instance.acceptedTimestamp) / 1000));
    const estimatedDurationDays = def?.estimatedDurationDays ?? 30;
    const estimatedTotalSeconds = estimatedDurationDays * 86400;
    const estimatedRemainingSeconds = Math.max(0, estimatedTotalSeconds - metSeconds);

    let phaseName = 'PRE-LAUNCH PREPARATION';
    switch (instance.status) {
      case MissionLifecycleState.ACCEPTED:
      case MissionLifecycleState.PREPARING:
        phaseName = 'VEHICLE INTEGRATION & CHECKOUT';
        break;
      case MissionLifecycleState.READY_FOR_VALIDATION:
      case MissionLifecycleState.READY:
        phaseName = 'PRE-LAUNCH COUNTDOWN READINESS';
        break;
      case MissionLifecycleState.ACTIVE:
        phaseName = 'ACTIVE FLIGHT OPERATIONS';
        break;
      case MissionLifecycleState.PAUSED:
        phaseName = 'FLIGHT HOLD / ANOMALY INVESTIGATION';
        break;
      case MissionLifecycleState.COMPLETED:
        phaseName = 'MISSION OBJECTIVES ACHIEVED';
        break;
      case MissionLifecycleState.FAILED:
        phaseName = 'MISSION TERMINATED / ANOMALY';
        break;
      default:
        phaseName = 'STANDBY';
        break;
    }

    return {
      missionId: def?.id ?? instance.missionId,
      instanceId: instance.instanceId,
      name: def?.name ?? instance.missionId,
      shortCode: def?.shortCode ?? instance.missionId.substring(0, 8),
      destinationId: instance.destinationId,
      destinationName: dest?.name ?? instance.destinationId,
      destinationType: dest?.category,
      category: def?.category ?? (instance as any).category,
      stageType: def?.stageType ?? (instance as any).stageType,
      status: instance.status,
      currentPhase: phaseName,
      metSeconds,
      estimatedDurationDays,
      estimatedRemainingSeconds,
      launchTimestamp: instance.acceptedTimestamp,
      isSampleData: false,
    };
  }

  private buildSpacecraftTelemetry(
    instance: MissionInstance,
    def: MissionDefinition
  ): any {
    const prep = instance.preparation;
    const mandatoryTasks = prep?.tasks?.filter((t) => t.required) ?? [];
    const configuredTasks = mandatoryTasks.filter((t) => t.status === 'CONFIGURED');
    const readinessPercent =
      mandatoryTasks.length > 0
        ? Math.round((configuredTasks.length / mandatoryTasks.length) * 100)
        : 0;

    const unavailable = <T>(statusText: string): TelemetryValue<T> => ({
      available: false,
      statusText,
    });

    const targetOrbitStr = def.engineeringRequirements.targetOrbit
      ? `${def.engineeringRequirements.targetOrbit.altitudeKmMin}-${def.engineeringRequirements.targetOrbit.altitudeKmMax} KM`
      : 'SURFACE TARGET';

    return {
      vehicleName: instance.rocketConfigRef
        ? { available: true, value: instance.rocketConfigRef }
        : unavailable('NO VEHICLE DESIGNATION'),
      spacecraftType: {
        available: true,
        value: def.engineeringRequirements.spacecraftType,
      },
      vehicleConditionPercent: unavailable('UNLINKED [SIM CORE REQUIRED]'),
      thermalStatus: unavailable('THERMAL SENSORS UNLINKED'),
      temperatureKelvin: unavailable('N/A'),

      // Power
      batteryPercent: unavailable('BATTERY TELEMETRY UNLINKED'),
      powerGenerationWatts: unavailable('SOLAR/RTG SENSOR UNLINKED'),
      powerDrawWatts: unavailable('POWER BUS UNMONITORED'),
      powerSystemState: unavailable('NO POWER FEED'),

      // Communication
      signalStrengthPercent: unavailable('GROUND STATION UNLINKED'),
      signalDbm: unavailable('NO RF CARRIER'),
      uplinkRateKbps: unavailable('UPLINK DISCONNECTED'),
      downlinkRateKbps: unavailable('DOWNLINK DISCONNECTED'),
      roundTripDelaySeconds: unavailable('DELAY UNKNOWN'),
      activeGroundStation: unavailable('NO ACTIVE LINK'),
      commsState: unavailable('TELEMETRY CARRIER LOST / NOT IN TRANSIT'),

      // Payload
      payloadType: {
        available: true,
        value: def.engineeringRequirements.payloadType,
      },
      payloadHealthPercent: unavailable('PAYLOAD HEALTH UNLINKED'),
      payloadDeployed: unavailable('STATUS UNKNOWN'),
      payloadMassKg: {
        available: true,
        value: def.engineeringRequirements.minPayloadMassKg,
        unit: 'KG',
      },
      payloadInstrumentsActive: {
        available: true,
        value: `${def.engineeringRequirements.requiredInstruments.length} REQUIRED`,
      },

      // Navigation
      velocityKmPerSec: unavailable('RADAR OFFLINE'),
      distanceToDestinationKm: unavailable('RANGE METRIC UNLINKED'),
      altitudeKm: unavailable('ALTIMETRY UNLINKED'),
      trajectoryStatus: {
        available: true,
        value:
          instance.status === MissionLifecycleState.ACTIVE
            ? 'IN PROGRESS [ESTIMATED]'
            : 'PRE-LAUNCH STANDBY',
      },
      orbitalRegime: {
        available: true,
        value: targetOrbitStr,
      },

      // System Warnings & Readiness
      systemWarnings: prep?.validationErrors ?? [],
      missionReadinessPercent: {
        available: true,
        value: readinessPercent,
        unit: '%',
      },
      missionReadinessState:
        readinessPercent === 100 ? 'READY FOR FLIGHT' : 'CONFIGURATION INCOMPLETE',
    };
  }

  private buildProgressTelemetry(
    instance: MissionInstance,
    def: MissionDefinition
  ): any {
    const objectives = instance.objectives ?? [];
    const completed = objectives.filter((o) => o.isCompleted);
    const inProgress = objectives.filter((o) => !o.isCompleted && o.currentProgress > 0);
    const remaining = objectives.filter((o) => !o.isCompleted && o.currentProgress === 0);

    const journeyPercent =
      objectives.length > 0
        ? Math.round((completed.length / objectives.length) * 100)
        : 0;

    const mapObjective = (o: TrackedObjectiveState): MissionControlObjective => ({
      id: o.id,
      title: o.title,
      description: o.description,
      isMandatory: o.isMandatory,
      isCompleted: o.isCompleted,
      currentProgress: o.currentProgress,
      targetValue: o.targetValue,
      conditionDescription: o.conditionDescription,
    });

    const milestones: MissionMilestone[] = [
      {
        id: 'MS_ACCEPTED',
        title: 'Mission Authorized',
        description: 'Agency authorization and mission budget allocated.',
        scheduledMetSeconds: 0,
        completedMetSeconds: 0,
        state: MilestoneState.COMPLETED,
      },
      {
        id: 'MS_VEHICLE_PREP',
        title: 'Vehicle & Payload Integration',
        description: 'Flight hardware assembled and validated.',
        scheduledMetSeconds: 3600,
        completedMetSeconds:
          instance.preparation?.isAllMandatoryConfigured ? 3600 : undefined,
        state: instance.preparation?.isAllMandatoryConfigured
          ? MilestoneState.COMPLETED
          : MilestoneState.IN_PROGRESS,
      },
      {
        id: 'MS_LAUNCH',
        title: 'Launch & Atmospheric Ascent',
        description: 'Terminal countdown and atmospheric departure.',
        scheduledMetSeconds: 86400,
        state:
          instance.status === MissionLifecycleState.ACTIVE ||
          instance.status === MissionLifecycleState.COMPLETED
            ? MilestoneState.COMPLETED
            : MilestoneState.PENDING,
      },
      {
        id: 'MS_TRANSIT',
        title: 'Orbital Insertion / Cruise',
        description: 'Transit to target body regime.',
        scheduledMetSeconds: 86400 * 5,
        state:
          instance.status === MissionLifecycleState.ACTIVE
            ? MilestoneState.IN_PROGRESS
            : instance.status === MissionLifecycleState.COMPLETED
            ? MilestoneState.COMPLETED
            : MilestoneState.PENDING,
      },
      {
        id: 'MS_OBJECTIVES',
        title: 'Primary Objectives Execution',
        description: 'Payload delivery and scientific survey.',
        scheduledMetSeconds: (def.estimatedDurationDays ?? 30) * 86400,
        state:
          instance.status === MissionLifecycleState.COMPLETED
            ? MilestoneState.COMPLETED
            : MilestoneState.PENDING,
      },
    ];

    return {
      journeyProgressPercent: journeyPercent,
      currentPhase:
        instance.status === MissionLifecycleState.ACTIVE
          ? 'FLIGHT OPERATIONS'
          : 'PRE-FLIGHT PREPARATION',
      phaseProgressPercent: journeyPercent,
      completedObjectives: completed.map(mapObjective),
      pendingObjectives: inProgress.map(mapObjective),
      remainingObjectives: remaining.map(mapObjective),
      milestones,
    };
  }

  private buildScientificDataSummary(): any {
    return {
      totalDataCollectedMb: {
        available: false,
        statusText: 'SCIENCE CORE UNLINKED',
      },
      dataDownlinkedMb: {
        available: false,
        statusText: 'UNAVAILABLE',
      },
      activeSensorsCount: {
        available: false,
        statusText: 'UNAVAILABLE',
      },
      primaryDiscoveries: [],
    };
  }

  private buildEvents(instance: MissionInstance): MissionControlEvent[] {
    const rawEvents = instance.history ?? [];
    return rawEvents.map((evt) => {
      const category = MissionEventCategory.LIFECYCLE;
      let severity: 'NORMAL' | 'NOTICE' | 'CAUTION' | 'CRITICAL' = 'NORMAL';

      if (
        evt.type === MissionHistoryEventType.VALIDATION_FAILED ||
        evt.type === MissionHistoryEventType.MISSION_FAILED
      ) {
        severity = 'CRITICAL';
      } else if (
        evt.type === MissionHistoryEventType.MISSION_PAUSED ||
        evt.type === MissionHistoryEventType.MISSION_CANCELLED
      ) {
        severity = 'CAUTION';
      } else if (evt.type === MissionHistoryEventType.OBJECTIVE_COMPLETED) {
        severity = 'NOTICE';
      }

      const metSeconds = Math.max(
        0,
        Math.floor((evt.timestamp - instance.acceptedTimestamp) / 1000)
      );

      return {
        id: evt.id,
        timestamp: evt.timestamp,
        metSeconds,
        category,
        title: evt.type ? String(evt.type).replace(/_/g, ' ') : 'MISSION EVENT',
        description: evt.summary ?? '',
        severity,
        details: evt.details,
      };
    });
  }

  private buildAlerts(
    instance: MissionInstance,
    _def: MissionDefinition
  ): MissionAlert[] {
    const alerts: MissionAlert[] = [];

    // Check preparation errors
    if (instance.preparation?.validationErrors) {
      for (let i = 0; i < instance.preparation.validationErrors.length; i++) {
        const errorMsg = instance.preparation.validationErrors[i];
        if (!errorMsg) continue;
        const alertId = `ALERT_PREP_${instance.instanceId}_${i}`;
        if (!this.dismissedAlertIds.has(alertId)) {
          alerts.push({
            id: alertId,
            timestamp: instance.preparation.lastValidatedTimestamp ?? Date.now(),
            priority: AlertPriority.WARNING,
            subsystem: 'FLIGHT_PREPARATION',
            title: 'Pre-Flight Requirement Unfulfilled',
            message: errorMsg,
            actionPrompt: 'Review vehicle configuration in Rocket Engineering or Payload Lab.',
          });
        }
      }
    }

    // Check mission state alerts
    if (instance.status === MissionLifecycleState.FAILED) {
      const alertId = `ALERT_FAILED_${instance.instanceId}`;
      if (!this.dismissedAlertIds.has(alertId)) {
        alerts.push({
          id: alertId,
          timestamp: instance.failureInfo?.timestamp ?? Date.now(),
          priority: AlertPriority.CRITICAL,
          subsystem: 'MISSION_LIFECYCLE',
          title: 'Mission Failure Declared',
          message: instance.failureInfo?.reason ?? 'An unrecoverable flight anomaly occurred.',
          actionPrompt: 'Consult Flight Director for post-incident review and mission reset.',
        });
      }
    } else if (instance.status === MissionLifecycleState.PAUSED) {
      const alertId = `ALERT_HOLD_${instance.instanceId}`;
      if (!this.dismissedAlertIds.has(alertId)) {
        alerts.push({
          id: alertId,
          timestamp: Date.now(),
          priority: AlertPriority.WARNING,
          subsystem: 'FLIGHT_DYNAMICS',
          title: 'Operational Flight Hold Active',
          message: 'Telemetry downlink or sequence paused by Mission Director.',
          actionPrompt: 'Resume operations when nominal flight conditions are restored.',
        });
      }
    }

    // Default info alert
    const infoId = `ALERT_INFO_${instance.instanceId}`;
    if (!this.dismissedAlertIds.has(infoId)) {
      alerts.push({
        id: infoId,
        timestamp: instance.acceptedTimestamp,
        priority: AlertPriority.INFO,
        subsystem: 'TELEMETRY_LINK',
        title: 'Mission Control Station Connected',
        message: `Command telemetry monitoring active for ${instance.missionId}. Waiting for simulation core live stream.`,
      });
    }

    return alerts;
  }
}
