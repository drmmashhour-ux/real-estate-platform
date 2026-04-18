# Global Fusion Phase D — post-cutover monitoring

## Purpose

Phase D adds **read-only, in-process aggregate telemetry** after Global Fusion may be used as the **primary advisory surface** (Phase C). It helps operators see whether fusion stays **stable**, whether **fallback** is too frequent, and whether **conflicts**, **missing sources**, **evidence**, and **ordering** look healthy over time.

Nothing in Phase D modifies execution, writers, stored truth, or rankings in databases.

## What is tracked

Counters accumulate across **`buildGlobalFusionPrimarySurface`** completions in the current **Node process** (see limitations below):

| Area | Meaning |
|------|--------|
| `runsTotal` | Total primary-surface invocations recorded |
| `runsPrimary` | Invocations that returned `global_fusion_primary` with an active surface |
| `runsFallback` | Invocations that took the primary **fallback** path |
| `runsSourceAdvisoryDefault` | Primary flag off (`source_advisory_default`) |
| `fallbackRate` | `runsFallback / runsTotal` |
| `missingSourceRate` | Share of runs with at least one missing upstream source |
| `conflictRate` | Share of runs with at least one **high-severity** cross-system conflict |
| `disagreementRate` | Share of runs where conflict density vs signal count is high |
| `lowEvidenceRate` | Share of runs with fused evidence score below a low threshold |
| `influenceAppliedRate` / `influenceSkippedRate` | Among runs where influence was present, applied vs skipped |
| `unstableOrderingRate` | Runs where opportunity **id order** changed vs previous run (same length) |
| `anomalyRate` | Runs flagged with fallback, empty advisory despite signals, or malformed normalizer input |
| `malformedInputRate` / `emptyOutputRate` | Rates for malformed normalizer warnings and empty fused lists |

**Systems coverage** (`systemsCoverage.brain` … `ranking`): fraction of runs where normalized signals included that source.

## API

- `recordGlobalFusionRun(result)` — called automatically after each `buildGlobalFusionPrimarySurface` (do not double-call).
- `recordGlobalFusionFallback(reason)` — stores a recent fallback reason sample (also invoked from `recordGlobalFusionRun`).
- `recordGlobalFusionConflict` / `recordGlobalFusionWarning` — optional auxiliary signals (tests / future hooks).
- `getGlobalFusionMonitoringSnapshot()` — returns `GlobalFusionAggregateMonitoringSnapshot` with finite rates in `[0, 1]`.
- `resetGlobalFusionMonitoringForTests()` — clears state (tests only).

## Warning conditions

Threshold-style **`[global:fusion:monitoring]`** warnings are **observational**, **non-blocking**, and **rate-limited** (cooldown in runs) to avoid log noise. Examples: high fallback rate, weak missing-source rate, persistent high conflicts, excessive disagreement, low evidence, influence apply/skip imbalance, unstable ordering, repeated empty outputs, malformed signals.

## Persistence

Optional DB persistence (`FEATURE_GLOBAL_FUSION_MONITORING_PERSISTENCE_V1`) is **not** implemented; state is **in-memory only**.

## Limitations

- **Process-local**: counters reset on deploy/restart; not shared across instances.
- **Not a substitute** for product analytics or A/B metrics.
- **Ordering stability** uses a simple opportunity id join; different list lengths skip comparison.

## Optional UI

The growth **Global Fusion** strip can show a compact **Phase D** line (rates and anomaly count) without changing execution.

## Rollback

Disable or ignore Phase D: no env flag is required for the aggregate (it is always on when code is deployed). To hide UI, adjust the strip component only.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-monitoring.test.ts modules/global-fusion
```

## Source of truth

**Brain, Ads, CRO, and Ranking** remain authoritative for their domains. Phase D only **observes** fused advisory runs.
