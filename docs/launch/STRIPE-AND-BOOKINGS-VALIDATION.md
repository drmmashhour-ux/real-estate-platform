# Stripe and bookings validation

## Online (Stripe) path

1. **Checkout creation** — `lib/stripe/checkout.ts` logs `[STRIPE] checkout created` with session id, booking/listing ids (no PAN).
2. **Metadata** — validated via `assertCoreCheckoutMetadata` / booking guards before session creation.
3. **Webhook** — `app/api/stripe/webhook/route.ts`:
   - Logs `webhook_received` with `stripeEventId`, session id, payment status.
   - Updates booking + payment when `payment.updateMany` affects pending rows.
   - Logs `webhook_verified booking_updated` on success.
   - Logs `duplicate_webhook_ignored` when payment row was already non-pending (idempotent path).
4. **Growth** — `payment_completed` + `booking_confirmed` manager events emitted on first successful payment application.
5. **Never log** secrets, raw card data, or full payment method payloads.

## Manual path (Syria-style)

1. **States** — `ManualPaymentSettlement` on `Booking`: `PENDING` → `RECEIVED` / `FAILED` / reset flows in `lib/bnhub/booking.ts`.
2. **Permissions** — host or platform admin for settlement changes.
3. **Audit** — `BnhubBookingEvent` + `BookingManualPaymentEvent` rows on transitions.
4. **API** — `PATCH /api/bookings/manual-payment` (alias) and existing BNHub routes.
5. **Growth** — `manual_payment_marked_received` + `booking_confirmed` manager events after manual confirm.

## Payment mode abstraction

- `resolveActivePaymentModeFromMarket` / `buildPaymentResolutionContext` — `apps/web/lib/payments/resolve-payment-mode.ts`.
- High-level checkout phase helper — `apps/web/lib/payments/transitions.ts`.

## Booking transitions

Central matrix: `apps/web/lib/bookings/transitions.ts` (`canTransitionBookingStatus`). New routes should align with this guard before writing status changes.

## Ops

- Pending queue: `/admin/bookings-ops`.
- Playbooks: `docs/launch/BOOKING-OPS-PLAYBOOK.md`, `docs/launch/MANUAL-PAYMENT-OPS.md`.
