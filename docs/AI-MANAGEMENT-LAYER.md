# AI Management Layer (BNHub)

The AI layer adds AI-assisted features to the BNHub module: listing optimization, pricing, demand forecasting, fraud detection, support assistance, and monitoring.

For the **AI Platform Manager** (operations-focused service with jobs and monitoring dashboard), see [AI-PLATFORM-MANAGER.md](AI-PLATFORM-MANAGER.md).

## Architecture

- **Standalone service:** `services/ai` – Express app exposing REST APIs for other services.
- **Web-app integration:** Next.js API routes under `/api/ai/*` and `/api/admin/ai/*` use in-app libs (and can proxy to the AI service when `AI_SERVICE_URL` is set).
- **Data pipeline:** `apps/web/lib/ai-data-pipeline.ts` aggregates platform data for AI; trigger via `GET /api/admin/ai/pipeline` or cron.
- **Monitoring:** Admin AI Control Center shows model registry, fraud decision counts, model version metrics, pricing stats, alerts, and decision log.

## AI Service (`services/ai`)

Structure:

- **controllers/** – HTTP handlers for each capability
- **models/** – TypeScript types (input/output)
- **services/** – Business logic (listing analysis, pricing, demand, fraud, support)
- **routes** – Express router mounted at `/v1/ai`
- **prompts/** – Prompt templates for future LLM integration
- **tests/** – Unit tests (Vitest)
- **pipeline/run.ts** – Stub data pipeline (run `npm run pipeline` in services/ai)

Endpoints (when running the AI service on port 4001):

- `POST /v1/ai/listing-analysis` – Listing quality analysis
- `POST /v1/ai/pricing` – Pricing recommendation from inputs
- `POST /v1/ai/demand` – Demand forecast
- `POST /v1/ai/fraud-check` – Fraud/booking risk score
- `POST /v1/ai/support` – Support assistant (host/guest questions, dispute summary, suggest response)

Config: `AI_SERVICE_PORT`, `AI_SERVICE_BASE_PATH` (default `/v1/ai`).

## Web-app API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/listing-analysis | Analyze listing (title, description, amenities, location, photos); return recommendations and score |
| POST | /api/ai/pricing | Pricing from location, propertyType, season, demandLevel, listingRating, nearbyListingPrices |
| POST | /api/ai/demand | Demand level and high/low demand dates for a region |
| POST | /api/ai/fraud-check | Risk score and recommended action (bookingId, userId, or signals array) |
| POST | /api/ai/support | Support assistant: type=host_question|guest_question|dispute_summary|suggest_response |
| GET | /api/ai/recommendations/[listingId] | Host listing recommendations (existing) |
| GET | /api/ai/pricing/[listingId] | AI pricing for a listing (existing) |
| GET | /api/admin/ai/pipeline | Run data pipeline, return aggregated metrics |

## Host AI Dashboard

The host dashboard includes an **AI Insights** section:

- Listing improvement suggestions (from `/api/ai/recommendations/[listingId]`)
- Demand level and high-demand dates for the listing’s city
- Revenue tip (use pricing + calendar)

Existing **Pricing intelligence** widget remains for per-listing price recommendations.

## AI Data Pipeline

- **Purpose:** Collect listings, bookings, reviews, pricing history, demand forecasts, fraud scores for model training and analytics.
- **Implementation:** `lib/ai-data-pipeline.ts` – `collectAiPipelineMetrics()` returns aggregated counts and by-city metrics.
- **Trigger:** `GET /api/admin/ai/pipeline` (admin). Optional: wire to cron or run from `services/ai` when connected to platform DB.

## AI Model Monitoring (Admin)

Admin **AI Control Center** (`/admin/ai`) includes:

- **Model registry** – Registered models and latest version
- **AI outputs (counts)** – Fraud scores, pricing recommendations, demand forecasts
- **AI model monitoring** – Fraud decision counts (ALLOW/FLAG/BLOCK), model version metrics (accuracy, etc.), pricing recommendation stats (total, last 30 days, by demand level)
- **Active AI alerts** – Marketplace health alerts
- **Recent AI decision log** – Audit trail

## Security and scaling

- **Data:** No PII in AI service by default; inputs are listing/content or entity IDs. Web-app enforces auth and scoping.
- **Scaling:** Run the AI service separately; web-app can call it via `AI_SERVICE_URL` or use in-app libs. Pipeline and monitoring use existing Prisma/DB in web-app.

## Running

- Start AI service: `npm run dev:ai` (port 4001).
- Start web-app: `npm run dev` (API routes and host dashboard use in-app AI libs).
- Run AI service tests: `npm run test:ai`.
