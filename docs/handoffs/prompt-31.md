# Phase 29 / Prompt 31 Technical Handoff: Communications and Satellite Network System

## 1. Executive Summary

This document specifies the architecture, domain contracts, coverage models, user interfaces, integration points, and verification results for the **Communications and Satellite Network System** developed under **Prompt 31** for *INTERSTELLAR CONTINUUM*.

The communications network system introduces a modular, scalable infrastructure layer that allows the player's aerospace agency to establish, monitor, and upgrade communication channels between Earth, deployed orbital satellites, planetary relays, and active spacecraft across the Solar System. 

The implementation preserves the project's 2D/2.5D visual conventions and abstract gameplay parameters without reproducing real-world radio-frequency engineering or signal interception instructions.

---

## 2. Architecture & File Ownership

All changes have been confined strictly to the dedicated communications module, isolated UI components, and new tests under feature branch `feature/p31-communications-network`.

### Directory Layout:

```
src/network/
├── NetworkTypes.ts                      # Authoritative data contracts, enums & interfaces
├── NetworkEvents.ts                     # Typed domain events & payload contracts
├── NetworkEventBus.ts                   # Strongly typed event bus with core EventBus bridging
├── NetworkCoverageEngine.ts             # Deterministic abstract Solar System coverage engine
├── CommunicationsNetworkManager.ts      # Authoritative central singleton manager & public APIs
├── index.ts                             # Public barrel export
├── adapters/
│   ├── EconomyAdapter.ts               # Non-duplicating adapter interfacing with EconomyService
│   ├── FacilityAdapter.ts              # Adapter interfacing with FacilityRegistry (FAC_COMMUNICATIONS_CENTRE)
│   └── DestinationAdapter.ts           # Adapter translating celestial body distance & latency profiles
├── data/
│   ├── DefaultGroundStations.ts         # Authored Earth ground stations (Goldstone, Madrid, Canberra, etc.)
│   ├── DefaultSatellites.ts             # Authored communication satellites & constellations
│   └── DefaultRelays.ts                 # Authored surface and orbital planetary relays
└── ui/
    ├── NetworkSchematicMap.ts           # 2D schematic vector map with animated signal telemetry
    └── CommunicationsManagementView.ts  # Full multi-tab Communications Management modal view

tests/network/
├── CommunicationsNetworkManager.test.ts # 21 comprehensive integration tests
├── NetworkCoverageEngine.test.ts        # 6 deterministic coverage & outage tests
└── NetworkUI.test.ts                    # 4 isolated UI lifecycle & schematic map tests

docs/handoffs/
└── prompt-31.md                         # This authoritative handoff document
```

### Untouched Shared Modules:
- Central mission simulation core: untouched.
- Launch cinematic & sequence: untouched.
- Payload registry & rocket catalogues: untouched.
- Mission Control dashboard & MissionOperationsScene: untouched.
- Scientific data system: untouched.
- Global economy implementation: untouched (interfaced via `EconomyAdapter`).
- Main entrypoint & HTML: untouched.
- Root dependency manifest (`package.json`, `package-lock.json`): untouched.

---

## 3. Communication Infrastructure Domain Models

The domain model categorizes infrastructure into four primary pillars:

### 3.1 Earth Ground Stations (`GroundStationRecord`)
- **Station Identifier (`id`):** Unique canonical identifier (e.g. `GS_GOLDSTONE`, `GS_MADRID`, `GS_CANBERRA`, `GS_HEADQUARTERS`, `GS_SVALBARD`).
- **Location:** Earth geographic coordinates and facility descriptor (e.g. Mojave Desert, Robledo de Chavela, Tidbinbilla).
- **Operational Status:** `OPERATIONAL`, `DEGRADED`, `OFFLINE`, `UNDER_MAINTENANCE`, `UNDER_CONSTRUCTION`.
- **Capacity Rating:** Abstract channel throughput capacity (180 to 500 Gbps channel units).
- **Signal Gain:** Fictional antenna gain rating (+18.5 dB to +30.0 dB).
- **Dish Diameter:** Physical aperture metric (18m to 40m).
- **Upgrade Progression:** Level 1 to 5 scaling, increasing capacity (+80 Gbps/level) and dish diameter.
- **Maintenance Cost:** Periodic operational upkeep cost in credits ($₵250$ to $₵550$/cycle).
- **Unlock Requirements:** Gated by player organization rank and credit construction expenditure.

### 3.2 Communication Satellites (`SatelliteRecord`)
- **Satellite Identifier (`id`):** Unique orbital asset ID (e.g. `SAT_LEO_RELAY_ALPHA`, `SAT_GEO_COMMSAT_01`, `SAT_LUNAR_RELAY_01`, `SAT_AREO_ORBITER_01`).
- **Satellite Type:** `LEO_RELAY`, `GEO_STATIONARY`, `LUNAR_ORBITER`, `INTERPLANETARY_CARRIER`, `DEEP_SPACE_COMMUNICATOR`, `POLAR_ORBITER`.
- **Target Destination / Region:** Destination ID binding (e.g. `DEST_EARTH_LEO`, `DEST_EARTH_GEO`, `DEST_MOON`, `DEST_MARS`).
- **Operational Status:** `ACTIVE`, `STANDBY`, `DEGRADED`, `OFFLINE`, `CALIBRATING`.
- **Network Contribution:**
  - `coverageBonus`: Percentage coverage increase (+15% to +45%).
  - `bandwidthBonus`: Telemetry throughput channel boost (+50 to +150 Gbps).
  - `latencyReduction`: Fractional round-trip reduction factor (0.15 to 0.30).
  - `signalStrengthBonus`: Signal margin boost (+15 to +30).
- **Constellation ID:** Logical grouping for constellation bonuses (e.g. `CONST_LEO_RING`, `CONST_GEO_HIGHWAY`, `CONST_MARS_NET`).

### 3.3 Spacecraft Connections (`SpacecraftConnectionRecord`)
- **Connected Spacecraft:** Bound to vehicle ID (`spacecraftId`) and optional mission instance ID (`missionId`).
- **Communication Status:** `CONNECTED`, `WEAK_SIGNAL`, `INTERMITTENT`, `OCCLUDED`, `DISCONNECTED`.
- **Signal Quality Rating:** Fictional telemetry fidelity percentage (0.0% to 100.0%).
- **Data Transmission Status:** `TRANSMITTING`, `IDLE`, `BUFFERED`, `BLOCKED`.
- **Active Route:** Multi-hop path tracing from Earth Ground Station -> Satellite Relay -> Planetary Relay -> Spacecraft.
- **Telemetry Fidelity:** Percentage determining sensor accuracy and control latency.
- **Science Data Downlink Multiplier:** Scale factor (0.5x to 2.5x) rewarding robust high-gain infrastructure with increased science rewards.

### 3.4 Planetary Relays (`PlanetaryRelayRecord`)
- **Relay Identifier (`id`):** E.g. `RELAY_LUNAR_SOUTH_POLE`, `RELAY_MARS_JEZERO`, `RELAY_EUROPA_ORBIT`.
- **Deployment Location:** Celestial body ID (`DEST_MOON`, `DEST_MARS`, `DEST_EUROPA`, `DEST_TITAN`, etc.).
- **Location Type:** `ORBITAL`, `SURFACE`, `ATMOSPHERIC`, `LAGRANGE_POINT`.
- **Operational State:** `OPERATIONAL`, `DEGRADED`, `OFFLINE`, `SOLAR_CONJUNCTION_BLACKOUT`, `MAINTENANCE_REQUIRED`.
- **Network Contribution:** Local surface coverage bonus (+30% to +45%), range multiplier (1.25x to 1.50x), and link rating.
- **Modular Upgrade Options:** Discrete authored upgrades (e.g. *Continuous Sun-Tracking Mast*, *Optical Deep Space Transceiver*, *High-Gain Cassegrain Dish*).

---

## 4. Abstract Coverage Model

The `NetworkCoverageEngine` implements a deterministic, fully explainable mathematical coverage model:

1. **Earth Ground Station Geometry (Rotational Continuity):**
   - 1 Ground Station: Base Earth coverage is 40% (interrupted by planetary rotation).
   - 2 Ground Stations: Base Earth coverage is 70%.
   - 3+ Ground Stations across distinct global longitudes (Goldstone at $-116^\circ$, Madrid at $-4^\circ$, Canberra at $+148^\circ$): Base Earth coverage is 95% (near continuous 24/7 visibility).

2. **Distance Tiers & Path Attenuation:**
   - **Earth Orbit (LEO, MEO, GEO):** Ground stations provide base uplink. Deployed LEO/GEO satellites boost coverage to 100% and eliminate polar pass dead-zones.
   - **Lunar Proximity (The Moon):** Ground stations alone reach only the Earth-facing near-side ($\le 50\%$). Far-side surface and polar operations require an orbital satellite or Shackleton surface relay to reach 90–100% (OPTIMAL).
   - **Inner System (Mercury, Venus, Sun):** Base DSN stations provide 20–30% reach depending on station tier. Local orbiters/relays are required to reach GOOD or OPTIMAL ratings.
   - **Mars System (Mars, Phobos, Deimos):** Base Earth DSN provides 15–25% intermittent link. An Areostationary satellite adds +45%, and a Jezero surface terminal adds +45%, enabling continuous high-speed Mars telemetry.
   - **Jovian & Asteroid Belt:** Deep space distance requires high Earth ground station tiers (Tier 2+) combined with local radiation-hardened relay infrastructure.
   - **Outer System (Saturn, Uranus, Neptune):** Multi-hop deep space carrier relays are mandatory.

3. **Classification Ratings:**
   - $\ge 90\%$: `OPTIMAL` (Full uncompressed science downlink, zero command latency penalty, 100% telemetry fidelity).
   - $75\% - 89\%$: `GOOD` (Continuous telemetry, standard data rates).
   - $45\% - 74\%$: `PARTIAL` (Intermittent passes, science data buffered during occlusion).
   - $20\% - 44\%$: `MINIMAL` (Severe packet loss, delayed command execution).
   - $< 20\%$: `NONE` (Telemetry blackout, blocked transmission).

4. **Bottlenecks and Diagnostic Explanations:**
   - Every coverage evaluation returns human-readable `bottlenecks` and `recommendations` arrays (e.g. *"Far-side of the Moon occluded without a Lunar Polar Orbiter"*), giving the player clear actionable strategic directions.

---

## 5. Gameplay Consequences & Recovery Mechanics

Communications provide meaningful gameplay strategic depth without punishing single-point failures:

1. **Fair Outage Containment:**
   - Outages (Solar Flares, Atmospheric Interference, Solar Conjunctions, Equipment Faults) degrade coverage and telemetry fidelity rather than destroying spacecraft or failing missions immediately.
2. **Telemetry Availability:**
   - Spacecraft with degraded or intermittent signals buffer their data telemetry until line-of-sight is restored.
3. **Data Transmission Multipliers:**
   - Downlink science rewards are multiplied up to $2.5\times$ when high-gain dishes and satellite arrays are upgraded.
4. **Maintenance Cycles:**
   - The organization pays periodic maintenance for operational stations and relays. If funds run dry, assets enter `DEGRADED` status rather than vanishing, allowing recovery once funds are restored.
5. **Recovery Methods:**
   - Players can restore service via `EMERGENCY_REPAIR`, `REMOTE_DIAGNOSTICS`, `BACKUP_REROUTE`, or `RECALIBRATION`.

---

## 6. Public Integration Contract

`CommunicationsNetworkManager` exposes the following 10 core public APIs:

```typescript
// 1. Register or build an Earth ground station
registerGroundStation(config: GroundStationConfig): GroundStationRecord;

// 2. Register an active communication satellite
registerCommunicationSatellite(config: SatelliteConfig): SatelliteRecord;

// 3. Deploy a planetary surface or orbital relay
deployRelayStation(config: RelayStationConfig): PlanetaryRelayRecord;

// 4. Retrieve global network status summary & health metrics
getNetworkStatus(): NetworkStatusSummary;

// 5. Evaluate abstract coverage for any celestial destination
evaluateCoverage(destinationId: string): DestinationCoverageRecord;

// 6. Connect an active spacecraft to available infrastructure
connectSpacecraft(request: SpacecraftConnectionRequest): SpacecraftConnectionRecord;

// 7. Disconnect a spacecraft from network infrastructure
disconnectSpacecraft(spacecraftId: string): boolean;

// 8. Upgrade infrastructure tier (Ground Station, Satellite, Relay)
upgradeNetworkInfrastructure(targetType: InfrastructureType, targetId: string): UpgradeResult;

// 9. Report an active network outage or solar interference event
reportNetworkOutage(outageReport: OutageReport): NetworkOutageRecord;

// 10. Restore service to degraded or offline network infrastructure
restoreNetworkService(targetId: string, method?: RecoveryMethod): RecoveryResult;
```

### Strongly Typed Events:
The subsystem emits the following typed domain events through `NetworkEventBus` (and bridges to the central `EventBus` via prefixed `network:<event>` notifications):

- `GroundStationRegistered`: `{ station: GroundStationRecord, timestamp: number }`
- `SatelliteRegistered`: `{ satellite: SatelliteRecord, timestamp: number }`
- `RelayDeployed`: `{ relay: PlanetaryRelayRecord, timestamp: number }`
- `SpacecraftConnected`: `{ connection: SpacecraftConnectionRecord, timestamp: number }`
- `SpacecraftDisconnected`: `{ spacecraftId: string, timestamp: number }`
- `CoverageChanged`: `{ destinationId: string, previousCoverage: number, currentCoverage: number, rating: CoverageRating, timestamp: number }`
- `NetworkOutageDetected`: `{ outage: NetworkOutageRecord, timestamp: number }`
- `NetworkServiceRestored`: `{ targetId: string, targetType: InfrastructureType, method?: string, timestamp: number }`
- `InfrastructureUpgraded`: `{ upgrade: UpgradeResult, timestamp: number }`
- `NetworkMaintenanceCompleted`: `{ totalCostPaid: number, degradedCount: number, operationalCount: number, timestamp: number }`

---

## 7. Isolated User Interface

The isolated user interface comprises two primary components in `src/network/ui/`:

1. **`NetworkSchematicMap`:**
   - 2D vector schematic map rendered using PixiJS.
   - Visual nodes for Earth, Earth Ground Stations, LEO/GEO orbital shells, Moon, Mars, Jupiter, Satellite Constellations, Planetary Relays, and connected Spacecraft.
   - Vector signal lines rendered with cyan/blue glow lines and animated telemetry pulse points.
   - Color-coded node statuses (Cyan = Nominal, Green = Active Sat, Amber = Degraded, Red = Outage).

2. **`CommunicationsManagementView`:**
   - Polished 1560x880 modal panel adhering to `UIDesignTokens`, `UIButton`, `UITabGroup`, and `UIProgressBar`.
   - Five interactive tabs:
     - **NETWORK MAP & OVERVIEW:** 6 KPI metric tiles, 2D vector schematic map, and live outage alert feed with instant restore actions.
     - **GROUND STATIONS:** Deep Space Network tracking complexes with bandwidth capacity, dish size, upgrade controls, and construction actions.
     - **SATELLITE FLEET:** Satellite constellations across LEO, GEO, and interplanetary space with calibration and upgrade options.
     - **PLANETARY RELAYS:** Surface and orbital relays on Moon, Mars, and Europa with servicing and upgrade controls.
     - **SOLAR SYSTEM COVERAGE:** Complete destination coverage matrix with progress bars, latency readouts, science multipliers, and diagnostic bottleneck advice.

---

## 8. Test Verification & Results

All tests have been run and verified with Vitest.

### Test Breakdown:
- **`tests/network/CommunicationsNetworkManager.test.ts` (21 tests):**
  - Ground station default initialization, custom registration, and invalid parameter rejection.
  - Organization rank and credit validation when constructing ground stations.
  - Satellite registration, constellation association, and validation.
  - Relay deployment to celestial bodies and error containment.
  - Spacecraft connection, multi-hop route assembly, signal quality calculation, and clean disconnection.
  - Upgrades scaling bandwidth, dish size, and coverage bonuses, with maximum tier caps.
  - Outage reporting, degradation of affected targets, and recovery methods.
  - Automatic resolution of expired outages on update ticks.
  - Maintenance cycle execution with credit spending and bankruptcy degradation.
  - Full state serialization and deserialization / save restoration.
- **`tests/network/NetworkCoverageEngine.test.ts` (6 tests):**
  - Ground station rotational scaling (1 station = 40%, 2 stations = 70%, 3 stations = 95%).
  - Satellite contribution boosting Earth LEO to 100% OPTIMAL.
  - Lunar near-side vs far-side coverage requiring lunar relays.
  - Mars coverage with and without Jezero surface terminal.
  - Outage penalty math reducing coverage and line-of-sight.
  - Deterministic evaluation: identical inputs produce identical ratings.
- **`tests/network/NetworkUI.test.ts` (4 tests):**
  - `CommunicationsManagementView` creation, visibility toggling, and clean destruction.
  - Seamless navigation through all five tabs.
  - Animation update tick execution.
  - `NetworkSchematicMap` container initialization and node rendering.

### Full Test Suite Execution:
- **Total Test Files:** 97 passed (97)
- **Total Tests:** 562 passed (562)
- **Regressions:** 0
- **TypeScript Compilation (`tsc --noEmit`):** 0 errors.

---

## 9. Integration Requirements for Parallel Laptops

### 9.1 Mission Control & Mission Operations (Prompt 27 / 28)
- To connect an active mission's spacecraft to the network, call:
  ```typescript
  import { CommunicationsNetworkManager } from '../network';

  const commManager = CommunicationsNetworkManager.getInstance();
  const connection = commManager.connectSpacecraft({
    spacecraftId: spacecraft.id,
    name: spacecraft.name,
    missionId: mission.id,
    destinationId: mission.destinationId,
  });
  ```
- To inspect current telemetry fidelity or transmission rate:
  ```typescript
  const fidelity = connection.telemetryFidelityRating; // 0 - 100%
  const multiplier = connection.scienceDataMultiplier; // 0.5x - 2.5x
  ```

### 9.2 Launch Deployment Manager (Prompt 26)
- When launching payloads with category `PayloadCategory.COMMUNICATION_SATELLITE`:
  ```typescript
  commManager.registerCommunicationSatellite({
    id: `SAT_${payload.id}`,
    name: payload.name,
    satelliteType: SatelliteType.LEO_RELAY,
    destinationId: targetDestinationId,
  });
  ```

### 9.3 Headquarters Campus & Facility Interactivity (Prompt 25 / 26)
- The Physical Headquarters Communication & Network Centre (`FAC_COMMUNICATIONS_CENTRE`, World Position $x=1200, y=1950$) can open the `CommunicationsManagementView` directly or embed it in its interior console.

---

## 10. Known Limitations & Extensibility

- **Fictional Delay Model:** Signal latency is deterministic based on destination distance tiers rather than live orbital ephemeris. This is an intentional design constraint matching Prompt 31 Section 6.
- **Constellation Formations:** Satellites provide abstract network bonuses rather than simulating Keplerian orbit propagation.
- **Extensible Hooks:** Spacecraft connection routing is designed to accommodate future deep-space relays and optical laser terminals without breaking changes.

