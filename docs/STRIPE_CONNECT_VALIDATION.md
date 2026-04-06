# Stripe Connect + BNHub validation (operational)

## PCI and payment flow (platform rule)

- **Card data must never pass through app servers** — no raw PAN/CVC/expiry in request bodies, env vars, or repo automation.
- **Guest payments use Stripe Checkout only** — guests enter cards on **checkout.stripe.com** (or Stripe’s hosted payment UI), not in our Next.js forms.
- **Manual Stripe-hosted entry** in **test mode** is allowed when a human completes Checkout locally; use test cards **only** as documented by Stripe: [Testing](https://stripe.com/docs/testing).
- **Unsafe automated PAN injection** (Playwright `.fill()` on card fields, PAN in `.env`, or server-side `payment_method_data`) is **not** allowed in app code or automated tests. For headless verification without a browser card step, run `pnpm run validate:bnhub-stripe` from `apps/web` (creates a Checkout Session and posts a signed `checkout.session.completed` — no PAN).

## Prerequisites

1. **Stripe Connect** is turned on for the platform account: [Stripe Dashboard → Connect](https://dashboard.stripe.com/connect).
2. **Keys** in `apps/web/.env`:
   - `STRIPE_SECRET_KEY` — `sk_test_…` (or live secret in production).
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — matching publishable key.
   - `STRIPE_WEBHOOK_SECRET` — `whsec_…` from the CLI or Dashboard webhook endpoint.
3. **Test host** (`host@demo.com` after seed, or your host user) has:
   - `stripeAccountId` set to a real Connect account ID.
   - Payout readiness per your implementation (e.g. charges and payouts enabled on the connected account).

### Prove the secret key matches a Connect-enabled Stripe account

From `apps/web` (loads **only** `apps/web/.env` with override for scripts):

```bash
pnpm run verify:stripe-connect
```

- **Required success:** JSON includes `"ok": true`.
- If you see **`STRIPE ACCOUNT MISMATCH — CONNECT NOT ENABLED FOR THIS KEY`**, Connect is not enabled for the Stripe account that issued your **`sk_test_…`** (Connect is **not** global and **not** auto-enabled — it is per account and per environment).

#### Enable Connect in Dashboard (test mode)

1. Confirm the Dashboard shows **Test mode** (orange banner).
2. Open **exactly:** [https://dashboard.stripe.com/test/connect](https://dashboard.stripe.com/test/connect)
3. Click **Get started** and complete Connect onboarding (e.g. **Platform / Marketplace**, **Canada**, basic business info — ~2 minutes).
4. If you use a **Sandbox** in the Dashboard, enable Connect **inside that same sandbox**; sandbox keys only work with Connect enabled there.
5. Re-run: `pnpm run verify:stripe-connect` until **`ok: true`**.

If verification **still** fails after that:

| Case | What to check |
|------|----------------|
| **A — Wrong account** | Top-left **account switcher** must be the **same** business as the API key in `apps/web/.env`. |
| **B — Wrong key** | `grep STRIPE_SECRET_KEY apps/web/.env` → must be `sk_test_…` from that account’s **Developers → API keys**. |
| **C — Sandbox vs test** | Keys from a **Sandbox** require Connect enabled in **that** sandbox, not only in default test mode. |

After **`ok: true`**, create the host connected account: `npx tsx scripts/fix-host-demo-stripe-connect.ts`, then continue with `stripe listen`, webhook secret, manual Checkout, and DB checks (see **Strict alignment runbook** below).

## Local webhook

```bash
stripe listen --forward-to http://127.0.0.1:3001/api/stripe/webhook
```

Copy the printed **signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` for the same process that runs Next.js (or export it before `pnpm dev`).

## One BNHub card test (test mode, manual)

1. Start the app: `pnpm dev` (from repo root).
2. Run `stripe listen` as above with the secret aligned to `.env`.
3. Sign in as seed guest, open the seed pending booking, start Checkout, and **on Stripe’s hosted page** enter a **Stripe test card** from [Stripe Testing docs](https://stripe.com/docs/testing) (any future expiry, any CVC).
4. Confirm:
   - Stripe CLI shows the event forwarded and the app responds **200**.
   - `launch_events` contains **`PAYMENT_SUCCESS`** (and usually **`CHECKOUT_SUCCESS`**).
   - Booking + payment rows move to confirmed/paid as implemented by your webhook.
5. Open **`/admin/monetization`** and **`/admin/launch`** (admin session) and confirm events appear in the feed.

## Automated checks (no PAN)

- From `apps/web`: `pnpm run validate:bnhub-stripe` — exercises Checkout Session creation and webhook handling without typing a card.
- Playwright **`pay CTA opens Stripe-hosted Checkout`** asserts redirect only; full end-to-end pay is **skipped** with an explicit PCI reason (see `e2e/helpers/stripe-hosted-checkout.ts`).

## When Connect is off

- Checkout returns **409** with a stable user message (no raw Stripe text) and `CHECKOUT_BLOCKED` is written to `launch_events` with an internal `code` (`HOST_PAYOUT_NOT_CONFIGURED`, `STRIPE_CONNECT_PLATFORM_UNAVAILABLE`, etc.).
- Playwright may skip Connect-dependent cases; a separate test asserts the blocked UI when the host has no Connect account.

## Env warnings

On server bootstrap, missing or mismatched Stripe env vars log **warnings** (see `lib/stripe/envWarnings.ts`). They do not crash the dev server.

---

## Strict alignment runbook (one Stripe environment)

**Facts:** API keys define the Stripe environment (test mode or a Dashboard **Sandbox**). Connect, `acct_*`, `price_*`, and webhook secrets are **not portable** across accounts or environments.

### Phase 1 — Environment

1. Put **`STRIPE_SECRET_KEY`** and **`STRIPE_WEBHOOK_SECRET`** only in **`apps/web/.env`** (real values from the Dashboard for the environment you use).
2. Remove overrides that can mask `apps/web/.env`:
   ```bash
   rm -f apps/web/.env.local .env.local
   ```
3. Prove Connect works for **this** key:
   ```bash
   cd apps/web && pnpm run verify:stripe-connect
   ```
   - **Success:** JSON with `"ok": true`.
   - **Failure:** `STRIPE ACCOUNT MISMATCH — CONNECT NOT ENABLED FOR THIS KEY` → enable Connect for that Stripe account (e.g. [Test mode Connect](https://dashboard.stripe.com/test/connect)) or fix the secret key.

### Phase 2 — Reset host Stripe columns (after key/environment change)

Stripe IDs are scoped to the account that issued them. Clear the demo host linkage before creating a new `acct_*`:

**Prisma / Postgres** (table is `"User"`; columns are snake_case in DB):

```sql
UPDATE "User"
SET stripe_account_id = NULL,
    stripe_onboarding_complete = false
WHERE email = 'host@demo.com';
```

(Or: `npx tsx` one-liner / Prisma Studio — same fields.)

### Phase 3 — Create Connect account for `host@demo.com`

```bash
cd apps/web && npx tsx scripts/fix-host-demo-stripe-connect.ts
```

Expect a new `acct_…` stored on the user, `retrieveOk: true`, and onboarding flags from Stripe (charges/payouts often **false** until Express onboarding finishes).

### Phase 4 — Webhook listener

```bash
stripe listen --forward-to http://localhost:3001/api/stripe/webhook
```

Copy the session **`whsec_…`** into **`apps/web/.env`** as **`STRIPE_WEBHOOK_SECRET`**, then restart **`pnpm dev`** if the secret changed.

### Phase 5 — Checkout implementation (enforced in code)

- **`apps/web/app/api/stripe/checkout/route.ts`** calls **`createCheckoutSession`** → **`stripe.checkout.sessions.create`** in **`apps/web/lib/stripe/checkout.ts`** with `mode: 'payment'`, `line_items`, `success_url`, `cancel_url`, and Connect fields via **`payment_intent_data`** when applicable.
- **No** `payment_method_data` / raw card collection on the server (see PCI section above).

### Phase 6 — Manual hosted payment

In the browser: create a BNHub booking → Pay → complete card entry **only on Stripe’s hosted Checkout**. Use any **success** test card from [Stripe Testing](https://stripe.com/docs/testing) (future expiry, any 3-digit CVC).

### Phase 7 — CLI signals

With `stripe listen` running you should see events such as **`checkout.session.completed`** and **`payment_intent.succeeded`** forwarded to the app.

### Phase 8 — Webhook handler

**`apps/web/app/api/stripe/webhook/route.ts`** handles **`checkout.session.completed`**: for BNHub **`paymentType: booking`**, it updates booking/payment and calls **`persistLaunchEvent('PAYMENT_SUCCESS', …)`** when metadata and DB updates succeed.

### Phase 9 — Database checks

`launch_events` is mapped from Prisma model **`LaunchEvent`**: the column name is **`event`** (not `type`), and **`created_at`** for ordering.

```sql
SELECT id, event, created_at
FROM launch_events
WHERE event = 'PAYMENT_SUCCESS'
ORDER BY created_at DESC
LIMIT 5;
```

Booking **`status`** → **`CONFIRMED`**. Payment row uses Prisma **`PaymentStatus`** — typically **`COMPLETED`** (not a literal `PAID` enum value).

### Phase 10 — Admin

Signed in as admin: **`/admin/launch`**, **`/admin/monetization`** — should load and show recent funnel / payment activity after a successful run.

### Success matrix (manual verification)

| Component        | Check                                      |
|----------------|---------------------------------------------|
| Stripe key     | Same account as Connect + webhooks          |
| Connect        | `verify:stripe-connect` → `ok: true`        |
| `acct_`        | Created + retrievable with platform key     |
| Checkout       | Hosted Checkout opens; payment succeeds     |
| Webhook        | CLI shows events; app returns 200           |
| `PAYMENT_SUCCESS` | Row in `launch_events`                    |
| Admin          | Launch + monetization show activity         |
