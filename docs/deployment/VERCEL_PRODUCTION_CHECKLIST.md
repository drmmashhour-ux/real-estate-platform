# Vercel + Supabase + Prisma — LECIPM production checklist

Use this when deploying the Next.js app (`apps/web`) to Vercel with Supabase Postgres, Prisma, Stripe, and OpenAI.

## Architecture

- **Next.js** on Vercel (App Router).
- **Supabase**: Postgres (pooled for runtime), Auth, Storage as needed.
- **Prisma**: server-side only — never expose `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` to the client.
- **Stripe**: Checkout + webhooks — subscription state is mirrored in `stripe_subscriptions` after verified webhooks.
- **OpenAI**: Copilot and AI features — call only from server routes / server actions.

## Environment variables

Set in the Vercel project (or team) settings. Values are encrypted at rest; **redeploy** after changes.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | **Pooled** Postgres URL for Prisma at runtime. With **Neon**, use the pooled host (often contains `-pooler`) and append **`?sslmode=require`** (or stricter). Step-by-step: **`docs/deployment/DATABASE_URL_VERCEL_NEON.md`**. With **Supabase**, see **`docs/deployment/VERCEL_SUPABASE_DATABASE_URL.md`**. With **Vercel Postgres**, Vercel sets **`POSTGRES_PRISMA_URL`** / **`POSTGRES_URL`**; the app copies those into **`DATABASE_URL`** when it is missing or still uses the **`@HOST`** template (`apps/web/lib/db/resolve-database-url.ts`). |
| `DIRECT_URL` | (Optional in Prisma schema) Use in CI for `prisma migrate deploy` if migrations require a direct (non-pooler) connection — export when running migrations: `DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy` or temporarily point `DATABASE_URL` to the direct host. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public; RLS still applies). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — bypasses RLS; never ship to the browser. |
| `STRIPE_SECRET_KEY` | Server-only Stripe secret. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`). |
| `STRIPE_PRICE_LECIPM_PRO` | Stripe Price id for LECIPM workspace subscription Checkout (`lecipm_workspace_subscription`). |
| `OPENAI_API_KEY` | Server-only — Copilot / AI. |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL for metadata and redirects. |
| `REDIS_URL` | (Recommended prod) Shared **rate limits** + optional IP cooldown across Vercel isolates (`ioredis` / Upstash Redis URL). |
| `SENTRY_DSN` | Server/Edge error reporting (`@sentry/nextjs` — see `sentry.server.config.ts` / `sentry.edge.config.ts`). |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser error reporting (`instrumentation-client.ts`). Can match project DSN; keep scoped in Sentry if you split client/server projects. |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional trace sample rate (default `0.1`). |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Optional override for client traces. |
| `CLAMAV_HOST` / `MALWARE_SCAN_WEBHOOK_URL` | Pre-storage malware scan — see **`docs/security/MALWARE-SCANNING.md`**. |
| `MALWARE_SCAN_REQUIRED` | Set to `1` only after a scanner is configured; otherwise uploads return 503. |
| `REQUIRE_DATABASE_SSL_IN_URL` | Set to `1` in production to **fail boot** if a non-local `DATABASE_URL` omits explicit TLS params. |

### Feature flags (optional)

| Variable | Purpose |
|----------|---------|
| `COPILOT_ENABLED` | Copilot routes (see app config). |
| `TRUSTGRAPH_ENABLED` | TrustGraph modules. |
| `DEAL_ANALYZER_ENABLED` | Deal Analyzer. |
| `COPILOT_USE_RESPONSES_API` | When `true`, optional OpenAI Responses API summarization layer (deterministic data still computed first). |

## `pnpm install` exits 1 on Vercel (Husky)

The root **`prepare`** script runs **`husky`**. Vercel sets **`CI=1`** (not `CI=true`). **`scripts/prepare-husky.cjs`** skips Husky when `CI` or `VERCEL` is truthy (`1`, `true`, `yes`) so installs do not fail.

## Vercel Cron Jobs (Hobby vs Pro)

On **Vercel Hobby**, crons must run **at most once per day** per job. `apps/web/vercel.json` uses **daily** schedules for all entries so deploys succeed on Hobby. **Pro** allows hourly / sub-daily schedules; if you upgrade, you may restore stricter cadences (e.g. auto-close hourly, marketing publish every 15 minutes) in `vercel.json`.

## Build and deploy commands

**CLI link, env pull, and deploy** (single source of truth): **`docs/deployment/VERCEL_CLI_LINK_AND_DEPLOY.md`**.

Local / CI (align with `apps/web/vercel.json`: install and `build:web` run from **repo root** on Vercel):

```bash
# Repository root
pnpm install --frozen-lockfile
pnpm build:web
```

Prisma (from **`apps/web`**):

```bash
cd apps/web
pnpm run prisma:generate
pnpm run prisma:migrate:deploy
```

- Use **`migrate deploy`** in CI/CD — not `migrate dev`.
- If pooled `DATABASE_URL` cannot run migrations, run `migrate deploy` with a **direct** Postgres URL for that step only.

## Stripe webhooks

Configure Stripe Dashboard → Webhooks → endpoint `https://<your-domain>/api/stripe/webhook` with events including:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Workspace subscription Checkout uses metadata `paymentType: lecipm_workspace_subscription` and `lecipmWorkspace: true` on the subscription.

## Security reminders

- Never call Stripe or OpenAI from the browser with secret keys.
- Keep TrustGraph internal tables and billing-control paths **server-only**.
- Use sanitized DTOs for any AI output shown to users.
- Confirm **`DATABASE_URL`** in the Vercel dashboard (Production + Preview if applicable): paste the same string you use locally against Neon/Supabase; run **`pnpm prisma migrate deploy`** from CI or a protected job when schema changes.
- Full hardening list: **`docs/security/PROD-SECURITY-CHECKLIST.md`** (sessions, rate limits, webhooks, uploads, headers).

## Verify database connectivity (production)

1. After deploy, call **`GET /api/ready`** — should return **200** when DB and critical deps are healthy.
2. In Neon (or your host): ensure the branch/database accepts connections from **Vercel** (no accidental IP lockout if you use allowlists).
3. Optional: enable **`REQUIRE_DATABASE_SSL_IN_URL=1`** once you confirm the URL includes **`sslmode=require`** (or equivalent).

## Manual smoke tests after deploy

1. Health: open marketing `/` and a signed-in dashboard route.
2. `POST /api/stripe/checkout` with `paymentType: lecipm_workspace_subscription` returns a Stripe URL (test mode).
3. Complete test checkout — webhook logs show `workspaceSubscription` or `workspaceSubscriptionCheckout`.
4. Copilot `POST /api/copilot` returns JSON with `response.warnings` including the master disclaimer.
