# Prompt 35 Technical Handoff: Planetary Base Construction and Management

## 1. Executive Summary

This document specifies the architecture, domain contracts, module models, power grid rules, construction flow, visual presentation, public APIs, and verification results for the **Planetary Base Construction and Management System** developed under **Prompt 35** for *INTERSTELLAR CONTINUUM*.

The planetary base system introduces a modular, scalable infrastructure framework that empowers the player's aerospace agency to establish permanent and semi-permanent research facilities at eligible planetary exploration destinations across the Solar System (including the Moon, Mars, Europa, Titan, and Ceres). Remote exploration locations are systematically transformed into productive scientific, manufacturing, and operational outposts requiring strategic planning, transportation payloads, power infrastructure, and maintenance logistics.

All game balance values are balanced educational abstractions without simulating real-world planetary engineering commands or hazardous instructions.

---

## 2. Architecture & File Ownership

All changes have been confined strictly to the dedicated planetary base domain module, its isolated UI components, tests, and documentation under feature branch `feature/p35-planetary-bases`.

### Directory Layout

```
src/bases/
├── BaseTypes.ts                     # Authoritative data contracts, enums & interfaces
├── BaseEvents.ts                    # Typed domain events & payload contracts
├── BaseEventBus.ts                  # Strongly typed event bus with core EventBus bridging
├── PlanetaryBaseManager.ts          # Central singleton manager & public APIs
├── index.ts                         # Public barrel export
├── modules/
│   ├── BaseModuleRegistry.ts        # Module definitions registry & upgrade calculus
│   └── DefaultBaseModules.ts        # Canonical authored module blueprints (7 categories + Hab Core)
├── locations/
│   ├── BaseLocationRegistry.ts      # Authored candidate landing sites & registry
│   └── DefaultBaseLocations.ts      # Locations (Moon, Mars, Europa, Titan, Ceres, etc.)
├── engines/
│   ├── PowerGridEngine.ts           # Power generation, solar scaling, batteries, load-shedding
│   ├── ConstructionEngine.ts        # Task allocation, slot management, tick progression, cancellation
│   └── MaintenanceEngine.ts         # Structural wear, environmental factors, overhaul recovery
├── adapters/
│   ├── ResourceEconomyAdapter.ts    # Non-duplicating adapter interfacing with EconomyService
│   ├── PayloadDeliveryAdapter.ts    # Interfacing with PayloadInventoryManager & PayloadRegistry
│   ├── EnvironmentAdapter.ts        # Interfacing with DestinationRegistry & planetary metrics
│   └── CommunicationsAdapter.ts     # Interfacing with CommunicationsNetworkManager
└── ui/
    ├── BaseSchematicVisualizer.ts   # 2D/2.5D visual base layout with depth, shadows & conduits
    └── PlanetaryBaseManagementView.ts # Multi-tab modal view for planetary base management

tests/bases/
├── PlanetaryBaseManager.test.ts     # 16 comprehensive integration & lifecycle tests
├── PowerGridEngine.test.ts          # 4 deterministic power grid, battery & brownout tests
├── BaseLocationAndEnvironment.test.ts # 6 location registry & suitability tests
└── BaseUI.test.ts                   # 6 isolated UI lifecycle & schematic map tests

docs/handoffs/
└── prompt-35.md                     # Authoritative handoff document
```

### Untouched Shared Modules (Protected Boundaries)
- Planetary environment generator: untouched.
- Rover system: untouched.
- Mission simulation core: untouched.
- Launch cinematic & sequence: untouched.
- Payload system & registry implementations: untouched (interfaced via `PayloadDeliveryAdapter`).
- Mission Control dashboard & operations: untouched.
- Communications network system: untouched (interfaced via `CommunicationsAdapter`).
- Scientific data system: untouched.
- Global economy implementation: untouched (interfaced via `ResourceEconomyAdapter`).
- Main entrypoint (`index.html`, `src/main.ts`): untouched.
- Root dependency manifest (`package.json`, `package-lock.json`): untouched.

---

## 3. Base Domain Models & Operational States

### 3.1 Base Framework (`BaseRecord`)
Each established base encapsulates:
- **Base Identifier (`id`):** Unique canonical identifier (e.g. `base_dest_moon_1794737297855`).
- **Base Name (`name`):** Player- or mission-defined name (e.g. "Artemis Outpost Alpha").
- **Destination (`destinationId`):** Celestial body binding (`DestinationId.MOON`, `DEST_MARS`, `DEST_EUROPA`, `DEST_TITAN`, `DEST_CERES`).
- **Location Identifier (`locationId`):** Candidate surface site ID (e.g. `loc_moon_shackleton`).
- **Establishment Date (`establishmentDate`):** Simulation timestamp of establishment.
- **Base Level (`baseLevel`):** Progression tier from 1 to 5.
- **Operational Status (`operationalStatus`):** Authoritative state machine status:
  - `PLANNED`: Blueprint conceived; awaiting deployment approval and payload deliveries.
  - `DEPLOYING`: Transport and landing phase underway.
  - `UNDER_CONSTRUCTION`: Initial habitats and power structures being erected.
  - `OPERATIONAL`: Base fully powered and operational.
  - `MAINTENANCE_REQUIRED`: Structural condition fallen below 50%; alerts active.
  - `LIMITED_OPERATION`: Severe condition degradation (<20%) or power deficit; non-critical modules degraded.
  - `INACTIVE`: Power fully depleted or base decommissioned.
- **Building Space & Slots:** Max slots, occupied slots, available slots, and expandable sectors.
- **Base Inventory (`inventory`):** Local stockpile of credits buffer, raw materials, processed materials, maintenance supplies, research samples, and life support consumables.
- **Storage Capacity (`storageCapacity`):** Base volume ceiling (expandable via Storage Facilities).
- **Power Grid Status (`powerStatus`):** Total generation, consumption draw, net balance, battery buffer units, and grid efficiency.
- **Communications Link (`communicationsStatus`):** Connection state, relay link type, signal fidelity percentage, bandwidth in Gbps, and latency in seconds.
- **Maintenance State (`maintenanceStatus`):** Overall condition (0-100%), wear rate per cycle, required supplies count, urgency level (`OPTIMAL`, `NORMAL`, `ATTENTION_NEEDED`, `CRITICAL`), and last maintenance date.
- **Installed Modules (`installedModules`):** Array of active modules with unique IDs, types, levels, health, power ratings, and output metrics.
- **Activity History (`activityHistory`):** Chronological log of construction, upgrades, logistics, and alerts.

---

## 4. Base Modules Supported

The system provides 8 canonical module blueprints across all 7 specified functional categories plus Habitation Core:

1. **Habitation Core (`HABITATION_CORE`):** Central pressurized command dome providing life support and agency telemetry.
2. **Research Station (`RESEARCH_STATION`):** Analytical laboratory nodes (Mk I & Mk II) generating science points and analyzing samples.
3. **Resource Processing Facility (`RESOURCE_PROCESSING`):** In-situ mineral refinery and volatiles synthesizer refining raw planetary regolith into structural materials.
4. **Communications Relay (`COMMUNICATIONS_RELAY`):** Surface parabolic telemetry dishes and optical laser terminals boosting base signal fidelity and registering surface relay nodes in the communications network.
5. **Power Facility (`POWER_FACILITY`):** Photovoltaic solar tracking arrays, compact shielded fission reactors, and regenerative fuel cell energy buffers.
6. **Manufacturing Facility (`MANUFACTURING_FACILITY`):** Automated laser-sintering 3D printing gantry fabricating structural modules and hardware kits.
7. **Maintenance Facility (`MAINTENANCE_FACILITY`):** Vehicle and equipment servicing bays providing automated diagnostic repairs and mitigating overall base wear by up to 60%.
8. **Storage Facility (`STORAGE_FACILITY`):** Logistics vaults and cryogenic depots boosting base storage capacity (+800 to +2,000 units).

### Extensibility
Third-party modules or mission-specific facilities can be registered at runtime via `PlanetaryBaseManager.registerBaseModule(def: BaseModuleDefinition)`.

---

## 5. Base Establishment & Environmental Suitability

The base establishment lifecycle enforces the 8-step workflow:
1. **Destination Identification:** `EnvironmentAdapter.isDestinationEligible(...)` validates that the target body is solid and non-gaseous (e.g. Moon, Mars, Europa, Titan, Ceres). Gas giants, stars, and orbital regimes are rejected.
2. **Location Selection:** `BaseLocationRegistry` queries authored candidate sites with coordinates, terrain characteristics, and resource abundance.
3. **Environmental Suitability Review:** `EnvironmentAdapter.evaluateLocation(...)` calculates a suitability score (0-100%), hazard rating (`LOW`, `MODERATE`, `HIGH`, `EXTREME`), solar efficiency factor (scaled by solar flux), resource richness multiplier, wear factor multiplier, and required structural protections.
4. **Module & Cargo Review:** Default initial kit (`mod_habitation_core_mk1`, `mod_power_solar_array_mk1`, supplies).
5. **Deployment Plan Preparation:** `createDeploymentPlan(...)` generates an authoritative `BaseDeploymentPlan` containing estimated duration, financial costs, material requirements, and payload checklists. Emits `BasePlanned`.
6. **Payload Assignment:** Verified against `PayloadDeliveryAdapter` to ensure required modules/kits are present in warehouse inventory or delivered.
7. **Plan Submission:** `submitDeploymentPlan(...)` deducts costs, stages payloads, and dispatches `BaseDeploymentStarted`.
8. **Establishment:** Installs initial modules, spins up the power grid and communications links, marks status `OPERATIONAL`, and dispatches `BaseEstablished`.

---

## 6. Construction and Expansion Engine

- **Slot Allocation:** Automatically finds open building slots or respects player-chosen slots within unlocked expansion sectors.
- **Requirements Checking:** Verifies credits and refined materials from base inventory first (or organization wallet fallback) and consumes corresponding payload items.
- **Progress Tracking:** Construction tasks update deterministically during `update(deltaTicks)`.
- **Cancellation & Refunds:** Tasks can be cancelled via `cancelConstruction(baseId, taskId)`, refunding 80% of spent credits and materials directly to base reserves. Dispatches `BaseConstructionCancelled`.
- **Base Expansion:** `expandBase(baseId)` unlocks additional sectors (`SECTOR_BETA`, `SECTOR_GAMMA`), increasing building space by +4 slots per tier up to Level 5. Dispatches `BaseExpanded`.
- **Module Upgrades:** `upgradeBaseModule(baseId, moduleId)` scales module level (1 to 5), increasing power generation, science output, processing throughput, and durability. Dispatches `BaseModuleUpgraded`.

---

## 7. Resource, Power, and Maintenance Management

### Power Grid Balance
- Total generation is computed across active solar arrays (modulated by solar efficiency), nuclear reactors, and fuel cells.
- Surplus power charges the battery buffer.
- Power deficits drain batteries; when depleted, `PowerGridEngine` executes deterministic load shedding in priority order:
  1. Manufacturing Facilities (shed first)
  2. Research Stations
  3. Resource Refineries
  4. Storage Vaults
  5. Communications Relays
  6. Maintenance Bays
  7. Habitation Cores (maintained longest)
- Modules in shed states degrade gracefully to `DEGRADED` rather than causing game failure, and recover automatically when power is restored.

### Maintenance & Anti-Trap Economy
- Harsh planetary conditions cause gradual structural wear.
- Maintenance bays mitigate wear rates.
- Degradation triggers warnings (`BaseMaintenanceRequired` at <60% condition).
- If condition drops below 20%, base transitions to `LIMITED_OPERATION` without catastrophic loss.
- Maintenance overhaul (`performBaseMaintenance`) can use local maintenance supplies or credits. Emergency credits recovery prevents the player from becoming permanently trapped in an unrecoverable deficit.

### Logistics Transfers
- `transferBaseResources(baseId, request)` safely transfers resources between base storage and the global agency wallet without duplicating credits or materials.

---

## 8. Visual Presentation

- **BaseSchematicVisualizer:** 2D/2.5D schematic tactical map displaying:
  - Ambient planetary terrain palettes (Lunar silver/grey, Martian ochre, Europan cyan ice, Titan amber, Ceres basalt).
  - Isometric foundation blocks with ground drop shadows.
  - Power conduit circuit lines connecting adjacent active modules.
  - Color-coded status beacons (green active, amber degraded, red offline).
  - Tier badges, health bars, and slot identifiers.
- **PlanetaryBaseManagementView:** Complete modal view with:
  - Header with destination badge, base level, and operational status.
  - Tab navigation: `OUTPOST OVERVIEW`, `CONSTRUCTION`, `FACILITIES`, `LOGISTICS & CARGO`, `ACTIVITY LOG`.
  - Comprehensive telemetry panels: Power Grid, Comms Telemetry, Structural Maintenance, and Operational Throughput.
  - Responsive layout built on Pixi.js, safe for headless execution in test environments.

---

## 9. Integration Contracts, Public API & Events

### Public API (`PlanetaryBaseManager`)

| Method | Signature | Description |
|---|---|---|
| `createBase` | `(config: CreateBaseConfig): BaseRecord` | Directly creates and establishes a planetary base. |
| `getBase` | `(baseId: string): BaseRecord \| undefined` | Retrieves a base by unique identifier. |
| `listBases` | `(): BaseRecord[]` | Lists all established planetary bases. |
| `evaluateBaseLocation` | `(destinationId: DestinationId, locationId: string): LocationSuitabilityEvaluation` | Evaluates environmental suitability. |
| `createDeploymentPlan` | `(planConfig: BaseDeploymentPlanConfig): BaseDeploymentPlan` | Prepares and validates a base deployment plan. |
| `submitDeploymentPlan` | `(planId: string): BaseRecord` | Approves and initiates deployment from plan. |
| `registerBaseModule` | `(moduleDef: BaseModuleDefinition): void` | Registers runtime module definitions. |
| `startConstruction` | `(baseId: string, moduleTypeId: string, slotIndex?: number): ConstructionTask` | Initiates module construction. |
| `cancelConstruction` | `(baseId: string, taskId: string): boolean` | Cancels construction and refunds materials. |
| `upgradeBaseModule` | `(baseId: string, moduleId: string): UpgradeResult` | Upgrades installed module to next tier. |
| `expandBase` | `(baseId: string): ExpansionResult` | Unlocks additional expansion sectors. |
| `performBaseMaintenance`| `(baseId: string, options?: MaintenanceOptions): MaintenanceResult` | Executes maintenance overhaul. |
| `transferBaseResources` | `(baseId: string, request: ResourceTransferRequest): ResourceTransferResult` | Deposits or withdraws resources. |
| `getBaseStatus` | `(baseId: string): BaseOperationalSummary` | Returns consolidated operational summary. |
| `update` | `(deltaTicks?: number): void` | Advances base simulation clock. |
| `saveState` / `loadState`| `(saveData: PlanetaryBasesSaveState): void` | Serializes and restores base state. |

### Domain Events

- `BasePlanned`: Dispatched when a deployment plan is created.
- `BaseDeploymentStarted`: Dispatched when deployment begins.
- `BaseEstablished`: Dispatched when base becomes operational.
- `ModuleConstructionStarted`: Dispatched when a module assembly task begins.
- `ModuleConstructionCompleted`: Dispatched when a module finishes construction.
- `BaseModuleUpgraded`: Dispatched when a module reaches a higher level.
- `BaseStatusChanged`: Dispatched when operational status changes.
- `BaseMaintenanceRequired`: Dispatched when condition falls below threshold.
- `BaseExpanded`: Dispatched when new expansion sectors are unlocked.
- `BasePowerStatusChanged`: Dispatched on power deficit or recovery.
- `BaseConstructionCancelled`: Dispatched when construction task is cancelled.

---

## 10. Verification and Test Results

32 comprehensive unit and integration tests were executed across 4 test suites:

- `tests/bases/PlanetaryBaseManager.test.ts` (16 tests) — Base creation, location evaluation, deployment planning, custom module registration, construction progress, cancellation refunds, module upgrades, sector expansion, resource transfers, storage limits, maintenance overhaul, operational summary, and save/load persistence.
- `tests/bases/PowerGridEngine.test.ts` (4 tests) — Net power generation, solar scaling by distance/flux, battery buffer charging/draining, and priority load-shedding during deficits.
- `tests/bases/BaseLocationAndEnvironment.test.ts` (6 tests) — Location candidate catalogue, destination eligibility filtering, environmental suitability calculations for Moon and Europa, and invalid destination handling.
- `tests/bases/BaseUI.test.ts` (6 tests) — Visualizer rendering across celestial body palettes, view container lifecycle, modal navigation through all 5 tabs, multi-base switching, and simulation updates.

### Combined Regression Run
Running `vitest run tests/bases tests/network tests/payload tests/services` confirmed:
- **18 Test Files Passed (18/18)**
- **125 Tests Passed (125/125)**
- **0 Failures, 0 Regressions**

---

## 11. Dependencies & Integration Notes

- **Zero New Dependencies:** Operates entirely on existing `pixi.js` rendering and core project architecture.
- **No Shared File Overwrites:** No modifications were made to global scene routers, mission simulations, or shared manifests.
- **Communications Integration:** `CommunicationsAdapter` automatically registers deployed surface relays into `CommunicationsNetworkManager` when available.
- **Payload Integration:** `PayloadDeliveryAdapter` coordinates module delivery with `PayloadInventoryManager` without circular dependencies.

---

## 12. Known Limitations & Future Extensibility

- Real-world atmospheric entry dynamics and fine-scale regolith mechanics are intentionally abstracted into game-balance ratings.
- Rover surface docking can be integrated in future phases through the `MAINTENANCE_FACILITY` hook.
