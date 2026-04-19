# Approval execution results (evidence layer)

This module **measures** how the tiny approval-based execution allowlist behaves in practice. It does **not** enable new actions, broaden scope, or auto-approve anything.

## What is measured

- Counts: requests, approvals, denials, executions, undos, failures, blocked-by-safety (from monitoring).
- Rates: approval rate (among approve/deny intake), execution success rate, undo rate, failure rate.
- Per–action-type rollups for each allowlisted `actionType`.
- **Safety** band: `safe` | `caution` | `unsafe` (audit gaps, undo/failure/block rates, allowlist violations).
- **Usefulness** band: `strong` | `good` | `weak` | `poor` | `insufficient_data`.
- **Decision** label (informational): see below.

Structured operator feedback is **not** collected yet — the summary states that explicitly.

## What counts as safe

Conservative thresholds: low undo and failure rates, limited blocked-by-safety, audit trail not wildly incomplete, no unknown action types. **Unsafe** raises **rollback_candidate** — it does not auto-rollback code; it flags human review.

## What counts as useful

Derived from execution success and undo patterns. Sparse data (`< 5` requests in window) → **`insufficient_data`**. No executions → usefulness **`insufficient_data`**.

## Decision meanings

| Decision | Meaning |
|----------|---------|
| `insufficient_data` | Not enough signal — keep measuring. |
| `keep_current_scope` | No strong reason to change posture — maintain allowlist. |
| `hold` | Mixed signals — keep scope; improve guidance. |
| `rollback_candidate` | Safety or undo signals are bad — treat scope as suspect until humans review. |
| `eligible_for_future_review` | Healthy enough **later** to discuss scope in a meeting — **does not activate** anything. |

## Expansion lock (policy)

`APPROVAL_EXECUTION_EXPANSION_LOCKED` is **`true`**: **no new executable actions** may be added until humans review outcomes. The admin UI shows:

**Further execution expansion is locked pending results review.**

This is independent of any “eligible_for_future_review” label.

## Monitoring

Logs: **`[ops-assistant:approval-results]`** when a summary is computed (never throws).

## Where it appears

`/admin/platform-improvement` — **Approval execution — results** panel when approval execution/panel flags are on (same visibility as the approval queue).

## Why nothing expands automatically

All outputs are **read-only analytics**. Feature flags and allowlists change only through **explicit engineering + operator policy**, not through this panel.
