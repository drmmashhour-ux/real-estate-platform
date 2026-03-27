# Full User Flow Simulation

**Date:** Generated as part of platform validation  
**Purpose:** Document real scenarios and log issues (broken routes, missing data, UI/API mismatch).

---

## 1. Visitor → Browse

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Land on home | `/` | Featured projects + BNHub listings, search bar, hub cards | ✅ Implemented |
| Search BNHub | `/search/bnhub`, `GET /api/bnhub/search` | Listings with pagination | ✅ Implemented |
| View listing | `/bnhub/[id]` | Listing detail, photos, book CTA | ✅ Implemented |
| Browse projects | `/projects`, `GET /api/projects` | Project list | ✅ Implemented |

**Issues logged:** None. Ensure `NEXT_PUBLIC_APP_URL` is set for server-side featured fetch on home.

---

## 2. User → Signup / Login

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Signup | `POST /api/auth/register` | 200, set cookie, redirect | ✅ API + tests |
| Login | `POST /api/auth/login` | 200, set cookie | ✅ API + tests |
| Logout | `POST /api/auth/logout` | Clear cookie | ✅ Implemented |
| Pages | `/auth/signup`, `/auth/login` | Forms submit to above APIs | ✅ Implemented |

**Issues logged:** Email verification flow exists in schema (`emailVerifiedAt`) but no automated verification email/flow documented.

---

## 3. Owner → Create Listing (BNHub)

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Host apply | `POST /api/bnhub/host/apply` | Application submitted | ✅ Implemented |
| Create listing | `POST /api/bnhub/listings/create`, wizard at `/bnhub/host/listings/new` | Listing created | ✅ Implemented |
| Owner verification | `/api/bnhub/owner-verification/confirm-ownership` | Optional ownership proof | ✅ Implemented |

**Issues logged:** Listing validation requires owner identity OR broker verification (see Listing Validation section).

---

## 4. Broker → Manage

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Broker apply | `POST /api/broker/apply` | Application submitted | ✅ Implemented |
| Admin approve | `POST /api/admin/brokers/applications/[id]/approve` | Broker verified | ✅ Implemented |
| Broker listings | `GET /api/broker/listings` | Listings for broker | ✅ Implemented |
| Broker messages | `/dashboard/broker/messages` | Conversations | ✅ Implemented |
| Broker commissions | Dashboard + billing | Commission view | ✅ Implemented |

**Issues logged:** Broker verification status (pending / verified) and license/docs upload implemented; admin verifications at `/admin/verifications`.

---

## 5. Buyer → Submit Offer

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Submit offer | `POST /api/offers/submit` | offer_id, status | ✅ Implemented |
| Counter | `POST /api/offers/counter` | Counter-offer recorded | ✅ Implemented |
| Accept | `POST /api/offers/accept` | Offer accepted | ✅ Implemented |

**Issues logged:** Uses `transaction_id` (transaction system); deal engine uses `dealId` for deal-based flow. Ensure UI uses correct ID for context.

---

## 6. System → Negotiation

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| List deals | `GET /api/deals` | Deals for user | ✅ API + tests |
| Create deal | `POST /api/deals` | Broker/Admin only | ✅ API + tests |
| Deal detail | `GET /api/deals/[id]` | Single deal | ✅ Implemented |
| Deal checkout | `POST /api/deals/[id]/checkout` | Stripe session for deposit/closing_fee | ✅ Implemented |

**Issues logged:** Timeline system in `lib/transaction-timeline/workflows.ts`; ensure deal detail UI shows offer/counter/timeline.

---

## 7. BNHub → Booking

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Create booking | `POST /api/bnhub/bookings` | listingId, checkIn, checkOut required | ✅ API + tests |
| Pay booking | `POST /api/stripe/checkout` (`paymentType: booking`, `bookingId`, guest must own booking; amount from DB) | Redirect to Stripe | ✅ Implemented (mock `/pay` removed) |
| Webhook | `POST /api/stripe/webhook` (checkout.session.completed) | Booking confirmed, commission | ✅ Implemented |

**Issues logged:** Policy/fraud/restriction checks in booking route; operational-controls and policy-engine may block in restricted regions.

---

## 8. Stripe → Payment

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Checkout | `POST /api/stripe/checkout` | For `booking`: `bookingId` + guest session; charge amount from DB | ✅ API + tests |
| Webhook | checkout.session.completed | PlatformPayment, Booking/Payment update, commissions | ✅ Implemented |
| Refund | charge.refunded | Payment.status = REFUNDED | ✅ Per SYSTEM_TEST_REPORT |
| Failure | payment_intent.payment_failed | Logged via recordPlatformEvent | ✅ Per SYSTEM_TEST_REPORT |

**Issues logged:** Manual test-mode validation required (4242 / 4000 0000 0000 0002); verify live keys and webhooks for production.

---

## 9. Deal → Closing

| Step | Route / Action | Expected | Status |
|------|----------------|----------|--------|
| Deal checkout | `POST /api/deals/[id]/checkout` | paymentType deposit | closing_fee | ✅ Implemented |
| Webhook | Metadata dealId, milestone | DealMilestone, Deal status update | ✅ Implemented |

**Issues logged:** None.

---

## Summary of Logged Issues

- **Broken routes:** None identified from code review.
- **Missing data:** Email verification flow not fully automated; optional cadastre validation for listings.
- **UI/API mismatch:** Offer flow uses `transaction_id`; ensure deal vs transaction context in UI is clear.

**Recommendation:** Add E2E (Playwright/Cypress) for: auth signup/login, BNHub booking create → pay, deal checkout, to catch regressions.
