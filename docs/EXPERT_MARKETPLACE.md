# Multi-expert mortgage marketplace

## Features

- **Smart routing**: Experts must be `isActive`, `acceptedTerms`, `isAvailable`, under daily cap (`maxLeadsPerDay` or active `ExpertSubscription.maxLeadsPerDay`), and (if `ExpertCredits` row exists) `credits > 0`.
- **Ranking**: `rating + adminRatingBoost + totalDeals * 0.1 + priorityWeight * 0.5` (priority from subscription when active). Tie-break: lower `currentLeadsToday`, then random.
- **Marketplace**: If no slot is claimed, lead is created with `mortgageMarketplaceStatus = open` and `assignedExpertId = null`. Experts claim via `/dashboard/expert/marketplace` (same cap/credit rules).
- **Daily reset**: `POST /api/cron/mortgage-expert-daily` with `Authorization: Bearer CRON_SECRET` sets all `currentLeadsToday` to `0`. Schedule daily (e.g. Vercel Cron).
- **Pay-per-lead**: Creating `ExpertCredits` for an expert enables deduction of **1 credit per received lead** (auto or claim). At **0 credits**, in-app notification **“Lead credits exhausted”** and expert is excluded until credits are replenished.
- **Subscriptions**: `ExpertSubscription` per expert — `basic` / `pro` / ‍`premium` (defaults in `lib/mortgage/subscription-plans.ts`). Admin can upsert via `PATCH /api/admin/mortgage-experts` with `subscriptionPlan` and `expertCredits`.
- **Reviews**: On deal close, response includes `reviewUrl` (`/mortgage/review?t=...`). `POST /api/mortgage/review` updates running average `rating` and `reviewCount`.
- **Performance**: On close deal, `totalDeals` and `totalRevenue` increment on `MortgageExpert`.
- **Public** `/experts` and enriched `/mortgage` directory (badges: Top Expert, Verified, Priority).

## Admin

- `GET /api/admin/mortgage-analytics` — funnel + top experts.
- `PATCH /api/admin/mortgage-experts` — optional fields: `commissionRate`, `adminRatingBoost`, `maxLeadsPerDay`, `isAvailable`, `rating`, `subscriptionPlan`, `expertCredits`, `isActive`.

## Notifications (upgrade path)

- In-app: existing bell + credit exhaustion alerts.
- Email summaries: plug `sendEmailNotification` from `lib/notifications.ts` into a weekly cron when ready.

## Migration

Run `npx prisma migrate deploy` for `20260331200000_mortgage_multi_expert_marketplace`. Existing experts get a default `expert_subscriptions` row from SQL backfill.
