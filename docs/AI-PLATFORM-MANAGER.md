# AI Platform Manager

The AI Platform Manager is an operations layer that helps manage the BNHub short-term rental platform through pricing optimization, fraud detection, listing quality monitoring, demand forecasting, host insights, and support automation.

## Architecture

- **Service:** `services/ai-manager` – Express app with controllers, services, models, routes, prompts, and scheduled jobs.
- **Integration:** Web-app exposes the same APIs under `/api/ai/*`. When `AI_MANAGER_URL` is set, the app proxies to the ai-manager service; otherwise it uses in-app logic (Prisma + existing AI libs).
- **Interactions:** The ai-manager can call listings, bookings, reviews, and payments services when `LISTINGS_SERVICE_URL`, `BOOKINGS_SERVICE_URL`, etc. are set. Jobs use these to batch-analyze listings, run demand forecasts, and monitor fraud.

## Service structure (`services/ai-manager`)

| Folder     | Purpose |
|-----------|---------|
| controllers/ | HTTP handlers for each API |
| services/    | Business logic (listing quality, pricing, risk, demand, host insights, support) |
| models/       | Request/response types |
| routes        | Express router at `/v1/ai-manager` |
| prompts/      | Prompt templates for future LLM use |
| jobs/         | Daily listing analysis, daily demand forecast, fraud monitoring (+ scheduler) |
| tests/        | Unit tests (Vitest) |

## API Endpoints

All paths below are exposed by the **ai-manager service** at `BASE_URL/v1/ai-manager` and by the **web-app** at `/api/ai` when using in-app logic.

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/listing-quality | Listing quality score and suggested improvements (title, description, amenities, reviews, photos) |
| POST | /api/ai/pricing-suggestion | Recommended nightly price and price range (location, season, demand, similar listings, reviews) |
| POST | /api/ai/risk-check | Fraud risk score and recommended action (bookingId, userId, signals, paymentAttempts, accountAgeDays) |
| POST | /api/ai/demand-forecast | High/low demand periods (region, propertyType, fromDate, toDate, trends) |
| POST | /api/ai/host-insights | Occupancy trend, revenue trend, suggested improvements, price tips (hostId, optional listingIds, periodDays) |
| POST | /api/ai/support-assistant | Summarize dispute, suggest reply, or answer question (action: summarize_dispute \| suggest_reply \| answer_question) |

## Host insights engine

- **API:** `POST /api/ai/host-insights` with `hostId` (and optional `listingIds`, `periodDays`).
- **Response:** `occupancyTrend`, `revenueTrend`, `suggestedImprovements`, `priceOptimizationTips`, `summary`.
- **Web-app:** When `AI_MANAGER_URL` is not set, `lib/ai-host-insights.ts` aggregates from Prisma (bookings, listings, AI pricing, host recommendations) to compute occupancy and revenue and merge improvement/tip text.

## AI monitoring dashboard

- **Path:** `/admin/ai-monitoring`
- **Content:** AI alerts, fraud detection events (recent FraudScore), pricing suggestions (recent AiPricingRecommendation), and a listing quality section (with instructions to use `POST /api/ai/listing-quality` and the daily-listing-analysis job).
- **Link:** From AI Control Center (`/admin/ai`) → “AI Monitoring Dashboard”.

## Automation jobs

- **Daily listing analysis:** Fetches listings from `LISTINGS_SERVICE_URL`, runs `analyzeListingQuality` for each, counts low-quality alerts.
- **Daily demand forecast:** Runs `getDemandForecast` for configured regions (default or from listings service).
- **Fraud monitoring:** Fetches recent bookings from `BOOKINGS_SERVICE_URL`, runs `runRiskCheck` per booking, counts flagged.

**Run once:** `npm run jobs:ai-manager` (or `npm run jobs` in `services/ai-manager`).

**Scheduled:** Set `RUN_JOBS=true` when starting the ai-manager; the scheduler runs jobs per cron expressions in `config.cron` (e.g. listing 6 AM, demand 7 AM, fraud every 15 min).

## Configuration

| Env | Description |
|-----|-------------|
| AI_MANAGER_PORT | Port (default 4002) |
| AI_MANAGER_BASE_PATH | Base path (default /v1/ai-manager) |
| AI_MANAGER_URL | Web-app: URL of ai-manager for proxying (e.g. http://localhost:4002) |
| LISTINGS_SERVICE_URL | Optional; used by jobs to fetch listings/regions |
| BOOKINGS_SERVICE_URL | Optional; used by fraud monitoring job |
| RUN_JOBS | Set to "true" to start cron scheduler |
| CRON_LISTING_QUALITY | Cron for daily listing analysis (default 0 6 * * *) |
| CRON_DEMAND_FORECAST | Cron for daily demand (default 0 7 * * *) |
| CRON_FRAUD_MONITORING | Cron for fraud run (default */15 * * * *) |

## Running

- Start ai-manager: `npm run dev:ai-manager` (port 4002).
- Run tests: `npm run test:ai-manager`.
- Run jobs once: `npm run jobs:ai-manager`.
- Web-app works without ai-manager; set `AI_MANAGER_URL` to use the service for AI APIs.

## Security and scaling

- APIs are stateless; no PII stored in ai-manager. Web-app enforces auth and scoping.
- Jobs read from other services via HTTP; use service-to-service auth in production.
- Scale by running multiple ai-manager instances behind a load balancer; run jobs on a single instance (e.g. via RUN_JOBS on one pod).
