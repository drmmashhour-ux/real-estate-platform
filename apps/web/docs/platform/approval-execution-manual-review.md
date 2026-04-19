# Approval execution — manual governance review

Internal operators/admins review **measured** approval-execution outcomes (evidence from `approval-execution-results`) and record an **explicit** human decision **before** any future scope change is even considered.

This layer does **not** add executable actions, widen the allowlist, or turn on autonomy. Measured labels such as `eligible_for_future_review` remain **non-activating**.

## What gets reviewed

For each **allowlisted** executable action type, the system maintains a **governance row** keyed as `rev_<actionType>`:

- **Evidence**: request / approval / execution / undo / failure counts from the latest outcome summary window.
- **Measured decision**: overall `ApprovalExecutionDecision` from the measurement engine (context for operators).
- **Safety / usefulness**: snapshot strings from the same summary.
- **Human fields**: operator-chosen decision, notes, reviewer id, timestamp.

Pending rows are created or refreshed when outcomes are synced (`createPendingReview` / `syncPendingReviewsFromOutcomeSummary`). Already-reviewed rows are **not** overwritten by later syncs.

## Who reviews

Users who can reach the internal **Platform improvement** admin surface and pass **admin** checks on the governance API (`/api/platform/ops-assistant/governance/review`). Submitting decisions requires the same visibility as the approval execution feature flags.

## Decision meanings (human → stored status)

| Operator action | Stored `reviewedDecision` | Status |
| --- | --- | --- |
| Keep current scope | `keep` | `reviewed_keep` |
| Hold | `hold` | `reviewed_hold` |
| Roll back | `rollback` | `reviewed_rollback` |
| Eligible for future review | `future_review` | `reviewed_future_review` |

### Keep (`reviewed_keep`)

Maintain the **current** execution allowlist and behaviour. **No** expansion unlocked. Signals “we accept today’s posture.”

### Hold (`reviewed_hold`)

Maintain the **current** scope; pause on expansion and ask for **more evidence** or process work before revisiting.

### Rollback (`reviewed_rollback`)

Marks governance posture as **rollback** — the store sets `governanceRollbackActive`. Operators should treat the current scope as a **rollback candidate**, use kill switches / policy as configured, and **retain audit history** (nothing is deleted).

### Eligible for future review (`reviewed_future_review`)

**Does not activate anything.** It only records that **at least one** action row is healthy enough for a **future organisational** conversation. It must be combined with full manual review of **all** allowlisted rows before the “consideration path” flag can clear (see below).

## Why `eligible_for_future_review` does not activate anything

Measured `eligible_for_future_review` is a **label** from the outcome engine. The human button **Eligible for future review** is a **governance note** that a row may be revisited later. Neither:

- widens `APPROVAL_EXECUTABLE_ACTION_KINDS`,
- disables `APPROVAL_EXECUTION_EXPANSION_LOCKED`,
- nor auto-promotes scope.

Shipping new executable kinds remains a **separate explicit code change**.

## Future scope / expansion lock

`evaluateApprovalExecutionFutureExpansionGate()` (and the UI summary `expansionConsiderationPathCleared`) encodes policy:

1. **Results must exist** (measurement present).
2. **Every** allowlisted action type must have a **non-pending** review row.
3. **At least one** row must be **`reviewed_future_review`** for the consideration path to read as “cleared.”

Even when cleared, **`APPROVAL_EXECUTION_EXPANSION_LOCKED`** remains **true** in code until an intentional release changes it — the gate only means “governance prerequisites for a future discussion were met,” not “ship new actions.”

If **rollback** was chosen on any row, `governanceRollbackActive` stays true and the gate **blocks** future scope workflows until posture is resolved.

### User-facing copy

- “Future scope review locked until manual governance review is complete.”
- “No automatic promotion from eligible_for_future_review or any review label — engineering policy only.”

## Persistence

Optional path override: **`APPROVAL_GOVERNANCE_JSON_PATH`** (see `.env.example`). Default: `data/approval-execution-governance.json` under the app cwd.

## Monitoring

`approval-execution-review-monitoring.service.ts` logs with prefix **`[ops-assistant:review]`** (pending sync, completed decisions, rollback flag). It **never throws**.

## Related docs

- `approval-execution-results.md` — measurement and aggregate decisions.
- `approval-based-execution-layer.md` — execution and allowlist boundaries.
