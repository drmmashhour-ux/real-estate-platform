# Global listing ID (BNHub) — integration

## Canonical public ID

- **Format:** `LEC-#####` (allocated once at publish / create; **immutable**).
- **Uniqueness:** Enforced by Prisma `@unique` on `ShortTermListing.listingCode`.
- **Resolvable URLs:** `/bnhub/{listingCode}` or `/bnhub/{uuid}` — both resolve via `getListingById` / `resolveShortTermListingRef`.

## Where it appears

| Surface | Behavior |
|--------|-----------|
| **Listing page** | Header shows “Listing ID” + `CopyListingCodeButton` (existing). |
| **Checkout / booking** | Subtle mono line: `Listing ID LEC-…`. |
| **Search** | City box + API accept `listingCode` / LEC in text (`/search/bnhub`, `/api/bnhub/search`). |
| **CRM — Leads API** | `Lead.listingCode` denormalized when `listingId` points at a BNHub row. |
| **CRM — UI** | Broker pipeline cards, admin leads dashboard, AI leads table + priority queue link to `/bnhub/{code}`. |
| **Emails** | Lead notification template includes **Listing ID** + optional **Open listing** when `NEXT_PUBLIC_APP_URL` is set. |
| **Messages** | Contact-host flow resolves `?listing=` as UUID or LEC; shows ID; prefills `[Listing LEC-…]` in the message body. |
| **Sticky contact bar** | Message links use **LEC** in the query when available. |
| **Host / shared listings** | Already surfaced (`listingCode` on host dashboard / broker shared section). |
| **Booking messages (DB)** | `BookingMessage.listingCode` set on send (existing). |
| **Marketing listing dashboard** | Subtle truncated **internal ref** (dashboard `id` — may differ from BNHub LEC). |

## Implementation helpers

- `lib/leads/bnhub-listing-context.ts` — `snapshotBnhubListingForLead(ref)` → canonical `{ listingId, listingCode }`.
- `lib/email/notifications.ts` — `bnhubListingPublicUrl(slug)` for deep links in email.

## Testing checklist

1. **Listing page:** LEC visible; copy works.
2. **Search:** Query `LEC-` + digits returns the listing; no duplicate codes in DB (`@@unique`).
3. **Lead from project form with BNHub listing:** DB row has `listingCode` populated; broker email shows listing block.
4. **AI chat lead with `context.listingId`:** Same as above.
5. **Messages:** Open `/messages?host=…&listing=LEC-123` (or UUID) — banner + prefixed message line.
6. **CRM:** Lead card / AI leads table shows link for hot leads with listing context.

## Notes

- **Homepage:** No change — avoids clutter per product rule.
- **Legacy leads** with `listingId` but null `listingCode`: UI falls back to internal id; optional backfill job can populate `listingCode` via `snapshotBnhubListingForLead`.
