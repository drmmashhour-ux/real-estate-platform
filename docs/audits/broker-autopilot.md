# LECIPM broker autopilot — audit notes

## Purpose

Assistive autopilot for listing-inquiry CRM: surface hot leads, follow-ups due, and suggested next actions; generate editable AI drafts; **never** auto-send in MVP. Brokers approve, edit, and send via the existing thread composer.

## Schema (Prisma)

Models use the `lecipmBroker*` namespace (see `apps/web` Prisma schema and migrations), including:

- **`lecipmBrokerAutopilotSetting`** — per-broker mode, toggles, optional `pauseUntil`.
- **`lecipmBrokerAutopilotAction`** — `actionType`, `status`, `title`, `reason`, optional `draftMessage`, `scheduledFor`, `snoozedUntil`, links to `leadId` / optional `threadId`.
- **`lecipmBrokerDailyBriefing`** — one row per broker per UTC calendar day: `summary`, counts, `topActionsJson`.

Enums align with product modes: `off`, `assist`, `safe_autopilot`, `approval_required`; action types include `follow_up_due`, `reply_now`, `schedule_visit`, `mark_qualified`, `reengage_lead`, `close_lost`; statuses `suggested` → `approved` / `queued` → `executed` (or `dismissed`).

## Modes

| Mode | Behavior (MVP) |
|------|----------------|
| `off` | Scan skips creating new suggestions (settings still readable). |
| `assist` | Default; rule engine + optional AI drafts for suggestions. |
| `safe_autopilot` | Same as assist for MVP — no unsupervised sends. |
| `approval_required` | Emphasizes approval-first; still no auto-send. |

`pauseUntil` blocks scanning until that instant passes.

## Scan logic

`scan-leads` loads broker settings, respects mode/pause, loads active CRM leads, runs **rule engine** (`rules.ts`, `detect-hot-leads`, `detect-followups-due`), and upserts **`BrokerAutopilotAction`** rows with dedupe (`action-dedupe.ts`): same lead + action type + reason bucket within a window; respects open actions and recent dismissals unless lead activity meaningfully changes.

## AI safety

- Prompts instruct the model **not** to invent listing facts or pricing; inputs are thread text + non-speculative listing labels/codes where available.
- Responses are labeled `aiGenerated` / `aiGeneratedDraft` in API JSON where applicable.
- **No** auto-send: execution path only **prepares** `draftMessage` and thread ids for the composer; broker sends through `POST /api/broker-crm/leads/[id]/send-message`.
- Optional `autopilotActionId` on send marks the action executed via `complete-action-after-send` when the broker actually sends.

## Approval workflow

1. Action created with `status: suggested` (optional `draftMessage` if settings allow).
2. Broker **Approve** → `approved`.
3. Broker **Execute** (API) → returns `{ leadId, threadId, draftMessage }`, sets `queued` (composer prep).
4. Broker edits and **Send** on lead detail; include `autopilotActionId` so the action can move to `executed` and analytics fire.

**CRM ↔ Autopilot handoff:** approving from the dashboard and choosing **Open in CRM** stores `sessionStorage` key `lecipm_autopilot_reply_prefill` (`leadId`, `draft`, `actionId`); lead detail reads it once and prefills the reply box, passing `autopilotActionId` on send.

## APIs (summary)

| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/broker-autopilot/settings` | Broker settings |
| POST | `/api/broker-autopilot/scan` | Run scan |
| GET | `/api/broker-autopilot/summary` | Dashboard KPIs + counts |
| GET | `/api/broker-autopilot/actions` | Open action queue |
| POST | `/api/broker-autopilot/actions/[id]/approve` | Approve |
| POST | `/api/broker-autopilot/actions/[id]/dismiss` | Dismiss |
| POST | `/api/broker-autopilot/actions/[id]/snooze` | Snooze |
| POST | `/api/broker-autopilot/actions/[id]/execute` | Prepare draft (no send) |
| GET/POST | `/api/broker-autopilot/daily-briefing` | Read or regenerate briefing |
| GET | `/api/broker-autopilot/leads/[id]/snapshot` | Lead autopilot snapshot |
| POST | `/api/broker-autopilot/leads/[id]/followup-draft` | AI follow-up draft |
| POST | `/api/broker-autopilot/leads/[id]/next-action` | AI next best action |

Authorization: `api-auth` + broker scope; admin may inspect where implemented.

## Analytics

`trackBrokerAutopilot` wraps `trackEvent` for: scan runs, suggestions created, approve/dismiss/execute, drafts generated, etc. (see call sites under `lib/broker-autopilot/`). Pair with CRM events (`broker_crm_*`) for end-to-end funnel analysis.

## UI

- **Dashboard:** `/dashboard/crm/autopilot` — priorities, suggested actions, daily briefing, settings, scan + regenerate briefing.
- **CRM home:** strip with suggested-action count, follow-ups due today, link to Autopilot.
- **Lead detail:** Autopilot card (heat, follow-up flags, open actions, AI draft / next action).

## Daily digest email (future)

`dailyDigestEnabled` gates briefing content generation; a future worker could email the same payload. No provider wiring in MVP — **integration point:** persist briefing row + optional notification outbox later.

## Future expansion

- Deeper calendar integration for `schedule_visit`.
- Stronger “meaningful activity” signals for re-surfacing dismissed items.
- Optional auto-send behind explicit broker opt-in and compliance review.
- Per-team templates and tone profiles for drafts.
