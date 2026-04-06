# `app.lecipm.com` returns 503 — root cause & fix

## What we observed

HTTP checks against **`https://app.lecipm.com`** returned **503** for:

- `/`
- `/listings`
- `/api/ready`

## Root cause (code path)

This is **not** a Next.js “empty project” 503. The app’s **`app/layout.tsx`** is an **async** root layout that **always** calls:

1. **`resolveLaunchFlags()`** → `prisma.featureFlag.findMany(...)`
2. **`resolveInitialLocale()`** → may call `prisma.user...` and **`getResolvedMarket()`** → `prisma.platformMarketLaunchSettings.upsert(...)`

If **Prisma cannot connect** (missing/wrong **`DATABASE_URL`**, wrong network, SSL, or pooler URL), these calls **throw**. The request then fails and the edge/runtime often surfaces that as **503** (or 500) for **every HTML route**.

Separately, **`GET /api/ready`** returns **503** **by design** when its `try` block fails (see `app/api/ready/route.ts`) — usually the same DB failure.

## Fix (Vercel — no code change)

1. Open **Vercel → Project (Next app) → Settings → Environment Variables → Production**.
2. Set **`DATABASE_URL`** to a valid **PostgreSQL** URL your deployment can reach:
   - Prefer **Supabase pooler** / **transaction** mode URL for serverless (see Supabase docs).
   - Ensure **`?sslmode=require`** (or equivalent) if the provider requires SSL.
3. Set **`NEXT_PUBLIC_APP_URL`** = **`https://app.lecipm.com`** (no `localhost`).
4. Set Supabase public vars as used by code: **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, and server **`SUPABASE_SERVICE_ROLE_KEY`** if those features are on.
5. **Redeploy** (Deployments → ⋮ → Redeploy) so the runtime picks up env.

## Verify

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://app.lecipm.com/
curl -sS -o /dev/null -w "%{http_code}\n" https://app.lecipm.com/listings
curl -sS -o /dev/null -w "%{http_code}\n" https://app.lecipm.com/api/ready
```

Expect **200** on all three after **`DATABASE_URL`** is correct.

## If still 503 after DATABASE_URL

1. **Vercel → Deployments** — latest build must be **Ready** (not Error).
2. **Root Directory** = **`apps/web`**; install/build commands as in `apps/web/vercel.json`.
3. **Domains** — `app.lecipm.com` attached to **this** project only.
4. **Runtime logs** for the failing request — look for Prisma / connection errors.

## Stripe webhook (after site is 200)

`https://app.lecipm.com/api/stripe/webhook` — set **`STRIPE_WEBHOOK_SECRET`** from Stripe Dashboard for that endpoint.
