# Portfolio autopilot

Hosts and listing owners with multiple BNHub stays (`ShortTermListing`) get a **portfolio-level** layer on top of [listing autopilot](./auto-fix-autopilot.md) and the [listing quality system](./listing-quality-system.md). It computes **portfolio health**, surfaces **top / weak / opportunity** listings, generates **prioritized actions**, and can **trigger listing optimization runs** safely (respecting toggles and listing-level autopilot settings).

## Health score (0–100)

Stored in `portfolio_health_scores` (`PortfolioHealthScore`). Components:

| Component           | Source (MVP) |
| ------------------- | ------------ |
| Revenue health      | Completed booking `totalCents` (90d, host’s listings), log-scaled to 0–100 |
| Quality health      | Average `ListingQualityScore.qualityScore` across portfolio |
| Performance health  | Average `performanceScore` from listing quality rows |
| Behavior health     | `HostPerformance` response, cancellation, completion blend |
| Trust health        | Average `trustScore` from listing quality rows |

**Overall** = weighted blend: revenue 20%, quality 25%, performance 22%, behavior 18%, trust 15%.

**Bands** (for UI copy): 0–39 poor · 40–59 needs improvement · 60–79 good · 80–100 excellent.

## Top / weak / opportunities

- **Top:** highest composite `rankScore` (quality, performance, trust, conversion, views blend) — see `lib/portfolio-autopilot/compute-portfolio-health.ts`.
- **Weak:** lowest `rankScore`.
- **Opportunities:** e.g. high `views30d` vs portfolio median but weak conversion; or strong quality with low exposure.

## Action types

| `actionType` | Meaning |
| ------------ | ------- |
| `optimize_weak_listings` | Run listing optimization on weakest stays (metadata `listingIds`). |
| `generate_content_top_listings` | Refresh content on top converters (metadata `listingIds`). |
| `review_pricing_listings` | Queue pricing **suggestions** via listing optimization (never auto-applies live price). |
| `improve_response_time` | Host guidance from cancellation/response signals (no automated messaging in MVP). |
| `promote_strong_converters` | Guidance to promote listings with strong conversion. |
| `address_opportunity_listing` | Single listing opportunity from traffic/quality mismatch. |

## Modes (`PortfolioAutopilotMode`)

| Mode | Behavior |
| ---- | -------- |
| `off` | Run endpoint rejects. |
| `assist` | Computes health and actions; no automatic downstream listing runs. |
| `safe_autopilot` | After each run, executes **apply-safe** (see below). |
| `approval_required` | Actions stay `suggested` until approved (or use **Apply safe actions now**). |

Toggles (`PortfolioAutopilotSetting`) gate listing runs: `autoRunListingOptimization`, `autoGenerateContentForTopListings`, `autoFlagWeakListings`, `allowPriceRecommendations`.

## Downstream integration (listing autopilot)

Portfolio actions call `runListingAutopilot` per target listing when toggles allow. That function:

- Respects **listing-level** `ListingAutopilotSetting` (if listing autopilot is `off`, runs are skipped / fail per listing).
- Never auto-applies **high-risk** fields (e.g. live price) — same rules as listing autopilot.

## Audit / logging

`IntelligenceDecisionLog` rows with `domain: AUTOPILOT` record portfolio runs, per-action listing runs, approvals/rejections, and safe-apply completion. See `lib/portfolio-autopilot/log-portfolio-event.ts`.

## Safety boundaries

- Portfolio layer **orchestrates**; it does not bypass listing-level autopilot or invent listing facts.
- **Pricing** remains suggestion + approval paths at the listing layer.
- Host behavior actions are **guidance-only** in MVP (no automated inbox changes).

## APIs

- `GET /api/portfolio-autopilot` — overview (optional `?ownerUserId=` for admins).
- `POST /api/portfolio-autopilot/run` — recompute health, replace `suggested` actions, optional safe apply.
- `GET /api/portfolio-autopilot/actions` — list actions (`?status=`, `?ownerUserId=` admin).
- `POST /api/portfolio-autopilot/actions/[actionId]/approve` — execute downstream for one action → `applied`.
- `POST /api/portfolio-autopilot/actions/[actionId]/reject` — `rejected`.
- `POST /api/portfolio-autopilot/apply-safe` — process all **suggested** actions with safe rules.
- `GET` / `POST /api/portfolio-autopilot/settings`.

## UI

- Host: `/dashboard/portfolio-autopilot`
- Admin: `/admin/portfolio-autopilot`

## Migration

Apply `20260404140000_portfolio_autopilot`.
