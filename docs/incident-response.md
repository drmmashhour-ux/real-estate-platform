# Incident response (short playbook)

## Suspected secret leak

1. **Rotate** the exposed credential immediately (Stripe, Supabase, DB, automation secret).
2. **Revoke** old keys in the provider console.
3. Update **Vercel / GitHub / Supabase** env to new values; redeploy.
4. Review **access logs** (Vercel, Supabase, Stripe) for misuse window.
5. If repo leak: `git history` cleanup only after rotation (history rewrite is disruptive; rotation is primary).

## Webhook abuse or signature failures spike

1. Confirm **`STRIPE_WEBHOOK_SECRET`** matches the endpoint in Stripe Dashboard.
2. Check for **replay** or duplicate events — idempotency keys / inbox tables (`stripeWebhookInbox` pattern).
3. Temporarily **disable** non-critical webhook side effects if flooding; keep signature verification **on**.

## Suspicious payments

1. Stripe Dashboard → Payments / Radar.
2. Correlate **`paymentIntentId`** / **`sessionId`** with Prisma `Payment` / BNHub tables.
3. **Do not** refund from logs alone — verify in Stripe UI and DB state.
4. Preserve **audit** rows and webhook records for dispute.

## Data leak suspicion

1. Identify **which API** or **view** exposed data (route + time range).
2. Check **Prisma `select`** clauses — remove unnecessary fields from public responses.
3. For Supabase: review **RLS** and **API policies**.
4. Notify stakeholders per legal/policy.

## Order of systems to check

1. Vercel (routes, env, recent deploys)  
2. Stripe / Supabase dashboards  
3. Application logs (redacted)  
4. Database read replicas / audit tables  
