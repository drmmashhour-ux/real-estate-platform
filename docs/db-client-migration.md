# DB Client Migration Rules

Orders 85–88 — how `apps/web` should access databases while Prisma is split across packages.

**ESLint (Order 89):** Importing `@repo/db` directly is **disallowed (error)** under `lib/services/**` and `lib/marketplace/**`, and **warns** elsewhere in `apps/web` (barrel files `lib/db.ts`, `lib/db/index.ts`, `lib/db-safe.ts` are exempt). Prefer `import { monolithPrisma, marketplacePrisma, … } from "@/lib/db"`.

- **Marketplace** listings and marketplace `bookings` (split client `@repo/db-marketplace`) use **`marketplacePrisma`** from `@/lib/db`.
- **Users**, **auth-related models**, and **Stripe Connect** host/user rows currently use the **monolith** client: **`monolithPrisma`** from `@/lib/db` (same Prisma `User` and hosting models as the large schema).
- **Do not** import `@repo/db` **directly in new API routes** — import `{ marketplacePrisma, monolithPrisma, ... }` from `@/lib/db` (or a dedicated service) so the boundary stays explicit.
- **Do not** add Prisma **relations** across split clients; they are not joinable. Compose reads in the **service layer** with two (or more) round-trips, or use raw SQL on `pool` for analytics.
- **Analytics** and heavy reporting may use the shared **`pool`** from `@/lib/db` (see `lib/db/hybrid-strategy.ts`, `lib/db-safe.ts`).

**Manual join (listing + host user):** Prisma cannot join `marketplace` `Listing` to monolith `User` in one query. Fetch separately:

```ts
import { marketplacePrisma, monolithPrisma } from "@/lib/db";

const listing = await marketplacePrisma.listing.findUnique({
  where: { id: listingId },
});

if (!listing) {
  // handle not found
  return;
}

const host = await monolithPrisma.user.findUnique({
  where: { id: listing.userId },
});
```

Use `getListingWithHost` in `apps/web/lib/services/listingService.ts` (Order 90), or the tuple adapter `getMarketplaceListingWithMonolithHostById` in `marketplace-listing-with-host.read.ts`.

**Target state:** new code only depends on `@/lib/db` facades, not on `@repo/db` at call sites, while existing routes are migrated opportunistically without destabilising production.

---

## Migration list (Order 85 — audit snapshot)

| Area | Client | Notes |
|------|--------|--------|
| `apps/web/app/api/listings` (slim marketplace listing CRUD) | `marketplacePrisma` | Split schema `Listing` on table `listings` |
| `apps/web/app/api/bookings` (split marketplace holds, not BNHub stays) | `marketplacePrisma` | Table `bookings` |
| `apps/web/app/api/availability` | `marketplacePrisma` | Same bookings inventory |
| `lib/marketplace/*` (holds, ledger) | `marketplacePrisma` | |
| `POST /api/checkout` (marketplace line item) | `marketplacePrisma` + `monolithPrisma` | Listing from marketplace; `User` (Stripe) from monolith — **no cross-Prisma join** |
| `apps/web/app/api/stripe/connect` | `monolithPrisma` | Connect lives on `User` in monolith |
| `POST /api/bookings/create` (BNHub) | Stays on **`import { prisma } from "@repo/db"`** until a dedicated port | Uses `shortTermListing` / BNHub `Booking` on the monolith — **not** `marketplacePrisma` |
| `apps/web/app/api/compliance/**` | **monolith** for now | Broad CRM/compliance models |
| `apps/web/lib/db.ts` barrel | N/A | Re-exports `monolithPrisma` as the monolith; `db` / `prisma` keep legacy behaviour |

**“Leave monolith first”:** routes that only touch `marketplace` `listing` / `booking` (and `marketplacePaymentLedger` on the split client) are the first safe tranche. Anything touching BNHub `ShortTermListing`, FSBO, CRM `Listing`, or `User` still needs the monolith (or a composed read).
