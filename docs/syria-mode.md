# Syria mode (manual payments, contact-first)

## Intent

When the active resolved market is configured for **Syria-style operations**:

- Bookings follow a **request / host confirmation** path instead of instant paid checkout.
- **Online card payments** are disabled; hosts and ops use **manual payment** tracking.
- Guest UX can emphasize **contact host** before or instead of checkout (contact-first).

## Configuration

- Admin launch / market settings (see admin launch ops and market pages in the web app).
- Static reference: `syriaMarket` in `apps/web/lib/markets/catalog.ts` and `apps/web/lib/markets/syria.ts` (Prisma-backed definition).

## APIs

- Manual settlement on bookings is implemented in `apps/web/lib/bnhub/booking.ts`.
- **PATCH** ` /api/bookings/manual-payment` — thin alias for hosts: body `{ bookingId, action: "received" | "failed" | "reset_pending", note? }` (requires session).

## Operations

- [docs/launch/MANUAL-PAYMENT-OPS.md](./launch/MANUAL-PAYMENT-OPS.md)
- [docs/markets/SYRIA-LAUNCH-MODE.md](./markets/SYRIA-LAUNCH-MODE.md)
