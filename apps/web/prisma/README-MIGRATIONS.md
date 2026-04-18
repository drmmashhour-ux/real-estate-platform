# Prisma migrations — recovery & Stripe Connect

## Schema fields (User / Payment)

- **User:** `stripeAccountId`, `stripeOnboardingComplete`
- **Payment:** `platformFeeCents` (optional), `hostPayoutCents` (optional)

## Client generation

```bash
cd apps/web
npx prisma generate
```

## Baselining after `db push` only (P3005 / empty `_prisma_migrations`)

If the database was brought up with `prisma db push` and **`migrate deploy` fails with P3005** (non-empty DB, no history):

1. Ensure every folder under `prisma/migrations/*/migration.sql` exists — **delete empty migration directories** (they cause **P3017** on `migrate resolve`).
2. Mark the squashed baseline as applied (only when the live DB already matches it):

   ```bash
   npx prisma migrate resolve --applied 000000000000_baseline --schema=./prisma/schema.prisma
   ```

3. For each remaining migration, either run `migrate deploy` or, if SQL would recreate objects that already exist, **`migrate resolve --applied <folder_name>`** until `migrate deploy` reports **No pending migrations**.

4. Confirm: `npx prisma migrate status` → **Database schema is up to date!**

## Safe recovery (P3009 failed migration / P3006 shadow issues)

**Do not delete migrations or reset the database.** Use this pattern when the DB already matches intent but Prisma history is broken:

1. **Mark the stuck migration as applied** (only if the DB already has the objects that migration would create; verify first):

   ```bash
   npx prisma migrate resolve --applied 20260224025442_init
   ```

2. **Reconcile schema with the live database** (additive; does not drop data by default):

   ```bash
   npx prisma db push
   ```

3. **Regenerate client** (often runs automatically after `db push`):

   ```bash
   npx prisma generate
   ```

4. If **`migrate deploy`** then fails with “already exists” (objects were created by `db push` or out-of-band), mark each pending migration as applied without executing SQL:

   ```bash
   npx prisma migrate resolve --applied <migration_folder_name>
   ```

   Repeat until `npx prisma migrate deploy` prints **No pending migrations**.

5. Confirm:

   ```bash
   npx prisma migrate status
   ```

After this, **`migrate dev`** can be used again for *new* changes; prefer **`migrate deploy`** in CI/production.

## Migration files reference

- `20260319220000_stripe_connect_user_payment` — Stripe Connect columns
- `20260323194500_add_stripe_connect_fields` — idempotent adds + nullable `hostPayoutCents`

## Extra migration on DB but not in repo

If `_prisma_migrations` lists a name that does not exist under `prisma/migrations/`, either restore that folder from version control or document it; Prisma may still report “schema up to date” once local folders are all marked applied and `db push` matches `schema.prisma`.

## Production deployments (long-term stability)

- **Use only** `prisma migrate deploy` in CI and production. **Do not** run `prisma db push` against production databases — it bypasses migration history and drifts teams.
- **`prisma migrate dev`** needs a working shadow database and a consistent migration chain; if shadow apply fails (e.g. P3006), fix migration SQL/order in a branch before relying on `migrate dev` for new changes.
- After a one-time `db push` on a database with no history, baseline with `migrate resolve` / deploy as in [Baselining after `db push` only](#baselining-after-db-push-only-p3005--empty-_prisma_migrations), then treat that database as **migrate-deploy-only** going forward.
