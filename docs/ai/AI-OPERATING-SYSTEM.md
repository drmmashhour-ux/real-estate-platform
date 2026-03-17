# AI Operating System (AI-OS) Layer

The AI-OS powers intelligent automation, risk detection, pricing, ranking, demand forecasting, and platform optimization across LECIPM.

## 1. AI Data Pipeline

**Purpose:** Event ingestion, normalization, feature extraction, and a model-ready feature store with privacy in mind.

**Components:**
- **ingestAiEvent** – Normalized platform events (can reuse PlatformEvent or dedicated ingestion).
- **AiFeature** – Entity-scoped features (entityType, entityId, featureKey, value, valueJson, source, computedAt).
- **upsertAiFeature** / **getEntityFeatures** / **getFeaturesByKey** – Feature store read/write.
- **extractListingFeatures** – Derives listing_avg_rating, listing_review_count, listing_conversion, listing_verification, listing_host_quality, listing_super_host for ranking/fraud.

**Usage:** Call `extractListingFeatures(listingId)` when listing or reviews change; use `getEntityFeatures` as model input.

---

## 2. Fraud Detection AI

**Purpose:** Aggregate fraud signals into entity risk scores, priority, and automated flags; connect to trust & safety and booking/payout logic.

**Components:**
- **FraudScore** – entityType, entityId, score (0–1), factors (JSON), modelVersion, priority (HIGH/MEDIUM/LOW).
- **computeFraudScore** – Weights signals by type (e.g. PAYMENT_FRAUD 1.2, ACCOUNT_TAKEOVER 1.2); returns score and priority.
- **evaluateAndStoreFraudScore** – Persists FraudScore and optionally logs to AiDecisionLog.
- **getFraudScore** – Returns latest score for an entity.
- **recordFraudSignalAndScore** – Creates FraudSignal (via existing createFraudSignal), then re-runs fraud score.

**Integration:**
- **Booking:** Before creating a booking, `getFraudScore("USER", guestId)` is passed to `canConfirmBooking({ fraudScore })` so policy can deny when score > threshold.
- **Trust & safety:** Use fraud score and priority in admin dashboards and investigation queues.
- **Payouts:** Policy engine can hold payout when user fraud score is high.

**APIs:**
- `GET/POST /api/admin/ai/fraud-score?entityType=&entityId=` – Get or recompute fraud score.

---

## 3. Dynamic Pricing Intelligence

**Purpose:** AI-driven nightly price, range, min stay, and demand level for BNHub listings.

**Components:**
- **AiPricingRecommendation** – listingId, recommendedCents, minCents, maxCents, demandLevel, minStayNights, factors (JSON), modelVersion, forDate.
- **getAiPricingRecommendation** – Uses existing `getPricingRecommendation` (market avg, demand, rules), adds ±15% range, stores in AiPricingRecommendation.
- **getLatestAiPricingRecommendation** / **listAiPricingRecommendations** – For host dashboard and analytics.

**APIs:**
- `GET /api/ai/pricing/[listingId]` – Recommendation for host dashboard (stores by default).
- `GET /api/admin/ai/pricing?listingId=&checkIn=&store=` – Admin; list when no listingId.

---

## 4. Search Ranking Optimization

**Purpose:** AI ranking score and factor breakdown; cached in SearchRankingScore for search and explanations.

**Components:**
- **SearchRankingScore** – listingId, score, factors (JSON), modelVersion, computedAt.
- **computeAiRankingScore** – Same logic as `computeListingRankScore` with explicit factor list (verification, superHost, hostQualityScore, reviewScore, reviewCount, conversion).
- **computeAndStoreRankingScore** – Fetches listing, gets weights, computes score and factors, writes SearchRankingScore.
- **getListingRankingScore** – Latest cached score for a listing.

**Integration:** Existing search uses `computeListingRankScore` and configurable weights; AI layer adds stored scores and explanations for Control Center and debugging.

**APIs:**
- `GET/POST /api/admin/ai/ranking?listingId=` – Get or recompute ranking score.

---

## 5. Demand Forecasting

**Purpose:** Predict demand by region (city), optional property type; supply gaps and expansion signals.

**Components:**
- **DemandForecast** – region, propertyType, forecastDate, demandLevel (0–1), bookingsPredicted, supplyGap, modelVersion.
- **computeDemandForecast** – Uses recent booking count and listing count in region to compute occupancy proxy and demand level; optionally stores forecast.
- **getDemandForecasts** – List stored forecasts with filters.

**APIs:**
- `GET /api/admin/ai/demand?region=&from=&to=` – List forecasts; `?forecast=true&region=&date=` for on-the-fly.
- `POST /api/admin/ai/demand` – Compute and optionally store (region, forecastDate, propertyType, store).

---

## 6. Host and Listing Optimization AI

**Purpose:** Recommendations for descriptions, photos, pricing, verification, reviews.

**Components:**
- **getHostListingRecommendations** – Returns array of { type, priority, title, description, action }: photos (if &lt;5), description (if &lt;100 chars), verification (if not VERIFIED), pricing (vs AI recommendation), reviews (if low rank and few reviews).

**APIs:**
- `GET /api/ai/recommendations/[listingId]` – For host dashboard.

---

## 7. Customer Support AI

**Purpose:** Ticket classification, urgency, suggested responses, dispute summarization.

**Components:**
- **classifySupportTicket** – Rule-based: category (payment, cancellation, dispute, verification), urgency (low/medium/high/critical), suggestedTags, suggestedResponse.
- **summarizeDispute** – First N messages + dispute description excerpt for support view.

**APIs:**
- `POST /api/ai/support/classify` – Body: subject, body, entityType, entityId; returns classification.

---

## 8. Marketplace Health AI

**Purpose:** Detect fraud/dispute spikes and anomalies; create AiAlert for ops.

**Components:**
- **AiAlert** – alertType (FRAUD_SPIKE, DISPUTE_SPIKE, LISTING_QUALITY_DROP, etc.), severity, title, message, entityType/entityId/region, payload, acknowledgedAt/By.
- **checkFraudSpike** / **checkDisputeSpike** – Count events in last N hours; create alert if above threshold.
- **getActiveAiAlerts** / **acknowledgeAiAlert** – For Control Center and ops.
- **runMarketplaceHealthChecks** – Runs fraud and dispute spike checks.

**APIs:**
- `GET /api/admin/ai/alerts` – Active alerts; `?run=true` to run health checks.
- `POST /api/admin/ai/alerts/[id]/acknowledge` – Acknowledge (body: acknowledgedBy).

---

## 9. AI Control Center

**Purpose:** Single console to monitor AI systems, view decision logs, and apply overrides.

**Features:**
- Model registry (list AiModel + latest version).
- Counts: fraud scores, pricing recommendations, demand forecasts.
- Active AI alerts list.
- Recent AI decision log (model, entity, decision, score, time).

**Page:** `/admin/ai` – Server-rendered dashboard; links from main admin nav.

**APIs:**
- `GET /api/admin/ai/models` – List models (ensures default models exist).
- `POST /api/admin/ai/models` – Register model version (modelKey, version, metrics, deploy).
- `GET /api/admin/ai/decisions` – Paginated decision log (modelKey, entityType, entityId, decision).
- `POST /api/admin/ai/decisions/[id]/override` – Record admin override (body: overriddenBy).

---

## 10. Model Lifecycle Management

**Purpose:** Registry, versioning, deployment, rollback.

**Components:**
- **AiModel** – key, name, description, active.
- **ModelVersion** – modelId, version, metrics (JSON), deployedAt, deprecatedAt.
- **ensureAiModels** – Upserts default models (fraud, pricing, ranking, demand).
- **listAiModels** – Models with latest version.
- **registerModelVersion** – Create version; optional deploy (deprecates previous).

---

## 11. AI Governance and Transparency

- **AiDecisionLog** – Every logged decision has modelId, modelVersion, entityType, entityId, decision, score, explanation, context; optional overrideBy/overrideAt.
- **Explanation** – Fraud factors, ranking factors, pricing factors stored in JSON for audit.
- **Policy engine** – Fraud score is an input to `canConfirmBooking`; policy rules can deny or hold based on threshold.

---

## 12. Security and Privacy

- Feature store is entity-scoped; no raw PII in feature keys; value can be numeric or hashed.
- AI APIs under `/api/admin/ai/*` should be restricted to admin/ops roles in production.
- Public-facing AI APIs: `/api/ai/pricing/[listingId]`, `/api/ai/recommendations/[listingId]` – scope to listing owner or authenticated host where applicable.

---

## Database Models (AI-OS)

- **AiFeature** – Feature store.
- **AiModel**, **ModelVersion** – Registry and lifecycle.
- **FraudScore** – Aggregated fraud risk per entity.
- **AiPricingRecommendation** – Stored pricing AI output.
- **SearchRankingScore** – Cached ranking score and factors.
- **DemandForecast** – Stored demand predictions.
- **AiAlert** – Marketplace health alerts.
- **AiDecisionLog** – Audit trail and overrides.

---

## Testing

- **lib/__tests__/ai-fraud.test.ts** – computeFraudScore (no signals, HIGH/MEDIUM priority), getFraudScore.
- **lib/__tests__/ai-pricing.test.ts** – getAiPricingRecommendation output shape and store flag.
- **lib/__tests__/ai-ranking.test.ts** – computeAiRankingScore factors (verification, superHost, reviewScore).

Run: `npm run test -- --run` in `apps/web-app`.
