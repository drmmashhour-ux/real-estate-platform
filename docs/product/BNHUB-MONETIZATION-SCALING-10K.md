# BNHub / LECIPM — monetization path to ~$10k MRR (bookings + leads)

Operational map from **code + dashboards** to the phases you run weekly.

## Phase 1 — Track revenue

| Metric | Source |
|--------|--------|
| **GMV per paid guest booking** | `platform_revenue_events.revenue_type = bnhub_guest_booking_gmv` (one row per paid Stripe session, idempotent on `source_reference`) |
| **Platform service fee + upsell attach** | `bnhub_guest_booking_service_fee`, `bnhub_guest_booking_upsell` |
| **Totals in a period** | `GET /api/admin/growth/scale-metrics?days=30` → `bnhub.guestSupabaseStripe` |

Rows are written in `recordBnhubGuestBookingRevenueFromPaidSession` when the Supabase booking is first marked **paid** from Stripe (`guestSupabaseBooking.ts` webhook path).

## Phase 2 — Increase bookings

- **Supply:** seed / onboard listings (`supabase-soft-launch-seed.sql`, host `host_user_id`).
- **Demand:** search + listing views tracked via existing mobile/web analytics; tighten SEO city pages and BNHub browse.
- **Conversion:** reduce steps to checkout; keep payment status polling honest (webhook is source of truth).

## Phase 3 — Insurance optimization

- **Server:** `getInsurancePresentationHintForUser` + `GET /api/mobile/v1/bnhub/insurance/presentation-hint` (auth).
- **Mobile:** `booking-confirmation` uses **variant B** (headline + phone-first form) for higher **leadQualityTier** / **score high** users.
- **Funnel:** `InsuranceLeadForm` → `/api/insurance/leads` + `/api/insurance/leads/track` (already instrumented).

## Phase 4 — Upsell system

- **Server:** `BNHUB_CHECKOUT_ITEMIZED_FEES=1` enables itemized Stripe lines + metadata for fees/upsells (`bnhub-checkout-pricing.ts`, webhook validation).
- **Mobile:** Payment screen loads `GET /api/mobile/v1/bnhub/checkout-quote`, shows add-on toggles, sends `upsells` on `POST /api/stripe/checkout`.
- **Uptake:** Compare `guestSupabaseStripe.upsellAttachRate` and `upsellRevenueCentsInPeriod` on scale-metrics; soft-launch events `checkout_quote_view` / `upsell_toggled` in `bnhub_events` (when enabled).

## Phase 5 — Dynamic pricing

- Host tools: `GET /api/mobile/v1/bnhub/host/listings/.../pricing-insights` (and related routes) for suggestions.
- Tune `BNHUB_SERVICE_FEE_*_BPS` and peak multipliers rather than changing guest-facing listing price without host consent.

## Phase 6 — Promotions

- Prisma `BnhubHostListingPromotion` + mobile host promotion APIs; highlight promoted inventory in browse when wired in UI.
- Use **clear strikethrough / “Promoted”** labels for trust.

## Phase 7 — Retention

- Push: `expo-notifications` + device registration API.
- In-app: discovery alerts / price watch APIs (`/api/mobile/v1/bnhub/...`) where enabled.

## Phase 8 — Analytics

- **Store / funnel:** App Store Connect + Play Console.
- **Product:** `GET /api/admin/growth/scale-metrics` (LECIPM + BNHub blocks).
- **Revenue per guest user (proxy):** `revenuePerGuestUserCents` in that response (GMV / guest user count — interpret cautiously).

## Phase 9 — Optimization loop (weekly)

1. Pull `scale-metrics` for 7d and 30d.  
2. Compare **upsellAttachRate**, **avgGmvPerBookingCents**, insurance **lead_submitted** / **converted** (admin insurance UI).  
3. Adjust one lever: fee BPS, upsell prices (`BNHUB_UPSELL_*_CENTS`), or insurance copy/variant thresholds.  
4. Ship UI tweak + measure same window next week.

---

**Env reference (web):** `BNHUB_CHECKOUT_ITEMIZED_FEES`, `BNHUB_SERVICE_FEE_BASE_BPS`, `BNHUB_SERVICE_FEE_PEAK_EXTRA_BPS`, `BNHUB_UPSELL_INSURANCE_CENTS`, `BNHUB_UPSELL_EARLY_CHECKIN_CENTS`, `BNHUB_UPSELL_LATE_CHECKOUT_CENTS` (see `apps/web/.env.example`).
