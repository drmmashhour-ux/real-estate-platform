# BNHub / web-app — production deployment checklist

## 1. Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection |
| `STRIPE_SECRET_KEY` | Stripe API (use **live** keys in production) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout.js / client |
| `STRIPE_WEBHOOK_SECRET` | Verify `/api/stripe/webhook` |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin (must match Vercel domain); used for Stripe return URLs & emails |
| `RESEND_API_KEY` | Outbound email (or configure SendGrid — see `lib/email/provider.ts`) |
| `EMAIL_FROM` | From header, e.g. `BNHub <no-reply@yourdomain.com>` |
| `EMAIL_PROVIDER` | Optional: `resend` or `sendgrid` |
| `SENDGRID_API_KEY` | If using SendGrid |
| `EMAIL_REPLY_TO` | Optional support reply-to |
| `BNHUB_COMMISSION_RATE` | Optional decimal e.g. `0.15` (default **15%**). Legacy: `BNHUB_PLATFORM_COMMISSION_RATE` |
| Session / auth secrets | Any cookie or JWT secrets your auth stack expects |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | If used in client auth flows |

## 2. Stripe Dashboard (production)

1. Create **live** Restricted or standard key; enable **Connect**.
2. Webhook endpoint: `https://<your-domain>/api/stripe/webhook`
3. Subscribe at minimum to:
   - `checkout.session.completed`
   - `payment_intent.payment_failed` (monitoring)
   - `charge.refunded` (if you process refunds via Stripe)
4. Copy signing secret into `STRIPE_WEBHOOK_SECRET`.

**Test vs live:** use separate Vercel envs or preview deployments with Stripe **test** keys; never mix test webhook secret with live key.

## 3. Vercel

- Root: `apps/web` (if monorepo — set accordingly).
- `next.config.ts` includes `serverExternalPackages` for `@react-pdf/renderer`.
- Set all env vars in Project Settings → Environment Variables (Production + Preview as needed).

## 4. Domain & HTTPS

- Attach custom domain in Vercel; force HTTPS.
- Set `NEXT_PUBLIC_APP_URL=https://your-domain.com` (no trailing slash).

## 5. Database

- Run migrations: `npx prisma migrate deploy` (from `apps/web` with `DATABASE_URL` set).

## 6. Post-deploy smoke tests

- [ ] Homepage loads
- [ ] Search / listing browse loads
- [ ] BNHub listing detail loads
- [ ] Create booking → host has Connect complete → checkout opens
- [ ] Stripe test/live card completes → webhook runs → booking `CONFIRMED`, payment `COMPLETED`, invoice snapshot exists
- [ ] Guest receives confirmation + receipt emails (if Resend/SendGrid configured)
- [ ] Host payouts page `/dashboard/host/payouts` shows earnings
- [ ] Admin finance shows BNHub Connect aggregates
- [ ] `POST /api/admin/email/test` (ADMIN only) returns `{ ok: true }` when mail is configured
- [ ] Auth + public forms return `429` after burst (rate limits)

## 7. Security notes

- `/api/auth/demo-session` is blocked when `NODE_ENV=production`.
- Admin routes: `app/admin/layout.tsx` sets `robots: noindex`.
- Global security headers are set in `next.config.ts`.

## 8. Remaining operational blockers (typical)

- In-memory rate limits reset per server instance; at scale use Redis (see `lib/rate-limit.ts`).
- Email deliverability: verify domain in Resend/SendGrid (SPF/DKIM).
