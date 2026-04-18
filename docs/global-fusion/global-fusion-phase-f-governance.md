# Global Fusion Phase F — Governance & Fusion-local safety

## Purpose

Phase F adds a **Fusion-local governance layer** that evaluates whether Global Fusion is operating within safe bounds, surfaces **watch / caution / freeze / rollback-advisory** states, and optionally **auto-freezes** only Fusion-local adaptive behavior (learning weights, Phase B influence overlay) when explicitly gated by environment flags.

**Source systems (Brain, Ads, CRO, Ranking) remain authoritative.** Governance does not write to their stores, change their native logic, or toggle unrelated product rollout flags.

## What it monitors

Governance consumes **read-only** signals from:

- **Phase D** (`global-fusion-monitoring.service`): aggregate rates such as fallback, missing sources, conflict, disagreement, low evidence, anomaly, unstable ordering, malformed inputs.
- **Phase E** (`global-fusion-learning-monitoring.service` + weights): learning proxy metrics (e.g. recommendation hit rate), calibration proxy, and Fusion-local **weight drift** from defaults.

## Threshold policy

Thresholds live in `apps/web/modules/global-fusion/global-fusion-governance.constants.ts`. They are **conservative**: weak evidence prefers **watch** or **caution** over freeze or rollback recommendations. Stronger actions require **repeated breaches**, **high severity**, or **consecutive elevated cycles** where applicable.

## Rollback signal (advisory)

When `FEATURE_GLOBAL_FUSION_AUTO_ROLLBACK_SIGNAL_V1=true`, evaluation may attach a structured **`rollbackSignal`** to the governance snapshot. This is a **formal advisory** for operators: it **does not** auto-disable source systems, **does not** toggle external rollout flags, and **does not** execute product actions.

When the flag is off, rollback reasoning may still appear in logs and internal snapshot fields, but the formal signal object is not attached (`buildGlobalFusionRollbackSignal` returns `null`).

## Freeze meaning

**Freeze** applies only to **Fusion-local** behavior:

- **Learning freeze**: adaptive Fusion weights do not update; readers fall back to defaults / safe baseline via `global-fusion-learning-weights.service`.
- **Influence freeze**: Phase B influence overlay is skipped or degraded safely via `global-fusion-influence.service`.

Freeze state is held in memory (`global-fusion-freeze.service`), is **inspectable**, and **reversible** (`clearGlobalFusionFreeze`, `clearGlobalFusionFreezeForTests`, optional `maybeUnfreezeGlobalFusion`).

### What auto-freeze can do

With `FEATURE_GLOBAL_FUSION_AUTO_FREEZE_V1=true`, the governance pass may call `applyGlobalFusionFreeze` when thresholds recommend freezing learning and/or influence. This affects **only** the Fusion-local freeze state above.

### What auto-freeze cannot do

- It does **not** change Brain/Ads/CRO/Ranking data or logic.
- It does **not** toggle unrelated feature flags.
- It does **not** persist Fusion-local weight truth to source-system tables.

## What governance does **not** do

- Does not **mutate source-system truth** or historical records.
- Does not **rewrite** stored trust, financial, or dependency data.
- Does not **auto-execute** product or platform actions.
- Does not **bypass manual review** for high-severity situations (e.g. `require_human_review` is explicit).
- Does not **block** primary Fusion serving if evaluation fails (`tryEvaluateGovernance` is best-effort and swallow errors).

## Feature flags

| Env | Code (`globalFusionFlags`) | Default |
|-----|---------------------------|---------|
| `FEATURE_GLOBAL_FUSION_GOVERNANCE_V1` | `globalFusionGovernanceV1` | off |
| `FEATURE_GLOBAL_FUSION_AUTO_FREEZE_V1` | `globalFusionAutoFreezeV1` | off |
| `FEATURE_GLOBAL_FUSION_AUTO_ROLLBACK_SIGNAL_V1` | `globalFusionAutoRollbackSignalV1` | off |

- **GOVERNANCE_V1 off**: governance evaluation does not run (early exit in `tryEvaluateGovernance`; `evaluateGlobalFusionGovernance` returns a disabled snapshot).
- **GOVERNANCE_V1 on**: evaluation may run read-only and record observability.
- **AUTO_FREEZE_V1 on**: may apply Fusion-local freeze only as described above.
- **AUTO_ROLLBACK_SIGNAL_V1 on**: may emit formal rollback signal on the snapshot when appropriate.

## Observability

Structured logs use the namespace **`[global:fusion:governance]`** (see `global-fusion-governance-monitoring.service.ts` and `global-fusion-governance.service.ts`). Counters include evaluation counts, freeze recommendations/applied, rollback recommendations, threshold breach tallies, and the last snapshot summary.

## Operator rollback steps (manual)

1. Set `FEATURE_GLOBAL_FUSION_PRIMARY_V1` / influence / learning flags per your runbook (governance **does not** auto-toggle these).
2. Clear Fusion-local freeze if needed: call `clearGlobalFusionFreeze()` in an admin context or restart the process (in-memory state).
3. Review Phase D/E metrics and last governance snapshot via logs or `getLastGovernanceSnapshot()` / `getGovernanceMonitoringSummary()`.
4. Re-enable gradually after root cause is addressed.

## Validation commands

From the repo root (or `apps/web` as appropriate for your workspace):

```bash
pnpm exec vitest run apps/web/modules/global-fusion/global-fusion-governance.test.ts
pnpm exec vitest run apps/web/modules/global-fusion/global-fusion-freeze.test.ts
pnpm exec vitest run apps/web/modules/global-fusion/global-fusion-governance-monitoring.test.ts
```

Optional broader Fusion tests:

```bash
pnpm exec vitest run apps/web/modules/global-fusion
```

---

**Note:** Source systems remain authoritative and unchanged. Governance is Fusion-local, advisory, and safety-focused.
