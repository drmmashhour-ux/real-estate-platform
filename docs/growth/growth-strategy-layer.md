# Growth strategy layer (V1)

## Purpose

The growth strategy layer turns **read-only signals** from the existing growth stack (fusion, governance, executive panel, daily brief, multi-agent coordination, autopilot, leads/follow-up, campaign health) into a **single advisory bundle**:

- Weekly priorities (max 5)
- Optional bounded experiment suggestions (manual; no auto A/B)
- Optional roadmap themes (medium horizon)
- Explainable status: `weak` | `watch` | `healthy` | `strong`

**It does not execute anything.** It does not write to source systems, does not change Stripe/bookings/checkout/pricing, ads execution, or CRO core logic.

## Architecture

| Piece | Role |
| --- | --- |
| `growth-strategy.types.ts` | Shared types for plans, priorities, experiments, roadmap |
| `assembleGrowthStrategySourceSnapshot()` | Loads snapshots from existing modules (read-only) |
| `growth-strategy-compose.service.ts` | `composeGrowthStrategyBundleFromSnapshot`, blockers/notes helpers |
| `buildGrowthStrategyBundle()` | Feature-gated entry; records monitoring |
| `growth-strategy-priority.service.ts` | Maps signals → weekly priorities |
| `growth-strategy-experiments.service.ts` | Bounded experiment ideas (3–5) |
| `growth-strategy-roadmap.service.ts` | Horizon-tagged roadmap themes |
| `growth-strategy-status.util.ts` | Explainable status from signals |
| `growth-strategy-brief-bridge.service.ts` | Short lines for daily brief / executive |
| `growth-strategy-monitoring.service.ts` | Counters + `[growth:strategy]` logs (never throws) |
| `GET /api/growth/strategy` | JSON `{ bundle }` when `FEATURE_GROWTH_STRATEGY_V1` |
| `GrowthStrategyPanel` | Dashboard UI |

## Input sources

The snapshot assembler pulls from (when flags allow):

- `buildGrowthExecutiveSummary()`
- `buildGrowthDailyBrief()` (if daily brief flag on)
- `evaluateGrowthGovernance()` (if governance flag on)
- Fusion: `buildGrowthFusionSnapshot()` + `analyzeGrowthFusion()` (if fusion flag on)
- `coordinateGrowthAgents()` (may return `null` if multi-agent off)
- `listAutopilotActionsWithStatus()` (top actions)
- `fetchEarlyConversionAdsSnapshot()` for `leadsTodayEarly`

Missing pieces add **warnings** only; composition stays safe.

## Priority logic

- Prefer executive `topPriorities`, coordination `topPriorities` (or proposals), daily brief lines, fusion top actions, governance escalation, hot leads + due follow-ups, weak ads band, autopilot titles.
- Dedupe by title prefix, sort by impact then confidence, cap at **5**.

## Experiment logic

- Suggestions are **bounded** (CTA, copy length, CRM ordering, form helper text, etc.).
- No automatic experimentation framework — humans choose what to run.

## Roadmap logic

- Themes such as acquisition foundation, follow-up friction, governance before scale, content workflow, safe automation — tagged with `this_week` | `next_2_weeks` | `this_month`.

## Safety guarantees

- Advisory, bounded, explainable, reversible, source-grounded.
- No auto-execution of plans.
- No mutation of CRM/lead truth via this layer.
- Strategy build failures degrade to partial data + warnings, not writes.

## Feature flags

| Env | Default | Effect |
| --- | --- | --- |
| `FEATURE_GROWTH_STRATEGY_V1` | off | Entire layer + API + panel |
| `FEATURE_GROWTH_STRATEGY_EXPERIMENTS_V1` | off | Plan omits experiments |
| `FEATURE_GROWTH_STRATEGY_ROADMAP_V1` | off | Plan omits roadmap + bundle summary |

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/growth-strategy*.test.ts
pnpm exec tsc --noEmit -p tsconfig.json
```
