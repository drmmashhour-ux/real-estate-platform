# BNHub production launch checklist

Use this before pointing production traffic at the app.

## 1. Git asset

- [ ] `apps/web-app/public/logo.png` is **committed** (generated from `logo.svg` if missing):
  ```bash
  cd apps/web-app && node -e "require('sharp')(require('fs').readFileSync('public/logo.svg')).png().resize(160,160).toFile('public/logo.png').then(()=>console.log('ok'))"
  git add public/logo.png && git commit -m "chore: add BNHub marketing logo PNG"
  ```

## 2. Required environment variables

Confirm in your host (Vercel, Fly, etc.):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (SSL in prod) |
| `STRIPE_SECRET_KEY` | Live secret (`sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live publishable (`pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) for `/api/stripe/webhook` |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (no trailing slash), e.g. `https://your-domain.com` |

**BNHub commission (default 15%):**

| Variable | Purpose |
|----------|---------|
| `BNHUB_COMMISSION_RATE` | e.g. `0.15` |

**Transactional email** (at least one working path):

| Variable | Purpose |
|----------|---------|
| `EMAIL_PROVIDER` | Optional: `sendgrid` |
| `SENDGRID_API_KEY` | If using SendGrid |
| `RESEND_API_KEY` | If using Resend (see `lib/email/provider.ts`) |
| `EMAIL_FROM` | From address (domain verified with provider) |
| `EMAIL_REPLY_TO` | Optional |

**Public marketing (optional but recommended):**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown in footer / home |
| `NEXT_PUBLIC_CONTACT_PHONE` | E.164 or display form; required for phone to show in **client** footer |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL` | Full profile URL |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL` | Full profile URL |
| `NEXT_PUBLIC_SOCIAL_X_URL` | Full profile URL |

See also `apps/web-app/.env.production.example`.

## 3. Stripe dashboard

- [ ] Webhook endpoint URL: `{NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
- [ ] Events include Checkout / PaymentIntent completion (matching your integration)
- [ ] Live mode keys match deployed env

## 4. Staging smoke test (manual)

Run once on **staging** with **test** mode keys or a dedicated Stripe account:

1. Open a BNHub listing → start booking → complete Checkout.
2. Stripe Dashboard → Webhooks → confirm **200** on delivery.
3. App: booking status **CONFIRMED** (or COMPLETED per your flow), payment **COMPLETED**.
4. Guest: booking page shows confirmation code; **Download invoice (PDF)** works (auth as guest).
5. Stripe: charge shows **application fee** ~15% of gross (per `BNHUB_COMMISSION_RATE`); Connect transfer to host.
6. Admin → Finance: aggregates and recent BNHub rows include the booking / fees.

## 5. Production build verification

```bash
cd apps/web-app && npm run build && npx vitest run
```

Logo: `Logo` uses `/logo.png` (fallback to SVG). PDF uses `public/logo.png` on the server filesystem — file must exist after deploy.

## 6. Launch readiness sign-off

Fill in at release time:

- Logo asset committed: **YES / NO**
- Env configured: **YES / NO**
- Staging smoke test: **YES / NO**
- Commission verified (15% or configured rate): **YES / NO**
- Invoice PDF verified: **YES / NO**

**Verdict:** LAUNCH READY / NOT READY
