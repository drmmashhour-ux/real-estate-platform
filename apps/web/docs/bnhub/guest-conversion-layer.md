# BNHub guest conversion layer (advisory)

## Purpose

Read-only visibility into **guest-side** behavior for BNHub short-term listings: search-adjacent clicks, listing views, booking funnel stages, and **explainable** friction plus recommendations. This layer **does not**:

- Auto-edit listing pages or media  
- Change Stripe, payments, or booking creation rules  
- Change pricing or ranking  
- Mutate analytics source rows  

Outputs are **advisory**; hosts and operators apply changes manually.

## Metrics

| Source | What it measures |
|--------|------------------|
| `BnhubClientClickEvent` | Discovery-oriented clicks (`listing_card`, `search_chip`, `cta_primary`, `bnhub_nav`, `map_pin`) in a rolling window |
| `BnhubClientListingViewEvent` | Listing views; optional `source` substring match (`search`, `stays`, `map`, `results`) used only as a **proxy** for “discovery-context” impressions when present |
| `BnhubClientBookingFunnelEvent` | Stages `STARTED` and `PAID` (30d default) |

**Important:** True SERP impression counts per listing are **not** stored. CTR is computed only when discovery-context views exist; otherwise metrics stay partial and notes explain the gap.

## Friction logic

Deterministic rules in `booking-friction.service.ts`, for example:

- Many tracked views vs few booking starts → listing-page friction hypothesis  
- Many starts vs no paid completions → checkout friction hypothesis (advisory; does not inspect Stripe)  
- Zero reviews with meaningful views → trust gap  
- Few photos or thin description → completeness / quality hints  

Severity is bounded (`low` | `medium` | `high`) with a human-readable `why`.

## Recommendations

Generated in `guest-conversion-recommendations.service.ts` from friction context + metrics. Copy avoids guarantee language. When the recommendations flag is off, the service returns an empty list (panel shows metrics/signals only as configured).

## Feature flags (default **off**)

| Env | Behavior |
|-----|----------|
| `FEATURE_BNHUB_GUEST_CONVERSION_V1` | Master gate for building summaries and host dashboard panel |
| `FEATURE_BNHUB_BOOKING_FRICTION_V1` | When off, friction signals are not computed/surfaced |
| `FEATURE_BNHUB_GUEST_CONVERSION_RECOMMENDATIONS_V1` | When off, recommendations are not computed/surfaced |

Code: `bnhubGuestConversionFlags` and aliases `FEATURE_BNHUB_*` in `config/feature-flags.ts`.

## UI

Host **performance** grid (`/bnhub/host/dashboard`) embeds `GuestConversionPanel` per listing when the master flag is on, alongside existing host performance cards (additive).

## Growth / Mission Control (read-only)

When `FEATURE_BNHUB_GUEST_CONVERSION_V1` is on, `buildGrowthFusionSnapshot` may include `bnhubGuestConversion`: a small rollup (e.g. BNHub booking funnel starts in 30d) plus a static note — **no cross-system mutation**.

## Monitoring

`guest-conversion-monitoring.service.ts` tracks in-process counters and logs `[bnhub:guest-conversion]` lines. It never throws. Use `resetGuestConversionMonitoringForTests()` in tests.

## Safety guarantees

- No automatic listing or booking changes  
- No ranking or pricing writes  
- Deterministic, explainable outputs  
- Safe with partial / missing telemetry  

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/bnhub/guest-conversion/__tests__
cd apps/web && pnpm run typecheck
```
