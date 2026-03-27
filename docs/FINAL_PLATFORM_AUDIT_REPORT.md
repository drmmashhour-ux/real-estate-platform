# Final platform audit report — full system evaluation

**Scope:** `apps/web` (Next.js API routes, `lib/`, Prisma schema references).  
**Method:** Static code review — no production runtime or load tests executed.  
**Date:** 2025-03-19  

---

## 1. Functionality review

### Authentication (signup / login / roles)

| Item | Status | Evidence |
|------|--------|----------|
| Password login + rate limiting | ✅ Implemented | `app/api/auth/login/route.ts` |
| Registration with roles | ✅ Implemented | `app/api/auth/register/route.ts` |
| Session = httpOnly cookie `lecipm_guest_id` | ✅ | `lib/auth/session.ts` (`getGuestId`, `setGuestIdCookie`) |
| Demo session without password | ⚠️ **Dev only** | `app/api/auth/demo-session/route.ts` — returns **403** when `NODE_ENV === "production"` (`isDemoAuthAllowed()` in `lib/auth/demo-auth-allowed.ts`). |

### Listings system

| Item | Status | Evidence |
|------|--------|----------|
| Short-term listings + pricing | ✅ | `lib/bnhub/booking-pricing.ts`, Prisma `ShortTermListing` |
| Listing creation gates (owner vs broker) | ✅ | `lib/compliance/professional-compliance.ts` (`assertCanCreateListing`) |

### Broker system

| Item | Status | Evidence |
|------|--------|----------|
| Broker verification gates for deals | ✅ | `assertBrokerCanParticipateInDeals` → `getBrokerProfessionalCompliance` in `lib/compliance/professional-compliance.ts`; used in `app/api/deals/route.ts` |
| Dashboard / conversion funnel (recent) | ✅ | `app/api/broker/conversion-funnel/route.ts`, broker dashboard pages |

### Deal / negotiation system

| Item | Status | Evidence |
|------|--------|----------|
| List deals for buyer/seller/broker | ✅ | `GET /api/deals` in `app/api/deals/route.ts` |
| Create deal | ✅ | `POST /api/deals` — parties from session + `listingId` + optional `buyerEmail` (no client user IDs) |
| **Deal POST party spoofing** | ✅ **Mitigated** | `POST /api/deals` rejects `buyerId`/`sellerId`/`brokerId` in body; `brokerId` = session for BROKER/ADMIN; `sellerId` = listing owner; `buyerId` = session or user resolved from `buyerEmail`. |

### Booking (BNHub)

| Item | Status | Evidence |
|------|--------|----------|
| Create booking (signed-in, policy/fraud hooks) | ✅ | `app/api/bnhub/bookings/route.ts` |
| Pay via Stripe Checkout when configured | ✅ | `app/bnhub/booking/[id]/booking-pay-button.tsx` → `POST /api/stripe/checkout` |
| Webhook confirms booking on paid session | ✅ | `app/api/stripe/webhook/route.ts` (`paymentType === "booking" && bookingId`) |
| **Mock “Pay now” without Stripe** | ❌ **Critical** | See §5 / §8 |

### Stripe payments

| Item | Status | Evidence |
|------|--------|----------|
| Checkout API | ✅ | `app/api/stripe/checkout/route.ts`, `lib/stripe/checkout` |
| Webhook (signature verification, entitlements) | ✅ | `app/api/stripe/webhook/route.ts` (documents reliance on webhook, not success URL alone) |
| Client helper | ✅ | `lib/stripe.ts` (`getStripe`, `isStripeConfigured`) |

### Notifications

| Item | Status | Evidence |
|------|--------|----------|
| Email (Resend) on payment success (subscription path) | ✅ Partial | `sendPaymentSuccessEmail` in webhook; booking confirmation email in `app/api/bnhub/bookings/route.ts` (`sendBookingConfirmation`) |
| Full coverage of all money events | ⚠️ Not fully verified | Depends on Resend config and all branches in webhook |

---

## 2. Financial system review

### Transactions

- **Card / platform payments:** Created/updated through Stripe webhook flow with metadata (`paymentType`, `bookingId`, `dealId`, etc.) — `app/api/stripe/webhook/route.ts`.
- **Mock BNHub pay:** **Removed.** Booking payment is only via `POST /api/stripe/checkout` + `POST /api/stripe/webhook` (`checkout.session.completed`).

### Financial dashboard / accounting module

- Admin finance actor resolved from cookie + **DB role** — `lib/admin/finance-request.ts` + `isFinancialStaff`.
- Payout listing API — `app/api/admin/finance/payouts/route.ts` (`getFinanceActor` guard).

### Commission logic

- Stripe path: `createCommissionsForPayment`, `getOrCreateCommissionRules` — imported in `app/api/stripe/webhook/route.ts`.
- BNHub fees: guest 12% / host 3% on subtotal — `lib/bnhub/booking-pricing.ts` (`GUEST_SERVICE_FEE_PERCENT`, `HOST_FEE_PERCENT`).

### Platform vs broker revenue separation

- Invoice builder split — `buildInvoiceForPlatformPayment`, `buildSplitIssuerInvoiceRecords` in `lib/finance/payment-invoice.ts` (referenced from webhook).
- Revenue ledger — `createRevenueLedgerForPayment` in webhook.

### Totals / platform fee / broker commission / taxes

| Area | Assessment |
|------|------------|
| Stripe-settled payments | ✅ Substantial logic in webhook + invoice helpers (needs CPA validation for your supply chain). |
| BNHub quoted totals | ✅ `computeBookingPricing` uses `calculateQuebecRetailTaxOnLodgingBaseExclusiveCents` (GST 5%, QST 9.975% on subtotal+GST) + service fee. |
| **Tax vs Quebec engine** | ✅ **Unified** — booking pricing, `calculateBookingFees`, and platform invoice GST/QST lines use `lib/tax/quebec-tax-engine.ts` (`quebecRetailTaxRates`). |
| **Currency** | ⚠️ Mock pay records revenue with `currency: "USD"` in `recordRevenueEvent` while UI checkout uses `cad` — inconsistency risk. |

**Financial system status:** **Incorrect / incomplete for production** until mock pay is removed or gated, tax model for stays is aligned with policy, and currency is consistent end-to-end.

---

## 3. Tax system (GST / QST) review

### Quebec math (GST + compound QST)

- ✅ **Correct pattern** for exclusive calculation: GST on subtotal, QST on (subtotal + GST) — `lib/tax/quebec-tax-engine.ts` (`calculateQuebecTaxExclusiveCents`, docstring on compound QST).

### Broker tax profiles / platform registration

- Broker snapshot types — `lib/tax/broker-tax-snapshot.ts` (imported in webhook).
- Platform GST/QST from environment — `lib/finance/platform-tax-registration.ts` (referenced in webhook).

### Invoice tax breakdown

- Platform invoice path builds tax-aware records — `buildInvoiceForPlatformPayment` / `buildSplitIssuerInvoiceRecords` (`lib/finance/payment-invoice.ts`), used in `app/api/stripe/webhook/route.ts`.
- Customer-facing invoice list scoped to user — `app/api/billing/platform-invoices/route.ts` (`getGuestId`, `invoiceIssuer: "PLATFORM"`).

### BNHub stays vs invoicing

- Stays: tax on **subtotal + cleaning** via **`calculateQuebecRetailTaxOnLodgingBaseExclusiveCents`** — `lib/bnhub/booking-pricing.ts`. No per-listing tax %.

### Double taxation / appropriateness

- ⚠️ Risk: **Two tax models** (flat percent on stay vs compound GST/QST on platform invoices) without a documented mapping → misstated guest totals or remittance assumptions.
- ✅ Platform invoice API is not anonymous public data; comment documents sensitivity — `app/api/billing/platform-invoices/route.ts`.

**Tax system status:** **Aligned** — BNHub `computeBookingPricing`, `calculateBookingFees`, and `buildInvoiceForPlatformPayment` use `lib/tax/quebec-tax-engine.ts` (GST 5%, QST 9.975% compound on lodging subtotal + cleaning). CPA validation still recommended.

---

## 4. Invoice & document system

| Item | Status | Evidence |
|------|--------|----------|
| Platform invoices (DB + API) | ✅ | `platformInvoice` usage in webhook; `GET /api/billing/platform-invoices` |
| Print HTML | ✅ | `lib/billing/platform-invoice-print-html.ts` (per earlier scan; GST/QST fields in billing UI — `app/(dashboard)/dashboard/billing/billing-content.tsx`) |
| Separation platform vs broker issuers | ✅ | `invoiceIssuer: "PLATFORM"` filter; split builders in `payment-invoice.ts` |

**Missing / weak:** Ensure every paid `paymentType` path creates consistent PDF/HTML and broker copies where required (verify all webhook branches — not fully enumerated here).

---

## 5. Payout system review

- **Model + admin workflow:** `BrokerPayout`, status enum, `GET`/`POST` admin routes — `app/api/admin/finance/payouts/route.ts`, `app/api/admin/finance/payouts/[id]/route.ts`, `lib/admin/broker-payout-actions.ts`.
- **Traceability:** Commission lines linked in payout includes — same payout route.
- **Automated Stripe Connect mass payout:** Not verified in this audit; reads as **manual / batch ops** unless Connect transfer code exists outside reviewed files.

**Verdict:** **Correct for internal ledger + ops tracking**; **incomplete** if expectation is fully automated broker transfers.

---

## 6. Compliance review (Quebec — structure)

| Item | Status | Evidence |
|------|--------|----------|
| Broker license + verification before deals | ✅ | `getBrokerProfessionalCompliance` + `assertBrokerCanParticipateInDeals` |
| Owner path for listings | ✅ | `getOwnerProfessionalCompliance` / `assertCanCreateListing` |
| Listing authority types | ✅ | `ListingAuthorityType` + broker metadata requirements |

**⚠️ Gaps:** OACIQ/regulatory compliance is **structural in code**, not legal certification. Deal creation should be reviewed for **ID spoofing** (buyer/seller/broker IDs from client). Professional disclaimers for AI/chat are separate (marketing/docs).

---

## 7. Regulatory risk analysis

- **Brokerage:** Platform enforces verification gates but **does not replace** provincial brokerage law; CRM/deal tools can still create **unauthorized practice** risk if marketed as full brokerage.
- **Financial operations:** Mock payment confirms bookings without funds — **fund-handling misrepresentation** risk if shown to users as “paid”.
- **Investment features:** Property analytics / “investment” scoring (if present in schema or dashboards) should be clearly **informational only** — grep shows valuation/investment-adjacent fields may exist; treat as **marketing analytics**, not securities.

---

## 8. Security review

| Issue | Severity | Evidence |
|-------|----------|----------|
| ~~Mock pay~~ | **Addressed** | Mock `POST /api/bnhub/bookings/[id]/pay` removed; checkout uses `assertGuestCanCheckoutBooking` (`lib/bnhub/booking-checkout-guard.ts`); webhook uses `assertBookingStripeWebhookValid`. |
| **Demo session** | **Mitigated in production** | Same route + `GET /api/auth/demo-users` blocked when `NODE_ENV === "production"`. |
| **Role cookie `hub_user_role` is not httpOnly** | **Medium** | `lib/auth/session.ts` — client-readable; must not be sole authority for sensitive operations (finance uses DB role — good). |
| Billing APIs | ✅ | `getGuestId()` required — e.g. `app/api/billing/platform-invoices/route.ts` |

**Security status:** **Vulnerable** until mock pay is fixed or disabled in production and demo-session is restricted/disabled.

---

## 9. UI / UX review

- Mixed hub aesthetics (e.g. BNHub vs main search) — **acceptable** for multi-product but needs a **design system pass** for investor-grade consistency.
- Conversion/trust UI documented in repo reports — not re-audited pixel-by-pixel here.

**UI status:** **Needs improvement** for single-brand polish; functional patterns exist.

---

## 10. Performance review

- No automated load tests cited in this audit.
- Booking pricing does **per-night DB reads** for `AvailabilitySlot` — potential N+1 for long stays — `lib/bnhub/booking-pricing.ts` (loop with `findUnique`).
- Caching strategy (Redis, etc.) not verified end-to-end.

**Performance status:** **Unknown / at risk** under scale without measurement.

---

## 11. Mobile readiness

- Widespread responsive Tailwind usage assumed; no dedicated native app found in scope.
- APIs return JSON; mobile clients would use same endpoints — subject to auth cookie/CORS strategy (not fully audited here).

**Mobile status:** **Reasonable for responsive web**; **verify** auth strategy for mobile apps.

---

## 12. Consolidated tables

### ✅ Working features (verified)

- Password auth + registration; httpOnly session cookie for user id.
- Deal list/create with broker verification gate for brokers.
- BNHub booking creation with sign-in, policy/fraud hooks, emails.
- Stripe Checkout + webhook for platform payments including booking confirmation.
- Quebec GST+QST **calculation engine** for invoicing-style use.
- Platform invoice listing for signed-in payer; admin finance/payout APIs gated by DB role.
- Professional compliance helpers for broker vs owner listing/deal paths.

### ❌ Broken / incomplete

- ~~**Unauthenticated mock payment**~~ — endpoint removed; use Stripe + webhook only.
- **Demo session** allows session fixation to any user by email.
- ~~BNHub flat tax %~~ — removed; Québec GST+QST only.
- **USD vs CAD** inconsistency in mock revenue recording vs checkout currency.
- **Automated broker payouts** via Stripe Connect not verified.

### ⚠️ Risks

| Category | Risk |
|----------|------|
| Legal | Unauthorized brokerage positioning; deal parties chosen client-side. |
| Financial | Free “payment confirmation” undermines trust and accounting. |
| Security | Mock pay + demo-session. |
| Tax | Dual tax models without documented reconciliation. |

---

## Status lines (mandatory)

| Dimension | Status |
|-----------|--------|
| **Financial system** | Incorrect / incomplete for production (blockers above). |
| **Tax system** | Correct engine for invoices; **needs fixes** for stay pricing alignment. |
| **Security** | **Vulnerable** (critical mock pay; demo-session). |
| **UI** | Needs improvement (consistency / polish). |
| **Performance** | Unknown — measure before scale. |
| **Mobile** | Responsive web plausible; verify auth for native clients. |

---

## 🎯 Final verdict (ONE)

**NOT READY**

**Go / no-go for launch**

- **NO-GO** for **production** handling real money, Quebec tax certainty, and public security posture until:
  1. Mock pay is **removed**, **admin-only**, or **strictly authenticated** (guest must match `booking.guestId`) and **disabled** when Stripe is live.
  2. `demo-session` is **disabled** or protected (secret, env flag, IP allowlist) in production.
  3. BNHub tax policy is **explicitly** implemented (GST+QST engine or legally approved simplified rate) with **consistent currency**.

After those fixes, reassess toward **STARTUP-READY**; **INVESTOR-READY** would additionally require load testing, full payout automation (if promised), legal review, and UX/system unification.

---

*This document is technical due diligence, not legal or tax advice.*
