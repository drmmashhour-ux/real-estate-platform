# BNHub listing images (Supabase Storage)

## Bucket

1. In Supabase Dashboard → **Storage**, create a **public** bucket named **`listing-media`** (or change `BUCKET` in `apps/web/lib/bnhub/listingMediaUpload.ts` to match).
2. Allow **public read** for anonymous gallery URLs on the mobile property screen.

## Server upload API

- **Route:** `POST /api/bnhub/listing-media/upload`
- **Auth:** `Authorization: Bearer <BNHUB_LISTING_MEDIA_UPLOAD_SECRET>` (set in `apps/web` env only — never in the mobile app).
- **Body:** `multipart/form-data` with fields:
  - `listingId` — UUID of the listing
  - `file` — image binary (`image/jpeg`, `image/png`, etc.)

The handler uploads to Storage, then inserts a row into **`public.listing_images`** with the **public URL** and next **`sort_order`**.

## Env

```
BNHUB_LISTING_MEDIA_UPLOAD_SECRET=your-long-random-secret
```

If unset, the route returns **503** (upload disabled).

## SQL

Run **`apps/mobile/docs/supabase-listings.sql`** so `listing_images` exists. No extra table for Storage objects; URLs are stored like any HTTPS URL.
