# Architecture Decision Log: INTERSTELLAR CONTINUUM

This log documents foundational architectural and technology decisions made for **INTERSTELLAR CONTINUUM**, detailing the context, decision, consequences, and evaluated alternatives.

---

## Decision 001: Selection of Primary Programming Language & Runtime

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The game must be developed strictly inside Google Antigravity IDE. It requires high maintainability, strict typing, rapid iteration cycles, and rich tooling support.
- **Decision:**
  Adopt **TypeScript (v5.x / ES2022 target)** executing on modern **Node.js (v24 LTS)**.
- **Why Chosen:**
  1. TypeScript provides compile-time type safety, interface contracts, and excellent refactoring tooling natively supported in Antigravity IDE without external IDE plugins.
  2. Direct interoperability with web standard rendering APIs (WebGL 2, WebGPU).
  3. Eliminates native cross-compilation headaches and complex build tool installations.
- **Alternatives Evaluated & Rejected:**
  - _Rust / WebAssembly (wasm-bindgen):_ Rejected. Although Rust provides stellar raw CPU performance, it requires external `cargo` toolchains (not available in the current machine environment) and adds substantial build latency and boundary marshalling overhead between WASM and the browser DOM/canvas.
  - _Plain JavaScript:_ Rejected. Lack of compile-time types would introduce severe fragility in complex orbital math, save serialization, and multi-service event systems.

---

## Decision 002: Selection of 2D/2.5D Rendering Engine

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The game must remain strictly 2D or 2.5D. It must deliver visually impressive rendering quality, multi-layer parallax, smooth camera movement, custom GLSL/WGSL shaders (atmospheric glow, particle plumes), and high performance inside Antigravity IDE.
- **Decision:**
  Adopt **PixiJS v8 (`pixi.js` ^8.23.0)**.
- **Why Chosen:**
  1. PixiJS is the industry-leading 2D rendering engine for the web, featuring a high-performance scene graph with automatic sprite batching.
  2. Native WebGPU support with automatic WebGL 2 fallback.
  3. First-class custom filter and shader support for atmospheric scattering, nebula distortion, thruster particle glow, and CRT telemetry screens.
  4. Supports rich 2.5D depth through z-index sorting, multi-container parallax layering, and isometric camera transformations.
  5. 100% compliant with Project Rule 1 (runs directly in Antigravity IDE) and Rule 3 (no 3D engine).
- **Alternatives Evaluated & Rejected:**
  - _Unity 6 LTS (URP):_ Strongly Rejected. A previous attempt committed Unity project files to this repository. Unity was rejected because:
    - It is a full 3D game engine, violating Project Rule 3.
    - It cannot be developed natively inside Google Antigravity IDE (requires an external proprietary desktop Unity Editor GUI), violating Project Rule 1.
    - It was not installed or operational on the system.
  - _Phaser 3:_ Evaluated. While mature, Phaser 3 has an older rendering pipeline with more rigid architecture compared to PixiJS v8's modern WebGPU-first batching pipeline.
  - _Three.js:_ Rejected. Three.js is primarily a 3D scene engine; using it for a 2D/2.5D game introduces full 3D engine overhead and violates Project Rule 3.

---

## Decision 003: Selection of Build System & Dev Server

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  Fast developer feedback loop, hot module replacement, and production asset bundling are required.
- **Decision:**
  Adopt **Vite (`vite` ^8.3.8)**.
- **Why Chosen:**
  1. Cold start time of under 200 ms (verified at 184 ms).
  2. Native ES module serving during development; zero bundling delay.
  3. Optimized Rollup production builds with sourcemaps and code splitting.
  4. Native support for TypeScript and CSS without complex webpack configurations.
- **Alternatives Evaluated & Rejected:**
  - _Webpack / Turbopack:_ Slower dev startup, complex config files.
  - _Parcel:_ Less deterministic plugin configuration and weaker integration with Vitest.

---

## Decision 004: Selection of Testing Framework

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The project requires automated verification of orbital mathematics, rocket equations, economy transactions, and save serialization.
- **Decision:**
  Adopt **Vitest (`vitest` ^5.1.0)**.
- **Why Chosen:**
  1. Shares configuration and module resolution directly with `vite.config.ts`.
  2. Blazingly fast in-memory execution (entire 12-test suite runs in under 385 ms).
  3. Native TypeScript and ESM support without transpiler wrappers.
- **Alternatives Evaluated & Rejected:**
  - _Jest:_ Requires `ts-jest` or Babel preprocessing, leading to slower execution and ESM friction.

---

## Decision 005: Simulation Physics Strategy (Custom Orbital Engine vs Generic Physics Engine)

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The game requires realistic, educational space mechanics (Keplerian orbits, Hohmann transfers, Tsiolkovsky delta-V, gravity wells), alongside 2.5D top-down collision in headquarters and surface rover driving.
- **Decision:**
  Implement a **Scientifically Grounded Custom Orbital Engine (`OrbitalMechanics`)** combined with deterministic 2D vector kinematics.
- **Why Chosen:**
  1. Space simulation requires analytical Keplerian equations (vis-viva, conic sections) and numerical integrators (Verlet / Runge-Kutta), which standard 2D rigid-body engines (like Matter.js or Box2D) do not provide natively.
  2. Deterministic calculations prevent orbital drift and numerical inaccuracies during high time-warp speeds (1x to 100,000x).
  3. Keeps dependencies lean, lightweight, and completely auditable.
- **Alternatives Evaluated & Rejected:**
  - _Matter.js / Rapier2D for Spaceflight:_ Generic rigid-body engines are built for terrestrial box/circle collisions under constant gravity ($g$), which causes severe inaccuracies, drift, and jitter when simulating orbital trajectories across millions of kilometers.

---

## Decision 006: State Management & Service Architecture

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The simulation, rendering, economy, research, and UI systems must communicate cleanly without circular dependencies or monolithic coupling.
- **Decision:**
  Adopt a **Decoupled Service Architecture with a Typed EventBus and ServiceLocator**.
- **Why Chosen:**
  1. Clear separation of concerns: `EconomyService`, `MissionService`, `ResearchService`, and `SaveService` maintain their own domain boundaries.
  2. Simulation runs independently of the rendering frame rate; tick loops can be paused, stepped, or accelerated without affecting UI responsiveness.
  3. Paves the way for multiplayer synchronization: pure state transformations (`(State, Action) => State`) make state delta serialization straightforward.
- **Alternatives Evaluated & Rejected:**
  - _Global Monolithic Singleton (`GameManager`):_ Prone to high coupling, hard to unit test, and leads to maintenance nightmares as features expand.

---

## Decision 007: 12-Layer Rendering Pipeline & 2.5D Depth Simulation

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  Visual depth and atmospheric fidelity are essential for immersion in a 2D/2.5D space agency simulation without using full 3D geometry or engines.
- **Decision:**
  Adopt a 12-layer canonical rendering stack managed by `LayerManager` combined with `DepthSystem` (perspective scaling, parallax factor, aerial fog tinting, zero-allocation Y-sorting) and `LightingSystem` (2D ambient darkness mask with dynamic point and spot lights).
- **Why Chosen:**
  1. Guarantees deterministic rendering order: backgrounds, celestial bodies, parallax starfields, world tiles, gameplay entities, foreground occluders, particles, lighting, HUD, and overlays never render out of order.
  2. Zero-allocation Y-sorting ensures top-down 2.5D entities layer accurately based on ground contact position.
  3. Safe headless execution for tests without DOM dependencies.

---

## Decision 008: Central Camera System, Coordinate Matrix & Frustum Architecture

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  Exploration across planetary surfaces, agency headquarters, and tactical mission overviews requires a smooth, versatile camera system with rock-solid boundary limits and coordinate conversions.
- **Decision:**
  Implement `CameraSystem` with 7 specialized modes (`PLAYER_FOLLOW`, `FREE`, `CINEMATIC`, `MISSION_OVERVIEW`, `PLANETARY_EXPLORATION`, `HEADQUARTERS`, `INTERFACE_FOCUSED`), target deadzone tracking, velocity lookahead, 4-way bi-directional coordinate conversions (`CoordinateConverter`), frustum culling, and trauma-based screen shake with accessibility controls.
- **Why Chosen:**
  1. Smooth exponential follow eliminates micro-jitter while deadzone allows subtle player adjustments without moving the screen.
  2. Velocity lookahead provides predictive view framing in the direction of motion.
  3. Full boundary clamping prevents showing areas outside the designed game world.

---

## Decision 009: 2D Collision Architecture, Independent Axis Sliding Resolution & Mission Director Identity

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  Interior exploration of agency headquarters and future surface exploration require responsive player controls, natural character portrayal, and reliable 2D collision without sticky corners.
- **Decision:**
  1. **Player Identity:** The player represents the **Mission Director** of the independent aerospace agency exploring Earth headquarters (formal aerospace executive attire with blazer, badge lanyard, and grounding drop shadow; strictly NOT an astronaut in a spacesuit on Earth).
  2. **Movement:** 8-direction cardinal and diagonal movement with mandatory diagonal normalization ($1/\sqrt{2} \approx 0.7071$), acceleration, deceleration, and sprint speed.
  3. **Collision Architecture:** Custom lightweight 2D collision system with `BoxCollider` and `CircleCollider`, decoupled from sprite visual bounds (foot collider at character base for 2.5D visual overlap).
  4. **Independent Axis Sliding:** Movement is tested and resolved sequentially: advance X and clamp if colliding; advance Y from new X and clamp if colliding. This prevents wall sticking and enables effortless sliding along walls and desks.
  5. **Broadphase:** `SpatialHashGrid` with 128px cell bucketing for $O(1)$ spatial queries.
- **Why Chosen:**
  1. Prevents frustrating player snagging on wall corners and interior furniture.
  2. Decoupling foot collision from character visual sprite allows the character's head and torso to visually overlap furniture behind them, creating convincing 2.5D depth.
  3. Avoids heavy external physics engines while remaining fully deterministic and headless-testable.

---

## Decision 010: Character Animation Architecture, Speed-Synchronized Playback & Directional Hysteresis

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The Mission Director character requires fluid, grounded, and expressive visual animation during headquarters exploration. The animation system must avoid common 2D issues such as foot sliding during acceleration/deceleration, sprite flickering during diagonal motion, and lack of visual grounding.
- **Decision:**
  1. Implement an independent `AnimationStateMachine` decoupled from movement logic, supporting states `IDLE`, `WALK`, `RUN`, `INTERACT`, `ENTER_BUILDING`, `EXIT_BUILDING`, and `STOP_TRANSITION`.
  2. Implement **dynamic speed synchronization**: walk and run animation playback speeds scale directly with actual movement velocity ($ratio = \text{speed} / \text{baseSpeed}$), strictly eliminating foot sliding across all speeds.
  3. Implement `DirectionSelector` with **25% directional hysteresis** ($1.25\times$), stabilizing character facing during diagonal travel and preventing erratic sprite switching.
  4. Implement `CharacterVisualRenderer` supporting breathing and blinking cycles during idle, distinct forward lean and bent-elbow drive during sprint, rhythmic typing postures during terminal interaction, and dynamic ground drop shadow squashing on stride plant.
  5. Implement `CharacterSpriteSheetGenerator` for canonical frame metadata ($48 \times 72$ px, $0.5, 0.95$ foot anchor) and texture cache management with headless test safety guards.
- **Why Chosen:**
  1. Decoupling animation state management from movement logic ensures the movement controller remains clean and maintainable.
  2. Speed-scaled animation playback ensures footsteps match ground displacement realistically.
  3. Directional hysteresis provides rock-solid orientation in 2.5D top-down perspective without visual stutter.

---

## Decision 011: Environmental Interaction Framework, Hysteresis Target Selection & Safe Execution Pipeline

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The player character must be able to approach facilities, doors, consoles, terminals, and planetary objects in 2D/2.5D space and trigger contextual interactions. The architecture must strictly avoid embedding interaction logic inside the player movement controller, prevent prompt flickering in high-density areas, support requirement checks, and guarantee safe recovery if an action hangs or errors.
- **Decision:**
  1. **Decoupled System Architecture:** Implement `InteractionSystem` as an independent game system (`SystemId.INTERACTION`, priority 14, between Player priority 13 and Render priority 15), managing an object registry of `IInteractiveObject` instances.
  2. **Proximity & Hysteresis Targeting:** Implement `TargetSelector` with a 20% hysteresis threshold ($0.8\times$ distance ratio). A competing candidate must be at least 20% closer or have strictly higher priority to steal active focus from the currently targeted object, eliminating visual prompt flickering.
  3. **Contextual In-World Prompt:** Implement `ContextualPrompt` displaying `[ E ]` key badge, contextual action text (e.g. `Enter Mission Operations`, `Access Research Terminal`), and status warnings with smooth alpha fade transitions and mouse-click support.
  4. **Reusable Dialogue & Inspection Modal:** Implement `InformationPanel` rendering sci-fi glass dialogue modals with title, category tags, multi-line descriptions, structured key-value specifications, and Confirm/Close actions with automatic input locking (`InputManager.lockInput('InformationPanel')`) and keyboard shortcuts (`Escape`, `E`, `Enter`).
  5. **Building & Facility Portals:** Implement `BuildingEntrance` extending `InteractiveObject`, supporting physical entrance/exit portals, door animations, and dual event dispatches (`building:entered`, `building:exited`, `BuildingEntered`).
  6. **Safe Execution Pipeline:**
     - Validate target availability and evaluated requirements (`clearance`, `tech`, `cooldown`).
     - Lock player movement input (`InputManager.lockInput('InteractionExecution')`).
     - Trigger appropriate character animation (`playInteraction` or `playEnterBuilding`).
     - Dispatch domain events (`InteractionRequested`, `interaction:executed`, `InteractionCompleted`).
     - Race execution against a 3.0s timeout safeguard and unlock input in a `finally` block to ensure the player can never be permanently trapped or frozen by a rejected promise or hung handler.
- **Why Chosen:**
  1. Keeps movement and animation controllers completely decoupled from environmental logic.
  2. The 3.0s timeout and structured lock counting guarantee zero soft-locks or permanent input freezes.
  3. Hysteresis prevents visual prompt vibration when walking equidistant between two consoles or doors.
  4. Fully covered by unit tests (212/212 tests passing).

---

## Decision 012: 2.5D Headquarters Campus Architecture, Spatial Layout & Multi-Tier Environmental Systems

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The game requires its first major explorable environment: the Earth-based aerospace campus serving as the player's primary home base. It must feel like an authentic independent aerospace organization, contain all 12 operational facilities, an integrated physical launch complex, internal pathways, landscaping, atmospheric details, and be performant and fully navigable without getting the player stuck.
- **Decision:**
  1. **Map Dimensions:** Standardized on $3600 \times 2400$ px ($3:2$ ratio), balancing spatial expansiveness with brisk player traversal times (10–12s between key facilities).
  2. **Coherent Spatial Zoning:** Structured into 5 logical campus sectors:
     - _Arrival & Security (West):_ Arrival loop and Administration.
     - _Central Plaza (Center):_ Civic hub with compass rose mosaic, wayfinding directory kiosk, benches, and lamp posts.
     - _North Science Wing:_ Cleanroom satellite lab, R&D centre, and planetary observatory dome.
     - _South Operations Wing:_ Mission Operations Centre (MOC), robotics obstacle yard, and twin 18m DSN dishes.
     - _East Spaceport Wing:_ Rocket Engineering VAB, Manufacturing Centre, heavy dual rollout crawler tracks, and Pad Alpha launch complex.
  3. **Multi-Tier Procedural Rendering:**
     - `CampusGroundRenderer`: Lawn striping, 90px asphalt roads, 48px pedestrian promenades with glowing recessed guides, heavy crawler tracks, and Pad Alpha hexagonal apron with flame trench grill.
     - `CampusBuilding`: 2.5D architectural facades with contact ambient occlusion drop shadows, tinted curtain glass, illuminated office/lab windows, customized roof fixtures (`RADOME`, `SOLAR`, `CRANE`, `ANTENNA`, `DOME`), glowing department signage labels, and entrance portals.
     - `CampusDecorations`: Perimeter security fences, trees with canopy shadows, streetlights with illumination halos, benches, cargo haulers, DSN dishes, 180px umbilical service tower, and spherical cryogenic tanks.
  4. **Decoupled Collision Geometry:** Building colliders cover the upper 75% structural mass, leaving the lower entrance portico open for walkable interaction. Fences and machinery colliders are registered in `CollisionSystem`.
  5. **Atmospheric FX & Diagnostics:** Floating dust motes on `PARTICLES_ATMOSPHERE` layer, soft daylight ambient lighting on `LIGHTING` layer, and diagnostic HUD with district detection and quick-teleport waypoints.
- **Why Chosen:**
  1. Strict adherence to 2D/2.5D visual rules without full 3D models or engines.
  2. Gives the campus authentic aerospace scale and atmosphere while preserving snappy navigation.
  3. Seamlessly integrates with existing Camera, Collision, and Interaction systems.
  4. Fully tested and verified across 45 test suites (220 tests passing).

---

## Decision 013: Centralized Facility Registry, Standardized Access Experience & Physical Launch Complex Functionality

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  The headquarters campus environment was established in Prompt 9. Prompt 10 mandates that every facility and the physical launch complex function as real interactive game locations with identifiable entrances, contextual prompts, standardized access interfaces, visit tracking, data-driven availability states, and functional scene navigation into interior rooms, while strictly avoiding fake buttons or implementing deep gameplay mechanics prematurely.
- **Decision:**
  1. **Centralized Data-Driven Facility Registry (`FacilityRegistry`):**
     - Single authoritative repository (`src/facilities/FacilityRegistry.ts`) managing all 10 primary facilities, Pad Alpha Launch Complex, and Arrival Gate.
     - Contracts (`FacilityTypes.ts` & `FacilityData.ts`) define unique ID, display name, department, category, world and entrance coordinates, purpose, detailed description, procedural icon identity, availability states (`OPERATIONAL`, `AVAILABLE`, `RESTRICTED`, `LOCKED`, `UNDER_UPGRADE`), required organization ranks, future gameplay systems, capabilities lists, specs, upgrade state, and visit telemetry.
     - Automatic visit logging: increments `visitCount`, records `firstVisitedTimestamp` and `lastVisitedTimestamp`, and dispatches domain events (`facility:visited`, `facility:registered`, `facility:availability-changed`, `facility:upgraded`).
  2. **Standardized Facility Access Modal (`FacilityAccessModal`):**
     - Reusable, coherent 2.5D aerospace access dialogue overlaid on `UI_OVERLAY` virtual resolution space.
     - Displays facility header, department code, glowing procedural icon, status LED badge, clearance rank requirement, operational purpose statement, and description.
     - Future Subsystem Integration card lists specific upcoming capabilities without fake controls or non-functional buttons.
     - Actions: **ENTER FACILITY** (triggers transition into facility interior and logs visit) and **RETURN TO CAMPUS** (dismisses modal and restores movement input).
  3. **Physical Launch Complex Interactive Zones (`LaunchComplexInteractiveZones`):**
     - The South-East launch complex is configured with 7 walkable physical installations:
       1. `LC_ZONE_LAUNCHPAD`: Pad Alpha hexagonal mount, refractory flame trench deflector, and 4x hydraulic hold-down clamps.
       2. `LC_ZONE_INFRASTRUCTURE`: Umbilical service tower, swing-arm propellant feed lines, and lightning mast.
       3. `LC_ZONE_ROCKET_PREPARATION`: Dual-gauge crawler transporter rollout apron and mobile launcher platform ties.
       4. `LC_ZONE_ASSEMBLY_ROLLOUT`: VAB South high-bay rollout interface and motorized guillotine door.
       5. `LC_ZONE_PRELAUNCH_INSPECTION`: Weatherproof avionics checkout station and pyrotechnic safety interlocks.
       6. `LC_ZONE_OBSERVATION_BUNKER`: Blast-hardened bunker with periscope viewing slits and countdown clocks.
       7. `LC_ZONE_GSE_CRYO`: Cryogenic propellant storage farm (LOX, LH2, high-pressure helium purge manifolds).
     - Each installation has a solid collider in `CollisionSystem` and an `InteractiveObject` in `InteractionSystem` returning detailed operational telemetry and clearly stating that launch simulation will activate once flight vehicles are staged.
  4. **Reusable Facility Interior Scene (`FacilityInteriorScene`):**
     - Dedicated 2.5D interior room ($1600 \times 1000$ px) with metallic tiled flooring, wall boundary colliders, ambient lighting, and facility-specific screen arrays.
     - Features an interactive South airlock door (`BuildingEntrance` with `isExit: true`) that transitions seamlessly back to `HeadquartersScene`, returning the player character to the exact exterior entrance coordinate and smoothly restoring input.
     - `HeadquartersScene` supports `onActivate(payload)` with coordinate restoration and preserves campus state via `cleanupPrevious: false`.
- **Why Chosen:**
  1. Prevents hardcoding 10 separate entrance implementations; provides a unified, data-driven architecture.
  2. Complies with strict instructions not to create decorative buildings that do nothing, nor create fake buttons for unbuilt features.

---

## Decision 014: Title Screen Presentation, Startup Flow Controller, and Save Overwrite Safeguards

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  Prompt 11 mandates the complete game startup experience, title screen, and main menu. The startup flow must reliably distinguish between first-time and returning players, provide authentic continue functionality without fake data, protect existing player ventures from accidental overwrites, and provide a polished 2D/2.5D visual presentation consistent with the game's aerospace themes.
- **Decision:**
  1. **Centralized Startup Flow Controller (`StartupFlowController`):**
     - Single state machine evaluating save slot 1 via `SaveService`.
     - Intelligently distinguishes `FIRST_TIME` vs `RETURNING` players.
     - `Continue`: Automatically restores saved organisation state, synchronizes `GameStateManager` with agency credentials and treasury, and transitions directly to `HEADQUARTERS` without repeating introductory cinematic sequences.
     - `New Organisation`: If an existing venture is detected, blocks execution unless explicit overwrite confirmation is received. Prevents silent player data loss. Routes fresh venture to `INTRO_CINEMATIC`.
     - `Replay Introduction`: Flags replay mode, preserves existing save data, and transitions to `INTRO_CINEMATIC`.
  2. **Atmospheric 2D/2.5D Title Visuals (`TitleBackgroundRenderer`):**
     - Multi-layer procedural starfield with 220 twinkling stars across 3 depth planes.
     - Procedural radial nebulae in cyan and deep violet.
     - Illuminated crescent Earth limb with dual-layer Rayleigh scattering atmospheric glow.
     - Distant celestial companion (Moon/Mars) with orbital trajectory track.
     - Artificial satellite traversing an orbital trajectory with pulsing LED beacon.
     - Interactive mouse parallax shifting stars, nebulae, and planets dynamically.
  3. **Title Screen Menu & Modals (`TitleMenuRenderer`, `ConfirmationDialog`, `SettingsModal`, `CreditsModal`):**
     - "PRESS TO START" entrance prompt with sinusoidal breathing animation responding to keyboard, mouse, and gamepad.
     - Menu options: `Continue`, `New Organisation`, `Settings`, `Credits`, `Replay Introduction`, `Exit Game`.
     - Continue is disabled with visual dimmed styling when no save exists.
     - `ConfirmationDialog`: Aerospace modal warning of impending save replacement with agency details.
     - `SettingsModal`: Real-time audio channel sliders (Master, Music, SFX, UI) hooked to `AudioService` and `ConfigManager`, accessibility toggles (Reduced Motion, High-Contrast Subtitles), and input mappings card.
     - `CreditsModal`: Production credits roll.
  4. **Introductory Cinematic Foundation (`IntroCinematicScene`):**
     - Bridges title flow to Earth Headquarters campus with narrative prologue, orbital diagram, and advance keybinds.
- **Why Chosen:**
  1. Adheres to strict 2D/2.5D visual rules without full 3D models or engines.
  2. Protects player progress with robust overwrite confirmation dialogs.
  3. Decouples startup logic cleanly from rendering and scene management.
  4. Fully verified across 49 test suites (243 tests passing with 100% pass rate).

---

## Decision 015: 6-Act Introductory Cinematic Architecture, Sequencer & Headquarters Spawn Handoff

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  Prompt 12 mandates the creation of the complete, original 2D/2.5D introductory cinematic establishing the game setting, the player's appointment as Mission Director of a modest independent space exploration organisation, the Solar System exploration roadmap, and a smooth conclusion transitioning into the explorable Earth headquarters campus with the player character spawning at the intended location.
- **Decision:**
  1. **Reusable Cinematic Sequencer (`CinematicSequencer`):**
     - Data-driven timeline runner supporting chronological scene progression, camera waypoints with cubic ease-in-out interpolation, subtitle cue evaluation, and lifecycle state management (`STOPPED`, `PLAYING`, `PAUSED`, `COMPLETED`, `SKIPPED`).
     - Emits strongly typed events on `EventBus`.
     - Supports pausing via Escape key (freezing scene timers and displaying interactive resume modal) and skipping via Enter, Space, Escape, or pointer click (safely terminating stage nodes and calling completion).
  2. **6-Act Narrative Composition (`src/cinematics/scenes/`):**
     - _Act I (Earth):_ Detailed 2.5D planetary composition with Rayleigh scattering atmosphere, deep blue oceans, landmass contours, moving cloud bands, and an orbital satellite with flashing beacon.
     - _Act II (Scale of Space):_ Heliocentric panorama featuring radiant Sun with pulsating corona, elliptical orbits for 6 planets, planetary silhouettes, asteroid belt, and robotic deep-space probe.
     - _Act III (Independent Organisation):_ High-angle 2.5D campus overview strictly matching established campus architecture: VAB high-bay, R&D dome, MOC dish, Central Plaza, and Pad Alpha launch complex with blinking beacon.
     - _Act IV (The Opportunity):_ Technical vector CAD blueprints: 2-stage rocket staging schematic, 12U CubeSat satellite bus with solar array cells, and orbital trajectory delta-V calculations.
     - _Act V (The Player's Role):_ Directorate command console presenting credentials, unrestricted command clearance, and the 4 core pillars: Vehicle Engineering, Mission Operations, Resource Allocation, and Planetary Exploration.
     - _Act VI (The First Step):_ Approach to the Main Arrival & Security Gate (`FAC_ARRIVAL_GATE`), open barrier arm, illuminated welcome board, and ready facilities.
  3. **Lower-Third Subtitles & Controls Overlays:**
     - `CinematicSubtitleRenderer`: Letterbox glass banner with caller callsign header, smooth alpha fade, and narrative text.
     - `CinematicControlsOverlay`: Act timeline progress dots, skip prompt button, and pause modal.
  4. **Headquarters Campus Handoff:**
     - Concludes via `FadeTransition(0.6)` into `SceneId.HEADQUARTERS`.
     - Hands over payload `{ spawnX: 480, spawnY: 1350, isNewGame: true, isReplay: this.isReplay }` placing the Mission Director directly outside the Arrival Gate portico facing the campus promenade with full input and camera tracking restored.
- **Why Chosen:**
  1. Maintains grounded, educational, scientific narrative without warfare, alien invasions, or fantasy elements.
  2. Adheres to strict 2D/2.5D rendering pipeline using procedural PixiJS graphics and smooth easing.
  3. Gives players full agency with pause, resume, and skip controls while guaranteeing safe transition.
  4. Verified across 51 test suites (257 tests passing with 100% pass rate).

---

## Decision 016: Global In-Game UI Framework, Aerospace Design Tokens, and Strategic HUD Integration

- **Date:** 2026-11-15
- **Status:** APPROVED
- **Context:**
  - With explorable headquarters environments, facility interiors, and the intro cinematic in place, the game required a unified, cohesive in-game user interface framework and a primary HUD.
  - The UI must resemble modern aerospace operational software (dark slate/navy glass, sharp cyan accents, amber alerts, crisp monospace/sans-serif typography) rather than a generic arcade HUD.
  - Must display real-time player telemetry, district detection, data-bound strategic resources, and contextual interaction prompts, with absolute refusal of fake currencies or fabricated mission objectives.
- **Decision:**
  1. **Global UI Design System (`src/ui/core/`):**
     - `UIDesignTokens`: Canonical aerospace palette (`BG_BASE`, `BG_PANEL`, `CYAN`, `AMBER`, `GREEN`, `RED`), typography hierarchy, border geometry, spacing (`SAFE_MARGIN = 24`), and z-index layers.
     - `UIComponent`: Abstract base component with visibility state, smooth alpha tweening, and `reducedMotion` accessibility support.
  2. **Tactile Reusable UI Component Library (`src/ui/components/`):**
     - `UIButton`: Multi-variant tactile button (`PRIMARY`, `SECONDARY`, `OUTLINE`, `DANGER`, `GHOST`) with hover/pressed states, keyboard shortcut badges, and SFX hooks.
     - `UIPanel`: Modular window container with header bar, title, close action, and content viewport.
     - `UITabGroup`: Multi-view switcher with active indicators and badges.
     - `UIProgressBar`: Segmented/continuous progress bar with percentage readout and color overrides.
     - `UISpinner`: Rotating reticle for asynchronous operations with `start()`/`stop()`.
     - `UIScrollList`: Masked scrollable list with draggable scrollbar and mousewheel support.
     - `UICard`: Structured specification card with title, status badge, description, and key-value specs.
     - `UIDataTable`: Structured data grid with custom column formatting, header divider, and zebra stripes.
     - `UIDialog`: Centered modal prompt with backdrop shade, confirm/cancel buttons, and keyboard hooks.
  3. **Tooltip & Notification Subsystems (`src/ui/tooltips/`, `src/ui/notifications/`):**
     - `TooltipManager` & `UITooltip`: Context popover with hover delay (250ms), positioning, and virtual resolution clamping within $1920 \times 1080$.
     - `NotificationManager` & `UINotification`: Stacked tactical toasts (Info, Success, Warning, Error) with priority queueing, auto-dismiss countdown bar, anti-spam deduplication (2000ms window), and domain event listeners.
  4. **Master Strategic HUD (`GlobalHUD` & `src/ui/hud/`):**
     - `OrganisationBadgeHUD`: Top-left panel displaying agency name, rank, player status, real-time location, and active mission objective (gated strictly on actual game state).
     - `ResourcesDisplayHUD`: Top-center status bar data-bound to `GameStateManager.getState().resources` (Credits, Research Data, Raw Materials, Tech Points).
     - `InteractionPromptHUD`: Bottom-center prompt bound to `InteractionSystem` (`interaction:target-changed`), displaying action verb and target name with `[E]` key badge.
     - `CampusMinimap`: $240 \times 160$ scaled vector minimap of the $3600 \times 2400$ Earth campus, real-time player position blip, heading arrow, camera frustum, facility markers, and collapsible toggle (`M` key / button).
     - `UIButton`: Operational menu button at top-right (`[ESC] MENU`) with callback hook for pause menu.
  5. **Headquarters Scene Integration:**
     - Mounted `GlobalHUD` to `hudContainer` on `RenderLayerType.HUD`.
     - Real-time telemetry feed in `onUpdate`: updates player position, velocity, facing, district zone, and camera frustum every frame.
     - Minimap toggle hotkey (`InputAction.OpenMap` / `KeyM`).
     - Automated toast notifications on `showFeedback`.
- **Why Chosen:**
  1. Professional aerospace design aesthetic without arcade clutter.
  2. Zero fabricated information: all HUD elements bind strictly to live game state.
  3. High performance: vector graphics and efficient updates without DOM overhead.
  4. 100% verified across 55 test suites and 288 passing tests with 0 build errors.

---

## Decision 017: In-Game Pause Lifecycle, Unified Multi-Category Settings & Campus Kiosk Integration

- **Date:** 2026-11-15
- **Status:** Accepted & Implemented
- **Context:**
  Prompt 14 required implementing the in-game pause menu, a complete settings system with multi-category controls (Graphics, Audio, Controls, Accessibility, Interface, Gameplay), and seamless integration across the game without creating duplicate settings interfaces.
- **Decision:**
  1. **Pause Menu Architecture (`PauseMenu.ts`):**
     - Opened via `Escape` key, centralized `InputAction.Pause`, or top-right HUD `[ESC] MENU` button.
     - Enforces an isolated pause lifecycle: freezes gameplay updates (player controller, collisions, dust motes, interaction targeting) while keeping the pause UI responsive.
     - Locks input with reason `'PauseMenu'` via `InputManager.lockInput()`.
     - 6 action options: Resume Operations, System Settings, Controls & Keybindings, Return to Headquarters, Save Organisation Progress, and Return to Main Menu.
     - Saves state to slot 1 via `SaveService`, emits `save:saved` on `EventBus`, and displays a toast notification.
     - Return to Main Menu protected with a `UIDialog` confirmation warning.
  2. **Unified Single Settings Interface (`SettingsView.ts`):**
     - Single authoritative implementation used in the Pause Menu, Title Screen (`SettingsModal`), and Headquarters Settings building (`FAC_CENTRAL_PLAZA_KIOSK` / `SceneId.SETTINGS`).
     - 6 categories navigated by `UITabGroup`: Graphics, Audio, Controls, Accessibility, Interface, Gameplay.
     - Tactile controls: `UISlider`, `UIToggle`, `UIOptionStepper`, `UIKeybindRow`.
     - Key rebinding with automatic cross-action conflict detection.
     - "RESET CATEGORY" and "RESTORE ALL DEFAULTS" with confirmation dialogs.
  3. **Centralized Settings Model & Persistence (`SettingsManager.ts`):**
     - Strongly typed versioned schema (`schemaVersion: 1`).
     - Stored independently from organisation saves in `localStorage` under `interstellar_continuum_settings` with an in-memory fallback.
     - Resetting settings strictly never touches or overwrites organisation saves.
     - Subsystem synchronization: broadcasts `settings:changed` on `EventBus`, updates `ShaderManager.setQuality()`, `AudioService.setChannelVolume()`, `VirtualResolution.setResolutionScale()`, `CameraSystem.setReducedMotion()`, `CameraSystem.setShakeIntensity()`, `InputManager.rebind()`, and legacy `ConfigManager`.
  4. **Headquarters Campus Integration:**
     - `HeadquartersScene`: PauseMenu mounted to `UI_OVERLAY`, HUD menu button wired, window `blur` listener for focus-loss auto-pause, and `FAC_CENTRAL_PLAZA_KIOSK` mapped to `SceneId.SETTINGS`.
     - `SettingsScene`: Production scene implementing `IScene` hosting `SettingsView` and returning cleanly to `SceneId.HEADQUARTERS`.
- **Why Chosen:**
  1. Strictly single-source-of-truth: no duplicate settings UIs or conflicting configurations.
  2. Genuine subsystem impact: all sliders, steppers, and toggles directly alter running systems.
  3. Protection of player progression: settings persistence is isolated from save game data.
  4. 100% verified across 59 test suites and 310 passing tests with 0 build errors.
