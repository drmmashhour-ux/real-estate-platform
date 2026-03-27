# Production hardening — final report

**Date:** 2026-03-19  
**Scope:** Payments, auth, tax, API trust boundaries, CRM/leads, observability.

---

## Fixed issues (critical)

| Item | Change |
|------|--------|
| **Mock BNHub pay** | `POST /api/bnhub/bookings/[id]/pay` **removed** from source. Booking pay uses **`POST /api/stripe/checkout`** with `paymentType: "booking"`; server recomputes amount via **`assertGuestCanCheckoutBooking`** (guest ownership). Confirmation only via **`POST /api/stripe/webhook`**. UI (`booking-pay-button.tsx`) does not fall back to mock pay. |
| **Demo impersonation** | **`POST /api/auth/demo-session`** and demo-users listing return **403** when `NODE_ENV === "production"`. Additional gating via **`isDemoAuthAllowed()`** where applicable. |
| **Mock Canva pay** | **`POST /api/payment/pay`** returns **403** in production (no client-side “mark paid” in prod). |
| **Tax unification** | **`taxRatePercent`** removed from schema (migration). **`lib/bnhub/booking-pricing.ts`** uses **`calculateQuebecRetailTaxOnLodgingBaseExclusiveCents`** from **`lib/tax/quebec-tax-engine.ts`** (GST on base, QST on base + GST). Align checkout/invoices/admin with the same engine where wired. |
| **Deals anti-spoofing** | **`POST /api/deals`** does not accept client **`buyerId` / `sellerId` / `brokerId`**; IDs derived from session + listing (+ validated emails where needed). Tests in **`app/api/deals/route.test.ts`**. |

---

## Security improvements

- **Payment trust boundary:** Booking paid state transitions only from verified Stripe webhook paths (see **`assertBookingStripeWebhookValid`** usage in webhook handler).
- **Checkout audit:** **`stripe_checkout_session_initiated`** recorded via **`recordPlatformEvent`** after a successful session creation (**`app/api/stripe/checkout/route.ts`**).
- **Auth audit:** **`auth_login_success`** on successful password login (**`app/api/auth/login/route.ts`**).
- **CRM / leads:** **`lib/crm/lead-dedupe.ts`** — listing-scoped dedupe by email (default **15 min**). **`/api/immo/contact`** and **`/api/ai/client-chat`** use dedupe; Immo contact sets **`userId`** when session email matches. Reduces duplicate broker noise and orphan-like duplicates.

---

## Payment validation (expected flow)

1. Authenticated user → **`POST /api/stripe/checkout`** (booking: **`bookingId`** required; amount overridden server-side from pricing guard).
2. Stripe Checkout → success/cancel URLs (UX only; **not** source of truth for payment).
3. **`POST /api/stripe/webhook`** — signature verification, idempotent handling for booking completion events, failure-safe DB updates.
4. Booking / payment records updated **only** in webhook (and related server-side paths), not from frontend “paid=1” alone.

---

## Stripe webhook hardening (verified in code)

- **Signature:** `stripe.webhooks.constructEvent` with webhook secret.
- **Idempotency:** Event / payment intent handling guarded against duplicate application (see webhook route for booking and related branches).
- **Errors:** Invalid signature → 400; internal errors logged without leaking secrets in client responses.

---

## Remaining risks & follow-ups

| Risk | Notes |
|------|--------|
| **Stale `.next` artifacts** | Old builds may still list removed routes (e.g. pay). **Rebuild** before deploy: clean `.next` / full CI build. |
| **General contact form** | **`/api/contact`** may allow `listingId: null` for general inquiries — intentional; not the same as listing-scoped Immo/AI leads. |
| **Global input validation (item 8)** | Not every route uses a single shared validator; continue rolling **zod** (or equivalent) + rate limits on sensitive endpoints. |
| **Error responses (item 9)** | Review remaining **`console.error`** + client messages so production never returns stack traces or PII. |
| **E2E test (item 11)** | Run manual or automated full path: listing → contact → AI lead → broker → booking → Stripe test mode → webhook → confirmed state. |
| **Monitoring** | **`recordPlatformEvent`** is app-level; wire **SIEM / alerts** on `stripe_*`, `auth_*`, and lead events for operations. |

---

## Launch rule

**Do not launch** until:

- Production env has **Stripe** keys and webhook endpoint configured and tested.
- **`NODE_ENV=production`** on the app (demo session + mock Canva pay blocked).
- Tax totals reconciled in **one** QA scenario across UI, server quote, Stripe line items, and invoice PDF (if applicable).

---

## Doc drift (update when convenient)

Some older docs still mention **`POST /api/bnhub/bookings/:id/pay`** — replace with Stripe checkout + webhook. Prefer **`docs/MOBILE_APP_READY.md`** and this file as the current payment narrative.
