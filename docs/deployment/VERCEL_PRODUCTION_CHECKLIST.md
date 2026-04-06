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
| `DATABASE_URL` | **Pooled** Postgres URL (Supabase **transaction** pooler, often `:6543`) for Prisma at runtime. See **`docs/deployment/VERCEL_SUPABASE_DATABASE_URL.md`**. |
| `DIRECT_URL` | (Optional in Prisma schema) Use in CI for `prisma migrate deploy` if migrations require a direct (non-pooler) connection — export when running migrations: `DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy` or temporarily point `DATABASE_URL` to the direct host. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public; RLS still applies). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — bypasses RLS; never ship to the browser. |
| `STRIPE_SECRET_KEY` | Server-only Stripe secret. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`). |
| `STRIPE_PRICE_LECIPM_PRO` | Stripe Price id for LECIPM workspace subscription Checkout (`lecipm_workspace_subscription`). |
| `OPENAI_API_KEY` | Server-only — Copilot / AI. |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL for metadata and redirects. |

### Feature flags (optional)

| Variable | Purpose |
|----------|---------|
| `COPILOT_ENABLED` | Copilot routes (see app config). |
| `TRUSTGRAPH_ENABLED` | TrustGraph modules. |
| `DEAL_ANALYZER_ENABLED` | Deal Analyzer. |
| `COPILOT_USE_RESPONSES_API` | When `true`, optional OpenAI Responses API summarization layer (deterministic data still computed first). |

## Vercel Cron Jobs (Hobby vs Pro)

On **Vercel Hobby**, crons must run **at most once per day** per job. `apps/web/vercel.json` uses **daily** schedules for all entries so deploys succeed on Hobby. **Pro** allows hourly / sub-daily schedules; if you upgrade, you may restore stricter cadences (e.g. auto-close hourly, marketing publish every 15 minutes) in `vercel.json`.

## Build and deploy commands

Local / CI (production build):

```bash
cd apps/web
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
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

## Manual smoke tests after deploy

1. Health: open marketing `/` and a signed-in dashboard route.
2. `POST /api/stripe/checkout` with `paymentType: lecipm_workspace_subscription` returns a Stripe URL (test mode).
3. Complete test checkout — webhook logs show `workspaceSubscription` or `workspaceSubscriptionCheckout`.
4. Copilot `POST /api/copilot` returns JSON with `response.warnings` including the master disclaimer.
