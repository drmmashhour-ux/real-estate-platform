# Approval-based execution layer (Ops Assistant)

Operators can move from **assistant suggestions** → **explicit approval requests** → **approve** → **execute** for a **small allowlist** of internal, low-risk actions. This is **not** autopilot: nothing runs automatically, and nothing runs without an admin-side approval step (except **deny**, which resolves the request).

## What it does

1. Certain ops-assistant suggestions expose an optional **`executable`** plan (allowlisted action + proposed payload).
2. The operator submits an **approval request** (pending).
3. Another step (or the same operator, later) **approves** the request.
4. The operator clicks **Execute now** to run the handler once.
5. **Audit** entries and **monitoring** logs (`[ops-assistant:approval]`) record each step.
6. When supported, **Undo** reverses the internal artifact or attempts a **workflow revert** when transition rules allow.

## What it does **not** do

- No payments, Stripe, payouts, or checkout changes.
- No bookings or guest/host messaging.
- No ads launches/pauses, ranking changes, or live pricing engine updates.
- No outbound customer/broker communication.
- No silent or background execution.

Those remain **suggestion-only** (copy, navigate, operator discretion) outside this allowlist.

## Executable allowlist (strict)

Only these `actionType` values may execute:

| Action | Purpose |
|--------|---------|
| `createInternalReviewTask` | Internal task row pointing at an admin path (review-only intent). |
| `createInternalFollowupTask` | Internal follow-up task with optional note. |
| `createInternalDraft` | Internal draft text record (not published). |
| `addInternalPriorityTag` | Internal tag on a priority for triage. |
| `updatePriorityWorkflowState` | Same transitions as manual execution bridge (`new` → … → `done`). |
| `prefillInternalConfigDraft` | Non-live config draft (does not apply env or DB). |
| `createOperatorReminder` | Internal reminder row (handler exists; wiring from suggestions is optional). |

Anything else **does not execute** through this layer.

## Approval workflow (exact)

1. **Pending** — created via POST `/api/platform/ops-assistant/approval` `{ action: "create", priorityId, suggestionId }` after the server rebuilds the suggestion and confirms `executable`.
2. **Approve** — `{ action: "approve", requestId }` → status **approved** (still not executed). The approval panel asks for an extra browser confirm first (“Nothing happens until you approve.”).
3. **Execute** — `{ action: "execute", requestId }` → handler runs once → **executed** or **failed**. Confirm again in-browser before the API runs.
4. **Deny** — `{ action: "deny", requestId }` → **denied** (terminal).
5. **Undo** — `{ action: "undo", requestId }` only when status is **executed** and undo succeeds → **cancelled** (terminal for this flow).

**Nothing executes at step 1 or 2.** Execution happens only at step 3 after explicit approve.

## Undo workflow (exact)

- **Draft / config draft / task / reminder / tag:** undo archives or discards the stored internal row (best-effort).
- **Workflow:** undo stores `previousPriorityStatus` and attempts **one** reverse transition using the same rules as `platform-improvement-operator-transitions`. If the reverse edge is illegal, undo **fails with an explanation** (status stays **executed**).

## Safety limits

- **FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1** must be on or all mutations return **403**.
- **FEATURE_OPS_ASSISTANT_APPROVAL_KILL_SWITCH** blocks mutations even if execution is on.
- **Admin-only** APIs (same guard pattern as other ops-assistant routes).
- **FEATURE_PLATFORM_IMPROVEMENT_REVIEW_V1** gates the overall platform improvement surface.
- Duplicate **pending** request for the same `suggestionId` is rejected.

## Persistence

- Approval state + internal artifacts + audit tail: optional JSON  
  (`data/ops-assistant-approval-execution.json`, override with `OPS_ASSISTANT_APPROVAL_STATE_JSON_PATH`).
- Workflow transitions still use **platform improvement** state (`platform-improvement-state.json`).

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1` | Enables create / approve / deny / execute / undo APIs. |
| `FEATURE_OPS_ASSISTANT_APPROVAL_PANEL_V1` | Shows the queue UI when combined with execution or alone (see page logic). |
| `FEATURE_OPS_ASSISTANT_APPROVAL_KILL_SWITCH` | Blocks all approval mutations. |

Defaults are **off** (unset env → false).

## Related docs

- `docs/platform/ops-assistant-layer.md` — suggestion/prefill assistant (non-execution defaults).
- `docs/platform/approval-execution-results.md` — evidence / outcomes measurement (no scope expansion).
