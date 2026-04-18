# Growth Mission Control layer (V1 refinement)

## Purpose

**Mission Control** is a single **read-only** advisory console that aggregates signals from the existing growth stack (Growth Fusion, Executive Panel, Daily Brief, Governance, Strategy, multi-agent coordination, simulations, autopilot focus hints, Response Desk, learning control, optional memory / knowledge graph / decision journal bridges). It answers: what matters now, what to do today, what is risky, what needs human review, what should not be promoted yet — **without executing** anything or mutating source data.

Mission Control **does not enforce policy** and **does not replace** authoritative source panels; it only surfaces a bounded, deduplicated operating view.

## Architecture

- **Types**: `apps/web/modules/growth/growth-mission-control.types.ts`
- **Aggregator**: `buildGrowthMissionControlSummary({ inject? })` in `growth-mission-control.service.ts` loads subsystems (respecting feature flags), merges optional **inject** overrides, then assembles.
- **Pure assembly**: `assembleGrowthMissionControlSummary(context)` — no I/O; used by tests.
- **Focus**: `resolveGrowthMissionFocus()` — single primary focus line (see rules below).
- **Checklist**: `buildGrowthMissionChecklist()` — returns `{ items, dedupeEvents }`, max **5** items.
- **Risks**: `buildGrowthMissionRisks()` — returns `{ risks, dedupeEvents }`, top **5** after merge.
- **Review queue**: `buildGrowthMissionReviewQueue()` — returns `{ items, dedupeEvents }`, max **5** after merge.
- **Status**: `computeGrowthMissionControlStatus()` — weak / watch / healthy / strong.
- **Loader**: `loadGrowthMissionControlBuildContext(inject?)` — optional partial context merged after loads (skips **fusion** fetch when `inject.fusion` is provided).
- **API**: `GET /api/growth/mission-control` (requires `FEATURE_GROWTH_MISSION_CONTROL_V1` + growth machine auth).
- **UI**: `GrowthMissionControlPanel` when `FEATURE_GROWTH_MISSION_CONTROL_PANEL_V1` is on (API must be enabled for live data).

## Focus resolution rules (deterministic)

1. Governance **`human_review_required`** — headline + why from human review lines / top risks / notes when present.
2. Governance **freeze** — `frozenDomains` or **`freeze_recommended`** status.
3. **Fusion** first prioritized action — skipped if title is **vague** or **duplicates** executive `topPriority` (same normalized title → **executive** wins for clarity).
4. **Executive** `topPriority` or first `topPriorities[].title` when not vague.
5. **Daily brief** `today.focus` (not legacy top-level `focus`).
6. **Agents** — first coordination proposal with `requiresHumanReview` and `impact === "high"`.
7. **Autopilot** focus title from executive snapshot when present.
8. **Simulation** — first scenario title from `simulationBundle.scenarios[0]`.
9. **Strategy** — `weeklyPlan.priorities[0].title`.
10. **Memory / graph / journal** hints — only when **operational sources are weak** (no executive title, no brief focus, no actionable fusion, no governance escalation/freeze/human queue).
11. Default fallback — stabilize telemetry (advisory).

## Checklist dedupe rules

- Sources: executive priorities, `dailyBrief.today.priorities`, fusion top action line, governance `topRisks` titles, human-review status line, response desk urgency, strategy `weeklyPlan.priorities`, learning monitor `recommendedActions`.
- Lines that **repeat the mission focus title** (normalized overlap) are dropped.
- **Semantic dedupe**: first ~10 normalized words as key; max **5** lines.
- Prefer operator-style phrasing via light prefixes (`Review:`, `Follow up:`, `Check:`, `Resolve:`).

## Risk merge rules

- Raw sources: governance status (human review), governance `topRisks`, executive `topRisks` strings, fusion weak snapshot + `topProblems`, fusion actions with `status === "rejected"`, flattened simulation scenario risks, optional graph/journal hint lines.
- **Dedupe key**: normalized title (lowercase, alnum, first 100 chars).
- **Severity**: keep **max** when merging; **source** becomes `a+b` when merged across sources.
- **Why**: short merge of distinct rationales; cap **180** chars.
- Output capped at **5**, sorted by severity.

## Review queue merge rules

- Collect governance queue, governance string lines, high-impact `manual_only` fusion actions (max 2), learning control states, response desk urgency, agent proposals with `requiresHumanReview`.
- Dedupe by normalized title; keep higher severity; merge reasons; cap **5**.

## Notes rules

- Base notes from `buildRefinedMissionNotes`: partial-data warning, learning monitor, deferring simulations, freeze recommendation, weak ads band, weak fusion band — **skipped** when they would repeat mission focus, checklist, or risk titles (normalized).
- Max **6** base lines before optional bridges.
- **Memory / knowledge graph / decision journal** lines merge only when their feature flags are on; skipped when `prefetched*` arrays are already set on context (avoids duplicate reads). Final merged notes still capped at **6**.

## Optional shared-input (inject) pattern

`buildGrowthMissionControlSummary({ inject?: Partial<GrowthMissionControlBuildContext> })` and `loadGrowthMissionControlBuildContext(inject?)` merge inject **after** loads.

- **`inject.fusion`**: if set, **skips** `buildGrowthFusionSystem()` in the loader (reduces duplicate fusion work when the caller already built fusion).
- **`prefetchedMemoryNotes` / `prefetchedGraphInsights` / `prefetchedJournalInsights`**: when set, the async summary path uses these instead of fetching/building those note lines.
- **`memoryFocusHint` / `graphFocusHint` / `journalFocusHint`**: influence focus resolution when operational signals are thin.

No global cache is required; callers opt in per request.

## Safety guarantees

- No writes, no outbound sends, no Stripe / booking / checkout / pricing changes.
- No changes to ads execution or CRO core logic.
- Aggregates and summarizes only; **source systems remain authoritative**.
- Simulations remain **estimates**, not facts.
- **Advisory only** — Mission Control does not execute actions and does not enforce policy by itself.

## Feature flags

| Env | Role |
| --- | --- |
| `FEATURE_GROWTH_MISSION_CONTROL_V1` | Master gate — service + API |
| `FEATURE_GROWTH_MISSION_CONTROL_PANEL_V1` | Dashboard panel (API must be enabled for live data) |

Bridge flags (`FEATURE_GROWTH_MEMORY_V1`, knowledge graph bridge, decision journal bridge) only add optional note lines when on.

## Monitoring

`growth-mission-control-monitoring.service.ts` tracks builds, status histogram counts, checklist/risk/review counts, missing-data warnings, and **`dedupeEvents`** (sum of checklist + risk + review dedupe collapses). Logs use prefix **`[growth:mission-control]`**; helpers never throw. `resetGrowthMissionControlMonitoringForTests()` clears state.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-mission-control*.test.ts
```

Optional full web typecheck (slower):

```bash
cd apps/web && pnpm exec tsc --noEmit
```
