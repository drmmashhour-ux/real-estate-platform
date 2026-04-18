# AI Autopilot — Internal follow-up workflow (V8 safe)

## Purpose

Help operators **prioritize CRM leads for internal follow-up** using deterministic rules. This workflow updates **internal metadata only** (`Lead.aiExplanation.aiFollowUp`) and optional `aiLastUpdated` / `aiExecutionVersion`. It does **not** message users automatically.

## Follow-up states

Stored under `Lead.aiExplanation.aiFollowUp` (version `v1`):

- **new** — recently captured; no urgent signal yet.
- **queued** — should be worked when capacity allows (e.g. low-info leads).
- **due_now** — internal attention suggested now (e.g. high AI priority + recent + not recently handled, or `needs_followup` + aging).
- **waiting** — recently handled internally, snoozed, or otherwise deferred.
- **done** — operator marked complete in admin (sticky until changed).

## Queue scoring model

`queueScore` is **0–100**, deterministic, derived from:

- Autopilot `aiScore` (fallback 50)
- Recency (e.g. bonus if &lt; 48h old)
- Tags: `needs_followup`, `high_intent`, `low_info`
- Message/phone completeness (lightweight heuristics)

`buildFollowUpQueue` sorts **descending** by `queueScore`.

## What the workflow does

- When `FEATURE_AI_AUTOPILOT_FOLLOWUP_V1` is on, **controlled leads autopilot execution** (approved `ap-leads-*` actions) runs `executeFollowUpWorkflow` after scoring/messaging layers, merging follow-up snapshots into `aiExplanation`.
- When `FEATURE_AI_AUTOPILOT_FOLLOWUP_QUEUE_V1` is on, the **Early users / CRM** admin section can show a sorted **Follow-Up Queue** and **Due now** panel (computed with the same rules).
- When `FEATURE_AI_AUTOPILOT_FOLLOWUP_REMINDERS_V1` is on, internal **`nextActionAt`** / **`reminderReason`** fields may be populated (still not sent externally).

Optional admin actions (metadata only): **Mark done**, **Snooze 24h**, **Re-queue** via `POST /api/admin/autopilot/followup/action`.

## What it does NOT do

- Does **not** send email, SMS, WhatsApp, or any outbound message.
- Does **not** change payments, bookings, ads, CRO, or ranking.
- Does **not** overwrite the lead’s original **message** or contact fields.
- Does **not** bypass autopilot **approval** — execution stays inside the existing controlled path for `ap-leads-*` actions.

## Admin usage

1. Set env flags (default off): `FEATURE_AI_AUTOPILOT_FOLLOWUP_V1`, optionally `FEATURE_AI_AUTOPILOT_FOLLOWUP_QUEUE_V1`, `FEATURE_AI_AUTOPILOT_FOLLOWUP_REMINDERS_V1`.
2. Run approved leads autopilot execution as today.
3. Open **Admin → Early users** and review **Due now** / **Follow-Up Queue** (internal copy only).

## Safety guarantees

- Additive JSON merge into `aiExplanation`; sibling keys (e.g. messaging assist) are preserved when merging correctly.
- Reversible by editing/clearing `aiExplanation.aiFollowUp` or using admin actions.
- Logs use the `[autopilot:followup]` prefix — no “sent” events.

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/ai-autopilot-followup.test.ts
pnpm exec vitest run modules/growth/__tests__/ai-autopilot-messaging-assist.test.ts
pnpm exec vitest run modules/growth/__tests__/ai-autopilot-controlled-execution.test.ts
```

Full `tsc` for the whole app may OOM in large workspaces; run targeted checks when needed.

---

**Internal workflow only** — humans choose how and when to contact leads outside this system.
