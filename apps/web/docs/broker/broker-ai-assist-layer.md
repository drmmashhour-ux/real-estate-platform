# Broker AI Assist layer

**Not autopilot.** Advisory suggestions for **thinking and drafting** — **never** autonomous CRM execution, messaging send, pricing, bookings, or payments. Assist never blurs into execution: brokers trigger every stage change and every send.

## What it does

- **Lead signals** — deterministic labels from closing stage, idle hours, reply signal, score (e.g. cooling momentum, stalled after contact, ready for a meeting push).
- **Assist summary** — up to three **suggestions** (next step, optional risk signal, message angle / objection coaching) plus one **primary recommendation** line.
- **Draft hints** — maps to the same `closingDraftHint` vocabulary as Broker Closing (`first_contact`, `follow_up`, `meeting_push`, `revive_lead`) when messaging assist is enabled; otherwise plain “angle” copy only.
- **Daily assist** — dashboard strip listing pattern-based priorities (follow-up-now, stall risk cohort, opportunities) alongside “Top 3 to close.”

## What it does NOT do

- No auto-send, auto-stage changes, auto-contact, or guaranteed outcomes.
- No fabricated probabilities or fake urgency.
- No payment, booking, or pricing mutations.

## Feature flags

| Variable | Requirement | Effect |
|---------|----------------|--------|
| `FEATURE_BROKER_AI_ASSIST_V1=1` | With **`FEATURE_BROKER_CLOSING_V1=1`** | `GET /api/broker/ai-assist`, Deal Conversion Console “AI assist” block, daily panel |
| `FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1` | Optional | “Open suggested draft” links include `closingDraftHint` for draft priming (**human send only**) |

## APIs

| Route | Purpose |
|-------|---------|
| `GET /api/broker/ai-assist` | Daily prioritization JSON |
| `GET /api/broker/ai-assist?leadId=` | Single-lead assist summary |
| `POST /api/broker/ai-assist/metrics` | Client telemetry (`assist_draft_opened`, `assist_guidance_used`) |

## How signals are generated

Rules use **existing closing state** and **idle hours** (from `lastContactAt` / `createdAt`), same philosophy as next-best-action: thresholds are explicit and repeatable. Severity is advisory, not a statistical forecast.

## Safe use

- Read suggestions as **options**, not orders.
- Always **review and send** messages yourself.
- Use “Use this guidance (copy)” to paste into your own channel or draft tool.

## Monitoring

Server logs and counters use prefix **`[broker:ai-assist]`** (`broker-ai-assist-monitoring.service.ts`). Never throws from monitoring paths.

## Difference from “automation”

| Automation (not this layer) | AI assist (this layer) |
|------------------------------|-------------------------|
| Sends messages or runs workflows | Suggestions and draft angles only |
| Changes CRM fields without a human click | Broker applies stage/contact actions explicitly |
| Optimizes revenue/booking systems | Read-only advisory on lead state |

This layer **never** replaces broker judgment or platform guardrails.
