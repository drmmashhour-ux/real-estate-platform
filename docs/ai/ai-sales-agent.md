# AI Sales Agent (Centris lead conversion)

Platform assistant that **never impersonates a human broker**. Every outbound piece identifies as the **LECIPM assistant**, supports brokers via escalation and scheduling hints, and writes **explainable `LeadTimelineEvent` rows** (`AI_SALES_*`).

## Flow

1. **Triggers** — `triggerAiSalesAgent()` from Centris capture, broker manual intake, `/api/ai-sales/trigger`, or future cron ticks (`follow_up_timing`).
2. **Qualification** — Rule-based HOT / WARM / COLD (`qualifySalesLead`) persisted under `Lead.aiExplanation.aiSalesQualification`.
3. **Instant email** — SAFE / FULL autopilot sends `ai_sales_first_response` when privacy/consent gates pass.
4. **Nurture sequence** — When marketing consent exists and the lead has not opted out, `LeadFollowUpJob` rows `ai_sales_seq_*` fire at +24h / +48h / +72h / +120h (reuse Centris operational emails where noted in code).
5. **Escalation** — HOT tier, visit language, or “complex” copy routes a broker notification via `resolveCentrisBrokerRouting` (same listing-owner rules as Centris routing — no duplicate CRM assignment engine).

## Modes (`AiFollowUpSettings.templatesJson.aiSalesAgent`)

| Mode | Behaviour |
|------|-----------|
| `OFF` | No automation |
| `ASSIST` | Qualification + timeline logs; **no** auto-send |
| `SAFE_AUTOPILOT` | Email automation + broker escalations (default) |
| `FULL_AUTOPILOT` | SAFE + reserved SMS hooks behind TCPA consent |

Env overrides: `AI_SALES_AGENT_MODE`, `AI_SALES_AGENT_OWNS_SEQUENCE` (`false` keeps legacy `centris_domination_*` jobs when `FEATURE_AI_SALES_AGENT_V1` is on).

## Compliance

- **Law 25 / marketing** — Nurture jobs require capture-time marketing consent; transactional assistant intro uses privacy acknowledgment path for Centris.
- **Unsubscribe** — `Lead.optedOutOfFollowUp` skips nurtures and is checked in job processor.
- **SMS** — No send until `LeadContactConsent.consentSmsWhatsapp` (stubs log `sms_skipped_no_tcpa_consent`).

## APIs

| Method | Path | Notes |
|--------|------|--------|
| GET / PATCH | `/api/admin/ai-sales-agent` | Admin metrics + config JSON |
| POST | `/api/cron/ai-sales-sequence` | Bearer `CRON_SECRET` |
| POST | `/api/ai-sales/trigger` | Session broker/admin — `{ leadId, trigger }` |

## Flag

`FEATURE_AI_SALES_AGENT_V1` must be enabled for orchestration triggers from Centris/Broker intake.

## Tests

`apps/web/modules/ai-sales-agent/__tests__/ai-sales-agent.test.ts`
