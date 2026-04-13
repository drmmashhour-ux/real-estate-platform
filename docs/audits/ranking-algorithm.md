# Ranking algorithm (BNHub + real estate)

This document describes the **unified 8-factor score**, how it combines with **exploration**, **diversity**, and **anti-gaming**, and where it runs in the product.

## Data sources

| Signal | BNHub | FSBO / marketplace |
|--------|--------|---------------------|
| Impressions / views | `ListingSearchMetrics.views7d`, `views30d` | `BuyerListingView` counts on `FsboListing` |
| Clicks / CTR | `ListingSearchMetrics.ctr` | Derived from views vs leads where available |
| Saves | `BnhubGuestFavorite` | `BuyerSavedListing` |
| Contact / booking funnel | `SearchEvent`, `UserBehaviorEvent`, `AiConversionSignal` (feedback loops) | `FsboLead` |
| Reviews | Reviews + `PropertyRatingAggregate` | Trust / verification signals (review pillar placeholder) |
| Host / broker responsiveness | `HostPerformance`, `HostBadge` | Lead conversion proxy |
| Price competitiveness | vs cohort median (`medianNightPriceCents` / `medianPriceCents`) | Same pattern |
| Photos & completeness | `photoCount`, amenities, description, rules | `images[]`, description length |
| Freshness | `createdAt`, `updatedAt` | Same |
| Availability | Search context `checkIn` / `checkOut` vs slots | N/A (fixed 0.75 in FSBO bundle) |

Persisted explanations and legacy pillar scores live in `listing_ranking_scores` (recompute jobs). **Live search** uses `lib/ranking/*` unified scoring on top of `RankingSignalBundle` from `signalEngine.ts`.

## Unified components (0–1 each)

Eight pillars map to a single **0–100** `rank_score`:

| Component | Meaning |
|-----------|---------|
| `relevance_score` | Query / city / budget / guest / type match |
| `quality_score` | Description, photos, amenities, completeness |
| `trust_score` | Verification, disputes, moderation |
| `performance_score` | Blend of engagement + conversion + host signals |
| `price_score` | Competitiveness vs median |
| `freshness_score` | Recency of create/update |
| `availability_score` | Date-specific availability when searching with dates |
| `exploration_score` | New or under-exposed inventory (homepage uses in-formula; search uses post-blend — see below) |

Default weights (`DEFAULT_UNIFIED_RANK_WEIGHTS`):

```text
relevance 0.25, quality 0.15, trust 0.15, performance 0.20,
price 0.10, freshness 0.05, availability 0.05, exploration 0.05
```

Weights are merged with `mergeRankWeights()` for vertical-specific tuning (e.g. homepage featured).

### Search path (BNHub + FSBO browse)

- Exploration **5%** is folded into **performance** via `UNIFIED_WEIGHTS_WITHOUT_EXPLORATION`, then a separate **20% / 15%** arm blends in `computeExplorationScore` (`blendPerformanceAndExploration`) so we do **not** double-count exploration.
- Target mix: **~80%** performance-oriented score, **~20%** exploration (BNHub default `explorationMix = 0.2`; FSBO browse `0.15`).

### Homepage featured

`HOMEPAGE_FEATURED_UNIFIED_WEIGHTS` emphasizes quality, trust, performance, and freshness; exploration enters **inside** the 8th component (`mapSignalsToRankComponents` + `computeExplorationScore`).

## Formulas (high level)

- **Performance pillar**: `0.38·engagement + 0.35·conversion + 0.27·host` (clamped 0–1).
- **Unified score**: weighted average of the eight components → **0–100** (`computeRankScore`).
- **Exploration** (`exploration.ts`): boosts new listings and high-quality, low-view inventory using age decay + inverse exposure + quality.
- **Anti-gaming** (`applyAntiGamingBnhub`, `applyAntiGamingRealEstate`): soft penalties for extreme price vs median, very low CTR at high views, thin FSBO shells, price outliers.

## Diversity

After sorting by final score, BNHub search applies:

1. `diversifyByHost` — cap repeated hosts in the top prefix.
2. `diversifyByAreaAndType` — cap repeated city/region/property buckets.

Homepage featured uses the same helpers with location + property buckets.

## Fairness & tuning

- Penalties are **multiplicative soft caps**, not hard bans — legitimate edge cases keep some visibility.
- Fraud integration (`getBnhubFraudPenaltyMap`) still subtracts from BNHub totals after scoring.
- **Future tuning**: expose `mergeRankWeights` patches via `ranking_configs` or env; A/B `explorationMix`; cohort-specific medians; explicit impression counts from `RankingImpressionLog` merged into engagement.

## Code map

| File | Role |
|------|------|
| `lib/ranking/compute-rank-score.ts` | Components, default weights, anti-gaming BNHub |
| `lib/ranking/compute-bnhub-score.ts` | BNHub search final score |
| `lib/ranking/compute-real-estate-score.ts` | FSBO browse final score |
| `lib/ranking/compute-homepage-score.ts` | Homepage featured weights + score |
| `lib/ranking/exploration.ts` | Exploration score + 80/20 blend |
| `lib/ranking/diversity.ts` | Host / bucket diversification |
| `lib/ranking/listing-improvement-feedback.ts` | Host/broker hint strings |
| `lib/ranking/admin-ranking-snapshot.ts` | Admin dashboard aggregates |
| `src/modules/ranking/rankingService.ts` | `orderBnhubListingsByRankingEngine`, `scoreRealEstateListingsForBrowse` |
| `src/modules/ranking/signalEngine.ts` | `RankingSignalBundle` construction |

## Tests

Unit tests in `apps/web/tests/ranking/unified-ranking.test.ts` cover monotonicity, exploration blend, and diversity invariants.
