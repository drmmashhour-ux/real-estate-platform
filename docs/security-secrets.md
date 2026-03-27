# Secrets handling

## Rules

1. **Never commit** real `.env`, `.env.local`, keys, or tokens. Husky + `docs/git-rules.md` cover commit guards.
2. **`NEXT_PUBLIC_*`** is visible in the browser and mobile bundles. Only **anon-safe** values (e.g. Supabase URL + anon key, publishable Stripe key).
3. **`SUPABASE_SERVICE_ROLE_KEY`**, **`STRIPE_SECRET_KEY`**, **`STRIPE_WEBHOOK_SECRET`**, **`BNHUB_GROWTH_CRON_SECRET`**, DB URLs — **server / CI / Vercel only**.
4. **CI**: GitHub **Secrets** and **Variables**; never echo secret values in workflow logs.
5. **Vercel**: Production vs Preview env separation; rotate on incident (see `docs/incident-response.md`).

## Where secrets are consumed (scan hints)

| Secret | Typical consumers |
|--------|-------------------|
| `STRIPE_SECRET_KEY` / webhooks | `apps/web/lib/stripe.ts`, `app/api/stripe/**` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server uploads, mobile token verify (`lib/mobile/mobileAuth.ts`, FSBO upload helpers) |
| `BNHUB_GROWTH_CRON_SECRET` | `lib/server/bnhub-growth-internal-auth.ts`, Supabase function env |
| `DATABASE_URL` | Prisma (`apps/web`) |

## Rotation

- **Stripe**: Dashboard → roll keys; update Vercel/GitHub; redeploy.
- **Supabase**: Rotate service role + review Edge function secrets.
- **Automation secret**: Set new `BNHUB_GROWTH_CRON_SECRET`; update Supabase secrets and any cron callers together.
