# Global Fusion Phase C — primary advisory surface

## Purpose

Phase C exposes an optional **primary cross-system advisory composition layer**: a single ranked, grouped view built from the existing Global Fusion V1 pipeline (normalization → scoring → conflicts → recommendations → optional Phase B influence). **Source systems (Brain, Ads, CRO, Ranking) remain authoritative** for their own outputs; Global Fusion is the **top-level advisory presentation** only when `FEATURE_GLOBAL_FUSION_PRIMARY_V1` is enabled.

## Feature flag

| Env | Code | Default |
|-----|------|--------|
| `FEATURE_GLOBAL_FUSION_PRIMARY_V1` | `globalFusionFlags.globalFusionPrimaryV1` | **off** |

- **Off:** Same behavior as Phase B — `buildGlobalFusionPrimarySurface` returns `path: "source_advisory_default"` and `surface: null`; the underlying `fusionPayload` is still produced by **one** `buildGlobalFusionPayload` call (no duplicate assembly).
- **On:** After validation passes, `path: "global_fusion_primary"` and a `GlobalFusionPrimarySurface` is returned with grouped buckets; on validation failure, `path: "global_fusion_primary_fallback_default"` and callers should use the non-primary / per-source advisory paths already in the product.

## Routing behavior

| Path | Meaning |
|------|--------|
| `source_advisory_default` | Primary surface disabled; use existing advisory UX as today. |
| `global_fusion_primary` | Primary surface active; fused opportunities/risks/recommendations are the main cross-system advisory view. |
| `global_fusion_primary_fallback_default` | Primary requested but validation failed or assembly threw; fall back to default advisory behavior without breaking callers. |

## Single assembly / no double influence

`buildGlobalFusionPrimarySurface` calls **`buildGlobalFusionPayload` exactly once**. Phase B influence (when enabled) runs only inside that function. The primary surface **does not** call `applyGlobalFusionInfluence` again.

## Validation gates

Primary output is rejected (fallback) when any of these hold:

- Fusion disabled or missing snapshot
- Malformed normalized signal count above zero (`meta.malformedNormalizedCount`)
- No normalized signals
- Non-finite fused scores
- Fewer than two contributing subsystems (`contributingSystemsCount` below 2)
- Missing sources above threshold (`missingSources.length` above 5)
- Meaningful signals present but opportunities, risks, and recommendations are all empty (unexpected empty advisory)

## Fallback conditions

Fallback is **automatic** and **non-blocking**: consumers keep using `fusionPayload` and existing source-specific surfaces. Reasons are logged under `[global:fusion:primary]` (warn on fallback).

## Provenance

Each `GlobalFusionPrimarySurfaceItem` carries `provenanceSystems` and source-derived titles/summaries. Source detail APIs and control-center slices remain available; Global Fusion does not hide them.

## Observability

Structured logs use the namespace **`[global:fusion:primary]`** (single summary line on success; warnings on fallback or observational notes). No execution or writer paths are modified.

## Warning meanings (observational)

Examples include `weak_source_coverage`, `malformed_normalized_signals_present`, `primary_enabled_but_fallback_path`, `unusually_high_disagreement_rate`. These are **hints only** and do not block responses.

## Rollback

1. Set `FEATURE_GLOBAL_FUSION_PRIMARY_V1=0` (or unset).
2. Deploy/restart the web app.
3. Confirm `buildGlobalFusionPrimarySurface` returns `source_advisory_default` and UI falls back to prior advisory patterns.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-primary.test.ts modules/global-fusion
```

## Source of truth

**Brain, Ads, CRO, and Ranking** remain the sources of truth for their domains. Phase C only composes and prioritizes **advisory** presentation of fused views; it does not overwrite stored metrics, trust, financial data, or execution state.
