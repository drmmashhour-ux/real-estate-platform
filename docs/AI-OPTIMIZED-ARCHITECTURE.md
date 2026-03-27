# AI-Optimized Architecture for BNHub (LECIPM)

This document describes the **AI-first architecture** for the BNHub short-term rental module. The AI layer **assists operations** and does not replace the core transactional backend (users, listings, search, bookings, payments, messaging, reviews). It integrates with the host dashboard, admin dashboard, and support tools to improve listing quality, pricing, fraud detection, demand forecasting, host insights, support triage, and marketplace health.

**Related:** [AI Management Layer](AI-MANAGEMENT-LAYER.md) · [AI Platform Manager](AI-PLATFORM-MANAGER.md) · [AI Operator](AI-OPERATOR.md)

---

## 1. AI Architecture Overview

### Main AI Domains

| Domain | Purpose | Core platform touchpoints |
|--------|---------|----------------------------|
| **Listing intelligence** | Quality scores, completeness, improvement suggestions | Listings (create/edit), moderation queue, host dashboard |
| **Pricing intelligence** | Recommended prices, ranges, demand signals | Listings (nightly price), host dashboard, bookings (quotes) |
| **Fraud and risk intelligence** | Risk scores, booking/user flags, recommended actions | Bookings, payments, admin trust & safety |
| **Demand forecasting** | Demand by market/date, high/low periods, supply signals | Search, listings, host dashboard, pricing |
| **Host performance intelligence** | Host quality score, strengths/weaknesses, badge eligibility | Host dashboard, admin host management, listings |
| **Support intelligence** | Ticket classification, summarization, urgency, suggested replies | Messaging, disputes, support dashboard |
| **Marketplace health intelligence** | Platform health score, anomaly alerts, regional warnings | Admin dashboard, operations, alerts |

### How AI Domains Connect to the Core Platform

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CORE BNHub PLATFORM                                    │
│  Users · Listings · Search · Bookings · Payments · Messaging · Reviews       │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
┌───────────────────┐  ┌────────────────┐  ┌─────────────────────────────────┐
│ Listing           │  │ Pricing        │  │ Fraud & Risk                     │
│ Intelligence      │  │ Intelligence   │  │ Intelligence                     │
│ (quality,         │  │ (recommend,    │  │ (scores, flags,                  │
│  suggestions)     │  │  range, demand)│  │  escalate)                       │
└───────────────────┘  └────────────────┘  └─────────────────────────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
┌───────────────────┐  ┌────────────────┐  ┌─────────────────────────────────┐
│ Demand            │  │ Host           │  │ Support + Marketplace Health     │
│ Forecasting       │  │ Performance    │  │ (triage, summarize, health,      │
│ (markets, dates)  │  │ (scores, tips) │  │  alerts)                          │
└───────────────────┘  └────────────────┘  └─────────────────────────────────┘
                    │                    │                    │
                    └────────────────────┴────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │  AI Data Pipeline · Decision Logs ·       │
                    │  Dashboards (Host · Admin · Support)      │
                    └─────────────────────────────────────────┘
```

- **Read from core:** Listings, bookings, payments, reviews, messages, searches, users (aggregated or by ID).
- **Write back:** Only recommendations, scores, alerts, and logs. No direct mutation of core entities (e.g. no auto-approve payouts or permanent bans without human review).

---

## 2. AI Service Structure

The AI layer is implemented as **modular services** that can run in-process (web-app) or as standalone services.

### Suggested structure (logical modules)

```
services/ai/                          # Base AI service (existing)
  listing-intelligence/               # → services/ai (listing-analysis) + ai-operator (listing_moderation)
  pricing-intelligence/               # → services/ai (pricing) + ai-operator (pricing)
  fraud-intelligence/                 # → services/ai (fraud-check) + ai-operator (fraud_risk, booking_integrity)
  demand-intelligence/                # → services/ai (demand) + ai-operator (demand_forecast)
  host-intelligence/                  # → services/ai-manager (host-insights) + ai-operator (host_performance)
  support-intelligence/               # → services/ai (support) + ai-manager (support-assistant) + ai-operator (support_triage)
  marketplace-intelligence/           # → ai-operator (marketplace_health) + ai-marketplace-health (web-app)
```

Each **logical module** is expected to provide:

| Component | Purpose |
|-----------|---------|
| **controllers** | HTTP handlers for the module’s endpoints |
| **routes** | Route definitions (Express or Next.js API) |
| **services** | Business logic (scoring, recommendations, aggregation) |
| **models** | Input/output types and optional persistence shapes |
| **jobs** | Scheduled runs (daily/hourly refresh, scans) |
| **prompts** | Prompt templates for future LLM integration |
| **tests** | Unit and integration tests for outputs and access |

**Current implementation mapping:**

- **services/ai** — Listing analysis, pricing, demand, fraud-check, support (controllers, services, models, prompts, tests).
- **services/ai-manager** — Listing quality, pricing suggestion, risk-check, demand forecast, host insights, support assistant (controllers, services, models, routes, jobs, prompts, tests).
- **services/ai-operator** — Eight agents (listing moderation, pricing, fraud risk, booking integrity, demand, host performance, support triage, marketplace health), decision store, alerts, policies, jobs.

The **unified API surface** is exposed via the web-app at `/api/ai/*` and `/api/ai-operator/*`, with optional proxying to standalone services when `AI_SERVICE_URL` / `AI_OPERATOR_URL` are set.

---

## 3. Listing Intelligence

### Purpose

Improve listing quality and completeness through scores and actionable suggestions.

### Inputs

- Title, description, amenities, photos (count or URLs), location (city, address)
- Optional: reviews (count, average rating), listing completeness metrics

### Outputs

- **Listing quality score** (0–100)
- **Missing information warnings** (e.g. no house rules, few photos)
- **Title improvement suggestions**
- **Description improvement suggestions**
- **Amenity suggestions**
- **Photo improvement suggestions** (count, quality hints)
- **Listing completeness status** (e.g. complete / needs_work / incomplete)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/listings/analyze | Analyze payload (title, description, amenities, photos, location); return score and suggestions. |
| POST | /api/ai/listing-quality | Same idea; alternate naming (ai-manager). |
| POST | /api/ai-operator/listings/analyze | Full operator flow: score, moderation status, trust flags, decision log. |
| GET | /api/ai/listings/:listingId/report | Return latest stored report for listing (from ai_listing_reports or equivalent). |

**Implementation:** `services/ai` (listing-analysis), `services/ai-manager` (listing-quality), `services/ai-operator` (listing_moderation agent). Web-app: `lib/ai-listing-analysis.ts`, `lib/ai-host-optimization.ts`, routes under `/api/ai/*` and `/api/ai-operator/*`.

---

## 4. Pricing Intelligence

### Purpose

Suggest nightly prices and ranges based on market and demand.

### Inputs

- City (or region), season, booking history (optional), demand trends
- Nearby listing prices, occupancy rates, review score, host performance (optional)

### Outputs

- **Recommended nightly price** (and currency unit, e.g. cents)
- **Recommended price range** (min–max)
- **Confidence score** (0–1)
- **High-demand / low-demand indicators**
- **Minimum stay suggestion**
- **Special pricing suggestions** (e.g. weekends, holidays)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/pricing/recommend | Recommend from body (location, season, comparables, etc.). |
| POST | /api/ai/pricing | Same (legacy naming). |
| POST | /api/ai-operator/pricing/recommend | Operator flow with decision log. |
| GET | /api/ai/pricing/:listingId | Latest recommendation for a listing. |
| GET | /api/ai-operator/pricing/:listingId | Same from operator store. |

**Implementation:** `services/ai` (pricing), `services/ai-manager` (pricing-suggestion), `services/ai-operator` (pricing agent). Web-app: `lib/ai-pricing.ts`, `lib/ai-pricing-input.ts`, `lib/bnhub/pricing.ts`.

---

## 5. Fraud and Risk Intelligence

### Purpose

Score fraud and booking risk; recommend allow / review / flag / escalate.

### Inputs

- Booking patterns, payment signals (attempts, failures)
- Cancellation history, refund patterns, user behavior
- Messaging anomalies, optional device/session signals

### Outputs

- **Fraud risk score** (0–1)
- **Booking risk level** (e.g. low / medium / high / critical)
- **Recommended action** (allow, review, block)
- **Escalate / flag / manual review** recommendation
- **Reason summary** (codes or short text)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/fraud/evaluate | Evaluate from body (bookingId, userId, signals, etc.). |
| POST | /api/ai/risk-check | Same (ai-manager naming). |
| POST | /api/ai/fraud-check | Same (legacy). |
| POST | /api/ai-operator/fraud/evaluate | Operator flow with decision log and optional alert. |
| POST | /api/ai-operator/bookings/check | Booking integrity agent (anomaly, hold/approve/review). |
| GET | /api/ai/fraud/:bookingId | Latest fraud score/report for a booking. |

**Implementation:** `services/ai` (fraud-check), `services/ai-manager` (risk-check), `services/ai-operator` (fraud_risk + booking_integrity). Web-app: `lib/ai-fraud.ts`, `lib/bnhub/fraud.ts`.

---

## 6. Demand Forecasting Intelligence

### Purpose

Predict demand by market and date to guide pricing and inventory.

### Inputs

- Search traffic, bookings by date, occupancy rates
- Seasonality, pricing trends, review activity

### Outputs

- **Demand score by city** (or region)
- **High-demand periods** (date ranges or list)
- **Low-demand periods**
- **Market opportunity indicators**
- **Supply shortage alerts**

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/demand/forecast | Forecast from body (market, fromDate, toDate, etc.). |
| POST | /api/ai/demand | Same (legacy). |
| POST | /api/ai-operator/demand/forecast | Operator flow with decision log. |
| GET | /api/ai/demand/:market | Latest forecast for a market. |
| GET | /api/ai-operator/forecast/:market | Same from operator. |

**Implementation:** `services/ai` (demand), `services/ai-manager` (demand-forecast), `services/ai-operator` (demand_forecast agent). Web-app: `lib/ai-demand.ts`.

---

## 7. Host Performance Intelligence

### Purpose

Score host quality and suggest improvements and revenue optimizations.

### Inputs

- Response time, review ratings, cancellation rates, acceptance rates
- Occupancy trends, revenue trends, listing quality score

### Outputs

- **Host quality score** (0–100)
- **Strengths** (list)
- **Weaknesses** (list)
- **Improvement suggestions**
- **Revenue optimization suggestions**
- **Badge eligibility suggestions** (e.g. rising, quality, superhost)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/hosts/analyze | Analyze from body (hostId, metrics). |
| POST | /api/ai-operator/hosts/analyze | Operator flow with decision log. |
| GET | /api/ai/hosts/:hostId | Latest host analysis/report. |
| GET | /api/ai-operator/hosts/:hostId | Same from operator. |

**Implementation:** `services/ai-manager` (host-insights), `services/ai-operator` (host_performance agent). Web-app: `lib/ai-host-insights.ts`.

---

## 8. Support Intelligence

### Purpose

Classify tickets, summarize conversations, suggest replies, recommend escalation.

### Inputs

- Ticket subject/body, conversation messages (optional)
- Dispute context (optional)

### Outputs

- **Ticket category** (e.g. payment, cancellation, dispute, verification)
- **Urgency score** (e.g. 1–10)
- **Suggested next step**
- **Support summary** (for conversations/disputes)
- **Escalation recommendation** (team or none)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/support/triage | Triage from body (subject, body, messages). |
| POST | /api/ai/support/summarize | Summarize dispute or conversation. |
| POST | /api/ai/support | Legacy multi-action (type: host_question, guest_question, dispute_summary, suggest_response). |
| POST | /api/ai-operator/support/triage | Operator flow with decision log. |

**Implementation:** `services/ai` (support), `services/ai-manager` (support-assistant), `services/ai-operator` (support_triage agent). Web-app: `lib/ai-support.ts`.

---

## 9. Marketplace Health Intelligence

### Purpose

Monitor overall platform health and surface anomalies and regional risks.

### Inputs

- Listings growth, bookings volume, payment failures, dispute rates
- Fraud alerts, support volume, cancellation trends, host activity

### Outputs

- **Marketplace health score** (0–100)
- **Anomaly alerts** (list)
- **Regional warnings**
- **Operational recommendations**

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/marketplace/health | Compute health from body (period, trends, volumes). |
| POST | /api/ai-operator/marketplace/health | Operator flow with decision log and optional alert. |
| GET | /api/ai/marketplace/dashboard | Aggregated health, alerts, and metrics for dashboard. |

**Implementation:** `services/ai-operator` (marketplace_health agent). Web-app: `lib/ai-marketplace-health.ts`, admin AI and operator dashboards.

---

## 10. AI Data Pipeline

### Purpose

Collect and normalize platform data for AI models and metrics.

### Data sources

- Listings (fields, status, counts)
- Bookings (counts, status, dates)
- Payments (volume, success/failure)
- Reviews (counts, ratings)
- Messages (volume, by booking)
- Searches (volume, filters — if tracked)
- Cancellations, refunds
- Host activity (listings, response times)
- Support tickets (counts, status)

### Pipeline capabilities

- **Data normalization** — Consistent shapes and units (e.g. cents, dates in UTC).
- **Feature extraction** — Derived fields (e.g. occupancy rate, cancellation rate per host).
- **Aggregated AI-ready metrics** — By listing, host, market, date range.
- **Scheduled refresh jobs** — Daily/hourly aggregation jobs.
- **Secure internal storage** — Metrics and caches only in internal stores or DB; no PII in AI pipeline storage unless required and governed.

### Implementation

- **Web-app:** `lib/ai-data-pipeline.ts` — `collectAiPipelineMetrics()` aggregates counts and by-city metrics from Prisma.
- **Trigger:** `GET /api/admin/ai/pipeline` or cron.
- **Services:** `services/ai` pipeline stub; `services/ai-operator` jobs pull from LISTINGS_SERVICE_URL, BOOKINGS_SERVICE_URL, etc. when set.

---

## 11. AI Database Models

AI-related tables store scores, recommendations, and triage results for dashboards and explainability.

| Table | Purpose |
|-------|---------|
| **ai_listing_reports** | listing_id, quality_score, suggestions (JSON), created_at |
| **ai_pricing_recommendations** | listing_id, recommended_price, price_min, price_max, confidence, factors (JSON), created_at |
| **ai_fraud_scores** | booking_id (or entity_id), risk_score, risk_level, reason_summary, factors (JSON), created_at |
| **ai_demand_forecasts** | market, forecast_level, details (JSON), forecast_date, created_at |
| **ai_host_scores** | host_id, score, details (JSON), created_at |
| **ai_support_triage** | ticket_id, category, urgency, suggested_action, created_at |
| **ai_marketplace_health** | market (or "global"), health_score, alerts (JSON), created_at |

Additional tables already in use:

- **AiOperatorDecision** — Every operator agent run: agentType, entityType, entityId, inputSummary, outputSummary, confidenceScore, recommendedAction, reasonCodes, automatedAction, humanOverride fields, createdAt.
- **AiOperatorAlert** — Open/acknowledged/resolved alerts from operators (alertType, severity, entityType, entityId, message, status).
- **AiPricingRecommendation**, **FraudScore**, **DemandForecast**, **AiDecisionLog**, **AiAlert** — Existing in `apps/web/prisma/schema.prisma`.

Schema details: see [BNHUB-production-schema.prisma](database/BNHUB-production-schema.prisma) and [BNHUB-SCHEMA-DESIGN.md](database/BNHUB-SCHEMA-DESIGN.md) for production BNHub + AI tables.

---

## 12. AI Jobs and Automation

Scheduled jobs keep scores and recommendations up to date.

| Job | Suggested schedule | Description |
|-----|--------------------|-------------|
| Listing quality analysis | Daily | Run listing intelligence on new or updated listings; write ai_listing_reports. |
| Pricing updates | Daily | Refresh pricing recommendations per listing (or per market). |
| Fraud checks | Hourly | Evaluate recent bookings for fraud/risk; write ai_fraud_scores and alerts. |
| Demand forecast refresh | Daily | Update demand by market; write ai_demand_forecasts. |
| Host score refresh | Daily | Recompute host performance; write ai_host_scores. |
| Support triage refresh | Every 30 min | Triage open tickets; update ai_support_triage. |
| Marketplace health refresh | Every 6 h | Run marketplace health agent; write ai_marketplace_health and alerts. |

**Implementation:** `services/ai-operator` (cron when `RUN_JOBS=true`), `services/ai-manager` (jobs). Run once via `npm run jobs:ai-operator` or `npm run jobs:ai-manager`.

---

## 13. Dashboard Integration

### Host dashboard

- **Listing quality score** — From GET /api/ai/listings/:listingId/report or recommendations API.
- **Pricing recommendations** — From GET /api/ai/pricing/:listingId or pricing widget (existing).
- **Demand indicators** — From demand forecast API or host insights (high/low demand dates).
- **Host performance insights** — From GET /api/ai/hosts/:hostId or host insights API.
- **AI Insights** section already aggregates listing improvements, demand, and revenue tips.

### Admin dashboard

- **Fraud alerts** — From AiOperatorAlert and fraud score APIs; show in AI Operator Dashboard and AI Monitoring.
- **Risky bookings** — List bookings with high fraud/risk score; link to decision log.
- **Suspicious listings** — From listing moderation alerts and quality reports.
- **Marketplace health alerts** — From ai_marketplace_health and operator alerts.
- **AI decision logs** — From AiOperatorDecision and AiDecisionLog; viewer in Admin AI and AI Operator pages.

### Support dashboard

- **Ticket triage** — Category, urgency, suggested action from support intelligence APIs.
- **Conversation summaries** — From POST /api/ai/support/summarize or triage response.
- **Urgency indicators** — From urgency score in triage output.
- **Suggested responses** — From support suggest_reply or triage suggestedReply.

---

## 14. Explainability and Decision Logs

Every AI output should support explainability and audit.

### Per-output fields

- **Score or recommendation** — Main numeric or categorical result.
- **Confidence level** — 0–1 or low/medium/high.
- **Reason summary** — Short text or reason codes (e.g. `reasonCodes[]`).
- **Timestamp** — When the output was produced.
- **Related entity id** — listingId, bookingId, hostId, ticketId, market.
- **Human reviewed** — Flag or override record when a human has reviewed or overridden.

### AI decision logs

- **AiOperatorDecision** — Full record per agent run: inputSummary, outputSummary, confidenceScore, recommendedAction, reasonCodes, automatedAction, humanOverride (overrideBy, newAction, notes), createdAt.
- **AiDecisionLog** — Legacy model-driven decisions (e.g. fraud, ranking) with modelId, entityType, entityId, decision, score, explanation, overrideBy, overrideAt.
- Admin UIs: **AI Control Center** (`/admin/ai`), **AI Operator Dashboard** (`/admin/ai-operator`), **AI Monitoring** (`/admin/ai-monitoring`) show logs, alerts, and override controls.

---

## 15. Security and Governance

### Principles

- **Sensitive data** — No unnecessary PII in AI services; use entity IDs and aggregated metrics where possible. Access to raw data only via authorized core APIs.
- **Internal-only access** — AI endpoints that run jobs or expose internals should be restricted to backend or admin (e.g. role-based).
- **Role-based access** — Host-facing APIs (e.g. pricing, listing report) scoped to the host’s resources; admin-only for fraud, health, decision logs.
- **Audit logging** — All overrides and material admin actions on AI decisions logged (overrideBy, overrideAt, newAction, notes).
- **No automatic permanent punitive actions** — No auto-ban, auto-seize funds, or final legal action; such actions require human review (see [AI-OPERATOR.md](AI-OPERATOR.md) automation boundaries).
- **Explainable outputs** — Scores, reason codes, and summaries provided for every recommendation or flag.
- **Safe integration** — Moderation and fraud tools consume AI outputs as recommendations; final decisions remain with humans or governed workflows.

### Implementation

- Policies: `services/ai-operator/src/policies/automation-boundaries.ts` — allowed vs human-required actions.
- Auth: Enforce session or JWT in web-app; restrict `/api/admin/ai/*` and `/api/ai-operator/*` to admin or service-to-service.
- Logging: Use AiOperatorDecision and AiDecisionLog for audit trail.

---

## 16. Testing

### Test areas

| Area | What to test |
|------|----------------------|
| Listing scoring | Output shape (quality score, suggestions list, completeness status); boundaries (empty title, full listing). |
| Pricing recommendation | Output shape (recommended price, range, confidence); consistency with inputs (e.g. high demand → higher price). |
| Fraud score | Output shape (risk score, level, recommended action); low vs high signals; no auto-block without policy. |
| Demand forecast | Output shape (demand level, high/low dates, alerts); structure stable across markets. |
| Host score | Output shape (score, strengths, weaknesses, badge); with/without optional metrics. |
| Support triage | Category and urgency for known patterns (payment, cancellation, dispute); suggested reply presence. |
| Dashboard data | APIs return expected shapes; admin/host/support views receive correct scoped data. |
| Access control | Unauthorized access to admin/operator endpoints returns 401/403; host can only see own listing/host data. |

### Implementation

- **services/ai** — Vitest tests for listing-analysis, pricing, fraud, support.
- **services/ai-manager** — Tests for listing-quality, pricing, risk-check, support-assistant.
- **services/ai-operator** — Tests for listing moderation, pricing, fraud, booking integrity, policies, decision store and override.
- Web-app: `lib/__tests__/` for ai-pricing, ai-fraud, ai-ranking where present.

---

## 17. Final Requirement Summary

The AI-optimized architecture enables BNHub to:

| Goal | How |
|------|-----|
| **Improve listing quality** | Listing intelligence (scores, missing info, title/description/amenity/photo suggestions) and moderation agent. |
| **Suggest better prices** | Pricing intelligence (recommended price, range, confidence, demand indicators, min stay, special pricing). |
| **Detect fraud risks** | Fraud and risk intelligence (fraud score, booking risk level, recommended action, escalate/flag) and booking integrity agent. |
| **Forecast demand** | Demand forecasting (demand by market, high/low periods, supply and opportunity indicators). |
| **Guide hosts** | Host performance intelligence (quality score, strengths/weaknesses, improvements, revenue tips, badge eligibility) and host insights API. |
| **Assist support teams** | Support intelligence (triage, summarize, urgency, suggested reply, escalation recommendation). |
| **Monitor marketplace health** | Marketplace health intelligence (health score, anomaly alerts, regional warnings, operational recommendations). |

**Requirements met:**

- **Modular architecture** — Separate domains (listing, pricing, fraud, demand, host, support, marketplace) with clear APIs and shared pipeline/logging.
- **Scalable AI services** — Standalone services (ai, ai-manager, ai-operator) can scale independently; web-app can run in-process or proxy.
- **Clean APIs** — REST endpoints with consistent request/response shapes; GET for latest report by entity, POST for compute.
- **Production-oriented structure** — Controllers, services, models, jobs, prompts, tests; decision logs and alerts; automation boundaries.
- **Readable and documented code** — This doc plus AI-MANAGEMENT-LAYER, AI-PLATFORM-MANAGER, AI-OPERATOR, and inline comments.
- **Ready for expansion** — New agents or domains can be added to ai-operator or as new modules; pipeline and DB models support new AI outputs.

---

## Quick reference: endpoints by domain

| Domain | POST (compute) | GET (latest/report) |
|--------|----------------|---------------------|
| Listing | /api/ai/listings/analyze, /api/ai/listing-quality, /api/ai-operator/listings/analyze | /api/ai/listings/:listingId/report |
| Pricing | /api/ai/pricing/recommend, /api/ai/pricing, /api/ai-operator/pricing/recommend | /api/ai/pricing/:listingId, /api/ai-operator/pricing/:listingId |
| Fraud/Risk | /api/ai/fraud/evaluate, /api/ai/risk-check, /api/ai-operator/fraud/evaluate, /api/ai-operator/bookings/check | /api/ai/fraud/:bookingId |
| Demand | /api/ai/demand/forecast, /api/ai-operator/demand/forecast | /api/ai/demand/:market, /api/ai-operator/forecast/:market |
| Host | /api/ai/hosts/analyze, /api/ai-operator/hosts/analyze | /api/ai/hosts/:hostId, /api/ai-operator/hosts/:hostId |
| Support | /api/ai/support/triage, /api/ai/support/summarize, /api/ai-operator/support/triage | — |
| Marketplace | /api/ai/marketplace/health, /api/ai-operator/marketplace/health | /api/ai/marketplace/dashboard |

All of the above sit **on top of** the existing BNHub marketplace (users, listings, search, bookings, payments, messaging, reviews) and integrate with the host dashboard, admin dashboard, and support tools without replacing core transactional logic.
