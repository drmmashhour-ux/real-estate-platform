# Bottlenecks and limits

Prioritized, practical view of where scale pain typically appears in a CRM + listings + deals platform. **Symptoms** help you recognize the bottleneck; **mitigation** is ordered by typical ROI.

---

## Dashboard list queries

**Why it hurts:** List endpoints aggregate joins, filters, and counts; cost grows with rows per tenant and N+1 patterns.

**Symptoms:** Slow TTFB on hub pages, DB CPU spikes, timeouts under concurrent users.

**Mitigation:** Indexes for filter/sort columns; pagination; summary endpoints for cards; defer heavy columns to detail views.

**When:** Stage 2+; verify in Stage 1 if lists are already wide.

---

## Notifications + action queue

**Why it hurts:** Write amplification (one user action → many rows), frequent polls for unread counts, and backlog scans.

**Symptoms:** Growing `Notification` / `ActionQueueItem` tables, slow “mark all read,” duplicate alerts under retries.

**Mitigation:** Indexes on `(userId, tenantId, createdAt)` (exact columns per schema); batch reads; move digests and fan-out to jobs; idempotent notification creation.

**When:** Stage 2 as workflow volume grows.

---

## Messaging thread reads

**Why it hurts:** Hot threads with long history; offset pagination degrades; unread math touches many rows.

**Symptoms:** Slow thread load, high DB read IOPS on conversation tables.

**Mitigation:** Cursor pagination; limit initial page size; cache **scoped** unread counts with invalidation; consider read denormalization only with care.

**When:** Stage 2–3 depending on messaging adoption.

---

## Document uploads and downloads

**Why it hurts:** Large objects, bandwidth, and permission checks on every signed URL path.

**Symptoms:** Upload timeouts, egress cost spikes, slow listing of large folders.

**Mitigation:** Object storage + signed URLs; multipart uploads for large files; folder pagination; lifecycle rules for stale drafts.

**When:** Stage 2 when leaving local disk; Stage 3 for heavy portfolios.

---

## Analytics aggregations

**Why it hurts:** Ad hoc aggregates over large event tables crush the primary DB.

**Symptoms:** Admin dashboards slow everyone down; CPU pegged during “refresh all stats.”

**Mitigation:** Precomputed summaries, scheduled rollups, separate reporting queries or replica; strict time windows and retention.

**When:** Stage 2 for product analytics; Stage 3 for platform-wide reporting.

---

## Finance reporting

**Why it hurts:** Commission and aging reports scan many financial rows; concurrency with OLTP workloads.

**Symptoms:** Timeouts on month-end views; lock contention if poorly scoped.

**Mitigation:** Background jobs for reports; materialized summaries; clear transactional boundaries for payments vs reporting reads.

**When:** Stage 2+ as deal volume grows.

---

## Admin dashboards

**Why it hurts:** Cross-tenant aggregates are inherently heavy and sensitive.

**Symptoms:** Slow admin home, risk of accidental expensive queries.

**Mitigation:** Dedicated admin query paths; heavy metrics behind jobs; strong auth and audit; rate limits.

**When:** Stage 2+ as admin usage grows.

---

## Tenant switching and membership checks

**Why it hurts:** Per-request membership resolution can become hot if implemented with redundant queries.

**Symptoms:** Latency tied to session load; DB chatter on every API call.

**Mitigation:** Short-lived **scoped** cache of membership conclusions (not raw role dumps); batch where possible; never skip checks.

**When:** Stage 2+ with many tenants per user.

---

## Background resets / demo systems

**Why it hurts:** Bulk deletes or re-seeds contend with live traffic if mis-scheduled; can dominate I/O.

**Symptoms:** Demo reset overlaps business hours; long locks or replication lag.

**Mitigation:** Isolated demo tenants/databases where feasible; off-peak windows; idempotent job steps; observable progress and failure alerts.

**When:** Whenever demo is shared widely (Stage 1–2).

---

## Priority summary

| Priority | Focus first |
|----------|-------------|
| P0 | Pagination, indexes, tenant scoping correctness |
| P1 | Notification/action queue health, document egress |
| P2 | Analytics/reporting off hot path, caching with safe keys |
| P3 | Read replicas, advanced partitioning—only after measurement |
