# Marketplace Intelligence Dashboard

Investor-grade, read-only aggregation of growth, legal posture, trust, automation health, Syria regional slices (when enabled), and cross-region comparison rows.

## What it does

- **`buildMarketplaceDashboardSummary`** in `modules/dashboard-intelligence/dashboard-intelligence.service.ts` composes KPIs, risk, trust, growth, legal, automation, ranking flags, and optional Syria augmentation from `global-intelligence/global-dashboard.service.ts`.
- **`GET /api/admin/dashboard-intelligence`** returns `{ summary, flags, freshness }` — admin session required; no raw PII.

## What it cannot do

- No writes, no automation triggers, no ranking or pricing mutations.
- Empty states are explicit when feeds are disabled or unavailable.

## Feature flag

- `FEATURE_MARKETPLACE_DASHBOARD_V1` (`engineFlags.marketplaceDashboardV1`)

## Related surfaces

- Controlled execution: `/admin/autonomy`, `FEATURE_CONTROLLED_EXECUTION_V1`
- Unified intelligence read model: `/admin/unified-intelligence`, `FEATURE_UNIFIED_INTELLIGENCE_V1`
- Legal / fraud admin routes as linked from admin hubs
