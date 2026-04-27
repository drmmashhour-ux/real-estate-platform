# Monolith Dependency Map

Single source of truth for what still uses `@repo/db` (monolith Prisma) vs split clients (`listingsDB` / `getListingsDB`, `@repo/db-auth` as `authPrisma`, `@repo/db-core` as `coreDB`).

## Fully migrated (marketplace data path)

- **bookings** (marketplace) → `getListingsDB()` → `@repo/db-marketplace`
- **listings** (marketplace) → `getListingsDB()` → `@repo/db-marketplace`
- **search** → `getListingsDB()` → `@repo/db-marketplace`

## Partially migrated (user reads)

- **checkout** → `getListingsDB()` + **host Stripe** via `authPrisma.user` (reads; Connect columns on shared `users` table)
- **GET /api/listings/:id** → listing from `getListingsDB()`; **host** from `authPrisma.user`
- **Stripe Connect** → **reads** for `User` (email, `stripeAccountId`, role, onboarding flags) via `authPrisma`; **writes** (`user.update` for account id / onboarding) still on **monolith** until a dedicated user-write bridge ships
- **GET /api/stripe/connect/status** → user rows via `authPrisma`; `hostStripeAccountSnapshot` and other monolith models remain on **monolith**
- **Stripe connect onboard / create-account-link** → `authPrisma` for user scalars; **BNHub** `ShortTermListing` **count** still queried via `monolithPrisma.shortTermListing.count` (separate model, not on auth)

## User reads: `authPrisma` (target)

Critical paths now prefer **`authPrisma.user.findUnique` / `findFirst`** (shared `users` table) instead of monolith `prisma.user` for **read** paths listed above. **User creates/updates** (e.g. register, profile, Stripe ID persistence) remain on the monolith client until a controlled migration.

## Still using monolith (`@repo/db`)

- Broad **`prisma`** import sites (subscriptions, platform payments, admin, CRM, FSBO, BNHub `Booking` / `ShortTermListing` graphs, `hostStripeAccountSnapshot`, etc.)
- **Stripe** logic beyond the reads above (many routes still `monolithPrisma` for `platformPayment`, `Payment`, webhooks sections)
- **Compliance** / **legal** modules using `complianceDB` (often re-exports monolith in this repo)
- **Admin** and internal tools
- **Short-term / BNHub** tables that are not in `db-auth` (counts and relations still hit monolith where needed)

## Migration priority (suggested)

1. **User reads** → `authPrisma` on hot paths (checkout, listings, Connect) — in progress; writes deferred.
2. **Stripe** isolation — keep payment/webhook entitlements explicit; move more reads to small clients where schema allows.
3. **Compliance** split — optional dedicated client / read models when ready.

## Operational notes

- Regenerate clients after `packages/db-auth` schema changes: `pnpm --filter @repo/db-auth exec prisma generate` (from repo with deps installed).
- **Rollback** listing routes to monolith DB client: `USE_LISTINGS_MONOLITH=1` (see `lib/db/routeSwitch.ts`).
