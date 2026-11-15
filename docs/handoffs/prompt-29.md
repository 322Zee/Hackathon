# Handoff Documentation: Prompt 29 — Payload Registry and Transportation Mission System

## 1. Domain Overview & Purpose
The **Payload Registry and Transportation Mission System** establishes the authoritative cargo logistics, payload mounting, capacity balancing, inventory state tracking, and mission delivery domain for **INTERSTELLAR CONTINUUM**.

This module allows players and simulation systems to:
- Browse, inspect, and procure payloads across 11+ extensible categories.
- Track cargo across 7 lifecycle delivery states (`AVAILABLE`, `RESERVED`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `RETURNED`, `LOST`) with strict transactional integrity and anti-duplication guarantees.
- Mount and balance multi-payload manifests onto launch vehicles and spacecraft platforms with real-time feedback on mass ratings, power demand, storage slot volume, and fairing clearance.
- Execute data-driven transportation missions supporting multi-payload manifests and combined missions where payload delivery is followed by autonomous planetary exploration phases (e.g. rover traversals and core drilling).

---

## 2. Payload Categories Supported
The system implements all 11 canonical categories mandated by Prompt 29 via `PayloadCategoryRegistry`, plus an open extension mechanism permitting future mods, DLCs, and expansions to register new categories dynamically at runtime without codebase modification:

1. **Communication Satellites (`COMMUNICATION_SATELLITES`):** Orbital transponders and phased arrays providing telemetry relays (e.g., Pioneer Orbital Transponder, Chronos High-Bandwidth Array).
2. **Observation Satellites (`OBSERVATION_SATELLITES`):** Multispectral imaging platforms and heliospheric monitors (e.g., TerraScan Multispectral Surveyor, Helios Solar Sentinel).
3. **Scientific Instruments (`SCIENTIFIC_INSTRUMENTS`):** Planetary detectors and spectrometers (e.g., Gamma-Ray & Neutron Spectrometer, Hyperion Deep-Radar Sounder, Exobiology Gas Chromatograph).
4. **Robotic Rovers (`ROBOTIC_ROVERS`):** Surface exploration rovers (e.g., Pathfinder Reconnaissance Rover, Titan Heavy Science Rover, Boreas Cryo-Drill Rover).
5. **Landing Equipment (`LANDING_EQUIPMENT`):** Atmospheric entry and soft-touchdown hardware (e.g., AeroBrake Thermal Aeroshell, Pulsed SkyCrane Descent Stage, Terrain Relative Navigation Lidar).
6. **Research Station Modules (`RESEARCH_STATION_MODULES`):** Pressurized orbital and surface laboratories (e.g., Microgravity BioLab Habitat Node, Closed-Loop Hydroponics Pod, Zero-G Crystallography Chamber).
7. **Power Modules (`POWER_MODULES`):** Energy generation and storage units (e.g., Kilopower FSP-10 Surface Fission Unit, PVA-X Photovoltaic Wing, High-Density Regenerative Fuel Cell).
8. **Communications Relay Modules (`COMMUNICATIONS_RELAY_MODULES`):** Long-range transceivers (e.g., Deep-Space Laser Optical Transceiver, Lagrange Halo Relay Buoy).
9. **Manufacturing Modules (`MANUFACTURING_MODULES`):** In-situ fabrication equipment (e.g., Additive Regolith Sintering Printer, ISRU Sabatier Propellant Plant).
10. **Maintenance Supplies (`MAINTENANCE_SUPPLIES`):** Critical repair spare kits (e.g., RCS Thruster & Valve Replacement Kit, High-Emissivity Composite Radiators, Polymer Radiation Barrier Tiles).
11. **General Cargo (`GENERAL_CARGO`):** Pressurized gases, structural titanium trusses, and expedition rations (e.g., Pressurized O2 & N2 Atmosphere Canisters, Titanium Truss Extrusions, Caloric Expedition Rations).

---

## 3. Transportation Mission Types Supported
1. **Orbital Telemetry & Constellation Deployments:** Single and multi-satellite injections into specified orbital altitude envelopes (e.g., Project Vanguard LEO Relay).
2. **Multi-Payload Surface Base Infrastructure Drops:** Simultaneous delivery of distinct modules (nuclear reactor + additive regolith printer + life support atmosphere tanks) on a single carrier (e.g., Artemis Lunar Surface Outpost Delivery).
3. **Combined Transportation & Exploration Missions:** Two-stage mission profiles where successful touchdown and deployment unlocks a dedicated surface exploration phase (e.g., Mars Titan Rover Delivery followed by a 5,000-meter autonomous Jezero Delta traversal and 3 sealed rock core drilling tasks).
4. **Outer Solar System Cryogenic Expeditions:** Long-transit cryogenic deliveries under extreme radiation and temperature constraints (e.g., Europa Boreas Cryo-Drill Rover and subsurface radar deployment).

---

## 4. Public APIs (`PayloadTransportationService`)
The master facade `PayloadTransportationService` implements all 10 operations required by Prompt 29:

```typescript
export class PayloadTransportationService {
  // 1. Retrieve a specific payload definition
  public getPayload(payloadId: string): PayloadDefinition | undefined;

  // 2. List all registered payloads with optional filtering
  public listPayloads(filter?: PayloadFilter): PayloadDefinition[];

  // 3. Query all currently available payloads in warehouse stock
  public getAvailablePayloads(): PayloadDefinition[];

  // 4. Assign a payload quantity to a spacecraft/vehicle manifest
  public assignPayload(
    vehicleId: string,
    payloadId: string,
    quantity?: number,
    missionId?: string
  ): AssignmentOperationResult;

  // 5. Remove an assigned payload and refund warehouse inventory
  public removePayload(
    vehicleId: string,
    payloadId: string,
    quantity?: number,
    missionId?: string
  ): AssignmentOperationResult;

  // 6. Fully validate vehicle payload manifest against physical and mission constraints
  public validatePayloadAssignment(
    vehicleId: string,
    context?: ValidationContext
  ): PayloadValidationResult;

  // 7. Register a new data-driven transportation mission definition
  public createTransportationMission(
    definition: TransportationMissionDefinition
  ): boolean;

  // 8. Retrieve a transportation mission definition
  public getTransportationMission(
    missionId: string
  ): TransportationMissionDefinition | undefined;

  // 9. Update progress on a mission delivery objective
  public updateDeliveryProgress(
    missionId: string,
    payloadId: string,
    deltaQuantity: number
  ): DeliveryConfirmationResult;

  // 10. Confirm payload arrival and deployment at target destination
  public confirmPayloadDelivery(
    missionId: string,
    payloadId: string,
    quantity: number
  ): DeliveryConfirmationResult;
}
```

---

## 5. Domain Events (`PayloadDomainEvents`)
Dispatched via `PayloadEventBus` and optionally bridged to the global `EventBus`:

| Event Name | Payload Contract | Description |
|---|---|---|
| `PayloadAssigned` | `PayloadAssignedPayload` | Fired when a payload is mounted onto a vehicle manifest. |
| `PayloadRemoved` | `PayloadRemovedPayload` | Fired when a payload is unassigned and returned to storage. |
| `PayloadReserved` | `PayloadReservedPayload` | Fired when a payload is earmarked during mission acceptance. |
| `PayloadInTransit` | `PayloadInTransitPayload` | Fired upon flight launch when assigned cargo transitions to en route. |
| `PayloadDelivered` | `PayloadDeliveredPayload` | Fired when cargo successfully arrives at the target destination. |
| `DeliveryObjectiveCompleted` | `DeliveryObjectiveCompletedPayload` | Fired when a required payload contract is completely satisfied. |

---

## 6. Inventory & Delivery State Machine
The system tracks quantities across 7 discrete states:
$$\text{totalOwned} = \text{available} + \text{reserved} + \text{assigned} + \text{inTransit} + \text{delivered} + \text{returned} + \text{lost}$$

- **Anti-Duplication Protection:** Mission aborts, cancellations, and state restorations utilize atomic allocation tracking (`rollbackMissionAllocations`), ensuring reserved and assigned units are safely refunded to available stock without duplicating or leaking items.
- **Save & Restore Serialization:** Invariant sums are mathematically validated on deserialization.

---

## 7. Isolated UI Architecture (`src/payload/ui/`)
- `PayloadManagementView`: Top-level composite dashboard with navigation tabs (`ASSIGNMENT`, `CATALOGUE`, `MISSION_BRIEFING`).
- `PayloadCataloguePanel`: Search bar and category filter tabs (ALL, COMMS, OBS, SCI, ROVER, LAND, MOD, PWR, CARGO).
- `PayloadDetailView`: Deep specifications dossier (fictional ratings, research purpose, compatibility tags, live inventory breakdown).
- `PayloadAssignmentPanel`: Spacecraft selector, loaded cargo manifest list, increment/decrement controls, live compatibility indicator, and missing requirements warning banner.
- `PayloadCapacityIndicator`: Color-coded telemetry bars for Mass ($MU$), Power ($PWR$), and Storage ($Slots$) with overload alerts.
- `TransportationBriefingPanel`: Mission delivery destination criteria, required cargo checklist, educational concept briefing, and follow-up exploration previews.

---

## 8. Files Created
- `src/payload/PayloadTypes.ts`: Domain models, enums, ratings, manifest, and validation types.
- `src/payload/PayloadCategoryRegistry.ts`: Extensible category manager with 11 default categories.
- `src/payload/PayloadData.ts`: 28 authored payloads across all 11 categories.
- `src/payload/PayloadRegistry.ts`: Authoritative registry with query filtering and unlock verification.
- `src/payload/PayloadInventoryManager.ts`: 7-state transactional inventory tracking.
- `src/payload/PayloadValidationEngine.ts`: Fictional game rating validation rules.
- `src/payload/PayloadAssignmentService.ts`: Spacecraft manifest orchestration and capacity tracking.
- `src/payload/TransportationMissionTypes.ts`: Transportation mission contracts and exploration phases.
- `src/payload/TransportationMissionData.ts`: Authored transportation and combined missions.
- `src/payload/TransportationMissionManager.ts`: Multi-payload lifecycle and exploration tracking.
- `src/payload/PayloadTransportationService.ts`: Master public integration facade.
- `src/payload/adapters/SpacecraftAdapter.ts`: Universal adapter boundary for rockets and spacecraft platforms.
- `src/payload/events/PayloadEvents.ts`: Strongly typed event payloads.
- `src/payload/events/PayloadEventBus.ts`: Domain event bus.
- `src/payload/ui/PayloadCapacityIndicator.ts`: Visual capacity telemetry gauge.
- `src/payload/ui/PayloadDetailView.ts`: Payload specifications dossier.
- `src/payload/ui/PayloadAssignmentPanel.ts`: Manifest management panel.
- `src/payload/ui/TransportationBriefingPanel.ts`: Delivery criteria and educational concepts.
- `src/payload/ui/PayloadCataloguePanel.ts`: Searchable category browser.
- `src/payload/ui/PayloadManagementView.ts`: Master composite operations view.
- `src/payload/ui/index.ts`: UI exports.
- `src/payload/index.ts`: Public API export barrier.
- `tests/payload/PayloadRegistry.test.ts`: 6 unit tests.
- `tests/payload/PayloadInventoryManager.test.ts`: 6 unit tests.
- `tests/payload/PayloadAssignmentService.test.ts`: 7 unit tests.
- `tests/payload/PayloadValidationEngine.test.ts`: 9 unit tests.
- `tests/payload/TransportationMissionManager.test.ts`: 6 unit tests.
- `tests/payload/SpacecraftAdapter.test.ts`: 4 unit tests.
- `tests/payload/PayloadEvents.test.ts`: 3 unit tests.
- `tests/payload/PayloadManagementView.test.ts`: 5 unit tests.
- `tests/payload/PayloadTransportationService.test.ts`: 9 unit tests.
- `docs/handoffs/prompt-29.md`: Handoff documentation.

---

## 9. Verification & Test Results
- **Payload Test Suite:** 9 suites, 55 tests passed (100% pass rate).
- **Mission Domain Suite:** 10 suites, 63 tests passed (100% pass rate).
- **Total Verified Tests:** 118 unit tests passed in 1.46s.

---

## 10. Integration Contract for Other Modules
- **Simulation Engine:**
  - Upon vehicle launch: call `inventoryManager.markInTransit(payloadId, quantity, missionId)`.
  - Upon arrival at target destination: verify delivery conditions (altitude, landing speed), then call `confirmPayloadDelivery(missionId, payloadId, quantity)`.
  - On mission failure/loss: call `inventoryManager.recordLoss(...)`.
- **Mission Control Dashboard:**
  - Instantiate `PayloadManagementView` into HUD/interior terminal container.
  - Query `getMissingRequirements(vehicleId, missionId)` for pre-flight green-light checklists.
- **Economy & Manufacturing Facilities:**
  - When new payloads are manufactured in the Resource & Manufacturing Centre, call `inventoryManager.procurePayload(payloadId, quantity)`.
