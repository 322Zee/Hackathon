# Development Handoff: PROMPT 30 — Mission Control Dashboard & Telemetry Interface

## 1. Executive Summary

Prompt 30 created the **Mission Control Dashboard and Telemetry Presentation System** for **INTERSTELLAR CONTINUUM**, allowing the player to act as Mission Director overseeing interplanetary exploration missions from Organisation Headquarters.

The dashboard provides a tactile, dignified, and authentic aerospace command experience. It delivers real-time monitoring across 6 authoritative operational sections (Mission Overview, Spacecraft Subsystems, Mission Progress, Telemetry Presentation, Chronological Event Log, and Alerts/Anomalies) while maintaining complete architectural decoupling from unfinished backend modules.

---

## 2. Implemented Dashboard Sections

### Section A: Mission Overview
- **Mission Identification:** Mission Name, Short Designation Code (`[ARES-01]`, `[EUR-02]`), Destination Body (`Mars // Terrestrial Planet`), and Mission Category (`SCIENTIFIC EXPLORATION`, `TRANSPORTATION`, `COMBINED`).
- **Operational Status & Phase:** Multi-state lifecycle badge (`ACTIVE`, `PREPARING`, `READY`, `PAUSED`, `COMPLETED`, `FAILED`) with color-coded status LED, plus current flight phase indicator (`TRANS-MARS CRUISE & TRAJECTORY CORRECTION`).
- **Precision Clock Array:**
  - **Mission Elapsed Time (MET):** High-precision digital timer formatted as `T+ DDd HH:MM:SS`.
  - **Estimated Remaining Duration:** Formatted ETA and total planned mission duration in days.
- **Watermark Badge:** Displays `[DEMO MODE // PREVIEW ONLY]` banner when running in demonstration mode.

### Section B: Spacecraft Status
Structured into 6 aerospace subsystem cards with explicit available/unavailable telemetry states:
1. **Vehicle Condition & Structure:** Hull structural integrity percentage gauge (with nominal, warning, and critical zones), spacecraft classification, and thermal environment status (`NOMINAL // 284 K`).
2. **Electrical Power Subsystem (EPS):** Main battery reserve level gauge, solar array / radioisotope thermoelectric generator (RTG) power generation in Watts, bus power consumption draw in Watts, and active power distribution mode.
3. **Communications & RF Telemetry (RF/DSN):** 5-bar deep-space radio signal meter, signal-to-noise ratio in dBm, uplink and downlink rates in kbps, round-trip light time delay (seconds or minutes), tracking ground station (`DSN GOLDSTONE // DSS-14`), and carrier lock state.
4. **Payload & Scientific Instrumentation:** Payload classification, module structural health gauge, deployment/stowage status, net payload mass in kg, and operational sensor count.
5. **Flight Dynamics & Navigation (GNC):** Orbital/heliocentric velocity in km/s, distance to destination in km, altitude in km, trajectory status, and active orbital regime.
6. **System Readiness & Active Cautions:** Subsystems readiness percentage gauge and live caution list.

### Section C: Mission Progress
- **Trajectory Progress Track:** Visual horizontal progress meter with start/target body markers and completion percentage.
- **Milestone Pipeline (`MilestoneTracker`):** Sequential node pipeline displaying flight milestones (Terminal Launch, Trans-Mars Injection, Mid-Course Trajectory Correction, Orbital Capture, Entry/Descent/Landing) with state indicators (`COMPLETED` in green, `IN_PROGRESS` in cyan, `PENDING` in muted slate, `FAILED` in red).
- **Objectives Dossier:** Structured 3-column dossier categorizing mission objectives:
  - **Completed Objectives:** Green badges with completion confirmations and target values.
  - **In-Progress Objectives:** Cyan badges with live progress percentage bars.
  - **Remaining Objectives:** Amber badges outlining upcoming condition requirements.

### Section D: Telemetry Presentation
- **Orbital Trajectory & Flight Dynamics Canvas:**
  - 880×345 vector canvas depicting orbital departure body, transfer trajectory curve, active target encounter point, radar coordinate grid, and real-time spacecraft reticle.
  - Distinct unlinked rendering with radar crosshairs and `[TRAJECTORY TELEMETRY STREAM OFFLINE]` when flight dynamics feed is not connected.
- **Multi-Gauge Cluster:** Fast-glance gauges for Hull Health, Battery Reserve, Subsystem Readiness, and RF Signal Strength.
- **Historical Telemetry Trend Monitor:** Visual multi-point plot tracking EPS battery reserve and power consumption history over mission elapsed time.

### Section E: Event Log
- **Chronological Audit Trail:** Sequential event log with formatted MET timestamps (`T+...`), event category badges (`[LIFECYCLE]`, `[TRAJECTORY]`, `[COMMUNICATION]`, `[PAYLOAD]`, `[SCIENCE]`), and severity stripes (`NORMAL`, `NOTICE`, `CAUTION`, `CRITICAL`).
- **Interactive Controls:**
  - Category filter buttons (`ALL`, `LIFECYCLE`, `TRAJECTORY`, `COMMUNICATION`, `PAYLOAD`, `SCIENCE`).
  - Sort order toggle button: `SORT: NEWEST FIRST` vs `SORT: OLDEST FIRST`.
- **Event Audit Dossier:** Side inspection card providing full description, precise wall-clock ISO timestamp, MET seconds, and domain event payload details.

### Section F: Alerts & Anomaly Management
- **Three Sensible Priority Levels:**
  - `CRITICAL`: Immediate flight anomalies or mission failures (red accent, priority indicator).
  - `WARNING`: Subsystem margins, solar flare ionization, or missing pre-flight requirements (amber accent).
  - `INFO`: Routine downlinks, ground station handovers, and tracking acquisitions (cyan accent).
- **Calm Visual Design:** Steady, dignified border glows and badges without jarring or flashing animations.
- **Anomaly Directive Inspector:** Displays anomaly description, affected subsystem, priority level, and actionable Flight Director guidance directives.
- **Interactive Acknowledgement:** Interactive `[ACKNOWLEDGE & ARCHIVE]` action archiving alerts.

---

## 3. UI Components Created

| Component | File Path | Purpose |
| :--- | :--- | :--- |
| `MissionControlDashboard` | `src/mission-control/ui/MissionControlDashboard.ts` | Top-level full-screen command dashboard with mission selector, tab bar, empty state, and live/demo mode switcher. |
| `MissionOverviewPanel` | `src/mission-control/ui/components/MissionOverviewPanel.ts` | Section A: Mission identification, destination, status, and precision MET digital clock. |
| `SpacecraftStatusPanel` | `src/mission-control/ui/components/SpacecraftStatusPanel.ts` | Section B: 6-card subsystem layout monitoring vehicle condition, power, comms, payload, navigation, and cautions. |
| `MissionProgressPanel` | `src/mission-control/ui/components/MissionProgressPanel.ts` | Section C: Trajectory progress bar, milestone pipeline, and 3-column objectives dossier. |
| `TelemetryDisplayPanel` | `src/mission-control/ui/components/TelemetryDisplayPanel.ts` | Section D: 2D orbital transfer trajectory vector canvas, gauge cluster, and historical trend graph. |
| `MissionEventLogPanel` | `src/mission-control/ui/components/MissionEventLogPanel.ts` | Section E: Chronological event audit log with category filters, sort toggle, and detail inspector. |
| `MissionAlertsPanel` | `src/mission-control/ui/components/MissionAlertsPanel.ts` | Section F: Priority alert management console with directive guidance and acknowledgement action. |
| `TelemetryGauge` | `src/mission-control/ui/components/TelemetryGauge.ts` | Reusable tactical meter supporting nominal/warning/critical ranges and explicit unavailable states. |
| `SignalStrengthMeter` | `src/mission-control/ui/components/SignalStrengthMeter.ts` | 5-segment deep-space RF signal meter with dBm readout, round-trip delay, and carrier state. |
| `MilestoneTracker` | `src/mission-control/ui/components/MilestoneTracker.ts` | Sequential milestone pipeline node graph with execution MET and status indicators. |

---

## 4. Integration Contract & Data-Provider Architecture

The dashboard is completely decoupled from backend simulation engines via `IMissionDataProvider`.

```
┌────────────────────────────────────────────────────────┐
│               MissionControlDashboard                  │
│  (Overview, Spacecraft, Progress, Telemetry, Log, Alt) │
└──────────────────────────┬─────────────────────────────┘
                           │
                 IMissionDataProvider
              (Decoupled Interface Contract)
              ┌────────────┴────────────┐
              ▼                         ▼
   LiveMissionDataProvider    SampleMissionDataProvider
   - MissionLifecycleManager  - Non-persistent preview
   - MissionCatalogueRegistry - Ares-I Mars Surveyor
   - DestinationRegistry      - Europa-Discovery Probe
   - LaunchDeploymentManager  - Complete telemetry feeds
   - Unlinked feeds marked N/A
```

### Decoupled Interface Contract (`src/mission-control/adapters/IMissionDataProvider.ts`)
```typescript
export interface IMissionDataProvider {
  readonly isDemoProvider: boolean;
  getActiveMissions(): MissionOverviewData[];
  getMissionSnapshot(instanceId: string): MissionTelemetrySnapshot | null;
  subscribeToSnapshot(instanceId: string, listener: (snapshot: MissionTelemetrySnapshot) => void): () => void;
  subscribeToEvents(instanceId: string, listener: (event: MissionControlEvent) => void): () => void;
  subscribeToAlerts(instanceId: string, listener: (alert: MissionAlert) => void): () => void;
  dismissAlert(instanceId: string, alertId: string): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}
```

### Unavailable Telemetry Contract (`TelemetryValue<T>`)
To strictly prevent inventing operational values, all telemetry values implement:
```typescript
export interface TelemetryValue<T> {
  readonly available: boolean;
  readonly value?: T;
  readonly unit?: string;
  readonly statusText?: string;
  readonly isWarning?: boolean;
  readonly isCritical?: boolean;
}
```
When a simulation feed is unlinked, `available` is `false`, and the UI renders `N/A` with status `[FEED UNLINKED]`. **Zero values are never used to represent unavailable data.**

---

## 5. Integration Requirements for Other Teams / Parallel Modules

When parallel laptops finish developing the underlying systems, they can connect to `LiveMissionDataProvider` by implementing the following exact contracts:

### 1. Mission Simulation Core
- **Trajectory & Kinematics:**
  - `velocityKmPerSec`: number (e.g. `26.4` km/s)
  - `distanceToDestinationKm`: number (e.g. `48,200,000` km)
  - `altitudeKm`: number
  - `trajectoryStatus`: string (e.g. `'HELIOCENTRIC TRANSFER ARC'`, `'ORBITAL CAPTURE'`)
  - `currentOrbitalRegime`: string (e.g. `'LOW MARS ORBIT 350 KM'`)
- **Vehicle Structural Integrity:**
  - `vehicleConditionPercent`: number (0 to 100)
  - `thermalStatus`: string (e.g. `'NOMINAL // 284 K'`)
  - `temperatureKelvin`: number
- **Electrical Power System (EPS):**
  - `batteryPercent`: number (0 to 100)
  - `powerGenerationWatts`: number (e.g. `1450` W)
  - `powerDrawWatts`: number (e.g. `780` W)
  - `powerSystemState`: string (e.g. `'SOLAR TRACE ACTIVE'`)

### 2. Communications Network (Ground & Deep Space Network)
- **Carrier & Signal Metrics:**
  - `signalStrengthPercent`: number (0 to 100)
  - `signalDbm`: number (e.g. `-94.2` dBm)
  - `uplinkRateKbps`: number (e.g. `16.0` kbps)
  - `downlinkRateKbps`: number (e.g. `256.0` kbps)
  - `roundTripDelaySeconds`: number (light-speed latency in seconds)
  - `activeGroundStation`: string (e.g. `'DSN GOLDSTONE // DSS-14'`, `'DSN CANBERRA // DSS-43'`)
  - `commsState`: string (e.g. `'X-BAND CARRIER LOCKED'`)

### 3. Payload System
- **Payload Health & Deployment:**
  - `payloadHealthPercent`: number (0 to 100)
  - `payloadDeployed`: boolean
  - `payloadInstrumentsActive`: string (e.g. `'4/4 SENSORS READY'`)

### 4. Scientific Data System
- **Science Collection Metrics:**
  - `totalDataCollectedMb`: number (e.g. `1420` MB)
  - `dataDownlinkedMb`: number (e.g. `1398` MB)
  - `activeSensorsCount`: number (e.g. `4`)
  - `primaryDiscoveries`: string[] (e.g. `['Solar Wind Density Anomaly at 1.15 AU']`)

---

## 6. Demonstration Mode Isolation

`SampleMissionDataProvider` provides a preview mode for demonstration and testing:
- **Sample Missions:**
  - `DEMO_ARES_SURVEYOR`: Mars Atmospheric Surveyor (`SAMPLE_ARES_01`) at MET T+42d.
  - `DEMO_EUROPA_DISCOVERY`: Jovian Subsurface Surveyor (`SAMPLE_EUROPA_02`) at MET T+540d.
- **Isolation Guarantee:**
  - All snapshots have `isSampleData: true`.
  - Does NOT read from or write to `MissionLifecycleManager`, `SaveService`, or local storage.
  - Player progression and persistent state are 100% unaffected by demo mode usage.

---

## 7. Automated Testing & Verification Metrics

- **Total Test Suites in Project:** 99 test suites (all 99 passed, 100% pass rate).
- **Total Unit Tests in Project:** 560 tests (all 560 passed, 100% pass rate).
- **New Test Files Created:**
  1. `tests/mission-control/LiveMissionDataProvider.test.ts` (6 tests)
  2. `tests/mission-control/SampleMissionDataProvider.test.ts` (5 tests)
  3. `tests/mission-control/TelemetryPanelsAndGauges.test.ts` (5 tests)
  4. `tests/mission-control/MissionAlertsAndEvents.test.ts` (6 tests)
  5. `tests/mission-control/MissionControlDashboard.test.ts` (7 tests)
- **Production Build:** `tsc && vite build` compiled 943 modules with **0 errors**.

---

## 8. File Ownership & Repository Compliance

The implementation strictly respects file ownership boundaries:
- **No changes** made to `src/main.ts` (main entrypoint).
- **No changes** made to `src/scenes/SceneManager.ts` (global router).
- **No changes** made to `src/simulation/*` (simulation core).
- **No changes** made to `src/engineering/builder/*` (rocket builder).
- **No changes** made to `src/cinematics/*` (launch cinematics).
- **No changes** made to `package.json` or `package-lock.json` (dependency manifests).
- All changes are strictly isolated to `src/mission-control/**`, `tests/mission-control/**`, and `docs/handoffs/prompt-30.md`.
