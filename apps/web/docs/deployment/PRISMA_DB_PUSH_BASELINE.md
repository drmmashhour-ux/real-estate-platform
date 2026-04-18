# Prisma baseline after `db push` (P3005 / empty `_prisma_migrations`)

If Postgres was provisioned with **`prisma db push`** and has **no** `_prisma_migrations` table (or empty history), `pnpm prisma migrate deploy` can fail with **P3005** (“database schema is not empty”).

This repo already ships a full history starting at **`000000000000_baseline`**. **Do not** add a second full dump as `000_baseline` — duplicate baselines reorder badly and can re-apply DDL.

## Recommended fix (schema already matches repo migrations)

1. Set **`DATABASE_URL`** to the target database (Supabase pooler or direct, as you use for Prisma).

2. Mark every migration as applied **without** running SQL:

   ```bash
   cd apps/web
   pnpm prisma:baseline:resolve-all
   ```

   This runs `prisma migrate resolve --applied <folder>` for each folder under `prisma/migrations/` in order. Re-runs are safe if a migration is already recorded (P3008).

3. Verify:

   ```bash
   pnpm exec prisma migrate deploy
   pnpm exec prisma migrate status
   ```

   Expect: **Database schema is up to date!** and `_prisma_migrations` populated.

## Alternative: single SQL file from diff (advanced)

To **inspect** what a from-scratch schema would look like (read-only):

```bash
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel=prisma/schema.prisma \
  --script > /tmp/full_schema_from_prisma.sql
```

Use this for **review**, not as a second migration in-repo, unless you are replacing the entire migration chain in a controlled migration project.

## Supabase + integrity validation

Guest booking integrity checks need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Copy from `supabase-env.local.example` into `.env.local`. Without them, `validate:platform` reports `data_integrity:supabase_not_configured_skipped` (warning, not a blocker).
