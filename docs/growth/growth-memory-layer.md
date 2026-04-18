# Growth Memory layer (V1)

## Purpose

**Growth Memory** is an **advisory, bounded** recall layer: it derives recurring blockers, winning patterns, lessons, and operator-preference signals from existing **read-only** growth inputs (Governance, Executive, Strategy, agents, simulations, Response Desk, autopilot posture, optional Mission Control digest). It is intended to **inform** future priorities, daily/weekly summaries, and Mission Control guidance — **without** auto-execution, without mutating CRM or checkout truth, and **without** v1 database persistence (rebuilt on demand).

## Categories

`GrowthMemoryCategory`: `blocker`, `winning_pattern`, `campaign_lesson`, `followup_lesson`, `operator_preference`, `governance_lesson`.

`GrowthMemorySource` includes `mission_control` for entries derived from an optional **Mission Control digest** (passed into the extractor so the default memory build stays free of circular calls to Mission Control).

## Extraction logic

`extractGrowthMemoryEntries(context)` maps normalized `GrowthMemoryEntry` rows with stable ids, confidence, optional tags, and bounded output. Inputs may be partial; missing pieces reduce coverage but do not throw.

Examples of signals used: executive due/hot backlog, weak paid band, governance risks and freeze/human-review states, strategy blockers, agent conflicts, simulation defer/consider, Response Desk urgency, autopilot rejection/manual-only posture, optional `missionControlDigest.topRiskTitles` / `humanReviewTitles`.

## Consolidation rules

`consolidateGrowthMemoryEntries` merges rows with the same category + normalized title, bumps `recurrenceCount` and confidence modestly. `buildGrowthMemorySummaryFromEntries` fills **bounded** lists: recurring blockers, winning patterns, campaign lessons, follow-up lessons, **governance lessons** (separate from campaign lessons), operator preferences, plus advisory `notes`.

## Memory-to-priority bridge

When `FEATURE_GROWTH_MEMORY_PRIORITY_BRIDGE_V1` is on (and `FEATURE_GROWTH_MEMORY_V1`), strategy compose may attach optional `memoryAnnotations` and `memoryAdvisoryBoost` to priorities — **annotation only**; ordering and core scoring stay unchanged. The bridge considers blockers, follow-ups, campaign lessons, and **governance lessons** for soft overlap with priority titles.

`buildGrowthMemorySummary({ preloadedStrategyBundle })` avoids recursive strategy loads when called from strategy composition.

## Brief / Mission Control note usage

- **Daily Brief**: when `FEATURE_GROWTH_MEMORY_V1` is on, the daily brief may append short lines from `buildGrowthMemoryBriefNotes(memory)` to its notes (capped).
- **Mission Control**: when `FEATURE_GROWTH_MEMORY_V1` is on, `buildGrowthMissionControlSummary()` may append compact lines from `buildGrowthMemoryMissionNotes(memory)` to Mission Control `notes` (capped). Memory does **not** call Mission Control internally; Mission Control may call `buildGrowthMemorySummary()` after assembling its core summary (no circular dependency).

## Safety guarantees

- Advisory only; source CRM, governance, and panels remain authoritative.
- No writes to lead/autopilot/checkout data from this layer.
- Reversible: disable flags to remove influence.
- No changes to Stripe, bookings, ads execution, or CRO core logic.

## Feature flags

| Env | Role |
| --- | --- |
| `FEATURE_GROWTH_MEMORY_V1` | Master gate — summary + `GET /api/growth/memory` |
| `FEATURE_GROWTH_MEMORY_PRIORITY_BRIDGE_V1` | Optional strategy priority annotations |
| `FEATURE_GROWTH_MEMORY_PANEL_V1` | Dashboard panel |

## Persistence

V1 uses **on-demand** consolidation only unless a future additive store is introduced. Optional `preloadedMissionDigest` on `buildGrowthMemorySummary` allows tests or future callers to supply Mission Control–derived titles without coupling modules.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-memory*.test.ts
```
