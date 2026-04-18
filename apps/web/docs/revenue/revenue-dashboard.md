# Revenue Dashboard (V1)

## Purpose

Read-only operator view of **where money is showing up** (from `revenue_events`) and **funnel health** (leads, brokers, BNHub-style booking signals). This phase **does not** execute payments, change Stripe, or alter pricing.

## Metrics displayed

| Area | Source |
|------|--------|
| Revenue today / week / month | Sum of positive `RevenueEvent.amount` in UTC windows |
| Revenue by source | `event_type` mapped to `lead_unlock`, `booking_fee`, `boost`, `subscription`, `other` |
| Lead unlock rate | `leadsUnlocked / max(1, leadsViewed)` — views from durable `lead_viewed` rows or in-memory enforcement counters when sparse |
| Active / paying brokers | `User` role broker + revenue attribution in last 30d |
| Booking starts / completed | `AiConversionSignal` counts (`booking_started`, `booking_completed`) when available |
| Alerts | Deterministic rules in `revenue-dashboard-alerts.service.ts` |
| Notes | Advisory strings (dominant source, weak completion, early-stage boost/subscription, etc.) |

## Alert logic

See `detectRevenueAlerts()` — examples: no revenue today, views without unlocks, bookings starting but not completing, low week revenue vs activity. Bounded list; wording avoids false certainty when data is partial.

## Data sources

- `revenue_events` (durable amounts)
- `Lead` (created / `contactUnlockedAt` in window)
- `User` (brokers)
- `ai_conversion_signals` (booking funnel, best-effort)
- In-memory revenue enforcement monitoring (optional supplement for lead views)

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_REVENUE_DASHBOARD_V1` | Revenue dashboard data path + panel pairing with Growth Machine |
| `FEATURE_GROWTH_REVENUE_PANEL_V1` | Allows `GET /api/growth/revenue` + Growth revenue strip when dashboard flag is off |

`GET /api/growth/revenue` requires Growth Machine auth and **at least one** of the above flags.

## Safety guarantees

- No Stripe webhook, checkout, lead unlock, or booking route changes from this module.
- Missing tables or query failures for optional signals fall back to `0` and notes where applicable.

## Validation commands

```bash
cd apps/web && npx vitest run modules/revenue/__tests__/revenue-dashboard.service.test.ts modules/revenue/__tests__/revenue-alerts.service.test.ts modules/revenue/__tests__/revenue-dashboard-monitoring.service.test.ts
```

## Module map

| File | Role |
|------|------|
| `modules/revenue/revenue-dashboard.types.ts` | `RevenueDashboardSummary`, sources, alerts |
| `modules/revenue/revenue-dashboard.service.ts` | `buildRevenueDashboardSummary()` |
| `modules/revenue/revenue-dashboard-alerts.service.ts` | `detectRevenueAlerts()` (bounded) |
| `modules/revenue/revenue-alerts.service.ts` | Re-exports `detectRevenueAlerts`; enforcement string alerts |
| `modules/revenue/revenue-dashboard-monitoring.service.ts` | In-memory counters + `[revenue:dashboard]` logs |
| `app/api/growth/revenue/route.ts` | GET `{ summary }` (read-only) |
| `components/revenue/RevenueOverviewPanel.tsx` | Operator UI (black/gold) |
| `components/growth/GrowthRevenuePanel.tsx` | Thin wrapper around `RevenueOverviewPanel` |

## Risks / limits

- Amounts reflect `RevenueEvent` + best-effort funnel tables; not a substitute for accounting or Stripe reconciliation.
- Lead “views” may fall back to enforcement in-memory counters when durable `lead_viewed` rows are sparse (noted in UI).
- Alerts are advisory; partial data never implies certainty.
