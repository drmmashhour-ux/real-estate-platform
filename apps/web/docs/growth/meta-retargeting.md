# Meta Pixel — retargeting

## Setup

1. In [Meta Events Manager](https://business.facebook.com/events_manager), create or select a **Pixel**.
2. Set `NEXT_PUBLIC_META_PIXEL_ID` in the web app environment to the numeric Pixel ID.
3. Deploy or restart `pnpm dev` so the client bundle picks up the variable.

The app loads the pixel via `components/analytics/MetaPixelLoader.tsx` (included from `app/providers.tsx`).

## Standard events (for Audiences & optimization)

| Signal | Meta event | When |
|--------|------------|------|
| Page visit | `PageView` | Initial load + client navigations (`TrafficPageViewBeacon` + `trackPageView`) |
| Listing detail | `ViewContent` | `listing_view` / `listing_viewed` (includes `content_ids` when `listingId` / `listing_id` is present) |
| Booking started | `InitiateCheckout` | `booking_started` (BNHUB booking form, checkout client, `/api/analytics/track` when mirrored client-side) |
| Booking paid | `Purchase` | `booking_completed` with `payment_confirmed: true` on booking success page (value + listing when available) |

Custom funnel events still use `trackCustom` for other `track()` names.

## Audience: visited but no completed booking

Use **standard events** so Meta can build rules without only URL traffic.

**Recommended (event-based)**

1. Audiences → Create audience → **Website** (or **Custom audience** → **Website**).
2. **Include**: People who fired **PageView** (or **ViewContent** for listing-intent) in the last **90–180 days** on your domain.
3. **Exclude**: People who fired **Purchase** in the same (or longer) window.

Result: users who browsed but did not complete a **paid** booking (Purchase only fires when `payment_confirmed` is true on the success page).

**Optional stricter funnel**

- **Exclude** people who fired **InitiateCheckout** if you want to target only those who never *started* a booking (usually you want to retarget people who started but abandoned — then exclude Purchase only).

## Notes

- **Server-only** analytics (e.g. some `trackEvent` calls) do not hit the browser pixel; for full coverage add [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api) later.
- iOS / ATT may limit delivery; pixel still attributes where permitted.
