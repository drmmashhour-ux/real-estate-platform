# Controlled execution engine

Deterministic gate between policy, governance, compliance, region capability, and executor dispatch. No ML or LLM in the gate path.

## What it is

A **controlled execution** layer that runs **after** preview/explainability and listing identity work. It applies only **internal-safe** mutations (`CREATE_TASK`, `FLAG_REVIEW` today) when every gate agrees. Everything else stays simulation (`DRY_RUN`) even if upstream suggestions exist.

## Flow (single action)

1. **Region-safe capability** — `canRegionExecuteAction` (Syria remains preview-only unless `FEATURE_SYRIA_LIVE_EXECUTION_V1`).
2. **Compliance snapshot** — derived from legal policy bridge on the same `PolicyDecision` (hard legal block wins).
3. **Safe execution gate** — `evaluateSafeExecutionGate` (compliance → dry-run → policy → governance → trust → legal risk → approval).
4. **Approval queue** — if required and `FEATURE_AUTONOMY_APPROVALS_V1`, enqueue `autonomy_pending_action_approvals` (no live execution yet).
5. **Apply** — `applyControlledAction` → `dispatchExecution` only when the gate allows and the action type is in the safe list.
6. **Optional verify + rollback audit** — `FEATURE_AUTONOMY_EXECUTION_VERIFY_V1` / `FEATURE_AUTONOMY_ROLLBACK_V1` (and legacy `FEATURE_AUTOPILOT_HARDENING_V1`) for reversible internal paths.

Orchestration entrypoints: `runControlledExecution` (spec name) and `runControlledExecutionStep` in `controlled-execution-orchestrator.service.ts`; batch wrapper: `runControlledExecutionBatch`. The live engine (`runForListing`, etc.) invokes the step when `FEATURE_CONTROLLED_EXECUTION_V1` is on; **`previewForListing` never calls the orchestrator** (preview builds `executionResult: DRY_RUN` only).

## What V1 can execute

- Internal tasks and review flags (`CREATE_TASK`, `FLAG_REVIEW`) when explicitly allowed by policy, governance, config, region, and run posture.

## What V1 cannot execute

- Outbound messaging, ad spend, public publishing, irreversible financial actions, raw price writes, cross-region writes into unsupported regions.
- Syria live execution without `FEATURE_SYRIA_LIVE_EXECUTION_V1` (preview and intelligence stay read-only).

## Preview

`previewForListing` stays read-only — no executor mutations and no orchestrator.

## Audit & timeline payloads

Append-only `autonomy_execution_audit_logs` with `payloadJson.timeline` keys such as:

- `autonomy_action_attempted`
- `autonomy_action_blocked` / `autonomy_action_allowed` (decision phase)
- `autonomy_action_executed` / `autonomy_action_failed` / `autonomy_action_pending_approval`
- `autonomy_action_rolled_back` (rollback phase)
- Approval resolutions via `recordExecutionApproval`

Human approvals update pending rows and append approval audit entries (they **do not** bypass compliance blocks).

## Persistence

Per-action rows store `policyDecisionJson`, `governanceDisposition`, `executionResultJson`. `outcomeJson` includes `governanceJson` + `policyDisposition` for canonical replay.

## Admin APIs

- `POST /api/admin/autonomy/execute` — controlled run (`targetType`, `targetId`, `mode`, `dryRun`, …).
- `GET /api/admin/autonomy/approvals` — pending approvals.
- `POST /api/admin/autonomy/approve` / `reject` — resolve queue (audited).

## Feature flags (additive)

| Env | Purpose |
|-----|---------|
| `FEATURE_CONTROLLED_EXECUTION_V1` | Gate + audit path |
| `FEATURE_AUTONOMY_APPROVALS_V1` | Approval queue |
| `FEATURE_REGION_AWARE_EXECUTION_V1` | Region registry for execution (pairs with `FEATURE_REGION_AWARE_AUTONOMY_V1` in `canRegionExecuteAction`) |
| `FEATURE_SYRIA_LIVE_EXECUTION_V1` | Allow Syria-source live internal-safe actions |
| `FEATURE_AUTONOMY_ROLLBACK_V1` | Rollback audit emphasis |
| `FEATURE_AUTONOMY_EXECUTION_VERIFY_V1` | Post-exec verification |

`AUTONOMY_GOVERNANCE_AUTO_EXECUTE` defaults **off** — governance `allowExecution` stays false until explicitly enabled.

## Explainability

`live-execution-explainability.service.ts` produces deterministic summaries from gate decisions (no sensitive payload leakage).
