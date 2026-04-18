# LECIPM Infrastructure v1

Stack: **Next.js** (`apps/web`) on **Vercel**, **PostgreSQL** via **Prisma** (`apps/web/prisma/schema.prisma`), **Supabase** (Auth / Storage / optional Postgres), **Stripe** (payments).

## Layout

| Path | Purpose |
|------|---------|
| `apps/web/app/` | App Router pages & API routes |
| `apps/web/lib/` | Shared server utilities (`env`, `auth`, `supabase`, `logger`, `stripe`, …) |
| `apps/web/modules/` | Domain modules |
| `apps/web/prisma/` | Prisma schema & migrations |
| `packages/` | Shared packages |
| `services/` | Auxiliary services |

## Key modules

- **Env:** `apps/web/lib/env.ts` — Zod schemas; `assertLecipmInfrastructureEnv()` for strict production checks.
- **Supabase:** `apps/web/lib/supabase/` — browser client, server (cookie) client, **admin (service role, server-only)**.
- **Storage:** `apps/web/lib/storage/supabase-files.ts` — upload / public URL / delete (server-only).
- **Auth guards:** `apps/web/lib/auth/guards.ts` — `getSession`, `requireUser`, `requireRole` (Prisma `PlatformRole`).
- **Health:** `GET /api/health`, `GET /api/ready` — DB, Stripe, Supabase config/reachability.
- **Deployment safety:** `docs/deployment.md`, `predeploy:check`, `postdeploy:test`.

## Security model

1. **Secrets** — only on server / Vercel env; never in client bundles except `NEXT_PUBLIC_*`.
2. **Prisma** — uses `DATABASE_URL`; authorization is **application-level** (guards, queries scoped by `userId`).
3. **Supabase RLS** — applies to **PostgREST / anon** access. The **service role** used for Storage **bypasses RLS** — always enforce authz in code before calling `getSupabaseAdmin()`.
4. **Stripe** — payment state only from **webhook** + DB; never trust redirect/success URL alone.

See [SUPABASE-RLS.md](./SUPABASE-RLS.md), [VERCEL.md](./VERCEL.md), [QA-CHECKLIST.md](./QA-CHECKLIST.md).
