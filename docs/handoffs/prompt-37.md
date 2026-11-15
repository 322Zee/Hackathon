# Prompt 37 Technical Handoff: Mission Contracts, Sponsors, Grants & Funding Management

## 1. Executive Summary

This document specifies the architecture, data contracts, financial ledger systems, contract lifecycles, sponsor relationship models, user interfaces, integration points, and verification suites for the **Mission Contracts, Sponsors, Grants and Funding Management System** developed under **Prompt 37** for *INTERSTELLAR CONTINUUM*.

The contracts and funding subsystem establishes a realistic organizational management layer. The player's aerospace agency secures revenue through commercial mission contracts, governmental exploration stipends, institutional research grants, data licensing royalties, and multi-stage long-term exploration programmes.

The system prevents duplicate reward exploitation, maintains financial data integrity across serialization and reloads, interfaces non-invasively with the existing `EconomyService`, and models a living ecosystem of fictional institutional and private sponsors without duplicating global currency or mission reward systems.

---

## 2. Directory Layout & File Ownership

All code, adapters, UI views, and tests are isolated strictly within dedicated directories under the `feature/p37-contracts-funding` branch:

```
src/contracts/
├── ContractTypes.ts                # Authoritative data contracts, enums & interfaces
├── ContractEvents.ts               # Typed domain events & payload contracts
├── ContractEventBus.ts             # Strongly typed event bus with core EventBus bridging
├── ContractRegistry.ts             # Authored default contracts across 9 canonical categories
├── SponsorRegistry.ts              # Authored fictional sponsors, corporate profiles & stipends
├── ContractLifecycleEngine.ts      # Authoritative state transitions, objectives & deadlines
├── FundingEngine.ts                # Financial transaction logging & claim deduplication
├── ContractsFundingManager.ts      # Central singleton manager & public APIs
├── index.ts                        # Public module exports barrel
├── adapters/
│   ├── EconomyAdapter.ts          # Non-duplicating adapter interfacing with EconomyService
│   ├── GameTimeAdapter.ts         # Simulation clock & deadline countdown bridge
│   ├── ProgressionAdapter.ts      # Tracks director rank & sponsor relationship reputation
│   ├── MissionAdapter.ts          # Translates runtime mission objectives & completions
│   └── PersistenceAdapter.ts      # Serializes contracts, sponsors & transaction history
└── ui/
    ├── ContractCard.ts            # Tactile visual card component for contract details & actions
    ├── SponsorDossierPanel.ts     # Visual profile panel for sponsor agreements & reputation
    └── ContractsFundingView.ts    # Comprehensive multi-tab organizational revenue interface

tests/contracts/
├── ContractLifecycle.test.ts      # 14 tests: listing, acceptance, ranks, objectives, completion, cancellation
├── DeadlinesAndPenalties.test.ts  # 8 tests: countdowns, early bonuses, grace periods, penalties, extensions
├── FundingAndSponsors.test.ts     # 7 tests: sponsor agreements, periodic stipends, ledger, duplicate claims, save/load
└── ContractsUI.test.ts            # 3 tests: view lifecycle, visibility, navigation across 5 tabs

docs/handoffs/
└── prompt-37.md                   # This authoritative handoff specification
```

### Untouched Shared Modules:
- Global economy implementation: untouched (interfaced via `ContractsEconomyAdapter`).
- Mission simulation core: untouched.
- Mission results: untouched.
- Scientific data: untouched.
- Rover & planetary environments: untouched.
- Planetary base system: untouched.
- Communications network: untouched.
- Main entrypoint (`src/main.ts`): untouched.
- Shared global models & root dependency manifests: untouched.

---

## 3. Data-Driven Mission Contract Board

The contract board supports 9 canonical mission contract disciplines:

1. **Satellite Deployment (`SATELLITE_DEPLOYMENT`):** Orbital communications and weather satellite insertion.
2. **Communications Infrastructure (`COMMUNICATIONS_INFRASTRUCTURE`):** Deep Space Network array positioning and geostationary data relays.
3. **Scientific Research (`SCIENTIFIC_RESEARCH`):** Spectrometric surveys, volatile ice detection, and solar observation.
4. **Planetary Observation (`PLANETARY_OBSERVATION`):** Synthetic aperture radar cloud penetration and cartography.
5. **Robotic Exploration (`ROBOTIC_EXPLORATION`):** Autonomous rover surface landing, core sample drilling, and sample caching.
6. **Payload Transportation (`PAYLOAD_TRANSPORTATION`):** Surface equipment containers and life support delivery.
7. **Planetary Base Development (`PLANETARY_BASE_DEVELOPMENT`):** Outpost habitat modules, power conduits, and base assembly.
8. **Technology Demonstration (`TECHNOLOGY_DEMONSTRATION`):** Advanced ion propulsion flight testing and experimental hardware verification.
9. **Long-Term Programmes (`LONG_TERM_PROGRAMME`):** Multi-stage solar system reconnaissance arcs (e.g. Outer Solar System Grand Tour).

Each contract is represented by `ContractRecord` with:
- Unique canonical ID (`id`).
- Contract title (`title`).
- Issuing sponsor (`issuingSponsorId`, `sponsorName`).
- Category (`category`) and funding source (`fundingSource`).
- Required destination (`destinationId`) and mission category (`requiredMissionType`).
- Equipment/payload prerequisites (`requiredPayloadType`, `requiredEquipment`).
- Granular objectives (`objectives` array with target/current progress).
- Deadline in elapsed game seconds (`deadlineSeconds`), extensions count, and grace period (`gracePeriodSeconds`).
- Base rewards (`rewards`: credits, researchData, rawMaterials, technologyPoints, reputationGain, early bonus).
- Penalties (`penalties`: cancellation fee, failure reputation loss, late penalty percent).
- Lifecycle status (`status`).
- Prerequisites (`requiredDirectorRank`, `requiredReputation`).
- Claim tracking flag (`isClaimed`).

---

## 4. Contract Lifecycle & State Transitions

The `ContractLifecycleEngine` enforces deterministic, valid state transitions:

```
[AVAILABLE] ──────> [ACCEPTED] ──────> [IN_PROGRESS] ──────> [COMPLETED]
     │                   │                   │
     │                   ├──(Cancel)─────────┴───> [CANCELLED]
     │                   │
     │                   ├──(Deadline+Grace)─────> [EXPIRED]
     │                   │
     └──(Expired)────────┴──(Failure)────────────> [FAILED]
```

### Exploit & Error Prevention:
- **Duplicate Acceptance:** Cannot accept a contract that is not in `AVAILABLE` state.
- **Premature Completion:** Rejecting completion attempts if any objective is unmet.
- **Duplicate Claims:** `FundingEngine` tracks `claimedRewardContractIds` and verifies `isClaimed`, preventing double payouts.
- **Immutable Completed State:** Completed contracts cannot transition to `FAILED` or `CANCELLED`.

---

## 5. Funding Sources & Modalities

Six distinct funding sources are modeled:

1. **Government & Institutional Grants (`GOVERNMENT_GRANT`):** High-level civil exploration stipends.
2. **Private Commercial Sponsors (`PRIVATE_SPONSOR`):** Commercial ventures funding tech demonstrations and booster trials.
3. **Academic Research Grants (`RESEARCH_GRANT`):** Non-profit institutes funding planetary geology and volatile studies.
4. **Commercial Mission Contracts (`MISSION_CONTRACT`):** Direct payments for payload delivery and satellite deployment.
5. **Scientific Data Licensing (`DATA_LICENSING`):** Media and educational foundations paying royalties for high-resolution imagery and radar maps.
6. **Multi-Stage Programmes (`LONG_TERM_PROGRAMME`):** Grand Tour exploration initiatives with massive cumulative payouts.

---

## 6. Fictional Sponsors & Relationship Management

The system features 6 authored, 100% fictional sponsors across major industry verticals:

| Sponsor ID | Name | Category | Tier | Annual Budget | Baseline Stipend |
|---|---|---|:---:|:---:|---|
| `SPONSOR_GSC` | Global Space Coalition | Government / Institutional | 5 | $₵3,500,000 | +$₵50,000 / 14 days |
| `SPONSOR_HELIOS` | Helios Telecommunications Conglomerate | Commercial Telecom | 4 | $₵2,200,000 | +$₵35,000 / 10 days |
| `SPONSOR_STELLARIS` | Stellar Dynamics Industrial Consortium | Aerospace Industrial | 4 | $₵1,800,000 | Custom Partnerships |
| `SPONSOR_ASTRAEA` | Astraea Planetary Science Institute | Scientific Foundation | 3 | $₵1,500,000 | +$₵25,000 / 7 days |
| `SPONSOR_AEGIS` | Aegis Extraterrestrial Mining Syndicate | Mining Consortium | 3 | $₵1,950,000 | Prospecting Bounties |
| `SPONSOR_CONTINUUM_MEDIA` | Continuum Educational Media Foundation | Media Broadcaster | 2 | $₵900,000 | Media Licensing |

- **Reputation Tracking:** Relationship ratings range from $-100$ to $+100$, scaling with successful missions and dropping on cancellations.
- **Active Agreements:** Sponsors disburse periodic funding on game ticks (`processPeriodicAgreements`).

---

## 7. Deadlines, Risk, Extensions & Grace Periods

- **Countdown Simulation:** `manager.tick(deltaGameSeconds)` ticks active contract timers in sync with `GameTimeSystem`.
- **Early Completion Bonus:** Completing a contract with $\ge 20–25\%$ of deadline remaining grants an extra bonus ($+$25,000 to $+$60,000 credits).
- **Grace Period (No Instant Failures):** When the deadline elapses, contracts enter a 5–14 day grace period (`isInGracePeriod: true`), allowing completion with a modest $15–25\%$ late penalty rather than punitive failure.
- **Deadline Extensions:** Players can pay a standard flight administrative fee ($₵15,000$) to extend the deadline by 10 game days (up to 2 times).
- **Cancellation:** Cancellation incurs a contract-specific fee and a small reputation penalty without permanently blocking agency progression.

---

## 8. Funding Overview Interface (`ContractsFundingView`)

A 2D PixiJS modal interface ($1560 \times 880$) matching `UIDesignTokens`:
- **Tab 1: Funding Overview & Ledger:** 5 KPI tiles (Confirmed Revenue, Active Contract Value, Projected Grants, Current Balance, Contracts Ratio) and verified transaction ledger table displaying ID, source, sponsor, reason, and amount.
- **Tab 2: Available Contracts:** Filterable procurement board (by 9 categories and 6 destination zones) with interactive `ContractCard`s.
- **Tab 3: Active Flight Contracts:** Active contract tracking with countdown progress bars, grace period alerts, deadline extension buttons, and completion claim triggers.
- **Tab 4: Sponsor Directory:** Fictional sponsor dossiers with reputation progress meters, budget tiers, and active agreement summaries.
- **Tab 5: Completed Archive:** Permanent log of fulfilled directives and historical payouts.

---

## 9. Public Integration Contract & Events

### Core Public APIs (`ContractsFundingManager`):
```typescript
listContracts(filter?: ContractFilter): ContractRecord[];
listAvailableContracts(filter?: Omit<ContractFilter, 'status'>): ContractRecord[];
getContract(id: string): ContractRecord | null;
acceptContract(contractId: string): ContractRecord;
cancelContract(contractId: string, reason?: string): ContractRecord;
updateContractProgress(contractId: string, objectiveId: string, progressDelta: number): ContractRecord;
evaluateContract(contractId: string): CompletionEvaluationResult;
completeContract(contractId: string): ContractRecord;
requestDeadlineExtension(contractId: string, extensionSeconds?: number): { success: boolean; newDeadlineSeconds: number; error?: string };
listSponsors(): SponsorRecord[];
getSponsor(id: string): SponsorRecord | null;
createSponsorshipAgreement(sponsorId: string, type: AgreementType, terms: AgreementTerms): SponsorAgreement;
recordFundingTransaction(transactionInput: TransactionInput): FundingTransaction;
getFundingOverview(): FundingOverview;
tick(deltaGameSeconds: number): void;
serialize(): ContractsFundingSaveState;
deserialize(saveState: ContractsFundingSaveState): void;
```

### Strongly Typed Events (`ContractEventBus`):
- `ContractAvailable`: Dispatched when new contract is published.
- `ContractAccepted`: Dispatched when contract is accepted.
- `ContractProgressUpdated`: Dispatched when objective progress advances.
- `ContractCompleted`: Dispatched when contract objectives are verified and rewards awarded.
- `ContractExpired`: Dispatched when deadline and grace period elapse.
- `ContractCancelled`: Dispatched when player aborts contract.
- `DeadlineExtended`: Dispatched when player purchases a deadline extension.
- `SponsorAgreementCreated`: Dispatched when a new recurring stipend is ratified.
- `FundingReceived`: Dispatched whenever credits are deposited into the wallet.
- `SponsorReputationChanged`: Dispatched when sponsor relationship values shift.

---

## 10. Financial Data Integrity & Ledger Protection

- **Single Source of Currency:** Interfaced via `ContractsEconomyAdapter`; no duplicate wallet exists.
- **Claim Deduplication:** `FundingEngine` registers claimed contract IDs in an immutable set; re-calling completion or claim fails safely.
- **Transactional Atomicity:** Credit deductions for cancellation or extension only succeed if funds are verified; no partial corruption occurs.
- **Save/Load Fidelity:** The entire ledger, contract states, and sponsor agreements serialize to `ContractsFundingSaveState` (schema v1) and restore accurately.

---

## 11. Test Verification & Results

- **Unit Test Files Added:**
  - `tests/contracts/ContractLifecycle.test.ts` (14 tests passed)
  - `tests/contracts/DeadlinesAndPenalties.test.ts` (8 tests passed)
  - `tests/contracts/FundingAndSponsors.test.ts` (7 tests passed)
  - `tests/contracts/ContractsUI.test.ts` (3 tests passed)
- **Subsystem Total:** 32 tests passed (32).
- **Full Repository Test Suite:** 147 test files passed (147), 926 tests passed (926).
- **Regressions:** 0.
- **TypeScript Strict Compilation for Subsystem (`src/contracts/`):** 0 errors.

---

## 12. Integration Requirements for Parallel Laptops

### 12.1 Mission Launch & Preparation (Prompt 27 / 29)
When accepting a contract, mission preparation can bind the active contract ID:
```typescript
import { ContractsFundingManager } from '../contracts';

const contractsMgr = ContractsFundingManager.getInstance();
const contract = contractsMgr.acceptContract(contractId);
```

### 12.2 Mission Objective Tracker (Prompt 27 / 30)
When runtime mission objectives update, notify the contract manager:
```typescript
contractsMgr.updateContractProgress(contractId, objectiveId, progressIncrement);
```

### 12.3 Mission Debriefing & Results (Prompt 36)
Upon mission completion, debriefing flows can finalize the bound contract:
```typescript
if (contractId) {
  const completedContract = contractsMgr.completeContract(contractId);
}
```

### 12.4 Save / Load Persistence
The game state manager serializes and restores contracts and funding state:
```typescript
const contractSave = contractsMgr.serialize();
// Save to JSON / localStorage slot...
contractsMgr.deserialize(contractSave);
```

---

## 13. Known Limitations & Extensibility

- **Fictional Economy:** All contract values are balanced for in-game progression and educational immersion without simulating real-world macroeconomics or equity investments.
- **Extensible Procurement:** Additional contracts or procedural contract generators can register new contracts dynamically via `manager.registerContract(...)`.
