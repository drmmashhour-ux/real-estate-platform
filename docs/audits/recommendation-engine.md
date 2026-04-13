# Recommendation engine (BNHub + marketplace)

## Goals

Surface **similar stays**, **personalized** rails, **trending**, **continue browsing**, and **saved-based** suggestions with hybrid scoring, diversity rules, and optional date-aware availability for BNHub.

## Data inputs (tracked today)

| Signal | Where |
|--------|--------|
| Searches | `SearchEvent` (`SEARCH` + metadata city) |
| Clicks / views | `SearchEvent` `VIEW` / `CLICK`; `UserBehaviorEvent` |
| Saves | BNHub: `SearchEvent` `SAVE`, `BnhubGuestFavorite`; FSBO: `BuyerSavedListing` |
| Bookings | `Booking`, `SearchEvent` `BOOK` |
| Learned preferences | `UserSearchProfile` (rollup via `buildUserSearchProfileFromEvents`) |
| Intelligence overlay | `UserIntelligenceProfile` (used in `buildUserSignals`) |
| Popularity | `ListingSearchMetrics` |
| Recent views | `SearchEvent` + `AiUserActivityLog` (`listing_view`) |

Call `refreshUserSearchProfileFromActivity(userId)` after meaningful search sessions if you need fresher profiles (existing hourly throttle in `trackSearchEvent`).

## Recommendation types

| Module | Role |
|--------|------|
| `get-similar-listings.ts` | Same-city price band, type/guest/amenity fit, hybrid score, host/area diversity, optional `checkIn`/`checkOut` filter |
| `get-personalized-listings.ts` | Logged-in: `buildUserSignals` + preference match + popularity |
| `get-trending-listings.ts` | Metrics-heavy + freshness |
| `get-recently-viewed.ts` | Continue browsing |
| `get-saved-based-listings.ts` | From `BnhubGuestFavorite` seeds |
| `get-city-recommendations.ts` | Marketing city pages |

## Hybrid score (tunable)

Default weights (`DEFAULT_HYBRID_WEIGHTS`):

```text
similarity 0.40 + preference 0.25 + popularity 0.20 + quality 0.10 + exploration 0.05 → 0–100
```

Similarity for “similar stays” is a weighted mix of city, price, type, guests/beds, amenities (Jaccard), and a simple quality proxy (reviews + photos).

Use `mergeHybridWeights` for experiments.

## Diversity

- Reuse `diversifyByHost` / `diversifyByAreaAndType` from `lib/ranking/diversity.ts`.
- `dedupeAgainstSeen` / `excludeIds` avoid duplicate cards across stacked homepage rails.

## Analytics

- `logRecommendationEngagement` writes `SearchEvent` with `metadata.reco`, `recoWidget`, `recoSource`.
- `GET /api/admin/recommendations/stats` + `/admin/recommendations` aggregate CTR by source and widget.

## Future work

- FSBO hybrid rails using `BuyerSavedListing` centroids + price proximity.
- Session-level dedupe across tabs.
- Booking attribution when checkout payload includes `recoSource`.
- Learned exploration weight from online outcomes.

## QA checklist

- Similar listings cluster by city/price; amenity overlap nudges ranking.
- Personalized rail shifts when `UserSearchProfile` has cities/types.
- Trending responds to `ListingSearchMetrics` changes.
- With `checkIn`/`checkOut`, similar list excludes unavailable stays (best-effort async checks).
