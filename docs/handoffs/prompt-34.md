# Prompt 34 Technical Handoff: Robotic Rover Exploration and Remote Operations System

## 1. Executive Summary

This document specifies the architecture, domain contracts, physics model, scientific instrumentation, autonomous navigation, visual presentation, and integration contracts for the **Robotic Rover Exploration and Remote Operations System** developed under **Prompt 34** for *INTERSTELLAR CONTINUUM*.

The robotic rover system provides a complete, immersive simulation layer allowing the player to remotely operate unmanned planetary exploration vehicles across extraterrestrial surfaces (The Moon, Mars, Europa, Titan). Rather than merely moving a 2D avatar across a map, rover exploration is designed as an authentic aerospace teleoperation activity featuring:
- Physics-based 2D/2.5D rover kinematics with steering pivot, controlled acceleration, active braking, and suspension dynamics.
- Surface terrain interactions with difficulty scaling, surface obstacles, sliding collision deflection, and boundary limits.
- Configurable scientific instrumentation suites spanning 5 distinct sensor categories with sample coring and caching.
- Fair resource management tracking battery reserves, diurnal solar charging, radioisotope thermoelectric generator (RTG) power, dust deposition, and field maintenance actions.
- An optional, predictable autonomous navigation mode capable of obstacle avoidance, waypoint traversal, and point-of-interest (POI) auto-stopping.
- High-fidelity visual presentation including composite rocker-bogie wheel rendering, dust particle plumes, fading tire tracks, pan-tilt mast animation, articulated robotic arm deployment, and headlight cones.

---

## 2. Directory Layout & File Ownership

All changes have been strictly isolated to the dedicated exploration module, isolated UI components, and unit tests under feature branch `feature/p34-rover-exploration`.

```
src/exploration/
├── ExplorationTypes.ts                     # Authoritative data contracts, models, ratings & enums
├── ExplorationEvents.ts                    # Strongly typed domain events & payload contracts
├── ExplorationEventBus.ts                  # Dedicated event bus with core EventBus bridge
├── RoverRegistry.ts                        # Master registry for models, definitions, and active rovers
├── RoverMovementController.ts              # 2D/2.5D kinematics, acceleration, steering, terrain scaling
├── RoverCollisionHandler.ts                # Obstacle detection, boundary clamping, and sliding deflection
├── RoverEnergyManager.ts                   # Battery management, solar/RTG power, dust, and maintenance
├── RoverInstrumentManager.ts               # Sensor firing, range verification, cooldowns, sample caching
├── RoverAutonomousController.ts            # Autonomous pathfinding, obstacle avoidance, POI auto-stopping
├── RoverExplorationEngine.ts               # Core per-frame update loop, POI discovery, objective tracking
├── RoboticRoverManager.ts                  # Central singleton facade exposing all 11 public API methods
├── index.ts                                # Public barrel export
├── data/
│   ├── DefaultRoverModels.ts               # 4 distinct rover models (Scout, Science, Heavy, Autonomous)
│   ├── DefaultInstruments.ts               # 8 authored scientific instruments across 5 categories
│   └── DefaultExplorationObjectives.ts     # Authored exploration sectors, POIs, and objectives (Moon, Mars, Europa)
├── adapters/
│   ├── PlanetaryEnvironmentAdapter.ts      # Clean environment adapter (terrain, obstacles, POIs, bounds)
│   ├── CommunicationsNetworkAdapter.ts     # Adapter interfacing with Prompt 31 Communications Network
│   ├── ScientificDataAdapter.ts            # Adapter submitting findings to agency research and credits
│   ├── MissionSimulationAdapter.ts         # Adapter interfacing with active mission instances
│   └── PayloadDeliveryAdapter.ts           # Adapter linking Prompt 29 transported rover payloads
├── rendering/
│   ├── RoverVisual.ts                      # 2D/2.5D composite rover vehicle renderer (chassis, wheels, mast, arm)
│   ├── RoverDustParticles.ts               # Particle system generating terrain-colored wheel dust plumes
│   └── RoverTireTracks.ts                  # Surface tire tread track imprints and fading decals
└── ui/
    ├── RoverRemoteControlDashboard.ts      # Master cockpit interface with camera tracking and input routing
    ├── RoverTelemetryPanel.ts              # HUD gauges for battery, condition, speed, heading, and comms
    ├── RoverNavigationMap.ts               # 2D tactical radar minimap with interactive waypoint plotting
    ├── RoverSciencePanel.ts                # Instrument trigger controls, cooldowns, and sample carousel
    ├── RoverObjectivesPanel.ts             # Active planetary exploration directives checklist
    └── RoverDeploymentModal.ts             # Rover selection and planetary touchdown authorization modal

tests/exploration/
├── RoverRegistry.test.ts                   # 5 unit tests verifying registration, models, and filtering
├── RoverMovementAndPhysics.test.ts         # 7 unit tests verifying kinematics, acceleration, braking, terrain
├── RoverCollisionAndTerrain.test.ts        # 5 unit tests verifying boundaries, sliding, and damage
├── RoverEnergyAndMaintenance.test.ts       # 5 unit tests verifying solar, RTG, dust, and maintenance
├── RoverInstrumentsAndScience.test.ts      # 5 unit tests verifying sensors, ranges, and core drilling
├── RoverAutonomousAndExploration.test.ts   # 6 unit tests verifying autonomous navigation and objectives
├── RoboticRoverManager.test.ts             # 14 integration tests verifying all 11 public APIs and save state
└── RoverUIAndRendering.test.ts             # 9 tests verifying visual rendering, particles, tracks, and HUD panels

docs/handoffs/
└── prompt-34.md                            # This authoritative handoff document
```

### Untouched Shared Modules:
- Planetary environment generator (Laptop 2): untouched (cleanly interfaced via `PlanetaryEnvironmentAdapter`).
- Base construction (Laptop 3): untouched.
- Central mission simulation core: untouched.
- Launch cinematics & launchpad: untouched.
- Payload system: untouched (cleanly interfaced via `PayloadDeliveryAdapter`).
- Mission Control dashboard & MissionOperationsScene: untouched.
- Communications network core: untouched (cleanly interfaced via `CommunicationsNetworkAdapter`).
- Global economy implementation: untouched (interfaced via `ScientificDataAdapter`).
- Main entrypoint (`src/main.ts`): untouched.
- Shared dependency manifests (`package.json`, `package-lock.json`): untouched.

---

## 3. Rover Framework & Distinct Chassis Models

The framework supports data-driven definitions with four meaningfully distinct operational rover configurations:

| Attribute | Scout Rover (`ROVER_SCOUT_PATHFINDER`) | Scientific Rover (`ROVER_SCIENCE_CURIOSITY`) | Heavy Utility Rover (`ROVER_HEAVY_COLOSSUS`) | Advanced Autonomous Rover (`ROVER_AUTONOMOUS_VANGUARD`) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Role** | Fast reconnaissance & mapping | In-situ laboratory & core drilling | Heavy cargo & sample container transport | Unsupervised high-speed robotic surveying |
| **Chassis Wheel Setup** | 6-wheel Rocker-Bogie | 6-wheel Heavy Rocker-Bogie | 8-wheel Titanium Drivetrain | 6-wheel Cyber-Steer Array |
| **Mass Rating** | 110 kg | 340 kg | 520 kg | 230 kg |
| **Top Speed** | 21.0 m/s (210 px/s) | 14.0 m/s (140 px/s) | 11.5 m/s (115 px/s) | 18.5 m/s (185 px/s) |
| **Turn Rate** | 130°/s (nimble) | 75°/s | 55°/s (wide turning arc) | 105°/s |
| **Primary Power Source** | Solar Array | Radioisotope RTG | Hybrid Solar + RTG | Hybrid Solar + RTG |
| **Solar Generation** | 2.2 units/s (daylight) | 0.0 units/s | 1.4 units/s | 1.8 units/s |
| **RTG Trickle Power** | 0.0 units/s | 1.2 units/s (continuous 24/7) | 0.8 units/s | 1.0 units/s |
| **Instrument Slots** | 2 slots | 5 slots | 3 slots | 4 slots |
| **Sample Storage Slots**| 4 slots | 8 slots | 16 slots (massive storage) | 6 slots |
| **LIDAR/Sensor Radius** | 420 m | 320 m | 260 m | 460 m (extreme range) |
| **Collision Damage** | Normal (1.0x) | Normal (1.0x) | Heavy Armor (0.5x damage) | Normal (1.0x) |
| **Autonomous Rating** | Level 2 / 5 | Level 3 / 5 | Level 2 / 5 | Level 5 / 5 (Neuromorphic AI) |

---

## 4. 2D/2.5D Movement, Kinematics & Physics Model

The rover movement system balances responsive game feel with abstract vehicle physics:
1. **Directional Acceleration & Deceleration:**
   - Smooth forward throttle and reverse gear with independent acceleration rates ($200 - 380\text{ px/s}^2$).
   - Reverse speed is strictly capped at designated reverse gearing limits ($50 - 85\text{ px/s}$).
2. **Steering & Angular Rotation:**
   - Steer angle smoothly adjusts rover heading $\theta \in [0^\circ, 360^\circ)$ with automatic wrap-around.
   - When reversing, steering direction automatically inverts to simulate real Ackerman/skid vehicle kinematics.
3. **Controlled Braking vs Coasting Friction:**
   - Pressing `Space` engages active brakes with high deceleration ($420 - 650\text{ px/s}^2$).
   - Releasing inputs engages natural rolling friction ($120 - 160\text{ px/s}^2$).
4. **Terrain-Aware Traversal Scaling:**
   - Velocity is multiplied by active terrain handling factors:
     - `SMOOTH_PLAINS`: 1.0x
     - `REGOLITH_DUNES`: 0.85x
     - `ROCKY_CRAGS`: 0.70x
     - `CRYOGENIC_ICE`: 0.80x
     - `CRATER_SLOPES`: 0.55x
     - `HAZARDOUS_FISSURE`: 0.25x (extreme strain)
5. **Special Drive Modes:**
   - **Boost Mode (`Shift`):** Increases forward speed by +35% at the cost of 2.2x energy draw.
   - **Crawl Mode (`C`):** Reduces speed to 45% for precision obstacle negotiation, lowering energy drain to 0.6x.

---

## 5. Terrain Interaction & Obstacle Collision Resolution

1. **Sector Boundaries:**
   - Exploration sectors define bounding coordinates (`minX`, `maxX`, `minY`, `maxY`). Rover position is clamped to bounds with footprint margin.
2. **Surface Obstacles & Sliding Deflection:**
   - Obstacles (Boulders, Craters, Crevices, Cliffs) possess coordinate centers, collision radii, and hardness ratings.
   - When colliding, penetration depth is resolved by pushing the rover along the collision normal.
   - Velocity is projected onto the obstacle tangent: normal velocity is eliminated while tangential velocity is preserved. This allows the rover to smoothly slide along rock surfaces without catching or jamming.
3. **Impact Damage:**
   - Normal velocity impacts exceeding $60\text{ px/s}$ inflict condition wear scaled by obstacle hardness. Heavy utility rovers resist 50% of impact damage.
4. **Restricted Hazardous Zones:**
   - Deep hazardous chasms and fissures act as impassable terrain boundaries.

---

## 6. Scientific Instrumentation Suite

The system implements 8 authored instruments across all 5 canonical categories:

1. **Imaging Instruments:**
   - `INST_MASTCAM_STEREO`: Mastcam Multispectral Stereo Mast (Range: 180m, Yield: 45 Sci, Duration: 1.5s).
   - `INST_MICROSCOPIC_IMAGER`: Robotic Arm Micro-Imager (Range: 40m, Yield: 60 Sci, Duration: 2.0s).
2. **Geological Analysis Instruments:**
   - `INST_APXS_SPECTROMETER`: Alpha Particle X-Ray Spectrometer (Range: 30m, Yield: 90 Sci, Duration: 3.0s).
   - `INST_CORE_DRILL_SYSTEM`: Rotary-Percussive Rock Core Drill (Range: 25m, Yield: 140 Sci, Duration: 4.5s). Automatically bores intact sealed core samples into storage canisters.
   - `INST_LASER_CHEMCAM`: Standoff Laser-Induced Breakdown Spectrometer (Range: 140m, Yield: 110 Sci, Duration: 2.2s).
3. **Environmental Observation Instruments:**
   - `INST_METEOROLOGY_STATION`: Surface Environmental & Weather Suite (Range: 300m, Yield: 50 Sci, Duration: 1.0s).
   - `INST_RADIATION_DETECTOR`: Cosmic Ray & Radiation Sensor (Range: 250m, Yield: 75 Sci, Duration: 1.5s).
4. **Surface Scanning Instruments:**
   - `INST_GROUND_RADAR`: Subsurface Sounding Radar (RIMFAX) (Range: 100m, Yield: 125 Sci, Duration: 2.5s).
5. **General Scientific Observation:**
   - `INST_SAMPLE_ANALYSIS_LAB`: Miniature Internal Wet-Chemistry Laboratory (Range: 30m, Yield: 180 Sci, Duration: 5.0s).

---

## 7. Energy & Vehicle Condition Management

Rover survival is designed to offer meaningful gameplay without punishing single-mistake soft-locks:
1. **Energy Balance:**
   - Solar arrays charge batteries in daylight; charging is attenuated as dust accumulates.
   - RTG systems generate continuous power unaffected by night or dust storms.
   - Driving, steering, and firing instruments consume energy.
2. **Battery Depletion State:**
   - If energy reaches 0%, rover enters `DEPLETED` mode: driving motors lock to prevent damage while the vehicle trickles charge from solar or RTG until mobile again.
3. **Condition & Wear:**
   - Continuous travel on rough crags causes minor wear; collisions inflict impulse damage. Below 25% condition, rover enters `DEGRADED` state with lower top speed.
4. **Field Maintenance Actions:**
   - `CLEAN_SOLAR_PANELS`: Panel wiper routine clears 100% dust accumulation.
   - `EMERGENCY_BATTERY_JUMP`: Capacitive discharge restores +35% battery.
   - `CHASSIS_FIELD_REPAIR`: Structural realignment restores +25% vehicle condition.
   - `DIAGNOSTIC_REBOOT`: Resets software controllers, clearing `DEGRADED` state.
   - `CALIBRATE_INSTRUMENTS`: Zeroes sensor baselines and clears cooldown timers.

---

## 8. Autonomous Navigation System

The autonomous controller provides predictable, reliable unmanned navigation:
1. **Waypoint Plotting:**
   - Players can click anywhere on the tactical radar minimap or specify coordinate targets.
2. **Shortest Angular Path Steering:**
   - Computes target heading angle and applies proportional steering toward the objective.
3. **Forward Obstacle Deflection:**
   - Scans a 140m envelope ahead of the chassis; if an obstacle is detected in the travel lane, computes cross-product deflection steering left or right to avoid impact.
4. **Point of Interest Auto-Stopping:**
   - When approaching an undiscovered landmark or anomaly, the autonomous controller automatically applies brakes, allowing the player or automated science routine to inspect the discovery.
5. **Arrival Halting:**
   - Within 35px of target destination, rover halts smoothly, clears waypoint queue, and returns to `ACTIVE` standby.

---

## 9. Visual Presentation & Effects

Rendered in 2D/2.5D using PixiJS v8:
- **Composite Rover Body:** Layered rendering of rocker-bogie wheel struts, treaded wheels, titanium chassis body, solar panel grid with photovoltaic textures, RTG cylinder with glowing core, antenna dish, pan-tilt mast, and articulated robotic arm.
- **Dynamic Suspension Dynamics:** Frame-to-frame pitch tilting on acceleration/braking and subtle rocking bounce on uneven terrain.
- **Wheel Animation:** Wheel rotation speed dynamically tracks ground displacement and velocity direction.
- **Dynamic Drop Shadow:** Elliptical ground shadow scales with suspension height and speed.
- **Terrain-Colored Dust Particles:** Emits fading dust plumes at wheel contacts (Martian rust-orange, Lunar slate-gray, Europa ice-blue).
- **Tire Tread Tracks:** Records dual tire tread marks behind wheels that persist and fade gradually.
- **Lighting Integration:** Twin forward headlight illumination cones and mast camera sweeps during scanning.

---

## 10. Public Integration Contract (`RoboticRoverManager`)

The central manager exposes the 11 public API methods mandated by Prompt 34:

```typescript
export class RoboticRoverManager {
  // 1. Register a new rover configuration
  public registerRover(config: RoverConfig): RoverRecord;

  // 2. Retrieve an existing rover record by ID
  public getRover(roverId: string): RoverRecord | undefined;

  // 3. List all registered rovers with optional destination filter
  public listAvailableRovers(destinationId?: string): RoverRecord[];

  // 4. Deploy a rover to a planetary destination landing site
  public deployRover(
    roverId: string,
    destinationId: string,
    missionId?: string,
    landingSite?: Vector2D
  ): RoverDeploymentResult;

  // 5. Apply teleoperation control input (throttle, steer, brake, boost, crawl)
  public controlRover(roverId: string, input: RoverControlInput): void;

  // 6. Set autonomous target coordinates or POI ID
  public setRoverTarget(roverId: string, target: Vector2D | string): boolean;

  // 7. Toggle autonomous navigation mode
  public activateAutonomousMode(
    roverId: string,
    enabled: boolean,
    mode?: AutonomousBehaviorMode
  ): boolean;

  // 8. Retrieve comprehensive real-time telemetry snapshot
  public getRoverStatus(roverId: string): RoverTelemetryStatus | undefined;

  // 9. Fire a mounted instrument to collect scientific observations
  public collectRoverObservation(
    roverId: string,
    instrumentId: string,
    targetId?: string
  ): ObservationResult;

  // 10. Complete an exploration objective and award credits/research data
  public completeExplorationObjective(
    roverId: string,
    objectiveId: string
  ): ObjectiveCompletionResult;

  // 11. Return rover to lander/base and unload collected core samples
  public returnRover(roverId: string, returnLocationId?: string): ReturnResult;

  // Additional maintenance and state lifecycle methods
  public performMaintenance(roverId: string, action: RoverMaintenanceAction): MaintenanceResult;
  public update(deltaSeconds: number): void;
  public serializeState(): ExplorationSaveState;
  public deserializeState(state: ExplorationSaveState): void;
}
```

### Strongly Typed Domain Events:
Dispatched via `ExplorationEventBus` and bridged to the central `EventBus` (`exploration:<event>`):
- `RoverRegistered`
- `RoverDeployed`
- `RoverMovementStarted`
- `RoverPositionUpdated`
- `PointOfInterestReached`
- `ScientificObservationCollected`
- `ExplorationObjectiveCompleted`
- `RoverReturned`
- `RoverStatusChanged`
- `RoverEnergyLow`
- `RoverConditionDegraded`
- `AutonomousTargetReached`
- `RoverMaintenancePerformed`

---

## 11. Modular Adapters

To preserve repository boundaries without touching external teams' code, five clean adapters bridge subsystems:
1. `PlanetaryEnvironmentAdapter`: Queries terrain difficulty, obstacles, boundaries, POIs, and discovery locations.
2. `CommunicationsNetworkAdapter`: Interlinks with Prompt 31's `CommunicationsNetworkManager` for RF signal quality, latency, and line-of-sight status.
3. `ScientificDataAdapter`: Submits collected science observations and objective credits directly into agency resources.
4. `MissionSimulationAdapter`: Binds rover deployments and objective completions to active mission instances.
5. `PayloadDeliveryAdapter`: Inspects transported payloads from Prompt 29's `PayloadTransportationService` to deploy transported rovers onto surfaces.

---

## 12. Automated Test Verification & Results

All tests have been executed with Vitest under Node.js:

### Exploration Test Suite Breakdown:
- `tests/exploration/RoverRegistry.test.ts` (5 tests):
  - Model definitions, default fleet, custom registration, duplicate prevention, destination filtering, and stat differentiation.
- `tests/exploration/RoverMovementAndPhysics.test.ts` (7 tests):
  - Forward acceleration, reverse speed capping, steering angle normalization, braking, terrain drag, boost/crawl modes, suspension pitch.
- `tests/exploration/RoverCollisionAndTerrain.test.ts` (5 tests):
  - Boundary clamping, circular obstacle detection, sliding deflection velocity, high-speed impact damage, and 50% heavy armor resistance.
- `tests/exploration/RoverEnergyAndMaintenance.test.ts` (5 tests):
  - Diurnal solar recharge, night blackout, continuous RTG generation, dust deposition degradation, depletion state, and all 5 maintenance procedures.
- `tests/exploration/RoverInstrumentsAndScience.test.ts` (5 tests):
  - Operational range check, out-of-range rejection, insufficient battery rejection, cooldown timers, and rock core sample drilling/storage.
- `tests/exploration/RoverAutonomousAndExploration.test.ts` (6 tests):
  - Waypoint steering, arrival halting, obstacle deflection, POI auto-stopping, objective completion rewards, and lander return sample unloading.
- `tests/exploration/RoboticRoverManager.test.ts` (14 tests):
  - Comprehensive verification of all 11 public API methods, state serialization/deserialization, event dispatches, and adapter integrations.
- `tests/exploration/RoverUIAndRendering.test.ts` (9 tests):
  - Composite visual rendering, dust particle lifecycle, tire tracks, telemetry gauges, radar minimap, science panel, objectives panel, deployment modal, and remote cockpit.

### Full Test Suite Results:
- **Exploration Test Files:** 8 passed (8)
- **Exploration Unit Tests:** 56 passed (56)
- **Total Test Files in Repository:** 124 passed (124)
- **Total Unit Tests in Repository:** 740 passed (740)
- **Regressions:** 0
- **TypeScript Strict Compilation:** 0 errors in `src/exploration/`.

---

## 13. Integration Instructions for Other Laptops

### 13.1 Mission Operations & Control (Prompt 30)
To inspect the status of active surface rovers or open the remote operations cockpit:
```typescript
import { RoboticRoverManager, RoverRemoteControlDashboard } from '../exploration';

const roverManager = RoboticRoverManager.getInstance();
const rovers = roverManager.listAvailableRovers('DEST_MARS');

// Embed remote control dashboard into scene container
const dashboard = new RoverRemoteControlDashboard(roverManager);
dashboard.setActiveRover(rovers[0].id);
sceneContainer.addChild(dashboard.container);
```

### 13.2 Payload & Transport Missions (Prompt 29)
When a spacecraft carrying a rover payload touches down on a celestial surface:
```typescript
roverManager.deployRover(roverPayload.id, mission.destinationId, mission.id, touchdownCoords);
```

### 13.3 Planetary Environment Generator (Laptop 2)
When dynamic procedural terrain is generated, register the sector data directly via:
```typescript
roverManager.environmentAdapter.registerCustomSector({
  destinationId: 'DEST_TITAN',
  name: 'Kraken Mare Shoreline',
  boundary: { minX: 0, maxX: 4000, minY: 0, maxY: 3000 },
  landingSite: { x: 1000, y: 1500 },
  baseTerrain: TerrainType.REGOLITH_DUNES,
  ambientLight: 0.5,
  obstacles: customObstacles,
  pointsOfInterest: customPois,
  scientificLocations: customDiscoverySites,
  objectives: customObjectives,
});
```

---

## 14. Known Limitations & Extensibility

- **Terrain Mesh Resolution:** Physics treats terrain as continuous 2D plane with localized obstacle circles and regional difficulty modifiers rather than heightmap vertex deformation.
- **Direct Line of Sight:** Communications delay is simulated deterministically via distance tiers and DSN coverage rather than true 3D Keplerian line-of-sight raycasts through planetary cores.
- **Extensible Instruments:** New scientific instruments can be authored and added to `DEFAULT_INSTRUMENTS` without changing core physics or engine code.
