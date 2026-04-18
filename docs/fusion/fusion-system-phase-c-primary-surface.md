# Fusion Phase C — Primary advisory orchestration surface

## Purpose

Phase C makes Fusion the **top-level advisory composition and presentation layer** when enabled: grouped buckets, fused ranking order, and explicit provenance — **without** replacing Brain, Ads, Operator, or Platform Core as authoritative for their own domains.

Fusion remains **advisory-only**; it does not execute recommendations or alter stored trust, weights, outcomes, financial truth, or dependency truth.

## Flags

| Env | Code | Default | Behavior |
|-----|------|---------|----------|
| `FEATURE_FUSION_SYSTEM_PRIMARY_V1` | `fusionSystemFlags.fusionSystemPrimaryV1` | **off** | When **off**, behavior matches Phase B (same `FusionSnapshot` from `buildFusionSnapshotV1()`; primary presentation is not built). When **on**, validated snapshots additionally get a `FusionPrimaryPresentation` (grouped recommendations + provenance note). |

Requires the same base gates as V1: `FEATURE_FUSION_SYSTEM_V1` + `FEATURE_FUSION_SYSTEM_SHADOW_V1` (`isFusionOrchestrationActive()`).

## Routing

- Entry: `buildFusionPrimarySurface()` in `apps/web/modules/fusion/fusion-system.primary-surface.ts`.
- **Orchestration inactive:** returns `snapshot: null` (same as skipping fusion).
- **Primary flag off:** returns full `FusionSnapshot`, `presentation: null`, `primaryPresentationActive: false`.
- **Primary flag on + validation pass:** returns `presentation` with bucketed/ranked recommendations, plus `presentation.structured`: `{ recommendations, groupedBy: { proceed, caution, monitor, defer, blocked, insufficient }, meta: { agreementScore, conflictCount, systemsUsed, evidenceQuality } }`, and per-item `sourceSystems`, `reasons`, `confidence`, `risk` (`FusionPrimaryAdvisoryItem`).
- **Primary flag on + validation fail or build throw:** returns `fallbackUsed: true`, keeps `snapshot` when available, `presentation: null`, logs `[fusion:primary]` with reason.

Underlying `buildFusionSnapshotV1()` is unchanged; Phase B influence overlay remains on the snapshot. Primary mode does **not** apply a second influence pass — presentation is derived from the same snapshot recommendations/signals.

## Validation gates (before primary presentation)

`validateFusionPrimaryReadiness()` checks:

- Scores are finite.
- Normalized signals are well-formed (ids, source, kind).
- Not both zero coverage and zero signals (subsystem coverage heuristic).
- Not unexpectedly empty recommendations when many signals exist.
- Conflict density not beyond a conservative threshold.

Failure → automatic fallback to snapshot-only view; caller is not broken.

## Fallback conditions

Automatic, non-blocking, logged:

- `buildFusionSnapshotV1()` throws.
- Validation fails (malformed signals, weak coverage + empty signals, empty recs with heavy signal load, excessive conflict density).
- Session-level fallback counter increments for observability warnings after repeated fallbacks.

## Provenance

- `FusionPrimaryPresentation.provenanceNote` states that subsystems remain authoritative.
- `FusionRecommendation` entries retain `agreeingSystems` / `disagreeingSystems`.
- Full `FusionSnapshot` is always returned when build succeeds so raw signals, conflicts, and recommendations remain inspectable.

## Observability

- Log namespace: `[fusion:primary]` — events include `phase_b_surface`, `primary_fallback`, `primary_surface_active`, `fusion_snapshot_build_failed`.
- `FusionPrimaryObservabilityPayload` on the result: bucket counts, conflict count, insufficient-evidence rate, source coverage summary, session fallback count.

## Warning meanings (observational only)

Examples emitted on the primary surface result:

- Primary requested but validation failed (using snapshot-only fallback).
- Weak subsystem coverage with primary presentation active.
- Repeated primary fallbacks in-process.
- Fused recommendations empty while multiple signals exist.

These do not change execution or stored data.

## Rollback

1. Set `FEATURE_FUSION_SYSTEM_PRIMARY_V1=0` or unset — immediate return to Phase B presentation behavior (primary presentation not built).
2. If fusion compute should stop entirely: disable `FEATURE_FUSION_SYSTEM_V1` and/or `FEATURE_FUSION_SYSTEM_SHADOW_V1` per existing Fusion V1 docs.

## Validation commands

```bash
cd apps/web
pnpm exec vitest run modules/fusion/fusion-system.primary-surface.test.ts modules/fusion/fusion-system.service.test.ts modules/fusion/fusion-system.influence.test.ts
```

## Authoritative note

**Brain, Ads, Operator, and Platform Core remain the sources of truth for their respective domains.** Fusion Phase C only orders and groups **advisory** projections for display; it does not override subsystem correctness.
