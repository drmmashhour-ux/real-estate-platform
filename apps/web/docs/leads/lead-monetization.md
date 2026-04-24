# Lead monetization V1 (CRM)

Additive, feature-flagged layer on top of existing CRM leads and Stripe `lead_unlock` checkout. It does **not** change Stripe payment-intent or webhook core logic; it adds masking, monitoring, and a canonical unlock API.

## Feature flag

| Variable | Default | Effect |
|----------|---------|--------|
| `FEATURE_LEAD_MONETIZATION_V1` | off (`0` / unset) | Legacy behavior: full fields where the app already exposed them. |
| `FEATURE_LEAD_MONETIZATION_V1=1` | on | List/detail APIs mask PII for locked leads; brokers see preview UI + unlock CTA. |

Set in `apps/web/.env` / deployment. Documented in `apps/web/.env.example`.

## Access levels

| Level | Meaning |
|-------|---------|
| `preview` | Lead exists; contact fields not purchased — name/message masked, email/phone shown as `[Locked]`. |
| `partial` | Reserved for future use (e.g. extra preview tier). |
| `full` | `contactUnlockedAt` set — full CRM contact fields. |

## Unlock flow

1. Broker opens dashboard or lead list; locked leads show `LeadPreviewCard` + price from `leadPricing.leadPrice` (deterministic pricing via `computeLeadValueAndPrice` + revenue bounds).
2. **Unlock lead** → `POST /api/lecipm/leads/unlock` with `{ "leadId": "..." }` (or legacy `POST /api/lecipm/leads/[id]/unlock-checkout`).
3. Server reuses `createCheckoutSession` with `paymentType: "lead_unlock"` and metadata including `leadId`, `monetizationType: "lead_unlock"`.
4. Stripe Checkout completes → existing webhook branch sets `contactUnlockedAt` and ledger/revenue events; `onLeadUnlockPaymentRecorded` increments monetization monitoring (additive).

## Stripe integration

- **Do not** duplicate charge logic; always go through existing checkout session creation and webhook fulfillment.
- Metadata on the session includes CRM identifiers for the webhook to apply unlock.

## Safety rules

- No mutation of inbound lead **content** for monetization; only **response shaping** and Stripe-driven unlock timestamp.
- Locked responses must not include raw email, phone, or unmasked name in JSON (see `maskLeadDisplayName`, `redactLeadMessagePreview`).
- Avoid logging PII in monetization paths; monitoring uses counters and lead ids only.

## Revenue dashboard

Confirmed `lead_unlock` platform payments already feed revenue aggregation. Checkout creation emits `trackRevenueEvent` / ledger paths as before; monetization monitoring is supplementary metrics (`[leads:monetization]` logs).

## Monitoring

Module: `lead-monetization-monitoring.service.ts` — `leadsViewed`, `unlockAttempts`, `leadsUnlocked`, derived `unlockConversionRate`.
