# Supabase Row Level Security — LECIPM RLS Security Enforcement v1

## Prisma and service role caveat

- **Prisma** (`DATABASE_URL`) typically uses a PostgreSQL role that **does not apply RLS** (e.g. table owner, `BYPASSRLS`, or Supabase **service role**). Queries from Next.js API routes therefore **must** enforce authorization in **application code** (`modules/security/access-guard.service.ts`, route-level checks).
- **RLS is a second layer** for paths that use **Supabase PostgREST**, **Realtime**, **SQL Editor**, or any client using **anon** / **authenticated** keys against Postgres directly.
- **Never** assume “we use Prisma everywhere” means the database is safe from direct access; compromised keys or future features can expose tables.

## Canonical table mapping (Prisma physical names)

| Domain (logical) | PostgreSQL table | Ownership / join columns (policies) |
|--------------------|------------------|-------------------------------------|
| bookings | `"Booking"` | `"guestId"`, listing via `"listingId"` → `bnhub_listings.host_id` |
| BNHub listings | `bnhub_listings` | `host_id`, public read when `"listingStatus"` ∈ `PUBLISHED` / `APPROVED` |
| users | `"User"` | `id` = `auth.uid()`::text |
| deals | `deals` | `buyer_id`, `seller_id`, `broker_id` |
| payments | `payments` | via `"bookingId"` → `"Booking"` guest or listing host |

Source of truth: `apps/web/modules/security/rls-target-discovery.service.ts` (aligned with `prisma/schema.prisma`).

## Shipped SQL (apply in Supabase or `psql`)

1. `apps/web/sql/supabase/enable-rls.sql` — `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on the five tables above.
2. `apps/web/sql/supabase/rls-policies.sql` — idempotent `lecipm_*` policies (`DROP POLICY IF EXISTS` then `CREATE POLICY`).
3. `apps/web/sql/supabase/rls-rollback.sql` — **staging / emergency only**: drop `lecipm_*` policies and disable RLS.

See `apps/web/sql/supabase/README.md` for execution order and verification (`pnpm run verify:rls`).

## Policies (summary)

- **Booking**: guest sees own rows; host sees rows for bookings on their listings (join to `bnhub_listings`).
- **bnhub_listings**: `anon`/`authenticated` **SELECT** for published/approved or own host rows; host **INSERT/UPDATE/DELETE** only own rows.
- **User**: **SELECT/UPDATE** own row only (no cross-profile reads).
- **deals**: buyer, seller, or assigned broker; **DELETE** limited to `broker_id` (conservative).
- **payments**: **SELECT/UPDATE** only when linked **Booking** is visible to the same user (guest or host).

No `auth.role()`-based “admin” policies are defined here; platform admin remains **app-layer** (Prisma + session checks).

## Verification and launch gate

- CLI: `cd apps/web && pnpm run verify:rls` — checks `pg_class.relrowsecurity`, policy counts per critical table, and legacy probe.
- Launch report: `report.rlsTableMatrix` in `runFinalLaunchValidation` lists per-table **PASS** / **FAIL** with blocking `detail`.

## Manual cross-user expectations (not fully automated in CI)

The repo documents **expectations** in `rls-policy-check.service.ts` (`NOT_VERIFIED_DB_ROLE`). True isolation proofs need **distinct JWT sessions** against Supabase or integration tests with a non-bypass role. Until then, validate in staging:

- User A cannot read user B’s booking via APIs scoped by guest/host.
- Host cannot mutate another host’s listing.
- Broker cannot read another broker’s deal without explicit collaboration (app-layer).

## Fail-safe

- Enabling RLS **without** policies denies all for affected roles — always deploy **enable-rls** and **rls-policies** together.
- Never add `USING (true)` on sensitive tables for convenience.

See also [infrastructure/SUPABASE-RLS.md](./infrastructure/SUPABASE-RLS.md) if present.
