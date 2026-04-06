# Full app test matrix (launch hardening)

## Automated (current)

| Area | Tests |
|------|--------|
| Growth funnel math | `apps/web/tests/growth/funnels.test.ts` |
| Booking transitions | `apps/web/tests/bookings/transitions.test.ts` |
| Payment mode resolution | `apps/web/tests/payments/resolve-payment-mode.test.ts` |
| Locale parity / RTL | `apps/web/lib/i18n/__tests__/locale-parity.test.ts` |
| Existing API / lib tests | `lib/**/*.test.ts`, `app/api/**/*.test.ts` |
| Playwright E2E | `apps/web/e2e/*.spec.ts` (run with `pnpm test:e2e` when dev server available) |
| **Launch scenario suite** | `pnpm test:e2e:scenarios` — runs `e2e/scenarios/run-all.spec.ts` (10 real-flow scenarios; needs DB seed, optional `STRIPE_*`, `E2E_ADMIN_*`) |

## Manual verification matrix

| Dimension | Values |
|-----------|--------|
| Locales | EN (default), FR, AR (RTL) |
| Markets | `default` (online), `syria` (manual-first) |
| Roles | guest, host, admin |
| Platforms | web (primary); mobile per `apps/mobile` scope |

### Critical flows

1. Marketing home → browse → listing → **Stripe** checkout → confirmed booking.
2. Same with **manual** market: request → host actions → manual received → confirmed.
3. Marketing home → listing → **contact host** (contact-first emphasis).
4. Host: dashboard → create/edit/publish listing.
5. Admin: market settings → growth dashboard → booking ops → content review (if enabled).
6. AI surfaces: EN/FR/AR copy; no unsafe payment assumptions in Syria context.

## Section checklist (expand over time)

Sections 1–15 from the launch order (public, auth, listings, booking, payments, host, admin, AI, autopilot, notifications, content, mobile, security, health) should each gain **at least** smoke tests (Playwright or API integration) as bandwidth allows. This document is the master checklist; implementation is incremental.
