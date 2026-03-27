# Database scaling

Applies to the primary PostgreSQL database accessed via Prisma (or equivalent ORM). **Measure** before adding replicas or sharding.

---

## Short term (single primary)

**Architecture:** One primary relational database; all writes and most reads go to it.

**Practices**

- **Indexing:** Add indexes for foreign keys used in joins, filter columns (`tenantId`, `userId`, status, `createdAt`), and sort fields used in lists. Revisit after real query plans.
- **Query optimization:** Avoid N+1; use `select` projections; batch related loads where appropriate.
- **Pagination:** Offset or cursor pagination on all list endpoints; cap `limit`.
- **Transactions:** Keep transactions short; avoid holding locks across external API calls.

**High-growth tables (typical candidates for volume)**

| Area | Examples (conceptual) | Notes |
|------|------------------------|--------|
| Messaging | `Message`, conversation membership | Hot read/write; long history. |
| Notifications | `Notification`, unread state | High insert rate; frequent reads. |
| Action queue | `ActionQueueItem` | Backlog scans if unindexed. |
| Documents | `DocumentFile`, folder membership, activity | Storage metadata + events. |
| Workflow events | `OfferEvent`, `ContractEvent`, document events | Append-heavy; retention matters. |
| Analytics / demo | Product events, demo analytics | Very high insert potential. |

Exact table names follow your Prisma schema; treat the list as **categories** of growth.

---

## Medium term (read pressure and reporting)

**Read-heavy endpoints:** Listing dashboards, message inboxes, notification feeds, analytics widgets.

**Approaches**

- **Optimize first:** Indexes, pagination, smaller payloads.
- **Reporting separation:** Run heavy reporting queries against a **read replica** or a **reporting database** fed by jobs—only when primary DB shows sustained read contention or SLO risk.
- **Materialized summaries / cached aggregates:** Roll up counts for dashboards on a schedule or on write with careful invalidation.
- **Archiving:** Move old events and cold rows to archive tables or cheaper storage; keep **referential integrity** and legal retention in mind.

**Retention**

- Define policies for event and audit-adjacent tables (e.g. raw analytics events, verbose logs mirrored in DB).
- Archiving is preferable to unbounded growth on the primary instance.

---

## Later stage (scale-out)

**Read replicas:** Add when **measured** read load and replica lag tolerance justify cost—not as a default.

**Partitioning candidates:** Time-series or tenant-scoped partitions for **very large** append-only tables—plan early, implement when size forces it.

**Connection pooling:** Use a pooler (e.g. PgBouncer) or managed pooling compatible with your host; size pools to **database max connections** and app instance count.

**Job-heavy workloads:** Invoice generation, digest sends, integrity sweeps, large exports—**off the request path** via workers; avoid long work in HTTP handlers.

---

## Index strategy (conceptual)

- Composite indexes matching **common filters**: e.g. `(tenantId, createdAt DESC)` for tenant-scoped feeds.
- Partial indexes where queries always filter on a predicate (e.g. `status = 'open'`).
- Avoid redundant indexes that duplicate left-prefixes of another index unless query patterns prove the need.

Reindex and `VACUUM` policies follow PostgreSQL and hosting vendor guidance.

---

## Integrity at scale

- **Tenant isolation:** Every query path must enforce `tenantId` (or equivalent) consistently; see [TENANT_ISOLATION_AT_SCALE](./TENANT_ISOLATION_AT_SCALE.md).
- **Financial rows:** Unique constraints on invoice numbers, idempotent payment webhooks, reconciliation jobs.
- **Scheduled checks:** Tenant integrity scripts (orphan detection, cross-tenant reference checks) as batch jobs with alerts—not only manual SQL.

---

## Finance-specific scaling (coordination with app)

- **Invoice numbering:** Must remain unique under concurrency (database sequence, unique constraint, or transactional allocation).
- **Commission aggregation:** Prefer rollups and bounded queries over ad hoc full scans on each page load.
- **Aging and period close:** Implement as **jobs** or **precomputed** tables when volume demands; protect OLTP from reporting scans.

Cross-ref: [SCALING_PLAN](./SCALING_PLAN.md) finance section, [BACKGROUND_JOBS_PLAN](./BACKGROUND_JOBS_PLAN.md).
