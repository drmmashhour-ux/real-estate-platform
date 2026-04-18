# Growth Auto-Learning System (V1)

## Purpose

A **local, bounded learning layer** that:

- Observes **read-only** outcomes from existing growth metrics (UTM early conversion, CRM leads, follow-up queue, ads band).
- Produces **deterministic** outcome labels (positive / negative / neutral / insufficient_data).
- Optionally **nudges in-memory weights** that affect **growth orchestration scoring only** (executive priorities, fusion prioritizer, shared `computePriorityScore` for autopilot-related blends).

It does **not** train on PII, does **not** write to source tables for learning, and does **not** change Stripe, bookings, checkout, pricing, ads execution APIs, or CRO experiment cores.

## Architecture

| Module | Role |
|--------|------|
| `growth-learning.types.ts` | Signals, outcomes, weights, summary, cycle API shape |
| `growth-learning.constants.ts` | Conservative thresholds (min outcomes, max drift, smoothing) |
| `growth-learning-linker.service.ts` | `linkGrowthSignalsToOutcomes` — heuristic linkage |
| `growth-learning-evaluator.service.ts` | `evaluateGrowthLearning` — rates + warnings |
| `growth-learning-weights.service.ts` | In-memory weights, `computeGrowthWeightAdjustments`, `applyGrowthWeightAdjustments` |
| `growth-learning-integration.service.ts` | Score multipliers for executive / fusion / autopilot priority |
| `growth-learning.service.ts` | `runGrowthLearningCycle` orchestration |
| `growth-learning-monitoring.service.ts` | Counters + `[growth:learning]` logs (flag-gated) |
| `GET /api/growth/learning` | JSON snapshot for dashboard |

## What it learns from

- **Early conversion** (`FormSubmission` `early_conversion_lead`) counts and UTM breadth (via existing analyzer helpers).
- **CRM** lead totals, hot/high-score counts (read-only counts).
- **Follow-up queue** sample (same pattern as executive / governance — due_now tallies).

## What it does

- Emits **synthetic signals** with stable ids (`gl-sig-*`) each cycle.
- Labels **outcomes** with explainable strings.
- When evidence is sufficient and flags allow, applies **small** weight deltas clamped to **±`GROWTH_LEARNING_MAX_TOTAL_DRIFT`** around neutral `1.0`.
- Feeds **optional** multipliers into:
  - `buildGrowthExecutivePriorities` (after candidate `priorityScore` is computed),
  - `computeFusionActionPriorityScore` result,
  - `computePriorityScore` (autopilot / fusion analyzer blends).

## What it does NOT do

- Mutate leads, forms, campaigns, or external ads.
- Auto-execute autopilot or operator actions.
- Replace human approval or governance panels.
- Persist weights to the database in V1 (in-memory only; reset in tests via `resetGrowthLearningWeightsForTests`).

## Bounded weight rules

- **`GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT`**: require enough non–`insufficient_data` outcomes before nudging.
- **`GROWTH_LEARNING_MAX_WEIGHT_ADJUSTMENT_PER_RUN`**: cap per-dimension delta per cycle.
- **`GROWTH_LEARNING_MAX_TOTAL_DRIFT`**: each weight stays in `[1 − drift, 1 + drift]`.
- **Decay**: slight pull toward neutral before merging new deltas (configurable).

## Feature flags

| Env | Default | Meaning |
|-----|---------|---------|
| `FEATURE_GROWTH_LEARNING_V1` | off | No cycle, API 403, panel hidden |
| `FEATURE_GROWTH_LEARNING_ADAPTIVE_WEIGHTS_V1` | off | Evaluate + log; **do not** change in-memory weights |
| `FEATURE_GROWTH_LEARNING_MONITORING_V1` | off | No counters / `[growth:learning]` logs |

## Safety guarantees

- **Advisory-first**: bad outcomes only adjust **local** multipliers; defaults match legacy scoring when flags are off.
- **Reversible**: `resetGrowthLearningWeightsForTests` + neutral defaults.
- **Explainable**: every outcome carries a `rationale` string; summary lists `warnings` and `adjustmentsApplied`.
- **No source truth edits** for learning purposes.

## Validation commands

From `apps/web`:

```bash
npx vitest run modules/growth/__tests__/growth-learning
pnpm exec tsc --noEmit -p tsconfig.json
```

## Source of truth

CRM, payments, and marketing platforms remain authoritative. Learning is a **lens** on orchestration scores only.
