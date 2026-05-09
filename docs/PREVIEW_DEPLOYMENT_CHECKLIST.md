# LECIPM Preview Deployment Checklist

## Required Vercel Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Neon/Supabase PostgreSQL connection string | **Yes** |
| `NODE_OPTIONS` | `--max-old-space-size=16384` | Set in `vercel.json` |
| `NEXT_PUBLIC_APP_URL` | Preview URL (auto-set by Vercel) | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Optional (auth degrades) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Optional (auth degrades) |
| `STRIPE_SECRET_KEY` | `sk_test_...` only | Optional (payments disabled) |

## Vercel Project Settings

- Framework: Next.js
- Root directory: `apps/web`
- Build command: `cd ../.. && pnpm build:web` (from `vercel.json`)
- Install command: `cd ../.. && pnpm install --frozen-lockfile` (from `vercel.json`)
- Node.js version: 20.x

## Memory Requirements

- Build heap: 16GB (`NODE_OPTIONS=--max-old-space-size=16384`)
- Vercel Pro plan recommended
- Compilation: ~4 minutes on webpack

## Expected Disabled Systems (Preview)

| System | Status | Reason |
|--------|--------|--------|
| Invest hub | OFF | Beta (`FEATURE_INVEST=0`) |
| Forms hub | OFF | Beta (`FEATURE_FORMS=0`) |
| Dr Brain | OFF | Internal (`FEATURE_DR_BRAIN=0`) |
| Design System | OFF | Internal (`FEATURE_DESIGN_SYSTEM=0`) |
| Stripe payments | OFF | No `STRIPE_SECRET_KEY` set |
| Supabase auth | Degraded | No Supabase keys → local auth only |

## Expected Degraded Systems

| System | Behavior Without Env |
|--------|---------------------|
| Auth (Supabase) | Login pages render but auth fails gracefully |
| Payments (Stripe) | Checkout routes return helpful error |
| File uploads | Upload endpoints disabled |
| Email (Resend) | Emails logged, not sent |

## Known Preview Limitations

- No real user authentication without Supabase keys
- No payment processing without Stripe test keys
- No file uploads without Supabase storage
- Compliance checks are all placeholders (no real OACIQ rules)
- Arabic locale not available (not configured on main)

## Rollback Steps

1. Vercel dashboard → Deployments → click previous deployment → Promote
2. Or: revert merge commit on main → push → auto-redeploy

## Emergency Disable Flags

| Flag | Effect |
|------|--------|
| `FEATURE_COMPLIANCE_HARD_LOCK=1` | Block ALL regulated actions |
| `FEATURE_BNHUB=0` | Disable BNHub entirely |
| `FEATURE_HOMES=0` | Disable Homes marketplace |

## Safe Rollback Branch

`main` (before merge) — always deployable as-is with `DATABASE_URL` set.

## Log Monitoring Checklist

After preview deploy, check:
- [ ] Vercel build log: no errors during compilation
- [ ] Vercel build log: `prisma generate` succeeds
- [ ] Runtime: `/api/ready` returns 200
- [ ] Runtime: `/` loads without 500
- [ ] Runtime: `/bnhub` loads without 500
- [ ] Runtime: no `placeholder` in any runtime log
- [ ] Runtime: Stripe warning appears (expected without keys)
