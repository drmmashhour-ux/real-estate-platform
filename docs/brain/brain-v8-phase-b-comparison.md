# Brain V8 Phase B — Shadow vs current comparison

## Purpose

Phase B adds an **analysis-only** layer that compares **Brain V8 shadow** outputs (from the existing shadow evaluator/observer) with **current Brain** signals read from the same outcome snapshot slice. It does **not** change live decisions, trust scores, learning loops, outcome ingestion, or stored weights.

## Inputs compared

| Side | Source (read-only) |
|------|--------------------|
| Current Brain | `BrainDecisionOutcomeDTO[]` from the same `outcomes` slice used to build shadow rows in `runBrainV8ShadowObservationPass` |
| Brain V8 shadow | `BrainV8ShadowObservationResult.rows` (`BrainV8ShadowOutcomeRow[]`) from `computeShadowBrainSignal` / `buildShadowRowsFromOutcomes` |

No DTOs or shadow rows are mutated during comparison.

## Normalized structure

Both sides are mapped to `BrainV8ComparisonNormalizedSignal` (see `brain-v8-shadow-comparison.types.ts`):

- `decisionKey`, optional `sourceKey`, `signalKind`
- `confidence` / `trust` on 0–1 (derived from finite scores; default 0.5 when unknown)
- optional `score` in [-1, 1]
- `reason`, `evidenceLevel`, `riskLevel`, `outcomeSummary`

Missing fields are tolerated; optional values use safe defaults.

## Matching

- Primary key: `decisionId` → `decisionKey`
- Duplicate keys: multiple rows per key are bucketed; pairs are formed in order; excess rows count as current-only or shadow-only; duplicate-key warnings increment metrics

## Metrics (observational)

Per run: `BrainV8ComparisonMetrics` — overlap rate, divergence rate (among matched pairs), current-only / shadow-only counts, mean absolute confidence/trust/score deltas, reason/risk/insufficient-evidence counters, duplicate/malformed warnings.

Rolling (in-process): `BrainV8ComparisonAggregationSnapshot` — average overlap/divergence across runs, and simple rates for “strong agreement”, “high disagreement”, and “high insufficient-evidence” runs. **Not durable** across cold serverless instances.

## Heuristic summaries & warnings

`interpretation.heuristicSummaries` and `interpretation.warnings` are explicitly **heuristic / observational** — not ground truth. They flag patterns such as low overlap, high divergence, repeated risky shadow-only signals, or high insufficient-evidence rates.

Named patterns (non-exhaustive):

| Pattern | Meaning |
|--------|---------|
| More conservative / more aggressive | Mean shadow score vs mean current score on **matched** pairs (threshold 0.05). |
| Missing important signals | **Current-only** rows with `riskLevel === "high"` (no shadow pair for that decision key). |
| Extra risky signals | **Shadow-only** rows with elevated risk, `review` label, or `evidenceLevel === "none"`. |
| Current-only / shadow-only counts | Coverage skew or duplicate-key pairing limits. |
| Repeated shadow-side risk (matched) | Shadow risk higher than current on several pairs. |
| High divergence / low overlap | Structural disagreement or unreliable coverage for the run. |

## Logs & persistence

- Structured log namespace: **`[brain:v8:comparison]`** (via `logInfo` / `logWarn`)
- Payload includes `runId`, `metrics`, `warningCodes`, `mismatchSample`, `aggregation`
- **No new Prisma tables** in Phase B; optional `getLastBrainV8ComparisonReport()` is in-process for debugging/tests only

## How to read results

1. Run the existing admin shadow pass (same as today); comparison runs automatically after the shadow result is built.
2. Inspect logs for `[brain:v8:comparison]` and any `observational_warnings`.
3. Use mismatch samples to spot pairing skew (current-only / shadow-only) or diverged pairs.

## Why this phase stays read-only

Comparison runs after shadow rows exist; it only reads snapshot DTOs and shadow rows, writes logs, and updates in-memory last-report/aggregation state. It does not call adaptation, ingestion writers, or mutate outcomes.

## Rollback

- Remove or comment out the single call to `buildBrainV8ShadowVsCurrentComparison` in `brain-v8-shadow-observer.service.ts`, or stop running shadow observation. No schema rollback required.

## Validation commands

From repo root (adjust package manager as needed):

```bash
cd apps/web && pnpm exec vitest run modules/platform-core/brain-v8-shadow-comparison.test.ts
```

If schema were extended (not in Phase B):

```bash
npx prisma validate
```

Optional broader check:

```bash
cd apps/web && npx tsc --noEmit
```

(Full monorepo typecheck may be heavier; run when feasible.)
