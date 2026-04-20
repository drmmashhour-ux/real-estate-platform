# Marketplace domination layer

**Advisory** ranking, pricing, visibility, and conversion signals derived from deterministic rules — not ML, not autonomous execution.

## Services

- **`ranking-pricing-intelligence.service.ts`** — `buildRankingOpportunities`, `buildPricingRecommendations`, `buildVisibilityLeverageSignals`
- **`growth-domination.service.ts`** — `buildDominationSummary`, regional expansion / broker / trust-driven stubs for roadmap
- **`global-market-domination.service.ts`** — cross-region advisory summary when multi-region flags are enabled

## API

- **`GET /api/admin/market-domination`** — gated by `FEATURE_MARKET_DOMINATION_V1`; admin-only.

## Boundaries

- Recommendations do not change listings, bids, or ads without separate controlled execution and policy approval.
- Legal risk and trust floors influence explanations only; scoring is traceable to inputs.
