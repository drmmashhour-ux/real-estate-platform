# AI-assisted broker CRM (LECIPM)

This document describes the **implemented** AI-assisted CRM layer: physical schema, flows, APIs, AI safety, dashboard, analytics, and extension points.

## Schema (Postgres / Prisma)

The product spec may refer to generic models (`BrokerLead`, `broker_leads`). In this codebase the canonical tables are:

| Concept | Prisma model | Table (migration) |
|--------|----------------|---------------------|
| Lead | `LecipmBrokerCrmLead` | `lecipm_broker_crm_leads` |
| Note | `LecipmBrokerCrmLeadNote` | `lecipm_broker_crm_lead_notes` |
| Tag | `LecipmBrokerCrmLeadTag` | `lecipm_broker_crm_lead_tags` |
| AI insight row | `LecipmBrokerCrmAiInsight` | `lecipm_broker_crm_ai_insights` |

Enums align with the spec: `LecipmBrokerCrmLeadStatus`, `LecipmBrokerCrmPriorityLabel`, `LecipmBrokerCrmLeadSource`.

**Thread link:** each lead may reference `threadId` → `lecipm_broker_listing_threads` (broker messaging). **One primary lead per thread** is created in `createBrokerCrmLeadForNewThread` inside the messaging transaction (`lib/messages/create-thread.ts`).

## Lead creation flow

When a **`LecipmBrokerListingThread`** is created from:

- `listing_contact`
- `broker_profile`
- `general_inquiry`

…the transaction calls **`createBrokerCrmLeadForNewThread`** (`lib/broker-crm/create-lead-from-thread.ts`), sets `status: new`, maps source, copies guest/customer identity, then **`scheduleScoreNewLead`** (rule-based score + `broker_crm_lead_created` analytics).

CRM listing contact via **`POST /api/buyer/contact-listing`** also creates a messaging thread + lead when a broker can be resolved (see `docs/audits/broker-messaging.md`).

## Service layer (`apps/web/lib/broker-crm/`)

| Module | Purpose |
|--------|---------|
| `create-lead-from-thread.ts` | Maps thread source → CRM source; creates lead row. |
| `list-leads.ts` | Broker-scoped list + KPIs + filters (including follow-ups **due today or overdue** for `followup_due`). |
| `get-lead.ts` | Detail for API + AI (thread messages, listing, notes, tags, latest insight). |
| `update-lead-status.ts` | Status transitions + analytics (`contacted`, `qualified`, `closed`, etc.). |
| `set-follow-up.ts` | `nextFollowUpAt` + `broker_crm_follow_up_set`. |
| `add-note.ts` | Broker notes. |
| `add-tag.ts` | Tags. |
| `score-lead.ts` | **Rule-based** priority (intent / visit / multi-message / recency / unread-without-reply) → `priorityScore` + `priorityLabel`; emits `broker_crm_priority_scored`. |
| `generate-ai-summary.ts` | OpenAI JSON summary + scores merged into insight row. |
| `generate-ai-reply.ts` | Draft reply (stored as suggested reply; **never auto-sent**). |
| `generate-next-action.ts` | Next-best-action string. |
| `ai-merge-insight.ts` | Upsert/merge AI fields on `lecipm_broker_crm_ai_insights`. |
| `validators.ts` | Input validation for APIs. |
| `access.ts` | Broker vs admin scope for leads. |
| `api-auth.ts` | API session helper. |
| `analytics.ts` | `trackBrokerCrm` → product analytics. |

## Priority scoring (rule-based)

Bands (see `score-lead.ts`):

- **0–29** → `low`
- **30–59** → `medium`
- **60+** → `high`

Signals include strong-intent phrases, visit/callback language, multiple inbound messages, activity within 24h, unread inbound before any broker reply. Recalculate via UI **Recalculate priority** or API `POST .../score`.

## AI integration

- **Provider:** `gpt-4o-mini` via `@/lib/ai/openai` when configured; safe fallbacks when not.
- **Summaries / reply / next action:** prompts require **no invented property facts, price, or legal claims**; JSON outputs merged into insight rows.
- **Human-in-the-loop:** AI reply appears in an **editable** textarea; sending goes through **`POST /api/broker-crm/leads/[id]/send-message`**, which calls **`sendLecipmBrokerMessage`** (same as manual broker send). `fromAiDraft: true` sets analytics `broker_crm_ai_reply_sent`.

## API routes (`/api/broker-crm/leads`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/broker-crm/leads` | List + KPIs (`?filter=`) |
| `GET` | `/api/broker-crm/leads/[id]` | Lead detail |
| `POST` | `.../status` | Update status |
| `POST` | `.../follow-up` | Set follow-up datetime |
| `POST` | `.../notes` | Add note |
| `POST` | `.../tags` | Add tag |
| `POST` | `.../score` | Recalculate priority |
| `POST` | `.../ai-summary` | Generate summary |
| `POST` | `.../ai-reply` | Generate reply draft |
| `POST` | `.../next-action` | Generate next action |
| `POST` | `.../send-message` | Send broker message on linked thread |

Authorization: **`requireBrokerCrmApiUser`** — broker sees own leads; admin scope per `access.ts`.

## Dashboard UI

- **Home:** `/dashboard/crm` — KPI cards, filters, **table** and **pipeline** views (`BrokerCrmHomeClient`).
- **Detail:** `/dashboard/crm/[id]` — AI insight, conversation, editable reply + **Send message**, follow-up, notes, tags, recalculate priority (`BrokerCrmLeadDetailClient`).

Hub navigation includes **Inquiry CRM (AI)** → `/dashboard/crm`.

## Analytics events (non-exhaustive)

Recorded via `trackBrokerCrm` / `trackEvent`:

- `broker_crm_lead_created`
- `broker_crm_status_changed`
- `broker_crm_lead_marked_contacted` (status set to `contacted`)
- `broker_crm_lead_qualified` / `broker_crm_lead_closed`
- `broker_crm_ai_summary_generated` / `broker_crm_ai_reply_generated` / `broker_crm_next_action_generated`
- `broker_crm_priority_scored`
- `broker_crm_follow_up_set`
- `broker_crm_note_added`
- `broker_crm_message_sent` / `broker_crm_ai_reply_sent`

Use these to measure AI-assisted response speed and funnel movement.

## AI safety rules (enforced in prompts + product)

1. Do not invent listing facts, price, taxes, inclusions, or legal outcomes.
2. AI outputs are **editable** and **never auto-sent** as messages.
3. Brokers remain responsible for compliance with licence and brokerage rules.

## Future improvements

- Deduplicate leads per `(threadId)` if policy changes.
- Optional ML layer on top of rule-based score.
- Email reminders for follow-ups (in-app KPI already highlights due/overdue in list).
- Deeper autopilot integration (`autopilotActionId` on send-message route).

## QA checklist

- [ ] New messaging thread creates CRM lead + initial score.
- [ ] `/dashboard/crm` lists leads; filters and KPIs match expectations.
- [ ] Lead detail: AI summary / reply / next action generate; reply is editable.
- [ ] Send message posts to real thread only after broker confirms.
- [ ] Broker cannot open another broker’s lead ID.
- [ ] Mobile: table scrolls horizontally; pipeline view usable.
