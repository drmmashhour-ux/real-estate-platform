# Deployment Readiness

## Current Status

**Preview: SAFE** — build pipeline stabilized, Prisma validates and generates, postinstall works on Vercel.

**Production: NOT YET** — requires environment variable verification, database migration state review, and compliance audit sign-off.

---

## Remaining Blockers

| Blocker | Severity | Notes |
|---|---|---|
| Vercel env vars not set | Critical | `DATABASE_URL`, `APP_NAME` must exist |
| 16 GB heap for build | Critical | `NODE_OPTIONS=--max-old-space-size=16384` |
| Stripe test keys | Medium | Use `sk_test_` only for preview; never `sk_live_` without explicit approval |
| Database migration state | Medium | Run `prisma db push` or `prisma migrate deploy` before first request |
| Compliance audit | High | Every `TODO_COMPLIANCE_VERIFY` must be reviewed before production |
| Syria separate project | Low | apps/syria needs its own Vercel project with isolated env |

---

## Preview Deployment Checklist

1. [ ] Set `DATABASE_URL` to a staging/preview PostgreSQL connection string
2. [ ] Set `NODE_OPTIONS=--max-old-space-size=16384` in Vercel project settings
3. [ ] Set `APP_NAME=lecipm`
4. [ ] Set `NEXT_PUBLIC_APP_URL` to the preview domain
5. [ ] Run `prisma db push` against preview database (or `prisma migrate deploy`)
6. [ ] Deploy and verify `/api/ready` returns 200

## Production Deployment Checklist

1. [ ] Merge recovery/stabilization branch into main
2. [ ] Set all required Vercel env vars (see table below)
3. [ ] Set `STRIPE_SECRET_KEY` to a **test** key (`sk_test_`) — never `sk_live_` without explicit sign-off
4. [ ] Run `prisma migrate deploy` against production database
5. [ ] Verify migration state matches schema (no pending migrations)
6. [ ] Review every `TODO_COMPLIANCE_VERIFY` with a licensed compliance advisor
7. [ ] Set `FEATURE_COMPLIANCE_HARD_LOCK=1` until compliance review is complete
8. [ ] Deploy to Vercel
9. [ ] Smoke-test critical routes: `/`, `/bnhub`, `/search`, `/api/ready`
10. [ ] Monitor error logs for 30 minutes post-deploy

---

## Required Vercel Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (Neon/Supabase/etc.) |
| `APP_NAME` | **Yes** | `lecipm` | Platform identifier used across the app |
| `NODE_OPTIONS` | **Yes** | — | Set to `--max-old-space-size=16384` for build |
| `NEXT_PUBLIC_APP_URL` | **Yes** | — | Public-facing URL of the deployed app |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | — | Supabase project URL (auth features) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | — | Supabase anonymous key |
| `STRIPE_SECRET_KEY` | Optional | — | Stripe secret key — **test mode only for preview** |
| `STRIPE_WEBHOOK_SECRET` | Optional | — | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | — | Stripe publishable key (client-side) |
| `DIRECT_URL` | Optional | — | Direct database URL (bypasses connection pooler) |

---

## Required Database Checks

1. Run `prisma db push` (preview) or `prisma migrate deploy` (production) before first request.
2. Verify migration state: no pending migrations in `_prisma_migrations` table.
3. The `postinstall` script uses a placeholder `DATABASE_URL` for Prisma code generation only — this placeholder is **never** used at runtime (a runtime guard in `lib/db/prisma.ts` throws if it detects the placeholder).

## Stripe / Payment Safety

- Preview deployments: use `sk_test_` keys only.
- **NEVER** set `sk_live_` without explicit written approval from the project owner.
- `FEATURE_COMPLIANCE_HARD_LOCK=1` blocks all payment/legal actions until compliance review is done.
- Stripe Connect onboarding must use test mode for preview environments.

---

## Rollback Plan

Vercel supports instant rollback to any previous deployment:

1. Go to the Vercel dashboard → Deployments
2. Select the last known-good deployment
3. Click "Promote to Production"

No database rollback is automatic — if a migration was applied, it must be reverted manually.

---

## LECIPM Deployment Checklist (apps/web)

1. [ ] Merge recovery/stabilization branch
2. [ ] Set all env vars in Vercel project settings
3. [ ] Deploy via Vercel (push to main or manual deploy)
4. [ ] Verify routes: `/`, `/bnhub`, `/search`, `/admin`, `/api/ready`
5. [ ] Verify Prisma client generated correctly (check build logs for `prisma generate`)

## Syria Deployment Checklist (apps/syria)

- apps/syria requires a **separate Vercel project**
- Separate environment variables (its own `DATABASE_URL` pointing to syria-specific tables)
- Syria env vars are **NOT** required by `apps/web` builds
- Syria's `prisma generate` is skipped in CI/Vercel (not needed for apps/web deploy)
- Deploy independently from apps/web
