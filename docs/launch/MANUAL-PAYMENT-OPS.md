# Manual payment tracking

- Settlement enum: `PENDING` → `RECEIVED` / `FAILED` / `WAIVED` (schema: `ManualPaymentSettlement`).
- Only trusted roles should transition settlement (host/admin paths in API — see `lib/bnhub/booking.ts`).
- User-facing copy must not claim automatic capture when `onlinePaymentsEnabled` is false for the market.
