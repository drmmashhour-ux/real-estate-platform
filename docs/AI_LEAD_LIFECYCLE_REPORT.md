# AI lead lifecycle system — report

**Scope:** Before / during / after deal — rule-based assistance, full traceability, no fake AI decisions.

## Lifecycle status

| Phase | Implemented | Notes |
|--------|-------------|--------|
| **Before deal** | Yes | Chat + forms; `leadSource`, `aiTier`; HOT/WARM/COLD; automation events |
| **During deal** | Partial | `Deal.crmStage` + hints from legal `status`; `CrmInteraction` on stage change; suggestions API |
| **After deal** | Yes | `PATCH` lead `status: closed` schedules **5 retention** touchpoints (1w–12m); templates in code |
| **CRM** | Yes | `crm_interactions`, `client_retention_touchpoints`, broker **Lifecycle CRM** page |
| **Automation** | Partial | `AiAutomationEvent` keys: `warm_lead_follow_up`, `cold_lead_nurture`, `deal_crm_stage_change`, `retention_touch_due` — **worker must send** email/push |
| **Insights** | Yes | Counts by tier/source/stage; **no fabricated conversion %** |

## Database

- `Lead.leadSource`, `Lead.aiTier`
- `Deal.crmStage`
- `crm_interactions` — notes, stage changes, AI suggestion logs
- `client_retention_touchpoints` — scheduled post-close touches
- Migration: `20260321140000_ai_lead_lifecycle_crm`

## APIs

- `GET /api/broker/crm/lifecycle` — hot leads + actions, active deals + actions, retention queue, aggregates
- `PATCH /api/leads` — authz fix; CRM note; **closed** → retention schedule
- `PATCH /api/deals/[id]` — `crmStage` + auto-hint from `status` + `CrmInteraction`

## Compliance

- AI **does not** negotiate, give legal advice, or act as broker — same as Québec client chat policy.
- Retention copy is **draft** for licensed broker use.

## Issues

1. **Email/notifications** for warm/cold/deal/retention require a **job consumer** on `AiAutomationEvent`.
2. **Lead ↔ Deal** not auto-linked; link manually or extend schema later.
3. **Conversion rates** need you to label outcomes (won/lost) consistently.

## Improvements

- Worker: process `retention_touch_due` → Resend template
- Link `Deal.leadId` when creating deal from lead
- Dashboard charts from historical snapshots (optional)

## Tests

`lib/ai/lifecycle/lifecycle.test.ts` — suggestions + templates.

```bash
cd apps/web && npm test
```

## Deploy

```bash
npx prisma migrate deploy
```
