# Brain V8 post-cutover monitoring (passive)

## Purpose

After **Brain V8 primary** is enabled (`FEATURE_BRAIN_V8_PRIMARY_V1`), this layer tracks **process-local KPIs** for stability validation. It does **not** change routing, learning, outcomes, weights, or execution — only logs and dashboard hints.

## What is monitored

| Area | Signal |
|------|--------|
| Primary vs fallback | Counts, **fallback rate %**, rolling run ring for **spike** detection |
| Fallback reasons | Exact reason strings + coarse **categories** (readiness, validation, exception, comparison_gate, other) |
| Output shape (success path) | Mean |outcomeScore| per success run; flags unusual row counts (observational) |
| Score stability | Dispersion of recent success means → volatility hint (low / moderate / high) |
| Phase B (optional) | Last `[brain:v8:comparison]` report in-process: **overlap** and **divergence** |
| Rollup | Every 25 runs: structured `[brain:v8:post-cutover] rollup_tick` log |

## Key KPIs

- **Fallback rate %** — `fallback / (success + fallback)` in this Node process.
- **Stability score (heuristic)** — 0–100; higher suggests healthier primary usage (not authoritative).
- **Phase B overlap / divergence** — when Phase B last ran in the same process and stored a report.

## Thresholds (observational warnings)

- **Moderate fallback**: ≥ **5%** (sampled log every 12th qualifying run to limit noise).
- **High fallback**: ≥ **10%** (logged when run count ≥ 8).
- **Spike**: last 10 runs vs prior 10 — fallback share jumps (heuristic).
- **Legacy**: > **45%** fallback — existing `brain_v8_primary_frequent_fallback_observed` in `[brain:v8:primary]`.

## Log namespaces

- `[brain:v8:post-cutover]` — KPIs, thresholds, rollups.
- `[brain:v8:primary]` — routing path (unchanged).

## Interpreting results

- Process-local counters **reset on cold start** (serverless/new instance). Treat as **sampling**, not global production totals unless aggregated externally.
- **High divergence** in Phase B suggests comparison sample disagreement — verify snapshot quality, not necessarily “wrong” primary output.

## Rollback conditions (operational)

- Sustained **high fallback rate** + **validation/exception** categories dominating → investigate primary readiness and shadow quality before deeper integration.
- **Disable primary** by unsetting `FEATURE_BRAIN_V8_PRIMARY_V1` — system reverts to Phase C overlay / current Brain presentation per `brain-v8-primary-routing.service.ts`.

## How to disable safely

1. Set `FEATURE_BRAIN_V8_PRIMARY_V1` to `false` / remove in env.
2. Deploy; confirm `[brain:v8:adapter]` logs show `current_brain_phase_c`.
3. No migration rollback required for monitoring (in-memory only).
