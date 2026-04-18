# Broker closing system (V1)

Additive CRM layer to help brokers track follow-up and deal progress after lead capture. **No automatic outbound messaging** — messaging assist remains draft-only.

## Feature flag

| Variable | Default | Effect |
|----------|---------|--------|
| `FEATURE_BROKER_CLOSING_V1` | off | Section hidden; `GET/PATCH /api/broker/closing` returns 404. |
| `FEATURE_BROKER_CLOSING_V1=1` | on | Broker dashboard shows pipeline + follow-up panel; API updates allowed. |

## Lifecycle stages

| Stage | Meaning |
|-------|---------|
| `new` | No outbound logged yet (or reset). |
| `contacted` | Broker reached out. |
| `responded` | Client replied (broker-confirmed or DM `replied` signal). |
| `meeting_scheduled` | Meeting / call scheduled. |
| `negotiation` | Active deal discussion. |
| `closed_won` | Marked won (broker action — not a payment or guaranteed outcome). |
| `closed_lost` | Marked lost. |

Persisted state lives in **`Lead.aiExplanation.brokerClosingV1`** (additive JSON). Pipeline fields **`pipelineStage` / `pipelineStatus`** are synced to canonical CRM values (e.g. `responded` → stored `qualified`).

## Follow-up logic

`buildFollowUpSuggestions` returns **at most three** deterministic suggestions from stage + idle time (e.g. follow-up after ~48h without response, revive after ~72h idle). Copy is advisory — no guarantees.

## Dashboard usage

- **Broker hub** (`/dashboard/broker`): “Closing” section when the flag is on.
- **API**: `GET /api/broker/closing` — summary + items with suggestions and response-speed label.
- **API**: `PATCH /api/broker/closing` — `{ leadId, action: "contacted" | "responded" | "set_stage", stage? }`.

## Messaging assist

Optional fields on `AiMessagingAssistInput`: `closingStage`, `followUpDraftHint` (`first_contact` | `follow_up` | `meeting_push` | `revive_lead`). When **`FEATURE_BROKER_CLOSING_V1`** is on, drafts can follow these hints; sending remains manual.

## Safety guarantees

- Does not change Stripe, bookings, or lead submission flows.
- Does not send messages or fabricate deal outcomes.
- Contact fields (`name`, `email`, `phone`, `message`) are not overwritten by this module.

## Monitoring

In-process counters under **`[broker:closing]`** (contacted, responded, meetings, deals closed). Not durable across restarts.
