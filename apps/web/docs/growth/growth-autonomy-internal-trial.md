# Growth Autonomy — single adjacent internal trial

This document describes the **one** operator-approved, **internal-only**, **reversible** trial path that can run on top of the safe autonomy framework. It is **not** a second catalog surface: it is a **strictly bounded** extension for one low-risk adjacent action when evidence and policy gates pass.

## Modes (unchanged)

- **OFF** — No autonomy orchestration surfaces.
- **ASSIST** — Suggestions only; prefills optional only where catalog allows.
- **SAFE_AUTOPILOT** — Suggestions + prefilled navigation/copy by default; **the adjacent trial may activate only here**, and only after explicit approval.

## Baseline catalog (never widened in this pass)

Baseline rows remain advisory: suggest-only, prefilled navigation/copy-only, approval-required where policy demands, blocked when enforcement blocks.

## The one adjacent trial action

Defined in `growth-autonomy-trial-boundaries.ts`:

- **ID:** `trial-internal-review-note-variant`
- **Type:** `internal_review_note_variant`
- **Behavior:** Stores a reversible **audit-only draft marker** during activation — **no CRM mutation, no outbound messages, no payments/bookings/ads/CRO**.

## Preconditions for activation

All must hold:

1. `FEATURE_GROWTH_AUTONOMY_TRIAL_V1=true`
2. `FEATURE_GROWTH_AUTONOMY_ROLLOUT=internal` (**trial activation is forbidden for partial/full in this phase**)
3. Autonomy mode `SAFE_AUTOPILOT` (`FEATURE_GROWTH_AUTONOMY_MODE`)
4. Kill switch **off**, trial freeze **off**
5. Policy enforcement snapshot available and `panel_render_hint` not **block**/**freeze**
6. Audit-health gate passes (rolling window — see eligibility service)
7. At most **one** approval record (approved pending or active) — no parallel trials

Operator **approval** via POST `/api/growth/autonomy/trial` is required **before** execution runs on a subsequent autonomy snapshot build.

## Approval workflow

1. Operator confirms eligibility messaging on Growth Machine autonomy panel (`FEATURE_GROWTH_AUTONOMY_TRIAL_PANEL_V1`).
2. Operator calls **Approve internal trial** → record `approved_internal_trial`.
3. Next `/api/growth/autonomy` snapshot build runs execution once → `active`, audit entry + artifact id (in-memory for this rollout).
4. Operators may **Rollback** → clears approval record so a future trial cycle can begin.

**Deny / clear** removes approval state without executing.

## Rollback workflow

1. Operator invokes **Rollback** → trial approval record cleared, audit rows appended.
2. Operators should verify UI shows **no active trial artifact** (`snapshot.trial.approval`), then continue normal operations.

## Flags

| Flag | Purpose |
|------|---------|
| `FEATURE_GROWTH_AUTONOMY_TRIAL_V1` | Trial layer evaluates candidates and exposes embed in autonomy snapshot |
| `FEATURE_GROWTH_AUTONOMY_TRIAL_PANEL_V1` | Approval UI on Growth autonomy panel |
| `FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE` | Blocks **new** approvals while allowing read-only visibility |

Kill switch: `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH` suppresses autonomy including trial mutations.

## Known limitations

- Approval state is **in-process** (single runtime). Multi-instance deployments need a durable store before production reliance.
- Execution records an **audit marker**, not durable customer-visible content.
- Eligibility uses conservative heuristics — treat “eligible” as **trial-gated**, not certainty.

## After execution — measurement

See **`growth-autonomy-trial-results.md`** for usefulness/safety scoring, governance-only decisions, and expansion lock discipline.
