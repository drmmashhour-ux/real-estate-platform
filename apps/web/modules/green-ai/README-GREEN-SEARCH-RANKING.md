# Green search & green ranking (LECIPM)

This module adds **Québec-inspired** discovery, filtering, and assistive ranking on top of existing LECIPM green evaluation, grants, ROI hints, and pricing-boost heuristics. It does **not** assert official Rénoclimat, EnerGuide, or government certification.

## Public vs broker / admin

- **Public** (`/api/buyer/browse` with `greenAudience: "public"`, default): each FSBO card can include `green` with scores, label band, **illustrative** incentive total, `rationale`, and a **fixed disclaimer** line. Internal broker strings are not returned in `green`.
- **Broker / admin** (`greenAudience: "internal"` on the same route): also returns `greenIntelligence` with `brokerCallouts`, full `rationale`, and `rankingBoostSuggestion` (assistive, not a placement guarantee). When a **green `sortMode`** is applied, `greenIntelligence.rankingSignal` carries the per-listing `GreenRankingSignal` from the ranker (explanatory, not a government label).
- **BNHub short-term stays** (`/api/listings/search`): `greenFilters` and `sortMode` are **accepted in the request** for API compatibility, but LECIPM FSBO snapshots are **not** attached; the route logs a no-op (stays rows do not carry the same metadata). Existing search still succeeds.
- **Legacy `GET /api/listings`** (array of BNHub stays): response body is **unchanged**; if you pass `?green=1` or `?green=true`, the response includes an **`X-Lecipm-Green-Layer` header** pointing to FSBO / residential search routes (additive hint for clients, no body contract change).

## Filter semantics

Filters in `green-search.types.ts` (`GreenSearchFilters`) are **strict**: if a listing lacks the data needed to evaluate a filter, it **does not** match (deterministic, safe for discovery). Illustrative grant totals are parsed heuristically from `amount` strings; always verify with official program rules.

## Ranking modes

`green-search.types.ts` / `green-ranking.service.ts`:

- `green_best_now` — favors higher modeled current performance.
- `green_upgrade_potential` — favors larger modeled uplift (projected − current).
- `green_incentive_opportunity` — favors **illustrative** incentive opportunity strength (not cash guarantees).
- `standard_with_green_boost` — light blend of base order with small green nudge (weaker in `audience: "public"` than internal).

## Snapshot dependencies

`GreenListingMetadata` in `modules/green/green.types.ts` can include:

- `quebecEsgSnapshot`, `grantsSnapshot` (existing),
- `greenSearchSnapshot` (precomputed: projected score, delta, improvement bucket, illustrative incentives total, boost suggestion, optional solar/green roof flags),
- `greenIntake` (optional structured intake),
- `recommendationsSnapshot` (string[]; folded into public `rationale` lines),
- `incentivesSnapshot` (optional `totalIllustrativeCad` when a single stored total is used),
- `roiSnapshot` (illustrative band / note — not a performance guarantee),
- `pricingBoostSnapshot` (`boostFactor` merged with `greenSearchSnapshot.rankingBoostSuggestion` for internal assistive ranking, capped).

The FSBO green `PATCH` route updates `greenSearchSnapshot` additively when the owner syncs.

## Disclaimers & safe wording

- Public UI copy should say **“Québec-inspired green score / model / discovery”** — not “certified”, not “EnerGuide”, not Rénoclimat approval.
- Always show the **disclaimer** `GREEN_SEARCH_PUBLIC_DISCLAIMER` / `toPublicListingGreenPayload().disclaimer` when any score is shown.
- Broker `greenIntelligence` is for **operations**, not for consumer-facing marketing without review.

## Logging

`[green-ai]` events: `green_search_decoration_applied`, `green_search_filters_applied`, `green_ranking_applied`, `green_snapshot_used`, `green_snapshot_missing` (see `green-search-helpers.ts` and services).

## Tests

`modules/green-ai/tests/*green-search*`
