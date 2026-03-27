# BNHub listing page — premium optimization report

**Date:** 2026-03-19  
**Scope:** Public BNHub listing detail (`/bnhub/[id]`) — scanability, trust, conversion, analytics hooks.

## Improvements shipped

| Module | Implementation |
|--------|----------------|
| **Image experience** | Hero image first, prev/next controls, thumbnail strip, lazy thumbs, `fetchPriority` on first image. Badges: **New** (created &lt; 14d), **Featured** (active `PromotedListing`), **Price drop** (UI ready; `false` until price history exists). |
| **Price & key info** | Large nightly rate, location line (city / region / province / country), beds · baths · property type · room type in first section (above gallery on mobile). |
| **Listing ID** | `listingCode` + `CopyListingCodeButton` next to price block. |
| **Quick info** | Icon row: bedrooms, bathrooms, area (regex on amenities/description for `sq ft` / `sqft`), parking (`parkingDetails` + amenity keywords). |
| **Description** | `parseListingDescription()` — paragraph blocks: intro, bullet list, “Full description” remainder; fallback line-scanner for unstructured text. |
| **Similar properties** | `getSimilarBnhubListings()` — same city & country, ±35% nightly price, optional property type with fallback fill. |
| **Contact** | `ListingStickyContactBar` — mobile bottom bar + desktop floating dock: contact broker/host, chat (messages), phone (host `tel:` or platform `PHONE_NUMBER`). |
| **Trust** | `TrustStrip`, `VerifiedBrokerBadge` when `listingAuthorityType === BROKER`, verified host / property / Super Host chips, static “response within 24h” line. |
| **Speed & UX** | Lazy gallery images (non-hero), `scroll-smooth`, `pb-28` on mobile for sticky bar, safe-area padding. |
| **Search** | Link to `/search/bnhub` + copy noting location, price, and listing ID (`LEC-*` / `listingCode` format per env). |
| **Save / favorites** | `SaveListingButton` — `localStorage` + `listing_save` activity when favoriting. |
| **Analytics** | Existing `listing_view` + dwell via `LogListingView`. New allowed events: `listing_contact_click`, `listing_gallery_nav` (metadata: channel / indices). |
| **Build fix** | `dashboard/ai/page.tsx` — `HubLayout` now receives required `hubKey` + `navigation`. |

## Performance notes

- One `getListingById` per request; `getListingPromotion`, `getSimilarBnhubListings`, and `isTripleVerified` run in parallel after listing resolve.
- Similar listings query is indexed on `city`, `country`, `nightPriceCents`, `listingStatus`.
- Gallery uses native `<img>` with explicit dimensions to limit CLS; consider `next/image` + remote patterns for further optimization.

## Known gaps / follow-ups

1. **Price drop badge** — Needs stored previous price or audit table; currently not shown.
2. **Square footage** — No dedicated DB field; inferred from text only.
3. **Save sync** — Favorites are device-local unless extended to authenticated API + DB.
4. **Analytics dashboard** — Events are stored in `AiUserActivityLog`; no listing-level admin UI in this pass.
5. **Screenshot** — Cursor cannot capture your local browser; open any `/bnhub/{id}` after `pnpm dev` and screenshot for design review.

## Testing checklist (manual)

- [ ] Mobile: hero + sticky bar clearance, thumb scroll, contact links.
- [ ] Desktop: floating contact dock, sticky booking column.
- [ ] Signed-in: save toggles + `listing_save` / contact events (Network tab).
- [ ] Listing opened by **public code** vs UUID: similar listings + triple-verified still work.

## Files touched (reference)

- `app/bnhub/[id]/page.tsx` — layout & wiring  
- `app/bnhub/listing-image-gallery.tsx` — gallery + badges + analytics  
- `components/bnhub/SaveListingButton.tsx`  
- `components/bnhub/ListingStickyContactBar.tsx`  
- `components/bnhub/ListingSimilarProperties.tsx`  
- `lib/bnhub/listing-description.ts`, `lib/bnhub/similar-listings.ts`  
- `lib/bnhub/listings.ts` — owner `phone` for `getListingById`  
- `app/api/ai/activity/route.ts` — new `eventType` values  
- `app/(dashboard)/dashboard/ai/page.tsx` — `HubLayout` props  
