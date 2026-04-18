# Listing quality & health system

BNHub stay listings (`ShortTermListing` / `bnhub_listings`) receive a cached **listing quality score** and generated **health actions**. Scores complement platform **trust**, **reputation**, and search **ranking** — they do not replace fraud review or verification.

## Schema

- `ListingQualityLevel`: `poor` | `needs_improvement` | `good` | `excellent`
- `ListingHealthStatus`: `needs_attention` | `improving` | `healthy` | `top_performer`
- `ListingHealthActionPriority`: `high` | `medium` | `low`
- `listing_quality_scores` — one row per listing (`listing_id` unique)
- `listing_health_actions` — actionable rows (open actions replaced on each full recompute)

## Scoring model (0–100)

Weighted components:

| Component     | Weight |
| ------------- | ------ |
| Content       | 0.28   |
| Pricing       | 0.18   |
| Performance   | 0.22   |
| Behavior      | 0.17   |
| Trust blend   | 0.15   |

**Content** — title length, description depth, amenities count, photo count (prefers `BnhubListingPhoto` when present).

**Pricing** — peer median nightly rate in the same city (sample), optional drift vs latest `ListingPricingSnapshot`, competitiveness fields when present.

**Performance** — `ListingSearchMetrics` (CTR, conversion), `ListingLearningStats`, `ListingAnalytics` (`kind: BNHUB`).

**Behavior** — `HostPerformance` for the host, plus booking status mix on the listing (completion vs cancellation).

**Trust** — blended `platform_trust_scores` (listing + host), `reputation_scores` (listing + host), listing verification status, `fraud_risk_scores`, open `bnhub_fraud_flags`.

**Quality level** from overall score:

- 0–29 `poor`
- 30–54 `needs_improvement`
- 55–79 `good`
- 80+ `excellent`

**Health status** combines overall score with performance/behavior sub-scores (rule-based).

## Health actions

Regenerated on each full update: unresolved actions are cleared and recreated from thresholds (photos, copy, amenities, pricing vs peers, CTR, response time, cancellations, Instant Book, verification, host identity).

## Recompute triggers

- BNHub listing engine refresh (`refreshAllBnhubListingEngines`) after trust/tier/pricing pipelines
- Listing **reputation** update when `entityType === listing`
- Platform **trust** update when `entityType === listing`
- **Booking** created
- Guest **review** submitted (BNHub `Review` flow)
- Debounced `scheduleListingQualityRecompute` for async paths

Hosts and admins can **POST** `/api/quality/recompute/{listingId}`.

## APIs

- **GET** `/api/quality/listing/{id}` — published listings: public score summary; owners also receive open actions
- **POST** `/api/quality/recompute/{listingId}` — host (owner) or admin

## Ranking

1. **Marketplace sub-score** — `scoreListingForSearch` in `lib/bnhub/ranking/listing-ranking.ts` blends on-page content heuristics with `cachedListingQuality01` (from `attachReviewAggregatesForSearch`) using `blendedListingQuality01` (~42% heuristic / ~58% cached when a row exists).

2. **Search boost map** — `getListingQualitySearchAdjustMapForIds` in `lib/bnhub/bnhubSearchRankSignals.ts` applies a modest signed adjustment from level + health status in recommended sorts and in the **AI ranking engine** ordering (`orderBnhubListingsByRankingEngine` extra boost). Missing rows → neutral (0).

## Public UI

Excellent/good listings with sufficient score may show a subtle **quality** pill on the BNHub listing page (`getPublicListingQualityBadge`). Stays search result cards show the same label when present (`qualityBadgeLabel` on search rows).

## Admin & host UI

- Host: `/dashboard/listings/[id]/quality` (owner-only)
- Admin: `/admin/quality` — distribution, lowest/highest cached scores, high-traffic low-conversion heuristic

## Operations

Apply migration `20260404003000_listing_quality_health_system`. Backfill: trigger host recompute or call POST recompute for active listings.
