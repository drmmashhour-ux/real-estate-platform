# Global Fusion Phase E — Fusion-local learning (advisory)

## Purpose

Phase E lets Global Fusion **learn from downstream proxy outcomes** (read-only control-center summaries) and optionally **nudge Fusion-local source weights** used only inside `computeGlobalFusionScores`. It does **not** change Brain, Ads, CRO, Ranking, Operator, or Platform Core stores, trust tables, or execution.

## Feature flags (all default off)

| Env | Code |
|-----|------|
| `FEATURE_GLOBAL_FUSION_LEARNING_V1` | `globalFusionFlags.globalFusionLearningV1` |
| `FEATURE_GLOBAL_FUSION_LEARNING_PERSISTENCE_V1` | `globalFusionFlags.globalFusionLearningPersistenceV1` |
| `FEATURE_GLOBAL_FUSION_LEARNING_ADAPTIVE_WEIGHTS_V1` | `globalFusionFlags.globalFusionLearningAdaptiveWeightsV1` |

- **LEARNING_V1 off:** `runGlobalFusionLearningCycle` returns a skipped summary without running upstream reads.
- **LEARNING_V1 on:** a cycle may record signals, link proxy outcomes, evaluate metrics, and (if adaptive flag on) apply bounded weight updates.
- **PERSISTENCE_V1 on:** last in-process snapshot is retained in memory via `getPersistedLearningSnapshot()` (no Prisma coupling in this phase).
- **ADAPTIVE_WEIGHTS_V1 on:** `getGlobalFusionCurrentWeights()` may differ slightly from static defaults; scoring always falls back to defaults when learning/adaptive flags are off.

## What learning does

- Builds `GlobalFusionLearningSignal` rows from normalized signals + fused scores.
- Links **proxy** outcomes from read-only subsystem summaries (e.g. CRO health, Ads risk %, ranking rollback flags).
- Computes hit rates and per-source hit rates (evaluator).
- Proposes **bounded** weight deltas; normalizes weights and enforces max drift from defaults (`global-fusion-learning.constants.ts`).

## What learning does NOT do

- No writes to source databases.
- No changes to native Brain/Ads/CRO/Ranking scoring APIs.
- No auto-execution of recommendations.
- No rewriting of historical truth.

## Linkage model

Linkage strength is **weak**, **strong**, or **unavailable** depending on which proxy fields exist. Uncertain rows do not drive adaptation.

## Evaluation metrics

Approximate rates: recommendation hit rate, false positive / false negative proxies, calibration placeholders — all **Fusion-local** and safe with partial data.

## Adaptive weight rules

- Minimum outcomes, minimum signals, max conflict ratio, and low fused evidence thresholds **block** adaptation.
- Per-run delta cap and total L1 drift cap from defaults — see `global-fusion-learning.constants.ts`.

## Observability

Namespace: **`[global:fusion:learning]`** — cycle complete, observations, threshold hints. Non-blocking.

## Rollback

1. Set all three `FEATURE_GLOBAL_FUSION_LEARNING_*` vars off or unset.
2. Call `resetGlobalFusionWeightsForTests()` is test-only; production behavior: restart process or deploy without flags — in-memory weights reset on process restart.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-learning.test.ts modules/global-fusion/global-fusion-learning-weights.test.ts modules/global-fusion/global-fusion-learning-linker.test.ts modules/global-fusion/global-fusion-learning-evaluator.test.ts modules/global-fusion/global-fusion-scoring.test.ts
```

## Limitations

- In-memory persistence only when persistence flag is on; no cross-instance sync.
- Proxy outcomes are **heuristic**, not causal proofs.

## Source of truth

**Brain, Ads, CRO, Ranking** (and other engines) remain authoritative. Fusion learning only adjusts **internal combination weights** when explicitly enabled.
