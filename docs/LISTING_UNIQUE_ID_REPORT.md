# Listing unique ID system (LEC-#####)

## Status: implemented

### Format

- **Pattern:** `LEC-{number}` (e.g. `LEC-10001`, `LEC-10002`).
- **Allocation:** PostgreSQL sequence `lec_listing_code_seq` (starts at **10001** after migration).
- **Scope:** One global sequence for **BNHub** (`ShortTermListing` / `bnhub_listings`) and **broker CRM** (`Listing`).

### Rules

| Rule | Implementation |
|------|------------------|
| Unique | `UNIQUE` on `bnhub_listings.listing_code` and `Listing.listing_code` |
| Immutable | Assigned once at create; application does not update codes |
| Searchable | Search by code in location field or `?listingCode=` / `?listingCode=` on search API; exact match on `listing_code` |

### Database

- `bnhub_listings.listing_code` — NOT NULL, unique  
- `Listing.listing_code` — NOT NULL, unique  
- `Lead.listing_code`, `deals.listing_code`, `BookingMessage.listing_code` — optional denormalized copies  
- Migration: `20260322120000_listing_lec_codes`

### API / logic

- `lib/listing-code.ts` — `allocateNextListingCode`, `normalizeListingCode`, `resolveShortTermListingRef`
- `createListing` (BNHub) and `POST /api/broker/listings` allocate codes inside a transaction
- `GET /api/bnhub/listings`, `GET /api/bnhub/search` accept query `listingCode` or parse `LEC-*` from `city` / `location`
- Leads / deals resolve `listingId` body values that are `LEC-*` to internal UUID and store `listing_code`
- Booking messages set `listing_code` from the listing when a message is sent

### UI

- Listing detail (`/bnhub/[id]`) — shows **Listing ID** + **Copy Listing ID**
- Stays search cards — show `listingCode`; location placeholder mentions `LEC-10001`
- Host dashboard — listing row + copy
- Broker dashboard — shared listings section + copy
- CRM leads page — shows `listingCode` when present

### Tests

- `lib/listing-code.test.ts` — normalization and search parsing

```bash
cd apps/web && npm test -- lib/listing-code.test.ts
```

### Deploy

```bash
cd apps/web && npx prisma migrate deploy && npx prisma generate
```

### Known issues / notes

1. **URLs** still use internal UUID (`/bnhub/{uuid}`); public code also works: `/bnhub/LEC-10001` resolves via `getListingById`.
2. **CRM `Listing`** (broker tool) is separate from BNHub stays; both consume the same sequence so codes never collide.
3. **Legacy rows** without a code are backfilled by the migration; new rows always receive a code on create.

### Improvements

- Optional short URL `/l/LEC-10001` redirect
- Admin tool to re-sync sequence if data repaired manually (avoid manual edits to `listing_code`)
