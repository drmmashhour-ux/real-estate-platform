# Background jobs plan

Defines **what** should move off the synchronous request path over time. This is a **boundary document**; implementation may use cron, queue workers, or managed job runners.

**Legend:** **Now** = acceptable sync; **Later** = move to background when volume/latency demands.

---

| Task | Trigger | Frequency | Sync now / background later | Failure handling |
|------|-----------|-----------|----------------------------|------------------|
| Notification fan-out | Workflow events, scheduler | Per event or batched | **Now** minimal path; **Later** queue for large fan-out | Retry with backoff; dead-letter after N tries; idempotent inserts |
| Overdue / SLA recalculation | Cron | Hourly or daily | **Later** for heavy recalcs | Log failures; alert if job stale |
| Digest generation | Cron | Daily/weekly per prefs | **Later** | Skip user on repeated failure; surface in admin health |
| Analytics aggregation | Cron or stream batch | Hourly to daily | **Later** for heavy rollups | Rebuild from raw with bounded windows |
| Document cleanup (drafts, orphans) | Cron | Daily | **Later** | Dry-run mode first in new envs |
| Invoice aging summary | Cron | Daily | **Later** | Idempotent upsert of summary rows |
| Tenant / demo reset | Admin or cron | On schedule / manual | **Background** always for bulk | Progress tracking; abort; audit log |
| Reminder creation (appointments, deadlines) | Cron | Every few minutes to hourly | **Later** if scan is heavy | Per-tenant chunking |
| Integrity checks / reports | Cron | Weekly+ | **Background** | Alert on anomalies; no silent skip |

---

## Design rules

- **Idempotency:** Jobs can run twice; use natural keys or upserts.
- **Tenant context:** Each job batch must carry `tenantId` (or process global jobs in a controlled admin context only).
- **Visibility:** Log start/end, row counts, failures; expose last success time for critical jobs in observability tooling.
- **Backpressure:** If queue depth grows, scale workers or reduce frequency—do not unbounded enqueue.

---

## Synchronous vs background (decision guide)

| If… | Then… |
|-----|--------|
| Work fits in **< ~100–300ms** p95 and is user-blocking | Often OK sync |
| Work touches **many rows** or external APIs with variable latency | Background |
| User expects **immediate** feedback | Sync minimal state; **async** the rest |
| Operation is **unsafe** to retry blindly | Strong idempotency + dedupe keys |

---

## Relation to HTTP handlers

Route handlers should **enqueue** or **record intent**, not perform unbounded loops. See [SCALING_PLAN](./SCALING_PLAN.md) API hardening section.
