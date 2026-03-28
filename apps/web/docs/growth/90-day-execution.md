# LECIPM + BNHub — 90-day execution plan

Operational checklist for the growth engine (analytics, CRM, automation, Stripe observability, SEO).

## Phase 1 — Days 1–14: Validation

- Ship `user_events` tracking on auth, listing views, inquiries, checkout, and webhooks.
- Confirm `/api/cron/growth-email-queue` runs with `CRON_SECRET` (or process queue locally).
- Target: **25** activated accounts (brokers, hosts, or buyers) with at least one measurable funnel event per cohort.
- Validate Stripe webhook idempotency (`stripe_events`) in staging.

## Phase 2 — Days 15–30: Early scale

- Target **100** cumulative users; weekly review of `/admin/growth-funnel-data`.
- Broker/host outreach using CRM leads + `lead_timeline_events`.
- Turn on abandoned-checkout reminders (`growth_email_queue` 1h / 24h) and monitor Resend deliverability.

## Phase 3 — Days 31–60: SEO + automation

- Expand city surfaces: `/buy/[city]`, `/invest/[city]`, `/bnb/[city]`, `/city/.../n/...`, `/neighborhood/...`.
- Publish structured data (JSON-LD) on investment and stay pages.
- Tune automation: welcome, review request, and broker notify paths; add `checkGrowthAlerts()` to a daily cron if desired.

## Phase 4 — Days 61–90: Scale + referrals

- Optimize conversion from `LISTING_VIEW → SIGNUP → INQUIRY → PAYMENT_SUCCESS` using dashboard rates.
- Layer referral / ambassador programs on top of stable email + webhook pipelines.
- Document runbooks for payment failure spikes and “no leads in 48h” warnings.

## References

- Admin funnel UI: `/admin/growth-funnel-data`
- Growth engine hub: `/admin/growth-engine`
- Track API: `POST /api/growth/track` (authenticated)
