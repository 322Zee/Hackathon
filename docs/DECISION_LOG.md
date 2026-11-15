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
  - *Rust / WebAssembly (wasm-bindgen):* Rejected. Although Rust provides stellar raw CPU performance, it requires external `cargo` toolchains (not available in the current machine environment) and adds substantial build latency and boundary marshalling overhead between WASM and the browser DOM/canvas.
  - *Plain JavaScript:* Rejected. Lack of compile-time types would introduce severe fragility in complex orbital math, save serialization, and multi-service event systems.

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
  - *Unity 6 LTS (URP):* Strongly Rejected. A previous attempt committed Unity project files to this repository. Unity was rejected because:
    - It is a full 3D game engine, violating Project Rule 3.
    - It cannot be developed natively inside Google Antigravity IDE (requires an external proprietary desktop Unity Editor GUI), violating Project Rule 1.
    - It was not installed or operational on the system.
  - *Phaser 3:* Evaluated. While mature, Phaser 3 has an older rendering pipeline with more rigid architecture compared to PixiJS v8's modern WebGPU-first batching pipeline.
  - *Three.js:* Rejected. Three.js is primarily a 3D scene engine; using it for a 2D/2.5D game introduces full 3D engine overhead and violates Project Rule 3.

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
  - *Webpack / Turbopack:* Slower dev startup, complex config files.
  - *Parcel:* Less deterministic plugin configuration and weaker integration with Vitest.

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
  - *Jest:* Requires `ts-jest` or Babel preprocessing, leading to slower execution and ESM friction.

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
  - *Matter.js / Rapier2D for Spaceflight:* Generic rigid-body engines are built for terrestrial box/circle collisions under constant gravity ($g$), which causes severe inaccuracies, drift, and jitter when simulating orbital trajectories across millions of kilometers.

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
  - *Global Monolithic Singleton (`GameManager`):* Prone to high coupling, hard to unit test, and leads to maintenance nightmares as features expand.
