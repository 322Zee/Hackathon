# Prompt 27 Handoff: Mission Simulation Core & Space-Time System

## 1. System Overview

The **Mission Simulation Core** is the authoritative simulation engine responsible for managing the logical execution of space missions in *INTERSTELLAR CONTINUUM* following initiation from the Launch Complex.

The system is architected as a pure, deterministic, and headless simulation pipeline independent of visual scenes and user interface components. It provides:
- Authoritative mission lifecycle state machine.
- Independent game-time clock with configurable time scaling and pause handling.
- Deterministic, frame-rate-independent fixed-step execution.
- Safe clamping against spiral-of-death under lag spikes or suspended browser tabs.
- Abstract, educational space travel progression model.
- Versioned, serializable mission snapshot generation and safe restoration.
- Strongly typed event subscription bus and backward-compatible EventBus forwarding.

---

## 2. Directory Structure & Files Created

```
src/simulation/
├── GameTimeSystem.ts            # Independent game-time engine, time-scaling, MET formatting
├── SpaceTravelSystem.ts         # Abstract travel progress, sub-phases, distance & arrival detection
├── MissionStateMachine.ts       # Lifecycle state machine, validation rules, pause retention
├── MissionSimulationEngine.ts   # Core simulation orchestrator & public API contract
├── MissionSimulationTypes.ts    # Enums, DTOs, configurations, snapshot & event schemas
├── OrbitalMechanics.ts          # Existing Keplerian & transfer math baseline (preserved)
└── index.ts                     # Module barrel export

tests/simulation/
├── GameTimeSystem.test.ts               # Unit tests for clock, scaling, MET, clamping
├── SpaceTravelSystem.test.ts            # Unit tests for travel progression, sub-phases, return trip
├── MissionStateMachine.test.ts          # Unit tests for transitions, barriers, pause retention
├── MissionSimulationEngine.test.ts      # Unit tests for public API, events, snapshots
├── MissionSimulationIntegration.test.ts # End-to-end integration and EventBus forwarding tests
└── OrbitalMechanics.test.ts             # Baseline orbital mechanics tests (preserved)
```

No shared baseline files, entrypoints, scene routers, or models were modified.

---

## 3. Architecture & Core Systems

### 3.1. Mission State Model (`SimulationMissionState`)
The state machine strictly validates all transitions against a directed lifecycle graph:
- `INACTIVE`: Uninitialized state.
- `PREPARING`: Mission initialized; parameters configured.
- `READY`: Flight readiness confirmed; awaiting launch authorization.
- `LAUNCHING`: Flight engines initiated; launch & ascent underway.
- `IN_TRANSIT`: Spacecraft in cruise between origin and destination.
- `ARRIVING`: Spacecraft executing destination approach and orbit insertion.
- `ACTIVE`: Primary destination mission operations (orbital survey, surface operations).
- `RETURNING`: Optional return voyage back to launch origin.
- `COMPLETED`: Terminal success state (immutable; requires all mandatory objectives met).
- `FAILED`: Terminal failure state (resets allowed via explicit retry procedures).
- `PAUSED`: Resumable state preserving `previousResumableState`.

#### State Transition Protections:
- **Mandatory Objective Barrier**: A mission cannot transition to `COMPLETED` unless all mandatory objectives have `isCompleted: true`.
- **Resumable State Retention**: When paused, the prior active state is retained and restored upon calling `resumeMission()`. Resuming to an arbitrary state is strictly rejected.
- **Terminal State Lock**: `COMPLETED` missions cannot continue progressing or transition to active states.
- **Duplicate Initialization Guard**: Calling `initializeMission` when an active mission is already initialized is rejected with clear error telemetry.

### 3.2. Game-Time System (`GameTimeSystem`)
- **Configurable Speed Multipliers**: Supports `1.0` (real-time), `2.0` (fast), `5.0` (rapid), `10.0` (very rapid), `50.0` (warp), `100.0` (max warp), or custom multipliers.
- **Frame-Rate Independence**: Accumulates delta real-world time and steps through deterministic fixed intervals (default `0.05s` / 20 Hz ticks).
- **Spiral-of-Death Protection**: Clamps frame deltas (`maxDeltaClamping: 5.0s`) and throttles maximum sub-steps per frame.
- **MET (Mission Elapsed Time)**: Computes formatted timestamp strings (e.g., `T+ 00d 02h 15m 30s`).

### 3.3. Space Travel Progression (`SpaceTravelSystem`)
- **Fictional & Educational Model**: Models space travel using abstract distance units and estimated durations without requiring actionable orbital navigation manuals.
- **Travel Sub-Phases**:
  - `DEPARTING`: 0% to 15% progress.
  - `CRUISING`: 15% to 85% progress.
  - `APPROACHING`: 85% to 99.9% progress.
  - `ARRIVED`: 100% progress (`isArrived = true`).
  - `RETURNING`: Inbound return transit.
  - `RETURNED`: Return touchdown at origin.
- **Round-Trip Capability**: Supports `initiateReturnJourney()` swapping origin/destination coordinates.

### 3.4. Mission Snapshots & Safe Restoration
- Versioned schema (`schemaVersion: 1`).
- Contains all required data for complete state recovery:
  - `missionId`, `instanceId`, `missionName`, `missionType`.
  - `originId`, `destinationId`.
  - `currentState`, `previousResumableState`, `currentPhase`.
  - `elapsedGameTime`, `totalRealTime`, `totalTicks`.
  - `travelProgress` (progress fraction, distance units, sub-phase).
  - `objectives` array with completion status and progress metrics.
  - `simulationSettings` (`timeScale`, `isPaused`, `fixedTimeStep`, `maxDeltaClamping`).
  - `failureReason`, `completedGameTime`, `createdAt`, `updatedAt`.
- Safe restoration validates schema version compatibility and integrity before reconstructing engine state.

---

## 4. Public API & Integration Contract

The `MissionSimulationEngine` exposes the following public API:

```typescript
// Initialization & Control
initializeMission(config: MissionSimulationConfig): MissionSimulationSnapshot;
startMission(): boolean;
pauseMission(reason?: string): boolean;
resumeMission(): boolean;
advanceSimulation(deltaSeconds: number): void;
reset(): void;

// State & Telemetry Accessors
getMissionState(): SimulationMissionState;
getMissionPhase(): SimulationMissionPhase;
getMissionSnapshot(): MissionSimulationSnapshot;
getTravelProgress(): TravelProgress;
getGameTimeState(): GameTimeState;
getObjectives(): SimulationObjective[];
getSimulationSpeed(): number;
setSimulationSpeed(scale: number): void;

// Objectives & Lifecycle Controls
completeObjective(objectiveId: string): boolean;
updateObjectiveProgress(objectiveId: string, currentProgress: number, autoComplete?: boolean): boolean;
completeMission(): boolean;
failMission(reason: string): boolean;
initiateReturnJourney(estimatedDurationSeconds?: number): boolean;

// Persistence
restoreFromSnapshot(snapshot: MissionSimulationSnapshot): boolean;

// Strongly Typed Event Subscriptions
subscribeToMissionEvents<E extends keyof SimulationEventMap>(
  event: E,
  handler: (payload: SimulationEventMap[E]) => void
): UnsubscribeFn;
```

### Event Notification Catalog

| Event Name | Payload Description |
| :--- | :--- |
| `MissionInitialized` | `{ missionId, instanceId, snapshot, timestamp }` |
| `MissionStarted` | `{ missionId, instanceId, state, phase, timestamp }` |
| `MissionPaused` | `{ missionId, instanceId, previousState, reason, timestamp }` |
| `MissionResumed` | `{ missionId, instanceId, resumedState, timestamp }` |
| `MissionPhaseChanged` | `{ missionId, instanceId, previousPhase, newPhase, state, timestamp }` |
| `MissionProgressUpdated` | `{ missionId, instanceId, progress, elapsedGameTime, formattedMET, travelProgress }` |
| `MissionArrived` | `{ missionId, instanceId, destinationId, elapsedGameTime, timestamp }` |
| `MissionCompleted` | `{ missionId, instanceId, elapsedGameTime, snapshot, timestamp }` |
| `MissionFailed` | `{ missionId, instanceId, reason, elapsedGameTime, snapshot, timestamp }` |
| `ObjectiveUpdated` | `{ missionId, objectiveId, isCompleted, currentProgress, targetValue }` |
| `SimulationSpeedChanged` | `{ timeScale, isPaused }` |

---

## 5. Verification & Test Results

All tests executed via Vitest across 99 test files (569 tests passing):

- `tests/simulation/GameTimeSystem.test.ts`: 9 tests passed.
- `tests/simulation/SpaceTravelSystem.test.ts`: 7 tests passed.
- `tests/simulation/MissionStateMachine.test.ts`: 8 tests passed.
- `tests/simulation/MissionSimulationEngine.test.ts`: 11 tests passed.
- `tests/simulation/MissionSimulationIntegration.test.ts`: 2 tests passed.
- `tests/simulation/OrbitalMechanics.test.ts`: 5 tests passed.
- Full suite: **99 passed (99), 569 passed (569), 0 failed.**

---

## 6. Downstream Integration Guide for Other Laptops

When downstream branches integrate with Prompt 27:
1. **Launch Complex (Laptop 26 / Launch Deployment)**:
   - Call `engine.initializeMission({...})` when configuring the deployment flight.
   - Upon completing launch operations (`DeploymentState.DEPLOYED`), call `engine.startMission()`.
2. **Mission Control UI (Laptop 28+)**:
   - Call `engine.subscribeToMissionEvents('MissionProgressUpdated', ...)` to render real-time telemetry, trajectory gauge, and MET clock.
   - Provide time warp buttons (`1x`, `2x`, `5x`, `10x`, `PAUSE`) wired to `setSimulationSpeed()` and `pauseMission() / resumeMission()`.
3. **Payload & Scientific Data Systems**:
   - Subscribe to `MissionArrived` to unlock sensor collection upon reaching target destination orbit/surface.
   - Call `engine.updateObjectiveProgress()` or `engine.completeObjective()` when scientific experiments conclude.
