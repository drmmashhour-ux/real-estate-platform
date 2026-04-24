# BNHub booking schema — STR reservations

This document describes the production booking model for short-term rentals (BNHub): calendar semantics, money snapshots, occupancy storage, blocks, guests, and the audit trail.

## Models (overview)

| Model | Purpose |
|--------|---------|
| `Booking` | Canonical reservation: guest, listing, stay window, status, legacy amount fields, **immutable price snapshots**. |
| `BookingNight` | One row per occupied **calendar night** for overlap analytics and reconciliation with `AvailabilitySlot`. |
| `AvailabilitySlot` | Per-day calendar (available / blocked / booked, price overrides). Still the primary calendar UI source. |
| `AvailabilityBlock` | Multi-day **host / hold / maintenance** ranges `[startDate, endDate)` in UTC `DATE`. |
| `BookingGuest` | Additional guests on a booking; primary booker remains `Booking.guest` (`User`). |
| `BnhubBookingEvent` | Append-only audit log (`eventType` + JSON `payload`). |
| `Payment` | Stripe / checkout linkage; `amountCents` is the charged total. |

Prisma definitions live in `apps/web/prisma/schema.prisma` (source of truth for migrations).

## Date semantics

- **`checkOut` is exclusive.** The stay includes every night `d` such that `checkIn ≤ d < checkOut` (in UTC calendar-day normalization used by `utcDayStart` / `eachNightBetween` in `lib/bnhub/availability-day-helpers.ts`).
- **`nights` (nightsCount)** equals the number of nights in that half-open interval; it matches the count of `BookingNight` rows when calendar sync is healthy.
- **`BookingNight.stayDate`** is a PostgreSQL `DATE` (UTC calendar day). Each occupied night has exactly one row per `(listingId, stayDate, bookingId)`.

## Price snapshots (`Booking`)

Historical totals must not be recomputed from current `nightPriceCents` or rules. These fields are set at booking creation (and backfilled for legacy rows):

| Field | Meaning (cents) |
|--------|------------------|
| `priceSnapshotSubtotalCents` | Pre-tax, pre-guest-service-fee: lodging (after discount) + cleaning + add-ons. |
| `priceSnapshotFeesCents` | Guest-facing platform service fee on lodging (`serviceFeeCents` from pricing engine). |
| `priceSnapshotTaxesCents` | Lodging taxes (e.g. GST+QST). |
| `priceSnapshotTotalCents` | Full amount charged to the guest (`PricingBreakdown.totalCents`). |

Legacy columns `totalCents`, `guestFeeCents`, `hostFeeCents` remain for compatibility; new reporting should prefer snapshots + `Payment`.

## Payment linkage

- `Payment.bookingId` is 1:1 with `Booking`.
- `Payment.amountCents` is the total charged; use with snapshots for reconciliation.
- `BnhubBookingInvoice` (when present) is a post-checkout PDF/API snapshot.

## Booking lifecycle & events

Use **`BnhubBookingEvent`** for an append-only trail. Suggested `eventType` values (string; extend as needed):

- `created` / `awaiting_host_approval` — reservation row created (existing behavior).
- `availability_checked` — overlap + calendar checks passed (written inside the same transaction as create in the main BNHub flow).
- `payment_started` — checkout session / intent created (optional; wire from checkout code).
- `payment_succeeded` / `payment_failed` — Stripe or manual settlement outcome (align with webhooks / `Payment` status).
- `confirmed` — booking confirmed after payment or host/manual path.
- `cancelled` — cancellation with payload `{ reason, by, … }`.
- `completed` — stay completed.

`payload` is JSON (documented here as **payloadJson** in API terms). Legacy rows may use older labels (`approved`, `declined`, etc.).

## Overlap rules

- **Active bookings** (statuses that block the calendar) overlap another range `[checkIn, checkOut)` iff `existing.checkIn < new.checkOut && existing.checkOut > new.checkIn`.
- **`BookingNight` + `AvailabilitySlot`** both reflect occupied nights; release/cancel should clear **both** (`releaseBookedSlotsForBooking`).
- **`AvailabilityBlock`**: use half-open `[startDate, endDate)` for blocks; overlap queries mirror booking overlap on `DATE` ranges.

## Indexes

- `Booking`: `@@index([listingId, checkIn, checkOut])` for listing-scoped range queries.
- `BookingNight`: `@@index([listingId, stayDate])` and `@@unique([listingId, stayDate, bookingId])`.
- `AvailabilityBlock`: `@@index([listingId, startDate, endDate])`.
- `BnhubBookingEvent`: `@@index([bookingId, createdAt])` for per-booking timelines.

## Migration / backfill

Migration `20260430300000_bnhub_booking_str_foundation`:

- Adds tables and snapshot columns only (no drops).
- Backfills `price_snapshot_*` from `Booking` + `payments` where possible (taxes default `0` for legacy).
- Backfills `BookingNight` from `AvailabilitySlot.booked_by_booking_id`, then fills gaps for active bookings via `generate_series`.

## Operational checklist

- [ ] New booking flows set all four `priceSnapshot*` fields at creation.
- [ ] Cancellations call `releaseBookedSlotsForBooking` (slots + nights).
- [ ] OTA/channel imports use the same pricing snapshot fields as core BNHub `createBooking`.
- [ ] Money reporting uses snapshots + `Payment`, not live listing price.
