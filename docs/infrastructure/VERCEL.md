# Vercel configuration (LECIPM web)

## Project settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` (or monorepo root with `vercel.json` in `apps/web`) |
| **Framework** | Next.js |

## `apps/web/vercel.json` (reference)

- **Install:** `cd ../.. && pnpm install --frozen-lockfile`
- **Build:** `cd ../.. && pnpm build:web`
- **Node:** `NODE_OPTIONS=--max-old-space-size=8192` for large builds

## Environment variables

Set in Vercel → Project → Settings → Environment Variables (Production / Preview / Development):

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Production & Preview only; never expose to client)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (canonical site URL)
- Optional: `SENTRY_DSN`, `STRICT_LECIPM_INFRASTRUCTURE=1` for strict Zod boot check

## Domains

Point production DNS to Vercel; align `NEXT_PUBLIC_APP_URL` and Stripe webhook URL with the live HTTPS origin.
