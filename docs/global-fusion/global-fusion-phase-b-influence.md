# Global Fusion Phase B — controlled influence (presentation only)

## Purpose

Phase B lets **Global Fusion V1** apply a **bounded, reversible, presentation-layer overlay** on top of the existing advisory snapshot: display priority, ordering of advisory items, caution / monitor / defer / human-review tags, and grouping hints. It does **not** change source-system outputs, execution paths, stored trust, weights, outcomes, or financial truth.

## Feature flag

| Env | Code | Default |
|-----|------|--------|
| `FEATURE_GLOBAL_FUSION_INFLUENCE_V1` | `globalFusionFlags.globalFusionInfluenceV1` | **off** (`0` / unset) |

- **Off:** Same behavior as Global Fusion V1 without Phase B — advisory snapshot only; `snapshot.influence` is `null`; `meta.influenceApplied` is `false`.
- **On:** After the baseline snapshot is built, `applyGlobalFusionInfluence` runs and may adjust **copies** of opportunities / risks / recommendations for UI ordering and tags. Source payloads from Brain / Ads / CRO / Ranking are not mutated.

## Allowed influence mechanisms

1. **Agreement boost** — When systems broadly agree, fused risk is moderate, and conflicts are not severe, opportunity **presentation priority** may increase slightly (capped).
2. **Risk caution** — High fused risk, meaningful conflicts, or weak confidence may lower relative presentation priority and add **caution** / **defer**-style tags.
3. **Low-evidence monitor** — Weak coverage or weak gate tier adds **monitor_only** / **low_evidence** without hiding items.
4. **Readiness guard** — Attractive-looking items may be tagged **proceed_with_caution** when risk/readiness warrants it (strong tier).
5. **Human review escalation** — Persistent high-severity conflicts or human-review recommendations add **require_human_review** tags; items stay visible.

## Hard safety limits

- No items are **added or removed** from opportunities, risks, or recommendations by influence.
- **No mutation** of caller inputs inside `buildGlobalFusionPayload` baseline arrays before influence: influence receives values and returns **new structures** (deep-cloned inside the service).
- Priority deltas are **capped** (±0.15 on the internal presentation score).
- When gates indicate **blocked** (e.g. malformed normalized signals or empty signal set), influence **skips** ordering changes; snapshot lists match baseline content (no presentation tags from Phase B for that run).
- Uncertainty prefers **annotation** over aggressive reordering (weak tier / annotation-only path).

## Quality gates

Influence selects **strong** vs **weak** vs **blocked** tiers using missing-source count, evidence score, malformed signal warnings, and disagreement/conflict hints. The returned **`gate`** object on `snapshot.influence` explains whether ordering was allowed and which thresholds failed.

## Observability

- Structured log namespace: **`[global:fusion:influence]`** (from `logGlobalFusionPayload` when `snapshot.influence` is present).
- **Observational warnings** (non-blocking) may appear on `snapshot.influence.observationalWarnings` (e.g. boost under weak coverage, high fraction of influenced items).

## Warning meanings (observational only)

Warnings do **not** block product behavior; they flag patterns worth reviewing in logs or admin surfaces.

## Rollback

1. Unset or set `FEATURE_GLOBAL_FUSION_INFLUENCE_V1=0` in the web app environment.
2. Redeploy or restart so `globalFusionFlags.globalFusionInfluenceV1` reads `false`.
3. Confirm `snapshot.influence === null` and `meta.influenceApplied === false` on fusion payloads.

## Validation commands

From the repo root (adjust package manager if needed):

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-influence.test.ts modules/global-fusion/global-fusion.service.test.ts
```

Optional broader fusion tests:

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion
```

## Source of truth

**Brain, Ads, CRO, and Ranking** remain authoritative for their respective diagnostics and recommendations. **Global Fusion** aggregates and advises; Phase B only adjusts **how** fused items may be **shown** when the influence flag is on.
