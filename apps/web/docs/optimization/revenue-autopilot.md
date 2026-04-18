# Revenue autopilot

A monetization layer that sits on top of BNHub booking data, [listing quality](./listing-quality-system.md), [portfolio autopilot](./portfolio-autopilot.md), and listing optimization. It scores **revenue health**, logs **opportunities**, generates **prioritized actions**, and can **safely** trigger listing/portfolio downstream runs — **never** auto-applying live prices, fees, or policy/legal changes.

## Scopes (`RevenueAutopilotScopeType`)

| Scope | `scopeId` | Typical use |
| ----- | --------- | ------------- |
| `owner` | Host / listing owner user id | Host dashboard |
| `platform` | `platform` constant | Admin intelligence |

Settings and cached scores are unique per `(scopeType, scopeId)` in `revenue_autopilot_settings` and `revenue_health_scores`.

## Scoring model (0–100)

Components stored on `RevenueHealthScore`:

| Field | MVP meaning |
| ----- | ----------- |
| `revenueScore` | Overall weighted blend |
| `trendScore` | Completed booking gross, last 90d vs prior 90d |
| `conversionScore` | Views-weighted conversion proxy from `ListingSearchMetrics` + quality |
| `pricingEfficiencyScore` | Average `ListingQualityScore.pricingScore` |
| `portfolioMixScore` | 1 − HHI of listing revenue shares (higher = less concentrated) |

Overall `revenueScore` ≈ 32% trend + 26% conversion + 22% pricing efficiency + 20% mix (see `compute-revenue-health.ts`).

Platform-wide samples cap how many listings are loaded for heavy aggregates (admin UI uses full booking sums by city).

## Opportunity types (logged)

Examples written to `revenue_opportunity_logs`:

- `scale_winner` — strong revenue + conversion vs peers  
- `traffic_not_monetizing` — views without matching revenue  
- `pricing_efficiency` — soft pricing competitiveness score  

## Action types

| `actionType` | Safe automation (owner scope) | Never auto |
| ------------ | ------------------------------- | ---------- |
| `promote_listing` | Listing optimization run if toggles allow | Paid placements |
| `generate_more_content` | Listing optimization | — |
| `suggest_price_review` | Listing optimization (suggestions only) | Live price |
| `upsell_featured` | Guidance log | Checkout |
| `improve_conversion` | Listing optimization | — |
| `recover_abandoned_revenue` | Guidance (checkout funnel metrics) | Fee changes |
| `prioritize_broker_followup` | Guidance + lead count heuristic | CRM sends |
| `trigger_listing_optimization` | Listing optimization | — |
| `trigger_portfolio_autopilot` | Calls portfolio autopilot run | — |

**Platform scope:** safe-apply does **not** execute host listing changes; actions are marked applied with audit logs only (MVP).

## Modes (`RevenueAutopilotMode`)

| Mode | Behavior |
| ---- | -------- |
| `off` | Run endpoint rejects |
| `assist` | Computes health + actions; no automatic safe apply |
| `safe_autopilot` | Runs `applySafeRevenueActions` after each successful run |
| `approval_required` | Actions stay `suggested` until approve / manual apply-safe |

Toggles: `autoPromoteTopListings`, `autoGenerateRevenueActions`, `allowPriceRecommendations`.

## Audit / logging

`IntelligenceDecisionLog` entries use `domain: AUTOPILOT` and `actionType` prefixed with `revenue_autopilot:` for runs, approvals, safe-apply, and platform skip notes.

## APIs

- `GET /api/revenue-autopilot` — `?scopeType=owner|platform&scopeId=` (admin)  
- `POST /api/revenue-autopilot/run`  
- `GET /api/revenue-autopilot/actions`  
- `POST /api/revenue-autopilot/actions/[id]/approve|reject`  
- `GET` / `POST /api/revenue-autopilot/settings`  
- `POST /api/revenue-autopilot/apply-safe`  

## UI

- Owner: `/dashboard/revenue-autopilot`  
- Admin: `/admin/revenue-autopilot`  

## Migration

Apply `20260404150000_revenue_autopilot` (or the migration that creates `revenue_*` tables in your branch).

## Integrations (MVP)

- **Listing quality** — `ListingQualityScore` pricing/quality sub-scores feed conversion and pricing efficiency.
- **Portfolio autopilot** — `ACTION_TRIGGER_PORTFOLIO` can call `runPortfolioAutopilot` from safe-apply (owner scope).
- **Listing autopilot** — Most owner actions delegate to `runListingAutopilot` (never auto live price).
- **Ranking / search** — Indirect: optimization runs refresh copy and signals that feed ranking inputs.
- **Admin** — Platform scope uses sampled listings + full booking aggregates by city; safe-apply logs only (no mass host writes).

## QA checklist

- Owner **GET** overview shows scores, `listingCount`, and actions after at least one **POST** `/api/revenue-autopilot/run` (mode not `off`).
- **safe_autopilot** runs `applySafeRevenueActions`; platform scope marks actions applied without host listing automation.
- **RevenueOpportunityLog** rows appear after a run (up to 20 per run).
- Estimated uplift sums are finite and non-negative in normal data.

## Future extensions

- Payout-net revenue and fee modeling  
- Deeper integration with BNHub promotions checkout  
- Broker CRM scoring hooks for `prioritize_broker_followup`  
- ML-based uplift calibration  
