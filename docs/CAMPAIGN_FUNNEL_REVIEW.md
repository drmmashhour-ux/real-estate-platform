# LECIPM campaign & funnel review

## Quick verify checklist

1. **Landing** — `/evaluate` — form + “FREE — no obligation” CTAs (Call / WhatsApp / Get consultation) above the form; broker phone via `getBrokerTelHref()` / WhatsApp via `getContactWhatsAppUrl()`.
2. **Attribution** — `/evaluate?source=facebook&campaign=test_campaign` — middleware sets first-touch cookie; `POST /api/evaluation` stores `Lead.source`, `campaign`, `medium` via `getLeadAttributionFromRequest`.
3. **CTA tracking** — `track()` sends `call_clicked` / `whatsapp_clicked` / `CTA_clicked`; after submit, `trackEvaluateCta` + `POST /api/public/lead-activity` sets timeline + **`highIntent`** for evaluation leads.
4. **CRM** — Leads list + pipeline; automation tasks + emails (fail-soft if Resend off).
5. **Stripe (BNHub)** — Requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (`whsec_…`). Booking confirms on `checkout.session.completed` only (see `app/api/stripe/webhook/route.ts`).

## Environment blockers (production)

| Symptom | Fix |
|---------|-----|
| Webhook 500 “Webhook not configured” | Set `STRIPE_WEBHOOK_SECRET` |
| Payment succeeds but booking stays PENDING | Stripe CLI / Dashboard must hit your deployed `/api/stripe/webhook`; secret must match |
| No estimate emails | `RESEND_API_KEY` + from domain |

## Automated “full flow”

There is no single Playwright suite in-repo for ad → booking; use the checklist above + Stripe test mode (complete Checkout on Stripe’s hosted page using cards from [Stripe Testing](https://stripe.com/docs/testing)) against a tunnel (e.g. ngrok) for webhooks.
