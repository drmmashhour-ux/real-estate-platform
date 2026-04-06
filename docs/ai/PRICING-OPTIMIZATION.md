# BNHub dynamic pricing (LECIPM Manager)

This document describes the **suggestion-only** dynamic pricing layer for BNHub stays: how signals are loaded, how rules fire, safety boundaries, and how host learning affects prioritization.

## Signals (real data only)

Loaded per listing from the database (`loadBnhubPricingSignals`):

| Signal | Source |
|--------|--------|
| Current nightly price | `ShortTermListing.nightPriceCents`, `currency` |
| Recent booking counts (30d / 90d) | `Booking` rows with activity statuses, filtered by `createdAt` |
| Days since last booking | Latest qualifying booking `createdAt` |
| Occupancy estimate | Sum of `nights` in last 30d ÷ 30 (published listings only) |
| Active promotion | `BnhubHostListingPromotion` overlapping “today” |
| Upcoming availability gap | Longest consecutive sellable streak from `AvailabilitySlot` (next 60 days) |
| Views | `ListingSearchMetrics.views7d` / `views30d` when present |
| Inquiries | `BnhubLead` count (30d) for the listing |
| Seasonality proxy | Variability of historical **internal** booking nights by calendar month (≥6 bookings, ≥3 active months); otherwise omitted |
| Listing quality | `BnhubPropertyClassification.overallScore`, else `aiDiscoveryScore`, else photo/description heuristics |

Nothing invents market demand, competitor rates, or external indices.

## Deterministic rules

Implemented in `evaluateDynamicPricingFromSignals` (`dynamic-pricing.ts`):

1. **Strong demand + tight calendar** → `price_increase_review` — high recent bookings or strong occupancy, and the longest stretch of open nights ahead is short (calendar filling).
2. **Soft demand + wide open calendar** → `price_decrease_review` — few recent bookings, soft occupancy, long open streak, and modest 90d volume.
3. **Active host promotion** → If a decrease would otherwise apply, **no overlapping discount suggestion** (rule suppressed).
4. **Weak listing quality + soft demand** → `improve_listing_before_price_change` instead of a straight decrease review (photos/description/classification).
5. **Repeated rejections** → Lower confidence / priority; at `maxRejectedSimilarBeforeSuppress` similar rejections, **suppress** surfacing (decision engine still runs on each attempt).

Thresholds live in `DYNAMIC_PRICING_RULE_THRESHOLDS`.

## Safety boundaries

- **`DYNAMIC_PRICING_LIVE_APPLY_DEFAULT` is `false`.** This module does **not** update `nightPriceCents` or Stripe price objects.
- **Default path is suggestion-only** (ASSIST / SAFE_AUTOPILOT): `ManagerAiRecommendation` + notification.
- **FULL_AUTOPILOT_APPROVAL** queues `ManagerAiApprovalRequest` with `actionKey: "host_autopilot_pricing_change"` — same as legacy pricing notes: **approval records intent; hosts still edit the listing editor.**
- No fabricated demand metrics; skipped signals stay `null` and are not back-filled with guesses.

## Learning and prioritization

Before a card is shown, `gateAutopilotRecommendation` runs the multi-factor **decision engine** (`computeDecisionScore`): rule performance, template history, calibrated confidence, and outcome signals (e.g. rejections). Failed gates are logged with `suppressionReason`.

Host-specific calibration uses `getCalibratedConfidence`. Repeated rejection patterns reduce the decision score (see `decision-engine.ts`).

## Logging

Successful suggestions log to `manager_ai_action_logs` with `actionKey` = rule name (e.g. `bnhub_dynamic_pricing_decrease_review`), including `listingId`, `hostId`, `metricSnapshot`, current price, recommended range, `decisionScore`, and raw/calibrated confidence. Suppressions are logged by the gate with the same rule key and extra payload.

## Integration

- **Triggers:** `runBnhubDynamicPricingForListing` from `runPricingHint` (listing update / booking created).
- **Scheduled scan:** `runBnhubDynamicPricingScheduledScan` after the revenue optimizer scan for published listings (batch limit 25).

## Tests

See `apps/web/lib/ai/pricing/__tests__/dynamic-pricing.test.ts` for deterministic scenarios.
