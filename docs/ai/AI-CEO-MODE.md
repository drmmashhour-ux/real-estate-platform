# AI CEO Mode (Strategic Decision Engine)

AI CEO Mode is an **advisory recommendation layer** on top of LECIPM telemetry. It aggregates platform signals, proposes prioritized strategic actions, and tracks human decisions and outcomes. It **does not** guarantee ROI or auto-execute sensitive operations.

## Architecture

| Layer | Role |
| ----- | ---- |
| **Signal aggregation** | `buildCeoContext()` reads Prisma-backed metrics: executive snapshots, CRM deals, bookings, autopilot executions/blocks, approval queue depth, marketing touches, SEO draft inventory, learning linkage counts. Missing data emits **thin-data warnings**. |
| **Recommendation engine** | `generateStrategicRecommendations()` produces deterministic drafts (same inputs → same fingerprints). Replaceable behind the same interface with model-backed logic later. |
| **Prioritization** | `prioritizeRecommendations()` assigns buckets: `TOP_PRIORITY`, `QUICK_WIN`, `HIGH_RISK_HIGH_REWARD`, `LOW_VALUE` using impact band, urgency, effort, confidence — **ordering only**, not dollar ROI. |
| **Explainability** | Each draft carries `signalsUsed`, triggers, why-it-matters, if-ignored narrative, confidence rationale, and thin-data disclaimers (`ai-ceo-explainability.service.ts`). |
| **Persistence & audit** | `syncAiCeoRecommendationsFromEngine()` upserts rows keyed by fingerprint; pending rows refresh fully on each sync. Decisions write `recordAuditEvent` (`AI_CEO_RECOMMENDATION_DECISION`). |
| **Measurements** | `computeAiCeoMeasurements()` summarizes counts, success-rate proxy from completed outcomes, stale pending, false-positive keywords in notes. |

Key paths:

- Module: `apps/web/modules/ai-ceo/`
- APIs: `/api/ai-ceo/recommendations`, `/api/ai-ceo/outcomes`, POST approve/reject/progress/complete on `[id]`
- UI: `AiCeoPanel` on the Autonomy Command Center admin dashboard

## Decision model

1. Recommendations refresh from live context on GET (sync runs server-side).
2. Admin transitions: **pending → approved | rejected | in_progress → completed**.
3. Each stored row includes lightweight **input snapshot**, **signals snapshot**, explanation JSON, confidence, prioritization bucket, and execution safety tier.

## Limitations

- **No promised returns**: Impact is expressed as bands (`meaningful`, `moderate`, `low`, `uncertain_thin_data`), not forecasts.
- **Proxy metrics**: Conversion and revenue hints come from executive snapshot JSON when present; sparse telemetry lowers confidence.
- **Deterministic rules**: Current generator is rule-based; narrative quality is bounded by templates.

## Safety constraints

| Execution safety | Meaning |
| ---------------- | ------- |
| `NEVER_AUTO` | Cannot be executed by automation (e.g. pricing-class posture, capital deployment reminders, legal-sensitive paths). |
| `APPROVAL_REQUIRED` | Human approval before any downstream campaign, capital move, or expansion action. |
| `ADVISORY_ONLY` | Informational; no implied execution hook. |

**Never auto-execute** (by policy): pricing changes, investment deployment, legal/compliance actions. Marketing spend, capital reallocation, and expansion remain **approval-gated** in product workflows outside this module.

## Audit trail

Decisions record actor user id, timestamp, optional outcome notes, and optional outcome impact band. Aggregated metrics appear in the CEO panel and `/api/ai-ceo/outcomes`.
