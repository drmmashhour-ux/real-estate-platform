# Git → Vercel deploy + `app.lecipm.com` (LECIPM Next.js)

Use **Git-connected deploy** to avoid Vercel CLI **upload rate limits** on free tier.

## 1. Vercel project settings

In [Vercel Dashboard](https://vercel.com) → your **Next.js** project → **Settings**:

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Install Command** | `cd ../.. && pnpm install --no-frozen-lockfile` (matches repo `vercel.json`; use `--frozen-lockfile` in CI only) |
| **Build Command** | `cd ../.. && pnpm build:web` |

These match `apps/web/vercel.json` (Vercel merges them when the file is inside the root directory).

## 2. Connect Git & deploy

1. **Settings → Git** — connect this repository; production branch = `main` (or your default).
2. Push commits to the connected branch — Vercel builds automatically.
3. Do **not** rely on `vercel deploy` CLI until rate limit resets or you use **Pro**.

## 3. Domains

**Settings → Domains**

| Host | Intent |
|------|--------|
| **`app.lecipm.com`** | **This Vercel project** — Next.js App Router + `/api/*` |
| **`lecipm.com`** | Marketing / Wix / other — **different** project is OK |

If `app.lecipm.com` shows **503** or wrong app:

- Remove the domain from any **other** Vercel project.
- Add `app.lecipm.com` **only** to the LECIPM Next project.
- Complete DNS (CNAME to `cname.vercel-dns.com` or Vercel’s instructed target).

## 4. Environment variables (Production)

Set in **Vercel → Settings → Environment Variables** for **Production**.  
**Redeploy** after changes.

### Critical: `DATABASE_URL` (sitewide 503 if wrong)

The **root layout** queries Prisma on **every** request (launch flags + locale/market). If **`DATABASE_URL`** is missing or unreachable, **`/`**, **`/listings`**, and **`/api/ready`** can all return **503**. Fix **`DATABASE_URL` first** — see **`docs/deployment/APP_LECIPM_503.md`**.

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | **Required** — pooled Postgres (e.g. Supabase pooler); SSL as required |
| `NEXT_PUBLIC_APP_URL` | **`https://app.lecipm.com`** (no trailing slash; not `localhost`) |
| `STRIPE_SECRET_KEY` | Server-only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from Stripe for **this** webhook URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL (**code uses this name**, not `SUPABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (**not** bare `SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only |
| `CRON_SECRET` | For secured cron / internal routes |

Optional / feature-specific: see `apps/web/.env.production.example` and `docs/deployment/VERCEL_PRODUCTION_CHECKLIST.md`.

## 5. Stripe webhook

**Stripe Dashboard → Developers → Webhooks → Add endpoint**

- **URL:** `https://app.lecipm.com/api/stripe/webhook`  
  (If you use a different BNHub billing path, match the route your app implements.)
- **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel.

## 6. Smoke test (after deploy)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://app.lecipm.com/
curl -sS -o /dev/null -w "%{http_code}\n" https://app.lecipm.com/listings
curl -sS -o /dev/null -w "%{http_code}\n" https://app.lecipm.com/api/ready
```

Expect **200** on all three for a healthy production app.

## 7. Cron jobs (Hobby)

`apps/web/vercel.json` uses **daily-only** cron schedules so **Hobby** deploys are accepted. Upgrade to **Pro** if you need hourly jobs again — see `VERCEL_PRODUCTION_CHECKLIST.md`.
