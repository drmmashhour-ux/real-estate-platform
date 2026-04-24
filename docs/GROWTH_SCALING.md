# Growth & scaling system

## SEO city landings

Dynamic routes (ISR `revalidate` 180s):

- `/buy/[city]` — FSBO + BNHub highlights
- `/rent/[city]` — BNHub-first + sample FSBO
- `/mortgage/[city]` — mortgage CTAs (no listing dependency)

Supported slugs: `montreal`, `laval`, `quebec`, `new-york`, `miami` (Canada + USA-ready).  
Extend lists in `lib/growth/geo-slugs.ts`.

Each page ships:

- `generateMetadata` (title, description, OG/Twitter)
- FAQ JSON-LD (`FAQPage`)
- Trust strip, testimonials, internal links

## Blog

- `/blog` — index  
- `/blog/[slug]` — posts from `lib/content/blog-posts.ts` (SEO copy + internal links)

## Funnel

`GrowthConversionLayer` (in `app/providers.tsx`):

- Sticky CTAs: **Get pre-approved**, **Talk to expert**, **Free estimate**
- Timed popup → `/evaluate` & `/mortgage`
- Hidden on `/dashboard`, `/admin`, `/auth`, `/api`, `/embed`

Main content gets `pb-28` in root layout to clear the sticky bar.

## Analytics

1. **Server**: existing `/api/analytics/track` + `TrafficEvent` (now includes `growth_cta`, `growth_popup_open`).
2. **GA4**: set `NEXT_PUBLIC_GA_MEASUREMENT_ID`. `lib/tracking.ts` forwards non–page-view events; `trackPageView` calls `gtag config` for `page_path`.

## Referrals

- `/invite` — public page; logged-in users see `auth/signup?ref=CODE`.
- Full rewards UI: `/dashboard/referrals` (existing program).

## Email CRM

`sendGrowthLeadFollowUpEmail` runs after lead creation on:

- `POST /api/lecipm/leads` (DB paths)
- `POST /api/mortgage/lead`
- `POST /api/contact`

Uses Resend like other notifications. Schedule additional reminders via existing automation/cron on `Lead`.

## Retargeting

`lib/retargeting/data-layer.ts` pushes `{ event, ...payload }` to `window.dataLayer` for future Meta/Google Ads tags.

## Admin

- `/admin/growth-scale` + `GET /api/admin/growth-scale` — traffic counts, leads, revenue proxy (`PlatformPayment`), open evaluate sessions.

## Security

Growth analytics uses the same rate limits as `/api/analytics/track`. Lead endpoints unchanged except additive emails.

## Performance

- Listing thumbnails: `next/image` or native `img` with `loading="lazy"`.
- City landings: `revalidate = 180` for edge caching.
