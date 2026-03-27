# Deploy `apps/web` to Vercel

## Prerequisites

- Node 20+ (matches local dev)
- PostgreSQL database reachable from the internet (e.g. Neon, Supabase Postgres, RDS)
- Vercel account

## 1. Clean build (local)

```bash
cd apps/web
npx tsc --noEmit
npx prisma generate
npm run build
```

Fix any TypeScript or build errors before deploying.

## 2. Database migrations

Run against your **production** `DATABASE_URL` (from a secure shell, not in the repo):

```bash
cd apps/web
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

## 3. Environment variables

Copy `apps/web/.env.production.example` and set values. In Vercel: **Project → Settings → Environment Variables**, add at least:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Required |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL or custom domain (`https://...`) |
| `STRIPE_*` | If you use payments |
| `NEXT_PUBLIC_*` | Must be set for Production (and Preview if needed) |

`postinstall` runs `prisma generate` on Vercel; no extra build step required.

## 4. Vercel project setup

**Option A — CLI (from monorepo root)**

```bash
npm install -g vercel
cd /path/to/real-estate-platform
vercel
```

When prompted:

- **Root Directory**: `apps/web` (important)
- Link to existing project or create new

Then:

```bash
vercel --prod
```

**Option B — Vercel Dashboard**

1. Import Git repository
2. **Root Directory**: `apps/web`
3. Framework Preset: Next.js
4. Build Command: `npm run build` (default)
5. Output: default (Next.js)

## 5. Wix + custom domain

See **[WIX_INTEGRATION.md](./WIX_INTEGRATION.md)** for linking the Wix marketing site to the app (`app.lecipm.com` or Vercel URL), buttons, and `NEXT_PUBLIC_APP_URL`.

## 6. After deploy

- Open the Production URL
- Smoke test: `/`, `/analyze`, `/demo/dashboard`, `/auth/login`
- **Dashboard / compare** require login — test with a real user or a **client UAT account** (see **[CLIENT_TEST_ACCOUNT.md](./CLIENT_TEST_ACCOUNT.md)**)
- **Staging project** — separate DB and env vars: **[STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md)**
- Check **Vercel → Logs** for runtime errors
- Configure **Stripe webhooks** to `https://your-domain/api/...` (see Stripe dashboard)

## 7. Custom domain

Vercel → Project → **Domains** → add domain → update DNS as instructed → set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS URL.
