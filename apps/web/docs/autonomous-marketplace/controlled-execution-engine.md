# Controlled execution engine

Deterministic gate between policy, governance, compliance, and executor dispatch. No LLM decisions.

## Capabilities

- Evaluates `evaluateSafeExecutionGate` before any live attempt (when `FEATURE_CONTROLLED_EXECUTION_V1` is on).
- Append-only audit rows in `autonomy_execution_audit_logs`.
- Optional human queue in `autonomy_pending_action_approvals` when `FEATURE_AUTONOMY_APPROVALS_V1` is on.

## Cannot do

- Bypass compliance blocks.
- Execute when run-level dry-run is true.
- Live execution is limited to **`CREATE_TASK`** and **`FLAG_REVIEW`** only when `FEATURE_CONTROLLED_EXECUTION_V1`, policy, governance, and config all allow it. Price changes, messaging (`SEND_LEAD_FOLLOWUP`), promotions, campaign budgets, and every other action type stay **dry-run** in the controlled apply layer.

## Preview

`previewForListing` remains read-only — no executor mutations.

## Audit

Events: `attempt`, `decision`, `outcome`, `rollback` (rollback requires `FEATURE_AUTOPILOT_HARDENING_V1`).
