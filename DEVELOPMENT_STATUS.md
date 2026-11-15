# Development Status: INTERSTELLAR CONTINUUM

## 1. Project Overview & Identity

- **Title:** INTERSTELLAR CONTINUUM
- **Genre:** 2D/2.5D Space Exploration, Mission Design & Agency Management Simulation
- **Target Runtime:** Google Antigravity IDE (Native WebGL / WebGPU via Modern Browser & Node.js Toolchain)
- **Primary Technology Stack:** TypeScript 5+, PixiJS v8, Vite 6+, Vitest 3+, Howler.js, GSAP

---

## 2. Current Development Phase

- **Active Phase:** Phase 24 — Rocket Testing Workbench, Design Inspection & Pre-Launch Readiness Interface (PROMPT 25)
- **Phase Status:** COMPLETED
- **Next Target:** Phase 25 — Spacecraft Laboratory & Satellite Systems Engineering (PROMPT 26)

---

## 3. Completed Phases

### Phase 0: Technical Foundation & Project Architecture (Completed)

- Inspected workspace and purged legacy 3D Unity files.
- Formulated, benchmarked, and locked primary technology stack: TypeScript, PixiJS v8, Vite, Vitest.
- Created permanent project documentation directory and initial test suite.

### Phase 1: Application Initialization & Core Systems Foundation (Completed)

- Built `ApplicationController` central lifecycle manager enforcing duplicate initialization guards and clean shutdown routines.
- Implemented `ConfigManager` and `GameConfig` for centralized Display, Graphics, Audio, Input, and Accessibility settings.
- Built `Logger` with configurable levels and in-memory ring buffer, plus `ErrorHandler` for global crash containment.
- Implemented `VirtualResolution` mapping dynamic viewports to canonical 1920×1080 virtual workspace.
- Built `Camera2D` with smooth target interpolation, zoom clamping, boundary collision, and screen-to-world conversion.
- Created high-polish neutral `LoadingScreen` with vector radar scanner, telemetry diagnostics, and progress bar.

### Phase 2: Core Game Architecture, Scene Management & System Infrastructure (Completed)

- **Scene Management Engine (`src/scenes/`):**
  - Implemented `SceneManager` supporting `SceneId` registration, initialization, activation, deactivation, and cleanup.
  - Implemented modal scene stack (`pushScene` / `popScene`) allowing overlays over live game scenes.
  - Implemented transition failure handling with automatic recovery of previous scenes.
  - Prevention of duplicate scene instances and complete deactivation of tick loops for old scenes.
- **Scene Transition Pipeline (`src/scenes/transitions/`):**
  - `InstantTransition`, `FadeTransition`, `OpacityTransition`, `LoadingTransition`, `CinematicTransition`.
- **System Architecture & Contracts (`src/systems/`):**
  - Established formal decoupled interfaces for all 15 core game systems.
  - Implemented `SystemRegistry` coordinating priority-sorted initialization, per-frame updates, and reverse-order shutdown.
- **Typed Event & Leak-Free Subscription System (`src/core/events/`):**
  - Strongly typed event payloads and `ScopedEventSubscriber` guaranteeing zero event listener leaks.
- **Centralized Modular Game State (`src/state/`):**
  - Modular state slices and `GameStateManager` with atomic snapshots and rollback support.
- **Centralized Input Architecture (`src/input/`):**
  - `InputManager` supporting keyboard, mouse, and gamepad polling with action rebinding, contexts, and locking.

### Phase 3: 2D/2.5D Graphics & Rendering Pipeline (Completed)

- **12 Canonical Rendering Layers (`src/rendering/layers/`):**
  - `BACKGROUND`, `DISTANT_ENVIRONMENT`, `PARALLAX`, `WORLD`, `GAMEPLAY_OBJECTS`, `FOREGROUND_ENVIRONMENT`, `PARTICLES_ATMOSPHERE`, `LIGHTING`, `WORLD_EFFECTS`, `HUD`, `UI_OVERLAY`, `CINEMATIC_OVERLAY`.
  - Controlled visibility, alpha blending, parallax scroll factors, and clear routines via `LayerManager`.
- **2.5D Depth Simulation Architecture (`src/rendering/depth/`):**
  - `DepthSystem`: Computes perspective scaling, parallax motion factor, aerial perspective (atmospheric fog color blending), and distance softening blur across virtual depths.
  - `DepthSorter`: Zero-allocation Y-sorting with depth bias support.
- **2D Dynamic Lighting Architecture (`src/rendering/lighting/`):**
  - `LightingSystem` & `LightSource` supporting point lights, spot/cone lights, radial falloff geometry, pulsation dynamics, and environmental presets.
- **Shader & Visual Effects Architecture (`src/rendering/shaders/`):**
  - `ShaderManager` coordinating custom filters (`AtmosphericHazeFilter`, `ScanlineHologramFilter`, `ThrusterHeatFilter`, `VignetteFilter`) with quality profiles (`LOW`, `MEDIUM`, `HIGH`, `ULTRA`) and headless environment safety.
- **Texture Management & Procedural Generation (`src/rendering/textures/`):**
  - `ProceduralTextures`: Anti-aliased canvas procedural generation and 2×2 magenta/black missing texture fallback.
  - `TextureManager`: Texture cache with deduplication and safe disposal.
- **Central Pipeline & System Integration (`src/rendering/pipeline/`):**
  - `RenderPipeline` & `RenderSystem` (implementing `IRenderSystem` registered in `SystemRegistry` at priority 15).

### Phase 4: Camera, Viewport, Coordinate Conversions & Screen Scaling (Completed)

- **Central Camera System (`src/camera/CameraSystem.ts`):**
  - Unified camera controller implementing `ICameraSystem` registered in `SystemRegistry` at priority 12.
  - Full coordinate state: position $(x, y)$, zoom, rotation (radians), and framing offsets.
  - Smooth interpolation using exponential dampening / configurable follow strength.
  - Scripted transitions (`panTo`, `focusOn`, `reset`) with cubic ease-in-out and completion callbacks.
- **7 Discrete Camera Modes (`src/camera/CameraMode.ts`):**
  1. `PLAYER_FOLLOW`: Smooth player/vehicle follow with deadzone and velocity lookahead.
  2. `FREE`: Unconstrained manual panning (mouse drag / arrow keys), detached from targets.
  3. `CINEMATIC`: Scripted cinematic pans, gentle floating drift, slow rotation, letterbox framing.
  4. `MISSION_OVERVIEW`: High-altitude strategic view of the operational zone.
  5. `PLANETARY_EXPLORATION`: Large-scale planetary surface navigation with terrain bounds clamping.
  6. `HEADQUARTERS`: Facility room-to-room / floor-focused interior exploration.
  7. `INTERFACE_FOCUSED`: Focuses on an interaction terminal, workbench, or console with UI offset.
- **Target Tracking & Deadzone Architecture (`src/camera/CameraTarget.ts`):**
  - Deadzone box eliminating micro-jitter when target moves within configurable threshold.
  - Velocity lookahead projecting forward along target motion vector $(vx, vy)$ clamped to maximum lead distance.
- **Camera Boundary Clamping (`src/camera/CameraBounds.ts`):**
  - Clamps focal point and visible viewport frustum to ensure black boundaries outside playable maps are never exposed.
  - Auto-centers camera along axes where bounds are smaller than visible screen.
- **Smooth Zoom Architecture & Presets:**
  - Presets: `CLOSE_INTERACTION` (1.8x), `NORMAL_EXPLORATION` (1.0x), `WIDE_ENVIRONMENT` (0.65x), `MISSION_OVERVIEW` (0.4x), `MAP_VIEW` (0.25x).
  - Mode-based zoom permissions and clamping between `minZoom` (0.2x) and `maxZoom` (5.0x).
- **Comprehensive 4-Way Coordinate Conversion Pipeline (`src/camera/CoordinateConverter.ts`):**
  - Bi-directional conversion between World, Camera, Virtual (1920×1080), and Physical Screen coordinates.
- **Viewport Frustum & Culling (`src/camera/Viewport.ts`):**
  - Computes visible world frustum AABB; culling queries with padding; safe UI area calculation.
- **Trauma-Based Screen Shake System (`src/camera/CameraShake.ts`):**
  - Quadratic trauma model with multi-harmonic oscillation and linear decay; full accessibility controls.

### Phase 5: Playable Character Controller, Movement & 2D Collision Architecture (Completed)

- **Mission Director Identity & Layered Representation (`src/player/PlayerCharacter.ts`):**
  - Player represents the **Mission Director** of the independent aerospace organization exploring Earth headquarters (strictly professional aerospace attire: dark navy executive blazer, collared shirt, gold security badge on corporate cyan lanyard, tailored slate trousers, dress boots, styled dark hair; NOT an astronaut in a spacesuit on Earth).
  - Dynamic elliptical grounding drop shadow that subtly squashes and stretches with walk strides.
  - Implements `ICameraTarget` with `getPosition()` and `getVelocity()` for seamless camera tracking.
  - 2.5D depth sorting: base foot Y coordinates dynamically update `container.zIndex`.
  - 4-way facing states (`NORTH`, `SOUTH`, `EAST`, `WEST`) and 3 movement states (`IDLE`, `WALK`, `SPRINT`) with procedural stride animation.
- **Frame-Rate Independent Movement System (`src/player/MovementComponent.ts`):**
  - 8-directional cardinal and diagonal movement.
  - **Diagonal Normalization:** Applies $1/\sqrt{2} \approx 0.7071$ scaling to prevent diagonal speed boosting.
  - Frame-rate independent velocity integration with configurable `walkSpeed` (180 px/s), `sprintSpeed` (310 px/s), `acceleration` (1400 px/s²), and `deceleration` (1800 px/s²).
- **Centralized Player Controller & Input Integration (`src/player/PlayerController.ts`):**
  - Gathers actions from centralized `InputManager` (`MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight`, `Sprint`, `Interact`).
  - Strict input lock enforcement (`inputManager.isInputLocked()` freezes player movement and prevents interaction during dialogue or menus).
  - Interacts with triggers upon pressing `Interact` (`KeyE`) and dispatches `player:interact` events on `EventBus`.
  - Emits `player:moved` events on position change.
- **Central 2D Collision Architecture (`src/collision/`):**
  - **Collider Types & Categories (`ColliderTypes.ts`):** `BoxCollider`, `CircleCollider`, categories `SOLID`, `OBSTACLE`, `TRIGGER`, `RESTRICTED`, `BOUNDARY`. Decouples collision shapes from visual artwork (foot collider centered at base of character).
  - **Collision Math (`CollisionMath.ts`):** Pure geometric intersection algorithms for AABB vs AABB, Circle vs Circle, and Circle vs AABB.
  - **Spatial Hash Grid Broadphase (`SpatialHashGrid.ts`):** Fast cell-based spatial partitioning for $O(1)$ static/dynamic proximity queries.
  - **Independent Axis Sliding Movement Resolution (`CollisionSystem.ts`):**
    - Moves along X-axis first, queries obstacles, and clamps position to obstacle edge if colliding.
    - Moves along Y-axis second, queries obstacles, and clamps position to obstacle edge if colliding.
    - Guarantees smooth sliding along walls, obstacles, and corner geometry without catching or sticking!
  - **Trigger & Interaction Tracking:** Tracks entry/exit transitions and emits `collision:trigger-enter` and `collision:trigger-exit`.
  - **Visual Debug Wireframes:** Toggleable debug graphics overlay rendering categorized colliders (Red = SOLID, Orange = OBSTACLE, Green = TRIGGER, Cyan = RESTRICTED, Yellow = BOUNDARY).
- **Player & Collision System Integration:**
  - `CollisionSystem` registered at priority 11 in `SystemRegistry` and `ServiceLocator`.
  - `PlayerSystem` registered at priority 13 in `SystemRegistry` and `ServiceLocator`.
- **Headquarters Movement Test Environment (`src/scenes/PlayerMovementTestScene.ts`):**
  - Full $2400 \times 1600$ facility environment featuring tiled floor grid, cyan floor guide strips, perimeter bulkhead walls, flight director command consoles, telemetry banks, engineering workbenches, cryogenic tanks, hydroponic planters, and interactive triggers (`MISSION_TERMINAL`, `CLEANROOM_AIRLOCK`, `HOLOPROJECTOR`).
  - Real-time diagnostic HUD showing player position, speed, movement state, facing, camera telemetry, and on-screen control buttons.

### Phase 6: Character Animation, Directional Sprites & Facility Interaction Polish (Completed)

- **Animation Architecture (`src/animation/`):**
  - **Animation State Machine (`AnimationStateMachine.ts`):** Supports `IDLE`, `WALK`, `RUN`, `INTERACT`, `ENTER_BUILDING`, `EXIT_BUILDING`, and `STOP_TRANSITION` states with priority interruption rules, loop counts, frame timing, and event hooks (`onStateEnter`, `onStateExit`, `onFrameChange`, `onLoop`, `onComplete`).
  - **Dynamic Speed Synchronization:** Dynamically scales walk and run playback rates based on actual player speed ($ratio = \text{speed} / \text{baseSpeed}$), strictly eliminating foot sliding across all acceleration and deceleration phases.
  - **Directional Selector with Hysteresis (`DirectionSelector.ts`):** 4-way direction resolution (`NORTH`, `SOUTH`, `EAST`, `WEST`) featuring a 25% directional hysteresis threshold to guarantee rock-solid directional rendering during diagonal movement without sprite flickering.
  - **Layered Visual Renderer (`CharacterVisualRenderer.ts`):**
    - `IDLE`: Gentle sinusoidal breathing cycle (torso expands $+1$px, shoulders rise) and authentic 3.8s eye-blinking cadence.
    - `WALK`: Natural 8-frame walk stride cycle with counter-balanced arm swings and vertical bounce.
    - `RUN`: Aggressive 8-frame sprint cycle with longer stride separation, 5-degree forward torso lean, bent elbows, and higher vertical bounce.
    - `INTERACT`: Terminal typing posture with raised arm, rhythmic finger tapping, and head tilt towards console screens.
    - `ENTER_BUILDING` / `EXIT_BUILDING`: Smooth step-in portal walk with linear alpha fade transitions.
    - `STOP_TRANSITION`: 3-frame foot-bracing settling motion when decelerating from high speeds.
    - **Contact Ground Shadow:** Dynamic elliptical drop shadow anchored to $(0, 0)$ that squashes on foot plant and softens/shrinks on peak bounce.
    - **Stride Contact Effects:** Dust/impact rings triggered on ground contact during sprinting and stops.
  - **Sprite Sheet & Frame Cache (`CharacterSpriteSheetGenerator.ts`):**
    - Canonical frame boundaries ($48 \times 72$ px) and anchor metadata $(0.5, 0.95)$ at character feet.
    - Texture caching with disposal routines and headless environment safety guards.
- **Player & Controller Upgrades:**
  - `PlayerCharacter` refactored to delegate to `AnimationStateMachine`, `DirectionSelector`, and `CharacterVisualRenderer`.
  - Added scripted action promises: `playInteraction()`, `playEnterBuilding()`, `playExitBuilding()`.
  - `PlayerController` automatically triggers `playInteraction()` on console triggers and enforces state priorities.
- **Headquarters Movement Test Scene (`PlayerMovementTestScene.ts`):**
  - Updated HUD with live animation telemetry (state, frame index, normalized time percentage, facing, breathing cycle).
  - Added interactive buttons for terminal typing animation and airlock enter/exit transitions.

### Phase 7: Environmental Interaction Framework & Headquarters Facilities (Completed)

- **Decoupled System Architecture (`src/interaction/`):**
  - Implemented `InteractionSystem` conforming to `IInteractionSystem` and `IGameSystem`, registered in `SystemRegistry` at **priority 14** (between `PlayerSystem` priority 13 and `RenderSystem` priority 15), keeping movement controllers completely decoupled from environmental interaction logic.
  - Full object registry supporting dynamic registration, unregistration, ID lookups, and range queries for all `IInteractiveObject` instances.
- **Stable Proximity Discovery with 20% Hysteresis (`src/interaction/TargetSelector.ts`):**
  - Evaluates proximity distances, availability conditions, priority levels, and range multipliers across candidate interactables.
  - Implements **20% distance hysteresis** ($0.8\times$ distance ratio threshold): active targets remain locked unless a competing target is at least 20% closer or possesses strictly higher priority, eliminating visual prompt flickering in crowded headquarters environments.
- **Contextual In-World Interaction Badge (`src/interaction/ContextualPrompt.ts`):**
  - Dynamic non-obstructive visual prompt displaying styled `[ E ]` key badge, contextual action text (e.g. `Access Flight Director Console`, `Enter Rocket Engineering Bay`), and warning indicators when requirements are unmet.
  - Smooth alpha fade-in/fade-out transitions, world-coordinate anchoring with camera compensation, and interactive mouse-click execution.
- **Reusable Sci-Fi Information Modal Dialogue (`src/interaction/InformationPanel.ts`):**
  - Lightweight modal dialogue panel styled with translucent cyber-glass backing, glowing cyan frame, category badges, multi-line descriptions, and structured key-value specification lists with conditional highlighting.
  - Automatically manages input locking (`inputManager.lockInput('InformationPanel')`) on open and restoration on close.
  - Supports keyboard shortcuts (`Escape`, `E`, `Enter`, `Space`) and pointer clicks for confirm and dismiss actions.
- **Physical Building Entrances & Airlock Portals (`src/interaction/BuildingEntrance.ts`):**
  - Specialized interactable supporting facility portals, airlocks, and interior/exterior transitions.
  - Dispatches dual events: kebab-case system events (`building:entered`, `building:exited`) and domain events (`BuildingEntered`).
  - Seamlessly links to player character entrance and exit animations (`ENTER_BUILDING` and `EXIT_BUILDING`).
- **Resilient Execution Pipeline with Timeout Recovery:**
  - Validates target availability and requirements (`CLEARANCE`, `TECH`, `RESOURCE`, `CUSTOM`) before triggering.
  - Locks player movement input (`inputManager.lockInput('InteractionExecution')`) and triggers character animation (`playInteraction` or `playEnterBuilding`).
  - Races interaction promises against a **3.0-second safety timeout** and guarantees input unlocking in a `finally` block, ensuring the player can never be permanently frozen or trapped by hanging promises or unhandled exceptions.
  - Dispatches lifecycle domain events: `InteractionRequested`, `interaction:executed`, and `InteractionCompleted`.
- **Headquarters Environment Integration (`src/scenes/PlayerMovementTestScene.ts`):**
  - Integrated 6 interactive stations in the headquarters map:
    1. `CONSOLE_FLIGHT_DIRECTOR`: Primary flight operations command console.
    2. `AIRLOCK_ENGINEERING`: Physical entrance to Rocket Engineering Bay.
    3. `AIRLOCK_SCIENCE_LAB`: Physical entrance to Science & Astrobiology Lab.
    4. `CRYO_PROPELLANT_DEPOT`: High-pressure propellant manifold with cooldown timer.
    5. `AIRLOCK_CLEANROOM_RESTRICTED`: Security-gated cleanroom airlock requiring Clearance Level 2.
    6. `HQ_HOLOGRAM_ARCHIVE`: Central atrium volumetric roadmap projector.
  - Added on-screen UI buttons for mouse-based interaction triggering and real-time clearance level toggling.

### Phase 8: Earth-Based Headquarters Campus Environment (Completed)

- **Campus World Dimensions & Spatial Layout (`src/environment/headquarters/`):**
  - Designed and built a complete $3600 \times 2400$ px explorable 2D/2.5D aerospace research and engineering campus ([CampusTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/environment/headquarters/CampusTypes.ts)).
  - Distinct functional campus sectors:
    1. **Arrival & Governance Sector (West):** Main Arrival Gate & Security, Finance & Administration.
    2. **Central Navigational Hub (Center):** Central Headquarters Plaza with compass rose mosaic, wayfinding directory terminal, benches, and lamp posts.
    3. **Science & Research Sector (North):** Spacecraft & Satellite Cleanroom Lab, Advanced R&D Centre, Planetary Data Centre with optical observatory dome.
    4. **Operations & Field Testing Sector (South):** Mission Operations Centre (MOC), Robotics & Rover Regolith Yard, Deep Space Network (DSN) 18m tracking dishes.
    5. **Heavy Engineering & Spaceport (East):** Rocket Engineering Facility (VAB), Resource & Manufacturing Centre, heavy dual rollout rail tracks, and Pad Alpha Launch Complex.
- **Multi-Tier Ground Surface & Pathway System (`src/environment/headquarters/CampusGroundRenderer.ts`):**
  - Manicured lawn grass terrain with striping variation.
  - 90px-wide vehicular asphalt roads with yellow dashed centerlines connecting all sectors.
  - 48px-wide concrete promenades with recessed glowing guide lines linking Central Plaza to every facility entrance.
  - Heavy dual-gauge crawler tracks connecting the VAB to Pad Alpha.
  - Pad Alpha launch complex: heavy hexagonal concrete blast apron, deep flame trench pit with steel deflector grill slats, and sound suppression deluge drainage.
- **Procedural 2.5D Architectural Generation (`src/environment/headquarters/CampusBuilding.ts`):**
  - Generates all 12 major campus facilities with contact drop shadows, slate/navy architectural paneling, reflective tinted curtain walls, glowing office/lab windows, customized roof fixtures (`RADOME`, `SOLAR`, `CRANE`, `ANTENNA`, `DOME`), glowing department signage labels, and entrance portals.
  - Solid base footprint `BoxCollider` protecting building structures while leaving entrance aprons open for walkable interaction.
  - Registers each building with `BuildingEntrance` or `InteractiveObject` for seamless environmental interaction.
- **Environmental Props & Infrastructure (`src/environment/headquarters/CampusDecorations.ts`):**
  - Perimeter chainlink security fences with access gates and solid colliders.
  - Landscaped deciduous and evergreen trees with ground drop shadows and solid trunk colliders.
  - Modern campus lamp posts with soft ambient illumination circles.
  - Plaza park benches, directional signposts, and electric cargo haulers.
  - Twin 18m parabolic DSN tracking dishes with Cassegrain sub-reflectors.
  - Pad Alpha steel truss umbilical service tower (180px tall) with red-and-white aviation bands, propellant swing-arms, lightning rod, and spherical LOX/LH2 cryogenic propellant storage tanks.
- **Headquarters Campus Scene (`src/scenes/HeadquartersScene.ts`):**
  - Production scene implementing `SceneId.HEADQUARTERS`.
  - Configures camera bounds to $(0, 0, 3600, 2400)$ with deadzone tracking, velocity lookahead, and zoom presets.
  - Connects `CollisionSystem` for walls, trees, fences, and launch pad barriers.
  - Integrates `InteractionSystem` with prompt badges, dialogue modal panels, and building portals.
  - Atmospheric dust motes drifting across the campus on wind vectors.
  - Diagnostic HUD telemetry with district detection and quick-teleport waypoints (`CENTRAL PLAZA`, `PAD ALPHA`, `VAB`, `MOC`, `R&D`, `ARRIVAL GATE`).
- **Comprehensive Verification:**
  - Dedicated test suite ([HeadquartersCampus.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/environment/HeadquartersCampus.test.ts)) verifying world bounds, facility placement, entrance accessibility, collision prevention, camera bounds, and particle updates.

### Phase 9: Headquarters Facilities & Physical Launch Complex Functionality (Completed)

- **Centralized Data-Driven Facility Registry (`src/facilities/FacilityRegistry.ts`):**
  - Authoritative registry managing metadata, status, rank progression requirements, visit logs, and upgrades for all 10 Headquarters Facilities, Pad Alpha, and Arrival Gate.
  - Contract definitions ([FacilityTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/facilities/FacilityTypes.ts)) and default parameters ([FacilityData.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/facilities/FacilityData.ts)):
    1. `FAC_MISSION_OPERATIONS`: Central flight dynamics and mission coordination nexus connecting to Solar System destination maps and mission manifest selection.
    2. `FAC_ROCKET_ENGINEERING`: High-bay VAB connecting to multi-stage rocket CAD assembly, propulsion engineering, and staging calculations.
    3. `FAC_SPACECRAFT_LAB`: ISO Class 5 cleanroom connecting to satellite bus architecture, probe instrumentation, and payload fairing integration.
    4. `FAC_RESEARCH_DEVELOPMENT`: Supercomputing center connecting to technology tree unlock trees, Research Data processing, and propulsion breakthroughs.
    5. `FAC_FINANCE_ADMIN`: Governance wing connecting to Mission Credits treasury, commercial launch contracts, personnel payroll, and insurance.
    6. `FAC_MANUFACTURING_CENTRE`: Automated CNC/3D print foundry connecting to Raw Materials inventory, component queues, and propellant synthesis.
    7. `FAC_ROBOTICS_CENTRE`: Robotics testing hangar connecting to planetary rover chassis design, sample arms, autonomous AI, and regolith drills.
    8. `FAC_COMMUNICATIONS_CENTRE`: Parabolic dish ground station connecting to Deep Space Network relays, constellation downlinks, and bandwidth budgets.
    9. `FAC_PLANETARY_DATA_CENTRE`: Astronomical observatory dome connecting to celestial atlas cataloguing, atmospheric spectroscopy, and sample vaults.
    10. `FAC_CENTRAL_PLAZA_KIOSK`: System administration terminal connecting to graphics, audio channels, keybindings, profiles, and save management.
    11. `FAC_LAUNCH_COMPLEX_PAD_ALPHA`: Heavy hexagonal launchpad and flame trench connecting to countdown sequencing and launch simulation.
    12. `FAC_ARRIVAL_GATE`: Security gate controlling campus access and visitor logs.
  - Data-driven availability states: `OPERATIONAL`, `AVAILABLE`, `RESTRICTED`, `LOCKED`, and `UNDER_UPGRADE`.
  - Automatic visit telemetry tracking: increments `visitCount`, logs timestamps, and emits domain events (`facility:visited`, `facility:registered`, `facility:availability-changed`, `facility:upgraded`).
- **Standardized Facility Access Experience (`src/facilities/FacilityAccessModal.ts`):**
  - Reusable 2.5D aerospace access dialogue overlaid on `UI_OVERLAY` virtual resolution space.
  - Procedural glowing facility icons, status LED badges, rank requirements, operational purpose statements, and detailed descriptions.
  - Future Subsystem Integration card listing upcoming capabilities without displaying fake non-functional buttons.
  - Functional action buttons: **ENTER FACILITY** (triggers transition to interior and logs visit) and **RETURN TO CAMPUS** (dismisses modal and restores movement input).
- **Physical Launch Complex Interactive Zones (`src/environment/headquarters/LaunchComplexInteractiveZones.ts`):**
  - Walkable physical campus area with 7 distinct interactive installations:
    1. `LC_ZONE_LAUNCHPAD`: Launchpad mount, refractory flame trench deflector, and 4x hydraulic hold-down clamps.
    2. `LC_ZONE_INFRASTRUCTURE`: Umbilical service tower, swing-arm propellant feed lines, and lightning mast.
    3. `LC_ZONE_ROCKET_PREPARATION`: Dual-gauge crawler transporter rollout apron and mobile launcher ties.
    4. `LC_ZONE_ASSEMBLY_ROLLOUT`: VAB South high-bay vehicle transfer interface and motorized guillotine door.
    5. `LC_ZONE_PRELAUNCH_INSPECTION`: Avionics checkout console and pyrotechnic safety interlocks.
    6. `LC_ZONE_OBSERVATION_BUNKER`: Blast-hardened bunker with periscope viewing slits and countdown clocks.
    7. `LC_ZONE_GSE_CRYO`: Cryogenic propellant storage farm (LOX, LH2, high-pressure helium purges).
  - Each zone features a solid collider and interactive object registered in `InteractionSystem` displaying technical telemetry and confirming simulation readiness.
- **Reusable Facility Interior Scene (`src/scenes/FacilityInteriorScene.ts`):**
  - Dedicated 2.5D interior environment ($1600 \times 1000$ px) with metallic tiled flooring, wall boundary colliders, ambient lighting, and facility-specific screen arrays.
  - Spawned Mission Director character with interior movement controller.
  - Interactive South airlock door (`BuildingEntrance` with `isExit: true`) that transitions seamlessly back to `HeadquartersScene`, returning the player character to the exact exterior entrance coordinate and smoothly restoring input.
- **Headquarters Integration (`src/scenes/HeadquartersScene.ts`):**
  - Wired all 12 building entrances to `handleFacilityInteraction` and `FacilityAccessModal`.
  - Registered `FacilityRegistry` in `ServiceLocator`.
  - Added support for `onActivate(payload)` with coordinate restoration.
- **Comprehensive Verification:**
  - Dedicated unit test suite ([FacilityRegistry.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/facilities/FacilityRegistry.test.ts)) verifying metadata, purpose, future system connections, availability gating, and visit tracking.
  - Dedicated integration test suite ([FacilityAccessAndInterior.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/facilities/FacilityAccessAndInterior.test.ts)) verifying entrance prompts, access modals, interior transitions, coordinate restoration, and all 7 Launch Complex interactive zones.

### Phase 10: Complete Game Startup Experience, Title Screen & Main Menu (Completed)

- **Centralized Startup Flow Controller (`src/startup/StartupFlowController.ts`):**
  - Evaluates player status dynamically (`FIRST_TIME` vs. `RETURNING`).
  - Gated `Continue` option: restores active organisation save from slot 1 directly into `GameStateManager` and transitions to `HEADQUARTERS` without repeating introductory sequences.
  - Protected `New Organisation`: prevents silent data loss by requiring explicit overwrite confirmation if an active venture exists; creates fresh save profile, resets progression, and routes to `INTRO_CINEMATIC`.
  - Harmless `Replay Introduction`: sets replay mode flag, preserves existing save data, and routes to `INTRO_CINEMATIC`.
  - Dispatches typed startup events (`startup:continue`, `startup:new-game`, `startup:replay-intro`, `startup:destination-changed`).
- **2D/2.5D Atmospheric Title Visual Composition (`src/scenes/title/TitleBackgroundRenderer.ts`):**
  - Deep space multi-layer starfield with 220 procedural twinkling stars across 3 depth layers with distinct scintillation rates.
  - Radial cyan and deep violet cosmic nebula gas clouds rendered on canvas contexts.
  - Large illuminated crescent Earth planetary limb with dual-layer atmospheric Rayleigh scattering glows.
  - Distant Moon / Mars celestial companion with orbital path visualization.
  - Moving artificial satellite gliding along elliptical orbital trajectory with pulsing navigational telemetry beacon.
  - Smooth mouse cursor parallax shifting starfield, nebulae, and planet layers dynamically.
- **Aerospace Identity & Title Treatment (`src/scenes/title/TitleLogoRenderer.ts`):**
  - Bold, architectural title treatment for `INTERSTELLAR CONTINUUM` with drop shadows and subtle luminescence breathing effect.
  - Subtitle: `A Solar System Exploration and Mission Design Experience`.
  - Technical metadata taglines: `EARTH HQ OPERATIONS // VERSION 0.1.0`.
- **Title Menu System & Modals (`src/scenes/title/`):**
  - `TitleMenuRenderer`: "PRESS TO START" entrance prompt with sinusoidal alpha breathing; responsive main menu list with interactive hover, selection chevron markers, keyboard (Up/Down/Enter/Escape) and pointer controls.
  - `ConfirmationDialog`: Aerospace overwrite prevention modal displaying active organisation name, rank, and founding date with explicit confirmation buttons.
  - `SettingsModal`: Interactive settings panel integrating with `ConfigManager` and `AudioService` (Master, Music, SFX, UI volume channels, Reduced Motion, High-Contrast Subtitles, input mappings).
  - `CreditsModal`: Production credits modal listing engine architecture, astrodynamics design, core disciplines, and dedication.
- **Production Title Screen Scene (`src/scenes/TitleScreenScene.ts`):**
  - Fully implemented `SceneId.TITLE_SCREEN` coordinating background rendering, logo presentation, menu navigation, modals, and transition triggers.
  - Audio integration hooking into `AudioService` (`menu_theme`, `ui_hover`, `ui_confirm`).
- **Introductory Cinematic Foundation (`src/scenes/IntroCinematicScene.ts`):**
  - Implemented `SceneId.INTRO_CINEMATIC` bridging startup flow to Earth Headquarters with narrative prologue, orbital diagram, and advance keybinds.
- **Comprehensive Verification:**
  - Dedicated unit tests ([StartupFlowController.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/startup/StartupFlowController.test.ts)) verifying first-time vs returning logic, save restoration, overwrite blocking, and replay modes.
  - Dedicated integration tests ([TitleScreenScene.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/scenes/TitleScreenScene.test.ts)) verifying visual composition, "PRESS TO START", continue gating, menu navigation, and dialogs.

### Phase 11: Introductory Cinematic & Narrative Solar System Prelude (Completed)

- **Reusable Cinematic Sequencing Engine (`src/cinematics/CinematicSequencer.ts`):**
  - Timeline-based event coordinator supporting chronological scene progression, camera interpolation, subtitle triggers, pause/resume, and skip handling.
  - Lifecycle state machine: `STOPPED`, `PLAYING`, `PAUSED`, `COMPLETED`, `SKIPPED`.
  - Dispatches strongly typed domain events (`cinematic:started`, `cinematic:scene-changed`, `cinematic:narration`, `cinematic:paused`, `cinematic:resumed`, `cinematic:skipped`, `cinematic:completed`).
- **6-Act Atmospheric Narrative Sequence (`src/cinematics/scenes/`):**
  - **Act I: Earth (`EarthCinematicScene.ts`):** 2.5D planetary composition with layered atmospheric Rayleigh scattering glow, deep oceans, continental contours, moving cloud strata, starry background, and orbital satellite.
  - **Act II: The Scale of Space (`SolarScaleCinematicScene.ts`):** Heliocentric perspective with glowing Sun, planetary orbits (Mercury through Saturn), planetary silhouettes with authentic hues, asteroid belt, and deep-space robotic probe.
  - **Act III: The Independent Organisation (`HeadquartersOverviewCinematicScene.ts`):** 2.5D architectural overview matching the exact campus layout: basic VAB high-bay, R&D lab with dome, Mission Operations Centre (MOC) with dish, and Pad Alpha launch complex with blinking beacon.
  - **Act IV: The Opportunity (`OpportunityCinematicScene.ts`):** Technical aerospace CAD blueprints: 2-stage orbital rocket schematic, 12U CubeSat satellite bus with solar array divisions, and orbital trajectory insertion plans.
  - **Act V: The Player's Role (`PlayerRoleCinematicScene.ts`):** Directorate command console establishing appointment as Mission Director, unrestricted command clearance, and the four executive pillars: Vehicle Engineering, Flight Operations, Resource Allocation, and Planetary Exploration.
  - **Act VI: The First Step (`FirstStepCinematicScene.ts`):** Dawn approach to the Main Arrival & Security Gate (`FAC_ARRIVAL_GATE`, coordinate `480, 1350`), open access barrier arm, illuminated welcome board, and ready facilities.
- **Cinematic Subtitle & Controls Overlays (`src/cinematics/ui/`):**
  - `CinematicSubtitleRenderer`: Tactical lower-third letterbox subtitle display with caller callsign header, smooth alpha transitions, and narrative text.
  - `CinematicControlsOverlay`: Top timeline progress dots showing active act, skip prompt button, and pause modal with keyboard/click resume.
- **Scene Integration & Gameplay Handoff (`src/scenes/IntroCinematicScene.ts`):**
  - Hooks into `AudioService` playing `cinematic_intro` score.
  - Keyboard and mouse controls: Escape toggles pause, Enter/Space/Click skips directly to conclusion.
  - Seamless handoff into `HeadquartersScene` via `FadeTransition(0.6)`, spawning the Mission Director at the Main Arrival Gate (`spawnX: 480, spawnY: 1350`).
  - Supports replay mode without mutating existing save progress or agency resources.
- **Comprehensive Verification:**
  - Dedicated unit tests ([CinematicSequencer.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/cinematics/CinematicSequencer.test.ts)) verifying timeline progression, 6-act order, camera interpolation, subtitle events, pause/resume, and skip handling.
  - Dedicated integration tests ([IntroCinematicScene.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/scenes/IntroCinematicScene.test.ts)) verifying scene lifecycle, audio score triggers, input controls, transition to headquarters with spawn coordinates, and replay mode.

### Phase 12: Global In-Game UI Framework & Strategic Primary HUD (Completed)

- **Centralized Design System & Tokens (`src/ui/core/`):**
  - Canonical aerospace palette (`BG_BASE`, `BG_PANEL`, `CYAN`, `AMBER`, `GREEN`, `RED`), typography hierarchy, border geometry, spacing (`SAFE_MARGIN = 24`), and z-index layers ([UIDesignTokens.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/ui/core/UIDesignTokens.ts)).
  - Base UI component with lifecycle, visibility, alpha tweening, and `reducedMotion` accessibility ([UIComponent.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/ui/core/UIComponent.ts)).
- **Tactile Reusable UI Component Library (`src/ui/components/`):**
  - `UIButton`: Multi-variant tactile button (`PRIMARY`, `SECONDARY`, `OUTLINE`, `DANGER`, `GHOST`) with hover/pressed states, keyboard shortcut badges, and SFX hooks.
  - `UIPanel`: Modular window container with header bar, title, close action, and content viewport.
  - `UITabGroup`: Multi-view switcher with active indicators and badges.
  - `UIProgressBar`: Segmented/continuous progress bar with percentage readout and color overrides.
  - `UISpinner`: Rotating reticle for asynchronous operations with `start()`/`stop()`.
  - `UIScrollList`: Masked scrollable list with draggable scrollbar and mousewheel support.
  - `UICard`: Structured specification card with title, status badge, description, and key-value specs.
  - `UIDataTable`: Structured data grid with custom column formatting, header divider, and zebra stripes.
  - `UIDialog`: Centered modal prompt with backdrop shade, confirm/cancel buttons, and keyboard hooks.
- **Tooltip & Notification Subsystems (`src/ui/tooltips/`, `src/ui/notifications/`):**
  - `TooltipManager` & `UITooltip`: Context popover with hover delay (250ms), positioning, and virtual resolution clamping within $1920 \times 1080$.
  - `NotificationManager` & `UINotification`: Stacked tactical toasts (Info, Success, Warning, Error) with priority queueing, auto-dismiss countdown bar, anti-spam deduplication (2000ms window), and domain event listeners.
- **Primary Strategic HUD (`GlobalHUD` & `src/ui/hud/`):**
  - `OrganisationBadgeHUD`: Top-left panel displaying agency name, rank, player status, real-time location, and active mission objective (gated strictly on actual game state).
  - `ResourcesDisplayHUD`: Top-center status bar data-bound to `GameStateManager.getState().resources` (Credits, Research Data, Raw Materials, Tech Points).
  - `InteractionPromptHUD`: Bottom-center prompt bound to `InteractionSystem` (`interaction:target-changed`), displaying action verb and target name with `[E]` key badge.
  - `CampusMinimap`: $240 \times 160$ scaled vector minimap of the $3600 \times 2400$ Earth campus, real-time player position blip, heading arrow, camera frustum, facility markers, and collapsible toggle (`M` key / button).
  - `UIButton`: Operational menu button at top-right (`[ESC] MENU`) with callback hook for pause menu.
- **Headquarters Scene Integration (`src/scenes/HeadquartersScene.ts`):**
  - Mounted `GlobalHUD` to `hudContainer` on `RenderLayerType.HUD`.
  - Real-time telemetry feed in `onUpdate`: updates player position, velocity, facing, district zone, and camera frustum every frame.
  - Minimap toggle hotkey (`InputAction.OpenMap` / `KeyM`).
  - Automated toast notifications on `showFeedback`.
- **Comprehensive Verification:**
  - Dedicated unit tests ([UIComponents.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/ui/UIComponents.test.ts)) verifying all 9 reusable UI components.
  - Dedicated unit tests ([TooltipManager.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/ui/TooltipManager.test.ts)) verifying hover delays, positioning, and virtual viewport clamping.
  - Dedicated unit tests ([NotificationManager.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/ui/NotificationManager.test.ts)) verifying stacking, auto-dismiss, anti-spam deduplication, and EventBus domain subscriptions.
  - Dedicated integration tests ([GlobalHUD.test.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/tests/ui/GlobalHUD.test.ts)) verifying HUD instantiation, data bindings, no fabricated mission data, prompt synchronization, and minimap tracking.

### Phase 13: In-Game Pause Menu, Unified Settings System & Operational Controls (Completed)

- **Centralized Settings Architecture (`src/settings/`):**
  - Strongly typed multi-category settings model ([SettingsTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/settings/SettingsTypes.ts)): `GraphicsSettings`, `AudioSettings`, `ControlsSettings`, `AccessibilitySettings`, `InterfaceSettings`, `GameplaySettings`.
  - Authoritative settings service ([SettingsManager.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/settings/SettingsManager.ts)): versioned schema (`schemaVersion: 1`), localStorage persistence under `interstellar_continuum_settings` (with in-memory fallback), numeric range clamping, enum validation, default presets (`LOW`, `MEDIUM`, `HIGH`, `ULTRA`, `CUSTOM`), category reset, and reset all without touching organisation saves.
  - Subsystem synchronization: broadcasts `settings:changed` on `EventBus`, updates `ShaderManager.setQuality()`, `AudioService.setChannelVolume()`, `VirtualResolution.setResolutionScale()`, `CameraSystem.setReducedMotion()`, `CameraSystem.setShakeIntensity()`, `InputManager.rebind()`, and legacy `ConfigManager`.
- **Tactile Settings UI Controls (`src/ui/components/`):**
  - `UISlider`: Draggable track with decrement `[-]` and increment `[+]` stepping buttons and formatted numerical readout ([UISlider.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/ui/components/UISlider.ts)).
  - `UIToggle`: Tactile pill toggle switch with glowing indicator and status readout ([UIToggle.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/ui/components/UIToggle.ts)).
  - `UIOptionStepper`: Discrete cyclical stepper with `<` and `>` arrow selectors ([UIOptionStepper.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/ui/components/UIOptionStepper.ts)).
  - `UIKeybindRow`: Action description with key badges and interactive conflict-checked rebinding ([UIKeybindRow.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/ui/components/UIKeybindRow.ts)).
- **Unified Multi-Category Settings View (`src/ui/settings/SettingsView.ts`):**
  - Production settings interface shared across Pause Menu, Title Screen ([SettingsModal.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/scenes/title/SettingsModal.ts)), and Headquarters Settings Terminal ([SettingsScene.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/scenes/SettingsScene.ts)). Zero duplication of settings interfaces.
  - Tab navigation across all 6 categories, responsive scrolling list, rebinding conflict prevention, category restore, and global restore defaults with confirmation modal.
- **In-Game Pause Menu (`src/ui/pause/PauseMenu.ts`):**
  - Opened via Escape key, centralized Pause action (`InputAction.Pause`), or top-right HUD menu button.
  - Halts real-time simulation updates, locks gameplay inputs via `InputManager.lockInput('PauseMenu')`, and displays live director credentials and location telemetry.
  - 6 Operational actions: Resume, System Settings, Controls & Keybindings, Return to Headquarters, Save Organisation Progress (with snapshot persistence and toast feedback), and Return to Main Menu (with confirmation dialog).
- **Headquarters & Campus Settings Terminal Integration:**
  - `HeadquartersScene`: Attached `PauseMenu` to `UI_OVERLAY`, wired HUD menu button, handled window focus loss auto-pause (`blur` event), and connected `FAC_CENTRAL_PLAZA_KIOSK` to `SettingsScene`.
  - `SettingsScene`: Registered under `SceneId.SETTINGS` in `SceneManager`, hosting `SettingsView` and supporting instant or animated return to campus exterior.
- **Verification & Automated Tests:**
  - `SettingsManager.test.ts`: 8 unit tests covering defaults, schema clamping, presets, key rebinding conflicts, category reset, global reset without affecting saves, and subsystem synchronization.
  - `SettingsView.test.ts`: 4 unit tests covering tab switching, rebinding flows, conflicts, and cleanup.
  - `PauseMenu.test.ts`: 6 unit tests covering show/hide, input locking, nested settings modal, saving to slot 1, and scene return.
  - `PauseAndSettingsIntegration.test.ts`: 4 integration tests covering campus pause freeze, kiosk building access, and SettingsScene return flow.

### Phase 14: First-Time Player Onboarding & Contextual Tutorial Architecture (Completed)

- **Reusable Tutorial Architecture (`src/tutorial/`):**
  - Strongly typed contracts ([TutorialTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/tutorial/TutorialTypes.ts)): `TutorialSequenceId`, `TutorialStepId`, `TutorialCompletionCondition`, `TutorialHighlightTarget`, `TutorialStepContext`, `TutorialStep`, `TutorialProgressState`.
  - Authoritative tutorial manager service ([TutorialManager.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/tutorial/TutorialManager.ts)): sequence registration, step progression/regression, condition auto-progression evaluation (`MANUAL_CONFIRM`, `PLAYER_MOVED`, `FACILITY_DISCOVERED`, `LAUNCH_APPROACHED`), skipping, dismiss/resume, manual replay, and independent progression state persistence.
  - EventBus integration: emits `'tutorial:started'`, `'tutorial:step-changed'`, `'tutorial:step-completed'`, `'tutorial:completed'`, `'tutorial:skipped'`, `'tutorial:dismissed'`, and `'tutorial:enabled-changed'`.
- **Authoritative 7-Step Initial Onboarding Sequence (`src/tutorial/sequences/InitialOnboardingSequence.ts`):**
  - *Step 1 (Arrival):* Welcome message, Mission Director role, and agency mandate.
  - *Step 2 (Movement & Controls):* Ground locomotion, interaction, and pause controls dynamically inspecting active bindings from `InputManager.getBindings()`.
  - *Step 3 (Campus Exploration):* Quadrant layout, promenade orientation, and waypoint highlight on Mission Operations Centre (`FacilityId.MISSION_OPERATIONS`).
  - *Step 4 (Facility Discovery):* Organisational infrastructure overview dynamically querying `FacilityRegistry.getInstance()` for all 10 facilities without duplicated descriptions.
  - *Step 5 (Pad Alpha Launch Complex):* Surface launch complex introduction and waypoint highlight on Pad Alpha (`FacilityId.LAUNCH_COMPLEX_PAD_ALPHA`).
  - *Step 6 (Mission Preparation):* Exploration mandate and 4 pillars of mission architecture (Objective, Vehicle, Payload, Trajectory).
  - *Step 7 (Free Exploration):* Unrestricted clearance granted; non-intrusive completion.
- **Contextual Waypoint Marker System (`src/tutorial/TutorialWaypointMarker.ts`):**
  - Renders in-world pulsing beacon rings with crosshairs and center diamond when target is inside camera frustum.
  - Renders screen-edge directional bearing indicator arrows with dynamic pixel distance readout when target is outside camera frustum.
  - Fully respects `accessibility.reducedMotion` from `SettingsManager`.
- **Compact Tutorial HUD Overlay (`src/ui/tutorial/TutorialPanel.ts`):**
  - Aerospace HUD panel displaying step title, subtitle, progress indicator (`STEP X/7`), body text, dynamic key badges, and action buttons (`CONTINUE [SPACE]`, `MINIMIZE [H]`, `SKIP TUTORIAL`).
  - Collapsible minimized pill state (`[H] OBJECTIVE: ...`) allowing players to explore campus without UI obstruction.
  - Dynamic typography scaling supporting `accessibility.textSize === 'LARGE'`.
- **Headquarters, Pause Menu & Save System Integration:**
  - `HeadquartersScene`: Mounted `TutorialPanel` and `TutorialWaypointMarker`, automatically launched onboarding for new games / first-time players, fed live player telemetry to condition evaluators, handled `Space` advance and `H` minimize hotkeys.
  - `PauseMenu`: Added "REPLAY ONBOARDING TUTORIAL" button enabling manual onboarding replay on demand.
  - `SaveService` & `GameState`: Integrated `tutorial?: TutorialProgressState` into `GameSaveSchema`, persisting completion state so returning players are never forced through finished onboarding.
- **Verification & Automated Tests:**
  - `TutorialManager.test.ts`: 9 unit tests covering step progression, previous step, auto-progression on distance moved, auto-progression on approaching MOC, completion flags, skipping, returning player bypass, and state serialization.
  - `TutorialPanel.test.ts`: 5 unit tests covering rendering, step population, minimize/expand toggle, action callbacks, and null step handling.
  - `TutorialWaypointMarker.test.ts`: 4 unit tests covering hidden default state, target setting, coordinate placement, update without crashing, and cleanup.
  - `OnboardingIntegration.test.ts`: 5 integration tests covering new game activation, sequential 7-step progression, dynamic rebound key display from `InputManager`, pause menu replay, and save slot 1 persistence.

### Phase 15: Mission Operations Centre & Interactive Solar System Map (Completed)

- **Central Authoritative Destination System (`src/destinations/`):**
  - Strongly typed contracts ([DestinationTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/destinations/DestinationTypes.ts)): `CelestialCategory`, `DestinationId`, `DestinationUnlockState`, `EnvironmentalHazards`, `PhysicalCharacteristics`, `DestinationData`.
  - Authoritative celestial database ([DestinationData.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/destinations/DestinationData.ts)): 20 Solar System destinations covering the Sun, 8 primary planets, the Asteroid Belt, key moons (Luna, Io, Europa, Ganymede, Titan, Enceladus), and 4 Earth orbital regimes (LEO, MEO, GEO, HEO) with exact physical parameters (semi-major axis, orbital period, surface gravity, temperature range, atmospheric pressure/composition, radiation hazards, and scientific descriptions).
  - Central Destination Registry ([DestinationRegistry.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/destinations/DestinationRegistry.ts)): Singleton service managing celestial bodies, parent/moon hierarchies, orbital regime sub-hierarchies, unlock statuses, mission counts, and EventBus domain notifications (`'destination:selected'`, `'destination:unlocked'`).
- **Interactive 2D Solar System Map (`src/destinations/ui/SolarSystemMapCanvas.ts`):**
  - High-fidelity 2D schematic planetary map featuring Sun with animated dual-frequency corona, elliptical orbital guide rings, color-coded planetary bodies, Saturn and Uranus ring systems, and an asteroid belt with procedural rock particles.
  - Interactive pan and zoom controls ($0.3\times$ to $3.0\times$) with mouse wheel, drag panning, zoom controls HUD, and view reset.
  - Hover and click hit testing, tactical crosshair selection reticles with corner brackets, and keyboard cycling (`A`/`D` or Left/Right arrows).
  - Explicit schematic scaling banner (`SCHEMATIC MAP: RELATIVE PROPORTIONS (NOT TO 1:1 PHYSICAL ORBITAL SCALE)`).
- **Earth Orbital Regimes Sub-Display (`src/destinations/ui/EarthOrbitDisplay.ts`):**
  - Hierarchical orbital regime selector for Earth featuring concentric orbit rings for LEO (160–2,000 km), MEO (2,000–35,786 km), GEO (35,786 km), HEO (highly eccentric transfer), and the Moon (384,400 km).
  - Altitude band indicators, primary operational purposes, return to interplanetary map button, and direct node selection.
- **Tactical Destination Info Panel (`src/destinations/ui/DestinationInfoPanel.ts`):**
  - Aerospace telemetry panel displaying destination badge, category, scientific summary, physical specs grid (semi-major axis, orbital period, surface gravity, surface temp, atmospheric profile, radiation hazard rating), unlock status badge (`[UNLOCKED]` vs `[LOCKED]`), and mission progression counts.
  - Gated restriction notice for locked celestial destinations explaining required progression steps.
  - Contextual action buttons: `BROWSE MISSIONS`, `ORBITAL REGIONS / EXPLORE MOONS`, and `CLOSE`.
- **Mission Operations Centre Scene (`src/scenes/MissionOperationsScene.ts`):**
  - Full-screen operational command centre registered under `SceneId.MISSION_OPERATIONS`.
  - Header telemetry bar with facility title, UTC mission clock, campus return shortcut (`[ESC]`), and 5-section navigation tab group (`Solar System`, `Mission Catalogue`, `Active Missions`, `Mission Archive`, `Destination Intel`).
  - Integrated map canvas, orbital regime display, destination info panel, and keyboard hotkeys (`1`–`5` for tabs, `A`/`D` for cycling, `ESC` to return to Earth campus at spawn coordinates $(1800, 1730)$).
- **Verification & Automated Tests:**
  - `DestinationRegistry.test.ts`: 6 tests validating 20 celestial destinations, moon hierarchies, orbital regimes, unlock gating, mission counts, and singleton access.
  - `SolarSystemMapCanvas.test.ts`: 5 tests verifying schematic map rendering, panning, zooming, selection reticles, and keyboard cycling.
  - `EarthOrbitDisplay.test.ts`: 3 tests verifying orbital regime nodes, selection callbacks, and back navigation.
  - `MissionOperationsIntegration.test.ts`: 6 integration tests verifying MOC scene initialization, tab navigation, destination selection, Earth orbit sub-view toggling, campus exit, and application controller registration.

### Phase 16: Central Destination Registry & Progression System (Completed)

- **Authoritative Central Destination Registry (`src/destinations/`):**
  - Strongly typed contracts ([DestinationTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/destinations/DestinationTypes.ts)): Comprehensive data models covering `DestinationId` (28 celestial destinations), `DestinationCategory`, `EnvironmentalClassification` (10 canonical classes), `SurfaceAvailability` (4 classes: `WALKABLE_SURFACE`, `HAZARDOUS_SURFACE_SPECIALIZED_ONLY`, `SMALL_BODY_MICROGRAVITY`, `NO_SURFACE_ORBITAL_ATMOSPHERIC_ONLY`), `GravityClassification`, `TemperatureClassification`, `ExplorationMethod` (10 exploration vectors), `DestinationUnlockState`, `DiscoveryStatus`, `ExplorationStatus`, `UnlockConditionType`, and `SurfaceAccessEvaluation`.
  - Authoritative celestial database ([DestinationData.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/destinations/DestinationData.ts)): Authoritative physical metrics, atmospheric profiles, communication telemetry (one-way signal latencies, DSN relay requirements), supported exploration methods, and unlock conditions for Sun, Mercury, Venus, Earth & 4 Earth orbital regimes (LEO, MEO, GEO, HEO), The Moon, Mars & moons (Phobos, Deimos), Asteroids (Main Belt, Ceres, Vesta), Jupiter & 4 Galilean moons (Io, Europa, Ganymede, Callisto), Saturn & moons (Titan, Enceladus), Uranus & Titania, Neptune & Triton, and Pluto.
  - Central Destination Registry Service ([DestinationRegistry.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/destinations/DestinationRegistry.ts)): Singleton service offering dynamic destination registration (`registerDestination`), hierarchy navigation, surface safety verification (`canAccessSurface`), and environment loading configuration resolver (`getEnvironmentLoadConfig`).
- **Data-Driven Progression & Unlock Evaluator (`src/destinations/DestinationProgressionManager.ts`):**
  - Evaluates multi-condition unlock rules against player agency progression state (Director Rank, accumulated research points, researched technology nodes, completed prerequisite missions, agency milestones, and surveyed bodies).
  - Generates detailed requirements breakdown (`UnlockRequirementStatus`) with status flags (`isMet`), numerical values (`currentValue` vs `requiredValue`), progress percentages (0–100%), and overall progress calculation.
- **Safety Enforcement & Surface Access Validation:**
  - `canAccessSurface(id)` strictly rejects invalid surface exploration on gas giants (Jupiter, Saturn), ice giants (Uranus, Neptune), stars (Sun), and orbital space regimes (LEO, MEO, GEO, HEO).
  - Explicitly flags hostile environments (Venus, Mercury, Titan, Europa, Enceladus, Io) as requiring specialized survival equipment (supercritical pressure hulls, cryogenic radiation vaults, thermal shielding) and enforces operational duration limitations.
  - Classifies asteroid and small bodies under microgravity sampling and anchoring harpoon protocols.
- **Enhanced Tactical Destination Info Panel (`src/destinations/ui/DestinationInfoPanel.ts`):**
  - Displays dynamic surface availability badge, environmental classification, supported exploration modes, communication latency and relay requirements.
  - Evaluates and displays progression requirement breakdown for locked destinations with progress bars, pending milestones, and completion percentages.
- **Verification & Automated Tests:**
  - `DestinationRegistry.test.ts`: 12 comprehensive unit tests verifying all 28 celestial bodies, parent-child moon hierarchies, Earth orbital regimes, surface access validation, safe rejection of invalid open-world exploration, environmental classifications, dynamic progression evaluation, environment loading configurations, and extensible registration.
  - `DestinationInfoPanel.test.ts`: 5 unit tests validating rendering across unlocked bodies, locked progression cards, hazardous surface badges (Venus), and gas giant surface rejection (Jupiter).
  - Total test suite expanded to 68 test files and 365 tests with 100% pass rate.

### Phase 17: Central Mission Architecture & Definition System (Completed)

- **Authoritative Mission Data Contracts (`src/missions/`):**
  - Strongly typed contracts ([MissionTypes.ts](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/src/missions/MissionTypes.ts)): Strongly typed definitions covering 3 primary categories (`TRANSPORTATION`, `SCIENTIFIC_EXPLORATION`, `COMBINED`), 5 difficulty ratings (`EASY`, `MEDIUM`, `HARD`, `VERY_HARD`, `EXTREME`), 6 sequence stage types (`INITIAL_RECONNAISSANCE`, `INFRASTRUCTURE_PREPARATION`, `TRANSPORTATION`, `DEPLOYMENT`, `SCIENTIFIC_EXPLORATION`, `ADVANCED_RESEARCH`), 8 spacecraft classifications (`SOUNDING_ROCKET`, `SATELLITE_BUS`, `ORBITAL_SURVEYOR`, `ATMOSPHERIC_ENTRY_PROBE`, `SURFACE_LANDER`, `PLANETARY_ROVER`, `DEEP_SPACE_OBSERVATORY`, `CREW_CAPSULE`), 9 payload classifications, 12 scientific instruments, 8 objective types, and distinct delivery vs exploration flags (`isDeliveryObjective`, `isExplorationObjective`).
  - Engineering constraints envelope: `EngineeringRequirements` defining min/max payload mass (kg), electrical power demand (Watts), battery capacity (Wh), communications bandwidth (kbps), relay requirements, target orbital parameters (perigee/apogee/inclination), and surface landing coordinates.
  - Budgetary and reward schemas: `MissionBudget` with strict allocation and launch cost caps; `MissionRewards` covering Mission Credits, Research Data, Raw Materials, Technology Points, and Agency Prestige; and `MissionEducationalContent` delivering core concepts, aerospace explanations, and historical/real-world parallels.
- **Master Authored Mission Dataset (`src/missions/MissionData.ts`):**
  - Authored dataset containing 21 rich, data-driven mission definitions covering the full Solar System progression:
    1. *Earth & LEO:* Pioneer-1 orbital deployment, Terra Vista Earth survey, Commercial cubesat rideshare deployment.
    2. *Earth MEO & GEO:* MEO radiation relay test, GEO equatorial telecommunications relay.
    3. *The Moon:* Selene Prospect orbital ice mapper, Artemis base lander delivery, Lunokhod rover drilling, Lunar habitat module deployment.
    4. *Mars & Moons:* Areo Recon orbital surveyor, Cydonia sample-drilling rover exploration.
    5. *Venus:* Aphrodite synthetic aperture radar mapper, Venera high-temperature surface lander.
    6. *Asteroid Belt:* Ceres rendezvous survey, Vesta regolith sample collection & return.
    7. *Jupiter & Moons:* Great Red Spot jovian atmospheric probe, Europa sub-surface water plume mass spectrometer survey.
    8. *Saturn & Moons:* Chronos ring particle scan, Titan Dragonfly aerial rotorcraft flight exploration.
    9. *Uranus & Neptune:* Ice giant orbital recon and Neptune supersonic atmospheric probe.
- **Mission Validation Engine (`src/missions/MissionValidation.ts`):**
  - Comprehensive validator checking:
    1. Duplicate mission ID detection.
    2. Reference validation against `DestinationRegistry` (ensuring non-existent celestial bodies are rejected).
    3. Mandatory delivery and exploration objectives on `COMBINED` missions.
    4. Valid engineering envelopes (e.g. min payload mass $\ge 0$, max payload mass $\ge$ min payload mass, non-negative power).
    5. Non-positive budget rejection and cost cap consistency checks.
    6. Acyclic DFS prerequisite cycle detection preventing circular dependency deadlocks.
- **Mission Catalogue Registry Service (`src/missions/MissionCatalogueRegistry.ts`):**
  - Singleton registry service validating data integrity on startup.
  - Queries missions by ID, destination ID, category, stage type, and difficulty.
  - Dynamically evaluates operational availability (`LOCKED`, `AVAILABLE`, `ACTIVE`, `COMPLETED`) against player agency progression state (Director Rank, completed prerequisite missions, unlocked technologies, destination unlock status).
  - Automatically synchronizes destination mission counts (`availableMissionsCount`, `completedMissionsCount`) with `DestinationRegistry`.
- **Aerospace Tactical Mission Catalogue UI (`src/missions/ui/MissionCatalogueView.ts`):**
  - Full-screen tactical operations view mounted in Mission Operations Centre Tab 2.
  - Destination, Category (`ALL`, `TRANSPORTATION`, `SCIENTIFIC_EXPLORATION`, `COMBINED`), and Status filters.
  - Scrollable left-hand mission card list with category color bars, sequence levels, reward summaries, and operational status badges.
  - Right-hand detailed mission specification dossier displaying narrative overview, primary flight objectives (with distinct delivery vs exploration badges), engineering specifications, educational briefing banner, and rewards strip.
  - Contextual action buttons: `COMMENCE MISSION PLANNING` (enabled when available, disabled with status when locked) and `VIEW ON SOLAR MAP`.
- **Mission Operations Scene Integration (`src/scenes/MissionOperationsScene.ts`):**
  - Connected `MissionCatalogueView` into MOC Scene under `MOCSection.MISSION_CATALOGUE`.
  - Wired `DestinationInfoPanel`'s "BROWSE MISSIONS" action to switch to Mission Catalogue pre-filtered to the inspected destination.
  - Seamless switching between Solar System Map and Mission Catalogue with keyboard shortcuts (`1`–`5`, `ESC`).
- **Verification & Automated Tests:**
  - `MissionValidation.test.ts`: 11 tests verifying definition rules, combined category contracts, duplicate IDs, destination references, acyclic graph cycles, and full built-in catalogue integrity.
  - `MissionCatalogueRegistry.test.ts`: 7 tests verifying singleton access, filtering by destination/category/stage, dynamic status evaluation, prerequisite unlocking, completion tracking, and destination count synchronization.
  - `MissionCatalogueView.test.ts`: 5 tests verifying UI layout, destination filtering, card selection, dossier presentation, and combined objective differentiation.
  - `MissionOperationsIntegration.test.ts`: 6 tests validating MOC scene integration, tab switching, and component mounting.
  - Total test suite expanded to 71 test files and 388 tests with 100% pass rate.

### Phase 18: Mission Briefing & Launch Manifest Interface (Completed)

- **Briefing Data Model & Synthesis Engine (`src/missions/MissionBriefingModel.ts`):**
  - Authoritative transformation engine assembling complete briefing models from actual `MissionDefinition` and `DestinationRecord` data without fabricated technical numbers or hardcoded descriptions.
  - **10 Formal Briefing Sections:**
    1. *Mission Overview:* Name, code, sequence level, stage, difficulty score (1–5) and difficulty factors, estimated flight duration.
    2. *Scientific Purpose:* Core research questions, planetary physics context, observation criteria, educational takeaways.
    3. *Primary Objectives:* Mandatory milestones with clear delivery vs. exploration type distinctions.
    4. *Optional Objectives:* Bonus scientific/operational goals and incentive reward bonuses.
    5. *Destination Telemetry:* Surface gravity ($m/s^2$ & $g$), temperature ranges ($^\circ\text{C}$ & $\text{K}$), atmospheric pressure ($\text{atm}$) & composition, radiation rating, communications latency (seconds) & DSN relay requirements, surface access safety & operational limits.
    6. *Spacecraft & Payload Constraints:* Canonical platform profile, modular payload specifications, 12 scientific instruments with mass/power metrics and sensor descriptions.
    7. *Engineering Constraints & Trade-Off Matrix:* Delta-V estimates, battery/power budgets, bandwidth requirements, target orbit/landing zones, and four quantitative trade-offs (Mass vs. Cost, Power vs. Mass, Comms Bandwidth vs. Antenna Aperture, Staging Efficiency vs. Operational Flexibility).
    8. *Budget & Financial Allocation:* Initial funding credits, launch cost expenditure cap, efficiency index bonuses.
    9. *Prerequisites & Qualification Matrix:* Director Rank status, destination unlock confirmation, prior mission dependency chain, technology node locks, and specific unmet reason strings.
    10. *Success & Failure Conditions:* Definitive aerospace mission completion criteria and operational failure boundaries (loss of signal, atmospheric burnup, budget overrun).
- **Interactive Mission Briefing Interface (`src/missions/ui/MissionBriefingView.ts`):**
  - Full-screen aerospace tactical briefing console mounted inside the Mission Operations Centre.
  - Top navigation bar featuring mission status badge, sequence level, difficulty meter, and 4 specialized analytical tabs:
    1. `OVERVIEW & OBJECTIVES`: Summary narrative, scientific rationale, primary & bonus mission objectives cards.
    2. `DESTINATION & ENVIRONMENT`: Planetary characteristics, atmospheric telemetry, comms latency, surface accessibility, and hazard mitigation badges.
    3. `ENGINEERING CONSTRAINTS`: Spacecraft platform, payload assembly, 12 instrument specifications, vehicle design constraints, and aerospace trade-off matrix.
    4. `PREREQUISITES & BUDGET`: Prerequisites checklist (Rank, Destination, Missions, Tech) and funding/reward allocation cards.
  - Responsive action footer with `ACCEPT MISSION & AUTHORIZE CONTRACT` (active state transition and event firing), `PROCEED TO VEHICLE ASSEMBLY (VAB)` routing, `VIEW ON SOLAR MAP` shortcut, and `RETURN TO MISSION CATALOGUE` preserving previous selection context.
- **Mission Acceptance & State Engine (`src/missions/MissionCatalogueRegistry.ts`):**
  - Robust `acceptMission()` method enforcing prerequisite compliance, preventing duplicate contracts, transitioning missions to `ACTIVE`, and publishing `'mission:accepted'` events.
- **Verification & Automated Tests:**
  - `MissionBriefingModel.test.ts`: 6 tests verifying 10-section model synthesis, trade-off matrix calculations, surface safety handling, and difficulty scoring.
  - `MissionBriefingView.test.ts`: 6 tests validating view rendering, tab switching, acceptance workflows, and locked mission handling.
  - `MissionAcceptance.test.ts`: 6 tests validating prerequisite gating, duplicate prevention, active status tracking, and event bus emissions.
  - Total test suite expanded to 74 test files and 407 tests with 100% pass rate.

### Phase 19: Active Flight Lifecycle & Mission Tracking Dashboard (Completed)

- **Centralized Mission Lifecycle State Machine (`src/missions/MissionLifecycleManager.ts`):**
  - Robust 11-state state machine: `LOCKED`, `AVAILABLE`, `ACCEPTED`, `PREPARING`, `READY_FOR_VALIDATION`, `READY`, `ACTIVE`, `PAUSED`, `COMPLETED`, `FAILED`, `CANCELLED`.
  - Authoritative transition matrix preventing arbitrary or invalid transitions (e.g. `LOCKED -> ACTIVE` strictly prohibited; `ACCEPTED -> ACTIVE` blocked without preparation and validation; `COMPLETED -> ACTIVE` immutable).
  - Validation safeguard: strictly rejects transition to `READY` or `ACTIVE` if any required engineering system is unimplemented (e.g. Rocket Engineering VAB builder pending PROMPT 21), preventing false mission readiness.
- **Dedicated Mission Instance Model (`src/missions/MissionLifecycleTypes.ts`):**
  - Lightweight runtime representation referencing central `MissionDefinition` by ID rather than copying static templates.
  - Tracks unique instance ID, destination ID, acceptance timestamp, preparation tasks state, objective progress, committed financial resources, full event history, checkpoint references, and failure/completion telemetry.
- **Dynamic Mission Preparation Service (`src/missions/MissionPreparationService.ts`):**
  - Dynamically synthesizes preparation checklists based on `MissionDefinition.engineeringRequirements` across 6 categories: Launch Vehicle Configuration (VAB), Spacecraft Design (Lab), Payload Integration (Mfg), Communications Setup, Robotics Configuration, and Instrument Mounting (R&D).
  - Connects directly to `FacilityRegistry` and identifies facilities with active or pending toolchains.
- **Reusable Objective Tracking Engine (`src/missions/MissionObjectiveTracker.ts`):**
  - Translates authored objectives to tracked runtime models across 11 canonical categories (`DELIVER_PAYLOAD`, `REACH_DESTINATION`, `DEPLOY_SPACECRAFT`, `ESTABLISH_COMMUNICATION`, `COLLECT_SCIENTIFIC_DATA`, `MAP_AREA`, `ANALYSE_SAMPLE`, `DEPLOY_ROVER`, `COMPLETE_RESEARCH`, `CONSTRUCT_FACILITY`, `MAINTAIN_OPERATIONS`).
  - Distinguishes mandatory from optional objectives.
  - Tracks measurable progress without fabricating synthetic percentages, reporting objective completion ratios.
- **Tactile Active Missions Dashboard View (`src/missions/ui/ActiveMissionsDashboardView.ts`):**
  - Aerospace tactical command interface integrated into Mission Operations Centre Tab 3 (`ACTIVE_MISSIONS`).
  - Left panel: Filter tabs (`ACTIVE`, `PREPARATION`, `READY / FLIGHT`, `ARCHIVE`), scrollable cards with color-coded status badges, destination tags, and objective readouts.
  - Right panel: Detailed mission dossier displaying objectives checklist, dynamic preparation task breakdown with facility badges, timeline history log, and responsive action controls (`VALIDATE READINESS`, `ACTIVATE FLIGHT`, `PAUSE / RESUME`, `RETRY MISSION`, and `CANCEL MISSION` with `UIDialog` confirmation).
  - Empty state with guidance and direct navigation to Mission Catalogue.
- **Mission Retry, Non-Destructive Failure & Cancellation:**
  - Failed missions can be restarted to `PREPARING` via `retryMission()`, re-initializing objectives and preparation while preserving global player agency rank, credits, and historical progress.
  - Cancellation requires explicit confirmation, preserves full event history, and dispatches `'mission:archived'` events.
- **Full Event & Persistence Integration:**
  - Emits strongly typed events: `'mission:instance:created'`, `'mission:lifecycle:changed'`, `'mission:ready'`, `'mission:activated'`, `'mission:paused'`, `'mission:objective:updated'`, `'mission:objective:completed'`, `'mission:cancelled'`, `'mission:archived'`.
  - Serializes and deserializes active mission state cleanly via `serialize()` and `deserialize()`.
- **Verification & Automated Tests:**
  - `MissionPreparationService.test.ts`: 4 tests verifying dynamic task checklist generation, facility mapping, rover isolation, and unimplemented facility safeguards.
  - `MissionObjectiveTracker.test.ts`: 4 tests validating category mapping, mandatory/optional partitioning, progress updates, and ratio reporting.
  - `MissionLifecycleManager.test.ts`: 8 tests verifying instance creation, duplicate prevention, transition graph enforcement, readiness rejection, full flight lifecycle, non-destructive failure retry, cancellation, and persistence roundtrip.
  - `ActiveMissionsDashboardView.test.ts`: 5 tests verifying dashboard rendering, empty state guidance, filter tab switching, facility navigation callback, and cancel confirmation dialogs.
  - `MissionOperationsIntegration.test.ts`: Added tests verifying Tab 3 switching and dashboard visibility.
  - Total test suite expanded to 78 test files and 430 tests with 100% pass rate.

### Phase 20: Rocket Engineering Facility & Workspace Architecture (Completed)

- **Authoritative Rocket Project & Staging Architecture (`src/engineering/RocketProjectTypes.ts`):**
  - Robust project lifecycle states: `DRAFT`, `UNDER_DEVELOPMENT`, `AWAITING_VALIDATION`, `VALIDATED`, `ASSIGNED_TO_MISSION`, `ARCHIVED`.
  - Vehicle class ratings: `SUBORBITAL_TEST`, `LIGHT_ORBITAL`, `MEDIUM_FREIGHTER`, `HEAVY_INTERPLANETARY`, `SUPER_HEAVY_CARRIER`.
  - Detailed stage configuration data models: engines, thrust (SL & vacuum), ISP, wet/dry mass, propellant capacity, burn duration, separation mechanisms, and fairing shroud dimensions.
- **Abstract Educational Component Catalogue (`src/engineering/RocketComponentCatalogue.ts`):**
  - Authoritative catalogue of 11 components across 6 canonical families: `PROPELLANT_TANKS`, `BOOSTER_ENGINES`, `UPPER_STAGE_ENGINES`, `SOLID_ROCKET_MOTORS`, `AERODYNAMICS_FAIRINGS`, `STAGING_AVIONICS`.
  - Educational game-balance attributes (mass, thrust, ISP, cost in credits, unlock tiers) with explicit separation from hazardous real-world manufacturing data.
- **Centralized Rocket Project Manager (`src/engineering/RocketProjectManager.ts`):**
  - Singleton managing project CRUD, standard starter vehicle designs (*Astra-1 Sounding Test Rig*, *Pioneer Orbital-1*, *Continuum Heavy-1*), and active project state.
  - 5-point engineering validation engine:
    1. Liftoff Thrust-to-Weight Ratio (`initialTwr >= 1.15`).
    2. Total Vacuum Propulsion Delta-V capability for vehicle flight envelope.
    3. Structural mass ratio and propellant fraction.
    4. Flight guidance computer & multi-stage separation decouplers.
    5. Aerodynamic fairing and payload envelope clearance.
  - Mission Compatibility Evaluator: checks vehicle payload capacity, required delta-V margins, fairing clearance, and TWR against assigned mission requirements, providing actionable engineering recommendations.
  - Vehicle-to-mission assignment and release lifecycle.
  - Hot-fire simulation engine calculating static test stand metrics (chamber pressure, peak thrust, ISP) and logging chronological telemetry.
  - Serialization and deserialization supporting persistent agency progress.
- **Functional Rocket Engineering Facility Scene (`src/scenes/RocketEngineeringScene.ts`):**
  - Replaces placeholder interior scene for `SceneId.ROCKET_ENGINEERING` (`FAC_ROCKET_ENGINEERING`).
  - Seamless dual navigation:
    - Entering from Headquarters exterior spawns player at facility entrance `(2750, 1210)` upon return.
    - Entering from Mission Operations Centre preserves active mission context (`missionId`, `instanceId`), shows active target banner, and offers direct "RETURN TO MISSION PREPARATION".
  - 8 fully functional workspace sections:
    1. `OVERVIEW`: Hero project summary, specification matrix, stage summary, and quick action bar.
    2. `BUILDER`: 2D blueprint grid canvas, visual vehicle staging silhouette (booster core, engines, fins, interstage ring, upper stage, fairing shroud), and honest development notice for Phase 22 snap builder.
    3. `COMPONENTS`: Filterable component catalogue browser with specification cards and unlock states.
    4. `SAVED_DESIGNS`: Vehicle inventory management (activate, validate, archive, create new projects).
    5. `MISSION_COMPATIBILITY`: Side-by-side comparison matrix of target mission requirements vs rocket capabilities with status rating pills.
    6. `VALIDATION`: 5-point engineering readiness checklist with live inspection trigger.
    7. `SIMULATION`: Static hot-fire test stand schematic, telemetry gauges (chamber pressure, thrust, ISP, RPM), and real-time terminal readout.
    8. `RECORDS`: Chronological engineering activity log.
- **Verification & Automated Tests:**
  - `RocketComponentCatalogue.test.ts`: Component count, 6 family coverage, positive mass/cost specs, unlock defaults.
  - `RocketProjectManager.test.ts`: Default projects, project selection, CRUD, design updates, 5-point validation, mission compatibility, mission assignment/unassignment, hot-fire simulation, and persistence roundtrip.
  - `RocketEngineeringScene.test.ts`: Scene registration, initial activation, 8-section tab switching, mission context handling, dynamic return navigation (HQ vs MOC), and active project access.
  - Expanded test suite to **81 test files** and **448 tests** (100% pass rate).

### Phase 21: Central Rocket Component Database & Selection Architecture (Completed)

- **Centralized Rocket Component Architecture (`src/engineering/RocketComponentTypes.ts`):**
  - Strongly typed schemas for all rocket components, availability states, compatibility tags, and comparative analysis.
  - 8 canonical component categories:
    1. `STRUCTURE_AND_STAGING`: Load-bearing cylindrical fuselages, upper modular trusses, interstage connector rings, pneumatic separation interfaces, payload support skirts.
    2. `PROPULSION_SYSTEMS`: Basic booster thrust vector units, high-efficiency sustainer units, advanced multi-chamber heavy clusters, specialized upper-stage vacuum expander nozzles.
    3. `FUEL_AND_PROPELLANT_SYSTEMS`: Standard liquid reservoirs, high-density pressurized cells, cryogenic insulated reserve blocks, solid booster cores.
    4. `GUIDANCE_AND_NAVIGATION`: Basic inertial guidance computers, autonomous flight directors, advanced deep-space trajectory synthesizers.
    5. `ELECTRICAL_POWER`: Basic battery storage banks, deployable solar generation buses, advanced long-duration thermoelectric generators (RTG).
    6. `PAYLOAD_AND_FAIRING`: Basic satellite platforms, communication constellation relays, Earth observation multispectral scanners, deep space science probes, microgravity research modules, robotic equipment cargo racks, rover transportation cradles, and 2.0m/3.5m aerodynamic payload fairings.
    7. `COMMUNICATION_AND_TELEMETRY`: Omnidirectional telemetry beacons, S-band transceiver arrays, advanced high-gain phased array dishes.
    8. `RECOVERY_AND_SAFETY_SYSTEMS`: Stage separation status monitors, range safety monitors, auxiliary booster recovery deceleration kits, integrated diagnostic sentinels.
  - Fictional game balancing attributes only: Mass Units (MU), Performance Rating, Efficiency Rating, Reliability Rating (%), Power Generation/Demand (Watts), Capacity Rating, Structural Rating, Protection Rating, and Cost in Mission Credits. Zero dangerous real-world chemical or construction specifications.
- **Authoritative Component Database (`src/engineering/RocketComponentDatabase.ts`):**
  - Built-in catalog of 26 authored abstract components with unique IDs, display names, rarity classifications, educational engineering trade-off explanations, and unlock requirements.
- **Central Component Registry (`src/engineering/RocketComponentRegistry.ts`):**
  - Singleton registry managing component querying, filtering, search, dynamic availability evaluation, and side-by-side comparative analysis.
  - Dynamic availability evaluator supporting `AVAILABLE`, `LOCKED`, `RESEARCH_REQUIRED`, `MANUFACTURING_REQUIRED`, `INSUFFICIENT_CREDITS`, and `UNAVAILABLE_FOR_CURRENT_MISSION`.
  - Comprehensive comparison engine computing attribute diffs, advantage indicators, tag intersections, and balanced educational trade-off syntheses.
- **Component Inventory & Economy Integration (`src/engineering/ComponentInventoryService.ts`):**
  - Manages player component stock, tracking owned quantities, installed units, reserved allocations, and project assignment bindings.
  - Integration with `EconomyService`: checks balance, verifies availability, deducts Mission Credits, increments inventory, and dispatches `'component:purchased'` events with guaranteed fail-safe rollback.
- **Interactive Component Comparison Modal (`src/engineering/ui/ComponentComparisonModal.ts`):**
  - Side-by-side UI window comparing attribute diffs, advantage highlights, compatibility tag contrasts, and educational engineering trade-off analysis.
- **Updated Engineering Facility UI (`src/scenes/RocketEngineeringScene.ts`):**
  - Enhanced Tab 3 (`COMPONENTS`) with category filter bar across all 8 categories, credit balance display, active comparison banner, component cards with availability state badges, educational trade-off callouts, purchase buttons, and compare modal triggers.
- **Verification & Automated Tests:**
  - `RocketComponentDatabase.test.ts`: 4 tests verifying component counts, unique IDs, 8-category coverage, and non-hazardous educational attributes.
  - `RocketComponentRegistry.test.ts`: 6 tests verifying singleton loading, invalid data rejection, category/tag queries, search, availability evaluation, and comparison analysis.
  - `ComponentInventoryService.test.ts`: 6 tests verifying starter inventory, Mission Credits purchasing, failed purchase safety, project installation tracking, reservations, and persistence roundtrip.
  - `RocketEngineeringSceneComponents.test.ts`: 3 integration tests verifying components view rendering, comparison modal launch/close, and inventory procurement.
  - Total test suite expanded to **85 test files** and **468 tests** (100% pass rate).

### Phase 22: Visual Rocket Builder, Modular Configuration Engine & Design Canvas (Completed)

- **Modular Configuration Architecture (`src/engineering/builder/RocketBuilderTypes.ts`):**
  - Strongly typed schemas for modular vehicle stages (`ModularStageGroup`), abstract configuration slots (`ModularConfigurationSlot`), configuration slot types (`ConfigurationSlotType`: `STRUCTURE`, `PROPULSION`, `FUEL`, `GUIDANCE`, `POWER`, `PAYLOAD`, `COMMUNICATION`, `RECOVERY_SAFETY`), and authoritative modular vehicle configurations (`ModularRocketConfiguration`).
  - Real-time design performance statistics schema (`RocketBuilderStats`): Total Mass Units (MU), Payload Capacity Rating, Performance Rating, Reliability Rating (%), Net Electrical Power (Watts), Communication Rating, Configuration Completeness %, Estimated Cost (Credits), Flight Readiness flag, and Staging Warnings.
  - Real-time Mission Requirement status schema (`MissionRequirementStatus`) evaluating destination reachability, payload class match, minimum payload lift capacity, certified reliability threshold, and net power margin.
- **Authoritative Rocket Builder Engine (`src/engineering/builder/RocketBuilderEngine.ts`):**
  - Core logic engine managing active vehicle configurations, template generation, slot querying, slot compatibility validation, component installation/removal with inventory allocation/release, dynamic stage group addition and removal (Stage 1 Core Booster, Stage 2 Vacuum Inserter, optional Stage 3 Auxiliary), real-time stat calculation, project synchronization (`saveToProject`), version bumping (`v1.0.0` -> `v1.1.0`), and configuration cloning/discarding.
  - Slot compatibility rules enforce category matching and tag intersections (`LOWER_BOOSTER`, `UPPER_SECTION`, `INTERSTAGE`, `ATMOSPHERIC_FLIGHT`, etc.).
  - Inventory synchronization: automatically uninstalls previous components, installs new ones through `ComponentInventoryService`, and tracks unsaved changes against initial configuration snapshots.
- **Interactive 2D Blueprint Design Canvas (`src/engineering/builder/ui/RocketDesignCanvas.ts`):**
  - High-precision vector blueprint assembly canvas with technical grid, launch mount cradle, and modular vehicle rendering (cylindrical booster core, dual booster engine bells, aerodynamic fins, interstage ring, vacuum upper stage, conical payload fairing, payload silhouette).
  - Interactive configuration slot hotspot tags with leader lines, stage level tags, component name badges, and slot selection click handlers.
  - Viewport navigation controls: Zoom In (`+`), Zoom Out (`-`), Zoom Reset (`1:1`), Fit to Screen, and center view, with smooth clamping between 0.5x and 2.2x.
- **Unified 8-Panel Visual Rocket Builder Interface (`src/engineering/builder/ui/VisualRocketBuilderView.ts`):**
  - Top Action & Status Bar: Vehicle Name, Version tag, Class Rating badge, Unsaved Modifications indicator, and quick actions (`SAVE DESIGN`, `SAVE NEW VERSION`, `DUPLICATE`, `DISCARD`, `DASHBOARD`).
  - Left Panel: Stage Overview list (Stage 1 Booster, Stage 2 Upper Inserter) with `+ ADD STAGE` and `- REMOVE TOP` controls, plus interactive Configuration Slot Tree displaying slot status, type tags, component badges, and required/optional states.
  - Center View: Interactive `RocketDesignCanvas` instance integrated with two-way slot selection synchronization.
  - Top-Right Panel: Real-time Design Performance & Staging Metrics Grid with Flight Readiness indicator (`FLIGHT READY` vs `DEFICIENT STAGING`) and operational warnings.
  - Middle-Right Overlay: Mission Compatibility Checklist (when active mission context is present), providing live evaluations of mission constraints.
  - Lower-Right Panel: Component Selection & Inventory Catalogue showing compatible parts for active slot with ownership counts, availability, stats, `INSTALL`, `UNINSTALL`, and `BUY & INSTALL` actions.
  - Bottom-Right Panel: Component Details & Educational Specifications Inspector displaying descriptions, educational staging trade-offs, and compatibility tags.
- **Integration with Rocket Engineering Facility (`src/scenes/RocketEngineeringScene.ts`):**
  - Upgraded Section 2 (`BUILDER`) from static blueprint mockup to live `VisualRocketBuilderView`.
  - Connected mission context routing from Mission Operations Centre and return-to-dashboard navigation.
- **Verification & Automated Tests:**
  - `RocketBuilderEngine.test.ts`: 9 tests verifying default configurations, slot retrieval, category/tag compatibility checks, component installation/removal, multi-stage addition/removal, real-time stat calculation, mission requirement evaluation, project synchronization with version bumping, and duplicate/discard operations.
  - `RocketDesignCanvas.test.ts`: 4 tests verifying canvas initialization, zoom clamping (0.5x–2.2x), pan and centering, and configuration rendering with slot selection.
  - `VisualRocketBuilderView.test.ts`: 4 tests verifying 8-panel mounting, slot selection synchronization, mission requirements overlay evaluation, and component install/uninstall interactions.
  - Total test suite expanded to **88 test files** and **485 tests** (100% pass rate).

### Phase 23: Central Rocket Validation Engine & Mission Readiness Integration (Completed)

- **Comprehensive Validation Architecture (`src/engineering/validation/RocketValidationTypes.ts`):**
  - Strongly typed contracts for 7 canonical validation categories: `CONFIGURATION_COMPLETENESS`, `COMPONENT_AVAILABILITY`, `COMPONENT_COMPATIBILITY`, `STRUCTURAL_AND_RATINGS`, `MISSION_COMPATIBILITY`, `ECONOMIC_VALIDATION`, and `TECHNOLOGY_VALIDATION`.
  - Three-tier severity model: `ERROR` (blocks flight certification), `WARNING` (advisory engineering trade-off / sub-optimal staging), and `INFORMATION` (neutral observations).
  - Deterministic overall readiness statuses: `NOT_VALIDATED`, `VALIDATION_IN_PROGRESS`, `FAILED`, `PASSED_WITH_WARNINGS`, and `PASSED`. Derived strictly from evaluated issues (cannot be overridden by UI).
  - Schemas for `ValidationIssue`, `CategoryValidationResult`, `StructuralAndConfigurationRatings`, `MissionCompatibilityReport` with individual checkpoints, and `RocketValidationHistoryRecord`.
  - Educational Trade-Off analysis model covering 6 concrete topics: `MASS_AND_CAPABILITY`, `PAYLOAD_AND_MISSION`, `POWER_AND_SYSTEMS`, `COMMUNICATION_AND_DATA`, `COST_AND_PERFORMANCE`, and `RELIABILITY_AND_COMPLEXITY`.
- **Authoritative Central Validation Engine (`src/engineering/validation/RocketValidationEngine.ts`):**
  - Strictly read-only validation pipeline evaluating modular configurations across all 7 categories without mutating funds, component inventory, or configuration state.
  - Deterministic configuration hashing and stale report detection (`isReportStale`, `invalidateReport`).
  - Validation run history tracking (up to 20 historical runs per vehicle project).
  - Full EventBus dispatching (`rocket:validation_completed`, `rocket:validation_passed`, `rocket:validation_failed`).
- **Rocket Mission Readiness Bridge (`src/engineering/validation/RocketMissionReadinessService.ts`):**
  - Decoupled bridge connecting the validation engine to `MissionLifecycleManager` and `MissionPreparationService`.
  - Strictly enforces partial readiness boundaries: certified launch vehicle satisfies `PreparationTaskType.LAUNCH_VEHICLE_CONFIGURATION` but does not grant overall mission readiness when other tasks (spacecraft design, payload integration, comms setup) remain pending.
  - Automatically progresses mission lifecycle through `PREPARING` and `READY_FOR_VALIDATION` to `READY` when all mandatory preparation tasks are fulfilled.
- **Enhanced Rocket Engineering Scene UI (`src/scenes/RocketEngineeringScene.ts`):**
  - Completely overhauled Section 6 (`VALIDATION`) with:
    - Dynamic top certification header bar with color-coded status badges, summary explanations, and quick actions (`OPEN IN BUILDER`, `RE-VALIDATE`).
    - Stale validation alert banner when design was edited in the builder after last validation.
    - Interactive 7-category status matrix with category-level pass/warn/fail pills and category filtering.
    - Filterable issues list with severity icons, affected slot/stage references, detailed explanations, and direct "FIX IN BUILDER" jump links.
    - Educational Trade-Off Insights panel rendering all 6 trade-off analyses with observations and concrete engineering recommendations.
- **Verification & Automated Tests:**
  - `RocketValidationEngine.test.ts`: 15 unit tests covering valid configurations, empty stages, missing required components, corrupted component IDs, unowned inventory, conflicting project reservations, category/tag compatibility violations, technology/rank locks, credit deficits, mission constraints, suborbital vs orbital reachability, stale report detection, educational trade-offs across 6 topics, 20-run history depth, and EventBus emission.
  - `RocketMissionReadinessService.test.ts`: 4 unit tests verifying partial readiness boundaries, launch vehicle task configuration, failed validation behavior, complete mission readiness transitions, and error handling.
  - Total test suite expanded to **90 test files** and **504 tests** (100% pass rate).

### Phase 24: Rocket Testing Workbench, Design Inspection & Pre-Launch Readiness Interface (Completed)

- **Authoritative Domain Contracts (`src/engineering/testing/RocketTestingTypes.ts`):**
  - Component slot inspection states: `INSTALLED`, `COMPATIBLE`, `MISSING`, `LOCKED`, `UNAVAILABLE`, `AWAITING_VALIDATION`, `VALIDATION_FAILED`.
  - Abstract simulation outcomes: `PASSED`, `PASSED_WITH_WARNINGS`, `FAILED`.
  - Deterministic pre-launch readiness states: `NOT_PREPARED`, `PREPARATION_IN_PROGRESS`, `AWAITING_ASSESSMENT`, `ASSESSMENT_FAILED`, `READY_WITH_WARNINGS`, `READY_FOR_MISSION_DEPLOYMENT`.
  - Sub-assessment categories across 6 domains: `COMPATIBILITY`, `CAPACITY`, `PROPULSION_LIFT`, `POWER_BALANCE`, `RELIABILITY`, and `MISSION_SUITABILITY` (with explicit N/A handling for missions without power/comms requirements).
  - 10-point pre-launch checklist criteria definitions, rolling test history records (up to 20 runs per vehicle project), and deployment clearance model.
- **Central Testing Engine (`src/engineering/testing/RocketTestingManager.ts`):**
  - Singleton manager coordinating design inspection, 6-category abstract performance and reliability simulations, 10-point deterministic pre-launch checklist evaluation, test run persistence, and Launch Complex Pad Alpha clearance.
  - Strictly read-only execution: no credits deducted or component quantities modified during simulations.
  - Automatically flags test runs as stale when project configuration hash or version changes.
  - Deploys authorized vehicle to `FAC_LAUNCH_COMPLEX_PAD_ALPHA` (`FacilityId.LAUNCH_COMPLEX_PAD_ALPHA`), updates mission preparation task `LAUNCH_VEHICLE_CONFIGURATION` to `COMPLETED`, and dispatches lifecycle events on `EventBus`.
- **Interactive PixiJS Testing Workbench View (`src/engineering/testing/ui/RocketTestingWorkbenchView.ts`):**
  - Replaces static simulation mock with 7 functional sub-tabs:
    1. `Design Inspection`: Visual staging breakdown with colored slot nodes, component role inspector, and summary metrics.
    2. `System Compatibility Assessment`: Hardware tags, slot categories, and staging heuristics.
    3. `Abstract Performance Assessment`: Capacity, propulsion lift, and power balance metrics.
    4. `Reliability Assessment`: Composite reliability rating (%), complexity penalties, and mission certification thresholds.
    5. `Mission Suitability Assessment`: Destination reachability and payload platform alignment.
    6. `Test History`: Rolling log of up to 20 past test runs with timestamp, version tag, score, outcome, and stale badges.
    7. `Pre-Launch Readiness`: Deterministic 10-point checklist, clearance status banner, and `"PROCEED TO LAUNCH COMPLEX"` deployment button.
- **Scene & Routing Integration (`src/scenes/RocketEngineeringScene.ts`):**
  - Overhauled Section 7 (`SIMULATION` -> `'7. TESTING WORKBENCH'`) to mount `RocketTestingWorkbenchView`.
  - Added seamless routing to Launch Complex Pad Alpha (`FAC_LAUNCH_COMPLEX_PAD_ALPHA`) without auto-launching.
  - Quick jump buttons from Dashboard Overview (`'🔬 TESTING WORKBENCH'`), Mission Fit (`'🚀 PRE-LAUNCH READINESS'`), and Validation (`'🔬 TEST BENCH'`).
- **Verification & Automated Tests:**
  - `RocketTestingManager.test.ts`: 10 unit tests verifying design inspection, unowned component detection, 6-category test simulations, failure on missing engine, rolling history preservation, 10-point pre-launch evaluation, deployment clearance to Launch Complex Pad Alpha, deficient rejection, stale version detection, and EventBus emission.
  - `RocketTestingWorkbenchView.test.ts`: 4 UI tests verifying default sub-tab mounting, switching across all 7 sub-tabs, slot selection inspection updates, and callback triggers.
  - Total test suite expanded to **92 test files** and **518 tests** (100% pass rate).

### Phase 25: Launch Complex Operations, Deployment State Machine & Launchpad Presentation (Completed)

- **Launch Complex Domain Models (`src/launch/LaunchDeploymentTypes.ts`):**
  - Canonical 11-state machine: `NOT_ASSIGNED`, `AWAITING_ROCKET`, `AWAITING_PAYLOAD`, `AWAITING_VALIDATION`, `AWAITING_FINAL_READINESS`, `ELIGIBLE_FOR_DEPLOYMENT`, `DEPLOYMENT_SCHEDULED`, `DEPLOYMENT_INITIATED`, `DEPLOYED`, `CANCELLED`, `DEPLOYMENT_FAILED`.
  - Authoritative `DeploymentRecord` schema storing `deploymentId` (`dep_...`), `missionInstanceId`, `missionId`, `projectId`, `designVersion`, `configurationHash`, `payload` assignment, `launchLocation` (`FAC_LAUNCH_COMPLEX_PAD_ALPHA`), `padCode` (`PAD-01`), `status`, `events` audit history, and deterministic `requirements` checklist.
  - Payload integration taxonomy with 8 payload categories (`SATELLITE`, `COMMUNICATION_SATELLITE`, `OBSERVATION_SATELLITE`, `SCIENTIFIC_PROBE`, `LANDER`, `ROVER_CARGO`, `RESEARCH_MODULE`, `SURFACE_DEPLOYMENT_MODULE`) and 5 integration states (`PENDING_INTEGRATION`, `MOUNTED_IN_VEHICLE`, `INTEGRATED`, `VERIFIED`, `UNAVAILABLE`).
- **Central Launch Deployment Manager (`src/launch/LaunchDeploymentManager.ts`):**
  - Authoritative singleton coordinating deployment records, active launchpad operations, and vehicle assignments.
  - Conflict detection: prevents assigning the same rocket project to multiple simultaneous active deployments.
  - 10-point deterministic eligibility evaluation:
    1. Assigned mission contract validation (`req_mission_assigned`).
    2. Mission lifecycle state validation (`req_mission_lifecycle`).
    3. Rocket project assignment (`req_rocket_assignment`).
    4. Rocket version integrity and configuration hash matching (`req_version_current`).
    5. Engineering validation report clearance (`req_validation_status`).
    6. Ground test benchmark clearance (`req_testing_benchmark`).
    7. Mission flight envelope and reachability compatibility (`req_mission_compatibility`).
    8. Payload integration check against vehicle upper stages (`req_payload_integration`).
    9. Component inventory ownership check (`req_hardware_inventory`).
    10. Active pad conflict check (`req_no_conflicts`).
  - Read-only deterministic transitions: UI cannot force readiness.
  - Explicit transparency: cleanly reports unconfigured payloads as `UNAVAILABLE` without faking readiness.
  - EventBus telemetry integration: dispatches `deployment:created`, `deployment:rocket_assigned`, `deployment:payload_assigned`, `deployment:readiness_updated`, `deployment:scheduled`, `deployment:initiated`, `deployment:completed`, and `deployment:cancelled`.
- **Standing Rocket 2D/2.5D Visual Presentation (`src/launch/ui/LaunchpadRocketVisual.ts`):**
  - Procedural vehicle renderer derived from modular staging configuration standing on Pad Alpha (3050, 1830).
  - Silhouette rendering: launch cradle, hold-down hydraulic clamps, booster stage with exhaust nozzles, stabilization fins, upper stage, fairing shroud, and payload bay platform.
  - Infrastructure detailing: Umbilical swing arms extending from East service tower to booster and upper stage service disconnect ports.
  - Procedural cryogenic venting: per-frame boil-off particle simulation with billowy vapor wisps ascending and dissipating in wind currents.
- **Launch Operations Dashboard Terminal Modal (`src/launch/ui/LaunchOperationsDashboardModal.ts`):**
  - 1560×880 aerospace dashboard modal implementing all 9 required operational sections:
    1. Assigned Mission Card (target body, sequence, category, objectives).
    2. Selected Rocket Project Card (class rating, staging count, wet mass, vac delta-V, LEO lift).
    3. Rocket Design Version badge with hash verification.
    4. Payload / Spacecraft Integration Status Card.
    5. Rocket Validation Status Card (blocking error/warning counts).
    6. Testing Simulation Benchmark Status Card.
    7. Mission Compatibility & Reachability Analysis Card.
    8. Deployment State & Clearance Badge.
    9. Outstanding Requirements Checklist (all 10 points with category LED indicators).
  - Vehicle switcher modal allowing quick vehicle re-assignment directly from the pad.
  - Control bar with quick routing to Mission Operations Centre, Rocket Engineering test bench, and Launch Observation area.
- **Launch Observation Area & Blast Bunker View (`src/launch/ui/LaunchObservationView.ts`):**
  - 1560×880 blast bunker observation viewport with optical tracking periscope reticle, target acquisition crosshairs, and range grid markings.
  - 4 telemetry panels: Mission Briefing, Launch Vehicle Telemetry, Target Destination Metrics, and Integrated Payload Envelope.
  - Countdown Sequencer: T-10s countdown clock with live numerical display, progress bar, audio cues, and Emergency Abort Hold switch.
- **Campus & Scene Integration:**
  - `HeadquartersScene`: Mounted `LaunchpadRocketVisual` on `WORLD_PROPS` layer at Pad Alpha; mounted `LaunchOperationsDashboardModal` and `LaunchObservationView` on `UI_OVERLAY`; wired interactive zones `LC_ZONE_LAUNCHPAD`, `LC_ZONE_PRELAUNCH_INSPECTION`, `LC_ZONE_ROCKET_PREPARATION`, and `LC_ZONE_OBSERVATION_BUNKER`.
  - Bidirectional routing between Mission Operations, Rocket Engineering, and Launch Complex preserving mission and vehicle context.
- **Verification & Automated Tests:**
  - `LaunchDeploymentManager.test.ts`: 9 comprehensive unit tests verifying deployment creation, rocket assignment, conflict detection, validation checks, payload integration, countdown scheduling, abort with audit logging, EventBus dispatches, and pad summary generation.
  - `LaunchOperationsUI.test.ts`: 4 UI integration tests verifying pad visual updates, dashboard modal rendering with all 9 sections, vehicle switcher modal, and observation bunker view with countdown sequencing.
  - Total test suite expanded to **94 test files** and **531 tests** (100% pass rate).

---

## 4. Verification & Testing Metrics

- **Unit Test Suites:** 94 test suites
- **Total Unit Tests:** 531 tests passed (100% passing rate)
- **Test Duration:** ~8.6 seconds
- **Production Build:** `tsc && vite build` bundled 943 modules in **512ms** with 0 errors.

---

## 5. Technology Stack Summary

| Category             | Technology | Version | Purpose                                 |
| :------------------- | :--------- | :------ | :-------------------------------------- |
| **Language**         | TypeScript | 5.3+    | Type-safe game architecture             |
| **Renderer**         | PixiJS     | 8.23.0  | 2D/2.5D WebGL/WebGPU graphics           |
| **Bundler & Server** | Vite       | 8.3.8   | Fast HMR dev server & production builds |
| **Test Framework**   | Vitest     | 5.1.0   | Fast headless unit testing              |
| **Audio Engine**     | Howler.js  | 2.2.4   | Multi-channel positional audio          |
| **Animation**        | GSAP       | 3.15.1  | High-precision procedural tweens        |
