# Swarm Phase B — controlled agent influence

## Purpose

Phase B adds an **optional, advisory-only overlay** on top of the existing swarm decision bundle. It may **reorder presentation** (within negotiation buckets), attach **bounded rank hints**, and add **tags** (caution, monitor, human review). It does **not** change Brain, Ads, CRO, Operator, Platform Core, Fusion, or any execution/write path.

**Source of truth:** base `SwarmSnapshot.bundle` and each subsystem’s own outputs remain authoritative. When present, `influencedBundle` is a **copy** with `influenceOverlay` metadata only.

## Feature flag

| Env | Code |
|-----|------|
| `FEATURE_SWARM_AGENT_INFLUENCE_V1` | `swarmSystemFlags.swarmAgentInfluenceV1` |

- **OFF (default):** Same behavior as before Phase B — no overlay; `influencedBundle` and `influenceReport` are `null`.
- **ON:** After quality gates pass, `applySwarmInfluence` may produce `influencedBundle` + `influenceReport`. If gates fail, overlay is skipped; `influenceReport` records the skip reason (advisory).

## Allowed mechanisms

1. **Agreement boost** — Small positive `rankAdjustment` when negotiation is `proceed`, conflicts are low, evidence/risk thresholds are met, and global agreement/execution suitability allow boosts.
2. **Conflict / risk caution** — Negative `rankAdjustment` and `conflict_caution` when conflicts and risk align with thresholds.
3. **Human review escalation** — `require_human_review` tag when conflicts and weak evidence (or low agreement with conflicts) suggest mixed signals.
4. **Low-evidence monitor** — `low_evidence` + `monitor_only` when per-proposal evidence is very low.
5. **Dependency watch** — `dependency_watch` when many dependencies exist (observational).

No new execution actions are invented; negotiation **status** from `swarmNegotiationResults` is not overwritten in source data (grouping still derives from the same results).

## Hard safety limits

- **No mutation** of proposals in `bundle` — overlays exist only on cloned proposals in `influencedBundle`.
- **Rank delta cap:** `rankAdjustment` per proposal is clamped to ±`SWARM_INFLUENCE_MAX_RANK_DELTA` (~12%).
- **No emptying** the bundle — same proposal count as the base bundle.
- **Weak global quality:** If gates fail, **no** influenced bundle; base snapshot unchanged for presentation consumers that only read `bundle`.

## Swarm quality gates

Influence runs only when `evaluateSwarmInfluenceQualityGates` returns `ok`, including checks for:

- Minimum successful agents and critical agent presence  
- Failure count bounds  
- Minimum evidence score and conflict/agreement sanity  

When gates fail, ranking influence is skipped (see `influenceReport.skippedReason`).

## Observability

Structured log namespace: **`[swarm:v1:influence]`**

- `influence_applied` — counts, reason summary, agent coverage (when overlay applied).
- `influence_skipped` — when gates fail with `qualityGatesOk: false`.

`SwarmInfluenceReport` duplicates key counts for API/UI consumers.

## Warning meanings (`observationalWarnings` on the report)

Observational only — **no side effects**:

- Borderline agent coverage when overlay still applied  
- Many items adjusted in one cycle  
- Boost while conflicts present  
- High global conflict count vs few caution tags  
- One agent receiving repeated boosts  

## Rollback

1. Set `FEATURE_SWARM_AGENT_INFLUENCE_V1=0` (or unset).  
2. Redeploy / restart app — `influencedBundle` / `influenceReport` stay `null`; consumers use `bundle` only.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/swarm/
```

Optional full app typecheck (heavy):

```bash
cd apps/web && pnpm run typecheck
```

No Prisma changes are required for Phase B.

## Explicit note

**Brain, Ads, CRO, Operator, Platform Core, Fusion, and the base swarm bundle remain the source of truth.** Phase B is a reversible presentation overlay gated by `FEATURE_SWARM_AGENT_INFLUENCE_V1` and quality gates.
