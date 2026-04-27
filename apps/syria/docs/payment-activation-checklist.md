# Live payment activation (SYBNB) — no-risk checklist

You **do not** “turn on payments” in one step. You **progressively unlock** them. This app’s **defaults are safe** (`SYBNB` payment flags off, production **lock** on, stub `payment-intent`).

> **This codebase:**  
> - Production lock: `SYBNB_PRODUCTION_LOCK_MODE` — default **locked** when unset or any value **except** `"false"`.  
> - `sybnbConfig.paymentsEnabled` = `SYBNB_PAYMENTS_ENABLED === "true"` **and** `!PRODUCTION_LOCK_MODE`. So if lock is on, **no live card path** is enabled even if `SYBNB_PAYMENTS_ENABLED=true`. For **Phase 1 (sandbox)**, use a **staging** project with `SYBNB_PRODUCTION_LOCK_MODE=false` and **test** API keys.  
> - Kill switches: `SYBNB_PAYMENTS_KILL_SWITCH` / `SYBNB_PAYOUTS_KILL_SWITCH` — when `"true"`, **instantly** block card payment gates and admin payout actions (see `src/config/sybnb.config.ts`).

**Automated Phase 0 signal:** `pnpm payments:phase0` (static checks) + `pnpm env:check` (DB + demo isolation).

**Legal / PSP compliance:** not covered here — satisfy local regulations and Stripe/PSP terms before live keys.

---

## Phase 0 — Preconditions (do not skip)

Confirm **all** of the following. If any fail → **stop**.

| Check | In this repo |
|--------|----------------|
| **Production lock** default safe | `SYBNB_PRODUCTION_LOCK_MODE !== "false"` (see `src/config/sybnb.config.ts`) |
| **SYBNB payments** off for prod rollout | `SYBNB_PAYMENTS_ENABLED` not `true` until you intend sandbox; with lock on, effective UI remains blocked |
| **Payment endpoint** stub / gated | `src/app/api/sybnb/payment-intent/route.ts` — stub id + `assertSybnbPaymentCompleteAsync` |
| **Webhooks** require verification | `src/app/api/sybnb/webhook/route.ts` — `stripe-signature` in prod + `x-sybnb-webhook-secret` + optional body HMAC |
| **DB env guard** | `@repo/db` `assertEnvSafety` at startup; `pnpm env:check` |
| **Staging isolated** | separate `STAGING_DATABASE_URL` ≠ `PRODUCTION_DATABASE_URL` (guard enforces when both set) |
| **No demo on production DB** | `INVESTOR_DEMO_MODE` + DSN rules in `assertEnvSafety` |

---

## Phase 1 — Sandbox (test mode) on staging

Use **test** API keys, **test** webhook secret, no live payouts, no real bank connect.

**Typical staging `.env` (example only):**

```bash
SYBNB_PAYMENT_PROVIDER=stripe
SYBNB_PAYMENTS_ENABLED=true
SYBNB_PRODUCTION_LOCK_MODE=false
# test keys + test webhook
INVESTOR_DEMO_MODE=false
```

**Important:** With lock **off** and payments **on**, the **policy layer** and **preconditions** still run (listing approved, host verified where configured, risk review, etc.). The `payment-intent` route is still a **stub** until you wire a real `PaymentIntent` — do that only with legal/PSP sign-off.

---

## Phase 2 — Staging validation (full flow)

**Booking:** create listing (APPROVED) → create booking → host confirms.

**Payment:** `POST /api/sybnb/payment-intent` — expect stub or gated 403 for blocked cases.

**Webhook:** `POST /api/sybnb/webhook` (or `webhooks/stripe` alias) — valid signature, shared secret, no duplicate processing of state (verify idempotency in your future Stripe layer).

**Failure cases:** unverified host, unapproved listing, high fraud → blocked by `payment-policy` + `sybnb-payment-risk`.

---

## Phase 3 — Financial safety (before any real money)

- Payout **cooldown** / destination **lock** (product + ops) — not fully automated in this file; use admin + audit (`sybnb-financial-audit`, `logSecurityEvent`).
- Escrow / delayed release: align with your schema and ops (`SYBNB_ESCROW_*` hints in `.env.example`).
- Audit: payment intent requests, webhooks, admin payout events — extend logging as you add real PSP calls.

---

## Phase 4 — Gradual production unlock

1. **Sandbox still:** internal testers only, **test** keys on staging.  
2. **Limited beta:** 1–5 hosts / guests; monitor success rate, fraud, errors.  
3. **Live keys:** move to live **Stripe** keys and live webhook secret; re-enable **only** after lock strategy is documented.

To allow **any** real card surface in a given deploy: `SYBNB_PRODUCTION_LOCK_MODE=false` **and** `SYBNB_PAYMENTS_ENABLED=true` **and** implement real `PaymentIntent` (still behind policy + kill switch).

---

## Phase 5 — Live protection (always on)

- Fraud scoring: `src/lib/sybnb/sybnb-payment-risk.ts`  
- Payment preconditions: `assertSybnbStripeBasePreconditions` / `assertSybnbPaymentCompleteAsync`  
- Idempotency: pass `idempotencyKey` from client; enforce in your Stripe integration.  
- Audit: `appendSyriaSybnbCoreAudit`, `logSecurityEvent`  
- Admin: existing admin tools + kill switches

---

## Kill switches (emergency)

Set either (or both) to `true` for an **instant** block:

- `SYBNB_PAYMENTS_KILL_SWITCH=true` — **all** in-app card payment preconditions return `payments_kill_switch` (see `payment-policy.ts`); “Pay with card” UI off when this is on.  
- `SYBNB_PAYOUTS_KILL_SWITCH=true` — `approvePayout` / `markPayoutPaid` in `actions/admin.ts` return without mutating.

Unset or not `true` for normal operation.

---

## Final manual checklist before “live”

- [ ] `POST /api/sybnb/payment-intent` behavior matches your PSP integration (or remains stub if not live).  
- [ ] Duplicate client requests do not double-charge (idempotency at PSP + server).  
- [ ] Webhooks cannot be faked (signature + secret; no `SYBNB_WEBHOOK_ALLOW_UNAUTHENTICATED` in production).  
- [ ] Payouts cannot be hijacked (admin auth + optional kill switch + audit).  
- [ ] Logs for every money-adjacent action; **no** raw `DATABASE_URL` or secrets in logs.  

---

## Risk levels

| Stage | Risk |
|--------|------|
| Stub / lock + payments off | Low |
| Sandbox (test mode, staging) | Low |
| Limited beta (live-ish, few users) | Medium |
| Full live (live keys) | **High** — legal + PSP + monitoring required |

---

**Bottom line:** you are in **Phase 0** if defaults hold and `pnpm payments:phase0` + `pnpm env:check` pass. **Phase 1** = staging + **test** Stripe + lock off on that project only, still no live money until Phase 3–4.
