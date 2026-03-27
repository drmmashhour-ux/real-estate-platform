# Scaling milestones (checklists)

Actionable gates before crossing rough user bands. **Adapt** to your product; items are **not** exhaustive.

---

## Before ~100 active users (pilot)

- [ ] **Tenant isolation** verified on representative APIs (no cross-tenant reads/writes in tests).
- [ ] **Indexes** on high-traffic filters (tenant, user, status, createdAt) per real query plans.
- [ ] **Pagination** enforced on core list endpoints; default limits capped.
- [ ] **Health checks** for deployment platform.
- [ ] **Structured logging** with request correlation id.
- [ ] **Secrets** not in repo; staging vs production separation.
- [ ] **Object storage** path defined for production files (no reliance on local disk for durable content).
- [ ] **Demo/staging** isolated from production data and spend.

---

## Before ~1,000 active users

- [ ] **Background job boundaries** documented; obvious heavy work moved off request path where needed ([BACKGROUND_JOBS_PLAN](./BACKGROUND_JOBS_PLAN.md)).
- [ ] **Object storage** production-ready: signed URLs, tenant key layout ([STORAGE_SCALING](./STORAGE_SCALING.md)).
- [ ] **Unread counts / hot reads** reviewed; indexes and optional short TTL cache where safe ([CACHING_STRATEGY](./CACHING_STRATEGY.md)).
- [ ] **Analytics:** heavy aggregates not on every page load; summaries or jobs ([SCALING_PLAN](./SCALING_PLAN.md)).
- [ ] **Finance integrity:** reconciliation or sanity checks on a schedule ([DATABASE_SCALING](./DATABASE_SCALING.md)).
- [ ] **Rate limiting** on auth, uploads, and public forms ([ABUSE_AND_RATE_LIMITING](./ABUSE_AND_RATE_LIMITING.md)).
- [ ] **Slow query** visibility on staging/production ([OBSERVABILITY_SCALING](./OBSERVABILITY_SCALING.md)).

---

## Before ~10,000 active users

- [ ] **Reporting / heavy analytics** on jobs or read path separated from OLTP ([DATABASE_SCALING](./DATABASE_SCALING.md)).
- [ ] **Cache layer** where measured benefit; strict tenant-scoped keys ([TENANT_ISOLATION_AT_SCALE](./TENANT_ISOLATION_AT_SCALE.md)).
- [ ] **Messaging and list endpoints** scaled via pagination, indexes, and realistic realtime plan ([BOTTLENECKS_AND_LIMITS](./BOTTLENECKS_AND_LIMITS.md)).
- [ ] **Alerting** mature: P1/P2 paths, on-call expectations ([OBSERVABILITY_SCALING](./OBSERVABILITY_SCALING.md)).
- [ ] **Read scaling plan** validated with metrics (replicas only if justified) ([SCALING_PLAN](./SCALING_PLAN.md)).
- [ ] **Archive/retention** for high-volume event tables ([DATABASE_SCALING](./DATABASE_SCALING.md)).
- [ ] **Cost review** recurring: DB size, egress, workers, third-party APIs ([SCALING_PLAN](./SCALING_PLAN.md) cost section).

---

## How to use

1. Copy into a ticket or internal wiki per release train.
2. Check items with **owner** and **date** when done.
3. Add product-specific gates (compliance, regions, SLAs).
