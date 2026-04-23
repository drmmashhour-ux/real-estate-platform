# LECIPM: AI Closer and visit booking

## Overview

The booking flow is implemented on CRM `LecipmVisitRequest` (soft hold) and `LecipmVisit` (confirmed showing). It is **not** the BNHub short-term stay `Booking` model.

## End-to-end flow

1. **AI Closer** (or the suggest API) calls `getBestAvailableBroker` → `getAvailableVisitSlots` to return **real** free windows from broker availability, time off, existing visits, and valid pending holds (`hold_expires_at` in the future or null).
2. The buyer (or rep) **selects a slot**; the client calls `POST /api/lecipm/visit-booking/hold` to create a **pending** request with a short soft lock (`holdExpiresAt` ≈ 15 minutes).
3. The user must send **`userConfirmed: true`** to `POST /api/lecipm/visit-booking/confirm`. Without that flag, `confirmVisitBooking` refuses to create a `LecipmVisit`.
4. `confirmVisitBooking` runs in a **transaction**: checks overlapping scheduled visits and other active holds, then sets the request to `accepted`, creates `LecipmVisit`, sets lead `lecipmCrmStage` to `visit_scheduled`, and sends buyer/broker **transactional email**.
5. If another hold or visit took the time first, the API returns **409**; `booking-conflict.service`’s `resolveSlotConflict` can be used to fetch replacement slots (same engine as the closer).

## Broker matching

`getBestAvailableBroker` in `centris-broker-routing.service.ts` starts from the **listing owner** (CRM `Listing` or FSBO owner). It scores **availability** (open slot count, performance field on `LecipmBrokerBookingSettings`) and down-weights for **workload** (pending holds + scheduled visits in the search window). Location proximity can be added where geo fields exist; today routing is **listing-broker first**.

## Conflict handling

- **Stale holds** — `expireStaleHolds` sets expired pending rows to `cancelled` (cron or job should call it periodically).
- **Race on confirm** — the transaction re-checks `LecipmVisit` and foreign pending overlaps before write.
- **Reserve** — `reserveSlot` rejects overlaps with other leads’ **pending** holds and any **scheduled** `LecipmVisit` for the same broker.

## Notifications

`booking-notification.service.ts` emails the buyer and broker; optional `LECIPM_PLATFORM_ALERTS_EMAIL` can receive a high-value alert from the confirm API when `estimatedValue` is very large.

## Mobile

- `GET /api/mobile/lecipm/availability` — broker’s own free slots (mobile session).
- `GET|PATCH /api/mobile/lecipm/bookings` — list scheduled visits; `PATCH` with `decline_hold` or `cancel_visit` for the signed-in broker.

## Dashboards

- Broker: `/dashboard/broker/calendar` + `GET/POST /api/broker/lecipm/calendar` (upcoming visits, holds, block time as `LecipmBrokerTimeOff`).
- Admin: `GET /api/admin/lecipm/booking-metrics` (today’s visits + AI Closer learning bridge).

## AI Closer

Pass `listingId` with `leadId` to `POST /api/ai-closer/assist` to include **`bookingSlotSuggestion`** and, when the stage is booking-ready, to replace the main script line with the **slot list message** (still labeled as the LECIPM assistant, not the broker).

## Database

`prisma/migrations/20260423210000_lecipm_broker_booking_holds` adds `lecipm_broker_booking_settings` and `visit_source`, `hold_expires_at`, and `metadata` on `lecipm_visit_requests` when not already present.

Apply with your standard Prisma workflow (`migrate deploy` / `migrate dev`).

## Scheduled jobs

`POST /api/cron/lecipm-expire-visit-holds` (Bearer `CRON_SECRET`) runs `expireStaleHolds` so expired soft holds stop blocking the calendar.
