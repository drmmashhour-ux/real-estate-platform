# Launch verification report (pre-soft-launch)

**Date:** 2026-03-19
**Target:** `apps/web` production hardening

## Step 1 — Clean stale build artifacts + fresh production build
- **Action:** `rm -rf apps/web/.next && npm run build --workspace=apps/web`
- **Result:** **PASS**
- **Notes:** Build succeeded; route list indicates dynamic server-rendered endpoints on demand.

## Step 2 — Complete E2E verification in Stripe test mode
- **Result:** **FAIL (not fully runnable here)**
- **Reason:** `STRIPE_WEBHOOK_SECRET` is empty in the local `apps/web/.env`, so we cannot verify Stripe webhook signatures or process real `checkout.session.completed` events end-to-end in this environment.
- **What we did verify instead (automation):**
  - `vitest` suite coverage for critical payment entrypoints and booking/payment guards.
  - Checkout-session creation hardening and booking guard unit tests.

## Step 3 — Verify production environment behavior (NODE_ENV=production)
### 3.1 `POST /api/auth/demo-session` returns 403
- **Result:** **PASS** (observed body: `Forbidden`)

### 3.2 `GET /api/auth/demo-users` returns 403
- **Result:** **PASS** (observed body: `Forbidden`)

### 3.3 `POST /api/payment/pay` returns 403
- **Result:** **PASS** (observed body: `"This payment path is disabled in production. Use Stripe checkout when available."`)

### 3.4 Payment UI uses Stripe only
- **Result:** **PASS (code-level)**
- **Check:** `apps/web/app/bnhub/booking/[id]/booking-pay-button.tsx` calls `POST /api/stripe/checkout` and has no mock `/api/bnhub/bookings/[id]/pay` fallback.

## Step 4 — Review runtime outputs (duplicate webhooks, ownership checks, tax totals, no stale pay-route refs)
- **Duplicate webhook protection:** **PARTIAL**
  - **Code:** webhook uses DB idempotency keyed by `stripeSessionId` (checked via source).
  - **Runtime:** not confirmed via real Stripe webhook event in this environment.
- **Booking ownership checks:** **PASS (code-level + unit-tested)**
  - `assertGuestCanCheckoutBooking()` enforces `booking.guestId === guestUserId` and PENDING states.
- **Tax totals:** **PASS (code + tests)**
  - Québec GST/QST applied via `quebec-tax-engine` in booking pricing.
  - Unit tests for Québec retail lodging tax pass.
- **No stale references to removed pay route:** **PASS (code-level)**
  - No `/api/bnhub/bookings/.../pay` references found in `apps/web/app`.
  - `.next` rebuilt to remove stale manifests.

## Step 5 — Automated tests (closest available to E2E in this environment)
- **Action:** `npm test --workspace=apps/web`
- **Result:** **PASS**
- **Details:** 53 test files / 231 tests passed.

## Final recommendation
**NOT READY**

### Why not ready?
- The **full Stripe checkout → webhook → booking confirmation** E2E cannot be executed/verified here due to missing `STRIPE_WEBHOOK_SECRET` (and therefore webhook signature/idempotency cannot be runtime-validated with real Stripe events).

### Required next checks to reach “SOFT-LAUNCH READY”
1. Set `STRIPE_WEBHOOK_SECRET` in production/staging env.
2. Run a real Stripe **test-mode** payment end-to-end:
   - user → `POST /api/stripe/checkout`
   - Stripe sends `checkout.session.completed` → `POST /api/stripe/webhook`
   - webhook updates booking/payment to confirmed/completed
   - second identical webhook is ignored (idempotency)

