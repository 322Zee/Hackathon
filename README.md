# INTERSTELLAR CONTINUUM

A sophisticated 2D/2.5D space exploration, mission-design, and agency simulation game developed in Google Antigravity IDE.

---

## Technical Stack Overview
- **Language:** TypeScript 5+ (strict mode, ES2022)
- **Renderer:** PixiJS v8 (`pixi.js` ^8.23.0) — High-performance 2D/2.5D WebGPU/WebGL 2
- **Build System & Dev Server:** Vite 6+ (`vite` ^8.3.8)
- **Testing:** Vitest 3+ (`vitest` ^5.1.0)
- **Animation:** GSAP 3+ (`gsap` ^3.15.1) & PixiJS Ticker
- **Audio:** Howler.js (`howler` ^2.2.4)
- **Runtime:** Node.js v24 LTS + npm 11.6+

---

## Quickstart Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Starts the Vite development server with Hot Module Replacement (HMR) at `http://localhost:3000/`.

### 3. Run Automated Tests
```bash
npm test
```
Executes the Vitest suite covering orbital mechanics, domain services, economy, and persistence.

### 4. Build for Production
```bash
npm run build
```
Typechecks the TypeScript source with `tsc` and bundles production assets via Vite.

---

## Permanent Project Documentation

Detailed architecture and design documentation is maintained in the `docs/` directory:

1. [Development Status](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/docs/DEVELOPMENT_STATUS.md): Current phase, completed milestones, test results, and roadmap.
2. [Game Design Reference](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/docs/GAME_DESIGN_REFERENCE.md): Narrative, gameplay loop, HQ facilities, mission types, solar system progression, and economy.
3. [Technical Architecture](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/docs/TECHNICAL_ARCHITECTURE.md): Technology stack, rendering pipeline, service architecture, asset management, and multiplayer design.
4. [Development Handoff](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/docs/DEVELOPMENT_HANDOFF.md): Summary of completed foundations, core files, interfaces, and instructions for Phase 1.
5. [Feature Requirements Checklist](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/docs/FEATURE_REQUIREMENTS.md): Feature inventory with unique identifiers (`FEAT-XXX-##`), currently marked `NOT STARTED`.
6. [Architecture Decision Log](file:///c:/Users/user-pc/OneDrive/Documents/GitHub/Space/docs/DECISION_LOG.md): Architectural decisions and rationale for chosen technologies and rejected alternatives.
