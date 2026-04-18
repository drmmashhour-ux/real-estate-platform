# AI Autopilot — controlled execution (limited, V8 safe)

**Status:** Operational documentation. **Not legal advice.**

## What can execute (whitelist only)

Real side effects are limited to:

- **Lead timeline** — append `LeadTimelineEvent` rows with event types `ai_autopilot.safe.handled` and `ai_autopilot.safe.followup` (internal audit / CRM signal).
- **Internal launch flags** — update `Lead.launchSalesContacted` and `Lead.launchLastContactDate` (internal sales tracking fields; reversible).

No Stripe, bookings, checkout, listings publish, ads spend, CRO page edits, ranking, Brain weights, or legal flows are touched by this module.

## What cannot execute

- Payments, refunds, credits  
- Booking or reservation changes  
- Listing create/delete/publish automation  
- Ad spend or campaign mutations  
- Ranking or recommendation weights  
- External messaging (email/SMS/WhatsApp)  
- Any action not listed in `allowedActionTypes` (`ai-autopilot-execution-policy.ts`)

## Approval requirements

All of the following must hold for a real DB change:

1. `FEATURE_AI_AUTOPILOT_V1=1`  
2. `FEATURE_AI_AUTOPILOT_EXECUTION_V1=1`  
3. Human **Approve** for that action id (in-memory approval store)  
4. `isSafeExecutableAutopilotAction()` passes (whitelist + target + domain)  
5. Not already executed (duplicate guard)  
6. Bounded batch: at most **`maxActionsPerRun`** successful executions per button press  

## Rollback model

- `FEATURE_AI_AUTOPILOT_ROLLBACK_V1=1` exposes **Rollback** in the Growth machine panel for **reversible** rows that reached **executed**.  
- Timeline events: **delete** stored event ids.  
- Launch flags: restore previous `launchSalesContacted` / `launchLastContactDate` from the execution snapshot.

## Monitoring / audit

- Structured logs: `[ai:autopilot:execution]` via `logInfo` (includes run id, action ids, outcomes).  
- In-process counters via `ai-autopilot-execution-monitoring.service.ts` (per server instance; not durable across restarts).

## Safety guarantees

- No auto-execution without approval.  
- Advisory snapshot actions (no `actionType`) are **never** executed as real writes.  
- Execution is capped per run.  
- Failures on one action do not abort the whole batch (each row is isolated in try/catch).

## How to disable immediately

- Unset or set to `0` / `false`:  
  - `FEATURE_AI_AUTOPILOT_V1`  
  - `FEATURE_AI_AUTOPILOT_EXECUTION_V1`  
  - `FEATURE_AI_AUTOPILOT_ROLLBACK_V1` (rollback only)  
- Restart deploy to clear in-memory approval/execution maps (serverless: instance-bound).

## Validation commands (repo)

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/ai-autopilot-controlled-execution.test.ts
cd apps/web && pnpm exec eslint modules/growth/ai-autopilot*.ts app/api/growth/ai-autopilot/**/*.ts
```

Full `tsc` may require large heap in this monorepo; run targeted checks when possible.

## Important

This is **limited execution only**. It does **not** move money or perform user-facing irreversible CRM commitments beyond the narrow fields above. Expand the whitelist only with product + counsel review.
