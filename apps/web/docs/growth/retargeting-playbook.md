# Retargeting — tracking, audiences, ads

End goal: **recover users who browsed BNHUB stays but did not complete a paid booking**, using the same signals in Meta and (optionally) Google.

## 1. What we track (implemented)

| Intent | First-party (`/api/analytics/track`) | Meta Pixel (standard) | When |
|--------|----------------------------------------|------------------------|------|
| Page view | `page_view` | `PageView` | Route change (`TrafficPageViewBeacon` + `trackPageView`) |
| Listing view | `listing_view` | `ViewContent` (`content_ids`: listing) | `ListingViewedBeacon` → `reportProductEvent(listing_viewed)` |
| Booking intent (CTA) | `booking_click` | `AddToCart` (`content_ids`: listing) | Guest submits booking form → `track(BOOKING_CLICK)` before API |
| Booking start | `booking_started` | `InitiateCheckout` | Booking record created → `reportProductEvent(booking_started)` |
| Booking paid | `booking_completed` | `Purchase` (if `payment_confirmed: true`) | Success / confirmation flow |

Code references:

- `lib/tracking.ts` — `track()`, `trackPageView()`
- `lib/analytics/product-analytics.ts` — `reportProductEvent()` → GA4, PostHog, Meta, Plausible
- `modules/analytics/services/meta-pixel.ts` — Pixel mappings
- `components/traffic/TrafficPageViewBeacon.tsx` — page views
- `components/analytics/ListingViewedBeacon.tsx` — listing views

Env: `NEXT_PUBLIC_META_PIXEL_ID` (see [meta-retargeting.md](./meta-retargeting.md)).

## 2. Audience: visited but no booking

### Meta (recommended)

Use **standard events** so rules stay stable when URLs change.

**A — Broad site visitors, exclude payers**

1. Audiences → Create → **Custom audience** → **Website**
2. **Include**: `PageView` — last **90–180 days**, domain = your site
3. **Exclude**: `Purchase` — same or longer window

**B — Listing interest, no completed stay payment**

1. **Include**: `ViewContent` — 30–90 days (optionally filter by URL contains `/bnhub` if you use URL rules)
2. **Exclude**: `Purchase`

**C — Clicked Reserve but did not pay** (strongest “warm” pool)

1. **Include**: `AddToCart` or `InitiateCheckout` — 14–30 days  
2. **Exclude**: `Purchase`

**D — “Visited but never started checkout”** (cold retargeting)

1. **Include**: `ViewContent` — 30 days  
2. **Exclude**: `InitiateCheckout` **and** `Purchase`

> **Note:** Server-only Stripe steps do not fire the browser pixel until you add [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api). Pixel coverage is enough to launch.

### Google (GA4 / Google Ads)

If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, you receive custom event names from `gtag` (`listing_viewed`, `booking_started`, …). In GA4:

- **Explore** or **Advertising** → **Audiences**  
- Build: users with `listing_viewed` (or `page_view` + page path) **without** `booking_completed` / purchase-related events, as your data model allows.

Link the GA4 property to Google Ads → **Import** audiences for remarketing campaigns.

## 3. Retargeting ads (creative brief)

Use **social proof + city + price + low friction** (aligned with listing page trust strips).

**Prospecting-style reminder (Audience A/B)**

- **Headline:** Still thinking about [City]?  
- **Body:** Verified stays · Secure booking · See nightly rate and dates on LECIPM.  
- **CTA:** Find your dates  

**Warm — viewed listing (Audience B)**

- **Headline:** The stay you viewed in [City] is still on BNHUB  
- **Body:** Pick your dates — you won’t be charged until checkout.  
- **CTA:** Reserve now  

**Hot — AddToCart / InitiateCheckout (Audience C)**

- **Headline:** Finish your reservation  
- **Body:** Your dates are waiting — secure checkout with Stripe.  
- **CTA:** Complete booking  

**Placement:** Feed + Stories; use **carousel** with listing photos when DPA/catalog is not connected.

**Measurement:** optimize for `Purchase` or `InitiateCheckout` depending on volume; keep **Purchase** as account-wide conversion for value.

## 4. Checklist before spend

- [ ] `NEXT_PUBLIC_META_PIXEL_ID` set in production  
- [ ] [Meta Pixel helper](https://developers.facebook.com/docs/meta-pixel) / Events Manager shows `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` in test mode  
- [ ] Exclusion audience `Purchase` attached to prospecting campaigns to avoid paying for converted users  
- [ ] Privacy: cookie banner + ads policy links as required in your regions  

## See also

- [paid-social-scaling-playbook.md](./paid-social-scaling-playbook.md) — budget ramps, duplication vs brute-force scale, geo order, daily ops  
- [listing-to-traffic-funnel.md](./listing-to-traffic-funnel.md) — listing → content → video → post → traffic (product mapping)  
- [content-traffic-flywheel.md](./content-traffic-flywheel.md) — content → traffic → listings → booking → data → optimization → more content  
