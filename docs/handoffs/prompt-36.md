# Prompt 36 Technical Handoff: Mission Results, Scoring, Rewards, and Performance Evaluation

## 1. Executive Summary

This document specifies the architecture, contracts, mathematical scoring models, performance grading scales, reward settlement framework, permanent historical archive, user interface components, and verification suites for the **Mission Results, Scoring, Rewards, and Performance Evaluation System** developed under **Prompt 36** for *INTERSTELLAR CONTINUUM*.

The mission evaluation system establishes the authoritative flight debriefing layer. Every completed, partially fulfilled, aborted, or failed mission yields a permanent, fully serialized results record that evaluates:
- **Mission Objectives Fulfillment (30 points)**
- **Engineering Efficiency (25 points)**
- **Budget Management (20 points)**
- **Scientific Contribution (15 points)**
- **Reliability & Flight Operations (10 points)**

The system delivers transparent feedback explaining every point awarded or deducted, prevents duplicate reward exploitation across game saves and reloads, registers verified organizational milestones, and provides a tactile Mission Operations debriefing dossier.

---

## 2. Directory Layout & File Ownership

All code, adapters, UI views, and tests are isolated strictly within dedicated directories under the `feature/p36-mission-results` branch:

```
src/results/
├── ResultsTypes.ts                 # Authoritative data contracts, scoring schemas & DTOs
├── ResultsEvents.ts                # Strongly typed evaluation domain events & payloads
├── ResultsEventBus.ts              # Domain event bus with non-invasive Core EventBus bridging
├── ScoringEngine.ts                # Authoritative 5-category data-driven scoring calculation model
├── RewardCalculator.ts             # Grade-scaled reward computation & duplicate-claim prevention
├── PerformanceEvaluator.ts         # High-level evaluation orchestrator & record generator
├── MissionResultsArchive.ts        # Permanent mission archive, filtering, search, & comparison
├── MissionResultsManager.ts        # Authoritative central singleton manager & public APIs
├── index.ts                        # Public module exports barrel
├── adapters/
│   ├── EconomyAdapter.ts           # Non-duplicating adapter interfacing with EconomyService
│   ├── ProgressionAdapter.ts       # Milestone registry & agency prestige/rank progression
│   ├── ObjectivesAdapter.ts        # Translates tracked runtime objectives to scoring inputs
│   ├── ScienceAdapter.ts           # Translates telemetry packets & discoveries to science metrics
│   ├── SimulationAdapter.ts        # Extracts flight dynamics, fuel margins, & anomaly logs
│   └── PersistenceAdapter.ts       # Serializes results & claims to survive game restarts
└── ui/
    ├── PerformanceScoreGauge.ts    # 2D PixiJS vector gauge & glowing grade letter display
    ├── CategoryBreakdownCard.ts    # 5-category performance meter with itemized audit logs
    ├── MissionDebriefingView.ts    # Official Mission Operations debriefing report interface
    └── MissionHistoryArchiveView.ts# Interactive historical archive browser, search, & comparator

tests/results/
├── ScoringEngine.test.ts           # 16 tests: weight overrides, categories, deductions, & grades
├── RewardCalculator.test.ts        # 9 tests: grade bonuses, failure salvage, & claim deduplication
├── PerformanceEvaluator.test.ts    # 7 tests: nominal, partial, failed, cancelled, & duration formatting
├── MissionHistoryArchive.test.ts   # 10 tests: filtering, searching, comparisons, & save restoration
├── MissionResultsManager.test.ts   # 9 tests: full public API suite, milestones, & event bridging
└── ResultsUI.test.ts               # 4 tests: gauge, category cards, debriefing view, & archive view

docs/handoffs/
└── prompt-36.md                    # This authoritative handoff specification
```

### Untouched Shared Modules (Parallel Isolation Confirmed):
- Central mission simulation core: untouched.
- Launch cinematic: untouched.
- Payload system: untouched.
- Mission Control dashboard & telemetry: untouched.
- Communications network: untouched.
- Scientific data system: untouched.
- Planetary environment & rover systems: untouched.
- Global economy & global progression: untouched (interfaced via adapters).
- Main application entrypoint (`src/main.ts`): untouched.
- Root configuration and package manifests (`package.json`, `tsconfig.json`): untouched.

---

## 3. Authoritative Scoring Model

The scoring engine implements a transparent, non-arbitrary, data-driven calculation model:

| Scoring Category | Base Weight | Core Metrics & Evaluation Logic |
|---|---:|---|
| **Mission Objectives** | **30 pts** | Mandatory milestones (80% pool) + Optional secondary objectives (20% pool). Unfulfilled mandatory objectives incur explicit point deductions. Mission cancellation applies a 40% deduction to earned points while preserving pre-abort achievements. |
| **Engineering Efficiency** | **25 pts** | Hull & Structural Integrity (8 pts; full points at $\ge 95\%$ integrity), Trajectory Delta-V Management (6 pts; penalized if burns exceed trajectory budget), Propellant Reserve Conservation (6 pts; full points for $\ge 15\%$ fuel remaining), EPS Power Bus Stability (5 pts; full points for $\ge 80\%$ power margin). |
| **Budget Management** | **20 pts** | Compliance with allocated budget (20 pts). Cost containment generating $\ge 10\%$ savings receives a fiscal surplus commendation. Overruns incur a deduction of 1 point per 5% cost overrun down to 0. |
| **Scientific Contribution** | **15 pts** | Scientific telemetry packet harvest yield (10 pts; ratio of collected to target datasets) + Notable planetary discoveries (5 pts; 2.5 pts per peer-reviewed discovery anomaly). |
| **Reliability & Operations** | **10 pts** | In-flight anomalies & resolution (5 pts; 0 anomalies = 5 pts; unmitigated faults incur -2.5 pts each; resolved faults incur minor telemetry glitch notes) + DSN Link Uptime (3 pts; $\ge 95\%$ carrier lock = 3 pts) + Subsystem Health MTBF (2 pts) + Resilience Commendation for emergency recovery. |
| **Total** | **100 pts** | **Clamped strictly between 0 and 100 points.** |

The configuration is exposed via `ScoringWeightsConfig` and can be adjusted at runtime via `manager.scoringEngine.setWeights(...)`.

---

## 4. Performance Grades & Criteria

The performance grading scale maps final scores to aerospace grade classifications:

| Grade Letter | Performance Grade | Score Range | Operational Meaning |
|:---:|:---|:---:|:---|
| **S** | `EXCEPTIONAL` | **90 – 100** | Flawless flight execution exceeding operational and scientific milestones. |
| **A** | `EXCELLENT` | **80 – 89** | Nominal mission execution with high efficiency across primary flight directives. |
| **B** | `GOOD` | **70 – 79** | Standard mission completion satisfying criteria with minor parameter variances. |
| **C** | `SATISFACTORY` | **60 – 69** | Primary objectives achieved; engineering or budget margins strained. |
| **D** | `NEEDS_IMPROVEMENT` | **40 – 59** | Substantial flight variances, budget overruns, or missed secondary milestones. |
| **F** | `UNSUCCESSFUL` | **0 – 39** | Mission aborted or critical failure preventing primary objective fulfillment. |

### Failure and Status Caps:
- **`COMPLETED`**: Eligible for full scoring (0 - 100).
- **`PARTIALLY_COMPLETED`**: Score capped at 79 (Grade B / Good) to ensure unfulfilled mandatory objectives cannot receive Grade S or A.
- **`CANCELLED`**: Score capped at 55 (Grade D / Needs Improvement).
- **`FAILED`**: Score capped at 35 (Grade F / Unsuccessful). Does not erase unrelated progress or previous saves.

---

## 5. Mission Rewards Framework & Deduplication

### Reward Types Supported:
1. **Mission Credits ($₵$):** Scaled by performance grade (1.25x for S, 1.10x for A, 1.0x for B, 0.85x for C, 0.50x for D, 0x for F).
2. **Research Data:** Scientific harvest yield (salvage data points preserved even on mission failure).
3. **Raw Materials:** Spacecraft hardware and manufactured metals returned.
4. **Technology Points:** Advanced R&D credits for tech tree nodes.
5. **Agency Prestige / Reputation:** Public standing and government committee confidence.
6. **Unlockable Mission Opportunities:** Unlocks follow-up missions in the campaign tree.
7. **Equipment Access:** Grants access to advanced components (e.g. ion drives, RTGs).
8. **Director Rank Progression:** Points earned progress the player toward higher flight director ranks.

### Duplicate Claim Prevention (Idempotent Settlement):
- Every `MissionResultRecord` carries a unique ID (e.g. `RES_M_NOMINAL_01_1710500`).
- `RewardCalculator` maintains a persistent set of claimed result IDs.
- When `claimMissionRewards(resultId)` is called:
  - If already claimed: returns `{ success: false, alreadyClaimed: true }` without touching the economy.
  - If unclaimed: grants resources through `EconomyAdapter`, awards prestige/milestones through `ProgressionAdapter`, marks `isClaimed = true`, and persists the claim record.

---

## 6. Permanent Mission History & Comparative Analysis

The `MissionResultsArchive` provides permanent storage and rich querying capabilities:
- **Filtering:** By destination celestial body (`DEST_MOON`, `DEST_MARS`, etc.), mission category (`TRANSPORTATION`, `SCIENTIFIC_EXPLORATION`, `COMBINED`), performance grade (`EXCEPTIONAL`, `GOOD`, etc.), and completion status (`COMPLETED`, `FAILED`, `CANCELLED`).
- **Search:** Case-insensitive search matching mission title, mission ID, short code, or destination.
- **Side-by-Side Comparison (`comparePerformances`):**
  - Score delta ($Score_A - Score_B$)
  - Grade comparison ($A > B$, $A < B$, or $A = B$)
  - Itemized category delta matrix for all 5 scoring categories
  - Duration difference in days
  - Budget expenditure delta in credits
  - Science telemetry delta in data points
  - Synthesized comparative executive summary
- **Persistence Across Restarts:** Results and claim status are serialized via `ResultsPersistenceAdapter` (supporting `SaveService`, `localStorage`, or in-memory fallback).

---

## 7. Organisational Milestones

The `ProgressionAdapter` tracks verified agency milestones:
- `MILESTONE_FIRST_LAUNCH`: First Atmospheric Escape (Suborbital/Orbital launch past Kármán line).
- `MILESTONE_FIRST_SATELLITE`: Orbital Beacon (Deployment of functioning satellite in Earth orbit).
- `MILESTONE_FIRST_LUNAR`: Cislunar Pioneers (Trans-lunar injection and Lunar orbit capture).
- `MILESTONE_FIRST_LANDING`: Touchdown on Another World (Soft landing on Lunar or extraterrestrial surface).
- `MILESTONE_FIRST_ROBOTIC`: Autonomous Wheelprints (Surface rover deployment and traversal).
- `MILESTONE_FIRST_PLANETARY_DISCOVERY`: Planetary Insights (Extraterrestrial peer-reviewed scientific discovery).
- `MILESTONE_FIRST_BASE`: Permanent Outpost (Initial planetary base construction on Moon or Mars).
- `MILESTONE_FIRST_INTERPLANETARY`: Interplanetary Horizon (Deep space cruise to Mars or Venus).
- `MILESTONE_SOLAR_EXPLORATION`: Solar System Cartographer (Exploration missions across 3+ celestial bodies).

---

## 8. Results Presentation UI

The module provides two responsive PixiJS v8 interfaces aligned with `UIDesignTokens`:

### 8.1 Mission Debriefing View (`MissionDebriefingView`)
- **Department Watermark:** Official header badge `[ASTRA CONTINUUM // MISSION OPERATIONS FLIGHT DEBRIEFING]`.
- **Section A (Mission Summary):** Mission title, short code, destination, type, duration, and color-coded status badge.
- **Section B (Performance Score & Gauge):** `PerformanceScoreGauge` with circular tick marks, glowing grade letter, and `CategoryBreakdownCard` displaying all 5 categories with progress bars and transparent audit logs.
- **Section C (Objective Evaluation Dossier):** Completed vs missed objectives, optional objective markers, points earned/max, and individual feedback.
- **Section D (Confirmed Rewards & Claim Action):** Credits, research, materials, tech points, prestige, unlocks, and an interactive `CLAIM REWARDS` button with immediate claim confirmation.
- **Section E (Performance Analysis & Technical Audit):** Executive summary, key strengths, areas for improvement, and technical/budget audit notes.
- **Section F (Navigation Controls):** `RETURN TO MISSION OPERATIONS` button invoking `onContinue`, and `VIEW MISSION HISTORY ARCHIVE` button invoking `onOpenHistory`.

### 8.2 Historical Mission Archive View (`MissionHistoryArchiveView`)
- Multi-tab navigation (`FLIGHT RECORDS`, `ORGANISATIONAL MILESTONES`, `PERFORMANCE COMPARISON`).
- Interactive filter toggles (`ALL MISSIONS`, `COMPLETED ONLY`, `FAILED / CANCELLED`).
- Flight record rows with grade badges, scores, destinations, `INSPECT DEBRIEF` button, and `COMPARE` selection buttons.
- Comparative side-by-side analysis view with delta matrix.

---

## 9. Integration Contract & Public API

The central manager `MissionResultsManager` exposes the complete Prompt 36 API contract:

```ts
class MissionResultsManager {
  static getInstance(coreEventBus?: EventBus): MissionResultsManager;
  static resetInstance(): void;

  evaluateMission(input: MissionEvaluationInput): MissionResultRecord;
  calculateMissionScore(input: MissionEvaluationInput): { finalScore: number; breakdown: CategoryScoreResult[]; feedback: any };
  calculatePerformanceGrade(score: number): { grade: PerformanceGrade; letter: string; label: string; description: string; reasons: string[] };
  generateMissionResults(input: MissionEvaluationInput): MissionResultRecord;
  getMissionResults(resultId: string): MissionResultRecord | undefined;
  listMissionHistory(filter?: MissionHistoryFilter): MissionResultRecord[];
  calculateMissionRewards(input: MissionEvaluationInput, finalScore: number, grade: PerformanceGrade): { rewards: MissionRewardSummary; penalties: MissionPenaltySummary };
  claimMissionRewards(resultId: string, missionId?: string, rewards?: MissionRewardSummary, penalties?: MissionPenaltySummary): { success: boolean; alreadyClaimed: boolean; message: string };
  getPerformanceBreakdown(resultOrInput: string | MissionEvaluationInput): CategoryScoreResult[];
  getOrganisationalMilestones(): OrganisationalMilestone[];
  submitAchievement(milestoneId: string, missionId: string): { success: boolean; milestone?: OrganisationalMilestone; reason?: string };
  comparePerformances(resultIdA: string, resultIdB: string): PerformanceComparison | null;
}
```

### Domain Events Emitted:
- `MissionEvaluationStarted`: `{ missionId, missionName, timestamp }`
- `MissionEvaluationCompleted`: `{ resultId, missionId, score, grade, timestamp }`
- `MissionResultsGenerated`: `{ result, timestamp }`
- `MissionRewardsGranted`: `{ missionId, resultId, rewards, timestamp }`
- `MissionAchievementUnlocked`: `{ milestone, missionId, timestamp }`
- `MissionHistoryUpdated`: `{ totalArchived, latestResultId, timestamp }`

---

## 10. Verification & Test Coverage

### Test Suites Created:
- `tests/results/ScoringEngine.test.ts`: 16 tests passing.
- `tests/results/RewardCalculator.test.ts`: 9 tests passing.
- `tests/results/PerformanceEvaluator.test.ts`: 7 tests passing.
- `tests/results/MissionHistoryArchive.test.ts`: 10 tests passing.
- `tests/results/MissionResultsManager.test.ts`: 9 tests passing.
- `tests/results/ResultsUI.test.ts`: 4 tests passing.

**Total Results Module Tests:** 55 passing tests.  
**Repository Global Test Suite:** 122 test files, 739 passed tests (0 regressions).
