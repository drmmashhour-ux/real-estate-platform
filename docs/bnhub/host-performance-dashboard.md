# BNHub host performance dashboard

## Purpose

Host-facing, **advisory-only** visibility into how short-term listings score in the BNHub ranking model (conversion, quality, trust, freshness, price competitiveness). Helps hosts understand **why** a listing may rank higher or lower and what to improve next — **without** automatic edits, payment changes, or hiding listings.

## Data sources

- `ShortTermListing` rows owned by the host (read-only Prisma query).
- Aggregated review averages via `Review.groupBy` (per listing).
- Ranking scores from `computeBNHubListingRanking(..., { skipMonitoring: true })` so host snapshots do not double-count global `[bnhub:ranking]` monitoring.

If ranking computation fails, listings still appear with a fallback message and conservative status classification.

## Performance status rules

Implemented in `host-performance-status.service.ts`:

- **strong** — high composite score, few weak signals, at least one strong signal (when full ranking exists).
- **healthy** — mid scores or acceptable tradeoffs.
- **watch** — several weaker dimensions or mid-low composite score.
- **weak** — low composite score or many weak signals.

Without full ranking data, status stays in **healthy / watch / weak** bands based on signal counts only (conservative).

## Recommendation logic

`host-recommendations.service.ts` emits deterministic suggestions from:

- Photo and amenity counts
- Description length
- Trust, freshness, price, and conversion subscores from the ranking breakdown

**No guarantees** and no urgency language — copy is informational.

## Feature flags

| Env | Meaning |
|-----|--------|
| `FEATURE_BNHUB_HOST_PERFORMANCE_V1=1` | Show the host performance panel on the BNHub host dashboard. |
| `FEATURE_BNHUB_HOST_RECOMMENDATIONS_V1=1` | Show concrete recommendation bullets (requires performance flag for the panel). |

Default: **off**.

## Safety guarantees

- No automatic listing edits.
- No Stripe, booking, or payout changes.
- No punitive hiding or ranking penalties from this module.
- Rankings are **read-only** inputs to explanations.

## Validation commands

```bash
cd apps/web
pnpm exec vitest run modules/bnhub/host-performance/__tests__/
pnpm exec prisma validate --schema=./prisma/schema.prisma
```

## Related code

- `modules/bnhub/ranking/bnhub-ranking.service.ts` — scoring engine (unchanged behavior for search; host uses `skipMonitoring`).
