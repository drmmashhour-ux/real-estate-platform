# God-mode growth plan (0 → 1000 users)

## Objectives

Move from zero to repeatable acquisition: first hosts, listings, booking requests, paid or manually confirmed stays, and measurable conversion — with **English default**, **FR/AR** support, and **Syria manual-first** compatibility.

## Architecture

| Piece | Location |
|--------|-----------|
| Typed event names | `apps/web/lib/growth/types.ts` |
| Persistence | `growth_funnel_events` + mirror `launch_events` (`mgr:*`) via `recordLecipmManagerGrowthEvent` |
| Client / anonymous beacon | `POST /api/growth/manager-track` (rate-limited) |
| Funnel math | `apps/web/lib/growth/funnels.ts` |
| Recommendations | `apps/web/lib/growth/recommendations.ts` |
| Launch score | `apps/web/lib/growth/launch-score.ts` |
| Attribution helpers | `apps/web/lib/growth/attribution.ts` |
| Campaigns (DB) | `apps/web/lib/growth/campaigns.ts` → `growth-acquisition` |

## Event catalog (manager)

Canonical names include: `landing_page_viewed`, `listing_viewed`, `language_switched`, `checkout_started`, `payment_completed`, `manual_payment_marked_received`, `booking_confirmed`, `host_signup_completed`, `listing_published`, `ai_suggestion_accepted`, etc. Extend the const array in `types.ts` when adding new events.

## Dashboards

- **Growth funnel + readiness**: `/admin/growth` (embedded `GrowthFunnelDashboard`).
- **Legacy signup/booking counts**: `/admin/growth-metrics` (`growth:*` on `launch_events`).
- **Playbook**: `/admin/growth/launch-playbook`.
- **Booking ops**: `/admin/bookings-ops`.
- **Localization + listing sample**: `/admin/reports/launch-quality`.

## Rules

- No fabricated metrics — counts are from stored rows.
- No unsafe auto-send of legal, payment, refund, or dispute content from growth automations.
- Syria mode must not depend on card checkout; manual settlement events are first-class.
