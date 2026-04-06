# Observability conventions

## Layers

| Layer | Mechanism | Use when |
|-------|-----------|----------|
| **Stdout JSON** | `lib/logging/structured.ts` (`logInfo`, `logError`, …) | Request-scoped, debugging, no DB write needed |
| **Persisted events** | `lib/observability.ts` → `recordPlatformEvent` | Audit trail, investor metrics, cross-service correlation |
| **AI-specific** | `lib/ai/logger.ts`, `lib/ai/observability/*` | Model decisions, tracing |

## Event naming

- Use **`platformEventType(prefix, action)`** from `lib/logging/event-categories.ts` with prefixes in **`PLATFORM_EVENT_PREFIX`** so `eventType` strings stay consistent (e.g. `ai.autopilot.rule_evaluated`).
- Avoid free-form duplicate strings for the same conceptual event.

## API errors

- Development: `logApiRouteError` (`lib/api/dev-log.ts`) — no PII.
- Production: `logError` with structured `LogContext` (no secrets in `meta`).

## Security / finance

- Use **`logSecurityEvent`** for auth anomalies; **`logFinanceEvent`** for payout/settlement breadcrumbs (still no full PAN or secrets).
