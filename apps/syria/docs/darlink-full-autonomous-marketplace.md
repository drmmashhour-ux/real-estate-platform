# Darlink full autonomous marketplace (safety-bounded)

## Positioning

This is a **policy-governed, deterministic, auditable** marketplace operating layer for the **apps/syria (Darlink)** product lane. It is **not** uncontrolled AI autonomy: there is no black-box learning, no LLM policy, and no outbound messaging, auto-capture, or auto-payout in this phase.

**All live execution is local to `apps/syria` + Syria `syria_*` tables.** `apps/web` is not a write path.

## Architecture (strict order)

1. **Data** — `buildMarketplaceSnapshot` (read-only Prisma aggregates)
2. **Signals** — fixed-order detector registry
3. **Opportunities** — deterministic signal → opportunity map
4. **Policy** — `evaluateMarketplacePolicy` (fraud, friction, payout stress, etc.)
5. **Governance** — `resolveMarketplaceGovernance` (env + `SYRIA_AUTONOMY_MODE` mapping)
6. **Proposals** — `buildMarketplaceActionProposals` (no side effects)
7. **Execution gate** — `evaluateMarketplaceExecutionGate` (dryRun, approvals, risk)
8. **Execution** — `executeDarlinkMarketplaceAction` (single-step Prisma writes)
9. **Verification** — `verifyMarketplaceActionOutcome` (read-back)
10. **Feedback** — `buildMarketplaceOutcomeFeedback` (optional persist on full runs)
11. **Optimization notes** — `buildMarketplaceOptimizationSummary` (recommendation-only)

## Feature flags (env)

| Variable | Default | Role |
|----------|---------|------|
| `DARLINK_AUTONOMY_ENABLED` | `false` | Master switch; when `false`, policy hard-blocks sensitive actions. |
| `DARLINK_AUTONOMY_APPROVALS_ENABLED` | `true` | Queue for approval before auto-execution. |
| `DARLINK_AUTONOMY_AUTO_EXECUTE_ENABLED` | `false` | When `true` (and governance allows), low-risk internal actions may run. |
| `DARLINK_AUTONOMY_OPTIMIZATION_ENABLED` | `false` | Exposes extra optimization / adjustment recommendations. |

`SYRIA_AUTONOMY_MODE` still maps: `ASSIST` → recommend-only, `SAFE_AUTOPILOT` → safe internal auto, `OFF` → off.

## Supported V1 action types

- `FLAG_LISTING_REVIEW` — move `PUBLISHED` → `PENDING_REVIEW` (moderation).
- `CREATE_INTERNAL_TASK` / `ADD_INTERNAL_NOTE` — audit log entries (no user messaging).
- `APPROVE_LISTING` / `REJECT_LISTING` — from `PENDING_REVIEW` / valid state.
- `MARK_BOOKING_GUEST_PAID` — host/guest payment verification path (fraud-gated).
- `RECORD_CHECKIN` — set `checkedInAt` (reversible in rollback helper).
- `APPROVE_PAYOUT` / `MARK_PAYOUT_PAID` — fraud- and state-gated.

## Approvals, verification, rollback

- **Approvals** — `syria_marketplace_autonomy_approvals` with idempotent `proposalKey`.
- **Verification** — read-back of property / booking / payout after action.
- **Rollback** — only safe steps (e.g. clear `checkedInAt`); other actions return `non_reversible`.

## Feedback and optimization

- **Feedback** — ratio hints from growth + listing inquiry counts; optional `syria_marketplace_outcome_feedback_rollups` when `persist: true` on runs.
- **Adjustments** — `buildAutonomyAdjustmentRecommendations` is **recommendation text only**; no auto-apply.

## Admin and API

- **UI** — `/admin/autonomy` embeds the full panel when `DARLINK_AUTONOMY_ENABLED=true`. Listings / bookings / payouts show a link strip to the same page.
- **JSON** — `GET /api/admin/autonomy/summary`, `POST /api/admin/autonomy/run` (default `dryRun: true`), `GET`/`POST` approval routes.

## Database

New tables: `syria_marketplace_autonomy_runs`, `…_approvals`, `…_audit_logs`, `…_action_records`, `…_outcome_feedback_rollups`.  
Apply with `pnpm prisma:migrate` or `pnpm prisma:push` in `apps/syria` after updating `DATABASE_URL`.

## Intentionally unsupported in this phase

- Outbound marketing or guest messaging.
- Auto payment capture, auto host payout, public auto-publish.
- Irreversible financial mutation without later phase + explicit contract.
- Cross-app execution or write from `apps/web`.

## Next phase (suggested)

- Wire approval → re-run orchestrator with `approvalOverrides` for explicit proposal ids.
- Richer entity targeting for payout/booking proposals (per-id opportunities).
- Metrics export for audit dashboards and SLO alerts.
