# Growth autonomy — evidence-based allowlist expansion (governance)

## What this is

A **read-only evaluation and approval layer** on top of the low-risk auto-execution audit trail. It:

- scores **parent** allowlisted action keys and **adjacent** internal-only candidate patterns;
- **never** auto-activates expansion;
- **never** broadens into payments, bookings, ads, CRO, pricing, external sends, or irreversible product automation.

## What counts as evidence

| Source | Use |
|--------|-----|
| `growth_autonomy_low_risk_executions` | Executed count, undo count, undo rate by `lowRiskActionKey` |
| Learning aggregates (per catalog) | Merged for each action key: helpful / unhelpful, sparsity (insufficient_data) |
| Audit health | Row volume, explanation integrity sample, distinct action keys |
| Feature-freeze + DB freeze | Blocks new **approvals** in the registry |

## Minimum evidence (defaults, overridable by env)

- `GROWTH_AUTONOMY_EXPANSION_MIN_SAMPLE` (default 24) execution rows in the window for a parent pattern
- `GROWTH_AUTONOMY_EXPANSION_MAX_UNDO_RATE` (default 0.22)
- `GROWTH_AUTONOMY_EXPANSION_MIN_POS_FEEDBACK` (default 0.52) when at least 6 feedback events exist
- `GROWTH_AUTONOMY_EXPANSION_WINDOW_DAYS` (default 42)
- `GROWTH_AUTONOMY_AUDIT_HEALTH_MIN_ROWS` (default 12) for the audit-health gate

If sample is small or learning is **insufficient_data** for the merged category → **insufficient_data** (no trial proposal).

## What “expansion” means in this phase

Only one of:

1. **Adjacent internal-only action** already enumerated in `GROWTH_AUTONOMY_EXPANSION_CANDIDATES` (narrow adjacency).
2. **Recorded approval** in `growth_autonomy_expansion_state.activated_trials_json` — registry only; wire-up to execute new keys remains a separate guarded change.
3. **Operational freeze** toggled on stored state — stops new approvals.

## Approval workflow

1. Operators review **`GrowthAutonomyExpansionPanel`** (requires `FEATURE_GROWTH_AUTONOMY_EXPANSION_PANEL_V1`).
2. When status is **`eligible_for_trial`**, an admin may **Record approval** → POST `/api/growth/autonomy/expansion` `{ action: "approve_trial", candidateId }`.
3. Approvals are **idempotent per candidate id** (no duplicate rows).
4. **`FEATURE_GROWTH_AUTONOMY_EXPANSION_FREEZE`** or DB freeze blocks new approvals.

## Rollback workflow

- **Automatic signal**: parent or candidate outcome **`rollback_candidate`** when undo rate or negative feedback crosses thresholds.
- **Operational**: remove trials from registry by DB/admin tooling (future: explicit delete endpoint if needed).

## Audit-health gating

If audit rows are below minimum or explanation integrity on a sample falls below threshold → **no eligible trials**; explanations state the gate.

## Feature flags

| Flag | Purpose |
|------|---------|
| `FEATURE_GROWTH_AUTONOMY_EXPANSION_V1` | Run decision engine |
| `FEATURE_GROWTH_AUTONOMY_EXPANSION_PANEL_V1` | Operator UI |
| `FEATURE_GROWTH_AUTONOMY_EXPANSION_FREEZE` | Env-level freeze on new approvals |

## Eligible vs ineligible examples

- **Eligible (trial proposal)**: stable executions, low undo, non-sparse learning, good audit health, adjacency passes `growth-autonomy-expansion-boundaries.ts`.
- **Ineligible**: sparse data, high undo, mixed feedback, unhealthy audit trail, freeze on, or candidate fails safe-class check.
