# Broker closing system (V1)

Additive CRM layer to help brokers track follow-up and deal progress after lead capture. **No automatic outbound messaging** — messaging assist remains draft-only.

## Feature flag

| Variable | Default | Effect |
|----------|---------|--------|
| `FEATURE_BROKER_CLOSING_V1` | off | Section hidden; `GET/PATCH /api/broker/closing` returns 404. |
| `FEATURE_BROKER_CLOSING_V1=1` | on | Broker dashboard shows pipeline, daily strip, top 3 focus list, next-best-action hints, follow-up panel; API updates allowed. |

Optional: **`FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1`** — when on, “Open draft context” links include `closingDraftHint` so messaging assist can prime draft copy (**human send only**).

## Lifecycle stages

| Stage | Meaning |
|-------|---------|
| `new` | No outbound logged yet (or reset). |
| `contacted` | Broker reached out. |
| `responded` | Client replied (**broker-confirmed** and/or DM `replied` signal — see below). |
| `meeting_scheduled` | Meeting / call scheduled. |
| `negotiation` | Active deal discussion. |
| `closed_won` | Marked won (**broker action** — not a payment or guaranteed outcome). |
| `closed_lost` | Marked lost. |

Persisted state lives in **`Lead.aiExplanation.brokerClosingV1`** (additive JSON). Pipeline fields **`pipelineStage` / `pipelineStatus`** sync to canonical CRM values (e.g. `responded` → stored `qualified`).

### What “responded” means

- **`responseReceived` in broker closing JSON** — set when you use **Mark responded** or equivalent stage move.
- **DM / inbox signal** — when `dmStatus === "replied"`, we treat **`responseReceived` as true** for hints. The platform **does not verify** SMS/email delivery or read receipts.

## Next best action (deterministic)

`computeNextBestAction` returns **one** primary hint per lead: `actionType`, `actionLabel`, `urgency`, `reason`, optional `followUpDraftHint` (`first_contact` | `follow_up` | `meeting_push` | `revive_lead`). Logic uses **stage**, **idle hours** (from `lastContactAt` or `createdAt`), and **follow-up suggestion** alignment. **Advisory only** — no outcome promises.

Priority examples: `new` → first outreach; long idle → review / revive; `contacted` without reply → follow-up cadence; `responded` → push meeting / next step; terminal → no routine nudge.

## Daily broker workflow (UI)

1. **Daily strip** — counts: needs attention (high urgency or new), overdue follow-ups (contacted & no reply 48h+), responded idle 24h+, high-score focus (score ≥ 70 & non-low urgency). **Counts are heuristic**, not verified sends.
2. **Top 3 to move today** — max three **non-terminal** leads: sort by **urgency**, then **score**, then **lead id** (deterministic).
3. **Pipeline cards** — show **next action**, **urgency badge**, **why now**, quick buttons (**Mark contacted / responded**, **Open draft context** / **Go to lead**, **Mark lost** via stage).
4. **Follow-up panel** — ranked suggestions with **Go to lead** / **Open draft context** links.

## Deal Conversion Console

When **`FEATURE_BROKER_CLOSING_V1`** is on, the broker hub (`/dashboard/broker`) renders **`BrokerDealConversionConsole`** — a single **decision + orchestration** surface (no new backend workflows; same `GET/PATCH /api/broker/closing`).

### What it is

- **Daily Command** (top strip): clickable buckets (needs action today, overdue follow-ups, responded waiting next step) plus **Top 3 to close today**, and **Start closing session** (guided focus only — **no auto-send**, no automated stage changes).
- **Pipeline (left, compact)**: same lead/stage model as before; **highlights** show **top 3**, **urgent** (high next-action urgency), and **stuck** (idle ≥ 72h, non-terminal).
- **Focus panel (right)**: selected lead — **Next best action** (label, urgency, reason), momentum hints (e.g. cooling down, hot lead), days since last contact, explicit actions (**Open message draft**, **Mark contacted**, **Mark responded**, **Move stage**, **Mark meeting**, **Mark lost**). Each action **PATCH**es state like the prior closing UI; nothing sends messages automatically.
- **Conversion insights** (bottom): short, deterministic notes (where stages cluster, follow-up delays, simple recommendations).

### How brokers should use it

1. Open the broker dashboard and scan the **Daily Command** strip — numbers show where attention is needed **today**.
2. Click a bucket or a **Top 3** chip to **focus** that lead (pipeline selection stays in sync).
3. Read **Next best action**, then use **Open message draft** (draft-only; optional `closingDraftHint` when messaging assist is on) or **Mark contacted / responded / stage** as appropriate.
4. Optionally tap **Start closing session** to walk the **Top 3** queue in order; after each successful action the console can advance focus — **you** still confirm every step.

### Daily workflow (recommended)

| Step | Action |
|------|--------|
| Morning | Review strip counts → open **Top 3** or highest-urgency bucket first. |
| Per lead | Focus lead → execute **Next best action** → log outcome with explicit buttons. |
| Drafts | Use **Open draft**; send **manually** from your channel — same as closing V1. |
| Optional | **Closing session** for a focused pass through prioritized leads without automation. |

Telemetry for the console uses **`POST /api/broker/closing/metrics`** with events such as `conversion_console_opened`, `conversion_focus_lead`, `conversion_next_action_executed`, `conversion_draft_opened`, `conversion_session_started`, `conversion_session_completed` — logs prefixed **`[broker:conversion-console]`** (see Monitoring below).

## Follow-up drafts (safe)

- Links may include **`?closingDraftHint=…`** — lead page scrolls to the sales assistant block (`#broker-closing-draft-anchor`). **No auto-send**; broker copies/sends manually.
- **`POST /api/broker/closing/metrics`** `{ event: "followup_draft_opened" }` logs **`[broker:closing] followup_draft_opened`** (best-effort).

## Follow-up suggestion logic

`buildFollowUpSuggestions` returns **at most three** deterministic suggestions from stage + idle time (e.g. follow-up after ~48h without response, revive after ~72h idle). Copy is advisory — no guarantees.

## Dashboard usage

- **Broker hub** (`/dashboard/broker`): “Closing” section when the flag is on.
- **API**: `GET /api/broker/closing` — summary (with **insights**: concentration + follow-up debt wording), items with **nextAction**, **dailyStrip**, **topThreeToClose**, **messagingAssistEnabled**.
- **API**: `PATCH /api/broker/closing` — `{ leadId, action: "contacted" | "responded" | "set_stage", stage? }`.
- **API**: `POST /api/broker/closing/metrics` — `{ event: "followup_draft_opened" }` (telemetry).

## State transition guards

- **Mark contacted** — no-op (success, no duplicate pipeline churn) if stage is already **contacted** or later.
- **Mark responded** — no-op if stage is already **responded** or later.
- Monitoring **quick actions** increment only when a write actually applied.

## Messaging assist integration

Optional fields on autopilot messaging input: `closingStage`, `followUpDraftHint` (`first_contact` | `follow_up` | `meeting_push` | `revive_lead`). When **`FEATURE_BROKER_CLOSING_V1`** is on, drafts can follow URL hints; **sending stays manual**.

## Safety guarantees

- Does not change Stripe, bookings, or lead submission flows.
- Does not send messages or fabricate deal outcomes.
- Contact fields (`name`, `email`, `phone`, `message`) are not overwritten by this module.

## Monitoring

In-process counters and logs under **`[broker:closing]`**: `lead_contacted`, `lead_responded`, `meeting_scheduled`, `deal_closed`, `followups_generated`, `next_actions_computed`, `quick_action`, `followup_draft_opened`, `top_three_generated`. **Never throws** from monitoring. Not durable across restarts.

Deal Conversion Console (additional prefix **`[broker:conversion-console]`**): `console_opened`, `focus_lead`, `next_action_executed`, `draft_opened`, `session_started`, `session_completed`. Same constraints — best-effort, in-process.
