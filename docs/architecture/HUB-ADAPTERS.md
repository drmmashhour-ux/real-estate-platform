# Hub adapters

## Contract

- **`HubBookingEngine`** (`lib/hub/core/hub-booking-types.ts`): `computeQuote`, `validateAvailability`, `createReservation`, `transitionReservationStatus`.
- **`HubPricingEngine`** (`lib/hub/core/hub-pricing-types.ts`): `price(ctx)`.

Facades: `getBookingEngine(hubKey)`, `getPricingEngine(hubKey)` in `hub-booking.ts` / `hub-pricing.ts`.

## BNHub (`lib/bnhub/hub/bnhub-adapter.ts`)

- **Quotes:** `computeBookingPricing` with `checkIn` / `checkOut` in `window`.
- **Availability:** `isListingAvailability` from `lib/bnhub/listings`.
- **Reservation creation / transitions:** returns structured errors directing callers to existing BNHub APIs — avoids duplicating orchestration in the adapter layer.

## Supporting modules

- `bnhub-config.ts` — registry key constant.
- `bnhub-dashboard.ts` — dashboard sections via `resolveBnhubDashboardSections(role)`.
- `bnhub-search-config.ts` — search config from registry.
- `bnhub-ai-config.ts` — AI capability flags.

## Adding CarHub (future)

1. Add Prisma models / APIs for vehicles.
2. Implement `HubBookingEngine` + `HubPricingEngine` in `lib/carhub/hub/carhub-adapter.ts`.
3. `registerBookingEngine("carhub", …)` when the module loads (or lazy-first-use).
4. Register config in `hub-registry` (already present; enable via env).

## Anti-patterns

- Pasting BNHub booking routes into another hub — use adapter + thin API routes instead.
- Ignoring currency and tax locale — keep pricing results explicit in adapter return types.
