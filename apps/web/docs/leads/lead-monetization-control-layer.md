# Lead monetization control layer

Operator/admin readout that **unifies** the revenue-engine **base price**, **lead quality** advisory, **demand**, **broker interest**, and **dynamic pricing** into one explanation bundle. It does **not** change Stripe, checkout, submission flows, or `computeLeadValueAndPrice` internals.

## What it does

- Shows a single **suggested price (advisory)** with a clear **price source mode**:
  - **`dynamic_advisory`** — primary when the dynamic pricing layer produced a suggestion (quality score feeds that layer when enabled).
  - **`quality_advisory`** — when dynamic pricing is off or unavailable but lead quality V1 ran.
  - **`base_only`** — when only the revenue engine anchor is available as the unified figure.
- Surfaces **base price** always as the reference from existing pricing rules.
- Emits **confidence** (`low` | `medium` | `high`) from signal richness — not a sales guarantee.
- Lists **missing / thin signals** when confidence is low (no fabricated certainty).

## What confidence means

- **Low**: Few layers or sparse engagement — prefer conservative positioning.
- **Medium**: Default when some signals exist but not enough for a strong read.
- **High**: Multiple aligned signals (e.g. quality + dynamic + richer demand/broker context) — still **advisory**, not a promise.

## What the system does **not** do

- Does not write prices to Stripe or override checkout amounts.
- Does not auto-apply suggested prices to buyers or brokers.
- Does not replace legal/commercial quoting — wording stays **advisory**.

## Why advisory wording matters

Unlock and monetization copy must not read as a firm quote or guaranteed ROI. The UI uses phrases like **“Suggested price (advisory)”** and **“Base price”** so operators align external messaging with platform-safe framing.

## Feature flag

`FEATURE_LEAD_MONETIZATION_CONTROL_V1` — when on, **admins** receive `leadMonetizationControlV1` on `GET /api/leads/[id]` and see **Lead monetization control** on the lead detail page.

## Monitoring

In-process counters and logs prefixed with `[lead:monetization-control]` (see `lead-monetization-control-monitoring.service.ts`).
