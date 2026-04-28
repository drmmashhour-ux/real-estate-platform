# SYBNB-130 — WhatsApp funnel validation (manual QA)

Goal: **share → open listing → contact** works end-to-end with correct URLs, locale, and analytics.

## 1. Test share

1. Open a **published** listing: `/{locale}/listing/{id}` (e.g. `/ar/listing/…`).
2. Tap **«مشاركة»** / **Share** (`Listing.shareButton`).
3. **WhatsApp**: Opens `wa.me/?text=…` with body from `buildListingShareMessage` (`lib/ai/shareMessage.ts`) and a **canonical listing URL**:
   - Path: `getListingPath(locale, id)` → `/{locale}/listing/{id}` (`lib/syria/listing-share.ts`).
   - Attribution: `hl_share=whatsapp` (`appendHadiahShareSource`, `lib/syria/hadiah-share-attribution.ts`).
4. **Copy link**: Second button copies URL with `hl_share=copy_link` (no WhatsApp).

**Track:** `listing_shared` via `POST /api/analytics/event` (`trackListingSharedClient`, `lib/syria/growth-client.ts`). Payload includes `source`: `whatsapp` | `copy_link` | `copy_full_message` (quick-post). SYBNB-113 may return **429** if share abuse caps trigger — expected under spam patterns.

## 2. Test incoming (shared link)

1. Paste the shared URL on a phone (or desktop). Same locale segment as shared (`/ar/…` vs `/en/…`).
2. **Performance:** Listing shell should load quickly (SYBNB-129 budgets); first gallery image is prioritized (`PropertyImageGallery` — first image eager, rest after expand).
3. **Attribution:** If URL contains `?hl_share=whatsapp` or `hl_share=copy_link`, server attaches `shareSource` to the growth **`listing_view`** when the view is counted (`listing/[id]/page.tsx` + `parseHadiahShareSourceFromSearchParams`).

## 3. Test contact

1. **WhatsApp:** Tap green WhatsApp in trust panel (`ListingTrustPanel`). Link built with `buildListingWhatsAppInquiryHref` — prefilled text matches **page locale** (AR vs EN) (`lib/syria-phone.ts`).
2. **Phone:** Tap «إظهار الرقم» → **`phone_reveal`** fires; then **Call** runs **`contact_click`** with channel `tel`.
3. **Lead counters:** `/api/lead/whatsapp` and `/api/lead/phone` increment clicks and emit **`contact_click`** on `SyriaGrowthEvent` when dedupe allows (`lib/lead-increment.ts`).

**Track (SybnbEvent + growth):**

| Action | Client API | Notes |
|--------|------------|--------|
| WhatsApp tap | `POST /api/sybnb/events` `contact_click` + `POST /api/lead/whatsapp` | `SybnbEvent` + `SyriaGrowthEvent` when DB increment runs |
| Phone reveal | `POST /api/sybnb/events` `phone_reveal` | Before showing digits |
| Tel dial | `contact_click` channel `tel` + `/api/lead/phone` | After reveal |

## 4. Track — event summary

| Event | Where it’s recorded |
|--------|---------------------|
| **`listing_shared`** | `SyriaGrowthEvent` via `POST /api/analytics/event` |
| **`listing_view`** | `SyriaGrowthEvent` server-side when `incrementPublicListingView` counts a new unique view (`lib/syria/listing-views.ts`); optional `payload.shareSource` from `hl_share` |
| **`listing_open`** | `SybnbEvent` — separate beacon on listing detail (`SybnbListingOpenBeacon` → `listing_open`). Not the same row as growth `listing_view`. |
| **`phone_reveal`** | `SybnbEvent` + `SyriaGrowthEvent` via `POST /api/sybnb/events` |
| **`contact_click`** | `SybnbEvent` + (on lead increment) `SyriaGrowthEvent` |

**DevTools:** Filter Network by `analytics/event`, `sybnb/events`, `lead/whatsapp`.

## 5. Edge cases

- **Locale:** Share URL uses **`useLocale()`** in `ListingShareActions` — always matches the UI locale used when sharing. Incoming users should use the same link; mixing `/en/` shared body with `/ar/` UI is a content choice, not a bug if URLs stay consistent.
- **URL correctness:** Listing links must **not** point at `/buy` or home — only `/{locale}/listing/{id}` (+ optional query).

## Success criteria

- Share shows correct viral message + listing URL with `hl_share`.
- Open loads listing fast; hero image visible quickly.
- WhatsApp opens with prefilled inquiry text; phone reveal + call tracked.
- Growth events present for **`listing_shared`**, **`listing_view`** (when counted), and **`phone_reveal`** or **`contact_click`** as applicable.
