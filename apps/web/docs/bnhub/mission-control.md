# BNHub Mission Control V1

## Purpose

Single **read-only** operational view per listing that combines:

- Explainable **ranking** score (same `computeBNHubListingRanking` cohort as host performance)
- **Host** performance status (classifier + ranking-derived weak/strong signals)
- **Guest conversion** summary (existing guest conversion layer)
- **Booking health** heuristic from funnel metrics (starts / paid completions vs views)
- **Trust** (ranking trust subscore + review count → display score)
- **Pricing** label from ranking price competitiveness subscore (not auto-pricing)

No booking, Stripe, listing, ranking, or pricing mutations.

## Signals

| Layer | Source |
|-------|--------|
| Ranking | `computeBNHubListingRanking` over host cohort (up to 80 listings) |
| Host status | `classifyHostListingPerformance` |
| Guest conversion | `buildGuestConversionSummary` |
| Booking health | Derived string from guest `listingMetrics` |
| Trust display | `trustScoreBreakdown × 5` capped + small review bonus (advisory) |
| Pricing | `competitive` / `neutral` / `elevated_vs_cohort` / `unknown` |

## Recommendations

Deterministic strings in `mission-control-recommendations.service.ts`, capped (no guarantees, no auto-execution).

## Feature flag

`FEATURE_BNHUB_MISSION_CONTROL_V1` (default off). Code: `bnhubMissionControlFlags.missionControlV1` / `FEATURE_BNHUB_MISSION_CONTROL_V1`.

## UI

Host dashboard → host performance cards → **Mission Control** panel above guest conversion when the flag is on.

## Monitoring

`mission-control-monitoring.service.ts` — counters + `[bnhub:mission-control]` logs; never throws.

## Safety

- Aggregate + analyze + display only  
- No writes to listings, bookings, payments, or rank ordering in production paths  

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/bnhub/mission-control/__tests__
```
