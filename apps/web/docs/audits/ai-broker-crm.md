# AI-assisted broker inquiry CRM (LECIPM)

## Naming

This feature uses **`LecipmBrokerCrmLead`** and table `lecipm_broker_crm_leads` so it does **not** collide with the existing billing/CRM model **`BrokerLead`** mapped to `broker_leads`.

## Schema

- **Enums:** `LecipmBrokerCrmLeadStatus`, `LecipmBrokerCrmPriorityLabel`, `LecipmBrokerCrmLeadSource`
- **Models:** `LecipmBrokerCrmLead`, `LecipmBrokerCrmLeadNote`, `LecipmBrokerCrmLeadTag`, `LecipmBrokerCrmAiInsight`
- **Relation:** optional 1:1 `threadId` → `LecipmBrokerListingThread` (one CRM lead per inquiry thread in MVP)

## Lead creation

On every new `LecipmBrokerListingThread` (listing contact, broker profile, general inquiry), `create-thread` creates a **`LecipmBrokerCrmLead`** in the same transaction and schedules **rule-based scoring**.

## Priority scoring

Implemented in `lib/broker-crm/score-lead.ts` (deterministic, recalculable):

- Intent / visit / callback phrase bonuses  
- Multiple inbound messages  
- Activity in last 24h  
- Unread inbound when the broker has not replied yet  

Labels: **low** (0–29), **medium** (30–59), **high** (60+).

## AI

- Uses **`gpt-4o-mini`** via `lib/ai/openai.ts` when `OPENAI_API_KEY` is set.
- If OpenAI is off, **safe deterministic fallbacks** are returned (no invented facts).
- **Never auto-sends** messages. Brokers edit drafts and send via **`POST /api/broker-crm/leads/[id]/send-message`**, which calls the existing `sendLecipmBrokerMessage` path.
- Prompts forbid inventing price, legal/compliance claims, or property facts not in the thread/listing record.

## API (`/api/broker-crm/leads`)

| Route | Purpose |
|-------|---------|
| `GET /api/broker-crm/leads?filter=` | List + KPIs |
| `GET /api/broker-crm/leads/[id]` | Lead detail |
| `POST .../status` | Update pipeline status |
| `POST .../follow-up` | Set/clear `nextFollowUpAt` |
| `POST .../notes` | Add broker note |
| `POST .../tags` | Add tag (upsert) |
| `POST .../score` | Recalculate priority |
| `POST .../ai-summary` | Generate + store AI summary |
| `POST .../ai-reply` | Generate reply draft (stored on insight row) |
| `POST .../next-action` | Generate next-best-action text |
| `POST .../send-message` | Send broker message on linked thread (`fromAiDraft` optional) |

**Auth:** broker sees only `brokerUserId === self`; admin can see all.

## Dashboard

- **`/dashboard/crm`** — KPI cards, filters, table + simplified pipeline columns.
- **`/dashboard/crm/[id]`** — Lead detail: AI cards, thread, editable reply + send, follow-up, notes, tags.

Legacy **Broker CRM** hub remains at **`/dashboard/broker/crm`**.

## Analytics

Server events via `trackBrokerCrm` / `trackEvent` include: `broker_crm_lead_created`, `broker_crm_ai_summary_generated`, `broker_crm_ai_reply_generated`, `broker_crm_ai_reply_sent`, `broker_crm_status_changed`, `broker_crm_lead_qualified`, `broker_crm_lead_closed`, etc.

## Future

- BNHub **booking_inquiry** auto-leads when wired to threads  
- Stronger ML scoring; SLA timers  
- Email notifications from AI milestones  
