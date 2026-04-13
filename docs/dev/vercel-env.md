# Vercel environment variables

This document lists **what to configure** in Vercel and how to keep **Production**, **Preview**, and **Development** separated. Authoritative templates live in the repo:

- `apps/web/.env.example` — full local / reference list with comments  
- `apps/web/.env.production.example` — production-oriented subset  
- Root `.env.example` — monorepo notes where applicable  

## Principles

1. **Never mix production secrets into Preview** (use test/staging keys for Preview where possible: Stripe test keys, separate DB or Neon branch, staging Supabase project).
2. **Never commit real secrets**; set values only in Vercel UI or your secret manager.
3. **Client-exposed vars** are prefixed with `NEXT_PUBLIC_`. Anything without that prefix is server-only. Do not put secrets in `NEXT_PUBLIC_*`.
4. **Same variable name, different values per environment** in Vercel: set Production, Preview, and Development scopes explicitly.

## Vercel UI: where to set

**Vercel → Project (e.g. web app) → Settings → Environment Variables**

- Assign each variable to **Production**, **Preview**, and/or **Development** as appropriate.
- After changing env vars, **redeploy** for the new values to apply (or trigger a new deployment).

## Required for production (`main` / Production)

These are the minimum expectations for the **LECIPM web app** (`apps/web`) to boot and serve real traffic. Exact names may vary slightly; see `apps/web/.env.example` for the full list.

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | PostgreSQL URL for Prisma (e.g. Neon pooled URL with `sslmode=require`). Wrong or missing → layouts/APIs can 503; `/api/ready` will fail DB check. |
| `NEXT_PUBLIC_APP_URL` | Canonical public site URL (emails, redirects, metadata). |
| `STRIPE_SECRET_KEY` | Live secret (server only). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live publishable key (client). |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe/webhook`. |

## Strongly recommended (production)

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | If FSBO/media or Supabase client features are used. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for client with RLS). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — never `NEXT_PUBLIC_*`. |
| `RESEND_API_KEY` / email provider | For transactional email. |
| `OPENAI_API_KEY` | If AI routes are enabled (`/api/ready` reports `hasOpenAI`). |
| `CRON_SECRET` | Bearer for Vercel Cron and internal cron routes (`apps/web/vercel.json`). |
| `NEXT_PUBLIC_ENV` | e.g. `production` — keeps client/server env label aligned. |

## Preview-specific guidance

| Concern | Recommendation |
|---------|------------------|
| Stripe | Use **test** keys (`sk_test_…`, `pk_test_…`, test webhook secret) for Preview. |
| Database | Use a **dedicated Preview/staging** database or Neon **branch** — not the production database. |
| `NEXT_PUBLIC_APP_URL` | Set to your **preview** or **staging** canonical URL if redirects must match. |
| Auth | Same cookie/session behavior; avoid pointing Preview at production-only domains if that confuses OAuth callbacks. |

## Development (local)

Use `apps/web/.env` or `.env.local` (gitignored). Copy from `apps/web/.env.example`. Do not paste production secrets into shared machines.

## Audit checklist

- [ ] Production has `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, Stripe live trio where payments are live.
- [ ] Preview has non-production DB (or isolated branch) and Stripe **test** keys if checkout is tested.
- [ ] No `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, or DB passwords in any `NEXT_PUBLIC_*` variable.
- [ ] `pnpm build` / Vercel build succeeds with each environment’s variable set (missing `NEXT_PUBLIC_*` often fails at build time).

## Related

- [vercel-deploy-flow.md](./vercel-deploy-flow.md) — when to promote after env is correct.  
- [post-deploy-checklist.md](./post-deploy-checklist.md) — validate behavior after deploy.
