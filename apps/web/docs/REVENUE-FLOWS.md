# Revenue flows (Stripe) — audit reference

Canonical payment confirmation is **always** via **`POST /api/stripe/webhook`** (Stripe signing secret `STRIPE_WEBHOOK_SECRET`).  
Client redirect to `success_url` is **not** proof of payment.

## Core routes

| Route | Role |
|--------|------|
| `POST /api/stripe/checkout` | Create Checkout Session (`paymentType`, amounts server-side for BNHub bookings). |
| `POST /api/stripe/webhook` | Fulfillment: `checkout.session.completed`, subscriptions, Connect, refunds, etc. |
| `POST /api/fsbo/checkout` | FSBO publish fee — wraps FSBO rules then Stripe. |
| `POST /api/lecipm/leads/checkout` | Lead unlock / lead billing (see body + `lib`). |
| `POST /api/lead-marketplace/checkout` | Lead marketplace purchase. |
| `POST /api/billing/checkout` | Workspace / billing product checkout. |
| `POST /api/billing/webhook` | Billing-specific webhook (if deployed separately from main Stripe webhook). |
| `POST /api/stripe/workspace-checkout` | Workspace subscription checkout session. |
| `POST /api/stripe/workspace-subscription-webhook` | Workspace subscription Stripe events. |
| `POST /api/webhooks/payments` | Orchestrated / bridge payments (see handler). |
| `POST /api/bnhub/bookings/[id]/simulate-payment` | **Demo only** — no real Stripe. |

## BNHub bookings

- **Checkout**: `POST /api/stripe/checkout` with `paymentType: "booking"`, `bookingId`. Amount and listing are **validated server-side** (`assertGuestCanCheckoutBooking`).
- **Connect**: `payment_intent_data.application_fee_amount` + `transfer_data.destination` when host Connect is enabled (`lib/stripe/bnhub-connect.ts`). Commission default: **`BNHUB_COMMISSION_RATE`** (e.g. `0.15` = 15%).
- **Metadata** (session + payment intent): includes `userId`, `paymentType`, **`type`** (`booking` | `fsbo` | `lead` | …), `bookingId`, `listingId`, Connect split fields when applicable.
- **Webhook**: On paid session, creates/updates **`PlatformPayment`**, updates **`Payment`** (Prisma) to `COMPLETED`, confirms **`Booking`**, syncs **`BnhubReservationPayment`** where used.

## FSBO

- Prefer **`POST /api/fsbo/checkout`** → Stripe session with `paymentType: "fsbo_publish"` (or flows through `/api/stripe/checkout` with same type). Platform retains publish fee per plan (`lib/fsbo/constants`).

## Leads

- **`lead_unlock`**, **`mortgage_contact_unlock`**, **`lead_marketplace`**, broker lead invoice types — handled in webhook branches (`PLATFORM_PAYMENT_TYPES` in `app/api/stripe/webhook/route.ts`).

## Logs to grep

- `[STRIPE] [CHECKOUT]` — session created (`lib/stripe/checkout.ts`).
- `[STRIPE] [BOOKING]` — checkout ready (`app/api/stripe/checkout/route.ts`).
- `[STRIPE] [PAYMENT] SUCCESS` — BNHub booking paid and fees resolved (`webhook`).
- `[STRIPE] [PAYMENT] platform_payment recorded` — `PlatformPayment` row created.
- `[STRIPE] checkout.session.expired` — user abandoned Checkout.
- `[STRIPE] [PAYMENT] async_payment_failed` — async payment failed.

## Admin

- **`/admin/revenue-overview`** — last 30 days `PlatformPayment` aggregates (paid).
- **`/admin/revenue-dashboard`** — BNHub-specific revenue + growth snapshot.
- **`/admin/finance`** — financial staff dashboard (broader).
