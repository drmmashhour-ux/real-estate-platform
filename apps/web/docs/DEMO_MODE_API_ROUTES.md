# Demo mode API routes

Demo and staging flows use dedicated API routes under `app/api/demo/*`, `app/api/admin/demo/*`, and cron helpers such as `app/api/cron/reset-demo/*`.

## Principles

- **Writes** in demo mode should pass through `lib/demo-write-guard` (or equivalent) so production tenants are never mutated.
- **Reads** may use seeded demo tenant data; document tenant ids in seed scripts under `prisma/seeds/demo/`.

## Related code

- `lib/demo-mode.ts`, `lib/demo-reset.ts`
- Admin demo UI: `app/admin/demo/`
