# Syria manual-first operations

## Intent

When `getResolvedMarket()` resolves the Syria profile (`onlinePaymentsEnabled` false, manual tracking on, contact-first emphasis):

- Guests **request** stays; hosts **confirm** without Stripe card capture.
- **Manual payment** is tracked on the booking (`ManualPaymentSettlement`).
- **PATCH** `/api/bookings/manual-payment` and BNHub host tools update settlement with audit rows.

## Runbook snippets

1. Watch **Booking ops**: `/admin/bookings-ops` for `AWAITING_HOST_APPROVAL` and `manualPaymentSettlement = PENDING`.
2. After funds confirmed offline, host/admin marks **received** → booking **CONFIRMED** (see `confirmBookingManualSettlement`).
3. Failures → `FAILED`; reset path returns to `PENDING` where allowed.

## Docs

- `docs/syria-mode.md`, `docs/markets/SYRIA-LAUNCH-MODE.md`, `docs/launch/MANUAL-PAYMENT-OPS.md`
