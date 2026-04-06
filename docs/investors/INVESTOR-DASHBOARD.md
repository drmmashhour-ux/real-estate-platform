# Internal investor / operations dashboard (LECIPM Manager)

## URL

**`/dashboard/ops-investor`**

> **Note:** A route at `app/(dashboard)/investor/page.tsx` would resolve to the public `/investor` path and conflicts with `app/investor/page.tsx` (marketing / investor relations). The internal metrics UI lives under **`/dashboard/ops-investor`** instead.

## Access control

Allowed `PlatformRole` values: **ADMIN**, **ACCOUNTANT**, **INVESTOR** (see `lib/investor/access.ts`).

- Unauthenticated users are redirected to login with `returnUrl`.
- Other roles are redirected to `/dashboard`.

The API **`GET /api/admin/ops-investor-metrics?window=`** uses the same guard.

## Time windows

Query param **`window`**: `today` | `7d` | `30d` | `all` (invalid values default to **`30d`**).

Implementation: `parseInvestorTimeWindow`, `getDateRangeForWindow` in `lib/investor/metrics.ts`.

## Metrics shown (all DB-backed)

| Area | Source (summary) |
|------|------------------|
| Listings | `ShortTermListing` counts by `listingStatus`; distinct hosts via `groupBy(ownerId)` |
| Promotions | `BnhubHostListingPromotion` overlapping “today” UTC |
| Autopilot hosts | `ManagerAiHostAutopilotSettings.autopilotEnabled` |
| Bookings | `Booking` counts by `createdAt` in window and by `status`; pending queue is current snapshot |
| GMV proxy | Sum of `Booking.totalCents` where `createdAt` in window |
| Stripe fees | Sum of `Payment.platformFeeCents` where `status = COMPLETED` and `createdAt` in window |
| BNHub payout fees | Sum of `BnhubHostPayoutRecord.platformFeeCents` in window |
| Paid payouts | `BnhubHostPayoutRecord` PAID: `releasedAt` in window, or any PAID with `releasedAt` set for `all` |
| Pending payouts | Rows in pending-like `BnhubMpPayoutStatus` |
| AI | `ManagerAiRecommendation`, `ManagerAiApprovalRequest`, `ManagerAiActionLog`, `ManagerAiOverrideEvent`, `ManagerAiHealthEvent`, `ManagerAiAgentRun`; top `actionKey`s from `groupBy` on action logs |
| Geography | `ShortTermListing` group by `country` |
| Locales | `User.preferredUiLocale` groupBy (non-null) |
| Platform | `PlatformMarketLaunchSettings` id `default` |
| Growth | New STR listings: `ShortTermListing.createdAt` in window |

Explicitly **not** presented as real KPIs: conversion rate / marketing funnel — listed under `unavailable[]` in the snapshot until a single auditable source exists.

## No-fake-data rule

- No invented growth, CAC, or “momentum” scores.
- Currency lines are **sums of stored cents** with clear labels (e.g. GMV proxy = booking totals).
- If a sum is null (no rows), the UI shows **Unavailable** where appropriate.

## Export

**JSON:** `GET /api/admin/ops-investor-metrics?window=30d` (same auth as the page). The dashboard UI includes a client-side **Export JSON** button.

## How to extend safely

1. Add fields to `InvestorMetricsSnapshot` in `metrics-types.ts`.
2. Add Prisma queries in `fetchInvestorMetricsSnapshot` only against real columns.
3. If a metric cannot be sourced yet, append an explanation to `unavailable` or omit the card.
4. Update this doc and add a focused Vitest case if the logic is non-trivial.

## Tests

`apps/web/lib/investor/__tests__/metrics.test.ts` — window parsing, date ranges, access control, and mocked aggregation behavior.
