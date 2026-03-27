# Investment MVP — growth engine

## Share links

- **Public deal:** `/deal/{id}?utm_source=share` and optional `?ru={userId}` (referrer) or `?ref={otherDealId}` (cross-deal).
- **Analyzer invite:** `/analyze?utm_source=share&...#analyzer` — `ru` added when the sharer is logged in.

## Tracking

| Signal | Where |
|--------|--------|
| `share_deal_clicked` | Native share / clipboard from **Share this deal** |
| `investment_share_copy_after_analysis` | **Copy link** on analyze after results |
| `SharedDealVisit` rows | POST `/api/investment/shared-deal/track-view` (session-deduped) |

## Admin

**Insights** dashboard includes **Growth & sharing (last 30 days)** plus existing funnel and user counts.
