# Ads Autopilot V8 — Phase D (full V8 primary path)

Additive rollout: **legacy proposal builder is never removed**. Instant rollback is **one env flag** (primary off).

## Flags

| Env | Code (`adsAiAutomationFlags`) | Default | Role |
|-----|-------------------------------|---------|------|
| `FEATURE_ADS_AUTOPILOT_V8_ROLLOUT_V1` | `adsAutopilotV8RolloutV1` | off | Enables V8 adapter paths (shadow / influence / primary). |
| `FEATURE_ADS_AUTOPILOT_SHADOW_MODE_V1` | `adsAutopilotShadowModeV1` | off | Parallel shadow + optional persistence / comparison pipeline. |
| `FEATURE_ADS_AUTOPILOT_V8_INFLUENCE_V1` | `adsAutopilotV8InfluenceV1` | off | Phase C: bounded influence on **live** proposals (when primary is **off**). |
| `FEATURE_ADS_AUTOPILOT_V8_PRIMARY_V1` | `adsAutopilotV8PrimaryV1` | off | **Phase D**: V8 becomes the **primary returned** proposal path (with validation + legacy fallback). |

Primary requires rollout: `proposalsAdsAutomationLoop` checks rollout first; primary is evaluated only when rollout is on.

## Routing behavior

- **Rollout off**: Legacy builder only; same as pre–V8 rollout.
- **Rollout on, primary off**: Phase B/C unchanged — shadow + influence (when flags on) as before; live proposals remain from `buildProposedActionsAdsAutomationLoop` unless influence only adjusts metadata (see influence module).
- **Rollout on, primary on**: `buildAdsAutopilotProposalsWithV8Routing` runs. It may return validated V8 output, or **automatically** fall back to legacy. Phase C **influence is not applied** on top of V8 primary (avoids double-processing).

## Validation gates (before accepting V8 as primary)

- Structural: array, max action count (~280), required `actionType` / `entityType`, sane `reasons.confidence` if present.
- Non-empty when legacy has proposals: empty V8 while legacy has items → fallback.
- Quality guardrails via comparison metrics vs legacy (overlap, confidence drift, shadow structural risk) → optional fallback.

## Fallback conditions (all non-blocking)

V8 output is **not** returned as primary when:

- V8 builder throws.
- Structural validation fails.
- Empty V8 unexpectedly (legacy non-empty).
- Quality guardrails fire.

In all cases the adapter returns **legacy** proposals and logs `path: v8_primary_fallback_legacy` under `[ads:autopilot:adapter]`.

## Rollback (immediate)

1. Set `FEATURE_ADS_AUTOPILOT_V8_PRIMARY_V1=0` (or unset).
2. Optionally keep rollout + shadow on for observation without primary.

No deploy required beyond config if env is injected at runtime.

## Logs / metrics to watch after cutover

- `[ads:autopilot:adapter]`: `path` values `v8_primary` vs `v8_primary_fallback_legacy`.
- `v8_primary_frequent_fallback_observed` — high fallback ratio (observational warning).
- `v8_primary_quality_fallback`, `v8_primary_validation_failed`, `v8_primary_builder_failed`.
- `[ads:v8:comparison]` — `v8_primary_parallel_observability` for overlap counts when primary succeeds or falls back.
- Existing shadow / comparison pipelines remain when shadow mode is on.

Process-local counters: `getAdsAutopilotV8MonitoringSnapshot()` — `v8PrimarySuccessCount`, `v8PrimaryFallbackCount`, `recentPrimaryFallbackReasons`, `lastPrimaryPathLabel` (optional compact line on growth dashboard when rollout is enabled).

## Successful cutover (operational)

- Fallback rate stable and acceptable for your risk tolerance.
- No spike in validation or throw reasons.
- Business metrics for ads recommendations stable (your KPIs).

## When to disable legacy comparison / shadow (if ever)

Only after sustained confidence in V8 primary **and** explicit product decision. Shadow/comparison code is **retained** for regression detection; disabling `FEATURE_ADS_AUTOPILOT_SHADOW_MODE_V1` reduces parallel work — do not remove code paths until policy allows.
