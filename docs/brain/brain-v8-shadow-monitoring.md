# Brain V8 shadow monitoring (read-only)

This document describes the **shadow observation / validation** phase for Brain V8. It is **observation-only**: no live Brain decisions, weights, learning loops, or outcome ingestion semantics are changed by this layer.

## What was added (monitoring & safety pass)

- **`brain-v8-shadow-monitoring.service.ts`** — in-process counters (passes, persistence success/failure, empty samples, snapshot/audit failures, consecutive empty passes). Observability only.
- **Evaluator hardening** — non-finite `outcomeScore` values yield `insufficient_evidence` (not aligned/review); aggregates use finite rows only.
- **Observer hardening** — `buildBrainSnapshot()` wrapped in `try/catch`; failures return `null` and log a warning (live Brain unaffected).
- **Observational warnings** — `logWarn` for empty sample, repeated empty passes, persistence on but write failed, snapshot cap, audit failures (no execution impact).
- **Tests** — gating (`observation` off → no snapshot), observer snapshot failure, evaluator edge cases, DTO non-mutation.

## What was intentionally not touched

- Brain V2/V3 **learning**, **adaptation**, **weight writers**, **outcome ingestion**, **ranking**, and **historical `BrainDecisionOutcome` rows** (beyond the existing additive `BrainShadowObservation` table).
- `buildBrainSnapshot()` implementation (still the canonical read path; only call site wrapped for error handling in the observer).

## Flags and rollout

| Env | Flag object | Behavior |
|-----|-------------|----------|
| `FEATURE_BRAIN_V8_SHADOW_OBSERVATION_V1` | `oneBrainV8Flags.brainV8ShadowObservationV1` | **Off**: `runBrainV8ShadowObservationPass()` returns `null` immediately; no snapshot, no persistence, no audit. **On**: read-only pass runs. |
| `FEATURE_BRAIN_V8_SHADOW_PERSISTENCE_V1` | `oneBrainV8Flags.brainV8ShadowPersistenceV1` | **Off**: no `brain_shadow_observations` writes. **On**: best-effort `create` after pass; failures are logged, non-blocking. |

`platformCoreFlags.platformCoreV1` must be on; otherwise the observer logs and returns `null`.

## Observer flow

1. Gate: observation flag + platform core.
2. `buildBrainSnapshot()` → `recentOutcomes` (slice max 24).
3. Build shadow rows + aggregates (read-only DTOs).
4. Optional persistence → `BrainShadowObservation` (additive table only).
5. Optional audit → `PLATFORM_CORE_AUDIT.BRAIN_SHADOW_V8_OBSERVATION` when audit is effective.

## Persistence behavior

- Writes **only** to `BrainShadowObservation` (see Prisma schema `brain_shadow_observations`).
- JSON fields: summary, diff notes, metadata (may include monitoring snapshot).
- Failures do not throw to callers.

## Audit event behavior

- Emitted only when `isPlatformCoreAuditEffective()` is true and the observation pass completed snapshot + evaluation (not when returning `null` at the first gate).
- Failures are caught and logged; counters increment `auditEmitFail`.

## Healthy signals

- Non-zero `sampleSize` when outcomes exist in the window.
- Stable `meanAbsDelta` / `reviewCount` for your environment.
- Persistence success when persistence flag is on and DB is available.

## Warning signs

- `observation_empty_sample` on every run in production-sized traffic (tracking or snapshot issue).
- `observation_repeated_empty` (≥3 consecutive empty passes).
- `persistence_flag_on_but_write_failed` (DB/migration/permissions).
- `shadow_row_volume_at_cap` (informational — sample capped at 24 rows per pass by design).

## Rollback

1. Set `FEATURE_BRAIN_V8_SHADOW_OBSERVATION_V1=0` — disables all shadow passes (no snapshot/audit/persistence from observer).
2. Set `FEATURE_BRAIN_V8_SHADOW_PERSISTENCE_V1=0` — stops new shadow rows; observation can still run if observation flag is on.
3. No data repair required for Brain outcomes; shadow rows are optional analytics.

## Validation commands

From `apps/web` (when feasible):

```bash
pnpm exec vitest run modules/platform-core/brain-v8-shadow-evaluator.test.ts \
  modules/platform-core/brain-v8-shadow-observer.test.ts \
  modules/platform-core/brain-v8-shadow-gating.test.ts
pnpm exec prisma validate
```

Full-repo `tsc` may be heavy; use targeted tests above for this layer.

## Reminder

This phase is **read-only and shadow-only** relative to Brain truth. Shadow scores are **not** written back to outcome rows.
