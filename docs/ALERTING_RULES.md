# Alerting rules

Alerts should route to **on-call** (PagerDuty / Opsgenie) or **Slack** for warnings. The app stubs live in `apps/web/lib/alerts/index.ts` (`sendCriticalAlert`, `sendWarningAlert`, `sendInfoAlert`) — they **log** today; wire them to email/Slack/webhooks when ready.

## CRITICAL (page immediately)

| Condition | Threshold (example) | Notes |
|-------------|----------------------|--------|
| **API error rate** | 5xx > **1–5%** over 5 min | Exclude health noise; segment by route. |
| **DB unavailable** | `GET /api/ready` **503** or DB connection errors | Confirms outage or pool exhaustion. |
| **Auth failure spike** | Login 401/403 rate >> baseline | Possible attack or misconfiguration. |
| **Payment failure spike** | Stripe/webhook failures >> baseline | Money at risk; check idempotency. |

## HIGH (respond within business hours or on-call if SLO breached)

| Condition | Notes |
|-----------|--------|
| **Contract signing failures** | E-signature / legal flow errors |
| **Document upload failures** | Storage or API errors |
| **Notification delivery failure** | Email/SMS/push provider errors sustained |

## MEDIUM (ticket / next day)

| Condition | Notes |
|-----------|--------|
| **Slow response times** | p95 latency > SLO (e.g. 2–5s) |
| **Backlog of pending actions** | Queues / cron lag (e.g. follow-up jobs) |

## Implementation checklist

- [ ] Ingest logs into a searchable system (Datadog, CloudWatch, etc.).
- [ ] Synthetic checks: `/api/health` every 1 min; `/api/ready` every 1–5 min from same region.
- [ ] Wire `sendCriticalAlert` / `sendWarningAlert` to Slack or email in production.
