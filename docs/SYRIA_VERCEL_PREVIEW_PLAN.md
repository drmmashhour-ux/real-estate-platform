# SYBNB / Syria — Vercel Preview Deployment Plan

## Vercel Project Configuration

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `apps/syria` |
| Build Command | `cd ../.. && pnpm --filter @lecipm/syria build` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Output Directory | `.next` |
| Node.js Version | 20.x |

## Required Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Syria PostgreSQL URL | **YES** |
| `DIRECT_URL` | Same or non-pooled URL | **YES** |
| `APP_ID` | `syria` | **YES** |
| `NODE_ENV` | `production` (auto-set by Vercel) | Auto |

**CRITICAL:** `DATABASE_URL` must NOT contain "lecipm" anywhere (hostname, username, or database name). The env guard at `packages/db/src/env-guard.ts` will reject it and crash the app.

**Example safe URL:** `postgresql://syria_user:pass@ep-xxx.neon.tech/syria_db`

## Optional Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `STRIPE_SECRET_KEY` | Unset | Payments disabled without it |
| `PRODUCTION_LOCK_MODE` | `true` recommended | Extra payment safety |
| `INVESTOR_DEMO_MODE` | `false` | Enable for demo reviews |
| `NEXT_PUBLIC_SUPABASE_URL` | Unset | Auth/uploads degraded without |

## Disabled Systems (Preview)

| System | Status | Reason |
|--------|--------|--------|
| Stripe payments | STUB | No keys → returns fake intent IDs |
| Real checkout | BLOCKED | No Stripe + production lock |
| Payouts | DISABLED | No payout logic active |
| File uploads | DEGRADED | No Supabase storage |
| Email | DISABLED | No Resend key |

## Memory Expectations

- Syria: 74 pages + 74 API routes + 37 Prisma models
- Expected build: **under 4GB**, well within Vercel free/Pro limits
- No static generation explosion (next-intl with 2 locales only)

## Rollback Instructions

1. **Instant:** Vercel dashboard → Deployments → select previous → Promote
2. **Code:** Revert the merge commit → push → auto-redeploy
3. **Emergency:** Set `PRODUCTION_LOCK_MODE=true` in Vercel env vars

## Preview Monitoring Checklist

After deploy:
- [ ] Build log: no `DATABASE_URL missing` errors
- [ ] Build log: `prisma generate` succeeds
- [ ] Build log: `next build` completes
- [ ] Runtime: `/ar` loads (Arabic homepage)
- [ ] Runtime: `/en` loads (English homepage)
- [ ] Runtime: `/ar/sybnb` loads
- [ ] Runtime: `/api/health` returns 200
- [ ] Runtime: no "placeholder" in function logs
- [ ] Runtime: no 500 errors on core routes
- [ ] Runtime: Arabic RTL renders correctly
