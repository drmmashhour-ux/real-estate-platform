# Observability scaling

What to add as traffic, tenants, and incident expectations grow. **Start small**; expand when blind spots cause pain.

---

## Metrics and tracing

| Capability | Stage 1 | Stage 2+ |
|------------|---------|----------|
| Request metrics by route | Basic (count, latency) | p50/p95/p99, error rate per route |
| Error rates by module/domain | Group routes by tag or prefix | Dashboards per team (CRM, finance, etc.) |
| Latency percentiles | Optional | Required for SLO conversations |
| DB slow queries | Enable on staging first | Production with sampling; threshold alerts |
| Upload/download failures | Log failures with reason | Aggregate rate + alert on spike |
| Notification pipeline | Count sends vs failures | Queue depth, retry rate, DLQ size |
| Finance operations | Webhook success, reconciliation lag | Payment mismatch alerts |
| Tenant-scoped incident tracing | Correlation id per request | Trace id propagated to jobs |

**Structured logs:** JSON or key-value fields (`tenantId`, `userId`, `route`, `durationMs`, `errorCode`) so logs are searchable. **Never** log secrets or full payment PANs.

---

## Alert priorities

| Priority | Examples | Response |
|----------|----------|----------|
| P1 | Auth down, payment webhook totally failing, DB unreachable | Page on-call |
| P2 | Elevated 5xx on core APIs, notification backlog growing | Investigate within SLA |
| P3 | Slow query threshold, single-tenant spike | Triage in business hours |

Tune thresholds after baseline noise is understood—avoid alert fatigue.

---

## Dashboards that matter first

1. **Traffic + errors** by route (or service name).
2. **Database health:** connections, CPU, replication lag if replicas exist.
3. **Background jobs:** last success time, duration, failure count.
4. **Queues:** depth and age of oldest message (if applicable).
5. **Finance:** webhook processing lag, reconciliation job status.

---

## Logs: structured and searchable

- **Request ID** on every log line for a single HTTP request.
- **Tenant id** on tenant-scoped operations (where permitted by privacy policy).
- **Job id** for background work.
- **Severity** consistent (`error`, `warn`, `info`).

Redact PII in accordance with policy; prefer IDs over emails in logs where possible.

---

## Synthetic checks

- **Health endpoint** for load balancers (lightweight DB ping or “ready” only when dependencies OK).
- Optional **synthetic transactions** in staging before promoting releases.

---

## Relation to cost

Sampling and retention tiers control log storage cost. Increase retention for compliance and security events; trim verbose debug in production.
