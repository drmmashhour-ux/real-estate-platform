# Monitoring metrics

This document lists **key metrics** to track for observability. Use your platform (Vercel, Datadog, Grafana Cloud, etc.) to implement dashboards and alerts; the app provides **structured logs** and lightweight **in-process hooks** (`apps/web/lib/metrics/index.ts`).

## System

| Metric | Description | Example signal |
|--------|-------------|----------------|
| **Request latency** | p50 / p95 / p99 for HTTP | Edge or origin latency |
| **Error rate** | 5xx / total requests | Spike after deploy |
| **Uptime** | Synthetic checks / health | `GET /api/health` (liveness), `GET /api/ready` (readiness + DB) |

## Business (product analytics)

| Metric | Description |
|--------|-------------|
| **Offers created** | Count of offers in a period |
| **Contracts signed** | Signed contract events |
| **Documents uploaded** | Upload success count |
| **Messages sent** | Outbound messages / notifications |
| **Active users** | DAU/WAU/MAU |
| **Tenant activity** | Events per tenant, cross-tenant comparison |

Map these to your **analytics** tables (`events`, `platform_events`, etc.) or a dedicated analytics pipeline.

## Finance

| Metric | Description |
|--------|-------------|
| **Invoices issued** | Count / amount by period |
| **Payments recorded** | Successful payments vs failures |
| **Commissions pending** | Open splits / payouts |

## Application logging

- **Structured JSON logs** (`lib/logging`):
  - `logInfo`, `logWarning`, `logError`, `logSecurityEvent`, `logFinanceEvent`
  - Fields: `ts`, `level`, `env`, `requestId`, `userId`, `tenantId`, `action`, `meta` (no secrets).

- **API request logging** (`lib/middleware/request-logger.ts`):
  - `createApiTimer(request)` + `finish(response, { userId, tenantId })` in route handlers.
  - Reference implementation: `GET /api/tenants/current`.

- **Metrics hooks** (`lib/metrics/index.ts`):
  - `trackApiLatency`, `trackError`, `trackCriticalEvent` — in-memory snapshot; wire to a real APM or metrics backend in production.

## Log / metric hygiene

- **Do not** log passwords, full payment payloads, or raw document bodies.
- **Production:** API errors return generic messages via `safeApiError` (`lib/api/safe-error-response.ts`).
