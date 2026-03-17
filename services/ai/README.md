# AI Service (BNHub)

Base AI service for listing analysis, pricing, demand, fraud-check, and support. Part of the [AI-Optimized Architecture](../../docs/AI-OPTIMIZED-ARCHITECTURE.md).

## Logical modules (AI architecture domains)

The AI architecture defines seven domains. This service implements a subset; the rest are in **ai-manager** and **ai-operator**.

| Domain | In this service | Implementation |
|--------|------------------|-----------------|
| **Listing intelligence** | ✅ | `controllers/listing-analysis.controller`, `services/listing-analysis.service`, `prompts/listing-analysis` |
| **Pricing intelligence** | ✅ | `controllers/pricing.controller`, `services/pricing.service`, `prompts/pricing` |
| **Fraud and risk intelligence** | ✅ | `controllers/fraud.controller`, `services/fraud.service` |
| **Demand forecasting** | ✅ | `controllers/demand.controller`, `services/demand.service` |
| **Host performance** | — | See `services/ai-manager` (host-insights) and `services/ai-operator` (host_performance agent) |
| **Support intelligence** | ✅ | `controllers/support.controller`, `services/support.service`, `prompts/support` |
| **Marketplace health** | — | See `services/ai-operator` (marketplace_health agent) |

## Structure

```
src/
  controllers/   # HTTP handlers
  routes.ts      # Express router
  services/      # Business logic per domain
  models/        # Input/output types
  prompts/       # Prompt templates (LLM-ready)
  validators.ts  # Zod schemas
  pipeline/      # Data pipeline stub (run.ts)
  tests/         # Unit tests
```

## Endpoints (base path /v1/ai)

- `POST /listing-analysis` — Listing quality and suggestions
- `POST /pricing` — Pricing recommendation from inputs
- `POST /demand` — Demand forecast
- `POST /fraud-check` — Fraud/risk score
- `POST /support` — Support assistant (questions, summarize, suggest reply)

## Config

- `AI_SERVICE_PORT` (default 4001)
- `AI_SERVICE_BASE_PATH` (default /v1/ai)

## Run

- `npm run dev` — Start service
- `npm run test` — Run tests
- `npm run pipeline` — Run data pipeline stub

See [AI-OPTIMIZED-ARCHITECTURE.md](../../docs/AI-OPTIMIZED-ARCHITECTURE.md) for full domain design, endpoints, and integration with web-app and ai-operator.
