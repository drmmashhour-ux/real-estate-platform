# Brain V8 Phase C — controlled influence (presentation only)

## Purpose

Allow **shadow comparison signals** to **lightly** adjust how the One Brain snapshot is **presented** (ordering of recent outcomes, advisory tags, notes) without changing stored outcomes, source weights, trust computation, learning loops, or outcome ingestion.

**Current Brain remains the source of truth** for all persisted data. Phase C is a **response-layer overlay** only.

## Flags

| Env | Flag | Default |
|-----|------|--------|
| `FEATURE_BRAIN_V8_INFLUENCE_V1` | `oneBrainV8Flags.brainV8InfluenceV1` | off |

- **OFF:** Snapshot payload matches `buildBrainSnapshot()` output (plus no `brainV8Influence` field). Phase B shadow observation/cron behavior is unchanged.
- **ON:** After `buildBrainSnapshot()`, `applyBrainV8PresentationOverlay()` may reorder `recentOutcomes` for display, rebuild `timeline`, append notes, and attach `brainV8Influence` metadata.

Shadow observation / persistence flags are **orthogonal**; influence builds a synthetic shadow comparison from the same snapshot in memory (no duplicate DB read for that step).

## Allowed mechanisms

1. **Agreement boost:** Small positive sort-key nudge when live vs shadow align and comparison quality is strong.
2. **Risk caution:** Small negative nudge when shadow labels review with larger deltas (bounded; **not** applied as boost on `NEGATIVE` / strongly negative scores).
3. **Monitor / insufficient:** Tags when shadow marks insufficient evidence or weak comparison gates skip full reorder.

## Hard safety limits

- No new authoritative decisions; no writes to outcome or weight tables from this module.
- Presentation nudges capped (see `MAX_PRESENTATION_NUDGE`, `MAX_INFLUENCED_FRACTION` in `brain-v8-influence.service.ts`).
- Weak comparison quality → **no** reorder; annotation-only path with `applied: false`.
- Empty snapshot / outcomes list not forced empty by influence.

## Comparison quality gate

Influence **applies** only when `buildBrainV8ComparisonQuality` reports `weakComparison: false` (minimum sample size, bounded mean delta, insufficient/review ratios).

If weak: skip reorder, log `[brain:v8:influence]` skip, optional dashboard note.

## Observability

Structured logs under **`[brain:v8:influence]`** with boosted / caution / monitor / skipped counts and optional warning codes (e.g. `comparison_quality_weak`, `elevated_mean_delta_with_boost`).

## Warning meanings (observational)

Warnings do not change runtime behavior beyond logging and `brainV8Influence.warnings` on the payload.

## Rollback

1. Set `FEATURE_BRAIN_V8_INFLUENCE_V1=0` (or unset).
2. Dashboard and admin snapshot calls return to plain `buildBrainSnapshot()` output (no overlay).

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/platform-core/brain-v8-influence.test.ts
pnpm exec prisma validate   # no new tables for Phase C
```

## Explicit note

**Stored trust, weights, outcomes, and ingestion semantics are not modified by Phase C.** Only cloned snapshot fields used for API/UI may be reordered or annotated.
