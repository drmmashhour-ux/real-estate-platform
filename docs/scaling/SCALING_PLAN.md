# Platform scaling plan

This document describes how to evolve the platform from early demo usage toward multi-tenant SaaS at scale. It is **planning guidance**, not a guarantee of current production capacity. Validate with profiling, load tests, and provider limits before major investments.

**Related docs:** [CAPACITY_ASSUMPTIONS](./CAPACITY_ASSUMPTIONS.md), [BOTTLENECKS_AND_LIMITS](./BOTTLENECKS_AND_LIMITS.md), [DATABASE_SCALING](./DATABASE_SCALING.md), [STORAGE_SCALING](./STORAGE_SCALING.md), [CACHING_STRATEGY](./CACHING_STRATEGY.md), [BACKGROUND_JOBS_PLAN](./BACKGROUND_JOBS_PLAN.md), [OBSERVABILITY_SCALING](./OBSERVABILITY_SCALING.md), [TENANT_ISOLATION_AT_SCALE](./TENANT_ISOLATION_AT_SCALE.md), [ABUSE_AND_RATE_LIMITING](./ABUSE_AND_RATE_LIMITING.md), [SCALING_MILESTONES](./SCALING_MILESTONES.md).

---

## Stages (user growth — illustrative bands)

User counts are **order-of-magnitude planning bands**, not forecasts. Adjust thresholds using your own metrics.

### Stage 1 — roughly tens to low hundreds of users

**Profile:** Early demo or pilot; founder- or dev-operated; low concurrent traffic; single team on call.

**Technical pressure points**

- Cold-start and misconfiguration issues matter more than raw scale.
- Missing indexes and unbounded list queries show up first under any real usage.
- Demo/staging paths must not contaminate production data or budgets.

**Infrastructure priorities**

- One web deployment, one primary PostgreSQL database, managed object storage when files leave local disk.
- Minimal background work: cron for essentials only (e.g. demo reset, follow-ups) with clear ownership.
- Health checks and structured logs before chasing performance.

**Before growth continues**

- Tenant isolation rules are enforced in services and APIs (see [TENANT_ISOLATION_AT_SCALE](./TENANT_ISOLATION_AT_SCALE.md)).
- Pagination and sane defaults on list endpoints; no unbounded “load everything” handlers for core domains.
- Secrets and environments separated (staging vs production).

---

### Stage 2 — roughly hundreds to low thousands of users

**Profile:** More tenants; heavier dashboard use; more uploads, notifications, and analytics events; occasional traffic spikes.

**Technical pressure points**

- Dashboard and inbox-style queries compete for DB time.
- Notification and action-queue volume grows with workflow activity.
- Document upload/download and messaging read paths need consistent patterns (pagination, indexes).
- Hot spots appear in audit/event tables if every action writes high-cardinality rows without retention thought.

**Infrastructure priorities**

- **Database:** Index review, query plans on slow paths, connection settings appropriate to pool size (see [DATABASE_SCALING](./DATABASE_SCALING.md)).
- **Storage:** Production object storage, signed URLs, tenant-safe key prefixes (see [STORAGE_SCALING](./STORAGE_SCALING.md)).
- **Caching:** Targeted caches for low-volatility or aggregate reads (see [CACHING_STRATEGY](./CACHING_STRATEGY.md)).
- **Jobs:** Move obvious fan-out (digests, heavy aggregates) off the request path where latency or timeout risk appears (see [BACKGROUND_JOBS_PLAN](./BACKGROUND_JOBS_PLAN.md)).
- **Observability:** Route-level latency/error visibility, slow query logging (see [OBSERVABILITY_SCALING](./OBSERVABILITY_SCALING.md)).

**Before growth continues**

- Rate limiting and abuse controls on sensitive endpoints (see [ABUSE_AND_RATE_LIMITING](./ABUSE_AND_RATE_LIMITING.md)).
- Finance and reporting paths reviewed for long-running queries; summaries or jobs where needed.
- Cost visibility: storage egress, DB size, worker/cron cost.

---

### Stage 3 — roughly thousands to tens of thousands of users

**Profile:** Many tenants; higher messaging, document, and scheduling volume; stronger expectations on reliability and incident response.

**Technical pressure points**

- Read-heavy and aggregate-heavy endpoints (analytics, admin, finance reporting) stress the primary DB if left unbounded.
- Background job queues can back up; duplicate or stormy notification generation becomes visible.
- Cross-tenant safety must hold in caches, exports, and batch jobs—not only in synchronous API handlers.

**Infrastructure priorities**

- **Read scaling:** Read replicas or reporting replicas **if** justified by measured read pressure and query separation (not by default).
- **Jobs:** Dedicated worker processes for digest, analytics rollups, integrity checks, large exports.
- **Caching:** Stronger invalidation discipline; avoid cross-tenant cache bleed (see [TENANT_ISOLATION_AT_SCALE](./TENANT_ISOLATION_AT_SCALE.md)).
- **Observability:** SLO-oriented alerts, tenant-scoped troubleshooting, finance and notification pipeline health.
- **Partitioning / archiving:** Candidates for large append-only tables identified and documented before tables become operationally painful.

**Before growth continues**

- Disaster recovery and backup restore tested on a schedule.
- Capacity and cost reviews tied to milestones (see [SCALING_MILESTONES](./SCALING_MILESTONES.md)).

---

## Deployment / infrastructure evolution

Phases align with **operational maturity**, not vanity architecture.

### Phase A — baseline

- Single web app deployment (e.g. one or few regions as appropriate).
- Single primary relational database.
- Object storage for user-facing files (not local disk in production).
- Scheduled jobs via host cron or managed scheduler invoking the same codebase (idempotent, monitored).

### Phase B — heavier usage

- Connection pooling tuned to DB limits; avoid connection storms from serverless bursts.
- Dedicated worker or queue consumer for background jobs if cron + HTTP timeouts are no longer enough.
- Centralized metrics and error tracking; dashboards for routes and DB health.
- Dedicated cache (e.g. Redis) when measured hit rates justify operational cost.

### Phase C — high scale (only when justified)

- Read replicas or read-only reporting endpoint **if** read load and SLA require it.
- Separated analytics/reporting pipelines and longer retention strategies with archiving.
- Stronger alerting, on-call runbooks, incident tooling.

Skip Phase C until Phase A/B bottlenecks are measured and cheaper fixes (indexes, pagination, caching, jobs) are exhausted.

---

## Cost-awareness

- **Optimize application and queries before** adding replicas, sharding, or extra services.
- Profile slow endpoints and use `EXPLAIN` / slow-query logs; index and paginate before horizontal scale.
- Object storage and **egress** often dominate file-heavy workloads; use CDN/signed URLs and lifecycle rules deliberately.
- Isolate demo/staging workloads and data so they cannot drive production cost surprises.
- Review vendor bills (DB storage growth, API calls, email, observability) on a recurring cadence.

---

## API and query hardening

These practices should start in Stage 1 and tighten through Stage 3.

- **Paginate** all list endpoints; default limits with caps.
- Prefer **cursor-based** pagination for high-churn feeds where offsets become expensive.
- **Summary endpoints** for dashboard cards and widgets instead of loading full entity graphs.
- Avoid returning **full timelines** by default; lazy-load heavy panels (messages, files, analytics charts).
- Keep **route handlers thin**: validation, auth, tenant context, delegate to services; move heavy work to services or jobs.
- **N+1** query patterns: use explicit includes/batching or separate queries with clear cost.

---

## Realtime / messaging (future-ready)

Ground assumptions in the **current** implementation (e.g. polling, request-time refresh). Do not assume websockets exist unless shipped.

- Today: optimize **pagination**, indexes on conversation/message lookups, and **unread count** queries.
- Later: a **websocket or pub-sub** boundary can reduce polling for active users; introduce behind feature flags and capacity planning.
- **Fan-out control:** dedupe notifications, rate-limit burst creation, move bulk fan-out to jobs.
- **Event storms:** backpressure and idempotency keys for notification creation under load.

---

## Finance scaling (summary)

Details: [DATABASE_SCALING](./DATABASE_SCALING.md) (reporting load), [BACKGROUND_JOBS_PLAN](./BACKGROUND_JOBS_PLAN.md) (aging, exports).

- **Invoice numbering** must be concurrency-safe (unique constraints, sequences, or transactional allocation—implementation-specific).
- **Payment records** and commission lines: integrity checks and reconciliation jobs as volume grows.
- **Commission aggregation:** push heavy rollups to background jobs and materialized or cached summaries.
- **Aging and period reports:** avoid full scans on every dashboard load; precompute or job-driven summaries.
- **Analytics:** tenant-scoped finance views; never leak cross-tenant aggregates without explicit super-admin tooling and audit.

---

## Analytics scaling (summary)

- Do not run **expensive aggregates** on every page view; use **precomputed** summaries or scheduled rollups for heavy metrics.
- Separate **tenant-facing** product analytics from **platform-wide** admin reporting (different caches, retention, and access).
- **Cache** stable summary blobs with tenant-scoped keys and clear invalidation.
- **Retention:** raw event tables grow quickly; define TTL/archive policy before storage and query cost dominate.

---

## Rate limiting and abuse

Endpoint-level guidance lives in [ABUSE_AND_RATE_LIMITING](./ABUSE_AND_RATE_LIMITING.md). Apply stricter limits as traffic and abuse risk grow.

---

## Review cadence

Revisit this plan when crossing milestone bands, after incidents, or when adding a major subsystem (new integration, large region, regulated data).
