# Auto Policy Proposal Engine v1

## Purpose

Turn **governance feedback aggregates**, **case clusters**, **drift alerts**, and **offline policy simulation** into **explicit, auditable proposals** for humans: threshold tweaks, draft rule ideas, pipeline ordering reviews, and region/action/entity posture reviews.

Nothing in this engine **writes production policy**, YAML, env, feature flags, or unified-governance stores.

## Evidence sources

| Source | Routed into proposals as |
|--------|---------------------------|
| Feedback summary metrics | `feedback_summary` evidence |
| Intelligence clusters | `case_cluster` evidence |
| Drift alerts | `drift_alert` evidence |
| Sandbox simulation deltas | `simulation_result` evidence |

Every proposal carries `evidence[]` with `sourceKey` references (cluster id, alert key, scenario id, etc.).

## Deterministic & advisory

Generation is **pure**: same `PolicyProposalInput` produces the same proposal set. There is **no ML**, no stochastic sampling, no hidden rule synthesis. “New rule” payloads are **templates** labeled `[draft_required]` until policy owners author real DSL.

Simulation **raises confidence** only when paired with additional evidence — see `rankPolicyProposalConfidence` in `policy-proposal-helpers.service.ts`.

## Proposal types

- **THRESHOLD_ADJUSTMENT** — combined risk gates, anomaly sensitivity, simulation-backed staging scenarios.
- **NEW_RULE** — escalation / approval patterns for blind spots or repeated MISSED_RISK (human-authored text required).
- **RULE_ORDER_REVIEW** — reorder gates when clusters cite `affectedRuleIds` and drift degrades FN/FP.
- **REGION_POLICY_REVIEW / ACTION_POLICY_REVIEW / ENTITY_POLICY_REVIEW** — localized posture when drift or clusters concentrate harm.

## Why proposals never auto-activate in v1

The product boundary is **human approval**: `approvePolicyProposal` / `rejectPolicyProposal` / `convertProposalToDraftConfig` are **no-op stubs** producing logs or draft JSON **only**. Production mutations belong in future workflow tools with audit trails.

## Expected review workflow

1. Admin consumes `GET /api/admin/autonomy/policy-proposals` (`report`, `adminSummary`, `investorSummary`).
2. Operators prioritize **critical / high** items using evidence counts.
3. Staging replays (**unified governance** + score sandbox) validate impact before edits.
4. Legal/product approves any real rule expression.
5. Controlled rollout behind feature flags — still **outside** this engine.

## Related modules

- Engine: `modules/autonomous-marketplace/proposals/policy-proposal-engine.service.ts`
- Dedupe/sort/helpers: `policy-proposal-helpers.service.ts`
- Report assembly: `policy-proposal-report.service.ts`
- Dashboard copy: `dashboard/policy-proposal-dashboard.service.ts`
