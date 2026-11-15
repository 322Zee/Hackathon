/**
 * INTERSTELLAR CONTINUUM - Mission Control & Telemetry Module
 * Public API exports for Mission Control dashboard, telemetry visualizations,
 * data-provider adapters, and integration contracts.
 */

// Core Dashboard & Tab Enum
export {
  MissionControlDashboard,
  DashboardTab,
  type MissionControlDashboardOptions,
} from './ui/MissionControlDashboard';

// Sub-components
export { MissionOverviewPanel, type MissionOverviewPanelOptions } from './ui/components/MissionOverviewPanel';
export { SpacecraftStatusPanel, type SpacecraftStatusPanelOptions } from './ui/components/SpacecraftStatusPanel';
export { MissionProgressPanel, type MissionProgressPanelOptions } from './ui/components/MissionProgressPanel';
export { TelemetryDisplayPanel, type TelemetryDisplayPanelOptions } from './ui/components/TelemetryDisplayPanel';
export { MissionEventLogPanel, type MissionEventLogPanelOptions } from './ui/components/MissionEventLogPanel';
export { MissionAlertsPanel, type MissionAlertsPanelOptions } from './ui/components/MissionAlertsPanel';
export { TelemetryGauge, type TelemetryGaugeOptions } from './ui/components/TelemetryGauge';
export { SignalStrengthMeter, type SignalStrengthMeterOptions } from './ui/components/SignalStrengthMeter';
export { MilestoneTracker, type MilestoneTrackerOptions } from './ui/components/MilestoneTracker';

// Data Provider Adapters & Contracts
export { type IMissionDataProvider } from './adapters/IMissionDataProvider';
export { LiveMissionDataProvider } from './adapters/LiveMissionDataProvider';
export { SampleMissionDataProvider } from './adapters/SampleMissionDataProvider';

// Strongly Typed Schemas
export {
  AlertPriority,
  MissionEventCategory,
  MilestoneState,
  type TelemetryValue,
  type MissionAlert,
  type MissionControlEvent,
  type MissionMilestone,
  type MissionControlObjective,
  type MissionOverviewData,
  type SpacecraftStatusTelemetry,
  type MissionProgressTelemetry,
  type ScientificDataSummary,
  type TelemetryHistoryPoint,
  type MissionTelemetrySnapshot,
} from './types/MissionControlTypes';
