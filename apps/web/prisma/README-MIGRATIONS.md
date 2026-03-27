# Prisma migrations — recovery & Stripe Connect

## Schema fields (User / Payment)

- **User:** `stripeAccountId`, `stripeOnboardingComplete`
- **Payment:** `platformFeeCents` (optional), `hostPayoutCents` (optional)

## Client generation

```bash
cd apps/web
npx prisma generate
```

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
