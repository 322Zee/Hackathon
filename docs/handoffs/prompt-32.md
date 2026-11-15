# Phase 30 / Prompt 32 Technical Handoff: Scientific Data Collection & Research Foundation

## 1. Executive Summary

This document specifies the architecture, data contracts, scientific classifications, progression systems, user interfaces, integration points, and verification results for the **Scientific Data Collection and Research Foundation** developed under **Prompt 32** for *INTERSTELLAR CONTINUUM*.

The scientific data system introduces a comprehensive, scientifically responsible knowledge foundation that enables the aerospace organization to collect, store, classify, analyze, compare, and apply scientific discoveries made across exploration missions.

Exploration produces meaningful scientific knowledge rather than merely awarding mission currency. The system models findings across the Solar System—from the Moon and terrestrial planets to asteroids, gas giants, ice giants, and solar/orbital environments—while preserving existing technology stacks, maintaining data integrity across serialization/deserialization, and avoiding modifications to unowned systems.

---

## 2. Architecture & File Ownership

All changes have been confined strictly to the dedicated scientific data module, isolated UI components, and tests under feature branch `feature/p32-scientific-data`.

### Directory Layout:

```
src/science/
├── ScientificTypes.ts                   # Authoritative data contracts, enums & interfaces
├── ScientificEvents.ts                  # Typed domain events & payload contracts
├── ScientificEventBus.ts                # Strongly typed event bus with core EventBus bridging
├── ScientificDataManager.ts             # Authoritative central singleton manager & public APIs
├── index.ts                             # Public barrel export
├── adapters/
│   ├── EconomyAdapter.ts               # Non-duplicating adapter interfacing with EconomyService
│   └── ResearchServiceAdapter.ts       # Adapter interfacing with ResearchService for tech unlocks
├── data/
│   ├── DefaultScientificDiscoveries.ts  # Authored canonical discoveries across Solar System bodies
│   └── DefaultResearchProjects.ts       # Authored research projects linked to discoveries & unlocks
└── ui/
    └── ScientificArchiveView.ts         # Full multi-tab Scientific Archive & Research modal view

tests/science/
├── ScientificDataManager.test.ts        # 13 tests: singleton, registration, duplicate protection, serialization
├── ScientificDataCollection.test.ts     # 9 tests: destinations, 10 categories, educational responsibility, events
├── ResearchProgression.test.ts          # 11 tests: analysis steps, economy rewards, tech unlocks, requirements
└── ScientificArchiveUI.test.ts          # 3 tests: view lifecycle, visibility, navigation across 4 tabs

docs/handoffs/
└── prompt-32.md                         # Authoritative handoff document
```

### Untouched Shared Modules:
- Mission simulation core: untouched.
- Launch cinematic: untouched.
- Payload system: untouched.
- Mission Control: untouched.
- Communications network: untouched.
- Planetary environment: untouched.
- Rover system: untouched.
- Planetary base system: untouched.
- Mission results system: untouched.
- Global economy implementation: untouched (interfaced via `EconomyAdapter`).
- Main entrypoint & HTML: untouched.
- Shared dependency manifests (`package.json`, `package-lock.json`): untouched.

---

## 3. Scientific Data Domain Models

The domain model structures all scientific exploration output into extensible, strongly typed entities:

### 3.1 Scientific Finding (`ScientificFinding`)
- **Finding Identifier (`id`):** Deterministic unique canonical identifier (e.g. `FINDING_MOON_WATER_ICE_SHACKLETON`, `FINDING_MARS_JEZERO_PALEO_LAKE_SEDIMENTS`).
- **Discovery Name (`name`):** Human-readable name of the discovery.
- **Destination (`destinationId`):** Celestial destination binding using `DestinationId` (e.g. `DEST_MOON`, `DEST_MARS`, `DEST_EUROPA`, `DEST_TITAN`, etc.).
- **Scientific Category (`category`):** One of the 10 canonical disciplines (`ScientificCategory`).
- **Description (`description`):** Educational, scientifically grounded summary of observed phenomena.
- **Collection Source (`collectionSource`):** Method of acquisition (`ORBITAL_SURVEY`, `SURFACE_LANDER`, `SURFACE_ROVER`, `SAMPLE_RETURN`, `ATMOSPHERIC_PROBE`, etc.).
- **Mission Identifier (`missionId`):** Exploration mission that yielded the finding.
- **Collection Timestamp (`collectionTimestamp`):** Epoch millisecond timestamp.
- **Data Quality Rating (`dataQuality`):** Abstract rating (`PRELIMINARY`, `STANDARD`, `HIGH_QUALITY`, `EXCEPTIONAL`) scaling research value multipliers ($0.5\times$ to $2.0\times$).
- **Research Value (`researchValue`):** Abstract progression points awarded upon analysis.
- **Analysis Status (`analysisStatus`):** Lifecycle state (`UNANALYSED`, `IN_PROGRESS`, `ANALYSED`, `VERIFIED`).
- **Analysis Progress (`analysisProgress`):** Percentage (0 to 100%).
- **Unlock Requirements (`unlockRequirements`):** Optional prerequisite finding IDs.
- **Related Discoveries (`relatedFindingIds`):** Bidirectionally linked findings providing comparative context.
- **Visual Asset Key (`visualAssetKey`):** Optional icon/asset reference.
- **Scientific Authenticity (`isEstablishedScience`):** Boolean distinguishing empirically confirmed astronomical science from fictional/hypothetical gameplay discoveries.
- **Schema Version (`schemaVersion`):** Version tag for schema migration.

### 3.2 Collection Conditions (`CollectionConditions`)
- `signalQuality`: Signal quality at time of collection (0–100).
- `instrumentFidelity`: Sensor fidelity rating (0–100).
- `hazardLevel`: Environmental hazard classification (`NONE`, `LOW`, `MODERATE`, `HIGH`, `EXTREME`).
- `collectionDurationHours`: Duration of observation window in game hours.
- `notes`: Operational circumstances and notes.

### 3.3 Research Project (`ResearchProject`)
- **Project Identifier (`id`):** Canonical ID (e.g. `PROJ_LUNAR_VOLATILE_UTILIZATION`).
- **Title & Description:** Strategic research directive objectives.
- **Category:** Primary scientific category.
- **Required Findings (`requiredFindingIds`):** Array of finding IDs that must be analyzed or verified.
- **Progress (`progress`):** Computed percentage (0 to 100%) reflecting satisfied findings.
- **Status (`status`):** `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.
- **Unlockable Technologies (`unlockableTechIds`):** Technology node IDs granted to `ResearchService` upon completion.
- **Research Rewards (`rewards`):** Payouts awarded to `EconomyService` (researchData, technologyPoints, credits).

---

## 4. Canonical Scientific Categories

The system fully supports 10 canonical scientific categories:

1. **Surface Geology (`SURFACE_GEOLOGY`):** Landforms, crater morphology, magma ocean crusts, and tectonic structures.
2. **Atmospheric Observations (`ATMOSPHERIC_OBSERVATIONS`):** Supercritical fluid atmospheres, trace methane fluctuations, supersonic jet streams.
3. **Mineral Composition (`MINERAL_COMPOSITION`):** Clastic mudstones, carbonates, prebiotic amino acids, and meteoritic minerals.
4. **Environmental Measurements (`ENVIRONMENTAL_MEASUREMENTS`):** Diurnal temperature swings, cryogenic methane hydrological cycles, surface pressure.
5. **Magnetic Field Observations (`MAGNETIC_FIELD_OBSERVATIONS`):** Mini dynamos, tilted quadrupole magnetospheres, crustal albedo swirl anomalies.
6. **Ice & Water Observations (`ICE_AND_WATER`):** Permanently shadowed crater volatiles, subsurface brine oceans, cryoplume hydrothermal venting.
7. **Asteroid Composition (`ASTEROID_COMPOSITION`):** Sodium carbonate cryovolcanic domes, differentiated basaltic achondrite crusts.
8. **Planetary Imaging (`PLANETARY_IMAGING`):** Ring shepherd dynamics, peaks of eternal light, synthetic aperture radar mapping.
9. **Radiation Environment (`RADIATION_ENVIRONMENT`):** Galactic cosmic ray dose profiles, relativistic synchrotron radiation belts, Van Allen belts.
10. **General Astronomical Observations (`GENERAL_ASTRONOMICAL`):** Coronal mass ejection shock dynamics, Parker spiral plasma propagation.

---

## 5. Data Collection & Analysis System

- **Safe Registration:** New findings are registered via `registerScientificFinding(request)`. Duplicate attempts (same name and destination) are detected gracefully; higher-quality re-observations upgrade existing records without duplicating entries.
- **Multi-Finding Mission Support:** Missions can register multiple distinct findings across categories.
- **Stepwise Analysis:** Players advance analysis from `UNANALYSED` $\to$ `IN_PROGRESS` $\to$ `ANALYSED` ($100\%$).
- **Economic Integration:** Upon reaching `ANALYSED`, abstract research value points are granted to `EconomyService` via `EconomyAdapter`.
- **Peer Verification:** Analysed findings can be peer-verified to `VERIFIED` status, awarding an additional $25\%$ research point bonus.
- **Comparative Analysis:** Related findings can be compared side-by-side to inspect compositional differences and evolutionary parallels.

---

## 6. Research Progression Foundation

- **Prerequisite Validation:** Research projects require specific scientific findings to be analyzed before the project can be completed.
- **Automatic Recalculation:** When scientific findings reach `ANALYSED` status, active research projects automatically recalculate their progress.
- **Completion & Payouts:** Calling `completeResearchProject(projectId)` verifies all prerequisite findings, grants research rewards (researchData, technologyPoints, credits) via `EconomyAdapter`, unlocks technologies via `ResearchServiceAdapter`, and transitions status to `COMPLETED`.

---

## 7. Public Integration Contract & Events

### Core Public APIs (`ScientificDataManager`):
```typescript
registerScientificFinding(request: FindingRegistrationRequest): ScientificFinding;
getScientificFinding(id: string): ScientificFinding | null;
listScientificFindings(filter?: FindingFilter): ScientificFinding[];
getFindingsByDestination(destinationId: DestinationId): ScientificFinding[];
getFindingsByMission(missionId: string): ScientificFinding[];
updateFindingQuality(findingId: string, newQuality: DataQualityRating): ScientificFinding;
analyseFinding(findingId: string, progressDelta?: number): ScientificFinding;
verifyFinding(findingId: string): ScientificFinding;
compareDiscoveries(idA: string, idB: string): ComparisonResult;
createResearchProject(request: ResearchProjectCreationRequest): ResearchProject;
getResearchProject(id: string): ResearchProject | null;
listResearchProjects(filter?: ProjectFilter): ResearchProject[];
updateResearchProgress(projectId: string, progressDelta: number): ResearchProject;
completeResearchProject(projectId: string): ResearchProject;
getMissingRequirements(projectId: string): string[];
getResearchOverview(): ResearchOverview;
serialize(): ScientificDataSaveState;
deserialize(state: ScientificDataSaveState): void;
```

### Strongly Typed Events (`ScientificEventBus`):
- `ScientificFindingRegistered`: Dispatched when a finding is registered.
- `FindingAnalysisStarted`: Dispatched when analysis begins on an unanalysed finding.
- `FindingAnalysisCompleted`: Dispatched when finding reaches $100\%$ analysis or is verified.
- `ResearchProjectCreated`: Dispatched when a research directive is created.
- `ResearchProgressUpdated`: Dispatched when research project progress advances.
- `ResearchProjectCompleted`: Dispatched when all requirements are met and rewards/tech are granted.

Events bridge automatically to the core `EventBus` as `science:<eventname>` without mutating shared global event definitions.

---

## 8. Scientific Archive Interface (`ScientificArchiveView`)

A 2D PixiJS modal interface ($1560 \times 880$) designed to match `UIDesignTokens` and project aerospace aesthetics:
- **Tab 1: Database Overview:** Displays 5 KPI tiles, discipline distribution bars across all 10 categories, and planetary survey completion readouts.
- **Tab 2: Discovery Archive:** Destination filters (All, Moon, Mars, Venus, Mercury, Asteroids, Jupiter, Saturn, Outer Giants) and Category filters, interactive discovery scroll list, and detailed inspector displaying educational summaries, authenticity banners, analysis progress bars, "Advance Analysis" buttons, and related discovery shortcuts.
- **Tab 3: Research Projects:** Roadmap cards displaying project descriptions, prerequisite finding checklists, progress bars, reward payouts, and "Finalize Research" actions.
- **Tab 4: Comparative Science Lab:** Side-by-side comparison of two discoveries highlighting shared categories, orbital divergence, and scientific implications.

---

## 9. Test Verification & Results

- **Unit Test Files Added:**
  - `tests/science/ScientificDataManager.test.ts` (13 tests passed)
  - `tests/science/ScientificDataCollection.test.ts` (9 tests passed)
  - `tests/science/ResearchProgression.test.ts` (11 tests passed)
  - `tests/science/ScientificArchiveUI.test.ts` (3 tests passed)
- **Science Subsystem Total:** 36 tests passed (36).
- **Full Repository Test Suite:** 120 test files passed (120), 720 tests passed (720).
- **Regressions:** 0.
- **TypeScript Strict Compilation for Science Subsystem (`src/science/`):** 0 errors.

---

## 10. Integration Requirements for Parallel Laptops

### 10.1 Planetary Exploration & Rover Modules (Prompts 33 / 34)
Future rovers, landers, and orbiters submit discoveries using:
```typescript
import { ScientificDataManager, CollectionSource, DataQualityRating, ScientificCategory } from '../science';
import { DestinationId } from '../destinations/DestinationTypes';

const scienceManager = ScientificDataManager.getInstance();
const finding = scienceManager.registerScientificFinding({
  name: 'Noctis Labyrinthus Subsurface Vug',
  destinationId: DestinationId.MARS,
  category: ScientificCategory.MINERAL_COMPOSITION,
  description: 'Secondary sulfate precipitation observed inside bedrock fractures.',
  collectionSource: CollectionSource.SURFACE_ROVER,
  missionId: currentMission.id,
  dataQuality: DataQualityRating.HIGH_QUALITY,
  conditions: {
    signalQuality: 88,
    instrumentFidelity: 95,
    hazardLevel: 'LOW',
    collectionDurationHours: 2.0,
  },
});
```

### 10.2 Mission Results & Telemetry Downlink (Prompt 27 / 30)
Mission completion summaries can query findings registered during a mission:
```typescript
const missionFindings = scienceManager.getFindingsByMission(missionId);
const totalResearchPoints = missionFindings.reduce((sum, f) => sum + f.researchValue, 0);
```

### 10.3 Save / Load Persistence
The game state manager can persist and restore the scientific database:
```typescript
const scienceState = scienceManager.serialize();
// Save to JSON / slot...
scienceManager.deserialize(scienceState);
```

---

## 11. Known Limitations & Extensibility

- **Abstract Values:** Scientific measurements (research values, quality ratings) use abstract progression values to prevent confusing gameplay progression with real scientific constants.
- **Future Expansions:** The schema supports future additions of deep interstellar destinations, exo-solar observations, and sample analysis mini-games without modifying existing data schemas.
