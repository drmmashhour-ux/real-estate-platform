# LECIPM RLS Security Enforcement v1

SQL in this folder enables **Row Level Security** on critical Prisma tables and defines **Supabase Auth** policies using `auth.uid()`.

## Prerequisites

1. **Schema deployed** — run Prisma migrations (`pnpm prisma migrate deploy`) so tables and columns exist.
2. **Supabase Auth IDs aligned** — `public."User".id` must equal `auth.users.id` for users who sign in via Supabase. If you only use cookie sessions + Prisma (no Supabase JWT to Postgres), `auth.uid()` policies apply to **PostgREST / anon / authenticated DB roles**, not to the Prisma server connection.

## Prisma / service role (critical)

- The Next.js API uses **Prisma** with a **database URL that bypasses RLS** (typically pooled service role or superuser-equivalent on Supabase).
- **RLS does not replace application checks.** Keep `modules/security/access-guard.service.ts` and route-level authorization.
- RLS **does** reduce blast radius for: direct SQL mistakes, PostgREST, Realtime subscriptions, and compromised anon keys.

## Execution

**Option A — Supabase Dashboard**

1. SQL → New query.
2. Paste and run `enable-rls.sql`, then `rls-policies.sql`.

**Option B — CLI**

```bash
cd apps/web
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/supabase/enable-rls.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/supabase/rls-policies.sql
```

Use the **same** database URL as production/staging after backup.

## Rollback (staging / emergency only)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/supabase/rls-rollback.sql
```

Then re-apply `enable-rls.sql` + `rls-policies.sql` when ready.

## Verification

```bash
pnpm run verify:rls
```

Expect `relrowsecurity = true` on `"Booking"`, `"bnhub_listings"`, `"User"`, `"deals"`, `"payments"` and non-zero policy counts per table (see `modules/security/rls-table-matrix.service.ts` and `rls-policy-check.service.ts`).

## Adjustments

- If `ListingStatus` values differ in your branch, update `lecipm_bnhub_listings_select` `USING` clause.
- Add separate **service** or **maintenance** roles only via controlled credentials; do not weaken policies for convenience.
