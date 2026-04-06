# BNHub listing media (mobile + Supabase)

## Data shape

1. **`listings.cover_image_url`** — optional single hero URL (HTTPS).
2. **`listing_images`** — optional rows: `listing_id`, `url`, `sort_order` (see `apps/mobile/docs/supabase-listings.sql`).

The mobile **`ListingGallery`** component merges **cover** + **`listing_images`** (deduped). **`imageUrls`** prop can override as a flat array when all URLs are known.

## Sources

- **Today:** any HTTPS URL (CDN, static host, or Supabase Storage public URL).
- **Uploads:** server-side `POST /api/bnhub/listing-media/upload` with `BNHUB_LISTING_MEDIA_UPLOAD_SECRET` — see **`docs/bnhub/listing-media-storage.md`**.

## Mobile

- No Storage secrets; listing media is exposed as HTTPS URLs from the **platform API** (`GET /api/bnhub/public/listings/[id]`) and rendered in **`ListingGallery`** (paged carousel when multiple URLs).
- Missing images: premium placeholder, non-blocking.

## Marketplace extensions

- Optional **`latitude` / `longitude`** and **`stripe_connect_account_id`** on `listings`: see `apps/mobile/docs/supabase-listings-marketplace-extensions.sql`.
